# 06 — Data Analysis

## 1. Mục tiêu và nguyên tắc dữ liệu

Mô hình dữ liệu phải quản lý tin phòng, ảnh, tài khoản admin và trạng thái hiển thị. MVP chỉ có một tài khoản admin nhưng mô hình không nên gắn cứng quyền sở hữu vào giao diện. Không lưu hồ sơ khách thuê vì khách không đăng nhập và không giao dịch trên hệ thống.

Nguyên tắc:

- Lưu riêng tình trạng thực tế của phòng và trạng thái tin.
- Giá lưu bằng số nguyên VND; diện tích lưu theo m² với độ chính xác phù hợp.
- Dùng mã định danh ổn định cho tin và ảnh; URL công khai không phụ thuộc vào số thứ tự trang.
- Không lưu mật khẩu dạng rõ; chỉ lưu thông tin xác thực đã được bảo vệ.
- Dữ liệu liên hệ chỉ xuất ra public API nếu chủ dự án cho phép công khai.

## 2. Mô hình khái niệm

Quan hệ chính:

- Một **AdminAccount** có thể tạo/cập nhật nhiều **RoomListing**.
- Một **RoomListing** đại diện cho một đơn vị thuê độc lập trong MVP; một địa chỉ có thể có nhiều tin nếu ở đó có nhiều phòng.
- Một **RoomListing** có thể có nhiều **RoomImage**.
- Địa chỉ nên tách thành các trường có cấu trúc. Mô hình **Property/Building** riêng chưa cần trong MVP; chỉ bổ sung nếu chủ dự án cần gom nhiều phòng dưới cùng một tòa nhà.
- Không có thực thể Customer/Booking trong MVP.

## 3. Thực thể và trường dữ liệu

### 3.1. RoomListing — Tin phòng

| Trường nghiệp vụ | Bắt buộc | Quy tắc/ghi chú |
|---|---:|---|
| Mã tin | Có | Sinh tự động, duy nhất, không thay đổi sau khi tạo. |
| Tiêu đề | Có để xuất bản | Ngắn, mô tả đúng loại phòng/khu vực; giới hạn độ dài cấu hình được. |
| Mô tả | Có để xuất bản | Nội dung văn bản; làm sạch dữ liệu trước khi hiển thị. |
| Giá thuê | Có để xuất bản | Số dương, đơn vị VND/tháng. |
| Diện tích | Có để xuất bản | Số dương, đơn vị m². |
| Địa chỉ đầy đủ | Có trong dữ liệu quản trị | Số nhà/đường/phường/quận/thành phố; quyền hiển thị số nhà cần chủ dự án xác nhận. |
| Địa chỉ công khai | Có để xuất bản | Khu vực hoặc địa chỉ đã được phép công khai; không mặc định công khai số nhà. |
| Phường/quận/thành phố | Có theo phạm vi | MVP ở Bình Thạnh, TP.HCM; lưu thành các trường riêng để mở rộng địa bàn. |
| Loại phòng | Khuyến nghị | Phòng trọ, phòng có gác, căn hộ mini... danh mục có thể cấu hình. |
| Nội thất/tiện nghi | Tùy chọn | Danh sách lựa chọn hoặc nội dung mô tả; thống nhất cách nhập. |
| Tình trạng phòng | Có | AVAILABLE/Còn trống hoặc RENTED/Đã thuê. |
| Trạng thái tin | Có | DRAFT/Nháp, PUBLISHED/Đã xuất bản, HIDDEN/Đã ẩn. |
| Liên hệ | Có ít nhất một kênh cho phép công khai trước khi xuất bản | Tên/đầu mối, số điện thoại, Zalo; mỗi kênh có cờ cho phép public. |
| Ngày tạo/cập nhật | Có | Hệ thống ghi tự động; ngày cập nhật đổi khi lưu thành công. |
| Ngày xuất bản | Tùy chọn | Ghi lần xuất bản gần nhất để sắp xếp tin mới. |

### 3.2. RoomImage — Ảnh phòng

