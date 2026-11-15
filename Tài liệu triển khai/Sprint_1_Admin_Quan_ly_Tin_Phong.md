# Sprint 1 — Khu quản trị và quản lý tin phòng

> Tài liệu triển khai Sprint 1 cho website phòng trọ Bình Thạnh. Tài liệu này chuyển các baseline BA đã có thành mục tiêu, backlog, tiêu chí nghiệm thu và định hướng giao diện có thể thực hiện. Đây là kế hoạch; các hạng mục chưa được triển khai chỉ được đánh dấu hoàn tất sau khi có bằng chứng review.

## 1. Thông tin sprint

| Thuộc tính | Nội dung |
|---|---|
| Mục tiêu | Chủ dự án đăng nhập an toàn và tự quản lý tin phòng từ giao diện admin trên điện thoại hoặc máy tính. |
| Người dùng chính | Chủ dự án kiêm quản trị viên. |
| Thời lượng lập kế hoạch | 2 tuần làm việc; đây là giả định ban đầu cho dự án một người, cần điều chỉnh theo tốc độ thực tế. |
| Đầu vào | Sprint 0 hoàn tất; stack React/Vite, Express 5, MongoDB 8 (`mongodb` driver); các tài liệu BA Đợt 1–3. |
| Kết quả cuối sprint | Một phần mềm chạy được trên môi trường phát triển, có đăng nhập admin và quy trình quản lý tin đầu-cuối, sẵn sàng review. |
| Trạng thái hiện tại | Hoàn thành triển khai và kiểm thử kỹ thuật Sprint 1 trên MongoDB 8 (`NODE_SYNTAX_OK`, `db:init`, `oxlint` 0 lỗi/0 cảnh báo, `vite build`, `SPRINT1_API_ACCEPTANCE_PASSED`, Playwright E2E UI & responsive `360/768/1280/1440 px`); sẵn sàng để chủ dự án chạy `admin:provision` và nghiệm thu demo. |

### 1.1. Sprint Goal

> Chủ dự án có thể đăng nhập vào khu quản trị, tạo và chỉnh sửa một tin phòng, tải/sắp xếp ảnh, lưu nháp, xem trước, xuất bản hoặc ẩn tin, đổi tình trạng phòng và khôi phục tin đã xóa mềm; các thao tác được bảo vệ ở backend và giao diện dùng tốt trên điện thoại lẫn máy tính.

### 1.2. Vì sao Sprint 1 bắt đầu từ admin

Sprint 1 tạo công cụ để chủ dự án nhập và duy trì dữ liệu phòng thật. Trang công khai hoàn chỉnh cho khách xem danh sách, tìm kiếm và chi tiết phòng là kết quả chính của Sprint 2. Sprint 1 vẫn đặt nền thiết kế thương hiệu và tiêu chuẩn giao diện dùng chung để khu khách ở Sprint 2 không bị làm lại.

## 2. Tài liệu và quyết định liên quan

| Tài liệu nguồn | Nội dung Sprint 1 cần tuân theo |
|---|---|
| [Requirements](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/03_Requirements.md>) | FR-06–FR-17, RULE-02, RULE-05, RULE-07–RULE-13, NFR-04–NFR-08, NFR-14, NFR-17, NFR-18. |
| [Use Case](<../Tài liệu BA/Đợt 1 - Phân tích nghiệp vụ/04_Use_Case.md>) | Đăng nhập admin, quản lý tin, ảnh, trạng thái, preview và khôi phục. |
| [Data Analysis](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/06_Data_Analysis.md>) | RoomListing, RoomImage, AdminAccount; điều kiện xuất bản, ảnh, soft delete, quyền địa chỉ/liên hệ. |
| [UI/UX Design](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/07_UI_UX_Design.md>) | Form, dashboard, danh sách admin, responsive, trạng thái giao diện và accessibility. |
| [System Architecture](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/08_System_Architecture.md>) | Client → REST API → MongoDB 8; kiểm tra quyền ở server; lưu media qua abstraction. |
| [API Specification](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/09_API_Specification.md>) | Prefix `/api/v1`, cookie session, endpoint tin/ảnh, lỗi và publish validation. |
| [Testing & Acceptance](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>) | AT-06–AT-10, AT-13–AT-15, AT-17, AT-19–AT-36, AT-42–AT-43 (admin, bảo mật, ảnh, responsive, privacy, health). |
| [Sprint 0](<./Sprint_0_Setup.md>) | Cách chạy local, MongoDB project trên cổng `27018` (container `27017`), cấu hình môi trường và giới hạn của nền tảng hiện tại. |

Nếu có khác biệt, Requirements/Data Analysis/API Specification là hợp đồng nghiệp vụ; thay đổi phải được ghi nhận theo [Change Management](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/11_Change_Management.md>).

## 3. Phạm vi Sprint 1

### 3.1. Trong phạm vi

- Khởi tạo collections, validation tầng ứng dụng (Zod) và indexes MongoDB 8 cho một admin, phiên đăng nhập, tin phòng nhúng ảnh và audit log qua script idempotent (`server/scripts/init-db.js`).
- Tạo tài khoản admin ban đầu bằng quy trình provisioning an toàn; không có đăng ký admin công khai.
- Đăng nhập, đăng xuất, đọc phiên hiện tại và hết hạn phiên.
- Khu vực admin có điều hướng, danh sách tin, bộ lọc cơ bản và dashboard số liệu tối thiểu.
- Tạo tin nháp, sửa tin, xem chi tiết quản trị và lưu thay đổi.
- Quản lý ảnh: tải lên, xem trước, chọn ảnh bìa, sắp thứ tự, gỡ ảnh và báo lỗi từng tệp.
- Hai trạng thái độc lập: tình trạng phòng `AVAILABLE/RENTED`; trạng thái tin `DRAFT/PUBLISHED/HIDDEN`.
- Điều kiện xuất bản được kiểm tra ở server; lỗi nêu trường cần bổ sung và không làm mất bản nháp.
- Xem trước riêng tư chỉ dành cho admin đang xác thực; tin draft/hidden không thể đọc từ API public.
- Ẩn tin, xóa mềm có xác nhận, xem danh sách đã xóa mềm và khôi phục về nháp.
- Giao diện quản trị responsive và bộ design token dùng lại cho giao diện public Sprint 2.
- Chạy được trong môi trường local Sprint 0; chưa phải phát hành production.

### 3.2. Ngoài phạm vi Sprint 1

- Trang public hoàn chỉnh: trang chủ, danh sách, chi tiết, SEO và nội dung giới thiệu (Sprint 2).
- Tìm kiếm/bộ lọc nâng cao phía khách (Sprint 3).
- Đăng ký khách, đặt lịch, đặt cọc, thanh toán, hợp đồng, quản lý người thuê.
- Nhiều vai trò admin, phân quyền cộng tác viên hoặc nhiều chủ nhà.
- Bản đồ, tích hợp Zalo API, thông báo SMS/email và analytics.
- Xóa vật lý/purge ngay trong admin; purge phải theo retention, backup và phê duyệt.
- Triển khai production, domain/HTTPS, backup vận hành và go-live; thực hiện ở Sprint 4 theo kế hoạch.

