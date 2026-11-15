# Sprint 3 — Tìm kiếm, Lọc nâng cao và Tối ưu UX/Hiệu năng

## 1. Thông tin sprint

| Hạng mục | Nội dung |
| :--- | :--- |
| **Tên sprint** | Sprint 3 — Tìm kiếm, Lọc nâng cao và Tối ưu UX/Hiệu năng |
| **Thời gian đề xuất** | 2 tuần (10 ngày làm việc) |
| **Mục tiêu chính** | Nâng cấp hoàn chỉnh trải nghiệm tìm kiếm/lọc đa tiêu chí trên cổng khách hàng (`client/`), tối ưu hóa hiệu năng tải trang & tải ảnh (`NFR-03`, `NFR-13`, `AT-12`, `AT-40` đạt `p75 ≤ 3 giây` với bộ dữ liệu `500` tin trên mạng 4G mô phỏng), củng cố tính ổn định xử lý lỗi mạng/trạng thái rỗng, đồng thời đồng bộ toàn hệ thống theo danh sách **5 phường Quận Bình Thạnh mới năm 2026** và các cải tiến UX quản trị mới nhất. |
| **Use case trọng tâm** | `UC-01` (Xem danh sách phòng công khai), `UC-02` (Tìm kiếm và lọc phòng nâng cao), `UC-03` (Xem chi tiết phòng và thư viện ảnh tối ưu); kết hợp tinh chỉnh UX `UC-05` & `UC-06` ở khu quản trị (`admin/`). |
| **Yêu cầu liên quan** | `BRQ-01`–`BRQ-03`, `BRQ-05`; `FR-01`–`FR-05`, `FR-07`, `FR-08`, `FR-18`, `FR-19`; `NFR-01`–`NFR-03`, `NFR-05`, `NFR-07`, `NFR-08`, `NFR-13`, `NFR-16`–`NFR-18`; `RULE-01`–`RULE-11`; `AT-03`–`AT-05`, `AT-09`–`AT-12`, `AT-18`, `AT-24`, `AT-26`, `AT-29`, `AT-40`, `AT-42`, `AT-43`, `AT-45`, `AT-46`. |
| **Kiến trúc ứng dụng & dữ liệu** | Hệ thống Khách hàng `client/` (`http://127.0.0.1:5173`) + Hệ thống Quản trị `admin/` (`http://127.0.0.1:5174`) + Backend Express 5 (`http://127.0.0.1:3000`) + **MongoDB 8** (driver chính thức `mongodb`). Benchmark hiệu năng dùng DB tách biệt `room_rental_perf` để bảo toàn tuyệt đối dữ liệu thật trên `room_rental_dev`. |
| **Trạng thái Sprint 3** | **Hoàn thành kỹ thuật (chờ chủ dự án nghiệm thu cuối)**: đã hoàn thiện lọc đa tiêu chí + tiện nghi `amenities` (kèm 5 phường Bình Thạnh 2026 & `Thang máy`), chip gỡ từng điều kiện, `AbortController` chống race condition, phục hồi lỗi mạng giữ URL, `ETag`/`304` + `fetchpriority` cho ảnh, thêm 2 index MongoDB (`idx_public_rooms_area`, `idx_public_rooms_amenities`), tạo tập benchmark `500` tin trên `room_rental_perf` (`IXSCAN` sạch `COLLSCAN`) và vượt chuẩn hiệu năng 4G với **`p75 = 1352.1 ms` (`≤ 3000 ms`)**, **`maxCLS = 0.0001` (`< 0.1`)**. |

### 1.1. Sprint Goal

> Khép lại Sprint 3, khách thuê phòng có thể kết hợp nhuần nhuyễn tìm kiếm từ khóa, lọc theo 5 phường Quận Bình Thạnh mới năm 2026, loại phòng, khoảng giá, khoảng diện tích, tình trạng phòng và tiện nghi (`Thang máy`, `Máy lạnh`, `Ban công`...) với URL chia sẻ được, chip gỡ lọc từng tiêu chí và khả năng phục hồi mượt mà khi lỗi mạng — đồng thời trang danh sách tải trên thiết bị di động (`360px`) qua mạng 4G mô phỏng với tập dữ liệu **500 tin** đạt **`p75 ≤ 3 giây`** (`NFR-13`, `AT-40`), không giật bố cục ảnh (`CLS < 0.1`), và đồng bộ mọi cập nhật từ Admin sang trang khách trong tối đa 60 giây (`FR-18`, `AT-45`).

### 1.2. Tiếp nối từ Sprint 2 & Các cải tiến đã hoàn thành đầu Sprint 3

Trong quá trình khép lại Sprint 2 và chuẩn bị bước vào Sprint 3, các phần việc sau đã có sẵn hoặc được cập nhật trước theo yêu cầu trực tiếp của chủ dự án:

| Hạng mục | Thực trạng trong mã nguồn hiện tại | Việc cần làm tiếp trong Sprint 3 |
| :--- | :--- | :--- |
| **Tìm kiếm & lọc cơ bản (`q`, `ward`, `roomType`, `min/maxPriceVnd`, `min/maxAreaM2`, `availability`, `sort`, `page`)** | Đã triển khai trong `server/src/routes/public.js` và `client/src/App.jsx` (`MobileFilterDrawer`, `activeChips`, `quick-price-chips`). | Mở rộng hỗ trợ **lọc theo tiện nghi (`amenities`)**, chuẩn hóa preset diện tích/khả năng bấm lọc nhanh trên mobile, xử lý debounce/tối ưu chuyển bộ lọc tránh nháy màn hình và đồng bộ `popstate`. |
| **Chuẩn hóa 5 phường Quận Bình Thạnh năm 2026** | Đã cập nhật tại `admin/src/App.jsx` (`BINH_THANH_WARDS`), `server/scripts/seed-sprint2.js`, `server/scripts/verify-sprint2-public.js`: `Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới` (theo Nghị quyết `1685/NQ-UBTVQH15`). | Bảo đảm mọi dữ liệu seed mới, bộ lọc `ward`, dropdown `/api/v1/public/categories` và kịch bản benchmark 500 tin đều dùng chuẩn 5 phường năm 2026. |
| **Chuẩn hóa danh mục tiện nghi `AMENITIES`** | Đã xóa `"Máy giặt"` và thêm `"Thang máy"` đồng bộ trong `server/src/routes/public.js`, `server/src/routes/admin.js`, `admin/src/App.jsx`, `server/scripts/seed-sprint2.js`. | Đưa danh mục `AMENITIES` (có `"Thang máy"`) vào bộ lọc nâng cao phía Khách hàng (`client/`) và kiểm chứng lọc chuẩn xác. |
| **Cải tiến UX khu Quản trị (`admin/`)** | Đã triển khai trên `admin/src/App.jsx`: (1) Cho phép chọn nhiều ảnh (`pendingFiles`) và bấm `Đặt làm bìa` ngay trên `/rooms/new` trước khi lưu nháp (`DRAFT`), sau đó mới quyết định xuất bản; (2) Sau khi bấm `Xuất bản` (`setStatus('PUBLISHED')`) tự động điều hướng về Tổng quan (`/`). | Kiểm thử hồi quy kỹ luồng này song song với tính năng đồng bộ cache public (`FR-18`, `AT-45`) để tin vừa xuất bản hiện trên trang khách trong `≤ 60 giây`. |
| **Chỉ mục MongoDB & Benchmark 500 tin (`NFR-13`, `AT-40`)** | Đã có 4 index public (`idx_public_rooms_feed`, `idx_public_rooms_ward`, `idx_public_rooms_type_price`, `idx_room_image_lookup`) trong `server/src/db/mongo.js`. | Bổ sung index cho `areaM2`/`amenities`, tinh chỉnh tối ưu ảnh/cache (`ETag`, `304`, `fetchpriority`), tạo script benchmark 500 tin chạy trên DB riêng `room_rental_perf` và đo nghiệm thu 5 lượt mạng 4G mô phỏng. |

---

## 2. Tài liệu và quyết định liên quan

