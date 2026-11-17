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
  let maxBudget = null;
  const underMatch = foldedMsg.match(/(?:duoi|<=|tam|khoang|toi da|budget|gia)?\s*(\d{1,2})\s*(?:tr|trieu)\s*(\d{1,2})?/);
  if (underMatch) {
    const major = Number(underMatch[1]);
    const dec = underMatch[2] ? (underMatch[2].length === 1 ? Number(underMatch[2]) * 100_000 : Number(underMatch[2]) * 10_000) : 0;
    const val = major * 1_000_000 + dec;
    if (val >= 1_000_000 && val <= 30_000_000) {
      maxBudget = foldedMsg.includes("duoi") ? val : val + 500_000;
    }
  }

  let targetWard = "";
  if (foldedMsg.includes("gia dinh") || foldedMsg.includes("ba chieu") || foldedMsg.includes("nguyen cuu van")) {
    targetWard = "Phường Gia Định";
  } else if (foldedMsg.includes("thanh my tay") || foldedMsg.includes("hang xanh") || foldedMsg.includes("hutech") || foldedMsg.includes("ngoai thuong") || foldedMsg.includes("landmark")) {
    targetWard = "Phường Thạnh Mỹ Tây";
  } else if (foldedMsg.includes("binh loi trung") || foldedMsg.includes("van lang") || foldedMsg.includes("binh loi")) {
    targetWard = "Phường Bình Lợi Trung";
  } else if (foldedMsg.includes("binh quoi") || foldedMsg.includes("thanh da")) {
    targetWard = "Phường Bình Quới";
  } else if (foldedMsg.includes("dinh bo linh") || foldedMsg.includes("nguyen xi") || foldedMsg.includes("bx mien dong") || foldedMsg.includes("chu van an") || /phuong\s*binh thanh/.test(foldedMsg)) {
    targetWard = "Phường Bình Thạnh";
  }

  const amenityHints = AMENITIES.filter((item) => {
    const f = foldVi(item);
    if (f === "ban cong" && (foldedMsg.includes("ban cong") || foldedMsg.includes("bancol"))) return true;
    if (f === "nha ve sinh rieng" && (foldedMsg.includes("wc") || foldedMsg.includes("ve sinh"))) return true;
    if (f === "cho de xe" && (foldedMsg.includes("xe") || foldedMsg.includes("nha xe"))) return true;
    return foldedMsg.includes(f);
  });

  let roomTypeHint = "";
  if (foldedMsg.includes("studio")) roomTypeHint = "Phòng studio";
  else if (foldedMsg.includes("can ho") || foldedMsg.includes("mini") || foldedMsg.includes("chdv")) roomTypeHint = "Căn hộ mini";
  else if (foldedMsg.includes("o ghep")) roomTypeHint = "Phòng ở ghép";
  else if (foldedMsg.includes("gac")) roomTypeHint = "Phòng có gác";

  return { maxBudget, targetWard, amenityHints, roomTypeHint };
}

