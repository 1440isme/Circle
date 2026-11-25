# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 04
# BẢN CAM KẾT SẢN PHẨM CUỐI CÙNG VÀ BỘ METRIC ĐÁNH GIÁ

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **16:49 ngày 23/11/2026** *(Cần GVHD xác nhận)*  
> **Tiêu chí đánh giá:** Tính thực tiễn của đề tài và sự hiểu biết về vấn đề nghiên cứu; Mức độ hoàn thiện sản phẩm và khối lượng công việc. Metric đánh giá phải đo lường được.

---

## 1. BẢN CAM KẾT SẢN PHẨM CUỐI CÙNG (FINAL PRODUCT COMMITMENT)

Nhóm sinh viên thực hiện đề tài **CIRCLE** cam kết bàn giao sản phẩm cuối cùng vào ngày nghiệm thu với đầy đủ các thành phần kỹ thuật sau:

1. **Sản phẩm phần mềm thực tế hoàn chỉnh 100% (Real Working Product):**
   - **Ứng dụng Web (Web Client):** Hoạt động ổn định trên các trình duyệt hiện đại (Chrome, Firefox, Safari, Edge), giao diện đáp ứng (*Responsive Design*) tối ưu cho cả máy tính để bàn và màn hình cảm ứng di động.
   - **Ứng dụng Di động (Mobile App):** Bản cài đặt chạy độc lập trên hệ điều hành Android (APK) và iOS, hỗ trợ đầy đủ các tính năng tương tác thời gian thực, thông báo đẩy (Push Notification) và đàm thoại âm thanh/hình ảnh.
   - **Cổng Quản trị Tích hợp (Admin Portal):** Phân hệ quản trị tại `/admin` cho phép theo dõi số liệu trực quan theo thời gian thực và kiểm duyệt nội dung vi phạm.
   - **Máy chủ Backend API & Dịch vụ Thời gian thực:** Vận hành theo mô hình kiến trúc phân tầng chuẩn mực (NestJS + Prisma + PostgreSQL + Redis), đầy đủ tài liệu API tương tác trực tiếp (Swagger UI).
   - **Hạ tầng truyền thông tự chủ (Coturn Server):** Máy chủ STUN/TURN hoạt động ổn định trên VPS, bảo đảm kết nối WebRTC thông suốt giữa các thiết bị trên các dải mạng khác nhau.
2. **Cam kết tính trung thực và liêm chính công nghệ (Academic Integrity):**
   - Tuyệt đối **không sử dụng dữ liệu giả lập (No Mock Data), không dùng video dựng sẵn (No Hardcoded Demos)** trong các buổi thuyết trình và đánh giá với Hội đồng.
   - 100% dữ liệu hiển thị trên ứng dụng được lưu trữ, xử lý và đồng bộ trực tiếp từ cơ sở dữ liệu PostgreSQL và dịch vụ đám mây Cloudflare R2 thực tế.
   - Hệ thống được triển khai trên môi trường Internet công khai, Hội đồng có thể trực tiếp dùng tài khoản cá nhân để trải nghiệm và kiểm chứng độc lập.

---

## 2. BỘ METRIC KỸ THUẬT & SẢN PHẨM ĐỊNH LƯỢNG ĐO LƯỜNG ĐƯỢC

Nhóm thiết lập và cam kết đạt **8 chỉ số đo lường định lượng (Quantitative Metrics)**, được định nghĩa rõ ràng về công thức, phương pháp đo và ngưỡng nghiệm thu đạt chuẩn Level 5 của Rubric:

```
                            BỘ 8 CHỈ SỐ METRIC ĐỊNH LƯỢNG CỦA CIRCLE
                                               │
       ┌──────────────────┬────────────────────┼───────────────────┬──────────────────┐
       ▼                  ▼                    ▼                   ▼                  ▼
┌──────────────┐   ┌──────────────┐    ┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│  M1: PHẠM VI │   │ M2-M3: HIỆU  │    │ M4-M5: CHẤT   │   │ M6: VẬN HÀNH  │   │ M7-M8: TRẢI  │
│  & TÍNH NĂNG │   │ NĂNG & ĐỘ TRỄ│    │ LƯỢNG & TEST  │   │   & CI/CD     │   │ NGHIỆM & ĐỒ ÁN│
└──────────────┘   └──────────────┘    └───────────────┘   └───────────────┘   └──────────────┘
```

### Bảng Tổng hợp Bộ Metric Cam kết

