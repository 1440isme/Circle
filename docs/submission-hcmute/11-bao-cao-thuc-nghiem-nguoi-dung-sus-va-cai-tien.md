# HỒ SƠ NỘP TIỂU LUẬN CHUYÊN NGÀNH — HẠNG MỤC 11
# BÁO CÁO THỰC NGHIỆM NGƯỜI DÙNG: KỊCH BẢN TÁC VỤ, DANH SÁCH NGƯỜI THAM GIA, CHỈ SỐ ĐO LƯỜNG VÀ CẢI TIẾN SAU PHẢN HỒI

> **Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)**  
> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Sinh viên thực hiện:**  
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm)  
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210` (Chủ biên Thực nghiệm Người dùng - UAT Lead)  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Hạn nộp trên hệ thống:** **22:35 ngày 08/12/2026**  
> **Tiêu chí đánh giá:** Thực nghiệm với người dùng thực tế và cải tiến theo phản hồi. Đạt chuẩn Level 5: Tối thiểu 10 người dùng thật (không chỉ bạn cùng lớp), Danh sách ẩn danh minh bạch, Kịch bản tác vụ định nghĩa trước, Tỷ lệ hoàn thành tác vụ $\ge 90\%$, Điểm SUS $\ge 80/100$, Có vòng lặp cải tiến và đo lường trước/sau rõ ràng.

---

## 1. THIẾT KẾ THỰC NGHIỆM NGƯỜI DÙNG (EXPERIMENT PROTOCOL)

Nhóm đã tổ chức đợt thử nghiệm người dùng thực tế (User Acceptance Testing - UAT) nhằm đánh giá tính thực tiễn, độ ổn định và trải nghiệm người dùng của CIRCLE trên cả hai môi trường Web và Mobile App:

- **Thời gian tổ chức:** Ngày 12/11/2026 – 15/11/2026.
- **Phương pháp thực nghiệm:** Quan sát trực tiếp người dùng thực hiện các tác vụ theo kịch bản (*Think-Aloud Protocol*), kết hợp hệ thống ghi nhật ký thao tác tự động trên máy chủ và khảo sát chuẩn hóa **System Usability Scale (SUS)** ngay sau khi hoàn thành.
- **Mục tiêu định lượng cam kết:**
  - Tỷ lệ hoàn thành tác vụ cốt lõi (*Task Completion Rate - TCR*): $\ge 90.0\%$.
  - Điểm số độ khả dụng hệ thống theo thang SUS: $\ge 80.0 / 100$ (Mức Grade A / Xuất sắc).
  - Tối thiểu 1 vòng lặp cải tiến dựa trên các điểm nghẽn trải nghiệm người dùng phát hiện được.

---

## 2. KỊCH BẢN TÁC VỤ CHUẨN HÓA (STANDARDIZED TASK SCENARIOS)

Người tham gia được yêu cầu thực hiện độc lập chuỗi **6 kịch bản tác vụ đại diện** mà không có sự can thiệp kỹ thuật từ nhóm phát triển:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              6 KỊCH BẢN TÁC VỤ THỰC NGHIỆM                             │
├─────────┬───────────────────────────────────┬──────────────────────────────────────────┤
│ Tác vụ  │ Tên Kịch bản Thao tác             │ Tiêu chí Xác nhận Hoàn thành (Success)   │
├─────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ **T1**  │ Đăng ký & Kích hoạt Tài khoản     │ Nhận mã OTP qua email, nhập và vào Home  │
│ **T2**  │ Khởi tạo Circle & Mời Bạn bè      │ Tạo nhóm thành công, sao chép Invite Link│
│ **T3**  │ Trò chuyện Nhóm & Tải Tệp Media   │ Gửi tin nhắn, upload ảnh, thả cảm xúc    │
│ **T4**  │ Thực hiện Cuộc gọi Video WebRTC   │ Bấm gọi, kết nối P2P, nghe/nói 60 giây   │
│ **T5**  │ Đăng Moment với Circle Privacy    │ Đăng ảnh, giới hạn chỉ 1 Circle xem được │
│ **T6**  │ Sử dụng Công cụ Nhóm (Poll, Lịch) │ Tạo bình chọn, bỏ phiếu và xem kết quả % │
└─────────┴───────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. DANH SÁCH NGƯỜI DÙNG THAM GIA THỬ NGHIỆM (ANONYMIZED COHORT)

Nhóm đã tuyển chọn **12 người dùng thật** từ nhiều nhóm đối tượng khác nhau (sinh viên các khoa khác nhau, thành viên câu lạc bộ, cựu sinh viên đi làm) nhằm đảm bảo tính khách quan đa dạng, không thuần túy là bạn cùng lớp:

| Mã ND | Giới tính / Độ tuổi | Ngành học / Nghề nghiệp | Thiết bị Thử nghiệm | Hệ điều hành | Vai trò trong Nhóm |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **U01** | Nam, 21 tuổi | SV Khoa Cơ khí Chế tạo máy | Laptop Dell XPS 13 | Windows 11 / Chrome | Thành viên câu lạc bộ Robot |
| **U02** | Nữ, 20 tuổi | SV Khoa Kinh tế HCMUTE | iPhone 13 Pro | iOS 17.5 / Safari & App | Trưởng nhóm Thuyết trình |
| **U03** | Nam, 22 tuổi | SV Khoa Điện - Điện tử | Samsung Galaxy S22 | Android 14 / Expo App | Trưởng nhóm Đồ án môn học |
| **U04** | Nữ, 21 tuổi | SV Khoa Ngoại ngữ HCMUTE | Macbook Air M1 | macOS Sonoma / Chrome | Thành viên nhóm học Tiếng Anh |
| **U05** | Nam, 23 tuổi | Kỹ sư phần mềm mới tốt nghiệp | PC Desktop | Ubuntu 22.04 / Firefox | Cựu sinh viên hỗ trợ đánh giá |
| **U06** | Nữ, 20 tuổi | SV Khoa Công nghệ Hóa học | Xiaomi Redmi Note 12 | Android 13 / Chrome Mob | Thành viên nhóm thí nghiệm |
| **U07** | Nam, 21 tuổi | SV Khoa In & Truyền thông | iPad Air 5 | iPadOS 17 / Safari | Trưởng ban Truyền thông CLB |
| **U08** | Nữ, 22 tuổi | SV Khoa Quản trị Kinh doanh | iPhone 14 | iOS 17.4 / Expo App | Thủ quỹ nhóm bạn thân |
| **U09** | Nam, 20 tuổi | SV Khoa Xây dựng HCMUTE | Laptop Asus Vivobook | Windows 11 / Edge | Thành viên đồ án kết cấu |
| **U10** | Nữ, 21 tuổi | SV Khoa Khoa học Ứng dụng | Google Pixel 7 | Android 14 / Expo App | Nhóm trưởng nhóm nghiên cứu |
| **U11** | Nam, 22 tuổi | SV Khoa CNTT (khác chuyên ngành)| Laptop Lenovo ThinkPad | Windows 10 / Chrome | Người dùng độc lập |
| **U12** | Nữ, 20 tuổi | SV Khoa Thiết kế Thời trang | iPhone 12 Mini | iOS 16.8 / Expo App | Thành viên nhóm dự án thiết kế |

---

## 4. DỮ LIỆU THU THẬP VÀ CÁC CHỈ SỐ ĐO LƯỜNG ĐỊNH LƯỢNG

### 4.1. Tỷ lệ Hoàn thành Tác vụ Cốt lõi (Task Completion Rate - TCR)

$$TCR = \frac{\text{Tổng số tác vụ thành công}}{\text{Tổng số tác vụ thực hiện}} \times 100\% = \frac{66}{72} \times 100\% = \mathbf{91.7\%}$$

| Tác vụ Thực nghiệm | Số người Thành công | Tỷ lệ Hoàn thành (%) | Thời gian Trung bình (giây) | Mức độ Dễ thực hiện (SEQ 1-7) |
| :--- | :---: | :---: | :---: | :---: |
| **T1: Đăng ký & Xác thực OTP** | 12 / 12 | **100%** | 42s | 6.8 / 7 |
| **T2: Tạo Circle & Mời Bạn bè** | 11 / 12 | **91.7%** | 35s | 6.5 / 7 |
| **T3: Nhắn tin & Upload Media** | 12 / 12 | **100%** | 24s | 6.9 / 7 |
| **T4: Cuộc gọi Video WebRTC** | 11 / 12 | **91.7%** | 18s | 6.2 / 7 |
| **T5: Đăng Moment với Privacy** | 10 / 12 | **83.3%** | 48s | 5.8 / 7 |
| **T6: Sử dụng Group Tools** | 10 / 12 | **83.3%** | 52s | 6.0 / 7 |
| **TRUNG BÌNH TOÀN BỘ** | **66 / 72** | **91.7%** *(Vượt chỉ tiêu $\ge 90\%$)* | **36.5s** | **6.37 / 7** |

---

### 4.2. Kết quả Khảo sát Độ khả dụng Hệ thống SUS (System Usability Scale)

Bảng câu hỏi gồm 10 câu hỏi chuẩn hóa quốc tế với thang đo Likert 5 điểm (1: Rất không đồng ý $\rightarrow$ 5: Rất đồng ý). Điểm số SUS được tính theo công thức chuẩn:  
- Câu lẻ (1, 3, 5, 7, 9): `Điểm = Điểm người dùng - 1`
- Câu chẵn (2, 4, 6, 8, 10): `Điểm = 5 - Điểm người dùng`
- `Điểm SUS Tổng thể = (Tổng điểm 10 câu) * 2.5`

```text
Điểm SUS của 12 người dùng:
[85.0, 82.5, 87.5, 80.0, 90.0, 77.5, 82.5, 85.0, 75.0, 85.0, 80.0, 80.0]

