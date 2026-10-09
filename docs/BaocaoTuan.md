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

---

### Giai đoạn: Tuần 4 (07/09/2026 – 13/09/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Thiết lập cấu trúc Monorepo Workspace quản lý tập trung Backend, Web, Mobile và thư viện chia sẻ dùng chung (`@circle/shared`, `@circle/types`).
- Thiết lập Backend với NestJS, TypeScript, Prisma ORM và hệ quản trị cơ sở dữ liệu PostgreSQL 16.
- Khởi tạo ứng dụng Web với Next.js 14 (App Router, TailwindCSS) và ứng dụng Mobile với React Native / Expo.
- Thiết lập Docker Compose cho môi trường phát triển cục bộ (chạy container hóa PostgreSQL 16 và Redis 7).
- Thiết lập quy trình Git/GitHub, chiến lược phân nhánh (Branching strategy), quy chuẩn Conventional Commits, quy định bắt buộc Review PR chéo (Mandatory Peer Review) và quy trình CI cơ bản với GitHub Actions.
- Xây dựng hệ thống Xác thực & Phân quyền (Authentication/Authorization) hoàn chỉnh: Đăng ký tài khoản, Đăng nhập, cơ chế luân chuyển JWT Access Token và Refresh Token an toàn, mã hóa mật khẩu bằng bcrypt và phân quyền RBAC qua RoleGuard (`@Roles()`).
- Xây dựng các chức năng tài khoản cơ bản: API lấy thông tin tài khoản hiện tại (`/auth/me`), hồ sơ người dùng (`UserProfile`), cập nhật thông tin cá nhân cơ bản trên cả Web và Mobile.

2. **Những việc chưa làm được:**

- Không có. Nhóm đã hoàn thành toàn bộ các công việc và sản phẩm dự kiến của Tuần 4 theo đúng kế hoạch đề ra (Backend Foundation, Database Migration, Authentication API, Web/Mobile Skeleton, Docker, Git Workflow, CI cơ bản), không có công việc tồn đọng bị kéo dài sang tuần sau.

3. **Những vướng mắc, khó khăn:**

- Việc đồng bộ hóa môi trường phát triển giữa các nền tảng (Node.js, Docker, React Native Expo) trên hệ điều hành của hai thành viên cần được cấu hình chuẩn hóa qua Docker để tránh lỗi phát sinh do khác biệt phiên bản.
- Cấu hình quản lý Refresh Token an toàn (sử dụng httpOnly Cookie trên Web và SecureStore trên Mobile) đòi hỏi thiết lập cơ chế xử lý linh hoạt cho cả hai nền tảng client.

4. **Câu hỏi (nếu có):**

- Báo cáo GVHD về việc hoàn thành khởi tạo hạ tầng mã nguồn và hệ thống xác thực Auth/RBAC, xin ý kiến về cấu trúc phân chia module nghiệp vụ của giai đoạn tiếp theo.

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Xây dựng hoàn thiện quản lý hồ sơ cá nhân và bạn bè.
- Xây dựng tạo, tham gia và quản lý Circle.
- Xây dựng phân quyền thành viên trong Circle.
- Thiết lập WebSocket/Socket.IO Gateway.
- Bắt đầu phát triển Chat nhóm cốt lõi và tích hợp lưu trữ media với Cloudflare R2.

---

