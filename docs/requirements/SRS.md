## Xác định yêu cầu

### Yêu cầu chức năng

- **Yêu cầu chức năng nghiệp vụ**

**Lưu trữ:**

- Lưu trữ thông tin tài khoản người dùng: Họ tên, địa chỉ email, mật khẩu mã hóa, trạng thái tài khoản (Chưa kích hoạt, Đang hoạt động, Bị khóa) và mã số xác thực OTP kèm thời hạn hiệu lực.
- Lưu trữ hồ sơ cá nhân của người dùng: Tên hiển thị công khai, ảnh đại diện, tiểu sử ngắn và trạng thái trực tuyến.
- Lưu trữ mối quan hệ bạn bè: Định danh tài khoản người gửi, tài khoản người nhận, trạng thái kết nối (Đang chờ duyệt, Bạn bè, Đã chặn) và thời điểm thiết lập quan hệ.
- Lưu trữ cấu hình thông báo cá nhân: Cài đặt bật/tắt chuông thông báo, chế độ rung, thông báo tin nhắn và thông báo sự kiện nhóm.
- Lưu trữ thông tin không gian Circle: Mã định danh Circle duy nhất (Circle ID), tên Circle, ảnh đại diện, mô tả mục đích hoạt động, đường dẫn liên kết tham gia, cấu hình phê duyệt thành viên (Tự do hoặc Cần duyệt) và định danh của Trưởng nhóm.
- Lưu trữ thành viên Circle: Liên kết tài khoản người dùng với Circle, vai trò trong nhóm (Circle Owner hoặc Circle Member), biệt danh riêng trong nhóm (nickname), thời điểm gia nhập và trạng thái thành viên (Đang hoạt động, Đã rời nhóm, Bị trục xuất).
- Lưu trữ khoảnh khắc nội bộ (Moments): Đường dẫn tệp ảnh, chú thích đính kèm, định danh người đăng, định danh Circle, thời điểm đăng tải và danh sách biểu tượng cảm xúc (reactions). (Hệ thống không lưu trữ danh sách bình luận riêng dưới Moment; mọi tương tác bằng tin nhắn/phản hồi sẽ được chuyển thành một tin nhắn trích dẫn trực tiếp trong khung chat chung của Circle).
- Lưu trữ tin nhắn nhóm: Mã tin nhắn, định danh Circle, người gửi, phân loại nội dung (văn bản, hình ảnh, tập tin đính kèm, ghi âm giọng nói), thời điểm gửi, trạng thái ghim lên đầu đoạn chat và trạng thái thu hồi.
- Lưu trữ lịch sử cuộc gọi nhóm: Mã phiên gọi, định danh Circle, người khởi tạo, loại cuộc gọi (Thoại hoặc Video), thời gian bắt đầu, thời lượng cuộc gọi và danh sách thành viên tham gia.
- Lưu trữ Album kỷ niệm nhóm: Tên chủ đề Album, định danh Circle, người tạo album, danh mục các hình ảnh/video chất lượng cao được lưu trữ cùng thông tin người tải lên và thời gian lưu.
- Lưu trữ cuộc thăm dò ý kiến (Group Poll): Câu hỏi thăm dò, danh sách các phương án bình chọn, tùy chọn (chọn một hay nhiều đáp án), hạn kết thúc và danh sách người dùng đã bỏ phiếu cho từng phương án.
- Lưu trữ vòng xoay may mắn (Decision Wheel): Danh sách các phương án/tùy chọn trong vòng xoay, màu sắc hiển thị và kết quả của các lượt quay vừa diễn ra.
- Lưu trữ lịch sự kiện nhóm (Group Calendar): Tên sự kiện, thời gian bắt đầu, thời gian kết thúc, địa điểm tổ chức, nội dung ghi chú và mốc thời gian thiết lập nhắc hẹn tự động.
- Lưu trữ bảng kế hoạch cộng tác (Collaborative Plan / Sheet): Cấu trúc bảng tính nội bộ, danh mục các dòng công việc,
- Lưu trữ vị trí chia sẻ thời gian thực (Live Location): Tọa độ địa lý (kinh độ, vĩ độ) hiện tại của thành viên, mốc thời gian cập nhật gần nhất và thời hạn hiệu lực của phiên chia sẻ vị trí.
- Lưu trữ bài viết ẩn danh ("Điều muốn nói"): Nội dung tâm sự/góp ý, mẫu thiệp trang trí, mốc thời gian đăng; tuyệt đối loại bỏ và không lưu trữ thông tin nhận diện tài khoản tác giả ra giao diện.

**Tra cứu:**

