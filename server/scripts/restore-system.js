const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { gunzipSync } = require("node:zlib");
const { BSON, MongoClient } = require("mongodb");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { env } = require("../src/config/env");
const { resolveBackupRoot, sha256File, serverRoot } = require("./lib/backup-shared");
const { COLLECTION_NAMES } = require("./backup-system");

function parseArgs(argv) {
  const options = {
    backupId: undefined,
    backupRoot: undefined,
    targetDbName: process.env.RESTORE_TARGET_DB || "room_rental_restore_test",
    targetUploadDir: process.env.RESTORE_TARGET_UPLOAD_DIR || "uploads-restore-test",
    forceProductionRestore: false,
    json: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--backup=")) options.backupId = arg.slice("--backup=".length);
    else if (arg.startsWith("--backup-root=")) options.backupRoot = arg.slice("--backup-root=".length);
    else if (arg.startsWith("--target-db=")) options.targetDbName = arg.slice("--target-db=".length);
    else if (arg.startsWith("--target-uploads=")) options.targetUploadDir = arg.slice("--target-uploads=".length);
    else if (arg === "--force-production-restore") options.forceProductionRestore = true;
    else if (arg === "--json") options.json = true;
  }
  return options;
}

async function findLatestSuccessfulBackup(backupRoot) {
  const entries = await fs.readdir(backupRoot, { withFileTypes: true }).catch(() => []);
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(backupRoot, entry.name, "manifest.json"), "utf8"));
      if (manifest.status === "SUCCESS") {
        candidates.push({ id: entry.name, createdAtMs: new Date(manifest.createdAtUtc).getTime(), manifest });
      }
    } catch {
      /* ignore invalid manifests */
    }
  }
  candidates.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return candidates[0] || null;
}

async function ensureRestoredIndexes(db) {
  const adminAccounts = db.collection("admin_accounts");
  const adminSessions = db.collection("admin_sessions");
  const roomListings = db.collection("room_listings");
  const auditEvents = db.collection("audit_events");
  await Promise.all([
    adminAccounts.createIndex({ identifier: 1 }, { unique: true, name: "uniq_admin_identifier" }),
    adminAccounts.createIndex({ singletonKey: 1 }, { unique: true, name: "uniq_primary_admin" }),
    adminSessions.createIndex({ tokenHash: 1 }, { unique: true, name: "uniq_session_token_hash" }),
    adminSessions.createIndex({ adminId: 1, revokedAt: 1 }, { name: "idx_sessions_admin" }),
    adminSessions.createIndex({ expiresAt: 1 }, { name: "idx_sessions_expires_at" }),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, availability: 1, publishedAt: -1, updatedAt: -1 }, { name: "idx_public_rooms_feed" }),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, ward: 1 }, { name: "idx_public_rooms_ward" }),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, roomType: 1, priceVnd: 1 }, { name: "idx_public_rooms_type_price" }),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, areaM2: 1, priceVnd: 1 }, { name: "idx_public_rooms_area" }),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, amenities: 1 }, { name: "idx_public_rooms_amenities" }),
    roomListings.createIndex({ deletedAt: 1, updatedAt: -1 }, { name: "idx_admin_rooms_updated" }),
    roomListings.createIndex({ _id: 1, "images.id": 1 }, { name: "idx_room_image_lookup" }),
    auditEvents.createIndex({ createdAt: -1 }, { name: "idx_audit_created_at" }),
    auditEvents.createIndex({ entityType: 1, entityId: 1, createdAt: -1 }, { name: "idx_audit_entity" }),
  ]);
}

