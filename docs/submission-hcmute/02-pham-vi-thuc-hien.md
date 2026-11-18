# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 02
# PHẠM VI THỰC HIỆN CỦA ĐỀ TÀI

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - Trương Công Bình — MSSV: `23110184` (Trưởng nhóm)  
> - Ninh Thị Mỹ Hạnh — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **16:46 ngày 27/11/2026** *(Cần GVHD xác nhận)*  
> **Tiêu chí đánh giá:** Phân tích nghiệp vụ, đặc tả yêu cầu và thiết kế – giải pháp. Xác định rõ phạm vi thực hiện phù hợp mục tiêu, làm cơ sở đánh giá cho đề tài.

---

## 1. NGUYÊN TẮC THIẾT LẬP PHẠM VI HỆ THỐNG

Việc xác định phạm vi thực hiện của đề tài **CIRCLE** được xây dựng dựa trên 3 nguyên tắc nền tảng:
1. **Bám sát mục tiêu đề tài và triết lý "Nhóm là trung tâm" (Group-First):** Toàn bộ các chức năng thuộc phạm vi thực hiện (*In-Scope*) đều tập trung giải quyết bài toán tương tác sâu sắc, khép kín và an toàn trong không gian nhóm vi mô (*Micro-community*).
2. **Khả thi về mặt kỹ thuật và thời gian (15 – 19 tuần):** Thiết lập ranh giới rõ ràng giữa những tính năng bắt buộc phải hoàn thiện ở mức công nghiệp và những tính năng mở rộng nằm ngoài phạm vi (*Out-of-Scope*) nhằm tránh tình trạng dàn trải tài nguyên, bảo đảm chất lượng mã nguồn và độ ổn định cao nhất khi nghiệm thu.
3. **Cơ sở đánh giá và đo lường minh bạch (Rubric-grounded Baseline):** Phạm vi này đóng vai trò là "hợp đồng cam kết" giữa nhóm sinh viên, giảng viên hướng dẫn và hội đồng đánh giá, bảo đảm mọi tiêu chí nghiệm thu đều được đối soát 1-1 với sản phẩm thực tế.

---

## 2. PHẠM VI ĐỐI TƯỢNG NGƯỜI DÙNG & MÔ HÌNH VẬN HÀNH

- **Đối tượng người dùng mục tiêu:**
  - Nhóm sinh viên học tập, nhóm làm đồ án môn học, nhóm nghiên cứu khoa học tại các trường đại học/cao đẳng.
  - Ban chủ nhiệm và các ban chuyên môn của các Câu lạc bộ, Đội, Nhóm sinh viên.
  - Nhóm bạn bè thân thiết, gia đình có nhu cầu chia sẻ hình ảnh, lịch hẹn và trò chuyện riêng tư.
- **Quy mô không gian nhóm (Circle Scale):**
  - Tối ưu hóa cho các nhóm có quy mô từ **3 đến 50 thành viên/Circle**.
  - Không giới hạn số lượng Circle mà một người dùng có thể tham gia hoặc sở hữu.
- **Mô hình tài khoản & định danh:**
  - Định danh toàn cục qua Email duy nhất đã được xác thực mã OTP.
  - Hỗ trợ thiết lập Biệt danh nội bộ (*Circle Nickname*) riêng biệt cho từng không gian Circle, giúp bảo đảm tính thân mật và ngữ cảnh sinh hoạt.

---

## 3. PHẠM VI CHỨC NĂNG THỰC HIỆN (IN-SCOPE SPECIFICATION)

Hệ thống CIRCLE bao gồm trọn vẹn **12 Module chức năng** được phân tích, thiết kế, lập trình và kiểm thử toàn diện:

### Module 0: Phân tích nghiệp vụ, Khảo sát & Kiến trúc Hệ thống
- Khảo sát thực tế nhu cầu người dùng ($\ge 30$ phiếu khảo sát hợp lệ).
- Xây dựng 26 Use Cases chuẩn hóa (`UC01` đến `UC26`), 100% Use Cases có Acceptance Criteria theo chuẩn Gherkin.
- Thiết lập Từ điển dữ liệu (*Data Dictionary*), Quy tắc nghiệp vụ (*Business Rules `BR01`–`BR20`*).
- Thiết kế kiến trúc C4 Model (Context, Container, Component), Sơ đồ thực thể cơ sở dữ liệu (ERD) và Sơ đồ tuần tự (Sequence Diagrams).