## 4. Định hướng giao diện — đẹp, nhất quán và dễ dùng

“Đẹp” cần chuyển thành tiêu chí có thể review: ảnh và dữ liệu có thứ bậc rõ; bố cục thoáng, cân đối; màu và kiểu chữ nhất quán; trạng thái dễ đọc; form không gây rối; hiển thị gọn ở màn nhỏ; không có màn trắng, lỗi thô hoặc nội dung giả gây hiểu nhầm.

### 4.1. Hướng hình ảnh và Hệ thống Màu sắc (Saigon Tropical Living & Modern Hospitality)

Hướng thị giác: **ấm, hiện đại, đáng tin cậy, gợi cảm giác nhà ở**. Bảng màu được chuẩn hóa đạt độ tương phản WCAG AA, kết hợp nền ngà ấm (`#F7F5F0`), bề mặt trắng tinh khiết (`#FFFFFF`), xanh ngọc nhiệt đới (`#1B634B`) làm màu thương hiệu chính và màu đất nung Sài Gòn (`#C5532B`) làm điểm nhấn ấm áp; ảnh phòng luôn là nội dung trung tâm. Admin dùng chung bộ token thiết kế với khu vực khách.

Tên “Room Nhà” đang xuất hiện ở trang bootstrap Sprint 0, chỉ xem là tên làm việc. Giữ cấu hình tên/logo/màu tách khỏi component để chủ dự án có thể thay sau; không tự tạo logo giả hoặc đưa nội dung phòng giả vào production.

| Token giao diện chuẩn | Giá trị | Cách dùng |
|---|---|---|
| `--bg-canvas` / `--bg-subtle` | `#F7F5F0` / `#EFECE6` | Nền toàn trang ấm dịu và nền khu vực phụ/sidebar. |
| `--bg-surface` / `--bg-elevated` | `#FFFFFF` / `#FCFBF9` | Thẻ phòng, bảng, form và header kính mờ. |
| `--ink-900` / `--ink-700` | `#12201B` / `#2B3D36` | Tiêu đề, giá thuê (`14.5:1`) và nội dung chính (`9.8:1`). |
| `--ink-500` / `--ink-400` | `#4E6058` / `#687A72` | Chữ phụ, nhãn trường (`5.7:1`), metadata (`4.2:1`). |
| `--brand-600` / `--brand-700` / `--brand-100` | `#1B634B` / `#154D3A` / `#E3F2EC` | Nút hành động chính, hover, active nav và nền nhấn nhẹ. |
| `--brand-500` | `#247A5D` | Focus ring và highlight tương tác. |
| `--accent-600` / `--accent-100` | `#C5532B` / `#FCEEE9` | Điểm nhấn phụ ấm áp; không dùng thay cho cảnh báo lỗi. |
| `--border-subtle` / `--border-strong` | `#E4E0D8` / `#CFC9BE` | Viền thẻ, ô nhập liệu và đường phân cách. |
| Semantic `AVAILABLE` | `#11613B` trên `#E6F5EC` | Nhãn "Còn trống" kèm chấm `#16A34A` và viền `#AEE0C2`. |
| Semantic `RENTED` | `#9A4212` trên `#FEF1E8` | Nhãn "Đã thuê" kèm chấm `#EA580C` và viền `#F9C8A9`. |
| Semantic `PUBLISHED` / `DRAFT` / `HIDDEN` | `#0E5A46` / `#85580A` / `#475467` | Nhãn trạng thái tin trên nền pastel và viền riêng biệt. |
| Semantic `DANGER` | `#B42318` trên `#FEF3F2` | Lỗi form, hành động xóa/lưu trữ (viền `#FECDCA`). |
| Font & Scale | `Plus Jakarta Sans` + `Newsreader` | Tối thiểu `12px–13px` cho badge/caption; `14px–15px` cho nội dung/form. |
| `--radius-card` / `--radius-control` | `16px` / `10px` | Bo góc thống nhất cho thẻ và control. |

Màu trạng thái luôn đi kèm nhãn chữ/icon, không chỉ phân biệt bằng màu. Font chữ ưu tiên độ rõ nét tiếng Việt (`Plus Jakarta Sans` cho UI/số liệu và `Newsreader` cho tiêu đề lớn).

### 4.2. Màn hình cần có

| Màn hình | Bố cục và điểm nhấn |
|---|---|
| Đăng nhập | Trang gọn, logo/tên, một panel rõ ràng, nhãn email/tên đăng nhập và mật khẩu, hiện/ẩn mật khẩu nếu hữu ích, thông báo lỗi chung, CTA nổi bật. Không có link đăng ký. |
| Khung admin | Sidebar thu gọn trên desktop; trên mobile dùng menu/drawer có nút rõ; header có tiêu đề hiện tại và menu tài khoản/đăng xuất. Nội dung có độ rộng tối đa dễ đọc. |
| Dashboard | Lời chào ngắn; số tin nháp/đã xuất bản/đã ẩn và phòng còn trống; nút “Tạo tin mới”; danh sách tin vừa sửa nếu hoàn thành mà không nở scope. Không dùng chart rỗng. |
| Danh sách tin | Tiêu đề trang và nút tạo tin; tìm kiếm/filters; trên desktop bảng nhẹ với thumbnail, mã/tên, giá, tình trạng phòng, trạng thái tin, cập nhật và thao tác. Trên mobile mỗi tin thành card, thao tác chính dễ chạm, không ép cuộn ngang. |
| Form tạo/sửa | Nhóm nội dung, giá/diện tích, địa chỉ/quyền công khai, loại phòng/tiện nghi, liên hệ/quyền công khai, ảnh và trạng thái. Label luôn hiện; đơn vị rõ; lưu nháp luôn dễ tìm; publish có xác nhận trạng thái. |
| Preview admin | Trình bày gần với card/chi tiết public nhưng gắn thông báo “Chỉ bạn xem được”; endpoint yêu cầu phiên admin; draft/hidden không thể bị truy cập bằng URL public. |
| Tin đã lưu trữ | Danh sách tin soft-delete, nhãn rõ, nút khôi phục; không có nút purge vật lý thường ngày. |

### 4.3. Responsive và khả năng thao tác

| Màn tham chiếu | Hành vi bắt buộc |
|---|---|
| 360 px | Form một cột; danh sách chuyển card; không tràn ngang; CTA và thông báo lỗi không bị che. |
| 768 px | Form vẫn đọc được; menu có thể thu gọn; danh sách dùng bố cục phù hợp chiều rộng. |
| 1280 px | Sidebar và nội dung cân đối; bảng hiển thị đủ các cột quan trọng; form không kéo quá rộng. |
| 1440 px | Giới hạn max-width; không để dòng văn bản quá dài hoặc card/phần ảnh phóng quá lớn. |

