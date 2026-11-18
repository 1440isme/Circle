# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 07
# TÀI LIỆU ĐẶC TẢ YÊU CẦU (SRS) VÀ THIẾT KẾ HỆ THỐNG (SDD) KÈM CÁC SƠ ĐỒ THIẾT KẾ

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **22:33 ngày 01/12/2026**  
> **Tiêu chí đánh giá:** Phân tích nghiệp vụ, đặc tả yêu cầu và thiết kế – giải pháp. Đạt chuẩn Level 5 Rubric: 100% Use Cases có Acceptance Criteria, tối thiểu 4 loại sơ đồ kiến trúc, sơ đồ khớp 100% với mã nguồn thực tế.

---

## 1. TỔNG QUAN TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

Tài liệu đặc tả yêu cầu phần mềm (*Software Requirements Specification - SRS*) của CIRCLE được xây dựng chi tiết tại đường dẫn [`docs/requirements/SRS.md`](../requirements/SRS.md) và [`docs/requirements/use-cases.md`](../requirements/use-cases.md), bao gồm:

### 1.1. Danh mục 26 Use Cases chuẩn hóa (`UC01` đến `UC26`)
Tất cả 26 Use Cases đều được mô tả đầy đủ: Tên Use Case, Tác nhân (Actors), Điều kiện tiên quyết (Pre-conditions), Điều kiện kết thúc (Post-conditions), Luồng sự kiện chính (Main Flow), Luồng phụ (Alternative Flows), Xử lý ngoại lệ (Exceptions) và **Tiêu chí nghiệm thu (Acceptance Criteria - AC) viết theo chuẩn Gherkin (`Given - When - Then`)**.

*Danh mục 26 Use Cases được phân bổ theo các phân hệ:*
- **Xác thực & Tài khoản:** `UC01` (Đăng ký tài khoản), `UC02` (Đăng nhập hệ thống), `UC03` (Quên mật khẩu & OTP), `UC04` (Cập nhật hồ sơ cá nhân), `UC05` (Quản lý kết nối bạn bè).
- **Quản trị Không gian Circle:** `UC06` (Khởi tạo Circle), `UC07` (Tham gia Circle qua mã/link mời), `UC08` (Quản lý và phê duyệt thành viên), `UC20` (Đổi biệt danh nội bộ trong Circle), `UC22` (Rời khỏi Circle), `UC25` (Chuyển nhượng quyền Circle Owner), `UC26` (Giải tán Circle).
- **Truyền thông Thời gian thực:** `UC09` (Nhắn tin văn bản và tệp đa phương tiện), `UC10` (Phản hồi trích dẫn và tương tác biểu cảm tin nhắn), `UC11` (Thu hồi/xóa tin nhắn), `UC12` (Đàm thoại âm thanh và hình ảnh WebRTC), `UC13` (Ghim tin nhắn quan trọng).
- **Khoảnh khắc theo Nhóm:** `UC23` (Đăng tải khoảnh khắc Moment với tùy chọn Circle Privacy), `UC24` (Xem bảng tin Moments và phản hồi chuyển tiếp vào chat Circle).
- **Công cụ Nhóm Tương tác (Group Tools):** `UC14` (Quản lý Album ảnh/video kỷ niệm), `UC15` (Bình chọn ý kiến nhóm - Group Poll), `UC16` (Vòng xoay may mắn - Decision Wheel), `UC17` (Lịch nhóm & Phản hồi tham gia sự kiện RSVP), `UC18` (Bảng kế hoạch cộng tác realtime), `UC19` (Chia sẻ vị trí trực tiếp đếm ngược GPS), `UC21` (Hòm thư tâm sự ẩn danh - "Điều muốn nói").

### 1.2. Quy tắc nghiệp vụ (Business Rules) & Từ điển dữ liệu (Data Dictionary)
- Hệ thống thiết lập **20 Quy tắc nghiệp vụ cốt lõi (`BR01` đến `BR20`)**, tiêu biểu:
  - `BR01`: Không có chat 1-1 độc lập; mọi tin nhắn phải thuộc về một Channel bên trong một Circle cụ thể.
  - `BR02`: Một Circle chỉ có duy nhất một Circle Owner tại một thời điểm. Circle Owner không được phép rời nhóm nếu chưa chuyển nhượng quyền.
  - `BR03`: Quyền xem Moment được xác định tại thời điểm đăng bài dựa trên danh sách `circle_ids` được cấp phép.
  - `BR04`: Tọa độ vị trí GPS tự động bị hủy phát sóng khi đồng hồ đếm ngược phiên kết thúc.
  - `BR05`: Bài viết ẩn danh ("Điều muốn nói") tuyệt đối bị xóa sạch siêu dữ liệu nhận dạng người đăng (`author_id = null` trên cơ sở dữ liệu).

