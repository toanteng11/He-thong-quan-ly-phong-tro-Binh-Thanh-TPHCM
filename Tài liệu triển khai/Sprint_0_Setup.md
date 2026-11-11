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

## 3. Đề xuất stack cho MVP

Stack này là đề xuất thực hiện để giảm mơ hồ trong Sprint 0. Cần chủ dự án xác nhận trước khi bắt đầu phát triển chức năng; các tài liệu BA hiện vẫn để công nghệ database/hosting mở.

| Lớp | Đề xuất | Lý do |
|---|---|---|
| Giao diện | React + Vite, JavaScript | Khởi tạo nhanh; dùng chung ứng dụng cho public và admin, tách route/layout |
| API | Node.js 24 LTS + Express 5 | Dùng một runtime JavaScript ở client tooling và backend; phù hợp REST API MVP |
| Database dev | PostgreSQL 18 chạy bằng Docker Compose | Dữ liệu phòng, ảnh, admin và trạng thái có quan hệ; local setup lặp lại được |
| Truy cập database | pgAdmin nếu cần giao diện; psql/Docker CLI cho thao tác kỹ thuật | pgAdmin đã có trong môi trường theo danh sách ứng dụng; cần xác nhận chạy được |
| Quản lý mã nguồn | Git, một repository | Gộp client/server và tài liệu; main luôn giữ trạng thái chạy được |
| Ảnh production | Chưa chọn; quyết định ở sprint triển khai | Local dev có thể dùng thư mục không commit; production cần nơi lưu bền vững |

**Quyết định ADR-S0-01 cần ghi:** chấp thuận PostgreSQL 18 thay cho phương án MongoDB từng được đề xuất ban đầu, hoặc giữ MongoDB và cập nhật các bước database/API trước khi tạo schema. Không triển khai đồng thời hai database.

## 4. Công cụ cần có

| Công cụ | Mục đích | Tình trạng quan sát được trên máy |
|---|---|---|
| Node.js 24 LTS | Chạy Vite, Express và npm | Có Node v24.14.0; nên cập nhật lên bản vá 24.x LTS mới nhất rồi thống nhất phiên bản dự án |
| npm | Cài thư viện và chạy scripts | Có npm 11.9.0; đi kèm Node.js, không cần cài riêng |
| Git for Windows | Lịch sử mã nguồn và nhánh | Có Git 2.53.0.windows.3 |
| Docker Desktop + Docker Compose | Chạy PostgreSQL 18 local và dịch vụ dev | Có Docker 29.3.1; cần mở Docker Desktop và xác nhận Docker Engine hoạt động |
| IDE | Sửa code, terminal, debug | WebStorm đã có trong danh sách ứng dụng; có thể dùng IDE sẵn có |
| Trình duyệt | Kiểm tra giao diện responsive | Google Chrome đã có trong môi trường |
| pgAdmin | Xem database bằng giao diện | Ứng dụng có trong môi trường; dùng tùy chọn, không bắt buộc |

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
npm install express@5 helmet zod pg dotenv
npm install --save-dev nodemon
~~~

Tạo khung server với:

- GET /api/v1/health — trả trạng thái API; nếu đã kết nối DB thì trả trạng thái DB riêng.
- Middleware JSON, xử lý lỗi tập trung và Helmet.
- Cấu hình đọc từ biến môi trường.
- Chưa có API nào được quyền ghi tin trong Sprint 0.

Scripts package.json tối thiểu: dev (nodemon), start (node). Tên file entry có thể là src/server.js. Chưa cần cài ORM/migration framework cho tới khi mô hình dữ liệu ở Data Analysis được chủ dự án chốt.

## 9. Database local bằng Docker Compose

Tạo compose.yaml ở thư mục gốc. Ví dụ dưới đây chạy database chỉ trên máy local; không mở cổng database ra Internet:

~~~yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: room_rental_dev
      POSTGRES_USER: room_rental_app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U room_rental_app -d room_rental_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
~~~

Tạo file .env local (không commit) với POSTGRES_PASSWORD có giá trị do chủ dự án tự đặt. Thêm .env vào .gitignore; trong .env.example chỉ ghi tên biến và giá trị placeholder, không ghi mật khẩu thật.

Lệnh vận hành:

~~~powershell
docker compose up -d db
docker compose ps
docker compose logs db
docker compose exec db pg_isready -U room_rental_app -d room_rental_dev
docker compose down
~~~

