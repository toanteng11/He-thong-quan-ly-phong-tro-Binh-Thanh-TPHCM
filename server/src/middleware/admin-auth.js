const { createHash } = require("node:crypto");
const { getCollections } = require("../db/mongo");
const { env } = require("../config/env");

const COOKIE_NAME = "room_admin_session";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function readCookie(request, name) {
  const cookieHeader = request.get("Cookie") || "";
  for (const piece of cookieHeader.split(";")) {
    const separator = piece.indexOf("=");
    if (separator < 0) continue;
    if (piece.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(piece.slice(separator + 1).trim());
      } catch {
        return "";
      }
    }
  }
  return "";
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieValue(token, maxAgeSeconds, secure = env.COOKIE_SECURE_EFFECTIVE) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${env.COOKIE_SAMESITE}; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
}

function clearSessionCookie(response, secure = env.COOKIE_SECURE_EFFECTIVE) {
  response.setHeader("Set-Cookie", cookieValue("", 0, secure));
}

async function requireAdmin(request, response, next) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token || token.length < 40 || token.length > 100) {
    return response.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Vui lòng đăng nhập để tiếp tục.",
        requestId: request.requestId,
      },
    });
  }

  try {
    const hash = tokenHash(token);
    const now = new Date();
    const idleCutoff = new Date(now.getTime() - IDLE_TIMEOUT_MS);
    const { adminSessions, adminAccounts } = await getCollections();

    const session = await adminSessions.findOne({
      tokenHash: hash,
      revokedAt: null,
      expiresAt: { $gt: now },
      lastActivityAt: { $gt: idleCutoff },
    });

    const account = session
      ? await adminAccounts.findOne({ _id: session.adminId, status: "ACTIVE" })
      : null;

    if (!session || !account) {
      clearSessionCookie(response, env.COOKIE_SECURE_EFFECTIVE);
      return response.status(401).json({
        error: {
          code: "SESSION_EXPIRED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          requestId: request.requestId,
        },
      });
    }

    await adminSessions.updateOne({ _id: session._id }, { $set: { lastActivityAt: now } });
    request.admin = {
      id: account._id,
      identifier: account.identifier,
      displayName: account.displayName,
      mustChangePassword: account.mustChangePassword,
    };
    request.sessionHash = hash;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requirePasswordUpdated(request, response, next) {
  if (request.admin?.mustChangePassword) {
    return response.status(403).json({
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Hãy đổi mật khẩu khởi tạo trước khi tiếp tục.",
        requestId: request.requestId,
      },
    });
  }
  return next();
}

function requireSameOrigin(request, response, next) {
  const origin = request.get("Origin");
  if (!origin || !env.ADMIN_ORIGINS.includes(origin)) {
    return response.status(403).json({
      error: {
        code: "ORIGIN_REJECTED",
        message: "Yêu cầu không được chấp nhận.",
        requestId: request.requestId,
      },
    });
  }
  return next();
}

module.exports = {
  COOKIE_NAME,
  tokenHash,
  cookieValue,
  clearSessionCookie,
  requireAdmin,
  requirePasswordUpdated,
  requireSameOrigin,
};
