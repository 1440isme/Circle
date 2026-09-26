# BẢNG PHÂN CÔNG NHIỆM VỤ THỰC HIỆN TIỂU LUẬN CHUYÊN NGÀNH — CIRCLE

> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Sinh viên thực hiện:**  
> 1. **Ninh Thị Mỹ Hạnh** — MSSV: `23110210` *(Trọng tâm: Nghiệp vụ, Social Logic, Moderation & QA Lead)*  
> 2. **Trương Công Bình** — MSSV: `23110184` *(Trọng tâm: Hạ tầng, Technical Core, Realtime & UI/UX Lead)*  
> **Giảng viên hướng dẫn:** ThS. Nguyễn Trần Thi Văn  
> **Thời gian thực hiện:** 15 tuần (17/08/2026 – 29/11/2026)  
> **Căn cứ kế hoạch:** [`docs/Ke hoach thuc hien TLCN .md`](./Ke%20hoach%20thuc%20hien%20TLCN%20.md) và [`docs/requirements/SRS.md`](./requirements/SRS.md)

---

## 1. NGUYÊN TẮC VẬN HÀNH & PHỐI HỢP CỐT LÕI

1. **Triết lý Nhóm là trung tâm (Circle-Centric / Group-First):**
   - Theo đặc tả chính thức tại [`SRS.md`](./requirements/SRS.md), **toàn bộ tương tác nhắn tin và cuộc gọi chỉ diễn ra trong không gian nhóm (Circle)**.
   - **Tuyệt đối không có tính năng Chat 1-1** độc lập ngoài nhóm nhằm bảo đảm đúng tôn chỉ micro-community của đề tài.

2. **Mô hình Trách nhiệm Trọn gói (Full-stack Module Ownership):**
   - **Module 0, 1, 2:** Phân chia theo thế mạnh chuyên môn để thiết lập nền móng kiến trúc vững chắc.
   - **Từ Module 3 trở đi:** Mỗi module hoặc cụm tính năng do một thành viên phụ trách **trọn gói Full-stack** (từ Prisma Schema, Backend API, Business Service đến Giao diện Frontend Web và Mobile App).
   - Tối ưu hóa tính độc lập, loại bỏ tình trạng người này chờ người kia (Zero-blocking) và hạn chế tối đa xung đột mã nguồn (Merge Conflict).

3. **Cơ chế Gối đầu & Đánh giá chéo (Pipelining & Cross-Testing):**
   - Khi Thành viên A hoàn thành và mở Pull Request cho Module của mình, Thành viên B tiến hành **Peer Review** và **Cross-Testing** theo Acceptance Criteria.
   - Cùng thời điểm đó, Thành viên A gối đầu sang phân tích và triển khai Module tiếp theo trong lộ trình.
   - **Quy tắc bắt buộc:** Tuyệt đối không tự merge PR (No Self-Merge). Mọi PR của Hạnh phải do Bình review/approve; mọi PR của Bình phải do Hạnh review/approve.

---

## 2. MA TRẬN PHÂN CHIA TRÁCH NHIỆM THEO MODULE (12 MODULES)

