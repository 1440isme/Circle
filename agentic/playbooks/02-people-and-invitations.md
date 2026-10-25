# Playbook — Con người, Người quen & Lời mời vào Circle (People & Invitations)

> Module quản lý cách con người tìm thấy nhau và đến được với nhau trong CIRCLE — nhưng **chỉ thông qua Circle**: tìm người, "người quen" suy ra từ Circle chung, và lời mời thẳng vào Circle. Đối chiếu PROJECT_GOD.md §2.2 nhóm "Friend" (Tìm kiếm người dùng; Gửi lời mời kết bạn; Chấp nhận / từ chối; Quản lý danh sách bạn bè) — được **diễn giải lại** theo triết lý group-first, xem mục 1.

## 1. Tổng quan

- **File này THAY THẾ `02-friend.md` (đã xoá)** theo triết lý sản phẩm group-first do chủ dự án chốt ngày **2026-10-25**, nguyên văn: *"Mọi tính năng sinh ra vì hoạt động nhóm và tồn tại vì nhóm. Phần chat 1-1 sẽ không có. Tính năng kết bạn có thể sẽ thể hiện bằng cách nào đó, vì chủ yếu là mời thẳng vào nhóm."*
- **Hệ quả thiết kế cốt lõi:**
  - CIRCLE **không có đồ thị "bạn bè" độc lập**: không tồn tại quan hệ bạn bè hai chiều do user quản lý, không có "danh sách bạn bè", không có nút "Kết bạn", không có số đếm bạn bè trên hồ sơ.
  - Quan hệ xã hội **chỉ tồn tại bên trong Circle**: hai người "quen nhau" vì cùng ở trong một hay nhiều Circle. Mọi khái niệm thay thế cho "bạn bè" (người quen, gợi ý, ngữ cảnh quan hệ) đều **tự suy ra (derived) từ Circle membership**, không lưu thành quan hệ riêng.
  - **"Kết bạn" được thể hiện lại thành:** tìm người → **mời thẳng vào Circle** → người được mời chấp nhận là trở thành thành viên Circle ngay (không có bước kết bạn trung gian, không có trạng thái "đã là bạn" nào được tạo ra).
- **Đối chiếu scope:** Nhóm "Friend" trong PROJECT_GOD.md §2.2 được diễn giải lại như sau: "Tìm kiếm người dùng" → PPL-01; "Gửi lời mời kết bạn / Chấp nhận / Từ chối" → lời mời vào Circle (PPL-03, PPL-04); "Quản lý danh sách bạn bè" → danh sách "Người quen" tự suy ra (PPL-02). **§2.2 của GOD file cần amendment tương ứng** để khớp diễn giải này — playbook này không tự tuyên bố đã sửa GOD file; cho tới khi GOD được sửa, khi có mâu thuẫn giữa playbook này và §2.2 nguyên văn thì phải báo cáo mâu thuẫn thay vì tự chọn.
- **Mục đích:** Cung cấp mọi bề mặt để một user (a) tìm thấy một người cụ thể, (b) khám phá những người mình đã quen qua các Circle chung, (c) mời người vào Circle và quản lý các lời mời hai chiều, (d) kiểm soát ai tìm thấy/gợi ý mình, và (e) chặn/báo cáo người khác vì an toàn — tất cả đều không cần và không tạo ra quan hệ bạn bè độc lập.
- **Actors:**
  - User (đã xác thực): tìm người, xem người quen, gửi/thu hồi lời mời vào Circle mình có quyền mời, xử lý lời mời nhận được, cài đặt riêng tư tìm kiếm, chặn/báo cáo.
  - Thành viên Circle có quyền mời (theo ma trận quyền ở playbook 03): nguồn chính của lời mời vào Circle.
  - Admin (hệ thống, qua Management Website): xử lý báo cáo người dùng tại hàng đợi kiểm duyệt (playbook 09).
- **Quan hệ với module khác:**
  - **Account (01):** dùng hồ sơ công khai (displayName, username, avatar) và cài đặt riêng tư của user từ module này để hiển thị và tìm kiếm; không sao chép dữ liệu hồ sơ.
  - **Circle (03):** lời mời trong module này luôn gắn với **một Circle đích cụ thể**. Cơ chế lời mời thuộc về Circle: link mời, QR, mã mời, quyền ai được mời, giới hạn thành viên, hàng đợi duyệt tham gia (nếu Circle có bật duyệt) — tất cả spec ở playbook 03. Module này chỉ spec **hành động phía "người"**: từ một con người cụ thể (kết quả tìm kiếm, hồ sơ, danh sách người quen) bấm tới việc mời người đó vào Circle, và hộp thư quản lý lời mời theo góc nhìn cá nhân xuyên các Circle.
  - **Chat (05):** không tồn tại chat 1-1 trong CIRCLE; tương tác nhắn tin chỉ xảy ra trong chat nhóm của Circle. Module này không tạo bất kỳ "cuộc trò chuyện" nào khi mời hay chấp nhận lời mời.
  - **Realtime sharing (04):** đối tượng xem khoảnh khắc được xác định theo Circle, không theo "danh sách bạn thân/bạn bè"; module này không cung cấp danh sách audience dạng bạn bè.
  - **Notification (08):** lời mời vào Circle, lời mời được chấp nhận/từ chối là các sự kiện phát thông báo qua module này.
  - **Admin/Moderation (09):** báo cáo người dùng (PPL-09) chảy vào hàng đợi kiểm duyệt ADM-04.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### PPL-01 — Tìm người để mời
