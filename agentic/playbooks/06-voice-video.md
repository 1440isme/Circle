# Playbook — Voice / Video Call

> Module gọi thoại và gọi video trực tiếp giữa thành viên CIRCLE qua WebRTC — mọi cuộc gọi đều khởi tạo từ ngữ cảnh Circle (sản phẩm không có chat 1-1) — đối chiếu PROJECT_GOD.md §2.2 mục "Voice / Video": Gọi thoại trực tiếp; Gọi video trực tiếp giữa thành viên. Cảnh báo nền: PROJECT_GOD.md §4 có mục riêng về rủi ro WebRTC — playbook này cụ thể hoá thành yêu cầu bắt buộc về TURN và kiểm thử ngoài LAN (xem §5 và CAL-02).

## 1. Tổng quan

- **Mục đích:** cho phép hai thành viên CIRCLE gọi thoại/video trực tiếp trong app, không qua dịch vụ gọi bên ngoài; cuộc gọi là lớp tương tác thời gian thực cao nhất của sản phẩm (sau chat và khoảnh khắc).
- **Actors:** người gọi (caller), người nhận (callee), hệ thống signaling (qua WebSocket sẵn có của dự án — không dựng kênh signaling riêng), hạ tầng STUN/TURN.
- **Quan hệ với module khác:**
  - Khởi tạo **chỉ từ ngữ cảnh Circle**: nút gọi nằm trong phòng chat Circle, hoặc gọi một thành viên từ danh sách thành viên của Circle. Sản phẩm không có chat 1-1 nên không tồn tại điểm vào gọi từ một hội thoại riêng. Cuộc gọi 1-1 vẫn thuộc scope đã đăng ký, nhưng **luôn bắt đầu từ một Circle chung** của hai người và gắn với Circle đó.
  - Ghi kết quả theo **CAL-08**: cuộc gọi nhóm để lại tin nhắn hệ thống trong phòng chat Circle (qua **Chat — CHT-20**); cuộc gọi 1-1 chỉ hiển thị ở màn hình lịch sử cuộc gọi cá nhân của hai phía, **không** ghi vào bất kỳ phòng chat nhóm nào.
  - Điều kiện quan hệ: chỉ gọi được cho thành viên cùng Circle (quan hệ thành viên theo **Circle**; dữ liệu người quen theo **People & Invitations — playbook 02, PPL**) và không nằm trong quan hệ block hai chiều (dùng block list của Account).
  - Đẩy qua **Notification**: cuộc gọi đến khi app background/killed phải có cơ chế đánh thức phù hợp nền tảng (push + màn hình cuộc gọi đến).
- **Phạm vi bản này:** chỉ gọi **1-1** — nhưng luôn khởi tạo từ một Circle chung (xem trên), không phải từ một quan hệ chat riêng. Gọi nhóm là WOW (CAL-W01), ngoài scope đã đăng ký — không implement khi chưa được duyệt bổ sung.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### CAL-01 — Gọi thoại 1-1 qua WebRTC

- **Hành vi:** gọi âm thanh 1-1 dùng WebRTC peer-to-peer; signaling (offer/answer/ICE candidate) trao đổi qua WebSocket hiện có của hệ thống với các event riêng cho call. Âm thanh phát qua loa thoại/tai nghe theo lựa chọn thiết bị (CAL-06).
- **Luồng chính:** từ phòng chat Circle hoặc danh sách thành viên Circle → nút gọi thoại → màn hình cuộc gọi trạng thái đang kết nối/đổ chuông (CAL-04) → phía kia chấp nhận → thiết lập peer connection → trạng thái trong cuộc gọi kèm đồng hồ thời lượng.
- **Trạng thái UI:** initiating, ringing, connecting, in-call, ended, failed (kèm lý do và nút gọi lại).
- **Edge cases:** hai phía gọi nhau cùng lúc (glare — một phía thắng theo quy tắc xác định, phía còn lại tự chuyển thành nhận cuộc gọi đến, không lỗi); ICE không kết nối trực tiếp được (fallback qua TURN theo CAL-02); phía nhận đang trong cuộc gọi khác (xử lý theo CAL-07 "đang bận").
- **Acceptance criteria:**
  - [ ] Hai user ở hai mạng khác nhau gọi thoại thành công, nghe rõ hai chiều
  - [ ] Signaling đi qua WebSocket của hệ thống, không mở hạ tầng signaling riêng
  - [ ] Mọi cuộc gọi đều kết thúc bằng một bản ghi cuộc gọi phía server (CAL-08)
  - [ ] Gọi đồng thời hai chiều không sinh hai cuộc gọi song song/lỗi trạng thái
- **Platform:** Mobile: dùng thư viện WebRTC native (react-native-webrtc), xử lý audio route của OS. Web: RTCPeerConnection của trình duyệt, cần HTTPS. Logic signaling giống nhau.
- **Scope:** Đã đăng ký §2.2

### CAL-02 — Gọi video 1-1 & hạ tầng STUN/TURN

