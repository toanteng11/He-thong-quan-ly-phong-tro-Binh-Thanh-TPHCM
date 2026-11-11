# 09 — API Specification

## 1. Mục đích và nguyên tắc

API nối public web/admin web với backend. Public API chỉ đọc tin đã xuất bản; Admin API kiểm tra phiên đăng nhập ở backend. Đây là hợp đồng nghiệp vụ ở mức MVP; tên trường/kiểu dữ liệu chi tiết có thể điều chỉnh khi chốt công nghệ nhưng không được làm đổi quy tắc truy cập.

- Prefix bắt buộc: /api/v1.
- Dữ liệu trao đổi mặc định: JSON UTF-8.
- Mã tin và ảnh là định danh ổn định.
- Danh sách có phân trang và giới hạn kích thước trang.
- Lỗi trả về mã HTTP phù hợp và thông báo không chứa bí mật.

## 2. Xác thực và quyền

- Khách gọi các endpoint public không cần đăng nhập.
- Admin đăng nhập để nhận phiên; phiên được gửi an toàn cho các yêu cầu admin.
- Bắt buộc dùng cookie phiên HttpOnly, Secure, SameSite phù hợp; thao tác ghi kiểm tra CSRF token hoặc Origin theo ADR đã chọn.
- Không có endpoint tạo tài khoản admin công khai.
- Các thao tác ghi kiểm tra quyền ở backend. Việc ẩn nút trên frontend không thay cho xác thực API.
- Đăng xuất phải kết thúc/thu hồi phiên.

## 3. Endpoint công khai

| Method | Endpoint | Mục đích | Tham số/đầu vào | Quyền |
|---|---|---|---|---|
| GET | /api/v1/public/rooms | Lấy danh sách tin công khai | q, ward, minPriceVnd, maxPriceVnd, minAreaM2, maxAreaM2, availability, page, pageSize, sort | Không cần |
| GET | /api/v1/public/rooms/{roomId} | Xem chi tiết tin | roomId | Không cần |
| GET | /api/v1/public/categories | Lấy loại phòng/tiện nghi nếu được cấu hình thành danh mục | page/pageSize nếu danh sách dài | Không cần |

Quy tắc: API công khai luôn giới hạn publishStatus = PUBLISHED. Mặc định sắp xếp phòng còn trống trước, sau đó theo ngày xuất bản mới nhất. Không nhận tham số cho phép khách lấy tin nháp/ẩn.

## 4. Endpoint xác thực admin

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| POST | /api/v1/admin/auth/login | Xác thực tài khoản và tạo phiên | Công khai nhưng có giới hạn thử |
| POST | /api/v1/admin/auth/logout | Kết thúc phiên hiện tại | Admin đã đăng nhập |
| GET | /api/v1/admin/auth/me | Kiểm tra phiên hiện tại | Admin đã đăng nhập |

Thông tin đăng nhập không được ghi vào log. Sai email hoặc mật khẩu trả thông báo chung, không tiết lộ tài khoản có tồn tại hay không.

## 5. Endpoint quản trị tin

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| GET | /api/v1/admin/rooms | Danh sách mọi tin, gồm nháp/ẩn | Admin |
| POST | /api/v1/admin/rooms | Tạo tin nháp; không cho tạo trực tiếp PUBLISHED | Admin |
| GET | /api/v1/admin/rooms/{roomId} | Xem một tin kể cả trạng thái chưa công khai | Admin |
| PUT | /api/v1/admin/rooms/{roomId} | Cập nhật thông tin tin | Admin |
| PATCH | /api/v1/admin/rooms/{roomId}/availability | Đổi tình trạng phòng | Admin |
| PATCH | /api/v1/admin/rooms/{roomId}/publish-status | Đổi Nháp/Đã xuất bản/Đã ẩn | Admin |
| DELETE | /api/v1/admin/rooms/{roomId} | Xóa mềm tin, không purge vật lý | Admin |
| GET | /api/v1/admin/dashboard | Số liệu tổng quan cơ bản | Admin |

