export const BINH_THANH_WARDS = [
  'Phường Gia Định',
  'Phường Bình Thạnh',
  'Phường Bình Lợi Trung',
  'Phường Thạnh Mỹ Tây',
  'Phường Bình Quới',
]

export const ROOM_TYPES = ['Phòng có gác', 'Phòng studio', 'Phòng ở ghép']

export const AMENITIES = [
  'Máy lạnh',
  'Tủ lạnh',
  'Thang máy',
  'Giường',
  'Tủ quần áo',
  'Bếp riêng',
  'Nhà vệ sinh riêng',
  'Ban công',
  'Gác lửng',
  'Wifi',
  'Chỗ để xe',
  'Cửa sổ',
]

// Chuẩn hóa bỏ dấu tiếng Việt + chữ đ/Đ -> d để đối chiếu cả văn bản không dấu và viết tắt
export function foldVi(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (ch) => (ch === 'đ' ? 'd' : 'D'))
    .toLowerCase()
}

// Helper tạo regex ranh giới từ chuẩn Unicode tiếng Việt (tránh lỗi \b với chữ có dấu)
const uWord = (body, flags = 'iu') => new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, flags)
const asciiWord = (body, flags = 'i') => new RegExp(`(?<![a-z0-9])(?:${body})(?![a-z0-9])`, flags)

// Ánh xạ 20 phường cũ Quận Bình Thạnh -> 5 phường mới năm 2026 (NQ 1685/NQ-UBTVQH15)
export const OLD_WARD_TO_2026 = {
  1: 'Phường Gia Định',
  2: 'Phường Gia Định',
  3: 'Phường Gia Định',
  7: 'Phường Gia Định',
  15: 'Phường Gia Định',
  17: 'Phường Gia Định',
  12: 'Phường Bình Thạnh',
  14: 'Phường Bình Thạnh',
  24: 'Phường Bình Thạnh',
  26: 'Phường Bình Thạnh',
  5: 'Phường Bình Lợi Trung',
  6: 'Phường Bình Lợi Trung',
  11: 'Phường Bình Lợi Trung',
  13: 'Phường Bình Lợi Trung',
  19: 'Phường Thạnh Mỹ Tây',
  21: 'Phường Thạnh Mỹ Tây',
  22: 'Phường Thạnh Mỹ Tây',
  25: 'Phường Thạnh Mỹ Tây',
  27: 'Phường Bình Quới',
  28: 'Phường Bình Quới',
}

// Sửa các lỗi chính tả / viết tắt tên đường phổ biến ở Bình Thạnh
const STREET_SPELLING_FIXES = [
  [uWord('nguyễn cửa vân|nguyen cua van|nguyen cuu van', 'giu'), 'Nguyễn Cửu Vân'],
  [uWord('xô viết nghệ tỉnh|xo viet nghe tinh|xvnt', 'giu'), 'Xô Viết Nghệ Tĩnh'],
  [uWord('điện biên phủ|dien bien phu|đbp|dbp', 'giu'), 'Điện Biên Phủ'],
  [uWord('nơ trang long|no trang long', 'giu'), 'Nơ Trang Long'],
  [uWord('ung văn khiêm|ung van khiem|uvk', 'giu'), 'Ung Văn Khiêm'],
  [uWord('nguyễn gia trí|nguyen gia tri|đường\\s+d2|duong\\s+d2', 'giu'), 'Nguyễn Gia Trí'],
  [uWord('võ oanh|vo oanh|đường\\s+d3|duong\\s+d3', 'giu'), 'Võ Oanh'],
  [uWord('nguyễn văn thương|nguyen van thuong|đường\\s+d1|duong\\s+d1', 'giu'), 'Nguyễn Văn Thương'],
  [uWord('đường\\s+d4|duong\\s+d4', 'giu'), 'Đường D4'],
  [uWord('đường\\s+d5|duong\\s+d5', 'giu'), 'Đường D5'],
  [uWord('nguyễn hữu cảnh|nguyen huu canh', 'giu'), 'Nguyễn Hữu Cảnh'],
  [uWord('vũ tùng|vu tung', 'giu'), 'Vũ Tùng'],
  [uWord('phan đăng lưu|phan dang luu', 'giu'), 'Phan Đăng Lưu'],
  [uWord('lê quang định|le quang dinh', 'giu'), 'Lê Quang Định'],
  [uWord('phan văn trị|phan van tri', 'giu'), 'Phan Văn Trị'],
  [uWord('bình quới|binh quoi', 'giu'), 'Bình Quới'],
  [uWord('hoàng hoa thám|hoang hoa tham', 'giu'), 'Hoàng Hoa Thám'],
  [uWord('phạm viết chánh|pham viet chanh', 'giu'), 'Phạm Viết Chánh'],
  [uWord('đinh bộ lĩnh|dinh bo linh', 'giu'), 'Đinh Bộ Lĩnh'],
  [uWord('bùi đình túy|bui dinh tuy', 'giu'), 'Bùi Đình Túy'],
  [uWord('nguyễn xí|nguyen xi', 'giu'), 'Nguyễn Xí'],
  [uWord('chu văn an|chu van an', 'giu'), 'Chu Văn An'],
  [uWord('bình lợi|binh loi', 'giu'), 'Bình Lợi'],
  [uWord('đặng thùy trâm|dang thuy tram', 'giu'), 'Đặng Thùy Trâm'],
  [uWord('nguyễn văn đậu|nguyen van dau', 'giu'), 'Nguyễn Văn Đậu'],
  [uWord('ngô tất tố|ngo tat to', 'giu'), 'Ngô Tất Tố'],
  [uWord('bùi hữu nghĩa|bui huu nghia', 'giu'), 'Bùi Hữu Nghĩa'],
  [uWord('bạch đằng|bach dang', 'giu'), 'Bạch Đằng'],
  [uWord('nguyễn huy lượng|nguyen huy luong', 'giu'), 'Nguyễn Huy Lượng'],
  [uWord('vạn kiếp|van kiep', 'giu'), 'Vạn Kiếp'],
  [uWord('miếu nổi|mieu noi', 'giu'), 'Miếu Nổi'],
  [uWord('trần kế xương|tran ke xuong', 'giu'), 'Trần Kế Xương'],
  [uWord('nhiêu tứ|nhieu tu', 'giu'), 'Nhiêu Tứ'],
  [uWord('đoàn thị điểm|doan thi diem', 'giu'), 'Đoàn Thị Điểm'],
  [uWord('vũ ngọc phan|vu ngoc phan', 'giu'), 'Vũ Ngọc Phan'],
  [uWord('đặng thai mai|dang thai mai', 'giu'), 'Đặng Thai Mai'],
  [uWord('nguyễn khuyến|nguyen khuyen', 'giu'), 'Nguyễn Khuyến'],
  [uWord('phan chu trinh', 'giu'), 'Phan Chu Trinh'],
  [uWord('nguyên hồng|nguyen hong', 'giu'), 'Nguyên Hồng'],
  [uWord('trần trọng kim|tran trong kim', 'giu'), 'Trần Trọng Kim'],
  [uWord('tân cảng|tan cang', 'giu'), 'Tân Cảng'],
  [uWord('mê linh|me linh', 'giu'), 'Mê Linh'],
  [uWord('đinh tiên hoàng|dinh tien hoang', 'giu'), 'Đinh Tiên Hoàng'],
]

