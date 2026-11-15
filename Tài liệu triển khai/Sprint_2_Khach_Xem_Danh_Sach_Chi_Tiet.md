# Sprint 2 — Hệ thống Khách hàng: Danh sách, Tìm kiếm, Lọc và Chi tiết Phòng

## 1. Thông tin sprint

| Hạng mục | Nội dung |
| :--- | :--- |
| **Tên sprint** | Sprint 2 — Hệ thống Khách hàng: Danh sách, Tìm kiếm, Lọc và Chi tiết Phòng |
| **Thời gian đề xuất** | 2 tuần (10 ngày làm việc) |
| **Mục tiêu chính** | Hoàn thiện, kiểm thử và nghiệm thu trọn vẹn trải nghiệm khách xem phòng công khai trên ứng dụng khách hàng độc lập (`client/`), kết nối API công khai `/api/v1/public/*` trên nền **MongoDB 8**, bảo đảm tách biệt hoàn toàn với cổng quản trị (`admin/`) và bảo vệ tuyệt đối dữ liệu nhạy cảm. |
| **Use case trọng tâm** | `UC-01` (Xem danh sách phòng công khai), `UC-02` (Tìm kiếm và lọc phòng), `UC-03` (Xem chi tiết phòng và liên hệ trực tiếp). |
| **Yêu cầu liên quan** | `BRQ-01`, `BRQ-02`, `BRQ-03`, `BRQ-05`, `BRQ-06`; `FR-01` đến `FR-07`, `FR-17`, `FR-19`; `NFR-01` đến `NFR-04`, `NFR-07`, `NFR-08`, `NFR-10`, `NFR-11`, `NFR-13` đến `NFR-16`; `RULE-01` đến `RULE-09`, `RULE-11` đến `RULE-13`. |
| **Kiến trúc ứng dụng & dữ liệu** | Frontend Khách hàng độc lập `client/` (`CLIENT_ORIGIN`, mặc định `http://127.0.0.1:5173`) + Backend Express 5 + **MongoDB 8** (driver chính thức `mongodb`, collection `room_listings` nhúng `images[]`, API `/api/v1/public/*` chỉ đọc). |
| **Trạng thái thực thi Sprint 2** | **Hoàn thành kỹ thuật (chờ chủ dự án nghiệm thu cuối)**: đã hoàn thiện lọc/khôi phục bộ lọc & quay lại giữ bộ lọc trên `client/`, tạo seed chuẩn 19 bản ghi MongoDB 8 (`14 PUBLISHED`, `2 DRAFT`, `2 HIDDEN`, `1` xóa mềm), vượt qua toàn bộ automated API/Privacy tests (`verify-sprint2-public.js`) và kiểm thử giao diện responsive Playwright (`360px`, `768px`, `1280px`, `1440px`, `0` lỗi console/tràn ngang). |

### 1.1. Sprint Goal

> Khép lại Sprint 2, khách thuê phòng có thể truy cập ứng dụng khách hàng **Ngọc Toàn — Hệ thống Phòng trọ Bình Thạnh** (trên desktop lẫn mobile `360px`–`1440px`), xem ngay danh sách phòng `PUBLISHED` ưu tiên phòng `Còn trống` trước, tìm kiếm theo từ khóa không làm lộ địa chỉ riêng, lọc theo phường / loại phòng / khoảng giá / khoảng diện tích / trạng thái, mở trang chi tiết với đầy đủ thư viện ảnh, tiện ích, mô tả và bấm gọi điện hoặc mở Zalo liên hệ trực tiếp — trong khi hệ thống khách hàng hoàn toàn không chứa bất kỳ đường dẫn, nút bấm hay phiên đăng nhập quản trị nào và không bao giờ làm rò rỉ tin `DRAFT`/`HIDDEN`/`Đã xóa` hay `privateAddress`.

### 1.2. Kiến trúc tách biệt Hệ thống Khách hàng và Hệ thống Quản trị

Theo yêu cầu tách hệ thống khách hàng và hệ thống quản trị thành hai ứng dụng độc lập (kế thừa từ cập nhật cuối Sprint 1):

| Thành phần | Hệ thống Khách hàng (Phạm vi Sprint 2) | Hệ thống Quản trị (Đã hoàn thành khung ở Sprint 1) |
| :--- | :--- | :--- |
| **Thư mục mã nguồn** | `client/` | `admin/` |
| **Origin mặc định (local)** | `CLIENT_ORIGIN=http://127.0.0.1:5173` | `ADMIN_ORIGIN=http://127.0.0.1:5174` |
| **Đối tượng sử dụng** | Khách tìm thuê phòng tại Quận Bình Thạnh (truy cập công khai, không đăng nhập) | Chủ hệ thống / Quản trị viên |
| **Tuyến đường giao diện** | `/`, `/rooms`, `/rooms/:roomId` (mọi tuyến khác gồm `/admin/*` trả về trang `404 NotFound`) | `/`, `/login`, `/rooms`, `/rooms/new`, `/rooms/:roomId/edit`, `/rooms/:roomId/preview` |
| **API được phép tương tác** | Chỉ `GET /api/v1/public/*` và `/api/v1/health/*` (stateless, `fetch` không gửi cookie/session) | `/api/v1/admin/*` (bắt buộc phiên `HttpOnly` + kiểm tra `Origin`/`Referer` thuộc `ADMIN_ORIGIN`) |
| **Bảo vệ chéo nguồn (Backend)** | Mọi yêu cầu hoặc preflight từ `CLIENT_ORIGIN` gọi tới `/api/v1/admin/*` bị backend từ chối `403` | `CLIENT_ORIGIN` chỉ được phép `GET, OPTIONS` trên `/api/v1/public/*` |

---

## 2. Tài liệu và quyết định liên quan

| Tài liệu | Vai trò đối với Sprint 2 |
| :--- | :--- |
| [Sprint 0 — Setup](<./Sprint_0_Setup.md>) | Chuẩn bị môi trường Node.js, Docker **MongoDB 8**, kiểm thử sức khỏe `/api/v1/health/*` và quyết định `ADR-S0-01`. |
| [Sprint 1 — Khu quản trị và quản lý tin phòng](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>) | Nguồn dữ liệu đầu vào hợp lệ (`PUBLISHED`, `images[]`, kiểm duyệt xuất bản) và tiêu chuẩn tách `client/` – `admin/`. |
| [03_Requirements.md](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/03_Requirements.md>) | Nguồn chuẩn `BRQ`, `FR-01..07`, `FR-17`, `FR-19`, `NFR`, `RULE-01..13` và quy tắc xuất bản mục 8.2. |
| [04_Use_Case.md](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/04_Use_Case.md>) | Đặc tả chi tiết `UC-01`, `UC-02`, `UC-03`, luồng chính, luồng phụ và điều kiện ngoại lệ. |
| [07_UI_UX_Design.md](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/07_UI_UX_Design.md>) | Thiết kế giao diện khách hàng, layout lưới thẻ/drawer lọc mobile, các trạng thái `Loading / Empty / Error / NotFound` và hệ thống màu & chữ. |
| [09_API_Specification.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/09_API_Specification.md>) | Hợp đồng API công khai (`/api/v1/public/categories`, `/api/v1/public/rooms`, `/api/v1/public/rooms/:roomId`, ảnh công khai), cấu trúc lỗi chuẩn và phân trang. |
| [10_Testing_Acceptance.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>) | Ma trận kiểm thử chấp nhận `AT-01` đến `AT-49`, bộ dữ liệu test mục 10 và ngưỡng kiểm thử. |

---

## 3. Phạm vi Sprint 2

### 3.1. Trong phạm vi

