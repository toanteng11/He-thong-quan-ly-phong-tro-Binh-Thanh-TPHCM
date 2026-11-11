# 10 — Testing and Acceptance

## 1. Mục tiêu kiểm thử

Xác nhận website đáp ứng yêu cầu nghiệp vụ, hoạt động đúng trên điện thoại, bảo vệ API quản trị và không công khai tin sai trạng thái. Đây là kế hoạch kiểm thử; mỗi đợt phát hành cần ghi kết quả thực tế và lỗi còn mở.

## 2. Phạm vi

### Trong phạm vi

- Public: danh sách, bộ lọc, chi tiết, ảnh, tình trạng và liên hệ.
- Admin: đăng nhập, tạo/sửa/xóa tin, upload ảnh, trạng thái phòng/tin.
- API: xác thực, phân quyền, xác thực dữ liệu, phân trang và lỗi.
- Phi chức năng: hiển thị di động, hiệu năng cơ bản, kiểm tra bảo mật mức MVP.

### Ngoài phạm vi MVP

Kiểm thử thanh toán, đặt phòng, hợp đồng, quản lý người thuê và tải lớn theo quy mô chưa được xác định.

## 3. Môi trường và dữ liệu kiểm thử

- Dùng môi trường local/staging tách khỏi dữ liệu thật.
- Tạo tin mẫu ở các trạng thái Nháp, Đã xuất bản, Đã ẩn; tình trạng Còn trống/Đã thuê.
- Tạo trường hợp giá/diện tích hợp lệ, thiếu dữ liệu, ảnh hợp lệ và ảnh bị từ chối.
- Không dùng thông tin cá nhân thật của khách.
- Kiểm tra ít nhất một điện thoại iOS, một điện thoại Android hoặc trình giả lập tương đương, cùng một trình duyệt máy tính phổ biến.

## 4. Kịch bản nghiệm thu

| Mã | Kịch bản | Kết quả mong đợi | Liên kết |
|---|---|---|---|
| AT-01 | Khách mở danh sách khi có tin đã xuất bản | Thấy thẻ có ảnh, giá, khu vực, diện tích và tình trạng | FR-01 |
| AT-02 | Khách truy cập khi chỉ có tin nháp/ẩn | Không thấy các tin đó trong public API hoặc giao diện | RULE-01 |
| AT-03 | Lọc theo giá và diện tích hợp lệ | Kết quả thỏa tất cả bộ lọc; trang hiện đúng số liệu | FR-02 |
| AT-04 | Nhập min lớn hơn max | Có thông báo dễ hiểu; không chạy truy vấn sai | FR-02 |
| AT-05 | Mở chi tiết phòng | Thấy ảnh, mô tả, tiện nghi, giá, địa chỉ, tình trạng, liên hệ nếu có | FR-04/05 |
| AT-06 | Đăng nhập bằng thông tin đúng/sai | Đúng thì vào admin; sai thì báo chung, không tiết lộ tài khoản | FR-06 |
| AT-07 | Admin tạo nháp rồi xuất bản tin hợp lệ | Nháp không công khai; sau xuất bản tin xuất hiện | FR-07 |
| AT-08 | Admin tải ảnh sai loại hoặc quá lớn | Ảnh bị từ chối, lý do rõ, tin không bị hỏng | FR-08 |
| AT-09 | Đổi phòng sang Đã thuê nhưng giữ tin xuất bản | Public vẫn có tin và nhãn Đã thuê | FR-09/10 |
| AT-10 | Khách gọi trực tiếp API ghi hoặc API admin | Bị từ chối; dữ liệu không thay đổi | NFR-04 |
| AT-11 | Dùng trang trên màn hình rộng khoảng 360 px | Không tràn ngang; nút/lọc có thể thao tác | NFR-01 |
| AT-12 | Đo trang danh sách trên cấu hình mạng đã ghi | p75 nội dung chính ≤3 giây theo protocol ở mục 12 và AT-40 | NFR-02/NFR-13 |
| AT-13 | Admin mở hộp thoại xóa tin | Tên/mã tin và ảnh hưởng của thao tác được nêu rõ; chưa có dữ liệu nào thay đổi | FR-12 |

## 5. Các loại kiểm thử

