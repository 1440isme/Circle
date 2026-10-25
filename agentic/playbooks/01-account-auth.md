# Playbook — Account & Auth

> Module nền tảng quản lý danh tính người dùng (đăng ký, đăng nhập, phiên, hồ sơ) — đối chiếu PROJECT_GOD.md §2.2 nhóm "Account": Đăng ký; Đăng nhập; Quản lý hồ sơ cá nhân.

## 1. Tổng quan

- **Mục đích:** Quản lý vòng đời danh tính của người dùng: tạo tài khoản, xác thực chủ sở hữu, cấp và thu hồi quyền truy cập (session/token), và quản lý hồ sơ hiển thị công khai trong hệ thống.
- **Actors:**
  - Guest (chưa đăng nhập): đăng ký, đăng nhập, quên mật khẩu.
  - User (đã xác thực): quản lý hồ sơ, phiên, mật khẩu của chính mình.
  - Admin (qua Management Website): khoá/mở tài khoản khi vi phạm (chỉ thao tác trạng thái, không xem mật khẩu/token).
- **Quan hệ với module khác:**
  - Mọi module khác (People & Invitations, Circle, Chat, Realtime sharing, Collaboration) đều phụ thuộc vào module này để biết "user hiện tại là ai" (auth context) — không module nào tự quản lý session.
  - Playbook 02 (People & Invitations) và Circle dùng thông tin hồ sơ công khai (tên hiển thị, avatar, username) từ module này để hiển thị; không sao chép dữ liệu hồ sơ.
  - Notification dùng email của user để gửi thông báo bảo mật (đăng nhập lạ, đổi mật khẩu).

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### ACC-01 — Đăng ký tài khoản bằng email & mật khẩu
- **Hành vi:** Guest tạo tài khoản bằng email + mật khẩu. Email là định danh đăng nhập duy nhất. Sau khi đăng ký thành công, tài khoản ở trạng thái "chưa xác thực email" và bị giới hạn tính năng cho đến khi hoàn tất ACC-02.
- **Luồng chính:** Nhập email + mật khẩu + xác nhận mật khẩu → hệ thống kiểm tra định dạng email, chính sách mật khẩu (ACC-05), email chưa tồn tại → tạo tài khoản (mật khẩu được hash) → gửi mã/link xác thực (ACC-02) → chuyển user sang màn hình chờ xác thực.
- **Trạng thái UI:** loading (khi submit), error (email đã tồn tại / mật khẩu yếu / mất mạng), success (hướng dẫn kiểm tra hộp thư).
- **Edge cases:** Email trùng với tài khoản đã xoá trong grace period; email có ký tự hoa/thường và khoảng trắng (chuẩn hoá về lowercase, trim); double-submit (bấm nút 2 lần / retry mạng) không tạo 2 tài khoản; đăng ký khi đang có session hợp lệ → chuyển về trang chính thay vì tạo tài khoản mới.
- **Acceptance criteria:**
  - [ ] Email được chuẩn hoá (trim + lowercase) trước khi kiểm tra trùng và lưu trữ.
  - [ ] Mật khẩu được hash bằng thuật toán hash mật khẩu chuyên dụng (bcrypt/argon2), không lưu plaintext ở bất kỳ đâu kể cả log.
  - [ ] Trùng email trả về thông báo rõ ràng "email đã được sử dụng" kèm hướng dẫn đăng nhập/quên mật khẩu.
  - [ ] Form có validation phía client và server độc lập; bỏ qua client validation vẫn bị server chặn.
  - [ ] Double-submit không tạo tài khoản trùng (idempotent phía server theo email).
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### ACC-02 — Xác thực email sau đăng ký
- **Hành vi:** Chứng minh user sở hữu email đã đăng ký, bằng mã OTP 6 số hoặc link xác thực (chọn một cơ chế chính, áp dụng nhất quán). Tài khoản chưa xác thực không thể dùng các tính năng xã hội (tham gia Circle, chat nhóm, chia sẻ khoảnh khắc).
- **Luồng chính:** Sau đăng ký (hoặc khi user yêu cầu gửi lại) → hệ thống gửi OTP/link tới email → user nhập mã/mở link → hệ thống kiểm tra mã còn hạn và đúng → đánh dấu email đã xác thực → mở khoá toàn bộ tính năng.
- **Trạng thái UI:** chờ nhập mã (hiển thị email đích, che một phần), đếm ngược gửi lại mã, error (mã sai/hết hạn), success.
- **Edge cases:** Mã hết hạn; nhập sai nhiều lần (giới hạn số lần thử cho mỗi mã); yêu cầu gửi lại liên tục (rate limit gửi lại); user đổi email trước khi xác thực → huỷ mã cũ, xác thực lại từ đầu; mở link xác thực khi đang đăng nhập bằng tài khoản khác.
- **Acceptance criteria:**
  - [ ] Mỗi mã/link xác thực có thời hạn hết hạn rõ ràng và chỉ dùng được 1 lần.
  - [ ] Nhập sai quá số lần cho phép → mã bị vô hiệu, bắt buộc xin mã mới.
  - [ ] Gửi lại mã bị rate limit (có thời gian chờ hiển thị cho user).
  - [ ] Tài khoản chưa xác thực bị chặn ở tầng API (không chỉ ẩn UI) đối với tính năng xã hội.
  - [ ] Đổi email khi chưa xác thực sẽ huỷ mọi mã đang chờ của email cũ.
