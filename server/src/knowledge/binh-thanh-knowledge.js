// Bộ tri thức & ánh xạ địa lý Bình Thạnh + Chính sách Ngọc Toàn dùng trực tiếp cho Bé Toàn AI.

const OWNER_CONTACT = {
  managerName: "Ngọc Toàn",
  phone: "0947832801",
  phoneDisplay: "0947 832 801",
  zaloUrl: "https://zalo.me/0947832801",
  supportHours: "08:00 – 21:30 hàng ngày (kể cả T7 & CN)",
};

// Ánh xạ địa điểm / trường ĐH / tiện ích -> phường 2026 & các tuyến đường lân cận (chuỗi không dấu)
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
    triggers: ["van lang", "vlu", "dang thuy tram", "binh loi", "emart", "pham van dong"],
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
    triggers: ["landmark", "vinhomes", "tan cang", "pearl plaza", "van thanh", "metro", "thao dien", "cau sai gon"],
    ward: "Phường Thạnh Mỹ Tây",
    nearbyStreets: ["nguyen huu canh", "dien bien phu", "ung van khiem", "nguyen van thuong", "nguyen gia tri", "vo duy ninh", "ngo tat to"],
  },
  {
    triggers: ["quan 1", "q1", "thi nghe", "cau thi nghe", "trung tam"],
    ward: "Phường Gia Định",
    nearbyStreets: ["nguyen cuu van", "phan van han", "xo viet nghe tinh", "pham viet chanh", "ngo tat to", "nguyen huu canh", "truong sa", "bui huu nghia", "vu tung"],
  },
  {
    triggers: ["thanh da", "binh quoi"],
    ward: "Phường Bình Quới",
    nearbyStreets: ["binh quoi", "thanh da"],
  },
];