| Trường nghiệp vụ | Bắt buộc | Quy tắc/ghi chú |
|---|---:|---|
| Mã ảnh | Có | Duy nhất. |
| Mã tin | Có | Ảnh thuộc một tin phòng. |
| Đường dẫn lưu trữ | Có | Đường dẫn do hệ thống quản lý, không nhận URL tùy ý từ khách. |
| Văn bản thay thế | Khuyến nghị | Mô tả ngắn nội dung ảnh để hỗ trợ truy cập. |
| Thứ tự | Có | Số không âm; dùng sắp xếp ảnh trong gallery. |
| Ảnh bìa | Có | Mỗi tin có tối đa một ảnh bìa; nếu xóa ảnh bìa thì chọn ảnh khác hoặc dùng trạng thái không ảnh. |
| Loại, dung lượng, kích thước | Có | JPEG/PNG/WebP; tối đa 10 MB/ảnh, 15 ảnh/tin; backend xác thực nội dung tệp. |

### 3.3. AdminAccount — Tài khoản quản trị

| Trường nghiệp vụ | Bắt buộc | Quy tắc/ghi chú |
|---|---:|---|
| Mã admin | Có | Duy nhất. |
| Họ tên | Có | Tên hiển thị trong khu quản trị. |
| Email/tên đăng nhập | Có | Duy nhất; dùng để đăng nhập hoặc khôi phục tài khoản. |
| Thông tin xác thực | Có | Lưu dạng hash an toàn; không lưu mật khẩu rõ. |
| Trạng thái tài khoản | Có | Hoạt động/khóa; tài khoản khóa không được tạo phiên. |
| Ngày tạo/cập nhật | Có | Phục vụ quản trị và bảo mật. |

## 4. Từ điển trạng thái

| Trường | Giá trị lưu baseline | Nhãn hiển thị |
|---|---|---|
| availability | AVAILABLE | Còn trống |
| availability | RENTED | Đã thuê |
| publishStatus | DRAFT | Nháp |
| publishStatus | PUBLISHED | Đã xuất bản |
| publishStatus | HIDDEN | Đã ẩn |

Tên enum là hợp đồng dữ liệu baseline; khi triển khai có thể đổi cách lưu nhưng ý nghĩa/trạng thái chuyển đổi phải giữ nguyên.

## 5. Quan hệ và toàn vẹn dữ liệu

- RoomListing 1 — N RoomImage.
- RoomListing N — 1 AdminAccount qua createdBy/updatedBy, nếu nhật ký thay đổi cần truy vết.
- Mã tin và mã ảnh phải duy nhất.
- Ảnh không được tham chiếu tin không tồn tại.
- Tin PUBLISHED phải đủ trường bắt buộc, có ảnh hợp lệ và ít nhất một kênh liên hệ được phép công khai; deletedAt phải rỗng.
- Giá và diện tích phải lớn hơn 0; thứ tự ảnh không âm.
- Xóa tin là soft delete; giữ liên kết/ảnh để khôi phục trong thời hạn retention. Không xóa vật lý ngay khi admin xác nhận.

## 6. Phân loại và bảo vệ dữ liệu

| Nhóm | Ví dụ | Cách xử lý |
|---|---|---|
| Công khai | Tiêu đề, mô tả, giá, diện tích, ảnh, địa chỉ đã chọn công khai, tình trạng | Chỉ API public trả về khi tin PUBLISHED. |
| Riêng tư quản trị | Email đăng nhập, phiên đăng nhập, nhật ký lỗi | Không trả về API public; hạn chế quyền truy cập. |
| Bí mật | Mật khẩu, khóa dịch vụ, cookie/session token | Không ghi log; dùng cơ chế lưu bí mật riêng; hash mật khẩu. |
| Dữ liệu không thu thập ở MVP | Tên/số điện thoại của người xem, lịch sử thuê | Không tạo bảng hoặc theo dõi nếu chưa có nhu cầu rõ. |

## 7. Lưu trữ, vòng đời và sao lưu

- Tin nháp được giữ để admin tiếp tục hoàn thiện.
- Tin ẩn không hiển thị công khai nhưng vẫn có thể quản lý.
- Tin/ảnh bị xóa mềm được giữ 90 ngày trước khi xem xét purge; purge chỉ thực hiện sau xác nhận của chủ dự án và kiểm tra backup.
- Backup hàng ngày phải bao gồm database và ảnh; giữ 7 bản ngày + 4 bản tuần ở vị trí khác failure domain; restore test trước go-live.
- Thông tin đăng nhập và log có thời hạn lưu tối thiểu cần thiết, không lưu vô thời hạn nếu không có lý do vận hành.

