# TÀI LIỆU THIẾT KẾ PHẦN MỀM — SOFTWARE DESIGN DESCRIPTION (SDD)
## DỰ ÁN: NỀN TẢNG MẠNG XÃ HỘI KẾT NỐI VÀ TƯƠNG TÁC NHÓM — CIRCLE

> **Dự án:** CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Khoa Công nghệ Thông tin — Trường ĐH Sư phạm Kỹ thuật TP.HCM  
> **Sinh viên thực hiện:**  
> - Trương Công Bình — MSSV: `23110184` (Technical Lead & System Architect)  
> - Ninh Thị Mỹ Hạnh — MSSV: `23110210` (Business Analyst & QA Lead)  
> **Giảng viên hướng dẫn:** ThS. Nguyễn Trần Thi Văn  
> **Phiên bản tài liệu:** `v2.0-RELEASE` — Cập nhật ngày 18/11/2026

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1. Mục tiêu và Phong cách Kiến trúc (Architectural Style)
CIRCLE được thiết kế dựa trên phong cách **Modular Monolith phân tầng kết hợp Truyền thông Thời gian thực phân tán (Event-Driven Realtime Modular Monolith)**:
- **Tính đóng gói mô-đun (High Cohesion & Low Coupling):** Toàn bộ mã nguồn máy chủ NestJS được chia thành 12 module nghiệp vụ độc lập, mỗi module quản lý riêng biệt Controllers, Services, DTOs và tương tác qua các hợp đồng dữ liệu rõ ràng.
- **Tách biệt tầng dữ liệu:** Cơ sở dữ liệu quan hệ **PostgreSQL 16** lưu trữ dữ liệu bền vững, kết hợp bộ nhớ đệm **Redis 7** chịu tải phiên làm việc, Refresh Token và đóng vai trò Pub/Sub message broker cho WebSocket cluster.
- **Xử lý tệp tin phi tập trung:** Toàn bộ dữ liệu phương tiện (ảnh, video, ghi âm) được tải trực tiếp lên bộ nhớ đám mây tương thích S3 (**Cloudflare R2**) thông qua cơ chế Presigned URL, giải phóng hoàn toàn băng thông của máy chủ backend.
- **Hệ thống truyền thông thời gian thực tự chủ:** Sử dụng **Socket.IO** cho tin nhắn/sự kiện và máy chủ **Coturn (STUN/TURN)** độc lập trên Linux VPS cho đàm thoại WebRTC Audio/Video.

---

## 2. MÔ HÌNH HÓA KIẾN TRÚC THEO C4 MODEL

### 2.1. C4 Level 1: Ngữ cảnh Hệ thống (System Context Diagram)

```mermaid
flowchart TD
    subgraph Users ["Đối tượng Người dùng"]
        U1["Thành viên Circle<br>(Sinh viên, Nhóm bạn)"]
        U2["Trưởng nhóm Circle<br>(Circle Owner)"]
        ADM["Quản trị viên Hệ thống<br>(Platform Admin)"]
    end

    subgraph CIRCLE_SYSTEM ["HỆ THỐNG MẠNG XÃ HỘI CIRCLE"]
        CS["Nền tảng CIRCLE<br>(Web App, Mobile App, Backend API)"]
    end

    subgraph ExternalServices ["Dịch vụ Bên ngoài"]
        CF["Cloudflare R2<br>(Lưu trữ tệp đa phương tiện S3)"]
        MAP["Mapbox API<br>(Bản đồ số & Tọa độ địa lý)"]
        EXPO["Expo / FCM Service<br>(Dịch vụ Thông báo đẩy Push)"]
        MAIL["Resend / SMTP Mailer<br>(Gửi mã OTP xác thực)"]
    end

    U1 -->|"Trò chuyện, gọi video, đăng moment, chia sẻ công cụ"| CS
    U2 -->|"Quản trị thành viên, cấu hình nhóm, phân quyền"| CS
    ADM -->|"Theo dõi số liệu thống kê, kiểm duyệt báo cáo vi phạm"| CS

    CS -->|"Tải lên / tải xuống tệp tin qua Presigned URL"| CF
    CS -->|"Tra cứu địa điểm & hiển thị bản đồ số"| MAP
    CS -->|"Gửi thông báo đẩy đến thiết bị di động"| EXPO
    CS -->|"Gửi email chứa mã OTP kích hoạt và đổi mật khẩu"| MAIL
```

### 2.2. C4 Level 2: Vùng chứa Dịch vụ (Container Diagram)

