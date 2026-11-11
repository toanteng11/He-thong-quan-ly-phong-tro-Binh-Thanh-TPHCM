# ADR-S0-01 — Stack cho Sprint 0

| Thuộc tính | Giá trị |
|---|---|
| Trạng thái | Chọn để khởi tạo Sprint 0; rà soát lại trước Sprint 1 |
| Ngày | 09/11/2026 |
| Người quyết định | Chủ dự án kiêm developer |

## Bối cảnh

Tài liệu Sprint 0 nêu React/Vite, Express 5 và PostgreSQL 18 là hướng đề xuất; BA cần lưu dữ liệu phòng, ảnh, admin, trạng thái và địa chỉ có quan hệ. Cần một stack gọn, dễ chạy local cho dự án cá nhân.

## Quyết định

- Client: React + Vite, JavaScript.
- API: Node.js 24 LTS + Express 5.
- Database local: PostgreSQL 18 qua Docker Compose.
- Driver: pg; chưa thêm ORM hoặc migration framework trong Sprint 0.
- Cấu trúc: một repository với client và server tách thư mục; backend dạng modular monolith.

## Hệ quả

- Chỉ dùng PostgreSQL; không khởi tạo thêm MongoDB.
- Docker database chỉ bind vào 127.0.0.1; production database sẽ được chọn theo yêu cầu bảo mật, backup và chi phí.
- Schema/migrations thuộc Sprint 1 sau khi rà soát Data Analysis.
- Đổi stack sau Sprint 1 cần cập nhật API, Data Analysis, runbook và kế hoạch migration.