## 8. Truy vấn và hiệu năng dữ liệu

Các truy vấn chính là lấy danh sách PUBLISHED, lọc theo giá/diện tích/tình trạng, lấy chi tiết theo mã tin và danh sách quản trị theo trạng thái. Thiết kế kỹ thuật nên cân nhắc chỉ mục cho publishStatus, availability, price, area và ngày cập nhật. Phân trang có giới hạn kích thước trang; không trả toàn bộ ảnh gốc trong danh sách.

## 9. Baseline nghiệp vụ đã chốt

1. Mặc định chỉ công khai phường/khu vực; địa chỉ đầy đủ chỉ public khi admin bật riêng cho từng tin.
2. Danh mục loại phòng/tiện nghi dùng danh sách cấu hình trong phiên bản đầu; admin chọn giá trị có sẵn, không tự tạo danh mục.
3. Xóa là xóa mềm; giữ tin và ảnh 90 ngày trước khi xem xét purge theo phê duyệt.
4. Tiền cọc và chi phí dịch vụ không thuộc phiên bản đầu; có thể bổ sung nếu được duyệt change request.

## 10. Đặc tả dữ liệu baseline để triển khai

### 10.1. Quy ước một tin và địa chỉ

- Một RoomListing là một phòng/đơn vị cho thuê có thể được khách hỏi thuê độc lập.
- Nếu một nhà có nhiều phòng, MVP tạo một tin cho mỗi phòng. Có thể lặp lại cùng địa chỉ; không gộp nhiều phòng vào một tin với một trạng thái chung.
- Địa chỉ lưu riêng phần đầy đủ và phần công khai. Phần công khai mặc định chỉ hiển thị phường/khu vực cho đến khi chủ dự án xác nhận việc công khai số nhà.
- Baseline schema chốt mô hình “một tin = một phòng”; nếu sau này cần quản lý tòa nhà như nhóm, bổ sung Property qua change request.

### 10.2. Trường lõi và kiểm tra

| Trường/API concept | Kiểu nghiệp vụ | Bắt buộc xuất bản | Kiểm tra |
|---|---|---:|---|
| id | Mã định danh | Có | Server sinh, bất biến. |
| title | Văn bản | Có | Không rỗng sau khi trim; giới hạn độ dài cấu hình. |
| description | Văn bản | Có | Cho phép văn bản thuần/định dạng an toàn; không render HTML tùy ý. |
| priceVnd | Số nguyên | Có | Lớn hơn 0; hiển thị VND/tháng. |
| areaM2 | Số thập phân | Có | Lớn hơn 0; độ chính xác được thống nhất, khuyến nghị tối đa 2 chữ số thập phân. |
| address | Nhóm trường | Có | Có phường, quận, thành phố; phần số nhà có thể giữ riêng tư. |
| availability | Enum | Có | AVAILABLE hoặc RENTED. |
| publishStatus | Enum | Có | DRAFT, PUBLISHED hoặc HIDDEN. |
| contact | Đối tượng | Có ít nhất một kênh được phép public trước xuất bản | Có thể rỗng ở bản nháp; kiểm tra định dạng điện thoại/Zalo. |
| images | Danh sách | Có tối thiểu 1 ảnh trước xuất bản | Tối đa 15 ảnh; thứ tự ổn định; tối đa 1 ảnh bìa. |
| createdAt/updatedAt | Ngày giờ | Có | Backend ghi theo UTC; giao diện hiển thị giờ Việt Nam. |
| publishedAt | Ngày giờ | Khi đã xuất bản | Ghi lần xuất bản gần nhất, không dùng thay cho updatedAt. |
| createdBy/updatedBy | Mã admin | Có khi cần truy vết | Trong MVP thường cùng một admin; không lưu tên tự do thay cho định danh. |

### 10.3. Khuyến nghị giới hạn ảnh

Baseline production: JPEG, PNG và WebP; tối đa 10 MB/ảnh; tối đa 15 ảnh/tin. Backend kiểm tra loại tệp thực tế, chặn tệp không phải ảnh, tạo bản hiển thị phù hợp và lưu metadata.

