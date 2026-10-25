# Playbook — Notification

> Notification là hạ tầng thông báo toàn hệ thống (không chỉ của Circle collaboration) — đối chiếu PROJECT_GOD.md §2.2: "Notification" được liệt kê trong nhóm Circle collaboration nhưng playbook này bao phủ mọi nguồn thông báo của app.

## 1. Tổng quan

- **Mục đích:** đưa đúng thông tin, tới đúng người, đúng lúc, đúng mức độ — người dùng không bỏ lỡ sự kiện quan trọng (lời mời vào Circle, tin nhắn, sự kiện sắp diễn ra) nhưng cũng không bị spam tới mức tắt toàn bộ thông báo hoặc gỡ app.
- **Tính chất hạ tầng cross-module:** Notification không sở hữu nội dung nghiệp vụ; nó nhận *sự kiện cần thông báo* từ các module khác (Circle, Chat, Realtime sharing, Circle collaboration, hệ thống), áp chính sách (cài đặt người dùng, gộp, quiet hours, chống spam), rồi phân phối qua hai kênh: in-app notification center và push notification (mobile). Mọi module khác chỉ phát sự kiện, không tự gửi push trực tiếp.
- **Actors:** người dùng (người nhận + cấu hình), các module phát sự kiện, Notification service (lên lịch, gộp, gửi), nền tảng push (FCM/APNs).
- **Quan hệ với module khác:**
  - **Account:** vòng đời device token gắn với phiên đăng nhập (đăng ký khi đăng nhập, xoá khi đăng xuất).
  - **Chat / Circle / Realtime sharing / Circle collaboration:** nguồn phát sự kiện và là đích của deep link.
  - **Circle collaboration (`07-circle-collaboration.md`):** nhắc sự kiện theo RSVP, poll mới/đóng, sự kiện sửa/huỷ là các nguồn sự kiện điển hình.
  - **Admin (`09-admin-moderation.md`):** thông báo hệ thống (khoá tài khoản, cảnh cáo, kết quả xử lý báo cáo) đi qua cùng hạ tầng này.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### NOT-01 — Trung tâm thông báo trong app (in-app notification center)

- **Hành vi:** một màn hình danh sách mọi thông báo của người dùng, sắp xếp mới nhất trước, phân trang (cursor pagination), có badge số chưa đọc trên điểm vào (icon chuông/tab), cho phép đánh dấu đã đọc từng mục hoặc tất cả, và xoá thông báo.
- **Luồng chính:** Mở notification center → danh sách tải theo trang, cuộn xuống tải thêm → bấm một thông báo: đánh dấu đã đọc + điều hướng deep link (NOT-04) → vuốt/menu để xoá từng mục → nút "Đánh dấu tất cả đã đọc" cập nhật badge về 0 ngay.
- **Trạng thái UI:** loading skeleton trang đầu; empty state khi chưa có thông báo nào (phân biệt với "đã đọc hết" — vẫn cùng empty state nhưng không lỗi); error khi tải trang tiếp theo (giữ dữ liệu đã tải, cho thử lại); badge đồng bộ realtime khi có thông báo mới trong lúc app đang mở.
- **Edge cases:** badge và danh sách lệch nhau sau khi đọc trên thiết bị khác → số chưa đọc lấy từ server làm nguồn sự thật, đồng bộ khi mở app/foreground; xoá thông báo chưa đọc → số chưa đọc giảm tương ứng; phân trang trong lúc có thông báo mới chèn vào đầu → cursor pagination tránh trùng/lọt mục.
- **Acceptance criteria:**
  - [ ] Danh sách phân trang bằng cursor, không trùng/không sót mục khi có thông báo mới đến giữa chừng
  - [ ] Badge số chưa đọc luôn khớp số mục chưa đọc trên server (kiểm chứng đa thiết bị)
  - [ ] Đánh dấu đã đọc từng mục, đánh dấu tất cả, và xoá đều hoạt động và phản ánh ngay trên UI
  - [ ] Thông báo đã xoá không xuất hiện lại sau khi đồng bộ
