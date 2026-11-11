# 03 — Requirements

## 1. Quy ước

- **Must**: bắt buộc cho MVP.
- **Should**: nên có nếu không làm chậm hoặc ảnh hưởng ổn định.
- **Later**: yêu cầu cho giai đoạn sau.
- Mã yêu cầu được dùng để truy vết tới use case và kiểm thử nghiệm thu.

## 2. Yêu cầu nghiệp vụ

| Mã | Yêu cầu | Mức |
|---|---|---|
| BRQ-01 | Khách xem phòng không cần tạo tài khoản. | Must |
| BRQ-02 | Tin công khai thể hiện giá, địa chỉ/khu vực và tình trạng phòng. | Must |
| BRQ-03 | Chủ dự án tự quản lý nội dung qua khu admin. | Must |
| BRQ-04 | Backend kiểm tra quyền cho các thao tác thay đổi dữ liệu. | Must |
| BRQ-05 | MVP tập trung Bình Thạnh nhưng dữ liệu có thể mở rộng địa bàn. | Must |
| BRQ-06 | Khách liên hệ trực tiếp; website không xử lý giao dịch thuê trong MVP. | Must |

## 3. Yêu cầu chức năng

| Mã | Yêu cầu | Chi tiết/điều kiện | Ưu tiên |
|---|---|---|---|
| FR-01 | Danh sách phòng | Chỉ tin đã xuất bản; thẻ có ảnh, tiêu đề, giá/tháng, khu vực, diện tích, tình trạng. Có trạng thái rỗng. | Must |
| FR-02 | Tìm kiếm/lọc | Từ khóa/địa điểm; giá min/max; diện tích min/max; tình trạng. Có thể kết hợp bộ lọc. | Must |
| FR-03 | Phân trang | Không tải toàn bộ danh sách; giữ bộ lọc khi đổi trang/tải thêm. | Must |
| FR-04 | Chi tiết phòng | Ảnh, mô tả, loại phòng, nội thất/tiện nghi, giá, diện tích, địa chỉ, tình trạng, liên hệ. | Must |
| FR-05 | Liên hệ | Hiện nút gọi/Zalo khi trường tương ứng có giá trị hợp lệ. | Must |
| FR-06 | Đăng nhập admin | Một tài khoản ban đầu; đăng nhập/đăng xuất; không có đăng ký admin công khai. | Must |
| FR-07 | Quản lý tin | Tạo, xem, sửa, lưu nháp, xuất bản, ẩn và xóa. | Must |
| FR-08 | Quản lý ảnh | Nhiều ảnh, chọn ảnh bìa, đổi thứ tự, gỡ ảnh; kiểm tra loại và dung lượng. | Must |
| FR-09 | Trạng thái phòng | Đổi Còn trống/Đã thuê độc lập với trạng thái tin. | Must |
| FR-10 | Danh sách quản trị | Lọc theo trạng thái, xem ngày sửa, mở biểu mẫu chỉnh sửa. | Must |
| FR-11 | Tổng quan | Đếm tin theo trạng thái và phòng còn trống. | Should |
| FR-12 | Xóa mềm và khôi phục | Xác nhận trước khi xóa; gỡ khỏi public nhưng admin có thể khôi phục; purge vật lý theo retention và phê duyệt. | Must |

## 4. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu và cách xác nhận | Mức |
|---|---|---|---|
| NFR-01 | Di động | Nội dung chính dùng được ở màn hình khoảng 360 px; không tràn ngang ngoài thành phần có chủ ý. | Must |
| NFR-02 | Hiệu năng | Áp dụng điều kiện đo cụ thể tại NFR-13; lưu cấu hình và kết quả đo trước go-live. | Must |
| NFR-03 | Ảnh | Tạo ảnh phù hợp nhiều kích thước; tải lười cho ảnh dưới màn hình đầu; không gửi ảnh gốc quá lớn. | Must |
| NFR-04 | Bảo mật | HTTPS khi triển khai; mật khẩu không lưu dạng rõ; cookie/session an toàn; quyền kiểm tra ở backend; bí mật ngoài mã nguồn. | Must |
| NFR-05 | Tin cậy | Kiểm tra dữ liệu ở frontend và backend; lỗi lưu/tải được báo; không báo thành công khi thất bại. | Must |
| NFR-06 | Mở rộng | Tách chức năng phòng, ảnh, xác thực và địa chỉ; không khóa hệ thống vào một quận. | Should |
| NFR-07 | Khả năng dùng | Nhãn trường rõ, lỗi gần trường, nút dễ chạm, tương phản dễ đọc. | Must |
| NFR-08 | Tương thích | Kiểm tra trình duyệt di động và máy tính phổ biến trước phát hành. | Must |

