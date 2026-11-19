# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 09
# KẾ HOẠCH KIỂM THỬ, BỘ TEST CASES, MÃ NGUỒN TEST TỰ ĐỘNG, BÁO CÁO ĐỘ PHỦ VÀ SỔ THEO DÕI DEFECT

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210` (Trưởng nhóm Đảm bảo Chất lượng - QA Lead)  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **22:34 ngày 07/12/2026**  
> **Tiêu chí đánh giá:** Kiểm thử phần mềm. Đạt chuẩn Level 5: Tối thiểu 4 tầng kiểm thử, Độ phủ dòng lệnh module core $\ge 70\%$, Tỷ lệ tự động hóa $\ge 70\%$, 100% bài kiểm thử xanh trên CI, 0 lỗi Blocker/Critical tại thời điểm nghiệm thu.

---

## 1. KẾ HOẠCH KIỂM THỬ TOÀN DIỆN (TEST PLAN STRATEGY)

Để đảm bảo độ tin cậy của một mạng xã hội tương tác thời gian thực, dự án triển khai chiến lược **Kim tự tháp kiểm thử 4 tầng (4-Tier Testing Pyramid)** kết hợp kiểm thử tải và kiểm thử hồi quy tự động trong quy trình CI/CD:

```
                            CHIẾN LƯỢC KIM TỰ THÁP KIỂM THỬ 4 TẦNG
                                              ▲
                                             / \
                                            /   \
                                           / E2E \       TẦNG 4: PLAYWRIGHT E2E TESTS
                                          /───────\      (Kiểm thử luồng nghiệp vụ trên Web/Mobile)
                                         /   API   \     TẦNG 3: SUPERTEST API TESTS
                                        /───────────\    (Kiểm tra hợp đồng HTTP & Mã trạng thái)
                                       / INTEGRATION \   TẦNG 2: JEST + TEST DATABASE
                                      /───────────────\  (Kiểm tra tương tác Prisma ORM & Redis)
                                     /    UNIT TEST    \ TẦNG 1: JEST UNIT TESTS
                                    /───────────────────\(Kiểm thử hàm logic độc lập & DTOs)
```

1. **Tầng 1 — Unit Tests (Kiểm thử đơn vị):** Kiểm tra tính đúng đắn của các thuật toán xử lý dữ liệu, logic phân quyền, tính toán kết quả bình chọn (Poll), sinh kết quả vòng xoay (Decision Wheel) và bóc tách danh tính người dùng độc lập với cơ sở dữ liệu.
2. **Tầng 2 — Integration Tests (Kiểm thử tích hợp):** Kiểm tra sự tương tác giữa NestJS Services với cơ sở dữ liệu PostgreSQL thực tế (sử dụng container kiểm thử riêng biệt) và tầng bộ nhớ đệm Redis.
3. **Tầng 3 — API Contract Tests (Kiểm thử giao tiếp API):** Sử dụng Supertest gửi các yêu cầu HTTP thực tế đến các Controllers, kiểm tra mã trạng thái (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`) và tính toàn vẹn của dữ liệu JSON trả về.
4. **Tầng 4 — End-to-End Tests (Kiểm thử đầu-cuối E2E):** Sử dụng **Playwright** giả lập thao tác của người dùng thực tế trên trình duyệt: đăng ký tài khoản $\rightarrow$ tạo Circle $\rightarrow$ mời thành viên $\rightarrow$ nhắn tin thời gian thực $\rightarrow$ thiết lập cuộc gọi video.

---

## 2. BỘ TEST CASES MA TRẬN ĐỐI CHIẾU 26 USE CASES (TEST MATRIX)

Nhóm đã xây dựng bộ hơn **120 kịch bản kiểm thử (Test Cases)** bao quát đầy đủ các trường hợp thành công (Positive), trường hợp lỗi (Negative), giá trị biên (Boundary) và trường hợp an toàn thông tin (Security):

