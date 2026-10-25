# Playbook — Circle Collaboration

> Các tính năng cộng tác trong Circle (album, ghim, vị trí, plan/calendar, vote, nội dung ẩn danh) — đối chiếu PROJECT_GOD.md §2.2 mục "Circle collaboration". Notification được tách thành playbook riêng (`08-notification.md`), file này chỉ nhắc liên kết.

## 1. Tổng quan

- **Mục đích:** biến Circle từ nơi trò chuyện thành nơi cùng làm việc chung: lưu giữ kỷ niệm (album), làm nổi bật nội dung quan trọng (ghim), biết nhau đang ở đâu khi cần (vị trí), lên kế hoạch gặp gỡ (plan/calendar), ra quyết định chung (vote) và nói ra điều khó nói trực tiếp (nội dung ẩn danh).
- **Actors:** Member (thành viên Circle), Circle Admin/Owner (quản trị Circle — theo playbook Circle), System (hết hạn vị trí, nhắc sự kiện, đóng poll).
- **Quan hệ với module khác:**
  - **Circle (playbook Circle):** mọi tính năng trong file này đều bị scope theo một Circle cụ thể; quyền xem/thao tác kế thừa từ membership và role trong Circle. Người không phải thành viên Circle không truy cập được bất kỳ dữ liệu nào của module này.
  - **Realtime sharing (khoảnh khắc):** album lấy ảnh từ khoảnh khắc đã chia sẻ vào Circle; ghim áp dụng được cho khoảnh khắc.
  - **Chat:** ghim áp dụng được cho nội dung liên quan hội thoại Circle (nếu có); poll có thể được tạo và hiển thị trong luồng chat của Circle (nếu chat nhóm tồn tại) nhưng nguồn dữ liệu thuộc module này.
  - **Notification (`08-notification.md`):** sự kiện mới, RSVP thay đổi, poll mới/đóng, nhắc trước sự kiện, nội dung ẩn danh được duyệt — đều phát thông báo qua playbook Notification. File này chỉ định nghĩa *sự kiện nào* cần thông báo, không định nghĩa cơ chế gửi.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### COL-01 — Tạo album theo chủ đề trong Circle

- **Hành vi:** thành viên tạo album với tiêu đề chủ đề (vd "Đà Lạt 2026") để gom ảnh của Circle theo sự kiện/chủ đề thay vì trôi trong khoảnh khắc.
- **Luồng chính:** Mở Circle → tab Album → "Tạo album" → nhập tiêu đề (bắt buộc), mô tả (tuỳ chọn) → tạo → album rỗng xuất hiện trong danh sách album của Circle.
- **Trạng thái UI:** loading khi tạo; empty state của danh sách album (chưa có album nào → CTA tạo album đầu tiên); error khi tạo thất bại (giữ lại nội dung đã nhập để thử lại).
- **Edge cases:** tiêu đề rỗng hoặc chỉ gồm khoảng trắng → chặn submit; tiêu đề trùng album khác trong cùng Circle → cho phép nhưng cảnh báo nhẹ; mất mạng giữa chừng → không tạo album "ma" (idempotency key hoặc kiểm tra lại khi có mạng).
- **Acceptance criteria:**
  - [ ] Chỉ thành viên của Circle mới tạo và xem được album của Circle đó
  - [ ] Tiêu đề bắt buộc, giới hạn độ dài rõ ràng và validate cả client lẫn server
  - [ ] Album mới tạo thuộc đúng một Circle, không chia sẻ chéo sang Circle khác
  - [ ] Tạo thất bại không để lại bản ghi album rỗng trong DB
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-02 — Thêm ảnh vào album

- **Hành vi:** thêm ảnh vào album từ hai nguồn: chọn từ khoảnh khắc đã chia sẻ trong Circle, hoặc upload ảnh mới từ thiết bị/thư viện.
- **Luồng chính:** Mở album → "Thêm ảnh" → chọn nguồn → chọn một/nhiều ảnh → xác nhận → ảnh xuất hiện trong album kèm thông tin người thêm và thời gian.
- **Trạng thái UI:** loading/progress khi upload nhiều ảnh (hiển thị số ảnh đã xong/tổng số); trạng thái từng ảnh (đang tải / xong / lỗi → thử lại riêng ảnh đó); empty state khi album chưa có ảnh.
- **Edge cases:** ảnh upload lỗi một phần → các ảnh thành công vẫn được lưu, ảnh lỗi báo rõ và cho thử lại; ảnh từ khoảnh khắc bị tác giả xoá sau này → xử lý theo rule ở COL-03; chọn trùng ảnh đã có trong album → cảnh báo, không tạo bản sao; file không phải ảnh hoặc vượt giới hạn dung lượng/định dạng → từ chối kèm lý do.
- **Acceptance criteria:**
  - [ ] Thêm được ảnh từ cả hai nguồn: khoảnh khắc trong Circle và upload mới
  - [ ] Upload nhiều ảnh hiển thị tiến độ và xử lý lỗi theo từng ảnh, không fail toàn bộ
  - [ ] Mỗi ảnh trong album truy vết được: ai thêm, thêm lúc nào, nguồn từ đâu
  - [ ] Ảnh không thuộc Circle này (khoảnh khắc của Circle khác) không thêm được
- **Platform:** Mobile — dùng image picker của hệ điều hành, hỗ trợ chọn nhiều ảnh; Web — drag & drop cộng với chọn file.
- **Scope:** Đã đăng ký §2.2

### COL-03 — Quyền thêm/xoá ảnh và ảnh bìa album

