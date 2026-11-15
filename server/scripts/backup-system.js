const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { gzipSync } = require("node:zlib");
const { BSON, MongoClient } = require("mongodb");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { env } = require("../src/config/env");
const { imageStorage } = require("../src/storage/image-storage");
const { resolveBackupRoot, sha256File, walkFiles, emitAlert } = require("./lib/backup-shared");

const COLLECTION_NAMES = ["admin_accounts", "admin_sessions", "room_listings", "audit_events"];
const MAX_DAILY_BACKUPS = 7;
const MAX_WEEKLY_BACKUPS = 4;

function parseArgs(argv) {
  const options = {
    type: "daily",
    simulateFailure: false,
    json: false,
    backupRoot: undefined,
    dbName: undefined,
  };
  for (const arg of argv) {
    if (arg.startsWith("--type=")) {
      const value = arg.slice("--type=".length);
      if (value === "daily" || value === "weekly") options.type = value;
      else throw new Error("Backup type must be daily or weekly.");
    } else if (arg === "--simulate-failure") {
      options.simulateFailure = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg.startsWith("--backup-root=")) {
      options.backupRoot = arg.slice("--backup-root=".length);
    } else if (arg.startsWith("--db=")) {
      options.dbName = arg.slice("--db=".length);
    }
  }
  return options;
}

