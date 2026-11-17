# Tài liệu triển khai hệ thống phòng trọ

## Mục tiêu

Thư mục này chuyển bộ BA thành kế hoạch phát triển theo các sprint: việc cần làm, kết quả cần bàn giao và điều kiện để chuyển sprint. Phạm vi sản phẩm là website công khai cho khách xem phòng cùng khu quản trị riêng dành cho chủ dự án.

## Tài liệu

- [Sprint 0 — Chuẩn bị môi trường và nền tảng](<./Sprint_0_Setup.md>)
- [Sprint 1 — Khu quản trị và quản lý tin phòng](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>)
- [Sprint 2 — Hệ thống Khách hàng: Danh sách, Tìm kiếm, Lọc và Chi tiết Phòng](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>)
- [Sprint 3 — Tìm kiếm, Lọc nâng cao và Tối ưu UX/Hiệu năng](<./Sprint_3_Tim_Kiem_Loc_Nang_Cao_Toi_Uu_UX_Hieu_Nang.md>)
- [Sprint 4 — Nghiệm thu và triển khai Production (Go-Live)](<./Sprint_4_Nghiem_Thu_Trien_Khai_Production_Go_Live.md>)
- [Sprint 5 — Tự động nhập liệu từ bài đăng Facebook/Zalo & tối ưu vận hành](<./Sprint_5_Tu_Dong_Nhap_Lieu_Va_Toi_Uu_Van_Hanh.md>)
- [Sprint 6 — Chatbot AI "Bot tư vấn" khách hàng theo dữ liệu thực tế](<./Sprint_6_Chatbot_AI_Tu_Van_Khach_Hang.md>)

## Trạng thái thực hiện hiện tại

Hệ thống đã chuyển đổi toàn bộ tầng dữ liệu sang **MongoDB 8** (driver chính thức `mongodb`, mảng `images[]` nhúng nguyên tử trong `room_listings`, script khởi tạo index `server/scripts/init-db.js`) thay thế cho PostgreSQL ban đầu theo `ADR-S0-01`; hoàn thành **Sprint 1** ở khu quản trị, cấp tài khoản quản trị chính (`tranductoan110305@gmail.com`), đồng bộ nhận diện thương hiệu **Ngọc Toàn** (`client/public/Phòng trọ Ngọc Toàn-Logo.svg`) và tách độc lập hoàn toàn **Hệ thống Khách hàng** (`client/` ở `http://127.0.0.1:5173`) khỏi **Hệ thống Quản trị** (`admin/` ở `http://127.0.0.1:5174`, backend khóa chéo `ADMIN_ORIGIN` trên `/api/v1/admin/*`).

Về **Sprint 2**, hệ thống đã hoàn thành đầy đủ phần triển khai kỹ thuật: tinh gọn mã và CSS cho cổng khách (`client/`), tạo seed dữ liệu chuẩn MongoDB 8 (`server/scripts/seed-sprint2.js`), vượt qua toàn bộ kiểm thử tự động Public API/Privacy (`server/scripts/verify-sprint2-public.js`) và kiểm thử trình duyệt responsive Playwright trên các mốc `360px`–`1440px`.

Bước sang **Sprint 3**, hệ thống đã **hoàn thành kỹ thuật** toàn bộ hạng mục theo [Sprint 3](<./Sprint_3_Tim_Kiem_Loc_Nang_Cao_Toi_Uu_UX_Hieu_Nang.md>): đồng bộ **5 phường Quận Bình Thạnh năm 2026** (`1685/NQ-UBTVQH15`), chuẩn hóa tiện nghi (`Thang máy` thay `Máy giặt`), nâng cấp UX Admin (`/rooms/new` tải ảnh & chọn ảnh bìa trước khi lưu nháp, xuất bản chuyển về Tổng quan `/`), bổ sung lọc theo nhiều tiện nghi (`amenities`), `AbortController`, `SafeImage` (`fetchpriority="high"`/`loading="lazy"`), `ETag`/`304`, index MongoDB mới (`idx_public_rooms_area`, `idx_public_rooms_amenities`), và kiểm chứng benchmark `500` tin trên mạng 4G giả lập (`room_rental_perf`) đạt **`p75 = 1352.1 ms`** (`≤ 3000 ms`) với **`maxCLS = 0.0001`**.

Kết quả hiện tại phục vụ phát triển và kiểm thử local, sẵn sàng bước vào **Sprint 4 (Go-Live Production)** với **Kiến trúc Cloud 0đ (Production Free Tier Stack)** đã chốt: **Vercel Free** (`client/` & `admin/`), **Render.com Free Web Service** (Backend Node 24/Express 5), **MongoDB Atlas M0 Free 512 MB** (Singapore), **Cloudinary Free** (`25` credits/tháng — kho ảnh không cần thẻ) và **UptimeRobot Free** (giữ backend luôn thức & cảnh báo Email).

## Kế hoạch sprint dự kiến

Kế hoạch dưới đây đồng bộ với bộ tài liệu BA (`01`–`11`). Sprint 0 chỉ chuẩn bị nền tảng; Sprint 1 có backlog và tiêu chí chi tiết trong tài liệu riêng; Sprint 2–4 quy định rõ phạm vi, đầu vào và cổng nghiệm thu để tránh triển khai thiếu kiểm soát.