- **Hành vi:** gọi video hai chiều: video đối phương toàn màn hình (hoặc vùng chính), video của mình dạng cửa sổ nhỏ (self-view) di chuyển được vị trí góc. Hạ tầng bắt buộc: STUN để khám phá địa chỉ công khai; **TURN server phải được triển khai và cấu hình sẵn** làm đường fallback khi NAT khó (mạng doanh nghiệp, 4G một số nhà mạng, NAT đối xứng) — không có TURN thì một phần đáng kể cuộc gọi ngoài LAN sẽ thất bại.
- **Luồng chính:** nút gọi video → xin quyền camera+mic (CAL-09) → self-view hiện ngay phía caller → đổ chuông → chấp nhận → video hai chiều.
- **Trạng thái UI:** như CAL-01, cộng: self-view preview trước khi phía kia bắt máy, remote video loading (đã kết nối âm thanh nhưng video chưa về — hiển thị avatar thay thế), camera-off state của đối phương (avatar + tên).
- **Edge cases:** một phía tắt camera giữa cuộc gọi (phía kia thấy avatar, cuộc gọi tiếp tục dạng audio); băng thông không đủ cho video (tự hạ chất lượng theo CAL-11 trước khi tính đến tắt video); trình duyệt/OS không có camera (tự động hạ xuống gọi thoại + thông báo rõ cho cả hai phía).
- **Acceptance criteria:**
  - [ ] Gọi video thành công giữa hai thiết bị ở **hai mạng ngoài LAN khác nhau** (kịch bản kiểm thử bắt buộc, khớp cảnh báo PROJECT_GOD.md §4)
  - [ ] Cuộc gọi vẫn thiết lập được khi một phía ở mạng NAT khó nhờ TURN (có kịch bản test ép dùng TURN và log xác nhận đường relay)
  - [ ] Self-view hiển thị trước khi phía kia bắt máy; tắt camera phía nào phía kia thấy avatar của phía đó
  - [ ] Thiếu camera tự hạ xuống gọi thoại kèm thông báo, không huỷ cuộc gọi
- **Platform:** Mobile: self-view overlay native, hỗ trợ lật camera (CAL-06). Web: self-view là thẻ video góc màn hình. Hạ tầng STUN/TURN dùng chung.
- **Scope:** Đã đăng ký §2.2. Yêu cầu TURN và test ngoài LAN là hệ quả trực tiếp của cảnh báo rủi ro WebRTC tại PROJECT_GOD.md §4.

### CAL-03 — Nhận cuộc gọi đến

- **Hành vi:** phía nhận thấy màn hình cuộc gọi đến toàn màn hình: avatar/tên người gọi, loại cuộc gọi (thoại/video), hai hành động Chấp nhận / Từ chối rõ ràng. App đang mở foreground: hiện in-app call screen + rung/nhạc chuông. App background/killed: push đánh thức kèm màn hình cuộc gọi đến theo cơ chế của nền tảng. Thời gian đổ chuông có giới hạn cấu hình — quá hạn chuyển thành cuộc gọi nhỡ (CAL-07).
- **Luồng chính:** nhận signaling invite → hiển thị call screen → Chấp nhận: xin quyền (nếu chưa có) → nối cuộc gọi; Từ chối: kết thúc phía mình, phía gọi nhận trạng thái "đã từ chối".
- **Trạng thái UI:** incoming-ringing, accepting (đang kết nối), declined, missed (sau khi hết hạn — hiển thị theo quy tắc nhật ký CAL-08).
- **Edge cases:** đang trong một cuộc gọi khác (đi theo nhánh "đang bận" CAL-07, không hiện màn hình cuộc gọi đến thứ hai đè lên); người gọi huỷ trước khi bắt máy (màn hình cuộc gọi đến tự đóng, ghi nhật ký "cuộc gọi nhỡ" hoặc "đã huỷ" theo BR-CAL-03); mất mạng ngay khi invite tới (invite hết hạn theo timeout phía server, không kẹt chuông vô hạn).
- **Acceptance criteria:**
  - [ ] Cuộc gọi đến hiển thị đúng người gọi và loại cuộc gọi ở cả foreground lẫn background (mobile)
  - [ ] Từ chối phía nhận thì phía gọi nhận đúng trạng thái đã từ chối, cuộc gọi đóng sạch
  - [ ] Hết thời gian đổ chuông tự chuyển thành cuộc gọi nhỡ và có bản ghi nhật ký cuộc gọi (CAL-08)
  - [ ] Người gọi huỷ giữa chừng thì màn hình phía nhận tự đóng, không còn chuông kẹt
- **Platform:** Mobile: cần tích hợp cơ chế cuộc gọi đến của OS (CallKit/ConnectionService hoặc tương đương qua push) để background/killed vẫn nhận được. Web: chỉ nhận cuộc gọi đến khi tab đang mở (giới hạn nền tảng — phải hiển thị rõ trong tài liệu/API note, không hứa hẹn nhận cuộc gọi khi đóng tab).
- **Scope:** Đã đăng ký §2.2

### CAL-04 — Màn hình cuộc gọi & máy trạng thái cuộc gọi

