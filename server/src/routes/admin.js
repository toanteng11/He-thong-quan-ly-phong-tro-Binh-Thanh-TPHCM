const { Router } = require("express");
const { randomBytes, randomUUID, timingSafeEqual } = require("node:crypto");
const path = require("node:path");
const { z } = require("zod");
const { getCollections } = require("../db/mongo");
const { env } = require("../config/env");
const { hashPassword, verifyPassword } = require("../security/password");
const { imageStorage } = require("../storage/image-storage");
const {
  tokenHash,
  cookieValue,
  clearSessionCookie,
  requireAdmin,
  requirePasswordUpdated,
  requireSameOrigin,
} = require("../middleware/admin-auth");

const router = Router();
router.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  return next();
});

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 10;
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const DUMMY_PASSWORD_HASH = `scrypt$16384$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;

const optionalPositiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable();
const optionalPositiveArea = z.number().positive().max(100000).nullable();
const ROOM_TYPES = ["", "Phòng trọ", "Phòng có gác", "Phòng studio", "Căn hộ mini", "Phòng ở ghép"];
const AMENITIES = [
  "Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng",
  "Nhà vệ sinh riêng", "Ban công", "Gác lửng", "Wifi", "Chỗ để xe", "Cửa sổ",
];

const editableListingSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(5000),
  roomType: z.enum(ROOM_TYPES),
  priceVnd: optionalPositiveInteger,
  areaM2: optionalPositiveArea,
  amenities: z.array(z.enum(AMENITIES)).max(30),
  ward: z.string().max(120),
  district: z.string().max(120),
  city: z.string().max(120),
  publicAddress: z.string().max(300),
  privateAddress: z.string().max(500),
  allowExactAddress: z.boolean(),
  contactPhone: z.string().max(40),
  allowPublicPhone: z.boolean(),
  contactZalo: z.string().max(120),
  allowPublicZalo: z.boolean(),
  version: z.number().int().positive().optional(),
}).strict();

const createListingSchema = editableListingSchema.extend({
  availability: z.enum(["AVAILABLE", "RENTED"]).default("AVAILABLE"),
}).strict();

const passwordSchema = z.string().min(12).max(128);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendError(response, request, status, code, message, fieldErrors) {
  response.status(status).json({
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      requestId: request.requestId,
    },
  });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function attemptKey(request) {
  return request.ip || "unknown";
}

function noteFailedLogin(key) {
  const now = Date.now();
  if (loginAttempts.size > 2000) {
    for (const [attemptKeyValue, attemptValue] of loginAttempts) {
      if (attemptValue.resetAt <= now) loginAttempts.delete(attemptKeyValue);
    }
  }
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    current.count += 1;
  }
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

function sortImages(images = []) {
  return [...images].sort((a, b) => {
    if (Boolean(a.isCover) !== Boolean(b.isCover)) return a.isCover ? -1 : 1;
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

function toImage(img, listingId) {
  return {
    id: img.id,
    mimeType: img.mimeType,
    byteSize: img.byteSize,
    originalName: img.originalName,
    altText: img.altText || "",
    sortOrder: img.sortOrder,
    isCover: Boolean(img.isCover),
    url: `/api/v1/admin/rooms/${listingId}/images/${img.id}/file`,
  };
}

function toListing(doc, explicitImages) {
  const images = explicitImages ?? sortImages(doc.images).map((img) => toImage(img, doc._id));
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description ?? "",
    roomType: doc.roomType,
    priceVnd: doc.priceVnd === null || doc.priceVnd === undefined ? null : Number(doc.priceVnd),
    areaM2: doc.areaM2 === null || doc.areaM2 === undefined ? null : Number(doc.areaM2),
    amenities: doc.amenities || [],
    ward: doc.ward,
    district: doc.district,
    city: doc.city,
    publicAddress: doc.publicAddress,
    privateAddress: doc.privateAddress ?? "",
    allowExactAddress: Boolean(doc.allowExactAddress),
    contactPhone: doc.contactPhone ?? "",
    allowPublicPhone: Boolean(doc.allowPublicPhone),
    contactZalo: doc.contactZalo ?? "",
    allowPublicZalo: Boolean(doc.allowPublicZalo),
    availability: doc.availability,
    publishStatus: doc.publishStatus,
    publishedAt: doc.publishedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt || null,
    version: doc.version,
    images,
  };
}

async function getListing(id, includeDeleted = false) {
  const { roomListings } = await getCollections();
  const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
  return roomListings.findOne(query);
}

async function audit(request, action, entityType, entityId, metadata = {}) {
  const { auditEvents } = await getCollections();
  await auditEvents.insertOne({
    _id: randomUUID(),
    actorId: request.admin?.id || null,
    action,
    entityType,
    entityId: entityId || null,
    requestId: request.requestId || null,
    metadata,
    createdAt: new Date(),
  });
}

function validatePublishFields(listing, imageCount) {
  const issues = {};
  if ((listing.title || "").trim().length < 10 || (listing.title || "").trim().length > 120) {
    issues.title = "Tiêu đề cần từ 10 đến 120 ký tự.";
  }
  if ((listing.description || "").trim().length < 30) {
    issues.description = "Mô tả cần từ 30 đến 5.000 ký tự.";
  }
  if (!(listing.roomType || "").trim()) issues.roomType = "Vui lòng chọn loại phòng.";
  if (!Number.isInteger(Number(listing.priceVnd)) || Number(listing.priceVnd) <= 0) {
    issues.priceVnd = "Giá thuê phải là số nguyên VND lớn hơn 0.";
  }
  if (!Number.isFinite(Number(listing.areaM2)) || Number(listing.areaM2) <= 0) {
    issues.areaM2 = "Diện tích phải lớn hơn 0.";
  }
  if (!(listing.publicAddress || "").trim()) {
    issues.publicAddress = "Cần có khu vực hiển thị công khai.";
  }
  if (!(listing.ward || "").trim()) {
    issues.ward = "Vui lòng nhập phường tại Bình Thạnh.";
  }
  if (listing.allowExactAddress && !(listing.privateAddress || "").trim()) {
    issues.privateAddress = "Nhập địa chỉ đầy đủ trước khi bật công khai địa chỉ.";
  }
  if (!listing.availability) issues.availability = "Vui lòng chọn tình trạng phòng.";
  if (imageCount < 1) issues.images = "Cần tải lên ít nhất một ảnh hợp lệ.";

  const phone = (listing.contactPhone || "").trim();
  const phoneValid = /^\+?[0-9().\s-]{9,20}$/.test(phone);
  const hasPublicPhone = listing.allowPublicPhone && phoneValid;

  const zalo = (listing.contactZalo || "").trim();
  const zaloValid = /^\+?[0-9().\s-]{9,20}$/.test(zalo) || /^https:\/\/zalo\.me\/[A-Za-z0-9._-]+$/.test(zalo);
  const hasPublicZalo = listing.allowPublicZalo && zaloValid;

  if (listing.allowPublicPhone && !phoneValid) issues.contactPhone = "Số điện thoại công khai chưa đúng định dạng.";
  if (listing.allowPublicZalo && !zaloValid) issues.contactZalo = "Thông tin Zalo công khai chưa đúng định dạng.";
  if (!hasPublicPhone && !hasPublicZalo) issues.contact = "Bật công khai ít nhất một kênh liên hệ hợp lệ.";
  return issues;
}

function imageExtension(mimeType) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
}

function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "";
}

function parseSingleMultipartFile(request) {
  const contentType = request.get("Content-Type") || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw Object.assign(new Error("Thiếu multipart boundary."), { status: 400, code: "INVALID_MULTIPART" });
  const boundary = boundaryMatch[1] || boundaryMatch[2].trim();
  const body = request.body;
  if (!Buffer.isBuffer(body)) throw Object.assign(new Error("Không đọc được tệp tải lên."), { status: 400, code: "INVALID_MULTIPART" });

  const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"));
  const bodyStart = headerEnd + 4;
  const delimiter = Buffer.from(`\r\n--${boundary}`);
  const bodyEnd = body.indexOf(delimiter, bodyStart);
  if (headerEnd < 0 || bodyEnd < 0) throw Object.assign(new Error("Cấu trúc tệp tải lên không hợp lệ."), { status: 400, code: "INVALID_MULTIPART" });
  const headers = body.subarray(0, headerEnd).toString("utf8");
  if (!/content-disposition:\s*form-data;[^\r\n]*name="file";[^\r\n]*filename="/i.test(headers)) {
    throw Object.assign(new Error("Yêu cầu phải có một trường tệp tên là file."), { status: 400, code: "INVALID_MULTIPART" });
  }
  const originalNameMatch = headers.match(/filename="([^"]*)"/i);
  const fileBuffer = body.subarray(bodyStart, bodyEnd);
  if (!fileBuffer.length) throw Object.assign(new Error("Tệp tải lên đang rỗng."), { status: 400, code: "EMPTY_FILE" });
  if (fileBuffer.length > 10 * 1024 * 1024) throw Object.assign(new Error("Mỗi ảnh được tối đa 10 MB."), { status: 413, code: "FILE_TOO_LARGE" });

  const mimeType = detectImage(fileBuffer);
  if (!mimeType) throw Object.assign(new Error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP hợp lệ."), { status: 415, code: "UNSUPPORTED_MEDIA_TYPE" });
  const originalName = path.basename((originalNameMatch?.[1] || "anh-phong").replace(/[\r\n\u0000-\u001f]/g, "")).slice(0, 180);
  return { fileBuffer, mimeType, originalName };
}

router.post("/auth/login", requireSameOrigin, async (request, response, next) => {
  try {
    const input = z.object({
      identifier: z.string().trim().min(1).max(200),
      password: z.string().min(1).max(128),
    }).safeParse(request.body);
    if (!input.success) return sendError(response, request, 400, "INVALID_INPUT", "Vui lòng kiểm tra thông tin đăng nhập.");

    const identifier = input.data.identifier.toLowerCase();
    const key = attemptKey(request);
    let currentAttempt = loginAttempts.get(key);
    if (currentAttempt && currentAttempt.resetAt <= Date.now()) {
      loginAttempts.delete(key);
      currentAttempt = null;
    }
    if (currentAttempt && currentAttempt.count >= MAX_LOGIN_FAILURES) {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((currentAttempt.resetAt - Date.now()) / 1000)));
      return sendError(response, request, 429, "LOGIN_RATE_LIMITED", "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.");
    }

    const { adminAccounts, adminSessions, auditEvents } = await getCollections();
    const account = await adminAccounts.findOne({ identifier, status: "ACTIVE" });
    const valid = account
      ? await verifyPassword(input.data.password, account.passwordHash)
      : await verifyPassword(input.data.password, DUMMY_PASSWORD_HASH);

    const now = new Date();
    if (!account || !valid) {
      noteFailedLogin(key);
      await auditEvents.insertOne({
        _id: randomUUID(),
        actorId: null,
        action: "login_failed",
        entityType: "admin",
        entityId: null,
        requestId: request.requestId || null,
        metadata: { identifierProvided: Boolean(identifier) },
        createdAt: now,
      });
      return sendError(response, request, 401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu chưa chính xác.");
    }

    clearLoginFailures(key);
    const sessionToken = randomBytes(32).toString("base64url");
    const sessionHash = tokenHash(sessionToken);

    await adminSessions.insertOne({
      _id: randomUUID(),
      tokenHash: sessionHash,
      adminId: account._id,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
      revokedAt: null,
    });
    await adminAccounts.updateOne({ _id: account._id }, { $set: { lastLoginAt: now } });
    await auditEvents.insertOne({
      _id: randomUUID(),
      actorId: account._id,
      action: "login_success",
      entityType: "admin",
      entityId: account._id,
      requestId: request.requestId || null,
      metadata: {},
      createdAt: now,
    });

    response.setHeader("Set-Cookie", cookieValue(sessionToken, SESSION_MAX_AGE_SECONDS, env.NODE_ENV === "production"));
    response.setHeader("Cache-Control", "no-store");
    return response.json({
      admin: {
        id: account._id,
        displayName: account.displayName,
        identifier: account.identifier,
        mustChangePassword: account.mustChangePassword,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/me", requireAdmin, (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json({ admin: request.admin });
});

router.post("/auth/change-password", requireSameOrigin, requireAdmin, async (request, response, next) => {
  try {
    const parsed = z.object({ password: passwordSchema, confirmPassword: passwordSchema }).safeParse(request.body);
    if (!parsed.success) return sendError(response, request, 400, "INVALID_INPUT", "Mật khẩu mới cần từ 12 đến 128 ký tự.");
    if (!safeEqualText(parsed.data.password, parsed.data.confirmPassword)) {
      return sendError(response, request, 400, "PASSWORD_MISMATCH", "Hai mật khẩu chưa trùng khớp.");
    }
    if (!request.admin.mustChangePassword) {
      return sendError(response, request, 409, "PASSWORD_ALREADY_CHANGED", "Tài khoản không cần đổi mật khẩu khởi tạo.");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date();
    const { adminAccounts, adminSessions } = await getCollections();
    const nextToken = randomBytes(32).toString("base64url");
    const nextHash = tokenHash(nextToken);

    await adminAccounts.updateOne(
      { _id: request.admin.id },
      { $set: { passwordHash, mustChangePassword: false, updatedAt: now } },
    );
    await adminSessions.updateMany(
      { adminId: request.admin.id, revokedAt: null },
      { $set: { revokedAt: now } },
    );
    await adminSessions.insertOne({
      _id: randomUUID(),
      tokenHash: nextHash,
      adminId: request.admin.id,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
      revokedAt: null,
    });
    await audit(request, "password_changed", "admin", request.admin.id);

    response.setHeader("Set-Cookie", cookieValue(nextToken, SESSION_MAX_AGE_SECONDS, env.NODE_ENV === "production"));
    response.setHeader("Cache-Control", "no-store");
    return response.json({ admin: { ...request.admin, mustChangePassword: false } });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/logout", requireSameOrigin, requireAdmin, async (request, response, next) => {
  try {
    const { adminSessions } = await getCollections();
    await adminSessions.updateOne({ tokenHash: request.sessionHash }, { $set: { revokedAt: new Date() } });
    await audit(request, "logout", "admin", request.admin.id);
    clearSessionCookie(response, env.NODE_ENV === "production");
    response.setHeader("Cache-Control", "no-store");
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

function requireSameOriginForWrites(request, response, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
  return requireSameOrigin(request, response, next);
}

router.use(requireAdmin, requirePasswordUpdated, requireSameOriginForWrites);

router.get("/dashboard", async (_request, response, next) => {
  try {
    const { roomListings } = await getCollections();
    const [summary] = await roomListings.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          drafts: { $sum: { $cond: [{ $eq: ["$publishStatus", "DRAFT"] }, 1, 0] } },
          published: { $sum: { $cond: [{ $eq: ["$publishStatus", "PUBLISHED"] }, 1, 0] } },
          hidden: { $sum: { $cond: [{ $eq: ["$publishStatus", "HIDDEN"] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ["$availability", "AVAILABLE"] }, 1, 0] } },
        },
      },
    ]).toArray();

    const counts = summary
      ? {
          total: summary.total,
          drafts: summary.drafts,
          published: summary.published,
          hidden: summary.hidden,
          available: summary.available,
        }
      : { total: 0, drafts: 0, published: 0, hidden: 0, available: 0 };

    response.setHeader("Cache-Control", "no-store");
    return response.json({ counts });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms", async (request, response, next) => {
  try {
    const query = z.object({
      q: z.string().trim().max(100).optional().default(""),
      publishStatus: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
      availability: z.enum(["AVAILABLE", "RENTED"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(48).default(12),
      sort: z.enum(["updatedAt_desc", "price_asc", "price_desc"]).default("updatedAt_desc"),
    }).safeParse(request.query);
    if (!query.success) return sendError(response, request, 400, "INVALID_QUERY", "Bộ lọc danh sách chưa hợp lệ.");

    const match = { deletedAt: null };
    if (query.data.q) {
      const rx = new RegExp(escapeRegex(query.data.q), "i");
      match.$or = [{ title: rx }, { ward: rx }, { publicAddress: rx }];
    }
    if (query.data.publishStatus) match.publishStatus = query.data.publishStatus;
    if (query.data.availability) match.availability = query.data.availability;

    const { roomListings } = await getCollections();
    const totalItems = await roomListings.countDocuments(match);
    const totalPages = Math.ceil(totalItems / query.data.pageSize);
    const skip = (query.data.page - 1) * query.data.pageSize;

    const pipeline = [{ $match: match }];
    if (query.data.sort === "price_asc" || query.data.sort === "price_desc") {
      pipeline.push(
        { $addFields: { priceMissing: { $cond: [{ $eq: ["$priceVnd", null] }, 1, 0] } } },
        { $sort: { priceMissing: 1, priceVnd: query.data.sort === "price_asc" ? 1 : -1, _id: 1 } },
      );
    } else {
      pipeline.push({ $sort: { updatedAt: -1, _id: 1 } });
    }
    pipeline.push(
      { $skip: skip },
      { $limit: query.data.pageSize },
      {
        $project: {
          description: 0,
          privateAddress: 0,
          contactPhone: 0,
          contactZalo: 0,
        },
      },
    );

    const docs = await roomListings.aggregate(pipeline).toArray();
    const items = docs.map((doc) => {
      const cover = sortImages(doc.images)[0];
      return toListing(doc, cover ? [toImage(cover, doc._id)] : []);
    });

    response.setHeader("Cache-Control", "no-store");
    return response.json({
      items,
      page: query.data.page,
      pageSize: query.data.pageSize,
      totalItems,
      totalPages,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/archived", async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1);
    const pageSize = Math.min(48, Math.max(1, Number(request.query.pageSize) || 12));
    const filter = { deletedAt: { $ne: null } };

    const { roomListings } = await getCollections();
    const totalItems = await roomListings.countDocuments(filter);
    const docs = await roomListings
      .find(filter)
      .sort({ deletedAt: -1, _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return response.json({
      items: docs.map((doc) => toListing(doc, [])),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/rooms", async (request, response, next) => {
  try {
    const parsed = createListingSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(response, request, 400, "INVALID_INPUT", "Dữ liệu tin chưa hợp lệ.", parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const id = randomUUID();
    const now = new Date();
    const doc = {
      _id: id,
      title: data.title,
      description: data.description,
      roomType: data.roomType,
      priceVnd: data.priceVnd,
      areaM2: data.areaM2,
      amenities: data.amenities,
      ward: data.ward,
      district: data.district,
      city: data.city,
      publicAddress: data.publicAddress,
      privateAddress: data.privateAddress,
      allowExactAddress: data.allowExactAddress,
      contactPhone: data.contactPhone,
      allowPublicPhone: data.allowPublicPhone,
      contactZalo: data.contactZalo,
      allowPublicZalo: data.allowPublicZalo,
      availability: data.availability,
      publishStatus: "DRAFT",
      publishedAt: null,
      deletedAt: null,
      deletedBy: null,
      createdBy: request.admin.id,
      updatedBy: request.admin.id,
      version: 1,
      images: [],
      createdAt: now,
      updatedAt: now,
    };

    const { roomListings } = await getCollections();
    await roomListings.insertOne(doc);
    await audit(request, "listing_created", "room_listing", id);
    return response.status(201).json({ item: toListing(doc, []) });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/:roomId", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const doc = await getListing(request.params.roomId);
    if (!doc) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    return response.json({ item: toListing(doc) });
  } catch (error) {
    return next(error);
  }
});

router.put("/rooms/:roomId", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const parsed = editableListingSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(response, request, 400, "INVALID_INPUT", "Dữ liệu tin chưa hợp lệ.", parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const current = await getListing(request.params.roomId);
    if (!current) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");

    if (current.publishStatus === "PUBLISHED") {
      const issues = validatePublishFields({ ...current, ...data }, (current.images || []).length);
      if (Object.keys(issues).length) {
        return sendError(response, request, 422, "PUBLISH_VALIDATION_FAILED", "Tin đã xuất bản cần tiếp tục đáp ứng các điều kiện công khai.", issues);
      }
    }

    const now = new Date();
    const { roomListings } = await getCollections();
    const filter = { _id: request.params.roomId, deletedAt: null };
    if (data.version !== undefined) filter.version = data.version;

    const updated = await roomListings.findOneAndUpdate(
      filter,
      {
        $set: {
          title: data.title,
          description: data.description,
          roomType: data.roomType,
          priceVnd: data.priceVnd,
          areaM2: data.areaM2,
          amenities: data.amenities,
          ward: data.ward,
          district: data.district,
          city: data.city,
          publicAddress: data.publicAddress,
          privateAddress: data.privateAddress,
          allowExactAddress: data.allowExactAddress,
          contactPhone: data.contactPhone,
          allowPublicPhone: data.allowPublicPhone,
          contactZalo: data.contactZalo,
          allowPublicZalo: data.allowPublicZalo,
          updatedBy: request.admin.id,
          updatedAt: now,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );

    if (!updated) {
      const stillExists = data.version !== undefined ? await getListing(request.params.roomId) : null;
      if (stillExists) {
        return sendError(response, request, 409, "CONCURRENT_UPDATE", "Dữ liệu tin vừa thay đổi ở phiên khác. Vui lòng tải lại trước khi lưu.");
      }
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    }
    await audit(request, "listing_updated", "room_listing", request.params.roomId);
    return response.json({ item: toListing(updated) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/rooms/:roomId/availability", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const parsed = z.object({ availability: z.enum(["AVAILABLE", "RENTED"]) }).safeParse(request.body);
    if (!parsed.success) return sendError(response, request, 400, "INVALID_INPUT", "Tình trạng phòng chưa hợp lệ.");

    const { roomListings } = await getCollections();
    const updated = await roomListings.findOneAndUpdate(
      { _id: request.params.roomId, deletedAt: null },
      {
        $set: {
          availability: parsed.data.availability,
          updatedAt: new Date(),
          updatedBy: request.admin.id,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );

    if (!updated) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    await audit(request, "availability_changed", "room_listing", request.params.roomId, {
      availability: parsed.data.availability,
    });
    return response.json({ item: toListing(updated, []) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/rooms/:roomId/publish-status", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const parsed = z.object({ publishStatus: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]) }).safeParse(request.body);
    if (!parsed.success) return sendError(response, request, 400, "INVALID_INPUT", "Trạng thái tin chưa hợp lệ.");

    const current = await getListing(request.params.roomId);
    if (!current) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");

    if (parsed.data.publishStatus === "PUBLISHED") {
      const issues = validatePublishFields(current, (current.images || []).length);
      if (Object.keys(issues).length) {
        return sendError(response, request, 422, "PUBLISH_VALIDATION_FAILED", "Tin chưa đủ điều kiện xuất bản. Hãy hoàn thiện các mục được đánh dấu.", issues);
      }
    }

    const now = new Date();
    const { roomListings } = await getCollections();
    const updated = await roomListings.findOneAndUpdate(
      { _id: request.params.roomId, deletedAt: null },
      {
        $set: {
          publishStatus: parsed.data.publishStatus,
          ...(parsed.data.publishStatus === "PUBLISHED" ? { publishedAt: now } : {}),
          updatedAt: now,
          updatedBy: request.admin.id,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );

    await audit(request, "publish_status_changed", "room_listing", current._id, {
      publishStatus: parsed.data.publishStatus,
    });
    return response.json({ item: toListing(updated, []) });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/:roomId/preview", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const doc = await getListing(request.params.roomId);
    if (!doc) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    response.setHeader("Cache-Control", "no-store");
    return response.json({ item: toListing(doc), previewOnly: true });
  } catch (error) {
    return next(error);
  }
});

router.delete("/rooms/:roomId", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const now = new Date();
    const { roomListings } = await getCollections();
    const result = await roomListings.updateOne(
      { _id: request.params.roomId, deletedAt: null },
      {
        $set: {
          deletedAt: now,
          deletedBy: request.admin.id,
          updatedAt: now,
          updatedBy: request.admin.id,
          publishStatus: "HIDDEN",
        },
        $inc: { version: 1 },
      },
    );
    if (!result.matchedCount) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    await audit(request, "listing_soft_deleted", "room_listing", request.params.roomId);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.post("/rooms/:roomId/restore", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin lưu trữ.");
    const { roomListings } = await getCollections();
    const updated = await roomListings.findOneAndUpdate(
      { _id: request.params.roomId, deletedAt: { $ne: null } },
      {
        $set: {
          deletedAt: null,
          deletedBy: null,
          publishStatus: "DRAFT",
          updatedAt: new Date(),
          updatedBy: request.admin.id,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );
    if (!updated) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin lưu trữ.");
    await audit(request, "listing_restored", "room_listing", request.params.roomId);
    return response.json({ item: toListing(updated, []) });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/rooms/:roomId/images",
  requireAdmin,
  requirePasswordUpdated,
  requireSameOriginForWrites,
  require("express").raw({ type: "multipart/form-data", limit: "11mb" }),
  async (request, response, next) => {
    let savedPath = "";
    try {
      if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
      const { fileBuffer, mimeType, originalName } = parseSingleMultipartFile(request);

      const current = await getListing(request.params.roomId);
      if (!current) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
      if ((current.images || []).length >= 15) {
        return sendError(response, request, 413, "IMAGE_LIMIT_REACHED", "Một tin chỉ được có tối đa 15 ảnh.");
      }

      const id = randomUUID();
      const storageKey = `${id}.${imageExtension(mimeType)}`;
      const now = new Date();
      savedPath = await imageStorage.write({ listingId: request.params.roomId, storageKey, buffer: fileBuffer });

      const { roomListings } = await getCollections();
      const updated = await roomListings.findOneAndUpdate(
        {
          _id: request.params.roomId,
          deletedAt: null,
          "images.14": { $exists: false },
        },
        [
          {
            $set: {
              images: {
                $concatArrays: [
                  { $ifNull: ["$images", []] },
                  [
                    {
                      id,
                      storageKey,
                      mimeType,
                      byteSize: fileBuffer.length,
                      originalName,
                      altText: "",
                      sortOrder: { $size: { $ifNull: ["$images", []] } },
                      isCover: { $eq: [{ $size: { $ifNull: ["$images", []] } }, 0] },
                      createdAt: now,
                    },
                  ],
                ],
              },
              updatedAt: now,
              updatedBy: request.admin.id,
              version: { $add: [{ $ifNull: ["$version", 1] }, 1] },
            },
          },
        ],
        { returnDocument: "after" },
      );

      if (!updated) {
        await imageStorage.remove({ listingId: request.params.roomId, storageKey }).catch(() => {});
        const stillExists = await getListing(request.params.roomId);
        if (!stillExists) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
        return sendError(response, request, 413, "IMAGE_LIMIT_REACHED", "Một tin chỉ được có tối đa 15 ảnh.");
      }

      const insertedImage = (updated.images || []).find((img) => img.id === id);
      await audit(request, "image_uploaded", "room_image", id, {
        listingId: request.params.roomId,
        mimeType,
        byteSize: fileBuffer.length,
      });
      return response.status(201).json({ item: toImage(insertedImage, request.params.roomId) });
    } catch (error) {
      if (savedPath) {
        await imageStorage.remove({ listingId: request.params.roomId, storageKey: path.basename(savedPath) }).catch(() => {});
      }
      return next(error);
    }
  },
);

router.get("/rooms/:roomId/images/:imageId/file", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId) || !UUID.test(request.params.imageId)) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");
    }
    const { roomListings } = await getCollections();
    const doc = await roomListings.findOne(
      { _id: request.params.roomId, "images.id": request.params.imageId },
      { projection: { images: { $elemMatch: { id: request.params.imageId } } } },
    );
    const image = doc?.images?.[0];
    if (!image) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");

    const filePath = imageStorage.getPath({ listingId: request.params.roomId, storageKey: image.storageKey });
    response.setHeader("Content-Type", image.mimeType);
    response.setHeader("Content-Disposition", 'inline; filename="room-image"');
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    return response.sendFile(filePath, (error) => {
      if (error && !response.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/rooms/:roomId/images/order", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");
    const parsed = z.object({ imageIds: z.array(z.string().regex(UUID)).min(1).max(15) }).safeParse(request.body);
    if (!parsed.success || new Set(parsed.data?.imageIds || []).size !== parsed.data?.imageIds.length) {
      return sendError(response, request, 400, "INVALID_INPUT", "Thứ tự ảnh chưa hợp lệ.");
    }

    const current = await getListing(request.params.roomId);
    if (!current) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");

    const existingImages = current.images || [];
    const byId = new Map(existingImages.map((img) => [img.id, img]));
    if (existingImages.length !== parsed.data.imageIds.length || !parsed.data.imageIds.every((id) => byId.has(id))) {
      return sendError(response, request, 400, "IMAGE_SET_MISMATCH", "Danh sách ảnh đã thay đổi. Hãy tải lại trước khi sắp xếp.");
    }

    const reordered = parsed.data.imageIds.map((id, index) => ({
      ...byId.get(id),
      sortOrder: index,
      isCover: index === 0,
    }));

    const { roomListings } = await getCollections();
    const updated = await roomListings.findOneAndUpdate(
      { _id: request.params.roomId, deletedAt: null, version: current.version },
      {
        $set: {
          images: reordered,
          updatedAt: new Date(),
          updatedBy: request.admin.id,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );

    if (!updated) {
      return sendError(response, request, 400, "IMAGE_SET_MISMATCH", "Danh sách ảnh đã thay đổi. Hãy tải lại trước khi sắp xếp.");
    }

    await audit(request, "images_reordered", "room_listing", request.params.roomId);
    return response.json({
      items: sortImages(updated.images).map((img) => toImage(img, request.params.roomId)),
      version: updated.version,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/rooms/:roomId/images/:imageId", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId) || !UUID.test(request.params.imageId)) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");
    }

    const current = await getListing(request.params.roomId);
    if (!current) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy tin phòng.");

    const existingImages = sortImages(current.images);
    const removed = existingImages.find((img) => img.id === request.params.imageId);
    if (!removed) return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");

    if (current.publishStatus === "PUBLISHED" && existingImages.length <= 1) {
      return sendError(
        response,
        request,
        422,
        "PUBLISH_VALIDATION_FAILED",
        "Tin đang xuất bản cần có ít nhất một ảnh. Hãy ẩn tin trước khi gỡ ảnh cuối cùng.",
        { images: "Tin đang xuất bản cần có ít nhất một ảnh." },
      );
    }

    const remaining = existingImages
      .filter((img) => img.id !== request.params.imageId)
      .map((img, index) => ({
        ...img,
        sortOrder: index,
        isCover: removed.isCover ? index === 0 : Boolean(img.isCover),
      }));

    if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
      remaining[0].isCover = true;
    }

    const { roomListings } = await getCollections();
    const updated = await roomListings.findOneAndUpdate(
      { _id: request.params.roomId, deletedAt: null, version: current.version },
      {
        $set: {
          images: remaining,
          updatedAt: new Date(),
          updatedBy: request.admin.id,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" },
    );

    if (!updated) {
      return sendError(response, request, 409, "CONCURRENT_UPDATE", "Dữ liệu tin vừa thay đổi. Vui lòng thử lại.");
    }

    await imageStorage.remove({ listingId: request.params.roomId, storageKey: removed.storageKey }).catch(() => {});
    await audit(request, "image_removed", "room_image", removed.id, { listingId: request.params.roomId });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = { adminRouter: router };
