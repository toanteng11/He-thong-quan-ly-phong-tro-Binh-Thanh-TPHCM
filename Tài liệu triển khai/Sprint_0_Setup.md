# Sprint 0 — Chuẩn bị môi trường và nền tảng

## 1. Thông tin sprint

| Thuộc tính | Nội dung |
|---|---|
| Mục tiêu | Chuẩn bị máy phát triển, repository, client, API và database local để bắt đầu Sprint 1 |
| Thời lượng đề xuất | 2–4 ngày làm việc; đây là sprint chuẩn bị ngắn cho dự án cá nhân |
| Người thực hiện | Chủ dự án kiêm developer |
| Phạm vi | Cài/kiểm tra công cụ, khởi tạo repo, cấu hình dev, kiểm tra kết nối local |
| Không thuộc Sprint 0 | Nghiệp vụ CRUD hoàn chỉnh, đăng nhập thật, giao diện công khai hoàn chỉnh, triển khai production |

## 2. Mục tiêu và kết quả

Cuối Sprint 0, chủ dự án có thể chạy giao diện, API và database dev trên máy; biết cách khởi động/dừng chúng; có cấu hình mẫu nhưng không đưa bí mật vào Git; và có một README đủ để tự dựng lại môi trường.

Sprint 0 chưa xây chức năng nghiệp vụ cho khách thuê. Chỉ tạo khung dự án và một endpoint kiểm tra sức khỏe để xác nhận các thành phần nối được với nhau.

## 3. Stack cho MVP (Cập nhật MongoDB 8 theo `ADR-S0-01`)

Stack thực tế đã được chủ dự án chốt:

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Giao diện | React + Vite, JavaScript | Khởi tạo nhanh; dùng chung ứng dụng cho public và admin, tách route/layout |
| API | Node.js 24 LTS + Express 5 | Dùng một runtime JavaScript ở client tooling và backend; phù hợp REST API MVP |
| Database dev | MongoDB 8 (`mongo:8`) chạy bằng Docker Compose | Dữ liệu phòng, mảng ảnh nhúng và danh mục tiện nghi phù hợp tự nhiên với mô hình tài liệu |
| Truy cập database | MongoDB Compass hoặc `mongosh` qua Docker CLI | Dễ quan sát collection/document/index cục bộ |
| Quản lý mã nguồn | Git, một repository | Gộp client/server và tài liệu; main luôn giữ trạng thái chạy được |
| Ảnh production | Chưa chọn; quyết định ở sprint triển khai | Local dev dùng `server/uploads/`; production dùng object storage bền vững |

**Quyết định ADR-S0-01 đã chốt:** Chuyển toàn bộ từ PostgreSQL 18 sang MongoDB 8 (driver chính thức `mongodb`), không triển khai đồng thời hai database.

## 4. Công cụ cần có

| Công cụ | Mục đích | Tình trạng quan sát được trên máy |
|---|---|---|
| Node.js 24 LTS | Chạy Vite, Express và npm | Có Node v24.14.0 |
| npm | Cài thư viện và chạy scripts | Có npm 11.9.0 |
| Git for Windows | Lịch sử mã nguồn và nhánh | Có Git 2.53.0.windows.3 |
| Docker Desktop + Docker Compose | Chạy MongoDB 8 local và dịch vụ dev | Có Docker 29.3.1; cần mở Docker Desktop và xác nhận Docker Engine hoạt động |
| IDE | Sửa code, terminal, debug | VS Code / WebStorm hoặc IDE sẵn có |
| Trình duyệt | Kiểm tra giao diện responsive | Google Chrome |
| MongoDB Compass (tùy chọn) | Xem collections/documents bằng giao diện | Tùy chọn |

Vite hiện yêu cầu Node.js 20.19+ hoặc 22.12+; Express 5 yêu cầu Node.js 18+. Node 24 đáp ứng cả hai. Tài liệu Node hiện liệt kê Node 24 và Node 26 ở trạng thái LTS; dự án chọn một major và ghi trong file .nvmrc hoặc .node-version để mọi môi trường dùng nhất quán. Không cần nâng lên major khác chỉ để chạy Vite. Kiểm tra bản vá mới nhất tại thời điểm cài.

## 5. Kiểm tra công cụ trước khi bắt đầu

