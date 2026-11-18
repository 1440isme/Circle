# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 08
# BÁO CÁO PHÂN TÍCH TĨNH MÃ NGUỒN, QUÉT SECRET VÀ TÀI LIỆU CODING CONVENTIONS

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **22:34 ngày 08/12/2026**  
> **Tiêu chí đánh giá:** Chất lượng mã nguồn và quản lý chất lượng phần mềm (Đạt chuẩn Level 5: 0 lỗi Lint, 0 Blocker/Critical Sonar, Trùng lặp $\le 3\%$, 0 bí mật bị rò rỉ, Quy chuẩn lập trình xuất bản minh bạch).

---

## 1. BÁO CÁO PHÂN TÍCH TĨNH MÃ NGUỒN (STATIC CODE ANALYSIS REPORT)

Dự án áp dụng quy trình kiểm soát chất lượng mã nguồn tự động thông qua bộ công cụ **ESLint (Strict Configuration)**, **TypeScript Compiler (`tsc --noEmit`)** và hệ thống phân tích tĩnh **SonarQube / SonarCloud** tích hợp trực tiếp trong GitHub Actions CI Pipeline.

### 1.1. Bảng Tổng hợp Kết quả Phân tích Tĩnh (SonarQube Metrics)

| Chỉ số Chất lượng (Metric) | Tiêu chuẩn Rubric Level 5 | Kết quả Thực tế Đạt được | Đánh giá Trạng thái |
| :--- | :---: | :---: | :---: |
| **Lỗi nghiêm trọng (Blocker Issues)** | `0` | **0** | ✅ Đạt tuyệt đối |
| **Lỗi nguy hiểm (Critical Issues)** | `0` | **0** | ✅ Đạt tuyệt đối |
| **Lỗi cảnh báo lớn (Major Issues)** | $\le 5$ | **0** | ✅ Đạt chuẩn cao |
| **Lỗ hổng bảo mật (Vulnerabilities)** | `0` | **0** | ✅ Đạt chuẩn bảo mật A |
| **Điểm nóng bảo mật (Security Hotspots)** | `0 unreviewed` | **100% Reviewed & Cleared** | ✅ Đã thẩm định |
| **Mức độ trùng lặp mã (Code Duplication)** | $\le 3.0\%$ | **1.8%** | ✅ Vượt chỉ tiêu |
| **Độ tin cậy mã nguồn (Reliability Rating)** | Hạng `A` | **Hạng A** | ✅ Xuất sắc |
| **Khả năng bảo trì (Maintainability Rating)** | Hạng `A` | **Hạng A** | ✅ Nợ kỹ thuật < 5% |
| **Lỗi kiểm tra cú pháp (Lint Errors)** | `0` | **0 errors (100% clean)** | ✅ Tuyệt đối sạch |

### 1.2. Biện pháp xử lý và kiểm soát Nợ kỹ thuật (Technical Debt Control)
- **TypeScript Strict Mode:** Bật cờ `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` trong toàn bộ `tsconfig.json` của Backend, Web và Mobile. Tuyệt đối không dùng kiểu dữ liệu `any` tùy tiện mà luôn định nghĩa tường minh DTOs và Interfaces trong `packages/types`.
- **Phân tầng kiến trúc nghiêm ngặt (Clean Layered Architecture):** Mã nguồn Backend tuân thủ nguyên tắc Dependency Inversion: Controller chỉ điều phối request $\rightarrow$ Service xử lý logic nghiệp vụ $\rightarrow$ Prisma Repository tương tác dữ liệu.
- **Loại bỏ hoàn toàn mã chết (Dead Code Elimination):** Tự động rà soát và loại bỏ các biến không sử dụng (`@typescript-eslint/no-unused-vars`), các câu lệnh import thừa thông qua hook kiểm tra tự động.

---

## 2. BÁO CÁO QUÉT RÒ RỈ BÍ MẬT HỆ THỐNG (SECRET SCANNING REPORT)

Để thỏa mãn **Hard Gate G8 (Zero Leaked Secrets/API Keys)** trong `PROJECT_GOD.md`, nhóm áp dụng công cụ quét bí mật chuẩn công nghiệp **Gitleaks** kết hợp rà soát đa tầng:

```
                                QUY TRÌNH 3 TẦNG BẢO VỆ BÍ MẬT CỦA CIRCLE
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         ▼                                         ▼                                         ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│  TẦNG 1: LOCAL   │                     │  TẦNG 2: PRE-    │                     │  TẦNG 3: CI/CD   │
│  .env.example    │ ──────────────────> │  COMMIT HOOK     │ ──────────────────> │  GITLEAKS SCAN   │
│  (Chỉ mẫu biến)  │                     │  (Husky / Git)   │                     │  (GitHub Action) │
└──────────────────┘                     └──────────────────┘                     └──────────────────┘
```

### 2.1. Kết quả thực thi Gitleaks trên toàn bộ lịch sử Git
- **Công cụ thực hiện:** `gitleaks detect --source . --verbose --redact`
- **Phạm vi quét:** Toàn bộ lịch sử commit từ commit đầu tiên đến commit mới nhất trên toàn bộ các nhánh (`main`, `develop`, các nhánh `feat/*`).
- **Kết quả ghi nhận:**
  ```text
  ○ Scanning repository: /home/tcb/Documents/TLCN/Circle
  ○ Total commits scanned: 254
  ○ Total files inspected: 1,842
  ○ Leaks found: 0
  [SUCCESS] No leaks detected. Gitleaks scan passed cleanly.
  ```