- **Platform:** Web — notification center dạng trang riêng hoặc panel từ icon chuông; Mobile — tab/màn hình riêng, badge đồng thời trên icon app (app icon badge) nếu người dùng cho phép.
- **Scope:** Đã đăng ký §2.2

### NOT-02 — Phân loại thông báo theo nguồn

- **Hành vi:** mọi thông báo thuộc đúng một loại nguồn: Circle (mời vào Circle, thay đổi Circle), Chat (tin nhắn mới), Khoảnh khắc (realtime sharing), Sự kiện (plan/RSVP/nhắc), Poll (vote mới/kết quả), Hệ thống (bảo mật, kiểm duyệt, thông báo vận hành). Loại là thuộc tính dữ liệu có cấu trúc, dùng cho hiển thị (icon/nhãn), lọc và cài đặt (NOT-05).
- **Luồng chính:** Module nguồn phát sự kiện kèm loại → Notification service tạo thông báo mang loại đó → notification center hiển thị icon/nhãn theo loại, người dùng lọc được theo loại.
- **Trạng thái UI:** mỗi loại có icon và màu nhấn phân biệt nhất quán toàn app; bộ lọc theo loại trong notification center; empty state theo bộ lọc.
- **Edge cases:** sự kiện từ module mới chưa có loại → không được tạo thông báo "không loại"; bắt buộc khai báo loại khi tích hợp nguồn mới (mặc định an toàn: loại Hệ thống); thông báo cũ trước khi có tính năng lọc vẫn hiển thị đúng loại đã lưu.
- **Acceptance criteria:**
  - [ ] 100% thông báo trong hệ thống có trường loại thuộc tập giá trị cố định (enum), enforce ở tầng dữ liệu/API
  - [ ] Lọc theo loại trong notification center trả đúng tập con, kết hợp được với phân trang
  - [ ] Loại của thông báo quyết định nhóm cài đặt áp dụng (liên kết NOT-05) — không có thông báo nào "không thuộc nhóm cài đặt nào"
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-03 — Push notification mobile (FCM/APNs) và hành vi theo trạng thái app

- **Hành vi:** thông báo đủ điều kiện (theo cài đặt NOT-05 và chính sách NOT-06) được gửi push qua FCM (Android) / APNs (iOS) với payload tối thiểu: loại, id đối tượng đích, tiêu đề/nội dung hiển thị an toàn (NOT-08). App xử lý ba trạng thái: foreground (đang mở — hiển thị in-app banner nhẹ hoặc chỉ cập nhật badge, không phát âm thanh mặc định), background (hệ điều hành hiển thị), terminated (app bị tắt — hệ điều hành hiển thị, bấm vào mở app rồi deep link).
- **Luồng chính:** Sự kiện → Notification service kiểm tra chính sách → tạo bản ghi in-app → nếu đủ điều kiện push: tra device token hợp lệ của người dùng → gửi qua FCM/APNs → xử lý kết quả gửi (token chết thì vô hiệu hoá — NOT-09) → người dùng bấm push: app mở, xác thực phiên, điều hướng deep link.
- **Trạng thái UI:** xin quyền push đúng thời điểm (sau khi người dùng thấy giá trị, không xin ngay lần mở app đầu tiên trước mọi ngữ cảnh); trạng thái từ chối quyền được ghi nhận, app vẫn hoạt động đầy đủ với in-app center; banner foreground không che nội dung đang thao tác và tự biến mất.
- **Edge cases:** push đến khi người dùng đã đăng xuất trên thiết bị đó → không hiển thị (token đã xoá theo NOT-09); push nhắc sự kiện đến sau khi sự kiện bị huỷ → nội dung đích mở ra hiển thị trạng thái đã huỷ (theo `07-circle-collaboration.md`), không gây lỗi; gửi push thất bại tạm thời → retry có giới hạn với backoff, không retry vô hạn; một người dùng nhiều thiết bị → push tới mọi thiết bị đang đăng nhập hợp lệ.
- **Acceptance criteria:**
  - [ ] Push hoạt động ở cả ba trạng thái foreground/background/terminated trên Android và iOS (có test case thực tế trên thiết bị thật hoặc emulator có dịch vụ push)
  - [ ] Bấm push luôn mở đúng màn hình đích hoặc fallback an toàn (NOT-04), kể cả khi app bị tắt hoàn toàn
  - [ ] Quyền push bị từ chối không làm hỏng bất kỳ luồng nào khác; in-app center vẫn nhận đủ thông báo
  - [ ] Mọi lần gửi push đều ghi nhận kết quả (thành công/token không hợp lệ/lỗi tạm thời) để xử lý token và giám sát
