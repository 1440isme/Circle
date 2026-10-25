# Playbook — Realtime Sharing (Khoảnh khắc)

> Module chia sẻ khoảnh khắc bằng ảnh chụp tại thời điểm trong các Circle thân thiết (định vị kiểu Locket/BeReal) — đối chiếu PROJECT_GOD.md §2.2 mục "Realtime sharing": Chụp / chia sẻ hình ảnh realtime; Chọn Circle được xem; Xem và tương tác với khoảnh khắc.

## 1. Tổng quan

- **Mục đích:** tạo thói quen chia sẻ khoảnh khắc đời thường, ít áp lực hoàn hảo, giữa các Circle thân thiết — đây là tính năng "mồi" mở app hằng ngày của CIRCLE, khác với album/bài đăng đã chỉnh sửa kỹ ở các module khác.
- **Actors:** người chia sẻ (chụp và chọn audience), thành viên các Circle được chọn (xem, react, reply), hệ thống (nhắc nhẹ, gộp feed), moderator/chủ Circle (xử lý báo cáo về khoảnh khắc trong Circle của mình nếu được phân quyền).
- **Quan hệ với module khác:**
  - Phụ thuộc **Circle** để lấy danh sách Circle của user và thành viên từng Circle (audience).
  - Chuyển tiếp sang **Chat (CHT)**: trả lời một khoảnh khắc = mở phòng chat của Circle chứa khoảnh khắc đó với quote ảnh (xem MOM-06) — mọi thành viên Circle đều thấy, không có kênh trả lời riêng tư (đúng triết lý group-first: không chat 1-1).
  - Đẩy sự kiện sang **Notification**: có khoảnh khắc mới từ Circle thân thiết (tôn trọng cài đặt mute/nhắc).
  - Dùng cơ chế **block cấp tài khoản theo PPL-08 (playbook 02 — People & Invitations)** cho quyết định chặn người xem — block áp dụng xuyên module, không chỉ riêng khoảnh khắc.
- **Nguyên tắc sản phẩm bắt buộc:** khoảnh khắc là ảnh **chụp trong app tại thời điểm chia sẻ** (không chọn ảnh cũ từ thư viện ở luồng chính) — đây là điểm định vị của module; mọi nới lỏng phải là quyết định thiết kế được ghi lại, không tự ý thêm.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### MOM-01 — Chụp ảnh trong app bằng camera

- **Hành vi:** mở module là vào thẳng giao diện camera (hoặc một chạm từ màn hình chính). Chụp xong vào màn hình xem lại (review): giữ để gửi hoặc chụp lại (retake) không giới hạn số lần trước khi gửi. Hỗ trợ camera trước/sau và bật/tắt flash. Ảnh chưa gửi không rời khỏi thiết bị.
- **Luồng chính:** mở camera → chụp → review (retake nếu chưa ưng) → chuyển bước chọn audience (MOM-02) → gửi.
- **Trạng thái UI:** camera initializing, capturing, review, permission-denied (xem MOM-09), error khi camera bận/bị app khác chiếm (báo rõ + nút thử lại).
- **Edge cases:** chụp trong điều kiện thiếu sáng bằng camera trước (vẫn cho gửi, có flash màn hình nếu nền tảng hỗ trợ); user thoát giữa chừng từ màn review (hỏi xác nhận bỏ ảnh hoặc tự bỏ kèm thông báo — chọn một hành vi, áp dụng nhất quán); ảnh chụp bị xoay sai hướng (chuẩn hoá EXIF orientation trước upload).
- **Acceptance criteria:**
  - [ ] Luồng chính không có đường chọn ảnh từ thư viện (đúng định vị realtime)
  - [ ] Chụp lại được không giới hạn trước khi gửi, ảnh bỏ đi không bị upload ngầm
  - [ ] Đổi được camera trước/sau và flash ngay trong màn hình chụp
  - [ ] Ảnh hiển thị đúng chiều trên cả web và mobile sau khi gửi
- **Platform:** Mobile: camera native toàn màn hình. Web: getUserMedia trong trình duyệt (yêu cầu HTTPS), giao diện gọn trong trang — trải nghiệm có thể kém hơn mobile nhưng luồng bước phải giống hệt.
- **Scope:** Đã đăng ký §2.2

### MOM-02 — Chọn audience theo Circle trước khi gửi