- **Platform:** Mobile hỗ trợ tự điền OTP từ tin nhắn/email (autocomplete) nếu nền tảng cho phép; còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### ACC-03 — Đăng nhập & thông điệp lỗi không lộ thông tin
- **Hành vi:** User đăng nhập bằng email + mật khẩu. Khi thất bại, thông điệp lỗi **không phân biệt** "email không tồn tại" với "sai mật khẩu" để chống dò tài khoản (account enumeration).
- **Luồng chính:** Nhập email + mật khẩu → server kiểm tra thông tin đăng nhập → đúng: tạo session + cặp token (ACC-06), ghi nhận thiết bị/phiên → sai: trả về một thông điệp chung duy nhất.
- **Trạng thái UI:** loading, error (thông điệp chung), tài khoản bị khoá tạm (ACC-08) hiển thị thời gian chờ.
- **Edge cases:** Đăng nhập vào tài khoản chưa xác thực email → cho đăng nhập nhưng điều hướng về luồng xác thực; tài khoản bị Admin khoá → thông báo tài khoản bị vô hiệu hoá kèm kênh liên hệ; tài khoản đang trong grace period xoá (ACC-S03) → cảnh báo và cho phép huỷ xoá khi đăng nhập thành công.
- **Acceptance criteria:**
  - [ ] Mọi trường hợp sai thông tin đăng nhập đều trả về cùng một thông điệp: "Email hoặc mật khẩu không đúng".
  - [ ] Thời gian phản hồi của API đăng nhập không chênh lệch rõ rệt giữa "email không tồn tại" và "sai mật khẩu" (tránh timing attack cơ bản).
  - [ ] Đăng nhập thành công tạo phiên mới và ghi lại thời gian, thiết bị, địa chỉ IP (cho ACC-07).
  - [ ] Không ghi mật khẩu (kể cả mật khẩu sai) vào log ở bất kỳ cấp độ nào.
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### ACC-04 — Quên mật khẩu / đặt lại mật khẩu an toàn
- **Hành vi:** User quên mật khẩu yêu cầu đặt lại qua email. Luồng này không được tiết lộ email có tồn tại trong hệ thống hay không, và token đặt lại phải hết hạn + dùng một lần.
- **Luồng chính:** Nhập email → hệ thống **luôn** hiển thị thông điệp "nếu email tồn tại, hướng dẫn đặt lại đã được gửi" → nếu email tồn tại: gửi link/mã đặt lại → user mở link, nhập mật khẩu mới (qua kiểm tra ACC-05) → đặt lại thành công → thu hồi toàn bộ refresh token/phiên hiện có (ACC-06) → thông báo qua email rằng mật khẩu đã thay đổi.
- **Trạng thái UI:** đã gửi yêu cầu (thông điệp trung tính), form đặt mật khẩu mới, error (token hết hạn/đã dùng), success.
- **Edge cases:** Yêu cầu đặt lại nhiều lần liên tiếp (rate limit; token mới huỷ token cũ); dùng lại token đã dùng; mở link đặt lại sau khi đã đổi mật khẩu bằng đường khác; user nhớ lại mật khẩu trong lúc chờ → đăng nhập bình thường không ảnh hưởng token đang chờ (token vẫn hết hạn theo lịch).
- **Acceptance criteria:**
  - [ ] Phản hồi của bước yêu cầu đặt lại giống hệt nhau dù email có tồn tại hay không (nội dung + mã trạng thái).
  - [ ] Token đặt lại có thời hạn, dùng đúng 1 lần, xin token mới sẽ huỷ token cũ chưa dùng.
  - [ ] Đặt lại thành công sẽ thu hồi tất cả phiên/refresh token đang hoạt động của tài khoản.
  - [ ] Mật khẩu mới phải qua chính sách mật khẩu (ACC-05) và không trùng mật khẩu hiện tại.
  - [ ] Có email thông báo "mật khẩu vừa thay đổi" sau khi đặt lại thành công.