- **Hành vi:** User tìm một người cụ thể theo **tên hiển thị, username, hoặc số điện thoại chính xác** để mời vào Circle. Mỗi kết quả hiển thị **ngữ cảnh quan hệ suy ra từ Circle chung** theo dạng *"Cùng Circle X, Y"* (liệt kê tối đa 2 Circle chung + số Circle chung còn lại nếu có), thay cho khái niệm "bạn chung" của MXH truyền thống. Kết quả không có Circle chung thì không hiển thị dòng ngữ cảnh (không bịa quan hệ).
- **Luồng chính:** Nhập từ khoá (tối thiểu theo loại: tên/username gõ từng phần; SĐT phải nhập đầy đủ, khớp chính xác) → server tìm trên các trường được phép tìm (tôn trọng cài đặt riêng tư PPL-07 của người bị tìm) → trả danh sách kết quả kèm ngữ cảnh Circle chung → user chọn một người → mở hồ sơ rút gọn hoặc đi thẳng tới hành động "Mời vào Circle" (PPL-03).
- **Trạng thái UI:** đang gõ (debounce, không spam API), loading, empty (không tìm thấy — kèm gợi ý kiểm tra lại username/SĐT), error (mất mạng), trạng thái "không thể mời" ngay trên kết quả (đã là thành viên của Circle đang chọn / đã có lời mời đang chờ / bị chặn hai chiều).
- **Edge cases:** Tìm chính mình → hiển thị hồ sơ của mình, không có hành động mời. Người đã ở trong Circle đích → ghi rõ "Đã là thành viên Circle này". Hai bên đã chặn nhau (PPL-08) → không xuất hiện trong kết quả của nhau. Tìm bằng SĐT của người đã tắt tìm kiếm qua SĐT (PPL-07) → không trả kết quả qua kênh SĐT nhưng vẫn tìm được qua username nếu kênh đó đang bật. Từ khoá quá ngắn/quá chung → yêu cầu thêm ký tự thay vì trả danh sách khổng lồ.
- **Acceptance criteria:**
  - [ ] Tìm kiếm hỗ trợ đủ 3 kênh: tên hiển thị, username, số điện thoại (khớp chính xác, không tìm từng phần theo SĐT).
  - [ ] Mọi kết quả có Circle chung đều hiển thị đúng định dạng "Cùng Circle X, Y" với X, Y là Circle mà **cả hai cùng là thành viên** và người xem có quyền nhìn thấy.
  - [ ] Kết quả tôn trọng cài đặt riêng tư tìm kiếm (PPL-07) của người bị tìm ở tầng server, không lọc ở client.
  - [ ] Không tồn tại bất kỳ nhãn/ngôn ngữ "bạn chung / bạn bè" nào trong kết quả tìm kiếm.
  - [ ] API tìm kiếm có rate limit và giới hạn số kết quả mỗi trang để chống quét danh bạ (enumeration).
- **Platform:** Mobile có thêm lối vào tìm từ danh bạ (đối chiếu SĐT đã băm — xem SHOULD PPL-S01); hành vi tìm kiếm và hiển thị ngữ cảnh giống nhau.
- **Scope:** Đã đăng ký §2.2

### PPL-02 — "Người quen" (People you know) — danh sách tự suy ra từ Circle chung
- **Hành vi:** Hệ thống tự dựng danh sách **"Người quen"**: tất cả người đang cùng ít nhất một Circle với user, **suy ra hoàn toàn từ Circle membership tại thời điểm truy vấn** — không có bảng quan hệ bạn bè, user không "thêm/xoá bạn" trong danh sách này. Sắp xếp mặc định: **số Circle chung giảm dần, sau đó mức độ tương tác gần đây trong các Circle chung** (tin nhắn nhóm, reaction, khoảnh khắc — tín hiệu tổng hợp, không hiển thị chi tiết "ai tương tác với ai"). Đây là **nguồn chọn người chính** khi tạo Circle mới hoặc mời thêm thành viên vào Circle.
- **Luồng chính:** User mở màn hình chọn người (từ luồng tạo Circle ở playbook 03, hoặc từ "Mời vào Circle" PPL-03) → hệ thống trả danh sách người quen đã sắp xếp, mỗi dòng kèm ngữ cảnh "Cùng Circle X, Y" → user chọn nhiều người (multi-select) → xác nhận để gửi lời mời hoặc thêm vào Circle mới.
- **Trạng thái UI:** loading (danh sách dài phải phân trang/lazy-load), empty (user chưa thuộc Circle nào hoặc chưa có người quen — hiển thị hướng dẫn: tạo Circle đầu tiên / mời bằng tìm kiếm hoặc link mời ở playbook 03), error.
- **Edge cases:** User rời khỏi Circle cuối cùng còn chung với một người → người đó biến mất khỏi danh sách người quen ở lần tải tiếp theo (không còn "quan hệ" nào giữ lại). Người bị chặn hai chiều → không xuất hiện. Tín hiệu tương tác gần đây phải không làm lộ nội dung/hoạt động của Circle mà người xem không còn là thành viên. Danh sách rất lớn (nhiều Circle đông thành viên) → bắt buộc phân trang phía server, không tải toàn bộ về client.
- **Acceptance criteria:**
  - [ ] Danh sách được tính từ Circle membership hiện tại; **không tồn tại bảng/cờ "friend"** nào trong hệ thống để danh sách này đọc vào.
  - [ ] Thứ tự sắp xếp đúng quy tắc công bố: số Circle chung trước, tương tác gần đây làm tiêu chí phụ; có test cho cả hai tiêu chí.
  - [ ] Người quen biến mất khỏi danh sách khi hai người không còn Circle chung nào (kiểm chứng bằng test rời Circle).
  - [ ] Danh sách dùng được làm nguồn chọn người (multi-select) cho luồng tạo Circle và mời thêm thành viên.
  - [ ] Người đã bị chặn (hai chiều) và tài khoản bị khoá/xoá không xuất hiện trong danh sách.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### PPL-03 — Mời thẳng vào Circle từ kết quả tìm kiếm / hồ sơ người dùng