| Module | Tên Module | Người phụ trách Full-stack | Phạm vi công việc chi tiết |
| :---: | :--- | :---: | :--- |
| **0** | **Khảo sát, SRS & Kiến trúc Hệ thống** | **Hạnh + Bình** | • **Hạnh:** Khảo sát nhu cầu, Personas, SRS (26 Use Cases `UC01`–`UC26`), Business Rules, Data Dictionary.<br>• **Bình:** Kiến trúc C4 Model, Sơ đồ lớp miền nghiệp vụ (Class Diagram), Thiết kế Wireframe/Figma UI/UX toàn hệ thống. |
| **1** | **Hạ tầng Monorepo, Docker & CI/CD** | **Bình (Lead) + Hạnh (Spec)** | • **Bình:** Setup Monorepo Workspace, Docker Compose (PostgreSQL 16, Redis 7), CI/CD GitHub Actions, VPS Traefik SSL.<br>• **Hạnh:** Cấu hình biến môi trường nghiệp vụ, quy chuẩn đặt tên và tài liệu vận hành. |
| **2** | **Xác thực, Phân quyền & Quản lý Tài khoản** | **Hạnh + Bình** | • **Hạnh:** Nghiệp vụ Profile cá nhân, Đổi mật khẩu, OTP email khôi phục mật khẩu, Quản lý quan hệ bạn bè.<br>• **Bình:** Auth Engine kỹ thuật (JWT Access/Refresh Token rotation, bcrypt, RoleGuard, `@Roles()`), Base UI Auth Web & Mobile. |
| **3** | **Không gian Nhóm (Circle Core & Governance)** | 🟢 **HẠNH (Full-stack)** | • **DB & API:** Schema `Circle`, `CircleMember`, `CircleInvite`; API Tạo nhóm, Cấu hình chế độ tham gia, Mã mời/Link mời; Phân quyền Owner/Member, Duyệt/Trục xuất thành viên, Đổi biệt danh nội bộ (`UC20`), Chuyển nhượng quyền Owner (`UC25`), Giải tán Circle (`UC26`), Chặn Owner tự ý rời nhóm nếu chưa chuyển quyền (`UC22`).<br>• **UI/UX:** Màn hình danh sách Circle, Modal tạo nhóm nhanh, Màn hình cài đặt nhóm và quản lý thành viên trên Web & Mobile. |
| **4** | **Nhắn tin Nhóm Thời gian thực & Media Storage** | 🔵 **BÌNH (Full-stack)** | • **DB & API:** Schema `Channel`, `Message`, `MessageAttachment`, `MessageReaction`; Quản lý kênh chat gắn với Circle (**Circle-Only, không có Chat 1-1**); Tích hợp Cloudflare R2 Presigned URL (tối đa 25MB); Socket.IO Gateway routing theo `circle_id`, Cursor-based pagination, Reply, Reaction, Ghim/Bỏ ghim tin nhắn (`UC13`).<br>• **UI/UX:** Khung chat ảo hóa cuộn mượt mà (Virtual List), Bubble chat đa phương tiện (Văn bản, Ảnh, Video, File, Trình phát Voice Message), Media Picker. |
| **5** | **Khoảnh khắc theo nhóm (Moments & Feed)** | 🟢 **HẠNH (Full-stack)** | • **DB & API:** Schema `Moment`, `MomentVisibility`, `MomentReaction`; **Cơ chế lọc bảo mật Circle-based Privacy** (chỉ định chính xác Circle được xem bài); API Feed tổng hợp; Nghiệp vụ phản hồi Moment (tự động trích dẫn ảnh khoảnh khắc gửi thẳng vào chat nhóm chung).<br>• **UI/UX:** Khay hiển thị Moments dạng tròn/lưới, Story Viewer toàn màn hình lướt chuyển bài đăng mượt mà, Giao diện chụp/đăng bài kèm bộ chọn Circle. |
| **6** | **Đàm thoại Thoại & Hình ảnh Thời gian thực (WebRTC Call)** | 🔵 **BÌNH (Full-stack)** | • **Hạ tầng & API:** Cấu hình máy chủ Coturn (STUN/TURN) trên VPS; Signaling Gateway qua Socket.IO (SDP Offer/Answer, ICE Candidates); Quản lý trạng thái cuộc gọi nhóm (Ringing, Busy, Missed Call), lưu lịch sử cuộc gọi (`UC12`).<br>• **UI/UX:** Tích hợp `RTCPeerConnection`, quản lý MediaStream (Mic/Cam/Loa); Màn hình chuông reo, Màn hình đàm thoại Video Call 2 chiều, Nút điều khiển Mic/Cam/Loa, Xử lý ICE Restart khi mất mạng. |
| **7.1**| **Công cụ Nhóm: Album, Lịch, Vòng xoay, Điều muốn nói** | 🟢 **HẠNH (Full-stack)** | • **Shared Album (`UC14`):** Tạo album theo chủ đề, lưu trữ ảnh/video chất lượng cao, UI Grid xem và tải ảnh.<br>• **Group Calendar & Reminders (`UC17`):** API Lịch nhóm, tạo sự kiện, tự động gửi thông báo nhắc hẹn, UI Calendar View.<br>• **Decision Wheel (`UC16`):** Sinh kết quả ngẫu nhiên công bằng trên server, UI Animation vòng xoay may mắn.<br>• **Điều muốn nói (`UC21`):** Tâm sự ẩn danh nội bộ, **tự động bóc tách và xóa sạch `author_id`**, UI thiệp trang trí ấm cúng. |
| **7.2**| **Công cụ Nhóm: Bảng kế hoạch, Bản đồ & Bình chọn Poll** | 🔵 **BÌNH (Full-stack)** | • **Collaborative Planning Sheet (`UC18`):** Cấu trúc bảng tính công việc, đồng bộ chỉnh sửa realtime qua WebSocket, UI Sheet tương tác.<br>• **Live Location (`UC19`):** Tọa độ GPS, đếm ngược tự ngắt phát sóng (15p, 30p, 1h), UI Bản đồ số (Mapbox) hiển thị avatar di chuyển trực tiếp.<br>• **Group Poll (`UC15`):** Thăm dò ý kiến (đơn/đa lựa chọn), tự động tính số phiếu và % realtime, Widget biểu quyết sinh động. |
| **8** | **Hệ thống Thông báo & Push Notification** | 🔵 **BÌNH (Full-stack)** | • **DB & API:** Schema `Notification`, `DeviceToken`; Realtime In-app notification qua Socket.IO; Tích hợp Push Notification đa nền tảng (Expo/FCM) cho nhắc hẹn, lời mời, cuộc gọi nhỡ.<br>• **UI/UX:** Notification Center (Đánh dấu đã đọc/chưa đọc, bộ lọc), Badge count trên icon chuông, Màn hình cấu hình bật/tắt thông báo theo Circle. |
| **9.1**| **Quản trị: Hệ thống Báo cáo Vi phạm & Kiểm duyệt Nội dung** | 🟢 **HẠNH (Full-stack)** | • **Phía User:** Nút gửi Report kèm bằng chứng (bài viết Moment, nội dung chat vi phạm tiêu chuẩn cộng đồng).<br>• **Phía Admin:** Hàng đợi kiểm duyệt (Moderation Queue), Màn hình đối chiếu bằng chứng vi phạm, Thao tác duyệt xử phạt (Ẩn/Xóa nội dung, Cảnh cáo, Giải tán nhóm vi phạm) hoặc Bác bỏ.<br>• **Audit Log:** Lưu trữ nhật ký kiểm duyệt minh bạch phục vụ thanh tra. |
| **9.2**| **Quản trị: Nền tảng Admin Portal & Dashboard Thống kê** | 🔵 **BÌNH (Full-stack)** | • **Hạ tầng Admin:** Cấu hình Portal Admin tại `/admin` trên Next.js, bảo vệ bằng Admin RoleGuard.<br>• **Metrics Dashboard:** API tổng hợp và hiển thị biểu đồ số liệu trực quan (Tổng User, DAU/MAU, Số Circle hoạt động, Lưu lượng tin nhắn).<br>• **Quản lý Thực thể:** Giao diện tra cứu Người dùng toàn hệ thống, Khóa/Mở khóa tài khoản; Quản lý danh mục Circle. |
| **10**| **Kiểm thử Toàn diện, Hiệu năng & Triển khai Production** | **Hạnh (QA) + Bình (DevOps)** | • **Hạnh:** Viết bộ kịch bản kiểm thử E2E Test (Playwright) theo Acceptance Criteria; Rà soát tính nhất quán 100% giữa SRS ↔ API ↔ UI; Security review (XSS/CSRF, sanitization, dependencies audit).<br>• **Bình:** Kiểm thử tải k6 (Stress/Spike test p95 latency); Quét secret Gitleaks; Hoàn thiện Docker Production; Triển khai VPS qua Traefik HTTPS ($\ge 10$ automated deploys). |
| **11**| **Thực nghiệm Người dùng & Nghiệm thu Đề tài** | **Hạnh (UAT) + Bình (Demo)** | • **Hạnh:** Soạn thảo Task Script, Điều phối thực nghiệm với $\ge 10$ người dùng, Đo lường Task Success Rate, khảo sát SUS và CSAT; Chủ biên hoàn thiện Báo cáo Khóa luận (Word/PDF).<br>• **Bình:** Vận hành máy chủ Live Demo; Tinh chỉnh ngay điểm nghẽn UX sau UAT; Chuẩn bị Slide thuyết trình; Đóng gói mã nguồn bàn giao. |