### Module 1: Hạ tầng Monorepo, Ảo hóa & CI/CD
- Cấu hình Monorepo Workspace quản lý đồng thời Backend, Web Client, Mobile App và Shared Packages.
- Docker hóa toàn bộ môi trường phát triển và sản xuất (PostgreSQL 16, Redis 7, Backend API, Traefik Reverse Proxy).
- Thiết lập quy trình kiểm tra tự động và tích hợp liên tục (CI/CD) qua GitHub Actions.

### Module 2: Xác thực, Phân quyền & Quản lý Tài khoản
- Đăng ký tài khoản, gửi email kích hoạt mã OTP có thời hạn hiệu lực (15 phút).
- Đăng nhập bảo mật sử dụng cơ chế **JWT Access Token (ngắn hạn) + Refresh Token Rotation (lưu trữ Redis/DB có thu hồi)**.
- Đổi mật khẩu, quên mật khẩu qua OTP email, mã hóa một chiều bằng thuật toán `bcrypt` (salt rounds = 10).
- Quản lý hồ sơ cá nhân: Họ tên, ảnh đại diện, tiểu sử ngắn gọn, trạng thái hoạt động.
- Quản lý quan hệ bạn bè: Gửi lời mời, chấp nhận, từ chối, hủy kết bạn, tìm kiếm tài khoản theo email/tên.

### Module 3: Quản trị Không gian Nhóm (Circle Core & Governance)
- Khởi tạo Circle: Tên nhóm, ảnh đại diện, mô tả, thiết lập chế độ gia nhập (Công khai tự do hoặc Cần Owner phê duyệt).
- Sinh mã mời duy nhất (*Invite Code*) và liên kết mời (*Invite Link*) có thể thu hồi hoặc làm mới.
- Phân quyền hai cấp nghiêm ngặt: **Circle Owner (Trưởng nhóm)** và **Circle Member (Thành viên)**.
- Quản trị thành viên: Phê duyệt đơn gia nhập, mời bạn bè vào nhóm, trục xuất thành viên, phân quyền.
- Nghiệp vụ bảo toàn nhóm: Chuyển nhượng quyền Owner (`UC25`), Giải tán Circle (`UC26`), ngăn chặn Owner tự ý rời nhóm nếu chưa chuyển giao quyền quản trị (`UC22`).

### Module 4: Nhắn tin Nhóm Thời gian thực & Lưu trữ Đa phương tiện
- Quản lý các kênh thảo luận (Text Channels) phân loại theo chủ đề bên trong Circle.
- Gửi nhận tin nhắn tức thời qua giao thức **WebSocket (Socket.IO)** với cơ chế xác nhận gói tin (ACK).
- Hỗ trợ đa dạng định dạng tin nhắn: Văn bản, Biểu tượng cảm xúc (Reactions), Tệp tin đính kèm (ảnh, video, tài liệu PDF/Doc), Tin nhắn thoại (Voice Message).
- Tích hợp dịch vụ lưu trữ đám mây **Cloudflare R2 (S3-compatible)** qua cơ chế Presigned Upload URL an toàn (hạn mức tối đa 25MB/tệp).
- Tính năng hội thoại nâng cao: Trích dẫn trả lời (Reply/Quote), Phân trang tin nhắn kiểu con trỏ (*Cursor-based Pagination*), Ghim tin nhắn quan trọng lên đầu kênh chat (`UC13`), Thu hồi/xóa tin nhắn.