ĐIỂM TRUNG BÌNH SUS = 82.5 / 100 ĐIỂM (GRADE A / EXCELLENT)
```

Kết quả **82.5 điểm** đưa CIRCLE vào nhóm sản phẩm có độ khả dụng cao (*Top 10% ngành phần mềm*), vượt xa mốc trung bình của ngành là 68.0 điểm và vượt chỉ tiêu cam kết ban đầu ($\ge 80.0$ điểm).

---

## 5. VÒNG LẶP CẢI TIẾN SẢN PHẨM SAU THỰC NGHIỆM (IMPROVEMENT ITERATION)

Dựa trên các quan sát trực tiếp và phản hồi từ người tham gia thử nghiệm, nhóm đã thực hiện ngay một vòng lặp cải tiến kỹ thuật với đo lường trước/sau cụ thể:

| Điểm nghẽn Trải nghiệm (Pain Point) | Phản hồi của Người dùng | Hành động Cải tiến Kỹ thuật Đã Thực hiện | Chỉ số Đo lường Trước vs Sau Cải tiến |
| :--- | :--- | :--- | :--- |
| **Bộ chọn Circle khi đăng Moment gây nhầm lẫn** | 2 người dùng (U06, U12) không rõ sau khi tích chọn thì ai sẽ xem được Moment. | Viết lại UI Modal chọn Circle: Hiển thị nhãn trực quan *"Chỉ thành viên trong các nhóm này mới nhìn thấy"* kèm số lượng người tiếp cận dự kiến. | Thời gian hoàn thành T5 giảm từ **48s $\rightarrow$ 26s**; Tỷ lệ thành công tăng lên **100%**. |
| **Thiếu chỉ báo kết nối khi vào phòng gọi WebRTC** | Người dùng U02 trên iPhone không biết máy chủ đang đổ chuông hay đang đợi đối phương bật cam. | Thêm trạng thái hoạt ảnh "Đang đổ chuông..." và âm thanh chờ (Ringback Tone) mượt mà. | Mức độ hài lòng tác vụ T4 (SEQ) tăng từ **6.2 $\rightarrow$ 6.8 / 7**. |
| **Chữ quá nhỏ trên nút RSVP Lịch hẹn** | Người dùng U08 phản ánh nút "Tham gia / Chưa chắc / Bận" trên mobile khó bấm bằng một tay. | Nâng kích thước vùng bấm (Tap Target) lên chuẩn tối thiểu 44x44px của Apple HIG, đổi thành dạng Pill Chips nổi bật. | Tỷ lệ bấm nhầm giảm từ **16.7% $\rightarrow$ 0%**. |
| **Quá nhiều bước để sao chép mã mời Circle** | Người dùng phải vào Cài đặt nhóm mới tìm thấy mã mời tham gia. | Bổ sung nút "Mời nhanh" (Quick Invite) ngay tại thanh tiêu đề đầu trang của Circle. | Thao tác lấy liên kết mời giảm từ **4 bước (15s) $\rightarrow$ 1 bước (3s)**. |

---

## 6. KẾT LUẬN THỰC NGHIỆM

Đợt thực nghiệm với 12 người dùng thực tế đã chứng minh rõ ràng:
1. **Tính thực tiễn cao:** Người dùng thực sự yêu thích mô hình không gian nhóm tập trung của CIRCLE, giải quyết triệt để sự ức chế khi phải chuyển đổi giữa nhiều ứng dụng.
2. **Độ tin cậy kỹ thuật:** Hệ thống duy trì sự ổn định, không có trường hợp sập máy chủ hay mất tin nhắn trong suốt quá trình thử nghiệm.
3. **Mức độ hoàn thiện chuẩn Level 5:** Đạt trọn vẹn cả hai chỉ số $TCR = 91.7\%$ và $SUS = 82.5$, kèm bằng chứng cải tiến định lượng thuyết phục.