| Sprint | Mục tiêu dự kiến | Kết quả chính & Điều kiện chuyển giao |
|---|---|---|
| Sprint 0 | Chuẩn bị môi trường và nền móng repo | Công cụ, cấu trúc client/server, kết nối database dev, cấu hình an toàn, hướng dẫn chạy local (`ADR-S0-01`). |
| Sprint 1 | Khu quản trị và quản lý tin phòng | Đăng nhập admin (`scrypt`, session hash, rate limit, đổi mật khẩu lần đầu), CRUD tin, ảnh (chọn ảnh bìa 1 chạm/sắp xếp/gỡ), trạng thái độc lập, xem trước riêng tư, xóa mềm/khôi phục; đạt checklist giao diện & bảo mật (`ADR-S1-01`). |
| Sprint 2 | Khách xem danh sách và chi tiết (`Public Web & API`) | Public API chỉ trả tin `PUBLISHED` chưa xóa mềm (`RULE-01`, `RULE-09`, `RULE-10`); trang chủ, danh sách phòng, trang chi tiết (`/rooms/:roomId`), gallery ảnh, nút gọi/Zalo theo quyền công khai, trang 404 thân thiện; responsive 360px–1440px. |
| Sprint 3 | Tìm kiếm, lọc nâng cao và tối ưu UX/Hiệu năng | Bộ lọc kết hợp từ khóa, phường, loại phòng, giá min/max, diện tích min/max, tình trạng phòng, sắp xếp & phân trang giữ bộ lọc (`AT-03`, `AT-04`, `AT-18`); tối ưu ảnh/lazy load, xử lý trạng thái tải/rỗng/lỗi mạng; đo hiệu năng p75 ≤3s (`NFR-13`, `AT-40`). |
| Sprint 4 | Nghiệm thu và triển khai Production (`Go-Live`) | Đối chiếu toàn bộ `AT-01`–`AT-49` (tài liệu `10`), cấu hình tên miền/HTTPS, tách staging/production, object storage, backup 7 daily + 4 weekly & diễn tập restore (`NFR-11`, `AT-39`), giám sát/cảnh báo, nhập dữ liệu thật và bàn giao runbook (`UC-10`, `UC-11`). |
| Sprint 5 | Nhập liệu thông minh từ bài đăng Facebook/Zalo & tối ưu vận hành | Dán nội dung bài đăng Facebook/Zalo thô tại `/rooms/new` để tự động bóc tách giá, tiêu đề, mô tả, địa chỉ, gợi ý phường Bình Thạnh 2026, tiện nghi & SĐT/Zalo (`0đ` chi phí AI API, `AT-501`–`AT-508`), thêm ảnh và lưu bản nháp nhanh. |
| Sprint 6 | Chatbot AI `"Bot tư vấn"` khách hàng (`client/` + Gemini Free) | Tích hợp bong bóng chat `"Bot tư vấn"` dễ thương trên trang khách (`ConsultBotWidget`), kết nối `POST /api/v1/public/chat` dùng Gemini 2.5 Flash + RAG dữ liệu thật từ MongoDB (bảo mật `privateAddress`, rate-limit & `smart-fallback`, `AT-601`–`AT-607`). |

Thời lượng từng sprint được chốt khi planning theo năng lực và phạm vi thực tế. Sprint 1, Sprint 2, Sprint 3 và Sprint 4 hiện đề xuất 2 tuần/sprint; xem [tài liệu Sprint 1](<./Sprint_1_Admin_Quan_ly_Tin_Phong.md>), [tài liệu Sprint 2](<./Sprint_2_Khach_Xem_Danh_Sach_Chi_Tiet.md>), [tài liệu Sprint 3](<./Sprint_3_Tim_Kiem_Loc_Nang_Cao_Toi_Uu_UX_Hieu_Nang.md>) và [tài liệu Sprint 4](<./Sprint_4_Nghiem_Thu_Trien_Khai_Production_Go_Live.md>) để biết backlog và tiêu chí chi tiết. Mỗi sprint bắt đầu bằng mục tiêu rõ, kết thúc bằng bản chạy được để review và ghi lại việc cần cải thiện.

## Cách dùng tài liệu

1. Đọc mục tiêu và điều kiện đầu vào của sprint.
2. Chọn backlog vừa sức với một tuần làm việc; không đưa quyết định còn mở vào code như thể đã được phê duyệt.
3. Hoàn thành Definition of Done trước khi chuyển việc sang Done.
4. Ghi thay đổi phạm vi vào tài liệu Change Management.

## Lưu ý về Sprint 0

Scrum Guide mô tả Sprint, Sprint Planning, Daily Scrum, Sprint Review và Sprint Retrospective; “Sprint 0” không phải tên một sự kiện Scrum chính thức. Trong bộ tài liệu này, Sprint 0 là tên nội bộ cho khoảng chuẩn bị ngắn để cài công cụ và dựng nền tảng. Sprint đầu tiên có chức năng sản phẩm nên tạo được phần tăng trưởng có thể review. Đây là cách áp dụng phù hợp với dự án cá nhân, không phải thuật ngữ bắt buộc của Scrum.

Tham khảo: [The Scrum Guide](https://scrumguides.org/scrum-guide).
