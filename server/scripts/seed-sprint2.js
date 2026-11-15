const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { deflateSync } = require("node:zlib");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { ensureIndexes, getCollections, closeDb } = require("../src/db/mongo");
const { imageStorage } = require("../src/storage/image-storage");

const SEED_TAG = "SPRINT_2_SAMPLE";
const UPLOADS_ROOT = path.resolve(__dirname, "../uploads");

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

function generateRoomPng(width, height, palette) {
  const [r1, g1, b1] = palette.primary;
  const [r2, g2, b2] = palette.accent;
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowBytes;
    raw[rowStart] = 0;
    const tY = y / (height - 1);
    const inBand = y > height * 0.62 && y < height * 0.72;
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 3;
      const inCard = x > width * 0.12 && x < width * 0.88 && y > height * 0.16 && y < height * 0.84;
      if (inBand && inCard) {
        raw[px] = r2;
        raw[px + 1] = g2;
        raw[px + 2] = b2;
      } else if (inCard) {
        const mix = 0.2 + 0.45 * tY;
        raw[px] = Math.round(r1 * (1 - mix) + 247 * mix);
        raw[px + 1] = Math.round(g1 * (1 - mix) + 245 * mix);
        raw[px + 2] = Math.round(b1 * (1 - mix) + 240 * mix);
      } else {
        raw[px] = Math.round(r1 * (1 - tY * 0.25) + r2 * (tY * 0.25));
        raw[px + 1] = Math.round(g1 * (1 - tY * 0.25) + g2 * (tY * 0.25));
        raw[px + 2] = Math.round(b1 * (1 - tY * 0.25) + b2 * (tY * 0.25));
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(raw, { level: 6 })),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

const ROOM_PALETTES = [
  { primary: [21, 77, 58], accent: [197, 83, 43] },
  { primary: [36, 122, 93], accent: [227, 242, 236] },
  { primary: [168, 68, 32], accent: [247, 245, 240] },
  { primary: [13, 52, 39], accent: [36, 122, 93] },
];

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const SAMPLE_LISTINGS = [
  // 11 PUBLISHED + AVAILABLE
  {
    title: "Phòng studio cửa sổ lớn gần Hàng Xanh & ĐH Hutech",
    description: "Phòng studio mới sơn sửa, cửa sổ trời đón nắng sáng, hẻm xe hơi an ninh 24/7. Giờ giấc tự do, khu vực yên tĩnh gần ngã tư Hàng Xanh.",
    roomType: "Phòng studio",
    priceVnd: 4800000,
    areaM2: 28,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Wifi", "Cửa sổ", "Chỗ để xe"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Gần Nguyễn Gia Trí (D2 cũ)",
    privateAddress: "123/45B PRIVATE-EXACT-FALSE-TOKEN Nguyễn Gia Trí, Phường Thạnh Mỹ Tây",
    allowExactAddress: false,
    contactPhone: "0909111222",
    allowPublicPhone: true,
    contactZalo: "0909111222",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(4),
    imageCount: 3,
  },
  {
    title: "Căn hộ mini ban công view Landmark 81 sát Nguyễn Hữu Cảnh",
    description: "Căn hộ mini nội thất đầy đủ gồm bếp riêng hút mùi, tòa nhà có thang máy tốc độ cao và ban công rộng rãi. Phù hợp nhân viên văn phòng đi làm Quận 1 chỉ 5 phút.",
    roomType: "Căn hộ mini",
    priceVnd: 6800000,
    areaM2: 42,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng", "Nhà vệ sinh riêng", "Ban công", "Wifi"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Khu Ngô Tất Tố – Nguyễn Hữu Cảnh",
    privateAddress: "68/14 Ngô Tất Tố, Phường Thạnh Mỹ Tây, Quận Bình Thạnh",
    allowExactAddress: true,
    contactPhone: "0909222333",
    allowPublicPhone: true,
    contactZalo: "0909222333",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(6),
    imageCount: 3,
  },
  {
    title: "Phòng có gác lửng cao thoáng ngay Xô Viết Nghệ Tĩnh",
    description: "Phòng có gác đúc chắc chắn, trần cao 4m không bị đụng đầu, khu bếp nấu ăn tiện lợi. Hẻm an ninh có khóa vân tay và camera hành lang.",
    roomType: "Phòng có gác",
    priceVnd: 3700000,
    areaM2: 24,
    amenities: ["Máy lạnh", "Gác lửng", "Nhà vệ sinh riêng", "Bếp riêng", "Wifi", "Chỗ để xe"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Gần Cầu Thị Nghè",
    privateAddress: "45/18 Xô Viết Nghệ Tĩnh, Phường Thạnh Mỹ Tây",
    allowExactAddress: false,
    contactPhone: "0909333444",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(8),
    imageCount: 3,
  },
  {
    title: "Phòng trọ mới xây sạch sẽ đường Vũ Tùng gần Chợ Bà Chiểu",
    description: "Phòng trọ thoáng mát mới bàn giao, WC riêng từng phòng, nhà để xe tầng trệt rộng rãi có bảo vệ. Gần chợ Bà Chiểu và tuyến xe buýt đi trung tâm.",
    roomType: "Phòng trọ",
    priceVnd: 2900000,
    areaM2: 20,
    amenities: ["Nhà vệ sinh riêng", "Wifi", "Chỗ để xe", "Cửa sổ"],
    ward: "Phường Gia Định",
    publicAddress: "Gần Chợ Bà Chiểu",
    privateAddress: "12/9 Vũ Tùng, Phường Gia Định, Quận Bình Thạnh",
    allowExactAddress: true,
    contactPhone: "0909444555",
    allowPublicPhone: false,
    contactZalo: "0909444555",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(10),
    imageCount: 2,
  },
  {
    title: "Phòng ở ghép cao cấp máy lạnh bao điện nước gần Phan Đăng Lưu",
    description: "Phòng ở ghép tối đa 4 bạn nữ, mỗi người 1 giường tầng gỗ thông có rèm riêng và tủ khóa cá nhân. Tòa nhà có thang máy và dọn vệ sinh khu chung hàng tuần.",
    roomType: "Phòng ở ghép",
    priceVnd: 2600000,
    areaM2: 32,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Wifi", "Cửa sổ"],
    ward: "Phường Bình Thạnh",
    publicAddress: "Khu Nơ Trang Long – Phan Đăng Lưu",
    privateAddress: "210/7 Nơ Trang Long, Phường Bình Thạnh",
    allowExactAddress: false,
    contactPhone: "0909555666",
    allowPublicPhone: true,
    contactZalo: "0909555666",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(12),
    imageCount: 2,
  },
  {
    title: "Phòng có gác ban công riêng gần Học viện Cán bộ Chu Văn An",
    description: "Phòng rộng rãi đón gió tự nhiên, trang bị sẵn máy lạnh tiết kiệm điện và kệ bếp đá hoa cương. Thuận tiện sinh viên khu vực Chu Văn An – Phan Văn Trị.",
    roomType: "Phòng có gác",
    priceVnd: 4100000,
    areaM2: 26,
    amenities: ["Máy lạnh", "Gác lửng", "Ban công", "Bếp riêng", "Nhà vệ sinh riêng", "Wifi"],
    ward: "Phường Bình Thạnh",
    publicAddress: "Đoạn Chu Văn An – Đinh Bộ Lĩnh",
    privateAddress: "84/6 Chu Văn An, Phường Bình Thạnh, Quận Bình Thạnh",
    allowExactAddress: true,
    contactPhone: "0909666777",
    allowPublicPhone: true,
    contactZalo: "0909666777",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(14),
    imageCount: 3,
  },
  {
    title: "Phòng studio tinh gọn hẻm yên tĩnh Lê Quang Định",
    description: "Không gian studio thiết kế tối giản, ánh sáng ấm, đầy đủ giường nệm, bàn làm việc và tủ quần áo âm tường. Phù hợp ở 1–2 người.",
    roomType: "Phòng studio",
    priceVnd: 4400000,
    areaM2: 25,
    amenities: ["Máy lạnh", "Thang máy", "Giường", "Tủ quần áo", "Nhà vệ sinh riêng", "Wifi", "Cửa sổ"],
    ward: "Phường Bình Lợi Trung",
    publicAddress: "Khu Lê Quang Định – Nguyễn Văn Đậu",
    privateAddress: "301/11 Lê Quang Định, Phường Bình Lợi Trung",
    allowExactAddress: false,
    contactPhone: "0909777888",
    allowPublicPhone: true,
    contactZalo: "0909777888",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(16),
    imageCount: 2,
  },
  {
    title: "Phòng trọ giá tốt hẻm Điện Biên Phủ sát Vòng xoay Hàng Xanh",
    description: "Phòng vuông vức dễ bài trí, có cửa sổ hướng giếng trời, wifi cáp quang riêng từng tầng. Đi bộ 3 phút ra trạm xe buýt Điện Biên Phủ.",
    roomType: "Phòng trọ",
    priceVnd: 3200000,
    areaM2: 18,
    amenities: ["Nhà vệ sinh riêng", "Wifi", "Chỗ để xe", "Cửa sổ"],
    ward: "Phường Gia Định",
    publicAddress: "Đoạn Điện Biên Phủ – Hàng Xanh",
    privateAddress: "152/3 Điện Biên Phủ, Phường Gia Định",
    allowExactAddress: false,
    contactPhone: "0909888999",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(18),
    imageCount: 2,
  },
  {
    title: "Căn hộ mini 1 phòng ngủ tách bếp khu Phạm Viết Chánh",
    description: "Căn hộ dịch vụ khu ẩm thực Phạm Viết Chánh, thang máy êm ái và tủ lạnh lớn, hệ thống nước nóng năng lượng mặt trời. Ra vào bằng thẻ từ an toàn.",
    roomType: "Căn hộ mini",
    priceVnd: 6200000,
    areaM2: 36,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng", "Nhà vệ sinh riêng", "Wifi"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Khu Phạm Viết Chánh – Thị Nghè",
    privateAddress: "77/22 Phạm Viết Chánh, Phường Thạnh Mỹ Tây",
    allowExactAddress: false,
    contactPhone: "0908111333",
    allowPublicPhone: true,
    contactZalo: "0908111333",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(20),
    imageCount: 3,
  },
  {
    title: "Phòng có gác thoáng sáng gần Cư xá Thanh Đa – Bình Quới",
    description: "Phòng rộng rãi cho nhóm 2 người hoặc gia đình nhỏ, gác lửng lát sàn gỗ, không khí mát mẻ ven sông Thanh Đa và chỗ phơi đồ riêng có mái che.",
    roomType: "Phòng có gác",
    priceVnd: 3500000,
    areaM2: 22.5,
    amenities: ["Gác lửng", "Nhà vệ sinh riêng", "Bếp riêng", "Wifi", "Chỗ để xe"],
    ward: "Phường Bình Quới",
    publicAddress: "Khu Bình Quới – Bán đảo Thanh Đa",
    privateAddress: "95/14 Bình Quới, Phường Bình Quới",
    allowExactAddress: false,
    contactPhone: "0908222444",
    allowPublicPhone: true,
    contactZalo: "0908222444",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(22),
    imageCount: 2,
  },
  {
    title: "Phòng studio nội thất gỗ ấm áp đường Ung Văn Khiêm",
    description: "Phòng studio gần đại học Hutech Ung Văn Khiêm và sông Sài Gòn, đầy đủ tiện nghi thang máy chỉ việc xách vali vào ở ngay.",
    roomType: "Phòng studio",
    priceVnd: 5100000,
    areaM2: 30,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng", "Ban công", "Wifi", "Chỗ để xe"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Gần Ung Văn Khiêm – Tân Cảng",
    privateAddress: "240/19 Ung Văn Khiêm, Phường Thạnh Mỹ Tây",
    allowExactAddress: false,
    contactPhone: "0908333555",
    allowPublicPhone: true,
    contactZalo: "0908333555",
    allowPublicZalo: true,
    availability: "AVAILABLE",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(24),
    imageCount: 3,
  },

  // 3 PUBLISHED + RENTED (1 tin cố ý mới nhất để kiểm chứng sort available_first vs publishedAt_desc)
  {
    title: "Phòng studio ban công hướng công viên khu Ung Văn Khiêm",
    description: "Tin giữ tham khảo mức giá tại khu vực Phường Thạnh Mỹ Tây; phòng hiện đã có khách dọn vào ở.",
    roomType: "Phòng studio",
    priceVnd: 4950000,
    areaM2: 27,
    amenities: ["Máy lạnh", "Tủ lạnh", "Giường", "Ban công", "Wifi"],
    ward: "Phường Thạnh Mỹ Tây",
    publicAddress: "Khu Ung Văn Khiêm – D2",
    privateAddress: "55/8 Ung Văn Khiêm, Phường Thạnh Mỹ Tây",
    allowExactAddress: false,
    contactPhone: "0908444666",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "RENTED",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(1),
    imageCount: 2,
  },
  {
    title: "Phòng trọ có gác gần Bệnh viện Gia Định đường Hoàng Hoa Thám",
    description: "Phòng trọ yên tĩnh ngay khu trung tâm Bình Thạnh – Phú Nhuận, thuận tiện di chuyển ra sân bay và Quận 3.",
    roomType: "Phòng có gác",
    priceVnd: 3400000,
    areaM2: 21,
    amenities: ["Máy lạnh", "Gác lửng", "Nhà vệ sinh riêng", "Wifi"],
    ward: "Phường Gia Định",
    publicAddress: "Gần Hoàng Hoa Thám – Phan Đăng Lưu",
    privateAddress: "18/2 Hoàng Hoa Thám, Phường Gia Định",
    allowExactAddress: false,
    contactPhone: "0908555777",
    allowPublicPhone: true,
    contactZalo: "0908555777",
    allowPublicZalo: true,
    availability: "RENTED",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(26),
    imageCount: 2,
  },
  {
    title: "Căn hộ mini 2 cửa sổ đường Phan Văn Trị Bình Thạnh",
    description: "Căn hộ mini đầy đủ nội thất tại trục Phan Văn Trị sầm uất, có thang máy, gần siêu thị Emart và Phạm Văn Đồng.",
    roomType: "Căn hộ mini",
    priceVnd: 5600000,
    areaM2: 34,
    amenities: ["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Bếp riêng", "Cửa sổ"],
    ward: "Phường Bình Thạnh",
    publicAddress: "Khu Phan Văn Trị – Chu Văn An",
    privateAddress: "412/5 Phan Văn Trị, Phường Bình Thạnh",
    allowExactAddress: false,
    contactPhone: "0908666888",
    allowPublicPhone: true,
    contactZalo: "0908666888",
    allowPublicZalo: true,
    availability: "RENTED",
    publishStatus: "PUBLISHED",
    publishedAt: hoursAgo(28),
    imageCount: 2,
  },

  // 2 DRAFT (tuyệt đối không xuất hiện ở public)
  {
    title: "[DRAFT] Phòng đang hoàn thiện nội thất Phường Gia Định",
    description: "Bản nháp nội bộ chưa được xuất bản lên trang khách.",
    roomType: "Phòng trọ",
    priceVnd: 3100000,
    areaM2: 19,
    amenities: ["Wifi", "Cửa sổ"],
    ward: "Phường Gia Định (DRAFT-ONLY)",
    publicAddress: "Gần Vũ Huy Tấn",
    privateAddress: "PRIVATE-ONLY-TOKEN-DRAFT 999 Xô Viết Nghệ Tĩnh",
    allowExactAddress: false,
    contactPhone: "0907000111",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "DRAFT",
    publishedAt: null,
    imageCount: 2,
  },
  {
    title: "[DRAFT] Căn hộ mini mới chụp ảnh Phường Gia Định",
    description: "Tin nháp số 2 dùng để kiểm tra lọc và chặn truy cập công khai.",
    roomType: "Căn hộ mini",
    priceVnd: 5900000,
    areaM2: 35,
    amenities: ["Máy lạnh", "Tủ lạnh"],
    ward: "Phường Gia Định (DRAFT-ONLY)",
    publicAddress: "Khu Đinh Tiên Hoàng",
    privateAddress: "PRIVATE-ONLY-TOKEN-DRAFT 888 Đinh Tiên Hoàng",
    allowExactAddress: true,
    contactPhone: "0907000222",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "DRAFT",
    publishedAt: null,
    imageCount: 2,
  },

  // 2 HIDDEN (tuyệt đối không xuất hiện ở public)
  {
    title: "[HIDDEN] Phòng tạm ẩn bảo trì điện nước Bình Lợi Trung",
    description: "Tin đã ẩn bởi quản trị viên.",
    roomType: "Phòng studio",
    priceVnd: 4200000,
    areaM2: 24,
    amenities: ["Máy lạnh", "Wifi"],
    ward: "Phường Bình Lợi Trung (HIDDEN-ONLY)",
    publicAddress: "Gần Nơ Trang Long – Lê Quang Định",
    privateAddress: "PRIVATE-ONLY-TOKEN-HIDDEN 888 Bạch Đằng",
    allowExactAddress: false,
    contactPhone: "0907000333",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "HIDDEN",
    publishedAt: hoursAgo(30),
    imageCount: 2,
  },
  {
    title: "[HIDDEN] Phòng ngừng đăng khu Bình Thạnh",
    description: "Tin đã ẩn số 2.",
    roomType: "Phòng có gác",
    priceVnd: 3600000,
    areaM2: 22,
    amenities: ["Gác lửng", "Wifi"],
    ward: "Phường Bình Thạnh (HIDDEN-ONLY)",
    publicAddress: "Khu Phan Văn Trị",
    privateAddress: "PRIVATE-ONLY-TOKEN-HIDDEN 111 Phan Văn Trị",
    allowExactAddress: false,
    contactPhone: "0907000444",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "HIDDEN",
    publishedAt: hoursAgo(32),
    imageCount: 2,
  },

  // 1 DELETED (soft-deleted)
  {
    title: "[DELETED] Phòng đã xóa mềm Bình Quới",
    description: "Tin đã đưa vào thùng rác lưu trữ.",
    roomType: "Phòng trọ",
    priceVnd: 2700000,
    areaM2: 18,
    amenities: ["Wifi"],
    ward: "Phường Bình Quới (DELETED-ONLY)",
    publicAddress: "Bán đảo Thanh Đa",
    privateAddress: "PRIVATE-ONLY-TOKEN-DELETED 777 Bình Quới",
    allowExactAddress: false,
    contactPhone: "0907000555",
    allowPublicPhone: true,
    contactZalo: "",
    allowPublicZalo: false,
    availability: "AVAILABLE",
    publishStatus: "HIDDEN",
    publishedAt: hoursAgo(36),
    deletedAt: hoursAgo(2),
    imageCount: 2,
  },
];

async function cleanupPreviousSeed(roomListings) {
  const existing = await roomListings
    .find({ seedTag: SEED_TAG })
    .project({ _id: 1 })
    .toArray();

  for (const doc of existing) {
    await fs.rm(path.join(UPLOADS_ROOT, doc._id), { recursive: true, force: true });
  }
  if (existing.length > 0) {
    await roomListings.deleteMany({ seedTag: SEED_TAG });
  }
  return existing.length;
}

async function main() {
  await ensureIndexes();
  const { adminAccounts, roomListings } = await getCollections();
  const admin = await adminAccounts.findOne({ singletonKey: "PRIMARY_ADMIN" });
  const actorId = admin?._id || "seed-sprint2-system";

  const removed = await cleanupPreviousSeed(roomListings);
  const docsToInsert = [];

  for (let i = 0; i < SAMPLE_LISTINGS.length; i += 1) {
    const spec = SAMPLE_LISTINGS[i];
    const listingId = randomUUID();
    const now = hoursAgo(0.5);
    const images = [];

    for (let j = 0; j < spec.imageCount; j += 1) {
      const imageId = randomUUID();
      const storageKey = `${imageId}.png`;
      const palette = ROOM_PALETTES[(i + j) % ROOM_PALETTES.length];
      const pngBuffer = generateRoomPng(640, 480, palette);
      await imageStorage.write({ listingId, storageKey, buffer: pngBuffer });
      images.push({
        id: imageId,
        storageKey,
        mimeType: "image/png",
        byteSize: pngBuffer.length,
        originalName: `phong-${i + 1}-anh-${j + 1}.png`,
        altText: `${spec.title} - ảnh ${j + 1}`,
        sortOrder: j,
        isCover: j === 0,
        createdAt: now,
      });
    }

    docsToInsert.push({
      _id: listingId,
      seedTag: SEED_TAG,
      title: spec.title,
      description: spec.description,
      roomType: spec.roomType,
      priceVnd: spec.priceVnd,
      areaM2: spec.areaM2,
      amenities: spec.amenities,
      ward: spec.ward,
      district: "Bình Thạnh",
      city: "TP. Hồ Chí Minh",
      publicAddress: spec.publicAddress,
      privateAddress: spec.privateAddress,
      allowExactAddress: spec.allowExactAddress,
      contactPhone: spec.contactPhone,
      allowPublicPhone: spec.allowPublicPhone,
      contactZalo: spec.contactZalo,
      allowPublicZalo: spec.allowPublicZalo,
      availability: spec.availability,
      publishStatus: spec.publishStatus,
      publishedAt: spec.publishedAt,
      deletedAt: spec.deletedAt || null,
      deletedBy: spec.deletedAt ? actorId : null,
      createdBy: actorId,
      updatedBy: actorId,
      version: 1,
      images,
      createdAt: spec.publishedAt || now,
      updatedAt: spec.publishedAt || now,
    });
  }

  await roomListings.insertMany(docsToInsert);

  const summary = {
    removedPreviousSeed: removed,
    insertedTotal: docsToInsert.length,
    publishedAvailable: docsToInsert.filter((d) => d.publishStatus === "PUBLISHED" && d.availability === "AVAILABLE" && !d.deletedAt).length,
    publishedRented: docsToInsert.filter((d) => d.publishStatus === "PUBLISHED" && d.availability === "RENTED" && !d.deletedAt).length,
    draft: docsToInsert.filter((d) => d.publishStatus === "DRAFT").length,
    hidden: docsToInsert.filter((d) => d.publishStatus === "HIDDEN" && !d.deletedAt).length,
    softDeleted: docsToInsert.filter((d) => d.deletedAt !== null).length,
  };
  console.log("SPRINT_2_SEED_OK", JSON.stringify(summary));
}

main()
  .catch((error) => {
    console.error("Sprint 2 seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
