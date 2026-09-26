# CIRCLE — BỘ CHỈ SỐ ĐÁNH GIÁ VÀ MỐC THAM CHIẾU (KPI & BASELINE)

> **Mục tiêu tài liệu:** Thiết lập cam kết định lượng (Quantitative KPI Commitments) và mốc tham chiếu chuẩn ban đầu (Baseline) phục vụ thẩm định đề tài tốt nghiệp CIRCLE theo chuẩn Rubric Level 5 (TC1 — Nghiên cứu & Thiết lập mục tiêu khoa học, Hard Gate G1, G3).
> 
> **Cam kết nguyên tắc:** 
> 1. Tối thiểu 5 chỉ số KPI định lượng được chốt trước mốc đánh giá giữa kỳ (50%).
> 2. Các chỉ số được lựa chọn theo nguyên tắc: **Thực tế – Dễ đo lường – Bằng chứng khách quan – Đảm bảo tính khả thi cao**.
> 3. Không tùy tiện thay đổi định nghĩa KPI sau khi đã đo lường nhằm làm đẹp số liệu.

---

## 1. TỔNG QUAN BẢNG THEO DÕI 5 CHỈ SỐ KPI CỐT LÕI

| KPI ID | Tên chỉ số | Phân loại | Baseline (Mốc ban đầu) | Target (Mục tiêu cam kết) | Công cụ / Phương pháp đo | Người phụ trách |
|---|---|---|:---:|:---:|---|---|
| **KPI-01** | Tỷ lệ hoàn thành tác vụ cốt lõi (*TCR*) | Trải nghiệm & Nghiệp vụ | **65.0%** *(Quy trình rời rạc)* | $\ge$ **90.0%** | Quan sát thử nghiệm 10 người dùng thực tế | Trương Công Bình |
| **KPI-02** | Điểm độ khả dụng hệ thống (*SUS Score*) | Trải nghiệm người dùng | **68.0/100** *(Industry Benchmark)* | $\ge$ **75.0/100** *(Grade B+)* | Khảo sát 10 câu hỏi chuẩn quốc tế System Usability Scale | Ninh Thị Mỹ Hạnh |
| **KPI-03** | Thời gian phản hồi API trung bình (*Latency*) | Hiệu năng hệ thống | **220 ms** *(Unoptimized / No Cache)* | $\le$ **80 ms** *(Có Redis Cache)* | Benchmark tự động bằng `autocannon` / Postman Runner | Trương Công Bình |
| **KPI-04** | Tỷ lệ gửi nhận tin nhắn realtime (*Delivery*) | Độ tin cậy thời gian thực | **91.0%** *(Mạng chập chờn / No ACK)* | $\ge$ **99.0%** *(Socket ACK Queue)* | Test script giả lập Socket client & Server Log | Trương Công Bình |
| **KPI-05** | Độ bao phủ kiểm thử tự động (*Test Coverage*) | Chất lượng mã nguồn | **15.0%** *(Sprint 1 Baseline)* | $\ge$ **70.0%** *(Business Services)* | Jest Coverage Report (`npm run test:cov`) | Ninh Thị Mỹ Hạnh |

---

## 2. ĐẶC TẢ CHI TIẾT TỪNG CHỈ SỐ THEO CHUẨN PROJECT_GOD.md

### KPI-01: Tỷ lệ hoàn thành tác vụ cốt lõi (Core Task Completion Rate - TCR)

* **KPI ID:** `KPI-01`
* **Definition (Định nghĩa):** Tỷ lệ phần trăm người dùng mục tiêu hoàn thành thành công kịch bản luồng thao tác cốt lõi gồm 3 bước: (1) Đăng ký/đăng nhập tài khoản, (2) Khởi tạo một Circle mới và lấy link/mã mời, (3) Truy cập kênh chat và gửi thành công 1 tin nhắn đầu tiên mà không cần sự trợ giúp kỹ thuật.
* **Formula (Công thức tính):**
  $$\text{TCR} = \left( \frac{N_{\text{success}}}{N_{\text{total}}} \right) \times 100\%$$
  *(Trong đó: $N_{\text{success}}$ là số người dùng hoàn thành toàn bộ 3 bước không gặp lỗi chặn; $N_{\text{total}}$ là tổng số người tham gia thử nghiệm = 10).*