- **Tra cứu thông tin người dùng và bạn bè:** Hỗ trợ tìm kiếm tài khoản theo địa chỉ email hoặc tên hiển thị để phục vụ gửi yêu cầu kết bạn.
- **Tra cứu danh sách bạn bè:** Truy xuất toàn bộ danh bạ bạn bè đang hoạt động để thuận tiện tích chọn mời vào các Circle.
- **Tra cứu Circle:** Tìm kiếm Circle bằng mã Circle ID hoặc qua đường dẫn mời (Invite Link) để xem trước thông tin cơ bản (tên nhóm, ảnh đại diện, số lượng thành viên).
- **Tra cứu khoảnh khắc nội bộ:** Tải và hiển thị luồng Moments của các thành viên trong Circle được đăng tải.
- **Tra cứu lịch sử trò chuyện và tệp tin:** Tìm kiếm nội dung tin nhắn, tra cứu kho tệp tin phương tiện (ảnh, tài liệu, liên kết) đã gửi bên trong Circle.
- **Tra cứu lịch sự kiện và lời nhắc:** Hiển thị toàn bộ các mốc sự kiện của nhóm theo chế độ xem lịch tháng, tuần hoặc ngày.
- **Tra cứu danh sách thành viên và yêu cầu gia nhập:** Cho phép xem danh sách thành viên hiện tại trong Circle và truy xuất danh sách các đơn xin gia nhập đang chờ Owner phê duyệt.

**Tính toán:**

- **Quản lý quy mô và trạng thái Circle:** Tự động tính toán và cập nhật tổng số lượng thành viên đang hoạt động trong nhóm theo thời gian thực. Hệ thống cho phép một người dùng khởi tạo Circle độc lập trước khi gửi lời mời cho các thành viên khác, đồng thời thiết lập giới hạn số lượng thành viên tối đa được tham gia vào Circle.
- **Xác định vai trò quản trị duy nhất:** Tự động chỉ định người tạo nhóm làm Circle Owner; kiểm tra và không cho phép Circle Owner tự ý rời nhóm nếu nhóm còn từ 2 thành viên trở lên khi chưa thực hiện chuyển giao quyền quản trị.
- **Tính toán kết quả bình chọn (Poll):** Tự động thống kê số phiếu, tính toán tỷ lệ phần trăm theo thời gian thực cho từng phương án lựa chọn và xác định phương án chiếm đa số.
- **Thuật toán sinh kết quả ngẫu nhiên (Spin Wheel):** Sinh góc quay và lựa chọn ngẫu nhiên trên máy chủ để đảm bảo tính công bằng, đồng bộ hóa thời gian và góc dừng của vòng xoay trên thiết bị của toàn bộ thành viên.
- **Kiểm soát thời hạn chia sẻ vị trí:** Tự động ngắt phát sóng tọa độ GPS ngay khi đồng hồ đếm ngược của phiên chia sẻ kết thúc (15 phút, 30 phút, 1 giờ).
- **Bóc tách danh tính bài viết ẩn danh:** Tự động loại trừ toàn bộ siêu dữ liệu (user_id, author_info) khi lưu và xuất bản nội dung bài viết thuộc tính năng "Điều muốn nói".

**Kết xuất:**

- **Gửi thư điện tử xác thực:** Tự động gửi email chứa mã OTP kích hoạt tài khoản hoặc mã khôi phục mật khẩu.
- **Phát tín hiệu thời gian thực (Real-time Broadcast):** Đẩy thông báo tức thời qua giao thức WebSocket khi có tin nhắn mới, có bình luận trên Moment, có cuộc gọi nhóm hoặc có thay đổi trên bảng kế hoạch cộng tác.
- **Hiển thị giao diện khoảnh khắc (Moments Feed):** Kết xuất khay ảnh dạng tròn/lưới hiển thị trực quan các khoảnh khắc đang hoạt động của các thành viên.
- **Kết xuất bảng kế hoạch và lịch biểu:** Hiển thị trực quan dữ liệu dạng bảng tính cộng tác (Planning Sheet) và giao diện lịch hẹn (Calendar view) cho toàn bộ thành viên.
- **Kết xuất tọa độ trên bản đồ:** Hiển thị avatar di chuyển trực tiếp của các thành viên đang chia sẻ vị trí lên giao diện bản đồ nội bộ.
- **Thông báo hệ thống nội bộ:** Tự động phát tin nhắn thông báo vào khung chat khi có sự kiện: thành viên mới gia nhập, thành viên rời nhóm, đổi biệt danh hoặc chuyển nhượng quyền Owner thành công.

**❖ Bảng yêu cầu chức năng theo từng tác nhân**

**Khách vãng lai (Guest)**

**Bộ phận:** Khách vãng lai **Mã số:** GUEST

**Bảng 1.1. Bảng yêu cầu chức năng Khách vãng lai**

| **STT** | **Công việc**                                                   | **Loại công việc**         | **Quy định/Công thức liên quan**                                                                                                 | **Biểu mẫu liên quan** | **Ghi chú**                                                                      |
| ------- | --------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| 1       | **UC01: Register Account**<br><br>_(Đăng ký tài khoản)_         | Lưu trữ, Kết xuất          | • Nhập đầy đủ: Họ tên, Email (duy nhất), Mật khẩu và Xác nhận mật khẩu.<br><br>• Hệ thống tự động gửi mã OTP xác minh qua email. |                        | Người dùng phải xác minh email thành công mới được chuyển thành User.            |
| 2       | **UC02: Sign In**<br><br>_(Đăng nhập hệ thống)_                 | Tra cứu, Kết xuất          | • Đối chiếu chính xác Email và Mật khẩu đã đăng ký.<br><br>• Tài khoản phải ở trạng thái đã kích hoạt và không bị khóa.          |                        | Đăng nhập thành công sẽ được cấp Token phiên làm việc và chuyển vào trang chính. |
| 3       | **UC03: Recover Password**<br><br>_(Quên / Khôi phục mật khẩu)_ | Tra cứu, Lưu trữ, Kết xuất | • Xác thực thông qua địa chỉ Email đã đăng ký và mã OTP khôi phục.<br><br>• Cho phép cập nhật mật khẩu mới khi mã OTP hợp lệ.    |                        | Sau khi đổi mật khẩu thành công, chuyển hướng người dùng về màn hình đăng nhập.  |