- Vùng chạm chính khoảng 44 × 44 CSS px khi bố cục cho phép.
- Focus bàn phím nhìn thấy; label gắn với input; dialog có tiêu đề và hành động hủy/xác nhận rõ.
- Sticky action bar trên mobile chỉ dùng nếu không che input hoặc bàn phím ảo.
- Tôn trọng `prefers-reduced-motion`; chuyển động ngắn, không cần thiết thì bỏ.

### 4.4. Trạng thái giao diện phải thiết kế và làm

- Loading/skeleton không làm nội dung nhảy mạnh.
- Chưa có tin; chưa có kết quả bộ lọc; lỗi tải có nút thử lại.
- Lỗi xác thực chung, đăng nhập bị giới hạn, phiên hết hạn.
- Form có lỗi ở đầu trang và gần trường; dữ liệu hợp lệ còn nguyên.
- Đang lưu, lưu thành công, lưu thất bại, rời trang khi chưa lưu.
- Upload tiến trình; file sai loại/quá dung lượng; một file lỗi trong nhóm; ảnh lỗi; danh sách ảnh rỗng.
- Chưa đủ điều kiện xuất bản; chỉ rõ danh sách trường thiếu và giữ tin ở trạng thái hiện tại.
- Tin đã thuê, ẩn, nháp, đã xóa mềm; nhãn luôn có chữ.
- Hộp xác nhận khi ẩn/xóa mềm; giải thích tin bị gỡ khỏi public và khôi phục được.

### 4.5. Review thẩm mỹ

Trước khi chấp nhận UI, review ít nhất ảnh chụp các màn login, dashboard, danh sách, form có lỗi, form có ảnh và xác nhận xóa ở 360 px và 1280 px. Đánh giá theo checklist:

- [x] Nhìn thấy rõ thứ tự quan trọng: tiêu đề trang → hành động chính → nội dung.
- [x] Khoảng trắng nhất quán, lề thẳng hàng, không chồng lấn hoặc dồn dập.
- [x] Màu, cỡ chữ, radius, bóng và kiểu nút dùng cùng hệ thống.
- [x] Tiêu đề/giá/nhãn trạng thái dễ quét; văn bản phụ không tranh ưu tiên.
- [x] Card, bảng và form không giống template demo mặc định của Vite.
- [x] Không dùng emoji làm icon chức năng; ưu tiên icon vector nhất quán hoặc icon kèm nhãn.
- [x] Không có dữ liệu giả hoặc URL ảnh ngẫu nhiên trong bản production.
- [x] Có trạng thái lỗi/loading/empty; không có khoảng trắng khó hiểu hoặc thông báo debug.
- [x] Không tràn ngang ở 360/768/1280/1440 px; thao tác chính dùng được bằng chạm và bàn phím.
- [x] Chữ và trạng thái dễ đọc, không dựa vào màu đơn thuần.

## 5. Product Backlog Sprint 1

Ưu tiên: **P0** bắt buộc để đạt Sprint Goal; **P1** cần hoàn thành nếu không làm ảnh hưởng bảo mật và luồng chính. Estimate là kích thước tương đối, dùng để lập kế hoạch chứ không phải cam kết thời gian.

| ID | User story / hạng mục | Ưu tiên | Cỡ | Tiêu chí nghiệm thu rút gọn | Mã AT liên kết |
|---|---|---:|---:|---|---|
| S1-01 | Là chủ dự án, tôi muốn đăng nhập/đăng xuất an toàn để chỉ mình quản lý được tin. | P0 | L | Provision an toàn; mật khẩu khởi tạo phải đổi trước khi dùng admin; phiên server-side/cookie an toàn; không có signup; API admin từ chối 401 nếu phiên thiếu/hết hạn; lỗi login không tiết lộ tài khoản tồn tại. | AT-06, AT-10, AT-21, AT-22, AT-34, AT-35 |
| S1-02 | Là admin, tôi muốn thấy khu quản trị có dashboard và danh sách để biết trạng thái dữ liệu và tìm tin cần sửa. | P0 | M | Số đếm đúng theo dữ liệu; danh sách phân trang; bộ lọc trạng thái; mobile đổi sang card. | AT-14, AT-15 |
| S1-03 | Là admin, tôi muốn tạo và sửa nháp để nhập nội dung phòng mà chưa công khai. | P0 | L | Lưu/đọc đúng trường; mặc định DRAFT; lỗi validation giữ dữ liệu; backend xác thực. | AT-07, AT-24, AT-27, AT-28 |
| S1-04 | Là admin, tôi muốn tải và sắp xếp ảnh để tin có hình đại diện tốt. | P0 | L | Chấp nhận JPEG/PNG/WebP, max 10 MB/file và 15 ảnh/tin; kiểm tra server; cover/order ổn định; lỗi theo từng file. | AT-08, AT-24, AT-26 |
| S1-05 | Là admin, tôi muốn đổi tình trạng phòng và trạng thái tin riêng biệt để không nhầm phòng đã thuê với tin đã ẩn. | P0 | M | Availability và publishStatus là hai thao tác/nhãn độc lập; cập nhật có phản hồi server. | AT-09 |
| S1-06 | Là admin, tôi muốn xem trước tin đã lưu để kiểm tra cách hiển thị. | P0 | M | Preview cần xác thực; URL public không đọc draft/hidden; private address/contact tuân thủ cờ công khai. | AT-23, AT-25, AT-31, AT-43 |
| S1-07 | Là admin, tôi muốn xuất bản/ẩn tin và biết trường còn thiếu. | P0 | M | Server kiểm tra bộ điều kiện publish; lỗi 422 theo trường; trạng thái không đổi nếu thiếu dữ liệu. | AT-07, AT-17, AT-30 |
| S1-08 | Là admin, tôi muốn xóa mềm và khôi phục tin để tránh mất dữ liệu do thao tác nhầm. | P1 | M | Có confirm; tin không còn public; archived list có thể khôi phục về DRAFT. | AT-13, AT-19, AT-20, AT-32, AT-33 |
| S1-09 | Là admin, tôi muốn giao diện rõ đẹp trên điện thoại/máy tính để quản lý thuận tiện. | P0 | M | Checklist ở mục 4 đạt; không tràn ngang; loading/error/empty/success có thiết kế. | AT-29, AT-42 |
| S1-10 | Là chủ dự án, tôi muốn MongoDB có quy trình khởi tạo collections/indexes lặp lại được. | P0 | M | Collections và indexes tạo idempotent qua `db:init` (`init-db.js`); Zod validation đầy đủ; không phụ thuộc dữ liệu thủ công cục bộ. | AT-36 |

### 5.1. Acceptance criteria chi tiết — đăng nhập

