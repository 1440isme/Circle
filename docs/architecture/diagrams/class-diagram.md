# CIRCLE — SƠ ĐỒ LỚP MIỀN NGHIỆP VỤ (DOMAIN CLASS DIAGRAM)

> **Tài liệu thuộc phân hệ:** Architecture & Detailed Design của hệ thống CIRCLE.  
> **Tệp mã nguồn PlantUML:** [`classdiagram.puml`](classdiagram.puml)

---

## 1. Tổng quan Sơ đồ Lớp Miền nghiệp vụ (Domain Class Model)

Sơ đồ lớp của CIRCLE mô tả cấu trúc tĩnh của hệ thống, phân rã các thực thể nghiệp vụ thành các gói độc lập theo triết lý **Modular Monolith**, thể hiện rõ các thuộc tính, phương thức và các quan hệ thực thể (kế thừa, kết tập, liên kết).

Tệp nguồn PlantUML: [`classdiagram.puml`](classdiagram.puml)

---

## 2. Các gói miền nghiệp vụ (Domain Packages)

### 2.1. Account & Social Connections
- **`User`**: Thực thể tài khoản trung tâm (`email`, `password`, `isActivated`), quản lý cập nhật hồ sơ và gửi yêu cầu kết bạn.
- **`UserProfile`** (`<<Value Object>>`): Lưu trữ thông tin cá nhân (`displayName`, `avatarUrl`, `coverUrl`, `bio`, `dateOfBirth`).
- **`Friendship`**: Quản lý mối quan hệ bạn bè 1-1 (`status`: PENDING, ACCEPTED, BLOCKED).
- **`Notification`**: Thông báo sự kiện cho người dùng (`title`, `content`, `isRead`).

### 2.2. Circle Core Domain
- **`Circle`**: Thực thể vòng tròn kết nối (`name`, `avatarUrl`, `coverUrl`, `description`, `inviteCode`), hỗ trợ sinh mã mời, cập nhật metadata và giải tán nhóm.
- **`CircleMember`**: Thành viên trong nhóm kèm vai trò (`role`: OWNER, ADMIN, MEMBER, `nickname`, `joinedAt`), kiểm tra phân quyền truy cập trong Circle.

### 2.3. Messaging & Moments
- **`Message`** (Lớp trừu tượng): Đại diện cho thông điệp trao đổi trong kênh (`sentAt`, `reply()`).
  - **`TextMessage`**: Tin nhắn văn bản (`content`).
  - **`FileMessage`**: Tin nhắn tệp tin đính kèm (`fileAttachment`).
  - **`VoiceMessage`**: Tin nhắn giọng nói ghi âm (`audioFile`, `duration`).
- **`Reaction`**: Thả biểu cảm cảm xúc trên tin nhắn (`emoji`).
- **`Moment`**: Khoảnh khắc chụp trực tiếp theo thời gian thực (`capturedAt`, `caption`, `captureRealTime()`).
- **`Photo`**: Ảnh chụp khoảnh khắc (`fileUrl`).

### 2.4. Interactive Utilities (Tiện ích sinh hoạt nhóm)
- **`Album`**: Bộ sưu tập hình ảnh lưu giữ kỷ niệm theo chủ đề của Circle.
- **`Poll` & `PollOption` & `Vote`**: Hệ thống bình chọn và kiểm phiếu thời gian thực trong nhóm.
- **`CalendarEvent`**: Lập lịch hoạt động và sự kiện tập thể kèm cơ chế nhắc hẹn.
- **`PlanSheet`**: Bảng kế hoạch cộng tác trực tuyến của Circle.
- **`LocationShare`**: Chia sẻ tọa độ vị trí thời gian thực giữa các thành viên.
- **`AnonymousPost`**: Không gian gửi tâm tư ẩn danh ("Điều muốn nói"), loại bỏ hoàn toàn siêu dữ liệu danh tính.

### 2.5. Administration & Security
- **`Report`**: Tiếp nhận và quản lý các phản ánh vi phạm nội dung / tài khoản.
- **`AuditLog`**: Lưu vết nhật ký kiểm toán hoạt động hệ thống.
- **`AdminAction`**: Hành động xử lý vi phạm của Quản trị viên (cảnh cáo, khóa tài khoản, gỡ nội dung).

---

## 3. Cách xem và kết xuất sơ đồ (Rendering Instructions)

Bạn có thể kết xuất trực quan sơ đồ lớp từ tệp [`classdiagram.puml`](classdiagram.puml) bằng các cách sau:
1. **VS Code Extension:** Cài đặt extension *PlantUML* (Jebbs) và nhấn `Alt + D` để xem preview.
2. **PlantUML Online Server:** Dán nội dung của [`classdiagram.puml`](classdiagram.puml) vào [plantuml.com/plantuml](https://www.plantuml.com/plantuml).
3. **PlantText:** Mở trên [planttext.com](https://www.planttext.com).