docker compose down giữ volume dữ liệu. Không dùng docker compose down -v khi chưa muốn xóa database local. Với Docker Official Image PostgreSQL 18, mount dữ liệu tại /var/lib/postgresql; không dùng ví dụ cũ /var/lib/postgresql/data của các major trước 18.

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
| S0-06 | Tạo Compose database và volume bền vững | PostgreSQL 18 healthy, kết nối local thành công |
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
- [Docker Official Image cho PostgreSQL](https://github.com/docker-library/docs/blob/master/postgres/README.md)
- [Scrum Guide](https://scrumguides.org/scrum-guide)

Các phiên bản công cụ trong bảng phản ánh trạng thái kiểm tra ngày 07/11/2026; kiểm tra trang chính thức một lần nữa khi cài hoặc nâng cấp.

## 15. Ghi nhận thực hiện Sprint 0 — 09/11/2026

### 15.1. Quyết định và kết quả đã tạo

| Mã | Trạng thái | Kết quả |
|---|---|---|
| S0-01 | Hoàn tất cho bootstrap | Chọn React/Vite, Express 5, Node 24 LTS, PostgreSQL 18; quyết định ghi ở docs/adr/ADR-S0-01-Stack.md. |
| S0-02 | Một phần | Node v24.14.0, npm 11.9.0, Git 2.53.0, Docker CLI 29.3.1 và Compose 5.1.1 có sẵn. Docker Linux Engine chưa kết nối được. |
| S0-03 | Hoàn tất | Đã tạo Git repository nhánh main, .gitignore, .editorconfig, .nvmrc và mẫu env; chưa tạo commit. |
| S0-04 | Hoàn tất | React/Vite client đã scaffold, cài dependencies, tạo trang nền tảng và cấu hình proxy API; npm run build thành công. |
| S0-05 | Một phần | Express API, Helmet, Zod, pg, dotenv, nodemon và health live/ready đã được tạo. API khởi động được; chưa xác nhận response HTTP qua loopback. |
| S0-06 | Bị chặn bởi môi trường | Compose cho PostgreSQL 18 đã được tạo và docker compose config --quiet hợp lệ; không thể tạo container vì Docker Engine chưa chạy. |
| S0-07 | Hoàn tất | Có README root, .env.example và .env local được sinh tự động; .env nằm trong .gitignore. |
| S0-08 | Chưa hoàn tất | Chưa xác nhận client → API → PostgreSQL vì Engine không hoạt động và môi trường hiện tại chặn kết nối loopback (EACCES). |

### 15.2. Definition of Done hiện tại

- [x] Stack ứng viên được chọn và có ADR.
- [x] Git repository, cấu hình cơ bản và .gitignore đã có.
- [x] Client cài dependencies, khởi động được và production build thành công.
- [x] API dependencies đã cài, mã nguồn qua kiểm tra cú pháp và tiến trình dev khởi động được.
- [x] README hướng dẫn setup/start/stop local đã có.
- [ ] Docker Linux Engine hoạt động và PostgreSQL 18 báo healthy.
- [ ] API readiness báo database connected.
- [ ] Client gọi được health endpoint qua proxy.
- [ ] Kiểm tra dữ liệu PostgreSQL còn nguyên sau khi container restart.

Sprint 0 **chưa hoàn tất** cho đến khi các mục chưa đánh dấu ở trên đạt.

### 15.3. Việc cần thực hiện trên máy để gỡ chặn

1. Chủ dự án mở Docker Desktop từ Start Menu và chờ trạng thái Engine sẵn sàng. Lần kiểm tra hiện tại, Docker Desktop chưa tạo được daemon và Computer Use bị dừng bằng phím Esc nên không thể tiếp tục thao tác giao diện.
2. Tại PowerShell ở thư mục repository chạy:

~~~powershell
docker info
docker compose up -d db
docker compose ps
npm --prefix server run dev
npm --prefix client run dev
~~~

3. Mở http://127.0.0.1:5173; trang cần báo API hoạt động và database connected. Health API: http://127.0.0.1:3000/api/v1/health/live và http://127.0.0.1:3000/api/v1/health/ready.
4. Nếu Docker Desktop báo cần bật WSL/virtualization hoặc cần quyền quản trị hệ thống, chủ dự án xử lý qua cấu hình/hướng dẫn chính thức của Docker/Windows. Không xóa volume hiện có.
5. Sau khi readiness đạt, khởi động lại container và xác nhận volume còn dữ liệu trước khi đánh dấu Sprint 0 hoàn tất.

Lần thực hiện này không triển khai production, không tạo schema nghiệp vụ, không thêm CRUD hoặc đăng nhập admin; các phần đó thuộc sprint sản phẩm tiếp theo.