// Địa danh, trường học, khu vực quen thuộc hay dùng để định vị phường ở Bình Thạnh (so khớp trên chuỗi đã bỏ dấu)
const LANDMARK_TO_WARD_2026 = [
  {
    pattern: asciiWord(
      'nga tu hang xanh|nga 4 hang xanh|hang xanh|landmark 81|landmark81|vinhomes central park|vinhomes tan cang|tan cang|pearl plaza|kdl van thanh|cong vien van thanh|van thanh|cau sai gon|dh hutech|hutech|dh gtvt|giao thong van tai|uth|dh ngoai thuong|ngoai thuong|ftu|dh hong bang|hiu|dh uef|uef|cho thi nghe',
    ),
    ward: 'Phường Thạnh Mỹ Tây',
  },
  {
    pattern: asciiWord(
      'cho ba chieu|ba chieu|lang ong|bv nhan dan gia dinh|benh vien gia dinh|bv gia dinh|bv ung buou|benh vien ung buou|cau bong|cong vien le van duyet|cv le van duyet|dh thuy loi|mieu noi|dh my thuat',
    ),
    ward: 'Phường Gia Định',
  },
  {
    pattern: asciiWord(
      'ben xe mien dong|bx mien dong|bxmd|cau dinh bo linh|hoc vien can bo|cu xa chu van an|cho chu van an|nga 5 dai liet si|nga nam dai liet si|dai liet si|cho cau do|cau do',
    ),
    ward: 'Phường Bình Thạnh',
  },
  {
    pattern: asciiWord(
      'dh van lang|dai hoc van lang|van lang|vlu|kdc binh loi|cho cay thi|cho binh hoa|nga 5 binh hoa|nga nam binh hoa|cau binh loi|rach lang|cau bang ky',
    ),
    ward: 'Phường Bình Lợi Trung',
  },
  {
    pattern: asciiWord('ban dao thanh da|cu xa thanh da|thanh da|cau kinh|kdl binh quoi'),
    ward: 'Phường Bình Quới',
  },
]

// Các tuyến đường đặc trưng nằm gọn trong 1 phường 2026 (so khớp trên chuỗi đã bỏ dấu)
const STREET_TO_WARD_2026 = [
  {
    pattern: asciiWord(
      'nguyen cuu van|vu tung|vu huy tan|tran van ky|bui huu nghia|le van duyet|dinh tien hoang|yen do|phan van han|trinh hoai duc|dien hong|pho duc chinh|nguyen xuan on|ngo nhan tinh|nguyen thai hoc|nguyen huy tuong|nguyen lam|van kiep|mieu noi|tran ke xuong|nhieu tu|doan thi diem|dang thai mai',
    ),
    ward: 'Phường Gia Định',
  },
  {
    pattern: asciiWord(
      'nguyen gia tri|vo oanh|nguyen van thuong|ung van khiem|nguyen huu canh|pham viet chanh|ngo tat to|nguyen ngoc phuong|vo duy ninh|nguyen van lac|huynh man dat|nguyen cong tru|duong d1|duong d2|duong d3|duong d4|duong d5|khu d2|tan cang|me linh',
    ),
    ward: 'Phường Thạnh Mỹ Tây',
  },
  {
    pattern: asciiWord('binh quoi|thanh da'),
    ward: 'Phường Bình Quới',
  },
  {
    pattern: asciiWord('dinh bo linh|chu van an|bui dinh tuy|quoc lo 13|ql13|ql 13|nguyen huy luong|tam vu|phan chu trinh'),
    ward: 'Phường Bình Thạnh',
  },
  {
    pattern: asciiWord(
      'binh loi|dang thuy tram|nguyen van dau|tran quy cap|pham van dong|tang bat ho|huynh dinh hai|le tu tai|tran binh trong|nguyen thuong hien|le truc|nguyen trung truc|luong ngoc quyen|vu ngoc phan|nguyen khuyen|nguyen hong|tran trong kim',
    ),
    ward: 'Phường Bình Lợi Trung',
  },
]