- **Hành vi:** quy định rõ ai được thêm ảnh, ai được xoá ảnh, ai được đặt ảnh bìa — tránh tình trạng bất kỳ ai cũng xoá được ảnh của người khác.
- **Luồng chính:** Mặc định: mọi thành viên thêm được ảnh; người thêm xoá được ảnh của mình; Circle Admin (và người tạo album) xoá được mọi ảnh trong album; ảnh bìa do người tạo album hoặc Circle Admin đặt, chọn từ ảnh đang có trong album.
- **Trạng thái UI:** menu thao tác trên ảnh chỉ hiển thị hành động người dùng có quyền thực hiện (không hiển thị nút Xoá rồi mới báo lỗi quyền); confirm dialog khi xoá ảnh.
- **Edge cases:** ảnh bìa bị xoá → tự động chọn ảnh đầu tiên còn lại làm bìa, album rỗng thì bìa về mặc định; người thêm ảnh rời Circle → ảnh vẫn ở lại album, thao tác quản lý chuyển cho Circle Admin; ảnh gốc là khoảnh khắc bị tác giả xoá khỏi khoảnh khắc → bản trong album vẫn giữ (album là bản sao tham chiếu nội dung đã chia sẻ vào Circle), trừ khi Circle Admin gỡ.
- **Acceptance criteria:**
  - [ ] Ma trận quyền (thêm / xoá ảnh của mình / xoá ảnh người khác / đặt bìa) được enforce ở server, không chỉ ẩn nút ở client
  - [ ] Xoá ảnh luôn có bước xác nhận và ghi nhận ai xoá
  - [ ] Ảnh bìa luôn hợp lệ: trỏ tới một ảnh còn tồn tại trong album hoặc ảnh mặc định
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-04 — Xoá album

- **Hành vi:** người tạo album hoặc Circle Admin xoá toàn bộ album khỏi Circle.
- **Luồng chính:** Mở album → menu → "Xoá album" → confirm dialog nêu rõ số ảnh trong album và việc ảnh gốc (khoảnh khắc) không bị xoá → xác nhận → album biến mất khỏi danh sách.
- **Trạng thái UI:** confirm dialog bắt buộc; loading khi xoá; thông báo thành công/thất bại sau khi xoá.
- **Edge cases:** xoá album không được xoá ảnh gốc trong khoảnh khắc/upload gốc của người dùng — chỉ xoá liên kết album–ảnh và metadata album; thành viên đang xem album bị xoá → hiển thị trạng thái "album không còn tồn tại" thay vì lỗi trắng trang.
- **Acceptance criteria:**
  - [ ] Chỉ người tạo album hoặc Circle Admin xoá được album
  - [ ] Xoá album không xoá dữ liệu ảnh gốc ngoài album
  - [ ] Người dùng khác đang mở album nhận được trạng thái rõ ràng khi album bị xoá
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-05 — Ghim nội dung trong Circle

- **Hành vi:** ghim bài viết/khoảnh khắc/plan quan trọng lên khu vực ghim (pinned area) ở đầu trang Circle để mọi thành viên thấy ngay, thay vì trôi theo thời gian.
- **Luồng chính:** Mở nội dung → menu → "Ghim vào Circle" → nội dung xuất hiện trong khu vực ghim kèm người ghim và thời gian ghim → "Bỏ ghim" để gỡ khỏi khu vực ghim (nội dung gốc không bị xoá).
- **Trạng thái UI:** khu vực ghim hiển thị tối đa số ghim cho phép, có lối vào xem tất cả; empty state khi chưa có ghim nào (chỉ hiển thị gợi ý cho người có quyền ghim); badge/indicator trên nội dung gốc cho biết đang được ghim.
- **Edge cases:** ghim nội dung đã bị ghim → không tạo trùng; đạt giới hạn số lượng ghim → chặn và yêu cầu bỏ ghim cũ trước, thông báo rõ giới hạn; nội dung gốc bị xoá → ghim tự động bị gỡ; nội dung thuộc Circle khác → không ghim được.
- **Acceptance criteria:**
  - [ ] Giới hạn số lượng ghim mỗi Circle được định nghĩa bằng hằng số cấu hình (gợi ý: 5) và enforce ở server
  - [ ] Chỉ Circle Admin và người tạo nội dung được ghim/bỏ ghim (mặc định; ghi rõ nếu mở cho mọi thành viên)
  - [ ] Bỏ ghim không xoá nội dung gốc; xoá nội dung gốc tự động gỡ ghim
  - [ ] Khu vực ghim sắp xếp theo thời gian ghim mới nhất trước
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-06 — Chia sẻ vị trí một lần (điểm tĩnh)

- **Hành vi:** người dùng gửi một điểm vị trí cố định (toạ độ tại thời điểm gửi, kèm địa chỉ mô tả nếu có) vào Circle, dạng một thẻ vị trí mà thành viên bấm vào để mở bản đồ.
- **Luồng chính:** Trong Circle → "Chia sẻ vị trí" → chọn "Gửi vị trí hiện tại" → app lấy GPS, hiển thị preview bản đồ + độ chính xác → xác nhận gửi → thẻ vị trí xuất hiện cho thành viên Circle.
- **Trạng thái UI:** loading khi lấy GPS; permission state khi chưa cấp quyền vị trí (giải thích lý do cần quyền + nút mở cài đặt); error khi GPS không khả dụng/kém chính xác (cho phép chọn điểm thủ công trên bản đồ).
- **Edge cases:** người dùng từ chối quyền vị trí → vẫn cho chọn điểm thủ công trên bản đồ; điểm tĩnh không tự cập nhật theo di chuyển — ghi rõ thời điểm gửi trên thẻ; người nhận ở múi giờ khác vẫn thấy đúng thời điểm gửi.
- **Acceptance criteria:**
  - [ ] Chỉ thành viên Circle mới xem được điểm vị trí đã chia sẻ vào Circle đó
  - [ ] Thẻ vị trí hiển thị thời điểm gửi và mở được ứng dụng bản đồ để chỉ đường
  - [ ] Không có quyền GPS vẫn hoàn thành được luồng bằng chọn điểm thủ công
- **Platform:** Mobile — GPS hệ điều hành + quyền vị trí foreground; Web — Geolocation API của trình duyệt (độ chính xác thấp hơn, phải thông báo), chọn điểm thủ công là luồng dự phòng chính.
- **Scope:** Đã đăng ký §2.2

### COL-07 — Chia sẻ vị trí trực tiếp có thời hạn (live location)