- **Hành vi:** toàn bộ cuộc gọi tuân một máy trạng thái duy nhất dùng chung hai phía: `initiating → ringing → connecting → in-call → ended | failed`. Màn hình cuộc gọi hiển thị: tên/avatar đối phương, trạng thái bằng chữ ("Đang kết nối…", "Đang đổ chuông…", "Đang trong cuộc gọi"), đồng hồ thời lượng khi in-call, và hàng điều khiển (CAL-05/06). Kết thúc cuộc gọi (bất kỳ lý do) đều qua một điểm dọn dẹp duy nhất (CAL-12).
- **Luồng chính:** một màn hình duy nhất biến đổi theo trạng thái, không chuyển qua nhiều màn hình rời rạc; ended hiển thị tóm tắt ngắn (thời lượng / lý do kết thúc) rồi tự quay về bề mặt đã khởi tạo cuộc gọi (phòng chat Circle hoặc danh sách thành viên).
- **Trạng thái UI:** đủ 6 trạng thái trên; failed luôn kèm lý do đọc được cho người dùng (mất mạng, đối phương bận, không kết nối được…) và hành động Gọi lại / Đóng.
- **Edge cases:** sự kiện signaling đến không theo thứ tự kỳ vọng (state machine bỏ qua event không hợp lệ với trạng thái hiện tại thay vì crash/chuyển trạng thái sai); user rời màn hình giữa cuộc gọi trên web (cảnh báo rời trang khi đang in-call); app bị OS kill giữa cuộc gọi (lần mở lại không tồn tại trạng thái cuộc gọi ma).
- **Acceptance criteria:**
  - [ ] Mọi đường đi của cuộc gọi đều map được vào máy trạng thái, không có trạng thái "lạ" phía UI
  - [ ] Đồng hồ thời lượng chỉ chạy khi ở trạng thái in-call
  - [ ] Màn hình ended/failed luôn có đường quay về bề mặt khởi tạo cuộc gọi và có bản ghi nhật ký (CAL-08)
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CAL-05 — Điều khiển mic & camera trong cuộc gọi

- **Hành vi:** trong cuộc gọi luôn có: mute/unmute mic (icon phản ánh đúng trạng thái track, không chỉ trạng thái UI), bật/tắt camera (tắt = dừng gửi video, phía kia thấy avatar), và với gọi thoại: chuyển loa ngoài / tai nghe. Trạng thái mute/camera của đối phương hiển thị phía mình (icon mic gạch trên avatar/video của họ).
- **Luồng chính:** chạm nút điều khiển → thay đổi trạng thái track media thật → gửi event trạng thái qua signaling/data channel → UI hai phía cập nhật.
- **Trạng thái UI:** mic-on/mic-off, camera-on/camera-off, speaker-on/speaker-off; nút bấm có phản hồi tức thì (optimistic) nhưng phải reconcile với trạng thái track thật.
- **Edge cases:** OS thu hồi quyền mic giữa cuộc gọi (hiển thị cảnh báo trong màn hình gọi, cuộc gọi không tự kết thúc đột ngột không lý do); thiết bị âm thanh bị rút (tai nghe Bluetooth ngắt — tự về loa thoại an toàn, không mất tiếng im lặng không lý do); tắt camera khi băng thông yếu (gợi ý nhưng không tự tắt thay user ngoài cơ chế thích ứng CAL-11 ở mức hạ độ phân giải).
- **Acceptance criteria:**
  - [ ] Mute mic thì đối phương thực sự không nghe thấy (kiểm chứng bằng test hai thiết bị), icon hai phía khớp nhau
  - [ ] Tắt camera phía kia thấy avatar + trạng thái camera-off trong thời gian ngắn sau thao tác
  - [ ] Chuyển loa ngoài/tai nghe có tác dụng ngay trong cuộc gọi trên mobile
- **Platform:** Mobile: có nút loa ngoài/tai nghe + lật camera (CAL-06). Web: chọn thiết bị qua cài đặt trình duyệt, không bắt buộc nút chuyển loa trong app. Còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### CAL-06 — Lật camera & thiết bị âm thanh (mobile)

- **Hành vi:** mobile có nút lật camera trước/sau ngay trong cuộc gọi video, chuyển đổi không ngắt cuộc gọi (thay track trên cùng peer connection). Âm thanh: mặc định gọi video qua loa ngoài, gọi thoại qua loa thoại; cắm tai nghe thì ưu tiên tai nghe.
- **Luồng chính:** chạm lật camera → self-view và luồng gửi đổi sang camera còn lại trong thời gian ngắn, không renegotiation làm rớt cuộc gọi.
- **Trạng thái UI:** flipping (self-view mờ/đóng băng rất ngắn), audio-route indicator khi cần.
- **Edge cases:** thiết bị chỉ có một camera (ẩn nút lật); lật camera liên tục nhiều lần (debounce, không xếp hàng chuyển đổi gây treo); tai nghe Bluetooth kết nối giữa chừng (chuyển route mượt, không mất âm thanh kéo dài).
- **Acceptance criteria:**
  - [ ] Lật camera không làm rớt/tạo lại cuộc gọi, đối phương thấy hình đổi chiều liên tục không đóng băng dài
  - [ ] Nút lật chỉ xuất hiện khi thiết bị có từ 2 camera
  - [ ] Thay đổi thiết bị âm thanh giữa cuộc gọi được áp dụng mà không cần gọi lại
- **Platform:** Chỉ mobile (web: đổi camera qua chọn thiết bị của trình duyệt nếu cần — SHOULD, không bắt buộc ở baseline).
- **Scope:** Đề xuất bổ sung

### CAL-07 — Từ chối, bận, không trả lời, mất mạng

- **Hành vi:** mọi kết cục không-thành-cuộc-gọi đều có trạng thái và thông điệp riêng, không gộp thành "lỗi" chung chung:
  - **Từ chối (declined):** phía nhận chủ động từ chối → phía gọi thấy "Đã từ chối cuộc gọi".
  - **Bận (busy):** phía nhận đang trong cuộc gọi khác → phía gọi thấy "Đang bận", phía nhận chỉ nhận thông báo nhẹ có cuộc gọi nhỡ (không bị gián đoạn cuộc gọi hiện tại).
  - **Không trả lời (no-answer):** hết thời gian đổ chuông cấu hình → phía gọi thấy "Không trả lời", ghi nhật ký cuộc gọi nhỡ phía nhận.
  - **Mất mạng (unreachable/failed):** signaling không tới nơi hoặc ICE thất bại kể cả qua TURN → trạng thái failed kèm nút Gọi lại.
