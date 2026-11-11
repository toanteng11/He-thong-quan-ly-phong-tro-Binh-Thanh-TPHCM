# 08 — System Architecture

## 1. Mục tiêu kiến trúc

Kiến trúc cần phục vụ một người quản trị và khách vãng lai, dễ triển khai, tải nhanh, bảo vệ thao tác admin và còn đường mở rộng. MVP không cần nhiều dịch vụ vận hành phức tạp.

## 2. Kiến trúc logic đề xuất

Luồng công khai: trình duyệt khách → frontend public → API chỉ đọc tin đã xuất bản → cơ sở dữ liệu và kho ảnh.

Luồng quản trị: trình duyệt admin → frontend admin → API yêu cầu xác thực → module phòng/ảnh/tài khoản → cơ sở dữ liệu và kho ảnh.

Trang public và admin có thể nằm trong một ứng dụng web nhưng tách route, layout và quyền. Backend ban đầu nên là ứng dụng đơn khối có module rõ ràng; REST API là ranh giới giữa giao diện và dữ liệu.

## 3. Các thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Public web | Trang chủ, danh sách/lọc, chi tiết, liên hệ; không có chức năng ghi dữ liệu. |
| Admin web | Đăng nhập và biểu mẫu quản lý phòng/ảnh/trạng thái. |
| Backend/API | Xác thực, kiểm tra dữ liệu/quyền, xử lý nghiệp vụ và trả dữ liệu. |
| Database | Lưu tin, trạng thái, tài khoản admin và thông tin tham chiếu ảnh. |
| Image storage | Lưu ảnh đã kiểm tra, cung cấp URL ảnh phù hợp thiết bị. |
| Hosting/reverse proxy | Phục vụ HTTPS, route ứng dụng và giới hạn request. |

## 4. Ranh giới module backend

- **Authentication**: đăng nhập, đăng xuất, phiên, khôi phục tài khoản nếu được chọn.
- **Room Listing**: tạo/sửa/xóa, trạng thái phòng, trạng thái xuất bản, tìm kiếm và lọc.
- **Media**: kiểm tra upload, lưu ảnh, thứ tự/ảnh bìa, xóa ảnh.
- **Public Catalog**: API chỉ đọc tin PUBLISHED và dữ liệu được phép công khai.
- **Admin Dashboard**: tổng hợp số liệu cơ bản.
- **Audit/Logging**: ghi các thao tác quản trị cần thiết, không ghi mật khẩu/token.

## 5. Định hướng công nghệ

Sprint 0 đề xuất React + Vite cho giao diện, Node.js 24 LTS + Express 5 cho API và PostgreSQL 18 cho database; đây là stack ứng viên thống nhất với tài liệu triển khai. Product Owner ghi ADR-S0-01 để phê duyệt trước khi tạo schema; nếu đổi database/runtime thì phải cập nhật các hợp đồng dữ liệu, backup, triển khai và chi phí. Production provider vẫn được chọn riêng theo khả năng private DB, backup/restore, vùng triển khai, chi phí và hỗ trợ.

Với MVP, ưu tiên một backend đơn khối có module và một cơ sở dữ liệu. Chỉ tách dịch vụ khi có tải hoặc nhu cầu độc lập đã được đo; không cần bắt đầu bằng microservices.

## 6. Tốc độ và khả năng mở rộng

- Danh sách dùng phân trang và trả trường cần hiển thị, không trả nguyên bộ dữ liệu ảnh.
- Tạo ảnh thumbnail/kích thước phù hợp; có thể dùng CDN nếu cần.
- Dùng chỉ mục cho trạng thái xuất bản, giá, diện tích và ngày cập nhật.
- Tải lười ảnh ngoài vùng nhìn thấy.
- Tách cấu hình theo môi trường; không nhúng khóa dịch vụ vào frontend.
- Địa chỉ lưu theo trường có cấu trúc để thêm quận/tỉnh sau này.
- API có phiên bản để thay đổi về sau không phá client cũ ngoài dự kiến.