- **Hành vi:** người dùng chia sẻ vị trí di chuyển theo thời gian thực cho Circle trong một khoảng thời gian do mình chọn — 15 phút, 1 giờ hoặc 8 giờ — và tắt bất cứ lúc nào trước khi hết hạn.
- **Luồng chính:** "Chia sẻ vị trí" → "Chia sẻ trực tiếp" → **màn hình cảnh báo riêng tư bắt buộc** (ai sẽ xem được: chỉ thành viên Circle này; xem trong bao lâu; cách tắt) → chọn thời hạn → xác nhận → phiên chia sẻ chạy, có indicator thường trực → tự dừng khi hết hạn hoặc người dùng bấm "Dừng chia sẻ".
- **Trạng thái UI:** indicator rõ ràng trong app suốt phiên (banner/thanh trạng thái "Đang chia sẻ vị trí với [Circle] — còn HH:MM"); trạng thái phiên trong Circle cho người xem (đang chia sẻ / đã kết thúc lúc...); permission state cho quyền vị trí nền (background location) nếu cần.
- **Edge cases:** hết hạn → server tự đóng phiên, client ngừng gửi kể cả khi app bị kill và mở lại sau đó; người dùng thu hồi quyền vị trí giữa phiên → kết thúc phiên và thông báo cho người chia sẻ; rời Circle giữa phiên → phiên tự kết thúc; pin yếu/mất mạng → giảm tần suất cập nhật, khi mất mạng kéo dài thì đánh dấu "vị trí cập nhật lần cuối lúc..." cho người xem thay vì hiển thị vị trí cũ như vị trí hiện tại.
- **Acceptance criteria:**
  - [ ] Không bắt đầu chia sẻ trực tiếp khi chưa qua màn hình cảnh báo riêng tư và chưa chọn thời hạn
  - [ ] Chỉ ba mốc thời hạn cố định (15 phút / 1 giờ / 8 giờ); không có tuỳ chọn "vô thời hạn"
  - [ ] Người dùng dừng được ngay lập tức bất cứ lúc nào; server tôn trọng lệnh dừng ngay cả khi client gửi thêm gói vị trí muộn
  - [ ] Phiên tự kết thúc đúng hạn ở phía server (không phụ thuộc client còn sống)
  - [ ] Chỉ thành viên Circle tại thời điểm xem mới xem được vị trí trực tiếp; thành viên đã rời Circle mất quyền xem ngay
- **Platform:** Mobile — cần quyền vị trí nền + thông báo foreground service (Android) / background mode (iOS) giải thích rõ cho người dùng; Web — chỉ hỗ trợ khi tab đang mở (Geolocation watch), phải ghi rõ giới hạn này, không hứa chia sẻ nền trên web.
- **Scope:** Đã đăng ký §2.2

### COL-08 — Tạo plan / sự kiện

- **Hành vi:** thành viên tạo plan/sự kiện của Circle gồm tiêu đề, thời gian bắt đầu, thời gian kết thúc, địa điểm, mô tả — làm đầu mối cho RSVP, lịch và nhắc.
- **Luồng chính:** Circle → tab Plan/Calendar → "Tạo sự kiện" → nhập tiêu đề (bắt buộc), bắt đầu/kết thúc (bắt buộc, kết thúc sau bắt đầu), địa điểm (văn bản, tuỳ chọn gắn điểm vị trí), mô tả → tạo → sự kiện xuất hiện trong danh sách sắp tới và lịch tháng; thành viên Circle nhận thông báo (theo `08-notification.md`).
- **Trạng thái UI:** loading khi tạo; error validate tại trường (thời gian kết thúc trước bắt đầu, thiếu tiêu đề); empty state danh sách sự kiện.
- **Edge cases:** sự kiện kéo dài qua ngày / sự kiện cả ngày → hỗ trợ cờ "cả ngày" và hiển thị đúng; múi giờ: lưu UTC, hiển thị theo múi giờ thiết bị của người xem; tạo sự kiện trong quá khứ → chặn hoặc cảnh báo rõ; trùng giờ với sự kiện khác của Circle → cho phép, hiển thị cảnh báo trùng lịch nhẹ.
- **Acceptance criteria:**
  - [ ] Validate thời gian kết thúc > thời gian bắt đầu ở cả client và server
  - [ ] Sự kiện luôn thuộc đúng một Circle; chỉ thành viên xem được
  - [ ] Mọi thời gian lưu dạng UTC và hiển thị đúng theo múi giờ người xem (có test case hai múi giờ khác nhau)
- **Platform:** Giống nhau; khác biệt chỉ ở date/time picker theo nền tảng.
- **Scope:** Đã đăng ký §2.2

### COL-09 — RSVP cho sự kiện

- **Hành vi:** mỗi thành viên phản hồi tham dự một trong ba trạng thái: Tham gia / Không tham gia / Chưa chắc; người tổ chức và thành viên xem được danh sách người theo từng trạng thái.
- **Luồng chính:** Mở sự kiện → chọn trạng thái RSVP → trạng thái cập nhật ngay, số lượng từng nhóm cập nhật realtime cho người đang xem → đổi trạng thái bất cứ lúc nào trước khi sự kiện bắt đầu (sau khi bắt đầu vẫn ghi nhận nhưng đánh dấu phản hồi muộn nếu cần).
- **Trạng thái UI:** trạng thái RSVP của chính người dùng được highlight rõ; danh sách RSVP phân nhóm (Tham gia n · Chưa chắc n · Không tham gia n), bấm vào xem danh sách người; loading skeleton khi tải danh sách.
- **Edge cases:** thành viên rời Circle → RSVP của họ bị loại khỏi danh sách và số đếm; sự kiện đã huỷ → khoá RSVP; người tạo sự kiện mặc định ở trạng thái Tham gia.
- **Acceptance criteria:**
  - [ ] Một người dùng có đúng một trạng thái RSVP tại một thời điểm cho mỗi sự kiện (upsert, không trùng bản ghi)
  - [ ] Số đếm RSVP khớp danh sách người ở mọi thời điểm, kể cả sau khi có người rời Circle
  - [ ] Thay đổi RSVP phản ánh realtime tới các client đang mở sự kiện
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-10 — Sửa / huỷ sự kiện và thông báo cho người đã RSVP

