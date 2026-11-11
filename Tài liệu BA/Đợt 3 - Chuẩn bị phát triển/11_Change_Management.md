# 11 — Change Management

## 1. Mục đích

Quản lý thay đổi yêu cầu, thiết kế, dữ liệu và phát hành để ứng dụng cá nhân không phát triển lan man, không mất dữ liệu và luôn biết phiên bản đang chạy.

## 2. Nguyên tắc

- Chủ dự án là người duyệt thay đổi cuối cùng.
- Sửa lỗi làm sai yêu cầu hiện có được ưu tiên trước chức năng mới.
- Thay đổi bảo mật, dữ liệu hoặc chi phí phải đánh giá trước khi làm.
- Không sửa trực tiếp dữ liệu production nếu chưa có sao lưu và cách khôi phục.
- Mọi phát hành cần có ghi chú ngắn và kiểm tra luồng chính.

## 3. Phiếu yêu cầu thay đổi

| Trường | Nội dung cần ghi |
|---|---|
| Mã yêu cầu | CR-YYYY-NNN |
| Người yêu cầu/ngày | Người đề xuất và ngày gửi |
| Mô tả | Thay đổi muốn có hoặc lỗi đang gặp |
| Lý do/giá trị | Vấn đề hoặc lợi ích |
| Phạm vi ảnh hưởng | Public, admin, API, database, ảnh, bảo mật, vận hành |
| Mức ưu tiên | Critical/High/Medium/Low |
| Tác động | Công sức, chi phí, rủi ro, tương thích dữ liệu |
| Quyết định | Chấp thuận/Từ chối/Hoãn và lý do |
| Phiên bản mục tiêu | Phiên bản dự kiến có thay đổi |

## 4. Quy trình xử lý thay đổi

1. Ghi yêu cầu vào phiếu và xác định vấn đề cần giải quyết.
2. Phân loại: lỗi, thay đổi nghiệp vụ, cải tiến giao diện, bảo mật hoặc vận hành.
3. Đánh giá ảnh hưởng tới yêu cầu, use case, dữ liệu, API, kiểm thử, chi phí và thời gian.
4. Chủ dự án chọn chấp thuận, từ chối hoặc để sau; ghi lý do.
5. Khi chấp thuận, cập nhật tài liệu liên quan và mã yêu cầu/phiên bản.
6. Thực hiện trong môi trường dev/staging; không làm trực tiếp trên dữ liệu thật.
7. Kiểm thử hồi quy các luồng bị ảnh hưởng.
8. Sao lưu trước phát hành, triển khai và kiểm tra sau phát hành.
9. Ghi kết quả, vấn đề còn mở và cách quay lui nếu cần.

## 5. Ưu tiên và xử lý khẩn cấp

| Mức | Ví dụ | Xử lý |
|---|---|---|
| Critical | Tài khoản admin bị lộ, dữ liệu bị truy cập trái phép, mất dữ liệu | Hạn chế truy cập/đưa hệ thống về trạng thái an toàn, sao lưu chứng cứ cần thiết, khôi phục theo kế hoạch. |
| High | Không thể đăng nhập hoặc không thể quản lý tin; tin nháp bị công khai | Ưu tiên sửa trước chức năng mới; kiểm tra dữ liệu và public API. |
| Medium | Một bộ lọc hoặc biểu mẫu có lỗi nhưng vẫn còn cách thao tác | Xếp vào bản sửa gần nhất. |
| Low | Cải thiện khoảng cách, màu hoặc nội dung nhỏ | Gộp vào đợt giao diện phù hợp. |

## 6. Phiên bản và ghi chú phát hành

Đề xuất dùng số phiên bản dạng MAJOR.MINOR.PATCH:

- **MAJOR**: thay đổi lớn làm thay đổi API/dữ liệu hoặc cách vận hành.
- **MINOR**: thêm chức năng tương thích với luồng hiện tại.
- **PATCH**: sửa lỗi hoặc cập nhật nhỏ.

