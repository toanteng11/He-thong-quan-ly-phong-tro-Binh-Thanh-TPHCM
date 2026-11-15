const assert = require("node:assert/strict");
const { randomUUID, createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { deflateSync } = require("node:zlib");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Bảo vệ tuyệt đối dữ liệu thật trên room_rental_dev và production: chỉ cho phép seed vào DB benchmark riêng
if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run benchmark seed script when NODE_ENV=production!");
}
const targetDb = process.env.PERF_DB_NAME || "room_rental_perf";
assert.notEqual(targetDb, "room_rental_dev", "Refusing to seed 500 perf records into room_rental_dev!");
assert.equal(/prod/i.test(targetDb), false, "Refusing to seed 500 perf records into a production database!");
process.env.MONGODB_DB_NAME = targetDb;
process.env.UPLOAD_DIR = process.env.PERF_UPLOAD_DIR || "uploads-perf";

const { ensureIndexes, getCollections, closeDb } = require("../src/db/mongo");
const { imageStorage } = require("../src/storage/image-storage");

const PERF_UPLOAD_ROOT = path.resolve(__dirname, "..", process.env.UPLOAD_DIR);

const WARDS_2026 = [
  "Phường Gia Định",
  "Phường Bình Thạnh",
  "Phường Bình Lợi Trung",
  "Phường Thạnh Mỹ Tây",
  "Phường Bình Quới",
];

const STREETS_BY_WARD = {
  "Phường Gia Định": ["Lê Văn Duyệt", "Phan Đăng Lưu", "Bùi Hữu Nghĩa", "Vũ Huy Tấn", "Trần Kế Xương"],
  "Phường Bình Thạnh": ["Bạch Đằng", "Xô Viết Nghệ Tĩnh", "Đinh Bộ Lĩnh", "Phan Văn Hân", "Điện Biên Phủ"],
  "Phường Bình Lợi Trung": ["Nơ Trang Long", "Nguyễn Xí", "Phan Văn Trị", "Phạm Văn Đồng", "Chu Văn An"],
  "Phường Thạnh Mỹ Tây": ["D2 Nguyễn Gia Trí", "Ung Văn Khiêm", "Nguyễn Hữu Cảnh", "D5", "Xô Viết Nghệ Tĩnh"],
  "Phường Bình Quới": ["Bình Quới", "Thanh Đa", "Tầm Vu", "Cư xá Thanh Đa"],
};

const ROOM_TYPES = ["Phòng trọ", "Phòng có gác", "Phòng studio", "Căn hộ mini", "Phòng ở ghép"];
const AMENITY_SETS = [
  ["Máy lạnh", "Thang máy", "Nhà vệ sinh riêng", "Wifi", "Chỗ để xe"],
  ["Máy lạnh", "Tủ lạnh", "Thang máy", "Ban công", "Bếp riêng", "Wifi", "Cửa sổ"],
  ["Máy lạnh", "Gác lửng", "Nhà vệ sinh riêng", "Chỗ để xe", "Wifi", "Cửa sổ"],
  ["Máy lạnh", "Giường", "Tủ quần áo", "Ban công", "Thang máy", "Bếp riêng"],
  ["Gác lửng", "Wifi", "Chỗ để xe", "Cửa sổ", "Nhà vệ sinh riêng"],
];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function generateLightweightPng(width, height, palette) {
  const [r1, g1, b1] = palette.primary;
  const [r2, g2, b2] = palette.accent;
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowBytes;
    raw[rowStart] = 0;
    const tY = y / (height - 1);
    const inBand = y > height * 0.62 && y < height * 0.7;
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 3;
      const inCard = x > width * 0.14 && x < width * 0.86 && y > height * 0.18 && y < height * 0.82;
      if (inBand && inCard) {
        raw[px] = r2;
        raw[px + 1] = g2;
        raw[px + 2] = b2;
      } else if (inCard) {
        const mix = 0.25 + 0.4 * tY;
        raw[px] = Math.round(r1 * (1 - mix) + 247 * mix);
        raw[px + 1] = Math.round(g1 * (1 - mix) + 245 * mix);
        raw[px + 2] = Math.round(b1 * (1 - mix) + 240 * mix);
      } else {
        raw[px] = Math.round(r1 * (1 - tY * 0.22) + r2 * (tY * 0.22));
        raw[px + 1] = Math.round(g1 * (1 - tY * 0.22) + g2 * (tY * 0.22));
        raw[px + 2] = Math.round(b1 * (1 - tY * 0.22) + b2 * (tY * 0.22));
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(raw, { level: 9 })),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function runInBatches(items, batchSize, worker) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(worker));
  }
}