- **Platform:** Giống nhau (deep link trên mobile mở đúng màn hình đặt lại trong app).
- **Scope:** Đề xuất bổ sung

### ACC-05 — Chính sách mật khẩu & đo độ mạnh
- **Hành vi:** Mọi nơi đặt mật khẩu (đăng ký, đặt lại, đổi mật khẩu) dùng chung một chính sách: độ dài tối thiểu, không nằm trong danh sách mật khẩu phổ biến/bị lộ thông dụng, và hiển thị thanh đo độ mạnh theo thời gian thực để hướng dẫn user.
- **Luồng chính:** User nhập mật khẩu → UI chấm điểm độ mạnh và gợi ý cải thiện → submit → server kiểm tra lại độc lập theo cùng chính sách → từ chối nếu không đạt.
- **Trạng thái UI:** chỉ báo độ mạnh (yếu/trung bình/mạnh) kèm gợi ý cụ thể, error khi dưới ngưỡng tối thiểu.
- **Edge cases:** Mật khẩu chứa email/username của chính user; mật khẩu toàn ký tự lặp; paste mật khẩu từ trình quản lý mật khẩu vẫn phải được chấm điểm đúng.
- **Acceptance criteria:**
  - [ ] Chính sách được định nghĩa một nơi duy nhất, cả client và server cùng áp dụng (server là chốt cuối).
  - [ ] Mật khẩu dưới độ dài tối thiểu hoặc thuộc danh sách mật khẩu phổ biến bị từ chối kèm lý do cụ thể.
  - [ ] UI hiển thị độ mạnh và gợi ý cải thiện ngay khi gõ, không cần submit mới biết.
  - [ ] Trường nhập mật khẩu có nút hiện/ẩn và tắt autocorrect/autocapitalize trên mobile.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### ACC-06 — Quản lý phiên: access token + refresh token rotation
- **Hành vi:** Sau đăng nhập, client giữ access token ngắn hạn và refresh token dài hạn. Mỗi lần dùng refresh token để cấp access token mới, hệ thống cấp refresh token mới và huỷ refresh token cũ (rotation). Dùng lại refresh token đã bị rotation bị coi là dấu hiệu lộ token → thu hồi toàn bộ chuỗi phiên của thiết bị đó.
- **Luồng chính:** Đăng nhập → cấp cặp token → access token hết hạn → client âm thầm refresh → nhận cặp token mới → refresh token cũ bị vô hiệu ngay lập tức.
- **Trạng thái UI:** không có UI trực tiếp; khi refresh thất bại → đưa user về màn hình đăng nhập kèm thông báo phiên đã hết.
- **Edge cases:** Hai request refresh đồng thời từ cùng client (song song khi mở app) không được tự thu hồi phiên oan — cần grace window ngắn cho token vừa rotation; mất mạng giữa lúc refresh; đồng hồ thiết bị lệch.
- **Acceptance criteria:**
  - [ ] Refresh token chỉ dùng được đúng 1 lần; lần dùng thứ hai kích hoạt thu hồi toàn bộ phiên của thiết bị.
  - [ ] Access token có thời hạn ngắn và không thể tự gia hạn.
  - [ ] Refresh token được lưu an toàn phía client (secure storage trên mobile, cơ chế phù hợp trên web), không lưu trong localStorage dạng plain nếu có lựa chọn an toàn hơn.
  - [ ] Khi refresh thất bại vì token bị thu hồi/hết hạn, client xoá toàn bộ token local và về trạng thái Guest.
