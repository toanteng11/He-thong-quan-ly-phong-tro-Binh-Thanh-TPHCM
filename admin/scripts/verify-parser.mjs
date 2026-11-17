import assert from 'node:assert/strict'
import { getMissingImportFields, parseRoomPostText } from '../src/lib/facebookPostParser.js'

const USER_SAMPLE = `Chỉ☝️4tr2☝️ bancol , gần Quận 1 , Sạch sẽ thoáng 
 
- 18 Nguyễn Cửa Vân , Bình Thạnh  
-  Mới Sạch sẽ  , sẵn nội thất 
- không chung chủ ,giờ giấc tự do , ra vào vân tay 

Lh 0947832801 Toàn để xem phòng sớm nhất ạ

#phongtrobinhthanh
#phongtrogiare
#phongtrobinhthanhgiare
#phongtrosinhviengiare
#phongtrosinhvien`

const tests = [
  {
    name: 'T01 - AT-501: Bài mẫu thực tế của chủ dự án',
    run() {
      const res = parseRoomPostText(USER_SAMPLE)
      assert.equal(res.removedNoise.hashtagsCount, 5)
      assert.equal(res.removedNoise.emojisCount, 2)
      assert.equal(res.fields.priceVnd, 4200000)
      assert.equal(res.fields.areaM2, null)
      assert.equal(res.fields.ward, 'Phường Gia Định')
      assert.equal(res.fields.privateAddress, '18 Nguyễn Cửu Vân, Bình Thạnh')
      assert.equal(res.fields.allowExactAddress, false)
      assert.ok(res.fields.publicAddress.includes('Nguyễn Cửu Vân'))
      assert.equal(res.fields.contactPhone, '0947832801')
      assert.equal(res.fields.contactZalo, '0947832801')
      assert.equal(res.fields.allowPublicPhone, true)
      assert.equal(res.fields.allowPublicZalo, true)
      assert.ok(res.fields.amenities.includes('Ban công'))
      assert.ok(res.fields.amenities.includes('Cửa sổ'))
      assert.ok(res.fields.amenities.includes('Giường'))
      assert.ok(res.fields.amenities.includes('Tủ quần áo'))
      assert.ok(!res.fields.description.includes('#'))
      assert.ok(!res.fields.description.includes('☝'))
      assert.ok(!res.fields.title.includes('☝'))
      assert.deepEqual(
        res.missingFields.map((m) => m.key),
        ['areaM2'],
      )
    },
  },
  {
    name: 'T02 - AT-502: Giá 3.5tr/tháng bỏ qua cọc 1tr và điện 4k',
    run() {
      const res = parseRoomPostText('Cọc 1tr, điện 4k, nước 100k. Giá thuê 3.5tr/tháng, 20m2, P.17 Bình Thạnh. LH 0912.345.678')
      assert.equal(res.fields.priceVnd, 3500000)
      assert.equal(res.fields.areaM2, 20)
      assert.equal(res.fields.ward, 'Phường Gia Định')
      assert.equal(res.fields.contactPhone, '0912345678')
    },
  },
  {
    name: 'T03 - AT-502: Giá 4200k và 4.800.000đ',
    run() {
      const r1 = parseRoomPostText('Phòng sạch đẹp 4200k/tháng 25m2 Võ Oanh Bình Thạnh 0987654321')
      assert.equal(r1.fields.priceVnd, 4200000)
      assert.equal(r1.fields.ward, 'Phường Thạnh Mỹ Tây')

      const r2 = parseRoomPostText('Cho thuê phòng 4.800.000đ, diện tích 28 m², P.26 Bình Thạnh, LH 0901234567')
      assert.equal(r2.fields.priceVnd, 4800000)
      assert.equal(r2.fields.areaM2, 28)
      assert.equal(r2.fields.ward, 'Phường Bình Thạnh')
    },
  },
  {
    name: 'T04 - AT-502: Giá dạng "5 củ", "4 triệu 5"',
    run() {
      assert.equal(parseRoomPostText('Phòng gác 5 củ 24m2 Bình Quới 0903334445').fields.priceVnd, 5000000)
      assert.equal(parseRoomPostText('Phòng 4 triệu 5, 22m2, P.11 Bình Thạnh 0903334445').fields.priceVnd, 4500000)
    },
  },
  {
    name: 'T05 - AT-503: Loại phòng Studio / CHDV / Có gác / Ở ghép',
    run() {
      assert.equal(parseRoomPostText('🔥 Studio ban công 30m2 5tr5 P.25 0901112223').fields.roomType, 'Phòng studio')
      assert.equal(parseRoomPostText('CHDV mới xây thang máy 32m2 6tr P.14 0901112223').fields.roomType, 'Căn hộ mini')
      assert.equal(parseRoomPostText('Phòng có gác lửng 22.5 m2 3tr8 0901112223').fields.roomType, 'Phòng có gác')
      assert.equal(parseRoomPostText('Tìm bạn ở ghép nữ 1tr8/người 25m2 0901112223').fields.roomType, 'Phòng ở ghép')
    },
  },
  {
    name: 'T06 - AT-503: Kiểm tra diện tích thập phân 22.5 m2 và loại số vô lý',
    run() {
      const r1 = parseRoomPostText('Phòng rộng 22,5 mét vuông giá 4tr 0901112223')
      assert.equal(r1.fields.areaM2, 22.5)
      const r2 = parseRoomPostText('Phòng gần hẻm 2m2 giá 4tr 0901112223')
      assert.equal(r2.fields.areaM2, null)
    },
  },
  {
    name: 'T07 - AT-504: Ánh xạ toàn bộ 5 phường Bình Thạnh 2026 từ tên mới & phường cũ',
    run() {
      assert.equal(parseRoomPostText('Phòng 4tr 20m2 100 Nơ Trang Long, P.14').fields.ward, 'Phường Bình Thạnh')
      assert.equal(parseRoomPostText('Phòng 4tr 20m2 50 Lê Quang Định, P.11').fields.ward, 'Phường Bình Lợi Trung')
      assert.equal(parseRoomPostText('Phòng 4tr 20m2 120 Võ Oanh, Phường 25').fields.ward, 'Phường Thạnh Mỹ Tây')
      assert.equal(parseRoomPostText('Phòng 4tr 20m2 95 Bình Quới, Phường 27').fields.ward, 'Phường Bình Quới')
      assert.equal(parseRoomPostText('Phòng 4tr 20m2 Phường Gia Định').fields.ward, 'Phường Gia Định')
    },
  },
  {
    name: 'T08 - Đường dài qua nhiều phường không tự đoán sai bừa',
    run() {
      const res = parseRoomPostText('Phòng đẹp 4tr5 22m2\n- 450 Xô Viết Nghệ Tĩnh, Bình Thạnh\nLH 0911223344')
      assert.equal(res.fields.ward, '')
      assert.ok(res.missingFields.some((m) => m.key === 'ward'))
      assert.ok(res.suggestions.some((s) => s.includes('nhiều phường')))
    },
  },
  {
    name: 'T09 - Nhận diện đủ 12 tiện nghi chuẩn từ teencode/đồng nghĩa',
    run() {
      const text = '✨Phòng 6tr 30m2 P.25: máy lạnh, tủ lạnh, thang máy, full nt, bếp riêng, wc riêng, bancol, gác lửng, wifi, để xe, cửa sổ. LH 0908889990'
      const res = parseRoomPostText(text)
      assert.equal(res.fields.amenities.length, 12)
    },
  },
  {
    name: 'T10 - Chuẩn hóa SĐT +84 và giữ riêng tư allowExactAddress = false',
    run() {
      const res = parseRoomPostText('Cho thuê 4tr 20m2 tại 25/4 Vũ Tùng, P.2, Bình Thạnh. Zalo +84 947 832 801')
      assert.equal(res.fields.contactPhone, '0947832801')
      assert.equal(res.fields.contactZalo, '0947832801')
      assert.equal(res.fields.allowExactAddress, false)
      assert.ok(!res.fields.publicAddress.startsWith('25/4'))
    },
  },
  {
    name: 'T11 - Hỗ trợ link zalo.me riêng nếu có trong bài',
    run() {
      const res = parseRoomPostText('Phòng 4tr 20m2 Bình Quới LH 0901234567 hoặc https://zalo.me/ngoctoanbt')
      assert.equal(res.fields.contactPhone, '0901234567')
      assert.equal(res.fields.contactZalo, 'https://zalo.me/ngoctoanbt')
    },
  },
  {
    name: 'T12 - Xóa hashtag & emoji ở đầu, giữa và cuối bài',
    run() {
      const res = parseRoomPostText('#hot 🔥 Phòng mới #binhthanh siêu đẹp ✅ 4tr5 25m2 12 Võ Oanh #phongtro LH 0909123456')
      assert.equal(res.removedNoise.hashtagsCount, 3)
      assert.equal(res.removedNoise.emojisCount, 2)
      assert.ok(!res.fields.title.includes('#'))
      assert.ok(!res.fields.description.includes('#'))
      assert.ok(!res.fields.description.includes('🔥'))
      assert.ok(!res.fields.description.includes('✅'))
    },
  },
  {
    name: 'T13 - Input thiếu cả giá, diện tích, phường, SĐT -> liệt kê đúng toàn bộ missingFields',
    run() {
      const res = parseRoomPostText('Phòng trọ mới sơn sửa lại rất sạch sẽ yên tĩnh ở khu vực trung tâm thuận tiện đi lại.')
      const keys = res.missingFields.map((m) => m.key)
      assert.ok(keys.includes('priceVnd'))
      assert.ok(keys.includes('areaM2'))
      assert.ok(keys.includes('ward'))
      assert.ok(keys.includes('publicAddress'))
      assert.ok(keys.includes('contactPhone'))
    },
  },
  {
    name: 'T14 - getMissingImportFields cập nhật biến mất khi Admin nhập tay',
    run() {
      const res = parseRoomPostText(USER_SAMPLE)
      assert.deepEqual(res.missingFields.map((m) => m.key), ['areaM2'])
      const afterManualInput = getMissingImportFields({ ...res.fields, areaM2: '20' })
      assert.equal(afterManualInput.length, 0)
    },
  },
  {
    name: 'T15 - Độ dài title luôn tuân thủ 10..120 ký tự & xử lý input rỗng an toàn',
    run() {
      const longLine = 'Cho thuê phòng trọ ' + 'siêu rộng rãi thoáng mát gần trung tâm quận 1 nhiều tiện ích '.repeat(4) + ' 4tr 25m2 P.17 0901234567'
      const rLong = parseRoomPostText(longLine)
      assert.ok(rLong.fields.title.length >= 10 && rLong.fields.title.length <= 120)

      const rEmpty = parseRoomPostText('')
      assert.equal(rEmpty.fields.priceVnd, null)
      assert.equal(rEmpty.fields.areaM2, null)
      assert.ok(rEmpty.missingFields.length >= 5)
    },
  },
]

let passed = 0
for (const test of tests) {
  test.run()
  passed += 1
  console.log(`PASS: ${test.name}`)
}
console.log(`\nALL ${passed}/${tests.length} SPRINT 5 PARSER TESTS PASSED.`)
