# UI/UX QA & Teamwork Workflow (Chuẩn cho mọi tính năng mới)

> Tài liệu chuẩn hóa quy trình làm việc đã chốt với kỹ sư (2026-11-11), áp dụng cho mọi tính năng mới sắp tới trên CIRCLE (Web + Mobile + Backend + Shared).

---

## 1. Mô hình điều phối (Coordinator + Independent Peer Reviewer)

1. **Coordinator (Agent chính):**
   - Lập kế hoạch kiểm thử & triển khai rõ ràng trước khi sửa rộng; đồng bộ **Backend + Shared (`packages/shared`) + Web (`apps/web`) + Mobile (`apps/mobile`)** trong cùng một đợt (Web + Mobile Parity).
   - Trước khi viết code mới, tải playbook module liên quan + `agentic/playbooks/cross-cutting-gate.md` + `agentic/memory/MEMORY.md`.
2. **Independent Peer Reviewer (Subagent độc lập):**
   - Sau khi Coordinator hoàn tất implement & QA trực quan, gọi một subagent đọc-only (`research` / challenger) kiểm tra **toàn bộ `git diff`** độc lập để săn:
     - Lỗi sót một nền tảng (Web sửa mà Mobile quên hoặc ngược lại).
     - Lỗi runtime bên thứ 3 (như Leaflet `subdomains: undefined`).
     - Lỗi `fixed inset-0` thiếu `createPortal` bên trong `backdrop-filter` / `transform`.
     - Lỗi tương phản Dark/Light trên trạng thái `:hover`, `:active`, theme tint.
     - Chuỗi UI cứng chưa đi qua `@circle/shared` (`vi.ts` / `en.ts`) hoặc hộp thoại native (`Alert.alert`, `window.alert/confirm`).
   - Coordinator phải vá toàn bộ phát hiện hợp lệ từ Peer Reviewer trước khi chạy cổng kiểm tra cuối.

---

## 2. Kiểm thử trực quan trên Brave thật (KHÔNG dùng Playwright)

- **Công cụ:** Chrome DevTools Remote Debugging của trình duyệt Brave thật tại `127.0.0.1:9222` thông qua [`scripts/brave-bridge.mjs`](../../../scripts/brave-bridge.mjs) (mặc định giữ nguyên các tab cá nhân của user, kết nối lại tab `localhost:3000`).
- **Ma trận kiểm chứng bắt buộc cho mỗi tính năng UI mới:**
  1. **Zero Errors:** `consoleErrors === 0`, `pageErrors === 0`, `httpErrors (>= 400) === 0` suốt toàn bộ luồng click thật.
  2. **Theme & Phong cách:** Kiểm tra cả **Dark Mode** + **Light Mode**, và cả **Liquid Glass** (độ mờ vừa phải, dễ đọc chữ/icon) + **Flat Design** (không mount hiệu ứng blur).
  3. **Ngôn ngữ & Viewport:** Kiểm tra **VI + EN**, và tối thiểu 3 kích thước: Desktop (`1280x800`), Tablet (`768x1024`), Mobile-Web (`360x780`).
  4. **Mọi click thực tế của user:** Mở menu, điền form, biên dài/nhiều lựa chọn, nhấn `Escape` / click backdrop đóng modal, scroll, trạng thái empty/loading/error.
- **Lưu ý vận hành:** Tắt sạch mọi dev server daemon (`next dev`, `nest start`, `brave-bridge`) trước khi chạy `next build`.

---

## 3. Checklist UI/UX & Invariants bắt buộc cho tính năng mới

- **Inline Low-Friction UX:** Mọi thao tác nhỏ (sửa nội dung, xem lịch sử sửa kiểu Messenger với nhãn `Đã chỉnh sửa`/`Edited` ở trên và box cũ mờ hơn xếp ngay trên box hiện tại, chọn/xác nhận nhanh) thực hiện inline tại chỗ; **cấm** đẩy user sang màn hình khác hoặc mở popup/alert cho hành động nhỏ.
- **Màu sắc & Tương phản (`CircleColors`):**
  - Nút nền `bg-circle-primary` / `colors.primary` -> chữ tối (`#131316` / `colors.onPrimary` / `text-circle-charcoal dark:text-circle-dark-canvas`).
  - Nút Web có `hover:bg-circle-sage` + `dark:text-circle-dark-canvas` hoặc `dark:text-circle-charcoal` -> **bắt buộc** có `dark:hover:text-white` (trừ khi đã override `dark:hover:bg-circle-primary-hover`).
  - Nút nguy hiểm chữ `#FFFFFF` -> dùng `#DC2626` (không dùng `colors.danger` ở Dark mode).
  - Màu chữ/icon phụ trung tính -> `colors.sage` / `dark:text-circle-dark-primary`.
  - Mobile Poll / Card theo theme động -> tính relative luminance của màu nền check/fill để chọn icon tối hoặc `#FFFFFF` tương phản rõ.
- **Portals cho Nested Overlay:** Mọi lightbox hoặc modal con có thể xuất hiện bên trong phần tử dùng `transform` (như highlight scale) hoặc `backdrop-filter` (`.glass`, `.glass-sheet`) bắt buộc dùng `createPortal(..., document.body)`.
- **Glass & Bare Icons:** Độ mờ Liquid Glass cân bằng; `flat` không mount `<BlurView>`; mọi `<BlurView>` trên Mobile dùng `intensity={glassTheme.blur.intensity}`; không bọc icon trong khung hộp bo góc nhân tạo thừa thãi.
- **Minh bạch báo cáo Mobile:** Phân biệt rõ những gì đã kiểm chứng live trên Brave Web/Mobile-Web với những gì được xác minh tĩnh trên `apps/mobile` (`tsc --noEmit`, invariant grep, peer review) trừ khi chạy trực tiếp trên Expo emulator/thiết bị thật.

---

## 4. Cổng kiểm tra cuối trước khi Commit / Push (Sau lần sửa cuối cùng)

Chạy toàn bộ các lệnh dưới đây **sau lần chỉnh sửa code cuối cùng**:

```bash
npm run build --workspace=@circle/types
npm run build --workspace=@circle/shared
npm run typecheck --prefix apps/mobile
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/backend/tsconfig.json
npm test --prefix apps/backend
npm run build --prefix apps/web
./scripts/check-agent-map.sh
./scripts/check-secrets.sh
```

- Cập nhật `docs/ai-usage/log.md` (`AI-XXXX` phản ánh đúng kết quả thật), chạy `./scripts/verify-ai-log.sh --working` (hoặc hook `pre-commit`), commit theo Conventional Commits trên nhánh `<type>/<issue-id>-<slug>`, mở PR vào `develop` với peer review chéo giữa Bình và Hạnh.
