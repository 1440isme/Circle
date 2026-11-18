# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 06
# BÁO CÁO TỔNG KẾT VÀ BẢN CAM KẾT SỬ DỤNG TRÍ TUỆ NHÂN TẠO (LLM / AGENTIC AI)

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **22:32 ngày 08/12/2026**  
> **Tiêu chí đánh giá:** Làm chủ và kiểm soát việc sử dụng LLM / Agentic AI. Nhật ký đầy đủ các prompt đã sử dụng, chứng minh năng lực hiểu và giải thích 100% mã nguồn.

---

## 1. NGUYÊN TẮC QUẢN TRỊ VÀ LÀM CHỦ TRÍ TUỆ NHÂN TẠO (AI GOVERNANCE)

Trong quá trình thực hiện đề tài **CIRCLE**, nhóm sinh viên ứng dụng các mô hình ngôn ngữ lớn (LLM) và các trợ lý lập trình thông minh (Claude Code, Antigravity, Gemini Pro/Flash) như **một công cụ hỗ trợ tăng tốc kỹ thuật (Productivity Multiplier)**, tương tự như việc sử dụng IDE hay thư viện nguồn mở. 

Để bảo đảm tính liêm chính học thuật và đạt chuẩn **Level 5 ở tiêu chí TC2.3**, nhóm thiết lập và tuân thủ nghiêm ngặt 4 nguyên tắc:
1. **Làm chủ mã nguồn 100% (Human-in-the-loop Mastery):** Sinh viên chịu trách nhiệm tối thượng về mọi dòng mã được đưa vào hệ thống. Tuyệt đối không chấp nhận bất kỳ đoạn mã nào do AI sinh ra nếu sinh viên không hiểu rõ logic, không giải thích được cơ chế hoạt động và không chứng minh được tính an toàn.
2. **Minh bạch hóa tuyệt đối (Comprehensive Traceability):** Mọi phiên làm việc có sự trợ giúp của AI đều được ghi vết tự động thành một mã định danh nhật ký duy nhất (`AI-0001` đến `AI-0198+`) lưu tại [`docs/ai-usage/log.md`](../ai-usage/log.md), liên kết chính xác với từng mã commit hash và Pull Request tương ứng trên GitHub.
3. **Quy trình thẩm định 11 bước (11-Point Verification Checklist):** Không bao giờ tin tưởng mù quáng vào kết quả do AI đề xuất. Mọi đoạn mã sinh ra đều phải trải qua quy trình rà soát bảo mật, kiểm thử cú pháp, chạy kiểm thử hồi quy và đối soát kiến trúc.
4. **Phát hiện và đính chính ảo giác (Active Hallucination Elimination):** Chủ động nhận diện các lỗi sai kinh điển của AI (bịa đặt API, rò rỉ khóa bí mật, vi phạm kiến trúc) và ghi nhận bài học kinh nghiệm xử lý.

---

## 2. QUY TRÌNH THẨM ĐỊNH MÃ NGUỒN DO AI SINH RA (AI REVIEW CHECKLIST)

Trước khi chấp nhận bất kỳ mã nguồn nào từ công cụ AI vào nhánh làm việc, sinh viên phải tự mình tích kiểm tra 11 tiêu chí:

```
[ ] 1. Tính có căn cứ: Lời khẳng định của AI có được xác nhận bởi tài liệu chính thức (Official Docs) không?
[ ] 2. Tính tương thích phiên bản: Thư viện/API ở phiên bản hiện tại của dự án có hỗ trợ tính năng này không?
[ ] 3. Tính biên dịch: Mã nguồn có biên dịch thành công (TypeScript compile) không?
[ ] 4. Kiểm thử tự động: Mã nguồn có vượt qua toàn bộ Unit/Integration tests hiện hữu không?
[ ] 5. Tiêu chuẩn nghiệm thu: Mã nguồn có thỏa mãn chính xác Acceptance Criteria trong SRS không?
[ ] 6. An toàn thông tin: Đoạn mã có mở ra lỗ hổng bảo mật nào không (SQL Injection, XSS, SSRF, IDOR)?
[ ] 7. Quét rò rỉ bí mật: Tuyệt đối không để lộ mật khẩu, API token, secret keys vào mã nguồn?
[ ] 8. Giấy phép bản quyền: Thư viện do AI đề xuất có tuân thủ giấy phép nguồn mở (MIT/Apache 2.0) không?
[ ] 9. Tái sử dụng trừu tượng: Đoạn mã có trùng lặp với các hàm tiện ích đã có sẵn trong dự án không?
[ ] 10. Khả năng giải thích: Sinh viên có thể đứng trước Hội đồng để giải thích cặn kẽ từng dòng lệnh không?
[ ] 11. Tính nhất quán kiến trúc: Thiết kế có tuân thủ đúng SRS, SDD và các quyết định kiến trúc (ADR) không?
```

---

## 3. THỐNG KÊ NHẬT KÝ SỬ DỤNG AI (AI USAGE LOG SUMMARY)

Toàn bộ nhật ký chi tiết được lưu trữ có hệ thống tại file [`docs/ai-usage/log.md`](../ai-usage/log.md). Dưới đây là bảng tổng hợp các chỉ số:

- **Tổng số phiên làm việc được ghi nhận:** **198+ mục nhật ký (`AI-0001` $\rightarrow$ `AI-0198`)**.
- **Các công cụ và mô hình sử dụng:**
  - *Claude 3.5 Sonnet / Claude Code:* Phân tích kiến trúc, rà soát logic kiểm thử E2E Playwright và tái cấu trúc mã nguồn.
  - *Gemini 1.5 Pro / Antigravity IDE:* Hỗ trợ sinh mã boilerplate, định nghĩa TypeScript types và tối ưu hóa CSS/Tailwind.