- **Kiểm thử chức năng**: đối chiếu từng FR và luồng use case.
- **Kiểm thử tích hợp**: giao diện ↔ API ↔ database ↔ kho ảnh.
- **Kiểm thử bảo mật cơ bản**: public không đọc nháp/ẩn; admin API yêu cầu phiên; kiểm tra upload.
- **Kiểm thử responsive**: bố cục, ảnh, bộ lọc và nút liên hệ trên màn nhỏ.
- **Kiểm thử hồi quy**: sau sửa lỗi/chức năng, chạy lại các luồng liên quan.
- **Kiểm thử hiệu năng**: ghi thiết bị, mạng, số tin/ảnh, thời điểm và thời gian đo để so sánh.

## 6. Tiêu chí phát hành

Phát hành production khi đáp ứng toàn bộ production acceptance gate tại mục 14; các tiêu chí ở phần này là kiểm tra chức năng cơ sở và không thay thế domain/HTTPS, dữ liệu thật, backup/restore, monitoring và bàn giao:

1. Tất cả kịch bản Must đạt hoặc có ngoại lệ được chủ dự án chấp thuận bằng văn bản.
2. Không còn lỗi nghiêm trọng làm lộ dữ liệu admin, hiển thị sai trạng thái hoặc mất nội dung.
3. Luồng khách và admin dùng được trên kích thước di động mục tiêu.
4. Có bản sao lưu trước phát hành và biết cách khôi phục.
5. Có tài khoản admin ban đầu, HTTPS và cấu hình bí mật an toàn.
6. Ghi lại phiên bản, ngày phát hành, kết quả kiểm thử và lỗi còn biết.

## 7. Mẫu ghi lỗi

Mỗi lỗi nên có: mã lỗi, môi trường, bước tái hiện, kết quả thực tế, kết quả mong đợi, ảnh/chụp màn hình nếu có, mức độ ảnh hưởng, mức ưu tiên sửa và phiên bản phát hiện.

### Mức độ

- **Critical**: lộ quyền/dữ liệu, mất dữ liệu hoặc hệ thống không truy cập được.
- **High**: luồng Must không dùng được hoặc dữ liệu công khai sai nghiêm trọng.
- **Medium**: một phần giao diện/luồng có lỗi nhưng có cách tiếp tục.
- **Low**: lỗi thẩm mỹ hoặc trường hợp hiếm ít ảnh hưởng.

## 8. Biên bản nghiệm thu

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Kịch bản Must | Đạt/Không đạt | Liệt kê mã còn lỗi |
| Responsive | Đạt/Không đạt | Thiết bị và trình duyệt |
| Bảo mật API admin | Đạt/Không đạt | Kết quả truy cập chưa xác thực |
| Hiệu năng | Đạt/Không đạt | Kết quả AT-12/AT-40 và điều kiện đo |
| Sao lưu/khôi phục | Đạt/Không đạt | Thời điểm kiểm tra |
| Phê duyệt chủ dự án | Đồng ý/Cần sửa | Người duyệt và ngày |

## 9. Kịch bản bổ sung và truy vết

| Mã | Kịch bản | Kết quả mong đợi | Liên kết |
|---|---|---|---|
| AT-14 | Admin xem danh sách tin và lọc theo trạng thái tin/tình trạng phòng | Tin nháp, ẩn, đã thuê được tìm thấy trong admin; public không bị ảnh hưởng | FR-10 |
| AT-15 | Admin mở dashboard với bộ dữ liệu đã biết | Số đếm khớp số tin/phòng trong dữ liệu kiểm thử | FR-11 |
| AT-16 | Tin không có kênh liên hệ công khai | Nút gọi/Zalo không hiển thị; dữ liệu riêng tư không rò qua public response | FR-05, RULE-06 |
| AT-17 | Admin xuất bản tin thiếu trường bắt buộc | Backend từ chối; trả fieldErrors; tin vẫn ở trạng thái trước đó | RULE-05 |
| AT-18 | Khách chuyển trang sau khi áp dụng bộ lọc | Bộ lọc và thứ tự sắp xếp được giữ | FR-02/03 |
| AT-19 | Admin xóa tin và chọn hủy ở hộp thoại xác nhận | Tin không bị xóa hoặc đổi trạng thái | FR-12 |
| AT-20 | Admin xóa tin và xác nhận | Tin bị xóa mềm, public không còn trả tin, admin có thể tìm trong archived | FR-12, FR-14 |
| AT-21 | Admin đăng xuất rồi gọi lại API admin | Phiên không còn hiệu lực; API trả 401 và dữ liệu không đổi | FR-06, NFR-04 |
| AT-22 | Admin gửi nhiều lần đăng nhập sai | Có giới hạn thử phù hợp; không tiết lộ tài khoản nào tồn tại | FR-06, NFR-04 |
| AT-23 | Public request chi tiết tin nháp/ẩn hoặc tin đã xóa | Trả 404 hoặc kết quả không công khai theo hợp đồng API; không trả nội dung tin | RULE-01 |
| AT-24 | Admin thay đổi thông tin/ảnh rồi tải lại trang chi tiết | Dữ liệu mới được hiển thị sau khi backend xác nhận lưu | FR-07/08 |
| AT-25 | Kiểm tra public response của tin | Không có addressPrivate, email admin, ghi chú nội bộ, trường xóa mềm hoặc thông tin phiên | NFR-04 |
| AT-26 | Admin đổi thứ tự ảnh và ảnh bìa | Thứ tự mới được lưu; public detail trả đúng thứ tự sau khi tin xuất bản | FR-08 |
| AT-27 | Admin nhập mô tả có thẻ/script | Nội dung hiển thị an toàn, không thực thi mã trong trình duyệt | NFR-04 |
| AT-28 | Lưu tin gặp lỗi backend/database | Giao diện không báo lưu thành công; dữ liệu cũ không bị ghi đè một phần ngoài quy tắc | NFR-05 |
| AT-29 | Khách dùng bàn phím để duyệt thao tác chính | Có focus nhìn thấy; danh sách, chi tiết và nút liên hệ dùng được | NFR-07 |

