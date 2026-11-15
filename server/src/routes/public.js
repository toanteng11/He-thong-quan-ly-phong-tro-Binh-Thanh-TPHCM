const { Router } = require("express");
const { z } = require("zod");
const { getCollections } = require("../db/mongo");
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

module.exports = { publicRouter: router };