- **Hành vi:** Từ một con người cụ thể (kết quả tìm kiếm PPL-01, dòng người quen PPL-02, hoặc trang hồ sơ của người đó), user thực hiện hành động **"Mời vào Circle"**: chọn một Circle mà mình có quyền mời và người kia chưa là thành viên → gửi lời mời kèm lời nhắn tuỳ chọn. Đây là hình thức "kết nối" duy nhất giữa hai người trong CIRCLE — **không tồn tại hành động "Kết bạn"** ở bất kỳ bề mặt nào. Cơ chế gửi/nhận lời mời phía Circle (quyền mời theo vai trò, link/QR/mã mời, giới hạn thành viên, thời hạn mặc định của lời mời) do playbook 03 quản lý; tính năng này chỉ spec hành động phía người và các kiểm tra trước khi gửi.
- **Luồng chính:** Chọn người → bấm "Mời vào Circle" → hiện danh sách Circle khả thi (mình có quyền mời + người kia chưa là thành viên + chưa có lời mời đang chờ tới Circle đó) → chọn Circle → nhập lời nhắn tuỳ chọn → gửi → người nhận nhận được lời mời trong hộp thư (PPL-04) và thông báo (playbook 08).
- **Trạng thái UI:** danh sách Circle khả thi rỗng (mình không có Circle nào để mời / người kia đã ở mọi Circle chung khả thi — giải thích rõ, kèm lối tắt "Tạo Circle mới cùng người này" dẫn sang playbook 03), sending, success, error (hết quyền mời do vai trò thay đổi, Circle vừa đầy, bị chặn).
- **Edge cases:** Người được mời vừa được người khác mời vào cùng Circle → không tạo lời mời trùng (gộp về một lời mời đang chờ, hiển thị "Đã có lời mời đang chờ"). Người gửi bị thu hồi quyền mời giữa chừng → server từ chối ở thời điểm gửi. Người được mời đã chặn người gửi (hoặc ngược lại) → không gửi được và thông báo trung tính (không tiết lộ lý do chặn). Circle bị xoá/khoá trước khi gửi → loại khỏi danh sách khả thi.
- **Acceptance criteria:**
  - [ ] Không tồn tại nút/hành động/endpoint "kết bạn" hay "gửi lời mời kết bạn" trong UI và API.
  - [ ] Lời mời luôn gắn với đúng một Circle đích; không gửi được lời mời "vào CIRCLE nói chung".
  - [ ] Server kiểm tra lại tại thời điểm gửi: quyền mời của người gửi, người nhận chưa là thành viên, chưa có lời mời pending trùng (người nhận + Circle), không có quan hệ chặn hai chiều.
  - [ ] Trùng lời mời pending không tạo bản ghi thứ hai.
  - [ ] Chấp nhận lời mời (ở PPL-04) là hành động duy nhất đưa người nhận thành thành viên — tính năng này không tạo quan hệ nào khác.
- **Platform:** Giống nhau (mobile có thêm入口 mời từ màn hình chia sẻ hệ thống vào một hồ sơ/Circle cụ thể nếu OS hỗ trợ deep link).
- **Scope:** Đã đăng ký §2.2

### PPL-04 — Hộp thư lời mời vào Circle đã nhận
- **Hành vi:** Màn hình liệt kê mọi lời mời vào Circle đang chờ xử lý của user: **ai mời** (hồ sơ rút gọn + ngữ cảnh "Cùng Circle X, Y" nếu có), **mời vào Circle nào** (tên, avatar, số thành viên, vài thành viên nổi bật mà user đã quen), **lời nhắn** của người mời, thời gian mời và **thời hạn còn lại**. Hai hành động chính: **Chấp nhận = trở thành thành viên Circle ngay lập tức**; **Từ chối** = lời mời đóng lại. Không có hành động "chấp nhận kết bạn trước rồi tính sau".
- **Luồng chính:** Mở hộp thư (từ tab thông báo/inbox) → xem danh sách lời mời pending → với mỗi lời mời: xem trước Circle (thông tin công khai của Circle + ngữ cảnh quan hệ) → Chấp nhận → thành viên ngay, điều hướng vào Circle, phát sự kiện cho Notification → hoặc Từ chối → lời mời chuyển trạng thái declined, người mời được biết qua PPL-05.
- **Trạng thái UI:** empty (không có lời mời nào — trạng thái yên tĩnh, không gợi ý nudge), loading, từng lời mời có trạng thái xử lý riêng (đang chấp nhận/từ chối), lời mời **hết hạn** hiển thị mờ kèm nhãn "Đã hết hạn" và không còn nút chấp nhận, error khi chấp nhận thất bại (Circle vừa đầy / Circle bị khoá / mình vừa bị chặn khỏi Circle đó).
- **Edge cases:** Chấp nhận lời mời vào Circle vừa đạt giới hạn thành viên → báo lỗi rõ ràng, lời mời giữ trạng thái pending hoặc chuyển expired theo rule ở playbook 03 (không "lọt" thành viên vượt trần). Circle có bật duyệt thành viên (playbook 03): chấp nhận lời mời trực tiếp vẫn vào thẳng (lời mời từ thành viên có quyền mời thay cho bước duyệt) — nếu rule của Circle khác đi, playbook 03 là nơi chốt và hành vi ở đây phải khớp. Người mời đã rời Circle/bị kick sau khi gửi → lời mời vẫn hợp lệ nếu Circle còn tồn tại và lời mời chưa hết hạn (quyền mời được xét tại thời điểm gửi), trừ khi Admin Circle thu hồi hàng loạt. User bị người mời chặn sau khi nhận lời mời → lời mời bị huỷ ngầm, biến mất khỏi hộp thư.
- **Acceptance criteria:**
  - [ ] Mỗi lời mời hiển thị đủ: người mời, Circle đích (tên + số thành viên), lời nhắn (nếu có), thời điểm mời, thời hạn.
  - [ ] Chấp nhận lời mời tạo Circle membership ngay trong cùng thao tác; **không tạo bất kỳ quan hệ "bạn bè" hay cuộc trò chuyện 1-1 nào**.
  - [ ] Lời mời hết hạn không chấp nhận được ở cả UI lẫn API (server kiểm tra hạn).
  - [ ] Từ chối không gửi thông báo đẩy (push) cho người mời — chỉ cập nhật trạng thái ở phía người mời (PPL-05), tránh biến từ chối thành tín hiệu xã hội gây áp lực.
  - [ ] Số lời mời pending hiển thị dạng badge tại điểm vào hộp thư, đồng bộ với Notification (playbook 08).
- **Platform:** Giống nhau; push notification của lời mời mở deep link thẳng tới đúng lời mời trong hộp thư trên mobile.
- **Scope:** Đã đăng ký §2.2

