# QUY CHUẨN LẬP TRÌNH VÀ QUẢN LÝ MÃ NGUỒN — CIRCLE CODING CONVENTIONS
## BỘ QUY TẮC PHÁT TRIỂN PHẦN MỀM CHUẨN CÔNG NGHIỆP

> **Dự án:** CIRCLE — Nền tảng mạng xã hội kết nối và tương tác nhóm  
> **Áp dụng cho:** Toàn bộ kỹ sư phát triển, sinh viên và hệ thống AI Coding Agents  
> **Căn cứ:** [`PROJECT_GOD.md`](../../PROJECT_GOD.md) §8, [`agentic/RULES.md`](../../agentic/RULES.md) và [`agentic/CONVENTIONS.md`](../../agentic/CONVENTIONS.md)

---

## 1. QUY CHUẨN ĐẶT TÊN & CẤU TRÚC TẬP TIN (NAMING CONVENTIONS)

1. **Tập tin và Thư mục:**
   - Sử dụng định dạng `kebab-case` cho tất cả các file mã nguồn thông thường, controllers, services, modules, utility functions (Ví dụ: `circle-tools.service.ts`, `user-profile.controller.ts`, `auth.middleware.ts`).
   - Sử dụng định dạng `PascalCase` cho các React Components trên Web và Mobile (Ví dụ: `CircleChatView.tsx`, `PresenceRail.tsx`, `FloatingControls.tsx`).
2. **Biến và Hàm (Variables & Functions):**
   - Sử dụng `camelCase` (Ví dụ: `currentUser`, `isGroupOwner`, `fetchMessagesByCursor()`).
   - Tên hàm phải bắt đầu bằng một động từ chỉ hành động rõ ràng (Ví dụ: `get*`, `set*`, `create*`, `update*`, `delete*`, `is*`, `has*`).
3. **Lớp, Giao diện và Kiểu dữ liệu (Classes, Interfaces, Types):**
   - Sử dụng `PascalCase` (Ví dụ: `CircleMemberDto`, `AuthenticatedRequest`, `CallSessionState`).
   - Không sử dụng tiền tố `I` cho interfaces (tránh `ICircle`, sử dụng `Circle`).
4. **Hằng số toàn cục (Global Constants):**
   - Sử dụng `UPPER_SNAKE_CASE` (Ví dụ: `MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024`, `DEFAULT_PAGE_SIZE = 20`).
5. **Cơ sở dữ liệu (Database Schema):**
   - Tên Model trong Prisma: `PascalCase` số ít (Ví dụ: `User`, `Circle`, `Message`).
   - Tên cột trong cơ sở dữ liệu: `snake_case` (Ví dụ: `sender_id`, `created_at`, `reply_to_id`).

---

## 2. QUY TẮC VIẾT MÃ NGUỒN TYPESCRIPT CHUẨN STRICT (CLEAN CODE)

1. **Tuyệt đối không sử dụng kiểu dữ liệu `any`:**
   - Luôn định nghĩa kiểu dữ liệu tường minh hoặc sử dụng `unknown` kết hợp type narrowing.
   - Định nghĩa toàn bộ các dữ liệu dùng chung (DTOs, Payload, Enums) trong `packages/types` để bảo đảm tính đồng bộ 100% giữa Backend, Web và Mobile.
2. **Không nuốt lỗi âm thầm (No Silent Error Swallowing):**
   - Tuyệt đối không viết các khối `try {} catch (e) {}` rỗng mà không ghi log hoặc không ném lỗi ra tầng xử lý ngoại lệ trung tâm.
3. **Nguyên tắc Đơn trách nhiệm (Single Responsibility Principle):**
   - Mỗi hàm chỉ thực hiện duy nhất một nhiệm vụ. Nếu hàm vượt quá 40 dòng lệnh, phải xem xét tách nhỏ thành các hàm phụ trợ.
4. **Không để mã chết (No Dead Code):**
   - Không để lại mã lệnh chú thích cũ (*Commented-out code*) trong repository. Khi tái cấu trúc hoặc xóa tính năng, phải loại bỏ sạch sẽ mã nguồn cũ (lịch sử Git đã lưu vết).

---

## 3. QUY TẮC THIẾT KẾ GIAO DIỆN UI/UX (WEB & MOBILE)

1. **Không hardcode chuỗi văn bản (Zero Hardcoded Text):**
   - 100% văn bản hiển thị trên giao diện người dùng phải được nạp thông qua từ điển đa ngôn ngữ `t.*` (Tiếng Việt và Tiếng Anh) nằm trong `packages/shared/src/locales/`.
2. **Không hardcode mã màu hex/rgba (Zero Hardcoded Colors):**
   - 100% màu sắc và giao diện phải sử dụng các biến quy chuẩn hoặc lớp Tailwind CSS (Ví dụ: `bg-background`, `text-primary`, `colors.emerald[500]`).
3. **Xử lý trọn vẹn 5 trạng thái giao diện:**
   - *Loading State:* Hiển thị khung xương (*Skeleton Loader*), không để màn hình trắng.
   - *Empty State:* Hiển thị minh họa và thông báo thân thiện khi danh sách chưa có dữ liệu.
   - *Success State:* Hiển thị dữ liệu trơn tru.
   - *Error State:* Thông báo lỗi rõ ràng kèm nút "Thử lại" (*Retry*).
   - *Offline / Disconnected State:* Báo hiệu khi mất kết nối mạng và tự động kết nối lại.

---

## 4. QUY CHUẨN GIT, NHÁNH VÀ COMMIT (CONVENTIONAL COMMITS)

1. **Nguyên tắc tạo Issue trước (Issue-First Rule):**
   - Mọi công việc đều phải có GitHub Issue trước khi tạo nhánh làm việc.
2. **Định dạng nhánh làm việc:** `<type>/<issue-id>-<slug>`  
   *(Ví dụ: `feat/120-event-rsvp-and-realtime-delights`, `docs/129-hcmute-submission-documentation`)*.
3. **Định dạng thông điệp commit:**  
   `<type>(<scope>): <mô tả chi tiết bằng tiếng Anh> (#<issue-id>)`
   - Bắt buộc có cờ `-s` ký xác nhận điện tử (*Signed-off-by*).
4. **Quy tắc Review chéo bắt buộc (Mandatory Peer Review):**
   - Tuyệt đối không tự merge Pull Request (*No Self-Merge*). Mọi PR của Bình phải do Hạnh review và approve; mọi PR của Hạnh phải do Bình review và approve.
