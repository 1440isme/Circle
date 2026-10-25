# INNOVATION POOL — Kho ý tưởng sáng tạo chờ duyệt

> Đây là nơi chứa các tính năng Tier WOW của toàn bộ playbook. Mục đích: ý tưởng
> hay không bị thất lạc, nhưng cũng **không tự chui vào scope**.
> PROJECT_GOD.md có Scope Control (§40) và Hard Gate G9 về tính tương xứng của
> scope — pool này là cơ chế để tôn trọng hai điều đó.

## Quy tắc vận hành

1. **Agent không bao giờ tự implement** một mục trong pool. Kể cả khi đang làm
   đúng module đó và thấy "tiện tay".
2. Quy trình duyệt một ý tưởng:
   `Chọn từ pool → tạo GitHub Issue (label: innovation) → đối chiếu Scope Control
   (GOD §40) → qua Definition of Ready → implement → qua Definition of Done
   (gồm mục K nếu amendment được duyệt)`.
3. Mục có ghi "Điều kiện khi duyệt" (quyết định mở rộng scope, ADR kiến trúc,
   chính sách dữ liệu, cơ chế đồng ý...) phải xử lý điều kiện đó TRƯỚC khi
   vào backlog chính thức.
4. Khi một ý tưởng được duyệt và hoàn thành: đổi Trạng thái thành "Đã làm — <link Issue/PR>"
   ngay trong bảng này để pool luôn phản ánh đúng thực tế.
5. Ý tưởng bị từ chối: giữ lại, ghi lý do ở cột Trạng thái — tránh đề xuất lại
   cùng một ý trong các vòng sau.

## Bảng tổng hợp (24 ý tưởng)

