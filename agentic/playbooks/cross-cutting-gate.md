# CROSS-CUTTING GATE — Cổng chất lượng dùng chung cho mọi tính năng CIRCLE

> Áp dụng cho MỌI tính năng, MỌI module, cả web (Next.js) và mobile (React Native).
> Một tính năng chỉ được coi là đạt khi qua được gate này, bên cạnh spec riêng
> trong playbook của module. Gate này là phần kiểm tra được của yêu cầu:
> "responsive — theme — language — mobile/web UI/UX".

---

## 1. Responsive

- Breakpoint chuẩn của dự án (đề xuất, chốt một lần và dùng thống nhất):
  - Mobile: < 768px (web) / màn hình điện thoại (app)
  - Tablet: 768–1023px
  - Desktop: ≥ 1024px; nội dung chính không giãn vô hạn (max-width container theo design).
- Mọi màn hình phải kiểm tra ở 3 mốc: 360px, 768px, 1280px (web) và một máy
  Android cỡ nhỏ + một iPhone (mobile).
- Không tràn ngang (horizontal scroll ngoài ý muốn) ở bất kỳ mốc nào.
- Touch target ≥ 44×44pt (iOS) / 48×48dp (Android) cho mọi phần tử chạm được.
- Bảng/danh sách dày trên desktop phải có dạng thay thế trên mobile (card list),
  không thu nhỏ nguyên bảng.
- Bàn phím ảo mở lên không được che input đang nhập (chat, form).

## 2. Theme & Design Tokens

- Toàn bộ màu, spacing, border-radius, typography đi qua design token
  (CSS variables / theme object dùng chung web + mobile qua Style Dictionary
  hoặc cơ chế tương đương). **Cấm hardcode mã màu hex trong component.**
- Mọi màn hình phải hiển thị đúng ở cả Light và Dark theme: không chữ trắng trên
  nền trắng, không icon "chìm" vào nền, ảnh/avatar có viền hoặc nền đệm khi cần.
- Độ tương phản đạt WCAG AA: ≥ 4.5:1 với chữ thường, ≥ 3:1 với chữ lớn và
  thành phần UI (viền input, icon mang nghĩa).
- Trạng thái tương tác (hover/pressed/disabled/focus) dùng token trạng thái,
  không tự chế màu riêng từng màn hình.
- Kiểm tra bằng máy (khuyến nghị): stylelint + stylelint-declaration-strict-value
  (web) để chặn hardcode; lint tương đương phía React Native nếu có.

## 3. Language — i18n

- **Không hardcode chuỗi giao diện** trong component — mọi text hiển thị đi qua
  i18n key (web: next-intl hoặc i18next; mobile: i18next + react-i18next).
- Ngôn ngữ mặc định: Tiếng Việt; phải có bản English đầy đủ cho mọi key
  (thiếu key ở một ngôn ngữ = chưa đạt gate).
- Ngày/giờ/số đếm format theo locale (Intl.DateTimeFormat / Intl.NumberFormat),
  cấm tự ghép chuỗi kiểu `ngày + "/" + tháng`.
- Số nhiều/giới tính theo cú pháp ICU MessageFormat của thư viện i18n,
  cấm nối chuỗi dịch từng mảnh.
- Kiểm tra tràn chữ với chuỗi dài: bản dịch EN thường dài hơn VI ~20–30% —
  nút/label không được vỡ layout khi đổi ngôn ngữ.
- Nội dung do người dùng tạo (tin nhắn, tên Circle...) không dịch — chỉ dịch
  phần chrome của ứng dụng. Thông báo hệ thống sinh ra từ server cũng phải có
  bản theo ngôn ngữ của người nhận.

## 4. Trạng thái UI (bắt buộc cho mọi màn hình / danh sách / luồng)

Mỗi màn hình hoặc luồng phải xử lý rõ ràng các trạng thái áp dụng được:

- [ ] **Loading** — skeleton hoặc indicator đúng ngữ cảnh (không dùng spinner
      toàn màn hình cho tải từng phần).
- [ ] **Empty** — có minh họa/icon + câu hướng dẫn + CTA khi phù hợp
      (vd danh sách Circle trống → nút "Tạo Circle mới"). Empty state không phải lỗi.
- [ ] **Error** — thông báo hiểu được + nút Thử lại; lỗi mất mạng phân biệt với
      lỗi server; lỗi validation hiển thị tại trường liên quan.
- [ ] **Offline / reconnect** — tính năng realtime (chat, khoảnh khắc, call)
      phải báo trạng thái kết nối và tự phục hồi khi có mạng lại.
- [ ] **Success feedback** — hành động quan trọng (gửi, lưu, xóa, duyệt) có
      phản hồi rõ ràng (toast, cập nhật optimistic kèm rollback khi thất bại).
- [ ] **Permission denied** — bị từ chối quyền (camera, mic, vị trí, thông báo)
      phải có màn hình giải thích + hướng dẫn mở lại trong cài đặt thiết bị.

## 5. Accessibility (mức cơ bản — bắt buộc)

- Mọi nút chỉ có icon phải có nhãn truy cập (aria-label / accessibilityLabel).
- Ảnh nội dung có alt text / mô tả truy cập; ảnh trang trí được đánh dấu trang trí.
- Focus visible khi điều hướng bằng bàn phím (web); thứ tự focus hợp lý.
- Form: label gắn với input, lỗi được đọc bởi screen reader (aria-describedby /
  accessibility hint phía mobile).
