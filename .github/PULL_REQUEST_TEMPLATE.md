## 1. What — Nội dung thay đổi là gì?
- **Related Issue:** Closes #<issue_id> *(Bắt buộc đi kèm Issue, e.g. Closes #12)*
- **Tóm tắt thay đổi:**
  - 
  - 
  - 

---

## 2. Why — Tại sao thực hiện thay đổi này?
- Giải thích lý do kỹ thuật, nghiệp vụ hoặc căn cứ lựa chọn giải pháp này thay vì các phương án khác.

---

## 3. Done When — Tiêu chí hoàn thành & Kiểm chứng (Verification)
- [ ] Mã nguồn đáp ứng đúng Acceptance Criteria / DoD trong Issue #<issue_id>.
- [ ] Unit tests pass 100% (`npm test`).
- [ ] Integration / API tests pass.
- [ ] Kiểm tra giao diện / luồng nghiệp vụ thủ công đã hoạt động đúng.
*(Dán câu lệnh kiểm thử, kết quả terminal hoặc hình ảnh/video demo minh chứng tại đây)*

---

## 4. Target Environment Check
- [ ] Nhánh đích (Base branch) là **`dev`** (Staging/Integration), **TUYỆT ĐỐI KHÔNG merge trực tiếp vào `main`**.

---

## 5. Architectural & Documentation Impact
- [ ] Có cập nhật sơ đồ hoặc tài liệu đặc tả trong `docs/` không?
- [ ] Có thêm route mới cần cập nhật [`.agents/SITEMAP.md`](.agents/SITEMAP.md) không?

---

## 6. AI Usage Declaration (Hard Gate G3)
- [ ] **Có sử dụng AI** — Đã liên kết bản ghi `AI-XXXX` tại [`docs/ai-usage/log.md`](docs/ai-usage/log.md)
- [ ] **Không sử dụng AI**

---

## 7. 🛡️ Mandatory Peer Review Check (Rubric Level 5 — Inviolable)
> [!CAUTION]
> **LUẬT BẤT BIẾN:** Tuyệt đối cấm tự merge (No Self-Merge). PR phải được thành viên còn lại review và comment/approve mới được merge.
- [ ] Tác giả PR không tự bấm merge.
- [ ] Người review (**Bình ↔ Hạnh**) đã kiểm tra code, xác nhận pass test, không có secret/credential và chính thức **Approve**.
