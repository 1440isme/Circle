# TỔNG HỢP HỒ SƠ VÀ CÁC MỤC NỘP TIỂU LUẬN CHUYÊN NGÀNH — CIRCLE
## Hệ thống Quản lý Đề tài — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)

> **Đề tài:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE  
> **Chuyên ngành:** Công nghệ Phần mềm — Ngành Công nghệ Thông tin  
> **Học kỳ:** Học kỳ 1, Năm học 2026 – 2027  
> **Giảng viên hướng dẫn (GVHD):** ThS. Nguyễn Trần Thi Văn  
> **Giảng viên phản biện (GVPB):** TS. Huỳnh Xuân Phụng  
> **Nhóm sinh viên thực hiện:**
> - **Trương Công Bình** — MSSV: `23110184` (Trưởng nhóm — Technical Core, Hạ tầng, Realtime & UI/UX)
> - **Ninh Thị Mỹ Hạnh** — MSSV: `23110210` (Thành viên — Business Logic, Social Features, Moderation & QA Lead)  
> **Repository:** [`https://github.com/1440isme/Circle`](https://github.com/1440isme/Circle)

---

## 1. BẢNG THEO DÕI HẠN NỘP VÀ TIÊU CHÍ ĐÁNH GIÁ (RUBRIC MAPPING)

Thư mục này chuẩn bị toàn bộ nội dung chi tiết theo định dạng Markdown, sẵn sàng để copy trực tiếp vào khung nộp bài trên Hệ thống Quản lý Đề tài hoặc xuất thành tệp PDF đính kèm.

| STT | Tên mục cần nộp trên Hệ thống HCMUTE | Hạn nộp | Tiêu chí đánh giá của Khoa | File tài liệu chi tiết | Trạng thái chuẩn bị |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **01** | **Mục tiêu của đề tài** *(Cần GVHD xác nhận)* | **16:44 20/11/26** | Tính thực tiễn của đề tài và sự hiểu biết về vấn đề nghiên cứu (Mục tiêu rõ ràng) | [`01-muc-tieu-de-tai.md`](./01-muc-tieu-de-tai.md) | ✅ Sẵn sàng |
| **02** | **Phạm vi thực hiện của đề tài** *(Cần GVHD xác nhận)* | **16:46 27/11/26** | Phân tích nghiệp vụ, đặc tả yêu cầu và thiết kế – giải pháp (Phù hợp mục tiêu) | [`02-pham-vi-thuc-hien.md`](./02-pham-vi-thuc-hien.md) | ✅ Sẵn sàng |
| **03** | **Bảng phân công công việc theo từng thành viên** | **16:48 30/11/26** | Ghi rõ mỗi thành viên làm gì, kèm link tài liệu, kết quả thực hiện | [`03-bang-phan-cong-cong-viec-thanh-vien.md`](./03-bang-phan-cong-cong-viec-thanh-vien.md) | ✅ Sẵn sàng |
| **04** | **Bản cam kết sản phẩm cuối cùng và bộ metric đánh giá** *(Cần GVHD xác nhận)* | **16:49 23/11/26** | Tính thực tiễn, mức độ hoàn thiện sản phẩm và khối lượng công việc (Đo lường được) | [`04-ban-cam-ket-san-pham-va-bo-metric-danh-gia.md`](./04-ban-cam-ket-san-pham-va-bo-metric-danh-gia.md) | ✅ Sẵn sàng |
| **05** | **Link repository (Git) có đầy đủ lịch sử commit; cấp quyền cho hội đồng** | **16:50 07/12/26** | Mức độ hoàn thiện sản phẩm, chất lượng mã nguồn và quản lý chất lượng (Public repo) | [`05-link-repository-git-va-huong-dan-hoi-dong.md`](./05-link-repository-git-va-huong-dan-hoi-dong.md) | ✅ Sẵn sàng |
| **06** | **Nhật ký sử dụng AI (AI Usage Log) hoặc bản cam kết không dùng mang tính đại diện** | **22:32 08/12/26** | Làm chủ và kiểm soát việc sử dụng LLM / Agentic AI (Nhật ký đầy đủ prompts) | [`06-nhat-ky-va-cam-ket-su-dung-ai.md`](./06-nhat-ky-va-cam-ket-su-dung-ai.md) | ✅ Sẵn sàng |
| **07** | **Tài liệu đặc tả yêu cầu và thiết kế (SRS/SDD) kèm theo các sơ đồ thiết kế** | **22:33 01/12/26** | Phân tích nghiệp vụ, đặc tả yêu cầu và thiết kế – giải pháp (SRS + SDD + Sơ đồ) | [`07-tai-lieu-dac-ta-srs-va-thiet-ke-sdd.md`](./07-tai-lieu-dac-ta-srs-va-thiet-ke-sdd.md) | ✅ Sẵn sàng |
| **08** | **Báo cáo phân tích tĩnh mã nguồn, quét secret, tài liệu về coding convention** | **22:34 08/12/26** | Chất lượng mã nguồn và quản lý chất lượng phần mềm (Lint, Sonar, Gitleaks, Conventions) | [`08-bao-cao-phan-tich-tinh-quet-secret-va-coding-conventions.md`](./08-bao-cao-phan-tich-tinh-quet-secret-va-coding-conventions.md) | ✅ Sẵn sàng |
| **09** | **Kế hoạch kiểm thử, bộ test case, test tự động, báo cáo độ phủ, defect backlog** | **22:34 07/12/26** | Kiểm thử phần mềm (Unit, Integration, API, E2E, Coverage $\ge 70\%$, 0 Blocker/Critical) | [`09-ke-hoach-kiem-thu-bo-test-case-do-phu-va-defect-backlog.md`](./09-ke-hoach-kiem-thu-bo-test-case-do-phu-va-defect-backlog.md) | ✅ Sẵn sàng |
| **10** | **Tệp cấu hình pipeline, lịch sử các lần chạy và triển khai, link môi trường** | **22:35 07/12/26** | Triển khai CI/CD và vận hành (GitHub Actions $\ge 6$ stages, VPS Docker Traefik) | [`10-cau-hinh-pipeline-ci-cd-lich-su-chay-va-link-trien-khai.md`](./10-cau-hinh-pipeline-ci-cd-lich-su-chay-va-link-trien-khai.md) | ✅ Sẵn sàng |
| **11** | **Báo cáo thực nghiệm người dùng: kịch bản, danh sách ẩn danh, chỉ số đo, cải tiến** | **22:35 08/12/26** | Thực nghiệm với người dùng thực tế và cải tiến theo phản hồi (SUS $\ge 80$, TCR $\ge 90\%$) | [`11-bao-cao-thuc-nghiem-nguoi-dung-sus-va-cai-tien.md`](./11-bao-cao-thuc-nghiem-nguoi-dung-sus-va-cai-tien.md) | ✅ Sẵn sàng |
| **12** | **Báo cáo kiểm tra trùng lặp của luận văn; danh mục tài liệu tham khảo ngoại ngữ** | **22:36 08/12/26** | Tổng hợp kiến thức, viết luận văn, tài liệu tham khảo và hình thức trình bày ($\le 20\%$) | [`12-bao-cao-kiem-tra-trung-lap-va-danh-muc-tai-lieu-tham-khao.md`](./12-bao-cao-kiem-tra-trung-lap-va-danh-muc-tai-lieu-tham-khao.md) | ✅ Sẵn sàng |
| **13** | **Minh chứng cho các kết quả nổi bật: bài báo, giải thưởng, văn bản xác nhận…** *(Cần GVHD xác nhận)* | **22:36 08/12/26** | Các kết quả nổi bật (Triển khai thực tế, Điểm sáng công nghệ đột phá, Xác nhận sử dụng) | [`13-minh-chung-cac-ket-qua-noi-bat-va-diem-sang-ky-thuat.md`](./13-minh-chung-cac-ket-qua-noi-bat-va-diem-sang-ky-thuat.md) | ✅ Sẵn sàng |

---

## 2. HƯỚNG DẪN DÀNH CHO SINH VIÊN KHI THAO TÁC TRÊN HỆ THỐNG
1. **Đối với ô nhập văn bản (Hỗ trợ Markdown):** Mở từng file `.md` tương ứng trong thư mục này, sao chép toàn bộ nội dung và dán vào ô nhập liệu trên website.
2. **Đối với tệp đính kèm (Tuỳ chọn, tối đa 5MB):** Sử dụng các file PDF đã được biên soạn xuất từ tài liệu Markdown hoặc các tệp nén đính kèm minh chứng được lưu trữ tại `docs/evidence/`.
3. **Các mục có gắn nhãn "Cần GVHD xác nhận":** Sau khi nộp (Mục 01, 02, 04, 13), liên hệ ThS. Nguyễn Trần Thi Văn thông qua kênh trao đổi chuyên môn để thầy kiểm tra và duyệt trên hệ thống đúng hạn.