- **Hành vi:** màn hình xác nhận trước khi gửi hiển thị danh sách Circle của user dạng chọn nhiều (multi-select), kèm số thành viên mỗi Circle. Mặc định chọn lại **lựa chọn gần nhất** của user. Phía trên nút Gửi phải có dòng tóm tắt ai sẽ thấy, dạng: "Sẽ chia sẻ tới: Gia đình (5), Hội bạn đại học (8)" — user xác nhận được audience **trước** khi ảnh rời thiết bị. Không cho gửi khi chưa chọn Circle nào.
- **Luồng chính:** sau review ảnh → màn hình audience (đã pre-select lựa chọn gần nhất) → chỉnh nếu cần → đọc dòng tóm tắt → Gửi.
- **Trạng thái UI:** no-selection (nút Gửi disabled + hint chọn ít nhất 1 Circle), loading khi danh sách Circle chưa tải xong (không cho gửi trong lúc chưa rõ audience), empty (user chưa thuộc Circle nào — hướng dẫn tạo/tham gia Circle, chặn gửi).
- **Edge cases:** Circle bị giải tán trong lúc đang ở màn hình chọn (làm mới danh sách, bỏ chọn Circle đó, báo nhẹ); user bị xoá khỏi một Circle đã chọn (tương tự, loại khỏi audience khi gửi — server kiểm tra lại tại thời điểm gửi); lựa chọn gần nhất chứa Circle user không còn thuộc (lọc bỏ trước khi hiển thị).
- **Acceptance criteria:**
  - [ ] Không thể gửi khi chưa chọn ít nhất một Circle
  - [ ] Dòng tóm tắt audience (tên Circle + số thành viên) hiển thị rõ trước nút Gửi
  - [ ] Lựa chọn lần gửi trước được nhớ và pre-select cho lần sau
  - [ ] Server kiểm tra lại tư cách thành viên tại thời điểm gửi, không tin audience từ client
- **Platform:** Giống nhau
- **Scope:** Đã đăng ký §2.2

### MOM-03 — Gửi khoảnh khắc & trạng thái upload

- **Hành vi:** gửi = upload ảnh + tạo bản ghi khoảnh khắc gắn với các Circle đã chọn. Trong lúc upload, khoảnh khắc xuất hiện trong feed của chính người gửi ở trạng thái "Đang gửi…" kèm tiến trình; thành công thì chuyển trạng thái bình thường. Quá trình upload dùng pipeline media chung với Chat (CHT-08).
- **Luồng chính:** bấm Gửi → khoảnh khắc vào feed của mình (optimistic, trạng thái sending) → upload xong → server xác nhận → thành viên các Circle đích nhận được qua realtime/push.
- **Trạng thái UI:** sending (progress), failed (xem MOM-08), sent.
- **Edge cases:** user gửi rồi tắt app ngay (upload nền tiếp tục hoặc đánh dấu failed rõ khi mở lại — không treo trạng thái sending); gửi hai khoảnh khắc liên tiếp nhanh (xếp hàng upload, cả hai đều phải tới đích đúng audience của mình).
- **Acceptance criteria:**
  - [ ] Khoảnh khắc gửi đi chỉ hiển thị với thành viên các Circle đã chọn (kiểm chứng bằng tài khoản ngoài audience)
  - [ ] Người gửi luôn thấy trạng thái thật của lần gửi (sending/sent/failed)
  - [ ] Audience của mỗi khoảnh khắc lưu kèm bản ghi, không suy ra động theo thành viên hiện tại của Circle khi hiển thị lịch sử (xem BR-MOM-02)
- **Platform:** Mobile: hỗ trợ upload nền. Web: rời trang giữa chừng = huỷ upload kèm cảnh báo. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2

### MOM-04 — Feed khoảnh khắc theo Circle

- **Hành vi:** feed hiển thị khoảnh khắc mới nhất trước, lọc được theo Circle (tab/chip từng Circle + "Tất cả"). Mỗi item: ảnh, người gửi, **thời gian đăng** (tương đối: "5 phút trước"; chạm xem giờ tuyệt đối), Circle đích (khi xem ở chế độ Tất cả). Feed tôn trọng block list hai chiều (MOM-10) và chỉ chứa khoảnh khắc thuộc các Circle user đang là thành viên.
- **Luồng chính:** mở tab Khoảnh khắc → feed tải trang đầu → cuộn phân trang → chọn chip Circle để lọc.
- **Trạng thái UI:** loading (skeleton ảnh), empty theo bộ lọc (chưa có khoảnh khắc — hiển thị lời mời chia sẻ khoảnh khắc đầu tiên), empty cấp tài khoản khi user chưa có Circle nào (hướng dẫn tạo/tham gia), error (thử lại), offline (xem bản cache gần nhất + banner).
- **Edge cases:** khoảnh khắc bị tác giả xoá trong lúc đang xem feed (item biến mất khi làm mới, không lỗi); ảnh tải chậm (placeholder theo tỉ lệ khung hình cố định, tránh nhảy layout); thời gian thiết bị lệch (hiển thị theo timestamp server).
- **Acceptance criteria:**
  - [ ] Feed chỉ chứa khoảnh khắc từ các Circle user là thành viên và không thuộc quan hệ block
  - [ ] Lọc theo Circle cho kết quả đúng và giữ được khi phân trang
  - [ ] Mỗi item hiển thị rõ người gửi và thời gian đăng
  - [ ] Trạng thái empty theo từng bộ lọc có nội dung hướng dẫn khác nhau, không dùng chung một màn hình trống trơn
