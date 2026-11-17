export const BINH_THANH_WARDS = [
  'Phường Gia Định',
  'Phường Bình Thạnh',
  'Phường Bình Lợi Trung',
  'Phường Thạnh Mỹ Tây',
  'Phường Bình Quới',
]

export const ROOM_TYPES = ['Phòng trọ', 'Phòng có gác', 'Phòng studio', 'Căn hộ mini', 'Phòng ở ghép']

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

// Helper tạo regex ranh giới từ chuẩn Unicode tiếng Việt (tránh lỗi \b không nhận chữ có dấu như đ, ở, ổ, ủ)
const uWord = (body, flags = 'iu') => new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, flags)

// Ánh xạ 20 phường cũ Quận Bình Thạnh -> 5 phường mới năm 2026 (NQ 1685/NQ-UBTVQH15)
const OLD_WARD_TO_2026 = {
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
  [uWord('nguyễn cửa vân', 'giu'), 'Nguyễn Cửu Vân'],
  [uWord('nguyen cua van', 'giu'), 'Nguyễn Cửu Vân'],
  [uWord('xô viết nghệ tỉnh', 'giu'), 'Xô Viết Nghệ Tĩnh'],
  [uWord('điện biên phủ', 'giu'), 'Điện Biên Phủ'],
  [uWord('nơ trang long', 'giu'), 'Nơ Trang Long'],
  [uWord('ung văn khiêm', 'giu'), 'Ung Văn Khiêm'],
  [uWord('nguyễn gia trí', 'giu'), 'Nguyễn Gia Trí'],
  [uWord('đường\\s+d2', 'giu'), 'Nguyễn Gia Trí'],
  [uWord('đường\\s+d3', 'giu'), 'Võ Oanh'],
  [uWord('võ oanh', 'giu'), 'Võ Oanh'],
  [uWord('nguyễn hữu cảnh', 'giu'), 'Nguyễn Hữu Cảnh'],
  [uWord('vũ tùng', 'giu'), 'Vũ Tùng'],
  [uWord('phan đăng lưu', 'giu'), 'Phan Đăng Lưu'],
  [uWord('lê quang định', 'giu'), 'Lê Quang Định'],
  [uWord('phan văn trị', 'giu'), 'Phan Văn Trị'],
  [uWord('bình quới', 'giu'), 'Bình Quới'],
  [uWord('hoàng hoa thám', 'giu'), 'Hoàng Hoa Thám'],
  [uWord('phạm viết chánh', 'giu'), 'Phạm Viết Chánh'],
]

// Các tuyến đường đặc trưng nằm gọn trong 1 phường 2026 (không tự đoán với trục đường xuyên nhiều phường)
const STREET_TO_WARD_2026 = [
  { pattern: uWord('nguyễn cửu vân|vũ tùng|vũ huy tấn|trần văn kỷ|bùi hữu nghĩa|lê văn duyệt|yên đỗ|huỳnh mẫn đạt'), ward: 'Phường Gia Định' },
  { pattern: uWord('nguyễn gia trí|võ oanh|ung văn khiêm|nguyễn hữu cảnh|phạm viết chánh|ngô tất tố|nguyễn ngọc phương|tân cảng'), ward: 'Phường Thạnh Mỹ Tây' },
  { pattern: uWord('bình quới|thanh đa'), ward: 'Phường Bình Quới' },
  { pattern: uWord('nguyễn xí|đinh bộ lĩnh|chu văn an|tầm vu'), ward: 'Phường Bình Thạnh' },
  { pattern: uWord('bình lợi|đặng thùy trâm|nguyễn văn đậu|trần quý cáp|phạm văn đồng'), ward: 'Phường Bình Lợi Trung' },
]

const MULTI_WARD_STREETS = uWord('xô viết nghệ tĩnh|điện biên phủ|nơ trang long|phan văn trị|lê quang định|bạch đằng|phan đăng lưu|hoàng hoa thám')