- **Platform:** Mobile dùng secure storage của hệ điều hành; web ưu tiên cơ chế cookie/token an toàn theo kiến trúc API đã chọn — hành vi nghiệp vụ giống nhau.
- **Scope:** Đề xuất bổ sung

### ACC-07 — Danh sách phiên/thiết bị, đăng xuất & đăng xuất mọi thiết bị
- **Hành vi:** User xem được danh sách các phiên đang hoạt động (thiết bị, thời gian đăng nhập gần nhất, phiên hiện tại được đánh dấu), đăng xuất phiên hiện tại, thu hồi từng phiên lạ, hoặc đăng xuất khỏi mọi thiết bị.
- **Luồng chính:** Vào Cài đặt → Bảo mật → Phiên hoạt động → chọn thu hồi một phiên hoặc "Đăng xuất tất cả thiết bị khác" → xác nhận → phiên bị thu hồi có hiệu lực ngay ở lần gọi API tiếp theo.
- **Trạng thái UI:** loading danh sách, empty (chỉ có phiên hiện tại), xác nhận trước khi thu hồi hàng loạt, error khi mất mạng (không hiển thị trạng thái đã thu hồi nếu server chưa xác nhận).
- **Edge cases:** Thu hồi chính phiên hiện tại = đăng xuất; thu hồi phiên khi thiết bị đó đang online → thiết bị đó bị về màn hình đăng nhập ở request kế tiếp; danh sách phiên chứa phiên đã hết hạn tự nhiên → không hiển thị hoặc hiển thị ở mục lịch sử riêng.
- **Acceptance criteria:**
  - [ ] Danh sách phiên hiển thị đủ: loại thiết bị/nền tảng, thời gian hoạt động gần nhất, nhãn "Thiết bị này" cho phiên hiện tại.
  - [ ] Thu hồi phiên có hiệu lực phía server (token bị từ chối), không chỉ xoá ở client yêu cầu thu hồi.
  - [ ] "Đăng xuất mọi thiết bị" thu hồi toàn bộ refresh token trừ (tuỳ chọn giữ) phiên hiện tại, và ghi log bảo mật.
  - [ ] Đăng xuất thường cũng thu hồi refresh token của phiên đó phía server.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### ACC-08 — Chống brute-force khi đăng nhập
- **Hành vi:** Hệ thống giới hạn tốc độ thử đăng nhập theo tài khoản và theo IP: sau nhiều lần sai liên tiếp, áp dụng khoá tạm tăng dần và/hoặc yêu cầu CAPTCHA trước khi cho thử tiếp. Áp dụng tương tự cho các endpoint nhạy cảm: xác thực OTP, đặt lại mật khẩu.
- **Luồng chính:** Đếm số lần thất bại trong cửa sổ thời gian → vượt ngưỡng 1: yêu cầu CAPTCHA → vượt ngưỡng 2: khoá tạm tài khoản/IP kèm thời gian chờ hiển thị → đăng nhập thành công sẽ reset bộ đếm của tài khoản.
- **Trạng thái UI:** yêu cầu CAPTCHA, thông báo khoá tạm kèm thời gian còn lại, không hiển thị bộ đếm lần sai cụ thể cho user.
- **Edge cases:** Tấn công phân tán nhiều IP vào một tài khoản (khoá theo tài khoản vẫn phải kích hoạt); user thật bị khoá oan → có đường khôi phục qua email (ACC-04 vẫn dùng được hoặc liên kết hỗ trợ); CAPTCHA không khả dụng (mất mạng tới nhà cung cấp) → fallback sang khoá tạm thay vì mở cửa hoàn toàn.
- **Acceptance criteria:**
  - [ ] Có rate limit độc lập theo tài khoản và theo IP cho login, OTP verify, reset password.
  - [ ] Vượt ngưỡng cho phép sẽ bị chặn thực tế ở API (test được bằng cách gọi API lặp lại), không chỉ là thông báo UI.
  - [ ] Mọi lần bị chặn/khoá đều được ghi log bảo mật kèm IP và thời gian.
  - [ ] Thông báo khoá không tiết lộ email có tồn tại hay không (nhất quán với ACC-03).
