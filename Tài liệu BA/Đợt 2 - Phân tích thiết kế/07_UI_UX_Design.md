# 07 — UI/UX Design

## 1. Mục tiêu trải nghiệm

- Khách hiểu được giá, vị trí và tình trạng phòng chỉ sau khi lướt nhanh.
- Khách xem phòng thuận tiện trên điện thoại mà không phải tạo tài khoản.
- Admin hoàn tất việc đăng/sửa tin với ít bước, có xem trước và báo lỗi rõ.
- Giao diện tạo cảm giác chỉn chu, dễ đọc, tải nhanh và nhất quán.

## 2. Nguyên tắc thiết kế

1. Thiết kế mobile-first; nội dung quan trọng xuất hiện sớm.
2. Giá và trạng thái có độ nổi bật cao; không dùng màu sắc làm dấu hiệu duy nhất.
3. Ảnh dùng đúng kích thước hiển thị, có ảnh thay thế khi tải lỗi.
4. Từ ngữ tiếng Việt đơn giản, nhất quán giữa giao diện khách và admin.
5. Biểu mẫu quản trị chia nhóm trường; giữ dữ liệu đã nhập khi xảy ra lỗi.
6. Hạn chế animation và tài nguyên nặng để ưu tiên tốc độ.

## 3. Cấu trúc thông tin

### Khu vực công khai

- Trang chủ: giới thiệu ngắn, ô tìm kiếm, phòng mới/đang còn trống.
- Danh sách phòng: từ khóa, bộ lọc, sắp xếp, phân trang.
- Chi tiết phòng: gallery, thông tin, tiện nghi, địa chỉ/khu vực, tình trạng, nút liên hệ.
- Giới thiệu/liên hệ: thông tin chủ dự án nếu cần.

### Khu vực quản trị

- Đăng nhập.
- Dashboard: số tin và lối tắt.
- Danh sách tin: lọc Nháp/Đã xuất bản/Đã ẩn và Còn trống/Đã thuê.
- Tạo/sửa tin: thông tin phòng, địa chỉ, giá, tiện nghi, liên hệ, ảnh và trạng thái.
- Tài khoản: đăng xuất; khôi phục thông tin đăng nhập theo quy trình được chọn.

## 4. Màn hình và thành phần

| Màn hình | Thành phần chính | Hành động chính |
|---|---|---|
| Trang chủ | Logo/tên, tìm kiếm, khu vực nổi bật, thẻ phòng | Tìm phòng, mở chi tiết |
| Danh sách | Thanh tìm, bộ lọc, số kết quả, thẻ phòng, phân trang | Lọc, xóa lọc, chọn tin |
| Chi tiết | Gallery ảnh, nhãn tình trạng, giá, thông tin phòng, tiện nghi, liên hệ | Gọi/Zalo, quay lại danh sách |
| Đăng nhập admin | Tên đăng nhập/email, mật khẩu, lỗi đăng nhập | Đăng nhập |
| Dashboard | Số tin theo trạng thái, phòng còn trống, nút tạo tin | Quản lý tin |
| Danh sách admin | Tìm tin, lọc trạng thái, ngày cập nhật, thao tác | Sửa, ẩn/xuất bản, xóa |
| Biểu mẫu tin | Trường nội dung, giá, địa chỉ, tiện nghi, upload ảnh, xem trước | Lưu nháp, xuất bản |

## 5. Phác thảo bố cục bằng chữ

### Thẻ phòng trên di động

1. Ảnh bìa theo tỷ lệ ổn định.
2. Nhãn Còn trống/Đã thuê trên ảnh hoặc ngay cạnh tiêu đề.
3. Tiêu đề và giá/tháng.
4. Khu vực và diện tích.
5. Nút mở chi tiết đủ lớn để chạm.

### Trang chi tiết trên di động

1. Nút quay lại.
2. Gallery có ảnh chính và chỉ báo số lượng ảnh.
3. Tiêu đề, giá, tình trạng.
4. Thông tin nhanh: diện tích, loại phòng, khu vực.
5. Mô tả và danh sách tiện nghi.
6. Địa chỉ và ngày cập nhật.
7. Nút liên hệ cố định gần cuối màn hình hoặc dễ truy cập khi cuộn.

### Biểu mẫu admin

1. Thông tin cơ bản.
2. Giá, diện tích và địa chỉ.
3. Nội thất/tiện nghi và mô tả.
4. Tải ảnh, chọn ảnh bìa, sắp xếp.
5. Thông tin liên hệ và lựa chọn công khai.
6. Tình trạng phòng/trạng thái tin.
7. Nút Lưu nháp, Xem trước, Xuất bản.

