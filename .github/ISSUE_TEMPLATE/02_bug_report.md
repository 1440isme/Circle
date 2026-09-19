---
name: "🐛 Bug Report (Defect)"
about: "Báo cáo lỗi hệ thống theo chuẩn 17 trường thông tin của PROJECT_GOD.md"
title: "[BUG]: "
labels: ["type:bug"]
assignees: ""
---

### 1. Defect Identification
- **Bug ID:** `BUG-<AREA>-<NUM>` (e.g. `BUG-CHAT-001`)
- **Area:** [auth | circles | chat | realtime | media | mobile | web | admin | infra]
- **Severity:** [blocker | critical | major | minor | trivial]
- **Priority:** [P0-Urgent | P1-High | P2-Medium | P3-Low]
- **Environment:** [Local Dev | Staging | Production] (Browser / Device OS)

---

### 2. Defect Description
Tóm tắt ngắn gọn lỗi xuất hiện khi nào và ở màn hình/API nào.

---

### 3. Steps to Reproduce
1. Đi đến '...'
2. Nhấp vào '....'
3. Cuộn xuống '....'
4. Thấy lỗi xuất hiện

---

### 4. Expected vs. Actual Behavior
- **Expected:** Hệ thống phải xử lý ...
- **Actual:** Hệ thống báo lỗi / crash ...

---

### 5. Evidence & Logs
- **Error Stack Trace / Console Log:**
```text
(Dán log lỗi ở đây)
```
- **Network / API Response:**
- **Screenshots / Video:**

---

### 6. Resolution & Regression Test (DoD Check)
- [ ] Root Cause Identified.
- [ ] Automated Regression Test Added: `TC-<AREA>-<NUM>-regression`.
- [ ] Verified locally & in CI.
- [ ] AI Usage logged in `docs/ai-usage/log.md` (nếu có dùng AI để debug).
