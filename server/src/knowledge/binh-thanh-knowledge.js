// Bộ tri thức địa lý Bình Thạnh (khoảng cách km, thời gian, lộ trình qua quận lân cận) & Chính sách Ngọc Toàn dùng trực tiếp cho Bé Toàn AI.

const OWNER_CONTACT = {
  managerName: "Ngọc Toàn",
  phone: "0947832801",
  phoneDisplay: "0947 832 801",
  zaloUrl: "https://zalo.me/0947832801",
  supportHours: "08:00 – 21:30 hàng ngày (kể cả T7 & CN)",
};

// Ánh xạ địa điểm / trường ĐH / quận lân cận / tiện ích -> phường 2026 & các tuyến đường lân cận (chuỗi không dấu)
const LOCATION_EXPANSION_RULES = [
  {
    triggers: ["uth", "gtvt", "giao thong van tai", "vo oanh", "duong d3", "d3"],
    ward: "Phường Thạnh Mỹ Tây",
    nearbyStreets: ["vo oanh", "nguyen gia tri", "ung van khiem", "duong d5", "nguyen van thuong", "xo viet nghe tinh", "dien bien phu", "dinh bo linh", "bui dinh tuy"],
  },
  {
    triggers: ["hutech", "dien bien phu", "hang xanh", "nga tu hang xanh", "nga 4 hang xanh", "uef", "hong bang", "hiu"],
    ward: "Phường Thạnh Mỹ Tây",
    nearbyStreets: ["dien bien phu", "ung van khiem", "nguyen gia tri", "vo oanh", "nguyen van thuong", "duong d5", "xo viet nghe tinh", "nguyen cuu van", "ngo tat to", "phan van han"],
  },
  {
    triggers: ["ngoai thuong", "ftu", "ftu2", "duong d5", "d5", "nguyen gia tri", "duong d2", "d2"],
    ward: "Phường Thạnh Mỹ Tây",
    nearbyStreets: ["duong d5", "nguyen gia tri", "vo oanh", "ung van khiem", "nguyen van thuong", "xo viet nghe tinh", "dien bien phu", "nguyen cuu van"],
  },
  {
    triggers: ["van lang", "vlu", "dang thuy tram", "binh loi", "emart", "pham van dong", "pvd"],
    ward: "Phường Bình Lợi Trung",
    nearbyStreets: ["dang thuy tram", "binh loi", "pham van dong", "phan van tri", "no trang long", "nguyen van dau", "le quang dinh", "nguyen xi"],
  },
  {
    triggers: ["hoc vien can bo", "chu van an", "bx mien dong", "bxmd", "ben xe mien dong", "dinh bo linh", "bui dinh tuy", "nguyen xi", "coopmart chu van an"],
    ward: "Phường Bình Thạnh",
    nearbyStreets: ["chu van an", "dinh bo linh", "bui dinh tuy", "nguyen xi", "phan van tri", "no trang long", "bach dang"],
  },
  {
    triggers: ["ba chieu", "cho ba chieu", "gia dinh", "bv gia dinh", "ung buou", "my thuat", "phan dang luu", "cau bong", "thuy loi"],
    ward: "Phường Gia Định",
    nearbyStreets: ["phan dang luu", "vu tung", "bui huu nghia", "nguyen cuu van", "le van duyet", "le quang dinh", "bach dang", "truong sa", "hoang hoa tham", "phan van han"],
  },
  {
    triggers: ["landmark", "vinhomes", "tan cang", "pearl plaza", "van thanh", "metro", "thao dien", "quan 2", "q2", "an phu", "cau sai gon"],
    ward: "Phường Thạnh Mỹ Tây",
    nearbyStreets: ["nguyen huu canh", "dien bien phu", "ung van khiem", "nguyen van thuong", "nguyen gia tri", "vo duy ninh", "ngo tat to", "vo oanh"],
  },
  {
    triggers: ["quan 1", "q1", "thi nghe", "cau thi nghe", "da kao", "ben nghe", "trung tam", "khxh"],
    ward: "Phường Gia Định",
    nearbyStreets: ["nguyen cuu van", "phan van han", "xo viet nghe tinh", "pham viet chanh", "ngo tat to", "nguyen huu canh", "truong sa", "bui huu nghia", "vu tung", "le van duyet"],
  },
  {
    triggers: ["phu nhuan", "quan 3", "q3", "phan xich long", "cau kieu", "hoang hoa tham", "nguyen van dau"],
    ward: "Phường Gia Định",
    nearbyStreets: ["phan dang luu", "le quang dinh", "hoang hoa tham", "nguyen van dau", "vu huy tan", "bui huu nghia", "truong sa", "tran binh trong"],
  },
  {
    triggers: ["go vap", "san bay", "tan son nhat", "iuh", "cong nghiep", "thu duc", "hiep binh chanh", "cau binh loi", "cau binh trieu", "lang dai hoc"],
    ward: "Phường Bình Lợi Trung",
    nearbyStreets: ["pham van dong", "phan van tri", "binh loi", "dang thuy tram", "nguyen xi", "dinh bo linh", "no trang long", "le quang dinh", "nguyen van dau"],
  },
  {
    triggers: ["thanh da", "binh quoi"],
    ward: "Phường Bình Quới",
    nearbyStreets: ["binh quoi", "thanh da"],
  },
];