### PPL-05 — Lời mời đã gửi & quản lý trạng thái
- **Hành vi:** User xem được các lời mời vào Circle do mình đã gửi, xuyên các Circle, với trạng thái vòng đời đầy đủ: **pending** (đang chờ), **accepted** (đã vào Circle), **declined** (đã từ chối), **expired** (hết hạn chưa phản hồi). Với lời mời đang pending, user có thể **thu hồi** (người nhận không còn thấy lời mời nữa) và **gửi lại** (sau khi lời mời cũ hết hạn/bị từ chối — tạo lời mời mới, có áp dụng khoảng chờ chống spam theo rule chống lạm dụng ở playbook 03).
- **Luồng chính:** Mở "Lời mời đã gửi" (từ hồ sơ của mình hoặc từ màn hình quản lý của từng Circle) → lọc theo trạng thái/Circle → với lời mời pending: Thu hồi → xác nhận → trạng thái revoked, biến mất khỏi hộp thư người nhận → với lời mời expired/declined: Gửi lại → chọn lại Circle/lời nhắn → tạo lời mời mới.
- **Trạng thái UI:** loading, empty theo từng bộ lọc, trạng thái từng dòng cập nhật realtime hoặc khi tải lại (không yêu cầu user tự đoán người kia đã vào chưa — trạng thái accepted phải khớp membership thật), error khi thu hồi lời mời đã vừa được chấp nhận (race: chấp nhận thắng, thu hồi báo "đã được chấp nhận").
- **Edge cases:** Người nhận chấp nhận đúng lúc người gửi bấm thu hồi → server chốt theo thứ tự xử lý, chỉ một kết quả thắng và cả hai phía thấy trạng thái cuối nhất quán. Người gửi rời Circle sau khi gửi → lời mời đã gửi vẫn hiển thị trong lịch sử của mình nhưng không thu hồi được nữa nếu mình không còn quyền (theo rule playbook 03). Gửi lại nhiều lần cho cùng một người vào cùng một Circle → bị chặn bởi khoảng chờ/tối đa số lần gửi lại; người nhận có quyền chặn để dừng hẳn (PPL-08).
- **Acceptance criteria:**
  - [ ] Đủ 4 trạng thái pending / accepted / declined / expired được lưu và hiển thị; thu hồi ghi trạng thái riêng (revoked) ở phía người gửi và làm lời mời biến mất khỏi hộp thư người nhận.
  - [ ] Trạng thái accepted luôn đồng bộ với membership thật trong Circle (không có accepted "ảo" khi membership đã bị kick — khi đó hiển thị thêm ghi chú đã rời Circle).
  - [ ] Gửi lại bị giới hạn tần suất phía server; vượt giới hạn trả lỗi rõ ràng kèm thời gian chờ.
  - [ ] Thu hồi lời mời không phát thông báo cho người nhận.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### PPL-06 — Gợi ý người để mời vào một Circle cụ thể
- **Hành vi:** Khi user đang ở trong một Circle và muốn thêm người, hệ thống gợi ý danh sách ứng viên phù hợp **cho Circle đó**: ưu tiên người quen (PPL-02) có nhiều Circle chung với **các thành viên hiện tại của Circle đích** và có tương tác gần đây với nhóm thành viên đó. Mỗi gợi ý hiển thị lý do dạng ngữ cảnh: *"Cùng Circle X với 3 thành viên của nhóm này"*. Gợi ý chỉ là lối tắt chọn người cho PPL-03 — không phải tính năng "gợi ý kết bạn".
- **Luồng chính:** Mở màn hình thêm thành viên của Circle (playbook 03) → tab "Gợi ý" hiển thị danh sách đã xếp hạng kèm lý do → chọn người → đi vào luồng mời PPL-03 với Circle đích đã chọn sẵn.
- **Trạng thái UI:** loading, empty (chưa đủ dữ liệu quan hệ để gợi ý — fallback sang tìm kiếm PPL-01 và danh sách người quen đầy đủ PPL-02), từng gợi ý có nút bỏ qua (dismiss) để không hiện lại người đó cho Circle này trong phiên gợi ý hiện tại.
- **Edge cases:** Không gợi ý người đã là thành viên Circle đích, người đang có lời mời pending tới Circle đích, người bị chặn hai chiều với bất kỳ thành viên nào đang xem gợi ý, và người đã tắt xuất hiện trong gợi ý (PPL-07). Tín hiệu xếp hạng không được suy ra từ nội dung của Circle mà user xem gợi ý không thuộc về. Circle mới tạo (chỉ có 1 thành viên) → gợi ý suy biến thành danh sách người quen của chính user.
- **Acceptance criteria:**
  - [ ] Gợi ý luôn gắn với một Circle đích cụ thể và hiển thị lý do ngữ cảnh cho từng người.
  - [ ] Bộ lọc loại trừ (đã là thành viên / đang pending / chặn / tắt gợi ý) áp dụng ở server trước khi trả danh sách.
  - [ ] Xếp hạng dựa trên Circle chung với tập thành viên Circle đích + tương tác gần đây; có test cho trường hợp Circle chỉ có 1 thành viên.
  - [ ] Không có bề mặt nào của tính năng này dùng ngôn ngữ "kết bạn/gợi ý bạn bè".
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### PPL-07 — Quyền riêng tư tìm kiếm & gợi ý
- **Hành vi:** User kiểm soát được việc người khác tìm thấy và được gợi ý mình: **tìm qua số điện thoại** (bật/tắt), **tìm qua username** (bật/tắt — tắt thì chỉ tìm thấy qua tên hiển thị trong phạm vi Circle chung hoặc qua link mời), **xuất hiện trong gợi ý** "Người quen/Gợi ý mời" cho người không có Circle chung trực tiếp (bật/tắt). Mặc định an toàn: tìm qua SĐT bật nhưng chỉ khớp chính xác; mọi cài đặt thay đổi có hiệu lực ngay ở server.
- **Luồng chính:** Vào Cài đặt → Riêng tư → bật/tắt từng kênh → lưu → hệ thống áp dụng ngay cho các truy vấn tìm kiếm/gợi ý tiếp theo (không cần đăng nhập lại).
- **Trạng thái UI:** trạng thái từng công tắc kèm mô tả hệ quả bằng ngôn ngữ dễ hiểu ("Tắt: người khác không tìm thấy bạn bằng số điện thoại nữa"), xác nhận đã lưu, error khi lưu thất bại (giữ nguyên trạng thái cũ, không hiển thị trạng thái giả).
- **Edge cases:** Tắt tìm qua username không làm hỏng @mention và link hồ sơ nội bộ trong các Circle user đang tham gia (thành viên cùng Circle luôn thấy nhau trong phạm vi Circle đó). Tắt "xuất hiện trong gợi ý" không xoá user khỏi danh sách "Người quen" của người đã có Circle chung (quan hệ đó suy ra từ membership thật, không phải gợi ý). Thay đổi cài đặt không ảnh hưởng ngược các lời mời đã gửi/đã nhận.
- **Acceptance criteria:**
  - [ ] Có đủ 3 điều khiển độc lập: tìm qua SĐT, tìm qua username, xuất hiện trong gợi ý; mỗi cái thay đổi được độc lập.
  - [ ] Cài đặt được thực thi ở server trong truy vấn tìm kiếm (PPL-01) và gợi ý (PPL-06), kiểm chứng được bằng test với tài khoản đã tắt từng kênh.
  - [ ] Việc tắt các kênh tìm kiếm không phá vỡ hiển thị của user bên trong các Circle họ đang là thành viên.
  - [ ] Màn hình cài đặt mô tả hệ quả của từng lựa chọn ngay tại chỗ, không dùng thuật ngữ kỹ thuật.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### PPL-08 — Chặn (block) trong thế giới chỉ-có-nhóm