| Tài liệu | Vai trò đối với Sprint 3 |
| :--- | :--- |
| [Sprint 0 — Setup](<./Sprint_0_Setup.md>) | Nền tảng cấu hình môi trường Node.js, Docker **MongoDB 8**, kiểm thử `/api/v1/health/*` và quyết định `ADR-S0-01`. |
| [Sprint 1 — Khu quản trị và quản lý tin phòng](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>) | Quy chuẩn tạo/sửa tin nháp, upload ảnh, quy tắc kiểm duyệt xuất bản và khung giao diện `admin/`. |
| [Sprint 2 — Hệ thống Khách hàng: Danh sách, Tìm kiếm, Lọc và Chi tiết Phòng](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>) | Nền tảng Public API `/api/v1/public/*`, `client/`, cơ chế privacy allowlist và bộ test `verify-sprint2-public.js`. |
| [03_Requirements.md](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/03_Requirements.md>) | Yêu cầu chức năng & phi chức năng gốc, đặc biệt `FR-02`, `FR-03`, `FR-18`, `NFR-03`, `NFR-05`, `NFR-13`, `NFR-16`–`NFR-18`. |
| [04_Use_Case.md](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/04_Use_Case.md>) | Luồng chi tiết `UC-01`, `UC-02`, `UC-03`, điều kiện lỗi `INVALID_RANGE` và trạng thái rỗng. |
| [07_UI_UX_Design.md](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/07_UI_UX_Design.md>) | Chuẩn giao diện responsive `360px`–`1440px`, drawer lọc mobile, skeleton loading, tương phản WCAG AA+. |
| [08_System_Architecture.md](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/08_System_Architecture.md>) | Chiến lược cache `public, max-age=30/60`, xử lý ảnh, tối ưu truy vấn MongoDB và cách ly 2 cổng. |
| [09_API_Specification.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/09_API_Specification.md>) | Hợp đồng tham số truy vấn `GET /api/v1/public/rooms`, phân trang, mã lỗi `400 INVALID_QUERY` / `INVALID_RANGE`. |
| [10_Testing_Acceptance.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>) | Quy trình đo hiệu năng mục 12 (`NFR-13`), ma trận `AT-03`, `AT-04`, `AT-12`, `AT-18`, `AT-40`, `AT-45`, `AT-46`. |

---

## 3. Phạm vi Sprint 3

### 3.1. Trong phạm vi

1. **Hoàn thiện Bộ lọc nâng cao & Trải nghiệm tìm kiếm (`UC-02`, `FR-02`, `FR-03`, `AT-03`, `AT-04`, `AT-18`)**:
   - Hỗ trợ lọc theo **tiện nghi (`amenities`)** kết hợp đa chọn (ví dụ tìm phòng có cả `Máy lạnh` và `Thang máy` hoặc `Ban công`) trên cả `GET /api/v1/public/rooms` lẫn bộ lọc desktop & `MobileFilterDrawer`.
   - Hoàn thiện vùng chọn nhanh khoảng diện tích / tiện nghi phổ biến (song hành cùng `quick-price-chips`), đồng bộ hai chiều với URL query string (`?q=...&ward=...&roomType=...&amenities=...&minPriceVnd=...&sort=...&page=...`).
   - Giữ nguyên bộ lọc khi chuyển trang (`PaginationBar`), khi bấm F5 tải lại trình duyệt, hoặc khi mở trang chi tiết rồi bấm `Quay lại` / breadcrumb.
   - Bổ sung kiểm chứng đầu vào mượt mà ngay trên form lọc (`minPriceVnd > maxPriceVnd`, `minAreaM2 > maxAreaM2`, giá/diện tích âm) và hiển thị lỗi rõ ràng kèm nút gỡ nhanh.

2. **Chuẩn hóa dữ liệu 2026 & Cải tiến UX luồng Admin (`FR-07`, `FR-08`, `FR-18`)**:
   - Đảm bảo **5 phường Quận Bình Thạnh mới năm 2026** (`Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới`) và danh mục `AMENITIES` (có `"Thang máy"`, bỏ `"Máy giặt"`) nhất quán ở mọi dropdown, seed data và bộ lọc công khai.
   - Kiểm chứng hoàn chỉnh luồng tạo tin mới trên `admin/` (`/rooms/new`): chọn & sắp xếp/chọn ảnh bìa ngay trước khi bấm `Lưu bản nháp`, tiếp tục lưu ở trạng thái `DRAFT`, sau đó kiểm tra/chỉnh sửa rồi mới bấm `Xuất bản` và tự động quay về trang Tổng quan (`/`).
   - Đảm bảo đồng bộ dữ liệu từ Admin ra Public API trong `≤ 60 giây` (`FR-18`, `AT-45`).

3. **Tối ưu Tải ảnh, Ngăn giật bố cục (CLS) & Xử lý Trạng thái biên (`NFR-03`, `NFR-05`, `AT-26`, `AT-42`)**:
   - Giữ tối đa **3 ảnh tối ưu** tải ở lượt đầu theo đúng quy định `NFR-13`: trên trang danh sách dùng ảnh bìa (`coverImageUrl`) có kích thước/tỉ lệ khung hình cố định (`aspect-ratio: 4/3` hoặc `16/10`) để `CLS = 0`; thẻ phòng thuộc nhóm hiển thị đầu màn hình (*above-the-fold*, ví dụ 2–3 thẻ đầu) dùng tải ưu tiên (`fetchpriority="high"`), các ảnh phía dưới dùng `loading="lazy"` và `decoding="async"`.
   - Tại endpoint ảnh `/api/v1/public/rooms/:roomId/images/:imageId/file`: bổ sung hỗ trợ chuẩn **ETag / Last-Modified** (trả `304 Not Modified` khi trình duyệt re-validate) cùng `Cache-Control: public, max-age=60`, đồng thời kiểm tra kịch bản nén/tối ưu kích thước ảnh khi upload ở tầng Admin (`NFR-03`) để ảnh bìa tải nhanh trên mạng 4G (~4–9 Mbps) mà không gửi ảnh gốc quá nặng.
   - Hoàn thiện xử lý **Loading / Empty / Network Error / Timeout**: giữ khung skeleton ổn định chiều cao (không nhảy giật khi dữ liệu về), hiển thị nút `Thử lại` giữ nguyên toàn bộ tham số lọc khi mất mạng tạm thời, và dọn gọn `AbortController` để tránh race condition khi người dùng đổi bộ lọc liên tiếp nhanh.

4. **Tối ưu MongoDB 8 & Nghiệm thu Hiệu năng `500` tin trên mạng 4G (`NFR-13`, `AT-12`, `AT-40`)**:
   - Bổ sung & tinh chỉnh compound indexes trên `room_listings` (`server/src/db/mongo.js`) cho truy vấn diện tích (`areaM2`), tiện nghi (`amenities`) và sắp xếp theo giá/ngày đăng.
   - Kiểm tra query plan bằng `.explain("executionStats")` trên tập dữ liệu **500 bản ghi** để bảo đảm truy vấn lọc phổ biến sử dụng index (`IXSCAN`) thay vì quét toàn bộ collection (`COLLSCAN`).
   - Xây dựng script sinh dữ liệu benchmark 500 phòng (`server/scripts/seed-perf-500.js`) chạy vào **database tách biệt `room_rental_perf`** (không ảnh hưởng dữ liệu thật của chủ dự án trong `room_rental_dev`) và script đo tự động 5 lượt trên cấu hình di động `360px` + 4G throttling (`server/scripts/verify-sprint3-perf.js`), xác nhận chỉ số **`p75 ≤ 3 giây`** (`≤ 3000ms`).

### 3.2. Ngoài phạm vi Sprint 3 (chuyển sang Sprint 4)

| Hạng mục | Lý do giữ cho Sprint 4 |
| :--- | :--- |
| Triển khai lên domain thật, cấu hình HTTPS/TLS, tách môi trường Staging & Production (`NFR-09`, `AT-38`) | Thuộc công tác phát hành hạ tầng và bàn giao Go-Live ở **Sprint 4**. |
| Thiết lập backup tự động 7 ngày + 4 tuần ngoài cùng failure domain & diễn tập restore (`NFR-11`, `AT-37`, `AT-39`) | Thuộc quy trình vận hành & sao lưu khôi phục production ở **Sprint 4**. |
| Uptime monitor, cảnh báo sự cố & nghiệm thu dữ liệu thật thay thế toàn bộ dữ liệu mẫu (`AT-41`, `AT-44`, `AT-47`–`AT-49`) | Thực hiện khi chốt phiên bản bàn giao chính thức tại **Sprint 4**. |

---

## 4. Định hướng UX & Tối ưu hiển thị — Saigon Tropical Living & Modern Hospitality

Sprint 3 tiếp tục kế thừa hệ thống nhận diện **Ngọc Toàn — HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH** và bảng token màu *Saigon Tropical Living* (`client/src/index.css`, `admin/src/index.css`), tập trung giải quyết ba điểm chạm UX quyết định trải nghiệm thực tế:

### 4.1. Trải nghiệm Tìm kiếm & Lọc nâng cao trên `client/`

1. **Thanh tìm kiếm & bộ lọc tức thời nhưng ổn định**:
   - Từ khóa `q` hỗ trợ nút `×` xóa nhanh; kết hợp chọn nhanh 5 phường Quận Bình Thạnh 2026 (`Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới`), loại phòng và tình trạng phòng.
   - Khoảng giá (`quick-price-chips`: `Tất cả`, `Dưới 3,5 triệu`, `3,5 – 5 triệu`, `Trên 5 triệu`) và **tiện nghi nổi bật** (`Thang máy`, `Máy lạnh`, `Ban công`, `Gác lửng`, `Bếp riêng`, `Nhà vệ sinh riêng`, `Chỗ để xe`...) cho phép chọn/bỏ trực tiếp chỉ bằng 1 chạm.
