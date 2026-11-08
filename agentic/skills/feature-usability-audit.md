# Skill: Feature Usability & UX Audit (Tự Đánh Giá Trải Nghiệm & Độ Hữu Dụng Tính Năng)

> **Tư duy cốt lõi:** Một tính năng không bao giờ được coi là "hoàn thành" chỉ vì code biên dịch được hoặc pass checklist kỹ thuật. Tính năng chỉ thực sự có giá trị khi đặt vào bối cảnh người dùng thực tế: họ có dễ dùng không, có giải quyết được bài toán đời thực của họ không, luồng thao tác có tự nhiên không hay gây ức chế/đứt gãy cảm xúc? AI Agent phải luôn chủ động nhập vai người dùng khó tính nhất trước khi cho phép tuyên bố hoàn thành hoặc chuyển sang tính năng mới.

---

## 🎯 Khi nào sử dụng skill này?

- **Trước khi chuyển sang tính năng / module mới:** Luôn tự phản biện và rà soát lại cụm tính năng vừa làm xem đã đủ độ mượt và hữu ích thực sự cho user chưa.
- **Khi đánh giá một tính năng hiện có:** Tự kiểm toán (self-audit) để phát hiện "tính năng chết", tính năng giả lập (mock/radar ảo thay vì bản đồ thật), hay tính năng bị cô lập trong menu riêng biệt.
- **Khi kỹ sư yêu cầu đánh giá sản phẩm:** Phân tích từ góc nhìn người dùng cuối (End-User UX), chỉ rõ điểm nghẽn và đưa ra giải pháp cải tiến thực chiến.

---

## 🔍 5 Trụ Cột Đánh Giá Trải Nghiệm Thực Tế (5 Usability Audit Pillars)

```
┌────────────────────────────────────────────────────────┐
│ Trụ cột 1: Thử thách Đời thực (Real-life Use Case)     │
├────────────────────────────────────────────────────────┤
│ Trụ cột 2: Liền mạch Luồng Hội thoại (Chat Integration)│
├────────────────────────────────────────────────────────┤
│ Trụ cột 3: Kiểm toán Ma sát & Thao tác (Friction Audit)│
├────────────────────────────────────────────────────────┤
│ Trụ cột 4: Đồng bộ Nhóm Thời gian thực (Group Realtime)│
├────────────────────────────────────────────────────────┤
│ Trụ cột 5: Thẩm mỹ Tinh tế, Chống "AI Slop" & Zero Text│
└────────────────────────────────────────────────────────┘
```

---

### Trụ cột 1: Thử thách Đời thực (Real-life Use Case Test)

- **Câu hỏi then chốt:** Người dùng thực sự mở tính năng này trong hoàn cảnh nào ngoài đời thực? Nó có giải quyết được đúng nhu cầu đó không hay chỉ là hình thức?
- **Tiêu chuẩn kiểm tra:**
  - **Chia sẻ vị trí:** Người dùng mở khi hẹn nhau đi cà phê/đi phượt để xem bạn mình đang ở ngã tư nào, cách mấy km $\rightarrow$ Nếu vẽ radar đồ họa giả lập $\sin/\cos$ mà không có bản đồ thật thì **FAIL** (đẹp mà vô dụng ngoài đời).
  - **Lịch sự kiện:** Người dùng tạo kèo đi ăn thì cần biết ai đi, ai bận $\rightarrow$ Nếu chỉ có ô lịch tháng mà không có nút RSVP (Đi / Bận / Chưa chắc) và danh sách người tham gia thì **FAIL** (lịch chết).
  - **Bảng kế hoạch:** Nhóm đi chơi cần checklist đồ ai mang gì và bảng chia tiền $\rightarrow$ Nếu nhét bảng tính Excel ô thô vào màn hình điện thoại gây tràn viền, chạm nhầm và gõ chữ khó khăn thì **FAIL** (sai bài toán người dùng).

---

### Trụ cột 2: Liền mạch Luồng Hội thoại (Conversational Flow Integration)