Ghi chú phát hành gồm phiên bản, ngày, chức năng mới, lỗi đã sửa, thay đổi dữ liệu, vấn đề còn biết và hướng dẫn nếu admin cần thao tác thêm.

## 7. Quy trình phát hành và quay lui

1. Chốt danh sách thay đổi và kiểm tra trạng thái nghiệm thu.
2. Sao lưu database và tham chiếu ảnh; xác nhận bản sao lưu đọc được.
3. Triển khai phiên bản mới vào production.
4. Kiểm tra đăng nhập admin, xem danh sách public, mở chi tiết, cập nhật một tin mẫu an toàn.
5. Theo dõi lỗi trong thời gian đầu.
6. Nếu phát sinh lỗi nghiêm trọng, quay về phiên bản trước hoặc khôi phục dữ liệu theo kế hoạch; ghi nhận thao tác đã thực hiện.

Thao tác dữ liệu không thể đảo ngược cần được phê duyệt và có bản sao lưu phù hợp trước khi thực hiện.

## 8. Sao lưu và khôi phục

- Baseline production: backup database và ảnh hàng ngày; giữ tối thiểu 7 bản ngày + 4 bản tuần ở vị trí khác failure domain.
- Mục tiêu khôi phục RPO ≤24 giờ, RTO ≤1 ngày làm việc; chủ dự án xác nhận ngân sách/provider support trước go-live.
- Kiểm tra restore trước phát hành; lưu bằng chứng và cảnh báo khi job thất bại.
- Kiểm tra khôi phục thử định kỳ; một bản backup chưa từng restore chưa được coi là đã kiểm chứng.
- Ghi người thực hiện, thời gian, phiên bản dữ liệu và kết quả.

## 9. Bảo trì thường xuyên

- Rà soát tin đã thuê, tin cũ, link ảnh hỏng và thông tin liên hệ.
- Cập nhật framework/thư viện có đánh giá ảnh hưởng và kiểm tra hồi quy.
- Theo dõi dung lượng ảnh, database, lỗi đăng nhập và lỗi API.
- Xem lại quyền tài khoản dịch vụ; giữ số lượng quyền ở mức cần thiết.
- Lưu tài liệu cấu hình ở nơi an toàn, không đưa bí mật vào kho mã nguồn.

## 10. Nhật ký thay đổi tối thiểu

| Mã CR | Ngày | Thay đổi | Quyết định | Phiên bản | Người duyệt |
|---|---|---|---|---|---|
| CR-YYYY-NNN | YYYY-MM-DD | Mô tả ngắn | Chấp thuận/Từ chối/Hoãn | x.y.z | Chủ dự án |

## 11. Phân loại và đánh giá ảnh hưởng

| Loại | Ví dụ | Đánh giá bắt buộc |
|---|---|---|
| Lỗi | Giá hiển thị sai, bộ lọc bỏ sót tin | Luồng bị ảnh hưởng, dữ liệu đã lưu, cách tái hiện và mức nghiêm trọng. |
| Thay đổi nghiệp vụ | Bổ sung trường tiền cọc hoặc đổi chính sách địa chỉ | Phạm vi, yêu cầu/luồng/use case, ảnh hưởng khách và nội dung cũ. |
| Giao diện/trải nghiệm | Thay bộ lọc, thẻ phòng hoặc thứ tự thông tin | Thiết bị, khả năng dùng, tải trang và trạng thái giao diện. |
| Dữ liệu/API | Đổi trường, endpoint, enum trạng thái hoặc schema | Tương thích client, migration, dữ liệu cũ, backup và rollback. |
| Bảo mật/quyền riêng tư | Đổi đăng nhập, quyền API, cách công khai liên hệ/địa chỉ | Mối đe dọa, dữ liệu lộ/được lưu, phạm vi truy cập và kiểm thử bảo mật. |
| Vận hành/hạ tầng | Đổi hosting, nơi lưu ảnh, domain hoặc backup | Chi phí, downtime, phục hồi, bí mật cấu hình và phụ thuộc nhà cung cấp. |

