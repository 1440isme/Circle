**BÁO CÁO TIẾN ĐỘ THỰC HIỆN DỰ ÁN**

---

### Giai đoạn: Tuần 1 (17/08/2026 – 23/08/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Khảo sát thực tế, phân tích bối cảnh, xác định vấn đề, đối tượng sử dụng và phạm vi đề tài của hệ thống CIRCLE.
- Xác định mục tiêu dự án và các chức năng chính của CIRCLE.
- Phân tích nhu cầu người dùng, xây dựng hồ sơ chân dung người dùng mục tiêu (Personas).
- Xác định các chỉ số đánh giá và Baseline ban đầu làm cơ sở theo dõi và đánh giá dự án.

2. **Những việc chưa làm được:**

- Khảo sát thực tế mới dừng lại ở phạm vi sinh viên nội bộ, chưa mở rộng thu thập được thêm dữ liệu khảo sát từ các nhóm đối tượng người dùng bên ngoài trường (dự kiến sẽ tiếp tục thu thập thêm trong quá trình triển khai thực nghiệm).

3. **Những vướng mắc, khó khăn:**

- Phạm vi chức năng của CIRCLE tương đối rộng, cần tiếp tục rà soát và phân định rõ phạm vi bài toán (In-Scope và Out-of-Scope) để đảm bảo các chức năng được thiết kế phù hợp với thời gian 15 tuần thực hiện.
- Cần thống nhất triết lý "Circle-Centric" (tập trung vào không gian tương tác nhóm, không làm chat 1-1 độc lập) để làm cơ sở định hình chức năng và Personas chuẩn xác.
- Cần nghiên cứu thiết lập bộ chỉ số đánh giá định lượng và Baseline ban đầu mang tính khả thi để làm tiền đề đo lường hiệu năng và trải nghiệm người dùng ở các giai đoạn sau.

4. **Câu hỏi (nếu có):**

- Xin ý kiến góp ý của GVHD về tính hợp lý của bộ chỉ số Baseline ban đầu và định hướng phạm vi đề tài tập trung vào tương tác nhóm khép kín (Circle-Centric).

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Phân tích yêu cầu chức năng và phi chức năng của hệ thống.
- Xây dựng User Stories, Acceptance Criteria, Business Rules và Data Dictionary.
- Xây dựng Use Case Diagram và đặc tả các Use Case chính.
- Bắt đầu thiết kế kiến trúc Client–Server theo hướng Modular Monolith và các sơ đồ kiến trúc liên quan.
- Bắt đầu thiết kế cơ sở dữ liệu ERD.

---

### Giai đoạn: Tuần 2 (24/08/2026 – 30/08/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Hoàn thiện phân tích các yêu cầu chức năng (nghiệp vụ lưu trữ, tra cứu, tính toán, kết xuất theo từng tác nhân: Guest, Member, Owner, Admin) và yêu cầu phi chức năng của hệ thống.
- Hoàn thiện User Stories và Acceptance Criteria cho các chức năng chính.
- Hoàn thiện các Business Rules liên quan đến hệ thống (ràng buộc quản trị Circle, cơ chế bảo mật ẩn danh, quy tắc chia sẻ vị trí).
- Hoàn thiện Data Dictionary cho các dữ liệu chính của hệ thống.
- Hoàn thiện Use Case Diagram và đặc tả các Use Case chính (26 Use Cases của hệ thống).
- Bắt đầu phác thảo thiết kế kiến trúc Client–Server theo hướng Modular Monolith.
- Bắt đầu phác thảo thiết kế cơ sở dữ liệu ERD (mức quan niệm).

2. **Những việc chưa làm được:**

- Các công việc thiết kế kỹ thuật thuộc giai đoạn Tuần 2 – 3 chưa hoàn thành trong Tuần 2 và được kéo dài sang Tuần 3 để tiếp tục hoàn thiện, bao gồm:
  - Thiết kế kiến trúc Client–Server theo hướng Modular Monolith và các sơ đồ kiến trúc liên quan (sơ đồ C4 Model, Sơ đồ lớp - Class Diagram).
  - Thiết kế cơ sở dữ liệu ERD chi tiết (Physical ERD với đầy đủ các bảng, quan hệ, khóa chính, khóa ngoại, chỉ mục).
  - Xây dựng Sequence Diagrams cho các luồng nghiệp vụ cốt lõi.
  - Đóng gói hoàn thiện bộ tài liệu SRS và SDD.

3. **Những vướng mắc, khó khăn:**

- Hệ thống có 26 Use Case với nhiều luồng nghiệp vụ và trường hợp ngoại lệ, cần sự rà soát kỹ lưỡng để đảm bảo tính nhất quán giữa Use Case, Business Rules và Data Dictionary.
- Một số luồng nghiệp vụ đặc thù (chuyển giao quyền Owner trước khi rời nhóm, bóc tách danh tính bài viết ẩn danh, phân quyền trong Circle) cần được làm rõ chi tiết trước khi chuyển sang thiết kế kiến trúc, cơ sở dữ liệu chi tiết và Sequence Diagram.
- Cần đảm bảo sự thống nhất tuyệt đối giữa yêu cầu chức năng (SRS) và các tài liệu thiết kế (SDD) của hệ thống.

