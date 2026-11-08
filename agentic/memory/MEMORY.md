# MEMORY.md — Layer 1 Long-term Index

> Sổ tay ghi nhớ dài hạn (tối đa ~200 dòng). Được đọc tự động ở đầu mỗi phiên.
> Cập nhật theo `agentic/memory/MEMORY-PROTOCOL.md`.
> Các mục chi tiết theo chủ đề nằm ở `agentic/memory/topics/`.
> Nhật ký theo ngày nằm ở `agentic/memory/YYYY-MM-DD.md`.

## Facts & Context

- Trương Công Bình (23110184) & Ninh Thị Mỹ Hạnh (23110210) — đồ án tốt nghiệp CIRCLE, HCMUTE.
- Tech stack: NestJS + Prisma + PostgreSQL + Redis (apps/api), Next.js (apps/web), Expo (apps/mobile).
- 10 Hard Gates là bất khả xâm phạm (sản phẩm thực, zero secret leaks, testing tự động, báo cáo tuần...).
- Peer review bắt buộc giữa Bình và Hạnh; không bao giờ tự merge PR.

## User Preferences & Rules

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
- **Tự kiểm toán Trải nghiệm & Độ hữu dụng (Feature Usability Audit):** Tuyệt đối không chuyển sang module mới khi cụm tính năng hiện tại chưa thực sự hữu ích và trơn tru. Bắt buộc nhập vai người dùng thực tế kiểm toán 5 trụ cột (đời thực, liền mạch với chat, giảm thiểu ma sát, đồng bộ thời gian thực, thẩm mỹ tinh tế) theo skill `feature-usability-audit.md`. — chốt bởi Bình, 2026-10-29
- **Kỷ luật Clean Repository:** Giữ sạch kho mã nguồn tuyệt đối; không để lại file rác, file nháp, script thử nghiệm tạm thời hay các câu lệnh kỹ thuật dư thừa trong repository. — chốt bởi Bình, 2026-11-01
- **Thẩm quyền PR & Phê duyệt:** Tuyệt đối nghiêm ngặt KHÔNG tự ý tạo Pull Request (PR) hoặc merge code khi chưa có sự chỉ thị và cho phép rõ ràng từ kỹ sư. — chốt bởi Bình, 2026-11-01
- **Ngưỡng ghi nhận AI Log (`docs/ai-usage/log.md`):** Chỉ ghi nhận entry `AI-XXXX` khi triển khai một tính năng hoàn chỉnh, thay đổi kiến trúc hoặc logic cốt lõi có quy mô đủ lớn. Tuyệt đối không ghi log cho các tinh chỉnh giao diện nhỏ lẻ (micro UI tweaks, chỉnh style/CSS vụn vặt). — chốt bởi Bình, 2026-11-01
- **Phong cách điều hướng Floating Pill Button & Scroll Underlay (Mobile UI/UX):** Trên mobile (màn hình chi tiết / modal / view độc lập), hạn chế dùng thanh header/heading khối hộp tĩnh chia cắt màn hình. Thay bằng các nút điều khiển nổi dạng viên thuốc (**Floating Pill Buttons** / **Capsule Buttons**) với `position: 'absolute'`, nền trắng/mờ, viền hairline (`#E2E8F0`), đổ bóng mềm mại (`elevation: 3, shadowOpacity: 0.08`), và cho phép ScrollView cuộn toàn màn hình để nội dung trượt lướt qua bên dưới các nút (**Scroll Underlay**), kết hợp `pointerEvents="box-none"` để không cản trở thao tác vuốt chạm. — chốt bởi Bình, 2026-11-01

## Corrections & Lessons

- [correction] Mặc định triển khai tính năng phải làm song song cả Web và Mobile; tuyệt đối cấm làm một bên rồi coi là hoàn thành (thay thế: thói quen làm web trước rồi mới làm mobile sau dẫn đến thiếu sót/mất trace) — theo Bình, 2026-10-25.
- [correction] Báo cáo tuần (W01–W19 nộp Khoa) phải có đầy đủ 5 mục (bổ sung mục 5. Những việc sẽ làm trong tuần tiếp theo), không phải chỉ 4 mục như quy định cũ. — theo yêu cầu người dùng, 2026-10-26.
- [correction] Phải đọc sâu và thấu đáo toàn bộ codebase trước khi nhận xét/đánh giá; không được grep hời hợt rồi kết luận chưa làm. Phải phân tích thấu đáo xem phần nào đã có nền móng, phần nào còn dang dở hoặc trải nghiệm còn thô để cải thiện nâng tầm trải nghiệm cho user. — theo Bình, 2026-10-27.
- [correction] Không đặt banner ghim hay modal hành động thô giữa màn hình chat (thay thế: ghim đưa lên Header icon; mobile long-press focus tin nhắn với emoji ở trên và action ở dưới) — theo Bình, 2026-10-28.
- [correction] Cắt bỏ toàn bộ text thừa, lời khuyên rườm rà, subtitle lặp lại tiêu đề, badge giải thích hiển nhiên ở mọi nơi — theo Bình, 2026-10-28.
- [correction] Tuyệt đối không fallback secret/token thật vào source code (`process.env.KEY || 'secret'`); bảo mật theo Hard Gate Zero Secret Leaks bằng pre-commit guard `check-secrets.sh`. Khi cập nhật git hook phải bảo toàn nguyên vẹn các pre-commit checks hiện có, cấm overwrite — theo Bình, 2026-10-29.

## Decisions (chỉ mục — chi tiết ở ADR/topic)

- D-001: Mobile dùng Expo bare workflow — 2026-10-20
- D-002: Realtime dùng Socket.IO kết hợp WebRTC mesh — 2026-10-21
- D-003: Giữ cấu trúc monorepo npm workspaces — 2026-10-22
- D-004: Mọi tính năng giao diện mới phải đạt song hành Web và Mobile (Web + Mobile parity) ngay từ đầu — 2026-10-25
- D-005: Loại bỏ hoàn toàn AI Slop, hướng tới thẩm mỹ tinh tế, sang trọng, tối giản và chuyên nghiệp — 2026-10-27
- D-006: Khắc cốt ghi tâm Radical Minimalism: Cắt giảm mọi text/chú thích thừa, ghim lên header icon, gom sound settings, emoji chuẩn hóa — 2026-10-28
- D-007: Tự kiểm toán Usability theo 5 trụ cột trước khi chuyển tính năng mới — 2026-10-29
- D-008: Hard Gate Zero Secret Leaks với pre-commit git guard và CI check; cấm lộ token/credentials trong source code — 2026-10-29