- **Luồng chính:** mỗi kết cục đều: đóng signaling sạch → ghi bản ghi nhật ký đúng loại (CAL-08) → dọn dẹp (CAL-12).
- **Trạng thái UI:** declined / busy / no-answer / failed — mỗi trạng thái một thông điệp và một icon riêng trên màn hình kết thúc và trong nhật ký chat.
- **Edge cases:** phía nhận offline hoàn toàn (server trả unreachable ngay thay vì chờ hết timeout đổ chuông); phía nhận bấm từ chối đúng lúc phía gọi bấm huỷ (kết cục thắng theo sự kiện server ghi nhận trước, nhật ký chỉ ghi một bản ghi duy nhất); spam gọi liên tục (rate limit phía server theo cặp user).
- **Acceptance criteria:**
  - [ ] Bốn kết cục declined/busy/no-answer/failed phân biệt được ở cả UI phía gọi lẫn nhật ký cuộc gọi
  - [ ] Đang trong cuộc gọi mà có cuộc gọi đến thứ hai: cuộc gọi hiện tại không bị ảnh hưởng, cuộc gọi đến nhận đúng trạng thái bận
  - [ ] Mỗi cuộc gọi chỉ sinh đúng một bản ghi nhật ký dù hai phía thao tác đồng thời
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CAL-08 — Nhật ký cuộc gọi & nơi hiển thị

- **Hành vi:** kết thúc mỗi cuộc gọi (mọi kết cục), server tạo đúng **một bản ghi cuộc gọi** duy nhất (BR-CAL-03, BR-CAL-05) — bản ghi vẫn do server quản lý như trước, chỉ khác **nơi hiển thị** theo loại cuộc gọi. **Cuộc gọi nhóm** → một tin nhắn hệ thống trong phòng chat của Circle qua cơ chế CHT-20 (loại gọi thoại/video, thời lượng nếu thành công, hoặc kết cục nhỡ/từ chối/bận). **Cuộc gọi 1-1** → chỉ hiển thị trong màn hình **Lịch sử cuộc gọi** cá nhân của từng phía, **không** ghi vào phòng chat Circle hay bất kỳ bề mặt nhóm nào — liên lạc riêng giữa hai người không thuộc về nhóm, dù cuộc gọi bắt đầu từ một Circle chung. Chạm vào bản ghi cuộc gọi nhỡ có hành động "Gọi lại".
- **Luồng chính:** cuộc gọi đóng → server xác định kết cục cuối cùng → tạo bản ghi `CallSession` → nếu là cuộc gọi nhóm: phát hành đúng một message type `system` subtype call-log vào phòng chat Circle; nếu là 1-1: bản ghi chỉ xuất hiện khi mỗi phía truy vấn lịch sử cuộc gọi của chính mình.
- **Trạng thái UI:** cuộc gọi nhóm: tin hệ thống căn giữa trong phòng chat Circle theo CHT-20, bản ghi nhỡ có hành động gọi lại. Cuộc gọi 1-1: danh sách Lịch sử cuộc gọi cá nhân (đối phương, loại gọi, thời gian bắt đầu, thời lượng/kết cục), trạng thái rỗng khi chưa có cuộc gọi nào, bản ghi nhỡ có hành động gọi lại.
- **Edge cases:** hai phía bất đồng về kết cục do mất mạng (server là nguồn sự thật duy nhất về kết cục của bản ghi); cuộc gọi kéo dài qua nửa đêm (thời lượng vẫn tính đúng, hiển thị theo thời điểm bắt đầu); một phía rời Circle sau cuộc gọi 1-1 → bản ghi vẫn nằm trong lịch sử cá nhân của họ (đó là lịch sử của cá nhân, không phải dữ liệu của Circle), nhưng hành động "Gọi lại" chỉ hoạt động khi hai người còn ít nhất một Circle chung (BR-CAL-01).
- **Acceptance criteria:**
  - [ ] Mọi cuộc gọi đều có đúng một bản ghi phía server với đúng kết cục
  - [ ] Cuộc gọi nhóm xuất hiện đúng một tin nhắn hệ thống trong phòng chat Circle; cuộc gọi 1-1 không xuất hiện trong bất kỳ phòng chat nào
  - [ ] Lịch sử cuộc gọi 1-1 chỉ truy vấn được bởi chính chủ tài khoản — user khác, kể cả thành viên cùng Circle, gọi API sẽ bị từ chối
  - [ ] Cuộc gọi thành công hiển thị thời lượng khớp đồng hồ trong màn hình gọi (sai lệch cho phép không đáng kể)
  - [ ] Gọi lại từ bản ghi cuộc gọi nhỡ mở đúng luồng gọi với đúng đối phương/nhóm và đúng loại (thoại/video) của cuộc gọi gốc
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CAL-09 — Quyền mic/camera & hướng dẫn khi bị từ chối