1. **Public API chỉ đọc trên MongoDB 8 (`server/src/routes/public.js`)**:
   - `GET /api/v1/public/categories`: trả danh sách `roomTypes`, `amenities` và danh sách `wards` thực tế từ các tin `PUBLISHED` (`deletedAt: null`), sắp xếp theo bảng chữ cái tiếng Việt (`locale: "vi"`).
   - `GET /api/v1/public/rooms`: tìm kiếm `q`, lọc `ward`, `roomType`, `minPriceVnd`, `maxPriceVnd`, `minAreaM2`, `maxAreaM2`, `availability`, sắp xếp `sort` (mặc định `available_first_publishedAt_desc`), phân trang (`page`, `pageSize` mặc định `12`, tối đa `48`).
   - `GET /api/v1/public/rooms/:roomId`: trả chi tiết phòng `PUBLISHED` kèm `displayAddress`, tùy chọn `exactAddress` (chỉ khi `allowExactAddress === true`), `contact` (`phone`, `zalo`), danh sách `images[]` theo thứ tự `sortOrder`.
   - `GET /api/v1/public/rooms/:roomId/images/:imageId/file`: trả file ảnh của phòng `PUBLISHED` với `Content-Type`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff` và `Cache-Control: public, max-age=60`.
2. **Giao diện Khách hàng độc lập (`client/`)**:
   - Header mang thương hiệu **Ngọc Toàn — HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH** (`client/public/Phòng trọ Ngọc Toàn-Logo.svg`, `client/public/favicon.svg`, `client/src/branding.js`) và tuyệt đối không hiển thị nút/link quản trị.
   - Trang danh sách phòng (`/`, `/rooms`): thanh tìm kiếm từ khóa, bộ lọc desktop (sidebar/panel) & ngăn kéo lọc trên mobile (`MobileFilterDrawer`), chip tổng số bộ lọc đang bật, nút `Xóa toàn bộ bộ lọc`, sắp xếp, lưới thẻ phòng (`PublicRoomCard`) và thanh phân trang (`PaginationBar`).
   - Trang chi tiết phòng (`/rooms/:roomId`): breadcrumb quay về danh sách (bảo toàn ngữ cảnh tìm kiếm khi điều hướng từ trang danh sách), gallery ảnh (`RoomGallery`) hỗ trợ ảnh chính + thumbnail + xử lý lỗi ảnh an toàn (`SafeImage`), huy hiệu trạng thái `Còn trống` / `Đã thuê`, giá thuê VNĐ/tháng, diện tích m², loại phòng, phường Bình Thạnh, địa chỉ hiển thị (`displayAddress` / `exactAddress` nếu được phép), danh sách tiện ích, mô tả chi tiết, khối liên hệ trực tiếp (`tel:` và liên kết Zalo).
   - Trang `404 NotFound` thân thiện khi phòng không tồn tại, đang là `DRAFT`/`HIDDEN`/`Đã xóa`, `roomId` sai định dạng UUID, hoặc truy cập các đường dẫn ngoài phạm vi công khai (bao gồm `/admin/*`).
3. **Cách ly nguồn gốc và kiểm thử chấp nhận Sprint 2**:
   - Kiểm chứng phía backend không làm lộ `privateAddress`, `contactPhone`/`contactZalo` ngoài trang chi tiết, không lộ tin `DRAFT`/`HIDDEN`/`deletedAt != null`.
   - Kiểm chứng phía frontend `client/` chạy độc lập ở `:5173`, responsive chuẩn trên `360px`, `768px`, `1280px`, `1440px` và pass toàn bộ kịch bản AT thuộc Sprint 2.

### 3.2. Ngoài phạm vi Sprint 2 (để lại Sprint 3 & Sprint 4)

| Hạng mục | Lý do dời sang Sprint sau |
| :--- | :--- |
| Tối ưu tải nặng 500 bản ghi trên mạng 4G mô phỏng, tinh chỉnh lazy-load/ảnh thumbnail nâng cao và tối ưu phản hồi UI tốc độ cao (`AT-12`, `AT-40`) | Thuộc trọng tâm tối ưu hiệu năng và đánh bóng bộ lọc nâng cao của **Sprint 3**. |
| Cài đặt HTTPS, reverse proxy Nginx, backup định kỳ MongoDB + thư mục uploads, checklist bàn giao production (`AT-41`, `AT-44`, `AT-47`..`AT-49`) | Thuộc trọng tâm triển khai production & nghiệm thu cuối của **Sprint 4**. |
| Thay đổi tính năng nội bộ khu quản trị (`admin/`) như sửa/tạo/lưu trữ tin phòng | Đã hoàn thành tại Sprint 1; Sprint 2 chỉ kiểm tra tính tương thích dữ liệu xuất bản từ Admin sang Public và cách ly 2 cổng. |

---

## 4. Định hướng giao diện Khách hàng — Saigon Tropical Living & Modern Hospitality

Giao diện khách hàng sử dụng ngôn ngữ thiết kế **Saigon Tropical Living & Modern Hospitality** (đã đồng bộ với [07_UI_UX_Design.md](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/07_UI_UX_Design.md>)): sáng rõ, ấm áp, đáng tin cậy cho người đi tìm phòng trọ tại Quận Bình Thạnh; ưu tiên khả năng quét nhanh giá thuê, diện tích, phường và trạng thái `Còn trống` chỉ trong vài giây đầu.

### 4.1. Nhận diện thương hiệu, hệ thống màu sắc và Typography

- **Thương hiệu hiển thị**: **Ngọc Toàn** — phụ đề **HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH**, vùng địa lý **Bình Thạnh · TP. Hồ Chí Minh** (cấu hình tập trung trong `client/src/branding.js`, tiêu đề `<title>` `Ngọc Toàn — Phòng trọ Bình Thạnh` trong `client/index.html`, hiển thị qua component `Brand` trong `client/src/App.jsx`).
- **Tài nguyên nhận diện**:
  - Logo chính: `client/public/Phòng trọ Ngọc Toàn-Logo.svg`
  - Favicon trình duyệt: `client/public/favicon.svg`
- **Hệ thống token màu sắc & bề mặt (`client/src/index.css`)**:
  - Nền & bề mặt ấm nhiệt đới: `--bg-canvas: #F7F5F0`, `--bg-subtle: #EFECE6`, `--bg-surface: #FFFFFF`, `--bg-elevated: #FCFBF9`, `--border-subtle: #E4E0D8`, `--border-strong: #CFC9BE`.
  - Màu thương hiệu chính (*Deep Tropical Jade*): `--brand-900: #0D3427`, `--brand-700: #154D3A`, `--brand-600: #1B634B`, `--brand-500: #247A5D`, `--brand-100: #E3F2EC`, `--brand-50: #F2F9F6`.
  - Màu nhấn ấm (*Saigon Terracotta*): `--accent-700: #A84420`, `--accent-600: #C5532B`, `--accent-100: #FCEEE9`.
  - Hệ thống chữ đạt chuẩn tương phản WCAG AA+: `--ink-900: #12201B`, `--ink-700: #2B3D36`, `--ink-500: #4E6058`, `--ink-400: #687A72`.
  - Màu ngữ nghĩa trạng thái phòng:
    - `Còn trống` (`--status-avail-*`): chữ `#11613B`, nền `#E6F5EC`, viền `#AEE0C2`, chấm `#16A34A`.
    - `Đã thuê` (`--status-rented-*`): chữ `#9A4212`, nền `#FEF1E8`, viền `#F9C8A9`, chấm `#EA580C`.
- **Typography**: `--font-sans` (`Plus Jakarta Sans`) cho điều hướng, nhãn lọc, thông số giá VNĐ/diện tích và thân bài; `--font-serif` (`Newsreader`) cho điểm nhấn tiêu đề hospitality trên desktop/mobile.

### 4.2. Màn hình & Thành phần công khai (`client/src/App.jsx`)

| Tuyến đường | Thành phần chính | Nội dung và hành vi trọng tâm |
| :--- | :--- | :--- |
| `/` và `/rooms` | `PublicCatalogPage`, `PublicRoomCard`, `MobileFilterDrawer`, `PaginationBar` | Thanh tìm kiếm theo từ khóa (`q`); bộ lọc phường (`ward`), loại phòng (`roomType`), giá tối thiểu/tối đa (`minPriceVnd`, `maxPriceVnd`), diện tích tối thiểu/tối đa (`minAreaM2`, `maxAreaM2`), trạng thái (`availability`); chọn sắp xếp (`sort`); đếm tổng kết quả; lưới thẻ phòng hiển thị ảnh bìa (`coverImageUrl`), badge trạng thái, tiêu đề, phường Bình Thạnh, giá thuê, diện tích, vài tiện ích nổi bật; phân trang theo `page` / `pageSize=12`. |
| `/rooms/:roomId` | `PublicRoomDetailPage`, `RoomGallery`, `StatusBadge` | Gallery ảnh đầy đủ (`images[]` sắp xếp theo `sortOrder`, chọn thumbnail đổi ảnh lớn, fallback an toàn khi thiếu ảnh); tiêu đề và badge `Còn trống` / `Đã thuê`; giá thuê & diện tích; thông số loại phòng, phường, quận/thành phố, địa chỉ hiển thị (`displayAddress` và chỉ hiện `exactAddress` khi chủ trọ bật `allowExactAddress`); danh sách tiện ích; mô tả chi tiết; khối CTA liên hệ gồm nút gọi điện `tel:` và nút mở Zalo (`https://zalo.me/...`). |
| Tuyến không hợp lệ (kể cả `/admin`, `/admin/*`, ID sai UUID, tin ẩn/nháp/xóa) | `NotFound` | Thông báo rõ ràng không tìm thấy trang hoặc tin phòng không còn hiển thị công khai, kèm nút quay về `/rooms` (`"Về danh sách phòng"`). Không chứa bất kỳ liên kết đăng nhập quản trị nào. |

### 4.3. Yêu cầu Responsive & Khả năng tiếp cận (A11y)

- **Mobile (`360px`)**: không tràn ngang (`overflow-x`), thẻ phòng xếp 1 cột dễ chạm, bộ lọc thu gọn thành nút mở `MobileFilterDrawer`, nút gọi điện / Zalo ở trang chi tiết đủ lớn (vùng chạm `>= 44px`), không bị thanh cố định che nội dung.
- **Tablet (`768px`)**: lưới thẻ 2 cột cân đối, thanh sắp xếp và nút mở/đóng bộ lọc gọn gàng.
- **Desktop (`1280px` & `1440px`)**: bố cục khối lọc + lưới 3 cột thẻ phòng thoáng đãng; trang chi tiết chia tỷ lệ hợp lý giữa khối gallery + mô tả bên trái và khối thông số giá + liên hệ bên phải.
- **A11y**: mỗi ảnh có `altText` hoặc text thay thế hợp nghĩa; mọi input lọc/tìm kiếm có `label`/`aria-label`; focus ring rõ ràng khi điều hướng bàn phím; URL bộ lọc đồng bộ query string để người dùng F5 hoặc chia sẻ link giữ nguyên kết quả.

### 4.4. Trạng thái giao diện bắt buộc

| Trạng thái | Điều kiện kích hoạt | Yêu cầu hiển thị |
| :--- | :--- | :--- |
| **Loading** | Đang gọi `GET /api/v1/public/rooms` hoặc `GET /api/v1/public/rooms/:roomId` | Skeleton/trạng thái đang tải rõ ràng, không giật layout mạnh khi dữ liệu trả về. |
| **Empty (có bộ lọc)** | `items.length === 0` và `activeFilterCount > 0` | Thông báo không tìm thấy phòng phù hợp điều kiện lọc + nút `"Xóa toàn bộ bộ lọc"` để khôi phục danh sách. |
| **Empty (chưa có tin công khai)** | `items.length === 0` và `activeFilterCount === 0` | Thông báo nhẹ nhàng hệ thống đang cập nhật phòng + nút `"Tải lại danh sách"` (tuyệt đối không mời đăng nhập admin). |
| **Error (lỗi mạng / 400 / 500)** | API lỗi hoặc khoảng lọc không hợp lệ (`INVALID_RANGE` / `INVALID_QUERY`) | Hiển thị thông báo lỗi tiếng Việt dễ hiểu (ví dụ cảnh báo giá tối thiểu lớn hơn giá tối đa) + nút thử lại không làm trắng trang. |
| **NotFound (404)** | Sai UUID, phòng ở trạng thái `DRAFT`/`HIDDEN`/đã xóa, hoặc route lạ (gồm `/admin/*`) | Hiển thị màn hình `404` lịch sự với nút `"Về danh sách phòng"`. |

### 4.5. Tiêu chí review thẩm mỹ Sprint 2

- [x] Logo `Ngọc Toàn` hiển thị sắc nét trên mobile (`360px`) và desktop (`1280px`/`1440px`), không vỡ khung header. *(Đã kiểm tra Playwright & ảnh chụp `s2-catalog-360.png`, `s2-catalog-1280.png`, `s2-catalog-1440.png`)*
- [x] Thẻ phòng cân đối: ảnh bìa giữ tỷ lệ đồng nhất, không méo ảnh khi nguồn ảnh ngang/dọc khác nhau, giá thuê và trạng thái `Còn trống` / `Đã thuê` nổi bật rõ ràng. *(Đã kiểm tra DOM card + CSS tỷ lệ ảnh & badge trạng thái)*
- [x] Trên `360px`, `MobileFilterDrawer` mở/đóng mượt, chạm nút áp dụng/xóa lọc dễ dàng, không bị cắt chữ. *(Đã kiểm tra trên `360x800` & `s2-drawer-360.png`)*
- [x] Trang chi tiết hiển thị gallery ảnh rõ nét, khối liên hệ điện thoại/Zalo nổi bật và dễ thao tác bằng một tay trên điện thoại. *(Đã kiểm tra `s2-detail-1280.png` & `s2-detail-360.png`)*
- [x] Không có thanh cuộn ngang (`scrollWidth <= innerWidth`) ở toàn bộ các mốc `360px`, `768px`, `1280px`, `1440px`. *(Đã đo bằng Playwright `scrollWidth <= innerWidth` trên cả 4 mốc)*

---

## 5. Product Backlog Sprint 2

| Mã | Hạng mục | Liên kết BA | Trạng thái nền hiện tại | Tiêu chí hoàn tất Sprint 2 |
| :--- | :--- | :--- | :--- | :--- |
| `S2-01` | Hoàn thiện & kiểm chứng API danh mục công khai `/api/v1/public/categories` | `FR-04`, `09_API` | Đã dựng trong `server/src/routes/public.js` | Trả đúng `roomTypes`, `amenities`, và `wards` chỉ lấy từ tin `PUBLISHED` (`deletedAt: null`), sắp xếp `vi`. |
| `S2-02` | Hoàn thiện & kiểm chứng API danh sách phòng công khai `/api/v1/public/rooms` | `UC-01`, `UC-02`, `FR-01`..`FR-05`, `RULE-04`..`RULE-07`, `AT-01`, `AT-03`, `AT-04`, `AT-05`, `AT-09`..`AT-11` | Đã dựng trong `server/src/routes/public.js` | Chỉ trả `PUBLISHED` (`deletedAt: null`), sắp xếp mặc định `Còn trống` trước, phân trang chuẩn (`pageSize=12`, max `48`), lọc chuẩn, chặn `INVALID_RANGE`/`INVALID_QUERY`, không lộ `privateAddress`/`description`/`contactPhone`. |
| `S2-03` | Hoàn thiện & kiểm chứng API chi tiết phòng & stream ảnh công khai | `UC-03`, `FR-06`, `FR-07`, `RULE-01`, `RULE-02`, `RULE-03`, `RULE-08`, `AT-02`, `AT-18`, `AT-23`..`AT-27`, `AT-29` | Đã dựng trong `server/src/routes/public.js` | Trả `404` với `DRAFT`/`HIDDEN`/`deletedAt != null`/UUID sai; chỉ trả `exactAddress` khi `allowExactAddress=true`; stream ảnh kèm `X-Content-Type-Options: nosniff` và từ chối ảnh thuộc tin không `PUBLISHED`. |
| `S2-04` | Giao diện danh sách phòng, lưới thẻ, phân trang & đồng bộ URL | `UC-01`, `FR-01`, `FR-02`, `FR-03`, `AT-01`, `AT-09`, `AT-10`, `AT-11` | Đã dựng trong `client/src/App.jsx` | Hiển thị lưới thẻ `Ngọc Toàn`, giữ query string khi chuyển trang / quay lại từ chi tiết, xử lý đủ trạng thái `Loading / Empty / Error`. |
| `S2-05` | Bộ lọc, tìm kiếm, sắp xếp & `MobileFilterDrawer` trên Khách hàng | `UC-02`, `FR-04`, `FR-05`, `AT-03`, `AT-04`, `AT-05`, `AT-45` | Đã dựng trong `client/src/App.jsx` | Tìm kiếm theo `q` (không khớp `privateAddress`), lọc đa tiêu chí, validate khoảng giá/diện tích âm hoặc đảo ngược, mobile drawer hoạt động trơn tru trên `360px`. |
| `S2-06` | Trang chi tiết phòng, gallery ảnh, địa chỉ hiển thị & CTA gọi/Zalo | `UC-03`, `FR-06`, `FR-07`, `AT-02`, `AT-25`, `AT-26`, `AT-27` | Đã dựng trong `client/src/App.jsx` | Xem ảnh bìa + chuyển thumbnail mượt, hiện `displayAddress` chuẩn quy tắc, bấm gọi `tel:` và mở link Zalo đúng số, phòng `RENTED` vẫn xem được với nhãn rõ ràng. |
| `S2-07` | Tách biệt giao diện Khách hàng & Quản trị + kiểm soát `CLIENT_ORIGIN` / `ADMIN_ORIGIN` | `RULE-12`, `RULE-13`, `AT-16`, `AT-32`, `AT-42` | Đã tách `client/` (`:5173`) & `admin/` (`:5174`) + CORS backend | `client/` không có nút/link/logic login admin, `/admin/*` trả `404`, backend trả `403` nếu `CLIENT_ORIGIN` gửi request tới `/api/v1/admin/*`. |
| `S2-08` | Nghiệm thu Responsive (`360px`, `768px`, `1280px`, `1440px`) & A11y | `NFR-13`..`NFR-16`, `07_UI_UX`, `AT-45` | Giao diện responsive đã có CSS cơ bản | Chụp ảnh & kiểm tra không tràn ngang, tương phản chữ đạt chuẩn, điều hướng bàn phím & nhãn đầy đủ. |
| `S2-09` | Bộ test tự động API Public + bảo mật riêng tư & E2E smoke cho `client/` | `NFR-07`..`NFR-11`, `AT-01`..`AT-46` (phạm vi S2) | Cần bổ sung script/báo cáo kiểm chứng Sprint 2 riêng | Chạy lặp lại ổn định toàn bộ case Public API, `INVALID_RANGE`, privacy leakage, `404` tin ẩn/xóa, và smoke E2E `client/`. |
| `S2-10` | Đồng bộ dữ liệu kiểm thử chuẩn & nghiệm thu Sprint Review | `10_Testing_Acceptance` mục 10 | Đã có MongoDB local & admin `tranductoan110305@gmail.com` | Tạo tập tin mẫu đa trạng thái (`PUBLISHED` `AVAILABLE`/`RENTED`, `DRAFT`, `HIDDEN`, `deletedAt != null`, `allowExactAddress` true/false) và nghiệm thu PO. |

### 5.1. Danh sách phòng, lọc, sắp xếp và phân trang công khai (`S2-01`, `S2-02`, `S2-04`, `S2-05`)

- **Phạm vi**: `UC-01`, `UC-02`, `FR-01` đến `FR-05`, `RULE-04` đến `RULE-07`, `RULE-11`.
- **Tiêu chí chấp nhận**:
  1. Truy cập `/` hoặc `/rooms` gọi `GET /api/v1/public/categories` và `GET /api/v1/public/rooms` (mặc định `page=1`, `pageSize=12`, `sort=available_first_publishedAt_desc`).
  2. Tin `Còn trống` (`AVAILABLE`) luôn đứng trước tin `Đã thuê` (`RENTED`) khi dùng sắp xếp mặc định; trong cùng nhóm ưu tiên `publishedAt` mới nhất trước, rồi `updatedAt`, rồi `_id` để phân trang ổn định không trùng item giữa các trang.
  3. Hỗ trợ đủ 4 chế độ sắp xếp được whitelist: `available_first_publishedAt_desc`, `publishedAt_desc`, `price_asc`, `price_desc`.
  4. Tìm kiếm `q` (tối đa 100 ký tự) chỉ đối chiếu trên `title`, `ward`, `publicAddress` sau khi thoát ký tự đặc biệt regex (`escapeRegex`); tìm kiếm bằng giá trị nằm riêng trong `privateAddress` hoặc `description` **không** được trả về kết quả đó (`AT-24`).
  5. Khi `minPriceVnd > maxPriceVnd` hoặc `minAreaM2 > maxAreaM2`, API trả `400 INVALID_RANGE` và UI báo lỗi rõ ràng tại bộ lọc thay vì gửi truy vấn sai vô nghĩa.
  6. Trạng thái lọc/tìm kiếm/trang được giữ trên URL query string để reload (`F5`) hoặc bấm nút `Quay lại` từ chi tiết không mất bộ lọc.

### 5.2. Chi tiết phòng, thư viện ảnh và nút liên hệ trực tiếp (`S2-03`, `S2-06`)

- **Phạm vi**: `UC-03`, `FR-06`, `FR-07`, `RULE-01`, `RULE-02`, `RULE-03`, `RULE-08`.
- **Tiêu chí chấp nhận**:
  1. Nhấp vào thẻ phòng mở `/rooms/:roomId`, tải `GET /api/v1/public/rooms/:roomId`.
  2. Ảnh bìa (`isCover: true`) hiển thị trước hoặc theo đúng `sortOrder`; nhấp vào ảnh nhỏ ở dưới để đổi ảnh chính trong `RoomGallery`.
  3. Nếu `allowExactAddress === false`, JSON trả về **không** có trường `exactAddress` (và luôn không có `privateAddress`); giao diện chỉ hiển thị `displayAddress` (ví dụ `publicAddress`, phường, Quận Bình Thạnh, TP.HCM). Nếu `allowExactAddress === true` và có `privateAddress`, trường `exactAddress` được trả về để khách xem số nhà cụ thể.
  4. Phòng `PUBLISHED` có `availability = "RENTED"` vẫn xem được bình thường nhưng phải gắn badge `Đã thuê` rõ ràng, không gây hiểu nhầm là còn trống.
  5. Khối liên hệ hiển thị nút gọi điện sử dụng `tel:<contact.phone>` và nút Zalo khi có `contact.zalo`.
  6. Nếu `roomId` không hợp lệ UUID hoặc phòng chuyển sang `DRAFT` / `HIDDEN` / đã xóa mềm (`deletedAt != null`), API trả `404 NOT_FOUND` và UI hiển thị màn hình `404 NotFound` thân thiện.

### 5.3. Cách ly công khai — quản trị và không rò rỉ dữ liệu (`S2-07`, `S2-09`)

- **Phạm vi**: `NFR-07` đến `NFR-11`, `RULE-12`, `RULE-13`, `AT-16`, `AT-23`..`AT-27`, `AT-32`, `AT-42`, `AT-43`.
- **Tiêu chí chấp nhận**:
  1. Toàn bộ ứng dụng `client/` không chứa route quản trị, không chứa form đăng nhập, không import hay gọi `/api/v1/admin/*`, không đọc/lưu cookie phiên admin (`client/src/lib/api.js` hoàn toàn stateless).
  2. Truy cập trực tiếp `http://127.0.0.1:5173/admin` hoặc `/admin/login` trên ứng dụng khách hàng luôn rơi vào nhánh `NotFound` (`404` trên giao diện).
  3. Request từ `CLIENT_ORIGIN` gọi tới `POST/GET/PATCH/DELETE /api/v1/admin/*` bị backend chặn ở tầng CORS / `requireSameOrigin` với mã `403`.
  4. Kiểm tra raw payload JSON của `/api/v1/public/rooms` (danh sách) không chứa `privateAddress`, `contactPhone`, `contactZalo`, `description`; payload `/api/v1/public/rooms/:roomId` không bao giờ chứa `privateAddress` và chỉ chứa `exactAddress` khi `allowExactAddress === true`.
  5. Ảnh thuộc tin `DRAFT`/`HIDDEN`/`Đã xóa` gọi trực tiếp qua `/api/v1/public/rooms/:roomId/images/:imageId/file` bị trả `404 NOT_FOUND`.

---

## 6. Quy trình nghiệp vụ trong Sprint 2

### 6.1. Tải danh sách phòng & bộ lọc công khai (`UC-01`, `UC-02`)

```text
Khách mở http://127.0.0.1:5173/ hoặc /rooms
  │
  ├─► Song song gọi GET /api/v1/public/categories & GET /api/v1/public/rooms?...
  │
  ├─► Kiểm tra hợp lệ query (Zod + min <= max)
  │     ├─ Sai kiểu / ngoài biên ──► 400 INVALID_QUERY (fieldErrors)
  │     ├─ min > max             ──► 400 INVALID_RANGE
  │     └─ Hợp lệ                ──► MongoDB aggregate với điều kiện cứng:
  │                                   { publishStatus: "PUBLISHED", deletedAt: null }
  │                                   + bộ lọc q / ward / roomType / price / area / availability
  │                                   + sort mặc định available_first_publishedAt_desc
  │                                   + $skip / $limit + $project ẩn trường nhạy cảm
  │
  └─► Client render lưới PublicRoomCard + PaginationBar + activeFilterCount
        ├─ items > 0              ──► Hiện danh sách thẻ + phân trang
        ├─ items == 0 & có filter ──► Empty State + nút "Xóa toàn bộ bộ lọc"
        └─ items == 0 & ko filter ──► Empty State + nút "Tải lại danh sách"
```

### 6.2. Xem chi tiết phòng, địa chỉ hiển thị và ảnh an toàn (`UC-03`)

```text
Khách bấm vào thẻ phòng trên danh sách (hoặc mở link /rooms/:roomId)
  │
  ├─► GET /api/v1/public/rooms/:roomId
  │     ├─ roomId không khớp UUID              ──► 404 NOT_FOUND ──► UI NotFound
  │     ├─ Tin DRAFT / HIDDEN / deletedAt!=null──► 404 NOT_FOUND ──► UI NotFound
  │     └─ Tin PUBLISHED & deletedAt == null   ──► Áp dụng toPublicDetailItem(doc):
  │           ├─ allowExactAddress == false: chỉ trả displayAddress (ẩn exactAddress)
  │           ├─ allowExactAddress == true : trả displayAddress + exactAddress
  │           ├─ contact: { phone, zalo } (chỉ các trường có dữ liệu)
  │           └─ images[]: map url -> /api/v1/public/rooms/:roomId/images/:imageId/file
  │
  └─► Client render PublicRoomDetailPage:
        ├─ RoomGallery (ảnh lớn + thumbnail, SafeImage chống gãy ảnh)
        ├─ Thông tin giá, diện tích, tiện ích, mô tả, badge Còn trống/Đã thuê
        └─ Nút liên hệ tel: & Zalo
```

### 6.3. Cách ly hoàn toàn giao diện khách khỏi khu quản trị

```text
Ứng dụng Khách (client/ :5173)                    Ứng dụng Quản trị (admin/ :5174)
  ├─ Route: /, /rooms, /rooms/:roomId               ├─ Route: /login, /rooms, /rooms/:id/edit...
  ├─ Route lạ & /admin/* ──► 404 NotFound           ├─ Cần phiên đăng nhập (HttpOnly cookie)
  └─ Chỉ gọi GET /api/v1/public/*                   └─ Chỉ gọi /api/v1/admin/* (Origin = ADMIN_ORIGIN)
```

---

## 7. Data model, Projection và Indexes MongoDB cho Public API

Toàn bộ dữ liệu công khai đọc trực tiếp từ **MongoDB 8** (driver chính thức `mongodb`), dùng chung một bản ghi chuẩn hóa với khu quản trị để tránh lệch dữ liệu khi admin vừa `Xuất bản` / `Ẩn tin` / `Đổi Còn trống <-> Đã thuê` / `Xóa mềm`.

### 7.1. Tập dữ liệu MongoDB phục vụ Public Read

| Collection | Mục đích trong Sprint 2 | Trường được phép xuất ra Public API | Trường bị cấm xuất / kiểm soát chặt |
| :--- | :--- | :--- | :--- |
| `room_listings` | Lưu toàn bộ tin phòng (mảng `images[]` nhúng nguyên tử bên trong document) | `_id` (map thành `id`), `title`, `roomType`, `priceVnd`, `areaM2`, `amenities`, `ward`, `district`, `city`, `publicAddress`, `availability`, `publishedAt`, `updatedAt`, `images[]` (metadata + URL public); thêm `description`, `contact` (`phone`, `zalo`), `displayAddress` ở màn chi tiết. | `privateAddress` (tuyệt đối không xuất ở list; ở chi tiết chỉ ánh xạ sang `exactAddress` khi `allowExactAddress === true`), `deletedAt`, `publishStatus`, `createdAt`, thông tin audit nội bộ. Ở list còn loại thêm `description`, `contactPhone`, `contactZalo`. |
| `admin_accounts` | Tài khoản quản trị | **Không truy cập** trong mọi route `/api/v1/public/*`. | Toàn bộ collection (chỉ phục vụ `admin-auth`). |
| `admin_sessions` | Phiên đăng nhập quản trị | **Không truy cập** trong mọi route `/api/v1/public/*`. | Toàn bộ collection. |
| `audit_events` | Nhật ký thao tác quản trị | **Không truy cập** trong mọi route `/api/v1/public/*`. | Toàn bộ collection. |

### 7.2. Indexes và Aggregation Pipeline cho Public Query

Để đáp ứng tốc độ lọc và phân trang trên MongoDB 8 (định nghĩa trong `server/src/db/mongo.js`, khởi tạo qua `server/scripts/init-db.js` và truy vấn tại `server/src/routes/public.js`):

1. **Điều kiện lọc cứng luôn đi đầu pipeline**:
   - Mọi truy vấn ở `/categories`, `/rooms`, `/rooms/:roomId`, và stream ảnh đều bắt buộc điều kiện `{ publishStatus: "PUBLISHED", deletedAt: null }`.
2. **Các index phục vụ Public Read (tạo bởi `npm --prefix server run db:init`)**:
   - `idx_public_rooms_feed`: `{ publishStatus: 1, deletedAt: 1, availability: 1, publishedAt: -1, updatedAt: -1 }` — tối ưu danh sách mặc định ưu tiên phòng còn trống và mới đăng.
   - `idx_public_rooms_ward`: `{ publishStatus: 1, deletedAt: 1, ward: 1 }` — tối ưu lọc theo phường và truy vấn `distinct("ward")` cho `/categories`.
   - `idx_public_rooms_type_price`: `{ publishStatus: 1, deletedAt: 1, roomType: 1, priceVnd: 1 }` — tối ưu lọc loại phòng và khoảng/sắp xếp theo giá thuê.
   - `idx_room_image_lookup`: `{ _id: 1, "images.id": 1 }` — tối ưu tra cứu nhanh một ảnh nhúng khi stream `/api/v1/public/rooms/:roomId/images/:imageId/file`.
3. **Pipeline xếp hạng & phân trang tất định (`GET /api/v1/public/rooms`)**:
   - Khi `sort === "available_first_publishedAt_desc"` (mặc định): dùng `$addFields` tính `availabilityRank` (`AVAILABLE` -> `0`, còn lại `1`), rồi `$sort: { availabilityRank: 1, publishedAt: -1, updatedAt: -1, _id: 1 }`.
   - Thực hiện đếm tổng khớp điều kiện (`totalItems`, suy ra `totalPages` và `hasNext`) cùng pipeline `aggregate` (`$match`, `$sort`, `$skip`, `$limit`, `$project`) cho trang hiện tại.
   - Chiếu `$project: { privateAddress: 0, contactPhone: 0, contactZalo: 0, description: 0 }` ngay trong MongoDB trước khi truyền qua hàm chuẩn hóa allowlist `toPublicListItem(doc)` để phòng ngừa rò rỉ dữ liệu theo lớp (defense-in-depth).

---

## 8. API Công khai Sprint 2

Mọi endpoint công khai đều nằm dưới prefix `/api/v1/public`, chỉ hỗ trợ phương thức `GET` (và `OPTIONS` cho CORS), **không** yêu cầu đăng nhập và sử dụng envelope lỗi chuẩn thống nhất của [09_API_Specification.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/09_API_Specification.md>).

| Phương thức | Endpoint | Mục đích | Đầu ra chính (`200 OK`) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/public/categories` | Lấy danh mục bộ lọc hợp lệ | `{ roomTypes, amenities, wards }` (`wards` trích distinct từ tin `PUBLISHED`, sắp xếp tiếng Việt) |
| `GET` | `/api/v1/public/rooms` | Danh sách, tìm kiếm, lọc, sắp xếp, phân trang | `{ items, page, pageSize, totalItems, totalPages, hasNext }` |
| `GET` | `/api/v1/public/rooms/:roomId` | Chi tiết một phòng đang xuất bản | `{ item }` (`toPublicDetailItem`) |
| `GET` | `/api/v1/public/rooms/:roomId/images/:imageId/file` | Stream nhị phân file ảnh phòng công khai | Luồng file ảnh inline với header an toàn |
| `GET` | `/api/v1/health/live`, `/api/v1/health/ready` | Kiểm tra tiến trình & kết nối MongoDB | `{ status: "ok" }` / trạng thái kết nối DB |

### 8.1. Field Allowlist & Quy tắc bảo vệ quyền riêng tư

1. **Danh sách `/api/v1/public/rooms` (`toPublicListItem`)** — Chỉ trả đúng các trường:
   `id`, `title`, `roomType`, `priceVnd`, `areaM2`, `amenities`, `ward`, `district`, `city`, `publicAddress`, `availability`, `publishedAt`, `updatedAt`, `coverImageUrl`.
2. **Chi tiết `/api/v1/public/rooms/:roomId` (`toPublicDetailItem`)** — Chỉ trả đúng các trường:
   `id`, `title`, `description`, `roomType`, `priceVnd`, `areaM2`, `amenities`, `ward`, `district`, `city`, `publicAddress`, `displayAddress`, `exactAddress` *(chỉ xuất hiện khi `allowExactAddress === true` và có `privateAddress`)*, `availability`, `publishedAt`, `updatedAt`, `contact` (`phone`, `zalo`), `images[]` (`id`, `mimeType`, `altText`, `sortOrder`, `isCover`, `url`).
3. **Danh mục hằng số hợp lệ (`ROOM_TYPES`, `AMENITIES`)**:
   - `ROOM_TYPES`: `"Phòng trọ"`, `"Phòng có gác"`, `"Phòng studio"`, `"Căn hộ mini"`, `"Phòng ở ghép"`.
   - `AMENITIES`: `"Máy lạnh"`, `"Tủ lạnh"`, `"Máy giặt"`, `"Giường"`, `"Tủ quần áo"`, `"Bếp riêng"`, `"Nhà vệ sinh riêng"`, `"Ban công"`, `"Gác lửng"`, `"Wifi"`, `"Chỗ để xe"`, `"Cửa sổ"`.

### 8.2. Mã lỗi chuẩn, Cache-Control và Validation đầu vào

- **Header Cache**:
  - `GET /api/v1/public/categories`: `Cache-Control: public, max-age=60`.
  - `GET /api/v1/public/rooms` & `/api/v1/public/rooms/:roomId`: `Cache-Control: public, max-age=30`.
  - `GET /api/v1/public/rooms/:roomId/images/:imageId/file`: `Cache-Control: public, max-age=60`, `Content-Disposition: inline; filename="room-image"`, `X-Content-Type-Options: nosniff`.
- **Validation query (`GET /api/v1/public/rooms`)**:
  - `q` <= 100 ký tự; `ward` <= 120 ký tự; `roomType` thuộc `ROOM_TYPES`; `availability` thuộc `["AVAILABLE", "RENTED"]`.
  - `minPriceVnd`, `maxPriceVnd`: số nguyên `>= 0`.
  - `minAreaM2`, `maxAreaM2`: số thực `> 0`, tối đa `100000`.
  - `page`: số nguyên `>= 1` (mặc định `1`); `pageSize`: số nguyên `1..48` (mặc định `12`).
  - `sort`: thuộc `["available_first_publishedAt_desc", "publishedAt_desc", "price_asc", "price_desc"]`.
- **Bảng mã lỗi công khai**:
  - `400 INVALID_QUERY`: tham số sai kiểu, vượt giới hạn `pageSize > 48`, sai enum `roomType` hoặc `sort` (kèm `details.fieldErrors`).
  - `400 INVALID_RANGE`: `minPriceVnd > maxPriceVnd` hoặc `minAreaM2 > maxAreaM2`.
  - `404 NOT_FOUND`: `roomId` hoặc `imageId` không hợp lệ UUID, phòng chưa xuất bản (`DRAFT`), đã ẩn (`HIDDEN`), đã xóa mềm (`deletedAt != null`), hoặc không tìm thấy ảnh.
  - `403`: từ chối origin chéo trái phép gọi sang `/api/v1/admin/*` từ `CLIENT_ORIGIN`.

---

## 9. Privacy & Security checklist cho khu vực Khách hàng

- [x] **Không rò rỉ bản ghi không công khai**: tin `DRAFT`, `HIDDEN`, và tin đã xóa mềm (`deletedAt != null`) trả `404 NOT_FOUND` ở cả API chi tiết, API stream ảnh và không bao giờ xuất hiện trong `/api/v1/public/rooms` hay danh sách `wards` của `/categories` (`AT-18`, `AT-23`, `AT-27`). *(PASS via `verify-sprint2-public.js`)*
- [x] **Không rò rỉ địa chỉ riêng tư**: `privateAddress` không xuất hiện trong JSON danh sách, không xuất hiện trong `toPublicDetailItem` khi `allowExactAddress=false`, và tìm kiếm `q` theo chuỗi chỉ nằm trong `privateAddress` trả về `0` kết quả (`AT-24`, `AT-25`, `AT-26`). *(PASS via `verify-sprint2-public.js` + Playwright)*
- [x] **Cách ly hoàn toàn 2 ứng dụng**: kiểm tra bundle và DOM của `client/` không chứa link, nút, hay đường dẫn điều hướng admin; truy cập `/admin` hoặc `/admin/login` trên `:5173` hiển thị `404 NotFound`; gọi `/api/v1/admin/*` từ `Origin: http://127.0.0.1:5173` nhận `403` (`AT-16`, `AT-32`, `AT-42`). *(PASS via `verify-sprint2-public.js`, Playwright & dist scan)*
- [x] **An toàn đầu vào & XSS/Regex Injection**: chuỗi tìm kiếm `q` chứa ký tự regex đặc biệt (`[`, `(`, `.*`, `\`) hoặc HTML/script (`<script>...`) không gây lỗi 500 trên MongoDB `$regex` và được React escape an toàn khi render (`AT-46`). *(PASS via `verify-sprint2-public.js` + Playwright)*
- [x] **Header bảo mật tệp ảnh & không cache thông tin quản trị**: endpoint ảnh công khai trả `X-Content-Type-Options: nosniff`, đúng `Content-Type` (`image/jpeg`, `image/png`, `image/webp`); `client/src/lib/api.js` không gửi credentials admin. *(PASS via `verify-sprint2-public.js`)*

---

## 10. Kế hoạch thực hiện đề xuất (10 ngày làm việc)

| Ngày | Nội dung công việc chính | Kết quả đầu ra |
| :--- | :--- | :--- |
| **Ngày 1–2** | Rà soát toàn bộ Public API (`server/src/routes/public.js`), chỉ mục MongoDB (`init-db.js`) và tạo bộ dữ liệu seed chuẩn Sprint 2 gồm đủ các trạng thái (`PUBLISHED` `AVAILABLE`/`RENTED`, `DRAFT`, `HIDDEN`, `deletedAt != null`, `allowExactAddress` `true`/`false`, nhiều phường Bình Thạnh). | API công khai sẵn sàng + tập dữ liệu kiểm thử chuẩn hóa theo mục 10 của `10_Testing_Acceptance.md`. |
| **Ngày 3–4** | Rà soát & tinh chỉnh các kịch bản biên trên Public API (`INVALID_RANGE`, `INVALID_QUERY`, `escapeRegex`, phân trang trang cuối/ngoài biên, cache headers, privacy projection, stream ảnh 404 với tin ẩn/nháp). | Viết và chạy bộ test tự động cho Public API + privacy isolation. |
| **Ngày 5–6** | Kiểm thử toàn diện giao diện `client/` (`/` & `/rooms`, `MobileFilterDrawer`, giữ URL query khi điều hướng, 4 trạng thái Loading/Empty/Error/NotFound, nhận diện thương hiệu **Ngọc Toàn**). | Giao diện danh sách & bộ lọc ổn định không lỗi console, không lệch URL. |
| **Ngày 7** | Kiểm thử toàn diện trang chi tiết `/rooms/:roomId` (`RoomGallery`, `SafeImage`, quy tắc `displayAddress` vs `exactAddress`, CTA gọi `tel:` và mở Zalo, tin `RENTED`, tin bị Admin ẩn tức thì). | Luồng xem chi tiết & liên hệ đạt chuẩn `UC-03`. |
| **Ngày 8** | Kiểm thử tách biệt 2 hệ thống (`client/` `:5173` vs `admin/` `:5174`), kiểm thử bảo mật XSS/NoSQL/Regex trên `q`, cross-origin `403`, và audit Responsive ở `360px`, `768px`, `1280px`, `1440px` + A11y. | Ảnh chụp minh chứng responsive + báo cáo pass kiểm tra cách ly nguồn. |
| **Ngày 9** | Thực thi đầy đủ ma trận Acceptance Tests (`AT-*` phạm vi Sprint 2) bằng tay và script tự động; sửa các lỗi phát sinh (nếu có). | Bảng kết quả `AT` Sprint 2 hoàn chỉnh và sạch lỗi chặn. |
| **Ngày 10** | Sprint Review với chủ hệ thống (`Ngọc Toàn`), đối chiếu từng tiêu chí DoD và chốt điều kiện chuyển sang **Sprint 3**. | Biên bản review Sprint 2 và quyết định sẵn sàng Sprint 3. |

---

## 11. Cách kiểm tra và bằng chứng review

### 11.1. Bộ dữ liệu test chuẩn (tối thiểu để kiểm chứng đầy đủ Sprint 2)

Theo mục 10 của [10_Testing_Acceptance.md](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>), tập dữ liệu nghiệm thu Sprint 2 cần có tối thiểu:
- **6–10 tin `PUBLISHED` với `availability = "AVAILABLE"`**: phủ nhiều phường Quận Bình Thạnh (ví dụ `Phường 25`, `Phường 19`, `Phường 2`, `Phường 22`...), đa dạng loại phòng (`ROOM_TYPES`), giá và diện tích khác nhau, mỗi phòng có 2–4 ảnh.
- **2 tin `PUBLISHED` với `availability = "RENTED"`**: kiểm tra việc tụt xuống sau tin `AVAILABLE` ở trang danh sách và vẫn xem được chi tiết với nhãn `Đã thuê`.
- **2 tin `DRAFT` và 2 tin `HIDDEN`**: có gắn ảnh và có `privateAddress` chứa chuỗi nhận diện riêng (ví dụ mã test `PRIVATE-ONLY-TOKEN`) để chứng minh **không** rò rỉ ra danh sách, tìm kiếm `q`, `categories.wards`, chi tiết `404` và ảnh `404`.
- **1 tin đã xóa mềm (`deletedAt != null`)**: xác nhận trả `404` hoàn toàn ở public.
- **Cặp tin kiểm tra địa chỉ**: ít nhất 1 tin `PUBLISHED` bật `allowExactAddress = false` và 1 tin `PUBLISHED` bật `allowExactAddress = true` có `privateAddress`.

### 11.2. Các lệnh kiểm tra tại local (Windows PowerShell)

1. **Khởi động MongoDB 8 & khởi tạo chỉ mục**:
   ```powershell
   npm --prefix server run db:init
   ```
2. **Kiểm tra lint, build cả 2 ứng dụng frontend & chuẩn bị kịch bản test Sprint 2**:
   ```powershell
   npm --prefix client run lint
   npm --prefix client run build
   npm --prefix admin run build
   ```
   *(Chạy cùng script kiểm thử tự động Public API & privacy isolation khi bổ sung cho Sprint 2, ví dụ `verify_sprint2_public.js`.)*
3. **Chạy đồng thời 3 tiến trình phát triển độc lập để test trình duyệt thực tế**:
   - Backend API: `npm --prefix server run start` (`http://127.0.0.1:3000`, tên DB mặc định `room_rental_dev`)
   - Hệ thống Khách hàng: `npm --prefix client run dev` (`http://127.0.0.1:5173`, proxy `/api` về `http://127.0.0.1:3000`)
   - Hệ thống Quản trị: `npm --prefix admin run dev` (`http://127.0.0.1:5174`)

### 11.3. Bằng chứng cần có khi kết thúc Sprint 2

1. Output lệnh kiểm tra API công khai & privacy leakage (bao gồm assert zero leak cho `DRAFT`, `HIDDEN`, `deletedAt`, `privateAddress`, `CLIENT_ORIGIN` bị chặn `403` trên `/api/v1/admin/*`).
2. Output kiểm tra build/lint `client/` và `server/` sạch lỗi (`0 errors`).
3. Bộ ảnh chụp màn hình trên trình duyệt thực tế ở các mốc `360px`, `768px`, `1280px`, `1440px` cho:
   - Trang danh sách `/rooms` (có kết quả, đang mở `MobileFilterDrawer`, Empty state có bộ lọc, Error state khoảng giá sai).
   - Trang chi tiết `/rooms/:roomId` (gallery ảnh, `displayAddress` ẩn số nhà khi `allowExactAddress=false`, tin `RENTED`, nút gọi & Zalo).
   - Trang `404 NotFound` khi truy cập `http://127.0.0.1:5173/admin` hoặc link phòng bị ẩn/xóa.

### 11.4. Kiểm thử chấp nhận (Acceptance Tests - AT) phạm vi Sprint 2

| Mã AT | Nội dung kiểm thử trọng tâm (theo `10_Testing_Acceptance.md`) | Kết quả dự kiến | Trạng thái nghiệm thu |
| :--- | :--- | :--- | :--- |
| `AT-01` | Xem danh sách phòng công khai mặc định (`PUBLISHED`, `Còn trống` trước `Đã thuê`) | Hiển thị đúng thứ tự, phân trang 12/trang | PASS |
| `AT-02` | Xem chi tiết phòng, gallery ảnh, địa chỉ hiển thị & CTA gọi/Zalo | Đầy đủ thông tin, ảnh load tốt, link `tel:`/Zalo đúng | PASS |
| `AT-03` | Tìm kiếm theo từ khóa `q` (tiêu đề, phường, địa chỉ công khai) | Trả kết quả đúng, thoát regex an toàn | PASS |
| `AT-04` | Lọc theo phường, loại phòng, khoảng giá, khoảng diện tích, trạng thái & kết hợp nhiều điều kiện | Khớp chính xác tiêu chí, giữ filter trên URL | PASS |
| `AT-05` | Sắp xếp (`available_first_publishedAt_desc`, `publishedAt_desc`, `price_asc`, `price_desc`) | Thứ tự trả về chính xác giữa các trang | PASS |
| `AT-09` | Khoảng lọc sai (`minPriceVnd > maxPriceVnd` hoặc `minAreaM2 > maxAreaM2`) | API trả `400 INVALID_RANGE`, UI cảnh báo rõ | PASS |
| `AT-10` | Empty State (có bộ lọc vs không có bộ lọc) & nút `"Xóa toàn bộ bộ lọc"` | Hiện đúng thông báo, khôi phục danh sách sạch | PASS |
| `AT-11` | Phân trang (`pageSize` mặc định 12, tối đa 48; vượt quá trả `400 INVALID_QUERY`) | Chuyển trang mượt, không trùng/sót tin | PASS |
| `AT-16` | Khách hàng truy cập đường dẫn quản trị trên cổng khách (`/admin/*`) | Hiển thị `404 NotFound`, không có form/link admin | PASS |
| `AT-18` | Tin `DRAFT` / `HIDDEN` / `deletedAt != null` | Không hiện ở public list & `404` khi mở chi tiết | PASS |
| `AT-23` | Tin `HIDDEN` hoặc mới xóa từ Admin biến mất ngay khỏi Public API & ảnh | API chi tiết & stream ảnh trả `404 NOT_FOUND` | PASS |
| `AT-24` | Tìm kiếm `q` theo chuỗi chỉ nằm trong `privateAddress` | Trả về 0 kết quả, không rò địa chỉ riêng | PASS |
| `AT-25` | `allowExactAddress = false` | Chi tiết chỉ có `displayAddress`, không có `exactAddress`/`privateAddress` | PASS |
| `AT-26` | `allowExactAddress = true` | Chi tiết có `exactAddress`, vẫn không lộ field nội bộ khác | PASS |
| `AT-27` | Stream file ảnh công khai | Chỉ phục vụ ảnh thuộc tin `PUBLISHED`, kèm `nosniff` | PASS |
| `AT-29` | Truyền `roomId` sai định dạng UUID hoặc không tồn tại | Trả `404 NOT_FOUND` lịch sự trên API & UI | PASS |
| `AT-32` | Cô lập nguồn `CLIENT_ORIGIN` gọi `/api/v1/admin/*` | Backend từ chối `403`, trình duyệt khách không có token admin | PASS |
| `AT-42` | Kiểm tra không rò rỉ dữ liệu nhạy cảm trong list payload (`privateAddress`, `contactPhone`, `contactZalo`, `description`) | Mọi item danh sách đúng allowlist `toPublicListItem` | PASS |
| `AT-43` | Header `Cache-Control` và tính nhất quán dữ liệu public sau thao tác admin | Cache ngắn 30s/60s đúng thiết kế, dữ liệu mới khớp DB | PASS |
| `AT-45` | Responsive (`360px`, `768px`, `1280px`, `1440px`) & A11y | Không tràn ngang, điều hướng phím & vùng chạm đạt chuẩn | PASS |
| `AT-46` | Chống XSS & Regex DoS trên input tìm kiếm `q` | Chuỗi độc hại bị escape/render an toàn, không lỗi 500 | PASS |

---

## 12. Definition of Done

Sprint 2 chỉ được đánh dấu **Hoàn thành (Done)** khi toàn bộ các điều kiện dưới đây được kiểm tra trực tiếp sau lần sửa code cuối cùng:

- [x] Toàn bộ backlog `S2-01` đến `S2-10` hoàn thành đúng phạm vi và hợp đồng API `/api/v1/public/*`.
- [x] Tất cả các test case `AT` trong mục 11.4 chạy trên môi trường thực tế có MongoDB 8 (không dùng mock DB) đều đạt `PASS`, `0` lỗi rò rỉ dữ liệu riêng tư.
- [x] Giao diện Khách hàng `client/` (`:5173`) hoàn toàn tách biệt với `admin/` (`:5174`), không còn dấu vết nút/link/route quản trị; `CLIENT_ORIGIN` gọi `/api/v1/admin/*` bị chặn `403`.
- [x] Build sản phẩm của `client/` (`npm --prefix client run build`) và lint sạch lỗi (`0 errors`); không có lỗi console/uncaught error trên trình duyệt ở các luồng chính.
- [x] Đã kiểm tra thực tế trên các kích thước màn hình `360px`, `768px`, `1280px`, `1440px` và có ảnh chụp minh chứng.
- [x] Nhận diện thương hiệu **Ngọc Toàn — HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH** và hệ thống màu sắc **Saigon Tropical Living & Modern Hospitality** hiển thị đồng bộ trên toàn bộ trang khách.
- [ ] Chủ dự án đã review trực tiếp trên máy local và đồng ý nghiệm thu Sprint 2.

---

## 13. Rủi ro và cách xử lý

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| :--- | :---: | :--- |
| Dùng `$regex` không escape ký tự đặc biệt trên `q` gây lỗi cú pháp MongoDB hoặc tìm sai | Cao | Đã áp dụng `escapeRegex(q)` trước khi tạo `RegExp(safe, "i")` trong `server/src/routes/public.js`; viết test case `AT-46` chứa chuỗi ký tự đặc biệt để kiểm chứng. |
| Lệch dữ liệu `wards` trong dropdown lọc nếu lấy danh sách cứng hoặc lấy cả tin `DRAFT`/`HIDDEN` | Trung bình | Endpoint `/api/v1/public/categories` dùng `collection.distinct("ward", { publishStatus: "PUBLISHED", deletedAt: null, ward: { $ne: "" } })` rồi sắp xếp theo chuẩn tiếng Việt. |
| Quên tách nguồn khiến người dùng tìm ra trang đăng nhập Admin trên domain/port của Khách hàng | Cao | Đã tách hoàn toàn thành hai Vite app (`client/` ở `:5173` và `admin/` ở `:5174`) và kiểm tra `ADMIN_ORIGIN` trên backend; Sprint 2 bổ sung test xác nhận `/admin` trên `client/` trả `404`. |
| Thứ tự phân trang bị trùng hoặc nhảy tin giữa trang 1 và trang 2 khi nhiều phòng có cùng `publishedAt` | Trung bình | Pipeline `$sort` luôn chốt `_id: 1` làm tiêu chí cuối cùng sau `availabilityRank`, `publishedAt`, `updatedAt`. |
| Ảnh tải chậm hoặc ảnh bị hỏng đường dẫn trên máy người dùng làm vỡ bố cục thẻ/gallery | Trung bình | Khung ảnh cố định tỷ lệ khung hình, dùng `SafeImage` hiển thị fallback gọn gàng và gắn `loading="lazy"` phù hợp; tối ưu tải nặng 500 tin tiếp tục đào sâu ở Sprint 3. |

---

## 14. Điều kiện chuyển sang Sprint 3

Chỉ chuyển sang **Sprint 3 (Bộ lọc nâng cao, tối ưu tải ảnh & kiểm thử hiệu năng 500 bản ghi trên 4G)** khi:

1. Toàn bộ bảng **Definition of Done** (Mục 12) và các ca `AT` trọng yếu (`AT-01..05`, `AT-09..11`, `AT-16`, `AT-18`, `AT-23..27`, `AT-29`, `AT-32`, `AT-42`, `AT-43`, `AT-45`, `AT-46`) đã được chạy và ghi nhận `PASS`.
2. Môi trường dữ liệu mẫu và script kiểm chứng Sprint 2 đã lưu trong repo, sẵn sàng làm nền mở rộng sang kịch bản benchmark 500 phòng tại Sprint 3 (`AT-12`, `AT-40`).
3. Không còn bug nghiêm trọng về bảo mật, rò rỉ dữ liệu riêng tư hay vỡ giao diện mobile/desktop.

---

## 15. Nhật ký Sprint 2

| Thời điểm | Sự kiện / Cập nhật | Trạng thái |
| :--- | :--- | :--- |
| **Nền dựng trước Sprint 2 (cuối Sprint 1)** | Xây dựng sẵn Public API (`server/src/routes/public.js`), giao diện Khách hàng (`client/src/App.jsx`), thương hiệu **Ngọc Toàn** (`client/src/branding.js`, SVG logo/favicon) và tách độc lập 2 ứng dụng `client/` (`:5173`) — `admin/` (`:5174`) kèm kiểm soát `CLIENT_ORIGIN` / `ADMIN_ORIGIN`. | Đã sẵn sàng làm nền kiểm chứng Sprint 2 |
| **Giai đoạn chuẩn bị tài liệu Sprint 2** | Ban hành tài liệu triển khai chi tiết `Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md` đồng bộ với BA và kiến trúc MongoDB 8 + 2 ứng dụng tách biệt. | Hoàn thành soạn tài liệu |
| **Giai đoạn thực thi & kiểm chứng kỹ thuật Sprint 2** | Làm sạch mã & CSS chỉ dành cho khách (`client/src/App.jsx`, `client/src/App.css`), giữ bộ lọc khi quay lại từ chi tiết (`?page=2`), bổ sung nút `"Xóa toàn bộ bộ lọc"` cho lỗi khoảng lọc `AT-09`, tối ưu responsive `960px`/pagination wrap; tạo `server/scripts/seed-sprint2.js` (19 phòng + PNG thật, bảo toàn `admin_accounts`), chạy `verify-sprint2-public.js` (toàn bộ `AT` API/Privacy `PASS`), chạy Playwright kiểm thử giao diện & responsive (`360px`–`1440px`, `0` overflow, `0` console/page error, lưu ảnh minh chứng `s2-*.png`). | Hoàn thành kỹ thuật (chờ chủ hệ thống nghiệm thu trực tiếp) |