- **Hành vi:** người tạo sự kiện (hoặc Circle Admin) sửa thông tin hoặc huỷ sự kiện; mọi thay đổi quan trọng đều được thông báo cho những người đã RSVP, đặc biệt là người đang ở trạng thái Tham gia/Chưa chắc.
- **Luồng chính:** Mở sự kiện → "Sửa" → chỉnh sửa → lưu → hệ thống ghi nhận trường nào thay đổi (giờ, địa điểm) → gửi thông báo thay đổi cho người đã RSVP. Huỷ: "Huỷ sự kiện" → confirm → sự kiện chuyển trạng thái Đã huỷ (không xoá cứng) → thông báo huỷ cho toàn bộ người đã RSVP.
- **Trạng thái UI:** sự kiện đã huỷ hiển thị badge "Đã huỷ" và bị làm mờ trong lịch/danh sách, không biến mất không dấu vết cho người đã RSVP; form sửa hiển thị tóm tắt thay đổi trước khi lưu nếu đổi giờ/địa điểm.
- **Edge cases:** sửa sự kiện đã bắt đầu/đã kết thúc → chặn sửa giờ, chỉ cho sửa mô tả hoặc chặn hoàn toàn (chọn một rule và ghi rõ); huỷ sự kiện đã huỷ → idempotent, không gửi thông báo trùng; người tạo rời Circle → quyền sửa/huỷ chuyển cho Circle Admin.
- **Acceptance criteria:**
  - [ ] Thay đổi giờ bắt đầu hoặc địa điểm luôn kích hoạt thông báo tới người đã RSVP Tham gia/Chưa chắc
  - [ ] Huỷ sự kiện gửi đúng một thông báo huỷ cho mỗi người đã RSVP, không spam trùng
  - [ ] Sự kiện đã huỷ không còn phát nhắc trước sự kiện (liên kết COL-12) và khoá RSVP
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-11 — Xem lịch tháng và danh sách sự kiện sắp tới

- **Hành vi:** hai chế độ xem sự kiện của Circle: lịch tháng (thấy mật độ ngày có sự kiện) và danh sách sắp tới (upcoming list, cuộn theo thời gian) — dùng chung một nguồn dữ liệu.
- **Luồng chính:** Tab Calendar → mặc định danh sách sắp tới (sự kiện từ hôm nay trở đi, nhóm theo ngày) → chuyển sang lịch tháng → ngày có sự kiện có chấm đánh dấu → bấm ngày xem sự kiện trong ngày → bấm sự kiện mở chi tiết (COL-08/09).
- **Trạng thái UI:** empty state khi tháng/khoảng thời gian không có sự kiện (kèm CTA tạo sự kiện); loading khi chuyển tháng/tải dữ liệu; sự kiện đã huỷ hiển thị phân biệt trong cả hai chế độ xem.
- **Edge cases:** sự kiện kéo dài nhiều ngày → xuất hiện ở mọi ngày nó bao phủ trong lịch tháng; số lượng sự kiện trong một ngày lớn → lịch tháng chỉ báo số lượng, chi tiết ở danh sách ngày; đổi múi giờ thiết bị → ngày hiển thị của sự kiện cập nhật theo múi giờ mới.
- **Acceptance criteria:**
  - [ ] Lịch tháng và danh sách sắp tới không bao giờ mâu thuẫn dữ liệu (cùng query nguồn)
  - [ ] Sự kiện nhiều ngày hiển thị đúng ở tất cả các ngày liên quan
  - [ ] Danh sách sắp tới không hiển thị sự kiện đã kết thúc (trừ khi người dùng chủ động xem lịch sử)
- **Platform:** Mobile — ưu tiên danh sách sắp tới làm mặc định, lịch tháng dạng thu gọn; Web — lịch tháng đầy đủ làm mặc định được.
- **Scope:** Đã đăng ký §2.2

### COL-12 — Nhắc trước sự kiện theo RSVP

- **Hành vi:** hệ thống nhắc các thành viên đã RSVP Tham gia (và tuỳ chọn Chưa chắc) trước giờ bắt đầu sự kiện theo mốc nhắc đã định (gợi ý mặc định: trước 1 giờ và trước 1 ngày — cấu hình được), qua cơ chế của `08-notification.md`.
- **Luồng chính:** Scheduler quét sự kiện sắp bắt đầu → lọc người nhận theo trạng thái RSVP tại thời điểm quét → tạo thông báo nhắc kèm deep link tới chi tiết sự kiện.
- **Trạng thái UI:** không có UI riêng; người dùng thấy thông báo nhắc và (trong chi tiết sự kiện) dòng trạng thái "Bạn sẽ được nhắc trước sự kiện" nếu thuộc nhóm được nhắc.
- **Edge cases:** sự kiện bị huỷ hoặc đổi giờ sau khi đã lên lịch nhắc → nhắc cũ bị huỷ/tính lại theo giờ mới; người dùng đổi RSVP sang Không tham gia sau khi đã lên lịch → không nhận nhắc; sự kiện tạo sát giờ bắt đầu (nhỏ hơn mốc nhắc) → nhắc ngay một lần hoặc bỏ qua theo rule ghi rõ, không gửi nhắc sau khi sự kiện đã bắt đầu.
- **Acceptance criteria:**
  - [ ] Chỉ người RSVP Tham gia (và Chưa chắc nếu bật) nhận nhắc; người Không tham gia hoặc chưa phản hồi không nhận
  - [ ] Đổi giờ/huỷ sự kiện làm vô hiệu lịch nhắc cũ — không tồn tại nhắc trỏ tới giờ cũ
  - [ ] Mỗi mốc nhắc gửi tối đa một lần cho mỗi người dùng mỗi sự kiện
- **Platform:** Giống nhau (cơ chế gửi theo `08-notification.md`).
- **Scope:** Đã đăng ký §2.2

### COL-13 — Tạo poll (vote)