## 6. Endpoint quản lý ảnh

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| POST | /api/v1/admin/rooms/{roomId}/images | Tải một hoặc nhiều ảnh lên tin | Admin |
| PATCH | /api/v1/admin/rooms/{roomId}/images/order | Cập nhật thứ tự/ảnh bìa | Admin |
| DELETE | /api/v1/admin/rooms/{roomId}/images/{imageId} | Gỡ ảnh khỏi tin | Admin |

Backend kiểm tra chữ ký nội dung, MIME thực tế, phần mở rộng, dung lượng và quyền truy cập. Baseline là JPEG/PNG/WebP, tối đa 10 MB/ảnh và 15 ảnh/tin. Không tin cậy tên file hoặc MIME do trình duyệt gửi lên.

## 7. Mô hình dữ liệu trao đổi baseline

### Tin phòng

| Trường | Kiểu nghiệp vụ | Quy tắc |
|---|---|---|
| id | Chuỗi định danh | Server cấp, duy nhất |
| title | Văn bản | Bắt buộc khi xuất bản |
| description | Văn bản | Bắt buộc khi xuất bản; làm sạch trước khi render |
| priceVnd | Số nguyên | Lớn hơn 0 |
| areaM2 | Số | Lớn hơn 0 |
| location | Đối tượng/nhóm trường | Phường/quận/thành phố có cấu trúc; dữ liệu đầu tiên ở Bình Thạnh |
| amenities | Danh sách | Có thể rỗng |
| images | Danh sách đối tượng ảnh | Có thứ tự; ảnh bìa được xác định |
| availability | AVAILABLE hoặc RENTED | Tình trạng phòng |
| publishStatus | DRAFT, PUBLISHED hoặc HIDDEN | Trạng thái tin |
| address | Đối tượng địa chỉ | Tách addressPublic và addressPrivate; địa chỉ riêng chỉ public khi allowExactAddress=true |
| contact | Đối tượng liên hệ | Ít nhất một kênh được bật public trước khi xuất bản |
| publishedAt | Ngày giờ tùy chọn | Backend ghi khi xuất bản |
| createdAt, updatedAt | Ngày giờ | Backend ghi |
| createdBy, updatedBy | Mã admin | Backend ghi để truy vết thao tác |

Public response không trả trường quản trị nội bộ, email admin, ghi chú riêng hoặc dữ liệu xác thực.

## 8. Quy tắc truy vấn và phân trang

- page bắt đầu từ 1; pageSize có giá trị mặc định và mức trần do backend cấu hình.
- minPrice không lớn hơn maxPrice; minArea không lớn hơn maxArea.
- availability chỉ nhận giá trị được định nghĩa.
- sort chỉ nhận danh sách khóa sắp xếp cho phép, không nhận biểu thức tùy ý.
- Response danh sách gồm items, page, pageSize, total hoặc nextPage theo quyết định triển khai.
- Bộ lọc phải được giữ khi chuyển trang.

## 9. Mã lỗi đề xuất

| HTTP | Ý nghĩa | Ví dụ |
|---:|---|---|
| 200 | Thành công | Trả danh sách/chi tiết/cập nhật |
| 201 | Tạo thành công | Tạo tin hoặc ảnh |
| 204 | Thành công, không có body | Xóa tin/ảnh thành công |
| 400 | Dữ liệu không hợp lệ | Giá âm, trạng thái sai |
| 401 | Chưa xác thực | Gọi admin API khi chưa đăng nhập |
| 403 | Không đủ quyền | Phiên hợp lệ nhưng thao tác không được phép |
| 404 | Không tìm thấy | Mã tin/ảnh không tồn tại hoặc tin không công khai |
| 409 | Xung đột | Dữ liệu trạng thái thay đổi đồng thời |
| 422 | Không thể thực hiện nghiệp vụ | Thiếu trường để xuất bản |
| 413 | Tệp quá lớn | Ảnh vượt giới hạn |
| 415 | Loại tệp không hỗ trợ | Tệp không phải ảnh cho phép |
| 429 | Quá nhiều yêu cầu | Thử đăng nhập/upload vượt giới hạn |
| 500 | Lỗi máy chủ | Thông báo chung; chi tiết chỉ ghi trong log an toàn |

## 10. Quyết định hợp đồng API

