const { Router } = require("express");
const { z } = require("zod");
const { getCollections } = require("../db/mongo");
const { env } = require("../config/env");
const { imageStorage } = require("../storage/image-storage");

const router = Router();

const ROOM_TYPES = ["Phòng trọ", "Phòng có gác", "Phòng studio", "Căn hộ mini", "Phòng ở ghép"];
const BINH_THANH_2026_WARDS = [
  "Phường Gia Định",
  "Phường Bình Thạnh",
  "Phường Bình Lợi Trung",
  "Phường Thạnh Mỹ Tây",
  "Phường Bình Quới",
];
const AMENITIES = [
  "Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng",
  "Nhà vệ sinh riêng", "Ban công", "Gác lửng", "Wifi", "Chỗ để xe", "Cửa sổ",
];
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

function sortImages(images = []) {
  return [...images].sort((a, b) => {
    if (Boolean(a.isCover) !== Boolean(b.isCover)) return a.isCover ? -1 : 1;
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

const emptyToUndefined = (value) => (value === "" || value === null || value === undefined ? undefined : value);

function parseAmenitiesQuery(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const rawList = Array.isArray(value) ? value : [value];
  const split = rawList
    .flatMap((entry) => String(entry).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  if (!split.length) return undefined;
  return [...new Set(split)];
}

const querySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  ward: z.string().trim().max(120).optional().default(""),
  roomType: z.preprocess(emptyToUndefined, z.enum(ROOM_TYPES).optional()),
  amenities: z.preprocess(parseAmenitiesQuery, z.array(z.enum(AMENITIES)).max(AMENITIES.length).optional().default([])),
  minPriceVnd: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional()),
  maxPriceVnd: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional()),
  minAreaM2: z.preprocess(emptyToUndefined, z.coerce.number().positive().max(100000).optional()),
  maxAreaM2: z.preprocess(emptyToUndefined, z.coerce.number().positive().max(100000).optional()),
  availability: z.preprocess(emptyToUndefined, z.enum(["AVAILABLE", "RENTED"]).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(48).default(12)),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["available_first_publishedAt_desc", "publishedAt_desc", "price_asc", "price_desc"]).default("available_first_publishedAt_desc"),
  ),
});

function toPublicListItem(doc) {
  const sorted = sortImages(doc.images);
  const coverImage = sorted[0] || null;
  return {
    id: doc._id,
    title: doc.title,
    roomType: doc.roomType,
    priceVnd: doc.priceVnd === null || doc.priceVnd === undefined ? null : Number(doc.priceVnd),
    areaM2: doc.areaM2 === null || doc.areaM2 === undefined ? null : Number(doc.areaM2),
    amenities: doc.amenities || [],
    ward: doc.ward,
    district: doc.district,
    city: doc.city,
    publicAddress: doc.publicAddress,
    availability: doc.availability,
    publishedAt: doc.publishedAt || null,
    updatedAt: doc.updatedAt,
    coverImageUrl: coverImage ? `/api/v1/public/rooms/${doc._id}/images/${coverImage.id}/file` : null,
  };
}

function toPublicDetailItem(doc) {
  const sorted = sortImages(doc.images);
  const locationParts = [doc.publicAddress, doc.ward, doc.district, doc.city].filter(Boolean);
  const exact = (doc.privateAddress || "").trim();
  const displayAddress = doc.allowExactAddress && exact ? exact : locationParts.join(", ");

  const contact = {};
  if (doc.allowPublicPhone && (doc.contactPhone || "").trim()) {
    contact.phone = doc.contactPhone.trim();
  }
  if (doc.allowPublicZalo && (doc.contactZalo || "").trim()) {
    contact.zalo = doc.contactZalo.trim();
  }

  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    roomType: doc.roomType,
    priceVnd: Number(doc.priceVnd),
    areaM2: Number(doc.areaM2),
    amenities: doc.amenities || [],
    ward: doc.ward,
    district: doc.district,
    city: doc.city,
    publicAddress: doc.publicAddress,
    displayAddress,
    ...(doc.allowExactAddress && exact ? { exactAddress: exact } : {}),
    availability: doc.availability,
    publishedAt: doc.publishedAt || null,
    updatedAt: doc.updatedAt,
    contact,
    images: sorted.map((img) => ({
      id: img.id,
      mimeType: img.mimeType,
      altText: img.altText || "",
      sortOrder: img.sortOrder,
      isCover: Boolean(img.isCover),
      url: `/api/v1/public/rooms/${doc._id}/images/${img.id}/file`,
    })),
  };
}

