# 02 — Stakeholder Analysis

## 1. Mục đích

Xác định ai sử dụng, quyết định hoặc bị ảnh hưởng bởi hệ thống. Trong MVP, chủ dự án vừa là chủ sản phẩm vừa là người vận hành; khách tìm phòng là người dùng trang công khai.

## 2. Bên liên quan

| Bên liên quan | Vai trò | Ảnh hưởng | Nhu cầu/quan tâm | Tham gia |
|---|---|---:|---|---|
| Chủ dự án/chủ nhà | Chủ sản phẩm, admin duy nhất | Cao | Đăng/sửa tin nhanh, kiểm soát giá và trạng thái, bảo vệ dữ liệu, chi phí hợp lý. | Chốt yêu cầu, cung cấp dữ liệu, duyệt thiết kế và nghiệm thu. |
| Khách tìm phòng | Người dùng công khai | Cao với UX | Dùng điện thoại, xem giá/tình trạng/ảnh, tìm nhanh và liên hệ dễ dàng. | Dùng thử luồng tìm phòng và phản hồi điểm khó hiểu. |
| Người phát triển/bảo trì | Thực hiện kỹ thuật; có thể là chủ dự án | Trung bình | Yêu cầu rõ, quy trình triển khai và bảo trì vừa sức. | Thiết kế, xây dựng, sửa lỗi và bàn giao. |
| Hosting/domain | Nhà cung cấp hạ tầng nếu thuê ngoài | Trung bình | Cấu hình, chi phí, giới hạn tài nguyên, sao lưu. | Được chọn khi triển khai; không quyết định nội dung nghiệp vụ. |
| Dịch vụ lưu ảnh/email | Tích hợp tùy chọn | Thấp-trung bình | Chỉ nhận dữ liệu cần thiết cho lưu ảnh hoặc khôi phục tài khoản. | Được chọn sau khi chốt công nghệ và chính sách dữ liệu. |

## 3. Hồ sơ người dùng

### 3.1. Chủ dự án — người quản trị

- Dùng một mình trong MVP, có thể thao tác trên điện thoại hoặc máy tính.
- Cần đổi giá và tình trạng ngay khi có thay đổi.
- Không nhất thiết có kiến thức kỹ thuật; biểu mẫu cần có nhãn và lỗi dễ hiểu.
- Cần bảo mật tài khoản nhưng thao tác hằng ngày phải ngắn.

### 3.2. Khách tìm phòng

- Phần lớn có thể truy cập từ điện thoại và không có tài khoản.
- Muốn lọc theo ngân sách, diện tích, khu vực và tình trạng.
- Cần xem nội dung đủ để quyết định có liên hệ hay không.
- Không nên bị yêu cầu cung cấp dữ liệu cá nhân để xem phòng.

## 4. Ma trận nhu cầu và ưu tiên

| Nhu cầu | Chủ dự án | Khách | Ưu tiên |
|---|---:|---:|---|
| Giá và tình trạng rõ ràng | Cao | Rất cao | Must |
| Trang di động nhanh, dễ đọc | Cao | Rất cao | Must |
| Quản trị tin không cần lập trình | Rất cao | Không áp dụng | Must |
| Liên hệ thuận tiện | Cao | Cao | Must |
| Báo cáo nâng cao | Trung bình | Không áp dụng | Should/Later |
| Nhiều tài khoản/phân quyền | Thấp trong MVP | Không áp dụng | Later |

## 5. Quyền và trách nhiệm

| Hoạt động | Admin | Khách | Nhà cung cấp |
|---|---:|---:|---:|
| Xem tin đã xuất bản | Có | Có | Không |
| Xem nháp/tin ẩn | Có | Không | Không |
| Tạo/sửa/xóa tin | Có | Không | Không |
| Cập nhật giá/tình trạng | Có | Không | Không |
| Thay đổi hosting | Chủ dự án nếu có tài khoản | Không | Theo dịch vụ được cấp |
| Cấp tài khoản quản trị | Chủ dự án | Không | Không |

Chủ dự án chịu trách nhiệm cuối cùng về độ chính xác của nội dung và quyết định công khai. Khách chỉ được đọc dữ liệu công khai.

## 6. Cách ra quyết định và giao tiếp

- Chủ dự án phê duyệt cuối cùng về phạm vi, nội dung, chi phí và thay đổi nghiệp vụ.
- Thay đổi ảnh hưởng đến bảo mật, dữ liệu, chi phí hoặc lịch phát hành cần được ghi trong Change Management.
- Phản hồi của khách dùng thử là đầu vào cải thiện, không tự động mở rộng MVP.
- Nếu thêm người vận hành sau này, cần rà soát lại phân quyền, nhật ký và trách nhiệm.

## 7. Riêng tư và công khai dữ liệu

- Chỉ công khai điện thoại/Zalo khi chủ dự án nhập và chọn hiển thị.
- Không thu thập hồ sơ khách thuê trong MVP.
- Không chia sẻ mật khẩu admin. Việc khôi phục tài khoản cần xác minh chủ sở hữu.
- Nhà cung cấp hạ tầng chỉ nhận dữ liệu cần thiết để cung cấp dịch vụ.

## 8. Baseline stakeholder và đầu vào của chủ dự án

