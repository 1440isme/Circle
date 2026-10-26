# CIRCLE — Module Playbooks & Cross-Cutting Gate

Bộ tài sản kiến thức cho dự án **CIRCLE** (mạng xã hội theo nhóm — đồ án tốt nghiệp),
dùng để agent (Antigravity/Gemini) và con người cùng làm việc theo một chuẩn chung:

- **Playbook theo module** trả lời câu hỏi: "module này đạt best-practice thì gồm
  những tính năng gì, hành vi ra sao, edge case nào phải xử lý?"
- **Cross-cutting gate** trả lời: "mọi tính năng khi apply phải thoả những điều
  kiện chung nào: responsive, theme, language, mobile/web UI/UX?"
- **Innovation pool** giữ riêng các ý tưởng sáng tạo để duyệt có kiểm soát,
  không phá scope đồ án.

## Triết lý nền tảng — group-first

Mọi playbook trong bộ này tuân theo triết lý chủ dự án đã chốt (2026-10-25):
**mọi tính năng sinh ra vì hoạt động nhóm và tồn tại vì nhóm.** Hệ quả cụ thể:
không có chat 1-1 (chat là chat nhóm của Circle); không có đồ thị bạn bè độc
lập — quan hệ xã hội nằm trong Circle, và người mới gia nhập bằng cách được
**mời thẳng vào Circle**; tạo Circle kèm chọn thành viên phải thật tiện cho
người dùng. PROJECT_GOD.md §2.2 và §11 (mục K) đã được chính thức amendment
đồng bộ ngày 2026-10-25; GOD file là SSOT có thẩm quyền cao nhất của toàn dự án.

## Vì sao có bộ này

PROJECT_GOD.md §2.2 liệt kê scope ở mức gạch đầu dòng — đủ để đăng ký đề tài
nhưng không đủ để implement không sót (ví dụ thực tế: §2.2 Chat không có
"ghim tin nhắn", Account chỉ có 3 dòng so với chuẩn auth của thị trường).
Definition of Done trong GOD file cũng chưa có mục kiểm tra theme/i18n/parity.
Bộ playbook lấp đúng hai khoảng trống đó mà không sửa SSOT: playbook là tài liệu
vận hành chi tiết hoá, GOD file vẫn là văn bản có thẩm quyền cao nhất.

## Cách con người dùng

1. Khi giao việc cho agent, chỉ cần nói module + phạm vi ("làm chat theo playbook,
   hết Tier MUST") thay vì mô tả từng tính năng.
2. Khi review PR: đối chiếu mục "Playbook conformance" trong báo cáo của agent
   và gate checklist.
3. Khi muốn thêm tính năng sáng tạo: chọn từ `innovation-pool.md`, tạo Issue riêng,
   tính năng vẫn đi qua DoR/DoD như thường.

## Cách cập nhật

- Phát hiện best-practice mới hoặc quyết định thay đổi baseline: sửa playbook
  tương ứng, ghi một dòng vào cuối file đó (mục Changelog) kèm ngày + lý do.
- Thay đổi ảnh hưởng scope chính thức: phải cập nhật PROJECT_GOD.md theo quy
  trình thay đổi của GOD file — playbook không tự tuyên bố thay đổi scope.
- Đề xuất bổ sung mục K vào Definition of Done tại `dod-amendment.md`
  đã được nhóm phê duyệt và chính thức chép vào GOD file §11 ngày 2026-10-25.

## Cấu trúc

```
agentic/playbooks/               ← toàn bộ nằm phẳng trong thư mục này
├── README.md                    ← file này
├── SKILL.md                     ← workflow cho agent khi làm feature
├── cross-cutting-gate.md        ← cổng chất lượng dùng chung
├── dod-amendment.md             ← đề xuất bổ sung DoD (chưa áp dụng vào GOD file)
├── innovation-pool.md           ← kho ý tưởng sáng tạo chờ duyệt
├── 01-account-auth.md
├── 02-people-and-invitations.md
├── 03-circle.md
├── 04-realtime-sharing.md
├── 05-chat.md
├── 06-voice-video.md
├── 07-circle-collaboration.md
├── 08-notification.md
└── 09-admin-moderation.md
```

## Quy ước trong playbook

- **Tier MUST** — baseline best-practice: thiếu là module chưa đạt chuẩn.
- **Tier SHOULD** — nên có: làm sau MUST, trước WOW.
- **Tier WOW** — sáng tạo: chỉ implement khi được duyệt (xem innovation-pool).
- **Scope tag** — "Đã đăng ký §2.2" (thuộc scope đồ án) hoặc "Đề xuất bổ sung"
  (best-practice ngoài §2.2, cần đối chiếu Scope Control GOD §40 khi đưa vào làm).
- Mỗi tính năng có ID ổn định (vd `CHT-05`) để trích dẫn trong Issue, PR,
  báo cáo của agent và tài liệu traceability.