- **Hành vi:** quyền mic (gọi thoại) và mic+camera (gọi video) được xin tại thời điểm bắt đầu/tham gia cuộc gọi lần đầu — không xin tràn lan khi cài app. Bị từ chối: hiển thị màn hình giải thích trong ngữ cảnh cuộc gọi (vì sao cần quyền, nút mở Cài đặt hệ thống, nút chuyển sang nghe/gọi thoại nếu chỉ thiếu camera), phía còn lại nhận trạng thái "không thể kết nối" thay vì đổ chuông vô hạn.
- **Luồng chính:** bấm gọi → kiểm tra quyền → thiếu: giải thích ngắn → hộp thoại hệ thống → từ chối: màn hình permission với các lối thoát (Mở cài đặt / Hạ xuống gọi thoại nếu chỉ thiếu camera / Huỷ).
- **Trạng thái UI:** permission-explain, permission-denied, granted; phía đối tác: trạng thái kết nối thất bại có lý do chung (không lộ chi tiết quyền của đối phương).
- **Edge cases:** chỉ cấp mic, từ chối camera khi gọi video (tự đề xuất hạ xuống gọi thoại, giữ nguyên cuộc gọi); quyền bị thu hồi giữa cuộc gọi (xử lý như CAL-05 edge case, thông báo trong màn hình gọi); web: quyền gắn theo site, user chặn vĩnh viễn (hướng dẫn theo trình duyệt).
- **Acceptance criteria:**
  - [ ] Không có quyền, không có thao tác nào crash; luôn có màn hình hướng dẫn mở cài đặt cấp lại quyền
  - [ ] Thiếu camera vẫn gọi thoại được trong cùng luồng, không phải quay lại từ đầu
  - [ ] Phía đối tác không bị kẹt ở trạng thái đổ chuông khi phía này từ chối quyền
- **Platform:** Mobile: deep link tới app settings. Web: hướng dẫn theo trình duyệt. Còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### CAL-10 — Reconnect khi mạng chập chờn

- **Hành vi:** mất kết nối mạng/ICE disconnect trong cuộc gọi: hiển thị trạng thái "Đang kết nối lại…" kèm bộ đếm thời gian chờ cấu hình; thử ICE restart và khôi phục media trong cửa sổ đó. Khôi phục thành công: cuộc gọi tiếp tục, đồng hồ thời lượng tính liên tục (không reset). Hết cửa sổ chờ: kết thúc cuộc gọi với lý do mất kết nối, ghi nhật ký kèm thời lượng thực. Phía còn lại thấy trạng thái "Kết nối của đối phương không ổn định/đã mất" tương ứng.
- **Luồng chính:** phát hiện disconnect → banner reconnecting hai phía → ICE restart → connected lại: ẩn banner, tiếp tục; hoặc timeout: đóng theo CAL-12.
- **Trạng thái UI:** reconnecting (banner + thời gian đã chờ), recovered (thông báo ngắn tự ẩn), failed-disconnected.
- **Edge cases:** chuyển mạng giữa cuộc gọi (Wi-Fi → 4G) trên mobile — coi như reconnect, phải sống sót qua kịch bản này; cả hai phía cùng mất mạng rồi cùng quay lại (một phía chủ động ICE restart theo vai trò caller/callee gốc để tránh xung đột); user chủ động kết thúc trong lúc đang reconnecting (kết thúc ngay, không chờ).
- **Acceptance criteria:**
  - [ ] Rút mạng vài giây rồi cắm lại: cuộc gọi khôi phục, không phải gọi lại từ đầu
  - [ ] Chuyển Wi-Fi ↔ 4G trên mobile không làm rớt cuộc gọi (hoặc tự reconnect thành công)
  - [ ] Hết cửa sổ reconnect, cuộc gọi đóng sạch, có nhật ký với lý do mất kết nối
  - [ ] Đồng hồ thời lượng không bị reset sau reconnect thành công
- **Platform:** Giống nhau về hành vi; mobile chịu thêm kịch bản chuyển mạng/OS đưa app xuống background ngắn.
- **Scope:** Đề xuất bổ sung

### CAL-11 — Chất lượng thích ứng theo băng thông

- **Hành vi:** peer connection theo dõi thống kê (bitrate, packet loss, jitter) và tự thích ứng theo bậc: hạ độ phân giải/framerate video trước, sau đó hạ bitrate audio ở mức vẫn nghe rõ; khi băng thông hồi phục thì nâng dần trở lại (có độ trễ chống dao động). User không bị hỏi can thiệp; thay đổi diễn ra trong nền.
- **Luồng chính:** vòng theo dõi định kỳ khi in-call → so ngưỡng cấu hình → áp dụng bậc chất lượng mới qua sender parameters.
- **Trạng thái UI:** không hiển thị mặc định (chỉ số chất lượng chi tiết thuộc SHOULD CAL-S02); tối thiểu phải có khác biệt hình ảnh mượt mà, không đóng băng kéo dài.
- **Edge cases:** băng thông dao động liên tục (hysteresis: giữ mỗi bậc tối thiểu một khoảng thời gian cấu hình, tránh nhảy bậc liên hồi); mạng cực yếu (ưu tiên giữ âm thanh sống — video có thể về mức tối thiểu thay vì để cả cuộc gọi chết); hai phía băng thông lệch nhau (thích ứng theo chiều gửi của từng phía, độc lập).
- **Acceptance criteria:**
  - [ ] Giảm băng thông giả lập: video hạ chất lượng theo bậc, âm thanh vẫn duy trì liên tục
  - [ ] Băng thông hồi phục: chất lượng nâng lại dần, không đứng yên ở mức thấp nhất
  - [ ] Không xảy ra dao động đổi bậc liên tục khi băng thông ở ngưỡng biên