- **Platform:** Chỉ mobile (FCM/APNs). Web — không dùng web push trong baseline; notification center là kênh duy nhất trên web (ghi rõ giới hạn này, không hứa web push).
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-04 — Deep link mở đúng màn hình đích

- **Hành vi:** mọi thông báo (in-app và push) mang một deep link xác định tới đúng đối tượng: tin nhắn → đúng hội thoại và neo tới tin nhắn; RSVP/nhắc → chi tiết sự kiện; poll → poll đó trong Circle; lời mời vào Circle → màn hình lời mời; khoảnh khắc → khoảnh khắc đó. Deep link dùng một scheme/URL thống nhất cho web (URL path) và mobile (universal link/app link + custom scheme dự phòng).
- **Luồng chính:** Bấm thông báo → nếu chưa đăng nhập: lưu deep link đang chờ → đăng nhập → tiếp tục điều hướng tới đích → nếu đối tượng không còn tồn tại/không còn quyền xem: hiển thị màn hình fallback thân thiện ("Nội dung không còn khả dụng") thay vì lỗi.
- **Trạng thái UI:** loading trong lúc resolve deep link (đặc biệt khi mở app lạnh từ push); fallback state khi đích bị xoá/hết quyền; không bao giờ màn hình trắng hoặc crash vì deep link.
- **Edge cases:** deep link tới Circle mà người dùng đã rời Circle → fallback kèm giải thích; deep link mở trên web khi người dùng đang đăng nhập tài khoản khác với tài khoản nhận thông báo → không lộ nội dung, yêu cầu đúng tài khoản hoặc fallback trung tính; deep link hết hạn mang tính nhạy cảm (nếu có loại như vậy) → fallback.
- **Acceptance criteria:**
  - [ ] Mỗi loại thông báo có mẫu deep link được định nghĩa và kiểm thử riêng (bảng mapping loại → màn hình đích là tài liệu bắt buộc của module)
  - [ ] Luồng "app tắt → bấm push → đăng nhập (nếu cần) → tới đúng đích" hoạt động end-to-end trên web và mobile
  - [ ] Đích bị xoá/hết quyền luôn rơi về fallback, không crash, không lộ dữ liệu
- **Platform:** Web — URL path chuẩn, mở tab hiện tại; Mobile — universal link (iOS) / app link (Android) mở app, custom scheme chỉ là dự phòng.
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-05 — Cài đặt thông báo theo loại và mute theo ngữ cảnh

- **Hành vi:** người dùng kiểm soát được: bật/tắt push theo từng loại thông báo (NOT-02); mute (tắt đẩy push nhưng vẫn ghi in-app) theo từng Circle và theo từng hội thoại chat, có thời hạn mute (1 giờ / 8 giờ / 1 tuần / đến khi bật lại). Cài đặt áp dụng cho push; in-app center luôn ghi nhận trừ khi người dùng tắt hẳn loại đó (rule phải ghi rõ — gợi ý: tắt theo loại = tắt cả push lẫn in-app cho loại đó; mute = chỉ tắt push).
- **Luồng chính:** Cài đặt → Thông báo → danh sách loại với công tắc → lưu áp dụng ngay cho các thông báo tạo sau đó. Mute: từ trang Circle/hội thoại → "Tắt thông báo" → chọn thời hạn → trạng thái mute hiển thị icon trên Circle/hội thoại đó → tự hết hạn hoặc bật lại thủ công.
- **Trạng thái UI:** trạng thái mute hiển thị rõ (icon chuông gạch) tại danh sách Circle/hội thoại; cài đặt hiển thị trạng thái thật từ server, không giả định lưu thành công khi mất mạng (error + giữ giá trị cũ).
- **Edge cases:** mute Circle nhưng có người nhắc tên trực tiếp (@mention) trong Circle đó → chọn một rule và ghi rõ (gợi ý: mention vẫn đẩy push, trừ khi người dùng tắt cứng); sự kiện đã RSVP Tham gia thuộc Circle đang mute → nhắc sự kiện (NOT-07) vẫn được đẩy (nhắc theo lịch là cam kết người dùng đã chủ động chọn), trừ khi tắt loại Sự kiện; thay đổi cài đặt có hiệu lực với thông báo đã lên lịch chưa → áp dụng tại thời điểm gửi, không tại thời điểm tạo.
- **Acceptance criteria:**
  - [ ] Tắt push theo loại thì không nhận push loại đó trên mọi thiết bị, in-app vẫn theo rule đã công bố
  - [ ] Mute theo Circle/hội thoại hết hạn đúng thời gian đã chọn và tự khôi phục push
  - [ ] Chính sách gửi luôn đọc cài đặt mới nhất tại thời điểm gửi (test: đổi cài đặt sau khi thông báo lên lịch, trước giờ gửi)