Ảnh danh sách nên dùng thumbnail; trang chi tiết tải kích thước lớn hơn theo nhu cầu. Khi xóa ảnh bìa, hệ thống tự chọn ảnh đầu tiên còn lại hoặc yêu cầu admin chọn ảnh bìa mới.

### 10.4. Chuyển trạng thái và xóa

- Tin mới tạo mặc định là DRAFT.
- DRAFT chỉ chuyển sang PUBLISHED khi đạt kiểm tra xuất bản.
- PUBLISHED có thể chuyển sang HIDDEN; tin HIDDEN có thể xuất bản lại sau khi kiểm tra.
- availability thay đổi độc lập với publishStatus.
- Xóa mềm đặt deletedAt/deletedBy; tin bị loại khỏi public và danh sách admin mặc định; admin có bộ lọc khôi phục.
- Không xóa ảnh vật lý ngay khi xóa mềm; giữ 90 ngày, purge sau phê duyệt và kiểm tra backup.

### 10.5. Truy vấn, chỉ mục và tính toàn vẹn

- Chỉ mục dự kiến: publishStatus + publishedAt; availability; priceVnd; areaM2; ward; updatedAt.
- Public query luôn áp dụng publishStatus = PUBLISHED ở backend; không tin bộ lọc do client tự gửi về quyền hiển thị.
- Danh sách chỉ trả dữ liệu thẻ và thumbnail; chi tiết mới lấy gallery đầy đủ.
- Có thể kết hợp bộ lọc theo khoảng giá/diện tích; giá trị min không được lớn hơn max.
- Nếu dùng cơ sở dữ liệu quan hệ, đặt khóa ngoại từ ảnh tới tin. Nếu dùng cơ sở dữ liệu tài liệu, kiểm tra tham chiếu ở service layer.

### 10.6. Quyết định cần đồng bộ lại Đợt 1

Các quy tắc về một tin/một phòng, trường bắt buộc xuất bản, kênh liên hệ, giới hạn ảnh, xóa mềm và quyền hiển thị địa chỉ đã được đồng bộ trong Requirements mục 8–9. Thay đổi các baseline này cần change request và cập nhật schema/API/acceptance.
## 11. Baseline dữ liệu production

Các quy tắc dưới đây là baseline triển khai cho bản đầu; các mục trước còn ghi “đề xuất/cần chốt” được hiểu là đã thống nhất theo các giá trị sau trừ khi chủ dự án duyệt thay đổi.

### 11.1. Một tin và địa chỉ

- Một RoomListing đại diện đúng một phòng thuê độc lập.
- Một tòa nhà/địa chỉ có nhiều phòng thì mỗi phòng có listing riêng, có thể dùng cùng building/address reference.
- MVP giới hạn vùng kinh doanh Bình Thạnh nhưng lưu regionId/district/ward theo cấu trúc mở rộng, không ghép toàn bộ vào một chuỗi.
- Lưu tách addressPublic (khu vực/phường hiển thị mặc định) và addressPrivate (địa chỉ đầy đủ nếu cần). API public chỉ trả địa chỉ đầy đủ khi allowExactAddress=true do admin bật.

### 11.2. Trường bắt buộc trước khi xuất bản

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| title | Có | 10–120 ký tự; văn bản thuần |
| description | Có | 30–5.000 ký tự; escape khi hiển thị |
| roomType | Có | Giá trị trong danh mục được quản lý |
| priceVndPerMonth | Có | Số nguyên dương |
| areaSqm | Có | Số > 0, tối đa 2 chữ số thập phân |
| addressPublic | Có | Khu vực/phường đủ để định vị |
| occupancyStatus | Có | AVAILABLE hoặc RENTED |
| contact channel | Có | Ít nhất một kênh hợp lệ được đánh dấu public |
| images | Có | Tối thiểu 1, tối đa 15 ảnh hợp lệ |
| publishStatus | Có | DRAFT/PUBLISHED/HIDDEN |

Backend kiểm tra lại toàn bộ quy tắc khi đổi publishStatus sang PUBLISHED. Lỗi trường không làm mất bản nháp hoặc thay đổi trạng thái hiện tại.