Mở PowerShell tại thư mục repository và chạy:

~~~powershell
node --version
npm --version
git --version
docker --version
docker compose version
docker info
~~~

Điều kiện đạt:

- Node trả về phiên bản major đã thống nhất trong repo.
- npm và Git chạy được từ PowerShell.
- Docker Compose trả phiên bản; docker info đọc được thông tin Docker Engine.
- Nếu docker info lỗi, mở Docker Desktop, đợi Engine sẵn sàng rồi kiểm tra lại.

Máy hiện có Node 24.14, npm 11.9, Git 2.53 và Docker 29.3.1. Chưa thấy psql/postgres trong PATH; Sprint 0 dùng container database để không phụ thuộc cài PostgreSQL trực tiếp lên Windows.

## 6. Cấu trúc repository đề xuất

~~~text
room-rental-platform/
├── client/
│   ├── src/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   └── routes/
│   └── package.json
├── docs/
│   ├── ba/
│   └── implementation/
├── uploads/                 # chỉ dùng local nếu cần; không commit ảnh thật
├── compose.yaml
├── .env.example
├── .gitignore
├── .editorconfig
└── README.md
~~~

Tài liệu BA và Tài liệu triển khai hiện ở workspace root. Sprint 0 có thể giữ nguyên các thư mục này; không cần di chuyển tài liệu để khởi tạo repo. Nếu sau này gom vào docs/, cập nhật các liên kết và lịch sử Git trong một thay đổi riêng.

## 7. Khởi tạo repository và client

Thực hiện tại thư mục gốc dự án sau khi chủ dự án xác nhận dùng React/Vite:

~~~powershell
git init
git branch -M main
npm create vite@latest client -- --template react
Set-Location client
npm install
npm run dev
~~~

Mở địa chỉ local mà Vite in ra trong terminal. Xác nhận trang mẫu tải được, sau đó dừng server bằng Ctrl+C. Nếu Vite hỏi có cài gói create-vite, kiểm tra tên gói trước khi chấp thuận.

## 8. Khởi tạo API

Tại thư mục gốc:

~~~powershell
New-Item -ItemType Directory -Path server -Force
Set-Location server
npm init -y
npm install express@5 helmet zod mongodb dotenv
npm install --save-dev nodemon
~~~

Tạo khung server với:

- GET /api/v1/health — trả trạng thái API; nếu đã kết nối DB thì trả trạng thái DB riêng.
- Middleware JSON, xử lý lỗi tập trung và Helmet.
- Cấu hình đọc từ biến môi trường (`MONGODB_URI`, `MONGODB_DB_NAME`).
- Chưa có API nào được quyền ghi tin trong Sprint 0.

Scripts package.json tối thiểu: `dev` (`nodemon`), `start` (`node`), `db:init` (`node scripts/init-db.js`). Tên file entry là `src/server.js`.

## 9. Database local bằng Docker Compose

Tạo `compose.yaml` ở thư mục gốc. Cấu hình dưới đây chạy MongoDB 8 chỉ trên máy local; không mở cổng database ra Internet:

~~~yaml
services:
  db:
    image: mongo:8
    container_name: room-rental-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME:-room_rental_app}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD:?Set MONGO_INITDB_ROOT_PASSWORD in the root .env file}
      MONGO_INITDB_DATABASE: room_rental_dev
    ports:
      - "127.0.0.1:27018:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD-SHELL", "mongosh --quiet -u \"$$MONGO_INITDB_ROOT_USERNAME\" -p \"$$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase admin --eval \"db.adminCommand('ping').ok\" | grep -q 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  mongo_data:
~~~

Tạo file `.env` local (không commit) với `MONGO_INITDB_ROOT_PASSWORD` và `MONGODB_URI` tương ứng. Thêm `.env` vào `.gitignore`; trong `.env.example` chỉ ghi tên biến và giá trị placeholder, không ghi mật khẩu thật.

Lệnh vận hành:

~~~powershell
docker compose up -d db
docker compose ps
docker compose logs db
docker compose exec db mongosh --quiet --eval "db.adminCommand('ping')"
docker compose down
~~~

`docker compose down` giữ volume dữ liệu `mongo_data`. Không dùng `docker compose down -v` khi chưa muốn xóa database local. Với Docker Official Image MongoDB 8, dữ liệu lưu tại `/data/db`.