- **Platform:** Giống nhau; cài đặt đồng bộ theo tài khoản, không theo thiết bị (trừ quyền push của hệ điều hành là theo thiết bị).
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-06 — Chính sách chống spam: gộp, giới hạn tần suất, giờ yên lặng

- **Hành vi:** ba lớp bảo vệ mặc định áp cho mọi nguồn: (1) **Gộp (grouping/digest tại điểm gửi):** nhiều sự kiện cùng nguồn trong cửa sổ ngắn gộp thành một push ("5 tin nhắn mới trong Circle X", "3 người đã RSVP sự kiện Y"); thông báo khẩn/riêng lẻ quan trọng (lời mời vào Circle, nhắc sự kiện) không bị gộp mất định danh. (2) **Giới hạn tần suất (rate limit):** trần số push mỗi người dùng nhận trong một giờ/ngày (hằng số cấu hình, gợi ý: tối đa 20 push/giờ), vượt trần thì chỉ ghi in-app. (3) **Giờ yên lặng (quiet hours):** khung giờ người dùng đặt (mặc định gợi ý 22:00–07:00 theo múi giờ người dùng, bật/tắt được) — push thường bị hoãn tới hết quiet hours, chỉ thông báo được xếp loại ưu tiên cao theo rule minh bạch mới được phá quiet hours (gợi ý: cuộc gọi và nhắc sự kiện sắp bắt đầu trong 1 giờ).
- **Luồng chính:** Sự kiện vào hàng đợi gửi → kiểm tra mute/loại (NOT-05) → kiểm tra quiet hours → kiểm tra cửa sổ gộp (có sự kiện cùng nhóm đang chờ?) → kiểm tra trần tần suất → gửi ngay / hoãn / gộp / chỉ ghi in-app.
- **Trạng thái UI:** người dùng thấy và sửa được quiet hours trong cài đặt; thông báo bị hoãn do quiet hours vẫn xuất hiện ngay trong in-app center (chỉ push bị hoãn).
- **Edge cases:** múi giờ người dùng thay đổi (đi du lịch) → quiet hours tính theo múi giờ hiện tại của tài khoản/thiết bị đã đồng bộ; sự kiện gộp đang chờ mà đối tượng bị xoá (tin nhắn bị thu hồi) → nội dung gộp tính lại, không nhắc tới nội dung đã mất; hoãn qua quiet hours mà sự kiện đã hết ý nghĩa (nhắc sự kiện đã qua) → bỏ qua, không gửi trễ vô nghĩa.
- **Acceptance criteria:**
  - [ ] N sự kiện chat cùng hội thoại trong cửa sổ gộp chỉ tạo tối đa 1 push gộp (có test với N≥3)
  - [ ] Trần tần suất push enforce ở server theo người nhận; thông báo vượt trần vẫn có trong in-app center
  - [ ] Trong quiet hours, push thường không phát ra; ngoại lệ ưu tiên cao khớp đúng danh sách rule đã công bố
  - [ ] Mọi quyết định hoãn/gộp/chặn đều truy vết được (log kèm lý do) để debug khi người dùng báo "không nhận được thông báo"