- **Platform:** Giống nhau (API thống kê WebRTC có ở cả native lẫn trình duyệt).
- **Scope:** Đề xuất bổ sung

### CAL-12 — Kết thúc cuộc gọi & dọn dẹp tài nguyên

- **Hành vi:** mọi đường kết thúc (một phía gác máy, từ chối, timeout, lỗi, mất mạng quá hạn) đều đi qua một quy trình dọn dẹp duy nhất: dừng mọi local track (mic/camera tắt thật — đèn camera tắt), đóng peer connection, huỷ listener signaling của phiên gọi, giải phóng wakelock/audio session, gửi event kết thúc cho phía còn lại và cho server ghi nhật ký. Sau dọn dẹp, app sẵn sàng cho cuộc gọi mới ngay.
- **Luồng chính:** trigger kết thúc → gửi `call:end` → stop tracks → close peer connection → reset state máy trạng thái về idle → hiển thị màn hình ended ngắn → về chat.
- **Trạng thái UI:** ending (rất ngắn), ended summary.
- **Edge cases:** cả hai phía cùng gác máy một lúc (dọn dẹp idempotent, chạy hai lần không lỗi); event kết thúc từ server tới sau khi local đã dọn xong (bỏ qua an toàn); bắt đầu cuộc gọi mới ngay sau khi kết thúc (không dính state/track của phiên cũ); app bị kill giữa cuộc gọi (phía còn lại nhận kết thúc qua timeout signaling của server, không treo in-call vô hạn).
- **Acceptance criteria:**
  - [ ] Sau khi kết thúc, camera/mic tắt thật ở mức OS (đèn báo camera tắt, không app nào còn giữ thiết bị)
  - [ ] Gọi ngay một cuộc gọi mới sau khi kết thúc hoạt động bình thường
  - [ ] Kill app giữa cuộc gọi: phía còn lại thoát trạng thái in-call trong thời gian timeout cấu hình của server
  - [ ] Dọn dẹp chạy idempotent — kích hoạt kết thúc nhiều lần không sinh lỗi/nhật ký trùng
- **Platform:** Mobile: trả audio session/wakelock cho OS. Web: dừng track trình duyệt (chỉ báo ghi hình trên tab biến mất). Logic giống nhau.
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### CAL-S01 — Picture-in-Picture trên mobile

- **Hành vi:** khi đang gọi video mà user rời app/chuyển màn hình trong app, video đối phương thu về cửa sổ PiP nổi để cuộc gọi vẫn nhìn thấy được; quay lại app khôi phục toàn màn hình. Trên Android/iOS tuân cơ chế PiP của OS; nếu OS/khả năng thiết bị không hỗ trợ thì tối thiểu giữ cuộc gọi dạng audio kèm chỉ dấu "đang trong cuộc gọi" khi rời màn hình gọi trong app.
- **Acceptance criteria:**
  - [ ] Rời màn hình gọi giữa cuộc gọi video, PiP xuất hiện và video vẫn chạy
  - [ ] Quay lại từ PiP khôi phục đúng trạng thái điều khiển trước đó (mute/camera không bị reset)

### CAL-S02 — Hiển thị chất lượng kết nối

- **Hành vi:** chỉ dấu chất lượng kết nối trong màn hình gọi (biểu tượng sóng 3 mức: tốt / trung bình / kém) suy ra từ thống kê WebRTC của CAL-11; chạm vào xem chi tiết cơ bản (độ trễ ước lượng) nếu dự án muốn. Chỉ dấu chỉ để thông tin, không kèm thao tác bắt buộc với user.
- **Acceptance criteria:**
  - [ ] Chỉ dấu cập nhật theo điều kiện mạng giả lập (bóp băng thông thì mức chất lượng hạ tương ứng)
  - [ ] Mức chất lượng hiển thị nhất quán với bậc thích ứng CAL-11 đang áp dụng

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### CAL-W01 — Gọi nhóm nhỏ trong Circle

Mở rộng từ 1-1 lên gọi nhóm giới hạn số người (kiến trúc SFU thay vì mesh để không sập băng thông khi nhiều người), khởi tạo từ group chat của Circle, thành viên vào/ra linh hoạt trong lúc gọi. Giá trị: Circle là nhóm thân thiết — gọi nhóm là nhu cầu tự nhiên và là điểm demo mạnh. **Ngoài scope đã đăng ký** (§2.2 chỉ đăng ký gọi trực tiếp giữa thành viên, hiểu là 1-1): bắt buộc có quyết định mở rộng scope + ADR kiến trúc (SFU, TURN scale) trước khi làm. Ghi chú triết lý: đây là WOW hợp triết lý group-first nhất của module — cuộc gọi nảy sinh trực tiếp từ hoạt động nhóm — nên được xét duyệt đầu tiên trong innovation pool (vẫn giữ nguyên điều kiện mở rộng scope + ADR ở trên). **Effort: L**

### CAL-W02 — Phụ đề trực tiếp & tóm tắt sau cuộc gọi

