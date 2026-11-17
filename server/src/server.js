const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const helmet = require("helmet");
const { env } = require("./config/env");
const { closeDb } = require("./db/mongo");
const { requestId } = require("./middleware/request-id");
const { healthRouter } = require("./routes/health");

const app = express();

app.disable("x-powered-by");
if (env.TRUST_PROXY !== 0 && env.TRUST_PROXY !== false) {
  app.set("trust proxy", env.TRUST_PROXY);
}
app.use(helmet({
  hsts: env.COOKIE_SECURE_EFFECTIVE ? { maxAge: 15552000, includeSubDomains: true } : false,
  frameguard: { action: "deny" },
}));
app.use(requestId);
app.use(express.json({ limit: "1mb" }));
app.use((request, response, next) => {
  const origin = request.get("Origin");
  const isAdminRoute = request.path.startsWith("/api/v1/admin");
  const allowedOrigin = Boolean(origin) && (
    isAdminRoute
      ? env.ADMIN_ORIGINS.includes(origin)
      : env.CLIENT_ORIGINS.includes(origin) || env.ADMIN_ORIGINS.includes(origin)
  );

  if (origin && allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader(
      "Access-Control-Allow-Methods",
      isAdminRoute ? "GET, POST, PUT, PATCH, DELETE, OPTIONS" : "GET, OPTIONS",
    );
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (isAdminRoute) {
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  if (request.method === "OPTIONS") {
    return response.sendStatus(allowedOrigin ? 204 : 403);
  }
  return next();
});

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/public", require("./routes/public").publicRouter);
app.use("/api/v1/admin", require("./routes/admin").adminRouter);

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
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 499 ? error.status : 500;
  const code = status >= 400 && status <= 499 && error.code
    ? error.code
    : status === 413
      ? "PAYLOAD_TOO_LARGE"
      : status === 400
        ? "INVALID_REQUEST"
        : "INTERNAL_ERROR";
  const message = status >= 400 && status <= 499 && error.code && error.message
    ? error.message
    : status === 413
      ? "Tệp tải lên vượt quá giới hạn cho phép."
      : status === 400
        ? "Yêu cầu chưa đúng định dạng."
        : "Đã xảy ra lỗi máy chủ.";
  response.status(status).json({
    error: {
      code,
      message,
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
    await closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
