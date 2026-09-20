# CIRCLE — BẢN ĐẶC TẢ PHẠM VI HỆ THỐNG (SYSTEM SCOPE SPECIFICATION)

> **Mục tiêu tài liệu:** Thiết lập ranh giới kỹ thuật rõ ràng giữa các tính năng thuộc phạm vi thực hiện (**In-Scope**) và các tính năng nằm ngoài phạm vi (**Out-of-Scope**) của đề tài tốt nghiệp CIRCLE.
> 
> **Căn cứ pháp lý & kỹ thuật:**
> - [x] **Phiếu Nhiệm vụ thực hiện TLCN** do Khoa CNTT — Trường Đại học Sư phạm Kỹ thuật TP.HCM ban hành ([`docs/Nhiem vu thuc hien TLCN.md`](../Nhiem%20vu%20thuc%20hien%20TLCN.md)).
> - [x] **Kế hoạch thực hiện đề tài** 15 tuần đã thống nhất với GVHD ([`docs/Ke hoach thuc hien TLCN .md`](../Ke%20hoach%20thuc%20hien%20TLCN%20.md)).
> - [x] **Hiến pháp kiến trúc hệ thống** ([`PROJECT_GOD.md`](../../PROJECT_GOD.md)).

---

## 1. NGUYÊN TẮC XÁC ĐỊNH PHẠM VI (SCOPE PRINCIPLES)

1. **Bám sát 100% Phiếu nhiệm vụ chính thức:** Mọi yêu cầu nghiệp vụ được Khoa phê duyệt trong phiếu nhiệm vụ đều được bảo đảm hiện thực hóa đầy đủ ở mức độ hoàn thiện cao (Production-ready).
2. **Ngăn chặn bành trướng tính năng (Scope Creep):** Tuyên bố minh bạch các ranh giới công nghệ để bảo vệ nhóm trước các câu hỏi vượt ngoài năng lực hạ tầng máy chủ sinh viên (kinh phí tự túc) và giới hạn thời gian đồ án.
3. **Ưu tiên chiều sâu kỹ thuật hơn chiều rộng:** Tập trung tối ưu kiến trúc Modular Monolith, đồng bộ thời gian thực (WebSocket), cuộc gọi WebRTC P2P ổn định và trải nghiệm mượt mà trên cả 3 nền tảng: Backend, Web và Mobile.

---

## 2. MA TRẬN PHÂN ĐỊNH PHẠM VI (IN-SCOPE VS OUT-OF-SCOPE)

### 2.1. Phân hệ Quản lý Tài khoản & Bạn bè (Identity & Social Graph)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Xác thực (Authentication)** | - Đăng ký, đăng nhập bằng Email và Mật khẩu.<br>- Cơ chế bảo mật Dual-Token: Access Token (ngắn hạn) + Refresh Token Rotation.<br>- Mã hóa mật khẩu bằng thuật toán Bcrypt (Salt rounds = 12).<br>- Thu hồi phiên đăng nhập khi phát hiện token rò rỉ. | - Tích hợp đăng nhập bên thứ ba phức tạp (Apple ID, SAML / LDAP doanh nghiệp).<br>- Xác thực sinh trắc học eKYC bằng căn cước công dân gắn chip. |
| **Hồ sơ cá nhân (Profile)** | - Quản lý thông tin cá nhân: Họ tên, Username, Bio, Avatar, Ảnh bìa.<br>- Đổi mật khẩu, cài đặt quyền riêng tư cơ bản. | - Xác minh tích xanh người nổi tiếng (Identity Verification badge). |
| **Quản lý bạn bè (Friends)** | - Tìm kiếm người dùng theo Username hoặc Email.<br>- Gửi lời mời kết bạn, hủy lời mời, chấp nhận hoặc từ chối kết bạn.<br>- Quản lý danh sách bạn bè, danh sách lời mời đang chờ.<br>- Chặn (Block) người dùng để ngăn giao tiếp. | - Thuật toán AI "Người bạn có thể biết" dựa trên đồ thị mạng xã hội lớn (Graph Neural Networks). |

