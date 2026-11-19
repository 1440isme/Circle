# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 03
# BẢNG PHÂN CÔNG CÔNG VIỆC THEO TỪNG THÀNH VIÊN

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm — Kỹ thuật, Hạ tầng, Realtime & UI/UX Lead)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210` (Thành viên — Nghiệp vụ, Social Logic, Moderation & QA Lead)  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **16:48 ngày 30/11/2026**  
> **Tiêu chí đánh giá:** Ghi rõ mỗi thành viên làm gì, kèm theo link tài liệu, kết quả thực hiện.

---

## 1. NGUYÊN TẮC PHÂN CÔNG & CƠ CHẾ PHỐI HỢP CỐT LÕI

Để bảo đảm tiến độ thực hiện trong 15 tuần và đạt chất lượng Level 5 ở mọi tiêu chí, nhóm áp dụng 3 nguyên tắc phối hợp kỹ thuật:
1. **Mô hình Trách nhiệm Trọn gói (Full-stack Module Ownership):** Mỗi module tính năng lớn từ Module 3 trở đi do một thành viên phụ trách trọn vẹn từ cơ sở dữ liệu (Prisma Schema), dịch vụ xử lý Backend (NestJS Service), các API Endpoints (Controller) cho đến giao diện Frontend (Next.js Web và Expo Mobile). Điều này bảo đảm tính chủ động tối đa, tránh tình trạng "người này chờ người kia" và hạn chế xung đột mã nguồn (*Merge Conflict*).
2. **Cơ chế Đánh giá Chéo & Tuyệt đối không tự merge (Mandatory Peer Review):** Mọi nhánh tính năng đều phải mở Pull Request vào nhánh `develop`. Tuyệt đối không cho phép tự merge (*No Self-Merge*).
   - Mọi Pull Request do **Bình** tạo phải được **Hạnh** kiểm thử chéo và phê duyệt (*Review & Approve*).
   - Mọi Pull Request do **Hạnh** tạo phải được **Bình** kiểm thử chéo và phê duyệt (*Review & Approve*).
3. **Cân bằng khối lượng công việc hoàn hảo (Workload Balance 50% – 50%):** Khối lượng được định lượng dựa trên mức độ phức tạp kỹ thuật và số lượng use case, bảo đảm cả hai thành viên đều đóng góp tương đương cả về chiều sâu kỹ thuật lẫn nghiệp vụ.

---

## 2. MA TRẬN TRÁCH NHIỆM RACI THEO 12 MODULE CHỨC NĂNG

*(R: Responsible - Thực hiện chính, A: Accountable - Chịu trách nhiệm nghiệm thu, C: Consulted - Tham vấn ý kiến, I: Informed - Nhận thông tin)*

| Mã Module | Tên phân hệ chức năng | Trương Công Bình (23110184) | Ninh Thị Mỹ Hạnh (23110210) | Tài liệu đặc tả / Mã nguồn |
| :---: | :--- | :---: | :---: | :--- |
| **M0** | **Khảo sát, SRS & Kiến trúc C4** | **C / R** *(C4, ERD, SDD, Figma UI)* | **A / R** *(Khảo sát, 26 Use Cases, Data Dict)* | [`docs/requirements/SRS.md`](../requirements/SRS.md)<br>[`docs/architecture/SDD.md`](../architecture/SDD.md) |
| **M1** | **Hạ tầng Monorepo, Docker & CI/CD** | **A / R** *(Monorepo, Docker, VPS, Traefik)* | **C / I** *(Cấu hình biến môi trường, tài liệu)* | [`docker-compose.yml`](../../docker-compose.yml)<br>[`.github/workflows/`](../../.github/workflows/) |
| **M2** | **Xác thực JWT & Quản lý Tài khoản** | **A / R** *(JWT Rotation, Auth UI Web/Mobile)* | **C / R** *(Profile, Quan hệ bạn bè, OTP Mail)* | [`apps/api/src/modules/auth/`](../../apps/api/src/modules/auth/)<br>[`docs/capabilities/identity-access.md`](../capabilities/identity-access.md) |
| **M3** | **Quản trị Circle & Phân quyền Nhóm** | **C / I** *(Review PR, kiểm thử chéo)* | **A / R** *(Full-stack DB, API, Web & Mobile UI)* | [`apps/api/src/modules/circles/`](../../apps/api/src/modules/circles/)<br>[`docs/capabilities/circles-membership.md`](../capabilities/circles-membership.md) |
| **M4** | **Nhắn tin Thời gian thực & Cloudflare R2** | **A / R** *(Full-stack Socket.IO, R2, Chat UI)* | **C / I** *(Review PR, kiểm thử chéo)* | [`apps/api/src/modules/chat/`](../../apps/api/src/modules/chat/)<br>[`docs/capabilities/chat-messaging.md`](../capabilities/chat-messaging.md) |
| **M5** | **Khoảnh khắc nhóm (Moments Feed)** | **C / I** *(Review PR, kiểm thử chéo)* | **A / R** *(Full-stack DB, API, Moments UI, Privacy)* | [`apps/api/src/modules/moments/`](../../apps/api/src/modules/moments/)<br>[`docs/capabilities/feed-posts.md`](../capabilities/feed-posts.md) |
| **M6** | **Đàm thoại WebRTC Audio/Video Call** | **A / R** *(Coturn Server, Signaling, Call UI)* | **C / I** *(Review PR, kiểm thử chéo)* | [`apps/api/src/modules/calls/`](../../apps/api/src/modules/calls/)<br>[`docs/capabilities/realtime-calls.md`](../capabilities/realtime-calls.md) |
| **M7.1**| **Group Tools: Album, Lịch, Vòng xoay, Tâm sự** | **C / I** *(Review PR, kiểm thử chéo)* | **A / R** *(Full-stack Album, Calendar, Spin, Anon)* | [`apps/api/src/modules/circle-tools/`](../../apps/api/src/modules/circle-tools/)<br>[`docs/capabilities/`](../capabilities/) |
| **M7.2**| **Group Tools: Planning Sheet, Map, Poll** | **A / R** *(Full-stack Planning, Mapbox, Poll)* | **C / I** *(Review PR, kiểm thử chéo)* | [`apps/api/src/modules/circle-tools/`](../../apps/api/src/modules/circle-tools/)<br>[`docs/capabilities/`](../capabilities/) |
| **M8** | **Hệ thống Thông báo In-App & Push FCM** | **A / R** *(Socket Alerts, Expo Push, UI Center)* | **C / I** *(Review PR, kiểm thử chéo)* | [`apps/api/src/modules/notifications/`](../../apps/api/src/modules/notifications/) |
| **M9.1**| **Kiểm duyệt: Report Queue & Audit Log** | **C / I** *(Review PR, kiểm thử chéo)* | **A / R** *(Report Schema, Moderation Logic)* | [`apps/api/src/modules/moderation/`](../../apps/api/src/modules/moderation/) |
| **M9.2**| **Quản trị: Admin Portal & Dashboard** | **A / R** *(Next.js /admin, Metrics Chart)* | **C / I** *(Review PR, kiểm thử chéo)* | [`apps/web/src/app/admin/`](../../apps/web/src/app/admin/) |
| **M10**| **Kiểm thử Toàn diện & Tối ưu Hiệu năng** | **R** *(k6 Load Testing, Jest Backend, VPS Deploy)* | **A / R** *(Playwright E2E, SRS Consistency, Security)* | [`apps/web/e2e/`](../../apps/web/e2e/)<br>[`docs/testing/`](../testing/) |
| **M11**| **Thực nghiệm Người dùng & Luận văn** | **R** *(Vận hành Live Demo, Slide, Tech Tuning)* | **A / R** *(Tổ chức UAT, SUS Survey, Chủ biên Luận văn)* | [`docs/evidence/user-experiment/`](../evidence/user-experiment/)<br>[`docs/thesis/Bao-cao-TLCN.md`](../thesis/Bao-cao-TLCN.md) |

---

## 3. CHI TIẾT CÔNG VIỆC, LINK TÀI LIỆU & KẾT QUẢ THỰC HIỆN TỪNG THÀNH VIÊN

### 3.1. Thành viên 1: TRƯƠNG CÔNG BÌNH (MSSV: 23110184) — Trưởng nhóm
- **Vai trò chính:** Kỹ thuật trưởng (Technical Lead), Thiết kế Kiến trúc, Hạ tầng DevOps, Realtime Communications và Phụ trách Giao diện UI/UX toàn hệ thống.
- **Chi tiết các hạng mục đã hoàn thành:**
  1. **Thiết kế Kiến trúc & Thiết kế Giao diện UI/UX:**
     - Xây dựng mô hình kiến trúc C4 Model, Sơ đồ triển khai hệ thống vật lý và Sơ đồ lớp cơ sở dữ liệu ERD.
     - Thiết kế toàn bộ hệ thống Wireframe và Design System trên Figma (Web Desktop & Mobile App).
     - *Minh chứng:* [`docs/architecture/SDD.md`](../architecture/SDD.md), [`docs/design.md`](../design.md).
  2. **Hạ tầng Monorepo, Docker & CI/CD Pipeline:**
     - Thiết lập cấu trúc Monorepo Workspace (Turborepo/npm workspaces), Docker Compose môi trường dev và production.
     - Thiết lập GitHub Actions CI/CD Pipeline tự động hóa 6 giai đoạn, cấu hình VPS Ubuntu Server với Traefik Reverse Proxy và chứng chỉ SSL Let's Encrypt.
     - *Minh chứng:* [`.github/workflows/`](../../.github/workflows/), [`docker-compose.yml`](../../docker-compose.yml).
  3. **Xác thực Hệ thống Kỹ thuật (Authentication Engine):**
     - Hiện thực cơ chế bảo mật JWT Access Token kết hợp Refresh Token Rotation, kiểm soát phiên đăng nhập trên Redis, bộ lọc bảo vệ RoleGuard (`@Roles()`).
     - *Minh chứng:* [`apps/api/src/modules/auth/`](../../apps/api/src/modules/auth/).
  4. **Phân hệ Nhắn tin Thời gian thực (Group Chat) & Lưu trữ R2:**
     - Phát triển Socket.IO Chat Gateway hỗ trợ phân phối tin nhắn theo phòng (Circle Room), xử lý xác nhận gói tin (ACK) và chỉ báo đang nhập (Typing indicator).
     - Tích hợp Cloudflare R2 qua AWS S3 SDK (Presigned URL) xử lý tải tệp tin đa phương tiện lên tới 25MB.
     - Lập trình giao diện Chat ảo hóa (Virtual Message List), trình phát voice note, bộ chọn ảnh và tính năng ghim tin nhắn (`UC13`).
     - *Minh chứng:* [`apps/api/src/modules/chat/`](../../apps/api/src/modules/chat/), PR #105, PR #109, PR #111.
  5. **Phân hệ Đàm thoại Trực tiếp WebRTC Audio/Video Call:**
     - Triển khai và vận hành máy chủ độc lập **Coturn (STUN/TURN)** trên Linux VPS.
     - Xây dựng Signaling Gateway qua Socket.IO trao đổi SDP và ICE Candidates.
     - Lập trình giao diện cuộc gọi WebRTC trên cả Web và Mobile: Grid hiển thị camera, nút bật/tắt mic/cam, cơ chế ICE restart khi mất mạng.
     - *Minh chứng:* [`apps/api/src/modules/calls/`](../../apps/api/src/modules/calls/), [`docs/guides/webrtc-setup.md`](../guides/webrtc-setup.md).
  6. **Bộ Công cụ Nhóm Tương tác Kỹ thuật (Group Tools 7.2):**
     - *Collaborative Planning Sheet (`UC18`):* Bảng kế hoạch công việc đồng bộ realtime qua WebSocket.
     - *Live Location Map (`UC19`):* Tích hợp Mapbox SDK hiển thị tọa độ GPS thành viên trực tiếp kèm đồng hồ đếm ngược tự ngắt phát sóng.
     - *Group Poll (`UC15`):* Thăm dò ý kiến tức thời, thống kê số phiếu và % realtime.
     - *Minh chứng:* [`apps/api/src/modules/circle-tools/`](../../apps/api/src/modules/circle-tools/), PR #98, PR #119.
  7. **Hệ thống Thông báo Đa kênh & Cổng Quản trị Admin Portal:**
     - Xây dựng Notification Center trên Web và tích hợp dịch vụ Push Notification trên Mobile.
     - Xây dựng Cổng quản trị Admin Portal tại `/admin` trên Next.js với Dashboard biểu đồ trực quan, quản lý danh sách người dùng và Circle.
     - *Minh chứng:* [`apps/web/src/app/admin/`](../../apps/web/src/app/admin/), PR #128.
  8. **Kiểm thử Hiệu năng & Vận hành Triển khai:**
     - Thiết lập và thực thi kịch bản kiểm thử áp lực k6, đo đạc P95 latency đạt $\le 80\text{ ms}$.
     - Vận hành máy chủ Live Demo và môi trường Staging/Production phục vụ hội đồng nghiệm thu.
     - *Minh chứng:* [`docs/deployment/`](../deployment/), [`docs/evidence/cicd/`](../evidence/cicd/).

### 3.2. Thành viên 2: NINH THỊ MỸ HẠNH (MSSV: 23110210)
- **Vai trò chính:** Phụ trách Phân tích Nghiệp vụ (Business Analyst Lead), Logic Mạng xã hội (Social Logic Lead), Kiểm duyệt Nội dung và Trưởng nhóm Đảm bảo Chất lượng Phần mềm (QA Lead).
- **Chi tiết các hạng mục đã hoàn thành:**
  1. **Khảo sát Nhu cầu, Xây dựng Yêu cầu & Tài liệu Đặc tả (SRS):**
     - Thiết kế phiếu khảo sát, trực tiếp phỏng vấn và thu thập $\ge 30$ phản hồi thực tế từ người dùng mục tiêu.
     - Xây dựng hồ sơ chân dung người dùng (User Personas), Bản xác định bài toán thực tiễn.
     - Chủ biên biên soạn tài liệu **Software Requirements Specification (SRS)** với trọn vẹn 26 Use Cases (`UC01` đến `UC26`), 100% kèm Acceptance Criteria chuẩn Gherkin.
     - Xây dựng Từ điển dữ liệu (*Data Dictionary*) và 20 Quy tắc nghiệp vụ (*Business Rules `BR01`–`BR20`*).
     - *Minh chứng:* [`docs/requirements/SRS.md`](../requirements/SRS.md), [`docs/research/problem-statement.md`](../research/problem-statement.md).
  2. **Nghiệp vụ Tài khoản & Quan hệ Bạn bè:**
     - Hiện thực dịch vụ gửi email xác thực mã OTP kích hoạt tài khoản và khôi phục mật khẩu.
     - Xây dựng logic nghiệp vụ Quản lý hồ sơ cá nhân và mạng lưới quan hệ bạn bè (Gửi lời mời, chấp nhận, từ chối, chặn người dùng).
     - *Minh chứng:* [`apps/api/src/modules/users/`](../../apps/api/src/modules/users/), [`docs/capabilities/identity-access.md`](../capabilities/identity-access.md).
  3. **Phân hệ Quản trị Không gian Nhóm (Circle Core & Governance):**
     - Thiết kế Schema `Circle`, `CircleMember`, `CircleInvite`.
     - Lập trình trọn gói Full-stack: Tạo nhóm, cơ chế phê duyệt đơn tham gia, sinh mã mời/liên kết tham gia nhóm.
     - Hiện thực các nghiệp vụ quản trị phức tạp: Đổi biệt danh nội bộ (`UC20`), Chuyển nhượng quyền Owner (`UC25`), Giải tán Circle (`UC26`), Chặn Owner tự ý rời nhóm khi chưa bàn giao quyền (`UC22`).
     - Lập trình giao diện quản lý thành viên và thiết lập Circle trên cả Web và Mobile.
     - *Minh chứng:* [`apps/api/src/modules/circles/`](../../apps/api/src/modules/circles/), [`docs/capabilities/circles-membership.md`](../capabilities/circles-membership.md).
  4. **Phân hệ Khoảnh khắc Nhóm (Moments & Group Feed):**
     - Thiết kế Schema `Moment`, `MomentVisibility`, `MomentReaction`.
     - Lập trình trọn gói Full-stack: Giao diện chụp ảnh, đăng bài kèm chú thích; thuật toán lọc bảo mật **Circle-based Privacy** (chỉ hiển thị bài đăng cho các Circle được chỉ định).
     - Xây dựng logic phản hồi Moment: Tự động trích dẫn ảnh khoảnh khắc chuyển thành tin nhắn vào khung chat chung của Circle.
     - *Minh chứng:* [`apps/api/src/modules/moments/`](../../apps/api/src/modules/moments/), [`docs/capabilities/feed-posts.md`](../capabilities/feed-posts.md).
  5. **Bộ Công cụ Nhóm Tương tác Nghiệp vụ (Group Tools 7.1):**
     - *Shared Album (`UC14`):* Quản lý bộ sưu tập ảnh/video theo chủ đề, giao diện tải lên và xem ảnh chất lượng gốc.
     - *Group Calendar & Reminders (`UC17`):* Lịch sự kiện nhóm, quản lý phản hồi tham gia (Event RSVP: Tham gia, Chưa chắc, Bận), nhắc hẹn tự động.
     - *Decision Wheel (`UC16`):* Vòng xoay may mắn sinh kết quả công bằng, giao diện animation xoay thưởng mượt mà.
     - *Điều muốn nói (`UC21`):* Tâm sự ẩn danh nội bộ, thuật toán tự động bóc tách và loại bỏ hoàn toàn siêu dữ liệu `author_id`.
     - *Minh chứng:* [`apps/api/src/modules/circle-tools/`](../../apps/api/src/modules/circle-tools/), PR #101, PR #117, PR #120.
  6. **Hệ thống Kiểm duyệt & Xử lý Báo cáo Vi phạm (Moderation):**
     - Thiết kế hệ thống tiếp nhận báo cáo vi phạm nội dung (Report Queue) cho tin nhắn, khoảnh khắc và tài khoản.
     - Xây dựng quy trình xử lý vi phạm và lưu vết lịch sử kiểm tra (Audit Log) minh bạch phục vụ thanh tra hệ thống.
     - *Minh chứng:* [`apps/api/src/modules/moderation/`](../../apps/api/src/modules/moderation/), [`docs/capabilities/moderation-admin.md`](../capabilities/moderation-admin.md).
  7. **Kiểm thử E2E Playwright, Đảm bảo Chất lượng & Rà soát Bảo mật:**
     - Thiết kế và tự động hóa toàn bộ bộ kịch bản kiểm thử End-to-End (E2E) bằng **Playwright** theo 100% tiêu chí Acceptance Criteria của SRS.
     - Thực hiện kiểm tra an toàn bảo mật: Rà soát lỗ hổng XSS, kiểm tra cấu hình CORS/CSP, audit các thư viện phụ thuộc (`npm audit`).
     - *Minh chứng:* [`apps/web/e2e/`](../../apps/web/e2e/), [`docs/testing/`](../testing/).
  8. **Tổ chức Thực nghiệm Người dùng (UAT) & Chủ biên Báo cáo Khóa luận:**
     - Thiết kế kịch bản thử nghiệm (Task Script), tuyển chọn và điều phối buổi thực nghiệm với $\ge 10$ người dùng mục tiêu.
     - Thu thập dữ liệu, phân tích chỉ số Task Completion Rate và tính toán điểm số chuẩn hóa System Usability Scale (SUS).
     - Chủ biên biên soạn hoàn thiện toàn bộ thuyết minh Khóa luận/Tiểu luận chuyên ngành (bản in đóng bìa và nộp lưu chiểu).
     - *Minh chứng:* [`docs/evidence/user-experiment/`](../evidence/user-experiment/), [`docs/thesis/Bao-cao-TLCN.md`](../thesis/Bao-cao-TLCN.md).

---

## 4. TỔNG KẾT ĐÁNH GIÁ MỨC ĐỘ ĐÓNG GÓP (50% – 50%)

| Tiêu chí so sánh | Trương Công Bình (23110184) | Ninh Thị Mỹ Hạnh (23110210) | Nhận xét chung |
| :--- | :---: | :---: | :--- |
| **Phân hệ phụ trách chính** | Hạ tầng, Realtime Chat, WebRTC Call, Map, Poll, Admin Portal, Push Notif | SRS, Circle Core, Moments Feed, Album, Calendar, Decision Wheel, Anon, Moderation | Khối lượng module tương đương |
| **Phạm vi lập trình** | Full-stack (Backend + Web + Mobile + Ops) | Full-stack (Backend + Web + Mobile + QA) | Cả hai đều làm chủ toàn bộ stack |
| **Kiểm thử & Chất lượng** | k6 Load Test, Jest Backend, VPS CI/CD | Playwright E2E, UAT 10 Users, SUS Survey | Phối hợp đa tầng hoàn chỉnh |
| **Tài liệu & Thuyết minh** | SDD, C4 Model, Design System, API Docs | SRS 26 Use Cases, Chủ biên Luận văn | Đầy đủ hồ sơ học thuật |
| **Tỷ lệ đóng góp thực tế** | **50.0%** | **50.0%** | **Hoàn toàn cân bằng** |

---

## 5. XÁC NHẬN CỦA CÁC THÀNH VIÊN VÀ GIẢNG VIÊN HƯỚNG DẪN

Hai sinh viên cam kết các nội dung phân công và kết quả thực hiện nêu trên là hoàn toàn chính xác, trung thực và phản ánh đúng quá trình nỗ lực cộng tác trong suốt kỳ làm đề tài.

*Ngày 18 tháng 11 năm 2026*

| GIẢNG VIÊN HƯỚNG DẪN | TRƯỞNG NHÓM SINH VIÊN | THÀNH VIÊN SINH VIÊN |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Nguyễn Trần Thi Văn** | <br><br><br>**Trương Công Bình**<br>MSSV: 23110184 | <br><br><br>**Ninh Thị Mỹ Hạnh**<br>MSSV: 23110210 |
