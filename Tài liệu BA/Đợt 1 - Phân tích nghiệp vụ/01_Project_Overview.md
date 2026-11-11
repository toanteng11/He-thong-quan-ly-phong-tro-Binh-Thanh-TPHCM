# 01 — Project Overview

## 1. Thông tin dự án

| Thuộc tính | Nội dung |
|---|---|
| Tên | Website quản lý và giới thiệu phòng trọ Bình Thạnh |
| Chủ dự án/vận hành | Cá nhân sở hữu hệ thống, quản trị viên chính |
| Người dùng | Khách vãng lai và chủ dự án/admin |
| Phạm vi dữ liệu ban đầu | Các phòng do chủ dự án quản lý tại khu vực Bình Thạnh, TP.HCM |
| Sản phẩm | Website responsive dùng trên điện thoại, máy tính bảng và máy tính; có trang khách và khu admin |
| Mục tiêu phát hành | Production thật, truy cập bằng tên miền HTTPS sau nghiệm thu |
| Phiên bản tài liệu | 2.0 — Production baseline |
| Ngày cập nhật | 08/11/2026 |

## 2. Bối cảnh và vấn đề

Khách tìm phòng thường cần xem nhanh ảnh, giá, vị trí, diện tích, nội thất và tình trạng còn trống. Nội dung rời rạc hoặc không được cập nhật có thể khiến khách mất thời gian và liên hệ về phòng đã thuê. Chủ dự án cần một nơi tự quản lý nội dung mà không phải sửa mã nguồn.

Hệ thống có hai luồng dùng chung dữ liệu: khách truy cập trang công khai không cần tài khoản; admin đăng nhập vào khu vực riêng để quản lý phòng. Website giúp tham khảo và liên hệ trực tiếp, không xử lý giao dịch thuê trong phiên bản đầu.

Yêu cầu “dùng được ngay sau khi hoàn thành” được hiểu là sản phẩm đã triển khai lên hạ tầng production, dùng tên miền và HTTPS, có nội dung phòng thật, ảnh thật, kênh liên hệ thật, tài khoản admin an toàn và hướng dẫn vận hành. Bản chạy local hoặc dữ liệu demo không được xem là hoàn tất.

## 3. Mục tiêu và kết quả mong đợi

1. Khách mở website từ điện thoại hoặc máy tính, xem và lọc phòng không cần đăng nhập.
2. Tin công khai cho biết giá, diện tích, khu vực/địa chỉ theo chính sách riêng tư, tiện nghi, ảnh, tình trạng và kênh liên hệ.
3. Chủ dự án tự tạo, sửa, xem trước, xuất bản, ẩn, đổi trạng thái và lưu trữ tin bằng giao diện admin.
4. Dữ liệu admin và ảnh được bảo vệ; người chưa xác thực không thể thay đổi dữ liệu.
5. Tên miền production được phục vụ qua HTTPS; hệ thống có sao lưu, theo dõi lỗi cơ bản và quy trình khôi phục.
6. Tốc độ trang công khai phù hợp với thiết bị di động và mạng di động thông thường.
7. Có mã nguồn, cấu hình triển khai, tài liệu bàn giao và đường mở rộng khi nghiệp vụ tăng.

## 4. Phạm vi sản phẩm

### 4.1. Trong phiên bản production đầu tiên

- Trang chủ, danh sách phòng, tìm kiếm/lọc và trang chi tiết.
- Admin đăng nhập/đăng xuất; không có tự đăng ký admin công khai.
- Admin tạo, sửa, xem trước, lưu nháp, xuất bản, ẩn, cập nhật tình trạng, xóa mềm và khôi phục tin.
- Tải ảnh phòng lên, chọn ảnh bìa, sắp xếp và gỡ ảnh.
- Hiển thị nút gọi/Zalo khi có thông tin liên hệ hợp lệ và được chủ dự án cho phép công khai.
- Cấu hình dữ liệu production, tên miền, HTTPS, lưu ảnh, cơ sở dữ liệu, sao lưu, health check, nhật ký lỗi và hướng dẫn vận hành.
- Thiết kế responsive; các luồng chính phải dùng được trên điện thoại và máy tính.
- Seed/nhập các tin phòng thật do chủ dự án cung cấp; không bàn giao website chỉ chứa nội dung mẫu.
- Một chủ dự án/admin duy nhất trong lần phát hành đầu.

### 4.2. Ngoài phiên bản đầu