- **Hành vi:** User chặn một người khác với hệ quả được thiết kế cho mô hình group-only:
  - Hai bên **không mời được nhau vào bất kỳ Circle nào** (và lời mời pending giữa hai người bị huỷ hai chiều).
  - **Nội dung của người bị chặn** (tin nhắn trong chat nhóm, khoảnh khắc, bình luận...) **hiển thị dạng placeholder** ("Nội dung từ người bạn đã chặn") với user đã chặn, **kể cả khi hai người còn ở chung một Circle** — chặn không tự động loại ai ra khỏi Circle chung.
  - Khi chặn một người đang có Circle chung, UI **gợi ý** (không ép buộc) user xem xét rời các Circle chung đó, liệt kê rõ các Circle chung bị ảnh hưởng.
  - Việc chặn được **server enforce** ở mọi bề mặt (tìm kiếm, gợi ý, mời, hiển thị nội dung) và **người bị chặn không nhận được bất kỳ thông báo nào** về việc bị chặn.
- **Luồng chính:** Từ hồ sơ người kia / menu ngữ cảnh trên nội dung của họ → "Chặn người này" → màn hình xác nhận nêu rõ hệ quả (không mời được nhau, nội dung thành placeholder, gợi ý về Circle chung) → xác nhận → chặn có hiệu lực ngay. Bỏ chặn: từ danh sách đã chặn trong Cài đặt → Riêng tư → Bỏ chặn (sau khi bỏ chặn, hai người quay lại trạng thái suy ra từ Circle chung như bình thường; nội dung hiển thị lại đầy đủ).
- **Trạng thái UI:** xác nhận chặn (liệt kê số Circle chung bị ảnh hưởng), success, danh sách đã chặn (empty state khi chưa chặn ai), error khi thao tác thất bại (không hiển thị đã chặn nếu server chưa ghi nhận).
- **Edge cases:** Chặn Admin/Owner của một Circle mình đang tham gia → vẫn chặn được ở tầng hiển thị/mời, nhưng quyền quản trị của họ trong Circle đó không bị vô hiệu (placeholder chỉ áp dụng phía người chặn; việc họ kick mình vẫn theo rule playbook 03). Hai người chặn lẫn nhau → hệ quả hợp nhất, không lỗi. Chặn người đang có lời mời pending do mình gửi → lời mời bị thu hồi ngầm. Bỏ chặn không tự khôi phục các lời mời đã huỷ vì chặn.
- **Acceptance criteria:**
  - [ ] Sau khi chặn: hai bên không xuất hiện trong tìm kiếm/gợi ý của nhau và không tạo được lời mời cho nhau (server từ chối).
  - [ ] Mọi lời mời pending giữa hai bên (cả hai chiều) bị huỷ ngay khi chặn.
  - [ ] Nội dung của người bị chặn hiển thị placeholder phía người chặn trên mọi bề mặt (chat nhóm, khoảnh khắc, album, bình luận), kể cả trong Circle chung; phía người bị chặn và các thành viên khác vẫn thấy bình thường.
  - [ ] Màn hình xác nhận chặn liệt kê đúng các Circle chung hiện tại và đưa gợi ý rời Circle (không tự rời).
  - [ ] Người bị chặn không nhận được thông báo/sự kiện nào về việc bị chặn; các API liên quan trả lỗi trung tính, không lộ trạng thái chặn.
  - [ ] Bỏ chặn khôi phục tìm kiếm/mời/hiển thị theo quan hệ Circle chung hiện tại, không khôi phục lời mời đã huỷ.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### PPL-09 — Báo cáo người dùng (an toàn UGC)