// Hướng dẫn kiến thức chuẩn hóa để bơm vào system prompt của Gemini (gọn, rõ, tránh tốn token dư thừa)
const SYSTEM_KNOWLEDGE_PROMPT = [
  "KIẾN THỨC ĐỊA BÀN BÌNH THẠNH & CHÍNH SÁCH HỆ THỐNG NGỌC TOÀN:",
  `- Liên hệ trực tiếp chủ quản lý: ${OWNER_CONTACT.managerName} — Hotline/Zalo: ${OWNER_CONTACT.phoneDisplay} (${OWNER_CONTACT.zaloUrl}), hỗ trợ xem phòng ${OWNER_CONTACT.supportHours}. Xem phòng thực tế miễn phí 100%.`,
  "- QUY TẮC GIÁ ĐIỆN, NƯỚC, DỊCH VỤ, PHÍ GỬI XE: Nếu tin đăng phòng không ghi chi tiết hoặc khách hỏi sâu về tiền điện, tiền nước, wifi, rác, phí dịch vụ, phí giữ xe, KHÔNG được tự bịa giá. Hãy báo khách liên hệ trực tiếp Ngọc Toàn (SĐT/Zalo 0947 832 801) để được hỗ trợ kiểm tra đúng tòa nhà và báo chi phí chi tiết nhất.",
  "- QUY TẮC THỜI HẠN HỢP ĐỒNG & TIỀN CỌC:",
  "  + Khách hỏi 'cọc bao nhiêu tháng' / thời hạn thuê: trả lời hợp đồng phổ biến thường từ 6 – 12 tháng.",
  "  + Khách hỏi 'cọc bao nhiêu tiền' / giữ phòng: trả lời thường cọc trước 50% tiền phòng để lock (giữ) phòng chờ ngày dọn vào đóng đủ phần còn lại. Nhấn mạnh rõ: tiền cọc là chủ nhà thu trực tiếp, bên Ngọc Toàn không giữ tiền của khách.",
  "- FAQ KHÁCH TRỌ HAY HỎI:",
  "  + An ninh & giờ giấc: Đa số tòa nhà không chung chủ, giờ giấc tự do 24/24, khóa vân tay, camera an ninh, có chỗ để xe.",
  "  + Tạm trú & hợp đồng: Ký hợp đồng minh bạch trực tiếp với chủ nhà, hỗ trợ đăng ký tạm trú theo quy định (chỉ cần CCCD/VNeID).",
  "  + Số người ở / nuôi thú cưng (pet): Phòng tiêu chuẩn ở thoải mái 1–2 người; nuôi thú cưng tùy tòa nhà — gợi ý nhắn Zalo 0947 832 801 để Toàn lọc đúng căn cho nuôi pet.",
  "- BẢN ĐỒ TRƯỜNG ĐẠI HỌC & CÁC ĐƯỜNG GẦN NHẤT Ở BÌNH THẠNH (5 phường mới 2026):",
  "  + ĐH Giao thông Vận tải (UTH - CS1 đường Võ Oanh/D3): Gần nhất là Võ Oanh (D3), Nguyễn Gia Trí (D2), Ung Văn Khiêm, D5, Nguyễn Văn Thương (D1); lân cận 5–10 phút có Xô Viết Nghệ Tĩnh, Điện Biên Phủ, Đinh Bộ Lĩnh, Bùi Đình Túy, Chu Văn An (thuộc P. Thạnh Mỹ Tây & P. Bình Thạnh).",
  "  + ĐH HUTECH (CS Điện Biên Phủ & Ung Văn Khiêm), ĐH Ngoại Thương CS2 (FTU2 - đường D5), ĐH UEF, ĐH Hồng Bàng (HIU): Gần Điện Biên Phủ, Ung Văn Khiêm, Nguyễn Gia Trí (D2), Võ Oanh (D3), D5, Nguyễn Văn Thương (D1), Xô Viết Nghệ Tĩnh, Nguyễn Cửu Vân, Ngô Tất Tố, Hàng Xanh.",
  "  + ĐH Văn Lang CS3 (VLU): Đường Đặng Thùy Trâm, gần Bình Lợi, Phạm Văn Đồng, Phan Văn Trị, Nơ Trang Long, Nguyễn Văn Đậu, Nguyễn Xí (P. Bình Lợi Trung).",
  "  + Học viện Cán bộ: Đường Chu Văn An, gần Đinh Bộ Lĩnh, Bùi Đình Túy, Nguyễn Xí, BX Miền Đông cũ (P. Bình Thạnh).",
  "  + ĐH Mỹ Thuật & khu giáp Q1/Phú Nhuận: Phan Đăng Lưu, Lê Quang Định, Vũ Tùng, Bùi Hữu Nghĩa, Nguyễn Cửu Vân, Cầu Bông, Chợ Bà Chiểu (P. Gia Định).",
  "- TIỆN ÍCH XUNG QUANH (SIÊU THỊ, CỬA HÀNG TIỆN LỢI, CHỢ, GIAO THÔNG):",
  "  + Siêu thị & TTTM: Pearl Plaza (Điện Biên Phủ - ngay khu Hutech/UTH/FTU2), Vincom Center Landmark 81, Co.opmart Chu Văn An, Co.opmart Đinh Tiên Hoàng (khu Gia Định), Emart Phan Văn Trị (tiện từ khu Bình Lợi Trung/Nguyễn Xí/Bùi Đình Túy), Bách Hóa Xanh & WinMart+ dày đặc các tuyến lớn.",
  "  + Cửa hàng tiện lợi 24/7: Circle K, GS25, FamilyMart, 7-Eleven, Ministop phủ kín đường Ung Văn Khiêm, Nguyễn Gia Trí (D2), Võ Oanh (D3), D5, Xô Viết Nghệ Tĩnh, Đinh Bộ Lĩnh, Bùi Đình Túy, Phan Văn Trị, Nơ Trang Long.",
  "  + Chợ truyền thống: Chợ Bà Chiểu, Chợ Văn Thánh, Chợ Thị Nghè, Chợ Chu Văn An, Chợ Cây Thị, Chợ Thanh Đa.",
  "  + Kết nối quận & Metro: Ngã tư Hàng Xanh, Ga Metro Văn Thánh & Tân Cảng (Metro số 1), qua Cầu Sài Gòn sang Thảo Điền Q2 (5 phút), qua Cầu Bông/Cầu Thị Nghè sang Quận 1 (3–8 phút), trục Phạm Văn Đồng đi Gò Vấp/Sân bay/Thủ Đức.",
].join("\n");

