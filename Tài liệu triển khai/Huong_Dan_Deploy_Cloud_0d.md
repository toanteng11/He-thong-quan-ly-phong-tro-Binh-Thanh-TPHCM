# Hướng dẫn Triển khai Hệ thống Phòng trọ lên Cloud Miễn phí (0đ/tháng)

Tài liệu này hướng dẫn từng bước đưa **Ngọc Toàn — Hệ thống Quản lý Phòng trọ Quận Bình Thạnh** lên môi trường **Production miễn phí hoàn toàn** theo kiến trúc đã chốt tại [Sprint 4](<./Sprint_4_Nghiem_Thu_Trien_Khai_Production_Go_Live.md>):

- **Database**: MongoDB Atlas M0 Free (`512 MB`, Singapore `ap-southeast-1`)
- **Kho ảnh**: Cloudinary Free (`25` credits/tháng — không cần thẻ Visa/Mastercard)
- **Backend API**: Render.com Web Service Free (`server/`)
- **Frontend Khách (`client/`) & Admin (`admin/`)**: Vercel Hobby Free (2 project độc lập + Rewrites cùng origin)
- **Chống ngủ & Giám sát Uptime**: UptimeRobot Free (`5 phút/lần`)

---

## Bước 1 — Tạo MongoDB Atlas M0 Free (Database Production)

1. Đăng nhập `https://www.mongodb.com/cloud/atlas` (bằng Google hoặc GitHub).
2. Tạo **Cluster** mới: chọn gói **M0 (Free)**, Provider **AWS**, Region **Singapore (`ap-southeast-1`)**.
3. Trong mục **Database Access**: tạo 1 user tên ví dụ `room_prod_app` với mật khẩu ngẫu nhiên mạnh, quyền `Read and write to any database` (hoặc giới hạn riêng DB `room_rental_prod`).
4. Trong mục **Network Access**: tạm thêm Allow Access (`0.0.0.0/0` nếu dùng Render Free không cố định IP outbound, bảo vệ bằng mật khẩu mạnh + TLS `mongodb+srv://`).
5. Nhấn **Connect → Drivers** để lấy chuỗi kết nối dạng:
   `mongodb+srv://room_prod_app:<PASSWORD>@cluster0.xxxxx.mongodb.net/room_rental_prod?retryWrites=true&w=majority`

---

## Bước 2 — Tạo Kho Ảnh Cloudinary Free

1. Đăng ký tài khoản miễn phí tại `https://cloudinary.com` (chọn mục *Programmable Media / Developer*).
2. Tại **Dashboard**, ghi lại 3 thông số:
   - `Cloud name` → điền vào `CLOUDINARY_CLOUD_NAME`
   - `API Key` → điền vào `CLOUDINARY_API_KEY`
   - `API Secret` → điền vào `CLOUDINARY_API_SECRET`

---

## Bước 3 — Deploy Backend API lên Render.com (Free)

1. Đăng nhập `https://render.com` bằng tài khoản **GitHub**.
2. Chọn **New + → Web Service** (hoặc dùng **Blueprint** đọc trực tiếp file [render.yaml](<../render.yaml>) có sẵn trong repo).
3. Nếu cấu hình thủ công:
   - **Repository**: `toanteng11/He-thong-quan-ly-phong-tro-Binh-Thanh-TPHCM`
   - **Root Directory**: `server`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/v1/health/ready`
   - **Plan**: `Free`
4. Trong tab **Environment → Environment Variables**, thêm các biến sau:
   - `NODE_ENV=production`
   - `HOST=0.0.0.0`
   - `TRUST_PROXY=1`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=Lax`
   - `IMAGE_STORAGE_DRIVER=cloudinary`
   - `CLOUDINARY_FOLDER=room-rental-binh-thanh`
   - `CLOUDINARY_CLOUD_NAME=<giá trị bước 2>`
   - `CLOUDINARY_API_KEY=<giá trị bước 2>`
   - `CLOUDINARY_API_SECRET=<giá trị bước 2>`
   - `MONGODB_URI=<chuỗi kết nối ở bước 1>`
   - `MONGODB_DB_NAME=room_rental_prod`
   - `CLIENT_ORIGIN=https://<ten-web-khach>.vercel.app` *(cập nhật ngay sau Bước 4)*
   - `ADMIN_ORIGIN=https://<ten-web-admin>.vercel.app` *(cập nhật ngay sau Bước 4)*
5. Sau khi deploy xong, ghi lại URL backend Render (ví dụ: `https://phongtro-binhthanh-api.onrender.com`).

---