### Module 5: Khoảnh khắc theo Nhóm (Moments & Group Feed)
- Đăng tải khoảnh khắc bằng hình ảnh chụp trực tiếp từ camera hoặc tải từ thư viện thiết bị kèm chú thích ngắn.
- **Cơ chế kiểm soát quyền riêng tư bảo mật theo Circle (Circle-based Privacy):** Người đăng chỉ định chính xác những Circle nào được phép nhìn thấy bài đăng.
- Luồng hiển thị bảng tin (Moments Feed) tập trung các khoảnh khắc của bạn bè và thành viên các Circle chung.
- Tương tác phản hồi trên Moment: Khi người dùng phản hồi một Moment, hệ thống tự động bóc tách trích dẫn và chuyển thành tin nhắn trực tiếp trong khung chat chung của Circle tương ứng.

### Module 6: Đàm thoại Thoại & Hình ảnh Thời gian thực (WebRTC Call)
- Thiết lập cuộc gọi âm thanh (Audio Call) và hình ảnh (Video Call) chất lượng cao ngay trong không gian Circle.
- Tự triển khai và vận hành máy chủ **Coturn (STUN/TURN)** trên VPS độc lập, giải quyết triệt để rào cản kết nối xuyên qua NAT/Tường lửa.
- Hệ thống điều phối tín hiệu cuộc gọi (*Signaling Gateway*) qua Socket.IO: Trao đổi SDP Offer, SDP Answer và ICE Candidates.
- Quản lý trạng thái cuộc gọi toàn diện: Đang đổ chuông (Ringing), Đang đàm thoại (In-Call), Bận máy (Busy), Cuộc gọi nhỡ (Missed Call), lưu lịch sử cuộc gọi (`UC12`).
- Điều khiển thiết bị âm thanh/hình ảnh: Bật/tắt Micro, Bật/tắt Camera, Chuyển đổi loa trong/ngoài, Tự động khôi phục kết nối khi mạng gián đoạn (ICE Restart).

### Module 7: Bộ Công cụ Tương tác Nhóm Tương tác cao (Group Tools)
- **7.1. Bảng kế hoạch cộng tác (Collaborative Planning Sheet - `UC18`):** Bảng phân công công việc nội bộ dạng bảng tính, cập nhật trạng thái công việc thời gian thực giữa các thành viên.
- **7.2. Lịch sự kiện & Nhắc hẹn tự động (Group Calendar & Reminders - `UC17`):** Quản lý lịch hẹn của Circle theo giao diện tháng/tuần/ngày, thiết lập nhắc hẹn tự động qua hệ thống thông báo.
- **7.3. Bình chọn nhóm (Group Poll - `UC15`):** Khởi tạo khảo sát ý kiến (chọn một hoặc nhiều lựa chọn), cập nhật số lượng phiếu bầu và tỷ lệ phần trăm trực tiếp theo thời gian thực.
- **7.4. Vòng xoay quyết định (Decision Wheel - `UC16`):** Sinh kết quả ngẫu nhiên an toàn trên máy chủ, đồng bộ góc quay và hiệu ứng hình ảnh giúp nhóm ra quyết định công bằng (chọn địa điểm ăn uống, người thuyết trình).
- **7.5. Chia sẻ vị trí thời gian thực (Live Location Map - `UC19`):** Tích hợp bản đồ số Mapbox, chia sẻ tọa độ GPS kèm đồng hồ đếm ngược tự ngắt phát sóng (15 phút, 30 phút, 1 giờ) bảo vệ quyền riêng tư.
- **7.6. Hòm thư ẩn danh ("Điều muốn nói" - `UC21`):** Cho phép thành viên chia sẻ tâm sự nội bộ, máy chủ **tự động bóc tách và hủy hoàn toàn siêu dữ liệu `author_id`** trước khi lưu trữ nhằm bảo mật danh tính tuyệt đối.
- **7.7. Album kỷ niệm nhóm (Shared Album - `UC14`):** Tạo các bộ sưu tập ảnh/video theo chủ đề, lưu trữ kỷ niệm dài hạn mà không bị nén vỡ hình.