**Người dùng nền tảng (User)**

**Bộ phận:** Người dùng nền tảng **Mã số:** USER

**Bảng 1.2. Bảng yêu cầu chức năng Người dùng**

| **STT** | **Công việc**                                                                                 | **Loại công việc**           | **Quy định/Công thức liên quan**                                                                                                                      | **Biểu mẫu liên quan** | **Ghi chú**                                                              |
| ------- | --------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| 1       | **UC04: Manage User Profile**<br><br>_(Quản lý hồ sơ cá nhân)_                                | Tra cứu, Lưu trữ             | • Cập nhật tên hiển thị, ảnh đại diện, tiểu sử.<br><br>• Định dạng ảnh hợp lệ (JPG/PNG), kích thước 5MB.                                              |                        | Thông tin được hiển thị đồng bộ trong các Circle mà người dùng tham gia. |
| 2       | **UC05: Change Password & Notification Settings**<br><br>_(Đổi mật khẩu & Cài đặt thông báo)_ | Tra cứu, Lưu trữ             | • Yêu cầu nhập đúng mật khẩu hiện tại.<br><br>• Mật khẩu mới phải khác mật khẩu cũ và đủ độ dài an toàn.<br><br>• Bật/tắt các tùy chọn thông báo đẩy. |                        | Tự động lưu cấu hình nhận thông báo đẩy trên thiết bị.                   |
| 3       | **UC06: Manage Friend Connections**<br><br>_(Quản lý kết nối bạn bè)_                         | Tra cứu, Lưu trữ, Kết xuất   | • Tìm kiếm bạn bè theo email hoặc tên hiển thị.<br><br>• Gửi, chấp nhận, từ chối lời mời hoặc hủy kết bạn.                                            |                        | Phục vụ trực tiếp cho việc chọn mời bạn bè vào các Circle.               |
| 4       | **UC07: Create Circle**<br><br>_(Khởi tạo Circle mới)_                                        | Lưu trữ, Tính toán, Kết xuất | • Nhập tên Circle (bắt buộc), ảnh và mô tả.<br><br>• Tự động gán quyền Circle Owner cho người tạo.                                                    |                        | Circle được tạo luôn có đúng một Owner duy nhất.                         |
| 5       | **UC08: Search & Request Circle Join**<br><br>_(Tìm kiếm & Xin tham gia Circle)_              | Tra cứu, Lưu trữ             | • Nhập mã Circle ID hoặc truy cập qua đường link mời.<br><br>• Nhóm chưa đạt giới hạn thành viên mới cho phép gửi yêu cầu.                            |                        | Yêu cầu được chuyển vào hàng đợi duyệt của Circle Owner.                 |

**Thành viên nhóm (Circle Member)**

**Bộ phận:** Thành viên nhóm **Mã số:** MEMBER

**Bảng 1.3. Bảng yêu cầu chức năng Thành viên nhóm**

