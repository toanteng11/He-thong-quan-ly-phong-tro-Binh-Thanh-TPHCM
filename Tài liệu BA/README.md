# Bộ tài liệu BA production cho website phòng trọ Bình Thạnh

## Mục đích

Bộ tài liệu xác định yêu cầu để xây dựng, triển khai và bàn giao một website quản lý/giới thiệu phòng trọ dùng thật. Khách truy cập công khai không cần tài khoản; chủ dự án đăng nhập vào khu admin. Website phải dùng được trên điện thoại và máy tính, có tên miền HTTPS, dữ liệu thật, sao lưu và hướng dẫn vận hành khi nghiệm thu.

Tài liệu mô tả sản phẩm web responsive, không phải ứng dụng native cài qua App Store/Google Play. “Có thể sử dụng ngay” nghĩa là hoàn thành phát triển, triển khai production, nhập nội dung thật, cấp admin an toàn và vượt các cổng nghiệm thu. Dịch vụ hosting, tên miền, lưu trữ ảnh và bảo trì vẫn có chi phí/vận hành định kỳ.

## Chuẩn production áp dụng

- Phạm vi đầu tiên: tin phòng do một chủ dự án quản lý tại khu vực Bình Thạnh, TP.HCM.
- Có hai khu vực: trang public chỉ đọc và khu admin xác thực ở backend.
- Trang public không yêu cầu tài khoản; không có đăng ký admin công khai.
- Website responsive cho điện thoại, máy tính bảng và máy tính.
- Production sử dụng tên miền và HTTPS, dữ liệu thật, storage/database thật, không dùng dữ liệu demo.
- Database không mở ra Internet công khai; ảnh được kiểm tra/giới hạn và lưu ở nơi có chính sách backup rõ.
- Backup mục tiêu hàng ngày, giữ 7 bản ngày + 4 bản tuần; RPO mục tiêu ≤24 giờ, RTO mục tiêu ≤1 ngày làm việc. Cần chủ dự án xác nhận khả năng chi trả và nhà cung cấp hỗ trợ.
- Nội dung danh sách hướng tới tải nội dung chính p75 ≤3 giây trên cấu hình mạng di động được ghi nhận khi nghiệm thu.
- Có health check, log lỗi, cảnh báo tối thiểu, runbook, quy trình backup/restore và rollback.
- Không đưa bí mật production vào mã nguồn hoặc frontend.

Các mục tiêu hiệu năng, khả dụng và phục hồi là yêu cầu nghiệm thu của sản phẩm, không phải cam kết thay cho SLA của nhà cung cấp.

## Điều kiện chủ dự án cần cung cấp

Trước khi phát hành production, chủ dự án cần cấp/duyệt:

- Tên miền, quyền DNS, người sở hữu tài khoản hạ tầng và ngân sách dịch vụ định kỳ.
- Nội dung tin thật: giá, diện tích, địa chỉ/khu vực, mô tả, tiện nghi, ảnh có quyền sử dụng và kênh liên hệ.
- Quyết định địa chỉ đầy đủ hay chỉ khu vực/phường được hiển thị.
- Tài khoản admin ban đầu và email khôi phục nếu chọn cơ chế khôi phục qua email.
- Chính sách xóa/lưu trữ và chấp nhận mục tiêu backup/khôi phục.
- Người nhận cảnh báo, đầu mối hỗ trợ và người xác nhận nghiệm thu.

Thiếu các đầu vào này thì có thể hoàn thiện trên staging, nhưng chưa được xem là đã sẵn sàng production.

## Cấu trúc tài liệu

### Đợt 1 — Phân tích nghiệp vụ
- [01_Project_Overview](<./Đợt 1 - Phân tích nghiệp vụ/01_Project_Overview.md>)
- [02_Stakeholder_Analysis](<./Đợt 1 - Phân tích nghiệp vụ/02_Stakeholder_Analysis.md>)
- [03_Requirements](<./Đợt 1 - Phân tích nghiệp vụ/03_Requirements.md>)
- [04_Use_Case](<./Đợt 1 - Phân tích nghiệp vụ/04_Use_Case.md>)
- [05_Business_Process](<./Đợt 1 - Phân tích nghiệp vụ/05_Business_Process.md>)

### Đợt 2 — Phân tích thiết kế
- [06_Data_Analysis](<./Đợt 2 - Phân tích thiết kế/06_Data_Analysis.md>)
- [07_UI_UX_Design](<./Đợt 2 - Phân tích thiết kế/07_UI_UX_Design.md>)
- [08_System_Architecture](<./Đợt 2 - Phân tích thiết kế/08_System_Architecture.md>)

### Đợt 3 — Chuẩn bị phát triển
- [09_API_Specification](<./Đợt 3 - Chuẩn bị phát triển/09_API_Specification.md>)
- [10_Testing_Acceptance](<./Đợt 3 - Chuẩn bị phát triển/10_Testing_Acceptance.md>)
- [11_Change_Management](<./Đợt 3 - Chuẩn bị phát triển/11_Change_Management.md>)

### Tài liệu triển khai Scrum
- [Tài liệu triển khai Sprint 0](<../Tài liệu triển khai/Sprint_0_Setup.md>) — setup môi trường/công cụ là bước khởi đầu; không thay thế triển khai, bảo mật và nghiệm thu production.

## Quy ước và trạng thái quyết định

- **Must**: bắt buộc để phát hành phiên bản production đầu tiên.
- **Should**: nên có; cần chủ dự án chấp thuận nếu hoãn.
- **Later**: để giai đoạn sau.
- Mục tiêu/đề xuất ở tài liệu này là baseline để lập kế hoạch. Các quyết định về nhà cung cấp, ngân sách và dữ liệu cá nhân cần chủ dự án xác nhận trước khi khóa thiết kế.
- Mã FR/NFR/BR/UC/AT được dùng để truy vết yêu cầu đến thiết kế và nghiệm thu.
- Nghiệm thu production phải dựa trên tài liệu 10; hoàn tất code hoặc chạy local không tự động đồng nghĩa đã hoàn tất sản phẩm.

Phiên bản: 2.0 — Production baseline. Ngày cập nhật: 08/11/2026.