### Giai đoạn: Tuần 5 (14/09/2026 – 20/09/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Xây dựng hoàn thiện chức năng Quản lý hồ sơ cá nhân và Bạn bè: API tìm kiếm người dùng, gửi lời mời kết bạn, chấp nhận/từ chối lời mời và quản lý danh sách bạn bè.
- Xây dựng Không gian nhóm cốt lõi (Circle Core): Thiết kế và áp dụng Migration Prisma cho các bảng `Circle`, `CircleMember`, `CircleInvite`; triển khai API tạo Circle (tự động thiết lập người tạo là Owner và khởi tạo kênh chat mặc định `#general`), cập nhật thông tin Circle, tra cứu danh sách Circle của người dùng.
- Xây dựng cơ chế Phân quyền thành viên trong Circle: Phân tách rõ vai trò Circle Owner và Circle Member; tạo mã mời (Invite Code) và liên kết tham gia nhóm (Invite Link); xét duyệt yêu cầu gia nhập; đổi biệt danh (nickname) thành viên nội bộ trong nhóm (`UC20`).
- Thiết lập hạ tầng WebSocket/Socket.IO Gateway ở Backend: Xây dựng cơ chế xác thực JWT qua Socket handshake, quản lý room thời gian thực theo từng `circle_id`.
- Tích hợp dịch vụ lưu trữ đám mây Cloudflare R2 (tương thích S3 API): Xây dựng API sinh Presigned URL an toàn phục vụ việc tải lên ảnh đại diện và tệp đính kèm.

2. **Những việc chưa làm được:**

- Các công việc thuộc giai đoạn Tuần 5 – 6 chưa hoàn tất trong Tuần 5 và được kéo dài sang Tuần 6 để tiếp tục hoàn thiện, bao gồm:
  - Hệ thống Chat nhóm thời gian thực (gửi/nhận tin nhắn văn bản, hình ảnh, video, tập tin đính kèm và tin nhắn thoại - Voice message) mới hoàn thiện cấu trúc dữ liệu và API cơ bản, chưa hoàn thiện tích hợp đầy đủ Socket Events thời gian thực hai chiều trên cả Web và Mobile.
  - Các tính năng nâng cao trong chat nhóm: Trả lời tin nhắn (Reply), Thả cảm xúc tin nhắn (Reaction) và Ghim tin nhắn (`UC13`).
  - Giao diện khung chat ảo hóa (Virtual Message List) cuộn mượt mà trên Web và Mobile.

3. **Những vướng mắc, khó khăn:**

- Cơ chế phân quyền trong Circle cần được kiểm soát chặt chẽ tại tầng Socket Gateway để đảm bảo chỉ những thành viên đang hoạt động trong Circle mới được quyền tham gia room và lắng nghe sự kiện chat.
- Việc xử lý tải lên media qua Presigned URL trực tiếp từ client lên Cloudflare R2 cần cấu hình CORS và chính sách bucket chặt chẽ để đảm bảo an toàn dữ liệu.

4. **Câu hỏi (nếu có):**

- Xin ý kiến góp ý của GVHD về kiến trúc định tuyến sự kiện Socket.IO Gateway theo từng Circle và giải pháp lưu trữ media đám mây qua Cloudflare R2.

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Hoàn thiện toàn diện hệ thống Chat nhóm thời gian thực (gửi tin nhắn văn bản, hình ảnh, video, tệp tin và voice message) qua Socket.IO.
- Xây dựng tính năng Reply (trả lời tin nhắn), Message Reaction (thả cảm xúc) và Ghim tin nhắn (`UC13`).
- Hoàn thiện giao diện khung chat ảo hóa cuộn mượt mà và trình phát Media/Voice Message trên Web và Mobile.
- Hoàn thiện các thao tác quản trị nhóm nâng cao: Rời nhóm, Chuyển nhượng quyền Owner (`UC25`), Giải tán nhóm (`UC26`).
- Thực hiện kiểm thử chéo (Cross-Testing & Peer Review) giữa hai thành viên để nghiệm thu toàn bộ Module 3 (Circle Core) và Module 4 (Chat Realtime & Media).

---

### Giai đoạn: Tuần 6 (21/09/2026 – 27/09/2026)

**Thành viên thực hiện:** Trương Công Bình, Ninh Thị Mỹ Hạnh

1. **Những việc đã làm được:**