## 7. Bảo mật và độ tin cậy

- Chỉ public API mới không yêu cầu đăng nhập; admin API bắt buộc xác thực ở backend.
- Không tạo endpoint đăng ký admin công khai.
- Dùng HTTPS, mật khẩu dạng hash, cookie phiên HttpOnly/Secure/SameSite hoặc cơ chế tương đương đã được thiết kế an toàn.
- Kiểm tra loại/kích thước ảnh và nội dung đầu vào; giới hạn tốc độ đăng nhập và upload.
- Dùng biến môi trường/kho bí mật cho thông tin kết nối.
- Có sao lưu database và ảnh; ghi lại cách khôi phục và kiểm tra khôi phục định kỳ.

## 8. Môi trường và triển khai

Môi trường đề xuất: local/dev để phát triển; staging để kiểm tra dữ liệu và luồng; production phục vụ khách. Nếu cá nhân vận hành trực tiếp, vẫn nên tách dữ liệu thử khỏi dữ liệu thật. Triển khai cần HTTPS, tên miền, cấu hình lưu ảnh, sao lưu, tài khoản admin ban đầu và hướng dẫn cập nhật.

## 9. Rủi ro và quyết định còn mở

| Nội dung | Quyết định/việc cần làm |
|---|---|
| Cơ sở dữ liệu | Stack ứng viên PostgreSQL 18 theo Sprint 0; cần ghi ADR xác nhận engine/version và dịch vụ production. |
| Lưu ảnh | Dùng object storage hoặc dịch vụ tương đương; giới hạn ảnh đã được chốt tại Data Analysis. |
| Đăng nhập | Dùng session cookie an toàn; chi tiết timeout/CSRF/rate limit phải ghi trong ADR/API trước khi triển khai. |
| Sao lưu | Baseline hàng ngày, 7 daily + 4 weekly, RPO ≤24h/RTO ≤1 ngày làm việc; chủ dự án duyệt provider/chi phí. |
| Mở rộng địa bàn | Bảo đảm mô hình địa chỉ không chỉ có một chuỗi cố định “Bình Thạnh”. |

## 10. Ranh giới tin cậy và luồng dữ liệu

### 10.1. Luồng khách xem phòng

1. Trình duyệt gọi Public API qua HTTPS.
2. Backend áp dụng publishStatus = PUBLISHED ở phía máy chủ.
3. Backend chỉ trả các trường công khai và URL ảnh của tin được phép xem.
4. Trình duyệt hiển thị danh sách phân trang; khi mở chi tiết mới lấy mô tả đầy đủ/gallery.
5. Khách chọn số điện thoại/Zalo; việc liên hệ diễn ra ngoài hệ thống trong MVP.

Public web không được kết nối trực tiếp tới database. Không dùng một tham số client gửi lên để cho phép lấy tin nháp hoặc tin ẩn.

### 10.2. Luồng admin cập nhật tin

1. Admin đăng nhập qua endpoint xác thực.
2. Backend cấp phiên có thời hạn và cookie phù hợp với HTTPS.
3. Mỗi yêu cầu admin kiểm tra phiên và quyền ở backend.
4. Backend xác thực dữ liệu, ghi database rồi mới trả thành công.
5. Nếu tải ảnh, backend kiểm tra tệp, lưu ảnh và metadata; sau đó liên kết ảnh với tin.
6. Nếu tin đã xuất bản, nội dung mới được public sau khi lưu thành công.

### 10.3. Sơ đồ thành phần dạng chữ

Khách → Public Web → Public API → Room/Location Data → Database  
Admin → Admin Web → Authenticated Admin API → Room/Media Modules → Database  
Media Module → Image Storage/CDN → ảnh dùng ở trang công khai  
Backend → Logs/Monitoring và Backup theo cấu hình vận hành