| **STT** | **Công việc**                                                                                | **Loại công việc**           | **Quy định/Công thức liên quan**                                                                                                                                        | **Biểu mẫu liên quan** | **Ghi chú**                                                   |
| ------- | -------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| 1       | **UC09: Publish Circle Moment**<br><br>_(Đăng khoảnh khắc nội bộ)_                           | Lưu trữ, Kết xuất            | • Chụp ảnh hoặc chọn ảnh đăng vào Circle cụ thể.                                                                                                                        |                        | Không chia sẻ ra ngoài phạm vi nhóm.                          |
| 2       | **UC10: View & React to Moments**<br><br>_(Xem & Tương tác khoảnh khắc)_                     | Tra cứu, Lưu trữ, Kết xuất   | • Thả biểu tượng cảm xúc (Reaction) dưới ảnh.<br><br>• Phản hồi Moment bằng tin nhắn sẽ tự động trích dẫn ảnh khoảnh khắc và gửi thẳng vào khung chat chung của Circle. |                        | Đồng bộ thời gian thực cho các thành viên trong nhóm.         |
| 3       | **UC11: Send Multimedia Messages**<br><br>_(Nhắn tin đa phương tiện trong nhóm)_             | Lưu trữ, Kết xuất            | • Gửi tin nhắn văn bản, hình ảnh, tài liệu, tin nhắn thoại.<br><br> <br><br>• Giới hạn dung lượng tệp đính kèm 25MB.                                                    |                        | Toàn bộ tương tác nhắn tin chỉ diễn ra trong không gian nhóm. |
| 4       | **UC12: Initiate Group Call**<br><br>_(Thực hiện cuộc gọi nhóm)_                             | Kết xuất                     | • Thực hiện gọi thoại hoặc video nhóm theo thời gian thực.<br><br>• Kết nối qua công nghệ WebRTC/VoIP.                                                                  |                        | Hỗ trợ nhiều thành viên cùng tham gia đàm thoại.              |
| 5       | **UC13: Pin / Unpin Message**<br><br>_(Ghim / Bỏ ghim tin nhắn)_                             | Lưu trữ, Kết xuất            | • Chọn tin nhắn trong đoạn chat và gắn cờ ghim.<br><br>• Hiển thị nội dung tóm tắt trên đầu giao diện chat.                                                             |                        | Cho phép mọi thành viên trong nhóm thực hiện.                 |
| 6       | **UC14: Manage Shared Album**<br><br>_(Quản lý Album kỷ niệm chung)_                         | Tra cứu, Lưu trữ             | • Tạo album ảnh theo chủ đề.<br><br>• Tải ảnh chất lượng cao lên và tải ảnh về máy.                                                                                     |                        | Thành viên có quyền xóa ảnh do chính mình tải lên.            |
| 7       | **UC15: Manage Group Poll**<br><br>_(Quản lý bình chọn tập thể)_                             | Lưu trữ, Tính toán, Kết xuất | • Tạo câu hỏi và các phương án biểu quyết.<br><br>• Thống kê tỷ lệ và cập nhật phần trăm theo thời gian thực.                                                           |                        | Cho phép đổi phiếu bầu trước khi kết thúc cuộc thăm dò.       |
| 8       | **UC16: Spin Decision Wheel**<br><br>_(Quay vòng xoay may mắn)_                              | Tính toán, Kết xuất          | • Nhập tối thiểu 2 phương án lựa chọn.<br><br>• Máy chủ sinh kết quả ngẫu nhiên và quay đồng bộ.                                                                        | Giao diện Vòng xoay    | Kết quả được tự động thông báo vào nhóm.                      |
| 9       | **UC17: Manage Group Calendar & Reminders**<br><br> <br><br>_(Quản lý lịch nhóm & Nhắc hẹn)_ | Tra cứu, Lưu trữ, Kết xuất   | • Tạo sự kiện có ngày giờ, địa điểm, ghi chú.<br><br> <br><br>• Thiết lập thời gian gửi thông báo nhắc hẹn trước.                                                       |                        | Thông báo tự động kích hoạt đến toàn thể thành viên.          |
| 10      | **UC18: Collaborate on Planning Sheet**<br><br>_(Lập bảng kế hoạch cộng tác)_                | Lưu trữ, Kết xuất            | • Bảng tính<br><br>• Đồng bộ hóa chỉnh sửa tức thời (real-time).                                                                                                        |                        |                                                               |
| 11      | **UC19: Share Live Location**<br><br>_(Chia sẻ vị trí trực tiếp)_                            | Lưu trữ, Tính toán, Kết xuất | • Bật phát sóng vị trí GPS trong 15 phút, 30 phút, 1 giờ.<br><br>• Hiển thị avatar di chuyển trên bản đồ số nhóm.                                                       |                        | Có thể chủ động tắt chia sẻ vị trí bất kỳ lúc nào.            |
| 12      | **UC20: Update Circle Nickname**<br><br>_(Cập nhật biệt danh nội bộ)_                        | Lưu trữ, Kết xuất            | • Đổi tên hiển thị riêng trong Circle mục tiêu.<br><br>• Không làm đổi tên tài khoản gốc trên toàn hệ thống.                                                            |                        | Gửi tin nhắn thông báo đổi biệt danh vào khung chat.          |
| 13      | **UC21: Submit Anonymous Post ("Words Unsaid")**<br><br>_(Gửi bài viết ẩn danh)_             | Lưu trữ, Tính toán, Kết xuất | • Viết tâm sự/chia sẻ vào mục "Điều muốn nói".<br><br>• Hệ thống bóc tách hoàn toàn danh tính người gửi.                                                                |                        | Cả nhóm và Trưởng nhóm đều không biết ai là tác giả.          |
| 14      | **UC22: Leave Circle**<br><br>_(Rời khỏi Circle)_                                            | Lưu trữ, Tính toán, Kết xuất | • Thành viên tự nguyện thoát khỏi Circle.<br><br>• Chuyển trạng thái LEFT, thu hồi quyền truy cập mới nhưng giữ nguyên lịch sử cũ cho nhóm.                             |                        | Nếu là Owner thì bị chặn rời khi nhóm còn thành viên khác.    |

**Trưởng nhóm (Circle Owner)**

**Bộ phận:** Trưởng nhóm **Mã số:** OWNER

**Bảng 1.4. Bảng yêu cầu chức năng Trưởng nhóm**

