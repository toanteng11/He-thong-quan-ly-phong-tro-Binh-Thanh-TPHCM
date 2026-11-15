const fs = require("node:fs/promises");
const path = require("node:path");
const { env } = require("../config/env");

const serverRoot = path.resolve(__dirname, "../..");
const localRoot = env.UPLOAD_DIR
  ? path.resolve(serverRoot, env.UPLOAD_DIR)
  : path.resolve(serverRoot, "uploads");

function resolveImagePath(listingId, storageKey) {
  const safeListingId = String(listingId);
  const safeKey = path.basename(String(storageKey));
  if (!/^[0-9a-f-]{36}$/i.test(safeListingId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(safeKey)) {
    throw new Error("Invalid image storage key.");
  }
  const absolute = path.resolve(localRoot, safeListingId, safeKey);
  if (!absolute.startsWith(localRoot + path.sep)) throw new Error("Image path is outside local storage.");
  return absolute;
}

const imageStorage = {
  async write({ listingId, storageKey, buffer }) {
    const absolutePath = resolveImagePath(listingId, storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer, { flag: "wx", mode: 0o600 });
    return absolutePath;
  },

  getPath({ listingId, storageKey }) {
    return resolveImagePath(listingId, storageKey);
  },

  async remove({ listingId, storageKey }) {
    await fs.unlink(resolveImagePath(listingId, storageKey));
  },
};

module.exports = { imageStorage };