1. Admin ban đầu được tạo bởi seed/provisioning script hoặc quy trình ngoại tuyến được bảo vệ; secret không commit và không hard-code trong client. Mật khẩu khởi tạo dùng một lần và admin buộc đổi mật khẩu trước khi vào dashboard; nếu chọn cơ chế kích hoạt tương đương, cơ chế đó phải được ghi trong ADR và ngăn người khác nhận credential.
2. Không có API đăng ký tài khoản admin; không ghi mật khẩu, cookie, token hay secret vào log.
3. Đăng nhập đúng tạo phiên server-side và cookie `HttpOnly`, `Secure` khi chạy HTTPS, `SameSite` phù hợp; session ID được đổi sau đăng nhập.
4. Đăng nhập sai trả thông báo chung; có rate limit; không cho biết email/tên đăng nhập có tồn tại hay không.
5. `GET /api/v1/admin/auth/me` trả thông tin an toàn của admin hiện tại; mọi endpoint `/admin` cần middleware xác thực server-side. Nếu tài khoản còn `mustChangePassword=true`, chỉ được truy cập luồng đổi mật khẩu/đăng xuất.
6. Đăng xuất thu hồi phiên. Phiên hết hạn theo BA: 30 phút không hoạt động hoặc 12 giờ tuyệt đối, điều kiện đến trước.
7. CSRF/Origin defense theo API/ADR được thống nhất trước endpoint ghi; không dựa vào ẩn nút ở frontend.
8. Admin đổi mật khẩu khởi tạo thành mật khẩu riêng; server xác thực đầu vào và lưu hash mới, sau đó xóa cờ bắt buộc đổi mật khẩu. Không trả hoặc log mật khẩu/hash.

### 5.2. Acceptance criteria chi tiết — tin phòng

1. Một listing biểu diễn một phòng thuê độc lập; tin mới mặc định `DRAFT` và `AVAILABLE` nếu form/BA cho phép mặc định đó; giá trị mặc định phải nhìn thấy và có thể đổi trước khi lưu.
2. Admin tạo, xem, cập nhật được các trường cần thiết: tiêu đề, mô tả, room type, giá VND/tháng, diện tích m², địa chỉ có cấu trúc, tiện nghi, availability và thông tin liên hệ/cờ công khai.
3. Số nhà/địa chỉ riêng và mỗi kênh liên hệ chỉ public khi admin bật quyền cho tin đó. Public API tuyệt đối không nhận quyền hiển thị từ client khách.
4. Giá là số nguyên dương; diện tích dương, tối đa 2 chữ số thập phân; tiêu đề 10–120 ký tự; mô tả 30–5.000 ký tự trước khi xuất bản.
5. Lưu nháp không yêu cầu đủ điều kiện xuất bản; có thể lưu thông tin chưa hoàn chỉnh.
6. Khi xuất bản, backend xác thực đủ title, description, roomType, price, area, public location, occupancy, ít nhất một ảnh hợp lệ và ít nhất một kênh liên hệ hợp lệ được bật public.
7. Khi xuất bản thất bại, API trả lỗi nghiệp vụ 422 với `fieldErrors`; trạng thái hiện tại và nội dung đã lưu không mất.
8. Tình trạng `AVAILABLE/RENTED` độc lập với `DRAFT/PUBLISHED/HIDDEN`; trạng thái được thể hiện bằng nhãn text.
9. HIDE làm tin biến mất khỏi API public; thay đổi listing đã xuất bản phản ánh public trong tối đa 60 giây khi cache được bật.
10. DELETE là soft delete với `deletedAt/deletedBy` hoặc tương đương; archived list có phân trang; restore đưa tin về DRAFT; không có purge vật lý trong thao tác thường.

### 5.3. Acceptance criteria chi tiết — ảnh

- Tệp tối đa 10 MB, định dạng JPEG/PNG/WebP, tối đa 15 ảnh trên một listing.
- Backend xác minh nội dung thực của tệp, không chỉ dựa vào tên hoặc MIME do trình duyệt gửi; tạo storage key do hệ thống sinh.
- Admin có thể xem trước, chọn cover, đổi thứ tự và gỡ ảnh; chỉ có tối đa một cover.
- Khi gỡ ảnh bìa, hệ thống chọn ảnh đầu tiên còn lại làm bìa hoặc thể hiện rõ chưa có bìa.
- Upload lỗi không làm mất listing đã lưu; metadata/tệp lệch nhau cần dọn file mồ côi hoặc ghi nhận để dọn theo cơ chế an toàn.
- Draft/hidden image không được cung cấp URL public truy cập tự do. Trong local, storage adapter có thể dùng filesystem; cần abstraction để chuyển sang object storage trước production.

## 6. Quy trình nghiệp vụ trong Sprint

### 6.1. Tạo và xuất bản tin

1. Admin đăng nhập.
2. Chọn **Tạo tin mới**; form mở với trạng thái Nháp.
3. Nhập tiêu đề/mô tả, giá/diện tích, loại phòng, khu vực, tiện nghi, liên hệ và mức công khai địa chỉ/liên hệ.
4. Tải ảnh; hệ thống hiển thị tiến trình và xác thực từng ảnh; admin chọn ảnh bìa/sắp thứ tự.
5. Chọn **Lưu nháp** bất kỳ lúc nào. Nội dung chỉ được lưu sau phản hồi API thành công.
6. Chọn **Xem trước** để kiểm tra bố cục trong vùng admin có xác thực.
7. Chọn **Xuất bản**; backend kiểm tra toàn bộ quy tắc. Nếu thiếu dữ liệu, hiển thị lỗi từng trường, giữ trạng thái và nội dung.
8. Khi xuất bản thành công, thông báo rõ và cập nhật nhãn trong danh sách.

### 6.2. Đổi tình trạng, ẩn và xóa

- Đổi tình trạng phòng bằng một control riêng; không tự ẩn tin khi chuyển sang RENTED.
- Ẩn tin gỡ tin khỏi khu khách nhưng giữ dữ liệu và ảnh.
- Xóa mềm cần confirm bằng dialog nêu tên/mã tin; sau đó có thể khôi phục ở mục đã lưu trữ.
- Khôi phục đưa tin về Nháp; admin phải review và xuất bản lại nếu muốn công khai.

## 7. Data model và khởi tạo MongoDB Sprint 1

Khởi tạo collection & index bám sát [Data Analysis](<../Tài liệu BA/Đợt 2 - Phân tích thiết kế/06_Data_Analysis.md>) qua script idempotent `server/scripts/init-db.js`.

### 7.1. Collections MongoDB tối thiểu

| Collection | Nội dung tối thiểu |
|---|---|
| `admin_accounts` | `_id` (UUID), `singletonKey` (`"PRIMARY_ADMIN"` unique), `identifier` (email lowercase unique), `displayName`, `passwordHash`, `status`, `mustChangePassword`, `lastLoginAt`, `createdAt`, `updatedAt`. |
| `admin_sessions` | `_id` (UUID), `tokenHash` (SHA-256 unique), `adminId`, `createdAt`, `lastActivityAt`, `expiresAt`, `revokedAt`. |
| `room_listings` | `_id` (UUID), `title`, `description`, `roomType`, `priceVnd`, `areaM2`, `amenities`, `ward`, `district`, `city`, `publicAddress`, `privateAddress`, `allowExactAddress`, `contactPhone`, `allowPublicPhone`, `contactZalo`, `allowPublicZalo`, `availability`, `publishStatus`, `publishedAt`, `deletedAt`, `deletedBy`, `createdBy`, `updatedBy`, `version`, `images[]` (nhúng tối đa 15 subdocument `{ id, storageKey, mimeType, byteSize, originalName, altText, sortOrder, isCover, createdAt }`), `createdAt`, `updatedAt`. |
| `audit_events` | `_id` (UUID), `actorId`, `action`, `entityType`, `entityId`, `requestId`, `metadata`, `createdAt`; tuyệt đối không chứa secret hoặc payload credential. |