| **STT** | **Công việc**                                                                  | **Loại công việc**          | **Quy định/Công thức liên quan**                                                                                                                                                                      | **Biểu mẫu liên quan** | **Ghi chú**                                                |
| ------- | ------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| 1       | **UC23: Update Circle Metadata**<br><br>_(Cập nhật thông tin Circle)_          | Tra cứu, Lưu trữ            | • Chỉnh sửa tên nhóm, ảnh đại diện, ảnh bìa, mô tả.<br><br>• Cấu hình chế độ tham gia (Tự do hoặc Cần duyệt).                                                                                         |                        | Chỉ Owner mới có quyền thay đổi thông tin này.             |
| 2       | **UC24: Manage Circle Members**<br><br>_(Quản lý thành viên Circle)_           | Tra cứu, Lưu trữ, Tính toán | • Xem danh sách và thực hiện trục xuất thành viên vi phạm.<br><br>• Phê duyệt hoặc từ chối các yêu cầu gia nhập trong hàng đợi.<br><br>• Không cho duyệt thêm nếu số lượng đã đạt đạt giới hạn người. |                        |                                                            |
| 3       | **UC25: Transfer Circle Ownership**<br><br>_(Chuyển nhượng quyền Trưởng nhóm)_ | Lưu trữ, Kết xuất           | • Chỉ định một thành viên khác lên làm Circle Owner.<br><br>• Yêu cầu nhập mật khẩu tài khoản để xác thực bảo mật.<br><br> <br><br>• Owner cũ tự động chuyển thành Circle Member.                     |                        | Hành động không thể hoàn tác sau khi xác nhận.             |
| 4       | **UC26: Dissolve Circle**<br><br>_(Giải tán Circle)_                           | Lưu trữ, Kết xuất           | • Xóa vĩnh viễn Circle khỏi hệ thống.<br><br>• Thu hồi toàn bộ quyền truy cập của tất cả thành viên.<br><br>• Đánh dấu xóa (is_deleted = true) dữ liệu nhóm.                                          |                        | Yêu cầu xác thực mật khẩu nghiêm ngặt trước khi thực hiện. |

- Yêu cầu chức năng hệ thống

**Môi trường:**

Về môi trường triển khai, hệ thống CIRCLE hoạt động chủ yếu trên nền tảng ứng dụng di động (Mobile Application) dành cho hai hệ điều hành phổ biến là iOS và Android, kết hợp hệ thống máy chủ phụ trợ (Backend API và WebSocket Server). Giao diện ứng dụng được tối ưu hóa theo trải nghiệm người dùng trên thiết bị di động, đảm bảo tính trực quan, tốc độ phản hồi nhanh và khả năng thích ứng linh hoạt với nhiều kích thước màn hình smartphone khác nhau. Các chức năng tương tác thời gian thực trọng tâm như nhắn tin nhóm đa phương tiện, phát khoảnh khắc nội bộ (Moments), gọi nhóm trực tuyến, cập nhật bảng kế hoạch cộng tác và theo dõi vị trí trực tiếp (Live Location) cần duy trì trạng thái kết nối mạng liên tục, ổn định và mượt mà trên môi trường mạng di động (4G/5G) cũng như Wi-Fi.

**Mô phỏng:**

Hệ thống cho phép mô phỏng các kịch bản tương tác và nghiệp vụ sinh hoạt tập thể bên trong Circle nhằm phục vụ công tác kiểm thử tích hợp, tối ưu tải và đánh giá tính năng trước khi vận hành thực tế. Các kịch bản mô phỏng bao gồm: quy trình gửi lời mời và gia nhập nhóm (kiểm soát số lượng thành viên), mô phỏng đồng bộ dữ liệu thời gian thực khi nhiều thành viên cùng chỉnh sửa một bảng kế hoạch (Planning Sheet), mô phỏng vòng xoay may mắn sinh kết quả ngẫu nhiên đồng loạt trên nhiều máy khách, truyền nhận dữ liệu tọa độ vị trí theo chu kỳ và kịch bản chuyển giao quyền Trưởng nhóm (Circle Owner) khi có biến động nhân sự. Việc mô phỏng giúp đội ngũ phát triển kiểm soát chính xác độ trễ mạng, tính toàn vẹn dữ liệu, các luồng ngoại lệ và xung đột dữ liệu đa người dùng mà không làm xáo trộn dữ liệu thực tế.

**Tự động:**

Các quy trình vận hành và kiểm soát dữ liệu trong hệ thống CIRCLE được tự động hóa tối đa nhằm nâng cao trải nghiệm người dùng tức thì và giảm thiểu sai sót logic:

- Tự động phát sinh, gửi và xác thực mã OTP kích hoạt tài khoản/khôi phục mật khẩu qua thư điện tử.
- Tự động kiểm tra và khóa quyền gia nhập khi một Circle đã đạt đủ ngưỡng tối đa thành viên.
- Tự động chuyển giao quyền lực quản trị hoặc kích hoạt quy trình giải tán Circle khi thành viên cuối cùng rời nhóm.
- Tự động bóc tách hoàn toàn siêu dữ liệu định danh (author_id) của người gửi đối với các bài đăng thuộc chuyên mục "Điều muốn nói" (Words Unsaid) trước khi lưu vào cơ sở dữ liệu.
- Tự động ngắt phát sóng tọa độ GPS ngay khi hết thời lượng chia sẻ vị trí trực tiếp mà người dùng đã đăng ký.
- Tự động đẩy thông báo thời gian thực (Push Notifications / In-app alerts) khi có sự kiện lịch hẹn đến hạn, bình chọn mới hoặc cuộc gọi nhóm được kích hoạt.

**Phân quyền:**

Hệ thống áp dụng cấu trúc phân quyền phân cấp kế thừa chặt chẽ (Generalization) gồm 4 vai trò cụ thể nhằm bảo mật dữ liệu riêng tư và định hình chuẩn xác không gian sinh hoạt nhóm:

- **Khách vãng lai (Guest):** Thực hiện đăng ký tài khoản mới, xác thực OTP email, đăng nhập hệ thống và khôi phục mật khẩu.
- **Người dùng nền tảng (User):** Quản lý hồ sơ cá nhân, đổi mật khẩu, thiết lập thông báo, tìm kiếm và quản lý kết nối bạn bè, khởi tạo Circle mới hoặc tìm kiếm mã Circle để gửi yêu cầu xin gia nhập.
- **Thành viên nhóm (Circle Member):** Kế thừa toàn bộ quyền của User; được tham gia toàn bộ các tiện ích tương tác bên trong Circle: chia sẻ và tương tác Moment, nhắn tin đa phương tiện nhóm, gọi điện/gọi video nhóm, ghim tin nhắn, quản lý Album ảnh chung, tạo biểu quyết (Poll), quay vòng xoay may mắn, quản lý lịch sự kiện và lời nhắc, đồng tác vụ trên bảng kế hoạch, chia sẻ vị trí trực tiếp, đổi biệt danh nội bộ và gửi tâm sự ẩn danh.
- **Trưởng nhóm (Circle Owner):** Kế thừa toàn bộ quyền của Circle Member; nắm giữ thẩm quyền quản trị tối cao đối với Circle phụ trách: chỉnh sửa thông tin nhóm (tên, avatar, chế độ duyệt), phê duyệt hoặc từ chối yêu cầu gia nhập, trục xuất thành viên, chuyển nhượng quyền Trưởng nhóm và giải tán Circle.

**Sao lưu:**

Hệ thống thiết lập cơ chế sao lưu dự phòng định kỳ và khôi phục sự cố tự động nhằm bảo toàn tính toàn vẹn dữ liệu kết nối và nội dung kỷ niệm của người dùng:

- Định kỳ sao lưu cơ sở dữ liệu quan hệ (danh mục tài khoản, liên kết bạn bè, cấu trúc Circle, vai trò thành viên, bảng kế hoạch, lịch hẹn và các cuộc bình chọn).
- Đồng bộ và lưu trữ an toàn các tệp tin đa phương tiện (ảnh đại diện, ảnh Moment, hình ảnh/video trong Album kỷ niệm chung, tệp đính kèm tin nhắn) trên các hạ tầng lưu trữ đám mây có phân tán bản sao.
- Lưu trữ lịch sử giao dịch trạng thái hệ thống, log tin nhắn ghim và nhật ký quản trị của Circle Owner.
- Hỗ trợ quy trình khôi phục nhanh (Disaster Recovery) nhằm đảm bảo tính sẵn sàng cao, không làm gián đoạn các luồng trao đổi trực tuyến của cộng đồng nhóm khi xảy ra lỗi hạ tầng.

**Bảng 1.x. Bảng yêu cầu chức năng hệ thống CIRCLE**

| **STT** | **Nội dung**          | **Mô tả chi tiết**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Ghi chú**                                                                                  |
| ------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **1**   | **Môi trường**        | • Hệ thống hoạt động trên nền tảng ứng dụng di động (iOS, Android) kết hợp máy chủ Backend API và WebSocket.<br><br>• Giao diện tối ưu trải nghiệm chạm/lướt di động, tương thích đa dạng kích thước màn hình.<br><br>• Các tác vụ trò chuyện thời gian thực, bảng kế hoạch cộng tác, tải ảnh khoảnh khắc và gọi nhóm hoạt động ổn định trên kết nối mạng Wi-Fi và mạng di động (4G/5G).                                                                                                                                                                                                                                                             | Đảm bảo khả năng tương tác tức thì và trải nghiệm mượt mà trên thiết bị di động.             |
| **2**   | **Mô phỏng**          | • Cho phép mô phỏng luồng đăng ký, gửi OTP và xác thực email.<br><br>• Mô phỏng nghiệp vụ kiểm soát sĩ số nhóm và luồng xét duyệt thành viên.<br><br>• Mô phỏng tính năng đồng bộ chỉnh sửa bảng kế hoạch (Planning Sheet) thời gian thực và quay vòng xoay may mắn đồng loạt giữa nhiều máy khách.<br><br>• Mô phỏng quy trình bảo mật bài viết ẩn danh và luồng chuyển nhượng quyền Circle Owner.                                                                                                                                                                                                                                                  | Phục vụ kiểm thử tích hợp, tối ưu tải mạng và đánh giá logic chức năng trước khi triển khai. |
| **3**   | **Tự động**           | • Tự động kiểm tra dữ liệu đăng ký và thông tin email trùng lặp.<br><br>• Tự động tạo và kiểm tra thời hạn mã xác thực OTP qua email.<br><br>• Tự động khóa tiếp nhận thành viên khi Circle đạt đủ giới hạn người.<br><br>• Tự động bóc tách danh tính người gửi ở tính năng "Điều muốn nói" (Words Unsaid).<br><br>• Tự động dừng phiên phát vị trí trực tiếp (Live Location) khi đồng hồ đếm ngược kết thúc.<br><br>• Tự động kích hoạt thông báo nhắc hẹn lịch sự kiện nhóm.                                                                                                                                                                      | Tối ưu hóa vận hành, giảm thao tác thủ công và bảo vệ quyền riêng tư người dùng.             |
| **4**   | **Phân quyền**        | • **Khách vãng lai (Guest):** Đăng ký tài khoản, xác thực OTP, đăng nhập, khôi phục mật khẩu.<br><br>• **Người dùng nền tảng (User):** Quản lý hồ sơ, đổi mật khẩu, quản lý bạn bè, khởi tạo Circle mới, tìm kiếm và gửi yêu cầu vào Circle.<br><br>• **Thành viên nhóm (Circle Member):** Sử dụng toàn bộ tiện ích tương tác nội bộ: đăng tải Moments, chat nhóm đa phương tiện, gọi nhóm, album chung, lịch biểu, bình chọn, vòng xoay, bảng kế hoạch, live location, biệt danh, gửi bài ẩn danh, rời nhóm.<br><br>• **Trưởng nhóm (Circle Owner):** Toàn quyền cấu hình Circle, duyệt/xóa thành viên, chuyển nhượng quyền Owner, giải tán Circle. | Đảm bảo an toàn dữ liệu, kiểm soát nghiêm ngặt ranh giới tương tác kín của từng nhóm.        |
| **5**   | **Sao lưu, phục hồi** | • Sao lưu định kỳ dữ liệu cơ sở dữ liệu: tài khoản, quan hệ bạn bè, danh sách Circle, bảng kế hoạch, tin nhắn và lịch hẹn.<br><br>• Lưu trữ phân tán và bảo toàn dữ liệu đa phương tiện (ảnh Moment, album kỷ niệm, tệp đính kèm) trên máy chủ tệp đám mây.<br><br>• Hỗ trợ cơ chế khôi phục dữ liệu nhanh chóng khi xảy ra lỗi hệ thống mà không làm mất mát các dữ liệu sinh hoạt tập thể quan trọng.                                                                                                                                                                                                                                              | Phòng ngừa rủi ro mất mát dữ liệu và duy trì tính liên tục cho không gian nhóm.              |