// Hướng dẫn kiến thức chuẩn hóa để bơm vào system prompt của Gemini (gọn, đủ km/phút & chính sách, tối ưu token)
const SYSTEM_KNOWLEDGE_PROMPT = [
  "CẨM NANG ĐỊA BÀN BÌNH THẠNH (KHOẢNG CÁCH KM / PHÚT / TIỆN ÍCH) & CHÍNH SÁCH NGỌC TOÀN:",
  `- Liên hệ quản lý: ${OWNER_CONTACT.managerName} — Hotline/Zalo: ${OWNER_CONTACT.phoneDisplay} (${OWNER_CONTACT.zaloUrl}), hỗ trợ xem phòng ${OWNER_CONTACT.supportHours}. Xem phòng thực tế miễn phí 100%, không thu phí môi giới.`,
  "- QUY TẮC ĐIỆN, NƯỚC, DỊCH VỤ, PHÍ XE: Nếu tin đăng không ghi cụ thể hoặc khách hỏi giá điện, nước, dịch vụ, wifi, rác, phí gửi xe, KHÔNG tự bịa số tiền; báo khách liên hệ trực tiếp Ngọc Toàn (0947 832 801 / Zalo) để Toàn kiểm tra đúng tòa nhà và hỗ trợ chi tiết.",
  "- QUY TẮC HỢP ĐỒNG & TIỀN CỌC:",
  "  + Hỏi 'cọc bao nhiêu tháng' / thời hạn thuê: trả lời hợp đồng phổ biến thường từ 6 – 12 tháng.",
  "  + Hỏi 'cọc bao nhiêu tiền' / giữ phòng: trả lời thường cọc trước 50% tiền phòng để lock (giữ) phòng chờ ngày dọn vào đóng đủ phần còn lại. Nhấn mạnh rõ: tiền cọc là do chủ nhà trực tiếp thu, bên Ngọc Toàn không giữ tiền của khách.",
  "- FAQ PHỔ BIẾN & QUY TRÌNH 5 BƯỚC:",
  "  + Quy trình thuê: Lọc phòng -> Xem thực tế miễn phí -> Lock cọc 50% trực tiếp chủ nhà (giữ 3–7 ngày) -> Ký HĐ 6–12 tháng & đóng đủ khi dọn vào -> Hỗ trợ đăng ký tạm trú (CCCD/VNeID).",
  "  + Giờ giấc & an ninh: Đa số không chung chủ, giờ tự do 24/24, khóa vân tay, camera an ninh. Phòng tiêu chuẩn ở 1–2 người; nuôi thú cưng tùy căn (nhắn Zalo 0947 832 801 để lọc sẵn).",
  "- KHOẢNG CÁCH TỪ CÁC ĐƯỜNG ĐẾN TRƯỜNG ĐH (5 PHƯỜNG MỚI 2026: Thạnh Mỹ Tây, Bình Thạnh, Gia Định, Bình Lợi Trung, Bình Quới):",
  "  + ĐH Giao thông Vận tải (UTH - số 2 Võ Oanh/D3): Võ Oanh (0.1–0.6km, đi bộ 2–6p); Nguyễn Gia Trí/D2, D5 (0.3–1km, 2–4p); Ung Văn Khiêm, Nguyễn Văn Thương/D1 (0.5–1.5km, 2–5p); Điện Biên Phủ, XVNT (0.8–2.2km, 3–7p); Đinh Bộ Lĩnh, Bùi Đình Túy, Chu Văn An (1.5–3km, 5–9p).",
  "  + ĐH HUTECH (475A Điện Biên Phủ & 31/36 UVK), ĐH Ngoại Thương CS2 (15 D5), ĐH UEF (141 ĐBP), ĐH Hồng Bàng (215 ĐBP): Điện Biên Phủ, UVK, D1, D2, D3, D5 (0.1–1.5km, 1–5p); XVNT, Nguyễn Cửu Vân, Ngô Tất Tố, Phan Văn Hân (0.7–2.2km, 3–7p); Đinh Bộ Lĩnh, Bùi Đình Túy (1.5–2.8km, 5–8p).",
  "  + ĐH Văn Lang CS3 (69/68 Đặng Thùy Trâm): Đặng Thùy Trâm, Bình Lợi (0.1–1km, 1–3p); Phạm Văn Đồng, Phan Văn Trị (0.8–2km, 3–6p); Nơ Trang Long, Nguyễn Văn Đậu, Nguyễn Xí (1.5–3km, 5–9p).",
  "  + Học viện Cán bộ (324 Chu Văn An): Chu Văn An, Đinh Bộ Lĩnh, Bùi Đình Túy (0.1–1.5km, 1–5p); Nguyễn Xí, Phan Văn Trị (1–2.2km, 3–7p). ĐH Mỹ Thuật (5 Phan Đăng Lưu): Phan Đăng Lưu, Lê Quang Định, Vũ Tùng, Hoàng Hoa Thám (0.2–1.8km, 2–6p).",
  "- DI CHUYỂN SANG QUẬN 1 & QUẬN LÂN CẬN:",
  "  + Sang Quận 1 (Đa Kao, Bến Nghé, TCV): Qua Cầu Thị Nghè từ Nguyễn Cửu Vân, Phan Văn Hân, XVNT, Trường Sa, Phạm Viết Chánh (0.8–2.2km, 3–6p); hoặc qua Cầu Bông từ Lê Văn Duyệt, Bùi Hữu Nghĩa, Vũ Tùng, Phan Đăng Lưu (0.8–2.5km, 3–7p); từ khu D2/D3/Đinh Bộ Lĩnh vào Q1 khoảng 2.5–4.5km (7–12p).",
  "  + Sang Phú Nhuận / Q3: Từ Phan Đăng Lưu, Lê Quang Định, Hoàng Hoa Thám, Nguyễn Văn Đậu, Vũ Huy Tấn, Trường Sa chỉ 0.5–2.8km (2–8p).",
  "  + Sang Thảo Điền / Q2 / TP. Thủ Đức: Qua Cầu Sài Gòn hoặc Ga Metro Văn Thánh/Tân Cảng từ Điện Biên Phủ, UVK, Nguyễn Hữu Cảnh, D1/D2 mất 1.5–3.5km (4–8p); hướng Cầu Bình Lợi/Phạm Văn Đồng/Nguyễn Xí sang Thủ Đức mất 2–4.5km (5–10p).",
  "  + Sang Gò Vấp / Sân bay Tân Sơn Nhất: Qua Phạm Văn Đồng, Phan Văn Trị, Lê Quang Định, Nguyễn Văn Đậu sang Gò Vấp 1.5–4km (5–10p), ra Sân bay 10–16p.",
  "- TIỆN ÍCH BÁN KÍNH 500M–2KM: Siêu thị Pearl Plaza (ĐBP), Vincom Landmark 81, Co.opmart Chu Văn An, Co.opmart Đinh Tiên Hoàng, Emart Phan Văn Trị, Tops/Mega Market (qua Cầu Sài Gòn); Circle K/GS25/FamilyMart/WinMart+/BHX 24/7 dày đặc các trục chính; Chợ Bà Chiểu, Thị Nghè, Văn Thánh, Chu Văn An, Cây Thị; BV Gia Định, Ung Bướu, Bình Thạnh, Vinmec; Ga Metro Văn Thánh & Tân Cảng.",
].join("\n");