// Các tuyến trục dài xuyên qua nhiều phường (cần địa danh kèm theo hoặc tra bản đồ theo số nhà)
const MULTI_WARD_STREETS = asciiWord(
  'xo viet nghe tinh|dien bien phu|no trang long|phan van tri|le quang dinh|bach dang|phan dang luu|hoang hoa tham|nguyen xi|truong sa',
)

// Bảng tra cứu phân đoạn số nhà (chẵn/lẻ) cho 10 tuyến đường dài trải qua nhiều phường 2026
const MULTI_WARD_STREET_NUMBER_RULES = [
  {
    streetLabel: 'Xô Viết Nghệ Tĩnh',
    streetPattern: /(?:xo viet nghe tinh|xvnt)/i,
    segments: [
      { parity: 'odd', min: 1, max: 299, ward: 'Phường Gia Định' },
      { parity: 'odd', min: 301, max: 679, ward: 'Phường Bình Thạnh' },
      { parity: 'odd', min: 681, max: 900, ward: 'Phường Thạnh Mỹ Tây' },
      { parity: 'odd', min: 901, max: Infinity, ward: 'Phường Bình Quới' },
      { parity: 'even', min: 2, max: 900, ward: 'Phường Thạnh Mỹ Tây' },
    ],
  },
  {
    streetLabel: 'Điện Biên Phủ',
    streetPattern: /(?:dien bien phu|dbp)/i,
    segments: [
      { parity: 'any', min: 1, max: 400, ward: 'Phường Gia Định' },
      { parity: 'any', min: 401, max: Infinity, ward: 'Phường Thạnh Mỹ Tây' },
    ],
  },
  {
    streetLabel: 'Bạch Đằng',
    streetPattern: /bach dang/i,
    segments: [
      { parity: 'odd', min: 1, max: 399, ward: 'Phường Gia Định' },
      { parity: 'even', min: 2, max: 40, ward: 'Phường Gia Định' },
      { parity: 'even', min: 42, max: Infinity, ward: 'Phường Bình Thạnh' },
      { parity: 'odd', min: 401, max: Infinity, ward: 'Phường Bình Thạnh' },
    ],
  },
  {
    streetLabel: 'Phan Đăng Lưu',
    streetPattern: /phan dang luu/i,
    segments: [
      { parity: 'odd', min: 1, max: 250, ward: 'Phường Gia Định' },
      { parity: 'even', min: 2, max: 68, ward: 'Phường Bình Thạnh' },
      { parity: 'even', min: 70, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Lê Quang Định',
    streetPattern: /le quang dinh/i,
    segments: [
      { parity: 'odd', min: 1, max: 95, ward: 'Phường Gia Định' },
      { parity: 'even', min: 2, max: 210, ward: 'Phường Bình Thạnh' },
      { parity: 'odd', min: 97, max: Infinity, ward: 'Phường Bình Lợi Trung' },
      { parity: 'even', min: 212, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Nơ Trang Long',
    streetPattern: /no trang long/i,
    segments: [
      { parity: 'odd', min: 1, max: 135, ward: 'Phường Gia Định' },
      { parity: 'odd', min: 137, max: 249, ward: 'Phường Bình Thạnh' },
      { parity: 'even', min: 2, max: 278, ward: 'Phường Bình Thạnh' },
      { parity: 'odd', min: 251, max: Infinity, ward: 'Phường Bình Lợi Trung' },
      { parity: 'even', min: 280, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Phan Văn Trị',
    streetPattern: /phan van tri/i,
    segments: [
      { parity: 'odd', min: 1, max: 269, ward: 'Phường Bình Thạnh' },
      { parity: 'even', min: 2, max: 300, ward: 'Phường Bình Thạnh' },
      { parity: 'odd', min: 271, max: Infinity, ward: 'Phường Bình Lợi Trung' },
      { parity: 'even', min: 302, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Nguyễn Xí',
    streetPattern: /nguyen xi/i,
    segments: [
      { parity: 'any', min: 1, max: 239, ward: 'Phường Bình Thạnh' },
      { parity: 'any', min: 240, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Hoàng Hoa Thám',
    streetPattern: /hoang hoa tham/i,
    segments: [
      { parity: 'any', min: 1, max: 70, ward: 'Phường Gia Định' },
      { parity: 'any', min: 71, max: Infinity, ward: 'Phường Bình Lợi Trung' },
    ],
  },
  {
    streetLabel: 'Trường Sa',
    streetPattern: /truong sa/i,
    segments: [
      { parity: 'any', min: 1, max: 30, ward: 'Phường Thạnh Mỹ Tây' },
      { parity: 'any', min: 31, max: Infinity, ward: 'Phường Gia Định' },
    ],
  },
]

function resolveMultiWardByHouseNumber(foldedScope) {
  const text = String(foldedScope || '')
  if (!text) return null

  for (const rule of MULTI_WARD_STREET_NUMBER_RULES) {
    const matchRegex = new RegExp(
      `(?:^|[^a-z0-9])(?:(?:so|hem|ngo|ngach|ngay|tai|mt|mat\\s+tien)\\s+)?(\\d{1,4})(?:[a-z](?![a-z]))?(?:\\/[0-9a-z-]+)*\\s+(?:duong\\s+)?(${rule.streetPattern.source})(?![a-z0-9])`,
      'i',
    )
    const hit = text.match(matchRegex)
    if (!hit) continue

    const houseNum = Number(hit[1])
    if (!Number.isInteger(houseNum) || houseNum <= 0) continue
    const isEven = houseNum % 2 === 0

    for (const seg of rule.segments) {
      const parityOk = seg.parity === 'any' || (seg.parity === 'even' ? isEven : !isEven)
      if (parityOk && houseNum >= seg.min && houseNum <= seg.max) {
        return {
          ward: seg.ward,
          houseNum,
          streetLabel: rule.streetLabel,
        }
      }
    }
  }
  return null
}

const AMENITY_RULES = [
  { name: 'Máy lạnh', patterns: [uWord('máy lạnh|may lanh|điều hòa|dieu hoa|ml')] },
  { name: 'Tủ lạnh', patterns: [uWord('tủ lạnh|tu lanh|tủ mát')] },
  { name: 'Thang máy', patterns: [uWord('thang máy|thang may')] },
  { name: 'Giường', patterns: [uWord('giường|giuong|nệm|sẵn nội thất|full nội thất|đầy đủ nội thất|full nt')] },
  { name: 'Tủ quần áo', patterns: [uWord('tủ quần áo|tủ đồ|tủ áo|sẵn nội thất|full nội thất|đầy đủ nội thất|full nt')] },
  { name: 'Bếp riêng', patterns: [uWord('bếp riêng|kệ bếp|tủ bếp|bếp nấu|bep rieng')] },
  { name: 'Nhà vệ sinh riêng', patterns: [uWord('nhà vệ sinh riêng|vệ sinh riêng|wc riêng|tolet riêng|toilet riêng|nvs riêng|khép kín')] },
  { name: 'Ban công', patterns: [uWord('ban công|bancol|bancon|ban cong|balcony')] },
  { name: 'Gác lửng', patterns: [uWord('gác lửng|dạng gác|có gác|gác cao|phòng gác|gac lung|gác')] },
  { name: 'Wifi', patterns: [uWord('wifi|wi-fi|internet')] },
  { name: 'Chỗ để xe', patterns: [uWord('chỗ để xe|để xe|bãi xe|nhà xe|hầm xe|giữ xe')] },
  { name: 'Cửa sổ', patterns: [uWord('cửa sổ|cua so|thoáng mát|sạch sẽ thoáng|nhiều sáng|giếng trời')] },
]

// 4 tiện nghi mặc định luôn tick trừ khi bài viết ghi rõ dùng chung / không có
const DEFAULT_ON_AMENITY_EXCLUSIONS = [
  {
    name: 'Nhà vệ sinh riêng',
    excludePattern: uWord('wc chung|vệ sinh chung|nhà vệ sinh chung|toilet chung|tolet chung|nvs chung|chung wc|chung toilet|chung tolet|dùng chung vệ sinh|share wc'),
  },
  {
    name: 'Chỗ để xe',
    excludePattern: uWord('không chỗ để xe|không có chỗ để xe|ko chỗ để xe|ko có chỗ để xe|không để xe|ko để xe|không giữ xe|ko giữ xe|tự gửi xe|gửi xe ngoài'),
  },
  {
    name: 'Wifi',
    excludePattern: uWord('không wifi|không có wifi|ko wifi|ko có wifi|chưa có wifi|không internet'),
  },
  {
    name: 'Bếp riêng',
    excludePattern: uWord('bếp chung|chung bếp|nấu ăn chung|dùng chung bếp|không nấu ăn|ko nấu ăn|không cho nấu ăn|ko cho nấu ăn|cấm nấu ăn|không bếp|ko bếp'),
  },
]

const DEPOSIT_OR_FEE_LOOKBEHIND = /(?:cọc|đặt cọc|dat coc|điện|dien|nước|nuoc|rác|rac|wifi|net|xe|phí|phi|dịch vụ|dich vu)\s*[:=\-]?\s*$/iu
const EMOJI_OR_STICKER_REGEX = /(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D(?:\p{Extended_Pictographic}|[\u2600-\u27BF]))*|[\u2600-\u27BF]\uFE0F?)/gu
const HASHTAG_REGEX = /#[\p{L}\p{N}_-]+/gu
const PHONE_REGEX = /(?<![\p{L}\p{N}])(?:\+?84|0)\s*[35789](?:[\s.\-]*\d){8}(?![\p{L}\p{N}])/gu
const ZALO_URL_REGEX = /https:\/\/zalo\.me\/[A-Za-z0-9._-]+/i

function stripNoise(rawText) {
  let hashtagsCount = 0
  let emojisCount = 0

  let text = String(rawText || '').replace(/\r\n?/g, '\n')
  text = text.replace(HASHTAG_REGEX, () => {
    hashtagsCount += 1
    return ' '
  })
  text = text.replace(EMOJI_OR_STICKER_REGEX, () => {
    emojisCount += 1
    return ' '
  })

  // Dọn các dòng phân cách trang trí & chuẩn hóa khoảng trắng từng dòng
  const cleanLines = text
    .split('\n')
    .map((line) =>
      line
        .replace(/^[\s\-•+*▪▫▸►]+(?=\s*\S)/u, (prefix) => (/[-•+*▪▫▸►]/.test(prefix) ? '- ' : ''))
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([,.;!?])/g, '$1')
        .replace(/([,.;])\1+/g, '$1')
        .replace(/^[,\s.;]+|[,\s;]+$/g, '')
        .trim(),
    )
    .filter((line) => line.length > 0 && !/^[-=_~.]{2,}$/.test(line))

  return {
    cleanText: cleanLines.join('\n'),
    cleanLines,
    removedNoise: { hashtagsCount, emojisCount },
  }
}

function applyStreetFixes(text) {
  let result = text
  for (const [pattern, replacement] of STREET_SPELLING_FIXES) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function extractPhoneAndZalo(text) {
  const zaloMatch = text.match(ZALO_URL_REGEX)
  const phoneMatches = [...text.matchAll(PHONE_REGEX)]
  let contactPhone = ''

  for (const match of phoneMatches) {
    const digits = match[0].replace(/[^\d]/g, '')
    const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
    if (/^0[35789]\d{8}$/.test(normalized)) {
      contactPhone = normalized
      break
    }
  }

  const contactZalo = zaloMatch ? zaloMatch[0] : contactPhone
  return {
    contactPhone,
    allowPublicPhone: Boolean(contactPhone),
    contactZalo,
    allowPublicZalo: Boolean(contactZalo),
  }
}

function isPrecededByDepositOrFee(text, matchIndex) {
  const start = Math.max(0, matchIndex - 26)
  const prefix = text.slice(start, matchIndex)
  return DEPOSIT_OR_FEE_LOOKBEHIND.test(prefix)
}

function extractPriceVnd(textWithoutPhones) {
  const candidates = []

  // Dạng dính liền: 3tr9, 4tr2, 2tr7, 4tr25, 4tr500 (không bị từ "Phòng" phía sau chặn)
  for (const m of textWithoutPhones.matchAll(/(\d{1,2})\s*(?:tr|triệu|trieu)(\d{1,3})(?![\p{L}\p{N}])/giu)) {
    const major = Number(m[1])
    const decStr = m[2]
    const minor =
      decStr.length === 1
        ? Number(decStr) * 100_000
        : decStr.length === 2
          ? Number(decStr) * 10_000
          : Number(decStr) * 1_000
    candidates.push({ index: m.index ?? 0, priority: 4, value: major * 1_000_000 + minor })
  }

  // Dạng có khoảng trắng: "4 triệu 5" (tránh nuốt số của "4tr 20m2" hoặc "4tr 2 phòng")
  for (const m of textWithoutPhones.matchAll(/(\d{1,2})\s*(?:tr|triệu|trieu)\s+(\d)(?![\p{L}\p{N}])(?!\s*(?:m2|m²|mét|met|phòng|người))/giu)) {
    candidates.push({ index: m.index ?? 0, priority: 3, value: Number(m[1]) * 1_000_000 + Number(m[2]) * 100_000 })
  }

  // Dạng: 4.2tr, 4,5 triệu, 4.2 củ
  for (const m of textWithoutPhones.matchAll(/(\d{1,2}[.,]\d{1,2})\s*(?:tr|triệu|trieu|củ|cu)(?![\p{L}\p{N}])/giu)) {
    const val = Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000)
    candidates.push({ index: m.index ?? 0, priority: 3, value: val })
  }

  // Dạng: 4tr, 5 triệu, 5 củ
  for (const m of textWithoutPhones.matchAll(/(\d{1,2})\s*(?:tr|triệu|trieu|củ|cu)(?![\p{L}\p{N}])/giu)) {
    candidates.push({ index: m.index ?? 0, priority: 1, value: Number(m[1]) * 1_000_000 })
  }

  // Dạng: 4.200.000, 4,200,000đ
  for (const m of textWithoutPhones.matchAll(/(\d{1,2}[.,]\d{3}[.,]\d{3})\s*(?:đ|d|vnđ|vnd)?(?![\p{L}\p{N}])/giu)) {
    const val = Number(m[1].replace(/[.,]/g, ''))
    candidates.push({ index: m.index ?? 0, priority: 2, value: val })
  }

  // Dạng: 4200k, 3800k/tháng
  for (const m of textWithoutPhones.matchAll(/(\d{3,4})\s*k(?![\p{L}\p{N}])/giu)) {
    candidates.push({ index: m.index ?? 0, priority: 2, value: Number(m[1]) * 1_000 })
  }

  candidates.sort((a, b) => a.index - b.index || b.priority - a.priority)

  for (const item of candidates) {
    if (item.value < 500_000 || item.value > 50_000_000) continue
    if (isPrecededByDepositOrFee(textWithoutPhones, item.index)) continue
    return item.value
  }
  return null
}

function extractAreaM2(textWithoutPhones) {
  for (const m of textWithoutPhones.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mét\s*vuông|met\s*vuong)(?![\p{L}\p{N}])/giu)) {
    const val = Number(m[1].replace(',', '.'))
    if (Number.isFinite(val) && val >= 5 && val <= 500) {
      return Math.round(val * 100) / 100
    }
  }
  return null
}

function extractRoomType(text) {
  if (uWord('studio').test(text)) return 'Phòng studio'
  if (uWord('ở ghép|tìm bạn ở ghép|share phòng').test(text)) return 'Phòng ở ghép'
  if (uWord('có gác|dạng gác|gác lửng|gác cao|phòng gác|gác').test(text)) return 'Phòng có gác'
  if (uWord('căn hộ mini|căn hộ dịch vụ|chdv').test(text)) return 'Phòng studio'
  return ''
}

function extractAmenities(text) {
  const matched = new Set()
  for (const rule of AMENITY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      matched.add(rule.name)
    }
  }
  for (const defRule of DEFAULT_ON_AMENITY_EXCLUSIONS) {
    if (defRule.excludePattern.test(text)) {
      matched.delete(defRule.name)
    } else {
      matched.add(defRule.name)
    }
  }
  return AMENITIES.filter((name) => matched.has(name))
}

function resolveWardFromText(foldedScope, suggestions) {
  // 1. Khớp trực tiếp 5 phường mới 2026 (có dấu và không dấu)
  const directWardMap = [
    [asciiWord('(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?gia dinh'), 'Phường Gia Định'],
    [asciiWord('(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?binh loi trung'), 'Phường Bình Lợi Trung'],
    [asciiWord('(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?thanh my tay'), 'Phường Thạnh Mỹ Tây'],
    [asciiWord('(?:phuong\\s+|p\\.?\\s*|f\\.?\\s*)?binh quoi'), 'Phường Bình Quới'],
    [asciiWord('(?:phuong|p\\.?|f\\.?)\\s*binh thanh'), 'Phường Bình Thạnh'],
  ]
  for (const [pattern, targetWard] of directWardMap) {
    if (pattern.test(foldedScope)) {
      return targetWard
    }
  }

  // 2. Quy đổi 20 phường cũ (Phường 17, P.17, P17, F17, f.25, phuong 14...) -> 5 phường mới 2026
  const oldWardMatch = foldedScope.match(/(?<![a-z0-9])(?:phuong|p\.?|f\.?)\s*0?(\d{1,2})(?![a-z0-9])/i)
  if (oldWardMatch) {
    const oldNum = Number(oldWardMatch[1])
    if (OLD_WARD_TO_2026[oldNum]) {
      const mapped = OLD_WARD_TO_2026[oldNum]
      suggestions.push(`Đã quy đổi Phường ${oldNum} cũ sang ${mapped} (2026).`)
      return mapped
    }
  }

  // 3. Tra cứu số nhà (chẵn/lẻ) trên các tuyến đường dài trải qua nhiều phường
  const multiMatch = resolveMultiWardByHouseNumber(foldedScope)
  if (multiMatch) {
    suggestions.push(
      `Đã xác định ${multiMatch.ward} theo số nhà ${multiMatch.houseNum} đường ${multiMatch.streetLabel}.`,
    )
    return multiMatch.ward
  }

  // 4. Địa danh / trường học / khu vực đặc trưng (rất chính xác kể cả khi nằm trên trục đường dài)
  for (const entry of LANDMARK_TO_WARD_2026) {
    if (entry.pattern.test(foldedScope)) {
      suggestions.push(`Tự nhận diện ${entry.ward} theo địa danh/khu vực — vui lòng kiểm tra lại.`)
      return entry.ward
    }
  }

  // 5. Tuyến đường nằm gọn trong 1 phường 2026
  for (const entry of STREET_TO_WARD_2026) {
    if (entry.pattern.test(foldedScope)) {
      suggestions.push(`Gợi ý ${entry.ward} theo tên đường — vui lòng kiểm tra lại.`)
      return entry.ward
    }
  }

  return ''
}

export function inferWardFromAddressText(rawAddress) {
  const clean = applyStreetFixes(String(rawAddress || '').trim())
  if (!clean) return { ward: '', reason: '' }
  const suggestions = []
  const ward = resolveWardFromText(foldVi(clean), suggestions)
  return { ward, reason: suggestions[0] || '' }
}

function isLikelyAddressLine(line) {
  const cleanedLine = String(line || '').replace(/^[-•*📍🏠📌👉✅\s]+/u, '').trim()
  const folded = foldVi(cleanedLine)
  if (/^(?:lh|lien he|goi|call|zalo|ib|inbox|chi|gia|cho thue)\b/.test(folded)) return false
  if (/^(?:d\/c|dc|dia chi)\s*[:\-]?\s*/i.test(folded)) return true
  const hasKnownStreet =
    STREET_TO_WARD_2026.some((entry) => entry.pattern.test(folded)) ||
    MULTI_WARD_STREETS.test(folded) ||
    LANDMARK_TO_WARD_2026.some((entry) => entry.pattern.test(folded))
  const hasHouseNumber = /^(?:(?:so|hem|ngo|ngay|mat tien|mt)\s+)?\d+[a-z]?(?:\/[0-9a-z-]+)*\s+[^\d,]+/i.test(folded)
  const hasLocationCue = asciiWord('binh thanh|q\\.?\\s*binh thanh|q\\.?\\s*bt|duong|hem|phuong|p\\.?\\s*\\d+|f\\.?\\s*\\d+').test(folded)

  if (hasHouseNumber && (hasKnownStreet || hasLocationCue || /^[0-9/]+\s+[a-z\s]{4,}/i.test(folded))) {
    return true
  }
  return hasKnownStreet && hasLocationCue
}

function extractWardAndAddresses(cleanLines, normalizedText) {
  const suggestions = []

  // Tìm dòng địa chỉ cụ thể
  let addressLine = ''
  for (const rawLine of cleanLines) {
    const line = applyStreetFixes(rawLine.replace(/^[-•*📍🏠📌👉✅\s]+/u, '').trim())
    if (isLikelyAddressLine(line)) {
      addressLine = line.replace(/^(?:đ\/c|đc|địa chỉ|d\/c|dc|dia chi)\s*[:\-]?\s*/iu, '').trim()
      break
    }
  }

  // Ưu tiên phân tích trên địa chỉ cụ thể trước, sau đó trên toàn bài (để bắt được cả địa danh/phường ở dòng tiêu đề như "gần Hàng Xanh")
  const foldedAddress = foldVi(addressLine)
  const foldedFull = foldVi(normalizedText)
  let ward = addressLine ? resolveWardFromText(foldedAddress, suggestions) : ''
  if (!ward) {
    ward = resolveWardFromText(foldedFull, suggestions)
  }

  const privateAddress = addressLine ? addressLine.slice(0, 500) : ''

  // Tạo publicAddress an toàn (không chứa số nhà cụ thể ở đầu)
  let publicAddress = ''
  if (addressLine) {
    const firstPart = addressLine.split(',')[0].trim()
    const withoutNumber = firstPart.replace(/^(?:số\s+)?\d+[a-z]?(?:\/[0-9a-z-]+)*\s+/iu, '').trim()
    if (withoutNumber.length >= 4) {
      publicAddress = /^(?:đường|hẻm|khu|gần|cư xá|duong|hem)/iu.test(withoutNumber)
        ? withoutNumber
        : `Đường ${withoutNumber}`
    }
  }

  const landmarkMatch = normalizedText.match(/(?<![\p{L}\p{N}])(gần\s+[^,\n.!?]{3,35})/iu)
  if (landmarkMatch) {
    const landmark = landmarkMatch[1].trim()
    if (publicAddress && !publicAddress.toLowerCase().includes(landmark.toLowerCase())) {
      publicAddress = `${publicAddress}, ${landmark}`
    } else if (!publicAddress) {
      publicAddress = `${landmark}, Bình Thạnh`
    }
  } else if (publicAddress && !uWord('bình thạnh|binh thanh').test(publicAddress)) {
    publicAddress = `${publicAddress}, Bình Thạnh`
  }

  const needsRemoteWardLookup = !ward && Boolean(addressLine || publicAddress)
  if (needsRemoteWardLookup && MULTI_WARD_STREETS.test(foldedAddress || foldedFull)) {
    suggestions.push('Tuyến đường này đi qua nhiều phường — hệ thống sẽ thử tra cứu theo số nhà hoặc bạn tự chọn Phường.')
  }

  return {
    ward,
    privateAddress,
    publicAddress: publicAddress.slice(0, 300),
    suggestions,
    needsRemoteWardLookup,
    lookupAddressQuery: addressLine || publicAddress,
  }
}

function buildTitle({ cleanLines, roomType, amenities, publicAddress, privateAddress }) {
  const firstLine = applyStreetFixes(cleanLines[0] || '')
    .replace(/^-+\s*/, '')
    // Bỏ cụm mở đầu kiểu "Chỉ 4tr2", "Giá 4.2tr/tháng" khỏi tiêu đề
    .replace(/^(?:chỉ|giá|cho thuê|chdv|còn phòng)\s*(?:từ\s*)?(?:\d{1,2}\s*(?:tr|triệu|trieu)\s*\d{0,3}|\d{1,2}[.,]\d{1,2}\s*(?:tr|triệu)|\d{1,2}[.,]\d{3}[.,]\d{3}\s*(?:đ|vnd)?|\d{3,4}k)(?:\s*\/\s*(?:tháng|th|month))?/iu, '')
    .replace(uWord('bancol|bancon', 'giu'), 'có ban công')
    .replace(/^[,.\-:\s]+/, '')
    .trim()

  const streetChunk = (publicAddress || privateAddress.replace(/^\d+(?:\/\d+[A-Za-z]?)?\s+/, ''))
    .split(',')[0]
    .trim()

  const parts = []

  if (firstLine && firstLine.length >= 8) {
    const formattedFirst = firstLine.charAt(0).toUpperCase() + firstLine.slice(1)
    const startsWithType = /^(?:phòng|căn hộ|chdv|studio)/iu.test(formattedFirst)
    parts.push(startsWithType ? formattedFirst : `${roomType} ${formattedFirst.charAt(0).toLowerCase()}${formattedFirst.slice(1)}`)
  } else {
    const featureNote = amenities.slice(0, 2).join(', ')
    parts.push(featureNote ? `${roomType} ${featureNote.toLowerCase()}` : roomType)
  }

  if (streetChunk && !foldVi(parts[0]).includes(foldVi(streetChunk.replace(/^đường\s+/iu, '')))) {
    parts.push(streetChunk)
  }

  let title = parts.join(' — ').replace(/\s{2,}/g, ' ').trim()
  if (title.length < 10) {
    title = `${roomType} tại Bình Thạnh, đầy đủ tiện nghi cơ bản`
  }
  if (title.length > 120) {
    title = title.slice(0, 117).replace(/\s+\S*$/, '').trim()
  }
  return title
}

function buildCleanDescription(cleanLines) {
  const fixedLines = cleanLines.map((line) =>
    applyStreetFixes(line)
      .replace(uWord('bancol|bancon', 'giu'), 'ban công')
      .replace(uWord('tolet', 'giu'), 'toilet'),
  )
  return fixedLines.join('\n').slice(0, 5000).trim()
}

export function getMissingImportFields(form) {
  const missing = []
  if (!String(form.title || '').trim() || String(form.title || '').trim().length < 10) {
    missing.push({ key: 'title', fieldId: 'field-title', label: 'Tiêu đề tin (tối thiểu 10 ký tự)' })
  }
  if (!String(form.description || '').trim() || String(form.description || '').trim().length < 30) {
    missing.push({ key: 'description', fieldId: 'field-description', label: 'Mô tả chi tiết (tối thiểu 30 ký tự)' })
  }
  if (!form.roomType) {
    missing.push({ key: 'roomType', fieldId: 'field-roomType', label: 'Loại phòng' })
  }
  if (!(Number(form.priceVnd) > 0)) {
    missing.push({ key: 'priceVnd', fieldId: 'field-priceVnd', label: 'Giá thuê mỗi tháng' })
  }
  if (!(Number(form.areaM2) > 0)) {
    missing.push({ key: 'areaM2', fieldId: 'field-areaM2', label: 'Diện tích (m²)' })
  }
  if (!String(form.publicAddress || '').trim()) {
    missing.push({ key: 'publicAddress', fieldId: 'field-publicAddress', label: 'Khu vực khách sẽ thấy' })
  }
  if (!String(form.ward || '').trim()) {
    missing.push({ key: 'ward', fieldId: 'field-ward', label: 'Phường (Bình Thạnh 2026)' })
  }
  if (!String(form.contactPhone || '').trim() && !String(form.contactZalo || '').trim()) {
    missing.push({ key: 'contactPhone', fieldId: 'field-contactPhone', label: 'Số điện thoại hoặc Zalo' })
  }
  return missing
}

export function parseRoomPostText(rawText) {
  const { cleanText, cleanLines, removedNoise } = stripNoise(rawText)
  const normalizedText = applyStreetFixes(cleanText)
  const textWithoutPhones = normalizedText.replace(PHONE_REGEX, ' ')

  const { contactPhone, allowPublicPhone, contactZalo, allowPublicZalo } = extractPhoneAndZalo(normalizedText)
  const priceVnd = extractPriceVnd(textWithoutPhones)
  const areaM2 = extractAreaM2(textWithoutPhones)
  const roomType = extractRoomType(normalizedText)
  const amenities = cleanText ? extractAmenities(normalizedText) : []
  const {
    ward,
    privateAddress,
    publicAddress,
    suggestions,
    needsRemoteWardLookup,
    lookupAddressQuery,
  } = extractWardAndAddresses(cleanLines, normalizedText)
  const description = buildCleanDescription(cleanLines)
  const title = buildTitle({ cleanLines, roomType, amenities, publicAddress, privateAddress })

  const fields = {
    title,
    description,
    roomType,
    priceVnd,
    areaM2,
    amenities,
    ward,
    district: 'Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    publicAddress,
    privateAddress,
    allowExactAddress: false,
    contactPhone,
    allowPublicPhone,
    contactZalo,
    allowPublicZalo,
  }

  const filledLabels = []
  if (fields.title) filledLabels.push('Tiêu đề')
  if (fields.description) filledLabels.push('Mô tả')
  if (fields.roomType) filledLabels.push(fields.roomType)
  if (fields.priceVnd) filledLabels.push(`Giá: ${Number(fields.priceVnd).toLocaleString('vi-VN')} ₫`)
  if (fields.areaM2) filledLabels.push(`Diện tích: ${fields.areaM2} m²`)
  if (fields.publicAddress) filledLabels.push('Khu vực')
  if (fields.ward) filledLabels.push(fields.ward)
  if (fields.amenities.length) filledLabels.push(`${fields.amenities.length} tiện nghi`)
  if (fields.contactPhone) filledLabels.push(`SĐT/Zalo: ${fields.contactPhone}`)

  const missingFields = getMissingImportFields(fields)

  return {
    fields,
    filledLabels,
    removedNoise,
    missingFields,
    suggestions,
    needsRemoteWardLookup,
    lookupAddressQuery,
  }
}