### Ma trận yêu cầu — kiểm thử

| Nhóm yêu cầu | Kịch bản |
|---|---|
| FR-01, FR-02, FR-03 | AT-01, AT-03, AT-04, AT-18 |
| FR-04, FR-05 | AT-05, AT-16 |
| FR-06 | AT-06, AT-21, AT-22 |
| FR-07, FR-08 | AT-07, AT-08, AT-24 |
| FR-09, FR-10 | AT-09, AT-14 |
| FR-11, FR-12 | AT-15, AT-19, AT-20 |
| RULE-01, RULE-05, RULE-06 | AT-02, AT-16, AT-17, AT-23 |
| NFR-01, NFR-08, NFR-16 | AT-11, AT-42, AT-46 |
| NFR-02, NFR-13 | AT-12, AT-40 |
| NFR-03 | AT-08, AT-26 và kiểm tra ảnh |
| NFR-07 | AT-11, AT-29 |
| NFR-04, NFR-05 | AT-06, AT-08, AT-10, AT-17, AT-21, AT-22, AT-25, AT-27, AT-28 |
| NFR-06 | Rà soát thiết kế/mã; không chỉ kiểm thử giao diện |

Bảng truy vết ở Requirements cần được cập nhật đồng bộ với các mã AT này; FR-11 và FR-12 không nên bị bỏ khỏi truy vết.

## 10. Dữ liệu kiểm thử chuẩn

Chuẩn bị tối thiểu:

- Một tin Nháp, một tin Đã xuất bản còn trống, một tin Đã xuất bản đã thuê, một tin Đã ẩn và một tin đã xóa.
- Một tin có nhiều ảnh và ảnh bìa; một tin không có ảnh để kiểm tra chặn xuất bản theo quyết định đã duyệt.
- Giá/diện tích biên hợp lệ, bằng 0, số âm, min lớn hơn max và chuỗi không phải số.
- Liên hệ có điện thoại, chỉ có Zalo, không có liên hệ và kênh chưa được cho phép công khai.
- Ký tự tiếng Việt có dấu, tiêu đề dài, địa chỉ dài, mô tả có ký tự HTML/script.
- Ảnh JPEG/PNG/WebP hợp lệ, ảnh quá dung lượng, loại không hỗ trợ, tệp giả đuôi ảnh và ảnh bị hỏng.

Chỉ dùng dữ liệu giả hoặc đã ẩn danh ở staging. Ghi mã tin kiểm thử để người vận hành không nhầm với tin thật.

## 11. Cách chạy và lưu bằng chứng

Mỗi lần chạy ghi: mã kịch bản, phiên bản ứng dụng, môi trường, thời điểm, thiết bị/trình duyệt, dữ liệu dùng, kết quả Đạt/Không đạt, lỗi liên quan và người thực hiện. Với lỗi hiển thị, lưu ảnh chụp; với API, lưu request/response đã loại bỏ cookie, mật khẩu và thông tin riêng.