- Hoàn thiện toàn diện hệ thống Chat nhóm thời gian thực qua Socket.IO: phát và nhận tin nhắn tức thì theo kênh trong Circle, cập nhật trạng thái tin nhắn theo thời gian thực.
- Xây dựng hoàn chỉnh gửi tin nhắn đa phương tiện: hỗ trợ gửi ảnh, video, tệp tin tài liệu (giới hạn tối đa 25MB) và ghi âm / phát tin nhắn thoại (Voice Message) trực tiếp trong khung chat thông qua Cloudflare R2.
- Xây dựng tính năng Reply (trả lời trích dẫn tin nhắn) và Reaction (thả cảm xúc emoji trên tin nhắn) đồng bộ thời gian thực cho toàn bộ thành viên trong Circle.
- Xây dựng tính năng Ghim và Bỏ ghim tin nhắn (`UC13`) lên đầu đoạn chat nhóm.
- Hoàn thiện giao diện khung chat ảo hóa (Virtual Message List) cuộn mượt mà không giật lag trên cả Web Next.js và ứng dụng Mobile React Native/Expo.
- Hoàn thiện các nghiệp vụ quản trị Circle nâng cao: Chặn Owner tự ý rời nhóm nếu chưa chuyển quyền (`UC22`), Chuyển nhượng quyền Owner (`UC25`), Giải tán Circle (`UC26`).
- Thực hiện kiểm thử chéo (Cross-Testing) và Review mã nguồn chéo (Peer Review PR) đạt 100% tiêu chí nghiệm thu (DoD) cho toàn bộ Module 3 (Circle Core) và Module 4 (Chat Realtime & Media Storage).

2. **Những việc chưa làm được:**

- Không có. Nhóm đã hoàn thành toàn bộ các công việc và sản phẩm dự kiến của giai đoạn Tuần 5 – 6 theo đúng kế hoạch đề ra (hoàn thành đầy đủ: API Account/Friend/Circle, phân quyền Circle, Chat nhóm realtime qua Socket.IO, lưu trữ media Cloudflare R2, Reply/Reaction, Pin message, giao diện Web và Mobile), không có công việc tồn đọng bị kéo dài sang giai đoạn sau.

3. **Những vướng mắc, khó khăn:**

- Xử lý đồng bộ hóa danh sách tin nhắn khi người dùng cuộn trang tải thêm tin nhắn cũ (Cursor-based pagination) kết hợp đồng thời với tin nhắn mới tới qua WebSocket cần tối ưu kỹ lưỡng để tránh hiện tượng giật màn hình hoặc nhảy thanh cuộn.
- Việc ghi âm và phát âm thanh Voice message trên ứng dụng di động React Native cần xử lý quyền microphone và quản lý trạng thái âm thanh hệ thống để đạt độ tương thích cao.

4. **Câu hỏi (nếu có):**

- Báo cáo GVHD về việc hoàn thành Module 3 (Không gian nhóm Circle) và Module 4 (Chat nhóm thời gian thực), xin ý kiến định hướng về việc triển khai tính năng Moments chia sẻ khoảnh khắc và PoC WebRTC Video Call ở giai đoạn Tuần 7 – 8.

5. **Những việc sẽ làm trong tuần tiếp theo:**

- Bước sang giai đoạn Tuần 7 – 8 theo kế hoạch:
  - Nghiên cứu và xây dựng tính năng Khoảnh khắc nội bộ (Moments): đăng ảnh khoảnh khắc, khay hiển thị Moments, cơ chế lựa chọn Circle được xem nội dung chia sẻ (Circle-based Privacy).
  - Nghiên cứu kiến trúc WebRTC và thực hiện PoC (Proof of Concept) cho tính năng Gọi thoại / Gọi video nhóm (Voice Call / Video Call).
  - Thiết lập máy chủ Coturn (STUN/TURN) và xây dựng WebRTC Signaling Gateway qua Socket.IO.
  - Kiểm thử quyền truy cập camera/microphone, kết nối P2P, cơ chế reconnect và các trường hợp lỗi kết nối.