4. **Câu hỏi (nếu có):**

- Xin ý kiến góp ý của GVHD về tài liệu đặc tả yêu cầu, danh sách Use Case và các Business Rules chính của hệ thống CIRCLE.

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Hoàn thiện thiết kế kiến trúc Client–Server theo hướng Modular Monolith và các sơ đồ kiến trúc liên quan (sơ đồ C4 Model, Sơ đồ lớp - Class Diagram).
- Hoàn thiện thiết kế cơ sở dữ liệu ERD chi tiết và chuẩn bị cấu trúc ánh xạ sang Prisma Schema.
- Hoàn thiện Sequence Diagrams cho các luồng nghiệp vụ cốt lõi.
- Hoàn thiện và đóng gói đầy đủ bộ tài liệu SRS và SDD.
- Rà soát toàn bộ tài liệu thiết kế và chuẩn bị các yêu cầu kỹ thuật để bước vào giai đoạn thiết lập hạ tầng mã nguồn và môi trường phát triển (Tuần 4: NestJS, Next.js, React Native/Expo, Docker, CI).

---

### Giai đoạn: Tuần 3 (31/08/2026 – 06/09/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Hoàn thiện thiết kế kiến trúc Client–Server theo hướng Modular Monolith và các sơ đồ kiến trúc liên quan: hoàn thành sơ đồ C4 Model (Context, Container, Component Diagrams) và Sơ đồ lớp miền nghiệp vụ (Domain Class Diagram).
- Hoàn thiện thiết kế cơ sở dữ liệu ERD chi tiết (Physical ERD gồm đầy đủ các bảng dữ liệu, quan hệ 1-N, N-N, khóa chính, khóa ngoại, chỉ mục) và chuẩn bị cấu trúc ánh xạ sang Prisma Schema.
- Hoàn thiện Sequence Diagrams cho các luồng nghiệp vụ cốt lõi: Luồng xác thực tài khoản JWT và luân chuyển Refresh Token, Luồng tạo và quản lý Circle, Luồng gửi nhận tin nhắn thời gian thực qua Socket.IO, Luồng báo hiệu cuộc gọi đàm thoại WebRTC (Signaling Offer/Answer/ICE) qua máy chủ Coturn (STUN/TURN).
- Hoàn thiện và đóng gói đầy đủ bộ tài liệu Đặc tả Yêu cầu Phần mềm (SRS) và tài liệu Thiết kế Phần mềm (SDD - Software Design Document).
- Rà soát toàn diện sự thống nhất giữa SRS, SDD, ERD, 26 Use Cases và chuẩn bị các thông số kỹ thuật sẵn sàng cho giai đoạn thiết lập môi trường và phát triển hệ thống ở Tuần 4.

2. **Những việc chưa làm được:**

- Không có. Nhóm đã hoàn thành toàn bộ các công việc và sản phẩm dự kiến của giai đoạn Tuần 2 – 3 theo đúng kế hoạch đề ra (hoàn thành đầy đủ: SRS, User Stories, Acceptance Criteria, Business Rules, Data Dictionary, Use Case Diagram, SDD, Architecture/C4 Diagram, ERD, Sequence Diagrams), không có công việc tồn đọng bị kéo dài sang giai đoạn sau.

3. **Những vướng mắc, khó khăn:**

- Việc thiết kế cơ sở dữ liệu ERD cho một mạng xã hội nhóm đòi hỏi cân đối giữa tính toàn vẹn dữ liệu quan hệ (PostgreSQL) và hiệu năng truy vấn nhanh cho các tác vụ thời gian thực (tin nhắn nhóm, trạng thái cuộc gọi, sự kiện).
- Luồng Signaling WebRTC cho Voice/Video Call và luồng định tuyến tin nhắn Socket.IO tương đối phức tạp, cần mô hình hóa cẩn trọng trong Sequence Diagrams để tránh tình trạng race-condition khi triển khai thực tế.
- Cần thống nhất quy chuẩn kiến trúc Monorepo để chia sẻ mã nguồn dùng chung (DTO, Types, Locales) giữa Backend, Web và Mobile mà không bị phụ thuộc chéo vòng lặp (circular dependency).

4. **Câu hỏi (nếu có):**

- Xin ý kiến góp ý của GVHD về bộ tài liệu thiết kế phần mềm (SDD), Sơ đồ kiến trúc C4 Model và Sơ đồ cơ sở dữ liệu ERD trước khi nhóm bắt đầu tiến hành thiết lập hạ tầng mã nguồn và cài đặt hệ thống ở Tuần 4.

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Thiết lập Backend với NestJS, TypeScript, Prisma và PostgreSQL.
- Thiết lập Web Application với Next.js và Mobile Application với React Native/Expo.
- Thiết lập Docker môi trường phát triển (PostgreSQL, Redis).
- Thiết lập Git/GitHub, quy chuẩn Branch/PR và luồng CI cơ bản.
- Xây dựng Authentication/Authorization với JWT, Refresh Token và RBAC.
- Xây dựng các chức năng tài khoản cơ bản (đăng ký, đăng nhập, hồ sơ cá nhân).