## 11. Lưu ý về ảnh và dữ liệu chưa xuất bản

- Chỉ tin đã xuất bản được liệt kê ở Public API; ảnh nháp không nên lộ qua API quản trị hoặc thư mục có thể đoán tên.
- Dùng khóa ảnh khó đoán; kiểm tra quyền trước khi tải/xóa ảnh từ admin.
- Ảnh phòng được chủ dự án chọn để công khai có thể bị lưu trong cache trình duyệt/CDN. Ẩn tin không đảm bảo thu hồi bản sao đã tải xuống.
- Không tải lên giấy tờ tùy thân, hợp đồng hoặc tài liệu riêng tư vào kho ảnh phòng.
- Metadata và URL ảnh không được chứa thông tin nhạy cảm.

## 12. Bảo mật ứng dụng

| Rủi ro | Kiểm soát ở mức thiết kế |
|---|---|
| Khách gọi API ghi | Chỉ endpoint admin cho phép ghi; xác thực ở backend; từ chối mặc định. |
| Lộ tài khoản admin | Hash mật khẩu; giới hạn thử đăng nhập; cookie an toàn; quy trình khôi phục được xác minh. |
| CSRF nếu dùng cookie | Dùng SameSite phù hợp và CSRF token/kiểm tra origin cho thao tác ghi. |
| XSS từ nội dung tin | Làm sạch/escape mô tả khi hiển thị; ưu tiên văn bản thuần trong MVP. |
| Upload tệp nguy hiểm | Whitelist định dạng ảnh, kiểm tra MIME thực và kích thước, đổi tên tệp, không thực thi tệp tải lên. |
| Lộ bí mật triển khai | Lưu biến môi trường/kho bí mật; không đưa vào frontend, log hoặc kho mã nguồn. |
| Truy cập database trái phép | Không mở database trực tiếp ra Internet nếu không cần; giới hạn thông tin kết nối và quyền tài khoản. |

Các kiểm soát cụ thể và cách xác minh cần được chốt cùng tài liệu API và Testing Acceptance.

## 13. Hiệu năng, khả dụng và vận hành

- Public list có pageSize giới hạn; truy vấn chỉ lấy trường cần thiết.
- Dùng thumbnail cho card; dùng ảnh lớn hơn ở chi tiết; tải gallery theo nhu cầu.
- Cache dữ liệu public có thể dùng nhưng cần làm mới/xóa cache khi admin đổi trạng thái hoặc nội dung.
- Không cache response admin hoặc thông tin đăng nhập.
- Ghi log lỗi và thao tác quản trị cần thiết; không ghi mật khẩu, cookie, token hay nội dung liên hệ không cần thiết.
- Đặt cảnh báo ở mức đơn giản: lỗi API tăng, upload lỗi, dung lượng gần đầy hoặc backup thất bại.
- Sao lưu database và ảnh; ghi thời gian phục hồi mục tiêu mà chủ dự án chấp nhận trước khi triển khai thật.

## 14. Môi trường và luồng triển khai

| Môi trường | Dữ liệu | Mục đích |
|---|---|---|
| Local/Dev | Dữ liệu giả | Phát triển và thử chức năng. |
| Staging | Dữ liệu mẫu đã làm sạch | Kiểm tra tích hợp và nghiệm thu trước phát hành. |
| Production | Tin và ảnh thật | Phục vụ khách và admin. |

Không sao chép dữ liệu thật sang staging nếu không cần. Thay đổi schema cần có cách cập nhật dữ liệu và phương án quay lui. Trước mỗi phát hành, sao lưu; sau phát hành kiểm tra đăng nhập admin, danh sách public, chi tiết phòng, upload ảnh và cập nhật trạng thái.

## 15. Các quyết định kiến trúc cần ghi lại

