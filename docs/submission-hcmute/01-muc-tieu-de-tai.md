# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 01
# MỤC TIÊU CỦA ĐỀ TÀI

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - Trương Công Bình — MSSV: `23110184` (Trưởng nhóm)  
> - Ninh Thị Mỹ Hạnh — MSSV: `23110210`  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **16:44 ngày 20/11/2026** *(Cần GVHD xác nhận)*  
> **Tiêu chí đánh giá:** Tính thực tiễn của đề tài và sự hiểu biết về vấn đề nghiên cứu.

---

## 1. BỐI CẢNH THỰC TIỄN & SỰ CẦN THIẾT CỦA ĐỀ TÀI

### 1.1. Thực trạng bão hòa và hạn chế của các mạng xã hội đại chúng hiện nay
Trong kỷ nguyên số hiện nay, các nền tảng mạng xã hội quy mô lớn (Facebook, Instagram, TikTok, X/Twitter) được thiết kế tối ưu hóa cho mục đích thương mại hóa và giữ chân người dùng thông qua thuật toán phân phối nội dung bảng tin vô tận (*Algorithmic Infinite Feeds*). Điều này dẫn đến nhiều hệ lụy tiêu cực:
- **Xâm phạm quyền riêng tư và phân tán tương tác:** Nội dung người dùng chia sẻ thường bị công khai hóa hoặc phân phối cho những người dùng xa lạ, làm giảm cảm giác an toàn và thân mật trong các mối quan hệ thực tế.
- **Phân mảnh công cụ (Tool Fragmentation) trong hoạt động nhóm:** Đối với các cộng đồng nhóm vi mô (*Micro-communities*) như nhóm bạn thân, gia đình, câu lạc bộ sinh viên hay nhóm nghiên cứu học tập, nhu cầu cốt lõi là sự phối hợp nhịp nhàng và tương tác sâu sắc. Tuy nhiên, người dùng hiện nay buộc phải chuyển đổi liên tục (*Context Switching*) giữa nhiều ứng dụng rời rạc:
  - Nhắn tin, trò chuyện: Dùng Zalo, Messenger hoặc Telegram (thường xuyên bị trôi tin nhắn công việc, thiếu công cụ chuyên dụng).
  - Họp nhóm, trao đổi trực tiếp: Dùng Google Meet, Zoom hoặc Discord (phát sinh độ trễ chia sẻ liên kết, giới hạn thời gian hoặc giao diện quá phức tạp).
  - Quản lý sự kiện, lịch trình: Dùng Google Calendar, Notion hoặc ghi chú thủ công.
  - Bình chọn, ra quyết định: Lập Google Form hoặc dùng các công cụ thăm dò rời rạc.
  - Lưu trữ kỷ niệm nhóm: Chia sẻ qua Google Drive (thường gặp lỗi phân quyền, không gắn liền với dòng thời gian trò chuyện).

### 1.2. Khoảng trống nghiên cứu & Cơ hội phát triển
Qua khảo sát thực tế trên 30 sinh viên và đại diện các câu lạc bộ tại Trường Đại học Sư phạm Kỹ thuật TP.HCM (chi tiết tại [`docs/research/problem-statement.md`](../research/problem-statement.md)):
- **100%** đối tượng khảo sát thừa nhận họ gặp ức chế khi phải sử dụng từ 3 đến 5 ứng dụng khác nhau để duy trì hoạt động của một nhóm bạn/nhóm học tập.
- **86.7%** mong muốn có một nền tảng tích hợp chuyên biệt, trong đó không gian nhóm là trung tâm tối thượng, mọi trao đổi, đàm thoại, lưu trữ hình ảnh và công cụ cộng tác đều nằm trọn vẹn trong một ngữ cảnh thống nhất.

Xuất phát từ thực tiễn trên, đề tài **"Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE"** được đề xuất nhằm giải quyết bài toán cốt lõi: Tạo ra một không gian số tập trung, an toàn, riêng tư và giàu tính tương tác dành riêng cho các nhóm vi mô.

---

## 2. TRIẾT LÝ NỀN TẢNG: "NHÓM LÀ TRUNG TÂM" (CIRCLE-CENTRIC / GROUP-FIRST)