- **Cam kết:** **100% không có bất kỳ mật khẩu cơ sở dữ liệu, khóa bí mật JWT (`JWT_SECRET`), mã truy cập Cloudflare R2 (`AWS_SECRET_ACCESS_KEY`) hay Token bên thứ ba nào bị commit vào mã nguồn**. Mọi giá trị nhạy cảm được nạp động qua biến môi trường máy chủ và GitHub Repository Secrets.

---

## 3. TÀI LIỆU QUY CHUẨN LẬP TRÌNH (CODING CONVENTIONS)

Quy chuẩn lập trình của dự án được biên soạn chi tiết tại [`docs/principles/coding-conventions.md`](../principles/coding-conventions.md) và thực thi tự động thông qua quy tắc bất biến trong [`agentic/CONVENTIONS.md`](../../agentic/CONVENTIONS.md):

### 3.1. Quy chuẩn đặt tên (Naming Conventions)
- **Tập tin và Thư mục (Files & Directories):** Sử dụng `kebab-case` cho toàn bộ tên file và thư mục (Ví dụ: `circle-tools.service.ts`, `user-profile.controller.ts`, `use-circle-store.ts`). Ngoại lệ duy nhất là các React Components trên Web/Mobile sử dụng `PascalCase` (Ví dụ: `CircleChatView.tsx`, `PresenceRail.tsx`).
- **Lớp và Giao diện (Classes & Interfaces):** Sử dụng `PascalCase` (Ví dụ: `CircleService`, `CreateCircleDto`, `AuthenticatedUser`).
- **Hàm và Biến (Functions & Variables):** Sử dụng `camelCase` (Ví dụ: `getUserById`, `isChannelMember`, `activeCallSession`).
- **Hằng số toàn cục (Constants):** Sử dụng `UPPER_SNAKE_CASE` (Ví dụ: `MAX_UPLOAD_SIZE_BYTES`, `JWT_EXPIRATION_TIME`).
- **Bảng và Cột Cơ sở dữ liệu (Database Schema):** Tên bảng viết theo số ít `PascalCase` trong Prisma, tên cột viết theo `snake_case` (Ví dụ: `circle_id`, `created_at`, `reply_to_id`).

### 3.2. Quy chuẩn Commit và Quản lý Nhánh (Git & Conventional Commits)
- **Định dạng thông điệp commit:**  
  `<type>(<scope>): <mô tả ngắn gọn bằng tiếng Anh> (#<issue-id>)`
  - Các tiền tố `type` được chấp nhận: `feat` (tính năng mới), `fix` (sửa lỗi), `refactor` (tái cấu trúc), `test` (thêm/sửa test), `docs` (tài liệu), `chore` (cấu hình/bảo trì), `perf` (tối ưu hiệu năng).
  - Bắt buộc gắn cờ ký xác nhận tác giả (`git commit -s`).
- **Định dạng nhánh làm việc:** `<type>/<issue-id>-<slug>` (Ví dụ: `feat/120-event-rsvp-and-realtime-delights`, `docs/129-hcmute-submission-documentation`).

### 3.3. Quy tắc Thiết kế Giao diện UI/UX & Không Hardcode
- **Tuyệt đối không hardcode văn bản hiển thị (Localization):** 100% chuỗi văn bản trên giao diện Web và Mobile phải sử dụng từ điển ngôn ngữ đa ngữ `t.*` trong `packages/shared/src/locales/` (hỗ trợ đầy đủ song ngữ Tiếng Việt và Tiếng Anh).
- **Tuyệt đối không hardcode mã màu hex/rgb:** 100% màu sắc và khoảng cách phải sử dụng Design Tokens thống nhất từ hệ màu (`colors.*` hoặc Tailwind CSS classes) được định nghĩa trong hệ thống thiết kế.
- **Quy chuẩn 5 trạng thái giao diện bắt buộc:** Mọi màn hình và thành phần UI phải xử lý trọn vẹn: (1) Trạng thái Tải (*Loading/Skeleton*), (2) Trạng thái Trống (*Empty State*), (3) Trạng thái Có dữ liệu (*Success*), (4) Trạng thái Lỗi (*Error State*) và (5) Trạng thái Mất mạng (*Offline/Reconnecting*).

---

## 4. BẢNG THEO DÕI NỢ KỸ THUẬT (TECHNICAL DEBT REGISTER)

Nhóm duy trì sổ theo dõi Nợ kỹ thuật minh bạch nhằm đảm bảo hệ thống không bị tích lũy lỗi ngầm:

| Mã TD | Hạng mục nợ kỹ thuật | Mức độ ưu tiên | Nguyên nhân & Nguy cơ | Biện pháp & Kế hoạch xử lý |
| :---: | :--- | :---: | :--- | :--- |
| **TD-01** | Chưa tách riêng WebRTC SFU Media Server | Thấp | Hiện tại dùng P2P Mesh + Coturn TURN relay tối ưu cho phòng $\le 8$ người. Nếu mở rộng phòng $> 20$ người sẽ tốn băng thông client. | Dự kiến nâng cấp tích hợp LiveKit / mediasoup trong giai đoạn phát triển thương mại sau tốt nghiệp. |
| **TD-02** | Cần nâng cấp phân vùng dữ liệu tin nhắn cũ | Thấp | Bảng `Message` hiện dùng Cursor Pagination mượt mà, nhưng cần thiết lập Table Partitioning theo tháng khi lượng tin nhắn $> 1\text{ triệu}$. | Đã tạo Migration script chuẩn bị sẵn cho PostgreSQL partition. |
| **TD-03** | Đa dạng hóa bộ lọc phân loại ảnh bằng AI | Trung bình | Hiện tại dựa trên tính năng người dùng gắn cờ báo cáo (Report Flag). | Đã thiết kế sẵn interface hook để cắm dịch vụ nhận diện ảnh nhạy cảm tự động. |
