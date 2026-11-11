const { Pool } = require("pg");
const { env } = require("../config/env");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error(JSON.stringify({
    event: "database_pool_error",
    errorName: error.name,
  }));
});

module.exports = { pool };