```mermaid
flowchart TB
    subgraph ClientLayer ["Tầng Ứng dụng Khách (Clients)"]
        WEB["Next.js Web Client<br>(TypeScript, Tailwind CSS, /admin)"]
        MOB["Expo Mobile App<br>(React Native, iOS & Android)"]
    end

    subgraph GatewayLayer ["Tầng Cổng & Định tuyến Ngược"]
        TRAEFIK["Traefik Reverse Proxy<br>(SSL Termination, Rate Limit, HTTPS)"]
    end

    subgraph BackendLayer ["Tầng Máy chủ Ứng dụng (NestJS Modular Monolith)"]
        API["RESTful API Endpoints<br>(Auth, Circles, Users, Moments, Tools)"]
        GATEWAY["Socket.IO Realtime Gateway<br>(Chat Events, Signaling, Presence)"]
        COTURN["Coturn STUN/TURN Server<br>(NAT Traversal cho WebRTC Audio/Video)"]
    end

    subgraph DataLayer ["Tầng Dữ liệu & Lưu trữ (Data Stores)"]
        PG[("PostgreSQL 16 DB<br>(Prisma ORM, Quan hệ thực thể)")]
        REDIS[("Redis 7 In-Memory Cache<br>(Sessions, Refresh Tokens, Pub/Sub)")]
        R2[("Cloudflare R2 Storage<br>(Media Images, Videos, Voice Notes)")]
    end

    WEB -->|"HTTPS / WSS"| TRAEFIK
    MOB -->|"HTTPS / WSS"| TRAEFIK

    TRAEFIK -->|"Định tuyến HTTP /api"| API
    TRAEFIK -->|"Định tuyến WebSocket /socket.io"| GATEWAY

    WEB <-->|"P2P MediaStream (STUN/TURN)"| COTURN
    MOB <-->|"P2P MediaStream (STUN/TURN)"| COTURN

    API -->|"Truy vấn dữ liệu cấu trúc"| PG
    API -->|"Lưu phiên & Cache dữ liệu"| REDIS
    API -->|"Tạo Presigned URL"| R2
    GATEWAY -->|"Đồng bộ sự kiện & Presence"| REDIS
```

### 2.3. C4 Level 3: Phân rã Thành phần Máy chủ (Component Diagram: `apps/api`)

Tầng Backend được chia thành 12 phân hệ nghiệp vụ chính:
- `AuthModule`: Quản lý JWT Access Token, Refresh Token Rotation, bảo mật mật khẩu `bcrypt`, Role Guards.
- `UsersModule`: Quản lý hồ sơ cá nhân, quan hệ bạn bè, tra cứu người dùng.
- `CirclesModule`: Quản lý vòng đời Circle, cấu hình chế độ gia nhập, mã mời, phân quyền Owner/Member.
- `ChatModule`: Quản lý kênh thảo luận, Socket.IO Chat Gateway, lưu trữ tin nhắn, reactions, ghim tin nhắn.
- `MomentsModule`: Quản lý đăng ảnh khoảnh khắc, kiểm duyệt bảo mật Circle-based privacy, phản hồi chuyển thành tin nhắn.
- `CallsModule`: Quản lý phiên gọi thoại/video WebRTC, Socket.IO Signaling Gateway, điều phối ICE Candidates.
- `CircleToolsModule`: Bộ 7 công cụ tương tác nhóm (Planning Sheet, Live Location Mapbox, Group Poll, Shared Album, Group Calendar RSVP, Decision Wheel, Hòm thư ẩn danh).
- `NotificationsModule`: Trung tâm thông báo In-app và tích hợp dịch vụ Push Notification đa nền tảng.
- `ModerationModule`: Hệ thống tiếp nhận báo cáo vi phạm, hàng đợi kiểm duyệt và nhật ký kiểm tra Audit Log.
- `AdminModule`: Tổng hợp số liệu thống kê Dashboard, quản trị toàn diện người dùng và nhóm.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU & LƯỢC ĐỒ THỰC THỂ (ERD)

Cơ sở dữ liệu được định nghĩa bằng **Prisma ORM** tại [`apps/backend/prisma/schema.prisma`](../../apps/backend/prisma/schema.prisma). Các chỉ mục đa chiều (Composite Indexes) được đánh dấu tỉ mỉ để tối ưu hóa hiệu năng truy vấn:

