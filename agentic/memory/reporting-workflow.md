# Dual-Track Weekly Reporting Workflow

> **Durable Memory & Project Convention:** Quy định quy trình làm báo cáo tiến độ kép (Dual-Track Reporting) dành cho kỹ sư (**Trương Công Bình**, **Ninh Thị Mỹ Hạnh**) và các AI Agent hỗ trợ (Antigravity IDE, Claude Code, Cursor,...).

---

## 1. Bối cảnh & Độ lệch Timeline (Timeline Offset)

* **Lịch trình thực tế dự án (Engineering & GVHD Track):**
  * Nhóm bắt đầu thực hiện đề tài từ **17/08/2026** (kế hoạch 15 tuần).
  * Hiện tại (tháng 10/2026), nhóm đã hoàn thành đến **Tuần 8** (Module 5 Moments & Module 6 WebRTC Call).
* **Lịch trình Chủ nhiệm Khoa (Faculty Track):**
  * Chủ nhiệm Khoa công bố kế hoạch muộn hơn 4 tuần so với thời điểm nhóm khởi động.
  * Do đó, **tiến độ thực tế của nhóm đi trước track của Khoa đúng 4 tuần**.
  * **Quy đổi thời điểm:** Khi nhóm ở **Tuần 8 thực tế**, đối với Khoa chỉ mới tương ứng **Tuần 4**.
  * Sinh viên sẽ lấy báo cáo Tuần 4 (`W04.md`) để nộp cho Khoa, các tuần tiếp theo sẽ lấy dần các file từ `W05.md` trở đi để nộp theo đúng tiến độ của Khoa.

---

## 2. Hai luồng báo cáo riêng biệt (Two Distinct Report Tracks)

### Luồng 1: Báo cáo cho Giảng viên hướng dẫn (ThS. Nguyễn Trần Thi Văn)
* **Chu kỳ:** 2 tuần / lần.
* **Tập tin lưu trữ:** [`docs/BaocaoTuan.md`](../../docs/BaocaoTuan.md)
* **Cấu trúc:** Đầy đủ **5 mục**:
  1. Những việc đã làm được
  2. Những việc chưa làm được
  3. Những vướng mắc, khó khăn
  4. Câu hỏi (nếu có)
  5. Những việc sẽ làm trong 2 tuần tiếp

### Luồng 2: Báo cáo nộp cho Chủ nhiệm Khoa (Faculty Submission)
* **Chu kỳ:** Từng tuần một (`W01.md`, `W02.md`, ..., `W19.md`).
* **Thư mục lưu trữ:** [`docs/evidence/weekly-reports/`](../../docs/evidence/weekly-reports/) (thỏa mãn Hard Gate G2 trong Issue [#13](https://github.com/1440isme/Circle/issues/13)).
* **Cấu trúc:** Gồm 4 mục chính (**TUYỆT ĐỐI KHÔNG CÓ MỤC 5**), và **kể từ Tuần 4 trở đi** bổ sung thêm phần **Khai báo sử dụng AI/LLM**:
  1. Những việc đã làm được
  2. Những việc chưa làm được
  3. Những vướng mắc, khó khăn
  4. Câu hỏi (nếu có)
  5. *(Từ Tuần 4)* **Khai báo sử dụng AI/LLM:**
     - Bạn có dùng LLM/AI code/AI agent hỗ trợ công việc tuần này không? [x] Có / [ ] Không
     - Khai báo từng công cụ AI đã dùng (Công cụ, Phiên bản/Model, Prompt đã dùng, Nội dung AI tạo ra, Phần sinh viên đã sửa/hoàn thiện).
* **Phong cách hành văn:**
  * Viết ngắn gọn, súc tích, phản ánh kết quả chung của cả nhóm.
  * **Không phân chia chi tiết ai làm gì** (viết ở góc độ kết quả toàn dự án).

---

## 3. Quy trình tự động hóa định kỳ (Bi-weekly Automation Process)

Cứ mỗi chu kỳ 2 tuần (kết thúc các tuần chẵn W06, W08, W10, W12, W14):
1. **Bước 1:** Soạn thảo báo cáo 2 tuần tổng hợp (có đủ 5 mục) ghi vào [`docs/BaocaoTuan.md`](../../docs/BaocaoTuan.md) cho GVHD.
2. **Bước 2:** Bóc tách tiến độ của 2 tuần đó thành 2 file báo cáo tuần độc lập (`W{2k-1}.md` và `W{2k}.md`), loại bỏ mục 5, bổ sung thông tin khai báo AI usage (đối chiếu từ `docs/ai-usage/log.md`), lưu vào thư mục [`docs/evidence/weekly-reports/`](../../docs/evidence/weekly-reports/) để sẵn sàng nộp cho Khoa theo track nộp bài.