## 6. Hành vi responsive baseline

- Màn nhỏ khoảng 360–480 px: một cột, bộ lọc mở dạng panel/drawer, nút dễ chạm.
- Màn vừa: danh sách có thể hai cột nếu thẻ vẫn đọc rõ.
- Màn rộng: danh sách nhiều cột; trang chi tiết có thể chia gallery và thông tin thành hai vùng.
- Kích thước điểm gãy cụ thể chốt khi dựng giao diện; tránh khóa layout vào một thiết bị.

## 7. Trạng thái giao diện bắt buộc

| Trạng thái | Cách thể hiện |
|---|---|
| Đang tải | Skeleton/placeholder đơn giản; không làm trang nhảy bố cục. |
| Không có tin | Giải thích chưa có phòng phù hợp và cho xóa bộ lọc. |
| Lỗi mạng | Nêu lỗi ngắn gọn, có nút thử lại. |
| Ảnh lỗi | Hiển thị ảnh thay thế; không để khung trống gây vỡ trang. |
| Form lỗi | Đánh dấu trường sai, mô tả cách sửa, giữ các trường hợp lệ. |
| Lưu thành công | Thông báo rõ; trạng thái hiển thị được cập nhật. |
| Tin đã thuê | Nhãn dễ nhận biết; không chỉ đổi màu. |

## 8. Nội dung, khả năng truy cập và hình ảnh

- Dùng tiếng Việt có dấu; giá hiển thị có phân cách hàng nghìn và đơn vị VND/tháng.
- Ảnh có văn bản thay thế ngắn nếu chủ dự án cung cấp; nút có nhãn đọc được.
- Bảo đảm tương phản chữ/nền, điều hướng bằng bàn phím cho thao tác chính và focus dễ thấy.
- Không dùng màu đỏ/xanh làm chỉ báo trạng thái duy nhất; kèm chữ.
- Ảnh cần rõ, đúng phòng và không bị kéo méo; ưu tiên tải ảnh theo kích thước cần hiển thị.

## 9. Định hướng hình ảnh

Giao diện khách dùng nền sáng, khoảng trắng thoáng, màu nhấn nhất quán và ảnh phòng làm trọng tâm. Khu quản trị thiên về tính thực dụng, bảng dễ quét, trạng thái dễ phân biệt. Logo, font và màu thương hiệu là dữ liệu cần chủ dự án cung cấp hoặc phê duyệt.

## 10. Nội dung thiết kế đã chốt và phần chờ chủ dự án cung cấp

- Baseline: địa chỉ public mặc định ở mức phường/khu vực; địa chỉ đầy đủ chỉ hiện khi admin bật cho từng tin.
- Baseline: tối đa 15 ảnh/tin, 10 MB/ảnh; định dạng JPEG/PNG/WebP.
- Baseline: không tích hợp bản đồ trong phiên bản đầu; có thể mở rộng sau.
- Chủ dự án cung cấp tên/nhận diện thương hiệu, logo nếu có, màu chủ đạo và hình ảnh thật. Nếu chưa có bộ nhận diện, dùng cấu hình trung tính đã duyệt để phát hành, không dùng thương hiệu giả.

## 11. Đặc tả tương tác cho MVP

### 11.1. Trang danh sách và bộ lọc

- Bộ lọc gồm từ khóa/khu vực, giá tối thiểu-tối đa, diện tích tối thiểu-tối đa và tình trạng phòng.
- Trên điện thoại, bộ lọc mở trong drawer hoặc panel có nút **Áp dụng** và **Xóa lọc**; số bộ lọc đang dùng được thể hiện rõ.
- Trên màn hình rộng, bộ lọc có thể hiển thị cạnh danh sách hoặc thành thanh lọc ngang.
- Kết quả cần có trạng thái đang tải, số lượng kết quả và trang hiện tại.
- Khi chuyển trang, giữ nguyên bộ lọc và thứ tự sắp xếp.
- Mặc định xếp phòng Còn trống trước, sau đó theo ngày xuất bản mới nhất; tin Đã thuê vẫn hiển thị nếu còn public và phải có nhãn trạng thái.
- Mỗi thẻ mở đúng trang chi tiết; ảnh có thể mở gallery nhưng không làm mất thao tác quay lại kết quả.

### 11.2. Trang chi tiết và liên hệ

- Thứ tự ưu tiên: tình trạng, giá, tiêu đề, khu vực/diện tích, ảnh, tiện nghi, mô tả, địa chỉ, liên hệ.
- Nhãn **Đã thuê** vẫn hiện rõ nếu tin đang xuất bản.
- Nút Gọi chỉ xuất hiện nếu có số điện thoại đã cho phép công khai; nút Zalo chỉ xuất hiện nếu có thông tin Zalo.
- Địa chỉ phải theo lựa chọn công khai đã chốt ở tài liệu Data Analysis; không tự hiển thị địa chỉ riêng tư.
- Hiển thị ngày cập nhật gần nhất để khách có dấu hiệu về độ mới của tin.

