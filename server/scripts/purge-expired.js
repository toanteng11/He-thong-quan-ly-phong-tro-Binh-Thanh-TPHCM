const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { env } = require("../src/config/env");
const { imageStorage } = require("../src/storage/image-storage");
const { resolveBackupRoot, walkFiles } = require("./lib/backup-shared");

const DEFAULT_RETENTION_DAYS = 90;

function parseArgs(argv) {
  const options = {
    retentionDays: DEFAULT_RETENTION_DAYS,
    confirmPurge: false,
    json: false,
    dbName: env.MONGODB_DB_NAME,
    backupRoot: undefined,
    uploadRoot: undefined,
  };
  for (const arg of argv) {
    if (arg.startsWith("--retention-days=")) {
      const days = Number(arg.slice("--retention-days=".length));
      if (!Number.isFinite(days) || days < 1) throw new Error("retention-days must be >= 1");
      options.retentionDays = days;
    } else if (arg === "--confirm-purge") {
      options.confirmPurge = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg.startsWith("--db=")) {
      options.dbName = arg.slice("--db=".length);
    } else if (arg.startsWith("--backup-root=")) {
      options.backupRoot = arg.slice("--backup-root=".length);
    } else if (arg.startsWith("--uploads=")) {
      options.uploadRoot = arg.slice("--uploads=".length);
    }
  }
  return options;
}

async function hasRecentSuccessfulBackup(backupRoot) {
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  const entries = await fs.readdir(backupRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(backupRoot, entry.name, "manifest.json"), "utf8"));
      if (manifest.status === "SUCCESS" && new Date(manifest.createdAtUtc).getTime() >= cutoffMs) {
        return entry.name;
      }
    } catch {
      /* ignore invalid manifests */
    }
  }
  return null;
}

async function runPurge(rawOptions = {}) {
  const retentionDays = rawOptions.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const confirmPurge = Boolean(rawOptions.confirmPurge);
  const dbName = rawOptions.dbName || env.MONGODB_DB_NAME;
  const backupRoot = resolveBackupRoot(rawOptions.backupRoot);
  const uploadRoot = rawOptions.uploadRoot ? path.resolve(rawOptions.uploadRoot) : imageStorage.localRoot;

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  if (confirmPurge) {
    const recentBackup = await hasRecentSuccessfulBackup(backupRoot);
    if (!recentBackup) {
      throw new Error("Refusing --confirm-purge: No successful backup found within the last 24 hours.");
    }
  }

  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: env.MONGODB_URI.startsWith("mongodb+srv://") ? 8000 : 3000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const roomListings = db.collection("room_listings");
    const auditEvents = db.collection("audit_events");

    const expiredListings = await roomListings.find(
      { deletedAt: { $ne: null, $lt: cutoffDate } },
      { projection: { _id: 1, title: 1, deletedAt: 1, images: 1 } },
    ).toArray();

    const activeRefs = new Set();
    const allListings = await roomListings.find({}, { projection: { _id: 1, images: 1 } }).toArray();
    for (const doc of allListings) {
      for (const img of doc.images || []) {
        activeRefs.add(`${doc._id}/${path.basename(String(img.storageKey))}`);
      }
    }

    const diskFiles = await walkFiles(uploadRoot);
    const orphanFiles = diskFiles.filter((relPath) => !activeRefs.has(relPath));

    let purgedListings = 0;
    let purgedOrphanFiles = 0;

    if (confirmPurge) {
      for (const doc of expiredListings) {
        for (const img of doc.images || []) {
          await imageStorage.remove({
            listingId: doc._id,
            storageKey: img.storageKey,
            provider: img.provider,
            cloudinaryPublicId: img.cloudinaryPublicId,
          }).catch(() => {});
        }
        await fs.rm(path.join(uploadRoot, String(doc._id)), { recursive: true, force: true }).catch(() => {});
        await roomListings.deleteOne({ _id: doc._id });
        purgedListings += 1;
      }

      for (const rel of orphanFiles) {
        await fs.unlink(path.join(uploadRoot, rel)).catch(() => {});
        purgedOrphanFiles += 1;
      }

      if (purgedListings > 0 || purgedOrphanFiles > 0) {
        await auditEvents.insertOne({
          _id: randomUUID(),
          actorId: "system_retention",
          action: "retention_purge_executed",
          entityType: "retention",
          entityId: dbName,
          requestId: null,
          metadata: { retentionDays, purgedListings, purgedOrphanFiles },
          createdAt: new Date(),
        });
      }
    }

    return {
      mode: confirmPurge ? "EXECUTED" : "DRY_RUN",
      dbName,
      retentionDays,
      cutoffIso: cutoffDate.toISOString(),
      expiredListingCount: expiredListings.length,
      orphanFileCount: orphanFiles.length,
      purgedListings,
      purgedOrphanFiles,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  runPurge(options).then((result) => {
    if (options.json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(
        `Retention ${result.mode} (>${result.retentionDays}d, DB=${result.dbName}): ${result.expiredListingCount} expired soft-deleted listings, ${result.orphanFileCount} orphan files.`,
      );
    }
  }).catch((error) => {
    console.error("Purge error:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { runPurge };