* **Baseline (Mốc ban đầu):** `65.0%`
  * *Căn cứ Baseline:* Đo lường trên quy trình học nhóm rời rạc hiện tại (sinh viên phải phối hợp tạo nhóm Zalo + mở folder Google Drive chia quyền + gửi link tài liệu). Qua khảo sát thử nghiệm 5 sinh viên, có 2 bạn gặp trục trặc về cấp quyền và nhầm lẫn link thao tác, tỷ lệ hoàn thành trơn tru chỉ đạt khoảng 60% – 65%.
* **Target (Mục tiêu cam kết):** $\ge$ `90.0%` (Tối thiểu 9/10 người dùng hoàn thành trơn tru).
* **Measurement method (Phương pháp đo):** Quan sát trực tiếp (Direct Observation) và ghi nhận nhật ký thao tác theo kịch bản Task Script chuẩn trong đợt thử nghiệm người dùng (User Testing) tại Tuần 15.
* **Data source (Nguồn dữ liệu):** Bảng kiểm biên bản thử nghiệm người dùng có chữ ký xác nhận của các sinh viên tham gia.
* **Measurement date (Thời điểm đo):** Tuần 15 (Giai đoạn hoàn thiện sản phẩm & thực nghiệm người dùng).
* **Owner (Người chịu trách nhiệm):** Trương Công Bình.
* **Evidence location (Vị trí lưu trữ minh chứng):** [`docs/evidence/kpi-evidence/kpi-01-task-completion.md`](../evidence/kpi-evidence/kpi-01-task-completion.md).

---

### KPI-02: Điểm đánh giá độ khả dụng hệ thống (System Usability Scale - SUS Score)

* **KPI ID:** `KPI-02`
* **Definition (Định nghĩa):** Điểm số đo lường mức độ dễ sử dụng, tính thân thiện và mức độ hài lòng về trải nghiệm người dùng tổng thể trên cả Web và Mobile thông qua thang đo chuẩn quốc tế System Usability Scale (John Brooke, 1986).
* **Formula (Công thức tính):** 
  * Bảng câu hỏi gồm 10 mục chuẩn SUS với thang đo Likert 5 mức (1 = Rất không đồng ý đến 5 = Rất đồng ý).
  * Với câu hỏi lẻ (1, 3, 5, 7, 9): Điểm thành phần = $\text{Điểm trả lời} - 1$.
  * Với câu hỏi chẵn (2, 4, 6, 8, 10): Điểm thành phần = $5 - \text{Điểm trả lời}$.
  * Tổng điểm SUS của 1 người = $(\sum \text{Điểm thành phần}) \times 2.5$ (Quy về thang 100).
  * $\text{SUS}_{\text{tb}} = \frac{1}{N} \sum_{i=1}^{N} \text{SUS}_i$.
* **Baseline (Mốc ban đầu):** `68.0 / 100 điểm`
  * *Căn cứ Baseline:* Đây là mốc điểm chuẩn trung bình toàn cầu (Industry Standard Benchmark) được công bố trong các nghiên cứu khoa học chuẩn về Usability. Mọi sản phẩm phần mềm đạt dưới 68 điểm bị xếp loại dưới trung bình (Grade C/D).