---

### 2.2. Phân hệ Quản lý Hội nhóm (Circle Management & RBAC)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Vòng tròn kết nối (Circle)** | - Tạo mới Circle với tên, ảnh đại diện, mô tả và chế độ riêng tư (Public / Private).<br>- Tạo và chia sẻ mã mời (Invite Code), link mời tham gia Circle.<br>- Duyệt hoặc từ chối yêu cầu gia nhập đối với Private Circle. | - Circle trả phí đăng ký định kỳ (Subscription-based membership).<br>- Tích hợp cổng thanh toán trực tiếp trong Circle. |
| **Phân quyền (Circle RBAC)** | - 3 cấp độ vai trò tiêu chuẩn trong Circle: **Chủ phòng (Owner)**, **Quản trị viên (Admin)**, **Thành viên (Member)**.<br>- Quản trị quyền hạn: Đổi thông tin Circle, duyệt thành viên, xóa bài, kích thành viên vi phạm. | - Hệ thống phân quyền động tùy biến không giới hạn cấp độ (Dynamic RBAC Custom Roles). |
| **Cấu trúc không gian (Channels)** | - Tổ chức kênh thảo luận dạng danh mục (Text Channels) giúp chia nhỏ chủ đề sinh hoạt trong Circle. | - Diễn đàn dạng câu hỏi - trả lời phân luồng phức tạp như StackOverflow. |

---

### 2.3. Phân hệ Giao tiếp Thời gian thực (Realtime Chat & Media)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Nhắn tin trực tiếp & Nhóm (Chat)** | - Chat 1-1 riêng tư giữa 2 bạn bè.<br>- Chat theo kênh văn bản trong Circle.<br>- Đồng bộ thời gian thực qua WebSocket (Socket.IO + Redis Pub/Sub).<br>- Chỉ báo trạng thái: Đang nhập (Typing indicator), trạng thái online/offline, đã nhận/đã đọc (Delivery ACK). | - Mã hóa đầu cuối phân tán đa thiết bị (E2EE Signal Protocol) cho group chat hàng nghìn người. |
| **Đa phương tiện (Rich Media)** | - Gửi hình ảnh, tệp tin đính kèm (PDF, Docx, Zip $\le$ 25MB).<br>- Ghi âm và gửi tin nhắn thoại (Voice Message).<br>- Trả lời tin nhắn (Quote Reply) và thả biểu tượng cảm xúc (Reaction emoji).<br>- Ghim (Pin) tin nhắn quan trọng trong hội thoại.<br>- Lưu trữ và tối ưu hóa tài nguyên media trên Cloudflare R2 qua Pre-signed URL. | - Trình biên tập chỉnh sửa ảnh/cắt ghép video chuyên nghiệp trực tiếp trên Web/App. |

---

### 2.4. Phân hệ Cuộc gọi Thoại & Video (Voice & Video Call — WebRTC)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Cuộc gọi 1-1 (P2P Direct Call)** | - Cuộc gọi thoại (Voice Call) và gọi video (Video Call) trực tiếp giữa 2 thành viên.<br>- Báo chuông cuộc gọi đến qua WebSocket Signaling.<br>- Kết nối P2P trực tiếp bằng công nghệ WebRTC (sử dụng Public Google STUN Servers và Coturn TURN Server fallback).<br>- Điều khiển: Bật/tắt micro, bật/tắt camera, chuyển đổi camera trước/sau trên mobile, kết thúc cuộc gọi. | - Ghi âm / ghi hình lưu trữ đám mây (Cloud Call Recording).<br>- Lọc tạp âm môi trường bằng mô hình trí tuệ nhân tạo (AI Noise Cancellation). |
| **Phòng gọi nhóm trong Circle (Group Room / Voice Stage)** | - Phòng đàm thoại nhóm (Voice/Video Room) tích hợp ngay trong Circle phục vụ học nhóm, thảo luận câu lạc bộ.<br>- Hỗ trợ nhóm tham gia đồng thời từ **4 đến 6 người** (sử dụng kiến trúc Full-Mesh WebRTC kết hợp Socket.IO Room Signaling).<br>- Hiển thị trạng thái thành viên đang nói (Speaking indicator), danh sách người tham gia trong phòng.<br>- Hỗ trợ tính năng Chia sẻ màn hình (Screen Sharing) cơ bản trên nền tảng Web Application. | - Hội nghị truyền hình quy mô lớn (SFU/MCU như Zoom/Google Meet hàng chục đến hàng trăm người cùng bật video stream đồng thời) do vượt quá năng lực băng thông máy chủ sinh viên.<br>- Phát sóng trực tiếp một chiều tới hàng ngàn người xem (Live Streaming / Broadcast). |

