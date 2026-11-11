# 04 — Use Case

## 1. Tác nhân

- **Khách vãng lai**: xem, tìm, lọc và liên hệ về tin đã xuất bản; không đăng nhập.
- **Chủ dự án/Admin**: đăng nhập, quản lý tin, ảnh và tình trạng phòng.
- **Dịch vụ lưu ảnh**: tích hợp kỹ thuật tùy chọn khi tải ảnh.

## 2. Danh sách use case

| Mã | Use case | Tác nhân | Mức |
|---|---|---|---|
| UC-01 | Xem danh sách phòng | Khách | Must |
| UC-02 | Tìm kiếm và lọc | Khách | Must |
| UC-03 | Xem chi tiết và liên hệ | Khách | Must |
| UC-04 | Đăng nhập/đăng xuất | Admin | Must |
| UC-05 | Tạo và xuất bản tin | Admin | Must |
| UC-06 | Sửa nội dung và ảnh | Admin | Must |
| UC-07 | Đổi tình trạng/trạng thái tin | Admin | Must |
| UC-08 | Xem tổng quan số lượng tin | Admin | Should |
| UC-09 | Xóa mềm và khôi phục tin | Admin | Must |
| UC-10 | Phát hành và xác nhận production | Chủ dự án/Admin, nhóm phát triển | Must |
| UC-11 | Khôi phục sau sự cố dữ liệu/dịch vụ | Chủ dự án, người hỗ trợ kỹ thuật | Must |

## 3. Quan hệ use case

Khách: UC-01 → UC-02 (tùy chọn) → UC-03 → liên hệ trực tiếp.

Admin: UC-04 → UC-05/UC-06/UC-07/UC-09 → kiểm tra kết quả trên trang công khai. UC-08 là lối tắt quản trị tùy chọn. Chủ dự án thực hiện UC-10 trước go-live và UC-11 khi có sự cố cần khôi phục.

## 4. Đặc tả

### UC-01 — Xem danh sách phòng

**Mục tiêu:** Xem nhanh các tin đang công khai.

**Tiền điều kiện:** Website truy cập được; danh sách có thể có hoặc chưa có tin.

**Luồng chính:**
1. Khách mở trang chủ hoặc /rooms.
2. Hệ thống chỉ lấy tin Đã xuất bản; mặc định ưu tiên phòng Còn trống.
3. Mỗi thẻ hiển thị ảnh bìa, tiêu đề, giá/tháng, khu vực, diện tích, tình trạng.
4. Khách chọn tin để mở UC-03.

**Ngoại lệ:** Không có tin thì hiển thị trạng thái rỗng và gợi ý đổi tiêu chí; lỗi mạng thì thông báo và cho thử lại.

**Hậu điều kiện:** Không thay đổi dữ liệu.

### UC-02 — Tìm kiếm và lọc

**Mục tiêu:** Thu hẹp danh sách theo nhu cầu.

**Tiền điều kiện:** Khách đang ở trang danh sách.

**Luồng chính:** Khách nhập từ khóa/khu vực, giá, diện tích hoặc tình trạng; áp dụng bộ lọc; hệ thống kiểm tra giá trị và trả kết quả phù hợp; khách có thể sửa hoặc xóa bộ lọc.

**Ngoại lệ:** Giá min lớn hơn max hoặc giá trị không hợp lệ thì báo lỗi tại trường tương ứng; không có kết quả thì giữ bộ lọc và báo rõ.

### UC-03 — Xem chi tiết và liên hệ

**Mục tiêu:** Đánh giá phòng và liên hệ người đăng.

**Tiền điều kiện:** Tin tồn tại và đã xuất bản.

**Luồng chính:** Hệ thống hiển thị ảnh, mô tả, giá, địa chỉ, diện tích, nội thất/tiện nghi, tình trạng và thông tin liên hệ được công khai. Khách chọn gọi hoặc mở Zalo nếu có.

**Ngoại lệ:** Tin không tồn tại/đã ẩn thì hiển thị trang không tìm thấy; không hiện nút liên hệ cho dữ liệu trống.

### UC-04 — Đăng nhập và đăng xuất

**Tiền điều kiện:** Chủ dự án đã được cấp tài khoản.