* **Target (Mục tiêu cam kết):** $\ge$ `75.0 / 100 điểm` (Đạt mức Grade B+ / Đánh giá "Tốt - Rất tốt").
* **Measurement method (Phương pháp đo):** Phát biểu mẫu Google Form gồm đúng 10 câu trắc nghiệm chuẩn SUS ngay sau khi người dùng hoàn thành phiên trải nghiệm hệ thống.
* **Data source (Nguồn dữ liệu):** Dữ liệu phản hồi khảo sát Google Sheet từ 10 người dùng độc lập.
* **Measurement date (Thời điểm đo):** Tuần 15.
* **Owner (Người chịu trách nhiệm):** Ninh Thị Mỹ Hạnh.
* **Evidence location (Vị trí lưu trữ minh chứng):** [`docs/evidence/kpi-evidence/kpi-02-sus-score.md`](../evidence/kpi-evidence/kpi-02-sus-score.md).

---

### KPI-03: Thời gian phản hồi API trung bình (Average API Response Latency)

* **KPI ID:** `KPI-03`
* **Definition (Định nghĩa):** Thời gian phản hồi trung bình (khứ hồi - roundtrip latency) của máy chủ NestJS đối với cụm các API nghiệp vụ trọng yếu (`GET /api/circles`, `GET /api/users/profile`, `GET /api/messages/:channelId`) trong điều kiện tải đồng thời thông thường (10 - 20 kết nối đồng thời).
* **Formula (Công thức tính):**
  $$\text{Latency}_{\text{avg}} = \frac{1}{K} \sum_{j=1}^{K} \text{ResponseTime}_j \quad (\text{ms})$$
* **Baseline (Mốc ban đầu):** `220 ms`
  * *Căn cứ Baseline:* Đo đạc trực tiếp tại Tuần 6 trên phiên bản API ban đầu (NestJS truy vấn trực tiếp vào PostgreSQL không có Redis Caching, chưa thiết lập composite indexes).
* **Target (Mục tiêu cam kết):** $\le$ `80 ms` (Khi đã kích hoạt tầng đệm Redis Cache cho danh sách Circle/Profile và đánh index đầy đủ).
* **Measurement method (Phương pháp đo):** Sử dụng công cụ benchmark tiêu chuẩn công nghiệp `autocannon` với lệnh thực thi cố định:
  ```bash
  npx autocannon -c 10 -d 10 -p 1 http://localhost:4000/api/circles
  ```
* **Data source (Nguồn dữ liệu):** Báo cáo kết quả benchmark do `autocannon` xuất trực tiếp trên terminal (chụp ảnh màn hình và log JSON).
* **Measurement date (Thời điểm đo):** Đo Baseline tại Tuần 6; đo Target nghiệm thu tại Tuần 14.
* **Owner (Người chịu trách nhiệm):** Trương Công Bình.
* **Evidence location (Vị trí lưu trữ minh chứng):** [`docs/evidence/kpi-evidence/kpi-03-api-latency.md`](../evidence/kpi-evidence/kpi-03-api-latency.md).

---

### KPI-04: Tỷ lệ phân phối tin nhắn thời gian thực thành công (Realtime Message Delivery Rate)

* **KPI ID:** `KPI-04`
* **Definition (Định nghĩa):** Tỷ lệ tin nhắn văn bản được phát đi (emit) từ client gửi và phân phối thành công tới client nhận trong cùng phòng chat thông qua WebSocket Gateway (Socket.IO + Redis Pub/Sub), có cơ chế xác nhận gói tin (Acknowledgement - ACK).
* **Formula (Công thức tính):**
  $$\text{DeliveryRate} = \left( \frac{M_{\text{received}}}{M_{\text{sent}}} \right) \times 100\%$$
  *(Trong đó: $M_{\text{sent}}$ là số tin nhắn client gửi đi; $M_{\text{received}}$ là số tin nhắn nhận được tương ứng có xác nhận payload toàn vẹn).*
* **Baseline (Mốc ban đầu):** `91.0%`
  * *Căn cứ Baseline:* Thử nghiệm ở giai đoạn sơ khởi khi Socket.IO chưa có cơ chế lưu đệm ACK queue, khi có biến động rớt mạng tạm thời thì tin nhắn bị mất (packet drop).