- **Hành vi:** thành viên tạo poll trong Circle gồm câu hỏi, 2–10 lựa chọn, chế độ chọn một hay chọn nhiều, hạn vote (deadline) và chế độ hiển thị danh tính người vote: công khai hay ẩn danh — phải chọn rõ lúc tạo và hiển thị rõ cho người vote trước khi họ vote.
- **Luồng chính:** Circle → "Tạo vote" → nhập câu hỏi → thêm 2–10 lựa chọn → chọn single-choice/multi-choice → chọn hạn vote → chọn chế độ ẩn danh/công khai → tạo → poll hiển thị cho thành viên Circle kèm thông báo (theo `08-notification.md`).
- **Trạng thái UI:** form validate theo trường (thiếu câu hỏi, ít hơn 2 lựa chọn, lựa chọn trùng nội dung, hạn vote ở quá khứ); badge trên poll ghi rõ "Ẩn danh" hoặc "Công khai" và "Chọn nhiều" nếu áp dụng; trạng thái poll: Đang mở / Đã đóng.
- **Edge cases:** hai lựa chọn trùng nội dung (sau khi trim) → chặn tạo; hạn vote trống → bắt buộc chọn hoặc mặc định rõ ràng (không có poll vô hạn ngầm định); người tạo không tự vote được vào poll của mình? — chọn một rule, gợi ý: được vote như thành viên thường, ghi rõ trong UI nếu khác.
- **Acceptance criteria:**
  - [ ] Số lựa chọn luôn trong khoảng 2–10, enforce ở server
  - [ ] Chế độ ẩn danh/công khai được lưu cùng poll, bất biến sau khi tạo, và hiển thị cho người vote trước khi vote
  - [ ] Poll hết hạn tự chuyển trạng thái Đã đóng ở phía server, không phụ thuộc client
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-14 — Vote, kết quả realtime và đóng poll

- **Hành vi:** thành viên vote theo đúng chế độ của poll (một/nhiều lựa chọn); kết quả (số vote và tỉ lệ từng lựa chọn) cập nhật realtime cho mọi người đang xem; người tạo hoặc Circle Admin đóng poll sớm trước hạn.
- **Luồng chính:** Mở poll → chọn lựa chọn theo chế độ → "Vote" → vote được ghi nhận, kết quả hiển thị ngay (trước khi vote chỉ hiển thị kết quả nếu poll cho phép xem trước — mặc định: thấy kết quả sau khi vote) → người tạo bấm "Đóng vote" → confirm → poll khoá, hiển thị kết quả cuối.
- **Trạng thái UI:** lựa chọn đã vote của người dùng được highlight; thanh tỉ lệ phần trăm cho từng lựa chọn; trạng thái đã đóng hiển thị badge và thời điểm đóng; loading khi gửi vote (chặn double-submit).
- **Edge cases:** đổi ý sau khi vote → mặc định KHÔNG cho đổi vote sau khi đã gửi (rule phải ghi rõ trên UI trước khi vote); double tap/double click → một người dùng chỉ tính một lượt vote (idempotency theo user + poll); vote đúng lúc poll vừa đóng/hết hạn → server quyết định theo timestamp, client hiển thị kết quả thật từ server; poll ẩn danh → kết quả chỉ có số tổng, không có cách nào truy ra ai chọn gì kể cả qua API.
- **Acceptance criteria:**
  - [ ] Một người dùng có tối đa một lượt vote hợp lệ cho mỗi poll; multi-choice vẫn là một lượt gồm nhiều lựa chọn
  - [ ] Tổng phần trăm kết quả luôn nhất quán với số vote thô (không lệch do làm tròn hiển thị gây hiểu nhầm tổng khác tổng thật — hiển thị kèm số vote tuyệt đối)
  - [ ] Poll đã đóng từ chối mọi vote mới ở phía server
  - [ ] Poll ẩn danh: không endpoint nào trả về mapping user → lựa chọn
- **Platform:** Giống nhau; cập nhật realtime qua cùng kênh realtime của hệ thống (WebSocket/SSE theo kiến trúc chung).
- **Scope:** Đã đăng ký §2.2

### COL-15 — Sửa / xoá poll có điều kiện

- **Hành vi:** bảo vệ tính công bằng của kết quả: poll chỉ sửa được khi chưa có ai vote; sau khi có vote đầu tiên, nội dung câu hỏi và lựa chọn bị khoá. Xoá poll do người tạo hoặc Circle Admin thực hiện.
- **Luồng chính:** Mở poll → "Sửa" → nếu chưa có vote: cho sửa câu hỏi/lựa chọn/hạn; nếu đã có vote: hiển thị lý do không sửa được → muốn thay đổi phải đóng poll cũ và tạo poll mới. Xoá: confirm dialog → poll biến mất khỏi Circle, hiển thị tombstone "Vote đã bị xoá" tại nơi từng nhúng poll (vd trong chat) thay vì lỗi.
- **Trạng thái UI:** nút Sửa bị vô hiệu kèm tooltip/lý do khi poll đã có vote; confirm dialog khi xoá nêu rõ kết quả vote sẽ không còn xem được.
- **Edge cases:** sửa hạn vote (gia hạn/rút ngắn) sau khi đã có vote → cho phép riêng trường hạn (không đổi nội dung), và phải ghi log thay đổi hiển thị trên poll ("Hạn vote đã được gia hạn"); race condition: vote đến đúng lúc đang sửa → server kiểm tra lại số vote tại thời điểm lưu, có vote thì từ chối lưu.
- **Acceptance criteria:**
  - [ ] Không thể sửa câu hỏi/lựa chọn của poll đã có ≥1 vote — enforce ở server, có test case race condition
  - [ ] Mọi thay đổi hạn vote được ghi lại và hiển thị minh bạch trên poll
  - [ ] Xoá poll để lại tombstone ở các nơi đã nhúng, không gây lỗi hiển thị
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-16 — Gửi "điều muốn nói" ẩn danh trong Circle