- **Platform:** Giống nhau
- **Scope:** Đã đăng ký §2.2

### MOM-05 — Reaction nhanh trên khoảnh khắc

- **Hành vi:** react bằng bộ emoji chuẩn dùng chung với Chat (lấy từ cùng config), thao tác một chạm từ feed (nút reaction nổi trên ảnh) hoặc chạm hai lần vào ảnh (double-tap) để react emoji mặc định. Người gửi thấy tổng hợp reaction trên khoảnh khắc của mình và danh sách người react.
- **Luồng chính:** xem feed → chạm reaction → chọn emoji (hoặc double-tap) → cập nhật ngay (optimistic) → người gửi nhận thông báo tổng hợp (không push từng reaction riêng lẻ gây spam).
- **Trạng thái UI:** reacted (emoji của mình được đánh dấu), reactor list (sheet khi chạm vào cụm reaction trên khoảnh khắc của mình).
- **Edge cases:** gỡ reaction bằng cách chọn lại cùng emoji (đồng nhất hành vi với Chat CHT-13); react vào khoảnh khắc vừa bị tác giả xoá (bỏ qua im lặng, feed làm mới); reaction khi offline (xếp hàng đồng bộ, hiển thị trạng thái chưa đồng bộ nếu thất bại cuối cùng).
- **Acceptance criteria:**
  - [ ] Bộ emoji và hành vi toggle giống hệt Chat, lấy từ một config chung
  - [ ] Người gửi xem được ai đã react emoji nào vào khoảnh khắc của mình
  - [ ] Thông báo reaction cho người gửi được gộp, không đẩy push cho từng lượt react
- **Platform:** Mobile: double-tap react nhanh. Web: hover hiện nút reaction. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2 ("Xem và tương tác với khoảnh khắc")

### MOM-06 — Trả lời khoảnh khắc trong phòng chat của Circle (quote)

- **Hành vi:** từ một khoảnh khắc, user trả lời ngay trong Circle chứa nó: chạm Trả lời → mở **phòng chat của Circle đó** (theo playbook 05) với quote là ảnh khoảnh khắc gắn sẵn trong ô soạn; gửi đi thì tin nhắn quote xuất hiện trong phòng chat cho **mọi thành viên Circle cùng thấy**. Không tồn tại kênh trả lời riêng tư/1-1 cho khoảnh khắc — CIRCLE không có chat riêng (triết lý group-first). Nếu khoảnh khắc thuộc nhiều Circle mà user là thành viên, user chọn Circle đích để trả lời (mặc định là Circle đang xem khi mở khoảnh khắc).
- **Luồng chính:** xem khoảnh khắc → nút Trả lời → (chọn Circle đích nếu khoảnh khắc thuộc nhiều Circle của user) → phòng chat Circle mở ra với quote ảnh trong ô soạn → soạn và gửi → tin nhắn quote nằm trong luồng chat của Circle.
- **Trạng thái UI:** quote-attached (ô soạn hiển thị thumbnail khoảnh khắc kèm nút bỏ quote), circle-picker (khi khoảnh khắc thuộc >1 Circle của user), sent (tin nhắn quote hiển thị trong phòng chat).
- **Edge cases:** khoảnh khắc bị tác giả xoá sau khi đã có trả lời (quote trong phòng chat hiển thị "Khoảnh khắc không còn khả dụng", không vỡ layout); trả lời khoảnh khắc của chính mình (không hiển thị nút Trả lời — muốn bình luận thì vào thẳng phòng chat); user đã rời Circle chứa khoảnh khắc (không còn quyền xem/trả lời, theo BR-MOM-02); quan hệ block với tác giả (khoảnh khắc đã bị ẩn theo MOM-10 nên không phát sinh trả lời).
- **Acceptance criteria:**
  - [ ] Trả lời luôn đi vào phòng chat của Circle chứa khoảnh khắc và hiển thị cho mọi thành viên Circle — không tồn tại luồng trả lời 1-1/riêng tư
  - [ ] Tin nhắn trả lời trong phòng chat hiển thị thumbnail khoảnh khắc gốc dạng quote
  - [ ] Khoảnh khắc thuộc nhiều Circle: user chọn được Circle đích, mặc định đúng Circle đang xem
  - [ ] Khoảnh khắc bị xoá không làm hỏng hiển thị tin trả lời cũ trong phòng chat
