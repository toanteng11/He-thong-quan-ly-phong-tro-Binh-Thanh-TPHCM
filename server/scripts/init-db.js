const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { ensureIndexes, pingDb, closeDb } = require("../src/db/mongo");

async function main() {
  await pingDb();
  await ensureIndexes();
  console.log("MongoDB collections and indexes initialized.");
}

main()
  .catch((error) => {
    console.error("MongoDB initialization failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