- **Tỷ lệ mã nguồn sinh bởi AI vs Chỉnh sửa bởi sinh viên:**
  - Mã khởi tạo ban đầu do AI sinh (Boilerplate/Types/Docs): ~35%.
  - Mã logic nghiệp vụ, sửa lỗi, bảo mật và tinh chỉnh giao diện do sinh viên trực tiếp viết/chỉnh sửa: ~65%.
- **Khả năng giải thích độc lập:** Nhóm cam kết **giải thích được 100% tại bất kỳ vị trí mã nguồn nào** mà Hội đồng chọn ngẫu nhiên trong buổi bảo vệ.

---

## 4. DANH SÁCH 5 LỖI ẢO GIÁC ĐIỂN HÌNH CỦA AI VÀ CÁCH KHẮC PHỤC CỦA SINH VIÊN

Nhằm chứng minh năng lực làm chủ và không phụ thuộc thụ động vào AI, dưới đây là 5 trường hợp AI phát sinh lỗi logic/ảo giác nghiêm trọng được sinh viên phát hiện, bác bỏ và tự tay sửa đổi:

| STT | Mã nhật ký | Tình huống & Ảo giác / Sai sót của AI | Nguy cơ kỹ thuật nếu không phát hiện | Cách sinh viên xử lý & Commit sửa lỗi |
| :---: | :---: | :--- | :--- | :--- |
| **01** | `AI-0042` | **Ảo giác API NestJS WebSockets:** AI đề xuất dùng decorator `@ConnectedSocket()` kết hợp lấy session từ HTTP request trong Socket.IO Gateway. | Kết nối Socket bị sập khi client gửi tin nhắn vì giao thức WebSocket không mang HTTP session truyền thống. | Sinh viên phát hiện lỗi, tái cấu trúc việc trích xuất JWT từ `client.handshake.auth.token` và gán vào socket context độc lập. *(Commit `d8a2...`)* |
| **02** | `AI-0087` | **Vi phạm nguyên tắc "Group-First":** Khi được yêu cầu viết tính năng chia sẻ, AI tự ý tạo thêm endpoint `createDirectChat(userA, userB)` cho phép chat 1-1 riêng lẻ. | Phá vỡ triết lý cốt lõi của đề tài CIRCLE (chỉ cho phép hội thoại bên trong Circle). | Sinh viên ngay lập tức từ chối mã nguồn, xóa bỏ bảng DM và buộc luồng trao đổi phải gắn chặt với `circle_id`. *(PR #105)* |
| **03** | `AI-0114` | **Sử dụng thư viện không còn duy trì trên Expo:** AI đề xuất cài đặt `react-native-webrtc-shim-deprecated` không tương thích với Expo SDK 51/52. | Ứng dụng di động bị crash ngay khi khởi động (Build time error). | Sinh viên tra cứu tài liệu chính thức của Expo, thay thế bằng giải pháp native WebRTC tương thích với Development Build. *(Commit `b71c...`)* |
| **04** | `AI-0142` | **Lỗi CORS khi gọi API Geocoding ngoài trình duyệt:** AI viết code gọi thẳng dịch vụ Mapbox Geocoding từ trình duyệt client với secret token. | Lộ Secret Token của Mapbox trên môi trường web client và bị trình duyệt chặn CORS. | Sinh viên hủy bỏ đoạn mã này, chuyển sang xây dựng một API Proxy Controller trên NestJS backend để bảo vệ secret token. *(PR #119)* |
| **05** | `AI-0186` | **Quên bóc tách danh tính người dùng trong bài viết ẩn danh:** AI sinh mã lưu `author_id` vào bảng `AnonymousPost` với lý do "để tiện truy vấn sau này". | Vi phạm nghiêm trọng quyền riêng tư của tính năng "Điều muốn nói", danh tính người gửi có thể bị lộ qua API inspect. | Sinh viên phát hiện lỗ hổng, sửa schema DB loại bỏ vĩnh viễn trường `author_id`, chỉ giữ lại nội dung bài viết và nhãn thời gian. *(PR #120)* |

---

## 5. BẢN CAM KẾT LIÊM CHÍNH HỌC THUẬT (ACADEMIC INTEGRITY COMMITMENT)

Nhóm sinh viên Trương Công Bình và Ninh Thị Mỹ Hạnh xin cam kết trước Nhà trường, Khoa Công nghệ Thông tin và Hội đồng đánh giá:

1. Việc sử dụng các công cụ Trí tuệ nhân tạo (LLM / Agentic AI) hoàn toàn mang tính chất hỗ trợ kỹ thuật và đã được khai báo minh bạch 100% trong Nhật ký sử dụng AI.
2. Toàn bộ kiến trúc hệ thống, quy trình nghiệp vụ, giải pháp thiết kế cơ sở dữ liệu và các kết luận nghiên cứu là sản phẩm trí tuệ và sự lao động nghiêm túc của hai sinh viên dưới sự định hướng của GVHD.
3. Sinh viên làm chủ 100% mã nguồn, cam kết trả lời lưu loát và bảo vệ thành công mọi câu hỏi chất vấn chuyên môn của Hội đồng phản biện.

*Ngày 18 tháng 11 năm 2026*

| GIẢNG VIÊN HƯỚNG DẪN | TRƯỞNG NHÓM SINH VIÊN | THÀNH VIÊN SINH VIÊN |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Nguyễn Trần Thi Văn** | <br><br><br>**Trương Công Bình**<br>MSSV: 23110184 | <br><br><br>**Ninh Thị Mỹ Hạnh**<br>MSSV: 23110210 |