Khi sửa lỗi, chạy lại kịch bản thất bại và các luồng liên quan. Không coi lỗi “không tái hiện được” là đã sửa nếu chưa ghi điều kiện chạy lại.

## 12. Quy trình kiểm tra hiệu năng

NFR-02/NFR-13 được nghiệm thu theo protocol cố định: đo thời gian nội dung chính hiển thị (LCP làm chỉ số bổ trợ), 5 lần trên thiết bị di động đại diện, mạng 4G được giới hạn nhất quán, bộ dữ liệu production-like 500 tin và tối đa 3 ảnh tối ưu mỗi tin trong lượt đầu. Báo cáo p75; ngưỡng đạt là ≤3 giây. Lưu thiết bị, trình duyệt, vùng triển khai, điều kiện cache và kết quả từng lượt.

## 13. Pass/fail và lỗi chặn phát hành

- **Pass**: kết quả thực tế đáp ứng kết quả mong đợi và có bằng chứng đủ để lặp lại.
- **Fail**: sai kết quả, mất dữ liệu, quyền truy cập sai hoặc không thể hoàn thành luồng.
- Không phát hành nếu còn lỗi Critical/High về quyền admin, lộ dữ liệu, tin ẩn bị công khai, mất nội dung hoặc không quản lý được phòng.
- Lỗi Medium/Low chỉ được chấp nhận nếu chủ dự án ghi rõ ảnh hưởng, cách xử lý tạm/giảm thiểu và phiên bản dự kiến sửa.
- Các mục tiêu hiệu năng, ảnh, xóa mềm và backup đã có baseline ở tài liệu 03/06/09; chỉ thay đổi bằng change request và phê duyệt ngoại lệ trước go-live.
## 14. Production acceptance gate

### 14.1. Kịch bản nghiệm thu bổ sung

| Mã | Kịch bản | Kết quả bắt buộc | Truy vết |
|---|---|---|---|
| AT-30 | Admin thử xuất bản tin thiếu một trường bắt buộc | Backend từ chối, chỉ rõ lỗi trường; bản nháp/trạng thái trước không đổi. | FR-13, RULE-05 |
| AT-31 | Admin xem trước tin chưa xuất bản khi đã đăng nhập | Preview hiển thị admin; cửa sổ riêng/không xác thực và public API không xem được nội dung. | FR-13, NFR-14 |
| AT-32 | Admin xóa mềm tin đã xuất bản rồi truy vấn public | Tin/ảnh không xuất hiện trong list/search/detail/sitemap/cache; admin có thể thấy trong archived. | FR-14, RULE-11 |
| AT-33 | Admin khôi phục tin đã xóa mềm | Tin trở về trạng thái an toàn theo quy tắc; không tự public ngoài dự kiến; log actor/time được ghi. | FR-14 |
| AT-34 | Hết phiên admin rồi gọi endpoint quản trị | API trả 401; không thay đổi dữ liệu; UI yêu cầu đăng nhập lại. | FR-15 |
| AT-35 | Kiểm tra tài khoản ban đầu | Không tồn tại signup công khai; mật khẩu mặc định/demo không dùng được; chủ dự án kiểm soát tài khoản/email khôi phục. | FR-16 |
| AT-36 | Gọi health live/ready và kiểm tra log | Health trả đúng trạng thái mà không lộ secret/stack trace; log không ghi password/token/cookie. | FR-17, NFR-12 |
| AT-37 | Làm hỏng hoặc mô phỏng backup job trên staging | Cảnh báo đến đầu mối; trạng thái thất bại không bị ghi nhận là backup thành công. | NFR-11, NFR-12 |
| AT-38 | Truy cập production qua domain và HTTP/HTTPS | Domain hoạt động, TLS hợp lệ, HTTP chuyển HTTPS; không có mixed content ở luồng chính. | NFR-09 |
| AT-39 | Restore database và ảnh từ backup vào môi trường cô lập | Listing-media liên kết được, ứng dụng smoke test đạt; bằng chứng thời gian ghi nhận đạt RPO/RTO mục tiêu hoặc có chấp thuận ngoại lệ. | NFR-11 |
| AT-40 | Kiểm tra danh sách public với bộ dữ liệu chuẩn | 5 lượt đo p75 ≤3 giây theo thiết bị/mạng/dataset đã khóa; lưu kết quả và cấu hình đo. | NFR-13 |
| AT-41 | Bàn giao vận hành | Chủ dự án đăng nhập được, nhận runbook, biết cập nhật tin/backup/rollback/đầu mối/chi phí; biên bản được xác nhận. | NFR-15 |
| AT-42 | Kiểm tra responsive trên 360, 768, 1280 và 1440 px | Public/admin dùng được, không có tràn ngang hoặc thao tác chính bị che; lưu ảnh/bằng chứng. | NFR-01, NFR-16 |
| AT-43 | Kiểm tra địa chỉ private | Tin không cho phép địa chỉ chính xác chỉ trả addressPublic; địa chỉ riêng không có trong HTML/source/meta/public JSON. | NFR-17 |
| AT-44 | Kiểm tra dữ liệu thật sau import | Giá, địa chỉ/khu vực, ảnh, contact và trạng thái khớp dữ liệu chủ dự án đã duyệt; không còn listing demo. | FR-01—FR-05, AT-41 |
| AT-45 | Kiểm tra thay đổi từ admin trên public | Sau save thành công, public phản ánh giá/trạng thái/ảnh mới trong tối đa 60 giây; không cache nội dung admin. | FR-18 |
| AT-46 | Kiểm tra tương thích trình duyệt | Luồng khách và admin chính chạy trên phiên bản hiện hành của Chrome/Edge/Safari mobile hoặc tương đương đã thống nhất. | NFR-16 |
| AT-47 | Chạy smoke test sau release/rollback | Sau phát hành và rollback, HTTPS, public list/detail, admin login và sửa trạng thái đều hoạt động. | UC-10, NFR-15 |
| AT-48 | Kiểm tra quyền database và secret | Database không truy cập công khai ngoài allowlist; mã nguồn/build public không chứa secret production. | NFR-14 |
| AT-49 | Kiểm tra uptime monitor và cảnh báo | Monitor theo dõi domain production, cảnh báo được gửi tới đầu mối khi mô phỏng endpoint down; mục tiêu theo tháng được ghi nhận. | NFR-10, NFR-12 |

