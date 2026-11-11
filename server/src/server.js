const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const helmet = require("helmet");
const { env } = require("./config/env");
const { pool } = require("./db/pool");
const { requestId } = require("./middleware/request-id");
const { healthRouter } = require("./routes/health");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(requestId);
app.use(express.json({ limit: "1mb" }));
app.use((request, response, next) => {
  const origin = request.get("Origin");
  if (origin && origin === env.CLIENT_ORIGIN) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (request.method === "OPTIONS") {
    return response.sendStatus(origin === env.CLIENT_ORIGIN ? 204 : 403);
  }
  return next();
});

app.use("/api/v1/health", healthRouter);

app.use((request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Không tìm thấy endpoint.",
      requestId: request.requestId,
    },
  });
});

app.use((error, request, response, _next) => {
  console.error(JSON.stringify({
    event: "unhandled_request_error",
    requestId: request.requestId,
    errorName: error.name,
  }));
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Đã xảy ra lỗi máy chủ.",
      requestId: request.requestId,
    },
  });
});

const server = app.listen(env.PORT, env.HOST, () => {
  console.log("Room rental API listening at http://" + env.HOST + ":" + env.PORT);
});

async function shutdown(signal) {
  console.log("Received " + signal + "; shutting down.");
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