- **Platform:** CAPTCHA trên web dùng widget chuẩn; trên mobile dùng cơ chế app attestation/CAPTCHA tương đương của nền tảng — hành vi chặn giống nhau.
- **Scope:** Đề xuất bổ sung

### ACC-09 — Quản lý hồ sơ cá nhân
- **Hành vi:** User quản lý hồ sơ hiển thị: ảnh đại diện (upload + crop), tên hiển thị, username duy nhất (định danh để tìm kiếm/@mention), bio ngắn. Username là duy nhất toàn hệ thống và là khoá tìm kiếm chính ở tính năng tìm người (playbook 02).
- **Luồng chính:** Vào Hồ sơ → Chỉnh sửa → đổi tên hiển thị/bio trực tiếp; đổi username có kiểm tra trùng theo thời gian thực; đổi avatar: chọn ảnh → crop khung vuông/tròn → upload → hiển thị bản mới sau khi server xử lý xong.
- **Trạng thái UI:** loading khi upload avatar (có tiến trình/thể hiện đang xử lý), preview trước khi lưu, error (username trùng, ảnh quá lớn/sai định dạng), trạng thái "đã lưu".
- **Edge cases:** Hai user cùng đổi sang một username tại cùng thời điểm (server chốt duy nhất, người sau nhận lỗi); ảnh dung lượng lớn/định dạng không hỗ trợ; username chứa ký tự không hợp lệ hoặc từ ngữ bị cấm; đổi username làm hỏng các @mention cũ → mention lưu theo user ID, username chỉ là hiển thị.
- **Acceptance criteria:**
  - [ ] Username duy nhất toàn hệ thống, kiểm tra trùng cả khi gõ (gợi ý) và khi lưu (chốt ở server); vi phạm ràng buộc DB trả lỗi thân thiện, không crash.
  - [ ] Avatar được crop trước khi upload, bị giới hạn định dạng và dung lượng, ảnh lỗi bị từ chối với lý do rõ ràng.
  - [ ] Tên hiển thị và bio có giới hạn độ dài và được kiểm duyệt ký tự điều khiển/xuống dòng bất thường.
  - [ ] @mention và liên kết hồ sơ dùng user ID nội bộ, đổi username không làm gãy liên kết cũ.
  - [ ] Hồ sơ có trạng thái mặc định (avatar placeholder theo tên) khi user chưa upload ảnh.
- **Platform:** Mobile chọn ảnh từ thư viện/máy ảnh của thiết bị; web dùng file picker/drag-drop — luồng crop và lưu giống nhau.
- **Scope:** Đã đăng ký §2.2