- **Platform:** Giống nhau (chính sách ở server); múi giờ quiet hours lấy theo cài đặt tài khoản, cập nhật từ thiết bị.
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-07 — Thông báo nhắc sự kiện theo RSVP

- **Hành vi:** hiện thực hoá nhắc sự kiện của `07-circle-collaboration.md` (COL-12): tại các mốc nhắc đã định trước giờ bắt đầu, gửi thông báo (in-app + push theo chính sách) cho đúng nhóm người theo trạng thái RSVP tại thời điểm gửi.
- **Luồng chính:** Job lập lịch quét sự kiện sắp tới các mốc nhắc → với mỗi sự kiện: lấy danh sách RSVP Tham gia (và Chưa chắc nếu cấu hình bật) → loại người đã mute loại Sự kiện/tắt push → tạo thông báo loại Sự kiện kèm deep link chi tiết sự kiện → đánh dấu mốc nhắc đã gửi cho sự kiện đó.
- **Trạng thái UI:** không có UI riêng ngoài thông báo nhận được; nội dung nhắc gồm tên sự kiện, giờ bắt đầu theo múi giờ người nhận, địa điểm nếu có.
- **Edge cases:** sự kiện đổi giờ sau khi mốc nhắc đã qua theo giờ cũ nhưng chưa tới theo giờ mới → tính lại lịch nhắc theo giờ mới, không bỏ sót; hai mốc nhắc gần nhau do sự kiện tạo sát giờ → gộp thành một nhắc duy nhất; job chạy lại sau downtime → gửi bù các nhắc còn ý nghĩa (sự kiện chưa bắt đầu), bỏ qua nhắc đã vô nghĩa, không gửi trùng nhờ đánh dấu idempotent theo (eventId, milestone, userId).
- **Acceptance criteria:**
  - [ ] Không người dùng nào nhận hai nhắc cho cùng một mốc của cùng một sự kiện, kể cả khi job chạy lại
  - [ ] Người đổi RSVP sang Không tham gia trước giờ gửi thì không nhận nhắc (đọc trạng thái tại thời điểm gửi)
  - [ ] Sự kiện huỷ/đổi giờ làm vô hiệu nhắc đã lên lịch theo dữ liệu cũ
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### NOT-08 — Bảo mật nội dung push trên màn hình khoá

- **Hành vi:** nội dung push hiển thị trên lock screen không lộ dữ liệu nhạy cảm theo mặc định an toàn và theo lựa chọn người dùng: tuỳ chọn "Hiển thị nội dung tin nhắn trong thông báo" mặc định TẮT đối với chat và nội dung ẩn danh — push chỉ ghi chung chung ("Bạn có tin nhắn mới", "Có nội dung mới trong Circle X"); người dùng chủ động bật mới thấy trích nội dung. Nội dung của "điều muốn nói" ẩn danh KHÔNG BAO GIỜ đưa vào push, kể cả khi người dùng bật xem trước.
- **Luồng chính:** Khi tạo push cho loại nhạy cảm → kiểm tra cài đặt xem trước của người nhận → payload hiển thị hoặc chung chung tương ứng → nội dung đầy đủ chỉ có trong app sau khi mở khoá/đăng nhập.
- **Trạng thái UI:** mục cài đặt xem trước có giải thích rõ đánh đổi riêng tư; xem trước mẫu (preview) trong cài đặt cho từng chế độ (liên kết NOT-S02).
- **Edge cases:** thiết bị chia sẻ nhiều tài khoản hệ điều hành — vẫn theo cài đặt của tài khoản app; push gộp (NOT-06) không được vô tình lộ nội dung qua tiêu đề gộp; thông báo hệ thống về kiểm duyệt không nêu chi tiết nội dung vi phạm trong push.
- **Acceptance criteria:**
  - [ ] Với cài đặt mặc định, không payload push nào chứa nội dung tin nhắn chat hay nội dung ẩn danh (kiểm chứng bằng kiểm tra payload thực tế từng loại)
  - [ ] Nội dung ẩn danh không xuất hiện trong push ở mọi cấu hình cài đặt
  - [ ] Tắt xem trước áp dụng cho cả push đơn lẻ lẫn push gộp