- **Hành vi:** thành viên gửi một nội dung văn bản vào không gian "Điều muốn nói" của Circle mà các thành viên khác (và giao diện phía người đọc) không thấy danh tính người gửi.
- **Luồng chính:** Circle → "Điều muốn nói" → soạn nội dung → màn hình xác nhận hiển thị **tuyên bố mức độ ẩn danh áp dụng cho sản phẩm** (xem COL-17) → gửi → nội dung vào trạng thái Chờ duyệt (nếu Circle bật kiểm duyệt trước) hoặc hiển thị ngay (nếu tắt) với nhãn "Ẩn danh" và thời gian gửi.
- **Trạng thái UI:** trạng thái của nội dung do mình gửi (chỉ mình thấy trong mục "Đã gửi của tôi": chờ duyệt / đã đăng / bị từ chối kèm lý do chung); empty state của không gian ẩn danh; thông báo rõ khi Circle đang bật chế độ duyệt trước.
- **Edge cases:** nội dung rỗng/quá dài → validate độ dài tối thiểu/tối đa rõ ràng; gửi liên tục → áp giới hạn tần suất ở COL-17; người gửi rời Circle sau khi gửi → nội dung đã đăng vẫn giữ nhãn ẩn danh, nội dung chờ duyệt bị huỷ theo rule của Circle.
- **Acceptance criteria:**
  - [ ] Không màn hình/API nào phía người đọc hiển thị danh tính, avatar, hay metadata gợi danh tính (thời gian chính xác tới giây, thứ tự gửi) của người gửi nội dung ẩn danh
  - [ ] Người gửi xem lại được trạng thái các nội dung của chính mình mà không làm lộ chúng với người khác
  - [ ] Trước khi gửi lần đầu trong mỗi Circle, người dùng bắt buộc thấy và xác nhận tuyên bố mức độ ẩn danh
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### COL-17 — Chống lạm dụng và kiểm duyệt nội dung ẩn danh

- **Hành vi:** bộ rule bắt buộc để tính năng ẩn danh không trở thành kênh quấy rối: giới hạn tần suất gửi, báo cáo nội dung ẩn danh, quy trình kiểm duyệt có người chịu trách nhiệm, và tuyên bố trung thực về mức độ ẩn danh.
- **Luồng chính:** (a) Tần suất: mỗi thành viên bị giới hạn số nội dung ẩn danh trong một khoảng thời gian cho mỗi Circle (hằng số cấu hình, gợi ý: tối đa 3 nội dung/ngày/Circle) — vượt giới hạn bị chặn kèm thời gian được gửi lại. (b) Báo cáo: người đọc bấm "Báo cáo" trên nội dung ẩn danh → chọn lý do → báo cáo vào hàng đợi kiểm duyệt của Circle Admin (và Admin hệ thống theo `09-admin-moderation.md`). (c) Kiểm duyệt: Circle Admin xem hàng đợi → gỡ nội dung / giữ nguyên / (nếu Circle bật duyệt trước) duyệt hoặc từ chối nội dung đang chờ.
- **Trạng thái UI:** thông báo chặn tần suất hiển thị thời gian chờ cụ thể; trạng thái báo cáo của người báo cáo (đã tiếp nhận); hàng đợi kiểm duyệt của Circle Admin hiển thị nội dung, lý do báo cáo, số lần báo cáo — **không hiển thị danh tính người gửi cho Circle Admin trong luồng xử lý thông thường**.
- **Edge cases:** **Mức độ ẩn danh phải được tuyên bố rõ trong sản phẩm, không hứa quá sự thật.** Rule bắt buộc: Circle Admin KHÔNG xem được danh tính người gửi qua giao diện. Danh tính chỉ được hệ thống lưu phục vụ an toàn (chống lạm dụng nghiêm trọng) và chỉ Admin hệ thống mới truy xuất được khi có báo cáo vi phạm nghiêm trọng, theo quy trình ở `09-admin-moderation.md`, có ghi audit log. Tuyên bố hiển thị cho người dùng phải phản ánh đúng điều này ("Ẩn danh với các thành viên và quản trị Circle; hệ thống có thể truy vết trong trường hợp vi phạm nghiêm trọng theo điều khoản sử dụng"). Nội dung bị báo cáo nhiều lần trong thời gian ngắn → tự tạm ẩn chờ kiểm duyệt (ngưỡng cấu hình được). Người gửi bị xử lý nhiều lần → Circle Admin được đề xuất hạn chế quyền dùng tính năng ẩn danh của thành viên đó (hành động này do Admin hệ thống thực thi nếu cần biết danh tính, hoặc thực thi theo cơ chế hạn chế không cần lộ danh tính — chọn một cơ chế và ghi rõ).
- **Acceptance criteria:**
  - [ ] Giới hạn tần suất gửi ẩn danh enforce ở server theo từng người dùng + từng Circle
  - [ ] Mọi nội dung ẩn danh đều báo cáo được; báo cáo luôn tới được hàng đợi có người xử lý (Circle Admin và/hoặc Admin hệ thống)
  - [ ] Giao diện Circle Admin không có đường nào xem danh tính người gửi ẩn danh (kiểm chứng bằng test quyền truy cập API)
  - [ ] Tuyên bố mức độ ẩn danh hiển thị trong sản phẩm khớp đúng hành vi kỹ thuật thật (đã đối chiếu với cách lưu trữ dữ liệu)
  - [ ] Nội dung đạt ngưỡng báo cáo tự tạm ẩn và xuất hiện trong hàng đợi kiểm duyệt
  - [ ] Chế độ duyệt trước (pre-moderation) bật/tắt được theo Circle; khi bật, nội dung chỉ hiển thị sau khi được duyệt
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

## 3. Tính năng SHOULD

### COL-S01 — Mẫu plan có sẵn (template)

- **Hành vi:** khi tạo sự kiện, người dùng chọn mẫu có sẵn (Sinh nhật, Họp nhóm, Đi chơi, Học nhóm...) để điền sẵn tiêu đề gợi ý, thời lượng mặc định và checklist vật dụng/việc cần chuẩn bị trong mô tả.
- **Acceptance criteria:**
  - [ ] Chọn mẫu điền sẵn form tạo sự kiện, người dùng sửa được mọi trường trước khi lưu
  - [ ] Tạo sự kiện không dùng mẫu vẫn hoạt động bình thường