- **Platform:** Giống nhau
- **Scope:** Đã đăng ký §2.2 ("Xem và tương tác với khoảnh khắc")

### MOM-07 — Lịch sử khoảnh khắc của bản thân

- **Hành vi:** mỗi user xem lại được toàn bộ khoảnh khắc mình đã gửi: lưới ảnh theo thời gian (nhóm theo ngày/tháng), chạm xem chi tiết kèm Circle đích, thời gian, reaction đã nhận. Có thao tác xoá từng khoảnh khắc (MOM-12). Lịch sử chỉ chủ sở hữu xem được toàn bộ; người khác chỉ thấy qua feed theo audience từng khoảnh khắc.
- **Luồng chính:** profile → Khoảnh khắc của tôi → lưới theo thời gian → chạm xem chi tiết.
- **Trạng thái UI:** loading, empty (chưa từng chia sẻ — nút chụp ngay), phân trang khi cuộn.
- **Edge cases:** khoảnh khắc gửi tới Circle mà user sau đó đã rời (vẫn nằm trong lịch sử của chính user); dung lượng lịch sử lớn (phân trang + thumbnail nhẹ, không tải ảnh gốc vào lưới).
- **Acceptance criteria:**
  - [ ] Lịch sử hiển thị đầy đủ khoảnh khắc đã gửi, sắp xếp mới nhất trước, nhóm theo thời gian
  - [ ] Chi tiết từng khoảnh khắc hiển thị đúng audience gốc và reaction đã nhận
  - [ ] Người khác không truy cập được lịch sử này ngoài những gì feed cho phép
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### MOM-08 — Xử lý upload thất bại & thử lại

- **Hành vi:** upload thất bại (mất mạng, server lỗi tạm thời) → khoảnh khắc giữ ở trạng thái failed trong feed của người gửi, kèm nút **Thử lại** và nút **Xoá bản lỗi**. Ảnh gốc giữ local cho tới khi gửi thành công hoặc user chủ động xoá — không bắt chụp lại. Thử lại giữ nguyên audience đã chọn ban đầu (cho phép sửa audience trước khi thử lại).
- **Luồng chính:** upload lỗi → item failed xuất hiện → user bấm Thử lại → upload lại với cùng ảnh + audience.
- **Trạng thái UI:** failed (banner/icon cảnh báo trên item + hai hành động Thử lại / Xoá), retrying.
- **Edge cases:** lỗi không thể retry (ảnh bị server từ chối theo policy nội dung — báo lý do, chỉ còn hành động Xoá); bộ nhớ local đầy (báo rõ, không crash); bản failed tồn tại qua nhiều phiên app (vẫn hiển thị khi mở lại app kèm trạng thái).
- **Acceptance criteria:**
  - [ ] Upload thất bại không làm mất ảnh đã chụp
  - [ ] Thử lại gửi đúng audience đã chọn (hoặc audience user vừa sửa), không gửi nhầm sang Circle khác
  - [ ] Mở lại app vẫn thấy và xử lý được các bản gửi lỗi cũ
- **Platform:** Mobile: bản lỗi lưu trong storage bền vững của app. Web: bản lỗi chỉ sống trong phiên trang (giới hạn trình duyệt — phải thông báo cho user trước khi rời trang nếu còn bản chưa gửi).
- **Scope:** Đề xuất bổ sung

### MOM-09 — Quyền camera bị từ chối

- **Hành vi:** lần đầu vào module, xin quyền camera (và micro nếu sau này có video) theo chuẩn nền tảng. Nếu bị từ chối: hiển thị màn hình giải thích vì sao cần camera + nút mở Cài đặt hệ thống để cấp lại; không lặp lại việc xin quyền một cách spam; module không crash và các phần không cần camera (xem feed, lịch sử) vẫn dùng bình thường.
- **Luồng chính:** vào module → kiểm tra quyền → chưa có: giải thích ngắn → hộp thoại hệ thống → từ chối: màn hình permission với nút Mở cài đặt + nút Xem feed thay thế.
- **Trạng thái UI:** permission-explain, permission-denied (có lối thoát sang feed), granted.
- **Edge cases:** quyền bị thu hồi trong lúc app đang chạy (lần mở camera kế tiếp hiển thị lại màn hình permission); web: trình duyệt chặn camera vì không HTTPS hoặc user chặn theo site (hướng dẫn theo trình duyệt); thiết bị không có camera (hiển thị thông báo không hỗ trợ, module chuyển sang chế độ chỉ-xem).
- **Acceptance criteria:**
  - [ ] Bị từ chối quyền, app hiển thị màn hình hướng dẫn cấp lại quyền (deep link tới cài đặt), không vòng lặp xin quyền
  - [ ] Không có quyền camera vẫn xem được feed và lịch sử khoảnh khắc
  - [ ] Không có thao tác nào trong module crash vì thiếu quyền camera
