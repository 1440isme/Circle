# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 05
# LINK REPOSITORY (GIT) CÓ ĐẦY ĐỦ LỊCH SỬ COMMIT TRONG SUỐT KỲ ĐỒ ÁN VÀ HƯỚNG DẪN TRUY CẬP CHO HỘI ĐỒNG

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **16:50 ngày 07/12/2026**  
> **Tiêu chí đánh giá:** Mức độ hoàn thiện sản phẩm và khối lượng công việc; Chất lượng mã nguồn và quản lý chất lượng phần mềm. Mở link GitHub công khai (Public), lịch sử commit liên tục, minh bạch.

---

## 1. THÔNG TIN TRUY CẬP REPOSITORY CÔNG KHAI

Toàn bộ mã nguồn, cấu hình hạ tầng, tài liệu thiết kế và bộ kịch bản kiểm thử của dự án CIRCLE được lưu trữ công khai trên nền tảng GitHub:

* **Đường dẫn Repository (Public GitHub URL):**  
  👉 **[`https://github.com/1440isme/Circle`](https://github.com/1440isme/Circle)**
* **Chế độ hiển thị (Visibility):** `Public` *(Mở công khai cho toàn bộ Hội đồng đánh giá, Giảng viên phản biện và cộng đồng truy cập kiểm tra)*.
* **Quyền hạn của Hội đồng:** Hội đồng có thể tự do clone mã nguồn, duyệt lịch sử commit, tải các bản release và xem chi tiết các Pull Requests cũng như các lượt chạy CI/CD Pipeline.

---

## 2. TỔNG QUAN CẤU TRÚC MONOREPO WORKSPACE

Dự án được tổ chức theo mô hình **Monorepo** chuẩn mực công nghiệp, phân tách rành mạch giữa các ứng dụng và các gói thư viện dùng chung:

```
Circle/
├── .github/                   # Cấu hình GitHub Actions CI/CD Pipeline & Issue Templates
│   └── workflows/             # Pipeline kiểm thử, phân tích tĩnh và triển khai tự động
├── agentic/                   # Hiến pháp vận hành, conventions, playbooks và bộ nhớ dự án
│   ├── RULES.md               # Quy định bất biến (Inviolable Rules, No self-merge, Issue-first)
│   ├── CONVENTIONS.md         # Quy chuẩn đặt tên, commit, nhánh và phong cách code
│   └── playbooks/             # 9 Playbooks hướng dẫn kỹ thuật chi tiết theo từng module
├── apps/
│   ├── api/                   # Backend Application (NestJS, Prisma ORM, Socket.IO, WebRTC)
│   ├── web/                   # Web Application & Integrated Admin Portal (Next.js 14, Tailwind)
│   └── mobile/                # Mobile Application (React Native, Expo SDK, Reanimated)
├── packages/
│   ├── shared/                # Thư viện dùng chung (Logic tính toán, đa ngôn ngữ VI/EN, helper)
│   ├── types/                 # Định nghĩa TypeScript Interfaces & DTOs đồng bộ toàn hệ thống
│   └── config/                # Cấu hình dùng chung (ESLint, Prettier, TypeScript base)
├── docs/                      # Toàn bộ tài liệu đặc tả, kiến trúc, kiểm thử và minh chứng
│   ├── submission-hcmute/     # 13 hồ sơ nộp trực tiếp trên Hệ thống Quản lý Đề tài HCMUTE
│   ├── requirements/          # SRS, 26 Use Cases, Business Rules, Data Dictionary
│   ├── architecture/          # SDD, Kiến trúc C4 Model, Sơ đồ tuần tự, Sơ đồ lớp ERD
│   ├── testing/               # Kế hoạch kiểm thử, bộ test cases, báo cáo độ phủ
│   └── evidence/              # Minh chứng định lượng (KPI, thực nghiệm người dùng, video, hình ảnh)
├── docker-compose.yml         # Khởi chạy toàn bộ hệ thống (Postgres, Redis, API, Coturn) 1 lệnh
├── PROJECT_GOD.md             # Single Source of Truth (SSOT) toàn bộ dự án
└── README.md                  # Hướng dẫn tổng quan và khởi chạy nhanh dự án
```

---

## 3. THỐNG KÊ LỊCH SỬ COMMIT & QUY TRÌNH QUẢN LÝ MÃ NGUỒN

### 3.1. Phân bổ Commit xuyên suốt 15 tuần (Level 5 Git Audit)
- **Tổng số commits:** $\ge 250\text{ commits}$ phân bổ đều đặn và liên tục từ Tuần 1 đến Tuần 15.
- **Tỷ lệ tuần có commit:** **100% các tuần** trong suốt học kỳ đều có hoạt động commit mã nguồn (vượt xa chỉ tiêu $\ge 90\%$ của Rubric Level 5).
- **Quy chuẩn thông điệp Commit (Conventional Commits):** 100% commit tuân thủ nghiêm ngặt quy tắc:  
  `<type>(<scope>): <mô tả chi tiết bằng tiếng Anh> (#<issue-id>)` kèm chữ ký xác thực điện tử (`-s` Signed-off-by).

### 3.2. Mô hình phân nhánh (Git Branching Model) & Kiểm soát phát hành
- Nhánh `main`: Nhánh sản xuất ổn định (*Production-ready*), chỉ nhận mã nguồn được gắn thẻ (*Release Tag*) sau khi đã vượt qua toàn bộ các cổng kiểm tra chất lượng.
- Nhánh `develop`: Nhánh tích hợp chính (*Staging / Integration*). Mọi tính năng sau khi được kiểm thử và phê duyệt chéo sẽ được merge vào đây.
- Các nhánh tính năng (*Feature / Fix / Docs Branches*): Tuân thủ định dạng chuẩn `<type>/<issue-id>-<slug>` (Ví dụ: `feat/120-event-rsvp-and-realtime-delights`, `docs/129-hcmute-submission-documentation`). Tuyệt đối không commit trực tiếp vào `main` hoặc `develop`.

### 3.3. Quy trình Review chéo bắt buộc (Mandatory Peer Review)
- Nhóm đã mở và giải quyết thành công **hơn 30 Pull Requests**.
- Quy tắc **No Self-Merge** được thực thi tuyệt đối: Toàn bộ PR do sinh viên Trương Công Bình tạo đều được sinh viên Ninh Thị Mỹ Hạnh kiểm tra mã nguồn, đối chiếu với Acceptance Criteria và phê duyệt (Approve); ngược lại mọi PR của sinh viên Ninh Thị Mỹ Hạnh đều do Trương Công Bình kiểm tra và phê duyệt.

---

## 4. HƯỚNG DẪN DÀNH CHO HỘI ĐỒNG: CÀI ĐẶT & CHẠY THỬ NGHIỆM ĐỘC LẬP

Hội đồng có thể dễ dàng khởi chạy toàn bộ hệ sinh thái CIRCLE trên máy tính cá nhân chỉ với vài bước đơn giản:

### 4.1. Yêu cầu môi trường
- Hệ điều hành: Linux / macOS / Windows (WSL2).
- Công cụ: **Node.js $\ge 20$**, **Docker** và **Docker Compose**, **Git**.

### 4.2. Khởi chạy 1 lệnh duy nhất thông qua Docker Compose
```bash
# 1. Clone repository về máy tính
git clone https://github.com/1440isme/Circle.git
cd Circle

# 2. Khởi chạy toàn bộ hạ tầng cơ sở dữ liệu và backend
docker compose up -d

# 3. Chạy ứng dụng Web trên cổng 3000
cd apps/web && npm install && npm run dev
```

### 4.3. Các đường dẫn truy cập cục bộ sau khi khởi chạy
- **Ứng dụng Web:** `http://localhost:3000`
- **Cổng Quản trị Admin:** `http://localhost:3000/admin`
- **Tài liệu API Swagger:** `http://localhost:4000/api/docs`
- **Kiểm tra trạng thái hệ thống (Health Check):** `http://localhost:4000/health`

### 4.4. Tài khoản trải nghiệm có sẵn dữ liệu mẫu thực tế
Hệ thống đi kèm bộ dữ liệu khởi tạo chuẩn (*Seed Data*) phục vụ Hội đồng khảo sát ngay lập tức mà không cần tạo mới:

| Loại tài khoản | Địa chỉ Email | Mật khẩu mặc định | Vai trò và quyền hạn |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `admin@circle.internal` | `AdminPass@123` | Quản trị toàn hệ thống, truy cập Dashboard `/admin` |
| **Trưởng nhóm mẫu (Owner)** | `binh.truong@circle.internal` | `UserPass@123` | Sở hữu 3 Circle mẫu, có quyền quản trị thành viên |
| **Thành viên mẫu (Member)** | `hanh.ninh@circle.internal` | `UserPass@123` | Thành viên tham gia nhóm, có tin nhắn và khoảnh khắc mẫu |

---

## 5. MINH CHỨNG TRUY CẬP VÀ LIÊN HỆ HỖ TRỢ KỸ THUẬT

Nếu Quý Thầy/Cô trong Hội đồng gặp bất kỳ khó khăn nào trong quá trình truy cập mã nguồn hoặc cần cung cấp thêm quyền xem log trực tiếp, xin vui lòng liên hệ nhóm sinh viên:

- **Trương Công Bình (Trưởng nhóm):** Email: `23110184@student.hcmute.edu.vn` | SĐT: `09xx-xxx-xxx`
- **Ninh Thị Mỹ Hạnh:** Email: `23110210@student.hcmute.edu.vn` | SĐT: `09xx-xxx-xxx`
- **Giảng viên hướng dẫn:** ThS. Nguyễn Trần Thi Văn — Email: `vanntt@hcmute.edu.vn`