router.get("/categories", async (_request, response, next) => {
  try {
    const { roomListings } = await getCollections();
    const wardsRaw = await roomListings.distinct("ward", {
      publishStatus: "PUBLISHED",
      deletedAt: null,
      ward: { $ne: "" },
    });
    const wards = wardsRaw
      .filter((item) => typeof item === "string" && item.trim())
      .sort((a, b) => a.localeCompare(b, "vi"));

    response.setHeader("Cache-Control", "public, max-age=60");
    return response.json({
      roomTypes: ROOM_TYPES,
      amenities: AMENITIES,
      wards,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms", async (request, response, next) => {
  try {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(response, request, 400, "INVALID_QUERY", "Thông số tìm kiếm hoặc bộ lọc chưa hợp lệ.", parsed.error.flatten().fieldErrors);
    }

    const filter = parsed.data;
    const rangeErrors = {};
    if (filter.minPriceVnd !== undefined && filter.maxPriceVnd !== undefined && filter.minPriceVnd > filter.maxPriceVnd) {
      rangeErrors.minPriceVnd = "Giá tối thiểu không được lớn hơn giá tối đa.";
    }
    if (filter.minAreaM2 !== undefined && filter.maxAreaM2 !== undefined && filter.minAreaM2 > filter.maxAreaM2) {
      rangeErrors.minAreaM2 = "Diện tích tối thiểu không được lớn hơn diện tích tối đa.";
    }
    if (Object.keys(rangeErrors).length) {
      return sendError(response, request, 400, "INVALID_RANGE", "Giá trị tối thiểu không được lớn hơn giá trị tối đa.", rangeErrors);
    }

    const match = { publishStatus: "PUBLISHED", deletedAt: null };
    if (filter.q) {
      const searchRegex = new RegExp(escapeRegex(filter.q), "i");
      match.$or = [
        { title: searchRegex },
        { ward: searchRegex },
        { publicAddress: searchRegex },
      ];
    }
    if (filter.ward) {
      const normalizedWard = filter.ward.toLocaleLowerCase("vi");
      const canonicalWard = BINH_THANH_2026_WARDS.find((w) => w.toLocaleLowerCase("vi") === normalizedWard);
      match.ward = canonicalWard || new RegExp(`^${escapeRegex(filter.ward)}$`, "i");
    }
    if (filter.roomType) {
      match.roomType = filter.roomType;
    }
    if (filter.amenities.length > 0) {
      match.amenities = { $all: filter.amenities };
    }
    if (filter.minPriceVnd !== undefined || filter.maxPriceVnd !== undefined) {
      match.priceVnd = {};
      if (filter.minPriceVnd !== undefined) match.priceVnd.$gte = filter.minPriceVnd;
      if (filter.maxPriceVnd !== undefined) match.priceVnd.$lte = filter.maxPriceVnd;
    }
    if (filter.minAreaM2 !== undefined || filter.maxAreaM2 !== undefined) {
      match.areaM2 = {};
      if (filter.minAreaM2 !== undefined) match.areaM2.$gte = filter.minAreaM2;
      if (filter.maxAreaM2 !== undefined) match.areaM2.$lte = filter.maxAreaM2;
    }
    if (filter.availability) {
      match.availability = filter.availability;
    }

    const { roomListings } = await getCollections();
    const totalItems = await roomListings.countDocuments(match);
    const totalPages = Math.ceil(totalItems / filter.pageSize);
    const skip = (filter.page - 1) * filter.pageSize;

    const pipeline = [{ $match: match }];
    switch (filter.sort) {
      case "publishedAt_desc":
        pipeline.push({ $sort: { publishedAt: -1, updatedAt: -1, _id: 1 } });
        break;
      case "price_asc":
        pipeline.push({ $sort: { priceVnd: 1, publishedAt: -1, _id: 1 } });
        break;
      case "price_desc":
        pipeline.push({ $sort: { priceVnd: -1, publishedAt: -1, _id: 1 } });
        break;
      default:
        pipeline.push(
          { $addFields: { availabilityRank: { $cond: [{ $eq: ["$availability", "AVAILABLE"] }, 0, 1] } } },
          { $sort: { availabilityRank: 1, publishedAt: -1, updatedAt: -1, _id: 1 } },
        );
        break;
    }

    pipeline.push(
      { $skip: skip },
      { $limit: filter.pageSize },
      {
        $project: {
          privateAddress: 0,
          contactPhone: 0,
          contactZalo: 0,
          description: 0,
        },
      },
    );

    const docs = await roomListings.aggregate(pipeline).toArray();

    response.setHeader("Cache-Control", "public, max-age=30");
    return response.json({
      items: docs.map(toPublicListItem),
      page: filter.page,
      pageSize: filter.pageSize,
      totalItems,
      totalPages,
      hasNext: filter.page < totalPages,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/:roomId", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId)) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy thông tin phòng trọ.");
    }

    const { roomListings } = await getCollections();
    const doc = await roomListings.findOne({
      _id: request.params.roomId,
      publishStatus: "PUBLISHED",
      deletedAt: null,
    });

    if (!doc) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy thông tin phòng trọ.");
    }

    response.setHeader("Cache-Control", "public, max-age=30");
    return response.json({ item: toPublicDetailItem(doc) });
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/:roomId/images/:imageId/file", async (request, response, next) => {
  try {
    if (!UUID.test(request.params.roomId) || !UUID.test(request.params.imageId)) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");
    }

    const { roomListings } = await getCollections();
    const doc = await roomListings.findOne(
      {
        _id: request.params.roomId,
        publishStatus: "PUBLISHED",
        deletedAt: null,
        "images.id": request.params.imageId,
      },
      { projection: { updatedAt: 1, images: { $elemMatch: { id: request.params.imageId } } } },
    );

    const image = doc?.images?.[0];
    if (!image) {
      return sendError(response, request, 404, "NOT_FOUND", "Không tìm thấy ảnh.");
    }

    const updatedMs = new Date(doc.updatedAt || image.createdAt || 0).getTime();
    const etag = `W/"${image.id}-${image.sizeBytes || 0}-${Number.isFinite(updatedMs) ? updatedMs : 0}"`;
    response.setHeader("ETag", etag);
    if (Number.isFinite(updatedMs) && updatedMs > 0) {
      response.setHeader("Last-Modified", new Date(updatedMs).toUTCString());
    }
    response.setHeader("Cache-Control", "public, max-age=60");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.headers["if-none-match"] === etag) {
      return response.status(304).end();
    }

    return imageStorage.sendHttpResponse({
      response,
      listingId: request.params.roomId,
      image,
      optimizeForPublic: true,
      next,
    });
  } catch (error) {
    return next(error);
  }
});