* **Target (Mục tiêu cam kết):** $\ge$ `99.0%` (Tin nhắn luôn được bảo đảm phân phối và cập nhật trạng thái đã nhận qua cơ chế ACK callback).
* **Measurement method (Phương pháp đo):** Chạy kịch bản script tự động (`scripts/benchmark-realtime.js`) khởi tạo 2 socket clients độc lập, gửi liên tiếp 200 tin nhắn và đếm tỷ lệ tin nhắn nhận được qua ACK.
* **Data source (Nguồn dữ liệu):** Log xác nhận từ test runner và Server Gateway telemetry log.
* **Measurement date (Thời điểm đo):** Tuần 14.
* **Owner (Người chịu trách nhiệm):** Trương Công Bình.
* **Evidence location (Vị trí lưu trữ minh chứng):** [`docs/evidence/kpi-evidence/kpi-04-realtime-delivery.md`](../evidence/kpi-evidence/kpi-04-realtime-delivery.md).

---

### KPI-05: Độ bao phủ kiểm thử tự động (Automated Unit Test Coverage)

* **KPI ID:** `KPI-05`
* **Definition (Định nghĩa):** Tỷ lệ bao phủ dòng lệnh (Line Coverage) của bộ kiểm thử đơn vị tự động (Unit Test với Jest) đối với các dịch vụ nghiệp vụ cốt lõi (Business Services: `AuthService`, `CirclesService`, `ChatService`, `UsersService`) của Backend.
* **Formula (Công thức tính):**
  $$\text{Coverage}_{\text{line}} = \left( \frac{\text{Số dòng code nghiệp vụ được test thực thi}}{\text{Tổng số dòng code nghiệp vụ}} \right) \times 100\%$$
* **Baseline (Mốc ban đầu):** `15.0%`
  * *Căn cứ Baseline:* Đo đạc tại Sprint 1 (Tuần 5 – 6) khi hệ thống chỉ mới có một số bài test mẫu (smoke test) cơ bản cho khung ứng dụng.
* **Target (Mục tiêu cam kết):** $\ge$ `70.0%` Line Coverage cho toàn bộ các module nghiệp vụ cốt lõi.
* **Measurement method (Phương pháp đo):** Chạy bộ đo độ phủ tự động tích hợp sẵn của Jest:
  ```bash
  cd apps/backend && npm test -- --coverage
  ```
* **Data source (Nguồn dữ liệu):** Báo cáo HTML tự động sinh ra tại `apps/backend/coverage/lcov-report/index.html`.
* **Measurement date (Thời điểm đo):** Cập nhật liên tục theo từng PR; nghiệm thu chốt số liệu tại Tuần 13.
* **Owner (Người chịu trách nhiệm):** Ninh Thị Mỹ Hạnh.
* **Evidence location (Vị trí lưu trữ minh chứng):** [`docs/evidence/kpi-evidence/kpi-05-test-coverage.md`](../evidence/kpi-evidence/kpi-05-test-coverage.md).

---

## 3. KẾ HOẠCH BẢO TRỢ DỮ LIỆU MINH CHỨNG (EVIDENCE PLAN)

Để đáp ứng tuyệt đối tiêu chí chấm điểm của Hội đồng và quy chuẩn **Hard Gate G1, G2, G3**, mọi số liệu KPI khi báo cáo đều phải có liên kết dẫn chứng trực tiếp:

1. **Thư mục lưu trữ minh chứng:** Tạo thư mục chuẩn [`docs/evidence/kpi-evidence/`](../evidence/kpi-evidence/) chứa 5 tài liệu báo cáo kết quả tương ứng.
2. **Hình ảnh / Log đính kèm:** Chụp màn hình terminal chạy `autocannon`, ảnh chụp báo cáo `coverage` của Jest, ảnh chụp Google Sheet tính điểm SUS, và bản scan chữ ký người dùng thử nghiệm.
3. **Báo cáo định kỳ:** Đưa bảng trạng thái 5 KPIs này vào báo cáo giữa kỳ (Mốc 50%) và báo cáo nghiệm thu cuối kỳ.