## 10. Cấu hình môi trường và bảo mật

- .env chỉ chứa mật khẩu database dev và cấu hình local; luôn nằm trong .gitignore.
- .env.example mô tả tên biến cần thiết, không chứa secret thật.
- Dùng bind address 127.0.0.1 cho port database local.
- Không commit ảnh khách/ảnh phòng thật, database dump, log hoặc thư mục node_modules/dist.
- Không lưu mật khẩu admin hoặc session secret trong frontend.
- Tạo tài khoản admin bằng seed/script an toàn ở sprint phù hợp; không tạo endpoint đăng ký công khai.
- Không dùng dữ liệu khách thật trong môi trường dev.

## 11. Backlog Sprint 0

| Mã | Việc cần làm | Kết quả |
|---|---|---|
| S0-01 | Chốt ADR-S0-01: React/Vite, Express 5, PostgreSQL hay MongoDB | Quyết định và lý do ghi trong README/ADR |
| S0-02 | Kiểm tra Node, npm, Git, Docker Engine và IDE | Môi trường chạy được; ghi major Node đã chọn |
| S0-03 | Khởi tạo Git repository, main, .gitignore, .editorconfig | Repo sạch, không có secret/artifact build |
| S0-04 | Tạo client Vite React và chạy dev server | Trang mẫu mở được trên localhost |
| S0-05 | Tạo server Express và endpoint health | API trả trạng thái khỏe |
| S0-06 | Tạo Compose database và volume bền vững | MongoDB 8 healthy, kết nối local thành công |
| S0-07 | Tạo .env.example và README chạy local | Có thể dựng môi trường theo hướng dẫn |
| S0-08 | Kiểm tra luồng client → health API và API → database | Các thành phần nối đúng; chưa triển khai nghiệp vụ CRUD |

## 12. Definition of Done cho Sprint 0

- Stack đã được chủ dự án chấp thuận và ghi lại; nếu chọn MongoDB thì cập nhật lại hướng dẫn database này trước khi làm.
- Repo Git được tạo; .env, secret, node_modules, build output và dữ liệu local không nằm trong commit.
- Client khởi động được bằng npm script.
- API khởi động được và endpoint health trả kết quả rõ.
- Database dev khởi động bằng Docker Compose, dữ liệu còn sau khi container dừng/khởi động lại.
- Có README với các lệnh setup/start/stop và yêu cầu phiên bản.
- Quyết định còn mở về schema, liên hệ công khai, ảnh và xóa được ghi vào backlog; chưa tạo schema production.
- Chủ dự án review kết quả và ghi những việc chuyển sang Sprint 1.

## 13. Chuyển sang Sprint 1

Sprint 1 chỉ bắt đầu sau khi stack được chốt. Backlog đầu tiên đề xuất: xác định schema theo Data Analysis; tạo migration; provision một admin; xây login/logout; tạo danh sách tin admin; thêm/sửa tin nháp; và kiểm tra quyền API ở backend. Không tạo route public có thể đọc nháp/ẩn.

## 14. Tài liệu kỹ thuật tham khảo