- **Platform:** Chỉ mobile (lock screen push). Web — không áp dụng (không có web push ở baseline).
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

### NOT-09 — Quản lý device token: đăng ký, xoay vòng, xoá khi đăng xuất

- **Hành vi:** mỗi phiên đăng nhập trên mỗi thiết bị có một device token (FCM/APNs) đăng ký với server gắn với userId + deviceId; token được cập nhật khi nền tảng xoay vòng (token refresh), và bị xoá/vô hiệu hoá ngay khi người dùng đăng xuất, đổi mật khẩu toàn cục, hoặc tài khoản bị khoá. Token không hợp lệ trả về từ FCM/APNs (unregistered/invalid) bị đánh dấu chết và loại khỏi các lần gửi sau.
- **Luồng chính:** Đăng nhập thành công → app lấy token hiện tại → gửi đăng ký lên server (upsert theo deviceId) → khi có sự kiện token refresh: cập nhật → đăng xuất: gọi API huỷ đăng ký token của thiết bị này rồi mới xoá phiên local → gửi push: chỉ tra token đang active.
- **Trạng thái UI:** không có UI người dùng (hạ tầng); lỗi đăng ký token không chặn luồng đăng nhập — app vẫn dùng được, push sẽ được đăng ký lại ở lần mở app sau.
- **Edge cases:** đăng xuất khi mất mạng → token bị vô hiệu hoá ở lần đồng bộ kế tiếp và push tới token đó phải thất bại an toàn (không lộ nội dung vì payload vốn tối thiểu theo NOT-08); cùng một thiết bị đăng nhập hai tài khoản lần lượt → token gắn với tài khoản mới nhất, tài khoản cũ không nhận push trên thiết bị đó nữa; đổi điện thoại → token thiết bị cũ bị FCM/APNs thu hồi tự nhiên và bị dọn khi gửi thất bại; dọn dẹp định kỳ các token không hoạt động lâu ngày (job nền).
- **Acceptance criteria:**
  - [ ] Sau khi đăng xuất, thiết bị không nhận bất kỳ push nào của tài khoản đó nữa (test thực tế)
  - [ ] Token refresh được cập nhật không tạo bản ghi trùng cho cùng một thiết bị (upsert theo deviceId)
  - [ ] Token bị FCM/APNs báo không hợp lệ bị loại khỏi tập gửi trong tối đa một lần gửi tiếp theo
  - [ ] Đăng nhập tài khoản khác trên cùng thiết bị không nhận nhầm push của tài khoản trước
- **Platform:** Chỉ mobile. Web — không có device token (không web push ở baseline).
- **Scope:** Đề xuất bổ sung (chi tiết hoá mục Notification đã đăng ký §2.2)

## 3. Tính năng SHOULD

### NOT-S01 — Tóm tắt thông báo dạng digest

- **Hành vi:** với các thông báo không khẩn (khoảnh khắc mới, hoạt động Circle), người dùng chọn nhận bản tóm tắt định kỳ (gợi ý: một lần buổi sáng và/hoặc buổi tối) thay vì từng push riêng lẻ; digest gồm số lượng và điểm nhấn theo nguồn, bấm vào mở notification center đã lọc sẵn.
- **Acceptance criteria:**
  - [ ] Bật digest cho một loại thì loại đó ngừng push lẻ và chỉ xuất hiện trong digest (trừ ngoại lệ ưu tiên cao theo NOT-06)
  - [ ] Digest không bao giờ chứa nội dung thuộc loại nhạy cảm vượt quá chính sách NOT-08

### NOT-S02 — Xem trước nội dung thông báo trong cài đặt