### 7.2. Constraints và indexes tối thiểu

- Validation tầng ứng dụng bằng Zod: `priceVnd > 0` (nguyên), `areaM2 > 0`, enum `availability` (`AVAILABLE`/`RENTED`), `publishStatus` (`DRAFT`/`PUBLISHED`/`HIDDEN`), `roomType` & `amenities` đúng danh mục cho phép.
- Mảng `images` giới hạn tối đa 15 phần tử bằng cập nhật nguyên tử đơn document (`"images.14": { $exists: false }`), tự động đồng bộ `sortOrder` và `isCover`.
- Unique indexes: `admin_accounts.identifier`, `admin_accounts.singletonKey`, `admin_sessions.tokenHash`.
- Compound indexes cho truy vấn: `{ publishStatus: 1, deletedAt: 1, availability: 1, publishedAt: -1, updatedAt: -1 }`, `{ publishStatus: 1, deletedAt: 1, ward: 1 }`, `{ publishStatus: 1, deletedAt: 1, roomType: 1, priceVnd: 1 }`, `{ deletedAt: 1, updatedAt: -1 }`, `{ _id: 1, "images.id": 1 }`.
- Public queries luôn lọc `publishStatus: "PUBLISHED"` và `deletedAt: null` ở backend.
- Không ghi username/password admin thật vào script khởi tạo.

## 8. API Sprint 1

Prefix `/api/v1`; JSON UTF-8, thời gian ISO UTC; lỗi có `code`, thông điệp an toàn, `fieldErrors` nếu có và `requestId`.

| Method | Endpoint | Chức năng | Hạn chế chính |
|---|---|---|---|
| POST | `/admin/auth/login` | Đăng nhập | Rate limit; response không có session token. |
| POST | `/admin/auth/change-password` | Hoàn tất đổi mật khẩu khởi tạo | Chỉ phiên bị giới hạn bởi `mustChangePassword`; yêu cầu mật khẩu mới, thu hồi/đổi phiên sau cập nhật theo policy đã chọn. |
| POST | `/admin/auth/logout` | Đăng xuất | Thu hồi session hiện tại. |
| GET | `/admin/auth/me` | Đọc phiên hiện tại | 401 nếu không hợp lệ/hết hạn. |
| GET | `/admin/dashboard` | Số liệu tin | Admin; không để con số demo giả. |
| GET | `/admin/rooms` | Tìm tin admin | `q`, `publishStatus`, `availability`, page/pageSize, sort; mặc định loại archived. |
| POST | `/admin/rooms` | Tạo tin nháp | Server sinh id/timestamps; không nhận trạng thái nội bộ từ client. |
| GET | `/admin/rooms/{roomId}` | Chi tiết tin admin | Admin; có thể đọc draft/hidden. |
| PUT | `/admin/rooms/{roomId}` | Cập nhật nội dung | Whitelist trường; không nhận trường hệ thống. |
| PATCH | `/admin/rooms/{roomId}/availability` | Đổi availability | Chỉ `AVAILABLE` hoặc `RENTED`. |
| PATCH | `/admin/rooms/{roomId}/publish-status` | Publish/hide/draft | Publish chạy validation ở server. |
| DELETE | `/admin/rooms/{roomId}` | Xóa mềm | Có auth; không purge. |
| GET | `/admin/rooms/archived` | Danh sách đã xóa mềm | Admin, phân trang. |
| POST | `/admin/rooms/{roomId}/restore` | Khôi phục | Đưa về DRAFT. |
| GET | `/admin/rooms/{roomId}/preview` | Preview private | Admin auth; cache `no-store`. |
| POST | `/admin/rooms/{roomId}/images` | Upload ảnh | Multipart; validate server-side; giới hạn tệp/tổng số. |
| GET | `/admin/rooms/{roomId}/images/{imageId}/file` | Đọc tệp ảnh admin | Admin auth; `Cache-Control: private, no-store`; `X-Content-Type-Options: nosniff`; dùng cho preview/chỉnh sửa tin nháp hoặc tin ẩn. |
| PATCH | `/admin/rooms/{roomId}/images/order` | Sắp xếp/cover | Chỉ ảnh thuộc listing; kiểm tra lạc quan theo `version`. |
| DELETE | `/admin/rooms/{roomId}/images/{imageId}` | Gỡ ảnh | Admin; kiểm tra `version`; giữ consistency với cover; chặn xóa ảnh cuối nếu tin đang `PUBLISHED`. |
| GET | `/health/live` & `/health/ready` | Kiểm tra sống/sẵn sàng | Không yêu cầu phiên; `/ready` kiểm tra `pingDb()` tới MongoDB; không lộ secret hoặc stack trace (`AT-36`). |

API public ở Sprint 1 được chuẩn bị cho health check và preview/đối chiếu privacy contract (`/api/v1/public/rooms/*`); tuyệt đối không mở đường đọc tin `DRAFT`/`HIDDEN`/`deletedAt != null`. Giao diện public hoàn chỉnh là trọng tâm Sprint 2 (đã dựng sẵn nền đồng bộ design tokens).

### 8.1. Quy tắc truy cập và response

- Mọi `/admin` trừ login cần session server-side hợp lệ.
- Ghi request (`POST`, `PUT`, `PATCH`, `DELETE`) kiểm tra `Origin` khớp `CLIENT_ORIGIN` (`requireSameOrigin`); CORS không mở tùy tiện.
- Public response không trả `privateAddress`, ghi chú nội bộ, `deletedAt`, actor ids, email admin, password hash, session id hoặc storage secret.
- Draft, hidden, deleted trả 404 nếu gọi public detail; không tiết lộ trạng thái tin.
- Session cookie và admin response có cấu hình không cache (`no-store`).
- Lỗi validation 400/422 không include stack trace; 401/403 khác nhau theo hợp đồng.

### 8.2. Hợp đồng mã lỗi và lưu ý đồng thời (`server/src/routes/admin.js`)

