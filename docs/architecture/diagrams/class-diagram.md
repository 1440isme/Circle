# CIRCLE — SƠ ĐỒ LỚP MIỀN NGHIỆP VỤ (DOMAIN CLASS DIAGRAM)

> **Tài liệu thuộc phân hệ:** Architecture & Detailed Design của hệ thống CIRCLE.  
> **Tệp mã nguồn PlantUML:** [`classdiagram.puml`](classdiagram.puml)

---

## 1. Tổng quan Sơ đồ Lớp Miền nghiệp vụ (Domain Class Model)

Sơ đồ lớp của CIRCLE mô tả cấu trúc tĩnh của hệ thống, phân rã các thực thể nghiệp vụ thành các gói độc lập theo triết lý **Modular Monolith**, thể hiện rõ các thuộc tính, phương thức và các quan hệ thực thể (kế thừa, kết tập, liên kết).

Tệp nguồn PlantUML: [`classdiagram.puml`](classdiagram.puml)

---

## 2. Các gói miền nghiệp vụ (Domain Packages)

Sơ đồ được tổ chức thành 5 gói nghiệp vụ chính khớp 100% với tệp mô hình `classdiagram.puml`:

### 2.1. Account & Social Connections (Tài khoản & Quan hệ xã hội)
- **`User`**: Thực thể tài khoản trung tâm (`email`, `password`, `isActivated`), cung cấp các hành vi cập nhật hồ sơ (`updateProfile()`) và gửi lời mời kết bạn (`sendFriendRequest()`).
- **`UserProfile`** (`<<Value Object>>`): Lưu trữ thông tin định danh cá nhân (`displayName`, `avatarUrl`, `coverUrl`, `bio`, `dateOfBirth`).
- **`Friendship`**: Quản lý mối quan hệ bạn bè 1-1 (`status`: FriendshipStatus), cung cấp các phương thức chấp nhận (`accept()`), từ chối (`reject()`) và hủy kết bạn (`unfriend()`).
- **`Notification`**: Quản lý thông báo sự kiện cho người dùng (`title`, `content`, `isRead`, `markAsRead()`).

### 2.2. Circle Core Domain (Lõi không gian nhóm)
- **`Circle`**: Thực thể không gian nhóm hạt nhân (`name`, `avatarUrl`, `coverUrl`, `description`, `inviteCode`), hỗ trợ sinh mã mời (`generateInviteCode()`), cập nhật thông tin (`updateMetadata()`) và giải tán nhóm (`dissolve()`).
- **`CircleMember`**: Quản lý thành viên trong nhóm kèm vai trò (`role`: MemberRole, `nickname`, `joinedAt`), kiểm tra quyền truy cập (`checkPermission()`) và hỗ trợ rời nhóm (`leaveCircle()`).

### 2.3. Messaging & Moments (Nhắn tin & Khoảnh khắc Realtime)
- **`Message`** (Lớp trừu tượng): Đại diện thông điệp trao đổi trong kênh (`sentAt`, `reply()`).
  - **`TextMessage`**: Tin nhắn văn bản thuần (`content`).
  - **`FileMessage`**: Tin nhắn đính kèm tệp tin tài liệu (`fileAttachment`).
  - **`VoiceMessage`**: Tin nhắn thoại ghi âm (`audioFile`, `duration`).
- **`Reaction`**: Thả biểu cảm cảm xúc trên tin nhắn (`emoji`: Emoji).
- **`Moment`**: Khoảnh khắc chụp trực tiếp từ camera theo thời gian thực (`capturedAt`, `caption`, `captureRealTime()`).
- **`Photo`**: Đối tượng hình ảnh khoảnh khắc (`fileUrl`).

### 2.4. Collaborative Planning Sheet (Bảng kế hoạch cộng tác Grid Matrix)
- **`PlanningSheet`**: Bảng kế hoạch cộng tác dạng bảng tính ma trận trong Circle (`title`, `createdAt`, `addColumn()`, `addRow()`, `deleteSheet()`).
- **`SheetColumn`**: Cột của bảng kế hoạch (`columnIndex`, `columnTitle`, `updateTitle()`).
- **`SheetRow`**: Dòng của bảng kế hoạch (`rowIndex`, `deleteRow()`).
- **`SheetCell`**: Ô dữ liệu tại giao điểm dòng/cột (`cellValue`, `updatedAt`, `updateValue()`, liên kết người sửa cuối `last_edited_by`).

### 2.5. Circle Utilities (Bộ tiện ích sinh hoạt nhóm)
- **`SharedAlbum`**: Album ảnh lưu giữ kỷ niệm chung theo chủ đề của Circle (`albumTitle`, `addPhoto()`).
- **`PinnedRecord`**: Lưu vết tin nhắn được ghim trong hội thoại (`pinnedAt`, `unpin()`).
- **`GroupPoll`**, **`PollOption`** & **`PollVote`**: Hệ thống tạo câu hỏi bình chọn, các lựa chọn (`optionText`) và quản lý lượt bỏ phiếu của thành viên (`votedAt`, `selected_option`).
- **`DecisionWheel`** & **`WheelOption`**: Vòng xoay may mắn đưa ra quyết định ngẫu nhiên trong nhóm (`title`, `optionLabel`, `spinRandomly()`).
- **`AnonymousPost`**: Không gian gửi tâm tư ẩn danh ("Điều muốn nói"), loại bỏ hoàn toàn siêu dữ liệu người gửi (`content`, `postedAt`).
- **`CalendarEvent`**: Quản lý lịch sự kiện hoạt động của nhóm kèm nhắc hẹn tự động (`eventTitle`, `startTime`, `reminderTime`).
- **`LiveLocationShare`** & **`GeoCoordinate`** (`<<Value Object>>`): Chia sẻ tọa độ địa lý thời gian thực giữa các thành viên (`shareDuration`, `latitude`, `longitude`, `stopSharing()`).
- **`CallSession`** & **`CallParticipant`**: Phiên cuộc gọi thoại/video WebRTC trực tiếp trong Circle (`callType`, `startedAt`, `joinedAt`, `leftAt`, `calculateDuration()`).

---

## 3. Cách xem và kết xuất sơ đồ (Rendering Instructions)

Bạn có thể kết xuất trực quan sơ đồ lớp từ tệp [`classdiagram.puml`](classdiagram.puml) bằng các cách sau:
1. **VS Code Extension:** Cài đặt extension *PlantUML* (Jebbs) và nhấn `Alt + D` để xem preview.
2. **PlantUML Online Server:** Dán nội dung của [`classdiagram.puml`](classdiagram.puml) vào [plantuml.com/plantuml](https://www.plantuml.com/plantuml).
3. **PlantText:** Mở trên [planttext.com](https://www.planttext.com).
