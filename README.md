# Nền tảng quản lý phòng trọ

Website cá nhân để giới thiệu và quản lý phòng trọ tại Bình Thạnh, TP.HCM. Sprint 0 hiện chỉ tạo nền tảng phát triển local; chưa có nghiệp vụ quản lý phòng và chưa triển khai production.

## Yêu cầu

- Node.js 24 LTS và npm
- Git
- Docker Desktop với Linux Engine đang chạy

## Khởi chạy local

1. Sao chép .env.example thành .env. Thay mật khẩu PostgreSQL local trong POSTGRES_PASSWORD và DATABASE_URL bằng cùng một giá trị ngẫu nhiên. Không commit .env.
2. Khởi động PostgreSQL:

~~~powershell
docker compose up -d db
docker compose ps
~~~

3. Ở terminal thứ nhất, chạy API:

~~~powershell
npm --prefix server install
npm --prefix server run dev
~~~

4. Ở terminal thứ hai, chạy giao diện:

~~~powershell
npm --prefix client install
npm --prefix client run dev
~~~

5. Mở http://127.0.0.1:5173. Trang sẽ báo tình trạng API và PostgreSQL. Health endpoints của API là /api/v1/health/live và /api/v1/health/ready trên cổng 3000.

## Dừng dịch vụ local

- Dừng client/API bằng Ctrl+C tại terminal tương ứng.
- Dừng PostgreSQL mà không xóa dữ liệu: docker compose stop db.
- docker compose down xóa container nhưng giữ named volume. Không dùng docker compose down -v trừ khi chủ ý xóa database local.

## Cấu trúc

- client/ — React và Vite
- server/ — API Express và kết nối PostgreSQL
- compose.yaml — PostgreSQL 18 local
- docs/adr/ — quyết định kiến trúc
- Tài liệu BA/ và Tài liệu triển khai/ — hồ sơ phân tích và kế hoạch phát triển

Không đưa credential production hoặc dữ liệu thật của phòng/khách vào repository. Hosting production, lưu ảnh, tên miền, HTTPS, giám sát, backup và go-live thuộc các sprint sau.