Tài khoản khách, đặt lịch, giữ chỗ, đặt cọc, thanh toán, hợp đồng, người thuê, hóa đơn điện nước, chat trong ứng dụng, đánh giá, nhiều chủ nhà, phân quyền nhiều cấp, ứng dụng native và đồng bộ sàn bên ngoài. Các nội dung này chỉ thực hiện qua yêu cầu thay đổi/lộ trình sau.

## 5. Người dùng và giá trị

| Người dùng | Giá trị cần nhận |
|---|---|
| Khách vãng lai | Xem phòng rõ ràng, thuận tiện trên màn hình nhỏ hoặc lớn; biết tình trạng và liên hệ nhanh. |
| Chủ dự án/admin | Tự cập nhật nội dung, giá, ảnh và tình trạng; kiểm soát những gì công khai. |
| Người bảo trì | Có cấu trúc, cấu hình, bản sao lưu và hướng dẫn đủ để xử lý thay đổi/sự cố. |

## 6. Cách đo thành công và mục tiêu vận hành

| Mục tiêu | Cách xác nhận |
|---|---|
| Hoạt động trên production | Truy cập tên miền thật qua HTTPS; các URL công khai và admin hoạt động sau khi triển khai. |
| Khách dùng được trên điện thoại/máy tính | Luồng danh sách → chi tiết → liên hệ hoàn tất ở viewport 360 px và máy tính 1280 px trở lên, không có lỗi bố cục chặn thao tác. |
| Nội dung có thể vận hành | Admin đăng nhập và cập nhật một tin thật; dữ liệu mới xuất hiện đúng ở trang công khai sau khi lưu/xuất bản. |
| Quyền truy cập đúng | Tin nháp/ẩn/xóa không lộ công khai; request chưa xác thực bị từ chối khi gọi API admin. |
| Tốc độ phù hợp | Nội dung chính trang danh sách đạt mục tiêu p75 ≤ 3 giây trên cấu hình kiểm thử mạng di động đã ghi trong tài liệu 10. |
| Có thể khôi phục | Bản sao lưu database và ảnh được tạo; khôi phục thử ở môi trường không production thành công trước nghiệm thu. |
| Có thể bàn giao | Chủ dự án nhận thông tin truy cập, cách cập nhật tin, sao lưu, khôi phục, hỗ trợ và chi phí định kỳ. |

Mục tiêu vận hành là yêu cầu nghiệm thu ban đầu, không phải cam kết SLA của nhà cung cấp. Tần suất sao lưu mục tiêu là hàng ngày, lưu tối thiểu 7 bản hàng ngày và 4 bản hàng tuần; mục tiêu RPO ≤ 24 giờ và RTO ≤ 1 ngày làm việc. Chủ dự án phải xác nhận ngân sách/hạ tầng hỗ trợ các mục tiêu này trước khi chốt triển khai.

## 7. Giả định và điều kiện phụ thuộc

- Chủ dự án là người có quyền quyết định cuối cùng và admin duy nhất trong phiên bản đầu.
- Chủ dự án cung cấp quyền quản lý tên miền/DNS, tài khoản hoặc quyền triển khai, ngân sách vận hành và thông tin thanh toán với các nhà cung cấp.
- Chủ dự án cung cấp nội dung phòng chính xác, ảnh có quyền sử dụng, giá, diện tích, địa chỉ được phép công khai, số điện thoại/Zalo và email nhận khôi phục admin.
- Chủ dự án phê duyệt công khai địa chỉ đầy đủ hay chỉ khu vực/phường.
- Chủ dự án phê duyệt chính sách sao lưu, lưu trữ và xóa dữ liệu, cũng như chi phí recurring.
- Nhóm triển khai chọn nhà cung cấp phù hợp với mục tiêu bảo mật, backup, performance và ngân sách; các tài khoản sở hữu dịch vụ phải thuộc chủ dự án.
- Website production vẫn cần được duy trì sau bàn giao: thanh toán dịch vụ, kiểm tra cảnh báo, cập nhật bảo mật và rà soát tính đúng của tin do chủ dự án thực hiện.