/**
 * Mở rộng ngữ cảnh vị trí từ câu hỏi khách (VD: "gần UTH", "đi làm Quận 1", "gần Emart")
 * thành phường 2026 + danh sách các tuyến đường lân cận để phục vụ cả Smart Fallback và pre-filter.
 */
function expandLocationFromKnowledge(foldedMsg) {
  let inferredWard = "";
  const expandedStreets = new Set();

  for (const rule of LOCATION_EXPANSION_RULES) {
    const hit = rule.triggers.some((trigger) => foldedMsg.includes(trigger));
    if (hit) {
      if (!inferredWard) inferredWard = rule.ward;
      rule.nearbyStreets.forEach((street) => expandedStreets.add(street));
    }
  }

  return {
    inferredWard,
    expandedStreets: [...expandedStreets],
  };
}

/**
 * Phát hiện câu hỏi về lộ trình, khoảng cách km/phút sang quận lân cận hoặc tới trường đại học
 * để trả lời chi tiết ngay cả khi chạy chế độ Smart Fallback.
 */
function buildTransitGuideReply(foldedMsg) {
  if (/(?:quan 1|q1|da kao|ben nghe|trung tam)/.test(foldedMsg)) {
    return (
      "Từ Bình Thạnh sang Quận 1 rất gần ạ:\n" +
      "• Qua Cầu Thị Nghè (từ Nguyễn Cửu Vân, Phan Văn Hân, Phạm Viết Chánh, Trường Sa, Xô Viết Nghệ Tĩnh): khoảng 0.8 – 2.2 km (3 – 6 phút).\n" +
      "• Qua Cầu Bông (từ Lê Văn Duyệt, Vũ Tùng, Bùi Hữu Nghĩa, Phan Đăng Lưu, khu Bà Chiểu): khoảng 0.8 – 2.5 km (3 – 7 phút).\n" +
      "• Từ khu D2/D3/Ung Văn Khiêm hoặc Đinh Bộ Lĩnh vào Q1: khoảng 2.5 – 4.5 km (7 – 12 phút)."
    );
  }
  if (/(?:phu nhuan|quan 3|q3|phan xich long)/.test(foldedMsg)) {
    return (
      "Di chuyển sang Phú Nhuận / Quận 3 nhanh nhất là ở các trục Phan Đăng Lưu, Lê Quang Định, Hoàng Hoa Thám, Nguyễn Văn Đậu, Vũ Huy Tấn hoặc Trường Sa — chỉ cách khoảng 0.5 – 2.8 km (2 – 8 phút chạy xe) ạ."
    );
  }
  if (/(?:thao dien|quan 2|q2|an phu|metro|thu duc)/.test(foldedMsg)) {
    return (
      "Di chuyển sang Thảo Điền / Q2 hoặc Thủ Đức rất tiện:\n" +
      "• Qua Cầu Sài Gòn hoặc Ga Metro Văn Thánh / Tân Cảng (từ Điện Biên Phủ, Ung Văn Khiêm, Nguyễn Hữu Cảnh, D1/D2): chỉ 1.5 – 3.5 km (4 – 8 phút sang Thảo Điền).\n" +
      "• Hướng Thủ Đức / Hiệp Bình Chánh: chọn Phạm Văn Đồng, Bình Lợi, Đặng Thùy Trâm hoặc Nguyễn Xí qua Cầu Bình Lợi mất 2 – 4.5 km (5 – 10 phút)."
    );
  }
  if (/(?:go vap|san bay|tan son nhat|iuh|cong nghiep)/.test(foldedMsg)) {
    return (
      "Đi Gò Vấp hoặc Sân bay Tân Sơn Nhất bạn nên chọn trục Phạm Văn Đồng, Phan Văn Trị, Đặng Thùy Trâm, Lê Quang Định hoặc Nguyễn Văn Đậu: sang Gò Vấp chỉ 1.5 – 4 km (5 – 10 phút), ra Sân bay mất khoảng 10 – 16 phút ạ."
    );
  }
  if (/(?:uth|gtvt|giao thong van tai)/.test(foldedMsg)) {
    return (
      "ĐH Giao thông Vận tải (UTH - số 2 Võ Oanh/D3) gần nhất các tuyến:\n" +
      "• Đi bộ / 2–4 phút (0.1 – 1 km): Võ Oanh (D3), Nguyễn Gia Trí (D2), Đường D5, Ung Văn Khiêm.\n" +
      "• Chạy xe 4–8 phút (1 – 2.8 km): Nguyễn Văn Thương (D1), Điện Biên Phủ, Xô Viết Nghệ Tĩnh, Đinh Bộ Lĩnh, Bùi Đình Túy, Chu Văn An."
    );
  }
  if (/(?:hutech|ngoai thuong|ftu|uef|hong bang|hiu)/.test(foldedMsg)) {
    return (
      "Khu Hutech / Ngoại Thương / UEF / Hồng Bàng gần nhất các đường Điện Biên Phủ, Ung Văn Khiêm, Nguyễn Gia Trí (D2), Võ Oanh (D3), D5, D1 (0.1 – 1.5 km, 1–5 phút), hoặc Xô Viết Nghệ Tĩnh, Nguyễn Cửu Vân, Ngô Tất Tố, Đinh Bộ Lĩnh, Bùi Đình Túy (3–8 phút) — xung quanh có Pearl Plaza, Circle K/GS25 mở 24/7 ạ."
    );
  }
  if (/(?:van lang|vlu)/.test(foldedMsg)) {
    return (
      "ĐH Văn Lang CS3 (Đặng Thùy Trâm) gần nhất là Đặng Thùy Trâm, Bình Lợi (0.1 – 1 km, 1–3 phút) và Phạm Văn Đồng, Phan Văn Trị, Nơ Trang Long, Nguyễn Văn Đậu, Nguyễn Xí (0.8 – 3 km, 3–8 phút), sát Emart Phan Văn Trị ạ."
    );
  }
  return "";
}

