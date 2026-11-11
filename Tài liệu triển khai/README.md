# Tài liệu triển khai hệ thống phòng trọ

## Mục tiêu

Thư mục này chuyển bộ BA thành kế hoạch phát triển theo các sprint: việc cần làm, kết quả cần bàn giao và điều kiện để chuyển sprint. Phạm vi sản phẩm là website công khai cho khách xem phòng cùng khu quản trị riêng dành cho chủ dự án.

## Tài liệu

- [Sprint 0 — Chuẩn bị môi trường và nền tảng](<./Sprint_0_Setup.md>)

## Trạng thái thực hiện hiện tại

Sprint 0 đã tạo repository, client React/Vite, API Express, cấu hình PostgreSQL Compose và tài liệu chạy local. Client production build đạt; Docker Linux Engine chưa khởi động được nên PostgreSQL, API readiness và kết nối client → API → database chưa thể xác nhận. Chi tiết tiến độ và bước gỡ chặn nằm ở cuối [Sprint_0_Setup](<./Sprint_0_Setup.md>).

Sprint 0 chưa được đánh dấu hoàn tất cho tới khi database báo healthy và endpoint readiness trả về database connected.

## Kế hoạch sprint dự kiến

Kế hoạch dưới đây là bản nháp để chia Product Backlog. Sprint 0 chỉ chuẩn bị nền tảng; nội dung chi tiết của Sprint 1 trở đi cần được chốt sau khi gỡ chặn Docker Engine và hoàn tất Sprint 0.

| Sprint | Mục tiêu dự kiến | Kết quả chính |
|---|---|---|
| Sprint 0 | Chuẩn bị môi trường và nền móng repo | Công cụ, cấu trúc client/server, kết nối database dev, cấu hình an toàn, hướng dẫn chạy local |
| Sprint 1 | Admin đăng nhập và quản lý tin phòng | Tài khoản admin ban đầu, tạo/sửa/ẩn tin, trạng thái phòng, CRUD API |
| Sprint 2 | Khách xem danh sách và chi tiết | Trang chủ/list/detail responsive, ảnh, giá, địa chỉ và tình trạng |
| Sprint 3 | Tìm kiếm, lọc và hoàn thiện UX | Bộ lọc, trạng thái tải/lỗi/rỗng, tối ưu ảnh và tốc độ |
| Sprint 4 | Nghiệm thu và triển khai MVP | Đối chiếu acceptance, HTTPS, backup/restore, hướng dẫn vận hành |

Thời lượng đề xuất: sprint sản phẩm 1 tuần cho dự án cá nhân, có thể đổi nếu backlog thực tế lớn hơn. Mỗi sprint bắt đầu bằng mục tiêu rõ, kết thúc bằng bản chạy được để review và ghi lại việc cần cải thiện.

## Cách dùng tài liệu

1. Đọc mục tiêu và điều kiện đầu vào của sprint.
2. Chọn backlog vừa sức với một tuần làm việc; không đưa quyết định còn mở vào code như thể đã được phê duyệt.
3. Hoàn thành Definition of Done trước khi chuyển việc sang Done.
4. Ghi thay đổi phạm vi vào tài liệu Change Management.

## Lưu ý về Sprint 0

Scrum Guide mô tả Sprint, Sprint Planning, Daily Scrum, Sprint Review và Sprint Retrospective; “Sprint 0” không phải tên một sự kiện Scrum chính thức. Trong bộ tài liệu này, Sprint 0 là tên nội bộ cho khoảng chuẩn bị ngắn để cài công cụ và dựng nền tảng. Sprint đầu tiên có chức năng sản phẩm nên tạo được phần tăng trưởng có thể review. Đây là cách áp dụng phù hợp với dự án cá nhân, không phải thuật ngữ bắt buộc của Scrum.

Tham khảo: [The Scrum Guide](https://scrumguides.org/scrum-guide).