- `User`: Quản lý thông tin định danh và tài khoản người dùng (`id`, `email`, `password_hash`, `display_name`, `avatar_url`, `role`, `status`).
- `Circle`: Quản lý thực thể không gian nhóm (`id`, `name`, `description`, `avatar_url`, `invite_code`, `join_mode`, `owner_id`).
- `CircleMember`: Bảng liên kết trung gian giữa User và Circle (`circle_id`, `user_id`, `role`, `nickname`, `joined_at`). Index: `@@unique([circle_id, user_id])`.
- `Channel`: Quản lý các kênh thảo luận nội bộ gắn liền với Circle (`id`, `circle_id`, `name`, `type`).
- `Message`: Lưu trữ tin nhắn thời gian thực (`id`, `channel_id`, `sender_id`, `content`, `reply_to_id`, `is_pinned`, `created_at`). Index: `@@index([channel_id, created_at])`.
- `Moment`: Lưu trữ bài đăng khoảnh khắc (`id`, `author_id`, `media_url`, `caption`, `created_at`).
- `MomentVisibility`: Quản lý quyền riêng tư phân phối bài viết theo từng Circle (`moment_id`, `circle_id`). Index: `@@unique([moment_id, circle_id])`.
- `CallSession`: Quản lý phiên đàm thoại WebRTC (`id`, `circle_id`, `initiator_id`, `type`, `status`, `started_at`, `ended_at`).

---

## 4. THIẾT KẾ LUỒNG NGHIỆP VỤ & SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)

### 4.1. Luồng Xác thực: JWT Rotation với Redis Blacklist

```mermaid
sequenceDiagram
    autonumber
    actor Client as Ứng dụng Web / Mobile
    participant Auth as Auth Controller & Service
    participant Redis as Redis In-Memory Cache
    participant DB as PostgreSQL Database

    Client->>Auth: POST /auth/refresh { refreshToken }
    Auth->>Redis: GET token:whitelist:{userId}:{tokenId}
    alt Token không tồn tại hoặc đã bị thu hồi
        Redis-->>Auth: null
        Auth-->>Client: 401 Unauthorized (Invalid Refresh Token)
    else Token hợp lệ
        Redis-->>Auth: active
        Auth->>Redis: DEL token:whitelist:{userId}:{tokenId} (Thu hồi token cũ)
        Auth->>Auth: Sinh cặp Access Token mới (15m) & Refresh Token mới (7d)
        Auth->>Redis: SET token:whitelist:{userId}:{newTokenId} (Lưu whitelist mới)
        Auth-->>Client: 200 OK { accessToken, refreshToken }
    end
```

### 4.2. Luồng Chia sẻ Khoảnh khắc: Circle-based Privacy Engine

```mermaid
sequenceDiagram
    autonumber
    actor Author as Người Đăng Moment
    participant API as Moments API Service
    participant R2 as Cloudflare R2 Storage
    participant DB as PostgreSQL Database
    actor Member as Thành viên Circle Được Chỉ Định

    Author->>API: POST /moments/presigned-url { fileType }
    API-->>Author: { uploadUrl, mediaUrl }
    Author->>R2: PUT image binary via uploadUrl
    Author->>API: POST /moments { mediaUrl, caption, targetCircleIds: [C1, C2] }
    API->>DB: INSERT INTO Moment (...)
    API->>DB: INSERT INTO MomentVisibility (moment_id, circle_id) VALUES (...)
    API-->>Author: 201 Created (Moment Published)

    Note over Member,API: Truy vấn Bảng tin Khoảnh khắc
    Member->>API: GET /moments/feed
    API->>DB: SELECT * FROM Moment WHERE id IN (SELECT moment_id FROM MomentVisibility WHERE circle_id IN (UserCircles))
    DB-->>API: Danh sách Moments hợp lệ
    API-->>Member: 200 OK [Filtered Moments]
```

---

## 5. THIẾT KẾ TRIỂN KHAI VÀ BẢO MẬT HẠ TẦNG

- **Môi trường Container hóa:** Sử dụng **Docker Multi-stage Builds** để thu gọn kích thước hình ảnh ứng dụng xuống dưới 150MB.
- **Bảo mật mạng và Định tuyến:** Traefik tự động chuyển hướng toàn bộ lưu lượng HTTP sang HTTPS, tự động gia hạn chứng chỉ Let's Encrypt SSL, áp dụng Rate Limiting tối đa 100 requests/phút đối với các endpoint nhạy cảm (auth, otp).
- **Phân tách biến môi trường:** Tuyệt đối không commit file `.env`. Mọi cấu hình nhạy cảm được nạp an toàn từ nền tảng VPS và GitHub Repository Secrets.