function rankRoomsForChat(docs, message) {
  const foldedMsg = foldVi(message);
  const intent = parseChatIntent(foldedMsg);
  const tokens = foldedMsg
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !["phong", "tro", "binh", "thanh", "cho", "hoi", "tim", "can", "thue", "co", "khong", "nao", "bao", "nhieu", "gan", "khu", "vuc", "gia"].includes(w));

  const scored = docs.map((doc) => {
    let score = doc.availability === "AVAILABLE" ? 50 : -100;
    const price = Number(doc.priceVnd || 0);
    const haystack = foldVi(`${doc.title} ${doc.publicAddress} ${doc.ward} ${doc.roomType} ${(doc.amenities || []).join(" ")} ${doc.description}`);

    if (intent.maxBudget && price > 0) {
      if (price <= intent.maxBudget) score += 25;
      else score -= 30;
    }
    if (intent.targetWard && doc.ward === intent.targetWard) {
      score += 30;
    }
    if (intent.roomTypeHint && doc.roomType === intent.roomTypeHint) {
      score += 20;
    }
    for (const am of intent.amenityHints) {
      if ((doc.amenities || []).includes(am)) score += 12;
    }
    for (const tok of tokens) {
      if (haystack.includes(tok)) score += 6;
    }
    if (foldedMsg.includes("re nhat") && price > 0) {
      score += Math.max(0, 20 - Math.round(price / 500_000));
    }
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return { scored, intent };
}

function buildFallbackReply(docs, ranked, message) {
  const availableDocs = docs.filter((d) => d.availability === "AVAILABLE");
  if (!availableDocs.length) {
    return {
      reply: "Dạ chào bạn! Hiện tại các phòng đăng trên hệ thống đều đã có khách thuê hết rồi ạ. Bạn quay lại sau hoặc nhắn Zalo chủ trọ để được báo ngay khi có phòng trống mới nha!",
      rooms: [],
    };
  }

  const folded = foldVi(message);
  const isGreetingOnly = /^(?:hi|hello|alo|chao|xin chao|bot oi|ad oi|tu van|help)[!.,\s]*$/.test(folded);
  const topMatched = ranked.scored
    .filter((item) => item.doc.availability === "AVAILABLE")
    .slice(0, 3)
    .map((item) => item.doc);

  if (isGreetingOnly) {
    const minPrice = Math.min(...availableDocs.map((d) => Number(d.priceVnd || 0)).filter(Boolean));
    const priceText = minPrice ? `từ ${(minPrice / 1_000_000).toLocaleString("vi-VN")} triệu/tháng` : "giá hợp lý";
    return {
      reply: `Chào bạn nè! Mình là Bot tư vấn của Phòng trọ Ngọc Toàn. Hiện bên mình đang có ${availableDocs.length} phòng trống tại Bình Thạnh (${priceText}). Bạn muốn tìm phòng tầm giá nào hay gần khu vực nào để mình lọc giúp nhé!`,
      rooms: topMatched.map(toPublicListItem),
    };
  }

  const hasExactHit = ranked.scored.some((item) => item.doc.availability === "AVAILABLE" && item.score > 60);
  if (hasExactHit) {
    return {
      reply: `Mình tìm thấy ${topMatched.length} phòng còn trống khá hợp với nhu cầu của bạn nè! Bạn bấm trực tiếp vào thẻ phòng bên dưới để xem hình thật và gọi/nhắn Zalo xem phòng nha.`,
      rooms: topMatched.map(toPublicListItem),
    };
  }

  return {
    reply: `Hiện chưa có phòng khớp 100% tiêu chí đó, nhưng bên mình vẫn còn ${availableDocs.length} phòng trống rất đẹp ở Bình Thạnh nè! Bạn tham khảo thử các căn gần nhất bên dưới nhé:`,
    rooms: topMatched.map(toPublicListItem),
  };
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
      .limit(24)
      .toArray();

    const ranked = rankRoomsForChat(docs, parsed.data.message);
    const availableTop = ranked.scored
      .filter((entry) => entry.doc.availability === "AVAILABLE")
      .slice(0, 3)
      .map((entry) => entry.doc);

    if (!env.GEMINI_API_KEY) {
      const fb = buildFallbackReply(docs, ranked, parsed.data.message);
      return response.json({ ...fb, mode: "smart-fallback" });
    }

    const groundedCatalog = docs
      .filter((d) => d.availability === "AVAILABLE")
      .slice(0, 12)
      .map((d) => ({
        id: d._id,
        tieuDe: d.title,
        loaiPhong: d.roomType,
        giaVnd: d.priceVnd,
        dienTichM2: d.areaM2,
        khuVuc: d.publicAddress,
        phuong: d.ward,
        tienNghi: d.amenities || [],
        sdtLienHe: d.allowPublicPhone && d.contactPhone ? d.contactPhone : null,
        zaloLienHe: d.allowPublicZalo && d.contactZalo ? d.contactZalo : null,
      }));

    const systemText = [
      'Bạn tên là "Bot tư vấn", trợ lý AI thân thiện, dễ thương (cute vừa phải, lễ phép, dùng tiếng Việt tự nhiên) của website Phòng trọ Ngọc Toàn tại Quận Bình Thạnh, TP.HCM.',
      "QUY TẮC BẮT BUỘC:",
      "1. CHỈ được tư vấn dựa trên danh sách PHÒNG CÒN TRỐNG THẬT trong JSON bên dưới. Tuyệt đối KHÔNG tự bịa phòng, giá tiền, diện tích, địa chỉ hay số điện thoại không có trong dữ liệu.",
      "2. Không nêu địa chỉ số nhà cụ thể, chỉ nói khu vực và phường được cung cấp.",
      "3. Trả lời ngắn gọn (tối đa 4-5 câu), dễ đọc trên điện thoại. Nếu có phòng phù hợp, hãy nhắc nhẹ tên phòng, giá và mời khách bấm vào thẻ phòng ngay bên dưới để xem hình thật & gọi/nhắn Zalo.",
      "4. Nếu chưa có phòng khớp hoàn toàn, hãy xin lỗi dễ thương, gợi ý các lựa chọn còn trống gần nhất và hướng dẫn khách nhắn Zalo nếu có.",
      `DỮ LIỆU PHÒNG CÒN TRỐNG HIỆN TẠI (${groundedCatalog.length} phòng):`,
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
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 320,
            },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      if (geminiRes.ok) {
        const geminiJson = await geminiRes.json();
        const aiText = geminiJson?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("")
          .trim();
        if (aiText) {
          return response.json({
            reply: aiText,
            rooms: availableTop.map(toPublicListItem),
            mode: "gemini",
          });
        }
      }
    } catch {
      // Fallback sang trả lời thông minh từ MongoDB nếu Gemini lỗi hoặc hết quota
    }

    const fb = buildFallbackReply(docs, ranked, parsed.data.message);
    return response.json({ ...fb, mode: "smart-fallback" });
  } catch (error) {
    return next(error);
  }
});

module.exports = { publicRouter: router };