Không giống như các nền tảng mạng xã hội cá nhân thông thường nơi hồ sơ cá nhân và bảng tin đại chúng chi phối toàn bộ luồng thông tin, CIRCLE vận hành dựa trên triết lý **"Nhóm là trung tâm"**:
1. **Circle là đơn vị hạt nhân:** Trong CIRCLE, tài khoản người dùng chỉ có ý nghĩa tương tác khi tham gia vào các Circle (Không gian nhóm). Mọi tài nguyên, dữ liệu và tương tác (tin nhắn, khoảnh khắc, lịch hẹn, vị trí, bảng kế hoạch) đều trực thuộc một Circle xác định.
2. **Loại bỏ hoàn toàn Chat 1-1 độc lập:** Nền tảng không hỗ trợ nhắn tin cá nhân đơn lẻ ngoài nhóm. Toàn bộ hội thoại diễn ra trong không gian Circle, giúp bảo đảm tuyệt đối tính riêng tư, ngăn chặn quấy rối ẩn danh và định hình chuẩn xác văn hóa cộng tác nhóm.
3. **Bảo mật và riêng tư theo từng Circle (Circle-based Privacy):** Người dùng có quyền chia sẻ các khoảnh khắc (*Moments*) chỉ dành riêng cho một hoặc nhiều Circle cụ thể được chỉ định. Thành viên ngoài các Circle này hoàn toàn không thể tiếp cận dữ liệu.

---

## 3. MỤC TIÊU TỔNG QUÁT CỦA ĐỀ TÀI

> **Mục tiêu tổng quát:**  
> Nghiên cứu, thiết kế, xây dựng và triển khai hoàn chỉnh nền tảng mạng xã hội kết nối và tương tác nhóm **CIRCLE** với đầy đủ hệ sinh thái đa nền tảng gồm **Web Application**, **Mobile Application (iOS/Android)** và **Admin Portal**, tích hợp truyền thông thời gian thực (Realtime Messaging, WebRTC Audio/Video Call) và bộ công cụ cộng tác nhóm phong phú, đáp ứng các tiêu chuẩn kỹ thuật công nghiệp và mức độ hài lòng cao của người dùng thực tế.

---

## 4. CÁC MỤC TIÊU CỤ THỂ (THEO NGUYÊN TẮC SMART)

Mục tiêu cụ thể của đề tài được cấu trúc theo 5 trụ cột kỹ thuật và học thuật:

```
                          CÁC MỤC TIÊU CỤ THỂ CỦA ĐỀ TÀI CIRCLE
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
┌──────────────┐   ┌──────────────┐               ┌──────────────┐   ┌──────────────┐
│  MỤC TIÊU    │   │  MỤC TIÊU    │               │  MỤC TIÊU    │   │  MỤC TIÊU    │
│  NGHIỆP VỤ   │   │  KIẾN TRÚC   │               │ CHẤT LƯỢNG & │   │ THỰC NGHIỆM  │
│  & SẢN PHẨM  │   │  & CÔNG NGHỆ │               │   KIỂM THỬ   │   │ & TRIỂN KHAI │
└──────────────┘   └──────────────┘               └──────────────┘   └──────────────┘
```

### 4.1. Mục tiêu Nghiệp vụ và Chức năng Sản phẩm (Specific & Achievable)
- **Hoàn thành 100% khối lượng nghiệp vụ cốt lõi** gồm 12 Module chức năng và 26 Use Cases được đặc tả trong SRS:
  1. Quản lý tài khoản, xác thực hai lớp và phân quyền vai trò bảo mật.
  2. Quản trị không gian Circle: Cơ chế tạo nhóm, phê duyệt thành viên, mã mời/liên kết tham gia, phân quyền Owner/Member.
  3. Nhắn tin nhóm thời gian thực: Hỗ trợ văn bản, hình ảnh, video, tệp tin, ghi âm giọng nói, trích dẫn phản hồi, biểu cảm cảm xúc và ghim tin nhắn quan trọng.
  4. Chia sẻ khoảnh khắc nhóm (Moments) với cơ chế bảo mật Circle-based Privacy nghiêm ngặt.
  5. Đàm thoại âm thanh và hình ảnh trực tiếp (WebRTC Group Audio/Video Calling) với độ trễ thấp.
  6. Bộ công cụ tương tác nhóm tương tác cao (Group Tools): Bảng kế hoạch cộng tác realtime, Lịch hẹn và nhắc việc tự động, Bình chọn (Group Poll), Vòng xoay quyết định (Decision Wheel), Chia sẻ vị trí thời gian thực (Live Location Map), Hòm thư tâm sự ẩn danh ("Điều muốn nói").
  7. Trung tâm thông báo đẩy đa kênh (Web In-App Notification & Mobile Push Notification qua Expo/FCM).
  8. Cổng quản trị hệ thống (Admin Portal) với bảng điều khiển số liệu (Dashboard), kiểm duyệt nội dung và xử lý báo cáo vi phạm.