Không triển khai thay đổi dữ liệu/API chỉ dựa trên nội dung chat hoặc ghi chú rời; cập nhật tài liệu chuẩn và mã yêu cầu trước khi phát hành.

## 12. Mẫu đánh giá tác động

Với mỗi CR, trả lời các câu hỏi:

1. Vấn đề nào cần giải quyết? Có cách đơn giản hơn không?
2. Người dùng nào và use case nào bị ảnh hưởng?
3. Những FR/NFR/BR nào cần sửa?
4. Có thay đổi dữ liệu, trạng thái, endpoint hoặc quyền truy cập không?
5. Ảnh hưởng nội dung/phòng đang lưu, ảnh, địa chỉ và thông tin liên hệ ra sao?
6. Cần migration hoặc chuyển đổi dữ liệu không? Có thể đảo ngược không?
7. Cần chạy lại kịch bản kiểm thử nào?
8. Tăng chi phí định kỳ, thời gian vận hành hoặc phụ thuộc dịch vụ nào?
9. Có kế hoạch phát hành, sao lưu và quay lui không?

Nếu tác động chưa rõ, trạng thái CR là **Cần phân tích**, không phải **Đã chấp thuận triển khai**.

## 13. Quy trình thay đổi phù hợp với một chủ dự án

Trong MVP không cần hội đồng thay đổi. Chủ dự án có thể vừa là người đề xuất vừa là người phê duyệt, nhưng quyết định vẫn cần được ghi lại để tránh tự thay đổi phạm vi mà không cập nhật tài liệu.

Trạng thái CR đề xuất: **Mới → Đang phân tích → Chấp thuận/Hoãn/Từ chối → Đang thực hiện → Đã kiểm tra → Đã phát hành**.

- Mỗi chức năng mới phải chỉ rõ là thay một yêu cầu cũ hay thêm vào phạm vi.
- Yêu cầu Must bị thay đổi cần cập nhật tài liệu Requirements, Use Case và Testing Acceptance.
- Thay đổi chưa cần cho vận hành được đưa vào backlog Later, không chen vào đợt phát hành đang ổn định.
- Lý do từ chối/hoãn cần được ghi ngắn gọn để xem lại sau.

## 14. Migration dữ liệu và tương thích

- Trước migration production, tạo và kiểm tra backup có thể khôi phục.
- Migration phải có mô tả dữ liệu cũ → mới, số bản ghi dự kiến, cách xác minh và cách quay lui.
- Tránh triển khai frontend/API mới phụ thuộc trường dữ liệu chưa được tạo ở production.
- Khi đổi enum trạng thái, phải xác định cách chuyển mọi giá trị cũ và bảo đảm không làm tin nháp/ẩn thành công khai.
- Không chạy script xóa/sửa hàng loạt trên production trước khi thử với bản sao dữ liệu đã ẩn danh.

## 15. Phản ứng sự cố bảo mật hoặc dữ liệu

Nếu nghi ngờ tài khoản admin bị lộ, ảnh riêng tư bị công khai hoặc dữ liệu bị sửa trái phép:

1. Hạn chế đường truy cập bị ảnh hưởng và kết thúc các phiên đăng nhập liên quan.
2. Giữ log cần thiết để tìm thời điểm/nguyên nhân; không công khai bí mật trong báo cáo.
3. Sao lưu trạng thái hiện tại trước khi khôi phục nếu cần điều tra.
4. Khôi phục quyền truy cập và dữ liệu từ nguồn tin cậy; kiểm tra bản sao trước khi ghi đè.
5. Kiểm tra API public/admin và các tin bị ảnh hưởng.
6. Ghi sự cố, tác động, biện pháp đã làm và việc cần ngăn lặp lại.