async function runRestore(rawOptions = {}) {
  const startedAt = Date.now();
  const options = {
    backupId: rawOptions.backupId,
    backupRoot: rawOptions.backupRoot,
    targetDbName: rawOptions.targetDbName || "room_rental_restore_test",
    targetUploadDir: rawOptions.targetUploadDir || "uploads-restore-test",
    forceProductionRestore: Boolean(rawOptions.forceProductionRestore),
  };

  if (!options.forceProductionRestore) {
    assert.notEqual(options.targetDbName, "room_rental_dev", "Refusing to overwrite room_rental_dev without --force-production-restore.");
    assert.equal(/prod/i.test(options.targetDbName), false, "Refusing to overwrite production DB without --force-production-restore.");
  }

  const backupRoot = resolveBackupRoot(options.backupRoot);
  let backupId = options.backupId;
  let manifest;

  if (backupId) {
    manifest = JSON.parse(await fs.readFile(path.join(backupRoot, backupId, "manifest.json"), "utf8"));
  } else {
    const latest = await findLatestSuccessfulBackup(backupRoot);
    if (!latest) throw new Error(`No successful backup found in ${backupRoot}`);
    backupId = latest.id;
    manifest = latest.manifest;
  }

  if (manifest.status !== "SUCCESS") {
    throw new Error(`Refusing to restore from non-SUCCESS backup ${backupId} (status=${manifest.status})`);
  }

  const backupDir = path.join(backupRoot, backupId);

  // 1. Xác minh 100% SHA-256 trước khi chạm vào database hoặc kho ảnh mục tiêu
  for (const [relPath, expectedHash] of Object.entries(manifest.checksums || {})) {
    const absPath = path.join(backupDir, relPath);
    const actualHash = await sha256File(absPath);
    if (actualHash !== expectedHash) {
      throw new Error(`Checksum mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
    }
  }

  // 2. Khôi phục kho ảnh ra thư mục mục tiêu cô lập
  const targetUploadAbs = path.isAbsolute(options.targetUploadDir)
    ? options.targetUploadDir
    : path.resolve(serverRoot, options.targetUploadDir);
  await fs.rm(targetUploadAbs, { recursive: true, force: true });
  await fs.mkdir(targetUploadAbs, { recursive: true });

  const backupUploadsDir = path.join(backupDir, "uploads");
  await fs.cp(backupUploadsDir, targetUploadAbs, { recursive: true }).catch((err) => {
    if (err.code !== "ENOENT") throw err;
  });

  // 3. Khôi phục DB và dựng lại đủ index
  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: env.MONGODB_URI.startsWith("mongodb+srv://") ? 8000 : 3000,
  });

  try {
    await client.connect();
    const db = client.db(options.targetDbName);
    const restoredCounts = {};

    for (const colName of COLLECTION_NAMES) {
      const gzBuf = await fs.readFile(path.join(backupDir, "db", `${colName}.ejson.gz`));
      const docs = BSON.EJSON.parse(gunzipSync(gzBuf).toString("utf8"), { relaxed: false });
      const col = db.collection(colName);
      await col.deleteMany({});
      if (docs.length > 0) {
        // Khi khôi phục sang DB mới, đổi metadata ảnh về local cô lập để test smoke cục bộ độc lập CDN
        if (colName === "room_listings") {
          for (const doc of docs) {
            for (const img of doc.images || []) {
              if (img.provider) img.provider = "local";
            }
          }
        }
        await col.insertMany(docs, { ordered: true });
      }
      restoredCounts[colName] = await col.countDocuments({});
      assert.equal(restoredCounts[colName], manifest.counts[colName], `Count mismatch on ${colName}`);
    }

    await ensureRestoredIndexes(db);

    // 4. Xác minh 100% liên kết DB <-> Kho ảnh vật lý trên đĩa cô lập
    const listings = await db.collection("room_listings").find({}, { projection: { _id: 1, images: 1 } }).toArray();
    let verifiedImageLinks = 0;
    for (const listing of listings) {
      for (const img of listing.images || []) {
        const expectedFile = path.resolve(targetUploadAbs, String(listing._id), path.basename(String(img.storageKey)));
        const stat = await fs.stat(expectedFile);
        assert.ok(stat.isFile() && stat.size > 0, `Missing restored image file for listing ${listing._id}: ${img.storageKey}`);
        verifiedImageLinks += 1;
      }
    }

    const rpoHours = Math.round(((Date.now() - new Date(manifest.createdAtUtc).getTime()) / (1000 * 60 * 60)) * 100) / 100;
    const restoreDurationMs = Date.now() - startedAt;

    return {
      ok: true,
      backupId,
      targetDbName: options.targetDbName,
      targetUploadDir: targetUploadAbs,
      restoredCounts,
      verifiedImageLinks,
      restoreDurationMs,
      rpoHours,
      meetsRpoTarget: rpoHours <= 24,
      meetsRtoTarget: restoreDurationMs <= 24 * 60 * 60 * 1000,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  runRestore(options).then((result) => {
    if (options.json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(
        `Restore VERIFIED: ${result.backupId} -> ${result.targetDbName} | ${result.verifiedImageLinks} images linked | ${result.restoreDurationMs}ms | RPO=${result.rpoHours}h`,
      );
    }
  }).catch((error) => {
    console.error("Restore FAILED:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { runRestore };