### 11.3. Biểu mẫu admin

- Có hai thao tác lưu rõ ràng: **Lưu nháp** và **Xuất bản/Lưu thay đổi**.
- Trường giá ghi chú đơn vị VND/tháng; diện tích ghi m²; không chỉ dùng placeholder làm nhãn trường.
- Lỗi validation đặt cạnh trường và có tóm tắt lỗi ở đầu biểu mẫu nếu có nhiều lỗi.
- Sau khi lưu thành công, thông báo trạng thái và đưa admin về danh sách hoặc trang tin đã lưu.
- Nếu rời trang khi còn thay đổi chưa lưu, hỏi xác nhận để tránh mất nội dung.
- Tải ảnh hỗ trợ xem trước, chọn ảnh bìa, đổi thứ tự, gỡ ảnh; hiển thị tiến trình và lỗi theo từng ảnh.
- Tình trạng phòng và trạng thái tin đặt thành hai điều khiển riêng để tránh nhầm.
- Xóa tin có hộp xác nhận nêu rõ tên/mã tin và chính sách xóa đã chọn.

## 12. Cấu trúc trường biểu mẫu và lỗi

| Nhóm | Trường | Kiểm tra/hiển thị lỗi |
|---|---|---|
| Nội dung | Tiêu đề, mô tả, loại phòng | Báo trường bắt buộc hoặc giới hạn ký tự; giữ dữ liệu khi lỗi. |
| Giá/diện tích | Giá thuê, diện tích | Chỉ nhận số dương; hiển thị đơn vị. |
| Địa chỉ | Đường/phường/quận/thành phố; địa chỉ công khai | Phân biệt rõ trường lưu nội bộ và phần khách nhìn thấy. |
| Tiện nghi | Danh sách tiện nghi | Chọn nhiều mục; không bắt buộc nếu chưa có danh mục. |
| Liên hệ | Điện thoại, Zalo, cho phép công khai | Cho biết kênh nào sẽ xuất hiện trên trang công khai. |
| Ảnh | Tệp, ảnh bìa, thứ tự | Kiểm tra theo giới hạn ở Data Analysis; chỉ rõ ảnh lỗi. |
| Trạng thái | Còn trống/Đã thuê; Nháp/Đã xuất bản/Đã ẩn | Hai trường độc lập, mỗi trường có mô tả ngắn. |

Danh sách trường bắt buộc để xuất bản cần được thống nhất trong Requirements trước khi chốt form.

## 13. Nội dung mẫu và trạng thái biên

Thiết kế phải được xem xét với tiêu đề dài, địa chỉ dài, giá nhiều chữ số, không có ảnh, một ảnh, nhiều ảnh, tin đã thuê, tin không có Zalo, kết quả rỗng và lỗi mạng. Card cần giữ chiều cao tương đối ổn định; văn bản dài được giới hạn dòng ở danh sách và hiển thị đầy đủ ở chi tiết.

## 14. Tiêu chí duyệt thiết kế

- Khách mới nhìn thấy ngay cách tìm phòng và cách mở chi tiết.
- Giá, tình trạng và khu vực nhận biết được mà không cần mở tin.
- Không có thành phần công khai nào yêu cầu tài khoản khách.
- Admin hiểu rõ nút nào lưu nháp và nút nào công khai tin.
- Tình trạng phòng không bị nhầm với trạng thái tin.
- Thiết kế được duyệt ở kích thước điện thoại nhỏ, điện thoại lớn và màn hình máy tính.
- Trạng thái tải, rỗng, lỗi, thành công và xác nhận xóa đã có bản thiết kế.
## 15. Đặc tả giao diện cho production đa thiết bị

### 15.1. Viewport và hành vi responsive

| Khoảng rộng tham chiếu | Bố cục |
|---|---|
| 360–767 px | Ưu tiên một cột; bộ lọc mở bằng drawer hoặc accordion; CTA gọi/Zalo dễ chạm; ảnh theo chiều rộng màn hình. |
| 768–1023 px | Danh sách hai cột khi card đủ rộng; filter có thể thu gọn; admin giữ thao tác chính trong vùng nhìn thấy. |
| 1024–1439 px | Public dùng lưới 2–3 cột tùy không gian; admin có sidebar và bảng có thể cuộn/đổi thành card nếu cần. |
| 1440 px trở lên | Giới hạn độ rộng nội dung để tránh dòng chữ quá dài; không kéo card/ảnh quá lớn. |