## Bước 4 — Deploy 2 Ứng dụng Frontend lên Vercel (Free)

### 4.1. Cập nhật địa chỉ Backend vào file Vercel Rewrites

Mở 2 file sau và thay `https://phongtro-binhthanh-api.onrender.com` bằng **đúng URL Render bạn vừa nhận ở Bước 3** rồi push lên GitHub:
- [client/vercel.json](<../client/vercel.json>)
- [admin/vercel.json](<../admin/vercel.json>)

> **Vì sao dùng Vercel Rewrites?** Khi người dùng truy cập `/api/v1/...`, Vercel tự chuyển tiếp kín về Render ở phía hạ tầng. Nhờ đó trình duyệt luôn thấy Frontend và API nằm trên **cùng một domain** (`*.vercel.app`), giúp cookie đăng nhập Admin (`HttpOnly; Secure; SameSite=Lax`) hoạt động ổn định trên mọi trình duyệt (kể cả Safari iPhone) và không cần cấu hình phức tạp ở frontend.

### 4.2. Tạo Project 1 — Trang Khách hàng (`client`)
1. Vào `https://vercel.com` → **Add New Project** → chọn repo GitHub.
2. **Project Name**: ví dụ `phongtro-ngoctoan` (sẽ ra link `https://phongtro-ngoctoan.vercel.app`).
3. **Root Directory**: chọn **`client`** (Framework: `Vite`).
4. Bấm **Deploy**.

### 4.3. Tạo Project 2 — Trang Quản trị (`admin`)
1. Bấm **Add New Project** một lần nữa trên cùng repo GitHub.
2. **Project Name**: ví dụ `admin-phongtro-ngoctoan` (sẽ ra link `https://admin-phongtro-ngoctoan.vercel.app`).
3. **Root Directory**: chọn **`admin`** (Framework: `Vite`).
4. Bấm **Deploy**.

### 4.4. Quay lại Render cập nhật Origin
Vào Render → tab **Environment**, điền chính xác 2 URL Vercel vừa có vào:
- `CLIENT_ORIGIN=https://phongtro-ngoctoan.vercel.app`
- `ADMIN_ORIGIN=https://admin-phongtro-ngoctoan.vercel.app`

Bấm **Save Changes** để Render khởi động lại nhẹ với CORS chuẩn xác.

---

## Bước 5 — Khởi tạo Index DB & Tạo Tài khoản Admin Production

Tại máy tính của bạn (chỉ chạy 1 lần lúc khởi tạo Production, dùng chuỗi `MONGODB_URI` Production tạm thời trong phiên PowerShell — không lưu vào file Git):

```powershell
$env:MONGODB_URI="mongodb+srv://room_prod_app:<PASSWORD>@cluster0.xxxxx.mongodb.net/room_rental_prod?retryWrites=true&w=majority"
$env:MONGODB_DB_NAME="room_rental_prod"
npm --prefix server run db:init
npm --prefix server run admin:provision
```

Sau khi chạy xong:
1. Mở `https://admin-phongtro-ngoctoan.vercel.app/login`.
2. Đăng nhập bằng email & mật khẩu tạm vừa sinh, đổi ngay sang mật khẩu chính thức tối thiểu **12 ký tự** (`AT-35`).
3. Bắt đầu nhập các tin phòng thật chuẩn **5 phường Quận Bình Thạnh 2026** và **Xuất bản** (`AT-44`).

---

## Bước 6 — Cài đặt UptimeRobot (Chống Backend Ngủ & Cảnh báo Sự cố)

1. Đăng nhập `https://uptimerobot.com` → **Add New Monitor**.
2. **Monitor Type**: `HTTP(s)`.
3. **Friendly Name**: `Phong Tro Binh Thanh API`.
4. **URL**: `https://<ten-backend-cua-ban>.onrender.com/api/v1/health/ready`.
5. **Monitoring Interval**: `5 minutes` (Free tier).
6. Chọn Email nhận cảnh báo khi mất kết nối → **Create Monitor**.

---

## Bước 7 — Sao lưu Định kỳ (Backup & Kiểm tra Khôi phục)

Định kỳ hàng ngày/tuần trên máy quản trị hoặc GitHub Actions (với các secret lưu trong GitHub Repository Secrets), chạy lệnh:

```powershell
# Tạo bản sao lưu DB + Ảnh (tự động giữ 7 daily + 4 weekly)
npm --prefix server run db:backup

# Diễn tập khôi phục sang DB cô lập để kiểm chứng dữ liệu + ảnh không lỗi
npm --prefix server run db:restore:verify
```