### COL-S02 — Xuất sự kiện ra lịch ngoài (.ics)

- **Hành vi:** từ chi tiết sự kiện, người dùng tải file `.ics` hoặc bấm "Thêm vào Google Calendar" để đưa sự kiện (đã RSVP Tham gia) vào lịch cá nhân ngoài app.
- **Acceptance criteria:**
  - [ ] File `.ics` sinh đúng chuẩn (tiêu đề, giờ bắt đầu/kết thúc theo UTC, địa điểm, mô tả) và import thành công vào Google Calendar/Apple Calendar
  - [ ] Sự kiện bị huỷ hoặc đổi giờ: file xuất lại phản ánh trạng thái mới (ghi rõ giới hạn: lịch ngoài đã import không tự cập nhật)

### COL-S03 — Gợi ý địa điểm từ vị trí đã chia sẻ

- **Hành vi:** khi tạo sự kiện và chọn địa điểm, hệ thống gợi ý các điểm vị trí từng được chia sẻ trong Circle (điểm tĩnh COL-06) và điểm trung tâm tương đối giữa các thành viên đang chia sẻ vị trí trực tiếp (nếu có và mọi người liên quan đang bật chia sẻ), để nhóm chọn điểm hẹn thuận tiện.
- **Acceptance criteria:**
  - [ ] Gợi ý chỉ dùng dữ liệu vị trí trong chính Circle đó, không lộ vị trí cho người ngoài Circle
  - [ ] Không có dữ liệu vị trí nào khả dụng thì tính năng ẩn đi, không hiển thị gợi ý rỗng gây khó hiểu

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### COL-W01 — Circle Recap cuối tháng

Tự động tổng kết hoạt động của Circle mỗi cuối tháng thành một trang/câu chuyện xem lại được: số khoảnh khắc, album mới, sự kiện đã diễn ra, poll nổi bật, ảnh được ghim — trình bày dạng story cuộn đẹp để cả nhóm cùng xem lại và chia sẻ trong Circle. Giá trị: tạo khoảnh khắc gắn kết định kỳ, cho nhóm lý do quay lại app và nhìn lại kỷ niệm chung thay vì dữ liệu trôi mất.
**Effort: M**

### COL-W02 — Gợi ý plan bằng AI theo lịch rảnh chung

AI phân tích các khoảng thời gian mà nhiều thành viên Circle cùng trống (từ lịch sự kiện trong app và RSVP patterns) rồi đề xuất 2–3 gợi ý plan cụ thể (thời gian + loại hoạt động dựa trên lịch sử hoạt động của nhóm), người dùng chọn một gợi ý là tạo được nháp sự kiện ngay. Giá trị: giảm ma sát "bao giờ rảnh thì gặp" — vấn đề khó nhất của việc tổ chức hoạt động nhóm — và biến calendar từ nơi lưu trữ thành trợ lý chủ động.
**Effort: L**

### COL-W03 — Chuỗi kỷ niệm "ngày này năm trước" trong Circle

Vào ngày kỷ niệm (Circle tròn 1 tháng/1 năm, hoặc ngày này năm trước có khoảnh khắc/sự kiện nổi bật), hệ thống nhắc lại trong Circle kèm ảnh/sự kiện cũ và gợi ý tạo plan gặp lại. Giá trị: tạo cảm xúc và thói quen quay lại, tận dụng dữ liệu kỷ niệm sẵn có của nhóm mà không cần người dùng tự nhớ.
**Effort: S**

## 5. Business rules & invariants

- Mọi dữ liệu của module này đều thuộc đúng một Circle; không tồn tại album/poll/sự kiện/vị trí "không thuộc Circle nào" và không chia sẻ chéo giữa các Circle.
- Quyền truy cập suy ra từ membership tại thời điểm truy cập: rời Circle = mất quyền xem ngay lập tức với toàn bộ dữ liệu collaboration của Circle đó.
- Vị trí trực tiếp luôn có thời hạn; không tồn tại phiên chia sẻ vị trí vô thời hạn trong hệ thống.
- Poll đã có vote thì bất biến về câu hỏi và lựa chọn; poll ẩn danh bất biến về chế độ ẩn danh sau khi tạo.
- Một người dùng — một RSVP cho mỗi sự kiện; một người dùng — một lượt vote cho mỗi poll. Hai invariant này enforce bằng ràng buộc ở tầng dữ liệu, không chỉ logic ứng dụng.
- Sự kiện đã huỷ và poll đã đóng là trạng thái cuối (terminal) đối với tương tác mới: không RSVP mới, không vote mới, không nhắc mới.
- Nội dung ẩn danh: ẩn danh là thuộc tính hiển thị và truy cập, không phải xoá dữ liệu truy vết an toàn; mọi truy xuất danh tính vì lý do an toàn đều phải qua quy trình có audit log (xem `09-admin-moderation.md`).
- Xoá ở tầng người dùng nhìn thấy (album, poll, sự kiện) là xoá mềm hoặc để lại tombstone tại nơi đã nhúng; không xoá cứng dữ liệu còn liên quan báo cáo/kiểm duyệt đang mở.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `Album` (id, circleId, title, description, coverPhotoId, createdBy)
- `AlbumPhoto` (albumId, mediaId/momentId, addedBy, source: moment|upload)
- `Pin` (id, circleId, targetType: post|moment|event, targetId, pinnedBy)
- `LocationShare` (id, circleId, userId, type: static|live, lat, lng, label, expiresAt, status)
- `Event` (id, circleId, title, description, locationText, locationRef, startsAt, endsAt, allDay, status: active|cancelled, createdBy)
- `EventRsvp` (eventId, userId, status: yes|no|maybe) — unique (eventId, userId)
- `Poll` (id, circleId, question, mode: single|multi, anonymous: boolean, deadline, status: open|closed, createdBy)
- `PollOption` (pollId, text, order)
- `PollVote` (pollId, userId, optionIds[]) — unique (pollId, userId); với poll ẩn danh, tách bảng mapping user→đã vote khỏi bảng lựa chọn để không truy ngược được
- `AnonymousPost` (id, circleId, content, status: pending|published|rejected|hidden, createdAt) — định danh người gửi lưu tách riêng, mã hoá/hạn chế truy cập, không join vào API response thông thường
- `AnonymousReport` (postId, reporterId, reason, status)