| ID | Ý tưởng | Module | Giá trị chính | Effort | Điều kiện khi duyệt | Trạng thái |
|---|---|---|---|---|---|---|
| ACC-W01 | Đăng nhập bằng Passkey (WebAuthn) | Account | Bỏ mật khẩu, chống phishing, trải nghiệm hiện đại | L | Đánh giá hỗ trợ thiết bị của nhóm người dùng thử nghiệm | Chờ duyệt |
| ACC-W02 | Hồ sơ theo từng Circle | Account | Mỗi Circle thấy một "phiên bản" khác nhau của người dùng (tên hiển thị, avatar) | M | Rà soát hệ quả lên tìm người & moderation | Chờ duyệt |
| ACC-W03 | Đăng nhập QR từ thiết bị đã xác thực | Account | Đăng nhập web nhanh từ điện thoại, không gõ mật khẩu | M | — | Chờ duyệt |
| PPL-W01 | QR mời vào Circle khi gặp trực tiếp | People & Invitations | Quét QR là tới thẳng màn hình chấp nhận lời mời vào Circle — không qua bước kết bạn | S | — | Chờ duyệt |
| PPL-W02 | Gợi ý lập Circle mới từ nhóm hay tương tác | People & Invitations | Nhóm người quen hay hoạt động chung mà chưa có Circle riêng → gợi ý tạo trong 1 chạm | M | Tôn trọng cài đặt gợi ý/riêng tư của từng người được gợi ý | Chờ duyệt |
| PPL-W03 | Kỷ niệm ngày vào Circle chung đầu tiên | People & Invitations | "Ngày này năm trước, bạn và X cùng vào Circle Y" — cảm xúc, đúng chất nhóm | S | Dùng cơ chế Notification, không tự gửi push riêng | Chờ duyệt |
| CIR-W01 | Circle Wrapped | Circle | Tổng kết kỷ niệm nhóm theo kỳ, giàu cảm xúc khi demo | M | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| CIR-W02 | Theme riêng cho từng Circle | Circle | Cá tính riêng cho từng nhóm, vẫn trong hệ design token | M | Theme phải qua cross-cutting gate (contrast AA cả 2 mode) | Chờ duyệt |
| CIR-W03 | "Ngày này trong Circle" | Circle | Khơi lại kỷ niệm cũ của nhóm | S | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| MOM-W01 | Recap tuần "Khoảnh khắc của tuần" | Khoảnh khắc | Nghi thức nhìn lại chung cuối tuần cho từng Circle | M | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| MOM-W02 | Streak theo Circle | Khoảnh khắc | Động lực duy trì thói quen chia sẻ theo nhóm | M | Bắt buộc có cơ chế "đóng băng" chuỗi để tránh tạo áp lực | Chờ duyệt |
| MOM-W03 | "Ngày này năm xưa" | Khoảnh khắc | Khai thác giá trị lưu trữ, tương tác hoài niệm | S | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| CHT-W01 | Poll nhanh trong chat | Chat | Ra quyết định nhóm ngay trong hội thoại | M | Đối chiếu với Vote của playbook 07 — không làm 2 hệ poll rời nhau | Chờ duyệt |
| CHT-W02 | Tóm tắt hội thoại dài bằng AI | Chat | Bắt kịp hàng trăm tin chưa đọc; điểm khác biệt khi demo | L | Chính sách dữ liệu khi gửi nội dung cho dịch vụ AI; chỉ chạy khi user chủ động bấm | Chờ duyệt |
| CHT-W03 | Dịch tin nhắn tại chỗ | Chat | Nhóm đa ngôn ngữ trao đổi liền mạch | M | Chọn dịch vụ dịch + chính sách dữ liệu | Chờ duyệt |
| CAL-W01 | Gọi nhóm nhỏ trong Circle | Voice/Video | Nhu cầu tự nhiên của nhóm thân thiết; điểm demo mạnh | L | **Ngoài scope §2.2** — cần quyết định mở rộng scope + ADR (SFU, TURN scale) | Chờ duyệt |
| CAL-W02 | Phụ đề trực tiếp & tóm tắt cuộc gọi | Voice/Video | Hỗ trợ nghe kém/ồn; biến cuộc gọi thành tri thức tra cứu | L | Cơ chế đồng ý của cả hai phía + chính sách lưu transcript | Chờ duyệt |
| COL-W01 | Circle Recap cuối tháng | Collaboration | Tổng kết hoạt động nhóm định kỳ | M | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| COL-W02 | Gợi ý plan bằng AI theo lịch rảnh chung | Collaboration | Đề xuất hoạt động + khung giờ hợp cả nhóm | L | Cần dữ liệu lịch đủ dày; chính sách dữ liệu AI | Chờ duyệt |
| COL-W03 | Chuỗi kỷ niệm "ngày này năm trước" | Collaboration | Nhắc lại sự kiện/khoảnh khắc cũ đúng ngày | S | Xem lưu ý trùng lặp bên dưới | Chờ duyệt |
| NOT-W01 | Tóm tắt thông minh buổi sáng bằng AI | Notification | Một bản digest thay cho nhiều push rời | M | Chính sách dữ liệu AI; tôn trọng quiet hours | Chờ duyệt |
| NOT-W02 | Độ ưu tiên học theo hành vi | Notification | Thông báo quan trọng nổi lên, phần còn lại lặng xuống | L | Cần dữ liệu hành vi đủ lớn — cân nhắc sau khi có người dùng thật | Chờ duyệt |
| ADM-W01 | Gợi ý ưu tiên hàng đợi báo cáo | Admin | Xử lý vụ nghiêm trọng trước, giảm thời gian chờ | M | Chỉ gợi ý thứ tự — quyết định xử lý luôn là của người | Chờ duyệt |
| ADM-W02 | Tóm tắt vụ việc bằng AI | Admin | Admin nắm bối cảnh vụ báo cáo nhanh hơn | M | Nội dung UGC gửi cho dịch vụ AI phải theo chính sách dữ liệu | Chờ duyệt |

## Lưu ý trùng lặp — đọc trước khi duyệt

Hai họ ý tưởng xuất hiện ở nhiều module vì mỗi playbook được viết độc lập.
Khi duyệt, **chọn một nơi làm chủ** và các module khác chỉ liên kết tới,
tránh implement 2–3 lần:

- **Họ "Recap/Wrapped":** CIR-W01, MOM-W01, COL-W01 — bản chất là một tính năng
  "tổng kết kỷ niệm Circle" dùng chung dữ liệu (khoảnh khắc + sự kiện + hoạt động).
  Đề xuất: làm một lần, đặt ở Circle, hai module còn lại chỉ là nguồn dữ liệu/điểm vào.
- **Họ "Ngày này...":** CIR-W03, MOM-W03, COL-W03 — cùng một cơ chế gợi lại nội
  dung cũ theo ngày. Đề xuất: một job gợi nhớ chung, hiển thị ở feed Circle.
- **Họ "Poll":** CHT-W01 (poll trong chat) và Vote ở playbook 07 (poll cấp Circle)
  nên dùng chung một model dữ liệu poll; khác nhau chỉ ở bề mặt hiển thị.

## Gợi ý thứ tự xem xét (nếu nhóm muốn chọn vài ý cho demo)

Nhóm Effort S, giá trị cảm xúc cao, ít rủi ro scope: PPL-W01, PPL-W03,
họ "Ngày này..." (làm một lần). Nhóm "điểm nhấn demo": CHT-W02, CAL-W01
(nhưng CAL-W01 đụng scope — cân nhắc kỹ với G9), họ "Recap/Wrapped" (làm một lần).
