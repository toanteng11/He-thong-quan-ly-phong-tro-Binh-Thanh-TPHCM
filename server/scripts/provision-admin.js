const { randomBytes, randomUUID, scrypt: scryptCallback } = require("node:crypto");
const { promisify } = require("node:util");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { ensureIndexes, getCollections, closeDb } = require("../src/db/mongo");

const scrypt = promisify(scryptCallback);

async function makePasswordHash(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", "16384", "8", "1", salt.toString("hex"), derived.toString("hex")].join("$");
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const identifier = (await rl.question("Email đăng nhập admin: ")).trim().toLowerCase();
    const displayName = (await rl.question("Tên hiển thị: ")).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) throw new Error("Email chưa hợp lệ.");
    if (!displayName || displayName.length > 120) throw new Error("Tên hiển thị không hợp lệ.");

    const temporaryPassword = randomBytes(24).toString("base64url");
    const passwordHash = await makePasswordHash(temporaryPassword);
    const adminId = randomUUID();
    const now = new Date();

    await ensureIndexes();
    const { adminAccounts, auditEvents } = await getCollections();
    const existingCount = await adminAccounts.countDocuments({});
    if (existingCount > 0) {
      throw new Error("Đã có tài khoản admin. Không tạo tài khoản bổ sung bằng script khởi tạo.");
    }

    try {
      await adminAccounts.insertOne({
        _id: adminId,
        singletonKey: "PRIMARY_ADMIN",
        identifier,
        displayName,
        passwordHash,
        status: "ACTIVE",
        mustChangePassword: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Đã có tài khoản admin. Không tạo tài khoản bổ sung bằng script khởi tạo.");
      }
      throw error;
    }

    await auditEvents.insertOne({
      _id: randomUUID(),
      actorId: adminId,
      action: "admin_provisioned",
      entityType: "admin",
      entityId: adminId,
      requestId: null,
      metadata: { identifier },
      createdAt: now,
    });

    console.log("\nTài khoản admin đã được tạo. Mật khẩu khởi tạo chỉ hiển thị lần này:");
    console.log("Email: " + identifier);
    console.log("Mật khẩu tạm: " + temporaryPassword);
    console.log("Đăng nhập tại /admin/login và đổi mật khẩu ngay ở lần đầu. Hãy lưu mật khẩu tạm ở nơi riêng tư.");
  } finally {
    rl.close();
    await closeDb();
  }
}

main().catch((error) => {
  console.error("Không thể khởi tạo admin: " + error.message);
  process.exitCode = 1;
});