- [Node.js download và LTS](https://nodejs.org/en/download)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Vite Getting Started và yêu cầu Node.js](https://vite.dev/guide/)
- [Express 5 installation](https://expressjs.com/en/5x/starter/installing/)
- [Docker Official Image cho MongoDB](https://hub.docker.com/_/mongo)
- [MongoDB Node.js Driver Documentation](https://www.mongodb.com/docs/drivers/node/current/)
- [Scrum Guide](https://scrumguides.org/scrum-guide)

Các phiên bản công cụ trong bảng phản ánh trạng thái kiểm tra ngày 07/11/2026; kiểm tra trang chính thức một lần nữa khi cài hoặc nâng cấp.

## 15. Ghi nhận thực hiện Sprint 0 — 12/11/2026

### 15.1. Quyết định và kết quả đã tạo

| Mã | Trạng thái | Kết quả |
|---|---|---|
| S0-01 | Hoàn tất cho bootstrap | Chọn React/Vite, Express 5, Node 24 LTS, PostgreSQL 18; quyết định ghi ở docs/adr/ADR-S0-01-Stack.md. |
| S0-02 | Hoàn tất | Node v24.14.0, npm 11.9.0, Git 2.53.0, Docker Engine 29.3.1 và Compose 5.1.1 hoạt động. PostgreSQL máy chủ đã có trên 5432; project dùng host port 5433. |
| S0-03 | Hoàn tất | Đã tạo Git repository nhánh main, .gitignore, .editorconfig, .nvmrc và mẫu env; chưa tạo commit. |
| S0-04 | Hoàn tất | React/Vite client đã scaffold, cài dependencies, tạo trang nền tảng và cấu hình proxy API; npm run build thành công. |
| S0-05 | Hoàn tất | Express API, Helmet, Zod, pg, dotenv, nodemon và health live/ready đã được tạo. Health live và ready đều trả HTTP 200; ready báo database connected. |
| S0-06 | Hoàn tất | PostgreSQL 18.6 chạy healthy qua Compose tại 127.0.0.1:5433; driver pg truy vấn database room_rental_dev thành công. |
| S0-07 | Hoàn tất | Có README root, .env.example và .env local được sinh tự động; .env nằm trong .gitignore. |
| S0-08 | Hoàn tất | Trang Vite trả HTTP 200; health endpoint qua proxy frontend trả HTTP 200 và báo database connected. |

### 15.2. Definition of Done hiện tại

- [x] Stack ứng viên được chọn và có ADR.
- [x] Git repository, cấu hình cơ bản và .gitignore đã có.
- [x] Client cài dependencies, khởi động được và production build thành công.
- [x] API dependencies đã cài, mã nguồn qua kiểm tra cú pháp và tiến trình dev khởi động được.
- [x] README hướng dẫn setup/start/stop local đã có.
- [x] Docker Linux Engine hoạt động và PostgreSQL 18 báo healthy.
- [x] API readiness báo database connected.
- [x] Client gọi được health endpoint qua proxy.
- [x] Kiểm tra dữ liệu PostgreSQL còn nguyên sau khi container restart; bảng kiểm tra tạm đã được xóa.

Sprint 0 **hoàn tất cho nền tảng local**. Production hosting, nội dung thật, nghiệp vụ CRUD và tài khoản admin chưa thuộc Sprint 0.

### 15.3. Kết quả kiểm tra chi tiết

- Docker Engine 29.3.1 chạy; container room-rental-db dùng image postgres:18 và healthcheck báo healthy.
- Port mapping là 127.0.0.1:5433 → container 5432 vì PostgreSQL local có sẵn giữ/cản bind cổng host 5432. PostgreSQL hiện có không bị dừng hay thay đổi.
- PostgreSQL trả version 18.6; driver pg kết nối được database room_rental_dev qua DATABASE_URL.
- GET /api/v1/health/live và GET /api/v1/health/ready trả HTTP 200; readiness xác nhận dependencies.database=connected.
- Frontend tại http://127.0.0.1:5173 trả HTTP 200; /api/v1/health/ready qua Vite proxy cũng trả HTTP 200.
- Tạo marker trong database project, restart container, xác nhận marker còn tồn tại rồi xóa bảng marker.
- Các tiến trình API và Vite đang chạy trong phiên dev; dừng bằng Ctrl+C tại phiên tương ứng.

Lần thực hiện này không triển khai production, không tạo schema nghiệp vụ, không thêm CRUD hoặc đăng nhập admin; các phần đó thuộc sprint sản phẩm tiếp theo.

## 16. Chuyển đổi cơ sở dữ liệu sang MongoDB 8 — 15/11/2026

- Chủ dự án quyết định chuyển toàn bộ hệ thống sang **MongoDB 8** (driver chính thức `mongodb`) theo cập nhật [ADR-S0-01-Stack.md](<../docs/adr/ADR-S0-01-Stack.md>).
- `compose.yaml` chạy service `db` dùng image `mongo:8` (`room-rental-mongo`), bind `127.0.0.1:27018:27017` (tránh xung đột `mongod` local đang chiếm `27017`) và volume `mongo_data`.
- Đã gỡ bỏ gói `pg`, `server/src/db/pool.js`, `server/scripts/migrate.js` và thư mục `server/migrations/*.sql`; thay bằng `server/src/db/mongo.js` và `server/scripts/init-db.js`.