### ACC-10 — Đổi mật khẩu khi đã đăng nhập
- **Hành vi:** User đổi mật khẩu trong Cài đặt, bắt buộc nhập đúng mật khẩu hiện tại. Đổi thành công sẽ thu hồi các phiên khác (giữ phiên hiện tại) và gửi email thông báo.
- **Luồng chính:** Nhập mật khẩu hiện tại + mật khẩu mới (qua ACC-05) → server kiểm tra mật khẩu hiện tại → cập nhật hash → thu hồi refresh token của mọi phiên khác → gửi email thông báo.
- **Trạng thái UI:** error khi sai mật khẩu hiện tại (thông báo chung, có áp dụng giới hạn thử như ACC-08), success kèm thông tin "các thiết bị khác đã bị đăng xuất".
- **Edge cases:** Nhập sai mật khẩu hiện tại nhiều lần → áp dụng khoá tạm như brute-force; mật khẩu mới trùng mật khẩu hiện tại → từ chối; đang đổi mật khẩu thì mất mạng → trạng thái không xác định, user kiểm tra lại bằng cách đăng nhập thử, hệ thống không rơi vào trạng thái nửa vời (hoặc cũ hoặc mới, không cả hai).
- **Acceptance criteria:**
  - [ ] Không đổi được mật khẩu nếu không nhập đúng mật khẩu hiện tại.
  - [ ] Mật khẩu mới phải qua ACC-05 và khác mật khẩu hiện tại.
  - [ ] Đổi thành công: mọi phiên khác bị thu hồi, phiên hiện tại tiếp tục hoạt động với token mới.
  - [ ] Có email thông báo đổi mật khẩu kèm thời gian và thiết bị thực hiện.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### ACC-S01 — Đăng nhập bằng Google OAuth
- **Hành vi:** User đăng nhập/đăng ký nhanh bằng tài khoản Google. Nếu email Google trùng email tài khoản đã có, hệ thống liên kết hai phương thức đăng nhập vào cùng một tài khoản (sau khi xác thực quyền sở hữu), không tạo tài khoản trùng.
- **Acceptance criteria:**
  - [ ] Đăng nhập Google với email đã đăng ký bằng mật khẩu sẽ vào đúng tài khoản cũ, không tạo user mới.
  - [ ] Tài khoản tạo qua Google được coi là đã xác thực email.
  - [ ] User có thể đặt thêm mật khẩu cho tài khoản OAuth để dùng cả hai cách đăng nhập.

### ACC-S02 — Thông báo đăng nhập từ thiết bị lạ
- **Hành vi:** Khi phát hiện đăng nhập thành công từ thiết bị/trình duyệt chưa từng thấy (hoặc vị trí bất thường), hệ thống gửi email/in-app notification cho user kèm thông tin thiết bị, thời gian và lối tắt để thu hồi phiên nếu không phải mình.
- **Acceptance criteria:**
  - [ ] Đăng nhập từ thiết bị mới sinh đúng một thông báo bảo mật.
  - [ ] Thông báo chứa đường dẫn/thao tác thu hồi phiên đó (dẫn tới ACC-07).
  - [ ] Đăng nhập lại từ cùng thiết bị không sinh thông báo lặp.

### ACC-S03 — Xoá tài khoản có grace period
- **Hành vi:** User yêu cầu xoá tài khoản → tài khoản vào trạng thái chờ xoá trong một khoảng ân hạn (grace period), bị đăng xuất khỏi mọi thiết bị và ẩn khỏi hệ thống, nhưng user có thể đăng nhập lại trong thời gian ân hạn để huỷ xoá. Hết ân hạn, dữ liệu cá nhân bị xoá/ẩn danh hoá theo chính sách dữ liệu; nội dung đã chia sẻ trong Circle xử lý theo rule đã công bố trước cho user.
- **Acceptance criteria:**
  - [ ] Yêu cầu xoá bắt buộc xác thực lại (mật khẩu hiện tại hoặc OTP).
  - [ ] Trong grace period, tài khoản không xuất hiện trong tìm kiếm, danh sách người quen và các Circle chung hiển thị dạng không khả dụng.
  - [ ] Đăng nhập trong grace period hiển thị cảnh báo và cho phép huỷ yêu cầu xoá.
  - [ ] Sau grace period, quá trình xoá/ẩn danh hoá chạy tự động và có log hệ thống.

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### ACC-W01 — Đăng nhập bằng Passkey (WebAuthn)
User đăng nhập bằng vân tay/Face ID/PIN của thiết bị thay cho mật khẩu, chống phishing tốt hơn hẳn mật khẩu truyền thống vì khoá riêng không bao giờ rời thiết bị. Giá trị cho user: đăng nhập nhanh một chạm, không cần nhớ mật khẩu, an toàn hơn cho nhóm người dùng trẻ dùng nhiều thiết bị.
- **Effort:** L

