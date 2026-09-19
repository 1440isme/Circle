---
name: "🚀 Feature Request (User Story)"
about: "Đề xuất tính năng mới theo chuẩn User Story, Acceptance Criteria và Traceability Keys"
title: "[FEAT]: "
labels: ["type:feature"]
assignees: ""
---

### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-<AREA>-<NUM>` (e.g. `US-AUTH-001`)
- **Parent Epic:** `EPIC-<AREA>` (e.g. `EPIC-AUTH`)
- **Capability ID:** `CAP-<CLUSTER>-<NUM>` (e.g. `CAP-AUTH-01`)
- **Target Area:** [auth | circles | chat | realtime | media | mobile | web | admin | infra]
- **Rubric Criterion:** [TC1 | TC2.1 | TC2.2 | TC2.3 | TC2.4 | TC2.5 | TC3 | TC4 | TC5]

---

### 2. User Story Statement
**Là một:** `<Actor: guest / user / member / admin>`  
**Tôi muốn:** `<Hành động trong UI/Hệ thống>`  
**Để:** `<Giá trị mang lại cho người dùng>`  

---

### 3. Acceptance Criteria (DoD Requirement)
- [ ] `AC-<US_ID>-01`: Khi `<Actor>` `<hành động>` tại `<Vị trí/URL>`, họ nhận được `<Kết quả mong đợi>`.
- [ ] `AC-<US_ID>-02`: Khi `<Actor>` nhập sai hoặc không đủ quyền, họ thấy `<Thông báo lỗi rõ ràng>`.
- [ ] `AC-<US_ID>-03`: Kiểm thử tự động `TC-<AREA>-<NUM>` đã được viết và pass 100%.

---

### 4. Business Rules & Constraints
- **Business Rule:** `BR-<AREA>-<NUM>`
- **Non-Functional Requirement (NFR):** Latency < ...ms, Mobile responsiveness, etc.

---

### 5. AI Usage Declaration
- [ ] Tôi cam kết nếu có dùng AI để code tính năng này, tôi sẽ đảm bảo AI tự động ghi nhận vào `docs/ai-usage/log.md` (AI-XXXX).