2. **Active Filter Chips rõ ràng**:
   - Hiển thị ngay phía dưới thanh đếm kết quả toàn bộ điều kiện đang áp dụng (bao gồm chip tiện nghi, khoảng giá, khoảng diện tích, phường 2026), mỗi chip có nút `×` gỡ riêng từng tiêu chí mà không làm mất các tiêu chí còn lại.
3. **Ngăn kéo lọc Mobile (`MobileFilterDrawer`) tối ưu cho màn hình `360px`**:
   - Nút `Bộ lọc (N)` hiển thị chính xác tổng số nhóm tiêu chí đang bật; các trường nhập số dùng `inputMode="numeric"` (giá VNĐ) / `inputMode="decimal"` (diện tích m²) để bàn phím số hiện đúng trên điện thoại; vùng chạm các chip tiện nghi và nút `Áp dụng bộ lọc` đạt tối thiểu `44×44px`.

### 4.2. Trải nghiệm Tối ưu Tải ảnh, Skeleton & Khôi phục Lỗi mạng

| Thành phần | Quy tắc UX & Hiệu năng Sprint 3 | Mục tiêu kỹ thuật |
| :--- | :--- | :--- |
| **Ảnh bìa danh sách (`PublicRoomCard`)** | Cố định tỷ lệ khung ảnh (`aspect-ratio`) trong CSS; 2–3 ảnh đầu viewport gắn `fetchpriority="high"` + `loading="eager"`, các ảnh còn lại dùng `loading="lazy"` + `decoding="async"`. | Không gây nhảy bố cục (`CLS < 0.05`), rút ngắn `LCP` dưới mạng 4G. |
| **Ảnh trong `RoomGallery` (`/rooms/:roomId`)** | Ảnh chính đang chọn tải `eager` + `fetchpriority="high"`; các thumbnail bên dưới tải `lazy`; ảnh bị lỗi tự fallback qua `SafeImage` giữ nguyên khung. | Tránh tải thừa ảnh lớn khi người dùng chỉ xem 1–2 ảnh đầu. |
| **Skeleton Loading (`PublicCatalogPage`)** | Hiển thị 6 khung `skeleton-card` có kích thước ảnh & dòng chữ tương đương thẻ thật; không co cụm hay nhảy trang khi chuyển giữa Loading → Có dữ liệu. | Cảm nhận phản hồi tức thì, nhất quán trên cả desktop & mobile. |
| **Xử lý Lỗi mạng & Hủy request cũ (`AbortController`)** | Khi người dùng đổi bộ lọc nhanh liên tiếp, hủy request trước đó để tránh dữ liệu cũ ghi đè kết quả mới; nếu mất mạng hoặc timeout, giữ nguyên bộ lọc trên URL và hiện thẻ thông báo lỗi tiếng Việt + nút `Thử lại`. | Đạt `NFR-05`, không trắng trang hoặc mất bộ lọc đã chọn. |

### 4.3. Cải tiến UX khu Quản trị (`admin/`) đã đồng bộ cho Sprint 3

1. **Tải ảnh & Chọn ảnh bìa ngay trên `/rooms/new`**: Chủ dự án có thể chọn nhiều tệp JPEG/PNG/WebP vào hàng đợi local (`Object URL`), bấm `Đặt làm bìa` hoặc sắp xếp/gỡ ảnh ngay trước khi bấm `Lưu bản nháp`; khi bấm lưu, frontend tuần tự tạo tin `DRAFT` rồi tự động upload toàn bộ hàng đợi ảnh theo đúng thứ tự ảnh bìa vừa chọn.
2. **Tách rõ bước Lưu nháp và Xuất bản về Tổng quan**: Lưu tin mới luôn đưa về trạng thái `DRAFT` để chủ nhà rà soát trước; khi kiểm tra xong và bấm `Xuất bản` (`PUBLISHED`), hệ thống tự động đưa chủ nhà trở về màn hình Tổng quan (`/`) để nắm ngay số liệu `Tổng số tin`, `Đang hiển thị`, `Phòng còn trống`.

### 4.4. Tiêu chí review thẩm mỹ & hiệu năng Sprint 3

- [x] Active Filter Chips (kể cả chip tiện nghi `Thang máy`, phường 2026) xuống dòng gọn đẹp trên `360px` và `1280px`, không đè chữ hay tràn ngang (`scrollWidth <= innerWidth`).
- [x] Quá trình chuyển từ Loading Skeleton → Lưới thẻ phòng thật không gây giật dọc quá mức (`CLS < 0.1`, đo thực tế `0.0001`).
- [x] Ảnh tải trên mạng 4G mô phỏng hiển thị mượt, ảnh bìa nét, không gửi ảnh thô vượt dung lượng tối ưu hợp lý.
- [x] Mất kết nối API hoặc truyền khoảng lọc sai không làm crash giao diện; bấm `Thử lại` khôi phục đúng kết quả theo bộ lọc đang giữ trên URL.

---

## 5. Product Backlog Sprint 3

| Mã | Hạng mục | Liên kết BA | Trạng thái nền hiện tại | Tiêu chí hoàn tất Sprint 3 |
| :--- | :--- | :--- | :--- | :--- |
| `S3-01` | Chuẩn hóa 5 phường Bình Thạnh 2026 & danh mục `AMENITIES` (`Thang máy`, bỏ `Máy giặt`) | `BRQ-05`, `FR-02`, `FR-04` | **Hoàn thành & kiểm chứng** trong `admin/`, `public.js`, `admin.js`, `seed-sprint2.js` | Toàn bộ seed, API `/categories`, form admin và bộ lọc khách hàng dùng chuẩn 5 phường 2026 và không còn `Máy giặt`. |
| `S3-02` | Hoàn thiện UX Admin: chọn ảnh + ảnh bìa trước khi lưu nháp & xuất bản chuyển về Tổng quan | `UC-05`, `UC-06`, `FR-07`, `FR-08` | **Hoàn thành & kiểm chứng** trong `admin/src/App.jsx` (`RoomFormPage`, `setStatus`) | Tạo tin mới upload được ảnh + chọn ảnh bìa ngay từ form tạo mới, lưu ở `DRAFT`, và bấm `Xuất bản` điều hướng về `/`. |
| `S3-03` | Nâng cấp Public API `/api/v1/public/rooms` hỗ trợ lọc theo tiện nghi (`amenities`) & tối ưu `QuerySchema` | `UC-02`, `FR-02`, `AT-03`, `AT-04` | **Hoàn thành & kiểm chứng** trong `server/src/routes/public.js` | Hỗ trợ query `amenities` (chọn nhiều giá trị, ví dụ `amenities=Máy lạnh,Thang máy`), kiểm tra giá trị hợp lệ theo `AMENITIES`, trả `400 INVALID_QUERY` nếu sai. |
| `S3-04` | Nâng cấp UI Bộ lọc nâng cao trên `client/` (tiện nghi, preset diện tích/giá, Active Chips, `MobileFilterDrawer`) | `UC-02`, `FR-02`, `FR-03`, `AT-03`, `AT-04`, `AT-18` | **Hoàn thành & kiểm chứng** trong `client/src/App.jsx` & `App.css` | Chọn/gỡ nhiều tiện nghi mượt trên cả desktop & mobile `360px`, giữ nguyên bộ lọc/tiện nghi khi phân trang, F5 và `Quay lại` từ chi tiết. |
| `S3-05` | Chống race condition bộ lọc (`AbortController`), debounce tìm kiếm & phục hồi lỗi mạng giữ filter | `NFR-05`, `NFR-07`, `AT-09`, `AT-10` | **Hoàn thành & kiểm chứng** trong `client/src/App.jsx` | Gõ/đổi lọc liên tiếp không bị response cũ ghi đè; khi tắt mạng/lỗi 500 bấm `Thử lại` nạp đúng query hiện hành. |
| `S3-06` | Tối ưu tải ảnh & tài nguyên tĩnh (`ETag`/`304`, `fetchpriority`, `aspect-ratio`, giới hạn nén/kích thước hiển thị) | `NFR-03`, `NFR-13`, `FR-18`, `AT-26`, `AT-45` | **Hoàn thành & kiểm chứng** (`public.js` + `SafeImage` + `seed-perf-500.js`) | Bổ sung `ETag`/`Last-Modified` cho endpoint ảnh public, tối ưu ảnh lượt đầu (`fetchPriority="high"` cho top 3), đạt `CLS = 0.0001`, đồng bộ cập nhật admin `≤ 60 giây`. |
| `S3-07` | Tối ưu Compound Indexes MongoDB 8 & kiểm tra query plan `explain("executionStats")` | `NFR-13`, `06_Data_Analysis` | **Hoàn thành & kiểm chứng** trong `server/src/db/mongo.js` (8 indexes) | Bổ sung `idx_public_rooms_area` và `idx_public_rooms_amenities`, chạy `explain()` xác nhận 4 nhóm truy vấn đều dùng `IXSCAN` với 500 bản ghi. |
| `S3-08` | Dataset benchmark 500 bản ghi trên DB tách biệt (`room_rental_perf`) & kịch bản đo hiệu năng 4G (`AT-12`, `AT-40`) | `NFR-13`, `10_Testing_Acceptance` mục 12 | **Hoàn thành & kiểm chứng** (`server/scripts/seed-perf-500.js`) | Tạo đủ 500 tin `PUBLISHED` + 10 tin nội bộ trên `room_rental_perf` và `server/uploads-perf` (1250 ảnh ~2.04 KB/ảnh), không đụng `room_rental_dev`. |
| `S3-09` | Thực thi Benchmark 5 lượt trên thiết bị di động (`360px`) + 4G throttling & lưu báo cáo `p75 ≤ 3s` | `NFR-02`, `NFR-13`, `AT-12`, `AT-40` | **Hoàn thành & kiểm chứng** (`server/scripts/verify-sprint3-perf.js`) | Đo API (`p75 = 11.8 ms`) & Chromium CDP 4G 5 lượt: `p75 = 1352.1 ms` (`<= 3000 ms`), `maxCLS = 0.0001`. |
| `S3-10` | Kiểm thử hồi quy toàn bộ ma trận `AT` Sprint 2–3 & chuẩn bị nghiệm thu trước Sprint 4 | `10_Testing_Acceptance` | **Hoàn thành & kiểm chứng** (`verify:sprint2` & `verify:sprint3`) | Toàn bộ test API, bảo mật riêng tư, bộ lọc nâng cao `amenities`, UX admin và hiệu năng `p75 ≤ 3s` đều `PASS`. |

