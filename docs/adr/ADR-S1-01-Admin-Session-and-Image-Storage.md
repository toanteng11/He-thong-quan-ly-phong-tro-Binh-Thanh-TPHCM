# ADR-S1-01 — Phiên admin và lưu ảnh ở Sprint 1

- **Trạng thái:** Đã chọn cho Sprint 1 local; cần rà soát lại trước khi triển khai production.
- **Ngày:** 12/11/2026.
- **Ngữ cảnh:** Website có một admin, cần bảo vệ khu quản trị và ảnh chưa công khai; không thêm dịch vụ ngoài trong sprint này.

## Quyết định

### Xác thực

- Password hash bằng Node.js `scrypt` với salt ngẫu nhiên riêng cho từng mật khẩu; định dạng hash ghi các tham số để xác minh được.
- CLI `admin:provision` chỉ khởi tạo khi chưa có tài khoản, sinh password tạm ngẫu nhiên và yêu cầu đổi ở lần đăng nhập đầu.
- Mỗi phiên dùng token ngẫu nhiên 256-bit; chỉ SHA-256 hash của token được lưu trong MongoDB (`admin_sessions.tokenHash` với unique index).
- Cookie phiên dùng `HttpOnly`, `SameSite=Strict`, `Secure` khi `NODE_ENV=production`; timeout 30 phút không hoạt động hoặc 12 giờ tuyệt đối.
- Request ghi yêu cầu `Origin` khớp chính xác với `CLIENT_ORIGIN`; login/logout/đổi mật khẩu cũng kiểm tra Origin.
- Rate limit login là 10 lần thất bại trên mỗi IP trong cửa sổ 15 phút, bộ đếm giữ trong bộ nhớ tiến trình.

### Ảnh

- Ảnh local nằm trong `server/uploads/`, tên object do server sinh, quyền file hạn chế trên hệ điều hành hỗ trợ.
- Trường `images[].storageKey` trong document `room_listings` chỉ lưu khóa tương đối. Mọi đọc/ghi/xóa đi qua `server/src/storage/image-storage.js`.
- Ảnh tin nháp/ẩn chỉ đọc được qua endpoint yêu cầu admin session; không public URL trực tiếp.
- Chỉ nhận JPEG/PNG/WebP theo chữ ký nội dung; tối đa 10 MB/ảnh và 15 ảnh/tin. Upload một file mỗi request; client gửi tuần tự khi chọn nhiều file để kiểm soát tiến trình/lỗi.

## Hệ quả và giới hạn

- Phiên sống qua restart API vì lưu trong MongoDB (`admin_sessions`) và có thể bị thu hồi phía server.
- Local filesystem phù hợp development; trước production cần object storage/private bucket, xử lý thumbnail, backup media, virus/content checks theo threat model, HTTPS, monitor và thử restore.
- Rate limit trong bộ nhớ không chia sẻ giữa nhiều instance; nếu mở rộng nhiều instance phải dùng store dùng chung.
- `SameSite=Strict` và exact Origin hợp với client/API cùng site hoặc cùng origin reverse proxy. Nếu kiến trúc domain khác, cần rà lại cookie/CORS/CSRF trước khi đổi cấu hình.
- Không bật đăng ký admin. Phục hồi/mở khóa tài khoản thực hiện ngoài luồng qua người sở hữu hệ thống.