const chatAttempts = new Map();
const CHAT_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHAT_PER_WINDOW = 20;

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Vui lòng nhập câu hỏi.").max(400),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().trim().min(1).max(600),
      }),
    )
    .max(8)
    .optional()
    .default([]),
}).strict();

function foldVi(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function checkChatRateLimit(ipKey) {
  const now = Date.now();
  if (chatAttempts.size > 2000) {
    for (const [k, v] of chatAttempts) {
      if (v.resetAt <= now) chatAttempts.delete(k);
    }
  }
  const entry = chatAttempts.get(ipKey);
  if (!entry || entry.resetAt <= now) {
    chatAttempts.set(ipKey, { count: 1, resetAt: now + CHAT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_CHAT_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

function parseChatIntent(foldedMsg) {
  let minBudget = null;
  let maxBudget = null;

  // Nhận diện giá: 3tr9, 3.5tr, 3,5 triệu, 4tr, 4.200.000, 3800k
  const priceCandidates = [];
  for (const m of foldedMsg.matchAll(/(\d{1,2})\s*(?:tr|trieu)(\d{1,3})(?![a-z0-9])/g)) {
    const minor = m[2].length === 1 ? Number(m[2]) * 100_000 : m[2].length === 2 ? Number(m[2]) * 10_000 : Number(m[2]) * 1_000;
    priceCandidates.push(Number(m[1]) * 1_000_000 + minor);
  }
  for (const m of foldedMsg.matchAll(/(\d{1,2}[.,]\d{1,2})\s*(?:tr|trieu|cu)(?![a-z0-9])/g)) {
    priceCandidates.push(Math.round(parseFloat(m[1].replace(",", ".")) * 1_000_000));
  }
  for (const m of foldedMsg.matchAll(/(\d{1,2})\s*(?:tr|trieu|cu)(?![a-z0-9\s]*\d)/g)) {
    priceCandidates.push(Number(m[1]) * 1_000_000);
  }
  for (const m of foldedMsg.matchAll(/(\d{1,2}[.,]\d{3}[.,]\d{3})\s*(?:d|vnd)?(?![a-z0-9])/g)) {
    priceCandidates.push(Number(m[1].replace(/[.,]/g, "")));
  }
  for (const m of foldedMsg.matchAll(/(\d{3,4})\s*k(?![a-z0-9])/g)) {
    priceCandidates.push(Number(m[1]) * 1_000);
  }

  const validPrices = priceCandidates.filter((v) => v >= 500_000 && v <= 50_000_000);
  if (validPrices.length >= 2 && (foldedMsg.includes("-") || foldedMsg.includes("den") || foldedMsg.includes("toi"))) {
    minBudget = Math.min(validPrices[0], validPrices[1]);
    maxBudget = Math.max(validPrices[0], validPrices[1]);
  } else if (validPrices.length >= 1) {
    const val = validPrices[0];
    if (/(?:duoi|<=|<|nho hon|toi da|khong qua)/.test(foldedMsg)) {
      maxBudget = val;
    } else if (/(?:tren|>=|>|tu\s+\d)/.test(foldedMsg)) {
      minBudget = val;
    } else {
      minBudget = Math.max(0, val - 600_000);
      maxBudget = val + 500_000;
    }
  }

  let targetWard = "";
  if (foldedMsg.includes("gia dinh") || foldedMsg.includes("ba chieu") || foldedMsg.includes("nguyen cuu van") || foldedMsg.includes("vu tung")) {
    targetWard = "Phường Gia Định";
  } else if (
    foldedMsg.includes("thanh my tay") ||
    foldedMsg.includes("hang xanh") ||
    foldedMsg.includes("hutech") ||
    foldedMsg.includes("ngoai thuong") ||
    foldedMsg.includes("landmark") ||
    foldedMsg.includes("ung van khiem") ||
    foldedMsg.includes("nguyen gia tri") ||
    foldedMsg.includes("vo oanh")
  ) {
    targetWard = "Phường Thạnh Mỹ Tây";
  } else if (foldedMsg.includes("binh loi trung") || foldedMsg.includes("van lang") || foldedMsg.includes("binh loi")) {
    targetWard = "Phường Bình Lợi Trung";
  } else if (foldedMsg.includes("binh quoi") || foldedMsg.includes("thanh da")) {
    targetWard = "Phường Bình Quới";
  } else if (
    foldedMsg.includes("dinh bo linh") ||
    foldedMsg.includes("nguyen xi") ||
    foldedMsg.includes("bui dinh tuy") ||
    foldedMsg.includes("bx mien dong") ||
    foldedMsg.includes("hoc vien can bo") ||
    foldedMsg.includes("chu van an") ||
    /phuong\s*binh thanh/.test(foldedMsg)
  ) {
    targetWard = "Phường Bình Thạnh";
  }

  // Các cụm địa điểm / tên đường cụ thể khách hay nhắc
  const locationKeywords = [
    "ung van khiem",
    "uvk",
    "bui dinh tuy",
    "xo viet nghe tinh",
    "dinh bo linh",
    "nguyen xi",
    "bach dang",
    "chu van an",
    "nguyen cuu van",
    "hang xanh",
    "hutech",
    "ngoai thuong",
    "uth",
    "gtvt",
    "van lang",
    "hoc vien can bo",
    "thanh da",
    "binh quoi",
    "no trang long",
    "le quang dinh",
    "phan van tri",
    "dien bien phu",
    "phan dang luu",
    "quan 1",
    "q1",
  ].filter((kw) => foldedMsg.includes(kw));

  const amenityHints = AMENITIES.filter((item) => {
    const f = foldVi(item);
    if (f === "ban cong" && (foldedMsg.includes("ban cong") || foldedMsg.includes("bancol"))) return true;
    if (f === "nha ve sinh rieng" && (foldedMsg.includes("wc") || foldedMsg.includes("ve sinh"))) return true;
    if (f === "cho de xe" && (foldedMsg.includes("cho de xe") || foldedMsg.includes("nha xe") || foldedMsg.includes("bai xe"))) return true;
    if (f === "bep rieng" && (foldedMsg.includes("bep") || foldedMsg.includes("nau an"))) return true;
    if ((f === "giuong" || f === "tu quan ao") && (foldedMsg.includes("noi that") || foldedMsg.includes("full nt"))) return true;
    return foldedMsg.includes(f);
  });

  let roomTypeHint = "";
  if (foldedMsg.includes("studio")) roomTypeHint = "Phòng studio";
  else if (foldedMsg.includes("can ho") || foldedMsg.includes("mini") || foldedMsg.includes("chdv")) roomTypeHint = "Căn hộ mini";
  else if (foldedMsg.includes("o ghep")) roomTypeHint = "Phòng ở ghép";
  else if (foldedMsg.includes("gac")) roomTypeHint = "Phòng có gác";

  const featureKeywords = [];
  if (foldedMsg.includes("khong chung chu") || foldedMsg.includes("ko chung chu")) featureKeywords.push("khong chung chu");
  if (foldedMsg.includes("van tay")) featureKeywords.push("van tay");
  if (foldedMsg.includes("tu do")) featureKeywords.push("tu do");
  if (foldedMsg.includes("thu cung") || foldedMsg.includes("nuoi meo") || foldedMsg.includes("nuoi cho") || foldedMsg.includes("pet")) {
    featureKeywords.push("thu cung");
  }

  return {
    minBudget,
    maxBudget,
    targetWard,
    locationKeywords,
    amenityHints,
    roomTypeHint,
    featureKeywords,
    preferCheap: /(?:re nhat|gia re|thap nhat|tiet kiem)/.test(foldedMsg),
    preferLarge: /(?:rong nhat|lon nhat)/.test(foldedMsg),
  };
}

function evaluateRoomsForChat(docs, message) {
  const foldedMsg = foldVi(message);
  const intent = parseChatIntent(foldedMsg);
  const available = docs.filter((d) => d.availability === "AVAILABLE");

  const hasExplicitCriteria = Boolean(
    intent.minBudget ||
      intent.maxBudget ||
      intent.targetWard ||
      intent.locationKeywords.length ||
      intent.amenityHints.length ||
      intent.roomTypeHint ||
      intent.featureKeywords.length,
  );

  const evaluated = available.map((doc) => {
    const price = Number(doc.priceVnd || 0);
    const area = Number(doc.areaM2 || 0);
    const locText = foldVi(`${doc.title} ${doc.publicAddress} ${doc.ward}`);
    const fullText = foldVi(`${doc.title} ${doc.publicAddress} ${doc.ward} ${doc.roomType} ${(doc.amenities || []).join(" ")} ${doc.description}`);

    let matchedCount = 0;
    let failedCount = 0;
    let score = 0;

    if (intent.maxBudget !== null) {
      if (price > 0 && price <= intent.maxBudget) {
        matchedCount += 1;
        score += 30;
      } else {
        failedCount += 1;
        score -= 40;
      }
    }
    if (intent.minBudget !== null) {
      if (price > 0 && price >= intent.minBudget) {
        matchedCount += 1;
        score += 20;
      } else {
        failedCount += 1;
        score -= 35;
      }
    }
    if (intent.locationKeywords.length) {
      const locMatched = intent.locationKeywords.some((kw) => fullText.includes(kw));
      if (locMatched) {
        matchedCount += 1;
        score += 40;
      } else {
        failedCount += 1;
        score += intent.targetWard && doc.ward === intent.targetWard ? -10 : -35;
      }
    } else if (intent.targetWard) {
      if (doc.ward === intent.targetWard || locText.includes(foldVi(intent.targetWard))) {
        matchedCount += 1;
        score += 30;
      } else {
        failedCount += 1;
        score -= 30;
      }
    }

    if (intent.roomTypeHint) {
      const hasGac = doc.roomType === "Phòng có gác" || (doc.amenities || []).includes("Gác lửng") || fullText.includes("gac");
      const matchedType = intent.roomTypeHint === "Phòng có gác" ? hasGac : doc.roomType === intent.roomTypeHint;
      if (matchedType) {
        matchedCount += 1;
        score += 25;
      } else {
        failedCount += 1;
        score -= 30;
      }
    }

    for (const am of intent.amenityHints) {
      if ((doc.amenities || []).includes(am)) {
        matchedCount += 1;
        score += 18;
      } else {
        failedCount += 1;
        score -= 22;
      }
    }

    for (const fk of intent.featureKeywords) {
      if (fullText.includes(fk)) {
        matchedCount += 1;
        score += 18;
      } else {
        failedCount += 1;
        score -= 20;
      }
    }

    if (intent.preferCheap && price > 0) {
      score += Math.max(0, 20 - Math.round(price / 500_000));
    }
    if (intent.preferLarge && area > 0) {
      score += Math.min(20, Math.round(area / 2));
    }

    return { doc, matchedCount, failedCount, score };
  });

  evaluated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (intent.preferCheap) return Number(a.doc.priceVnd || 0) - Number(b.doc.priceVnd || 0);
    if (intent.preferLarge) return Number(b.doc.areaM2 || 0) - Number(a.doc.areaM2 || 0);
    return new Date(b.doc.publishedAt || 0).getTime() - new Date(a.doc.publishedAt || 0).getTime();
  });

  const exactMatches = evaluated.filter((item) => item.failedCount === 0 && (!hasExplicitCriteria || item.matchedCount > 0));
  const closestMatches = evaluated.filter((item) => item.matchedCount > 0);

  return { intent, hasExplicitCriteria, evaluated, exactMatches, closestMatches, availableCount: available.length };
}

function buildFallbackReply(docs, evaluation, message) {
  const availableDocs = docs.filter((d) => d.availability === "AVAILABLE");
  if (!availableDocs.length) {
    return {
      reply: "Dạ chào bạn! Hiện tại các phòng đăng trên hệ thống đều đã có khách thuê hết rồi ạ. Bạn quay lại sau hoặc nhắn Zalo chủ trọ để được báo ngay khi có phòng trống mới nha!",
      rooms: [],
    };
  }

  const folded = foldVi(message);
  const isGreetingOnly = /^(?:hi|hello|alo|chao|xin chao|bot oi|ad oi|tu van|help|cam on|thank)[!.,\s]*$/.test(folded);
  const isContactQuestion = /(?:lien he|sdt|so dien thoai|zalo|xem phong|dat lich|dia chi)/.test(folded) && !evaluation.hasExplicitCriteria;

  if (isGreetingOnly) {
    const prices = availableDocs.map((d) => Number(d.priceVnd || 0)).filter(Boolean);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const featured = evaluation.evaluated.slice(0, 3).map((item) => item.doc);
    return {
      reply: `Chào bạn nè! Mình là Bot tư vấn của Phòng trọ Ngọc Toàn. Hiện bên mình đang có ${availableDocs.length} phòng trống tại Bình Thạnh (giá từ ${(minP / 1_000_000).toLocaleString("vi-VN")} – ${(maxP / 1_000_000).toLocaleString("vi-VN")} triệu/tháng). Bạn thích tầm giá nào hay gần khu vực nào cứ nhắn mình lọc giúp nha!`,
      rooms: featured.map(toPublicListItem),
    };
  }

  if (isContactQuestion) {
    const contactDoc = availableDocs.find((d) => (d.allowPublicPhone && d.contactPhone) || (d.allowPublicZalo && d.contactZalo));
    const contactInfo = contactDoc
      ? [
          contactDoc.allowPublicPhone && contactDoc.contactPhone ? `SĐT: ${contactDoc.contactPhone}` : "",
          contactDoc.allowPublicZalo && contactDoc.contactZalo ? `Zalo: ${contactDoc.contactZalo}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
    return {
      reply: contactInfo
        ? `Để đặt lịch xem phòng nhanh nhất, bạn có thể liên hệ trực tiếp chủ trọ qua ${contactInfo}, hoặc bấm vào từng phòng để nhấn nút Gọi / Nhắn Zalo nhé!`
        : "Bạn hãy bấm vào căn phòng bạn thích rồi nhấn nút Gọi điện hoặc Nhắn Zalo để hẹn giờ xem phòng trực tiếp nha!",
      rooms: [],
    };
  }

  if (evaluation.exactMatches.length > 0) {
    const picks = evaluation.exactMatches.slice(0, 3).map((item) => item.doc);
    const summaryLines = picks.map(
      (r) => `• ${r.title} (${(Number(r.priceVnd || 0) / 1_000_000).toLocaleString("vi-VN")}tr · ${r.areaM2}m² · ${r.ward})`,
    );
    return {
      reply: `Bot tư vấn tìm thấy ${evaluation.exactMatches.length} phòng còn trống khớp đúng yêu cầu của bạn nè:\n${summaryLines.join("\n")}\nBạn chạm vào thẻ phòng bên dưới để xem hình thật & gọi/nhắn Zalo nhé!`,
      rooms: picks.map(toPublicListItem),
    };
  }

  if (evaluation.closestMatches.length > 0) {
    const picks = evaluation.closestMatches.slice(0, 2).map((item) => item.doc);
    return {
      reply: "Hic, hiện chưa có phòng nào khớp trọn vẹn 100% các tiêu chí bạn cần ạ. Mình gợi ý 2 căn gần nhất đang còn trống để bạn tham khảo thử nha:",
      rooms: picks.map(toPublicListItem),
    };
  }

  return {
    reply: `Hiện chưa có phòng nào phù hợp tiêu chí này trong ${availableDocs.length} phòng trống của bên mình ạ. Bạn thử nói rõ hơn tầm giá (vd: dưới 4tr) hoặc khu vực ở Bình Thạnh giúp Bot tư vấn nhé!`,
    rooms: [],
  };
}

function buildGeminiConfig(systemText) {
  const generationConfig = {
    temperature: 0.35,
    maxOutputTokens: 500,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        reply: { type: "STRING" },
        recommendedRoomIds: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
      required: ["reply", "recommendedRoomIds"],
    },
  };
  if (String(env.GEMINI_MODEL || "").includes("2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return { systemText, generationConfig };
}

async function callGeminiModel({ model, systemText, contents, generationConfig }) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig,
      }),
      signal: AbortSignal.timeout(12000),
    },
  );
}

router.post("/chat", async (request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  const clientIp = request.ip || "unknown";
  if (!checkChatRateLimit(clientIp)) {
    return sendError(
      response,
      request,
      429,
      "CHAT_RATE_LIMITED",
      "Bạn nhắn hơi nhanh rồi, nghỉ tay vài giây rồi hỏi lại Bot tư vấn nhé!",
    );
  }

  const parsed = chatRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return sendError(response, request, 400, "INVALID_INPUT", "Vui lòng nhập câu hỏi ngắn gọn (tối đa 400 ký tự).");
  }

  try {
    const { roomListings } = await getCollections();
    const docs = await roomListings
      .find(
        { publishStatus: "PUBLISHED", deletedAt: null },
        {
          projection: {
            _id: 1,
            title: 1,
            description: 1,
            roomType: 1,
            priceVnd: 1,
            areaM2: 1,
            amenities: 1,
            ward: 1,
            district: 1,
            city: 1,
            publicAddress: 1,
            availability: 1,
            publishedAt: 1,
            updatedAt: 1,
            images: 1,
            allowPublicPhone: 1,
            contactPhone: 1,
            allowPublicZalo: 1,
            contactZalo: 1,
          },
        },
      )
      .sort({ availability: 1, publishedAt: -1 })
      .limit(100)
      .toArray();

    const evaluation = evaluateRoomsForChat(docs, parsed.data.message);

    if (!env.GEMINI_API_KEY) {
      const fb = buildFallbackReply(docs, evaluation, parsed.data.message);
      return response.json({ ...fb, mode: "smart-fallback" });
    }

    const availableDocs = docs.filter((d) => d.availability === "AVAILABLE");
    const availableById = new Map(availableDocs.map((d) => [d._id, d]));

    const groundedCatalog = availableDocs.slice(0, 40).map((d) => ({
      id: d._id,
      tieuDe: d.title,
      loaiPhong: d.roomType,
      giaVnd: d.priceVnd,
      dienTichM2: d.areaM2,
      khuVuc: d.publicAddress,
      phuong: d.ward,
      tienNghi: d.amenities || [],
      moTaNgan: String(d.description || "").replace(/\s+/g, " ").trim().slice(0, 140),
      sdtLienHe: d.allowPublicPhone && d.contactPhone ? d.contactPhone : null,
      zaloLienHe: d.allowPublicZalo && d.contactZalo ? d.contactZalo : null,
    }));

    const systemText = [
      'Bạn tên là "Bot tư vấn", trợ lý AI thông minh, dễ thương, lịch sự của hệ thống Phòng trọ Ngọc Toàn tại Quận Bình Thạnh, TP.HCM.',
      "NHIỆM VỤ: Đọc kỹ câu hỏi của khách, đối chiếu chính xác với JSON phòng còn trống bên dưới và trả về đúng định dạng JSON { reply, recommendedRoomIds }.",
      "QUY TẮC NGHIÊM NGẶT:",
      "1. CHỈ được đưa vào `recommendedRoomIds` tối đa 3 ID phòng THẬT SỰ KHỚP với yêu cầu về giá, khu vực/đường, loại phòng và tiện nghi của khách. Tuyệt đối KHÔNG nhét phòng không khớp (sai tầm giá hoặc thiếu tiện nghi bắt buộc khách hỏi) vào `recommendedRoomIds`.",
      "2. Nếu KHÔNG có phòng nào khớp tiêu chí khách hỏi (ví dụ khách hỏi quá rẻ hoặc hỏi tiện nghi không có), hãy để `recommendedRoomIds: []` (hoặc tối đa 1 phòng sát nhất nếu thực sự gần), thành thật báo chưa có phòng khớp và gợi ý mức giá/khu vực gần nhất đang có.",
      "3. KHÔNG được tự bịa phòng, giá, diện tích, địa chỉ số nhà cụ thể hay SĐT không có trong dữ liệu.",
      "4. Câu trả lời `reply` tự nhiên, thân thiện, ngắn gọn (2-5 câu), nêu đúng tên/giá của các phòng bạn đã chọn trong `recommendedRoomIds`.",
      `DANH SÁCH PHÒNG CÒN TRỐNG THẬT (${groundedCatalog.length} phòng):`,
      JSON.stringify(groundedCatalog),
    ].join("\n");

    const contents = [
      ...parsed.data.history.map((item) => ({
        role: item.role === "model" ? "model" : "user",
        parts: [{ text: item.text }],
      })),
      { role: "user", parts: [{ text: parsed.data.message }] },
    ];

    try {
      const { generationConfig } = buildGeminiConfig(systemText);
      let geminiRes = await callGeminiModel({
        model: env.GEMINI_MODEL,
        systemText,
        contents,
        generationConfig,
      });

      if ((geminiRes.status === 400 || geminiRes.status === 404) && env.GEMINI_MODEL !== "gemini-2.0-flash") {
        const fallbackConfig = { ...generationConfig };
        delete fallbackConfig.thinkingConfig;
        geminiRes = await callGeminiModel({
          model: "gemini-2.0-flash",
          systemText,
          contents,
          generationConfig: fallbackConfig,
        });
      }

      if (geminiRes.ok) {
        const geminiJson = await geminiRes.json();
        const rawText = geminiJson?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("")
          .trim();
        if (rawText) {
          let parsedAi = null;
          try {
            parsedAi = JSON.parse(rawText);
          } catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedAi = JSON.parse(jsonMatch[0]);
              } catch {
                parsedAi = null;
              }
            }
          }

          if (parsedAi && typeof parsedAi.reply === "string" && parsedAi.reply.trim()) {
            const pickedRooms = Array.isArray(parsedAi.recommendedRoomIds)
              ? [...new Set(parsedAi.recommendedRoomIds)]
                  .map((id) => availableById.get(id))
                  .filter(Boolean)
                  .slice(0, 3)
              : [];
            return response.json({
              reply: parsedAi.reply.trim(),
              rooms: pickedRooms.map(toPublicListItem),
              mode: "gemini",
            });
          }

          return response.json({
            reply: rawText,
            rooms: evaluation.exactMatches.slice(0, 3).map((e) => toPublicListItem(e.doc)),
            mode: "gemini",
          });
        }
      } else {
        console.warn(JSON.stringify({ event: "gemini_chat_non_ok", status: geminiRes.status, requestId: request.requestId }));
      }
    } catch (geminiError) {
      console.warn(JSON.stringify({ event: "gemini_chat_exception", errorName: geminiError?.name || "Error", requestId: request.requestId }));
    }

    const fb = buildFallbackReply(docs, evaluation, parsed.data.message);
    return response.json({ ...fb, mode: "smart-fallback" });
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  publicRouter: router,
  __testHelpers: { parseChatIntent, evaluateRoomsForChat, buildFallbackReply },
};
