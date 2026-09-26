# CIRCLE — MÔ HÌNH KIẾN TRÚC C4 (C4 ARCHITECTURE MODEL)

> **Tài liệu thuộc phân hệ:** Architecture & Detailed Design của hệ thống CIRCLE.  
> **Căn cứ kế hoạch:** Kế hoạch thực hiện TLCN (Tuần 2 – 3 / Issue #12) & [`PROJECT_GOD.md`](../../../PROJECT_GOD.md).

---

## 1. Tổng quan Mô hình C4 (C4 Model Overview)

Hệ thống **CIRCLE** được mô hình hóa kiến trúc theo chuẩn **C4 Model** (Context, Containers, Components, Code) nhằm tạo ra các góc nhìn phân cấp rõ ràng từ bức tranh tổng thể đến cấu trúc thành phần mã nguồn:

1. **Level 1 — System Context (Ngữ cảnh hệ thống):** Xác định ranh giới hệ thống CIRCLE, người dùng tương tác và các dịch vụ bên thứ ba (External Services).
2. **Level 2 — Container Diagram (Mô hình khối chứa):** Mô tả các ứng dụng Client, máy chủ API Backend, Cơ sở dữ liệu và Hạ tầng lưu trữ/Cache.
3. **Level 3 — Component Diagram (Mô hình thành phần):** Bóc tách kiến trúc bên trong Modular Monolith Backend (NestJS), các Module nghiệp vụ và luồng dữ liệu nội bộ.
4. **Level 4 — Code Model:** Chi tiết hóa cấu trúc các lớp và thực thể miền nghiệp vụ (đã được đặc tả tại [`class-diagram.md`](./class-diagram.md) và [`classdiagram.puml`](./classdiagram.puml)).

---

## 2. C4 Level 1 — System Context Diagram (Ngữ cảnh Hệ thống)

Sơ đồ ngữ cảnh thể hiện hệ thống CIRCLE đóng vai trò hạt nhân kết nối người dùng, quản trị viên và các dịch vụ đám mây ngoại vi.

```mermaid
flowchart TB
    subgraph Users ["Người dùng & Quản trị viên"]
        EndUser["👤 Thành viên nhóm / Trưởng nhóm<br/>[Người dùng cuối truy cập mạng xã hội CIRCLE]"]
        SysAdmin["👨‍💻 Quản trị viên hệ thống (Admin)<br/>[Quản lý người dùng, Circle, báo cáo vi phạm]"]
    end

    subgraph CircleSystem ["Ranh giới Hệ thống CIRCLE"]
        CirclePlatform["🌐 Nền tảng Mạng xã hội CIRCLE<br/>[Cung cấp tính năng kết nối nhóm, chat, gọi thoại, khoảnh khắc, tiện ích cộng tác]"]
    end

    subgraph ExternalSystems ["Hệ thống Ngoại vi (Third-Party Services)"]
        R2Storage["☁️ Cloudflare R2<br/>[Lưu trữ tệp tin media, ảnh đại diện, ảnh moment S3-compatible]"]
        StunTurn["🔄 WebRTC STUN/TURN Server<br/>[Hỗ trợ vượt tường lửa NAT Traversal cho P2P Call]"]
        MailService["📧 SMTP Mail Server<br/>[Gửi mã OTP, kích hoạt tài khoản và thông báo quan trọng]"]
    end

    EndUser -->|"Sử dụng Web/Mobile để chat, gọi điện, chia sẻ khoảnh khắc, lập kế hoạch"| CirclePlatform
    SysAdmin -->|"Quản lý hệ thống, kiểm duyệt nội dung qua Admin Dashboard"| CirclePlatform

    CirclePlatform -->|"Upload/Download tệp tin media qua Presigned URL"| R2Storage
    CirclePlatform -->|"Cung cấp ICE candidates & TURN credentials"| StunTurn
    CirclePlatform -->|"Gửi email kích hoạt & thông báo"| MailService
```

### Các tác nhân & Thành phần ngoại vi:
- **Thành viên nhóm / Trưởng nhóm (End User):** Tương tác nhóm tập trung theo từng Circle, nhắn tin realtime, gọi thoại/video, chia sẻ khoảnh khắc và phối hợp qua bảng kế hoạch ma trận.
- **Quản trị viên (Admin):** Sử dụng giao diện Web Admin (`/admin`) để theo dõi hệ thống, quản lý Circle, xử lý báo cáo vi phạm.
- **Cloudflare R2:** Dịch vụ lưu trữ đối tượng chuẩn S3, loại bỏ hoàn toàn chi phí băng thông tải ra (zero egress fee).
- **WebRTC STUN/TURN:** Thiết lập kết nối P2P âm thanh/hình ảnh khi các thiết bị nằm sau mạng NAT hoặc Firewall đối xứng.
- **SMTP Mail Server:** Dịch vụ gửi email thông báo xác thực tài khoản.

---

## 3. C4 Level 2 — Container Diagram (Mô hình Khối chứa)

Sơ đồ khối chứa thể hiện các ứng dụng phần mềm độc lập và kho dữ liệu tạo nên giải pháp CIRCLE:

```mermaid
flowchart TB
    subgraph Clients ["Ứng dụng Phía Khách (Client Apps)"]
        WebApp["💻 Web Application & Admin Dashboard<br/>[Next.js App Router, React, Tailwind CSS, TypeScript]<br/>Port: 3000"]
        MobileApp["📱 Mobile Application<br/>[React Native, Expo Router, TypeScript, react-native-webrtc]<br/>iOS & Android"]
    end

    subgraph GatewayProxy ["Hạ tầng Điều phối & Cổng vào"]
        TraefikProxy["🛡️ Traefik Reverse Proxy<br/>[SSL Termination, Routing, Rate Limiting]<br/>Port: 80 / 443"]
    end

    subgraph BackendApp ["Ứng dụng Phía Máy chủ (Server Monorepo)"]
        BackendAPI["⚙️ Backend Modular Monolith<br/>[NestJS, TypeScript, Prisma ORM, Socket.IO]<br/>Port: 4000"]
    end

    subgraph DataStorage ["Hạ tầng Dữ liệu & Lưu trữ (Data Tier)"]
        PostgresDB[("🗄️ PostgreSQL 16 Database<br/>[Dữ liệu quan hệ, quan hệ Circle, Message, Sheet, User]<br/>Port: 5432")]
        RedisCache[("⚡ Redis 7 Cache & Pub/Sub<br/>[Token Blacklist, Session Cache, Socket Adapter]<br/>Port: 6379")]
        R2ObjectStore[("📦 Cloudflare R2 Storage<br/>[Media, Photos, Voice Notes, Documents]")]
    end

    WebApp -->|"HTTPS / REST API & WSS"| TraefikProxy
    MobileApp -->|"HTTPS / REST API & WSS"| TraefikProxy

    TraefikProxy -->|"Chuyển tiếp HTTP Requests"| BackendAPI
    TraefikProxy -->|"Chuyển tiếp WebSocket Handshake"| BackendAPI

    BackendAPI -->|"Truy vấn & Ghi dữ liệu quan hệ (Prisma ORM)"| PostgresDB
    BackendAPI -->|"Đọc/Ghi Cache, Token Rotation & Pub/Sub"| RedisCache
    BackendAPI -->|"Cấp Presigned Upload URL"| R2ObjectStore
    WebApp -->|"Upload/Download trực tiếp qua Presigned URL"| R2ObjectStore
    MobileApp -->|"Upload/Download trực tiếp qua Presigned URL"| R2ObjectStore
```

### Chi tiết các Container:
1. **Web Application & Admin (`apps/web`):**
   - Công nghệ: Next.js 14+ (App Router), React, Tailwind CSS.
   - Vai trò: Giao diện web đa phản hồi (Responsive Shell: Left Rail, Channel Drawer, Main Stage) và cổng Quản trị viên tại `/admin`.
2. **Mobile Application (`apps/mobile`):**
   - Công nghệ: React Native, Expo Router, TypeScript.
   - Vai trò: Ứng dụng di động iOS/Android, hỗ trợ camera chụp Moment, SecureStore lưu token và WebRTC gọi thoại/video native.
3. **Backend API & Gateway (`apps/backend`):**
   - Công nghệ: NestJS Modular Monolith, Socket.IO Gateway, Prisma ORM.
   - Vai trò: Cung cấp REST API bảo mật, xác thực Dual-Token JWT, kiểm soát phân quyền RBAC và điều phối sự kiện thời gian thực.
4. **PostgreSQL 16:**
   - Lưu trữ dữ liệu nghiệp vụ quan hệ với tính toàn vẹn cao, composite indexes và cascade deletes.
5. **Redis 7:**
   - Quản lý phiên truy cập, blacklist thu hồi Refresh Token và đóng vai trò Socket.IO Redis Adapter khi mở rộng scale.
6. **Cloudflare R2:**
   - Lưu trữ phi cấu trúc (ảnh đại diện, ảnh moments, file đính kèm, tin nhắn thoại).

---

## 4. C4 Level 3 — Component Diagram (Mô hình Thành phần Backend)

Bóc tách chi tiết cấu trúc bên trong ứng dụng **Backend Modular Monolith (NestJS)**:

```mermaid
flowchart TB
    subgraph Entrypoints ["Điểm tiếp nhận yêu cầu"]
        RestControllers["REST Controllers<br/>[Auth, Users, Circles, Chat, Moments, Sheets, Utilities]"]
        SocketGateway["Realtime Socket.IO Gateway<br/>[Chat Gateway, Presence Gateway, WebRTC Signaling Gateway]"]
    end

    subgraph SecurityLayer ["Tầng Bảo vệ & Middleware"]
        JwtAuthGuard["JwtAuthGuard & RefreshStrategy<br/>[Xác thực Bearer Token & Device Fingerprint]"]
        RolesGuard["RolesGuard & CircleMemberGuard<br/>[Kiểm tra RBAC & Quyền trong Circle]"]
        ValidationPipe["Zod & Class-Validator Pipe<br/>[Lọc và chuẩn hóa Payload đầu vào]"]
    end

    subgraph DomainServices ["Tầng Dịch vụ Nghiệp vụ (Business Services)"]
        AuthService["AuthService<br/>[Đăng ký, Hash bcrypt cost 12, Sinh cặp JWT]"]
        UsersService["UsersService<br/>[Hồ sơ người dùng, Quan hệ bạn bè]"]
        CirclesService["CirclesService<br/>[Quản lý Circle, Thành viên, Quyền hạn]"]
        ChatService["ChatService<br/>[Tin nhắn, Phản hồi, Thả Reaction, Kênh chat]"]
        MomentsService["MomentsService<br/>[Khoảnh khắc thời gian thực, Album ảnh]"]
        SheetsService["SheetsService<br/>[Xử lý bảng tính ma trận, Khóa ô cộng tác]"]
        UtilitiesService["UtilitiesService<br/>[Bình chọn, Vòng quay, Điều muốn nói, Lịch hẹn, Vị trí]"]
        MediaService["MediaService<br/>[Sinh Presigned URL tải lên R2]"]
    end

    subgraph SharedAdapters ["Tầng Hạ tầng & Tích hợp (Infra Adapters)"]
        PrismaService["PrismaService<br/>[Quản trị kết nối cơ sở dữ liệu PostgreSQL & Transaction]"]
        RedisService["RedisService<br/>[Cache dữ liệu, Quản lý Token Rotation, Pub/Sub events]"]
    end

    RestControllers --> ValidationPipe --> JwtAuthGuard --> RolesGuard
    SocketGateway --> JwtAuthGuard

    RolesGuard --> AuthService
    RolesGuard --> UsersService
    RolesGuard --> CirclesService
    RolesGuard --> ChatService
    RolesGuard --> MomentsService
    RolesGuard --> SheetsService
    RolesGuard --> UtilitiesService
    RolesGuard --> MediaService

    AuthService --> PrismaService
    AuthService --> RedisService
    UsersService --> PrismaService
    CirclesService --> PrismaService
    ChatService --> PrismaService
    ChatService --> SocketGateway
    MomentsService --> PrismaService
    MomentsService --> SocketGateway
    SheetsService --> PrismaService
    SheetsService --> SocketGateway
    UtilitiesService --> PrismaService
    UtilitiesService --> SocketGateway
    MediaService --> PrismaService
```

### Nguyên tắc tương tác thành phần:
- **Loose Coupling, High Cohesion:** Mỗi Module nghiệp vụ (`auth`, `circles`, `chat`, `moments`, `sheets`) chịu trách nhiệm trọn vẹn trong phạm vi miền nghiệp vụ của mình.
- **Thin Controllers, Rich Services:** Controller chỉ tiếp nhận request, ủy thác việc kiểm tra và thực thi nghiệp vụ hoàn toàn cho Service.
- **Realtime Bridging:** Khi các Service (như `ChatService`, `SheetsService`) ghi nhận thay đổi dữ liệu thành công xuống cơ sở dữ liệu qua `PrismaService`, chúng sẽ phát tín hiệu tới `SocketGateway` để đồng bộ tức thì cho các client đang mở kết nối.
- **Zero Secrets Leakage:** Thông tin nhạy cảm (JWT secret, DB URL, R2 credentials) được nạp qua `ConfigService` từ biến môi trường và không bao giờ xuất hiện lộ liễu trong mã nguồn.