| Mã Metric | Tên chỉ số đo lường | Công thức / Phương pháp đo lường | Ngưỡng Baseline | Ngưỡng Cam kết (Target Level 5) | Công cụ kiểm chứng |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **M-01** | **Mức độ hoàn thiện chức năng** (*Functional Completeness*) | $$\frac{UC_{\text{pass}}}{UC_{\text{total}}} \times 100\%$$ | 60% *(Giữa kỳ)* | **100%** *(26/26 Use Cases)* | Live Demo & Playwright Test |
| **M-02** | **Độ trễ phản hồi API Backend** (*API Latency P95*) | Benchmark truy vấn trung bình qua k6 | 220 ms *(No cache)* | $\le$ **80 ms** *(With Redis)* | k6 Stress Test Report |
| **M-03** | **Độ trễ tin nhắn thời gian thực** (*Realtime Chat Latency*) | Thời gian phát thông điệp từ Sender $\rightarrow$ Receiver | 180 ms | $\le$ **100 ms** *(WebSocket)* | Socket ACK Client Timestamps |
| **M-04** | **Thời gian kết nối cuộc gọi WebRTC** (*Call Setup Time*) | Thời gian từ lúc nhận Call $\rightarrow$ Thiết lập MediaStream | 3500 ms | $\le$ **1500 ms** *(P2P/Coturn)* | WebRTC Stats API Logs |
| **M-05** | **Độ bao phủ kiểm thử tự động** (*Code Coverage Core*) | Tỷ lệ dòng lệnh được thực thi bởi bộ test tự động | 15% | $\ge$ **70.0%** *(Line Coverage)* | Jest Coverage Report (`lcov`) |
| **M-06** | **Chất lượng mã nguồn & Secret** (*Static Quality & Security*) | Đếm số lỗi Blocker/Critical trên Sonar & Secret Gitleaks | N/A | **0 Blocker, 0 Critical**<br>**0 Leaked Secrets** | SonarQube & Gitleaks CI Scan |
| **M-07** | **Tỷ lệ triển khai tự động CI/CD** (*Green CI Rate & Deploys*) | Tỷ lệ pipeline xanh & số lần deploy tự động thành công | N/A | **Green $\ge$ 90%**<br>$\ge$ **10 lượt Deploy tự động** | GitHub Actions Workflow Runs |
| **M-08** | **Độ khả dụng theo chuẩn SUS** (*System Usability Scale*) | Khảo sát 10 câu hỏi chuẩn hóa quốc tế với $\ge 10$ người dùng | 68.0 *(Trung bình)* | $\ge$ **80.0/100** *(Grade A)* | Bảng điểm khảo sát SUS thực tế |

---

## 3. ĐẶC TẢ CHI TIẾT TỪNG CHỈ SỐ METRIC

### 3.1. Metric M-01: Mức độ hoàn thiện chức năng (Functional Completeness)
- **Định nghĩa:** Tỷ lệ phần trăm các trường hợp sử dụng (*Use Cases*) được mô tả trong SRS được hiện thực hoàn chỉnh, vượt qua kiểm thử tự động và vận hành không lỗi.
- **Cam kết:** **100% (26/26 Use Cases)** hoạt động ổn định trên cả môi trường Web và Mobile. Tuyệt đối không phát sinh lỗi chặn (*0 Blocker Defects*) trong suốt quá trình Hội đồng nghiệm thu thực tế.

### 3.2. Metric M-02: Độ trễ phản hồi API Backend (API Latency P95)
- **Định nghĩa:** Thời gian xử lý yêu cầu và phản hồi dữ liệu từ máy chủ API đối với 95% số lượng request trong điều kiện tải tiêu chuẩn (50 người dùng đồng thời).
- **Cam kết:** $P95 \le 80\text{ ms}$ đối với các truy vấn đọc qua tầng đệm Redis Cache và $\le 200\text{ ms}$ đối với các giao dịch ghi vào PostgreSQL. Đo lường độc lập bằng công cụ kiểm thử tải công nghiệp **k6**.

### 3.3. Metric M-03: Độ trễ tin nhắn thời gian thực (Realtime Chat Latency)
- **Định nghĩa:** Khoảng thời gian từ thời điểm người gửi nhấn nút gửi tin nhắn trên giao diện cho đến khi tin nhắn hiển thị thành công trên màn hình của các thành viên khác trong cùng Circle.
- **Cam kết:** Độ trễ phân phối $P90 \le 100\text{ ms}$ trên kết nối mạng cáp quang/Wi-Fi thông thường; tỷ lệ gửi tin nhắn thành công qua hàng đợi xác nhận (ACK Queue) đạt $\ge 99.0\%$.