### ACC-W02 — Hồ sơ theo từng Circle (per-Circle identity)
User có thể đặt tên hiển thị và avatar riêng trong từng Circle (vd tên thân mật trong nhóm bạn thân, tên nghiêm túc trong nhóm lớp) trong khi hồ sơ gốc vẫn là danh tính chính. Giá trị cho user: đúng chất "mạng xã hội theo nhóm" — mỗi nhóm thấy một "phiên bản" phù hợp của mình, tăng cảm giác riêng tư và gắn bó với từng Circle.
- **Effort:** M

### ACC-W03 — Đăng nhập bằng QR từ thiết bị đã xác thực
Khi đăng nhập trên web, user quét mã QR bằng app mobile đã đăng nhập để xác nhận thay vì gõ mật khẩu (kiểu Zalo/Telegram Desktop). Giá trị cho user: đăng nhập web nhanh và an toàn khi dùng máy lạ/máy trường, giảm rủi ro keylogger.
- **Effort:** M

## 5. Business rules & invariants

- Email là định danh đăng nhập duy nhất; mọi email đều được chuẩn hoá (trim + lowercase) trước khi so sánh/lưu.
- Username là duy nhất toàn hệ thống và không tái sử dụng cho tài khoản khác sau khi user đổi/xoá (tránh mạo danh qua @mention cũ) trong thời gian ân hạn cấu hình được.
- Mật khẩu không bao giờ tồn tại dạng plaintext: không trong DB, không trong log, không trong email, không trong thông báo lỗi.
- Không có bất kỳ bề mặt nào (UI, API, email) được phép tiết lộ một email có tồn tại trong hệ thống hay không qua luồng đăng nhập/quên mật khẩu/tìm kiếm phụ trợ.
- Tài khoản chưa xác thực email không dùng được tính năng xã hội; ràng buộc này thực thi ở API.
- Mọi thao tác thu hồi (token, phiên) phải có hiệu lực phía server; client không tự quyết định hiệu lực của token.
- Đổi mật khẩu và đặt lại mật khẩu luôn kéo theo thu hồi các phiên khác.
- Một user tại một thời điểm có thể có nhiều phiên hợp lệ (đa thiết bị), nhưng mỗi phiên có đúng một refresh token đang hoạt động.
- Admin hệ thống không có quyền xem mật khẩu, token, hay mã OTP của bất kỳ user nào.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `User`: id, email (unique, đã chuẩn hoá), username (unique), displayName, avatarUrl, bio, emailVerifiedAt, status (active / locked / pending-deletion / deleted), createdAt.
- `Credential`: userId, passwordHash, passwordUpdatedAt.
- `Session` / `RefreshToken`: id, userId, tokenHash, deviceInfo, ipAddress, createdAt, lastUsedAt, expiresAt, revokedAt, replacedByTokenId (cho rotation chain).
- `EmailVerificationToken` / `PasswordResetToken`: userId, tokenHash, expiresAt, usedAt, attempts.
- `SecurityLog`: userId, eventType (login-success, login-failed, password-changed, session-revoked...), ipAddress, deviceInfo, createdAt.

**Endpoint / event gợi ý:**
- `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-verification`
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- `GET /me`, `PATCH /me/profile`, `POST /me/avatar`, `PATCH /me/password`
- `GET /me/sessions`, `DELETE /me/sessions/:id`, `DELETE /me/sessions` (đăng xuất mọi thiết bị)
- `DELETE /me` (yêu cầu xoá tài khoản), `POST /me/cancel-deletion`
- Event nội bộ: `user.registered`, `user.email-verified`, `user.password-changed`, `user.sessions-revoked` (cho Notification và SecurityLog tiêu thụ).

