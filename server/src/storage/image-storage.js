const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { env } = require("../config/env");

const serverRoot = path.resolve(__dirname, "../..");
const localRoot = env.UPLOAD_DIR
  ? path.resolve(serverRoot, env.UPLOAD_DIR)
  : path.resolve(serverRoot, "uploads");

function validateListingAndKey(listingId, storageKey) {
  const safeListingId = String(listingId);
  const safeKey = path.basename(String(storageKey));
  if (!/^[0-9a-f-]{36}$/i.test(safeListingId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(safeKey)) {
    throw new Error("Invalid image storage key.");
  }
  return { safeListingId, safeKey };
}

function resolveImagePath(listingId, storageKey) {
  const { safeListingId, safeKey } = validateListingAndKey(listingId, storageKey);
  const absolute = path.resolve(localRoot, safeListingId, safeKey);
  if (!absolute.startsWith(localRoot + path.sep)) throw new Error("Image path is outside local storage.");
  return absolute;
}

function buildCloudinarySignature(params, apiSecret) {
  const sorted = Object.entries(params)
    .filter(([key, value]) => value !== undefined && value !== null && value !== "" && !["file", "cloud_name", "resource_type", "api_key"].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
}

function cloudinaryApiBase() {
  return (env.CLOUDINARY_API_BASE || "https://api.cloudinary.com").replace(/\/+$/, "");
}

async function uploadToCloudinary({ listingId, storageKey, buffer, mimeType }) {
  const { safeListingId, safeKey } = validateListingAndKey(listingId, storageKey);
  const folder = `${env.CLOUDINARY_FOLDER}/${safeListingId}`;
  const publicId = path.parse(safeKey).name;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildCloudinarySignature({ folder, public_id: publicId, timestamp }, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.set("file", new Blob([buffer], { type: mimeType || "application/octet-stream" }), safeKey);
  form.set("api_key", env.CLOUDINARY_API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature);

  const endpoint = `${cloudinaryApiBase()}/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.secure_url) {
    const errMsg = payload?.error?.message || `HTTP ${res.status}`;
    throw Object.assign(new Error(`Cloudinary upload failed: ${errMsg}`), { status: 502, code: "STORAGE_UPLOAD_FAILED" });
  }

  return {
    provider: "cloudinary",
    storageKey: safeKey,
    externalUrl: payload.secure_url,
    cloudinaryPublicId: payload.public_id,
    location: payload.public_id,
  };
}

async function destroyOnCloudinary({ listingId, storageKey, cloudinaryPublicId }) {
  if (env.IMAGE_STORAGE_DRIVER !== "cloudinary" && !cloudinaryPublicId) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return;

  const { safeListingId, safeKey } = validateListingAndKey(listingId, storageKey);
  const publicId = cloudinaryPublicId || `${env.CLOUDINARY_FOLDER}/${safeListingId}/${path.parse(safeKey).name}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildCloudinarySignature({ public_id: publicId, timestamp }, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.set("public_id", publicId);
  form.set("api_key", env.CLOUDINARY_API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const endpoint = `${cloudinaryApiBase()}/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/destroy`;
  await fetch(endpoint, { method: "POST", body: form });
}

function buildCloudinaryPublicUrl(externalUrl) {
  if (!externalUrl || !externalUrl.includes("/image/upload/")) return externalUrl;
  // Tối ưu chiều rộng <= 1280px và nén tự động giữ nguyên định dạng tương thích cho mạng 4G
  return externalUrl.replace("/image/upload/", "/image/upload/c_limit,w_1280,q_auto:good/");
}

const imageStorage = {
  driver: env.IMAGE_STORAGE_DRIVER,
  localRoot,

  async write({ listingId, storageKey, buffer, mimeType }) {
    if (env.IMAGE_STORAGE_DRIVER === "cloudinary") {
      return uploadToCloudinary({ listingId, storageKey, buffer, mimeType });
    }
    const absolutePath = resolveImagePath(listingId, storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer, { flag: "wx", mode: 0o600 });
    return {
      provider: "local",
      storageKey,
      externalUrl: null,
      cloudinaryPublicId: null,
      location: absolutePath,
    };
  },

  getPath({ listingId, storageKey }) {
    return resolveImagePath(listingId, storageKey);
  },

  async readBuffer({ listingId, storageKey, provider, externalUrl }) {
    if (provider === "cloudinary" || externalUrl) {
      const res = await fetch(externalUrl);
      if (!res.ok) throw new Error(`Upstream image fetch failed with status ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    const filePath = resolveImagePath(listingId, storageKey);
    return fs.readFile(filePath);
  },

  async remove({ listingId, storageKey, provider, cloudinaryPublicId }) {
    if (provider === "cloudinary" || cloudinaryPublicId) {
      await destroyOnCloudinary({ listingId, storageKey, cloudinaryPublicId });
      return;
    }
    await fs.unlink(resolveImagePath(listingId, storageKey));
  },

  async sendHttpResponse({ response, listingId, image, optimizeForPublic = false, next }) {
    try {
      if (image?.provider === "cloudinary" || image?.externalUrl) {
        const targetUrl = optimizeForPublic
          ? buildCloudinaryPublicUrl(image.externalUrl)
          : image.externalUrl;
        let upstream = await fetch(targetUrl);
        if (!upstream.ok && targetUrl !== image.externalUrl) {
          upstream = await fetch(image.externalUrl);
        }
        if (!upstream.ok) {
          const err = Object.assign(new Error("Không tải được ảnh từ kho lưu trữ."), { status: 502, code: "STORAGE_READ_FAILED" });
          return next(err);
        }
        const buffer = Buffer.from(await upstream.arrayBuffer());
        response.setHeader("Content-Type", upstream.headers.get("content-type") || image.mimeType);
        response.setHeader("Content-Disposition", 'inline; filename="room-image"');
        response.setHeader("X-Content-Type-Options", "nosniff");
        return response.send(buffer);
      }

      const filePath = resolveImagePath(listingId, image.storageKey);
      response.setHeader("Content-Type", image.mimeType);
      response.setHeader("Content-Disposition", 'inline; filename="room-image"');
      response.setHeader("X-Content-Type-Options", "nosniff");
      return response.sendFile(filePath, (error) => {
        if (error && !response.headersSent) next(error);
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = { imageStorage, buildCloudinarySignature };
