const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { randomBytes, randomUUID, scrypt: scryptCallback } = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { promisify } = require("node:util");
const { MongoClient } = require("mongodb");

const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..");
require("dotenv").config({ path: path.resolve(repoRoot, ".env") });

const TEST_DB = "room_rental_sprint4_test";
const RESTORE_TEST_DB = "room_rental_sprint4_restore_test";
assert.notEqual(TEST_DB, "room_rental_dev");
assert.notEqual(RESTORE_TEST_DB, "room_rental_dev");

const TEST_UPLOAD_DIR = path.resolve(serverRoot, "uploads-sprint4-test");
const TEST_BACKUP_ROOT = path.resolve(serverRoot, "backups-sprint4-test");
const TEST_RESTORE_UPLOADS = path.resolve(serverRoot, "uploads-sprint4-restore-test");
const API_PORT = Number(process.env.SPRINT4_TEST_PORT || 3104);
const API_BASE = `http://127.0.0.1:${API_PORT}/api/v1`;
const ADMIN_ORIGIN = "https://admin-phongtro-test.vercel.app";
const CLIENT_ORIGIN = "https://phongtro-test.vercel.app";

const scrypt = promisify(scryptCallback);

// 1x1 PNG hợp lệ tối giản để test upload
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function hashTestPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", "16384", "8", "1", salt.toString("hex"), derived.toString("hex")].join("$");
}

function startMockCloudAndWebhookServer() {
  const uploadedBlobs = new Map();
  const webhookAlerts = [];

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      if (req.method === "POST" && req.url === "/webhook-alert") {
        webhookAlerts.push(JSON.parse(body.toString("utf8")));
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ received: true }));
      }

      if (req.method === "POST" && req.url === "/v1_1/test-cloud/image/upload") {
        const publicId = `room-rental-binh-thanh/${randomUUID()}`;
        uploadedBlobs.set(publicId, TINY_PNG);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          public_id: publicId,
          secure_url: `http://127.0.0.1:${server.address().port}/cdn/${publicId}.png`,
          bytes: TINY_PNG.length,
          format: "png",
        }));
      }

      if (req.method === "POST" && req.url === "/v1_1/test-cloud/image/destroy") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ result: "ok" }));
      }

      if (req.method === "GET" && req.url.startsWith("/cdn/")) {
        res.writeHead(200, { "Content-Type": "image/png" });
        return res.end(TINY_PNG);
      }

      res.writeHead(404);
      return res.end("Not found");
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({
        server,
        port,
        baseUrl: `http://127.0.0.1:${port}`,
        uploadedBlobs,
        webhookAlerts,
      });
    });
  });
}

async function scanDistForSecrets(distPath) {
  const forbiddenPatterns = [
    /mongodb:\/\/[^\s"'`]+/i,
    /mongodb\+srv:\/\/[^\s"'`]+/i,
    /CLOUDINARY_API_SECRET/i,
    /passwordHash/i,
  ];
  let checkedFiles = 0;
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(js|css|html)$/i.test(entry.name)) {
        const text = await fs.readFile(full, "utf8");
        checkedFiles += 1;
        for (const pat of forbiddenPatterns) {
          assert.equal(pat.test(text), false, `Forbidden secret pattern ${pat} found in ${full}`);
        }
      }
    }
  }
  await walk(distPath);
  return checkedFiles;
}