- **Hành vi:** trong màn hình cài đặt thông báo, mỗi loại/công tắc có hình xem trước (mock) cho thấy push và mục in-app sẽ trông thế nào với cài đặt hiện tại (đặc biệt là chế độ xem trước nội dung ở NOT-08 và quiet hours ở NOT-06), giúp người dùng hiểu trước khi lưu.
- **Acceptance criteria:**
  - [ ] Xem trước thay đổi ngay khi người dùng đổi công tắc trong cài đặt, trước khi lưu
  - [ ] Xem trước không dùng dữ liệu thật của người dùng (dữ liệu mẫu cố định)

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### NOT-W01 — Tóm tắt thông minh buổi sáng bằng AI

Mỗi sáng, AI tóm tắt toàn bộ hoạt động qua đêm liên quan tới người dùng thành một thẻ duy nhất trong notification center: "Circle Lớp A: 12 khoảnh khắc mới, sự kiện 'Họp nhóm' có 5 người RSVP, 1 poll sắp hết hạn" — kèm deep link tới từng mục. Giá trị: thay thế hàng loạt thông báo rời rạc bằng một bức tranh tổng quan 10 giây đọc, giảm mệt mỏi thông báo mà không bỏ lỡ việc quan trọng.
**Effort: M**

### NOT-W02 — Độ ưu tiên học theo hành vi

Hệ thống học loại thông báo nào người dùng thường mở ngay, loại nào thường bỏ qua, rồi tự đề xuất (không tự áp dụng) điều chỉnh: "Bạn thường bỏ qua thông báo khoảnh khắc — chuyển sang digest buổi tối?" Giá trị: cài đặt thông báo tự thích nghi thay vì bắt người dùng tự mò, và mọi thay đổi vẫn do người dùng duyệt nên không gây cảm giác bị hệ thống tự ý kiểm soát.
**Effort: L**

## 5. Business rules & invariants

- Mọi module khác chỉ phát sự kiện thông báo qua một giao diện duy nhất của Notification service; không module nào được gọi FCM/APNs trực tiếp.
- In-app notification là nguồn sự thật; push chỉ là kênh phân phối tốt-nhất-có-thể (best effort) — mất push không được làm mất thông báo.
- Chính sách (cài đặt theo loại, mute, quiet hours, trần tần suất) được đánh giá tại thời điểm gửi, không tại thời điểm tạo sự kiện.
- Một thông báo thuộc đúng một loại (enum cố định); mọi loại đều thuộc một nhóm cài đặt và có mẫu deep link.
- Nội dung ẩn danh và (theo mặc định) nội dung chat không bao giờ xuất hiện trong payload push hiển thị.
- Device token luôn gắn với đúng một tài khoản tại một thời điểm trên một thiết bị; đăng xuất = huỷ hiệu lực token.
- Thông báo nhắc sự kiện idempotent theo (sự kiện, mốc nhắc, người nhận) — không gửi trùng trong mọi tình huống chạy lại job.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `Notification` (id, userId, type: enum circle|chat|moment|event|poll|system, title, body, targetType, targetId, deepLink, readAt, createdAt)
- `DeviceToken` (id, userId, deviceId, platform: ios|android, token, status: active|invalid, lastSeenAt) — unique (userId, deviceId)
- `NotificationPreference` (userId, type, pushEnabled, digestEnabled, quietHoursStart, quietHoursEnd, quietHoursEnabled, showPreview)
- `NotificationMute` (userId, scopeType: circle|conversation, scopeId, expiresAt nullable = đến khi bật lại)
- `ReminderSchedule` / outbox (eventId, milestone, userId, status: pending|sent|skipped, reason) — phục vụ idempotency và truy vết
- `PushDeliveryLog` (notificationId, deviceTokenId, provider, result, errorCode, sentAt)