- API dùng cookie session HTTPS, CSRF protection cho write, rate limit đăng nhập; session hết hạn sau 30 phút không hoạt động hoặc 12 giờ tuyệt đối, tùy điều kiện đến trước.
- Giới hạn ảnh, xóa mềm/restore, public fields, page size và publish validation được quy định cụ thể tại mục 13–17.
- Slug SEO không bắt buộc cho phiên bản đầu; route dùng id ổn định, có thể bổ sung slug tương thích về sau.

## 11. Quy ước request và response

- Query string dùng camelCase như trong bảng endpoint; giá truyền bằng VND, diện tích bằng m².
- Body JSON dùng Content-Type application/json, ngoại trừ upload ảnh dùng multipart/form-data.
- Thời gian trả về theo ISO 8601 UTC; frontend đổi sang giờ Việt Nam khi hiển thị.
- ID được tạo ở backend; client không được tự chọn ID.
- API không trả mật khẩu, passwordHash, cookie, session token, ghi chú nội bộ hoặc địa chỉ riêng tư trong public response.

### Response danh sách

Response danh sách có các trường: items, page, pageSize, totalItems và totalPages. Nếu lựa chọn cursor pagination thì thay bằng nextCursor và ghi rõ trước khi triển khai; không trộn hai kiểu trong cùng một API.

### Response lỗi

Lỗi có cấu trúc ổn định gồm: code, message, fieldErrors (nếu lỗi nhập liệu) và requestId để tra log. message dùng được cho giao diện; chi tiết kỹ thuật chỉ ở log máy chủ. Không đưa stack trace, đường dẫn tệp hay bí mật ra response.

## 12. Hợp đồng tạo và cập nhật tin

### POST /api/v1/admin/rooms

- Khi không gửi publishStatus, tin mới mặc định DRAFT.
- Tin mới mặc định DRAFT. Endpoint tạo không cho gửi PUBLISHED; tạo nháp trước, sau đó gọi endpoint publish-status để backend kiểm tra điều kiện xuất bản.
- Các trường được phép gửi: title, description, priceVnd, areaM2, address, roomType, amenities, availability và contact.
- Client không gửi createdAt, updatedAt, createdBy hoặc publishStatus để ghi đè dữ liệu hệ thống.

### PUT /api/v1/admin/rooms/{roomId}

PUT thay toàn bộ các trường nội dung mà admin được sửa. Nếu cần cập nhật một phần, dùng PATCH với whitelist trường rõ ràng; không nhận object tùy ý để tránh ghi đè publishStatus hoặc trường nội bộ.

### PATCH trạng thái

- availability chỉ nhận AVAILABLE hoặc RENTED.
- publish-status chỉ nhận DRAFT, PUBLISHED hoặc HIDDEN.
- Chuyển sang PUBLISHED chạy lại kiểm tra đủ trường bắt buộc, ảnh và chính sách liên hệ.
- Mỗi lần đổi trạng thái cập nhật updatedAt và updatedBy.

### DELETE /api/v1/admin/rooms/{roomId}

DELETE thực hiện xóa mềm bằng deletedAt/deletedBy; tin/ảnh không còn public và không hiện trong danh sách admin mặc định. Endpoint POST /api/v1/admin/rooms/{roomId}/restore khôi phục tin về DRAFT. Không có purge vật lý trong API thao tác thông thường.

## 13. Tham số truy vấn chính xác

| Tham số | Kiểu | Mặc định/giới hạn | Quy tắc |
|---|---|---|---|
| q | Chuỗi | Tối đa 100 ký tự | Tìm không phân biệt hoa thường trong title và ward/addressPublic; không tìm trong ghi chú riêng. |
| ward | Chuỗi/mã phường | Không bắt buộc | So khớp phường thuộc phạm vi dữ liệu. |
| minPriceVnd/maxPriceVnd | Số nguyên | Không bắt buộc | Không âm; min không lớn hơn max. |
| minAreaM2/maxAreaM2 | Số | Không bắt buộc | Lớn hơn 0; min không lớn hơn max. |
| availability | Enum | Mặc định không lọc | Chỉ AVAILABLE hoặc RENTED; sắp xếp Còn trống trước không đồng nghĩa lọc bỏ Đã thuê. |
| page | Số nguyên | 1 | Bắt đầu từ 1. |
| pageSize | Số nguyên | Mặc định 12; tối đa 48 | Giá trị quá lớn trả validation error hoặc bị giới hạn nhất quán theo hợp đồng. |
| sort | Enum | available_first_publishedAt_desc | Chỉ nhận sort key được backend cho phép; lựa chọn khác gồm publishedAt_desc, price_asc, price_desc. |

