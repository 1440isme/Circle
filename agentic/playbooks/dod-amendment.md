# ĐỀ XUẤT AMENDMENT — Bổ sung mục K vào Definition of Done (PROJECT_GOD.md §11)

> Trạng thái: **ĐÃ ÁP DỤNG — 2026-10-25.** Đã chính thức hợp nhất vào
> `PROJECT_GOD.md` §11 (mục K) kèm changelog §47 theo chỉ đạo phê duyệt của nhóm.

## Lý do

DoD hiện tại (§11, mục A–J) kiểm tra rất chặt requirement, design, code, test,
security, git, AI, docs, deployment — nhưng không có mục nào kiểm tra các yêu
cầu cross-cutting mà nhóm đặt ra cho mọi tính năng: responsive, theme,
language (i18n) và tính nhất quán mobile/web. NFR-007 mới nêu responsive ở mức
nguyên tắc. Hệ quả thực tế: một tính năng có thể "Done" theo §11 trong khi vẫn
hardcode màu, hardcode chuỗi tiếng Việt, hoặc chỉ làm trên web mà thiếu mobile.

## Nội dung đề xuất — chèn sau mục J (Deployment), trước câu kết của §11

```markdown
## K. Module conformance & cross-cutting UI/UX

-   [ ] Tính năng đối chiếu playbook của module (agentic/playbooks/): các mục
        MUST liên quan đã đạt, mục deferred có lý do ghi trong PR.
-   [ ] Responsive: đã kiểm tại các breakpoint chuẩn của dự án
        (xem cross-cutting-gate.md); không tràn ngang ngoài ý muốn.
-   [ ] Theme: không hardcode màu/spacing ngoài design token; hiển thị đúng
        ở Light và Dark; tương phản đạt WCAG AA cho text chính.
-   [ ] i18n: không hardcode chuỗi giao diện; đủ khóa dịch VI + EN;
        định dạng ngày/giờ/số theo locale.
-   [ ] Trạng thái UI: loading / empty / error / offline / success feedback
        đã xử lý cho các trường hợp áp dụng.
-   [ ] Accessibility cơ bản: nhãn cho nút chỉ có icon, alt text, lỗi form
        gắn với trường nhập; lint a11y không có lỗi serious/critical mới.
-   [ ] Parity: tính năng có mặt trên web và mobile, hoặc ngoại lệ đã được
        ghi trong playbook của module.
-   [ ] Báo cáo của agent/PR có mục "Playbook conformance" (theo SKILL.md
        của bộ playbook) khi AI được dùng để implement.
```

## Dòng changelog mẫu cho §47 của GOD file

```
| <ngày> | Bổ sung DoD §11 mục K — Module conformance & cross-cutting UI/UX,
đối chiếu bộ playbooks (agentic/playbooks/) và cross-cutting gate: responsive,
theme/design token, i18n, trạng thái UI, accessibility, parity web/mobile. |
```

## Ghi chú khi áp dụng

- Mục K không thay thế NFR-007; NFR-007 vẫn là nơi chốt các ngưỡng định lượng
  (breakpoint chính thức, ngân sách hiệu năng) trong SRS/KPI baseline.
- Nếu nhóm quyết định chưa áp dụng toàn bộ mục K ngay, thứ tự ưu tiên khi áp
  dụng từng phần: i18n + theme (rất khó sửa muộn) → trạng thái UI → responsive
  → parity → a11y nâng cao.