- **Platform:** Mobile: quyền qua hệ điều hành, deep link mở app settings. Web: quyền theo site của trình duyệt, hướng dẫn bằng hình/chữ theo trình duyệt phổ biến. Còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### MOM-10 — Chặn người cụ thể xem khoảnh khắc (block/exclusion)

- **Hành vi:** user chặn (block) một người ở cấp tài khoản (từ profile người đó hoặc cài đặt) — hệ quả xuyên module: người bị chặn không thấy khoảnh khắc của user trong feed, không react/reply được, và ngược lại user cũng không thấy nội dung của họ. Quyết định thiết kế cho đồ án: **dùng cơ chế block cấp tài khoản theo PPL-08 (playbook 02 — People & Invitations), không xây cơ chế "ẩn theo từng khoảnh khắc" riêng** — nếu sau này cần ẩn mềm theo từng bài, ghi ADR riêng trước khi làm.
- **Luồng chính:** profile người cần chặn → Chặn → xác nhận (nêu rõ hệ quả) → feed hai phía lập tức loại nội dung của nhau.
- **Trạng thái UI:** confirming (liệt kê hệ quả), blocked state (người bị chặn biến mất khỏi feed/audience có thể chọn — không cần thông báo cho người bị chặn).
- **Edge cases:** hai người cùng thuộc một Circle (block vẫn thắng quan hệ Circle: không thấy khoảnh khắc của nhau dù chung Circle); bỏ chặn (nội dung lại hiển thị theo audience bình thường từ thời điểm bỏ chặn); tác giả đã gửi khoảnh khắc trước khi bị chặn (khoảnh khắc đó cũng bị ẩn khỏi phía người chặn — quyền riêng tư thắng tính nhất quán feed).
- **Acceptance criteria:**
  - [ ] Sau khi chặn, feed của cả hai phía không còn khoảnh khắc của đối phương, kể cả khoảnh khắc gửi trước thời điểm chặn
  - [ ] Người bị chặn không nhận bất kỳ thông báo nào về việc bị chặn
  - [ ] Bỏ chặn khôi phục hiển thị theo audience thông thường
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### MOM-11 — Báo cáo khoảnh khắc (report)

- **Hành vi:** bất kỳ người xem nào cũng báo cáo được khoảnh khắc vi phạm: chọn lý do (danh mục cấu hình: nội dung không phù hợp, quấy rối, spam, khác + ghi chú tuỳ chọn) → gửi về hàng đợi xử lý (admin/moderator theo phân quyền dự án). Sau khi báo cáo, khoảnh khắc tự ẩn khỏi feed của người báo cáo. Một user báo cáo trùng một khoảnh khắc chỉ tính một lần.
- **Luồng chính:** menu "…" trên khoảnh khắc → Báo cáo → chọn lý do → gửi → xác nhận đã nhận + khoảnh khắc biến mất khỏi feed của mình.
- **Trạng thái UI:** report form, submitting, reported (xác nhận), item ẩn phía người báo cáo.
- **Edge cases:** báo cáo khoảnh khắc của chính mình (không hiển thị tuỳ chọn); báo cáo khi offline (xếp hàng gửi khi có mạng, vẫn ẩn item phía mình ngay); lạm dụng report (rate limit phía server, xử lý ở tầng quản trị chứ không chặn UI cứng).
- **Acceptance criteria:**
  - [ ] Mọi khoảnh khắc của người khác đều có lối vào Báo cáo trong tối đa 2 thao tác
  - [ ] Báo cáo thành công thì khoảnh khắc ẩn khỏi feed của người báo cáo ngay
  - [ ] Báo cáo tới được hàng đợi xử lý kèm lý do, người báo cáo, thời gian
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### MOM-12 — Xoá khoảnh khắc của mình