- **Hành vi:** User báo cáo một người dùng khác khi gặp hành vi vi phạm (quấy rối qua lời mời/nội dung, spam, mạo danh, nội dung không phù hợp...). Báo cáo gồm: **lý do** (danh mục chọn sẵn + mô tả bổ sung tuỳ chọn), **ngữ cảnh đính kèm** (lời mời liên quan, và/hoặc nội dung cụ thể trong Circle chung mà user trỏ tới), và tuỳ chọn **chặn ngay sau khi báo cáo**. Báo cáo chảy vào **hàng đợi kiểm duyệt của Admin (ADM-04, playbook 09)** — module này chỉ spec phía người gửi báo cáo và trạng thái theo dõi tối thiểu ("đã tiếp nhận").
- **Luồng chính:** Từ hồ sơ người bị báo cáo / menu ngữ cảnh trên lời mời hoặc nội dung của họ → "Báo cáo" → chọn lý do → đính kèm ngữ cảnh (hệ thống tự gợi ý các ngữ cảnh khả thi: lời mời pending từ người này, nội dung trong Circle chung) → xem lại → gửi → nhận xác nhận đã tiếp nhận + gợi ý chặn (PPL-08) nếu chưa chặn.
- **Trạng thái UI:** loading khi gửi, success (đã tiếp nhận, giải thích bước tiếp theo do đội kiểm duyệt xử lý, không hứa thời hạn cụ thể), error khi gửi thất bại (giữ lại nội dung đã nhập để gửi lại), chống gửi trùng (báo cáo trùng người + ngữ cảnh trong thời gian ngắn được gộp).
- **Edge cases:** Báo cáo người không còn Circle chung nào → vẫn báo cáo được qua hồ sơ/lời mời lịch sử (ngữ cảnh đính kèm bị giới hạn ở những gì user còn truy cập được). Nội dung đính kèm bị xoá sau khi báo cáo → hàng đợi kiểm duyệt phải còn bản chụp ngữ cảnh tại thời điểm báo cáo (yêu cầu này ghi tại ADM-04). Báo cáo sai sự thật lặp lại → thuộc thẩm quyền xử lý của Admin, module này không tự hạn chế quyền báo cáo ở UI.
- **Acceptance criteria:**
  - [ ] Báo cáo bắt buộc có lý do thuộc danh mục; mô tả bổ sung là tuỳ chọn.
  - [ ] Báo cáo đính kèm được ít nhất một loại ngữ cảnh: lời mời liên quan hoặc nội dung trong Circle chung.
  - [ ] Báo cáo được tạo thành công sẽ xuất hiện trong hàng đợi kiểm duyệt ADM-04 với đầy đủ người báo cáo, người bị báo cáo, lý do, ngữ cảnh.
  - [ ] Sau khi gửi, user nhận xác nhận "đã tiếp nhận" và được gợi ý chặn; không hiển thị trạng thái xử lý chi tiết vượt quá thẩm quyền của người báo cáo.
  - [ ] Người bị báo cáo không biết ai đã báo cáo mình từ bất kỳ bề mặt nào của sản phẩm.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### PPL-S01 — Khám phá người quen qua danh bạ điện thoại
- **Hành vi:** Trên mobile, user có thể đối chiếu danh bạ để tìm người quen đã dùng CIRCLE và mời họ vào Circle: app xin quyền truy cập danh bạ với giải thích rõ mục đích, **chỉ gửi lên server bản băm (hash) của số điện thoại đã chuẩn hoá** để đối chiếu, **không tải lên và không lưu danh bạ thô** (không lưu tên/số của người chưa dùng CIRCLE). Kết quả khớp được đưa vào màn hình tìm/mời (PPL-01) với ngữ cảnh như bình thường; người trong danh bạ chưa dùng CIRCLE chỉ hiển thị ở mục riêng "Mời dùng CIRCLE" qua link mời chung (playbook 03) nếu user chủ động chọn — không tự động nhắn tin/gửi lời mời thay user.
- **Acceptance criteria:**
  - [ ] Quyền danh bạ được xin tại thời điểm user chủ động bấm vào tính năng, kèm màn hình giải thích trước khi hệ điều hành hiện hộp thoại quyền.
  - [ ] Server chỉ nhận và đối chiếu số đã băm; kiểm chứng được rằng không có số điện thoại thô hay tên danh bạ của người chưa đăng ký nào được lưu lại.
  - [ ] Từ chối quyền danh bạ không ảnh hưởng các cách tìm/mời khác.
  - [ ] Không tự động gửi bất kỳ tin nhắn/lời mời nào tới người trong danh bạ.

### PPL-S02 — Trạng thái "đang chờ vào Circle" trong một inbox chung
- **Hành vi:** Mọi thứ đang chờ liên quan tới việc vào Circle được gom vào **một inbox chung** với Notification (playbook 08): lời mời vào Circle đang chờ mình xử lý (PPL-04), lời mời mình gửi đang chờ người khác (PPL-05), và yêu cầu xin vào Circle đang chờ duyệt nếu mình là Admin của Circle đó (hàng đợi duyệt thuộc playbook 03 — tại đây chỉ hiển thị dạng mục chờ + deep link sang màn hình xử lý của Circle). Mỗi loại có badge đếm riêng và một badge tổng tại điểm vào.
- **Acceptance criteria:**
  - [ ] Inbox hiển thị đủ 3 loại mục chờ với deep link đúng màn hình xử lý của từng loại.
  - [ ] Badge tổng bằng tổng các mục đang chờ thật (đồng bộ khi một mục được xử lý ở bất kỳ bề mặt nào).
  - [ ] Xử lý một mục chờ ở màn hình gốc (hộp thư lời mời / quản lý Circle) sẽ làm mục đó biến mất khỏi inbox mà không cần thao tác trùng.

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### PPL-W01 — QR mời vào Circle khi gặp trực tiếp
Khi gặp nhau ngoài đời, user mở mã QR cá nhân gắn sẵn một Circle đích (hoặc chọn nhanh Circle ngay trên màn hình QR); người kia quét bằng camera trong app là nhận được lời mời vào Circle đó ngay (hoặc vào thẳng nếu Circle cho phép theo rule playbook 03). Giá trị cho user: chuyển khoảnh khắc gặp gỡ thật thành thành viên nhóm trong vài giây, không cần đọc username/SĐT cho nhau — đúng tinh thần nhóm bắt đầu từ đời thật.
- **Effort:** S

### PPL-W02 — Gợi ý lập Circle mới từ nhóm người hay tương tác chung
Hệ thống nhận diện một cụm người thường xuyên tương tác cùng nhau trong các Circle hiện có (cùng react, cùng tham gia plan, hay xuất hiện chung) nhưng chưa có Circle riêng, và gợi ý riêng cho user: *"Bạn, A và B hay hoạt động cùng nhau — tạo Circle riêng cho nhóm này?"* kèm nút tạo Circle với danh sách thành viên đã chọn sẵn (luồng tạo ở playbook 03). Giá trị cho user: hệ thống chủ động giúp hình thành nhóm mới từ hành vi thật thay vì bắt user tự nhớ và tự gom người — tính năng "sinh ra vì hoạt động nhóm" theo đúng nghĩa đen.
- **Effort:** M

