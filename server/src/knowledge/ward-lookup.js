// Bảng tra cứu số nhà & tuyến đường Quận Bình Thạnh -> 5 Phường mới 2026 dùng cho Admin /api/v1/admin/geocode-ward.

function foldVi(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

const asciiWord = (body, flags = "i") => new RegExp(`(?<![a-z0-9])(?:${body})(?![a-z0-9])`, flags);

const OLD_WARD_TO_2026 = {
  1: "Phường Gia Định",
  2: "Phường Gia Định",
  3: "Phường Gia Định",
  7: "Phường Gia Định",
  15: "Phường Gia Định",
  17: "Phường Gia Định",
  12: "Phường Bình Thạnh",
  14: "Phường Bình Thạnh",
  24: "Phường Bình Thạnh",
  26: "Phường Bình Thạnh",
  5: "Phường Bình Lợi Trung",
  6: "Phường Bình Lợi Trung",
  11: "Phường Bình Lợi Trung",
  13: "Phường Bình Lợi Trung",
  19: "Phường Thạnh Mỹ Tây",
  21: "Phường Thạnh Mỹ Tây",
  22: "Phường Thạnh Mỹ Tây",
  25: "Phường Thạnh Mỹ Tây",
  27: "Phường Bình Quới",
  28: "Phường Bình Quới",
};

const MULTI_WARD_STREET_NUMBER_RULES = [
  {
    streetLabel: "Xô Viết Nghệ Tĩnh",
    streetPattern: /(?:xo viet nghe tinh|xvnt)/i,
    segments: [
      { parity: "odd", min: 1, max: 299, ward: "Phường Gia Định" },
      { parity: "odd", min: 301, max: 679, ward: "Phường Bình Thạnh" },
      { parity: "odd", min: 681, max: 900, ward: "Phường Thạnh Mỹ Tây" },
      { parity: "odd", min: 901, max: Infinity, ward: "Phường Bình Quới" },
      { parity: "even", min: 2, max: 900, ward: "Phường Thạnh Mỹ Tây" },
    ],
  },
  {
    streetLabel: "Điện Biên Phủ",
    streetPattern: /(?:dien bien phu|dbp)/i,
    segments: [
      { parity: "any", min: 1, max: 400, ward: "Phường Gia Định" },
      { parity: "any", min: 401, max: Infinity, ward: "Phường Thạnh Mỹ Tây" },
    ],
  },
  {
    streetLabel: "Bạch Đằng",
    streetPattern: /bach dang/i,
    segments: [
      { parity: "odd", min: 1, max: 399, ward: "Phường Gia Định" },
      { parity: "even", min: 2, max: 40, ward: "Phường Gia Định" },
      { parity: "even", min: 42, max: Infinity, ward: "Phường Bình Thạnh" },
      { parity: "odd", min: 401, max: Infinity, ward: "Phường Bình Thạnh" },
    ],
  },
  {
    streetLabel: "Phan Đăng Lưu",
    streetPattern: /phan dang luu/i,
    segments: [
      { parity: "odd", min: 1, max: 250, ward: "Phường Gia Định" },
      { parity: "even", min: 2, max: 68, ward: "Phường Bình Thạnh" },
      { parity: "even", min: 70, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Lê Quang Định",
    streetPattern: /le quang dinh/i,
    segments: [
      { parity: "odd", min: 1, max: 95, ward: "Phường Gia Định" },
      { parity: "even", min: 2, max: 210, ward: "Phường Bình Thạnh" },
      { parity: "odd", min: 97, max: Infinity, ward: "Phường Bình Lợi Trung" },
      { parity: "even", min: 212, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Nơ Trang Long",
    streetPattern: /no trang long/i,
    segments: [
      { parity: "odd", min: 1, max: 135, ward: "Phường Gia Định" },
      { parity: "odd", min: 137, max: 249, ward: "Phường Bình Thạnh" },
      { parity: "even", min: 2, max: 278, ward: "Phường Bình Thạnh" },
      { parity: "odd", min: 251, max: Infinity, ward: "Phường Bình Lợi Trung" },
      { parity: "even", min: 280, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Phan Văn Trị",
    streetPattern: /phan van tri/i,
    segments: [
      { parity: "odd", min: 1, max: 269, ward: "Phường Bình Thạnh" },
      { parity: "even", min: 2, max: 300, ward: "Phường Bình Thạnh" },
      { parity: "odd", min: 271, max: Infinity, ward: "Phường Bình Lợi Trung" },
      { parity: "even", min: 302, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Nguyễn Xí",
    streetPattern: /nguyen xi/i,
    segments: [
      { parity: "any", min: 1, max: 239, ward: "Phường Bình Thạnh" },
      { parity: "any", min: 240, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Hoàng Hoa Thám",
    streetPattern: /hoang hoa tham/i,
    segments: [
      { parity: "any", min: 1, max: 70, ward: "Phường Gia Định" },
      { parity: "any", min: 71, max: Infinity, ward: "Phường Bình Lợi Trung" },
    ],
  },
  {
    streetLabel: "Trường Sa",
    streetPattern: /truong sa/i,
    segments: [
      { parity: "any", min: 1, max: 30, ward: "Phường Thạnh Mỹ Tây" },
      { parity: "any", min: 31, max: Infinity, ward: "Phường Gia Định" },
    ],
  },
];

const LANDMARK_TO_WARD_2026 = [
  {
    pattern: asciiWord(
      "nga tu hang xanh|nga 4 hang xanh|hang xanh|landmark 81|landmark81|vinhomes central park|vinhomes tan cang|tan cang|pearl plaza|kdl van thanh|cong vien van thanh|van thanh|cau sai gon|dh hutech|hutech|dh gtvt|giao thong van tai|uth|dh ngoai thuong|ngoai thuong|ftu|dh hong bang|hiu|dh uef|uef|cho thi nghe",
    ),
    ward: "Phường Thạnh Mỹ Tây",
  },
  {
    pattern: asciiWord(
      "cho ba chieu|ba chieu|lang ong|bv nhan dan gia dinh|benh vien gia dinh|bv gia dinh|bv ung buou|benh vien ung buou|cau bong|cong vien le van duyet|cv le van duyet|dh thuy loi|mieu noi|dh my thuat",
    ),
    ward: "Phường Gia Định",
  },
  {
    pattern: asciiWord(
      "ben xe mien dong|bx mien dong|bxmd|cau dinh bo linh|hoc vien can bo|cu xa chu van an|cho chu van an|nga 5 dai liet si|nga nam dai liet si|dai liet si|cho cau do|cau do",
    ),
    ward: "Phường Bình Thạnh",
  },
  {
    pattern: asciiWord(
      "dh van lang|dai hoc van lang|van lang|vlu|kdc binh loi|cho cay thi|cho binh hoa|nga 5 binh hoa|nga nam binh hoa|cau binh loi|rach lang|cau bang ky",
    ),
    ward: "Phường Bình Lợi Trung",
  },
  {
    pattern: asciiWord("ban dao thanh da|cu xa thanh da|thanh da|cau kinh|kdl binh quoi"),
    ward: "Phường Bình Quới",
  },
];

const STREET_TO_WARD_2026 = [
  {
    pattern: asciiWord(
      "nguyen cuu van|vu tung|vu huy tan|tran van ky|bui huu nghia|le van duyet|dinh tien hoang|yen do|phan van han|trinh hoai duc|dien hong|pho duc chinh|nguyen xuan on|ngo nhan tinh|nguyen thai hoc|nguyen huy tuong|nguyen lam|van kiep|mieu noi|tran ke xuong|nhieu tu|doan thi diem|dang thai mai",
    ),
    ward: "Phường Gia Định",
  },
  {
    pattern: asciiWord(
      "nguyen gia tri|vo oanh|nguyen van thuong|ung van khiem|nguyen huu canh|pham viet chanh|ngo tat to|nguyen ngoc phuong|vo duy ninh|nguyen van lac|huynh man dat|nguyen cong tru|duong d1|duong d2|duong d3|duong d4|duong d5|khu d2|tan cang|me linh",
    ),
    ward: "Phường Thạnh Mỹ Tây",
  },
  {
    pattern: asciiWord("binh quoi|thanh da"),
    ward: "Phường Bình Quới",
  },
  {
    pattern: asciiWord("dinh bo linh|chu van an|bui dinh tuy|quoc lo 13|ql13|ql 13|nguyen huy luong|tam vu|phan chu trinh"),
    ward: "Phường Bình Thạnh",
  },
  {
    pattern: asciiWord(
      "binh loi|dang thuy tram|nguyen van dau|tran quy cap|pham van dong|tang bat ho|huynh dinh hai|le tu tai|tran binh trong|nguyen thuong hien|le truc|nguyen trung truc|luong ngoc quyen|vu ngoc phan|nguyen khuyen|nguyen hong|tran trong kim",
    ),
    ward: "Phường Bình Lợi Trung",
  },
];

function lookupWardByAddressLocally(rawQuery) {
  const folded = foldVi(rawQuery).trim();
  if (!folded) return null;

  const directWardMap = [
    [asciiWord("(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?gia dinh"), "Phường Gia Định"],
    [asciiWord("(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?binh loi trung"), "Phường Bình Lợi Trung"],
    [asciiWord("(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?thanh my tay"), "Phường Thạnh Mỹ Tây"],
    [asciiWord("(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?binh quoi"), "Phường Bình Quới"],
    [asciiWord("(?:phuong|p\\.?|f\\.?)\\s*binh thanh"), "Phường Bình Thạnh"],
  ];
  for (const [pattern, ward] of directWardMap) {
    if (pattern.test(folded)) return { ward, source: "local_direct" };
  }

  const oldMatch = folded.match(/(?<![a-z0-9])(?:phuong|p\.?|f\.?)\s*0?(\d{1,2})(?![a-z0-9])/i);
  if (oldMatch && OLD_WARD_TO_2026[Number(oldMatch[1])]) {
    return { ward: OLD_WARD_TO_2026[Number(oldMatch[1])], source: "local_old_ward" };
  }

  for (const rule of MULTI_WARD_STREET_NUMBER_RULES) {
    const matchRegex = new RegExp(
      `(?:^|[^a-z0-9])(?:(?:so|hem|ngo|ngach|ngay|tai|mt|mat\\s+tien)\\s+)?(\\d{1,4})(?:[a-z](?![a-z]))?(?:\\/[0-9a-z-]+)*\\s+(?:duong\\s+)?(${rule.streetPattern.source})(?![a-z0-9])`,
      "i",
    );
    const hit = folded.match(matchRegex);
    if (!hit) continue;
    const houseNum = Number(hit[1]);
    if (!Number.isInteger(houseNum) || houseNum <= 0) continue;
    const isEven = houseNum % 2 === 0;
    for (const seg of rule.segments) {
      const parityOk = seg.parity === "any" || (seg.parity === "even" ? isEven : !isEven);
      if (parityOk && houseNum >= seg.min && houseNum <= seg.max) {
        return { ward: seg.ward, rawSuburb: `${houseNum} ${rule.streetLabel}`, source: "house_number_table" };
      }
    }
  }

  for (const entry of LANDMARK_TO_WARD_2026) {
    if (entry.pattern.test(folded)) return { ward: entry.ward, source: "local_landmark" };
  }

  for (const entry of STREET_TO_WARD_2026) {
    if (entry.pattern.test(folded)) return { ward: entry.ward, source: "local_street" };
  }

  return null;
}

module.exports = { lookupWardByAddressLocally };