## 7. Cross-cutting riêng cho module (ngoài gate chung ở cross-cutting-gate.md)

- **Hỗ trợ trình quản lý mật khẩu:** mọi form auth phải dùng đúng `autocomplete` (email, current-password, new-password, one-time-code) và không chặn paste vào ô mật khẩu.
- **Email giao dịch:** email xác thực/đặt lại/bảo mật phải ghi rõ: ai yêu cầu, thời hạn hiệu lực, và hướng dẫn "nếu không phải bạn, hãy bỏ qua / bảo mật tài khoản ngay". Nội dung email tuân theo ngôn ngữ đã chọn của user.
- **Không khoá user vô thời hạn khi lỗi hệ thống:** timeout/lỗi 5xx ở luồng auth phải có nút thử lại và thông điệp trung thực, phân biệt với lỗi thông tin đăng nhập sai.
- **Thông báo bảo mật không tắt được:** user có thể tắt thông báo marketing/tương tác, nhưng thông báo đổi mật khẩu, đăng nhập lạ, thu hồi phiên luôn được gửi.
- **Trạng thái tài khoản nhất quán toàn hệ thống:** khi tài khoản bị khoá/xoá, mọi module khác phải thấy trạng thái mới (qua auth context dùng chung), không cache trạng thái tài khoản riêng ở từng module.

## 8. Anti-patterns — những cách làm sai phổ biến phải tránh

- Trả lỗi phân biệt "email không tồn tại" và "sai mật khẩu" (mở đường dò tài khoản).
- Kiểm tra chính sách mật khẩu chỉ ở client; server nhận mọi mật khẩu gửi lên.
- Lưu mật khẩu/token/OTP dạng plaintext, hoặc ghi chúng vào log/analytics.
- Refresh token không rotation, không hết hạn, dùng lại vô hạn.
- "Đăng xuất" chỉ xoá token ở client, token vẫn hợp lệ ở server.
- Khoá tài khoản vĩnh viễn sau vài lần sai mật khẩu mà không có đường khôi phục cho chủ tài khoản thật.
- Gửi OTP/token đặt lại không giới hạn số lần và không hết hạn.
- Tạo tài khoản trùng khi email đăng nhập OAuth trùng email tài khoản mật khẩu.
- Để username tái sử dụng ngay sau khi đổi/xoá, khiến @mention và link cũ trỏ nhầm người.
- Hiển thị khác biệt thời gian phản hồi rõ rệt giữa các trường hợp lỗi đăng nhập.

## 9. Self-audit checklist cho agent

- [ ] ACC-01: Đăng ký chuẩn hoá email, hash mật khẩu, chống double-submit.
- [ ] ACC-02: Xác thực email có hết hạn, dùng 1 lần, giới hạn số lần thử; chặn tính năng xã hội ở API khi chưa xác thực.
- [ ] ACC-03: Đăng nhập trả một thông điệp lỗi chung duy nhất cho mọi trường hợp sai thông tin.
- [ ] ACC-04: Quên mật khẩu phản hồi trung tính; token hết hạn + dùng 1 lần; đặt lại xong thu hồi mọi phiên.
- [ ] ACC-05: Chính sách mật khẩu định nghĩa một nơi, server là chốt kiểm tra cuối, UI có đo độ mạnh realtime.
- [ ] ACC-06: Refresh token rotation; dùng lại token cũ sẽ thu hồi chuỗi phiên của thiết bị.
- [ ] ACC-07: Có danh sách phiên/thiết bị, thu hồi từng phiên và đăng xuất mọi thiết bị có hiệu lực ở server.
- [ ] ACC-08: Rate limit + khoá tạm/CAPTCHA cho login, OTP, reset password; có log bảo mật.
- [ ] ACC-09: Hồ sơ có avatar upload + crop, username duy nhất ở tầng DB, mention theo user ID.
- [ ] ACC-10: Đổi mật khẩu yêu cầu mật khẩu hiện tại, thu hồi phiên khác, gửi email thông báo.

## Changelog

- 2026-10-25 — Tạo bản đầu.