- **Hành vi:** tác giả xoá được khoảnh khắc của mình bất kỳ lúc nào: khoảnh khắc biến mất khỏi feed mọi người, khỏi lịch sử hiển thị của người khác; phía tác giả, bản ghi chuyển trạng thái đã xoá (xử lý dữ liệu theo BR-MOM-04). Quote ảnh trong các tin trả lời ở phòng chat Circle hiển thị trạng thái không còn khả dụng (theo MOM-06).
- **Luồng chính:** lịch sử của tôi / menu trên khoảnh khắc → Xoá → xác nhận → biến mất mọi phía.
- **Trạng thái UI:** confirming, deleted.
- **Edge cases:** xoá trong lúc khoảnh khắc đang upload (huỷ upload + xoá); xoá khoảnh khắc đang có người mở xem (phía người xem nhận lỗi nhẹ khi tương tác tiếp, feed làm mới mất item).
- **Acceptance criteria:**
  - [ ] Sau khi xoá, không người xem nào còn thấy khoảnh khắc ở feed
  - [ ] Chỉ tác giả mới xoá được khoảnh khắc của mình (server kiểm tra lại quyền)
  - [ ] Tin trả lời trong phòng chat từng quote khoảnh khắc đã xoá vẫn đọc được phần text, phần ảnh hiển thị trạng thái không khả dụng
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### MOM-S01 — Caption ngắn cho khoảnh khắc

- **Hành vi:** thêm chú thích text ngắn (giới hạn ký tự đặt trong config) kèm khoảnh khắc, hiển thị dưới ảnh ở feed; caption là tuỳ chọn, không có cũng gửi được ngay để giữ tính "nhanh, ít áp lực" của module.
- **Acceptance criteria:**
  - [ ] Caption nhập ở màn hình review/audience, không thêm bước riêng
  - [ ] Vượt giới hạn ký tự bị chặn kèm thông báo, caption hiển thị đúng ở feed và lịch sử

### MOM-S02 — Widget / quick-capture

- **Hành vi:** lối tắt chụp nhanh ngoài màn hình chính: widget (mobile) hoặc shortcut (web/PWA nếu có) đưa thẳng vào giao diện camera của module, bỏ qua các màn hình trung gian; audience mặc định là lựa chọn gần nhất và vẫn qua màn hình xác nhận MOM-02 trước khi gửi.
- **Acceptance criteria:**
  - [ ] Từ widget vào được camera trong tối đa 1 thao tác sau khi mở
  - [ ] Quick-capture không bỏ qua bước xác nhận audience

### MOM-S03 — Nhắc nhẹ (gentle nudge)

- **Hành vi:** nhắc user chia sẻ khoảnh khắc tối đa một số lần cấu hình mỗi ngày, vào khung giờ hợp lý theo cài đặt của user; tắt được hoàn toàn trong cài đặt thông báo. Nudge **không** dùng cơ chế gây áp lực (không đếm ngược trừng phạt, không thông báo "bạn sắp mất chuỗi" ở SHOULD — streak thuộc WOW nếu được duyệt).
- **Acceptance criteria:**
  - [ ] Số lần và khung giờ nhắc lấy từ config/cài đặt user, tôn trọng giờ yên tĩnh
  - [ ] Tắt nhắc là tắt hẳn, không còn thông báo loại này

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### MOM-W01 — Recap tuần "Khoảnh khắc của tuần"

Cuối tuần, hệ thống tự dựng một thẻ recap trong feed của từng Circle: vài khoảnh khắc nhận nhiều reaction nhất tuần + tổng số khoảnh khắc đã chia sẻ, trình bày dạng thẻ lật/xem lại nhanh. Giá trị: tạo nghi thức nhìn lại chung của nhóm, tăng lý do quay lại app cuối tuần và là điểm demo giàu cảm xúc cho đồ án. **Effort: M**

### MOM-W02 — Streak theo Circle

Đếm số ngày liên tiếp Circle có ít nhất một khoảnh khắc mới (tính theo nhóm, không phải cá nhân — giảm áp lực từng người), hiển thị huy hiệu chuỗi cạnh tên Circle và ăn mừng nhẹ khi đạt mốc. Giá trị: động lực duy trì thói quen chia sẻ của cả nhóm theo đúng tinh thần "circle thân thiết". Rủi ro cần ghi khi duyệt: cơ chế streak dễ biến thành áp lực — thiết kế phải cho phép "đóng băng" chuỗi khi cả nhóm bận. **Effort: M**

### MOM-W03 — "Ngày này năm xưa" trong Circle

Đúng ngày này của các tuần/tháng trước, feed gợi lại một khoảnh khắc cũ của Circle (chỉ với những Circle user vẫn là thành viên và khoảnh khắc chưa bị xoá), kèm nút trả lời vào phòng chat của Circle để khơi lại câu chuyện. Giá trị: khai thác giá trị lưu trữ của khoảnh khắc, tạo tương tác hoài niệm mà các module khác không có. **Effort: S**

## 5. Business rules & invariants

