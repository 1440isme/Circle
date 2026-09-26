---
name: "🎯 Weekly Goal / Epic (Mục tiêu tuần)"
about: "Issue lớn theo kế hoạch thực hiện từng tuần của TLCN, chứa các sub-issues con"
title: "[GOAL-WXX]: "
labels: ["type:epic", "status:in-planning"]
assignees: ""
---

### 1. Thông tin Mục tiêu Tuần (Weekly Milestone Info)
- **Mốc thời gian (Timeline):** Tuần `W<XX>` (Từ ngày `DD/MM` đến `DD/MM/2026`)
- **Theo Kế hoạch TLCN:** [`docs/Ke hoach thuc hien TLCN .md`](../../docs/Ke%20hoach%20thuc%20hien%20TLCN%20.md)
- **Người chịu trách nhiệm chính:** [Bình / Hạnh / Cả hai]
- **Target Area:** [auth | circles | chat | realtime | media | mobile | web | admin | infra]

---

### 2. What — Mục tiêu cần đạt được trong tuần là gì?
Mô tả rõ ràng sản phẩm / tính năng dự kiến phải xuất xưởng trong tuần này (ví dụ: Hoàn thiện Backend Foundation & Auth API; hoặc Hoàn thành Quản lý Circle và Chat 1-1 realtime).

---

### 3. Why — Tại sao mục tiêu này quan trọng?
Giải thích giá trị của cột mốc này đối với tiến độ tổng thể của đề tài, các Hard Gates hoặc các tiêu chí Rubric Level 5 cần đáp ứng.

---

### 4. Sub-issues / Tasks Breakdown (Danh sách các việc con)
Mỗi mục dưới đây tương ứng với 1 sub-issue độc lập (mở issue con, rẽ nhánh và tạo PR riêng merge vào `dev`):
- [ ] #<issue_id_1> — [FEAT]: ...
- [ ] #<issue_id_2> — [FEAT]: ...
- [ ] #<issue_id_3> — [TASK]: ...
- [ ] #<issue_id_4> — [TEST]: ...

---

### 5. Done When — Tiêu chí Nghiệm thu Tuần (Weekly DoD)
Issue lớn này CHỈ ĐƯỢC PHÉP ĐÓNG khi tất cả các điều kiện sau được thỏa mãn:
- [ ] Tất cả sub-issues ở Mục 4 đã được giải quyết và PR tương ứng đã được Peer-Review merge vào `dev`.
- [ ] Kiểm thử tự động (Unit / API) chạy pass 100% trên `dev`.
- [ ] Báo cáo tuần `docs/evidence/weekly-reports/W<XX>.md` đã được hoàn thành và cập nhật.
- [ ] Toàn bộ nhật ký AI liên quan đã được tự động ghi nhận vào `docs/ai-usage/log.md`.
