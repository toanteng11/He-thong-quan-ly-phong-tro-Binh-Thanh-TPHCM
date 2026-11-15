# Nền tảng quản lý phòng trọ

Website cá nhân để giới thiệu và quản lý phòng trọ tại Bình Thạnh, TP.HCM. Hệ thống bao gồm giao diện khách xem/tìm phòng công khai (`/`, `/rooms`, `/rooms/:roomId`) và khu quản trị riêng dành cho chủ dự án (`/admin/*`), lưu dữ liệu bằng MongoDB 8 và lưu ảnh local trong `server/uploads/`.

## Yêu cầu

- Node.js 24 LTS và npm
- Git
- Docker Desktop với Linux Engine đang chạy (hoặc MongoDB 8 local / MongoDB Atlas URI)

## Khởi chạy local

1. Sao chép `.env.example` thành `.env`. Thay mật khẩu MongoDB local trong `MONGO_INITDB_ROOT_PASSWORD` và `MONGODB_URI` bằng cùng một giá trị ngẫu nhiên. Không commit `.env`.
2. Khởi động MongoDB 8:

~~~powershell
docker compose up -d db
docker compose ps
~~~

3. Cài dependencies server và client:

~~~powershell
npm --prefix server install
npm --prefix client install
~~~

4. Khởi tạo collections và indexes trong database `room_rental_dev`:

~~~powershell
npm --prefix server run db:init
~~~

5. Tạo tài khoản admin đầu tiên sau khi khởi tạo database:

~~~powershell
npm --prefix server run admin:provision
~~~

Lệnh sẽ hỏi email và tên hiển thị, tự sinh một mật khẩu tạm ngẫu nhiên và chỉ in mật khẩu đó một lần. Giữ mật khẩu ở nơi riêng tư; lần đăng nhập đầu tại `/admin/login` sẽ yêu cầu đổi mật khẩu. Script khởi tạo sử dụng khóa duy nhất (`singletonKey`) nên chỉ tạo một tài khoản admin duy nhất.

6. Ở terminal thứ nhất, chạy API:

~~~powershell
npm --prefix server run dev
~~~

7. Ở terminal thứ hai, chạy giao diện:

~~~powershell
npm --prefix client run dev
~~~

8. Mở http://127.0.0.1:5173 để xem danh sách phòng công khai; vào http://127.0.0.1:5173/admin/login để đăng nhập quản trị. Health endpoints của API là `/api/v1/health/live` và `/api/v1/health/ready` trên cổng `3000`.

Docker Compose ánh xạ MongoDB dự án tới `127.0.0.1:27018` (cổng container `27017`) để không xung đột với dịch vụ `mongod` mặc định trên cổng `27017` của máy phát triển. Nếu dùng MongoDB cài sẵn hoặc MongoDB Atlas, chỉ cần cập nhật `MONGODB_URI` và `MONGODB_DB_NAME` trong `.env`.

## Dừng dịch vụ local

- Dừng client/API bằng `Ctrl+C` tại terminal tương ứng.
- Dừng MongoDB mà không xóa dữ liệu: `docker compose stop db`.
- `docker compose down` xóa container nhưng giữ named volume `mongo_data`. Không dùng `docker compose down -v` trừ khi chủ ý xóa database local.

## Cấu trúc

- `client/` — React 19 và Vite (giao diện Public & Admin)
- `server/` — API Express 5, MongoDB official driver, script khởi tạo index `scripts/init-db.js`, provisioning admin và lưu ảnh local trong `server/uploads/`
- `compose.yaml` — MongoDB 8 local trên cổng `27017`
- `docs/adr/` — Quyết định kiến trúc (`ADR-S0-01`, `ADR-S1-01`)
- `Tài liệu BA/` và `Tài liệu triển khai/` — Hồ sơ phân tích nghiệp vụ và kế hoạch phát triển

Không đưa credential production hoặc dữ liệu thật của phòng/khách vào repository. Ảnh hiện lưu cục bộ trong `server/uploads/` và phân quyền qua API (`public` chỉ đọc tin `PUBLISHED`, `admin` yêu cầu session); chuyển sang object storage, domain, HTTPS production, giám sát, backup và go-live thuộc giai đoạn triển khai production.