## 8. Rủi ro cấp dự án và giảm thiểu

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Chưa có domain, DNS, hosting hoặc ngân sách | Không thể phát hành production dù phần mềm đã xong | Chốt chủ tài khoản, chi phí và quyền truy cập trước Sprint triển khai production. |
| Thiếu ảnh/nội dung/địa chỉ/kênh liên hệ thật | Website lên production nhưng khách chưa thể sử dụng có ích | Chuẩn bị dữ liệu thật và duyệt quyền công khai trước nghiệm thu. |
| Giá/tình trạng không được cập nhật | Khách liên hệ về phòng không còn phù hợp | Làm thao tác đổi trạng thái ngắn, hiển thị ngày cập nhật và có quy trình rà soát. |
| Lộ tài khoản admin hoặc ảnh/tin riêng | Chỉnh sửa trái phép hoặc lộ nội dung chưa duyệt | Không có tự đăng ký, bảo vệ phiên, giới hạn đăng nhập, phân quyền backend và kiểm thử truy cập. |
| Ảnh lớn làm chậm trang/tăng chi phí | Trải nghiệm di động kém hoặc vượt ngân sách storage/bandwidth | Giới hạn upload, tối ưu ảnh, lưu object storage và theo dõi dung lượng. |
| Lỗi nhà cung cấp hoặc thao tác xóa | Gián đoạn hoặc mất dữ liệu | Backup tách biệt, kiểm tra khôi phục, xóa mềm, health check và runbook. |
| Phạm vi tăng trong khi phát triển | Trễ phát hành và phát sinh chi phí | Dùng quy trình quản lý thay đổi ở tài liệu 11; bảo vệ phạm vi production đầu tiên. |

## 9. Thuật ngữ

- **Tin phòng**: bản ghi giới thiệu một phòng cho thuê độc lập.
- **Tình trạng phòng**: Còn trống hoặc Đã thuê.
- **Trạng thái tin**: Nháp, Đã xuất bản hoặc Đã ẩn; trạng thái xóa mềm là cờ vòng đời riêng.
- **Production**: môi trường thật có tên miền, HTTPS và dữ liệu thật, phục vụ khách.
- **RPO**: lượng dữ liệu tối đa có thể mất tính theo thời gian khi khôi phục.
- **RTO**: thời gian mục tiêu để khôi phục dịch vụ sau sự cố.
- **Responsive**: bố cục thích ứng với kích thước màn hình.
- **MVP**: phiên bản đầu có phạm vi giới hạn nhưng đủ hoàn chỉnh để vận hành thật.
- **Sẵn sàng production**: đạt các cổng kiểm tra bảo mật, dữ liệu, vận hành và nghiệm thu trong tài liệu 10.

## 10. Điều kiện bàn giao production

Chỉ xác nhận hoàn tất khi tất cả mục bắt buộc sau đây được đáp ứng:

- [ ] Website mở được trên tên miền do chủ dự án quản lý và HTTPS hợp lệ.
- [ ] Trang công khai, trang chi tiết, trang đăng nhập và luồng admin hoạt động trên điện thoại và máy tính.
- [ ] Có ít nhất một tin thật đã được chủ dự án duyệt; không còn dữ liệu demo hoặc mật khẩu mẫu.
- [ ] Tài khoản admin ban đầu được cấp an toàn, chủ dự án đổi mật khẩu/nhận quyền kiểm soát, không có endpoint đăng ký admin công khai.
- [ ] Tin nháp/ẩn/xóa mềm và ảnh chưa xuất bản không bị trả về qua API công khai.
- [ ] Database không mở công khai trực tiếp; bí mật không được đưa vào mã nguồn/frontend.
- [ ] Backup database và ảnh được cấu hình; đã thử khôi phục và ghi lại kết quả.
- [ ] Health check, log lỗi, cảnh báo tối thiểu và hướng dẫn xử lý sự cố cơ bản có sẵn.
- [ ] Tốc độ, responsive, bảo mật, tương thích trình duyệt và các kịch bản AT trong tài liệu 10 đạt.
- [ ] Có quy trình triển khai/quay lui, tài liệu cập nhật tin, quản lý chi phí dịch vụ và đầu mối hỗ trợ.
- [ ] Chủ dự án ký xác nhận nghiệm thu và nhận quyền sở hữu tài khoản dịch vụ/hạ tầng.

Nếu chủ dự án chưa cung cấp domain, tài khoản dịch vụ, nội dung thật hoặc ngân sách vận hành thì phần mềm có thể hoàn thiện trên staging, nhưng chưa đủ điều kiện tuyên bố production sẵn sàng.

---

**Kết quả mong đợi:** một website responsive đã triển khai thật, khách có thể xem và liên hệ về phòng mà không cần tài khoản; chủ dự án có thể tự vận hành tin phòng qua admin an toàn.