async function main() {
  await ensureIndexes();
  const { roomListings } = await getCollections();

  await roomListings.deleteMany({});
  await fs.rm(PERF_UPLOAD_ROOT, { recursive: true, force: true });
  await fs.mkdir(PERF_UPLOAD_ROOT, { recursive: true });

  // Sinh 5 ảnh mẫu nhẹ (~3-6 KB/ảnh, chuẩn 480x360) phục vụ benchmark 4G NFR-13
  const palettes = [
    { primary: [27, 99, 75], accent: [197, 83, 43] },
    { primary: [13, 52, 39], accent: [212, 163, 115] },
    { primary: [36, 122, 93], accent: [168, 68, 32] },
    { primary: [43, 61, 54], accent: [227, 242, 236] },
    { primary: [21, 77, 58], accent: [232, 132, 85] },
  ];
  const sampleBuffers = palettes.map((palette) => ({
    buffer: generateLightweightPng(480, 360, palette),
  }));
  sampleBuffers.forEach((entry) => {
    entry.sha256 = createHash("sha256").update(entry.buffer).digest("hex");
  });

  const now = Date.now();
  const docs = [];
  const imageWrites = [];

  for (let idx = 0; idx < 500; idx += 1) {
    const id = randomUUID();
    const ward = WARDS_2026[idx % WARDS_2026.length];
    const streets = STREETS_BY_WARD[ward];
    const street = streets[Math.floor(idx / WARDS_2026.length) % streets.length];
    const roomType = ROOM_TYPES[(idx + Math.floor(idx / 5)) % ROOM_TYPES.length];
    const amenities = AMENITY_SETS[(idx * 2 + Math.floor(idx / 5)) % AMENITY_SETS.length];
    const availability = idx % 4 === 3 ? "RENTED" : "AVAILABLE";
    const priceVnd = 2200000 + ((idx * 175000) % 5600000);
    const areaM2 = 15 + ((idx * 7 + Math.floor(idx / 5)) % 27);
    const createdAt = new Date(now - (idx + 1) * 3600 * 1000);
    const imageCount = (idx % 2) + 2; // 2 hoặc 3 ảnh tối ưu (<= 3 theo NFR-13)
    const images = [];

    for (let j = 0; j < imageCount; j += 1) {
      const sample = sampleBuffers[(idx + j) % sampleBuffers.length];
      const imageId = randomUUID();
      const storageKey = `${imageId}.png`;
      imageWrites.push({
        listingId: id,
        storageKey,
        buffer: sample.buffer,
      });
      images.push({
        id: imageId,
        storageKey,
        originalName: `perf-${idx + 1}-${j + 1}.png`,
        mimeType: "image/png",
        sizeBytes: sample.buffer.length,
        sha256: sample.sha256,
        altText: `${roomType} đường ${street}, ${ward}`,
        sortOrder: j,
        isCover: j === 0,
        createdAt,
      });
    }

    docs.push({
      _id: id,
      title: `[#${String(idx + 1).padStart(3, "0")}] ${roomType} đường ${street}, ${ward} thoáng sáng`,
      description: `Phòng trọ mẫu phục vụ kiểm thử hiệu năng Sprint 3 tại đường ${street}, ${ward}, Quận Bình Thạnh. Gần tuyến xe buýt, an ninh tốt, đồng hồ điện nước riêng.`,
      roomType,
      priceVnd,
      areaM2,
      amenities,
      ward,
      district: "Bình Thạnh",
      city: "TP. Hồ Chí Minh",
      publicAddress: `Khu vực đường ${street}`,
      privateAddress: `${10 + (idx % 90)}/${(idx % 9) + 1} đường ${street}, ${ward}`,
      allowExactAddress: idx % 5 === 0,
      contactPhone: "0903123456",
      allowPublicPhone: true,
      contactZalo: "0903123456",
      allowPublicZalo: idx % 2 === 0,
      availability,
      publishStatus: "PUBLISHED",
      images,
      version: 1,
      publishedAt: createdAt,
      createdBy: "perf-seed",
      updatedBy: "perf-seed",
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      deletedBy: null,
      seedTag: "SPRINT_3_PERF_500",
    });
  }

  // Thêm 10 tin ẩn/nháp/xóa mềm để xác nhận không rò rỉ trên tập 510 bản ghi
  for (let idx = 0; idx < 10; idx += 1) {
    const id = randomUUID();
    const ward = WARDS_2026[idx % WARDS_2026.length];
    const publishStatus = idx < 4 ? "DRAFT" : "HIDDEN";
    const isDeleted = idx >= 8;
    const createdAt = new Date(now - idx * 1000);
    docs.push({
      _id: id,
      title: `PERF-PRIVATE-NO-LEAK-${idx + 1} ${ward}`,
      description: "Bản ghi kiểm tra cô lập dữ liệu riêng tư trong tập dữ liệu 500+ tin.",
      roomType: "Phòng trọ",
      priceVnd: 3200000,
      areaM2: 20,
      amenities: ["Máy lạnh", "Thang máy"],
      ward,
      district: "Bình Thạnh",
      city: "TP. Hồ Chí Minh",
      publicAddress: "Khu vực nội bộ",
      privateAddress: `PERF-SECRET-ADDR-${idx + 1}`,
      allowExactAddress: false,
      contactPhone: "0909000111",
      allowPublicPhone: true,
      contactZalo: "",
      allowPublicZalo: false,
      availability: "AVAILABLE",
      publishStatus,
      images: [],
      version: 1,
      publishedAt: null,
      createdBy: "perf-seed",
      updatedBy: "perf-seed",
      createdAt,
      updatedAt: createdAt,
      deletedAt: isDeleted ? createdAt : null,
      deletedBy: isDeleted ? "perf-seed" : null,
      seedTag: "SPRINT_3_PERF_PRIVATE",
    });
  }

  await runInBatches(imageWrites, 80, (item) => imageStorage.write(item));
  await roomListings.insertMany(docs);

  const avgKb = (sampleBuffers[0].buffer.length / 1024).toFixed(2);
  console.log(`Seeded 500 PUBLISHED + 10 non-public records into DB "${targetDb}" (${imageWrites.length} lightweight PNGs, ~${avgKb} KB/img in "${PERF_UPLOAD_ROOT}").`);
}

main()
  .catch((error) => {
    console.error("Failed to seed perf 500 dataset:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