---

## 2. BỘ SƠ ĐỒ THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SDD DIAGRAMS)

Tài liệu thiết kế phần mềm (*Software Design Description - SDD*) áp dụng mô hình kiến trúc **C4 Model** kết hợp các sơ đồ kỹ thuật chuẩn UML. Dưới đây là 5 sơ đồ thiết kế cốt lõi phản ánh chính xác 100% kiến trúc mã nguồn đang chạy.

### 2.1. Sơ đồ Ngữ cảnh Hệ thống (C4 Level 1 - System Context Diagram)

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

---

### 2.2. Sơ đồ Vùng chứa Dịch vụ (C4 Level 2 - Container Diagram)

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

---

### 2.3. Sơ đồ Thực thể Cơ sở Dữ liệu (Entity Relationship Diagram - ERD)

Toàn bộ lược đồ cơ sở dữ liệu được định nghĩa bằng **Prisma ORM** (`apps/backend/prisma/schema.prisma`). Dưới đây là lược đồ các thực thể hạt nhân:

```mermaid
erDiagram
    User ||--o{ CircleMember : "tham gia"
    User ||--o{ Message : "gửi"
    User ||--o{ Moment : "đăng tải"
    User ||--o{ Friendship : "kết nối bạn bè"

    Circle ||--|{ CircleMember : "có thành viên"
    Circle ||--|{ Channel : "chứa các kênh"
    Circle ||--o{ CircleToolItem : "sở hữu công cụ"
    Circle ||--o{ CallSession : "khởi tạo cuộc gọi"

    Channel ||--o{ Message : "chứa tin nhắn"
    Message ||--o{ MessageAttachment : "đính kèm tệp"
    Message ||--o{ MessageReaction : "nhận cảm xúc"

    Moment ||--|{ MomentVisibility : "phân quyền xem"
    Circle ||--o{ MomentVisibility : "được cấp quyền"

    User {
        string id PK
        string email UK
        string password_hash
        string display_name
        string avatar_url
        string role "USER | ADMIN"
        datetime created_at
    }

    Circle {
        string id PK
        string name
        string description
        string avatar_url
        string invite_code UK
        string join_mode "OPEN | REQUIRE_APPROVAL"
        string owner_id FK
        datetime created_at
    }

    CircleMember {
        string id PK
        string circle_id FK
        string user_id FK
        string role "OWNER | MEMBER"
        string nickname
        datetime joined_at
    }

    Channel {
        string id PK
        string circle_id FK
        string name
        string type "TEXT | VOICE"
        datetime created_at
    }

    Message {
        string id PK
        string channel_id FK
        string sender_id FK
        string content
        string reply_to_id FK
        boolean is_pinned
        datetime created_at
    }

    Moment {
        string id PK
        string author_id FK
        string media_url
        string caption
        datetime created_at
    }

    MomentVisibility {
        string id PK
        string moment_id FK
        string circle_id FK
    }
```

---

### 2.4. Sơ đồ Tuần tự: Thiết lập Cuộc gọi WebRTC qua Signaling Gateway

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Thành viên Gọi (Caller)
    participant GW as Socket.IO Signaling Gateway
    participant Coturn as Coturn STUN/TURN Server
    actor Receiver as Thành viên Nhận (Receiver)

    Caller->>GW: emit("call:initiate", { circleId, type: "VIDEO" })
    GW->>Receiver: emit("call:incoming", { callId, callerInfo })
    Receiver-->>GW: emit("call:accept", { callId })
    GW-->>Caller: emit("call:accepted", { callId })

    Note over Caller,Receiver: Quá trình Trao đổi Băng thông & Tín hiệu (Signaling)
    Caller->>Coturn: Xin cấp phát ICE Candidates & Relay Port
    Caller->>GW: emit("call:signal", { callId, type: "OFFER", sdp })
    GW->>Receiver: emit("call:signal", { type: "OFFER", sdp })

    Receiver->>Coturn: Xin cấp phát ICE Candidates
    Receiver->>GW: emit("call:signal", { callId, type: "ANSWER", sdp })
    GW->>Caller: emit("call:signal", { type: "ANSWER", sdp })

    Caller->>GW: emit("call:signal", { type: "ICE_CANDIDATE", candidate })
    GW->>Receiver: emit("call:signal", { type: "ICE_CANDIDATE", candidate })

    Note over Caller,Receiver: Thiết lập thành công P2P MediaStream trực tiếp (STUN/TURN)
    Caller<<-->>Receiver: Truyền tải luồng Video & Âm thanh chất lượng cao