---

## 3. TIẾN ĐỘ THỰC HIỆN THEO KẾ HOẠCH 15 TUẦN

```
Tuần 1 – 3: [M0: Phân tích & Kiến trúc]
             Hạnh: Khảo sát, Personas, SRS (26 Use Cases), Business Rules, Data Dictionary
             Bình: C4 Architecture Model, Sơ đồ lớp ERD, Wireframe/Figma UI/UX toàn hệ thống

Tuần 4:     [M1: Hạ tầng] Bình: Setup Monorepo, Docker Compose (PostgreSQL, Redis), Base CI/CD
             [M2: Auth]     Hạnh: Business Logic Profile, Bạn bè | Bình: JWT Auth Engine & Auth UI

Tuần 5 – 6: [M3: Circles]   HẠNH Full-stack (DB + API + Web/Mobile UI Quản lý Circle & Phân quyền)
             [M4: Chat/R2]   BÌNH Full-stack (DB + API + Socket.IO + Cloudflare R2 + Web/Mobile Chat UI - Group Only)
             --> Cuối tuần 6: Cross-Review & Cross-Testing lẫn nhau!

Tuần 7 – 8: [M5: Moments]   HẠNH Full-stack (DB + API + Web/Mobile UI Moments, Privacy theo Circle)
             [M6: WebRTC]    BÌNH Full-stack (Coturn Server + Signaling + Web/Mobile Call UI)
             --> Cuối tuần 8: Cross-Review & Cross-Testing lẫn nhau!

Tuần 9 – 10:[M7.1: Group Tools] HẠNH Full-stack (Shared Album, Calendar, Vòng xoay, "Điều muốn nói")
             [M7.2: Group Tools] BÌNH Full-stack (Bảng kế hoạch cộng tác, Live Location Map, Group Poll)
             --> Cuối tuần 10: Tự động hóa Integration Test suite!

Tuần 11 – 12:[M9.1: Moderation]  HẠNH Full-stack (Hệ thống Report, Moderation Queue, Audit Log)
             [M8: Push Notif]   BÌNH Full-stack (Expo/FCM Push Service, Socket alerts, Notification Center UI)
             [M9.2: Admin Web]  BÌNH Full-stack (Admin Portal /admin, Dashboard Thống kê, Quản lý User/Circle)
             --> Cuối tuần 12: Audit tính nhất quán toàn diện DB ↔ API ↔ UI!

Tuần 13:    [M10: Testing]  Hạnh: Playwright E2E Test Suites, Kiểm thử luồng nghiệp vụ theo AC
                             Bình: Jest Unit/Integration Test Backend, Bug Fixing & Patching

Tuần 14:    [M10: Prod/Sec] Hạnh: Security Review, Audit dependencies, Rà soát tài liệu vận hành
                             Bình: k6 Load Test, Gitleaks, CI/CD GitHub Actions, Deploy VPS Traefik

Tuần 15:    [M11: Nghiệm thu]Hạnh: Tổ chức UAT 10 users, đo SUS/CSAT, Hoàn thiện Báo cáo Khóa luận
                             Bình: Vận hành máy chủ Live Demo, Tinh chỉnh sau UAT, Slide bảo vệ
```

---

## 4. TỔNG KẾT ĐỘ CÂN BẰNG KHỐI LƯỢNG (WORKLOAD BALANCE 50 - 50)

* **Ninh Thị Mỹ Hạnh:** Phụ trách toàn diện 4 Module nghiệp vụ cốt lõi (Module 3, 5, 7.1, 9.1) từ Backend đến Frontend Web/Mobile + Quản lý yêu cầu SRS + E2E Testing Playwright + UAT & Chủ biên Báo cáo Khóa luận.
* **Trương Công Bình:** Phụ trách toàn diện 4 Module kỹ thuật, hạ tầng & giao diện realtime (Module 1, 4, 6, 7.2, 8, 9.2) từ Backend đến Frontend Web/Mobile + Hạ tầng Docker/CI-CD/VPS + Load Testing k6 + Live Demo.
* **Tỷ lệ đóng góp:** **50% – 50%**, cả hai đều tham gia sâu sắc vào Full-stack, bảo đảm đáp ứng mức độ hoàn thành Level 5 theo Rubric tốt nghiệp.