### 5.1. Lọc kết hợp đa tiêu chí, Tiện nghi và Đồng bộ URL (`S3-03`, `S3-04`)

- **Phạm vi**: `UC-02`, `FR-02`, `FR-03`, `AT-03`, `AT-04`, `AT-18`.
- **Tiêu chí chấp nhận**:
  1. `GET /api/v1/public/rooms` chấp nhận tham số `amenities` (chuỗi phân tách bởi dấu phẩy hoặc mảng query lặp lại `?amenities=Máy lạnh&amenities=Thang máy`), kiểm tra từng phần tử phải nằm trong danh mục `AMENITIES` hợp lệ; sử dụng `$all` trên MongoDB để phòng trả về thỏa mãn **đồng thời** tất cả tiện nghi người dùng đã chọn.
  2. Có thể kết hợp cùng lúc cả 7 nhóm điều kiện: từ khóa `q` + phường 2026 (`ward`) + loại phòng (`roomType`) + tiện nghi (`amenities`) + khoảng giá (`minPriceVnd`..`maxPriceVnd`) + khoảng diện tích (`minAreaM2`..`maxAreaM2`) + tình trạng (`availability`) + sắp xếp (`sort`).
  3. Khi chuyển sang trang 2, trang 3... qua `PaginationBar` hoặc mở một tin bất kỳ rồi bấm nút quay lại (`Quay lại danh sách`), toàn bộ tham số lọc kể cả `amenities` phải được giữ nguyên.
  4. Truyền giá trị `amenities` không tồn tại trong whitelist hoặc truyền `minPriceVnd > maxPriceVnd` / `minAreaM2 > maxAreaM2` trả `400 INVALID_QUERY` / `INVALID_RANGE` và giao diện hiển thị thông báo rõ ràng mà không làm crash trang.

### 5.2. Tối ưu Tải ảnh, Ngăn giật bố cục và Trạng thái Lỗi mạng (`S3-05`, `S3-06`)

- **Phạm vi**: `NFR-03`, `NFR-05`, `NFR-13`, `FR-18`, `AT-26`, `AT-45`.
- **Tiêu chí chấp nhận**:
  1. `SafeImage` phân biệt ảnh ưu tiên hiển thị ngay (*above-the-fold*, truyền `priority={index < 3}` ở lưới thẻ và ảnh chính trong `RoomGallery`) gắn `loading="eager"` + `fetchPriority="high"`, các ảnh dưới màn hình đầu gắn `loading="lazy"` + `decoding="async"`.
  2. Khung chứa ảnh trên `PublicRoomCard` và `RoomGallery` có chiều cao/tỷ lệ cố định (`aspect-ratio`) và `skeleton-thumb` đồng kích thước để `CLS < 0.1`.
  3. Endpoint `/api/v1/public/rooms/:roomId/images/:imageId/file` tính và phản hồi `ETag` ổn định dựa trên `image.id` + `room.updatedAt` (hoặc `sha256` ảnh) kèm `Cache-Control: public, max-age=60`; request có `If-None-Match` khớp trả `304 Not Modified` giúp giảm băng thông di động 4G.
  4. Khi Admin cập nhật giá/tình trạng/ảnh bìa của tin đang `PUBLISHED`, người dùng tải lại trang khách thấy dữ liệu mới ngay lập tức hoặc trong tối đa 30–60 giây (`max-age=30` cho JSON danh sách/chi tiết, `max-age=60` cho ảnh), thỏa `FR-18` và `AT-45`.

### 5.3. Tối ưu Cơ sở dữ liệu & Nghiệm thu Hiệu năng 500 bản ghi (`S3-07`, `S3-08`, `S3-09`)

- **Phạm vi**: `NFR-02`, `NFR-13`, `AT-12`, `AT-40`.
- **Tiêu chí chấp nhận**:
  1. Tập dữ liệu benchmark **500 bản ghi `PUBLISHED`** (cộng thêm một số tin `DRAFT`/`HIDDEN` để kiểm chứng cô lập) phân bổ đều qua **5 phường Quận Bình Thạnh 2026**, đủ 5 `ROOM_TYPES` và đa dạng `AMENITIES` (có `Thang máy`), mỗi tin gắn tối đa 3 ảnh tối ưu dung lượng nhẹ cho lượt tải đầu (`NFR-13`).
  2. Dữ liệu benchmark chạy trên database riêng `room_rental_perf` (qua biến môi trường `MONGODB_DB_NAME=room_rental_perf`) nên **tuyệt đối không làm bẩn hoặc ghi đè** dữ liệu tin thật mà chủ dự án đã tạo trong `room_rental_dev`.
  3. Chạy `explain("executionStats")` cho 4 truy vấn điển hình (danh sách mặc định, lọc theo phường + giá, lọc theo diện tích + tiện nghi, sắp xếp theo giá): tỷ lệ `totalDocsExamined / totalKeysExamined` hợp lý, không có `COLLSCAN` trên tập 500 tin.
  4. Thực hiện **5 lượt đo độc lập** bằng Playwright (viewport di động `360×800`, giả lập mạng **4G nhất quán** qua Chrome DevTools Protocol `Network.emulateNetworkConditions`), ghi lại kết quả từng lượt và tính phân vị thứ 75 (`p75`): thời gian hiển thị nội dung chính và `LCP` đều **`≤ 3.0 giây` (`≤ 3000ms`)**.

---

## 6. Quy trình nghiệp vụ & Luồng tối ưu trong Sprint 3

### 6.1. Luồng Tìm kiếm, Lọc nâng cao & Chống Race Condition (`client/`)

```text
Người dùng thay đổi từ khóa / phường 2026 / tiện nghi / giá / diện tích
  │
  ├─► Kiểm tra range hợp lệ ở client (validateFilterRanges)
  │     └─ min > max hoặc ≤ 0 sai quy tắc ──► Hiện thông báo ngay tại form, KHÔNG gọi API
  │
  ├─► Hợp lệ ──► Đồng bộ URL query string (?q=...&ward=...&amenities=...&page=1)
  │
  ├─► Hủy request cũ đang chờ (AbortController.abort()) + hiện Skeleton giữ nguyên khung cao
  │
  └─► GET /api/v1/public/rooms?...
        ├─ Lỗi mạng / 5xx ──► Hiện thông báo dễ hiểu + nút "Thử lại" (KHÔNG xóa bộ lọc/URL)
        ├─ 400 INVALID_*  ──► Hiện cảnh báo fieldErrors + nút "Xóa toàn bộ bộ lọc"
        └─ 200 OK         ──► Render lưới PublicRoomCard + Active Chips + PaginationBar
                              ├─ 3 ảnh đầu: fetchpriority="high" (tải sớm cho LCP)
                              └─ Ảnh dưới: loading="lazy" + decoding="async" + aspect-ratio cố định
```

### 6.2. Luồng Tạo tin mới có Ảnh bìa → Lưu nháp → Xuất bản về Tổng quan (`admin/`)

