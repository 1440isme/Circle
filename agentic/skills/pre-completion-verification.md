# Skill: Pre-Completion Verification (Xác thực Bao quát Trước Hoàn tất)

> **Tư duy cốt lõi:** Một kỹ sư phần mềm chuyên nghiệp không bao giờ vội vàng tuyên bố "đã xong", "ổn định" hay "sẵn sàng release" chỉ sau vài chỉnh sửa bề mặt. Mọi thay đổi dù lớn hay nhỏ đều phải trải qua quy trình kiểm định bao quát đa chiều (Full-Spectrum Verification) để loại bỏ hoàn toàn rủi ro và nợ kỹ thuật tiềm ẩn.

---

## 🎯 Khi nào sử dụng skill này?

- **Bắt buộc** trước khi tuyên bố hoàn thành một tác vụ, một tính năng hoặc một mốc bàn giao (milestone / beta / release).
- Trước khi tạo Pull Request hoặc bàn giao cho kỹ sư đối tác (**Bình ↔ Hạnh**) review.
- Sau bất kỳ đợt refactor hoặc vá lỗi (bug fix) nào để phòng ngừa lỗi hồi quy (regression).

---

## 🛡️ 5 Tầng Kiểm Định Bắt Buộc (5-Tier Verification Protocol)

```
┌────────────────────────────────────────────────────────┐
│ Tầng 1: Biên dịch & Tính toàn vẹn Type (Strict Types)  │
├────────────────────────────────────────────────────────┤
│ Tầng 2: Kiểm thử Tự động Toàn diện (Automated Tests)  │
├────────────────────────────────────────────────────────┤
│ Tầng 3: Chuẩn hóa Dữ liệu & Lưu trữ (Zero Base64 / DB) │
├────────────────────────────────────────────────────────┤
│ Tầng 4: Xử lý Biên & Chế độ Dự phòng (Edge & Fallbacks)│
├────────────────────────────────────────────────────────┤
│ Tầng 5: Tài liệu, Bản đồ Dự án & Logs (Map & Trace)    │
└────────────────────────────────────────────────────────┘
```

---

### Tầng 1: Biên dịch & Kiểm tra Kiểu Dữ liệu (Strict Typecheck & Builds)

Tuyệt đối không bỏ sót bất kỳ workspace nào trong Monorepo:

- [ ] **Shared Packages:**
  ```bash
  npm run build --prefix packages/types && npm run build --prefix packages/shared
  ```
  - Kiểm tra `dist/` có được cập nhật đầy đủ type declarations (`.d.ts`) và mã compiled không.
- [ ] **Backend Build:**
  ```bash
  npm run build --prefix apps/backend
  ```
  - 0 lỗi TypeScript (`tsc` / `nest build`), 0 cảnh báo biến thừa không dùng (`noUnusedLocals`).
- [ ] **Web Production Build:**
  ```bash
  npm run build --prefix apps/web
  ```
  - Kiểm tra Next.js biên dịch thành công 100% routes, SSR / Static generation không bị crash.
- [ ] **Mobile Typecheck:**
  ```bash
  cd apps/mobile && npx tsc --noEmit
  ```
  - Đảm bảo toàn bộ hooks, services, navigation params khớp 100% với `@circle/types`.

---

### Tầng 2: Kiểm thử Tự động & Lỗi Hồi quy (Automated Tests & Regressions)

- [ ] **Chạy toàn bộ Test Suites:**
  ```bash
  npm test --prefix apps/backend
  ```
  - Tất cả Unit Tests, Service Tests, Gateway Tests, Pipe Tests phải đạt trạng thái **PASS (100%)**.
- [ ] **Kiểm tra ca biên (Edge Cases):**
  - Dữ liệu rỗng (`null`, `undefined`, chuỗi trống `""`, mảng rỗng `[]`).
  - Dữ liệu quá giới hạn (chuỗi quá dài, kích thước tệp vượt ngưỡng 25MB).
  - Tấn công Path Traversal (`../../etc/passwd`), XSS / Script injection trong tin nhắn và nội dung rich-text.
  - Token hết hạn, token bị thu hồi, phiên bản refresh token không khớp.

---

### Tầng 3: Chuẩn hóa Dữ liệu & Lưu trữ (Data Cleanliness & DB Integrity)

- [ ] **Quy tắc Zero Base64:**
  - Không bao giờ cho phép chuỗi `data:image/...;base64` hoặc `blob:...` lọt vào database PostgreSQL.
  - Mọi media phải được upload qua Cloudflare R2 hoặc Storage Service và lưu dưới dạng public URL / storage key.
- [ ] **Quản lý Bộ nhớ Client (RAM & Object URLs):**
  - Khi preview ảnh bằng `URL.createObjectURL(file)`, phải luôn có hàm `URL.revokeObjectURL(url)` khi người dùng đổi ảnh, hủy bỏ, hoặc đóng modal để chống memory leak.
  - Chỉ upload ảnh lên máy chủ / R2 khi người dùng bấm nút Submit thực sự; không upload ngay lúc preview.
- [ ] **Client-side Optimization:**
  - Ảnh phải được nén WebP / downscale canvas trước khi gửi mạng để tiết kiệm băng thông người dùng.

---

### Tầng 4: Xử lý Ngoại lệ & Kịch bản Môi trường (Edge & Fallback Readiness)

- [ ] **Dev vs. Production Parity:**
  - Khi thiếu biến môi trường R2 / Mailer / LiveKit, hệ thống có fallback mượt mà (chế độ local media, log console thay vì crash hệ thống) không?
- [ ] **Đa ngôn ngữ (i18n):**
  - Kiểm tra xem có text nào bị hardcode tiếng Anh / tiếng Việt không nằm trong `packages/shared/src/locales/` (`vi.ts`, `en.ts`) không?
- [ ] **Xử lý Realtime & Cleanup:**
  - Socket listeners, Timers (`setInterval`), Event listeners (`window.addEventListener`) có được gỡ bỏ trong `cleanup` / `useEffect` return không?

---

### Tầng 5: Tính Toàn Vẹn Hệ Thống & Tài Liệu (System Map & Traceability)

- [ ] **Agent Map Check:**
  ```bash
  ./scripts/check-agent-map.sh
  ```
  - Tất cả liên kết tài liệu, skills, map và capability specs phải hợp lệ (0 broken links).
- [ ] **Changelog & AI Usage Logging:**
  - Có cập nhật [`CHANGELOG.md`](../../CHANGELOG.md) theo chuẩn SemVer khi có thay đổi lớn không?
  - Tuân thủ quy tắc **1 Feature/PR = 1 Consolidated AI Log Entry** trong [`docs/ai-usage/log.md`](../../docs/ai-usage/log.md).

---

## 🚫 Những Điều Tuyệt Đối Cấm (Anti-Patterns)

1. ❌ **Không được nói "sẵn sàng / hoàn tất"** khi chưa chạy lệnh build/test thực tế để chứng minh.
2. ❌ **Không được "bỏ qua cảnh báo"** (warning) của compiler hay linter mà coi như không có chuyện gì.
3. ❌ **Không được test chỉ một nhánh:** Code sửa shared package mà chỉ test backend hoặc chỉ test web.
4. ❌ **Không được chủ quan với giả định:** Mọi giả định về môi trường phải được kiểm chứng qua mã nguồn và cấu hình thực tế.