- **BR-MOM-01 (Lưu trữ vs tự huỷ — quyết định bắt buộc):** khoảnh khắc của CIRCLE là **lưu trữ lâu dài theo lịch sử của tác giả, KHÔNG tự huỷ** sau 24h. Lý do: feed cần lịch sử để có giá trị quay lại, và module Album của Circle collaboration dựa trên ảnh được giữ lại. Nếu muốn đổi sang mô hình tự huỷ phải có ADR + sửa playbook này trước khi implement — tuyệt đối không để hành vi mơ hồ tuỳ developer.
- **BR-MOM-02:** audience được **chụp (snapshot) tại thời điểm gửi**: danh sách Circle đích lưu kèm khoảnh khắc. Thành viên mới vào Circle sau đó **không** tự động thấy khoảnh khắc cũ; thành viên rời Circle thì mất quyền xem các khoảnh khắc của Circle đó (kiểm tra quyền theo tư cách hiện tại khi truy cập nội dung), nhưng khoảnh khắc vẫn thuộc lịch sử của tác giả.
- **BR-MOM-03:** quan hệ block thắng mọi quan hệ Circle/audience: bị block thì không thấy nội dung của nhau dù cùng Circle và dù khoảnh khắc gửi trước thời điểm block.
- **BR-MOM-04:** xoá khoảnh khắc là hành động của tác giả, hiệu lực mọi phía ngay khi server xác nhận; dữ liệu ảnh phía server xử lý theo chính sách lưu trữ của dự án (xoá mềm có thời hạn rồi xoá cứng — quyết định một lần trong SRS, áp dụng đồng nhất với BR-CHT-03).
- **BR-MOM-05:** ảnh khoảnh khắc chỉ truy cập được qua URL có kiểm tra quyền (ký tên/hết hạn) — không public link vĩnh viễn; người ngoài audience không truy cập được kể cả khi có link.
- **BR-MOM-06:** luồng chính chỉ chấp nhận ảnh chụp trong app; mọi ngoại lệ (nếu được duyệt sau này) phải đi qua quyết định thiết kế riêng, không nới lỏng âm thầm trong code.
- **BR-MOM-07:** reaction của khoảnh khắc tuân theo cùng bộ emoji config của module Chat; trả lời khoảnh khắc đi vào **phòng chat nhóm của Circle** theo cơ chế quote của module Chat (MOM-06) — không tồn tại kênh trả lời riêng tư/1-1 và không tồn tại hệ thống tương tác riêng thứ hai. Audience của khoảnh khắc luôn là Circle (MOM-02), không gắn với danh sách bạn hay bất kỳ danh sách cá nhân nào.

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `Moment` (id, authorId, mediaId, caption?, createdAt, deletedAt?)
- `MomentAudience` (momentId, circleId) — snapshot Circle đích tại thời điểm gửi
- `MomentReaction` (momentId, userId, emoji) — hoặc dùng chung bảng reaction với Chat nếu schema cho phép
- `MomentReport` (momentId, reporterId, reason, note?, createdAt, status)
- `MomentUploadDraft` (local phía client: localId, fileRef, audienceCircleIds, status) — không phải entity server
- Dùng lại `MediaAsset` của Chat và cơ chế block theo PPL-08 (playbook 02 — People & Invitations), không tạo bảng riêng trùng lặp.

**Endpoint REST gợi ý:**
- `POST /moments` (tạo khoảnh khắc: mediaId + circleIds + caption?), `GET /moments/feed?circleId=&cursor=`
- `GET /moments/mine?cursor=` (lịch sử của bản thân), `DELETE /moments/:id`
- `PUT /moments/:id/reactions/:emoji` / `DELETE ...`, `POST /moments/:id/reports`
- Trả lời khoảnh khắc dùng endpoint gửi tin nhắn của Chat vào phòng chat của Circle đích, kèm `momentId` làm quote — không có endpoint trả lời riêng tư.

**Event realtime (WebSocket) gợi ý:**
- Server → Client: `moment:new` (chỉ gửi tới member thuộc audience + không block), `moment:deleted`, `moment:reaction`

## 7. Cross-cutting riêng cho module

(Ngoài gate chung trong cross-cutting-gate.md)