```text
Admin mở /rooms/new
  │
  ├─► Nhập tiêu đề, chọn 1 trong 5 phường Bình Thạnh 2026, chọn tiện nghi (có Thang máy)
  ├─► Chọn ảnh từ máy (JPEG/PNG/WebP ≤ 10MB, tối đa 15 ảnh) ──► Lưu hàng đợi local (Object URL)
  ├─► Bấm "Đặt làm bìa" / đổi thứ tự ảnh ngay trước khi lưu ──► Ảnh index 0 là isCover = true
  │
  ├─► Bấm "Lưu bản nháp"
  │     ├─ POST /api/v1/admin/rooms (lưu DRAFT vào MongoDB 8)
  │     └─ Tự động POST /api/v1/admin/rooms/:id/images theo đúng thứ tự (ảnh bìa lên trước)
  │           └─ Chuyển sang /rooms/:id ở trạng thái DRAFT để Admin kiểm tra lần cuối
  │
  └─► Admin quyết định bấm "Xuất bản"
        ├─ Validate đủ điều kiện xuất bản (RULE-05 + mục 8.2)
        ├─ PATCH /api/v1/admin/rooms/:id/publish-status { publishStatus: "PUBLISHED" }
        └─ Thành công ──► Tự động chuyển hướng về Tổng quan Admin (/) kèm thông báo thành công
```

### 6.3. Quy trình Benchmark 500 bản ghi tách biệt DB (`NFR-13`, `AT-40`)

```text
1. Khởi tạo DB benchmark riêng: MONGODB_DB_NAME=room_rental_perf
2. Chạy init-db.js & seed-perf-500.js ──► Nạp 500 tin PUBLISHED (5 phường 2026, ảnh tối ưu)
3. Khởi động Backend trỏ MONGODB_DB_NAME=room_rental_perf (hoặc port tách biệt khi đo)
4. Playwright mở http://127.0.0.1:5173 (viewport 360x800, 4G throttling qua CDP)
5. Chạy 5 lượt đo độc lập (Fresh cache / Warm cache) ──► Ghi TTFB, FCP, API Latency, Hero/List Ready, LCP
6. Sắp xếp tăng dần 5 lượt ──► Tính p75 ──► Đối chiếu ngưỡng ≤ 3000ms (PASS/FAIL)
7. Chuyển Server về DB mặc định room_rental_dev (dữ liệu thật của chủ dự án còn nguyên vẹn 100%)
```

---

## 7. Tối ưu Truy vấn, Chỉ mục MongoDB 8 và Cơ chế Cache/Ảnh

### 7.1. Hệ thống Compound Indexes trên `room_listings` (`server/src/db/mongo.js`)

Hiện tại `ensureIndexes()` đã có các chỉ mục sau và sẽ bổ sung thêm chỉ mục tối ưu lọc diện tích & tiện nghi trong Sprint 3:

| Tên Index | Trường khóa | Trạng thái | Tác dụng tối ưu truy vấn Sprint 3 |
| :--- | :--- | :--- | :--- |
| `idx_public_rooms_feed` | `{ publishStatus: 1, deletedAt: 1, availability: 1, publishedAt: -1, updatedAt: -1 }` | Đã có | Phục vụ trang danh sách mặc định ưu tiên `AVAILABLE` trước `RENTED` và mới xuất bản trước. |
| `idx_public_rooms_ward` | `{ publishStatus: 1, deletedAt: 1, ward: 1 }` | Đã có | Phục vụ truy vấn `distinct("ward")` cho `/categories` và lọc nhanh theo 5 phường Bình Thạnh 2026. |
| `idx_public_rooms_type_price` | `{ publishStatus: 1, deletedAt: 1, roomType: 1, priceVnd: 1 }` | Đã có | Phục vụ lọc theo loại phòng kết hợp khoảng giá hoặc sắp xếp `price_asc` / `price_desc`. |
| `idx_room_image_lookup` | `{ _id: 1, "images.id": 1 }` | Đã có | Tra cứu 1 phần tử trong mảng nhúng `images[]` khi stream file ảnh qua `/images/:imageId/file`. |
| `idx_public_rooms_area` *(mới S3)* | `{ publishStatus: 1, deletedAt: 1, areaM2: 1, priceVnd: 1 }` | **Cần bổ sung S3** | Tối ưu lọc khoảng diện tích `minAreaM2`/`maxAreaM2` kết hợp khoảng giá trên tập 500+ tin. |
| `idx_public_rooms_amenities` *(mới S3)* | `{ publishStatus: 1, deletedAt: 1, amenities: 1 }` *(Multikey index)* | **Cần bổ sung S3** | Tăng tốc truy vấn `$all` khi lọc nhiều tiện nghi đồng thời (ví dụ `Máy lạnh` + `Thang máy`). |

> **Lưu ý tối ưu biểu thức lọc `ward` trên MongoDB**: Hiện tại `server/src/routes/public.js` dùng `new RegExp('^' + escapeRegex(filter.ward) + '$', 'i')` với cờ `"i"` khiến MongoDB không thể tận dụng trọn vẹn B-tree index prefix bằng so khớp chính xác. Trong Sprint 3, chuẩn hóa so khớp `ward` (khi khớp danh sách 5 phường chuẩn hoặc kết hợp collation/so khớp trực tiếp) sẽ giúp truy vấn lọc theo phường sử dụng hiệu quả `idx_public_rooms_ward` với chi phí gần như `O(log N)`.

### 7.2. Chiến lược Cache & Đồng bộ tức thì `≤ 60 giây` (`FR-18`, `AT-45`)

| Endpoint | Header Cache-Control & Validation | Giải thích thiết kế |
| :--- | :--- | :--- |
| `GET /api/v1/public/categories` | `Cache-Control: public, max-age=60` | Danh sách 5 phường đang có tin, loại phòng và tiện nghi ít biến động từng giây. |
| `GET /api/v1/public/rooms` | `Cache-Control: public, max-age=30` | Vừa giảm tải khi chuyển qua lại chi tiết ↔ danh sách, vừa bảo đảm thay đổi giá/trạng thái từ Admin hiện trên khách trong tối đa 30s (`≤ 60s` theo `FR-18`). |
| `GET /api/v1/public/rooms/:roomId` | `Cache-Control: public, max-age=30` | Bảo đảm độ tươi `≤ 30s`; nút xem chi tiết cập nhật nhanh khi Admin sửa mô tả/liên hệ/trạng thái. |
| `GET /api/v1/public/rooms/:roomId/images/:imageId/file` | `Cache-Control: public, max-age=60` + `ETag` + `X-Content-Type-Options: nosniff` | Cho phép trình duyệt dùng lại cache nếu ảnh không đổi (`304 Not Modified`), tránh tải lại file nhị phân qua mạng 4G. |

---

## 8. Hợp đồng API & Tham số Lọc nâng cao Sprint 3

Toàn bộ API giữ tiền tố `/api/v1/public` và cấu trúc envelope lỗi thống nhất từ `09_API_Specification.md`. Phần bổ sung/chuẩn hóa trong Sprint 3:

### 8.1. Tham số mở rộng trên `GET /api/v1/public/rooms`

| Tham số query | Kiểu & Ràng buộc (Zod) | Hành vi truy vấn MongoDB 8 |
| :--- | :--- | :--- |
| `q` | Chuỗi trim, tối đa `100` ký tự | Escape regex an toàn (`escapeRegex`), khớp không phân biệt hoa/thường trên `title`, `ward`, `publicAddress` (tuyệt đối **không** khớp `privateAddress`). |
| `ward` | Chuỗi trim, tối đa `120` ký tự | Khớp phường thuộc danh sách `PUBLISHED` (ưu tiên 5 phường Bình Thạnh 2026: `Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới`). |
| `roomType` | Enum `ROOM_TYPES` | `Phòng trọ`, `Phòng có gác`, `Phòng studio`, `Căn hộ mini`, `Phòng ở ghép`. |
| `amenities` *(bổ sung S3)* | Danh sách phân tách dấu phẩy hoặc mảng query lặp, mỗi phần tử thuộc `AMENITIES` (tối đa 12 phần tử) | Nếu hợp lệ -> `match.amenities = { $all: selectedAmenities }`. Nếu chứa giá trị ngoài danh sách `AMENITIES` -> trả `400 INVALID_QUERY` kèm `fieldErrors.amenities`. |
| `availability` | `"AVAILABLE"` \| `"RENTED"` | Lọc chính xác tình trạng phòng (`Còn trống` / `Đã thuê`). |
| `minPriceVnd`, `maxPriceVnd` | Số nguyên `>= 0` | `minPriceVnd > maxPriceVnd` -> `400 INVALID_RANGE`. |
| `minAreaM2`, `maxAreaM2` | Số thực `> 0`, `<= 100000` | `minAreaM2 > maxAreaM2` -> `400 INVALID_RANGE`. |
| `sort` | `"available_first_publishedAt_desc"` \| `"publishedAt_desc"` \| `"price_asc"` \| `"price_desc"` | Mặc định ưu tiên `AVAILABLE` trước `RENTED`, sau đó mới nhất trước (`_id: 1` chốt phân trang tất định). |
| `page`, `pageSize` | `page >= 1`, `pageSize` trong `[1..48]` (mặc định `12`) | Trả `{ items, page, pageSize, totalItems, totalPages, hasNext }`. |