- Không truyền đạt thông tin chỉ bằng màu sắc (vd trạng thái "đã xem" cần thêm
  icon/chữ, không chỉ đổi màu).
- Kiểm tra bằng máy: eslint-plugin-jsx-a11y (web), eslint-plugin-react-native-a11y
  (mobile), axe-core trong test/CI — mục tiêu 0 lỗi mức serious/critical.

## 6. Parity Web / Mobile

- Mọi tính năng MUST trong playbook phải tồn tại trên cả web và mobile,
  trừ khi playbook ghi rõ ngoại lệ có chủ đích (vd: chụp khoảnh khắc ưu tiên
  mobile camera; quản trị ưu tiên web).
- Khác biệt có chủ đích phải được ghi vào mục "Platform" của tính năng trong
  playbook — khác biệt không được ghi = khiếm khuyết.
- Quy ước theo nền tảng: mobile ưu tiên gesture (vuốt, kéo thả, long-press) và
  bottom sheet; web ưu tiên hover state, phím tắt cơ bản, context menu.
  Không bê nguyên interaction của nền này sang nền kia.
- Deep link / push notification mở đúng màn hình tương ứng trên cả hai nền.

## 7. Performance (mức sàn)

- Ảnh: tải đúng kích thước hiển thị, lazy-load ngoài khung hình, có placeholder;
  không tải ảnh gốc vài MB vào danh sách.
- Danh sách dài (tin nhắn, feed, thành viên) phải ảo hoá (virtualized list) và
  phân trang / infinite scroll — không render toàn bộ.
- Màn hình chính không bị chặn bởi request không cần thiết; dữ liệu phụ tải sau.
- Realtime: socket có reconnect + heartbeat; không mở nhiều kết nối trùng lặp.
- Ngưỡng gợi ý để làm gate CI: Lighthouse Accessibility ≥ 0.9 (error nếu thấp
  hơn), Performance ở mức warn với ngân sách do nhóm chốt trong NFR-001
  của PROJECT_GOD.md — không tự đặt số đo thay cho baseline của dự án.

## 8. Privacy & Security ở bề mặt UI

- Mọi nội dung thuộc Circle chỉ hiển thị cho thành viên của Circle đó —
  kiểm tra quyền ở API, UI chỉ là lớp trình bày (không "ẩn nút = bảo mật").
- Nội dung riêng tư (vị trí, "điều muốn nói" ẩn danh, khoảnh khắc) phải hiển thị
  rõ cho người dùng biết ai sẽ nhìn thấy TRƯỚC khi họ gửi/đăng.
- Hành động phá huỷ (xoá Circle, xoá tài khoản, thu hồi tin nhắn) luôn có
  bước xác nhận nêu rõ hậu quả.
- Không hiển thị dữ liệu nhạy cảm của người khác (email, số điện thoại,
  vị trí chính xác) ngoài phạm vi tính năng cho phép.

## 9. Radical Minimalism & Contextual Interaction (Triết lý Tối giản & Tương tác Ngữ cảnh)

- **Cắt giảm triệt để text thừa:** Ít text nhất có thể. Không thêm bất kỳ text mô tả, giải thích hiển nhiên hoặc subtitle lặp lại tiêu đề verbatim (ví dụ: đổi mật khẩu không thêm badge khuyên răn; form không lặp lại mô tả cho từng tiêu đề con; empty state chỉ cần icon nhẹ + tiêu đề ngắn gọn, không giải thích dài dòng).
- **Tương tác theo ngữ cảnh:**
  - Web: Hover phần tử hiện các thao tác phụ tinh gọn dạng 3 chấm dọc (`MoreVertical`).
  - Mobile: Tránh popup thô giữa màn hình; dùng tương tác ngữ cảnh (nhấn giữ focus tin nhắn với overlay làm mờ, thanh emoji ở trên, menu hành động ở dưới).
- **Bố cục sạch (Clean Layout):** Tin nhắn ghim đưa lên icon Header (rỗng/fill); không để thanh/badge draft thô kệch; cài đặt âm thanh/hiệu ứng gom vào Circle Settings. Nút hành động ở Light Theme phải có độ tương phản rõ nét với nền.
- **Emoji đồng bộ:** Dùng DUY NHẤT một bộ emoji chuẩn hóa toàn hệ thống; tab phân loại picker chỉ dùng icon, không dùng chữ.

---

## GATE CHECKLIST — Agent tick trước khi báo cáo Done

```
Cross-cutting gate cho tính năng: <tên>
[ ] Responsive: đã kiểm ở 360 / 768 / 1280 (web) hoặc 2 cỡ máy (mobile)
[ ] Theme: không hardcode màu/spacing; hiển thị đúng Light + Dark; contrast AA
[ ] i18n: không hardcode string; đủ key VI + EN; format ngày/số theo locale
[ ] Minimalism: không text thừa/lời khuyên rườm rà; layout tinh gọn, sạch mắt
[ ] States: loading / empty / error / offline / success / permission (phần áp dụng)
[ ] A11y: label cho icon-button, alt text, focus, không truyền tin bằng màu đơn thuần
[ ] Parity: có trên web + mobile, hoặc ngoại lệ đã ghi trong playbook
[ ] Performance: ảnh đúng cỡ + lazy, list ảo hoá/phân trang (phần áp dụng)
[ ] Privacy: kiểm quyền ở API; hiển thị rõ audience trước khi đăng/gửi
```
