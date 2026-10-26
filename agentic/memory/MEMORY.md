# MEMORY.md — Lớp 1: Index trí nhớ CIRCLE

> Nạp đầu MỌI phiên làm việc. Giới hạn ~200 dòng — vượt là phải tổng hợp/cắt tỉa
> (xem skill `memory-protocol`). Mỗi mục có ngày + nguồn. Mục hết hiệu lực:
> sửa tại chỗ, không để hai sự thật mâu thuẫn cùng tồn tại.
> Bản này được điền sẵn từ PROJECT_GOD.md + AGENTS.md ngày 2026-10-25 — nhóm rà
> lại một lượt trước khi dùng chính thức.

## Facts — Dự án & nhóm

- CIRCLE: đồ án tốt nghiệp — MXH theo nhóm; SSOT là `PROJECT_GOD.md` (mục 2.2 là scope đã đăng ký). — 2026-10-25
- Nhóm 2 người: Trương Công Bình (23110184), Ninh Thị Mỹ Hạnh (23110210). PR của người này bắt buộc người kia review & approve; cấm self-merge. — theo AGENTS.md, 2026-10-25
- Stack: NestJS + Prisma + PostgreSQL + Redis; Next.js web (Admin tích hợp tại /admin); React Native + Expo; Socket.IO + WebRTC; Docker + Traefik. — theo AGENTS.md, 2026-10-25
- GitHub là project OS (Issues/Projects/PR/Actions). Figma là UI/UX source of truth. — theo PROJECT_GOD.md, 2026-10-25
- Roadmap 19 tuần; mục tiêu rubric Level 5; 10 Hard Gates ở PROJECT_GOD §7 là bất khả xâm phạm. — 2026-10-25
- **Triết lý sản phẩm group-first:** mọi tính năng vì hoạt động nhóm; KHÔNG có chat 1-1 (chat là chat nhóm của Circle); không có đồ thị bạn bè độc lập — gia nhập bằng mời thẳng vào Circle; tạo Circle + chọn thành viên phải tiện cho user. — chốt bởi Bình, 2026-10-25 (PROJECT_GOD §2.2 & §11 mục K đã được amendment đồng bộ).

## Preferences — Cách làm việc đã chốt

- Báo cáo/giao tiếp với nhóm: tiếng Việt. Code, commit, tài liệu kỹ thuật: tiếng Anh. — 2026-10-25
- Conventional Commits; branch dạng `<type>/<issue-id>-<slug>`; không commit thẳng vào `main`/`develop`. — theo AGENTS.md, 2026-10-25
- Mọi tương tác AI đáng kể phải có entry `AI-XXXX` trong `docs/ai-usage/log.md` (tự động; hỏng tự động thì báo trong PR, không bịa entry). — theo AGENTS.md, 2026-10-25
- Trước khi implement tính năng: đọc playbook của module + cross-cutting gate trong `agentic/playbooks/`; báo cáo cuối có mục "Playbook conformance". — chốt 2026-10-25
- Ý tưởng tính năng mới → `agentic/playbooks/innovation-pool.md`, chờ duyệt; không tự implement. — chốt 2026-10-25
- **Mặc định đa nền tảng song hành (Web + Mobile parity):** Khi implement bất kỳ tính năng nào, mặc định BẮT BUỘC triển khai song song và hoàn thiện đồng bộ trên cả 2 nền tảng: Web (`apps/web`) và Mobile (`apps/mobile` - React Native Expo). Cấm chỉ làm trên một nền tảng rồi coi là xong; tránh mất trace và không bao giờ để xảy ra tình trạng "làm rồi nhưng thiếu trên Web hoặc Mobile". — chốt bởi Bình, 2026-10-25
- **Tự động kích hoạt Memory Protocol:** Tự nhận diện và lập tức ghi nhận mọi chỉ đạo, sửa lỗi, sở thích hoặc quy tắc làm việc của kỹ sư vào Layer 2/Layer 1 ngay trong lượt tương tác, không được bỏ sót và không chờ nhắc. — chốt bởi Bình, 2026-10-25

## Corrections & Lessons

- [correction] Mặc định triển khai tính năng phải làm song song cả Web và Mobile; tuyệt đối cấm làm một bên rồi coi là hoàn thành (thay thế: thói quen làm web trước rồi mới làm mobile sau dẫn đến thiếu sót/mất trace) — theo Bình, 2026-10-25.

## Decisions (chỉ mục — chi tiết ở ADR/topic)

- Mô hình quản trị: toàn hệ thống chỉ 2 vai trò User / Admin — Admin gộp toàn quyền (không tách Super Admin/Admin thường) vì CIRCLE là MXH nhóm, không phải e-commerce. — chốt bởi Bình, 2026-10-25
<!-- Dạng: - <Quyết định> — ADR-XXX / topics/<slug>.md, <ngày>. -->

## Open loops

<!-- Cam kết/deadline đang mở, dạng: - <việc> — hạn <ngày>, trạng thái. Xong thì xoá. -->

## Core Reference Topics (Lớp 3 — bối cảnh sâu)

- [Architecture](architecture.md) — Durable architectural choices: Modular Monolith, module encapsulation, shared types contract.
- [Gotchas](gotchas.md) — Known traps, pitfalls, and framework quirks (Prisma + Neon pooling, Expo WebRTC, Socket.IO auth, ViewShot).
- [Verified facts](verified-facts.md) — Technical realities confirmed by inspecting code and dependencies.
- [Decisions](decisions.md) — Summary of key Architectural Decision Records (ADRs).
- [Reporting Workflow](reporting-workflow.md) — Quy định báo cáo kép (GVHD 2 tuần/lần vs. Khoa 1 tuần/lần, lệch track 4 tuần, cấu trúc 4 mục).