/**
 * Mở rộng ngữ cảnh vị trí từ câu hỏi khách (VD: "gần UTH", "gần Hutech", "gần Emart")
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
 * Nhận diện các câu hỏi FAQ phổ biến (điện/nước/xe, cọc/hợp đồng, xem phòng/giờ giấc/thú cưng, tiện ích)
 * để trả lời chuẩn xác ngay cả khi chạy chế độ Smart Fallback (không cần hoặc khi lỗi Gemini).
 */
function buildFaqFallbackAnswer(foldedMsg, hasExplicitCriteria) {
  const asksUtilitiesOrParking = /(?:tien dien|gia dien|dien nuoc|tien nuoc|gia nuoc|phi dich vu|tien xe|gui xe|phi xe|giu xe|wifi bao nhieu|tien rac|may giat)/.test(foldedMsg);
  const asksDepositOrContract = /(?:tien coc|bao nhieu thang|may thang|hop dong|lock phong|giu phong|coc truoc|dat coc)/.test(foldedMsg);
  const asksViewingOrPolicy = /(?:phi xem phong|moi gioi|co mat phi|gio giac|chung chu|van tay|tam tru|thu cung|nuoi meo|nuoi cho|o ghep|may nguoi)/.test(foldedMsg);
  const asksAreaGuide = !hasExplicitCriteria && /(?:gan truong|duong nao|khu nao|sieu thi|cua hang tien loi|circle k|gs25|bach hoa xanh|emart|landmark|cho nao|di lai|metro|tien ich)/.test(foldedMsg)
    && /(?:uth|hutech|ngoai thuong|van lang|hoc vien can bo|binh thanh|gia dinh|thanh my tay)/.test(foldedMsg);

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

  if (asksViewingOrPolicy) {
    blocks.push(
      `Bên Ngọc Toàn hỗ trợ tư vấn và dẫn đi xem phòng thực tế miễn phí 100% (${OWNER_CONTACT.supportHours}). Đa số phòng đều giờ giấc tự do, không chung chủ, khóa vân tay và hỗ trợ đăng ký tạm trú. Nếu bạn cần lọc riêng phòng cho nuôi thú cưng hoặc ở nhiều người, nhắn Zalo ${OWNER_CONTACT.phoneDisplay} để Toàn chọn sẵn căn phù hợp nha!`,
    );
  }

  if (asksAreaGuide) {
    blocks.push(
      "Một số gợi ý khu vực tìm trọ tiện nhất ở Bình Thạnh:\n" +
      "• Gần ĐH UTH / Hutech / Ngoại Thương: Ưu tiên đường Võ Oanh (D3), Nguyễn Gia Trí (D2), Ung Văn Khiêm, D5, Điện Biên Phủ, Xô Viết Nghệ Tĩnh (P. Thạnh Mỹ Tây) — xung quanh có Pearl Plaza, Circle K/GS25 mở 24/7 và rất gần Ga Metro.\n" +
      "• Gần ĐH Văn Lang / Emart: Đường Đặng Thùy Trâm, Bình Lợi, Phạm Văn Đồng, Phan Văn Trị (P. Bình Lợi Trung).\n" +
      "• Gần Học viện Cán bộ / Giá mềm: Đường Chu Văn An, Đinh Bộ Lĩnh, Bùi Đình Túy, Nguyễn Xí (P. Bình Thạnh) — gần Co.opmart Chu Văn An, nhiều quán ăn sinh viên.",
    );
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