function timestampSlug(date) {
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}-${pad(date.getUTCMilliseconds(), 3)}`;
}

async function rotateBackups(backupRoot, backupType) {
  const keepCount = backupType === "weekly" ? MAX_WEEKLY_BACKUPS : MAX_DAILY_BACKUPS;
  const entries = await fs.readdir(backupRoot, { withFileTypes: true }).catch(() => []);
  const matching = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.endsWith(`-${backupType}`)) continue;
    const manifestPath = path.join(backupRoot, entry.name, "manifest.json");
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      if (manifest.status === "SUCCESS" && manifest.backupType === backupType) {
        matching.push({
          dirName: entry.name,
          fullPath: path.join(backupRoot, entry.name),
          createdAtUtc: new Date(manifest.createdAtUtc).getTime(),
        });
      }
    } catch {
      /* ignore incomplete/unreadable folders */
    }
  }

  matching.sort((a, b) => b.createdAtUtc - a.createdAtUtc);
  const removed = [];
  for (const stale of matching.slice(keepCount)) {
    await fs.rm(stale.fullPath, { recursive: true, force: true });
    removed.push(stale.dirName);
  }
  return removed;
}

async function runBackup(rawOptions = {}) {
  const startedAt = Date.now();
  const options = {
    type: rawOptions.type || "daily",
    simulateFailure: Boolean(rawOptions.simulateFailure),
    backupRoot: rawOptions.backupRoot,
    dbName: rawOptions.dbName || env.MONGODB_DB_NAME,
    uploadRoot: rawOptions.uploadRoot,
  };

  const backupRoot = resolveBackupRoot(options.backupRoot);
  await fs.mkdir(backupRoot, { recursive: true });

  const now = new Date();
  const nonce = randomBytes(2).toString("hex");
  const backupId = `backup-${timestampSlug(now)}-${nonce}-${options.type}`;
  const backupDir = path.join(backupRoot, backupId);
  const dbDir = path.join(backupDir, "db");
  const uploadsDir = path.join(backupDir, "uploads");
  await fs.mkdir(dbDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: env.MONGODB_URI.startsWith("mongodb+srv://") ? 8000 : 3000,
  });

  const counts = {};
  let imageFileCount = 0;
  let totalBytes = 0;

  try {
    await client.connect();
    const db = client.db(options.dbName);

    if (options.simulateFailure) {
      throw new Error("SIMULATED_BACKUP_FAILURE: Backup job interrupted during execution.");
    }

    const indexMeta = {};
    for (const colName of COLLECTION_NAMES) {
      const col = db.collection(colName);
      const docs = await col.find({}).toArray();
      counts[colName] = docs.length;
      const ejsonText = BSON.EJSON.stringify(docs, { relaxed: false });
      const gzBuffer = gzipSync(Buffer.from(ejsonText, "utf8"));
      await fs.writeFile(path.join(dbDir, `${colName}.ejson.gz`), gzBuffer);
      indexMeta[colName] = await col.indexes().catch(() => []);
    }
    await fs.writeFile(path.join(dbDir, "indexes.json"), JSON.stringify(indexMeta, null, 2), "utf8");

    // Sao lưu ảnh gắn với mọi tin phòng (bao gồm tin xóa mềm để giữ khả năng khôi phục 90 ngày)
    const listings = await db.collection("room_listings").find({}, { projection: { _id: 1, images: 1 } }).toArray();
    for (const listing of listings) {
      for (const img of listing.images || []) {
        let buffer;
        if (img.provider === "cloudinary" || img.externalUrl) {
          buffer = await imageStorage.readBuffer({
            listingId: listing._id,
            storageKey: img.storageKey,
            provider: img.provider,
            externalUrl: img.externalUrl,
          });
        } else {
          const sourceBase = options.uploadRoot || imageStorage.localRoot;
          const srcPath = path.resolve(sourceBase, String(listing._id), path.basename(String(img.storageKey)));
          buffer = await fs.readFile(srcPath);
        }
        const destPath = path.join(uploadsDir, String(listing._id), path.basename(String(img.storageKey)));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, buffer);
        imageFileCount += 1;
      }
    }

    const allRelFiles = await walkFiles(backupDir);
    const checksums = {};
    for (const rel of allRelFiles) {
      if (rel === "manifest.json") continue;
      const absPath = path.join(backupDir, rel);
      const stat = await fs.stat(absPath);
      totalBytes += stat.size;
      checksums[rel] = await sha256File(absPath);
    }

    const manifest = {
      schemaVersion: "1.0",
      backupId,
      backupType: options.type,
      status: "SUCCESS",
      createdAtUtc: now.toISOString(),
      sourceDbName: options.dbName,
      counts,
      imageFileCount,
      totalBytes,
      durationMs: Date.now() - startedAt,
      checksums,
    };

    await fs.writeFile(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    const rotated = await rotateBackups(backupRoot, options.type);

    return { ok: true, backupDir, manifest, rotated };
  } catch (error) {
    const failedManifest = {
      schemaVersion: "1.0",
      backupId,
      backupType: options.type,
      status: "FAILED",
      createdAtUtc: now.toISOString(),
      sourceDbName: options.dbName,
      durationMs: Date.now() - startedAt,
      errorName: error.name,
      errorMessage: error.message,
    };
    await fs.writeFile(path.join(backupDir, "manifest.json"), JSON.stringify(failedManifest, null, 2), "utf8").catch(() => {});
    const alertPayload = await emitAlert({
      event: "backup_job_failed",
      severity: "CRITICAL",
      message: `Sao lưu hệ thống thất bại (${options.type}) trên DB ${options.dbName}.`,
      metadata: {
        backupId,
        backupType: options.type,
        errorName: error.name,
      },
    });
    return { ok: false, backupDir, manifest: failedManifest, alertPayload, error };
  } finally {
    await client.close().catch(() => {});
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  runBackup(options).then((result) => {
    if (options.json) {
      console.log(JSON.stringify({
        ok: result.ok,
        backupId: result.manifest.backupId,
        status: result.manifest.status,
        counts: result.manifest.counts || {},
        imageFileCount: result.manifest.imageFileCount || 0,
        durationMs: result.manifest.durationMs,
        rotated: result.rotated || [],
      }));
    } else if (result.ok) {
      console.log(`Backup SUCCESS: ${result.manifest.backupId} (${result.manifest.imageFileCount} images, ${result.manifest.durationMs}ms)`);
    } else {
      console.error(`Backup FAILED: ${result.manifest.backupId} — ${result.manifest.errorMessage}`);
    }
    if (!result.ok) process.exitCode = 1;
  }).catch((error) => {
    console.error("Backup fatal error:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { runBackup, COLLECTION_NAMES, MAX_DAILY_BACKUPS, MAX_WEEKLY_BACKUPS };
