# CIRCLE — Graduation Thesis & Academic Reports (TLCN)

Academic thesis manuscript, defense presentation slides, and evaluation rubrics for the graduation thesis of **Trương Công Bình (23110184)** and **Ninh Thị Mỹ Hạnh (23110210)**, supervised by **ThS. Nguyễn Trần Thi Văn**.

---

## 1. Thesis Manuscript (Bản thảo Báo cáo Tiểu luận Chuyên ngành)

- [**Bản thảo Báo cáo TLCN Toàn diện (Full Report Manuscript)**](./Bao-cao-TLCN.md)

### Tóm tắt các chương chính trong bản thảo:

#### 1. PHẦN MỞ ĐẦU (Introduction)
- **Tính cấp thiết của đề tài:** Bối cảnh chuyển đổi số, sự quá tải thông tin trên mạng xã hội đại chúng, vấn đề phân mảnh công cụ (tool fragmentation) của sinh viên khi sinh hoạt nhóm.
- **Mục tiêu của đề tài:** Xây dựng mạng xã hội kết nối và tương tác nhóm đa nền tảng (Web & Mobile), phục vụ Người dùng cuối (End-User) và Quản trị viên (Admin).
- **Cách tiếp cận & Phương pháp nghiên cứu:** Đối tượng nghiên cứu, phạm vi nghiên cứu, nghiên cứu kiến trúc Modular Monolith + Client-Server, NestJS, Prisma, Next.js, Expo, Socket.IO.
- **Ý nghĩa khoa học và thực tiễn:** Tiếp cận quy trình kỹ nghệ phần mềm hiện đại chuẩn doanh nghiệp, tạo ra không gian số "Tất cả trong một" cho hoạt động nhóm.
- **Kết quả dự kiến đạt được:** Bộ sản phẩm phần mềm (Backend API, Web Client, Mobile App, Admin Dashboard), công nghệ và năng lực kỹ nghệ phần mềm.

#### 2. CƠ SỞ HỆ THỐNG (System Foundation & Architecture)
- **Tổng quan hệ thống:** Khái niệm mạng xã hội tương tác nhóm, các thành phần chính của CIRCLE.
- **Các vấn đề nghiệp vụ & Kỹ thuật then chốt:** Xử lý thời gian thực & đồng bộ dữ liệu, hiệu năng & mở rộng, bảo mật & riêng tư (ẩn danh "Điều muốn nói", chia sẻ vị trí), độ tin cậy và luồng nghiệp vụ tương tác khép kín.
- **Kiến trúc phần mềm & Mô hình thiết kế:** Modular Monolith kết hợp Client-Server phân tán đa nền tảng, tính đóng gói cao, liên kết lỏng và khả năng tiến hóa thành Microservices.
- **Cơ chế bảo mật và xác thực:** Dual-token JWT (Access/Refresh), mã hóa bcrypt, phân quyền đa cấp (User/Admin, Owner/Member, Socket Room Guards), HTTPS/WSS, Location Privacy, Rate Limiting.
- **Hệ sinh thái công nghệ:** NestJS, TypeScript, PostgreSQL, Prisma ORM, Socket.IO, Next.js, React Native & Expo, Docker, GitHub Actions.

#### 3. PHÂN TÍCH THIẾT KẾ (Analysis & Design)
- **Mô hình hóa yêu cầu & Tác nhân:** Bảng 2.1 phân loại tác nhân (Guest, User, Circle Member, Circle Owner, Email Service, WebSocket/WebRTC, Cloud Storage).
- **Sơ đồ Use Case toàn hệ thống:** Draw.io XML lưu tại [`docs/requirements/diagrams/usecase.xml`](../requirements/diagrams/usecase.xml).
- **Đặc tả 26 Use Case chi tiết (UC01 — UC26):** Đặc tả bảng chuẩn kỹ nghệ phần mềm (xem chi tiết tại [`docs/requirements/use-cases.md`](../requirements/use-cases.md)).
- **Sơ đồ lớp miền nghiệp vụ (Domain Class Diagram):** PlantUML lưu tại [`docs/architecture/diagrams/classdiagram.puml`](../architecture/diagrams/classdiagram.puml) (xem giải thích tại [`docs/architecture/diagrams/class-diagram.md`](../architecture/diagrams/class-diagram.md)).

---

## 2. Weekly Reports & Evidence Links

- [Báo cáo tiến độ hàng tuần (W01 — W19)](../evidence/weekly-reports/README.md)
- [Hồ sơ kiểm toán Rubric Level 5](../evidence/rubric-audits/README.md)
- [Nhật ký sử dụng AI tự động](../ai-usage/log.md)