Các giá trị mặc định 12/48 và trường tìm kiếm là baseline hợp đồng; thay đổi phải cập nhật UI/UX, Requirements và Acceptance.

## 14. Quy tắc ảnh và tính nhất quán

- Upload yêu cầu phiên admin hợp lệ và liên kết roomId đang tồn tại.
- Baseline theo Data Analysis: JPEG, PNG, WebP; tối đa 10 MB/ảnh và 15 ảnh/tin.
- Backend kiểm tra nội dung tệp thực, không chỉ phần mở rộng; đổi tên bằng ID do hệ thống sinh.
- Nếu lưu ảnh thành công nhưng cập nhật metadata thất bại, backend cần xóa tệp mồ côi hoặc đưa vào hàng đợi dọn dẹp.
- Khi xóa ảnh bìa, trả lại ảnh bìa mới hoặc trạng thái không có ảnh bìa theo quy tắc đã thống nhất.
- Các thao tác tạo/sửa/xóa ảnh cập nhật updatedAt của tin và không được làm lộ ảnh thuộc tin nháp qua public API.

Quy ước upload: multipart/form-data, mỗi file gửi trong phần files; backend trả danh sách imageId, URL xem trước cho admin, thứ tự và lỗi riêng theo từng file. Frontend và API dùng chung hợp đồng này.

## 15. Hợp đồng xác thực và danh sách quản trị

### Đăng nhập

- POST login nhận identifier (email hoặc tên đăng nhập) và password.
- Khi đúng, backend đặt cookie phiên; response body chỉ có thông tin admin an toàn như id, displayName và thời điểm hết hạn phiên.
- Request không được gửi mật khẩu qua query string hoặc ghi lại trong log.
- Không trả passwordHash hoặc session token trong JSON.
- Khi sai, trả 401 cùng thông báo chung. Khi bị giới hạn thử, trả 429 và thời gian có thể thử lại nếu phù hợp.
- Phiên hết hạn sau 30 phút không hoạt động hoặc 12 giờ tuyệt đối, tùy điều kiện đến trước; session rotation sau đăng nhập; khôi phục admin yêu cầu email đã xác minh hoặc quy trình xác minh thủ công của chủ dự án.

### Danh sách admin

GET /api/v1/admin/rooms hỗ trợ q, publishStatus, availability, page, pageSize và sort. Không có bộ lọc lưu trữ thì mặc định trả tin chưa xóa ở mọi trạng thái; tin đã xóa mềm chỉ hiện tại endpoint archived. Response admin có thể trả updatedAt và các trường nội bộ cần cho biểu mẫu nhưng không trả thông tin xác thực.

## 16. Danh sách trường được phép công khai

Public list response: id, title, priceVnd, areaM2, publicAddress, availability, coverImageUrl và publishedAt/updatedAt theo quyết định hiển thị.

Public detail response có thể thêm description, amenities, gallery và contactPublic. Không trả addressPrivate, internalNotes, deletedAt, createdBy, updatedBy, email admin hoặc trạng thái phiên. publicAddress và contactPublic được giới hạn theo quyền công khai từng tin ở server-side.
## 17. Hợp đồng API cho production

Các quy tắc trong phần này có hiệu lực cho API public và admin, bổ sung các endpoint ở trên.