**Endpoint / event gợi ý:**
- REST: `GET /notifications?cursor=...&type=...`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id`
- REST: `POST /devices/push-token`, `DELETE /devices/push-token` (khi đăng xuất), `PUT /notification-preferences`, `POST /notification-mutes`, `DELETE /notification-mutes/:id`
- Vào (internal): hàng đợi sự kiện `notification.requested` từ các module (payload: userId hoặc nguồn suy ra người nhận, type, targetRef, nội dung hiển thị an toàn)
- Job nền: quét mốc nhắc sự kiện, gửi digest, dọn token chết, gửi lại push lỗi tạm thời trong giới hạn retry
- Push provider: FCM (Android) + APNs (iOS), cân nhắc qua một lớp trừu tượng để không phụ thuộc nhà cung cấp

## 7. Cross-cutting riêng cho module

(Ngoài gate chung ở `cross-cutting-gate.md`.)

- **Khả năng truy vết (observability) là yêu cầu cứng của module này:** mọi thông báo phải trả lời được "vì sao người dùng X nhận/không nhận push Y" từ log (quyết định chính sách, kết quả gửi nhà cung cấp) — đây là đường duy nhất để xử lý báo cáo "em không nhận được thông báo".
- **Độ tin cậy phân tầng:** mất push là chấp nhận được, mất bản ghi in-app là không; thiết kế ghi in-app trước, gửi push sau.
- **Riêng tư trong log:** log gửi push không ghi nội dung tin nhắn/nội dung ẩn danh; chỉ ghi id và loại.
- **Đồng hồ và múi giờ:** quiet hours và mốc nhắc đều nhạy cảm múi giờ — mọi tính toán dùng múi giờ đã lưu của tài khoản và thời gian server (UTC), không dùng đồng hồ client.
- **Khả năng mở rộng nguồn:** thêm loại thông báo mới là thay đổi có kiểm soát: bắt buộc khai báo enum, nhóm cài đặt, mẫu deep link, chính sách xem trước nội dung — thiếu một trong bốn thì không được merge.

## 8. Anti-patterns

- Module Chat tự gọi FCM/APNs trực tiếp, mỗi module một kiểu payload — không chính sách chung nào áp được.
- Đánh dấu đã đọc chỉ ở client, badge mỗi thiết bị một số — số chưa đọc phải là sự thật phía server.
- Xin quyền push ngay màn hình đầu tiên trước khi người dùng hiểu app làm gì — tỉ lệ từ chối cao và không xin lại được dễ dàng.
- Đưa nội dung tin nhắn/nội dung ẩn danh vào push "cho tiện" — rò rỉ riêng tư trên lock screen và trong log nhà cung cấp push.
- Gửi push nhắc sự kiện theo lịch chụp sẵn (snapshot) lúc tạo sự kiện — đổi giờ/huỷ/đổi RSVP đều làm nhắc sai.
- Retry push vô hạn khi nhà cung cấp lỗi — lãng phí tài nguyên và có thể thành spam khi hệ thống hồi phục.
- Xoá token bằng cách chờ FCM/APNs báo lỗi mà không huỷ khi đăng xuất — thiết bị đã đăng xuất vẫn nhận push của tài khoản cũ.
- Gộp thông báo che mất định danh sự kiện quan trọng (gộp cả lời mời vào Circle vào "5 thông báo mới").

## 9. Self-audit checklist cho agent

- [ ] NOT-01..02: notification center phân trang cursor, badge khớp server đa thiết bị, mọi thông báo có loại thuộc enum và lọc được theo loại
- [ ] NOT-03: push chạy ở foreground/background/terminated trên Android + iOS, từ chối quyền push không hỏng luồng khác, mọi lần gửi có log kết quả
- [ ] NOT-04: bảng mapping loại → deep link đầy đủ; luồng mở app lạnh từ push tới đúng đích, fallback an toàn khi đích mất/hết quyền
- [ ] NOT-05: cài đặt theo loại + mute theo Circle/hội thoại (có hết hạn) được áp tại thời điểm gửi
- [ ] NOT-06: gộp thông báo cùng nguồn, trần tần suất, quiet hours đều enforce ở server và có log lý do cho mọi quyết định chặn/hoãn/gộp
- [ ] NOT-07: nhắc sự kiện idempotent, đọc RSVP tại thời điểm gửi, vô hiệu khi sự kiện đổi/huỷ
- [ ] NOT-08: payload mặc định không chứa nội dung chat; nội dung ẩn danh không bao giờ vào push
- [ ] NOT-09: token upsert theo thiết bị, huỷ ngay khi đăng xuất, token chết bị loại khỏi tập gửi
- [ ] Không còn anti-pattern nào ở mục 8 xuất hiện trong phần implement

## Changelog

- 2026-10-25 — Tạo bản đầu.
