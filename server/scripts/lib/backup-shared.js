const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { env } = require("../../src/config/env");

const serverRoot = path.resolve(__dirname, "../..");

function resolveBackupRoot(customRoot) {
  const raw = customRoot || env.BACKUP_ROOT || "backups";
  return path.isAbsolute(raw) ? raw : path.resolve(serverRoot, raw);
}

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function sha256File(filePath) {
  const buf = await fs.readFile(filePath);
  return sha256Buffer(buf);
}

async function walkFiles(dirPath, baseDir = dirPath) {
  const results = [];
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return results;
    throw error;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkFiles(fullPath, baseDir);
      results.push(...nested);
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, fullPath).split(path.sep).join("/");
      results.push(rel);
    }
  }
  return results.sort();
}

async function emitAlert({ event, severity = "HIGH", message, metadata = {} }) {
  const payload = {
    event,
    severity,
    service: "room-rental-api",
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(payload));
  if (env.ALERT_WEBHOOK_URL) {
    try {
      await fetch(env.ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(JSON.stringify({
        event: "alert_webhook_delivery_failed",
        errorName: error.name,
      }));
    }
  }
  return payload;
}

module.exports = {
  serverRoot,
  resolveBackupRoot,
  sha256Buffer,
  sha256File,
  walkFiles,
  emitAlert,
};