### 17.1. Endpoint vận hành và khôi phục tin

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | /api/v1/health/live | Không cần đăng nhập | Tiến trình/API có đang phản hồi; không trả thông tin nội bộ. |
| GET | /api/v1/health/ready | Không cần đăng nhập | Readiness tổng quát; chỉ trạng thái healthy/unavailable và mã kiểm tra an toàn. |
| GET | /api/v1/admin/rooms/archived | Admin | Danh sách tin xóa mềm, phân trang. |
| POST | /api/v1/admin/rooms/{roomId}/restore | Admin | Khôi phục tin đã xóa mềm; mặc định về DRAFT nếu trạng thái cũ không được giữ an toàn. |
| GET | /api/v1/admin/rooms/{roomId}/preview | Admin | Dữ liệu preview không public, yêu cầu phiên admin. |

Health endpoints không được trả stack trace, host nội bộ, biến môi trường, credential, trạng thái database chi tiết hoặc đường dẫn filesystem.

### 17.2. Xác thực và phòng vệ request

- Mọi endpoint /admin yêu cầu session hợp lệ; middleware server-side kiểm tra trước khi đọc/ghi dữ liệu quản trị.
- Không cung cấp API đăng ký admin.
- Cookie phiên dùng Secure, HttpOnly, SameSite phù hợp; thao tác thay đổi dữ liệu kiểm tra CSRF token hoặc Origin/Referer theo phương án đã chốt.
- POST/PUT/PATCH/DELETE yêu cầu Content-Type đã hỗ trợ; kiểm tra schema, số lượng payload và giới hạn tốc độ.
- Đăng nhập sai trả lỗi chung, rate limit theo IP/tài khoản hoặc cơ chế tương đương; không xác nhận email/tên admin có tồn tại.
- 401 là chưa xác thực/hết phiên; 403 là đã xác thực nhưng không đủ quyền; 404 dùng cho tin không public để tránh lộ trạng thái draft/hidden/deleted.
- API không trả session id, password hash, private address, audit fields, deletedAt, storage secret hoặc ghi chú nội bộ trong response public.

### 17.3. Điều kiện publish và media

- POST/PATCH publish chạy validation tại backend theo trường Required ở tài liệu 03/06; lỗi trả 422 và fieldErrors.
- Quy tắc ảnh: JPEG/PNG/WebP, tối đa 10 MB mỗi ảnh, tối đa 15 ảnh/listing; xác minh nội dung file, không tin extension/MIME client.
- Upload dùng tên object ngẫu nhiên; storage private/quyền truy cập tối thiểu; chỉ ảnh thuộc tin public mới có URL public phù hợp.
- Khi thay ảnh bìa, sắp xếp ảnh, publish/hide/delete/restore, backend cập nhật cache/sitemap và URL public theo chính sách; thay đổi phải phản ánh trong tối đa 60 giây.
- Lỗi upload không được làm mất listing đã lưu; nếu upload nhiều ảnh, response phải cho biết từng ảnh thành công/thất bại và trạng thái nhất quán.

### 17.4. Phân trang, dữ liệu public và lỗi

- Mặc định pageSize 12; tối đa 48; response có items, page/limit hoặc cursor, total khi khả thi, hasNext.
- Query min/max phải hợp lệ; min lớn hơn max trả 400 với mã lỗi ổn định; không nối query client thành SQL.
- API public chỉ trả tiêu đề, slug/id, giá, diện tích, vùng địa chỉ được phép, tiện nghi public, trạng thái phòng, thời gian cập nhật và media URLs.
- Chi tiết public chỉ truy xuất khi publishStatus=PUBLISHED và deletedAt=null; trường địa chỉ chi tiết/liên hệ chỉ có nếu allowPublic tương ứng.
- Lỗi dùng envelope thống nhất: code, message tiếng Việt an toàn, requestId; lỗi nội bộ không để lộ stack trace.
- Các hành động ghi nên có updatedAt/version hoặc ETag để phát hiện ghi đè đồng thời; xung đột trả 409 và yêu cầu tải lại.

### 17.5. Vận hành API

- Tất cả request/response JSON dùng UTF-8; thời gian lưu UTC và hiển thị theo Asia/Ho_Chi_Minh.
- Public API có cache được kiểm soát; admin responses dùng no-store.
- Có log requestId, status và latency; loại bỏ credentials/cookie và không log payload liên hệ/địa chỉ riêng khi không cần.
- API health không thay cho uptime monitor từ bên ngoài.
- Không bật CORS rộng cho mọi origin trong production; cho phép origin website đã chốt.