**Luồng chính:** Admin nhập thông tin; backend xác thực; nếu hợp lệ, tạo phiên và chuyển vào dashboard. Khi đăng xuất, phiên bị kết thúc.

**Ngoại lệ:** Sai thông tin thì báo lỗi chung, không tiết lộ email/tài khoản tồn tại; yêu cầu chưa đăng nhập vào API quản trị bị từ chối.

### UC-05 — Tạo và xuất bản tin

**Tiền điều kiện:** Admin đã đăng nhập.

**Luồng chính:** Admin nhập tiêu đề, mô tả, giá, diện tích, địa chỉ, tiện nghi, liên hệ và ảnh; chọn Lưu nháp hoặc Xuất bản. Backend xác thực và lưu. Tin xuất hiện công khai sau khi xuất bản hợp lệ.

**Ngoại lệ:** Thiếu trường thì chỉ rõ lỗi; ảnh sai loại/quá dung lượng thì từ chối ảnh đó; lỗi lưu không được báo thành công và nên giữ dữ liệu đã nhập.

### UC-06 — Sửa tin và ảnh

**Tiền điều kiện:** Admin đã đăng nhập; tin còn tồn tại.

**Luồng chính:** Admin mở tin, thay trường/ảnh, xem trước và lưu. Hệ thống cập nhật ngày sửa; nếu đang xuất bản thì nội dung mới được dùng trên trang công khai.

**Ngoại lệ:** Tin không tồn tại thì báo lỗi; lỗi lưu không được làm mất thay đổi chưa lưu.

### UC-07 — Cập nhật trạng thái

**Tiền điều kiện:** Admin đã đăng nhập; tin tồn tại.

**Luồng chính:** Admin đổi Còn trống/Đã thuê độc lập với Nháp/Đã xuất bản/Đã ẩn. Hệ thống lưu riêng hai trạng thái. Nếu vẫn xuất bản, trang công khai hiển thị nhãn tình trạng.

**Ngoại lệ:** Thiếu trường xuất bản bắt buộc thì không cho chuyển sang Đã xuất bản và hướng dẫn bổ sung.

### UC-08 — Xem tổng quan

**Tiền điều kiện:** Admin đã đăng nhập.

**Luồng chính:** Dashboard hiển thị tổng tin, tin đang xuất bản và số phòng Còn trống/Đã thuê; dữ liệu rỗng hiển thị bằng 0.

## 5. Quy tắc chung

- Mọi API quản trị kiểm tra phiên ở backend.
- Khách chỉ nhận dữ liệu công khai; không dựa vào việc ẩn nút trên giao diện để bảo vệ quyền.
- Xóa tin là xóa mềm có xác nhận và có thể khôi phục; purge vật lý không thuộc thao tác admin thông thường.
- Không ghi mật khẩu hoặc token vào log.
## 6. Use case bổ sung cho phát hành production

### UC-09 — Xóa mềm và khôi phục tin

| Thuộc tính | Nội dung |
|---|---|
| Tác nhân chính | Admin |
| Mục tiêu | Gỡ tin khỏi public nhưng giữ khả năng khôi phục khi xóa nhầm. |
| Tiền điều kiện | Admin đã đăng nhập; tin thuộc hệ thống và chưa bị xóa mềm. |
| Kích hoạt | Admin chọn Xóa ở danh sách hoặc chi tiết tin. |

Luồng chính:
1. Hệ thống hiển thị xác nhận có tiêu đề/mã tin và giải thích tin sẽ bị gỡ khỏi trang công khai nhưng có thể khôi phục.
2. Admin xác nhận.
3. Backend kiểm tra phiên, quyền và trạng thái; đặt deletedAt/deletedBy hoặc cờ tương đương.
4. Tin không còn xuất hiện trong danh sách public, tìm kiếm, chi tiết public hay sitemap/cache.
5. Admin có thể lọc danh sách đã lưu trữ và chọn Khôi phục.
6. Backend bỏ cờ xóa mềm; trạng thái xuất bản trước lúc xóa được khôi phục theo quy tắc đã lưu hoặc về Nháp nếu chính sách an toàn yêu cầu.
7. Hệ thống ghi log thao tác, không ghi bí mật.

