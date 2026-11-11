# 05 — Business Process

## 1. Mục tiêu và quy trình hiện tại

Tài liệu mô tả cách chủ dự án đăng/cập nhật phòng và cách khách sử dụng thông tin. Hiện tại, nội dung phòng có thể nằm trong ghi chú, bảng tính hoặc nhiều bài đăng riêng. Khi giá hoặc tình trạng đổi, phải nhớ sửa từng nơi; khách có thể đọc tin cũ. MVP gom việc quản lý tin vào một nơi.

## 2. Quy trình mục tiêu

### 2.1. Tạo và xuất bản phòng

1. Chủ dự án chuẩn bị thông tin, giá và ảnh.
2. Đăng nhập khu admin.
3. Tạo tin và nhập các trường cần thiết.
4. Hệ thống kiểm tra giá, diện tích, địa chỉ, nội dung và ảnh.
5. Admin lưu nháp để rà soát hoặc xuất bản.
6. Backend đưa tin Đã xuất bản vào kết quả công khai.
7. Khách xem danh sách/chi tiết và liên hệ trực tiếp.

### 2.2. Cập nhật phòng đã thuê

1. Chủ dự án xác nhận phòng đã có người thuê.
2. Mở tin và đổi tình trạng thành Đã thuê.
3. Chọn giữ tin công khai với nhãn Đã thuê hoặc chuyển tin sang Đã ẩn.
4. Hệ thống lưu riêng tình trạng phòng và trạng thái tin.
5. Khách xem dữ liệu mới sau khi trang/API tải lại.

### 2.3. Phòng sẵn sàng cho thuê lại

Admin đổi tình trạng về Còn trống, kiểm tra lại giá/nội dung/ảnh, sau đó xuất bản tin nếu tin đang nháp hoặc ẩn. Hệ thống không tự đổi trạng thái theo thời gian.

## 3. Vai trò theo bước

| Bước | Chủ dự án/admin | Hệ thống | Khách |
|---|---|---|---|
| Chuẩn bị tin | Nhập nội dung, giá, ảnh | Kiểm tra dữ liệu | — |
| Xuất bản | Xác nhận | Lưu và công khai tin hợp lệ | — |
| Tìm phòng | — | Lọc tin đã xuất bản | Chọn tiêu chí |
| Liên hệ | Nhận cuộc gọi/Zalo ngoài hệ thống | Hiển thị liên hệ | Gọi hoặc nhắn |
| Đổi tình trạng | Cập nhật và quyết định giữ/ẩn | Đồng bộ dữ liệu công khai | Xem nhãn mới |

## 4. Điểm kiểm soát

- Không xuất bản tin thiếu trường bắt buộc đã thống nhất.
- Thay đổi chỉ báo thành công sau khi đã lưu.
- Tin ẩn/nháp không được API công khai trả về.
- Tin Đã thuê vẫn có thể công khai nếu admin chọn, nhưng phải có nhãn rõ.
- Thao tác xóa phải có xác nhận; xóa không thay cho trạng thái Đã thuê.
- Ghi nhận thời điểm tạo và cập nhật để admin biết tin cũ.

## 5. Ngoại lệ và xử lý

| Tình huống | Xử lý |
|---|---|
| Thiếu trường bắt buộc | Không xuất bản; đánh dấu trường cần bổ sung. |
| Ảnh sai định dạng/quá lớn | Từ chối ảnh lỗi, nêu lý do, giữ các ảnh hợp lệ. |
| Mất mạng khi lưu | Báo chưa lưu; giữ dữ liệu biểu mẫu nếu có thể; cho thử lại. |
| Tin bị ẩn khi khách đang xem | Lần tải tiếp theo không lấy nội dung ẩn; có trang không tìm thấy phù hợp. |
| Admin quên cập nhật tình trạng | Làm trạng thái dễ nhìn trong danh sách admin; nhắc rà soát là tính năng sau MVP. |

## 6. Vòng đời trạng thái

- Trạng thái tin: **Nháp → Đã xuất bản → Đã ẩn**. Tin ẩn có thể xuất bản lại sau khi rà soát.
- Tình trạng phòng: **Còn trống ↔ Đã thuê**. Chỉ admin thay đổi.
- Hai vòng đời độc lập. Một phòng có thể Đã thuê nhưng tin vẫn Đã xuất bản; API công khai chỉ dựa vào trạng thái tin để quyết định có trả tin hay không.
- Xóa là hành động riêng; chính sách xóa mềm hay xóa vĩnh viễn chốt trong thiết kế dữ liệu.

## 7. Cải tiến sau MVP