**Endpoint / event gợi ý:**
- REST: `POST/GET /circles/:id/albums`, `POST /albums/:id/photos`, `DELETE /albums/:id`
- REST: `POST /circles/:id/pins`, `DELETE /pins/:id`, `GET /circles/:id/pins`
- REST: `POST /circles/:id/location-shares`, `PATCH /location-shares/:id/stop`, stream vị trí qua kênh realtime (event `location.updated`, `location.expired`)
- REST: `POST/GET /circles/:id/events`, `PATCH /events/:id`, `POST /events/:id/cancel`, `PUT /events/:id/rsvp`
- REST: `POST/GET /circles/:id/polls`, `POST /polls/:id/vote`, `POST /polls/:id/close`; event realtime `poll.updated` (kết quả), `poll.closed`
- REST: `POST /circles/:id/anonymous-posts`, `POST /anonymous-posts/:id/report`, `GET /circles/:id/anonymous-queue` (chỉ Circle Admin)
- Job nền: đóng poll hết hạn, kết thúc phiên vị trí hết hạn, gửi nhắc sự kiện (phát sự kiện sang module Notification)

## 7. Cross-cutting riêng cho module

(Ngoài gate chung ở `cross-cutting-gate.md`.)

- **Riêng tư vị trí là cross-cutting số một của module này:** mọi màn hình hiển thị vị trí phải luôn kèm ngữ cảnh "ai đang xem được" và thời điểm cập nhật; không màn hình nào hiển thị vị trí thành viên mà thiếu hai thông tin đó.
- **Realtime nhất quán:** kết quả poll, RSVP, vị trí trực tiếp đều là dữ liệu realtime — khi mất kết nối realtime, UI phải đánh dấu dữ liệu "có thể chưa mới nhất" thay vì hiển thị như dữ liệu tươi.
- **Múi giờ:** mọi hiển thị thời gian của sự kiện/nhắc/hạn vote theo múi giờ thiết bị người xem; hạn vote và hết hạn vị trí tính theo thời gian server, không theo đồng hồ client.
- **Nội dung ẩn danh và tìm kiếm/index:** nội dung ẩn danh không được đưa vào tính năng tìm kiếm kèm metadata người gửi, không xuất hiện trong thông báo dạng preview có tên người gửi.
- **Giới hạn cấu hình tập trung:** số ghim tối đa, giới hạn tần suất ẩn danh, ngưỡng tự ẩn khi bị báo cáo, mốc nhắc sự kiện — đều là hằng số cấu hình ở một nơi duy nhất, không hard-code rải rác.

## 8. Anti-patterns

- Cho chia sẻ vị trí trực tiếp không thời hạn hoặc mặc định bật — vi phạm nguyên tắc tối thiểu hoá dữ liệu vị trí.
- Ẩn nút "Xoá" ở client nhưng API vẫn cho xoá — quyền phải enforce ở server.
- Poll cho sửa lựa chọn sau khi đã có vote, hoặc cho xem ai vote gì trong poll gắn nhãn ẩn danh qua một endpoint phụ.
- Đếm RSVP/vote bằng biến đếm tăng giảm thủ công mà không có ràng buộc unique — sớm muộn cũng lệch số.
- Huỷ sự kiện bằng xoá cứng bản ghi — người đã RSVP mất dấu vết và nhắc cũ vẫn bắn.
- Hứa "ẩn danh tuyệt đối" trong UI trong khi hệ thống vẫn lưu userId liên kết trực tiếp và admin xem được — tuyên bố sản phẩm phải khớp kiến trúc thật.
- Gửi toạ độ vị trí chính xác vào push notification hoặc log hệ thống dạng plaintext không kiểm soát truy cập.
- Để job nhắc sự kiện chạy theo lịch cũ sau khi sự kiện đổi giờ — lịch nhắc phải suy ra từ dữ liệu sự kiện hiện tại, không lưu độc lập không đồng bộ.

## 9. Self-audit checklist cho agent

- [ ] COL-01..04: album đủ vòng đời tạo → thêm ảnh → phân quyền/bìa → xoá không ảnh hưởng ảnh gốc
- [ ] COL-05: ghim có giới hạn số lượng enforce ở server, bỏ ghim không xoá nội dung gốc
- [ ] COL-06..07: vị trí tĩnh và trực tiếp đều chỉ thành viên Circle xem được; live location bắt buộc qua cảnh báo riêng tư, có thời hạn cố định, dừng được ngay, tự hết hạn ở server
- [ ] COL-08..12: sự kiện đủ tạo → RSVP (unique một người một trạng thái) → sửa/huỷ có thông báo → hai chế độ xem nhất quán → nhắc đúng người theo RSVP và huỷ nhắc khi sự kiện đổi/huỷ
- [ ] COL-13..15: poll validate 2–10 lựa chọn, chế độ ẩn danh bất biến và hiển thị trước khi vote, một người một lượt vote, poll có vote không sửa được nội dung, kết quả realtime nhất quán
- [ ] COL-16..17: nội dung ẩn danh không lộ danh tính qua bất kỳ API/màn hình người đọc nào; có giới hạn tần suất, báo cáo, hàng đợi kiểm duyệt, chế độ duyệt trước, và tuyên bố mức độ ẩn danh khớp kiến trúc thật
- [ ] Mọi sự kiện cần thông báo đã được phát sang module Notification thay vì tự gửi push trong module này
- [ ] Không còn anti-pattern nào ở mục 8 xuất hiện trong phần implement

## Changelog

- 2026-10-25 — Tạo bản đầu.