---

### 2.5. Phân hệ Chia sẻ Khoảnh khắc & Tương tác Nhóm Đặc thù

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Khoảnh khắc (Moments)** | - Chụp hoặc tải ảnh chia sẻ khoảnh khắc realtime trong ngày (tương tự tinh thần BeReal / Story).<br>- **Cơ chế giới hạn Circle:** Người đăng chủ động chọn chính xác các Circle được phép nhìn thấy khoảnh khắc.<br>- Tương tác phản hồi và bình luận trên khoảnh khắc được chia sẻ. | - Bộ lọc khuôn mặt thực tế ảo AR Filters / 3D Lens bằng học sâu (Deep Learning). |
| **Album & Topic ảnh** | - Tạo album ảnh theo từng chủ đề sinh hoạt trong Circle.<br>- Xem ảnh dạng lưới (Grid View) và trình chiếu toàn màn hình (Lightbox). | - Nhận diện khuôn mặt tự động gắn thẻ người dùng trong ảnh (AI Face Tagging). |
| **Chia sẻ vị trí (Location)** | - Chia sẻ tọa độ vị trí hiện tại hoặc ghim vị trí điểm hẹn cho các thành viên Circle.<br>- Hiển thị vị trí trên bản đồ tích hợp (Leaflet / OpenStreetMap / Mapbox). | - Điều hướng dẫn đường thời gian thực từng ngã rẽ (Turn-by-turn Navigation) như ứng dụng bản đồ chuyên dụng. |
| **Kế hoạch & Lịch sự kiện (Plan & Calendar)** | - Tạo kế hoạch hoạt động nhóm: Tên hoạt động, địa điểm, thời gian bắt đầu/kết thúc, ghi chú.<br>- Lập lịch hoạt động và sự kiện trong tương lai của Circle.<br>- Thành viên xác nhận tham gia (Going / Not Going).<br>- Thông báo nhắc lịch tự động trước giờ hẹn. | - Đồng bộ hai chiều tự động với tài khoản Google Calendar ngoài qua Google API OAuth. |
| **Bình chọn (Vote / Poll)** | - Tạo câu hỏi bình chọn trong Circle với nhiều phương án lựa chọn.<br>- Thành viên bỏ phiếu và xem biểu đồ kết quả thời gian thực. | - Hệ thống bỏ phiếu ẩn danh bảo mật blockchain. |
| **Điều muốn nói (Anonymous Sharing)** | - Cho phép thành viên chia sẻ tâm sự, góp ý dưới danh nghĩa **ẩn danh** trong không gian Circle.<br>- Thành viên khác có thể bày tỏ cảm xúc và phản hồi an toàn. | - Công cụ truy vết giải mã danh tính người đăng ẩn danh. |

---

### 2.6. Phân hệ Thông báo (Notification System)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **In-App Notification** | - Trung tâm thông báo trên Web và Mobile.<br>- Nhận thông báo tức thì qua Socket.IO khi có: Lời mời kết bạn, Lời mời vào Circle, Nhắc lịch sự kiện, Được nhắc tên (mention). | - Gửi tin nhắn tự động qua SMS Brandname hoặc Zalo ZNS (do chi phí phát sinh dịch vụ viễn thông). |
| **Push Notification** | - Tích hợp Expo Push Notification Service trên thiết bị di động. | - Hệ thống phân tích chiến dịch Marketing Push Notification theo phễu người dùng. |