| Mã TC | Phân hệ / Use Case | Tên Kịch bản Kiểm thử | Loại Test | Dữ liệu đầu vào / Điều kiện thực thi | Kết quả Kỳ vọng (Expected Result) | Trạng thái Thực tế |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **TC-AUTH-01** | `UC01` (Đăng ký) | Đăng ký thành công với email hợp lệ | Positive | Email trường hợp lệ, mật khẩu mạnh ($\ge 8$ ký tự) | Tạo tài khoản trạng thái PENDING, gửi OTP qua mail | ✅ PASS |
| **TC-AUTH-02** | `UC01` (Đăng ký) | Đăng ký với email đã tồn tại | Negative | Email đã được kích hoạt trước đó | Trả về mã lỗi `409 Conflict`, thông báo lỗi rõ ràng | ✅ PASS |
| **TC-AUTH-03** | `UC02` (Đăng nhập) | Đăng nhập với mật khẩu sai quá 5 lần | Security | Mật khẩu không chính xác lặp lại 5 lần | Khóa tạm thời IP 15 phút, trả về `429 Too Many Requests` | ✅ PASS |
| **TC-AUTH-04** | `UC02` (JWT Token) | Refresh Token Rotation | Security | Gửi Refresh Token hợp lệ để cấp Access Token mới | Cấp cặp token mới, vô hiệu hóa Refresh Token cũ ngay | ✅ PASS |
| **TC-CIRC-01** | `UC06` (Tạo Circle) | Khởi tạo Circle thành công | Positive | Tên nhóm hợp lệ, join_mode = REQUIRE_APPROVAL | Tạo Circle, người tạo tự động trở thành Circle Owner | ✅ PASS |
| **TC-CIRC-02** | `UC22` (Rời nhóm) | Owner cố tình rời nhóm khi còn thành viên | Negative | Circle có $\ge 2$ thành viên, Owner bấm Rời nhóm | Chặn thao tác, ném lỗi `400: Must transfer ownership first` | ✅ PASS |
| **TC-CIRC-03** | `UC25` (Chuyển quyền) | Chuyển nhượng quyền Owner hợp lệ | Positive | Chọn thành viên hợp lệ trong nhóm làm Owner mới | Cập nhật vai trò thành viên mới thành OWNER, hạ vai trò cũ | ✅ PASS |
| **TC-CHAT-01** | `UC09` (Gửi tin nhắn) | Gửi tin nhắn văn bản tức thời | Realtime | Gửi payload tin nhắn qua Socket.IO tới Circle room | Toàn bộ client trong room nhận sự kiện `message:created` | ✅ PASS |
| **TC-CHAT-02** | `UC09` (Tải media) | Tải tệp đính kèm vượt quá 25MB | Boundary | Tải tệp tin video dung lượng 28MB lên Presigned URL | Hệ thống từ chối cấp Presigned URL, báo lỗi vượt giới hạn | ✅ PASS |
| **TC-CHAT-03** | `UC13` (Ghim tin) | Thành viên thường cố tình ghim tin | Security | Người dùng có vai trò MEMBER gửi request ghim tin | Trả về `403 Forbidden`, chỉ Owner mới được ghim tin | ✅ PASS |
| **TC-CALL-01** | `UC12` (WebRTC) | Khởi tạo phiên gọi nhóm qua Socket | Realtime | Phát sự kiện `call:initiate` với danh sách thành viên | Máy chủ gửi tín hiệu rung chuông đến toàn bộ thành viên | ✅ PASS |
| **TC-CALL-02** | `UC12` (Signaling) | Trao đổi ICE Candidates qua Coturn | Realtime | Client ở 2 mạng NAT khác nhau gửi ICE candidate | Trao đổi thành công, luồng MediaStream P2P kết nối $\le 1.5s$ | ✅ PASS |
| **TC-MOM-01** | `UC23` (Moments) | Kiểm tra bảo mật Circle-based Privacy | Security | Đăng Moment chỉ định hiển thị cho Circle A (không có B) | Thành viên Circle B truy vấn Feed tuyệt đối không thấy bài | ✅ PASS |
| **TC-TOOL-01** | `UC15` (Group Poll) | Bỏ phiếu bình chọn theo thời gian thực | Realtime | Thành viên bấm chọn phương án bình chọn | Cập nhật % và số phiếu tức thời cho toàn bộ người xem | ✅ PASS |
| **TC-TOOL-02** | `UC19` (Live Map) | Tự ngắt GPS khi hết giờ đếm ngược | Boundary | Phiên chia sẻ 15 phút đếm ngược về 0 | Máy chủ ngừng phát tọa độ, xóa marker khỏi bản đồ số | ✅ PASS |
| **TC-TOOL-03** | `UC21` (Ẩn danh) | Rà soát bóc tách danh tính bài viết | Security | Đăng bài "Điều muốn nói", inspect trực tiếp DB | Trường `author_id` mang giá trị `NULL`, không lưu IP/User | ✅ PASS |

---

## 3. MÃ NGUỒN KIỂM THỬ TỰ ĐỘNG TRONG REPOSITORY

Toàn bộ mã nguồn kiểm thử được quản lý trực tiếp trong kho mã nguồn và chạy tự động trên mỗi commit/PR:

- **Bộ kiểm thử Backend (Jest Unit & Integration Tests):**  
  - Vị trí: [`apps/api/src/**/*.spec.ts`](../../apps/api/src/) và [`apps/api/test/`](../../apps/api/test/).
  - Chạy toàn bộ test suite: `cd apps/api && npm run test`
  - Chạy kiểm tra độ phủ: `cd apps/api && npm run test:cov`
- **Bộ kiểm thử Giao diện Web (Playwright E2E Tests):**  
  - Vị trí: [`apps/web/e2e/`](../../apps/web/e2e/).
  - Các tệp kiểm thử luồng chính: `auth.spec.ts`, `circle-management.spec.ts`, `chat-messaging.spec.ts`, `group-tools.spec.ts`.
  - Chạy E2E trên trình duyệt: `cd apps/web && npx playwright test`
- **Bộ kiểm thử Hiệu năng chịu tải (k6 Benchmark):**  
  - Vị trí: `packages/testing/k6/load-test.js`.
  - Chạy kiểm thử áp lực: `k6 run packages/testing/k6/load-test.js`

---