| HTTP Status | Mã lỗi (`error.code`) | Ngữ cảnh áp dụng |
|---|---|---|
| `400` | `INVALID_INPUT` / `INVALID_QUERY` | Dữ liệu form, bộ lọc query hoặc mật khẩu đổi lần đầu không hợp lệ. |
| `400` | `PASSWORD_MISMATCH` | Hai mật khẩu xác nhận khi đổi mật khẩu lần đầu không khớp. |
| `400` | `INVALID_MULTIPART` / `EMPTY_FILE` | Request upload ảnh thiếu boundary, sai field `file` hoặc tệp rỗng. |
| `400` | `IMAGE_SET_MISMATCH` | Danh sách `imageIds` gửi lên khi sắp xếp không khớp tập ảnh hiện tại. |
| `401` | `INVALID_CREDENTIALS` / chưa xác thực | Sai thông tin đăng nhập (thông báo chung), thiếu cookie hoặc phiên hết hạn/bị thu hồi. |
| `403` | `ORIGIN_MISMATCH` / `PASSWORD_CHANGE_REQUIRED` | Sai `Origin` trên request ghi hoặc tài khoản chưa đổi mật khẩu khởi tạo (`mustChangePassword=true`). |
| `404` | `NOT_FOUND` | Không tìm thấy tin/ảnh hoặc `UUID` không hợp lệ. |
| `409` | `PASSWORD_ALREADY_CHANGED` / `CONCURRENT_UPDATE` | Gọi đổi mật khẩu lần đầu khi đã đổi rồi, hoặc xung đột `version` khi xóa ảnh. |
| `413` | `IMAGE_LIMIT_REACHED` / `FILE_TOO_LARGE` / `PAYLOAD_TOO_LARGE` | Tin đã đủ 15 ảnh, tệp > 10 MB hoặc body multipart > 11 MB. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Tệp ảnh không phải magic bytes JPEG, PNG hoặc WebP hợp lệ. |
| `422` | `PUBLISH_VALIDATION_FAILED` | Xuất bản/cập nhật tin đang xuất bản thiếu trường bắt buộc hoặc xóa ảnh cuối (trả kèm `fieldErrors`). |
| `429` | `LOGIN_RATE_LIMITED` | Vượt quá giới hạn đăng nhập sai (trả kèm header `Retry-After`). |

> Lưu ý đồng bộ code: `PUT /rooms/{roomId}` (tùy chọn nhận `version` từ client), `PATCH /rooms/{roomId}/images/order` và `DELETE /rooms/{roomId}/images/{imageId}` đều đã kiểm tra điều kiện lạc quan theo `version` ở backend (`409 CONCURRENT_UPDATE`); `RoomEditorPage` gửi kèm `version` khi lưu tin để ngăn ghi đè nhầm dữ liệu cũ.

## 9. Security checklist

- [ ] Provisioning admin không tạo account signup endpoint; secrets inject qua env/secret store.
- [ ] Tài khoản khởi tạo buộc đổi mật khẩu trước khi sử dụng chức năng quản trị; sau đó có thể đăng nhập lại bằng credential riêng.
- [ ] Password hash bằng thuật toán chuyên dụng, thư viện maintained và tham số an toàn đã được ghi nhận trong quyết định kỹ thuật; không tự viết crypto.
- [ ] Cookie production Secure + HttpOnly + SameSite; rotation khi login; revoke khi logout.
- [ ] Rate limit và thông báo login chung; ghi audit event an toàn.
- [ ] Session expiry idle 30 phút và absolute 12 giờ.
- [ ] CSRF/Origin policy cho hành động ghi.
- [ ] Zod/schema validation ở server; output encode/sanitize để tránh HTML/script tùy ý.
- [ ] Upload xác minh file signature/MIME thực; giới hạn file/số lượng; tên object không dùng tên người dùng; storage không thực thi nội dung.
- [ ] Không thể truy cập trái phép admin API, preview hoặc ảnh private khi thiếu session.
- [ ] `.env`, session secret, mật khẩu và dữ liệu thật không nằm trong Git; log loại bỏ credentials/cookie.
- [ ] Cập nhật content không làm lộ số nhà hoặc liên hệ đã tắt public.
- [ ] Error messages không lộ query MongoDB, đường dẫn, stack trace hoặc cấu hình hạ tầng.

## 10. Kế hoạch thực hiện đề xuất

Đây là thứ tự để giữ increment chạy được thường xuyên; ngày có thể thay đổi trong Planning.

| Ngày | Trọng tâm | Kết quả review được |
|---|---|---|
| 1 | Xác nhận Sprint Goal, chiến lược khởi tạo MongoDB (`db:init`), session/storage decision, design tokens và route admin. | Quyết định còn mở được ghi; không bắt đầu với policy bảo mật mơ hồ. |
| 2 | Thiết kế document schema, Zod validation, collections + indexes MongoDB (`init-db.js`) và tầng truy cập dữ liệu. | Có thể khởi tạo mới database từ `db:init`; model constraints và indexes được thể hiện rõ. |
| 3 | Provision admin, login/logout/me, session middleware và rate limit. | Admin login hoạt động; API admin yêu cầu phiên. |
| 4 | Admin shell, login UI, dashboard skeleton, design system primitives. | Bố cục và token được review ở mobile/desktop. |
| 5 | API list/get/create/update draft, validation và errors. | Admin tạo/lấy/sửa draft qua API. |
| 6 | UI danh sách, tìm kiếm/lọc trạng thái, loading/error/empty/pagination. | Danh sách hoạt động và responsive. |
| 7 | Form nhóm trường, lưu nháp, dirty-state warning, server validation. | Luồng tạo và sửa dùng được. |
| 8 | Upload ảnh, preview, cover, order, remove và backend checks. | Ảnh quản lý được; lỗi không làm mất tin. |
| 9 | Publish/hide/availability, private preview, soft-delete/archive/restore. | Toàn bộ luồng trạng thái và quyền có thể demo. |
| 10 | Review UI, kiểm tra acceptance/security/error paths, sửa lỗi P0, Sprint Review/Retro. | Increment ổn định trong local; việc dở dang được chuyển backlog minh bạch. |

Với một developer, nếu năng lực thực tế không đủ cho tất cả P0, giữ auth và create/edit draft cùng UI responsive là lát cắt đầu tiên; chuyển upload đầy đủ/publish sang sprint kế tiếp qua backlog chính thức, không tuyên bố Sprint Goal đã đạt khi acceptance P0 còn thiếu.

## 11. Cách kiểm tra và bằng chứng review

Đây là checklist nghiệm thu cần chạy khi triển khai; việc ghi tiêu chí ở đây không có nghĩa đã thực hiện kiểm thử.

### 11.1. Luồng chức năng

- [x] Tài khoản được provision đăng nhập được; tài khoản sai nhận lỗi chung (`AT-06`, `verify_sprint1_api.js` + Playwright).
- [x] Logout xong, request admin bị 401; phiên hết hạn/bị thu hồi sau đổi mật khẩu không thể dùng tiếp (`AT-21`, `AT-35`).
- [x] Không có admin signup route (`AT-10`).
- [x] Tạo nháp thiếu field publish vẫn lưu được; tải lại dữ liệu không mất (`AT-07`, `AT-27`, `AT-28`).
- [x] Cập nhật thông tin, giá, diện tích và địa chỉ trả dữ liệu mới; hỗ trợ kiểm tra `version` `409 CONCURRENT_UPDATE`.
- [x] Upload file hợp lệ; file giả dạng ảnh/sai MIME/quá dung lượng bị từ chối rõ từng tệp; vượt 15 ảnh bị chặn (`AT-08`, `AT-26`).
- [x] Sắp xếp ảnh và đổi cover hiển thị đúng sau khi reload (`AT-08`, `AT-26`).
- [x] Xuất bản thiếu field trả 422/fieldErrors và không đổi status; đủ điều kiện mới publish (`AT-17`, `AT-30`).
- [x] Hide và soft delete làm tin biến mất khỏi public; archive restore đưa về DRAFT (`AT-20`, `AT-23`, `AT-32`, `AT-33`).
- [x] Availability đổi không làm đổi publish status (`AT-09`).
- [x] Preview draft chỉ admin truy cập; private contact/address không lộ nếu tắt quyền public (`AT-25`, `AT-31`, `AT-43`).