### 11.3. Ảnh và vòng đời lưu trữ

- Cho phép JPEG, PNG và WebP; tối đa 10 MB/tệp, tối đa 15 ảnh/listing.
- Kiểm tra chữ ký nội dung/MIME, kích thước file, tên tệp do hệ thống tạo; từ chối SVG, HTML, executable và định dạng không hỗ trợ.
- Tạo thumbnail và kích thước hiển thị; metadata gồm imageId, listingId, storageKey, mimeType, byteSize, width/height, sortOrder, isCover, createdAt.
- Ảnh chưa liên kết tin phải được dọn theo chính sách orphan; ảnh của tin soft-deleted vẫn giữ theo retention để có thể khôi phục.
- Xóa vật lý ảnh chỉ sau retention và không ảnh hưởng backup; thao tác phải theo chính sách lưu trữ.

### 11.4. Xóa mềm, retention và audit

- RoomListing có deletedAt/deletedBy hoặc cờ tương đương; bản ghi đã xóa mềm không xuất hiện ở public query.
- Admin có thể khôi phục; khi khôi phục, listing mặc định về DRAFT nếu không lưu trạng thái trước xóa an toàn.
- Không có purge vĩnh viễn trong luồng admin thường ngày.
- Ghi audit event tối thiểu cho login success/failure theo mức an toàn, create/update/publish/hide/soft-delete/restore, actorId, entityId, thời gian và loại thay đổi; không log mật khẩu, token, cookie, nội dung credential.
- Thời hạn retention của audit, backup và dữ liệu xóa cần chủ dự án xác nhận theo nhà cung cấp/ngân sách trước production.

### 11.5. Phân loại và tiếp xúc dữ liệu

| Loại | Ví dụ | Quyền |
|---|---|---|
| Public approved | tiêu đề, giá, diện tích, tiện nghi, ảnh, addressPublic, contactPublic được bật | public API |
| Private listing | addressPrivate, ghi chú quản trị, trạng thái xóa, audit metadata | admin/DB; không trả public |
| Credential/secret | password hash, session identifier, DB/storage secret | hệ thống hạn chế; không log hoặc trả API |
| Backup | snapshot DB và storage | tài khoản riêng/quyền hạn chế, mã hóa khi provider hỗ trợ |

Không thu thập tên/điện thoại/email của khách trong phiên bản đầu. Log web hạn chế giữ query string có thể chứa dữ liệu cá nhân.

### 11.6. Backup và truy vấn production

- Backup database và object storage mỗi ngày; giữ tối thiểu 7 bản ngày và 4 bản tuần, lưu tách failure domain.
- Mục tiêu RPO ≤24 giờ, RTO ≤1 ngày làm việc; kiểm tra khôi phục ít nhất trước go-live và định kỳ theo chính sách vận hành.
- Không xem trạng thái “backup job thành công” thay cho restore test.
- Public list phải phân trang; chỉ mục tối thiểu cho publishStatus, deletedAt, occupancyStatus, priceVndPerMonth, areaSqm, updatedAt và khóa vùng phù hợp truy vấn.
- Xóa cache/CDN khi publish/hide/status/ảnh thay đổi; bản public mới xuất hiện tối đa 60 giây sau khi save thành công.
- Mọi backup failure phải tạo cảnh báo đến đầu mối vận hành.

### 11.7. Điều cần Product Owner xác nhận

| Mã | Cần xác nhận | Mặc định thiết kế |
|---|---|---|
| DAT-01 | Có công khai địa chỉ chính xác không? | Không; chỉ khu vực/phường đến khi admin bật per listing. |
| DAT-02 | Email khôi phục admin | Một email thuộc chủ dự án, đã xác minh. |
| DAT-03 | Retention audit/deleted listing | Giữ 90 ngày trước purge, chỉ purge thủ công sau xác nhận; phải chốt trước triển khai vật lý. |
| DAT-04 | Quyền xử lý ảnh/nội dung | Chủ dự án xác nhận quyền sử dụng và chịu trách nhiệm nội dung. |
| DAT-05 | RPO/RTO và chi phí | Baseline 24 giờ/1 ngày làm việc, cần xác nhận provider support. |