### 8.2. Danh mục chuẩn năm 2026 trả về từ `GET /api/v1/public/categories`

- `roomTypes`: `["Phòng trọ", "Phòng có gác", "Phòng studio", "Căn hộ mini", "Phòng ở ghép"]`.
- `amenities`: `["Máy lạnh", "Tủ lạnh", "Thang máy", "Giường", "Tủ quần áo", "Bếp riêng", "Nhà vệ sinh riêng", "Ban công", "Gác lửng", "Wifi", "Chỗ để xe", "Cửa sổ"]`. *(Đã bỏ `"Máy giặt"` và thêm `"Thang máy"`.)*
- `wards`: Lấy động bằng `distinct("ward")` từ các tin `PUBLISHED` (`deletedAt: null`), sắp xếp theo bảng chữ cái tiếng Việt (`locale: "vi"`). Trên dữ liệu chuẩn 2026 gồm: `Phường Bình Lợi Trung`, `Phường Bình Quới`, `Phường Bình Thạnh`, `Phường Gia Định`, `Phường Thạnh Mỹ Tây`.

---

## 9. Checklist Hiệu năng, UX, Quyền riêng tư & Bảo mật Sprint 3

- [x] **Cách ly dữ liệu thật khi Benchmark**: Toàn bộ bài test sinh 500 bản ghi chạy trên `MONGODB_DB_NAME=room_rental_perf` và `UPLOAD_DIR=server/uploads-perf`, không đụng tin thật của chủ dự án trong `room_rental_dev`.
- [x] **An toàn đầu vào `amenities` & `q` (`AT-46`)**: Chuỗi `q` chứa ký tự regex đặc biệt không gây ReDoS/500; tham số `amenities` được xác thực bằng enum whitelist nghiêm ngặt để chặn NoSQL operator injection (`$where`, `$ne`...).
- [x] **Bảo toàn Allowlist trường công khai (`AT-24`, `AT-25`, `AT-43`)**: Việc mở rộng filter `amenities` và bổ sung `$sort`/`$project` mới tuyệt đối không làm lọt `privateAddress`, `contactPhone`, `contactZalo`, `description` ra JSON danh sách.
- [x] **Độ tươi dữ liệu sau thao tác Admin (`FR-18`, `AT-45`)**: Sau khi Admin sửa tin hoặc bấm `Xuất bản` (chuyển hướng về Tổng quan `/`), trang khách phản ánh dữ liệu mới nhất trong vòng tối đa `60 giây` (thực tế `Cache-Control: max-age=30` ở API JSON và `ETag`/`304` ở file ảnh).
- [x] **Tối ưu ảnh lượt đầu (`NFR-03`, `NFR-13`)**: Không gửi ảnh thô hàng chục MB ra danh sách; mỗi tin trong tập benchmark có 2–3 ảnh tối ưu (`~2.04 KB/ảnh`), ảnh top 3 ưu tiên `fetchPriority="high"`, ảnh dưới màn hình đầu tải lười (`loading="lazy"`), `0` lỗi console khi cuộn danh sách.
- [x] **Hỗ trợ Accessibility & Điều hướng bàn phím (`NFR-18`, `AT-29`)**: Các chip lọc nhanh, chip tiện nghi `Thang máy`..., nút `×` xóa từng chip và nút `Thử lại` đều focus được bằng `Tab`/`Enter` và có `aria-label` rõ ràng.

---

## 10. Kế hoạch thực hiện đề xuất (10 ngày làm việc)

| Ngày | Nội dung công việc chính | Kết quả đầu ra |
| :--- | :--- | :--- |
| **Ngày 1–2** | Kiểm chứng lại các cập nhật vừa hoàn tất đầu Sprint 3 (5 phường Bình Thạnh 2026, `Thang máy` thay `Máy giặt`, tạo tin chọn ảnh/bìa trước khi lưu nháp, xuất bản chuyển về `/`); thiết kế & bổ sung bộ lọc `amenities` trên `server/src/routes/public.js` + unit/API validation tests. | API `/api/v1/public/rooms` hỗ trợ lọc `amenities` chuẩn enum & `400 INVALID_QUERY`. |
| **Ngày 3–4** | Nâng cấp `client/src/App.jsx` & `client/src/App.css`: bổ sung lọc tiện nghi (`amenities`) trên desktop & `MobileFilterDrawer`, preset diện tích/giá, chip gỡ từng tiện nghi trong `active-filters-bar`, triển khai `AbortController` chống race condition và giữ filter khi `Thử lại`. | Giao diện lọc nâng cao hoạt động mượt trên `360px`–`1440px`, giữ URL & lịch sử trình duyệt chuẩn xác. |
| **Ngày 5–6** | Tối ưu tải ảnh & chống CLS (`SafeImage` phân biệt `fetchpriority="high"` vs `loading="lazy"`, `aspect-ratio` cố định, skeleton đồng kích thước); bổ sung `ETag` / `304 Not Modified` cho `/api/v1/public/rooms/:roomId/images/:imageId/file`. | Ảnh tải nhanh, `CLS < 0.1`, request lặp lại nhận `304`, đồng bộ admin `≤ 60s`. |
| **Ngày 7** | Cập nhật `server/src/db/mongo.js` (`idx_public_rooms_area`, `idx_public_rooms_amenities`), tối ưu truy vấn `ward`; viết `server/scripts/seed-perf-500.js` sinh 500 tin chuẩn 2026 vào DB `room_rental_perf` và kiểm tra `.explain("executionStats")`. | Xác nhận query plan dùng `IXSCAN` sạch `COLLSCAN` trên 500 bản ghi. |
| **Ngày 8** | Viết và chạy `server/scripts/verify-sprint3-perf.js`: đo API latency (`p50`/`p75`/`p95`) và chạy Playwright 5 lượt với viewport `360×800` + 4G throttling (`AT-12`, `AT-40`), tinh chỉnh nếu bất kỳ chỉ số nào tiệm cận ngưỡng 3s. | Báo cáo benchmark 5 lượt đạt `p75 ≤ 3000ms` kèm số liệu cấu hình đo đầy đủ. |
| **Ngày 9** | Chạy kiểm thử hồi quy toàn diện `verify-sprint2-public.js` + test case mới Sprint 3 (`AT-03`, `AT-04`, `AT-09`, `AT-10`, `AT-11`, `AT-12`, `AT-18`, `AT-40`, `AT-42`, `AT-45`, `AT-46`) trên các mốc `360px`–`1440px`. | Bảng kết quả kiểm thử Sprint 3 đạt `100% PASS`, `0` lỗi console, `0` tràn ngang. |
| **Ngày 10** | Sprint Review với chủ dự án (`Ngọc Toàn`), rà soát DoD và xác nhận điều kiện chuyển giao sang **Sprint 4 (Go-Live Production)**. | Biên bản nghiệm thu Sprint 3 và danh sách đầu việc chuẩn bị production Sprint 4. |

---

## 11. Quy trình đo hiệu năng (`NFR-13`, `AT-40`) và Cách kiểm tra / Bằng chứng review

### 11.1. Protocol đo hiệu năng chuẩn (theo Mục 12 của `10_Testing_Acceptance.md`)

Mọi kết quả báo cáo cho `AT-12` và `AT-40` bắt buộc tuân thủ đúng các thông số sau để tái lặp được và so sánh nhất quán giữa các lần chạy:

1. **Bộ dữ liệu chuẩn (`dataset`)**:
   - Đúng **500 tin `PUBLISHED`** (`deletedAt: null`) trong database benchmark riêng `room_rental_perf`, phân bổ qua 5 phường Quận Bình Thạnh 2026 (`Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới`).
   - Mỗi tin gắn tối đa **3 ảnh tối ưu** cho lượt hiển thị đầu (ảnh chuẩn hóa định dạng nhẹ JPEG/WebP kích thước thẻ phù hợp, không dùng ảnh gốc nặng hàng chục MB).
2. **Thiết bị & Mạng giả lập nhất quán**:
   - **Viewport / Thiết bị đại diện**: Mobile `360×800`, DPR `2` hoặc `3` (Chromium Mobile Emulation qua Playwright).
   - **Cấu hình mạng 4G giới hạn nhất quán (CDP `Network.emulateNetworkConditions`)**:
     - Độ trễ (`latency`): `70 ms` – `150 ms` (ví dụ chuẩn Regular 4G: `latency: 70ms`, `downloadThroughput: 4 Mbps / 500 KB/s`, `uploadThroughput: 1.5 Mbps / 187.5 KB/s`).
   - Ghi nhận rõ trong báo cáo: cấu hình máy chạy đo, phiên bản trình duyệt/Node/MongoDB, tên DB `room_rental_perf`, vùng chạy (local/staging) và chế độ cache từng lượt.