Có thể cân nhắc nhật ký thay đổi, nhắc rà soát tin lâu ngày, nhập dữ liệu từ bảng tính và báo cáo lượt xem sau khi xác định nhu cầu thực tế.
## 8. Quy trình production và vận hành sau phát hành

### 8.1. Chuẩn bị go-live

1. Product Owner xác nhận domain/DNS, nhà cung cấp, ngân sách, người nhận cảnh báo và đầu mối hỗ trợ.
2. Admin chuẩn bị dữ liệu thật: tiêu đề, mô tả, giá, diện tích, tiện nghi, ảnh có quyền sử dụng, mức công khai địa chỉ và số điện thoại/Zalo.
3. Nhóm triển khai xác nhận staging và production tách biệt, bí mật cấu hình, database riêng, kho ảnh, HTTPS, log và health check.
4. Tạo backup baseline trước khi nhập dữ liệu production.
5. Provision admin qua quy trình an toàn; xác nhận chủ dự án đăng nhập/đổi mật khẩu hoặc kích hoạt cơ chế xác thực.
6. Chạy toàn bộ cổng release ở tài liệu 10; lỗi bảo mật, dữ liệu riêng tư, mất dữ liệu hoặc lỗi chặn luồng khách là lỗi chặn go-live.
7. Chủ dự án duyệt dữ liệu hiển thị, thời điểm phát hành và phương án rollback.

### 8.2. Phát hành và smoke check

1. Triển khai một phiên bản đã được gắn nhãn release.
2. Kiểm tra HTTPS/domain, public home/list/detail, lọc, admin login, tạo/sửa tin, upload ảnh và đổi trạng thái.
3. Xác minh tin nháp/ẩn/xóa mềm không public; kiểm tra public response không có trường riêng tư.
4. Kiểm tra health check, nhật ký lỗi và cảnh báo backup.
5. Nếu smoke check đạt, xác nhận phát hành; nếu không đạt cổng bắt buộc, rollback theo runbook và thông báo Product Owner.
6. Lưu release note, kết quả AT, bản backup trước phát hành và người xác nhận.

### 8.3. Vận hành thường ngày/định kỳ

| Tần suất | Công việc | Người chịu trách nhiệm |
|---|---|---|
| Khi có thay đổi | Cập nhật tình trạng Còn trống/Đã thuê ngay sau khi chủ dự án xác nhận. | Admin |
| Hàng tuần | Rà soát tin đang public, giá, tình trạng, ảnh và kênh liên hệ. | Admin |
| Hàng ngày tự động | Backup database và ảnh; health/uptime check; lưu log theo chính sách. | Hệ thống/nhà cung cấp |
| Hàng tuần | Kiểm tra kết quả backup và dung lượng lưu ảnh. | Chủ dự án hoặc người được giao |
| Hàng tháng | Xem cảnh báo, chi phí dịch vụ, tài khoản có quyền truy cập và trạng thái cập nhật bảo mật. | Chủ dự án |
| Theo sự cố | Dùng runbook để ứng phó, khôi phục, ghi nhận và đánh giá sau sự cố. | Chủ dự án + người hỗ trợ |

### 8.4. Quy trình khôi phục/rollback

- Phát hiện và ghi thời điểm bắt đầu, ảnh hưởng và người phụ trách.
- Ngăn thao tác làm nặng thêm; giữ nguyên dữ liệu/log hiện có.
- Nếu lỗi do release, rollback ứng dụng về bản ổn định trước; không tự động rollback schema phá hủy dữ liệu.
- Nếu lỗi dữ liệu, phục hồi từ backup vào môi trường kiểm chứng trước; so sánh tính nhất quán rồi mới chuyển traffic.
- Mục tiêu ban đầu: RPO ≤24 giờ, RTO ≤1 ngày làm việc; ghi kết quả thực tế sau mỗi lần diễn tập/sự cố.
- Sau khôi phục, chạy AT smoke, xác minh public/admin, xác nhận chủ dự án và cập nhật runbook.

## 9. Điểm kiểm soát production

- Không xuất bản tin khi thiếu dữ liệu bắt buộc, ảnh hợp lệ hoặc kênh liên hệ công khai được duyệt.
- Không để phòng Đã thuê bị trình bày như còn trống; nếu tin vẫn public phải hiện nhãn rõ.
- Địa chỉ chi tiết chỉ hiện khi admin bật rõ ràng.
- Không xóa vĩnh viễn dữ liệu bằng thao tác quản trị thường ngày.
- Không thay đổi DNS, credential hoặc cấu hình backup mà không có chủ dự án phê duyệt.
- Mọi release production phải có người duyệt, backup phù hợp, smoke check và phương án rollback.
- Gián đoạn hoặc nghi ngờ lộ dữ liệu phải báo đầu mối đã chỉ định; không chỉ xử lý ngầm.