### PPL-W03 — Kỷ niệm "ngày này năm trước: bạn và X cùng vào Circle Y"
Vào ngày kỷ niệm, hệ thống nhắc lại mốc hai người cùng trở thành thành viên của một Circle (hoặc ngày Circle đó được tạo với cả hai cùng tham gia) dưới dạng thẻ kỷ niệm trong Circle đó, kèm gợi ý mở lại khoảnh khắc/ảnh cũ của nhóm. Giá trị cho user: biến "ngày quen nhau qua nhóm" — thứ duy nhất thay thế được "kỷ niệm kết bạn" trong mô hình không-bạn-bè — thành khoảnh khắc cảm xúc giữ chân nhóm.
- **Effort:** S

## 5. Business rules & invariants

- **Không tồn tại quan hệ bạn bè hai chiều độc lập trong hệ thống:** không có entity/bảng/cờ "friend/friendship", không có trạng thái quan hệ nào giữa hai user ngoài (a) Circle membership chung suy ra tại thời điểm truy vấn và (b) quan hệ chặn (block) do từng user tự đặt. Mọi tính năng cần "danh sách người quen" đều phải suy ra từ membership, cấm lưu snapshot quan hệ để dùng lâu dài.
- **Chấp nhận lời mời = gia nhập Circle, và chỉ có thế:** thao tác chấp nhận tạo đúng một thứ — Circle membership. Nó không tạo "tình bạn", không mở chat 1-1 (vốn không tồn tại), không cấp quyền xem nội dung ngoài Circle vừa tham gia.
- **Rời hết Circle chung = trở lại "người lạ":** khi hai user không còn Circle chung nào, họ biến mất khỏi danh sách người quen/gợi ý của nhau; chỉ còn tìm thấy nhau qua tìm kiếm công khai nếu cài đặt riêng tư (PPL-07) của người bị tìm cho phép. Không có cơ chế "giữ liên lạc" nào ngoài Circle.
- **Lời mời luôn thuộc về một Circle:** mọi lời mời phải có Circle đích, người mời có quyền mời tại thời điểm gửi, và tuân theo các rule vòng đời của Circle đó (thời hạn, giới hạn thành viên, thu hồi hàng loạt) ở playbook 03. Không tồn tại "lời mời kết nối chung chung".
- **Chặn thắng mọi quan hệ suy ra:** khi có block ở bất kỳ chiều nào, hai user bị loại khỏi tìm kiếm, gợi ý, người quen và khả năng mời của nhau, bất kể còn bao nhiêu Circle chung; hiển thị nội dung áp dụng placeholder phía người chặn.
- **Ngữ cảnh quan hệ không được lộ dữ liệu Circle ngoài phạm vi:** dòng "Cùng Circle X, Y" và lý do gợi ý chỉ được nhắc tới Circle mà **người đang xem** cũng là thành viên; không bao giờ dùng tên/thành viên của Circle lạ làm ngữ cảnh.
- **Số liệu xã hội trên hồ sơ không dùng khái niệm bạn bè:** hồ sơ không hiển thị "số bạn bè"; nếu hiển thị số liệu, chỉ dùng "số Circle chung" trong ngữ cảnh giữa hai người đang xem nhau.
- **Thông báo không tạo áp lực xã hội:** từ chối lời mời và việc bị chặn không phát push/tín hiệu hiển thị cho phía còn lại; chỉ trạng thái trung tính trong màn hình quản lý của chính họ.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `CircleInvitation` (vòng đời chi tiết do playbook 03 chốt; module này dùng chung): id, circleId, inviterId, inviteeId, message (nullable), status (pending / accepted / declined / expired / revoked), createdAt, expiresAt, respondedAt.
- `UserBlock`: id, blockerId, blockedId, createdAt. (Quan hệ một chiều; hiệu lực hai chiều suy ra khi kiểm tra cả hai chiều.)
- `UserReport`: id, reporterId, reportedUserId, reasonCategory, description (nullable), contextType (invitation / content / none), contextId (nullable), status (chuyển sang hàng đợi ADM-04 quản lý), createdAt.
- `PrivacySettings` (thuộc hồ sơ user, module 01 lưu trữ): findableByPhone (bool), findableByUsername (bool), appearInSuggestions (bool).
- **Cố ý KHÔNG có entity** `Friendship` / `FriendRequest`. "Người quen" và "Circle chung" là **truy vấn suy ra** trên `CircleMember` (module 03): tập user cùng Circle, đếm số Circle chung, sắp xếp — không vật hoá thành bảng quan hệ.

**Endpoint / event gợi ý:**
- `GET /people/search?q=&type=name|username|phone` (tìm người, tôn trọng PrivacySettings + block, có rate limit)
- `GET /people/known` (danh sách người quen suy ra, phân trang, kèm ngữ cảnh Circle chung)
- `GET /circles/:id/invite-suggestions` (gợi ý người cho một Circle — PPL-06)
- `POST /circles/:id/invitations` (gửi lời mời cho một người vào Circle — PPL-03; chi tiết rule ở playbook 03)
- `GET /me/invitations/received`, `GET /me/invitations/sent`
- `POST /me/invitations/:id/accept`, `POST /me/invitations/:id/decline`, `POST /me/invitations/:id/revoke`, `POST /me/invitations/:id/resend`
- `GET /me/privacy`, `PATCH /me/privacy` (PPL-07)
- `POST /me/blocks`, `DELETE /me/blocks/:userId`, `GET /me/blocks`
- `POST /users/:id/reports` (PPL-09)
- Event nội bộ: `invitation.sent`, `invitation.accepted`, `invitation.declined`, `invitation.expired`, `user.blocked` (cho các module khác ẩn nội dung), `user.reported` (cho hàng đợi ADM-04 và Notification tiêu thụ).

## 7. Cross-cutting riêng cho module (ngoài gate chung ở cross-cutting-gate.md)