- **Câu hỏi then chốt:** Tính năng có gắn liền với "Trái tim" của Circle (luồng Chat) không, hay bị "nhốt trong hộc tủ riêng" (tab Tiện ích riêng)?
- **Tiêu chuẩn kiểm tra:**
  - Mọi nhu cầu cộng tác nhóm đều bắt nguồn từ chat: Muốn bình chọn ăn gì, muốn hẹn giờ đi, muốn gửi vị trí $\rightarrow$ Phải tạo được hoặc chia sẻ được trực tiếp từ thanh công cụ chat (`ChatComposer`).
  - Kết quả tương tác phải hiển thị dưới dạng **Thẻ tương tác trong Chat** (Interactive Message Card) để cả nhóm tương tác 1 chạm ngay trong dòng chat, không bắt người khác phải tự mò sang tab Tiện ích mới xem được.

---

### Trụ cột 3: Kiểm toán Ma sát & Thao tác (Friction & Ergonomics Audit)

- **Số bước để chạm tới giá trị (Clicks/Taps to Value):** Người dùng có phải bấm qua quá nhiều modal/menu để làm một việc đơn giản không? Càng ít bước càng tốt.
- **Trải nghiệm trên Mobile:**
  - Vùng bấm (tap targets) có đạt tối thiểu 44x44 pt không?
  - Dữ liệu dạng bảng có bị tràn ngang (horizontal overflow) gây ức chế trên màn hình dọc không?
  - Trình xem ảnh có hỗ trợ vuốt chuyển ảnh (swipe carousel) và phóng to 2 ngón (pinch-to-zoom) mượt mà không?
  - Bàn phím ảo hiện lên có che mất input hoặc nút submit không?

---

### Trụ cột 4: Đồng bộ Nhóm Thời gian thực (Realtime Group Atmosphere)

- **Câu hỏi then chốt:** Đây là mạng xã hội nhóm — khi một người thao tác, những người khác trong nhóm có cảm nhận được nhịp đập ngay lập tức không?
- **Tiêu chuẩn kiểm tra:**
  - **Bánh xe may mắn:** Cả nhóm có cùng nhìn thấy bánh xe quay và kết quả nảy số realtime không, hay chỉ máy người bấm mới thấy?
  - **Bình chọn:** Thanh phần trăm và avatar người vote có nhảy realtime khi có người vote không?
  - **Vị trí trực tiếp:** Marker bạn bè trên bản đồ có cập nhật mượt mà khi họ di chuyển không?

---

### Trụ cột 5: Thẩm mỹ Tinh tế, Chống "AI Slop" & Zero Hardcode

- **Không text thừa (Radical Minimalism):** Cắt bỏ toàn bộ subtitle lặp lại tiêu đề, badge giải thích hiển nhiên.
- **Thẩm mỹ sang trọng:** Typography sắc nét, khoảng trắng cân đối, viền hairline tinh xảo; cấm emoji sến súa hay icon màu mè rẻ tiền.
- **Zero Hardcoding Invariant:** 100% chuỗi hiển thị đi qua `@circle/shared` (`vi.ts` và `en.ts`).

---

## 📋 Mẫu Báo Cáo Tự Đánh Giá (Audit Report Output)

Khi thực hiện audit một tính năng, Agent xuất báo cáo theo cấu trúc chuẩn:

```markdown
### 1. Bối cảnh Người dùng Thực tế (Real-world User Context)
- Ai dùng, dùng khi nào, và kỳ vọng đạt được kết quả gì?

### 2. Điểm nghẽn & Ma sát Trải nghiệm (Friction & Usability Gaps)
- Liệt kê cụ thể từng điểm gây khó dùng, thiếu thực tế, hoặc đứt gãy luồng.

### 3. Đối chiếu Quy chuẩn Kỹ thuật & Playbook (Playbook & Code Check)
- Chỉ rõ các file Web và Mobile liên quan và mức độ đáp ứng Acceptance Criteria.

### 4. Đề xuất Cải tiến Cụ thể (Actionable Fixes & Priorities)
- **Ưu tiên 1 (Sống còn / Core Value):** ...
- **Ưu tiên 2 (Mượt mà / Ergonomics):** ...
- **Ưu tiên 3 (Cảm xúc nhóm / Delight):** ...
```
