# Tóm tắt BA — Website phòng trọ Bình Thạnh

## Mục tiêu sản phẩm

Xây dựng website responsive quản lý và giới thiệu phòng trọ để chủ dự án cá nhân có thể tự cập nhật tin, còn khách vãng lai có thể xem phòng bằng điện thoại hoặc máy tính mà không cần đăng nhập.

## Định nghĩa hoàn tất của yêu cầu “dùng ngay”

Sản phẩm chỉ sẵn sàng dùng thật sau khi website được triển khai trên tên miền production có HTTPS, có dữ liệu/ảnh/kênh liên hệ thật đã duyệt, tài khoản admin được bàn giao an toàn, database và ảnh có backup, health check/log lỗi cơ bản hoạt động, đã thử restore và tất cả cổng nghiệm thu production đạt. Dịch vụ hosting, domain, lưu trữ ảnh và bảo trì tiếp tục cần ngân sách định kỳ.

## Vai trò và phạm vi

| Vai trò | Quyền chính |
|---|---|
| Khách vãng lai | Xem danh sách/chi tiết tin đã xuất bản, tìm/lọc, gọi hoặc mở Zalo nếu được cung cấp. |
| Chủ dự án/admin | Đăng nhập; tạo, sửa, xem trước, xuất bản, ẩn, cập nhật tình trạng, lưu trữ/khôi phục tin và quản lý ảnh. |

Phiên bản đầu dành cho một admin và khu vực Bình Thạnh. Không bao gồm tài khoản khách, đặt lịch, giữ chỗ, thanh toán, hợp đồng, người thuê, hóa đơn, chat, nhiều chủ nhà hoặc phân quyền nhiều cấp.

## Baseline nghiệp vụ

- Tin phòng và trạng thái thuê là hai thông tin độc lập.
- Trang public chỉ trả tin đã xuất bản; draft/ẩn/xóa mềm không lộ qua giao diện hay API công khai.
- Mỗi tin đại diện một phòng cho thuê độc lập.
- Chỉ công khai địa chỉ/liên hệ theo chính sách chủ dự án duyệt.
- Chỉ xuất bản tin khi đủ dữ liệu tối thiểu và ít nhất một ảnh đã được kiểm tra.
- Mục tiêu vận hành đề xuất: nội dung chính danh sách p75 ≤3 giây trong điều kiện kiểm thử đã ghi; backup hàng ngày; mục tiêu RPO ≤24 giờ và RTO ≤1 ngày làm việc.

## Bộ hồ sơ chi tiết

Đọc [README bộ tài liệu BA](<./README.md>) để vào 11 tài liệu theo 3 đợt: phân tích nghiệp vụ, phân tích thiết kế và chuẩn bị phát triển. Tài liệu 01 định nghĩa phạm vi/go-live; tài liệu 10 là cổng nghiệm thu; tài liệu 11 quản lý phát hành, thay đổi và sự cố.

## Điều kiện còn thuộc chủ dự án

Cần có domain/DNS, quyền và ngân sách hạ tầng, nội dung thật, ảnh có quyền sử dụng, quyết định mức độ công khai địa chỉ, email khôi phục admin, người nhận cảnh báo và xác nhận backup/khôi phục. Các mục này là đầu vào go-live, không thể được thay bằng dữ liệu demo.

Phiên bản: 2.0 — Production baseline. Ngày cập nhật: 08/11/2026.