## 5. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| RULE-01 | API công khai chỉ trả tin Đã xuất bản; tin Nháp/Đã ẩn không công khai. |
| RULE-02 | Tình trạng phòng: Còn trống/Đã thuê. Trạng thái tin: Nháp/Đã xuất bản/Đã ẩn. Hai trường độc lập. |
| RULE-03 | Tin đã thuê có thể giữ công khai nếu admin muốn, nhưng phải hiện nhãn Đã thuê. |
| RULE-04 | Giá thuê là số dương theo VND/tháng; diện tích là số dương theo m². |
| RULE-05 | Chỉ xuất bản khi đủ trường, một ảnh hợp lệ và một kênh liên hệ public theo điều kiện tại mục 8.2. |
| RULE-06 | Chỉ hiện thông tin liên hệ khi chủ dự án nhập và cho phép công khai. |
| RULE-07 | Xóa tin là thao tác khác với đánh dấu đã thuê hoặc ẩn tin. |

## 6. Ngoài phạm vi MVP

Đặt lịch/giữ phòng, đặt cọc, thanh toán, hợp đồng, quản lý người thuê, hóa đơn, chatbot, đánh giá, tài khoản khách, nhiều vai trò admin và đồng bộ nền tảng ngoài.

## 7. Truy vết

| Yêu cầu | Use case | Quy trình | Kiểm thử |
|---|---|---|---|
| FR-01—FR-05 | UC-01—UC-03 | Khách tìm và xem | AT-01—AT-05 |
| FR-06 | UC-04 | Đăng nhập admin | AT-06, AT-10 |
| FR-07—FR-10 | UC-05—UC-07 | Quản lý tin | AT-07—AT-09 |
| NFR-01—NFR-03 | UC-01—UC-03 | Duyệt di động | AT-11, AT-12 |
| NFR-04 | UC-04—UC-07 | Quyền truy cập | AT-10 |

Yêu cầu production ở mục 8 là baseline ưu tiên khi nội dung ở các mục trước còn dùng từ “đề xuất” hoặc “cân nhắc”. Các đầu vào do chủ dự án phải cung cấp/duyệt được liệt kê tại README và tài liệu 01; đây là điều kiện go-live, không làm mơ hồ quy tắc sản phẩm.
## 8. Baseline yêu cầu production — ràng buộc phát hành

Các yêu cầu dưới đây là baseline có tính bắt buộc cho đợt phát hành dùng thật. Nội dung này làm rõ hoặc thay thế những mục trước đây còn ghi “đề xuất/cân nhắc”, đặc biệt chính sách xóa mềm, điều kiện xuất bản và mục tiêu backup. Nếu nhà cung cấp hoặc ngân sách không đáp ứng, cần Product Owner chấp thuận phương án thay thế bằng văn bản trước khi phát triển.

### 8.1. Yêu cầu chức năng bổ sung

| Mã | Yêu cầu | Chi tiết nghiệm thu | Ưu tiên |
|---|---|---|---|
| FR-13 | Xem trước tin | Admin xem bản xem trước theo giao diện public trước xuất bản; bản xem trước chỉ admin đã xác thực truy cập. | Must |
| FR-14 | Xóa mềm và khôi phục | Xóa tin không xóa ngay vật lý; admin xác nhận, có thể khôi phục; tin đã xóa mềm và ảnh liên quan không xuất hiện public. | Must |
| FR-15 | Quản trị phiên | Admin đăng xuất được; phiên hết hạn; endpoint quản trị từ chối phiên không hợp lệ. | Must |
| FR-16 | Tài khoản khởi tạo an toàn | Tài khoản ban đầu được provision ngoài đăng ký public; mật khẩu tạm phải đổi khi kích hoạt hoặc cơ chế tương đương an toàn. | Must |
| FR-17 | Health check | Có endpoint kiểm tra readiness/liveness không tiết lộ bí mật hoặc trạng thái nhạy cảm chi tiết. | Must |
| FR-18 | Đồng bộ trạng thái public | Sau khi sửa tin đã xuất bản, cache/API public phản ánh bản lưu thành công trong tối đa 60 giây. | Must |
| FR-19 | Dấu thời gian nội dung | Trang chi tiết hoặc danh sách admin thể hiện thời điểm cập nhật gần nhất để admin nhận diện tin cũ. | Should |

### 8.2. Điều kiện xuất bản chuẩn

Một tin chỉ được chuyển sang Đã xuất bản khi đáp ứng tất cả điều kiện:

1. Tiêu đề 10–120 ký tự; mô tả 30–5.000 ký tự.
2. Giá thuê VND/tháng là số nguyên dương; diện tích m² là số lớn hơn 0.
3. Có địa chỉ/khu vực đủ để khách định vị; trường địa chỉ công khai được tách theo chính sách riêng tư.
4. Có tình trạng phòng hợp lệ; loại phòng; ít nhất một ảnh hợp lệ.
5. Có ít nhất một kênh liên hệ đã được admin cho phép công khai; kênh đó được kiểm tra định dạng.
6. Ảnh thuộc JPEG/PNG/WebP, tối đa 10 MB mỗi ảnh và tối đa 15 ảnh cho một tin; hệ thống xử lý ảnh trước khi public.
7. Backend thực hiện cùng quy tắc kiểm tra; không chỉ dựa vào validation phía trình duyệt.
8. Nếu thiếu trường, API từ chối chuyển trạng thái và trả lỗi theo trường; trạng thái hiện hữu không đổi.