const AMENITY_RULES = [
  { name: 'Máy lạnh', patterns: [uWord('máy lạnh|may lanh|điều hòa|dieu hoa|ml')] },
  { name: 'Tủ lạnh', patterns: [uWord('tủ lạnh|tu lanh|tủ mát')] },
  { name: 'Thang máy', patterns: [uWord('thang máy|thang may')] },
  { name: 'Giường', patterns: [uWord('giường|giuong|nệm|sẵn nội thất|full nội thất|đầy đủ nội thất|full nt')] },
  { name: 'Tủ quần áo', patterns: [uWord('tủ quần áo|tủ đồ|tủ áo|sẵn nội thất|full nội thất|đầy đủ nội thất|full nt')] },
  { name: 'Bếp riêng', patterns: [uWord('bếp riêng|kệ bếp|tủ bếp|bếp nấu|bep rieng')] },
  { name: 'Nhà vệ sinh riêng', patterns: [uWord('nhà vệ sinh riêng|vệ sinh riêng|wc riêng|tolet riêng|toilet riêng|nvs riêng|khép kín')] },
  { name: 'Ban công', patterns: [uWord('ban công|bancol|bancon|ban cong|balcony')] },
  { name: 'Gác lửng', patterns: [uWord('gác lửng|có gác|gác cao|phòng gác|gac lung')] },
  { name: 'Wifi', patterns: [uWord('wifi|wi-fi|internet')] },
  { name: 'Chỗ để xe', patterns: [uWord('chỗ để xe|để xe|bãi xe|nhà xe|hầm xe|giữ xe')] },
  { name: 'Cửa sổ', patterns: [uWord('cửa sổ|cua so|thoáng mát|sạch sẽ thoáng|nhiều sáng|giếng trời')] },
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

  // Dạng: 4tr2, 4tr25, 4 triệu 5 (không nuốt số của 20m2 / 24m2)
  for (const m of textWithoutPhones.matchAll(/(\d{1,2})\s*(?:tr|triệu|trieu)\s*(\d{1,2})(?![\p{L}\p{N}])(?!\s*(?:m2|m²|mét|met|phòng|người))/giu)) {
    const major = Number(m[1])
    const decStr = m[2]
    const minor = decStr.length === 1 ? Number(decStr) * 100_000 : Number(decStr) * 10_000
    candidates.push({ index: m.index ?? 0, priority: 3, value: major * 1_000_000 + minor })
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
  if (uWord('căn hộ mini|căn hộ dịch vụ|chdv').test(text)) return 'Căn hộ mini'
  if (uWord('ở ghép|tìm bạn ở ghép|share phòng').test(text)) return 'Phòng ở ghép'
  if (uWord('có gác|gác lửng|gác cao|phòng gác').test(text)) return 'Phòng có gác'
  return 'Phòng trọ'
}

function extractAmenities(text) {
  const matched = []
  for (const rule of AMENITY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      matched.push(rule.name)
    }
  }
  return matched
}