3. **Phương pháp đo 5 lượt & Công thức tính `p75`**:
   - Chạy **5 lượt độc lập** mở trang danh sách công khai `http://127.0.0.1:5173/rooms` (người dùng đầu tiên / xóa cache trình duyệt trước mỗi lượt đo Cold Load, và ghi thêm 1 chuỗi Warm Cache để đối chiếu).
   - Mỗi lượt đo thu thập:
     - `DOMContentLoaded` & `First Contentful Paint (FCP)`
     - Thời gian hoàn tất API `GET /api/v1/public/rooms`
     - Thời gian hiển thị nội dung chính (12 thẻ phòng đầu tiên + ảnh màn hình đầu đã render xong) & **Largest Contentful Paint (`LCP`)**
     - **Cumulative Layout Shift (`CLS`)**
   - Sắp xếp 5 giá trị thời gian nội dung chính theo thứ tự tăng dần `[t1, t2, t3, t4, t5]`: chỉ số **`p75`** tương ứng giá trị thứ 4 (`t4`, hoặc nội suy tuyến tính chuẩn `0.75 * (5 - 1)` là `t4`).
   - **Ngưỡng nghiệm thu bắt buộc**: **`p75 ≤ 3000 ms` (`≤ 3 giây`)** và **`CLS < 0.1`**.

### 11.2. Các lệnh kiểm tra tại local (Windows PowerShell)

1. **Khởi tạo lại chỉ mục MongoDB (bao gồm các index mới Sprint 3)**:
   ```powershell
   npm --prefix server run db:init
   ```
2. **Sinh tập dữ liệu benchmark 500 tin trên DB tách biệt `room_rental_perf` (an toàn cho dữ liệu thật)**:
   ```powershell
   $env:MONGODB_DB_NAME="room_rental_perf"
   npm --prefix server run db:init
   npm --prefix server run db:seed:perf500
   ```
   *(Hoặc chạy thẳng `npm --prefix server run db:seed:perf500` — script đã khóa cứng mặc định nạp vào `room_rental_perf` và `server/uploads-perf`, tự động từ chối nếu trỏ nhầm `room_rental_dev`.)*
3. **Chạy benchmark hiệu năng 5 lượt trên 4G & kiểm thử tự động**:
   ```powershell
   npm --prefix server run verify:sprint3
   npm --prefix client run lint
   npm --prefix client run build
   npm --prefix admin run build
   ```
4. **Chạy lại bộ hồi quy Sprint 2 + 3 trên môi trường phát triển (`room_rental_dev`)**:
   ```powershell
   npm --prefix server run verify:sprint2
   ```

### 11.3. Kết quả đo & Bằng chứng thực tế Sprint 3

Kết quả chạy `npm --prefix server run verify:sprint3` và `npm --prefix server run verify:sprint2` sau lần chỉnh sửa code cuối cùng:

1. **Query Plan MongoDB 8 (`explain("executionStats")` trên `room_rental_perf` — 500 `PUBLISHED` + 10 non-public)**:
   - `ward_2026_exact`: `FETCH -> IXSCAN` (`100` docs examined / `100` returned)
   - `type_and_price`: `FETCH -> IXSCAN` (`55` docs examined / `55` returned)
   - `area_range`: `FETCH -> IXSCAN` (`266` docs examined / `266` returned)
   - `amenities_all`: `FETCH -> IXSCAN` (`400` docs examined / `300` returned)
   - API `GET /api/v1/public/rooms` `p75` latency (20 lần gọi): **`11.8 ms`**
2. **Đo 5 lượt độc lập (Cold Load) trên Mobile `360×800` + Mạng 4G (`70ms` RTT, `4 Mbps` down / `1.5 Mbps` up)**:

   | Lượt đo | Danh sách sẵn sàng (`mainReady`) | `LCP` | `FCP` | `CLS` |
   | :--- | :---: | :---: | :---: | :---: |
   | **Lượt 1** | `1700.7 ms` | `1236 ms` | `1236 ms` | `0.0001` |
   | **Lượt 2** | `1263.7 ms` | `856 ms` | `856 ms` | `0` |
   | **Lượt 3** | `1352.1 ms` | `920 ms` | `920 ms` | `0` |
   | **Lượt 4** | `1328.9 ms` | `860 ms` | `860 ms` | `0` |
   | **Lượt 5** | `1304.2 ms` | `932 ms` | `932 ms` | `0` |
   | **Tổng hợp (`p75`)** | **`1352.1 ms` (`≤ 3000 ms` — PASS)** | **`932 ms`** | **`932 ms`** | **`max 0.0001` (`< 0.1` — PASS)** |

3. **Kiểm tra giao diện, build & lint**:
   - `npm --prefix client run lint`: `0 warnings`, `0 errors`.
   - `npm --prefix client run build` & `npm --prefix admin run build`: build thành công (`0 errors`).
   - Ảnh minh chứng giao diện đã kiểm tra: bộ lọc nâng cao desktop `1280×800` (`s3-desktop-filters.png`), ngăn kéo lọc mobile `360×800` (`s3-mobile-drawer.png`), `0` tràn ngang, `0` lỗi console/runtime.

### 11.4. Kiểm thử chấp nhận (Acceptance Tests - AT) phạm vi Sprint 3

| Mã AT | Nội dung kiểm thử trọng tâm (theo `10_Testing_Acceptance.md`) | Kết quả dự kiến | Trạng thái nghiệm thu |
| :--- | :--- | :--- | :--- |
| `AT-03` | Lọc kết hợp đa tiêu chí: từ khóa `q`, 5 phường 2026, loại phòng, giá, diện tích, tình trạng & tiện nghi (`amenities`) | Chỉ trả tin thỏa mãn đồng thời mọi điều kiện; số lượng tổng khớp DB | PASS *(API + Browser)* |
| `AT-04` | Nhập `minPriceVnd > maxPriceVnd`, `minAreaM2 > maxAreaM2` hoặc giá trị tiện nghi không hợp lệ | UI chặn trước và thông báo rõ; API trả `400 INVALID_RANGE`/`INVALID_QUERY` | PASS *(API + UI)* |
| `AT-05` | Mở chi tiết phòng từ trang kết quả lọc nâng cao & kiểm tra hiển thị 5 phường 2026 + tiện nghi `Thang máy` | Hiện đầy đủ thông số, ảnh, tiện nghi chính xác; không còn `Máy giặt` | PASS |
| `AT-09` | Thay đổi trạng thái `AVAILABLE` ↔ `RENTED` và kiểm tra lọc tình trạng phòng | Tin `RENTED` vẫn xem được với nhãn `Đã thuê` và lọc đúng khi chọn `Còn trống` | PASS |
| `AT-10` | Xác nhận bảo vệ nguồn và xử lý lỗi mạng trên trang lọc (offline / 500) | Khách vẫn bị chặn khỏi API admin; lỗi mạng hiện nút `Thử lại` không mất filter | PASS *(CDP Offline Retry)* |
| `AT-11` | Dùng thanh tìm kiếm, `MobileFilterDrawer`, chip tiện nghi & phân trang ở `360px` | `0` tràn ngang (`scrollWidth <= innerWidth`), nút lọc/gỡ chip dễ chạm | PASS *(360×800)* |
| `AT-12` | Đo hiệu năng trang danh sách theo protocol cố định `NFR-13` | Nội dung chính tải `p75 ≤ 3 giây` với bộ 500 tin trên mạng 4G mô phỏng | PASS *(`p75 = 1352.1 ms`)* |
| `AT-18` | Chuyển trang (`page=2`, `page=3`), F5 trình duyệt hoặc quay lại từ chi tiết sau khi bật nhiều bộ lọc (gồm `amenities`) | Toàn bộ bộ lọc, thứ tự sắp xếp và số trang được giữ nguyên 100% | PASS *(Browser E2E)* |
| `AT-24` | Tìm kiếm từ khóa `q` trùng với `privateAddress` kết hợp bộ lọc khác | Trả `0` kết quả, không rò rỉ địa chỉ riêng | PASS |
| `AT-26` | Chọn ảnh bìa & sắp xếp thứ tự ảnh ngay trên `/rooms/new` trước khi lưu nháp rồi xuất bản | Ảnh bìa hiển thị đúng ở thẻ danh sách & đứng đầu `RoomGallery` ở trang chi tiết | PASS *(Admin UI)* |
| `AT-29` | Điều hướng toàn bộ luồng tìm kiếm/lọc/gỡ chip/phân trang bằng bàn phím | Focus ring rõ, thao tác hoàn chỉnh bằng `Tab`/`Enter`/`Space` | PASS *(Focus & ARIA)* |
| `AT-40` | Lưu biên bản cấu hình thiết bị, mạng 4G, dataset 500 tin và 5 lượt đo `p75 ≤ 3s` | Có số liệu định lượng 5 lượt và bằng chứng lưu trong repo/báo cáo | PASS *(Bảng mục 11.3)* |
| `AT-42` | Kiểm tra responsive `360px`, `768px`, `1280px`, `1440px` sau khi thêm bộ lọc tiện nghi & Active Chips | Bố cục cân đối, `CLS < 0.1`, không cắt chữ hoặc che nút | PASS *(`CLS ≤ 0.0001`)* |
| `AT-43` | Kiểm tra allowlist public JSON & `ETag`/`304` khi mở rộng bộ lọc nâng cao | Không rò `privateAddress`, `contactPhone` trong list JSON; `ETag`/`304` hoạt động đúng | PASS *(`verify:sprint2 & sprint3`)* |
| `AT-45` | Admin tạo tin kèm ảnh bìa, lưu nháp, rồi bấm `Xuất bản` (về Tổng quan `/`) | Tin mới xuất bản hiện trên trang khách trong `≤ 60 giây` | PASS |
| `AT-46` | Chuỗi tìm kiếm `q` chứa ký tự regex/HTML đặc biệt & mảng `amenities` sai định dạng | Không lỗi 500, không thực thi script, xử lý lỗi an toàn | PASS *(`400 INVALID_QUERY`)* |