### 14.2. Cổng phát hành

**Go-live được phép** khi tất cả điều kiện dưới đây đạt:

- Không còn lỗi Critical/High về bảo mật, rò dữ liệu, mất dữ liệu hoặc chặn hành trình khách/admin.
- AT-01—AT-29 áp dụng và AT-30—AT-49 đều Pass hoặc được chủ dự án chấp thuận ngoại lệ có ghi rủi ro, thời hạn xử lý và người chịu trách nhiệm.
- Website ở domain production có HTTPS; staging và production tách biệt.
- Dữ liệu thật được duyệt, địa chỉ/liên hệ public đúng, không còn demo content hoặc credential demo.
- Restore test database + ảnh thành công; health/backup alert có người nhận; rollback được diễn tập hoặc thực hiện trong staging.
- Performance evidence, responsive evidence, browser evidence và request/response privacy check được lưu.
- Chủ dự án kiểm soát tài khoản dịch vụ, thanh toán, admin và ký biên bản nghiệm thu.

**Không go-live** nếu có secret lộ, admin bị truy cập trái phép, tin draft/ẩn/private lộ ra public, mất dữ liệu, TLS/domain không hợp lệ, restore chưa kiểm chứng hoặc không có người chịu trách nhiệm sau bàn giao.

### 14.3. Bằng chứng kiểm thử cần lưu

Lưu phiên bản build/commit, môi trường, ngày giờ, người chạy, thiết bị/trình duyệt, dataset và kết quả pass/fail, ảnh chụp cần thiết đã che dữ liệu nhạy cảm, log requestId đã lọc secret, báo cáo performance, kết quả restore test, AT exceptions và chữ ký Product Owner. Không đính kèm mật khẩu, token hoặc ảnh có dữ liệu riêng tư không cần thiết.

### 14.4. Nghiệm thu và ngoại lệ

| Mục | Giá trị cần ghi |
|---|---|
| Release/version | Build/tag/commit |
| Domain/môi trường | Production domain và thời gian xác minh |
| Người nghiệm thu | Chủ dự án |
| Kịch bản fail/ngoại lệ | Mã AT, rủi ro, workaround, owner, deadline |
| Backup/restore | Thời điểm, snapshot, kết quả, thời gian hoàn tất |
| Chi phí vận hành | Nhà cung cấp, ước tính định kỳ, người thanh toán |
| Quyết định | Go-live / No-go / Go-live có ngoại lệ được chấp nhận |