### 4.2. Mục tiêu Kiến trúc và Công nghệ (Measurable & Realistic)
- **Xây dựng kiến trúc hệ thống hiện đại:** Áp dụng mô hình **Modular Monolith** phân tầng rõ ràng trên nền tảng **NestJS**, **TypeScript**, **Prisma ORM** và **PostgreSQL 16**, kết hợp **Redis 7** làm bộ nhớ đệm và pub/sub signaling.
- **Hệ sinh thái đa nền tảng đồng nhất:**
  - Giao diện Web: Phát triển bằng **Next.js 14+ (App Router)**, **Tailwind CSS**, thiết kế đáp ứng hoàn hảo trên mọi kích thước màn hình.
  - Giao diện Mobile: Phát triển bằng **React Native (Expo SDK 51/52+)**, biên dịch tương thích trên cả hai hệ điều hành Android và iOS.
- **Hạ tầng truyền thông thời gian thực tự chủ:**
  - Triển khai **WebSocket (Socket.IO)** chịu tải thông điệp thời gian thực với độ trễ phân phối $P95 \le 100\text{ ms}$.
  - Tự cấu hình và vận hành máy chủ **Coturn (STUN/TURN)** trên Linux VPS độc lập, bảo đảm cuộc gọi WebRTC thiết lập thành công xuyên qua mọi môi trường mạng NAT đối xứng và tường lửa phức tạp, thời gian thiết lập kết nối cuộc gọi $\le 1500\text{ ms}$.
  - Tích hợp lưu trữ tệp tin đám mây qua giao thức **S3-compatible (Cloudflare R2)** với cơ chế Presigned URL bảo mật, loại bỏ tải lưu trữ trực tiếp trên máy chủ ứng dụng.

### 4.3. Mục tiêu Chất lượng Mã nguồn và Kiểm thử (Measurable & Time-bound)
- **Đạt chuẩn Level 5 theo Rubric đánh giá của Khoa:**
  - **Độ bao phủ kiểm thử (Test Coverage):** Tỷ lệ bao phủ dòng lệnh (*Line Coverage*) cho các module nghiệp vụ cốt lõi đạt $\ge 70\%$.
  - **Kim tự tháp kiểm thử 4 tầng:** Tự động hóa đầy đủ 4 tầng kiểm thử gồm *Unit Tests (Jest)*, *Integration Tests (PostgreSQL container)*, *API Tests (Supertest)* và *End-to-End Tests (Playwright)*.
  - **Chất lượng mã nguồn:** 0 lỗi cú pháp Lint (*0 Lint errors*), 0 cảnh báo bảo mật nghiêm trọng (*0 Blocker/Critical* trên SonarQube/SonarCloud), tỷ lệ trùng lặp mã nguồn (*Code Duplication*) $\le 3\%$.
  - **An toàn bảo mật:** Quét định kỳ bằng **Gitleaks**, cam kết tuyệt đối không để lộ lọt bí mật (*Zero Leaked Secrets/API Keys*) trong toàn bộ lịch sử Git.

### 4.4. Mục tiêu Vận hành, CI/CD và Triển khai Thực tế
- **Tự động hóa toàn diện quy trình CI/CD:** Thiết lập GitHub Actions Pipeline gồm tối thiểu 6 giai đoạn (Lint $\rightarrow$ Static Analysis $\rightarrow$ Multi-tier Tests $\rightarrow$ Security Scan $\rightarrow$ Multi-stage Docker Build $\rightarrow$ Automated Deploy VPS $\rightarrow$ Health Check).
- **Môi trường triển khai thực tế công khai:** Triển khai sản phẩm thành công trên Internet thông qua máy chủ VPS Linux, quản lý container bằng **Docker Compose**, định tuyến ngược và chứng chỉ bảo mật SSL tự động qua **Traefik Reverse Proxy**.
- **Tính khả dụng hệ thống:** Cam kết tối thiểu **10 lượt triển khai tự động thành công**, thời gian từ lúc commit mã nguồn đến khi cập nhật staging $\le 15\text{ phút}$, hệ thống đạt độ ổn định cao (Zero Blocker khi Demo).