### 3.4. Metric M-04: Thời gian thiết lập cuộc gọi WebRTC (Call Setup Time)
- **Định nghĩa:** Khoảng thời gian tính từ thời điểm người nhận bấm nút chấp nhận cuộc gọi (Accept) đến thời điểm hai bên trao đổi thành công MediaStream và hiển thị khung hình video/âm thanh trực tiếp.
- **Cam kết:** Thời gian kết nối $\le 1500\text{ ms}$; tỷ lệ thiết lập cuộc gọi thành công qua máy chủ Coturn (STUN/TURN) đạt $\ge 98\%$.

### 3.5. Metric M-05: Độ bao phủ kiểm thử tự động (Test Line Coverage)
- **Định nghĩa:** Tỷ lệ phần trăm dòng lệnh trong các phân hệ dịch vụ nghiệp vụ cốt lõi (Core Business Services) được kiểm tra bởi các bài kiểm thử tự động (Unit và Integration Tests).
- **Cam kết:** Độ bao phủ dòng lệnh đạt $\ge 70.0\%$. Báo cáo độ phủ được kết xuất tự động từ Jest (`npm run test:cov`) và kiểm tra nghiêm ngặt trong mỗi lần tạo Pull Request.

### 3.6. Metric M-06: Chất lượng mã nguồn và An toàn bảo mật (Static Quality & Security)
- **Định nghĩa:** Mức độ sạch sẽ, tuân thủ quy chuẩn lập trình và không chứa lỗ hổng bảo mật nghiêm trọng trong toàn bộ kho mã nguồn.
- **Cam kết:**
  - Lỗi cú pháp Lint: **0 errors** (ESLint strict mode).
  - Phân tích tĩnh mã nguồn: **0 lỗi Blocker và 0 lỗi Critical** trên SonarQube/SonarCloud; Tỷ lệ trùng lặp mã nguồn (*Duplication*) $\le 3\%$.
  - An toàn bảo mật: **0 bí mật, khóa API, mật khẩu bị lộ lọt** trong toàn bộ lịch sử Git (quét tự động bằng Gitleaks).

### 3.7. Metric M-07: Tỷ lệ triển khai tự động CI/CD (Green CI & Deployments)
- **Định nghĩa:** Tỷ lệ thành công của các pipeline tự động và số lần triển khai ứng dụng thực tế lên môi trường máy chủ VPS không thông qua thao tác thủ công.
- **Cam kết:**
  - Tỷ lệ hoàn thành thành công của Pipeline CI: $\ge 90\%$.
  - Số lần triển khai tự động lên môi trường staging/production qua GitHub Actions: $\ge 10\text{ lần}$.
  - Thời gian đóng gói và cập nhật hệ thống kể từ khi commit mã nguồn: $\le 15\text{ phút}$.

### 3.8. Metric M-08: Độ khả dụng theo thang đo chuẩn SUS (System Usability Scale)
- **Định nghĩa:** Điểm số đánh giá mức độ thân thiện, dễ sử dụng và tính thực tiễn của sản phẩm dựa trên bảng câu hỏi chuẩn hóa quốc tế 10 câu hỏi của John Brooke (1986).
- **Cam kết:** Khảo sát trên tối thiểu **10 người dùng thật** đạt điểm trung bình $\ge 80.0/100$ điểm (Mức Grade A / Excellent, vượt xa mức trung bình chuẩn ngành là 68.0 điểm). Tỷ lệ hoàn thành tác vụ cốt lõi đạt $\ge 90\%$.

---

## 4. XÁC NHẬN CAM KẾT CỦA CÁC BÊN

Nhóm sinh viên cam kết hoàn thành sản phẩm theo đúng các cam kết chất lượng và bộ chỉ số định lượng ở trên. Nếu không đạt được các mốc chỉ số cam kết này, nhóm xin chịu hoàn toàn trách nhiệm và chấp nhận hạ điểm theo quy định của Rubric đánh giá.

*Ngày 18 tháng 11 năm 2026*

| GIẢNG VIÊN HƯỚNG DẪN | TRƯỞNG NHÓM SINH VIÊN | THÀNH VIÊN SINH VIÊN |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Nguyễn Trần Thi Văn** | <br><br><br>**Trương Công Bình**<br>MSSV: 23110184 | <br><br><br>**Ninh Thị Mỹ Hạnh**<br>MSSV: 23110210 |