| Mã | Quyết định | Khuyến nghị hiện tại | Trạng thái |
|---|---|---|---|
| ADR-01 | Phong cách backend | Modular monolith cho MVP | Đề xuất |
| ADR-02 | Cơ sở dữ liệu | PostgreSQL 18 là ứng viên theo Sprint 0; ghi xác nhận engine/version và provider production | Cần chốt |
| ADR-03 | Ảnh | Object storage hoặc dịch vụ ảnh quản lý được; không lưu file ảnh lớn trực tiếp trong trường tin | Cần chốt |
| ADR-04 | Đăng nhập | Phiên admin an toàn; không có tự đăng ký | Cần chốt cách triển khai |
| ADR-05 | Public rendering/SEO | Bảo đảm trang chi tiết có nội dung và metadata dễ được tìm thấy; chọn SSR/SSG hoặc phương án tương đương theo stack | Cần chốt |
| ADR-06 | Khôi phục | Dùng baseline hàng ngày, 7 daily + 4 weekly, RPO ≤24h/RTO ≤1 ngày làm việc; xác nhận provider/chi phí | Xác nhận vận hành |

## 16. Điều kiện sẵn sàng cho triển khai

- Mô hình “một tin = một phòng” và baseline địa chỉ đã được quy định ở Data Analysis.
- Trường công khai/riêng tư, giới hạn ảnh và quy tắc xóa đã thống nhất trong Data Analysis.
- Phiên admin, upload ảnh và quy tắc chỉ trả tin xuất bản đã được cụ thể hóa trong API Specification.
- Có phương án deploy, backup/restore, HTTPS và tài khoản admin ban đầu.
- Chủ dự án phê duyệt chi phí vận hành định kỳ và sở hữu tài khoản hosting, database, lưu ảnh, tên miền.
## 17. Baseline kiến trúc production

Phần này chốt yêu cầu kiến trúc tối thiểu độc lập với nhà cung cấp. Các ADR về framework/database/storage có thể quyết định công nghệ cụ thể, nhưng không được làm mất các ranh giới bảo mật, backup, vận hành và hiệu năng dưới đây.

### 17.1. Mô hình triển khai

| Thành phần | Baseline production |
|---|---|
| DNS/domain | Tài khoản thuộc chủ dự án; record trỏ đến hosting; có kiểm tra thay đổi và chứng thư TLS tự gia hạn/được giám sát. |
| Web app | Phục vụ public và admin qua HTTPS; assets có cache phù hợp; bản release có version/commit để truy vết. |
| API/backend | Không dựa vào client để kiểm tra quyền; quản trị và tác vụ write chỉ qua backend. |
| Database | Không mở cổng công khai; kết nối riêng hoặc allowlist; credential riêng từng môi trường; backup mã hóa nếu provider hỗ trợ. |
| Image/object storage | Tách khỏi web root có thể thực thi; giới hạn upload; quyền truy cập tối thiểu; backup/retention tương ứng dữ liệu DB. |
| Logs/monitoring | Health/readiness, uptime/error check, dung lượng storage và backup status; loại bỏ secret/credential khỏi log. |
| Admin identity | Không có signup; provision an toàn; có hướng thu hồi/đổi thông tin xác thực và khôi phục đã xác minh. |

Production và staging phải dùng credential, database và storage riêng. Mọi migration phải tương thích release hoặc có phương án rollback; không dùng dữ liệu thật trên staging trừ khi đã được làm sạch và phê duyệt.

### 17.2. Triển khai, cấu hình và bảo vệ bí mật

- Cấu hình bằng secret store/environment do nền tảng cung cấp; frontend chỉ nhận biến public.
- Không commit file production chứa password, API key, session secret hoặc private key.
- Bật HTTPS; mọi HTTP redirect sang HTTPS; cookie admin Secure, HttpOnly, SameSite phù hợp.
- Hạn chế database/storage origin và quyền tài khoản dịch vụ theo nguyên tắc tối thiểu.
- Có kiểm soát truy cập vào dashboard nhà cung cấp và MFA nếu nền tảng hỗ trợ.
- Có dependency/security update routine và owner chịu trách nhiệm lịch cập nhật.
- Lưu log tối thiểu cho đăng nhập và thao tác admin; retention được cấu hình theo chi phí/privacy.
- Tạo release artifact có số phiên bản; deploy lại được từ source/config được quản lý.