Nếu dữ liệu cá nhân đã bị công khai hoặc gửi tới bên khác, chủ dự án cần xác định phạm vi và cách xử lý phù hợp trước khi tiếp tục vận hành.

## 16. Checklist trước phát hành

- [ ] CR liên quan đã được chấp thuận và tài liệu yêu cầu/thiết kế đã cập nhật.
- [ ] Kịch bản nghiệm thu liên quan đã đạt; lỗi còn lại được ghi rõ.
- [ ] Migration đã thử trên môi trường staging hoặc bản sao dữ liệu.
- [ ] Backup production và ảnh đã hoàn tất; biết cách khôi phục.
- [ ] Domain/HTTPS, biến bí mật và tài khoản admin không bị ghi vào mã nguồn.
- [ ] Kiểm tra public list/detail, admin login, CRUD, trạng thái, ảnh và liên hệ sau phát hành.
- [ ] Ghi phiên bản, thời điểm phát hành, thay đổi và hướng quay lui.

## 17. Định nghĩa hoàn tất một thay đổi

Một thay đổi được coi là hoàn tất khi:

- Mã CR có quyết định và người duyệt.
- Tài liệu nguồn đã cập nhật, mã FR/UC/AT không bị đứt liên kết.
- Thay đổi được kiểm tra ở môi trường phù hợp.
- Không còn lỗi Critical/High liên quan.
- Bản phát hành và dữ liệu có thể quay lui theo kế hoạch.
- Chủ dự án xác nhận hành vi mong đợi trên production.
## 18. Quản trị production và bàn giao một chủ dự án

### 18.1. Phân quyền tài khoản dịch vụ

- Domain, DNS, hosting, database, image storage, email/monitoring và tài khoản thanh toán thuộc chủ dự án.
- Bật MFA cho tài khoản nhà cung cấp nếu hỗ trợ; dùng quyền tối thiểu cho developer/maintenance.
- Không dùng chung mật khẩu admin; không gửi credential trong email/chat không bảo vệ.
- Khi thay người bảo trì hoặc nghi ngờ lộ credential: thu hồi session/key cũ, xoay secret, kiểm tra log và ghi nhận sự cố.
- Tài khoản demo/staging không được dùng trên production; tài khoản mặc định phải bị vô hiệu hóa hoặc đổi trước release.

### 18.2. Chu kỳ phát hành production

1. Ghi change request, mục đích, ảnh hưởng nghiệp vụ/dữ liệu/bảo mật/chi phí.
2. Phê duyệt phạm vi, release window và người thực hiện.
3. Tạo release version và triển khai staging; chạy kiểm thử hồi quy/acceptance liên quan.
4. Sao lưu dữ liệu trước migration hoặc thay đổi có tác động.
5. Chủ dự án duyệt nội dung và go/no-go.
6. Triển khai production; theo dõi log, health check và lỗi trong thời gian smoke check đã thống nhất.
7. Rollback nếu cổng quan trọng thất bại; không cố hotfix trực tiếp nếu chưa có backup/phương án.
8. Ghi release note, kết quả, sự cố và bước theo dõi.

Mỗi migration phải có kế hoạch tương thích, backup và cách xử lý khi application rollback nhưng schema đã thay đổi. Tránh migration phá hủy dữ liệu trong cùng release không thể quay lui.

### 18.3. Backup và diễn tập phục hồi

- Lịch baseline: backup DB và ảnh hàng ngày; giữ 7 bản hàng ngày + 4 bản hàng tuần ở vị trí khác failure domain.
- Mục tiêu: RPO ≤24 giờ, RTO ≤1 ngày làm việc; Product Owner xác nhận chi phí và khả năng của nhà cung cấp.
- Kiểm tra job mỗi tuần; chạy restore test trước production và sau thay đổi quan trọng về provider/storage/schema.
- Ghi rõ snapshot nào được dùng, thời gian lấy, thời gian phục hồi, số record/ảnh xác minh, lỗi và người phê duyệt.
- Không xóa backup để giải phóng dung lượng nếu chưa biết retention; nâng cấp storage hoặc xin quyết định chủ dự án.
- Sau restore, xác nhận liên kết database-media, HTTPS, admin login, danh sách public và trạng thái phòng trước khi mở lại traffic.

