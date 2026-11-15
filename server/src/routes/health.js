const { Router } = require("express");
const { pingDb } = require("../db/mongo");

const router = Router();

router.get("/live", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "room-rental-api",
  });
});

router.get("/ready", async (request, response) => {
  try {
    await pingDb();
    response.status(200).json({
      status: "ready",
      service: "room-rental-api",
      dependencies: { database: "connected" },
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "readiness_check_failed",
      requestId: request.requestId,
      errorName: error.name,
    }));
    response.status(503).json({
      status: "not_ready",
      service: "room-rental-api",
      dependencies: { database: "unavailable" },
      requestId: request.requestId,
    });
  }
});

module.exports = { healthRouter: router };
