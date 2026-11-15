# ADR-S0-01 — Stack kiến trúc hệ thống (Cập nhật chuyển sang MongoDB)

| Thuộc tính | Giá trị |
|---|---|
| Trạng thái | Đã cập nhật & phê duyệt thay thế PostgreSQL bằng MongoDB |
| Ngày | 09/11/2026 (Cập nhật 15/11/2026) |
| Người quyết định | Chủ dự án kiêm developer |

## Bối cảnh

Khởi điểm Sprint 0 từng cân nhắc PostgreSQL 18; tuy nhiên mô hình dữ liệu thực tế của tin phòng gồm các tài liệu bán cấu trúc (danh sách tiện nghi linh hoạt, danh sách ảnh tối đa 15 phần tử gắn trực tiếp với từng phòng, địa chỉ cấu trúc, audit event) phù hợp tự nhiên với cơ sở dữ liệu tài liệu MongoDB hơn là tách bảng quan hệ SQL. Việc nhúng mảng `images` trong `room_listings` giúp mọi thao tác upload/sắp xếp/đổi ảnh bìa/xóa ảnh diễn ra nguyên tử trên một document mà không cần replica set hay join nhiều bảng.

## Quyết định

- **Client**: React + Vite, JavaScript.
- **API**: Node.js 24 LTS + Express 5 + Zod validation.
- **Database**: MongoDB 8 chạy local qua Docker Compose (cổng host `127.0.0.1:27018` ánh xạ vào cổng `27017` của container để tránh xung đột `mongod` local trên `27017`) hoặc MongoDB Atlas URI qua `MONGODB_URI`.
- **Driver**: `mongodb` (Node.js official driver), khởi tạo index/collection rõ ràng qua `server/scripts/init-db.js`; không thêm ODM nặng như Mongoose để giữ kiểm soát query và validation Zod đồng nhất.
- **Cấu trúc**: Một repository với `client/` và `server/` tách thư mục; backend dạng modular monolith.

## Hệ quả

- Chỉ dùng MongoDB; loại bỏ toàn bộ phụ thuộc PostgreSQL (`pg`, SQL migrations, `compose` Postgres).
- Docker MongoDB chỉ bind vào `127.0.0.1:27018` (tránh xung đột `mongod` host tại `27017`) và yêu cầu root username/password cấu hình qua `.env`.
- Ảnh (`images`) được nhúng trực tiếp thành subdocument array trong `room_listings` để đảm bảo atomic single-document update và loại bỏ `$lookup`/join trên luồng đọc danh sách.
- Ràng buộc 1 tài khoản admin duy nhất được bảo đảm bằng unique index `singletonKey` trên collection `admin_accounts`.
