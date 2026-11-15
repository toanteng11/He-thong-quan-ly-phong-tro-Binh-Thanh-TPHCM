# Tài liệu triển khai hệ thống phòng trọ

## Mục tiêu

Thư mục này chuyển bộ BA thành kế hoạch phát triển theo các sprint: việc cần làm, kết quả cần bàn giao và điều kiện để chuyển sprint. Phạm vi sản phẩm là website công khai cho khách xem phòng cùng khu quản trị riêng dành cho chủ dự án.

## Tài liệu

- [Sprint 0 — Chuẩn bị môi trường và nền tảng](<./Sprint_0_Setup.md>)
- [Sprint 1 — Khu quản trị và quản lý tin phòng](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>)
- [Sprint 2 — Hệ thống Khách hàng: Danh sách, Tìm kiếm, Lọc và Chi tiết Phòng](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>)

## Trạng thái thực hiện hiện tại

Hệ thống đã chuyển đổi toàn bộ tầng dữ liệu sang **MongoDB 8** (driver chính thức `mongodb`, mảng `images[]` nhúng nguyên tử trong `room_listings`, script khởi tạo index `server/scripts/init-db.js`) thay thế cho PostgreSQL ban đầu theo `ADR-S0-01`; hoàn thành **Sprint 1** ở khu quản trị, cấp tài khoản quản trị chính (`tranductoan110305@gmail.com`), đồng bộ nhận diện thương hiệu **Ngọc Toàn** (`client/public/Phòng trọ Ngọc Toàn-Logo.svg`) và tách độc lập hoàn toàn **Hệ thống Khách hàng** (`client/` ở `http://127.0.0.1:5173`) khỏi **Hệ thống Quản trị** (`admin/` ở `http://127.0.0.1:5174`, backend khóa chéo `ADMIN_ORIGIN` trên `/api/v1/admin/*`). Về **Sprint 2**, hệ thống đã hoàn thành đầy đủ phần triển khai kỹ thuật: tinh gọn mã và CSS cho cổng khách (`client/`), tạo seed dữ liệu chuẩn MongoDB 8 (`server/scripts/seed-sprint2.js` gồm 19 phòng và ảnh mẫu), vượt qua toàn bộ kiểm thử tự động Public API/Privacy (`server/scripts/verify-sprint2-public.js`) và kiểm thử trình duyệt responsive Playwright trên các mốc `360px`–`1440px`, hiện sẵn sàng cho chủ hệ thống kiểm tra thực tế trên máy local để nghiệm thu. Chi tiết xem trong [Sprint 0](<./Sprint_0_Setup.md>), [Sprint 1](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>) và [Sprint 2](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>).

Kết quả hiện tại phục vụ phát triển và kiểm thử local, chưa phải website đã triển khai production.

## Kế hoạch sprint dự kiến

Kế hoạch dưới đây đồng bộ với bộ tài liệu BA (`01`–`11`). Sprint 0 chỉ chuẩn bị nền tảng; Sprint 1 có backlog và tiêu chí chi tiết trong tài liệu riêng; Sprint 2–4 quy định rõ phạm vi, đầu vào và cổng nghiệm thu để tránh triển khai thiếu kiểm soát.

| Sprint | Mục tiêu dự kiến | Kết quả chính & Điều kiện chuyển giao |
|---|---|---|
| Sprint 0 | Chuẩn bị môi trường và nền móng repo | Công cụ, cấu trúc client/server, kết nối database dev, cấu hình an toàn, hướng dẫn chạy local (`ADR-S0-01`). |
| Sprint 1 | Khu quản trị và quản lý tin phòng | Đăng nhập admin (`scrypt`, session hash, rate limit, đổi mật khẩu lần đầu), CRUD tin, ảnh (chọn ảnh bìa 1 chạm/sắp xếp/gỡ), trạng thái độc lập, xem trước riêng tư, xóa mềm/khôi phục; đạt checklist giao diện & bảo mật (`ADR-S1-01`). |
| Sprint 2 | Khách xem danh sách và chi tiết (`Public Web & API`) | Public API chỉ trả tin `PUBLISHED` chưa xóa mềm (`RULE-01`, `RULE-09`, `RULE-10`); trang chủ, danh sách phòng, trang chi tiết (`/rooms/:roomId`), gallery ảnh, nút gọi/Zalo theo quyền công khai, trang 404 thân thiện; responsive 360px–1440px. |
| Sprint 3 | Tìm kiếm, lọc nâng cao và tối ưu UX/Hiệu năng | Bộ lọc kết hợp từ khóa, phường, loại phòng, giá min/max, diện tích min/max, tình trạng phòng, sắp xếp & phân trang giữ bộ lọc (`AT-03`, `AT-04`, `AT-18`); tối ưu ảnh/lazy load, xử lý trạng thái tải/rỗng/lỗi mạng; đo hiệu năng p75 ≤3s (`NFR-13`, `AT-40`). |
| Sprint 4 | Nghiệm thu và triển khai Production (`Go-Live`) | Đối chiếu toàn bộ `AT-01`–`AT-49` (tài liệu `10`), cấu hình tên miền/HTTPS, tách staging/production, object storage, backup 7 daily + 4 weekly & diễn tập restore (`NFR-11`, `AT-39`), giám sát/cảnh báo, nhập dữ liệu thật và bàn giao runbook (`UC-10`, `UC-11`). |

Thời lượng từng sprint được chốt khi planning theo năng lực và phạm vi thực tế. Sprint 1 và Sprint 2 hiện đề xuất 2 tuần/sprint; xem [tài liệu Sprint 1](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>) và [tài liệu Sprint 2](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>) để biết backlog và tiêu chí chi tiết. Mỗi sprint bắt đầu bằng mục tiêu rõ, kết thúc bằng bản chạy được để review và ghi lại việc cần cải thiện.

## Cách dùng tài liệu

1. Đọc mục tiêu và điều kiện đầu vào của sprint.
2. Chọn backlog vừa sức với một tuần làm việc; không đưa quyết định còn mở vào code như thể đã được phê duyệt.
3. Hoàn thành Definition of Done trước khi chuyển việc sang Done.
4. Ghi thay đổi phạm vi vào tài liệu Change Management.

## Lưu ý về Sprint 0

Scrum Guide mô tả Sprint, Sprint Planning, Daily Scrum, Sprint Review và Sprint Retrospective; “Sprint 0” không phải tên một sự kiện Scrum chính thức. Trong bộ tài liệu này, Sprint 0 là tên nội bộ cho khoảng chuẩn bị ngắn để cài công cụ và dựng nền tảng. Sprint đầu tiên có chức năng sản phẩm nên tạo được phần tăng trưởng có thể review. Đây là cách áp dụng phù hợp với dự án cá nhân, không phải thuật ngữ bắt buộc của Scrum.

Tham khảo: [The Scrum Guide](https://scrumguides.org/scrum-guide).