### Yêu cầu phi chức năng

**❖ Liên quan đến người dùng:**

**Tính tiến hóa:**

- Phần mềm được thiết kế theo kiến trúc module hóa linh hoạt, cho phép dễ dàng chỉnh sửa, nâng cấp giao diện người dùng (UI/UX) trên ứng dụng di động để phù hợp với thói quen sinh hoạt và xu hướng tương tác của các nhóm bạn trẻ.
- Hệ thống có khả năng mở rộng thêm các tiện ích tương tác nhóm mới trong tương lai như: mini-game giải trí nội bộ, ví chia tiền tự động (Split Bill), tích hợp kho nhạc dùng chung trong phiên gọi nhóm hoặc trợ lý AI gợi ý địa điểm ăn uống, du lịch.
- Các quy tắc vận hành vi mô của Circle (giới hạn thành viên, chế độ xét duyệt thành viên, cấu hình bảng kế hoạch) được thiết kế linh hoạt, dễ dàng tùy biến hoặc thích ứng khi hệ sinh thái mở rộng mà không làm ảnh hưởng đến cấu trúc dữ liệu cốt lõi.

**Tính tiện dụng:**

- **Giao diện của phần mềm:**
  - Thiết kế theo phong cách tối giản, hiện đại và trẻ trung; các thao tác chạm, lướt và điều hướng được tối ưu hóa cho việc sử dụng bằng một tay trên thiết bị di động.
  - Các không gian tương tác cốt lõi gồm khay Moment, khung chat nhóm, album ảnh và thanh công cụ tiện ích (Lịch, Bảng tính, Vòng xoay) được bố trí khoa học, giúp người dùng dễ dàng truy cập chỉ sau 1–2 thao tác chạm.
  - Trực quan hóa dữ liệu sinh hoạt: hiển thị trạng thái hoạt động của thành viên, biểu đồ phần trăm bình chọn (Poll), thanh tiến độ hoàn thành công việc trên Planning Sheet và kết quả vòng xoay may mắn một cách sinh động, rõ ràng.
  - Các thông báo lỗi (vượt quá số lượng thành viên, mất kết nối mạng, tải tệp quá dung lượng), thông báo xác nhận hành động quan trọng (rời Circle, giải tán nhóm) được diễn đạt ngắn gọn, kèm hướng dẫn xử lý trực tiếp.
  - Các màn hình chức năng liên kết mượt mà với nhau; việc chuyển đổi giữa việc nhắn tin, xem Moment và kiểm tra bảng kế hoạch diễn ra liền mạch mà không bị gián đoạn trải nghiệm người dùng.

**Tính hiệu quả:**

- Cơ sở dữ liệu và hệ thống lưu trữ phân tán được tổ chức an toàn, hỗ trợ đánh chỉ mục (indexing) tối ưu để truy xuất tức thời lịch sử tin nhắn, album ảnh kỷ niệm và dữ liệu bảng kế hoạch của từng nhóm.
- Tốc độ phản hồi và xử lý của hệ thống đạt hiệu năng cao: thời gian tải luồng Moments và danh sách nhóm dưới 1.5 giây; độ trễ truyền nhận tin nhắn văn bản qua WebSocket dưới 200ms trong điều kiện mạng ổn định.
- Tối ưu hóa việc đồng bộ hóa dữ liệu thời gian thực (Real-time synchronization), xử lý triệt để xung đột dữ liệu (Conflict Resolution) khi nhiều thành viên cùng thao tác chỉnh sửa đồng thời trên Bảng kế hoạch cộng tác (Planning Sheet).
- Xử lý gửi mã xác thực OTP qua email, phát thông báo đẩy (Push Notifications) và kích hoạt tín hiệu cuộc gọi nhóm kịp thời, bảo đảm không làm lỡ các hoạt động sinh hoạt tức thời của Circle.