/**
 * Nhận diện các câu hỏi FAQ phổ biến (điện/nước/xe, cọc/hợp đồng, quy trình, lộ trình/km/tiện ích)
 * để trả lời chuẩn xác ngay cả khi chạy chế độ Smart Fallback (không cần hoặc khi lỗi Gemini).
 */
function buildFaqFallbackAnswer(foldedMsg, hasExplicitCriteria) {
  const asksUtilitiesOrParking = /(?:tien dien|gia dien|dien nuoc|tien nuoc|gia nuoc|phi dich vu|tien xe|gui xe|phi xe|giu xe|wifi bao nhieu|tien rac|may giat)/.test(foldedMsg);
  const asksDepositOrContract = /(?:tien coc|bao nhieu thang|may thang|hop dong|lock phong|giu phong|coc truoc|dat coc|ai giu tien)/.test(foldedMsg);
  const asksProcess = /(?:quy trinh|cac buoc|thu tuc thue|dat phong nhu nao|muon thue|lam sao thue)/.test(foldedMsg);
  const asksViewingOrPolicy = /(?:phi xem phong|moi gioi|co mat phi|gio giac|chung chu|van tay|tam tru|thu cung|nuoi meo|nuoi cho|o ghep|may nguoi)/.test(foldedMsg);
  const asksTransitOrDistance = /(?:bao nhieu km|may km|may phut|bao lau|lo trinh|duong nao|di qua|di lam|thuan tien|giao thong|ket xe|ngap|gan truong|sieu thi|cua hang tien loi|circle k|gs25|bach hoa xanh|emart|landmark|pearl plaza)/.test(foldedMsg);

  const blocks = [];

  if (asksUtilitiesOrParking) {
    blocks.push(
      `Về chi phí điện, nước, dịch vụ và phí gửi xe sẽ tùy theo từng tòa nhà/chủ trọ quy định ạ. Bạn vui lòng liên hệ trực tiếp anh ${OWNER_CONTACT.managerName} qua SĐT/Zalo ${OWNER_CONTACT.phoneDisplay} (${OWNER_CONTACT.zaloUrl}) để Toàn kiểm tra đúng căn bạn quan tâm và báo chi tiết chính xác nhất nhé!`,
    );
  }

  if (asksDepositOrContract) {
    blocks.push(
      "Về hợp đồng & tiền cọc bên mình rất minh bạch:\n" +
      "• Thời hạn hợp đồng phổ biến thường từ 6 – 12 tháng.\n" +
      "• Để lock (giữ) phòng trước, thường chỉ cần cọc trước 50% tiền phòng, chờ đến ngày dọn vào ở sẽ đóng đủ phần còn lại.\n" +
      "• Tiền cọc là do chủ nhà trực tiếp thu, bên Ngọc Toàn không giữ tiền của khách ạ.",
    );
  }

  if (asksProcess) {
    blocks.push(
      `Quy trình thuê phòng tại Ngọc Toàn gồm 5 bước gọn nhẹ:\n1. Chọn phòng phù hợp nhu cầu\n2. Hẹn Toàn (0947 832 801) đi xem thực tế miễn phí 100%\n3. Ưng ý thì cọc trước 50% lock phòng trực tiếp với chủ nhà (giữ phòng 3–7 ngày)\n4. Ngày dọn vào đóng đủ phần còn lại & ký hợp đồng 6–12 tháng\n5. Chủ nhà hỗ trợ đăng ký tạm trú & kỹ thuật suốt quá trình ở.`,
    );
  }

  if (asksViewingOrPolicy) {
    blocks.push(
      `Bên Ngọc Toàn hỗ trợ tư vấn và dẫn đi xem phòng thực tế miễn phí 100% (${OWNER_CONTACT.supportHours}). Đa số phòng đều giờ giấc tự do, không chung chủ, khóa vân tay và hỗ trợ đăng ký tạm trú. Nếu bạn cần lọc riêng phòng cho nuôi thú cưng hoặc ở nhiều người, nhắn Zalo ${OWNER_CONTACT.phoneDisplay} để Toàn chọn sẵn căn phù hợp nha!`,
    );
  }

  if (asksTransitOrDistance) {
    const transitReply = buildTransitGuideReply(foldedMsg);
    if (transitReply) {
      blocks.push(transitReply);
    } else if (!hasExplicitCriteria) {
      blocks.push(
        "Tại Bình Thạnh, các tuyến Nguyễn Gia Trí (D2), Võ Oanh (D3), Ung Văn Khiêm, Điện Biên Phủ, Đinh Bộ Lĩnh, Bùi Đình Túy, Chu Văn An, Phan Văn Trị đều có dày đặc Circle K/GS25 24/7, Bách Hóa Xanh, WinMart+, gần các siêu thị lớn (Pearl Plaza, Landmark 81, Co.opmart Chu Văn An, Emart Phan Văn Trị) và Ga Metro Văn Thánh / Tân Cảng.",
      );
    }
  }

  if (!blocks.length) return "";
  return blocks.join("\n\n");
}

module.exports = {
  OWNER_CONTACT,
  LOCATION_EXPANSION_RULES,
  SYSTEM_KNOWLEDGE_PROMPT,
  expandLocationFromKnowledge,
  buildFaqFallbackAnswer,
};
