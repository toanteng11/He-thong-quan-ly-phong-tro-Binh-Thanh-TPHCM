# Room Nhà — Client

React/Vite responsive client cho website phòng trọ Bình Thạnh. Sprint 1 có trang giới thiệu đang xây dựng và khu admin tại `/admin/login`; danh mục public sẽ được bổ sung trong Sprint 2.

## Chạy local

Từ thư mục gốc repository:

~~~powershell
npm --prefix client run dev
~~~

Client gọi `/api/v1` qua proxy Vite tới Express trên cổng 3000. Không lưu credential ở client; phiên admin dùng cookie HttpOnly.