- **Quyền riêng tư theo mặc định:** mọi màn hình liên quan audience phải hiển thị "ai sẽ thấy" bằng ngôn ngữ rõ ràng cho người dùng phổ thông (tên Circle + số người), không dùng thuật ngữ kỹ thuật.
- **Metadata ảnh:** strip EXIF vị trí (GPS) khỏi ảnh trước khi lưu trữ/phục vụ, trừ khi dự án có quyết định riêng về chia sẻ vị trí (module vị trí của Circle collaboration là nơi duy nhất xử lý location một cách chủ động).
- **Nén ảnh phía client:** ảnh chụp được chuẩn hoá kích thước/nén trước upload theo config chung với Chat để feed tải nhanh trên mạng yếu.
- **Thời gian:** hiển thị thời gian khoảnh khắc theo timestamp server và locale của user, nhất quán với Chat.
- **Chế độ chỉ-xem khi thiếu quyền:** thiếu quyền camera không được khoá toàn bộ module — feed và lịch sử vẫn truy cập được (theo MOM-09).

## 8. Anti-patterns

- Cho chọn ảnh từ thư viện ngay trong luồng chính rồi vẫn gọi là "realtime sharing" — phá vỡ định vị sản phẩm; muốn có thì phải qua quyết định thiết kế riêng.
- Gửi ảnh trước, chọn audience sau (hoặc mặc định "tất cả Circle" mà không hiển thị tóm tắt) — lỗi riêng tư nghiêm trọng nhất của module.
- Tính audience động theo thành viên Circle *hiện tại* cho cả khoảnh khắc cũ mà không ghi rule — người mới vào nhóm xem được ảnh cũ, hoặc người gửi không lường trước được ai đã xem.
- Upload lỗi là mất ảnh, bắt chụp lại — phá vỡ niềm tin; bản lỗi phải giữ local và thử lại được.
- Xin quyền camera lặp lại mỗi lần vào module sau khi user đã từ chối.
- Reaction của khoảnh khắc làm một hệ thống riêng khác Chat (emoji khác, hành vi toggle khác).
- Push thông báo cho từng reaction/reply riêng lẻ gây spam cho tác giả; phải gộp thông báo.
- Để URL ảnh public không kiểm tra quyền — ai có link cũng xem được ảnh trong Circle riêng tư.

## 9. Self-audit checklist cho agent

Trước khi báo hoàn thành module Realtime Sharing, agent tự kiểm đủ các mục Tier MUST:

- [ ] MOM-01: chụp trong app, retake không giới hạn, không có đường chọn ảnh thư viện ở luồng chính
- [ ] MOM-02: bắt buộc chọn ≥1 Circle, pre-select lựa chọn gần nhất, dòng tóm tắt audience trước nút Gửi, server kiểm tra lại
- [ ] MOM-03: gửi có trạng thái sending/sent/failed, audience snapshot lưu kèm khoảnh khắc
- [ ] MOM-04: feed lọc theo Circle, đúng quyền xem + block, đủ trạng thái loading/empty/error/offline
- [ ] MOM-05: reaction dùng chung config với Chat, gộp thông báo cho tác giả
- [ ] MOM-06: trả lời khoảnh khắc mở phòng chat của Circle chứa nó với quote ảnh, mọi thành viên Circle thấy — không có kênh trả lời riêng tư/1-1
- [ ] MOM-07: lịch sử của bản thân đầy đủ, chỉ chủ sở hữu truy cập được
- [ ] MOM-08: upload lỗi giữ ảnh local, thử lại đúng audience, sót qua các phiên app
- [ ] MOM-09: từ chối quyền camera có màn hình hướng dẫn + module vẫn dùng được ở chế độ chỉ-xem
- [ ] MOM-10: block cấp tài khoản thắng quan hệ Circle ở cả hai phía
- [ ] MOM-11: report có lý do, ẩn item phía người báo cáo, tới hàng đợi xử lý
- [ ] MOM-12: xoá khoảnh khắc hiệu lực mọi phía, quote trong phòng chat hiển thị trạng thái không khả dụng
- [ ] BR-MOM-01 đã áp dụng đúng: khoảnh khắc lưu trữ, không tự huỷ; EXIF GPS được strip; URL ảnh có kiểm tra quyền

## Changelog

- 2026-10-25 — Tạo bản đầu: playbook Realtime Sharing đầy đủ Tier MUST (MOM-01 → MOM-12), SHOULD (3), WOW (3); chốt business rule lưu trữ thay vì tự huỷ (BR-MOM-01).
- 2026-10-25 — Chỉnh theo triết lý group-first: **xoá cơ chế trả lời riêng tư sang chat 1-1** — MOM-06 viết lại: trả lời khoảnh khắc đi vào phòng chat của Circle chứa nó với quote ảnh, mọi thành viên Circle đều thấy; tham chiếu block chuyển sang PPL-08 (playbook 02 — People & Invitations) ở Tổng quan, MOM-10 và mục Dữ liệu/API; BR-MOM-07 cập nhật tương ứng; audience của khoảnh khắc luôn là Circle, không gắn với danh sách bạn/"bạn thân".