### Module 8: Hệ thống Thông báo Đa kênh (Notification Center)
- Trung tâm thông báo trên ứng dụng Web: Thông báo tức thời trong phiên làm việc qua WebSocket (lời mời vào nhóm, tin nhắn mới, lịch hẹn sắp diễn ra, nhắc hẹn sự kiện).
- Dịch vụ thông báo đẩy (Push Notification) trên ứng dụng Mobile: Tích hợp dịch vụ Expo Push Service / Firebase Cloud Messaging (FCM).
- Quản lý trạng thái thông báo: Đánh dấu đã đọc, đánh dấu tất cả đã đọc, xóa thông báo, điều hướng chính xác đến ngữ cảnh phát sinh.

### Module 9: Cổng Quản trị Hệ thống (Admin Portal) & Kiểm duyệt Nội dung
- Cổng quản trị phân quyền cao cấp tại đường dẫn riêng `/admin`, bảo vệ bằng Admin RoleGuard.
- Bảng điều khiển số liệu thống kê (Dashboard): Tổng người dùng, chỉ số DAU/MAU, tổng số Circle, lưu lượng tin nhắn và biểu đồ tăng trưởng.
- Quản lý tài khoản người dùng: Tra cứu danh sách, xem chi tiết, khóa tài khoản vi phạm hoặc mở khóa.
- Quản lý không gian Circle: Kiểm tra danh mục Circle toàn hệ thống, gắn cờ cảnh báo nhóm vi phạm thuần phong mỹ tục.
- Hệ thống tiếp nhận và xử lý báo cáo vi phạm (Moderation Queue & Audit Log) từ người dùng.

### Module 10: Kiểm thử Toàn diện, Phân tích Hiệu năng & Tối ưu hóa
- Tự động hóa kiểm thử 4 tầng: Unit Test, Integration Test, API Supertest, E2E Test Playwright.
- Kiểm thử tải và kiểm thử áp lực hiệu năng bằng công cụ công nghiệp **k6** (đo lường P95 latency, RPS, chịu tải tin nhắn).
- Quét phân tích tĩnh mã nguồn (SonarQube/ESLint) và quét rò rỉ bảo mật (Gitleaks).

### Module 11: Đóng gói Triển khai & Thực nghiệm Người dùng
- Cấu hình tệp tin triển khai Docker Production đa tầng (Multi-stage build).
- Triển khai môi trường thực tế trên Linux VPS với Traefik Reverse Proxy và chứng chỉ HTTPS Let's Encrypt.
- Tổ chức thử nghiệm thực tế với $\ge 10$ người dùng mục tiêu, đo lường các chỉ số SUS và TCR.

---

## 4. PHẠM VI NẰM NGOÀI HỆ THỐNG (OUT-OF-SCOPE SPECIFICATION)

Để bảo đảm tính tập trung cao nhất vào chất lượng sản phẩm và triết lý cốt lõi trong thời gian làm đồ án, các tính năng sau đây **được chủ động loại trừ khỏi phạm vi thực hiện** kèm theo lý do kỹ thuật cụ thể:

| STT | Tính năng NẰM NGOÀI phạm vi (Out-of-Scope) | Lý do loại trừ & Giải thích kỹ thuật |
| :---: | :--- | :--- |
| **01** | **Nhắn tin trò chuyện 1-1 độc lập ngoài Circle** | **Vi phạm triết lý cốt lõi của đề tài:** CIRCLE là nền tảng lấy nhóm làm trung tâm. Mọi hội thoại phải gắn liền với không gian Circle nhằm ngăn chặn tình trạng quấy rối cá nhân, rò rỉ thông tin riêng tư và giữ đúng bản chất cộng đồng vi mô. |
| **02** | **Tích hợp Cổng thanh toán / Ví điện tử / Mua bán** | Dự án tập trung chuyên sâu vào bài toán tương tác xã hội và cộng tác nhóm, không định hướng thương mại điện tử để tránh làm phức tạp hóa mô hình dữ liệu và quy định pháp lý tài chính. |
| **03** | **Phát sóng trực tiếp quy mô lớn (Public Livestream)** | Đàm thoại WebRTC trong CIRCLE được tối ưu hóa theo mô hình P2P Mesh/SFU dành riêng cho nhóm học tập và bạn bè ($\le 8$ luồng video đồng thời). Phát sóng công khai cho hàng nghìn người đòi hỏi hạ tầng máy chủ CDN/HLS đắt đỏ vượt ngoài phạm vi đồ án sinh viên. |
| **04** | **Bảng tin công khai đại chúng (Public Newsfeed)** | Không xây dựng thuật toán phân phối bài viết cho người lạ. Mọi thông tin chỉ lưu hành giữa các thành viên có quan hệ Circle chung nhằm giữ không gian mạng trong lành. |
| **05** | **Đăng nhập qua các mạng xã hội thứ ba (OAuth Social)** | Ưu tiên triển khai trọn vẹn và an toàn hệ thống xác thực nội bộ (Local Auth với JWT Access/Refresh Rotation và OTP Email), loại bỏ sự phụ thuộc vào chính sách API thay đổi của Google/Facebook trong quá trình chấm đồ án. |