- Kênh mặc định: ít nhất một kênh public cho mỗi tin; điện thoại là lựa chọn đơn giản, Zalo có thể thêm.
- Địa chỉ public mặc định: phường/khu vực; địa chỉ đầy đủ cần admin bật theo từng tin.
- Người vận hành thứ hai không thuộc bản đầu. Nếu cần, phải bổ sung vai trò, quyền, audit và tài khoản qua change request.
- Chủ dự án còn cần cung cấp domain/DNS, ngân sách dịch vụ, nội dung/ảnh thật, email khôi phục và đầu mối nhận cảnh báo trước go-live.
## 9. Stakeholder baseline cho phát hành production

### 9.1. Vai trò, quyền quyết định và trách nhiệm go-live

| Vai trò | Trách nhiệm bắt buộc | Quyền quyết định |
|---|---|---|
| Chủ dự án/Product Owner | Cấp dữ liệu thật, xác nhận nội dung/ảnh/địa chỉ/liên hệ, sở hữu domain và tài khoản nhà cung cấp, duyệt ngân sách, cung cấp đầu mối nhận cảnh báo. | Chốt phạm vi, mức công khai dữ liệu, chi phí, chấp nhận rủi ro và ký nghiệm thu. |
| Admin vận hành | Đăng nhập, cập nhật tin, giá, ảnh và tình trạng phòng; rà soát tin định kỳ; giữ thông tin tài khoản an toàn. Trong phiên bản đầu có thể cùng là chủ dự án. | Quyết định nội dung nào xuất bản/ẩn/xóa mềm. |
| Khách | Xem thông tin công khai, liên hệ ngoài hệ thống. | Không có quyền ghi hoặc yêu cầu xử lý dữ liệu cá nhân vì MVP không thu hồ sơ khách. |
| Nhóm phát triển/bảo trì | Xây dựng, triển khai, thiết lập backup/monitoring, khắc phục lỗi và bàn giao tài liệu. | Không sở hữu domain, tài khoản cloud hay dữ liệu của chủ dự án sau bàn giao. |
| Nhà cung cấp hạ tầng/lưu ảnh/email | Cung cấp dịch vụ theo cấu hình và chính sách đã duyệt. | Không quyết định nội dung tin hoặc mức công khai dữ liệu. |

### 9.2. Quyền sở hữu và đầu vào dự án

- Domain, DNS, hosting/cloud, database, object storage, email gửi hệ thống và tài khoản thanh toán phải do chủ dự án sở hữu hoặc có quyền quản trị cao nhất.
- Không gửi mật khẩu production qua tài liệu BA, kho mã nguồn, ảnh chụp màn hình hoặc kênh công khai.
- Nhà phát triển chỉ nhận quyền tối thiểu cần thiết và thu hồi quyền sau bàn giao nếu không còn bảo trì.
- Chủ dự án bảo đảm có quyền sử dụng ảnh và nội dung được đưa lên website.
- Nếu chưa có người nhận cảnh báo, cơ chế khôi phục admin hoặc ngân sách backup phù hợp, ghi nhận là blocker go-live thay vì bỏ qua.

### 9.3. Ma trận tham gia

| Quyết định/hoạt động | Chủ dự án | Phát triển/bảo trì | Khách thử nghiệm | Nhà cung cấp |
|---|---|---|---|---|
| Chốt yêu cầu và nội dung public | A/R | C | C | I |
| Thiết kế/xây dựng/triển khai | A | R | I | C |
| Domain/DNS và thanh toán dịch vụ | A/R | C | I | C |
| Kiểm tra nghiệm thu | A | R | C | I |
| Khôi phục dữ liệu production | A phê duyệt | R thực hiện theo runbook | I | C |
| Quyết định rollback hoặc ngừng dịch vụ | A | R đề xuất/thực hiện | I | C |

A = chịu trách nhiệm phê duyệt cuối; R = thực hiện; C = tham vấn; I = được thông báo.

### 9.4. Xác nhận trước phát hành

Chủ dự án ký xác nhận tối thiểu: domain và HTTPS; nội dung/ảnh được phép công khai; thông tin liên hệ; mức chi phí định kỳ; tài khoản admin và quy trình khôi phục; chính sách backup; kết quả nghiệm thu và người tiếp nhận vận hành.

## 10. Quyết định còn chờ chủ dự án

| Mã | Câu hỏi | Mặc định đề xuất để lập kế hoạch | Thời điểm phải chốt |
|---|---|---|---|
| STK-01 | Địa chỉ chính xác có công khai không? | Chỉ hiển thị phường/khu vực; chi tiết chính xác chỉ công khai khi chủ dự án bật cho từng tin. | Trước nạp dữ liệu thật |
| STK-02 | Kênh liên hệ? | Điện thoại; Zalo là lựa chọn thêm. | Trước nghiệm thu nội dung |
| STK-03 | Ai nhận cảnh báo/sự cố? | Chủ dự án qua email đã xác minh. | Trước go-live |
| STK-04 | Ngân sách và mục tiêu backup? | Backup hàng ngày, 7 daily + 4 weekly, RPO ≤24 giờ, RTO ≤1 ngày làm việc. | Trước chốt nhà cung cấp |
| STK-05 | Có người vận hành thứ hai? | Không trong phiên bản đầu; bổ sung role cần change request. | Khi phạm vi thay đổi |