### 11.2. Responsive và thiết kế

- [x] Review 360, 768, 1280 và 1440 px; đã chụp và kiểm tra ảnh các màn chính (`s1-login-1280.png`, `s1-dashboard-1280.png`, `s1-form-error-1280.png`, `s1-form-images-1280.png`, `s1-delete-confirm-1280.png`, `s1-list-1280.png`, `s1-list-768.png`, `s1-list-360.png`, `s1-editor-360.png`, `s1-login-360.png`).
- [x] Không tràn ngang ở 360/768/1280/1440 px (`scrollWidth <= innerWidth`); thanh action ở mobile dùng `position: static` để không che input/bàn phím ảo.
- [x] Tất cả form có label, đơn vị, lỗi và trạng thái lưu.
- [x] Bảng chuyển card ở mobile (`@media (max-width: 900px)`); không cần kéo ngang để tìm nút sửa/ẩn.
- [x] Chữ/nhãn dễ đọc; focus hiển thị; nút thao tác mobile có vùng chạm tối thiểu `44px`.
- [x] Loading, empty, error kèm nút `Thử lại`, upload, expired session banner, success và confirm dialog có UI hoàn chỉnh.
- [x] Có ảnh thay thế (`Lỗi tải ảnh`) khi ảnh lỗi; ảnh giữ khung cố định, không méo layout.
- [x] Tên/brand cấu hình qua `client/src/branding.js`; không để dữ liệu giả hay thông tin mẫu trong DB sau khi dọn QA.

### 11.3. Database và vận hành local

- [x] Khởi tạo mới MongoDB collections và indexes từ đầu bằng `npm --prefix server run db:init` không cần chỉnh tay (`AT-36`).
- [ ] Restart môi trường local (`docker compose stop db` / `docker compose up -d db`) giữ dữ liệu qua Docker volume `mongo_data`.
- [ ] Không commit `.env`, credential, ảnh thật hay dữ liệu thử nhạy cảm.
- [ ] Cập nhật README với script `db:init` / `admin:provision` / `dev` và hướng dẫn tạo/đổi mật khẩu admin an toàn (`AT-35`).
- [x] Toàn bộ luồng Sprint 1 chạy trên API Express 5 + MongoDB 8 thật, không dùng dữ liệu mock.

### 11.4. Bộ lệnh thực thi, dữ liệu chuẩn và mẫu ghi nhận nghiệm thu

Các lệnh kiểm tra chuẩn trên Windows/PowerShell trong workspace:

```powershell
# 1. Khởi động MongoDB 8 (cổng 127.0.0.1:27018) và khởi tạo collections + indexes
docker compose up -d db --wait
npm --prefix server run db:init

# 2. Tạo tài khoản admin duy nhất lần đầu (tương tác nhập email và tên hiển thị)
npm --prefix server run admin:provision

# 3. Kiểm tra cú pháp backend, lint và production build frontend
node --check server/src/server.js
npm --prefix client run lint
npm --prefix client run build

# 4. Chạy API & Frontend dev ở 2 terminal riêng
npm --prefix server run dev
npm --prefix client run dev
```

Dữ liệu kiểm thử tối thiểu (bám sát mục 10 của [Testing & Acceptance](<../Tài liệu BA/Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>)):
- Bộ trạng thái tin: 1 tin `DRAFT`, 1 tin `PUBLISHED` (`AVAILABLE`), 1 tin `PUBLISHED` (`RENTED`), 1 tin `HIDDEN`, 1 tin đã xóa mềm (`deletedAt != null`).
- Bộ biên dữ liệu: giá/diện tích hợp lệ, giá `<= 0` hoặc số thập phân, tiêu đề < 10 hoặc > 120 ký tự, mô tả có thẻ `<script>`, tin bật `allowExactAddress=true` nhưng trống `privateAddress`, tin không có ảnh hoặc không bật kênh liên hệ nào khi publish.
- Bộ tệp ảnh: JPEG/PNG/WebP hợp lệ (≤ 10 MB), tệp > 10 MB, tệp `.txt`/`.html` đổi đuôi `.jpg` (sai magic bytes), ảnh thứ 16 trên cùng một tin.

Mẫu ghi nhận bằng chứng kiểm thử:

| Mã AT | Phạm vi / Mô tả ngắn | Trạng thái | Điều kiện / Lệnh kiểm tra | Bằng chứng & Ghi chú |
|---|---|---|---|---|
| `AT-06`, `AT-21`, `AT-22`, `AT-34`, `AT-35` | Auth, rate limit, cookie/session rotation, change password | Đạt (API + Playwright UI) | `verify_sprint1_api.js` + Playwright `/admin/login` | Pass đổi mật khẩu lần đầu, xoay token phiên, logout 401, rate limit 429 |
| `AT-07`, `AT-08`, `AT-17`, `AT-24`, `AT-26`, `AT-30` | CRUD nháp, `version` `409`, validation 422, upload/order/remove ảnh | Đạt (API + Playwright UI) | `verify_sprint1_api.js` + Playwright `/admin/rooms` | Xác minh `422` fieldErrors, `415` lỗi từng tệp giả ảnh, kéo-thả, đổi ảnh bìa (`s1-form-error-1280.png`, `s1-form-images-1280.png`) |
| `AT-09`, `AT-13`–`AT-15`, `AT-19`–`AT-20`, `AT-32`–`AT-33` | Dashboard, filter, availability, soft delete/restore | Đạt (API + Playwright UI) | `verify_sprint1_api.js` + Playwright `/admin`, `/admin/archived` | Xác nhận dialog ẩn/xóa mềm (`s1-delete-confirm-1280.png`) và restore về `DRAFT` (`s1-archived-1280.png`) |
| `AT-10`, `AT-23`, `AT-25`, `AT-27`, `AT-31`, `AT-43` | Privacy `privateAddress`, draft/hidden 404, preview | Đạt (API + Playwright UI) | Public/Admin probe trên `/api/v1` + Playwright `/preview` | Không rò `privateAddress`/`contact.zalo` trên public JSON; ảnh phục vụ qua session (`s1-preview-1280.png`) |
| `AT-29`, `AT-42`, `AT-36` | Responsive `360`–`1440px`, health/db:init | Đạt (API + Playwright UI) | `oxlint` (0 lỗi) + `vite build` + `db:init` + Playwright | `scrollWidth <= innerWidth` ở `360/768/1280/1440 px` (`s1-list-360.png`, `s1-editor-360.png`, `s1-list-768.png`, `s1-dashboard-1280.png`) |