---

## 5. CÁC RÀNG BUỘC PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFRS)

Hệ thống cam kết đáp ứng 5 chỉ tiêu phi chức năng định lượng nghiêm ngặt:

1. **Hiệu năng hệ thống (Performance):**
   - Thời gian phản hồi trung bình của API Backend: $P95 \le 200\text{ ms}$ (đối với các truy vấn đọc qua Redis Cache $\le 50\text{ ms}$).
   - Độ trễ gửi nhận tin nhắn thời gian thực WebSocket: $\le 100\text{ ms}$ trong điều kiện mạng tiêu chuẩn.
   - Thời gian thiết lập cuộc gọi WebRTC (Signaling connection time): $\le 1500\text{ ms}$.
2. **Khả năng chịu tải (Scalability):**
   - Hệ thống xử lý ổn định mức tải đồng thời $\ge 100$ người dùng hoạt động cùng lúc (Concurrent Users) trên môi trường VPS cấu hình tiêu chuẩn mà không xảy ra sập dịch vụ (Crash).
3. **An toàn & Bảo mật thông tin (Security):**
   - 100% mật khẩu được băm bằng thuật toán `bcrypt` trước khi lưu vào cơ sở dữ liệu.
   - Cơ chế bảo vệ chống các lỗ hổng phổ biến: Cross-Site Scripting (XSS), SQL Injection (ngăn chặn tự nhiên bởi Prisma ORM), Cross-Origin Resource Sharing (CORS) được cấu hình nghiêm ngặt theo domain cho phép.
   - Tuyệt đối không để lộ thông tin nhạy cảm của người dùng và bí mật hệ thống trong mã nguồn.
4. **Độ tin cậy & Tính khả dụng (Availability & Reliability):**
   - Hệ thống cam kết thời gian hoạt động liên tục đạt $\ge 99.0\%$ trong suốt thời gian diễn ra đợt nghiệm thu và phản biện đồ án.
   - Có cơ chế xử lý lỗi ngoại lệ, giao diện hiển thị trạng thái mất kết nối mạng và tự động kết nối lại (Auto-reconnect).
5. **Tính khả dụng và Trải nghiệm người dùng (Usability):**
   - Giao diện thân thiện, tuân thủ nguyên tắc thiết kế tối giản, hỗ trợ đầy đủ 2 ngôn ngữ (Tiếng Việt và Tiếng Anh).
   - Điểm số khảo sát độ khả dụng hệ thống theo thang đo chuẩn quốc tế SUS đạt $\ge 80/100$ điểm.

---

## 6. XÁC NHẬN CỦA GIẢNG VIÊN HƯỚNG DẪN & SINH VIÊN

Nhóm sinh viên và Giảng viên hướng dẫn thống nhất xác nhận phạm vi thực hiện nêu trên là căn cứ chính thức để theo dõi tiến độ và đánh giá kết quả nghiệm thu cuối cùng của đề tài.

*Ngày 18 tháng 11 năm 2026*

| GIẢNG VIÊN HƯỚNG DẪN | TRƯỞNG NHÓM SINH VIÊN | THÀNH VIÊN SINH VIÊN |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Nguyễn Trần Thi Văn** | <br><br><br>**Trương Công Bình**<br>MSSV: 23110184 | <br><br><br>**Ninh Thị Mỹ Hạnh**<br>MSSV: 23110210 |
