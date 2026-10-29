# Skill: Implement Feature

The canonical implementation lifecycle for adding or changing features in CIRCLE.

---

## When to Use
- Implementing an assigned GitHub Issue (User Story `US-xxx` or Defect `BUG-xxx`).

---

## Steps

1. **Check DoR (Definition of Ready) & Playbook:**
   - Confirm Issue has clear Acceptance Criteria (`AC-xxx`), Business Rules (`BR-xxx`), and test expectations.
   - Read the module playbook in [`agentic/playbooks/`](../playbooks/README.md) and [`cross-cutting-gate.md`](../playbooks/cross-cutting-gate.md) for Tier MUST baseline and cross-cutting requirements.
   - Confirm dual-platform scope: plan implementation for both Web and Mobile from step zero.
2. **Branch Creation:**
   - Ensure you are branching from the latest `develop`:
     ```bash
     git checkout develop && git pull
     git checkout -b <type>/<issue-id>-<slug>
     ```
3. **Inspect Existing Abstractions:**
   - Search `apps/` and `packages/` to reuse existing hooks, services, or types before creating new ones.
4. **Implement Code (Dual-Platform Parity by Default):**
   - **Multi-Platform Parity Invariant (Mandatory):** By default, EVERY feature MUST be developed and completed in parallel across BOTH platforms: **Web (`apps/web`)** and **Mobile (`apps/mobile` - React Native Expo)**. Never deliver or mark a feature as done on Web-only or Mobile-only (unless explicitly scoped otherwise, e.g., Admin dashboard is web-only, native camera sensor is mobile-only). Avoid losing trace or having a feature exist on one platform but absent on the other.
   - Adhere to the conventions in [`agentic/CONVENTIONS.md`](../CONVENTIONS.md).
   - Keep controllers thin in `apps/api` / `apps/backend`.
   - Separate server/client components in `apps/web`.
   - Ensure fluid native styling on `apps/mobile` using design tokens and zero hardcoded colors.
   - Update shared contracts in `packages/types` and validation schemas / bilingual dictionaries in `packages/shared`.
   - **UI/UX Radical Minimalism & Clean Design Rules (Inviolable):**
     - **Zero Redundant Text:** Ít text nhất có thể. Tuyệt đối không thêm text mô tả, phụ đề hoặc badge chú thích cho các hành vi hiển thị hiển nhiên mà ai cũng biết (ví dụ: đổi mật khẩu không thêm badge khuyên răn; form không lặp lại mô tả cho từng tiêu đề con; empty state chỉ cần icon nhẹ + tiêu đề ngắn gọn, không giải thích dài dòng).
     - **Zero Hardcoding Invariant:** Tuyệt đối KHÔNG hardcode bất kỳ chuỗi tiếng Việt hay tiếng Anh nào trong component (label, title, placeholder, tooltip, toast, alert, fallback). 100% text giao diện bắt buộc khai báo và sử dụng qua `@circle/shared` (`vi.ts` và `en.ts`).
     - **Contextual Interactions & Clean Hierarchy:**
       - Web: Hover phần tử hiện các thao tác phụ tinh gọn dạng 3 chấm dọc (`MoreVertical`).
       - Mobile: Tránh popup thô giữa màn hình; dùng tương tác theo ngữ cảnh (nhấn giữ focus tin nhắn với overlay mờ, thanh emoji ở trên, menu hành động ở dưới).
       - Chat & Headers: Ghim đưa vào icon Header (outline rỗng / fill); không để thanh draft thô kệch; cài đặt âm thanh/hiệu ứng gom vào Circle Settings; Light theme phải có độ tương phản rõ nét cho nút bấm/hành động.
       - Emoji: Dùng DUY NHẤT một bộ emoji chuẩn hóa toàn hệ thống; tab chọn emoji chỉ dùng icon đại diện, bỏ tiêu đề chữ.
5. **Run Tests & Verify (Dual-Platform Verification):**
   - Run backend unit and integration tests (`npm test -w @circle/backend`).
   - Run Web production build check (`npm run build -w @circle/web`).
   - Run Mobile TypeScript verification (`npm run typecheck -w @circle/mobile` or `npx tsc --noEmit -p apps/mobile/tsconfig.json`).
   - Add regression tests if fixing a bug.
6. **Self-Review:**
   - Run [`code-review.md`](code-review.md) against the Definition of Done.
   - Verify parity: check that the user experience is fully mirrored and usable on both Web and Mobile.
7. **Commit & Open PR:**
   - Follow [`commit-and-pr.md`](commit-and-pr.md).
   - Include the **Playbook conformance** section in the PR description / implementation report per [`agentic/playbooks/SKILL.md`](../playbooks/SKILL.md).
8. **Automated AI Usage Logging:**
   - Follow [`ai-log-entry.md`](ai-log-entry.md) to append an `AI-XXXX` record to `docs/ai-usage/log.md`.

---

## Exit Criteria
- Code builds with 0 errors on both Web and Mobile.
- Multi-platform parity achieved (100% equivalent functionality on Web and Mobile; zero one-sided deliverables).
- Radical minimalism verified: zero redundant descriptions, zero self-evident advisory badges, clean layout.
- Zero hardcoded strings: 100% UI strings localized in `@circle/shared` (`vi.ts` & `en.ts`).
- Tests pass across backend and frontends.
- Definition of Done satisfied.
- Playbook conformance verified.
- AI Log entry appended.