**Tính tương thích:**

- Ứng dụng di động hoạt động ổn định và mượt mà trên hai hệ điều hành phổ biến là iOS (từ phiên bản iOS 14.0 trở lên) và Android (từ phiên bản Android 9.0 trở lên).
- Giao diện đáp ứng (Responsive Layout) tương thích tốt với nhiều kích thước màn hình smartphone phổ biến hiện nay (từ màn hình tiêu chuẩn 5.5 inch đến các dòng máy màn hình lớn và màn hình có tai thỏ/nốt ruồi).
- Tối ưu hóa việc tiêu thụ năng lượng và băng thông mạng, đảm bảo ứng dụng hoạt động trơn tru trên cả mạng Wi-Fi và mạng dữ liệu di động (4G/5G) ngay cả khi chia sẻ vị trí trực tiếp (Live Location) hoặc gọi video nhóm.

**❖ Yêu cầu chất lượng**

**Bảng 1.7. Bảng yêu cầu chất lượng hệ thống CIRCLE**

| **STT** | **Nội dung**                          | **Tiêu chuẩn**  | **Mô tả chi tiết**                                                                                                                                   | **Ghi chú**                                            |
| ------- | ------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **1**   | Giao diện sinh hoạt nhóm thân thiện   | **Tiện dụng**   | Giao diện nhắn tin, khay Moment và các tiện ích nội bộ (Lịch, Bảng tính, Vòng xoay) bố trí trực quan, thao tác nhanh, phù hợp cho nhóm thân mật.     | Tối ưu trải nghiệm Mobile-first                        |
| **2**   | Đồng bộ dữ liệu thời gian thực        | **Hiệu quả**    | Tin nhắn, kết quả bình chọn, trạng thái quay vòng xoay và nội dung bảng kế hoạch được cập nhật tức thời giữa tất cả thành viên qua WebSocket.        | Tránh độ trễ và xung đột khi nhiều người cùng thao tác |
| **3**   | Xử lý quy mô nhóm nghiêm ngặt         | **Hiệu quả**    | Hệ thống tự động kiểm soát số lượng thành viên; tự động chặn yêu cầu khi nhóm đã đạt số lượng tối đa.                                                | Giữ đúng bản chất Micro-community                      |
| **4**   | Thông báo và nhắc hẹn kịp thời        | **Tiện dụng**   | Gửi email xác thực OTP tài khoản; đẩy thông báo tức thời (Push Notification) khi có cuộc gọi nhóm, nhắc lịch hẹn sự kiện và có tương tác Moment mới. | Đảm bảo tính kết nối liên tục                          |
| **5**   | Bảo mật dữ liệu không gian kín        | **Bảo mật**     | Toàn bộ tin nhắn, hình ảnh khoảnh khắc và album chung được mã hóa lưu trữ; tuyệt đối không rò rỉ dữ liệu ra ngoài phạm vi nhóm.                      | Bảo vệ sự riêng tư tối đa                              |
| **6**   | Ẩn danh tuyệt đối cho "Điều muốn nói" | **Bảo mật**     | Bóc tách và xóa bỏ hoàn toàn siêu dữ liệu định danh (author_id) của người đăng bài tâm sự ẩn danh, ngăn chặn việc truy vết tác giả.                  | Đảm bảo tính trung thực và an toàn tâm lý              |
| **7**   | Phân cấp phân quyền kế thừa           | **Bảo mật**     | Kiểm soát chặt chẽ thẩm quyền theo 4 vai trò (Guest, User, Circle Member, Circle Owner); chỉ Owner mới có quyền đổi cấu hình hoặc giải tán nhóm.     | Ngăn chặn hành vi thao túng quyền hạn                  |
| **8**   | Sao lưu và phục hồi dữ liệu           | **Độ tin cậy**  | Dữ liệu tài khoản, cấu trúc nhóm, nội dung kế hoạch và tệp tin đa phương tiện được sao lưu định kỳ; có phương án khôi phục nhanh khi xảy ra lỗi.     | Bảo vệ kho kỷ niệm và dữ liệu của nhóm                 |
| **9**   | Khả năng mở rộng hệ thống             | **Tiến hóa**    | Kiến trúc sẵn sàng tích hợp thêm các tiện ích nhóm mới (mini-game, chia tiền tự động, trợ lý AI gợi ý lịch trình) trong tương lai.                   | Phục vụ nâng cấp dài hạn                               |
| **10**  | Tương thích nền tảng di động          | **Tương thích** | Ứng dụng hoạt động mượt mà trên cả iOS và Android, thích ứng tốt với nhiều tỷ lệ màn hình và đường truyền mạng di động.                              | Hỗ trợ kết nối mọi lúc mọi nơi                         |