## 4. BÁO CÁO ĐỘ PHỦ KIỂM THỬ (CODE COVERAGE REPORT)

Kết quả trích xuất tự động từ báo cáo độ phủ Jest (`lcov-report`) đối với các phân hệ nghiệp vụ cốt lõi:

```text
=============================== Coverage summary ===============================
Statements   : 74.82% ( 1845/2466 )
Branches     : 71.15% ( 518/728 )
Functions    : 76.40% ( 382/500 )
Lines        : 75.24% ( 1735/2306 )
================================================================================
```

### Bảng Chi tiết Độ phủ Dòng lệnh theo từng Phân hệ Cốt lõi

| Phân hệ Nghiệp vụ (Module) | Line Coverage (%) | Branch Coverage (%) | Đánh giá so với chỉ tiêu $\ge 70\%$ |
| :--- | :---: | :---: | :---: |
| **Authentication & Authorization Service** | **84.2%** | **78.6%** | ✅ Vượt chỉ tiêu |
| **Circle Management & Governance Service** | **78.5%** | **74.1%** | ✅ Vượt chỉ tiêu |
| **Chat & Messaging Business Service** | **76.0%** | **71.8%** | ✅ Vượt chỉ tiêu |
| **Moments & Privacy Logic Service** | **77.4%** | **73.2%** | ✅ Vượt chỉ tiêu |
| **Group Tools Engine (Poll, Spin, RSVP)** | **73.8%** | **70.5%** | ✅ Đạt chỉ tiêu |
| **Calls & Signaling State Management** | **71.5%** | **68.2%** | ✅ Đạt chỉ tiêu |
| **TỔNG THỂ CÁC CORE SERVICES** | **75.2%** | **71.1%** | **✅ ĐẠT LEVEL 5 RUBRIC** |

---

## 5. SỔ THEO DÕI VÀ VÒNG ĐỜI QUẢN LÝ DEFECT (BUG TRACKER LIFECYCLE)

Nhóm duy trì quy trình quản lý vòng đời lỗi chặt chẽ: `Phát hiện (New)` $\rightarrow$ `Gán trách nhiệm (Assigned)` $\rightarrow$ `Đang sửa (In Progress)` $\rightarrow$ `Kiểm thử xác nhận (Verified)` $\rightarrow$ `Đóng (Closed)`.

### 5.1. Bảng Thống kê Lỗi theo Mức độ Nghiêm trọng
- **Blocker (Lỗi làm tê liệt hệ thống):** Phát hiện 4 lỗi $\rightarrow$ **Đã xử lý dứt điểm 4/4 (100% Resolved, 0 Blocker tồn đọng)**.
- **Critical (Lỗi ảnh hưởng chức năng chính):** Phát hiện 9 lỗi $\rightarrow$ **Đã xử lý dứt điểm 9/9 (100% Resolved, 0 Critical tồn đọng)**.
- **Major (Lỗi logic phụ hoặc giao diện):** Phát hiện 15 lỗi $\rightarrow$ Đã xử lý 15/15 (100% Resolved).
- **Minor (Lỗi chính tả, khoảng cách UI):** Phát hiện 22 lỗi $\rightarrow$ Đã xử lý 22/22 (100% Resolved).

### 5.2. Danh sách các Lỗi Nghiêm trọng Tiêu biểu đã Khắc phục Triệt để

| Mã Defect | Mức độ | Mô tả Lỗi | Nguyên nhân Gốc rễ | Giải pháp Khắc phục | Trạng thái |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **DEF-001** | `Blocker` | Socket.IO disconnect liên tục khi người dùng chuyển tab trên mobile. | Quản lý vòng đời kết nối AppState trong React Native chưa giải phóng bộ nghe sự kiện. | Viết lại hook `useSocketLifecycle` xử lý reconnect mượt mà khi app vào foreground. | Closed |
| **DEF-002** | `Blocker` | Trình duyệt Safari trên iOS không phát được âm thanh trong WebRTC call. | Chính sách Auto-play policy của WebKit chặn phát Audio Stream tự động nếu chưa có user gesture. | Thêm hộp thoại xác nhận "Tham gia âm thanh" để kích hoạt AudioContext hợp lệ. | Closed |
| **DEF-003** | `Critical` | Tin nhắn bị trùng lặp hiển thị khi mạng chập chờn gửi lại nhiều lần. | Thiếu mã định danh Idempotency Key phía client khi đẩy vào socket gateway. | Bổ sung `client_temp_id` và cơ chế lọc trùng deduplication trên Redis trong 60 giây. | Closed |
| **DEF-004** | `Critical` | Tải ảnh Moments kích thước lớn gây giật lag khi cuộn Feed. | Trình duyệt tải ảnh gốc nguyên bản độ phân giải cao thay vì ảnh tối ưu kích thước. | Tích hợp Cloudflare Image Resizing tự động nén kích thước hiển thị theo màn hình. | Closed |

**Cam kết:** Tại thời điểm bảo vệ trước Hội đồng, hệ thống đạt trạng thái **0 Blocker Defects, 0 Critical Defects**, bảo đảm buổi Live Demo diễn ra trơn tru tuyệt đối.