- **Ngôn ngữ giao diện tuyệt đối tránh "bạn bè":** mọi nhãn, thông báo, empty state trong module dùng "người quen", "thành viên Circle", "cùng Circle" — không dùng "bạn", "kết bạn", "danh sách bạn" kể cả trong bản dịch; khi review i18n phải kiểm tra tiêu chí này như một lỗi nội dung.
- **Quyền riêng tư là mặc định vận hành, không phải lớp phủ:** mọi truy vấn tìm kiếm/gợi ý/người quen đều đi qua cùng một bộ kiểm tra (privacy settings + block + trạng thái tài khoản) ở tầng service dùng chung — cấm từng endpoint tự lọc riêng ở client.
- **Chống enumeration:** tìm kiếm theo SĐT chỉ khớp chính xác, có rate limit và không trả về gợi ý gần đúng; endpoint đối chiếu danh bạ (PPL-S01) có giới hạn số băm mỗi lần gọi và ghi log bất thường.
- **Nhất quán ngữ cảnh xuyên module:** định dạng hiển thị ngữ cảnh quan hệ ("Cùng Circle X, Y") được định nghĩa một nơi và dùng lại ở tìm kiếm, người quen, gợi ý, hộp thư lời mời và hồ sơ — không để mỗi màn hình tự chế một kiểu ghi khác nhau.
- **Deep link của thông báo lời mời** phải mở đúng lời mời trong hộp thư kể cả khi user chưa đăng nhập (sau đăng nhập điều hướng tiếp), và phải hiển thị trạng thái thật nếu lời mời đã hết hạn/bị thu hồi trong lúc user chưa mở.

## 8. Anti-patterns — những cách làm sai phổ biến phải tránh

- Lén tạo bảng `friendships`/`friend_requests` "cho tiện truy vấn" rồi suy ra ngược hành vi bạn bè vào sản phẩm — phá vỡ triết lý group-first và business rule số 1.
- Để sót nút/nhãn "Kết bạn", "Bạn bè", "Bạn chung" trong UI, thông báo, hoặc bản dịch — dấu hiệu scope Friend cũ chưa được diễn giải lại đến nơi.
- Chấp nhận lời mời mà tạo thêm quan hệ phụ (tự mở cuộc trò chuyện 1-1, tự theo dõi/follow) — CIRCLE không có các khái niệm này.
- Lưu danh sách "người quen" thành dữ liệu bền và quên cập nhật khi membership thay đổi (người đã rời hết Circle chung vẫn còn "quen").
- Tìm kiếm theo SĐT kiểu từng phần/gần đúng, hoặc trả kết quả không qua kiểm tra cài đặt riêng tư — mở đường quét dữ liệu cá nhân.
- Tải danh bạ thô lên server "để đối chiếu sau" trong tính năng khám phá danh bạ.
- Khi bị chặn vẫn để hai bên mời nhau/tìm thấy nhau ở một bề mặt quên kiểm tra block (vd chỉ chặn ở chat mà quên ở lời mời).
- Gửi push thông báo "X đã từ chối lời mời của bạn" hoặc để người bị chặn biết mình bị chặn qua thông báo lỗi lộ liễu.
- Gợi ý người cho Circle dựa trên dữ liệu của Circle mà người xem không thuộc về (lộ tên/thành viên Circle lạ qua dòng lý do gợi ý).
- Cho phép báo cáo nhưng không đính kèm ngữ cảnh và không nối vào hàng đợi kiểm duyệt — báo cáo rơi vào hố đen, user mất niềm tin vào an toàn.

## 9. Self-audit checklist cho agent

- [ ] PPL-01: Tìm người đủ 3 kênh (tên/username/SĐT khớp chính xác), kết quả hiển thị ngữ cảnh "Cùng Circle X, Y", không còn khái niệm "bạn chung".
- [ ] PPL-02: "Người quen" suy ra 100% từ Circle membership hiện tại (không có bảng friend), sắp xếp theo số Circle chung → tương tác gần đây, dùng được làm nguồn chọn người khi tạo/mời vào Circle.
- [ ] PPL-03: Chỉ có hành động "Mời vào Circle" gắn với một Circle đích cụ thể; không tồn tại "kết bạn" ở UI lẫn API; server chống trùng lời mời pending.
- [ ] PPL-04: Hộp thư lời mời đã nhận đủ thông tin (ai mời, Circle nào, lời nhắn, hạn); chấp nhận = thành viên Circle ngay và không tạo quan hệ phụ nào.
- [ ] PPL-05: Lời mời đã gửi có đủ trạng thái pending/accepted/declined/expired + thu hồi + gửi lại có giới hạn tần suất.
- [ ] PPL-06: Gợi ý người gắn với Circle đích, có lý do ngữ cảnh, đã loại trừ thành viên hiện tại/pending/block/opt-out ở server.
- [ ] PPL-07: Ba công tắc riêng tư (SĐT / username / gợi ý) thực thi ở server cho cả tìm kiếm và gợi ý, không phá hiển thị nội bộ Circle.
- [ ] PPL-08: Block huỷ lời mời pending hai chiều, chặn mời/tìm/gợi ý hai chiều, nội dung người bị chặn thành placeholder kể cả trong Circle chung, server enforce, không lộ cho người bị chặn.
- [ ] PPL-09: Báo cáo có lý do + ngữ cảnh đính kèm, chảy vào hàng đợi ADM-04, danh tính người báo cáo không lộ.

## Changelog

- 2026-10-25 — Tạo bản đầu dưới dạng playbook "Friend" (đồ thị bạn bè truyền thống: tìm kiếm, lời mời kết bạn, danh sách bạn bè).
- 2026-10-25 — Viết lại hoàn toàn theo triết lý group-first (chủ dự án chốt cùng ngày): xoá mô hình bạn bè độc lập, thay bằng "Người quen" suy ra từ Circle chung và lời mời thẳng vào Circle; file đổi tên thành `02-people-and-invitations.md`, prefix đổi FRD → PPL. PROJECT_GOD.md §2.2 cần amendment tương ứng (chưa thực hiện).
