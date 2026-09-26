---
name: "🛠️ Engineering Task / Chore"
about: "Công việc kỹ thuật, refactor, CI/CD, migration, hoặc bảo trì hệ thống"
title: "[TASK]: "
labels: ["type:task"]
assignees: ""
---

### 1. Task Information & Parent Goal
- **Task Key:** `TASK-<AREA>-<NUM>`
- **Parent Goal / Epic:** #<id_issue_tuan> *(Ví dụ: Liên kết tới Weekly Goal Issue #10)*
- **Area:** [auth | circles | chat | realtime | media | mobile | web | admin | infra]
- **Target Iteration:** [Week 01 .. Week 19]

---

### 2. What — Công việc cụ thể cần làm là gì?
Mô tả chi tiết những gì sẽ được thay đổi, refactor, thêm mới hoặc cấu hình.

---

### 3. Why — Tại sao cần làm việc này?
Giải thích lý do kỹ thuật, tính cần thiết hoặc giá trị mang lại cho hệ thống (ví dụ: tối ưu hiệu năng, bảo mật, chuẩn bị hạ tầng cho tính năng mới).

---

### 4. Done When — Tiêu chí hoàn thành (Acceptance Criteria)
Nhiệm vụ này chỉ được coi là hoàn thành (Done) khi:
- [ ] Thay đổi mã nguồn đáp ứng đúng mô tả tại Mục 2.
- [ ] Không gây regression lỗi cũ; tất cả tests pass 100%.
- [ ] Đã mở Pull Request target vào nhánh `dev` và được Peer-Review approve.
- [ ] AI Usage logged vào `docs/ai-usage/log.md` (nếu có sử dụng AI).