Các breakpoint là hướng thiết kế; nghiệm thu dựa vào không tràn ngang, dễ thao tác và đủ nội dung ở 360 px, 768 px, 1280 px và 1440 px. Không yêu cầu trải nghiệm mobile phải giả lập giao diện desktop thu nhỏ.

### 15.2. Trang public

- Header có nhận diện website, danh sách phòng, tìm kiếm và CTA liên hệ/giới thiệu phù hợp.
- Card ưu tiên ảnh, giá VND/tháng, tình trạng, tiêu đề, diện tích và khu vực; không yêu cầu khách mở chi tiết mới biết phòng đã thuê.
- Bộ lọc có nút áp dụng/xóa lọc trên mobile; giá min/max và diện tích được kiểm tra; trạng thái filter còn rõ khi quay lại danh sách.
- Chi tiết phòng có gallery/ảnh bìa, giá, tình trạng, nội thất/tiện nghi, mô tả, khu vực, ngày cập nhật và CTA gọi/Zalo.
- Địa chỉ chi tiết chỉ hiển thị khi tin cho phép công khai. Không render địa chỉ riêng ở HTML ẩn, metadata, JSON-LD hoặc response client.
- Tin không còn public trả trang 404 thân thiện và nút quay về danh sách; không lộ trạng thái draft/hidden/deleted.
- Thẻ “Đã thuê” phải có chữ và hình thức khác biệt, không dựa vào màu sắc duy nhất.

### 15.3. Khu admin

- Login dễ dùng trên mobile và desktop; không có đường dẫn đăng ký admin.
- Danh sách admin có tìm kiếm nhanh, lọc status, occupancy, cập nhật gần đây và mục đã lưu trữ.
- Form tạo/sửa nhóm trường: nội dung, giá/diện tích, địa chỉ và quyền công khai, tiện nghi, liên hệ và quyền công khai, ảnh, trạng thái.
- Form báo trường thiếu/sai ngay gần trường; có tóm tắt lỗi khi submit; giữ dữ liệu đã nhập nếu lỗi mạng.
- Nút Lưu nháp và Xem trước tách biệt với Xuất bản; thao tác publish hiển thị điều kiện còn thiếu.
- Thao tác xóa mềm yêu cầu xác nhận; màn xác nhận nói rõ tin sẽ gỡ khỏi public và có thể khôi phục.
- Trạng thái lưu, loading, lỗi backend, hết phiên và upload progress phải rõ; không báo thành công trước phản hồi server.
- Không đưa secret, token hoặc thông tin hạ tầng vào bất kỳ màn hình nào.

### 15.4. Khả năng truy cập cơ bản

- Vùng chạm thao tác chính tối thiểu khoảng 44 x 44 CSS px khi bố cục cho phép.
- Tất cả hành động chính dùng được bằng bàn phím; focus có thể nhìn thấy.
- Ảnh có alt phù hợp; ảnh trang trí alt rỗng.
- Nhãn form gắn đúng input; lỗi có nội dung và không chỉ dùng màu.
- Dialog có tiêu đề, focus quản lý được và đóng/hủy bằng cách rõ ràng.
- Hỗ trợ zoom trình duyệt, không khóa chiều rộng hoặc font-size gây khó đọc.

### 15.5. Trạng thái hệ thống và go-live

Thiết kế phải có loading/skeleton, không có dữ liệu, không có kết quả, lỗi tải lại được, ảnh lỗi, 404, offline/mạng chậm, phiên admin hết hạn, upload thành công/thất bại và xác nhận thao tác phá hủy. Khi hệ thống bảo trì, hiển thị trang bảo trì thân thiện thay vì exception hoặc màn trắng.

## 16. Tiêu chí duyệt UI production

- [ ] Các luồng public/admin hoàn thành trên 360 px và desktop 1280 px.
- [ ] Không tràn ngang ngoài khu vực được thiết kế có chủ ý; không có nút chính bị che.
- [ ] Giá, tình trạng, khu vực và kênh liên hệ nhận diện nhanh.
- [ ] Địa chỉ/liên hệ private không xuất hiện trong trang hoặc metadata khi chưa được bật.
- [ ] Draft/hidden/deleted không render từ public hoặc preview không xác thực.
- [ ] Có đủ trạng thái tải, lỗi, rỗng, no-result, upload và session expired.
- [ ] Bảng admin có cách dùng trên mobile, không buộc thao tác kéo ngang để tìm action quan trọng.
- [ ] Cỡ ảnh/ảnh loading tối ưu không làm bố cục nhảy nghiêm trọng.