### 4.5. Mục tiêu Thực nghiệm Người dùng và Đóng góp Học thuật
- **Kiểm chứng với người dùng thực tế:**
  - Tổ chức thực nghiệm có đối soát với tối thiểu **10 người dùng thật** (sinh viên và đại diện các câu lạc bộ) theo các kịch bản tác vụ chuẩn hóa.
  - Tỷ lệ hoàn thành tác vụ cốt lõi (*Task Completion Rate - TCR*) đạt $\ge 90\%$.
  - Điểm số đánh giá độ khả dụng hệ thống (*System Usability Scale - SUS*) đạt $\ge 80/100$ điểm (Tương đương Grade A / Excellent).
  - Ghi nhận phản hồi, phân tích nguyên nhân và thực hiện ít nhất 1 vòng lặp cải tiến sản phẩm (*Improvement Iteration*) có đo lường trước/sau rõ ràng.
- **Làm chủ công nghệ và minh bạch học thuật:**
  - Quản lý nhật ký ứng dụng Trí tuệ nhân tạo (*AI Usage Log*) chặt chẽ, chứng minh năng lực làm chủ kỹ thuật của sinh viên, đảm bảo tính liêm chính học thuật tuyệt đối.
  - Tỷ lệ trùng lặp luận văn báo cáo $\le 20\%$ theo quy định kiểm tra của Nhà trường.

---

## 5. BẢNG ĐỐI CHIẾU MỤC TIÊU VỚI CÁC TIÊU CHÍ RUBRIC ĐÁNH GIÁ

| Mục tiêu cụ thể | Tiêu chí Rubric tương ứng | Chỉ số định lượng nghiệm thu | Minh chứng lưu trữ |
| :--- | :--- | :---: | :--- |
| **Nghiên cứu & Bối cảnh** | **TC1:** Tính thực tiễn & Sự hiểu biết | $\ge 30$ phiếu khảo sát, so sánh 3 nền tảng | `docs/research/` |
| **Đặc tả & Thiết kế** | **TC2.1:** Yêu cầu & Thiết kế | 100% Use Cases có AC, 5 loại sơ đồ | `docs/requirements/`, `docs/architecture/` |
| **Hoàn thiện sản phẩm** | **TC2.2:** Mức độ hoàn thiện sản phẩm | 100% tính năng cam kết, Live Demo 0 lỗi | Live URL, APK/Web Client |
| **Làm chủ AI/LLM** | **TC2.3:** Kiểm soát việc sử dụng AI | AI Log đầy đủ, phát hiện $\ge 5$ lỗi của AI | `docs/ai-usage/log.md` |
| **Chất lượng mã nguồn** | **TC2.4:** Chất lượng mã nguồn | 0 Lint error, 0 Blocker Sonar, 0 Secret leak | CI logs, Sonar report |
| **Kiểm thử phần mềm** | **TC2.5:** Kiểm thử | 4 tầng kiểm thử, Coverage $\ge 70\%$, 0 Blocker defect | `npm run test:cov`, Playwright report |
| **Vận hành & CI/CD** | **TC2.6:** CI/CD & Vận hành | Pipeline $\ge 6$ stages, $\ge 10$ automated deploys | `.github/workflows/`, VPS Traefik |
| **Thực nghiệm thực tế** | **TC2.7:** Thực nghiệm người dùng | $\ge 10$ người dùng, TCR $\ge 90\%$, SUS $\ge 80$ | `docs/evidence/user-experiment/` |

---

## 6. XÁC NHẬN CỦA GIẢNG VIÊN HƯỚNG DẪN & SINH VIÊN

Nhóm sinh viên cam kết thực hiện đề tài đúng với các mục tiêu đã đề ra ở trên, chịu trách nhiệm hoàn toàn về tính trung thực của số liệu và kết quả nghiên cứu.

*Ngày 18 tháng 11 năm 2026*

| GIẢNG VIÊN HƯỚNG DẪN | TRƯỞNG NHÓM SINH VIÊN | THÀNH VIÊN SINH VIÊN |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br><br>**ThS. Nguyễn Trần Thi Văn** | <br><br><br>**Trương Công Bình**<br>MSSV: 23110184 | <br><br><br>**Ninh Thị Mỹ Hạnh**<br>MSSV: 23110210 |