Phụ đề speech-to-text realtime ngay trong cuộc gọi (hiển thị dạng dòng chạy dưới video, tắt/mở được), và sau khi kết thúc sinh bản tóm tắt ngắn (chủ đề chính, việc đã thống nhất) gắn vào bản ghi cuộc gọi (hiển thị theo quy tắc CAL-08) khi cả hai phía đồng ý. Giá trị: hỗ trợ nghe kém/môi trường ồn và biến cuộc gọi thành tri thức tra cứu lại được trong Circle. Bắt buộc khi duyệt: cơ chế đồng ý của cả hai phía trước khi ghi/phân tích nội dung cuộc gọi, và chính sách lưu trữ transcript rõ ràng. **Effort: L**

## 5. Business rules & invariants

- **BR-CAL-01:** cuộc gọi chỉ tồn tại giữa các user cùng ít nhất một Circle và không block nhau — sản phẩm không có quan hệ "bạn bè" độc lập, quan hệ người quen suy ra từ Circle chung (theo playbook 02 — PPL); cuộc gọi 1-1 luôn gắn với một Circle chung cụ thể tại thời điểm invite. Server kiểm tra điều kiện này tại thời điểm invite, không dựa vào việc client có hiện nút gọi hay không.
- **BR-CAL-02:** mỗi user tại một thời điểm chỉ tham gia tối đa một cuộc gọi; invite thứ hai trong lúc đang bận luôn nhận đáp án `busy` ở tầng signaling (không phụ thuộc UI phía nhận có hiển thị hay không).
- **BR-CAL-03:** server là nguồn sự thật duy nhất về kết cục cuộc gọi (answered/missed/declined/busy/failed + thời lượng); mọi nơi hiển thị nhật ký — tin hệ thống trong phòng chat Circle đối với cuộc gọi nhóm, màn hình lịch sử cuộc gọi cá nhân đối với cuộc gọi 1-1 — đều đọc từ bản ghi của server, client không tự ghi nhật ký.
- **BR-CAL-04:** hạ tầng TURN là thành phần **bắt buộc** của production/staging dùng để kiểm thử, không phải "làm sau nếu cần": cấu hình ICE servers (STUN + TURN kèm credential ngắn hạn) lấy từ server, không hardcode credential TURN dài hạn trong client. Đây là hệ quả trực tiếp của cảnh báo rủi ro tại PROJECT_GOD.md §4.
- **BR-CAL-05:** mọi phiên gọi đều có `callId` duy nhất do server cấp khi invite; mọi event signaling và bản ghi nhật ký đều tham chiếu `callId` này.
- **BR-CAL-06:** baseline không ghi âm/ghi hình cuộc gọi. Bất kỳ tính năng nào chạm vào nội dung cuộc gọi (như CAL-W02) đều cần đồng ý rõ ràng của cả hai phía và quyết định riêng.
- **BR-CAL-07:** các ngưỡng thời gian (đổ chuông tối đa, cửa sổ reconnect, timeout dọn phiên khi một phía biến mất) là hằng số cấu hình phía server dùng chung cho web và mobile — không để hai nền tảng tự đặt khác nhau.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `CallSession` (id = callId, circleId, initiatedBy, participantIds, scope: direct|group, kind: voice|video, status, startedAt, answeredAt?, endedAt?, endReason, durationSec?) — server quản lý, là nguồn sự thật cho BR-CAL-03
- Hiển thị: cuộc gọi nhóm dùng lại `Message` type `system` subtype call-log của Chat (CHT-20) trong phòng chat Circle, tham chiếu callId; cuộc gọi 1-1 không tạo message nào — màn hình Lịch sử cuộc gọi truy vấn trực tiếp `CallSession` theo user.
- Cấu hình ICE (STUN/TURN + credential ngắn hạn) cấp qua endpoint, không phải entity lưu trữ phía client.

**Endpoint REST gợi ý:**
- `GET /calls/ice-config` (trả STUN/TURN + credential ngắn hạn cho client đã đăng nhập)
- `GET /calls/history` (lịch sử cuộc gọi 1-1 của chính user đang đăng nhập, phân trang; cuộc gọi nhóm tra cứu qua luồng tin nhắn hệ thống trong phòng chat Circle)

**Event realtime / signaling (qua WebSocket sẵn có) gợi ý:**
- Client → Server: `call:invite` (kèm circleId, scope, kind), `call:accept`, `call:decline`, `call:end`, `call:sdp` (offer/answer), `call:ice` (candidate), `call:media-state` (mute/camera on-off)
- Server → Client: `call:incoming`, `call:ringing`, `call:accepted`, `call:declined`, `call:busy`, `call:ended`, `call:sdp`, `call:ice`, `call:peer-media-state`, `call:reconnecting` / trạng thái phiên từ server khi một phía mất kết nối

## 7. Cross-cutting riêng cho module

(Ngoài gate chung trong cross-cutting-gate.md)

- **Kiểm thử mạng thực là một phần của "done":** mọi thay đổi chạm vào signaling/media đều phải qua kịch bản kiểm thử hai thiết bị ở hai mạng khác nhau (ngoài LAN) và ít nhất một kịch bản ép TURN relay; kết quả kiểm thử ghi vào evidence của task như yêu cầu của GOD file. Test chỉ trên localhost/cùng Wi-Fi không được tính là đạt.
- **Quyền riêng tư của thiết bị:** chỉ báo đang dùng mic/camera của OS phải luôn khớp thực tế — không giữ track sống ngoài cuộc gọi vì bất kỳ lý do nào (kể cả "chuẩn bị sẵn cho cuộc gọi sau").
- **Pin & nhiệt (mobile):** gọi video là tác vụ nặng — tránh giữ camera ở độ phân giải cao hơn bậc chất lượng CAL-11 đang chọn; giải phóng camera ngay khi cuộc gọi kết thúc (CAL-12).
- **Âm thanh hệ thống:** cuộc gọi phải tôn trọng chế độ im lặng/không làm phiền của OS ở phía chuông đến theo chuẩn nền tảng; nhạc chuông dùng âm thanh hệ thống hoặc một âm duy nhất của app, cấu hình được trong cài đặt thông báo.
- **Đồng hồ thời lượng:** thời lượng hiển thị và thời lượng ghi nhật ký đều tính từ mốc server ghi nhận answered → ended, hai phía hiển thị cùng một con số.