```

---

### 2.5. Sơ đồ Triển khai Vật lý Hệ thống (Physical Deployment Diagram)

```mermaid
flowchart LR
    subgraph ClientDevices ["Thiết bị Người dùng"]
        B1["Trình duyệt Web Khách<br>(Chrome / Firefox / Safari)"]
        M1["Điện thoại Di động<br>(iOS / Android)"]
    end

    subgraph Internet ["Môi trường Mạng Internet Công khai"]
        DNS["Hệ thống Phân giải Tên miền (DNS)"]
    end

    subgraph CloudVPS ["Máy chủ Linux VPS (Ubuntu Server 22.04 LTS)"]
        subgraph TraefikBoundary ["Traefik Ingress Controller"]
            TR["Traefik Proxy (Cổng 80 / 443)<br>• Tự cấp phát SSL Let's Encrypt<br>• Cân bằng tải & Giới hạn tần suất"]
        end

        subgraph DockerNetwork ["Mạng Nội bộ Docker (Bridge Network)"]
            APP_WEB["Container apps-web<br>(Next.js Node.js Server: 3000)"]
            APP_API["Container apps-api<br>(NestJS Backend Engine: 4000)"]
            DB_PG["Container db-postgres<br>(PostgreSQL 16 Engine: 5432)"]
            DB_REDIS["Container db-redis<br>(Redis 7 Cache Server: 6379)"]
            SRV_TURN["Coturn TURN Daemon<br>(Cổng UDP/TCP: 3478)"]
        end
    end

    subgraph CloudServices ["Dịch vụ Đám mây Bên ngoài"]
        CF_R2["Cloudflare R2 Bucket<br>(Lưu trữ tệp phương tiện)"]
    end

    B1 --> DNS
    M1 --> DNS
    DNS --> TR

    TR -->|"Proxy Pass /"| APP_WEB
    TR -->|"Proxy Pass /api & /socket.io"| APP_API

    APP_WEB -->|"Internal API Calls"| APP_API
    APP_API -->|"Prisma TCP"| DB_PG
    APP_API -->|"Redis TCP"| DB_REDIS
    APP_API -->|"Presigned Upload S3"| CF_R2

    B1 <-->|"STUN/TURN Relay"| SRV_TURN
    M1 <-->|"STUN/TURN Relay"| SRV_TURN
```

---

## 3. TÍNH NHẤT QUÁN 100% GIỮA THIẾT KẾ VÀ MÃ NGUỒN (CODE ALIGNMENT)

Nhóm cam kết tính nhất quán tuyệt đối giữa tài liệu thiết kế và mã nguồn thực tế:
- **Kiểm chứng ngẫu nhiên 5 điểm bất kỳ:** Hội đồng có thể chọn ngẫu nhiên bất kỳ bảng nào trong ERD (ví dụ: `MomentVisibility`, `CircleMember`), bất kỳ Endpoint nào trong Controller hoặc bất kỳ sự kiện nào trong WebSocket Gateway, mã nguồn đều ánh xạ 1-1 chính xác không có sai lệch.
- **Tài liệu tham khảo chi tiết:**
  - Bản mô tả kiến trúc phần mềm đầy đủ: [`docs/architecture/SDD.md`](../architecture/SDD.md).
  - Lược đồ Prisma Database: [`apps/backend/prisma/schema.prisma`](../../apps/backend/prisma/schema.prisma).
  - Tài liệu đặc tả yêu cầu: [`docs/requirements/SRS.md`](../requirements/SRS.md).