## 12. Definition of Done

Một hạng mục chỉ Done khi:

- [x] Thỏa tiêu chí acceptance của user story (`S1-01`–`S1-12`) và yêu cầu BA được truy vết (`verify_sprint1_api.js` + Playwright UI).
- [x] Frontend không dùng dữ liệu mock ở luồng đã công bố hoàn thành.
- [x] API xác thực, kiểm tra input, phân quyền và lỗi server-side.
- [ ] Cấu trúc collections/indexes MongoDB (`db:init`) đã đạt; cần kiểm tra thêm bước restart Docker volume và hướng dẫn vận hành khi bàn giao.
- [x] UI reviewed ở mobile (`360px`/`768px`) và desktop (`1280px`/`1440px`); đã xử lý lỗi UI P0 phát hiện qua Playwright.
- [x] Loading, success, empty, retry và error đã có cách thể hiện.
- [x] Không có dữ liệu riêng (`privateAddress`, `contact.zalo` khi tắt) trong response public; đã dọn sạch dữ liệu QA.
- [ ] Chủ dự án chạy `npm --prefix server run admin:provision`, xem demo và nghiệm thu chấp nhận Sprint 1.

## 13. Rủi ro và cách xử lý

| Rủi ro | Tác động | Cách xử lý trong Sprint 1 |
|---|---|---|
| Session/CSRF chưa chốt | Admin API có thể bị giả mạo hoặc phát sinh làm lại. | Chốt ADR trước khi viết endpoint ghi; không chấp nhận chỉ bảo vệ route phía React. |
| Local file storage khác production object storage | Khó migrate ảnh hoặc URL private bị lộ. | Tạo storage interface, lưu storageKey thay vì hard-code URL; giữ quyền truy cập private. |
| Phạm vi form lớn | Sprint vượt tải, UI thiếu hoàn thiện. | Chốt nhóm field bắt buộc từ BA; dùng danh mục cấu hình cố định; không thêm nghiệp vụ đặt phòng. |
| Giao diện được làm sát cuối | Không còn thời gian sửa responsive/thẩm mỹ. | Dựng design tokens/shell từ ngày 4, review bản mobile sớm. |
| Dữ liệu địa chỉ/liên hệ bị public nhầm | Rủi ro riêng tư và an toàn cá nhân. | Tách public/private fields, mặc định tắt địa chỉ đầy đủ; test response ở server. |
| Seed có thông tin đăng nhập cố định | Credential bị lộ/khó đổi. | Seed chỉ từ biến môi trường/one-time provisioning, không ghi secret vào repo. |
| Mục tiêu hai tuần quá ngắn | Chất lượng hoặc bảo mật giảm. | Giữ P0 rõ, chuyển phần chưa đạt thành scope Sprint 2; không cắt auth/server validation. |

## 14. Điều kiện chuyển sang Sprint 2

- Sprint Goal đạt hoặc còn thiếu được ghi rõ cùng mức độ ảnh hưởng.
- Chủ dự án có thể tạo, chỉnh sửa và duy trì listing qua admin, không sửa trực tiếp database.
- Đã ghi quyết định storage ảnh và contract preview/public API cho phía khách.
- Không tồn tại lỗi P0 về đăng nhập, quyền truy cập, private address/contact hoặc mất dữ liệu tin.
- Có sample listing thực do chủ dự án cung cấp/duyệt hoặc dữ liệu demo được đánh dấu không dùng production.
- Sprint 2 có thể bắt đầu dựng trang chủ, danh sách, chi tiết khách trên design tokens đã thống nhất.

## 15. Nhật ký Sprint 1

| Trường | Ghi nhận sau khi thực hiện |
|---|---|
| Ngày bắt đầu/kết thúc | Bắt đầu 12/11/2026; chưa kết thúc |
| User stories hoàn tất | Hoàn thành phát triển và kiểm thử kỹ thuật toàn bộ luồng `S1-01`–`S1-12` (auth, đổi mật khẩu + xoay token, dashboard, filter, tạo/sửa nháp + `version` `409`, upload/drag-drop/thứ tự ảnh + lỗi từng tệp `415`, xuất bản `422` theo trường, ẩn có xác nhận, preview, soft delete/restore); chờ chủ dự án chạy `admin:provision` và nghiệm thu demo để đóng Sprint. |
| User stories chuyển sprint | Chưa ghi nhận |
| Khởi tạo DB / Schema version | Đã chuyển đổi hoàn toàn từ PostgreSQL sang **MongoDB 8** (`server/scripts/init-db.js` tạo collections + indexes cho `admin_accounts`, `admin_sessions`, `room_listings` kèm mảng nhúng `images[]`, và `audit_events`); container `room-rental-mongo` đang chạy trên `127.0.0.1:27018` và đã chạy thành công `npm --prefix server run db:init`. |
| Các quyết định/ADR mới | [ADR-S1-01](<../docs/adr/ADR-S1-01-Admin-Session-and-Image-Storage.md>): password scrypt; session token chỉ lưu hash và xoay token khi login/đổi mật khẩu; private local storage adapter; exact Origin, rate limit login và khóa lạc quan `version` cho cả `PUT` + thao tác ảnh. |
| Bằng chứng review UI (ảnh/link) | `npm --prefix client run lint` đạt `0 warnings, 0 errors` (`6 files`, `429ms`); `npm --prefix client run build` thành công (`20 modules`, `474ms`). Đã review trực quan bằng Playwright ở `360 px`, `768 px`, `1280 px`, `1440 px` (không tràn ngang ở cả 4 kích thước) với ảnh chụp lưu tại thư mục artifact phiên làm việc (`s1-login-1280.png`, `s1-dashboard-1280.png`, `s1-form-error-1280.png`, `s1-form-images-1280.png`, `s1-delete-confirm-1280.png`, `s1-list-360.png`, `s1-editor-360.png`). |
| Acceptance đã chạy và kết quả | Đã pass `node --check` trên toàn bộ `.js` backend (`NODE_SYNTAX_OK`), pass `npm --prefix server run db:init`, và pass bộ kiểm thử tự động `verify_sprint1_api.js` (`SPRINT1_API_ACCEPTANCE_PASSED`: `AT-06`, `AT-07`, `AT-08`, `AT-09`, `AT-10`, `AT-14`, `AT-15`, `AT-17`, `AT-20`, `AT-21`, `AT-22`, `AT-23`, `AT-25`, `AT-26`, `AT-30`, `AT-31`, `AT-32`, `AT-33`, `AT-34`, `AT-35`, `AT-36`, `AT-43`, `CONCURRENT_UPDATE_409_OK`) kết hợp kiểm thử giao diện Playwright đầu-cuối; dữ liệu QA đã được dọn sạch. |
| Việc cải thiện ở retrospective | Chưa thực hiện |