---

### 2.7. Phân hệ Quản trị Nền tảng (Integrated Admin Dashboard)

| Hạng mục | Trong phạm vi thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Quản trị người dùng & Circle** | - Tích hợp trực tiếp trên Web App tại route `/admin`, bảo vệ bằng Role Guard `ADMIN`.<br>- Tra cứu, xem danh sách người dùng, trạng thái kích hoạt, khóa (Ban) tài khoản vi phạm.<br>- Tra cứu danh sách Circle, khóa Circle có nội dung tiêu cực. | - Tách riêng thành một dự án phần mềm độc lập khác (đã được thống nhất tích hợp vào chung `apps/web` theo kiến trúc Modular). |
| **Kiểm duyệt & Xử lý báo cáo** | - Tiếp nhận báo cáo vi phạm (Reports) từ người dùng đối với nội dung bài viết, tin nhắn hoặc Circle.<br>- Quản trị viên phê duyệt hoặc bác bỏ báo cáo, xóa nội dung vi phạm.<br>- Nhật ký kiểm tra hệ thống (Audit Trail) ghi nhận các thao tác của Admin. | - Hệ thống tự động kiểm duyệt bằng AI đa phương tiện thời gian thực (Realtime Video/Audio AI Censorship). |

---

### 2.8. Nền tảng Ứng dụng & Triển khai Hạ tầng (Platforms & Infrastructure)

| Phân hệ | Công nghệ cam kết thực hiện (IN-SCOPE) | Nằm ngoài phạm vi (OUT-OF-SCOPE) |
|---|---|---|
| **Backend API** | NestJS (Modular Monolith) + Prisma ORM + PostgreSQL + Redis (Caching & Socket Adapter). | Kiến trúc Microservices phân tán (được chủ động loại bỏ để tránh phức tạp hóa hạ tầng không cần thiết). |
| **Web Application** | Next.js (App Router) + TypeScript + Tailwind CSS (Bao gồm cả người dùng thông thường và phân hệ Admin). | Hỗ trợ các trình duyệt cổ không còn được bảo trì (Internet Explorer 11). |
| **Mobile Application** | React Native + Expo (Hỗ trợ hệ điều hành Android và iOS). | Ứng dụng Desktop Native (Electron / macOS native), ứng dụng trên đồng hồ thông minh (WearOS / WatchOS). |
| **Môi trường & Triển khai** | - Môi trường Dev: Docker Compose (Postgres 16, Redis 7).<br>- Triển khai Production: VPS Linux, Reverse Proxy Traefik, Chứng chỉ SSL tự động Let's Encrypt.<br>- Tự động hóa: GitHub Actions CI kiểm tra lint/format/test và build Docker Image. | Cụm máy chủ Kubernetes đa vùng (Multi-region K8s cluster) hoặc dịch vụ Serverless chịu tải quy mô toàn cầu. |

---

## 3. TỔNG KẾT CAM KẾT PHẠM VI

* **100% các tính năng trong Phiếu nhiệm vụ đề tài** (Auth, Bạn bè, Quản lý Circle, Chat, Gọi thoại/video WebRTC, Quản lý ảnh/Album, Ghim tin nhắn, Chia sẻ vị trí, Lập kế hoạch, Lịch sự kiện, Bình chọn, "Điều muốn nói", Thông báo, Admin Dashboard) **đều nằm trọn vẹn trong phần IN-SCOPE**.
* Mọi tính năng thuộc **OUT-OF-SCOPE** đều là những mở rộng công nghệ quá mức cần thiết, đòi hỏi chi phí bản quyền viễn thông hoặc hạ tầng máy chủ thương mại đắt đỏ.
* Tài liệu này là căn cứ chính thức để nhóm và GVHD đối chiếu nghiệm thu sản phẩm tại các buổi thẩm định tiến độ và bảo vệ tốt nghiệp cuối kỳ.