### 17.3. Backup, khôi phục và liên tục dịch vụ

- Backup hàng ngày database và file ảnh/object; giữ tối thiểu 7 daily + 4 weekly ở vị trí khác failure domain.
- Mục tiêu RPO ≤24 giờ; RTO ≤1 ngày làm việc, cần chủ dự án xác nhận provider/chi phí đáp ứng.
- Backup phải có quyền truy cập hạn chế và mã hóa khi hỗ trợ.
- Restore test trước go-live trên môi trường không production; lưu kết quả, thời điểm và lỗi/khắc phục.
- Backup job có trạng thái theo dõi; thất bại gửi cảnh báo cho đầu mối vận hành.
- Quy trình restore phải định nghĩa thứ tự database/media, xác minh liên kết file, kiểm tra dữ liệu và chuyển traffic.
- Dữ liệu bị xóa mềm vẫn còn trong backup theo retention; purge phải tính đến bản backup và chính sách hết hạn.

### 17.4. Khả năng quan sát và hiệu năng

- Liveness xác nhận tiến trình còn hoạt động; readiness xác nhận backend và phụ thuộc thiết yếu sẵn sàng.
- Health endpoint không trả version secret, stack trace, connection string hoặc thông tin nội bộ.
- Log có timestamp/level/requestId và actor/entity cho thao tác quản trị; không log session/token/mật khẩu.
- Cảnh báo tối thiểu: service down, error rate tăng, backup thất bại, storage gần đầy và chứng thư domain/TLS có nguy cơ hết hạn nếu nền tảng không tự gia hạn.
- Public query phân trang, giới hạn page size; ảnh card dùng kích thước nhỏ; cache public invalidation tối đa 60 giây sau update.
- NFR performance: p75 nội dung chính list ≤3 giây trên 5 lần đo, thiết bị di động đại diện và mạng 4G giả lập nhất quán, 500 listings/3 ảnh tối ưu mỗi listing.
- Mục tiêu khả dụng thiết kế 99% theo tháng ngoài maintenance đã thông báo; ghi rõ không phải SLA provider.

### 17.5. ADR bắt buộc trước khi khóa triển khai

| Mã | Chủ đề | Quyết định phải ghi |
|---|---|---|
| ADR-01 | Web/API stack | Rendering, phiên bản runtime, cách build/deploy/rollback và người duy trì. |
| ADR-02 | Database | Engine/version, hosting, private connectivity, migration, backup/restore. |
| ADR-03 | Image storage | Provider, access model, resizing, cache invalidation, retention và backup. |
| ADR-04 | Authentication | Session/cookie, CSRF, rate limits, initial admin, reset/disable flow. |
| ADR-05 | Domain/TLS | Domain owner, DNS, certificate renewal và cảnh báo. |
| ADR-06 | Monitoring/alerts | Công cụ, người nhận, ngưỡng tối thiểu và quy trình xử lý. |
| ADR-07 | Cost | Ước tính recurring cho compute, DB, storage, bandwidth, domain/email và backup; Product Owner phê duyệt. |
| ADR-08 | Recovery | RPO/RTO, retention, restore test và người được phép thực hiện. |

### 17.6. Architecture go-live gate

Không đánh dấu sẵn sàng khi một trong các mục sau chưa có câu trả lời và bằng chứng: domain/TLS; production/staging separation; database access control; secret handling; admin provisioning; storage image policy; backup/restore; health/alerts; rollback plan; recurring cost owner; smoke check từ public và admin. Nếu năng lực provider không đáp ứng, cần Product Owner chấp thuận một phương án thay thế ghi rõ rủi ro.