function extractWardAndAddresses(cleanLines, normalizedText) {
  const suggestions = []
  let ward = ''

  // 1. Khớp trực tiếp 5 phường Bình Thạnh 2026
  const directWardMap = [
    [uWord('(?:phường\\s+)?gia định'), 'Phường Gia Định'],
    [uWord('(?:phường\\s+)?bình lợi trung'), 'Phường Bình Lợi Trung'],
    [uWord('(?:phường\\s+)?thạnh mỹ tây'), 'Phường Thạnh Mỹ Tây'],
    [uWord('(?:phường\\s+)?bình quới'), 'Phường Bình Quới'],
    [uWord('phường\\s+bình thạnh'), 'Phường Bình Thạnh'],
  ]
  for (const [pattern, targetWard] of directWardMap) {
    if (pattern.test(normalizedText)) {
      ward = targetWard
      break
    }
  }

  // 2. Ánh xạ 20 phường cũ -> 5 phường mới 2026
  if (!ward) {
    const oldWardMatch = normalizedText.match(/(?<![\p{L}\p{N}])(?:phường|p\.?)\s*0?(\d{1,2})(?![\p{L}\p{N}])/iu)
    if (oldWardMatch) {
      const oldNum = Number(oldWardMatch[1])
      if (OLD_WARD_TO_2026[oldNum]) {
        ward = OLD_WARD_TO_2026[oldNum]
        suggestions.push(`Đã quy đổi Phường ${oldNum} cũ sang ${ward} (2026).`)
      }
    }
  }

  // 3. Tìm dòng địa chỉ cụ thể
  let addressLine = ''
  for (const rawLine of cleanLines) {
    const line = applyStreetFixes(rawLine.replace(/^-+\s*/, '').trim())
    if (/^(?:lh|liên hệ|gọi|call|zalo|ib|inbox)(?![\p{L}\p{N}])/iu.test(line)) continue
    const hasAddressPrefix = /^(?:đ\/c|đc|địa chỉ)\s*[:\-]?\s*/iu.test(line)
    const hasHouseNumberAndStreet = /^\d+(?:\/\d+[A-Za-z]?)?\s+[^\d,]+/.test(line)
    const hasDistrictOrStreet = uWord('bình thạnh|đường|hẻm|phường').test(line) || STREET_TO_WARD_2026.some((entry) => entry.pattern.test(line))
    if (hasAddressPrefix || (hasHouseNumberAndStreet && hasDistrictOrStreet) || (uWord('bình thạnh').test(line) && !/^\s*chỉ(?![\p{L}\p{N}])/iu.test(line))) {
      addressLine = line.replace(/^(?:đ\/c|đc|địa chỉ)\s*[:\-]?\s*/iu, '').trim()
      break
    }
  }

  // 4. Nếu chưa có ward, thử suy luận theo tên đường ngắn đặc trưng
  if (!ward) {
    const scope = addressLine || normalizedText
    for (const entry of STREET_TO_WARD_2026) {
      if (entry.pattern.test(scope)) {
        ward = entry.ward
        suggestions.push(`Gợi ý ${ward} theo tên đường — vui lòng kiểm tra lại.`)
        break
      }
    }
    if (!ward && MULTI_WARD_STREETS.test(scope)) {
      suggestions.push('Tuyến đường này đi qua nhiều phường — vui lòng tự chọn Phường.')
    }
  }

  const privateAddress = addressLine ? addressLine.slice(0, 500) : ''

  // Tạo publicAddress an toàn (không chứa số nhà cụ thể ở đầu)
  let publicAddress = ''
  if (addressLine) {
    const firstPart = addressLine.split(',')[0].trim()
    const withoutNumber = firstPart.replace(/^\d+(?:\/\d+[A-Za-z]?)?\s+/, '').trim()
    if (withoutNumber.length >= 4) {
      publicAddress = /^(?:đường|hẻm|khu|gần|cư xá)/iu.test(withoutNumber)
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
  } else if (publicAddress && !uWord('bình thạnh').test(publicAddress)) {
    publicAddress = `${publicAddress}, Bình Thạnh`
  }

  return {
    ward,
    privateAddress,
    publicAddress: publicAddress.slice(0, 300),
    suggestions,
  }
}

function buildTitle({ cleanLines, roomType, amenities, publicAddress, privateAddress }) {
  const firstLine = applyStreetFixes(cleanLines[0] || '')
    .replace(/^-+\s*/, '')
    // Bỏ cụm mở đầu kiểu "Chỉ 4tr2", "Giá 4.2tr/tháng" khỏi tiêu đề
    .replace(/^(?:chỉ|giá|cho thuê|chdv|còn phòng)\s*(?:từ\s*)?(?:\d{1,2}\s*(?:tr|triệu|trieu)\s*\d{0,2}|\d{1,2}[.,]\d{1,2}\s*(?:tr|triệu)|\d{1,2}[.,]\d{3}[.,]\d{3}\s*(?:đ|vnd)?|\d{3,4}k)(?:\s*\/\s*(?:tháng|th|month))?/iu, '')
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

  if (streetChunk && !parts[0].toLowerCase().includes(streetChunk.toLowerCase())) {
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
  const amenities = extractAmenities(normalizedText)
  const { ward, privateAddress, publicAddress, suggestions } = extractWardAndAddresses(cleanLines, normalizedText)
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
  }
}