Ngoại lệ:
- Admin hủy xác nhận: không thay đổi dữ liệu.
- Phiên hết hạn: từ chối thao tác và yêu cầu đăng nhập lại.
- Tin đã bị xóa mềm ở tab khác: trả conflict/not found phù hợp, giao diện tải lại dữ liệu.
- Xóa vật lý: không có trong thao tác thông thường; chỉ qua chính sách retention, backup và xác nhận chủ dự án.

### UC-10 — Phát hành và xác nhận sẵn sàng production

| Thuộc tính | Nội dung |
|---|---|
| Tác nhân chính | Chủ dự án/Product Owner |
| Tác nhân hỗ trợ | Nhóm phát triển/bảo trì, nhà cung cấp hạ tầng |
| Mục tiêu | Đưa website từ staging lên tên miền thật và bàn giao vận hành. |
| Tiền điều kiện | Chức năng Must hoàn tất; chủ dự án đã cấp domain/DNS, tài khoản dịch vụ, dữ liệu thật và ngân sách; AT không còn lỗi chặn phát hành. |
| Kích hoạt | Chủ dự án duyệt lịch go-live. |

Luồng chính:
1. Nhóm phát triển sao lưu production hiện hữu nếu đây là lần cập nhật.
2. Triển khai release đã được nghiệm thu lên production bằng quy trình kiểm soát.
3. Xác minh HTTPS, DNS, health check, kết nối database và kho ảnh.
4. Provision admin an toàn; không dùng tài khoản/mật khẩu demo.
5. Nhập hoặc kích hoạt tin thật đã được chủ dự án duyệt; xác nhận mức công khai địa chỉ/liên hệ.
6. Thực hiện smoke check trang public, chi tiết, lọc, đăng nhập, cập nhật tin và upload ảnh.
7. Kiểm tra log/cảnh báo và kết quả backup; xác nhận rollback có thể thực hiện.
8. Chủ dự án ký nghiệm thu, nhận quyền sở hữu dịch vụ và runbook.

Điều kiện dừng/rollback:
- HTTPS hoặc DNS lỗi, dữ liệu public sai/lộ tin ẩn, admin không truy cập được, backup/restore chưa chứng minh được, lỗi bảo mật nghiêm trọng hoặc lỗi chặn hành trình khách.
- Khôi phục release trước hoặc đưa trang bảo trì theo runbook; thông báo chủ dự án và lưu thời điểm/sự cố.

### UC-11 — Khôi phục sau sự cố dữ liệu/dịch vụ

| Thuộc tính | Nội dung |
|---|---|
| Tác nhân chính | Chủ dự án |
| Thực hiện kỹ thuật | Người được chủ dự án ủy quyền |
| Mục tiêu | Khôi phục ứng dụng, database hoặc ảnh theo mục tiêu RPO/RTO. |

1. Xác nhận phạm vi ảnh hưởng và dừng thao tác có thể làm hỏng thêm dữ liệu.
2. Thông báo người nhận sự cố đã được chỉ định.
3. Chọn backup sạch gần nhất; không ghi đè bản backup gốc.
4. Khôi phục database/ảnh vào môi trường phục hồi an toàn và kiểm tra tính nhất quán.
5. Chủ dự án phê duyệt chuyển traffic hoặc dùng dữ liệu đã phục hồi.
6. Chạy smoke test, xác nhận nội dung và ghi biên bản thời gian khôi phục.
7. Tạo follow-up để xử lý nguyên nhân, khóa quyền truy cập bị lộ và cập nhật runbook.

## 7. Quy tắc chung production

- Tất cả Use Case admin cần phiên hợp lệ và kiểm tra quyền ở backend.
- Public chỉ xem tin đã xuất bản, chưa xóa mềm; mức địa chỉ/liên hệ tuân theo cấu hình công khai.
- Hành động ghi có trạng thái thành công chỉ sau khi backend lưu thành công.
- Dữ liệu production và staging phải tách biệt.
- Hệ thống dùng tiếng Việt; giá VND/tháng, diện tích m² và múi giờ Asia/Ho_Chi_Minh cho thời gian hiển thị.
- Các Use Case UC-10/UC-11 là hoạt động phát hành/vận hành, không phải tính năng thao tác thường ngày của khách.