---

## 12. Definition of Done

Sprint 3 chỉ được đánh dấu **Hoàn thành (Done)** khi toàn bộ các điều kiện dưới đây được kiểm chứng sau lần sửa mã nguồn cuối cùng:

- [x] Toàn bộ backlog `S3-01` đến `S3-10` hoàn tất, bao gồm 5 phường Quận Bình Thạnh 2026, danh mục `AMENITIES` có `Thang máy` (bỏ `Máy giặt`), lọc đa tiêu chí + tiện nghi `amenities`, và UX tạo tin Admin (chọn ảnh/ảnh bìa trước khi lưu nháp; xuất bản về Tổng quan `/`).
- [x] Tất cả kịch bản `AT` phạm vi Sprint 3 (bao gồm hồi quy Sprint 2 và `AT-03`, `AT-04`, `AT-12`, `AT-18`, `AT-40`, `AT-45`, `AT-46`) đạt `PASS` trên MongoDB 8 thật.
- [x] Kiểm thử hiệu năng trên tập **500 bản ghi** (DB benchmark riêng `room_rental_perf`), thiết bị di động `360×800`, mạng 4G mô phỏng qua **5 lượt đo** đạt **`p75 ≤ 3 giây` (`≤ 3000ms`)** (`p75 = 1352.1 ms`) và **`CLS < 0.1`** (`maxCLS = 0.0001`).
- [x] Xác nhận qua `.explain("executionStats")` các truy vấn tìm kiếm/lọc phổ biến đều dùng index hiệu quả (`IXSCAN`), không bị `COLLSCAN`.
- [x] Dữ liệu thật trên database làm việc (`room_rental_dev`) còn nguyên vẹn sau khi chạy toàn bộ kịch bản benchmark (`verify:sprint2` đạt `17 PUBLISHED` bao gồm cả tin thật của chủ dự án).
- [x] `npm --prefix client run lint`, `npm --prefix client run build`, và `npm --prefix admin run build` đều sạch lỗi (`0 errors`); `0` lỗi console/pageerror trên trình duyệt.
- [ ] Chủ dự án đã kiểm tra thực tế trải nghiệm tìm kiếm/lọc, tạo/xuất bản tin và xác nhận nghiệm thu Sprint 3.

---

## 13. Rủi ro và cách xử lý

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| :--- | :---: | :--- |
| Chạy seed 500 tin benchmark làm ghi đè hoặc lẫn với tin phòng thật chủ dự án đã tạo | Cao | Tách hoàn toàn database benchmark sang `MONGODB_DB_NAME=room_rental_perf` (hoặc kho ảnh riêng cho perf) và kiểm tra tên DB trước khi chạy seed; tuyệt đối không dùng `deleteMany({})` trên `room_rental_dev`. |
| Mạng 4G mô phỏng bị chậm vượt 3s do ảnh chưa tối ưu kích thước | Cao | Sinh ảnh chuẩn kích thước web (JPEG/WebP tối ưu cho thẻ danh sách), giới hạn tối đa 3 ảnh lượt đầu, bật `ETag` + `Cache-Control`, ưu tiên `fetchpriority="high"` cho ảnh đầu màn hình và `loading="lazy"` cho ảnh dưới. |
| Người dùng bấm/đổi nhiều bộ lọc liên tiếp gây nhấp nháy dữ liệu cũ ghi đè dữ liệu mới | Trung bình | Áp dụng `AbortController` cho mỗi lần gọi `api('/public/rooms?...')` trong `useEffect`, chỉ cập nhật `catalogState` cho request còn hiệu lực gần nhất. |
| Dùng `$regex` phân biệt hoa/thường trên `ward` làm mất hiệu quả index `idx_public_rooms_ward` khi có 500+ tin | Trung bình | Với tham số `ward` khớp tên phường chuẩn 2026 (hoặc truy vấn dùng index kèm collation / đối chiếu chuẩn hóa), tránh quét regex toàn bảng. |
| Quá nhiều Active Chips trên màn hình hẹp `360px` gây tràn ngang hoặc chiếm hết vùng hiển thị thẻ đầu | Thấp | Bọc `active-filters-bar` với `flex-wrap: wrap`, rút gọn nhãn chip gọn gàng và gắn nút `Xóa lọc` chung ở cuối dải chip. |

---

## 14. Điều kiện chuyển sang Sprint 4

Chỉ chuyển sang **Sprint 4 (Hardening Bảo mật Production, Backup/Restore, HTTPS/Domain & Nghiệm thu Go-Live)** khi:

1. Toàn bộ mục tiêu trong **Definition of Done** (Mục 12) đã đạt, đặc biệt bằng chứng benchmark **`p75 ≤ 3 giây`** (`NFR-13`, `AT-40`) với 500 tin trên mạng 4G được ghi nhận đầy đủ trong repo.
2. Luồng nghiệp vụ đồng bộ từ Admin (`admin/`) sang Khách hàng (`client/`) qua 5 phường Quận Bình Thạnh 2026 hoạt động trơn tru, `0` lỗi rò rỉ dữ liệu riêng tư (`AT-43`) và `0` lỗi chặn trải nghiệm di động (`AT-42`).
3. Toàn bộ script seed dữ liệu sạch và quy trình kiểm thử hồi quy sẵn sàng làm cơ sở đối chiếu khi kiểm tra Smoke Test sau deploy và diễn tập Backup/Restore ở Sprint 4.

---

## 15. Nhật ký Sprint 3

| Thời điểm | Sự kiện / Cập nhật | Trạng thái |
| :--- | :--- | :--- |
| **Chuẩn bị & Nâng cấp sớm đầu Sprint 3** | Cập nhật hệ thống hành chính theo **5 phường mới Quận Bình Thạnh năm 2026** (`Phường Gia Định`, `Phường Bình Thạnh`, `Phường Bình Lợi Trung`, `Phường Thạnh Mỹ Tây`, `Phường Bình Quới` — NQ `1685/NQ-UBTVQH15`); xóa `"Máy giặt"` và thêm `"Thang máy"` vào `AMENITIES`; nâng cấp `/rooms/new` cho phép tải ảnh + chọn ảnh bìa ngay trước khi lưu bản nháp `DRAFT`; cập nhật nút `Xuất bản` tự động chuyển về Tổng quan Admin (`/`). | Hoàn thành & đã xác minh trên trình duyệt thực tế |
| **Giai đoạn ban hành tài liệu triển khai Sprint 3** | Soạn thảo đầy đủ tài liệu `Sprint_3_Tim_Kiem_Loc_Nang_Cao_Toi_Uu_UX_Hieu_Nang.md` gồm 15 mục đồng bộ BA (`03`, `04`, `07`–`10`), kiến trúc MongoDB 8, bộ lọc nâng cao `amenities` và protocol đo hiệu năng 500 tin trên 4G (`p75 ≤ 3s`). | Hoàn thành soạn tài liệu |
| **Giai đoạn thực thi & nghiệm thu Sprint 3** | Triển khai đầy đủ lọc `amenities` (`$all` + whitelist), `AbortController` chống race condition, chọn nhanh tiện nghi/diện tích, `SafeImage` phân cấp `fetchpriority="high"`/`loading="lazy"`, `ETag`/`304 Not Modified`, thêm 2 index MongoDB (`idx_public_rooms_area`, `idx_public_rooms_amenities`), tạo `seed-perf-500.js` & `verify-sprint3-perf.js`. Đo thực tế trên `room_rental_perf` (500 tin) mạng 4G `360×800` đạt **`p75 = 1352.1 ms` (`≤ 3000 ms`)**, `maxCLS = 0.0001`, mọi `explain` đạt `IXSCAN`, giữ nguyên dữ liệu `room_rental_dev`. | Hoàn thành kỹ thuật (chờ chủ dự án nghiệm thu trực tiếp) |