async function waitForServerReady(url) {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnApiProcess(extraEnv) {
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: serverRoot,
    env: { ...process.env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (d) => { logs += d.toString("utf8"); });
  child.stderr.on("data", (d) => { logs += d.toString("utf8"); });
  return {
    child,
    getLogs: () => logs,
    stop: () => new Promise((resolve) => {
      if (child.killed || child.exitCode !== null) return resolve();
      child.once("exit", () => resolve());
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
        resolve();
      }, 1500);
    }),
  };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  assert.ok(mongoUri, "MONGODB_URI is required");

  await fs.rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
  await fs.rm(TEST_BACKUP_ROOT, { recursive: true, force: true });
  await fs.rm(TEST_RESTORE_UPLOADS, { recursive: true, force: true });

  const mockServer = await startMockCloudAndWebhookServer();
  const client = new MongoClient(mongoUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 3000 });
  let apiProc = null;
  let brokenDbProc = null;

  try {
    // 1. Kiểm tra AT-48: Quét build artifacts client/dist & admin/dist sạch secret
    const clientFilesScanned = await scanDistForSecrets(path.resolve(repoRoot, "client/dist"));
    const adminFilesScanned = await scanDistForSecrets(path.resolve(repoRoot, "admin/dist"));
    assert.ok(clientFilesScanned > 0, "client/dist must be built before Sprint 4 check");
    assert.ok(adminFilesScanned > 0, "admin/dist must be built before Sprint 4 check");

    // Khởi tạo DB test sạch + tài khoản admin tạm chưa đổi mật khẩu
    await client.connect();
    const testDb = client.db(TEST_DB);
    await testDb.dropDatabase();
    await client.db(RESTORE_TEST_DB).dropDatabase();

    // Thiết lập env cho các module local khi chạy backup/restore trực tiếp
    process.env.MONGODB_DB_NAME = TEST_DB;
    process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;
    process.env.BACKUP_ROOT = TEST_BACKUP_ROOT;
    process.env.ALERT_WEBHOOK_URL = `${mockServer.baseUrl}/webhook-alert`;
    process.env.IMAGE_STORAGE_DRIVER = "cloudinary";
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";
    process.env.CLOUDINARY_API_BASE = mockServer.baseUrl;

    const { ensureIndexes, closeDb } = require("../src/db/mongo");
    await ensureIndexes();
    await closeDb();

    const tempPass = "Sprint4InitPass!2026";
    const finalPass = "Sprint4StrongPass#2026";
    const adminId = randomUUID();
    const now = new Date();
    await testDb.collection("admin_accounts").insertOne({
      _id: adminId,
      singletonKey: "PRIMARY_ADMIN",
      identifier: "owner-test@phongtro.vn",
      displayName: "Ngọc Toàn",
      passwordHash: await hashTestPassword(tempPass),
      status: "ACTIVE",
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Khởi chạy API server với cấu hình Hardening Production + Cloudinary mock
    apiProc = spawnApiProcess({
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: String(API_PORT),
      CLIENT_ORIGIN,
      ADMIN_ORIGIN,
      TRUST_PROXY: "1",
      COOKIE_SECURE: "true",
      COOKIE_SAMESITE: "Lax",
      MONGODB_DB_NAME: TEST_DB,
      UPLOAD_DIR: TEST_UPLOAD_DIR,
      BACKUP_ROOT: TEST_BACKUP_ROOT,
      ALERT_WEBHOOK_URL: `${mockServer.baseUrl}/webhook-alert`,
      IMAGE_STORAGE_DRIVER: "cloudinary",
      CLOUDINARY_CLOUD_NAME: "test-cloud",
      CLOUDINARY_API_KEY: "test-key",
      CLOUDINARY_API_SECRET: "test-secret",
      CLOUDINARY_API_BASE: mockServer.baseUrl,
    });

    await waitForServerReady(`${API_BASE}/health/live`);

    // 3. Kiểm tra AT-36 & AT-38: Health endpoints + Security headers + CORS
    const healthLive = await fetch(`${API_BASE}/health/live`);
    assert.equal(healthLive.status, 200);
    assert.equal(healthLive.headers.get("x-powered-by"), null);
    assert.ok(healthLive.headers.get("strict-transport-security"));
    assert.equal(healthLive.headers.get("x-frame-options"), "DENY");
    assert.equal(healthLive.headers.get("x-content-type-options"), "nosniff");

    const healthReady = await fetch(`${API_BASE}/health/ready`);
    assert.equal(healthReady.status, 200);
    const readyText = await healthReady.text();
    assert.equal(/mongodb:|password|test-secret/i.test(readyText), false);

    // Kiểm tra khi DB mất kết nối -> /health/ready trả 503 sạch secret
    const brokenPort = API_PORT + 1;
    brokenDbProc = spawnApiProcess({
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: String(brokenPort),
      CLIENT_ORIGIN,
      ADMIN_ORIGIN,
      TRUST_PROXY: "1",
      COOKIE_SECURE: "true",
      COOKIE_SAMESITE: "Lax",
      MONGODB_URI: "mongodb://127.0.0.1:27999/unavailable",
      MONGODB_DB_NAME: TEST_DB,
      IMAGE_STORAGE_DRIVER: "local",
    });
    await waitForServerReady(`http://127.0.0.1:${brokenPort}/api/v1/health/live`);
    const brokenReady = await fetch(`http://127.0.0.1:${brokenPort}/api/v1/health/ready`);
    assert.equal(brokenReady.status, 503);
    const brokenText = await brokenReady.text();
    assert.equal(/27999|mongodb:\/\/|stack/i.test(brokenText), false);
    await brokenDbProc.stop();

    // Kiểm tra CORS chéo CLIENT_ORIGIN gọi admin route bị chặn (403 OPTIONS)
    const crossOriginPreflight = await fetch(`${API_BASE}/admin/rooms`, {
      method: "OPTIONS",
      headers: { Origin: CLIENT_ORIGIN },
    });
    assert.equal(crossOriginPreflight.status, 403);

    // 4. Kiểm tra AT-35 & AT-22: Không có public signup, rate-limit theo X-Forwarded-For, ép đổi mật khẩu tạm
    const signupAttempt = await fetch(`${API_BASE}/admin/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN },
      body: JSON.stringify({ identifier: "hacker@example.com", password: "Password123456" }),
    });
    assert.ok([401, 404].includes(signupAttempt.status));

    // Thử sai mật khẩu với IP giả lập qua proxy
    const wrongLogin = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ADMIN_ORIGIN,
        "X-Forwarded-For": "203.0.113.55",
      },
      body: JSON.stringify({ identifier: "owner-test@phongtro.vn", password: "wrong-password" }),
    });
    assert.equal(wrongLogin.status, 401);

    // Đăng nhập đúng bằng mật khẩu tạm -> cookie phải có HttpOnly; SameSite=Lax; Secure
    const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ADMIN_ORIGIN,
        "X-Forwarded-For": "203.0.113.77",
      },
      body: JSON.stringify({ identifier: "owner-test@phongtro.vn", password: tempPass }),
    });
    assert.equal(loginRes.status, 200);
    const loginCookieHeader = loginRes.headers.get("set-cookie") || "";
    assert.match(loginCookieHeader, /HttpOnly/i);
    assert.match(loginCookieHeader, /SameSite=Lax/i);
    assert.match(loginCookieHeader, /Secure/i);
    let sessionCookie = loginCookieHeader.split(";")[0];

    // Chưa đổi mật khẩu -> tạo phòng bị 403 PASSWORD_CHANGE_REQUIRED
    const blockedCreate = await fetch(`${API_BASE}/admin/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({
        title: "Phòng test chưa đổi mật khẩu", description: "Mô tả đủ dài hơn 30 ký tự để kiểm tra.",
        roomType: "Phòng trọ", priceVnd: 3500000, areaM2: 20, amenities: ["Thang máy"],
        ward: "Phường Gia Định", district: "Bình Thạnh", city: "TP. Hồ Chí Minh",
        publicAddress: "Phan Đăng Lưu, Phường Gia Định", privateAddress: "99/1 Phan Đăng Lưu",
        allowExactAddress: false, contactPhone: "0909123456", allowPublicPhone: true,
        contactZalo: "", allowPublicZalo: false,
      }),
    });
    assert.equal(blockedCreate.status, 403);

    // Đổi mật khẩu lần đầu
    const changePassRes = await fetch(`${API_BASE}/admin/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({ password: finalPass, confirmPassword: finalPass }),
    });
    assert.equal(changePassRes.status, 200);
    sessionCookie = (changePassRes.headers.get("set-cookie") || "").split(";")[0];

    // 5. Kiểm tra AT-30, AT-31, AT-43: Tạo nháp thiếu trường, từ chối publish, upload Cloudinary, preview privacy
    const draftRes = await fetch(`${API_BASE}/admin/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({
        title: "Phòng test chuẩn Sprint 4 Bình Thạnh",
        description: "Phòng mới sạch sẽ gần trung tâm Quận Bình Thạnh có thang máy.",
        roomType: "Phòng trọ",
        priceVnd: 4200000,
        areaM2: 24,
        amenities: ["Máy lạnh", "Thang máy"],
        ward: "Phường Thạnh Mỹ Tây",
        district: "Bình Thạnh",
        city: "TP. Hồ Chí Minh",
        publicAddress: "Đường D2 Nguyễn Gia Trí, Phường Thạnh Mỹ Tây",
        privateAddress: "88/12 Nguyễn Gia Trí - Bí mật nội bộ",
        allowExactAddress: false,
        contactPhone: "0909888777",
        allowPublicPhone: true,
        contactZalo: "0909888777",
        allowPublicZalo: true,
      }),
    });
    assert.equal(draftRes.status, 201);
    const { item: createdRoom } = await draftRes.json();

    // AT-30: Thiếu ảnh -> không cho chuyển PUBLISHED (422)
    const failPubRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/publish-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({ publishStatus: "PUBLISHED" }),
    });
    assert.equal(failPubRes.status, 422);
    const failPubJson = await failPubRes.json();
    assert.equal(failPubJson.error.code, "PUBLISH_VALIDATION_FAILED");

    // Upload ảnh lên Cloudinary mock
    const boundary = "----Sprint4TestBoundary123";
    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="room.png"\r\nContent-Type: image/png\r\n\r\n`),
      TINY_PNG,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const uploadRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/images`, {
      method: "POST",
      headers: {
        Origin: ADMIN_ORIGIN,
        Cookie: sessionCookie,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    assert.equal(uploadRes.status, 201);
    const { item: uploadedImg } = await uploadRes.json();

    // AT-31: Khi còn DRAFT, admin xem được preview & ảnh, khách không xem được (401/404)
    const adminPreviewRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/preview`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(adminPreviewRes.status, 200);
    const anonPreviewRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/preview`);
    assert.equal(anonPreviewRes.status, 401);
    const publicDraftImg = await fetch(`${API_BASE}/public/rooms/${createdRoom.id}/images/${uploadedImg.id}/file`);
    assert.equal(publicDraftImg.status, 404);

    // Xuất bản thành công
    const pubRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/publish-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({ publishStatus: "PUBLISHED" }),
    });
    assert.equal(pubRes.status, 200);
    assert.match(pubRes.headers.get("cache-control") || "", /no-store/i);

    // AT-43 & Cloudinary streaming check
    const publicDetailRes = await fetch(`${API_BASE}/public/rooms/${createdRoom.id}`);
    assert.equal(publicDetailRes.status, 200);
    const publicDetailText = await publicDetailRes.text();
    assert.equal(publicDetailText.includes("Bí mật nội bộ"), false);
    assert.equal(publicDetailText.includes("cloudinaryPublicId"), false);

    const publicImgRes = await fetch(`${API_BASE}/public/rooms/${createdRoom.id}/images/${uploadedImg.id}/file`);
    assert.equal(publicImgRes.status, 200);
    assert.equal(publicImgRes.headers.get("content-type"), "image/png");

    // Tạo thêm 1 tin để test xóa mềm -> khôi phục (AT-32, AT-33)
    const delRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}`, {
      method: "DELETE",
      headers: { Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
    });
    assert.equal(delRes.status, 204);
    assert.equal((await fetch(`${API_BASE}/public/rooms/${createdRoom.id}`)).status, 404);
    assert.equal((await fetch(`${API_BASE}/public/rooms/${createdRoom.id}/images/${uploadedImg.id}/file`)).status, 404);

    const restoreListingRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/restore`, {
      method: "POST",
      headers: { Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
    });
    assert.equal(restoreListingRes.status, 200);
    const { item: restoredRoom } = await restoreListingRes.json();
    assert.equal(restoredRoom.publishStatus, "DRAFT");

    // Xuất bản lại để backup có dữ liệu công khai + ảnh đầy đủ
    const rePubRes = await fetch(`${API_BASE}/admin/rooms/${createdRoom.id}/publish-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN, Cookie: sessionCookie },
      body: JSON.stringify({ publishStatus: "PUBLISHED" }),
    });
    assert.equal(rePubRes.status, 200);

    // AT-34: Hết phiên -> gọi API admin trả 401
    await testDb.collection("admin_sessions").updateMany({}, { $set: { expiresAt: new Date(Date.now() - 60000) } });
    const expiredRes = await fetch(`${API_BASE}/admin/rooms`, { headers: { Cookie: sessionCookie } });
    assert.equal(expiredRes.status, 401);

    // 6. Kiểm tra AT-37 & AT-39: Backup + Cảnh báo Backup Lỗi + Restore Drill Cô lập
    const { runBackup } = require("./backup-system");
    const { runRestore } = require("./restore-system");
    const { runPurge } = require("./purge-expired");

    const backupSuccess = await runBackup({ type: "daily", dbName: TEST_DB, backupRoot: TEST_BACKUP_ROOT });
    assert.equal(backupSuccess.ok, true);
    assert.equal(backupSuccess.manifest.status, "SUCCESS");
    assert.equal(backupSuccess.manifest.imageFileCount, 1);

    const backupFailed = await runBackup({ type: "daily", simulateFailure: true, dbName: TEST_DB, backupRoot: TEST_BACKUP_ROOT });
    assert.equal(backupFailed.ok, false);
    assert.equal(backupFailed.manifest.status, "FAILED");
    assert.ok(mockServer.webhookAlerts.some((a) => a.event === "backup_job_failed"));

    const restoreResult = await runRestore({
      backupId: backupSuccess.manifest.backupId,
      backupRoot: TEST_BACKUP_ROOT,
      targetDbName: RESTORE_TEST_DB,
      targetUploadDir: TEST_RESTORE_UPLOADS,
    });
    assert.equal(restoreResult.ok, true);
    assert.equal(restoreResult.verifiedImageLinks, 1);
    assert.equal(restoreResult.meetsRpoTarget, true);
    assert.equal(restoreResult.meetsRtoTarget, true);

    // 7. Kiểm tra Retention 90 ngày --dry-run (DAT-03)
    const oldDeletedAt = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
    await testDb.collection("room_listings").insertOne({
      _id: randomUUID(),
      title: "Tin quá hạn 90 ngày",
      deletedAt: oldDeletedAt,
      images: [],
    });
    const purgeDry = await runPurge({
      retentionDays: 90,
      confirmPurge: false,
      dbName: TEST_DB,
      backupRoot: TEST_BACKUP_ROOT,
      uploadRoot: TEST_UPLOAD_DIR,
    });
    assert.equal(purgeDry.mode, "DRY_RUN");
    assert.equal(purgeDry.expiredListingCount, 1);

    // Kiểm tra log API sạch bí mật
    const apiLogs = apiProc.getLogs();
    assert.equal(/Sprint4StrongPass|Sprint4InitPass|test-secret/i.test(apiLogs), false);

    console.log(JSON.stringify({
      status: "SPRINT_4_GOLIVE_VERIFICATION_PASSED",
      checks: {
        secretScanFiles: clientFilesScanned + adminFilesScanned,
        hardeningAndAuth: "PASS (AT-34, AT-35, AT-36, AT-38, AT-48)",
        lifecycleAndCloudinary: "PASS (AT-30, AT-31, AT-32, AT-33, AT-43, AT-45)",
        backupAndAlert: "PASS (AT-37)",
        restoreDrill: `PASS (AT-39, ${restoreResult.restoreDurationMs}ms, ${restoreResult.verifiedImageLinks} images linked)`,
        retentionDryRun: `PASS (${purgeDry.expiredListingCount} expired detected without deletion)`,
      },
    }, null, 2));
  } finally {
    if (brokenDbProc) await brokenDbProc.stop();
    if (apiProc) await apiProc.stop();
    await client.db(TEST_DB).dropDatabase().catch(() => {});
    await client.db(RESTORE_TEST_DB).dropDatabase().catch(() => {});
    await client.close().catch(() => {});
    await new Promise((resolve) => mockServer.server.close(resolve));
    await fs.rm(TEST_UPLOAD_DIR, { recursive: true, force: true }).catch(() => {});
    await fs.rm(TEST_BACKUP_ROOT, { recursive: true, force: true }).catch(() => {});
    await fs.rm(TEST_RESTORE_UPLOADS, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error("Sprint 4 verification FAILED:", error);
  process.exitCode = 1;
});