### 8.3. Yêu cầu phi chức năng production bổ sung

| Mã | Nhóm | Baseline và cách xác nhận | Ưu tiên |
|---|---|---|---|
| NFR-09 | Production | Truy cập qua domain do chủ dự án kiểm soát và HTTPS hợp lệ; không dùng localhost hoặc địa chỉ staging để nghiệm thu. | Must |
| NFR-10 | Khả dụng | Mục tiêu thiết kế 99% theo tháng, không tính bảo trì đã thông báo; đo bằng uptime monitor bên ngoài nếu nhà cung cấp cho phép. Đây là mục tiêu sản phẩm, không phải cam kết SLA. | Must |
| NFR-11 | Backup/restore | Backup database và ảnh hàng ngày; giữ tối thiểu 7 bản ngày và 4 bản tuần ở vị trí không cùng một failure domain; thử restore thành công trước go-live. RPO ≤24h, RTO ≤1 ngày làm việc. | Must |
| NFR-12 | Giám sát | Có readiness/liveness check, ghi log lỗi máy chủ và thao tác admin trọng yếu; cảnh báo đến đầu mối được chỉ định khi ứng dụng/backup lỗi. Không log mật khẩu, session cookie, token hay secret. | Must |
| NFR-13 | Hiệu năng có điều kiện đo | Trang danh sách nội dung chính p75 ≤3 giây qua 5 lần chạy trên thiết bị di động đại diện, mạng 4G được giới hạn nhất quán, production-like dataset 500 tin, mỗi tin tối đa 3 ảnh tối ưu trong lượt đầu. Ghi thiết bị, mạng, vùng triển khai và kết quả. | Must |
| NFR-14 | Bảo vệ dữ liệu | Public API chỉ trả trường cho phép; database chỉ nhận kết nối từ backend/địa chỉ được cho phép; ảnh/tin chưa duyệt không thể truy cập từ public. | Must |
| NFR-15 | Bàn giao | Có hướng dẫn đăng nhập, quản lý tin, cập nhật ảnh, quản lý domain/dịch vụ, backup/restore, rollback, nhận cảnh báo và đầu mối hỗ trợ. | Must |
| NFR-16 | Tương thích | Kiểm tra luồng chính trên trình duyệt di động hiện hành và desktop phổ biến; responsive từ 360 px đến 1440 px trở lên. | Must |
| NFR-17 | Tính riêng tư địa chỉ | Admin kiểm soát riêng mức công khai địa chỉ theo tin; mặc định công khai khu vực/phường, không trả địa chỉ chi tiết nếu chưa được cho phép. | Must |
| NFR-18 | Accessibility cơ bản | Semantic heading/form, focus nhìn thấy, thao tác bàn phím cho luồng chính, text contrast đủ đọc, ảnh có alt phù hợp. | Should |

## 9. Quyết định nghiệp vụ baseline được khóa

| Mã | Quyết định |
|---|---|
| RULE-08 | Một tin mô tả một phòng cho thuê độc lập; nhiều phòng trong cùng nhà là nhiều tin, trừ khi chủ dự án thay đổi nghiệp vụ sau này. |
| RULE-09 | Public chỉ trả tin Đã xuất bản và chưa xóa mềm; phòng Đã thuê có thể hiện công khai nếu admin chọn giữ tin và phải có nhãn Đã thuê. |
| RULE-10 | Mặc định chỉ công khai khu vực/phường; địa chỉ chi tiết và liên hệ chỉ public khi admin bật quyền hiển thị cho tin đó. |
| RULE-11 | Xóa trong giao diện là xóa mềm có xác nhận và khôi phục được; purge vật lý chỉ theo chính sách lưu trữ/retention. |
| RULE-12 | Không có tự đăng ký admin; chỉ chủ dự án hoặc cơ chế provisioning được kiểm soát cấp tài khoản. |
| RULE-13 | Không có thay đổi dữ liệu production không xác thực; tất cả quyền ghi được xác minh server-side. |

## 10. Cập nhật truy vết production

| Yêu cầu | Use case/quy trình | Kiểm thử/acceptance |
|---|---|---|
| FR-13, FR-14 | UC-05, UC-06, UC-09 | AT-30—AT-33 |
| FR-15, FR-16 | UC-04, UC-10 | AT-34—AT-35 |
| FR-17, NFR-10, NFR-12 | Quy trình vận hành | AT-36, AT-37 |
| NFR-09, NFR-11, NFR-15 | Phát hành/bàn giao | AT-38—AT-41 |
| NFR-13, NFR-16—NFR-18 | Duyệt đa thiết bị/hiệu năng/riêng tư | AT-42—AT-45 |
| RULE-08—RULE-13 | Tạo/cập nhật/quản trị tin | AT-17, AT-20, AT-23, AT-25, AT-30, AT-32 |
| NFR-14 | UC-10, UC-11 | Quyền database và quản lý secret | AT-48 |
| NFR-10—NFR-12 | UC-10, UC-11 | Theo dõi và ứng phó sự cố | AT-36—AT-39, AT-47, AT-49 |

