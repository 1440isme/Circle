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
- **Tư duy sản phẩm & Trải nghiệm thực tế (Product & UX-First):** Không bao giờ làm tính năng theo kiểu "chạy được là xong" hay liệt kê checklist cho có. Đặt mình vào vị trí người dùng thực tế: tính năng có thực sự hữu ích không, có gây cảm hứng muốn dùng không; UI/UX phải chỉn chu và được kiểm chứng trực quan bằng công cụ. — chốt bởi Bình, 2026-10-27
- **Thẩm mỹ chuyên nghiệp, chống "AI Slop":** Không lạm dụng emoji sến súa (👋, ☕, 🍕...), icon lòe loẹt hay hiệu ứng hào quang tạo cảm giác rẻ tiền. UI phải chuẩn mực, sang trọng, tinh tế (typography sắc nét, khoảng trắng cân đối, viền hairline tinh xảo) mang lại độ legit cao như các sản phẩm hàng đầu. — chốt bởi Bình, 2026-10-27
- **Triết lý Radical Minimalism & Clean UI:** Giao diện tối giản tối đa, ít text nhất có thể. Cấm mọi text mô tả hiển nhiên, subtitle lặp lại tiêu đề, badge chú thích thừa (như lời khuyên đổi mật khẩu, hint empty state dài dòng, badge nháp thô). Ghim đưa lên header icon (rỗng/fill); cài đặt âm thanh gom vào Circle Settings; Light theme nút bấm phải phân biệt rõ với nền. — chốt bởi Bình, 2026-10-28
- **Zero Hardcoding Invariant:** 100% text giao diện (label, error, toast, alert, placeholder, aria-label) bắt buộc đi qua `@circle/shared` (`vi.ts` và `en.ts`). Tuyệt đối cấm hardcode bất kỳ chuỗi tiếng Việt/tiếng Anh nào trong component. — chốt bởi Bình, 2026-10-28
- **Tương tác tin nhắn ngữ cảnh & Emoji chuẩn hóa:** Web hover hiện 3 chấm dọc mở menu; Mobile nhấn giữ focus tin nhắn (nền mờ) với reaction emoji ở trên và hành động ở dưới. Toàn hệ thống dùng DUY NHẤT 1 bộ emoji; tab emoji picker chỉ dùng icon đại diện, bỏ tiêu đề chữ. — chốt bởi Bình, 2026-10-28

## Corrections & Lessons

- [correction] Mặc định triển khai tính năng phải làm song song cả Web và Mobile; tuyệt đối cấm làm một bên rồi coi là hoàn thành (thay thế: thói quen làm web trước rồi mới làm mobile sau dẫn đến thiếu sót/mất trace) — theo Bình, 2026-10-25.
- [correction] Phải đọc sâu và thấu đáo toàn bộ codebase trước khi nhận xét/đánh giá; không được grep hời hợt rồi kết luận chưa làm. Phải phân tích thấu đáo xem phần nào đã có nền móng, phần nào còn dang dở hoặc trải nghiệm còn thô để cải thiện nâng tầm trải nghiệm cho user. — theo Bình, 2026-10-27.
- [correction] Không đặt banner ghim hay modal hành động thô giữa màn hình chat (thay thế: ghim đưa lên Header icon; mobile long-press focus tin nhắn với emoji ở trên và action ở dưới) — theo Bình, 2026-10-28.
- [correction] Cắt bỏ toàn bộ text thừa, lời khuyên rườm rà, subtitle lặp lại tiêu đề, badge giải thích hiển nhiên ở mọi nơi — theo Bình, 2026-10-28.

## Decisions (chỉ mục — chi tiết ở ADR/topic)

- Mô hình quản trị: toàn hệ thống chỉ 2 vai trò User / Admin — Admin gộp toàn quyền (không tách Super Admin/Admin thường) vì CIRCLE là MXH nhóm, không phải e-commerce. — chốt bởi Bình, 2026-10-25
<!-- Dạng: - <Quyết định> — ADR-XXX / topics/<slug>.md, <ngày>. -->

## Open loops

- Rà soát toàn diện và hoàn thiện triệt để các module của Bình (Module 1, 4, 5, 6, 7.2) theo Playbook Tier MUST và Cross-cutting gate (Web + Mobile song hành) trước khi bước sang Module 8 — hạn 2026-10-26, đang thực hiện.

## Core Reference Topics (Lớp 3 — bối cảnh sâu)

- [Architecture](architecture.md) — Durable architectural choices: Modular Monolith, module encapsulation, shared types contract.
- [Gotchas](gotchas.md) — Known traps, pitfalls, and framework quirks (Prisma + Neon pooling, Expo WebRTC, Socket.IO auth, ViewShot).
- [Verified facts](verified-facts.md) — Technical realities confirmed by inspecting code and dependencies.
- [Decisions](decisions.md) — Summary of key Architectural Decision Records (ADRs).
- [Reporting Workflow](reporting-workflow.md) — Quy định báo cáo kép (GVHD 2 tuần/lần vs. Khoa 1 tuần/lần, lệch track 4 tuần, cấu trúc 4 mục).