### 18.4. Mức độ sự cố và thông báo

| Mức | Ví dụ | Hành động |
|---|---|---|
| P1 nghiêm trọng | Website không truy cập, admin bị chiếm quyền, dữ liệu/địa chỉ private bị lộ, nghi ngờ mất dữ liệu | Báo chủ dự án ngay theo kênh đã chốt; hạn chế truy cập hoặc đưa bảo trì; giữ log; xoay credential; quyết định rollback/restore. |
| P2 cao | Public list/detail lỗi diện rộng, upload/đổi trạng thái không hoạt động | Báo trong thời hạn hỗ trợ đã thỏa thuận; workaround/rollback; ghi thời điểm và ảnh hưởng. |
| P3 thường | Lỗi đơn lẻ không chặn thao tác chính, vấn đề bố cục nhỏ | Ghi ticket, ưu tiên qua quy trình change, lên lịch release. |
| P4 yêu cầu cải tiến | Thay đổi nội dung, bộ lọc, style, báo cáo | Ước lượng và đưa vào backlog; không sửa trực tiếp production. |

Chủ dự án phải chốt số điện thoại/email/kênh nhận P1, giờ hỗ trợ và nhà cung cấp liên quan trước go-live. Tài liệu không tự tạo cam kết thời gian phản hồi nếu chưa có thỏa thuận bảo trì.

### 18.5. Kiểm tra vận hành định kỳ

| Tần suất | Việc kiểm tra |
|---|---|
| Hàng ngày tự động | Uptime/health, backup status, lỗi máy chủ và dung lượng nếu có cảnh báo. |
| Hàng tuần | Backup có bản mới, kiểm tra listing public và room status, storage quota. |
| Hàng tháng | Chi phí dịch vụ, domain/TLS renewal, tài khoản admin/provider, cập nhật dependency/security. |
| Theo release | Smoke check, backup trước thay đổi, kiểm tra log/alert, cập nhật release note/runbook. |
| Định kỳ theo thỏa thuận | Restore drill; kiểm tra với chủ dự án rằng RPO/RTO còn phù hợp. |

### 18.6. Biên bản bàn giao production

Bàn giao cần có:
- Domain/DNS và người sở hữu; không ghi mật khẩu trực tiếp trong biên bản.
- Tên các nhà cung cấp, chu kỳ thanh toán, mức chi phí ước tính, ngày gia hạn và chủ tài khoản.
- Cách đăng nhập/admin reset, liên hệ hỗ trợ và quy tắc đổi credential.
- Hướng dẫn tạo/sửa/xem trước/xuất bản/ẩn/đổi trạng thái/lưu trữ/khôi phục tin.
- Sơ đồ thành phần production và cách deploy/rollback.
- Lịch backup, vị trí backup, kết quả restore test, RPO/RTO và người được phép khôi phục.
- Health check, log/alert, người nhận cảnh báo và quy trình xử lý P1.
- Danh sách AT và ngoại lệ được Product Owner ký nhận.
- Danh sách việc cần theo dõi, thời hạn, owner và kênh yêu cầu hỗ trợ.

### 18.7. Điều kiện thay đổi sau go-live

Thay đổi làm tăng thu thập dữ liệu khách, thêm admin, công khai địa chỉ mới, đổi provider, thay chính sách retention, thêm thanh toán/đặt chỗ, hoặc ảnh hưởng backup/chi phí phải đi qua đánh giá tác động ở tài liệu này và cập nhật yêu cầu, Data Analysis, API, Security/Acceptance trước release. Không thực hiện thay đổi lớn chỉ bằng chỉnh nội dung production.

