---
name: circle-playbooks
description: >
  Bộ playbook best-practice theo module cho dự án CIRCLE (mạng xã hội theo nhóm:
  Next.js web, React Native mobile, API + realtime + WebRTC). Dùng skill này mỗi khi
  implement, sửa hoặc review bất kỳ tính năng nào thuộc các module: Account/Auth,
  People & Invitations, Circle, Realtime Sharing (khoảnh khắc), Chat, Voice/Video Call,
  Circle Collaboration, Notification, Admin/Moderation. Skill cung cấp: (1) baseline
  tính năng chuẩn theo từng module — agent không được tự ý bỏ tính năng MUST;
  (2) cổng cross-cutting bắt buộc: responsive, theme/design token, i18n,
  trạng thái UI, accessibility, parity web/mobile; (3) quy trình self-audit
  trước khi báo cáo hoàn thành.
---

# CIRCLE Module Playbooks — Cách dùng cho Agent

## Nguyên tắc tối cao

**Triết lý group-first (chủ dự án chốt 2026-10-25):** Mọi tính năng sinh ra vì
hoạt động nhóm và tồn tại vì nhóm. Hệ thống **không có chat 1-1** — chat chỉ là
chat nhóm của Circle; quan hệ xã hội chỉ tồn tại bên trong Circle, không có đồ
thị "bạn bè" độc lập; con đường gia nhập là **mời thẳng vào Circle**. Mọi
playbook đều phải tuân triết lý này. (PROJECT_GOD.md §2.2 đã được amendment
đồng bộ ngày 2026-10-25; GOD file là SSOT cao nhất của dự án.)

1. **PROJECT_GOD.md là SSOT của dự án.** Playbook này KHÔNG ghi đè GOD file.
   Khi playbook và GOD file mâu thuẫn: GOD file thắng, và agent phải báo cáo mâu thuẫn đó.
2. **Tính năng gắn nhãn "Đã đăng ký §2.2"** = thuộc scope chính thức của đồ án.
   **"Đề xuất bổ sung"** = best-practice thị trường mà scope chưa có — agent được
   implement khi nó nằm trong Tier MUST của playbook, nhưng phải ghi rõ trong báo cáo
   là phần bổ sung so với §2.2 để nhóm đối chiếu Scope Control (GOD §40).
3. **Tier WOW là vùng cấm tự implement.** Chỉ đề xuất, chờ người duyệt (xem innovation-pool.md).

## Quy trình bắt buộc khi nhận task thuộc một module

### Bước 1 — READ (trước khi viết code)
- Đọc playbook của module tương ứng trong thư mục này.
- Đọc `cross-cutting-gate.md` (áp cho mọi tính năng, không có ngoại lệ).
- Lập danh sách: các tính năng MUST liên quan đến task này. Nếu task được giao
  thiếu một tính năng MUST hiển nhiên (ví dụ: làm màn hình chat mà không có
  trạng thái gửi thất bại/retry), agent phải nêu ra trong plan trước khi code.

### Bước 2 — PLAN
Trong plan, ghi rõ:
- Tính năng MUST nào được implement trong task này, MUST nào chưa (và vì sao).
- Điểm chạm cross-cutting: màn hình nào cần responsive/theme/i18n/parity.

### Bước 3 — IMPLEMENT
- Tuân thủ spec trong playbook: hành vi, trạng thái UI, edge case.
- Tuân thủ cross-cutting gate: không hardcode màu/spacing (dùng design token),
  không hardcode chuỗi giao diện (dùng i18n key), đủ trạng thái
  loading/empty/error/offline cho mọi màn hình/danh sách.

### Bước 4 — SELF-AUDIT (trước khi báo cáo Done)
- Tick checklist ở cuối playbook của module + checklist tổng trong cross-cutting-gate.md.
- Mục nào không đạt: hoặc sửa, hoặc ghi vào "Remaining work" kèm lý do —
  KHÔNG được im lặng bỏ qua.

### Bước 5 — REPORT
Bổ sung vào Implementation Report (định dạng GOD §38) một mục riêng:

```markdown
### Playbook conformance
- Playbook: playbooks/0X-<module>.md
- MUST đã đạt: <liệt kê ID, vd CHT-01..CHT-09>
- MUST chưa đạt / deferred: <ID + lý do>
- Cross-cutting gate: responsive ☐ theme/token ☐ i18n ☐ states ☐ a11y ☐ parity ☐
- Phần "Đề xuất bổ sung" đã implement ngoài §2.2: <liệt kê hoặc "không có">
```

## Bản đồ file

| File | Nội dung |
|---|---|
| `01-account-auth.md` | Đăng ký/đăng nhập/hồ sơ/phiên & bảo mật tài khoản |
| `02-people-and-invitations.md` | Tìm người, người quen từ Circle chung, lời mời vào Circle, chặn/báo cáo |
| `03-circle.md` | Tạo/tham gia/quản lý Circle, vai trò & phân quyền |
| `04-realtime-sharing.md` | Khoảnh khắc realtime, audience theo Circle |
| `05-chat.md` | Tin nhắn nhóm Circle (không có chat 1-1/DM), media, reply, reaction, ghim |
| `06-voice-video.md` | Cuộc gọi WebRTC giữa các thành viên, trạng thái & quyền thiết bị |
| `07-circle-collaboration.md` | Album, ghim nội dung, vị trí, plan, calendar, vote, ẩn danh |
| `08-notification.md` | In-app + push, cài đặt thông báo, deep link |
| `09-admin-moderation.md` | Admin site: dashboard, kiểm duyệt, báo cáo, audit log |
| `cross-cutting-gate.md` | Cổng chất lượng dùng chung cho mọi tính năng |
| `innovation-pool.md` | Kho ý tưởng sáng tạo chờ duyệt (không tự implement) |
| `dod-amendment.md` | Đề xuất mục K DoD (đã chính thức hợp nhất vào GOD §11) |

## Vị trí trong repo CIRCLE

Bộ này nằm tại `agentic/playbooks/` (đi kèm gói circle-agent-kit). File
`AGENTS.md` ở gốc repo đã "nối dây" sẵn: mọi task đụng tới feature đều bắt buộc
đọc playbook của module + `cross-cutting-gate.md` trước khi implement, và báo
cáo phải có mục "Playbook conformance". Nếu muốn Antigravity nạp thêm như một
skill độc lập, đăng ký thư mục này trong `agentic/skills/README.md` — nội dung
chỉ sửa ở MỘT nơi (`agentic/playbooks/`) để tránh lệch phiên bản.