## 8. Anti-patterns

- Chỉ cấu hình STUN mà không có TURN rồi kết luận "WebRTC không ổn định" — phần lớn cuộc gọi thất bại ngoài LAN đến từ thiếu TURN, đúng rủi ro PROJECT_GOD.md §4 đã cảnh báo.
- Tự mở kênh signaling riêng (server socket thứ hai) thay vì dùng WebSocket sẵn có của hệ thống → hai nguồn sự thật về kết nối, khó debug và lệch trạng thái online.
- Để client tự quyết kết cục cuộc gọi và tự ghi nhật ký → hai phía ghi hai kết cục khác nhau; server phải là nguồn sự thật (BR-CAL-03).
- Hardcode credential TURN trong mã nguồn client — lộ credential là mất hạ tầng; cấp credential ngắn hạn qua API (BR-CAL-04).
- Quên stop track khi kết thúc: đèn camera còn sáng sau khi gác máy là lỗi nghiêm trọng về riêng tư và niềm tin.
- Xin quyền mic/camera ngay khi cài app/mở app thay vì tại thời điểm gọi — tỉ lệ từ chối cao và app bị đánh giá xâm phạm.
- Không có máy trạng thái: rải logic cuộc gọi khắp các màn hình bằng cờ boolean → trạng thái ma, chuông kẹt, hai cuộc gọi chồng nhau.
- Chỉ test gọi trên cùng một mạng Wi-Fi/localhost rồi báo đạt — không phản ánh điều kiện NAT thực tế của người dùng.
- Xử lý busy ở UI (ẩn nút gọi) thay vì ở signaling/server — client khác vẫn gọi xuyên qua được.

## 9. Self-audit checklist cho agent

Trước khi báo hoàn thành module Voice/Video, agent tự kiểm đủ các mục Tier MUST:

- [ ] CAL-01: gọi thoại 1-1 qua WebRTC chạy được giữa hai mạng khác nhau, signaling qua WebSocket chung
- [ ] CAL-02: gọi video có self-view; TURN đã triển khai và có test ép relay thành công; test ngoài LAN đã chạy và có evidence
- [ ] CAL-03: nhận cuộc gọi đến đúng ở foreground và background (mobile), hết hạn đổ chuông thành cuộc gọi nhỡ
- [ ] CAL-04: máy trạng thái 6 trạng thái áp dụng cho mọi đường đi, đồng hồ chỉ chạy khi in-call
- [ ] CAL-05: mute mic/tắt camera có tác dụng thật trên track và hiển thị khớp hai phía
- [ ] CAL-06: lật camera mobile không rớt cuộc gọi; chuyển thiết bị âm thanh giữa cuộc gọi được
- [ ] CAL-07: declined/busy/no-answer/failed phân biệt rõ ở UI và nhật ký, mỗi cuộc gọi đúng một bản ghi
- [ ] CAL-08: bản ghi cuộc gọi do server quản lý; cuộc gọi nhóm hiện ở phòng chat Circle, cuộc gọi 1-1 chỉ hiện ở lịch sử cuộc gọi cá nhân; gọi lại từ cuộc gọi nhỡ đúng người/đúng loại
- [ ] CAL-09: thiếu quyền có màn hình hướng dẫn + hạ xuống gọi thoại được khi chỉ thiếu camera
- [ ] CAL-10: reconnect sống sót qua mất mạng ngắn và chuyển Wi-Fi ↔ 4G, đồng hồ không reset
- [ ] CAL-11: chất lượng thích ứng theo bậc có hysteresis, ưu tiên giữ âm thanh khi mạng cực yếu
- [ ] CAL-12: kết thúc cuộc gọi dọn sạch track/peer/listener, đèn camera tắt, gọi lại ngay được
- [ ] BR-CAL-04: credential TURN cấp ngắn hạn qua API, không hardcode trong client

## Changelog

- 2026-10-25 — Tạo bản đầu: playbook Voice/Video đầy đủ Tier MUST (CAL-01 → CAL-12), SHOULD (2), WOW (2); cụ thể hoá cảnh báo WebRTC của PROJECT_GOD.md §4 thành yêu cầu TURN + kiểm thử ngoài LAN bắt buộc.
- 2026-10-25 — Chỉnh theo triết lý group-first: bề mặt khởi tạo cuộc gọi chỉ còn ngữ cảnh Circle (phòng chat Circle / danh sách thành viên Circle), bỏ điểm vào từ chat 1-1 (không tồn tại trong sản phẩm); nhật ký cuộc gọi 1-1 chuyển về màn hình lịch sử cuộc gọi cá nhân của hai phía, chỉ cuộc gọi nhóm mới ghi tin hệ thống vào phòng chat Circle; CAL-W01 được ghi chú là WOW ưu tiên xét duyệt đầu tiên trong innovation pool.
