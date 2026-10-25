# Playbook — Chat

> Module nhắn tin realtime của CIRCLE — CHỈ có chat nhóm của Circle, toàn hệ thống không có chat 1-1/DM (triết lý group-first) — đối chiếu PROJECT_GOD.md §2.2 mục "Chat": Nhắn tin; Hình ảnh; Video; File; Voice message; Reply; Reaction. Lưu ý: §2.2 chưa có "ghim tin nhắn" — playbook này bổ sung dưới dạng đề xuất (CHT-14).

## 1. Tổng quan

- **Mục đích:** kênh giao tiếp chính của CIRCLE. Mọi tính năng của CIRCLE sinh ra vì hoạt động nhóm và tồn tại vì nhóm — Chat cũng vậy: **chat chỉ tồn tại dưới dạng phòng chat nhóm của Circle**. Toàn hệ thống không có DM/chat 1-1 ở bất kỳ bề mặt nào: không mở chat riêng từ hồ sơ người dùng, không từ khoảnh khắc, không từ danh sách thành viên. Mỗi Circle có một phòng chat chính (baseline); danh sách chat chính là danh sách Circle của user.
- **Actors:** thành viên Circle (gửi/nhận), chủ Circle và moderator (quản trị phòng chat: ghim, thu hồi tin của người khác nếu được phân quyền), hệ thống (tin nhắn hệ thống, sự kiện cuộc gọi nhóm).
- **Quan hệ với module khác:**
  - Phụ thuộc **Circle** để xác định thành viên phòng chat và quyền trong phòng; phụ thuộc **People & Invitations (playbook 02, PPL)** cho quan hệ block (PPL-08) ảnh hưởng hiển thị tin nhắn trong phòng.
  - Nhận sự kiện từ **Realtime sharing (MOM)**: trả lời một khoảnh khắc = quote khoảnh khắc đó vào phòng chat của Circle chứa nó (MOM-06) — không có kênh trả lời riêng tư.
  - Nhận sự kiện từ **Voice/Video (CAL)**: chỉ nhật ký cuộc gọi **nhóm** được ghi vào phòng chat dạng tin nhắn hệ thống; cuộc gọi 1-1 KHÔNG ghi vào chat nhóm vì lý do riêng tư (phối hợp playbook 06).
  - Đẩy sự kiện sang **Notification**: tin nhắn mới khi app ở background / user offline.
  - Dùng chung hạ tầng **WebSocket** của hệ thống cho realtime (không tự mở kênh riêng).

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### CHT-01 — Phòng chat nhóm của Circle

- **Hành vi:** mỗi Circle có đúng **một phòng chat chính** gắn 1-1 với Circle đó (baseline); thành viên phòng chat = thành viên Circle. Không tồn tại loại hội thoại nào khác — đặc biệt không có conversation `direct`/DM giữa hai user ở bất kỳ đâu trong hệ thống. Phòng chat được tạo tự động khi Circle được tạo; rời Circle = rời phòng chat.
- **Luồng chính:** mở app → tab Chat (danh sách Circle theo hoạt động gần nhất, xem CHT-02) → chọn Circle → phòng chat của Circle đó. Mọi điểm vào khác (thông báo, khoảnh khắc, tin ghim, kết quả tìm kiếm) đều dẫn về phòng chat của Circle tương ứng — không điểm vào nào tạo cuộc trò chuyện riêng.
- **Trạng thái UI:** loading (skeleton), error (không tải được phòng chat — nút thử lại), read-only (Circle bị giải tán — banner thông báo, không gửi được).
- **Edge cases:** user bị xoá khỏi Circle khi đang mở phòng chat (đóng màn hình, báo đã rời nhóm); Circle bị giải tán (phòng chat chuyển read-only, hiển thị banner); user mở deep link tới phòng chat của Circle mình không còn là thành viên (chặn truy cập, thông báo rõ lý do).
- **Acceptance criteria:**
  - [ ] Mỗi Circle có đúng một phòng chat chính, tự tạo khi Circle được tạo, thành viên đồng bộ với thành viên Circle
  - [ ] Không tồn tại API/UI nào tạo hoặc mở được hội thoại 1-1 (kiểm chứng: từ profile, danh sách thành viên, khoảnh khắc đều không có nút "nhắn tin riêng")
  - [ ] User rời/bị xoá khỏi Circle thì không còn đọc/gửi được trong phòng chat đó
  - [ ] Circle bị giải tán thì phòng chat read-only và có banner thông báo rõ ràng
- **Platform:** Giống nhau
- **Scope:** Đã đăng ký §2.2

### CHT-02 — Danh sách phòng chat (danh sách Circle theo hoạt động)

- **Hành vi:** danh sách chat **chính là danh sách Circle** mà user là thành viên, sắp xếp theo hoạt động chat gần nhất (tin nhắn cuối mới nhất lên đầu). Mỗi item hiển thị: avatar + tên Circle, preview tin cuối (prefix "Bạn:" nếu là tin của mình; nhãn theo loại: [Ảnh], [Video], [File], [Tin nhắn thoại]), thời gian tương đối, badge số chưa đọc, và **badge mention riêng** (số lần được @mention — xem CHT-22) hiển thị tách biệt và ưu tiên hơn badge chưa đọc thường.
- **Luồng chính:** mở app/tab Chat → danh sách render từ cache local trước → đồng bộ realtime → item nhảy lên đầu khi có tin mới.
- **Trạng thái UI:** loading (skeleton), empty (user chưa thuộc Circle nào — hiển thị hướng dẫn tạo Circle hoặc chờ được mời vào Circle; không có Circle thì không có chat), offline (hiển thị dữ liệu cache + banner mất kết nối), badge chưa đọc ẩn khi = 0.
- **Edge cases:** tin cuối bị thu hồi (preview đổi thành "Tin nhắn đã được thu hồi"); tin cuối là tin hệ thống (preview hiển thị nội dung hệ thống, không tính vào badge); tin cuối là của người bị chặn (preview hiển thị placeholder theo CHT-23, không lộ nội dung); tên Circle trùng nhau (truncate 1 dòng, phân biệt bằng avatar + số thành viên); user bị xoá khỏi Circle (item biến mất khỏi danh sách).
- **Acceptance criteria:**
  - [ ] Danh sách chỉ gồm các Circle user đang là thành viên, sắp xếp đúng theo thời gian tin cuối, cập nhật realtime không cần reload
  - [ ] Badge chưa đọc khớp số tin chưa đọc thực tế, về 0 sau khi mở phòng chat
  - [ ] Badge mention hiển thị tách riêng khỏi badge chưa đọc và vẫn nổi bật kể cả khi phòng đã mute (theo BR-CHT-05)
  - [ ] Preview tin cuối đúng loại nội dung và phản ánh trạng thái thu hồi/xoá/block
  - [ ] Mở app offline vẫn thấy danh sách từ cache kèm banner mất kết nối
- **Platform:** Mobile: vuốt item để mute phòng chat nhanh. Web: thao tác qua menu chuột phải/nút "…". Logic dữ liệu giống nhau.
- **Scope:** Đề xuất bổ sung

### CHT-03 — Gửi tin nhắn văn bản & vòng đời trạng thái

- **Hành vi:** gửi text trong phòng chat Circle (hỗ trợ nhiều dòng, emoji, @mention thành viên — xem CHT-22). Tin nhắn hiển thị ngay theo cơ chế optimistic với trạng thái: `sending` → `sent` (server đã nhận) → `delivered` (đã tới thiết bị của thành viên) → `seen` (đã có thành viên xem — chi tiết seen-by theo từng thành viên xem CHT-16). Gửi thất bại: tin chuyển trạng thái `failed`, bấm để gửi lại, không mất nội dung.
- **Luồng chính:** nhập text → gửi → tin xuất hiện ngay với icon đồng hồ (sending) → server ack → cập nhật trạng thái tại chỗ, không render lại toàn bộ danh sách.
- **Trạng thái UI:** sending (icon đồng hồ/mờ), failed (icon cảnh báo đỏ + nhãn "Chạm để gửi lại"), offline (tin xếp hàng ở trạng thái sending kèm banner).
- **Edge cases:** mất mạng giữa lúc gửi (giữ trong outbox local, tự gửi lại khi có mạng — xem CHT-S05); gửi trùng do retry (client sinh `clientMessageId` duy nhất, server dedupe); text chỉ gồm khoảng trắng (không cho gửi); text vượt giới hạn ký tự (chặn input + báo giới hạn); thứ tự tin khi nhiều tin gửi liên tiếp lúc offline (giữ đúng thứ tự theo sequence local).
- **Acceptance criteria:**
  - [ ] Tin hiển thị lạc quan (optimistic) ngay khi bấm gửi, không chờ server
  - [ ] Đủ vòng đời trạng thái sending/sent/delivered/seen hiển thị đúng trong ngữ cảnh nhóm (seen chi tiết theo thành viên qua CHT-16)
  - [ ] Tin failed có nút gửi lại và gửi lại không tạo tin trùng
  - [ ] Không gửi được tin rỗng/toàn khoảng trắng; có giới hạn độ dài và thông báo rõ
- **Platform:** Mobile: Enter = xuống dòng, gửi bằng nút send. Web: Enter = gửi, Shift+Enter = xuống dòng (có hint). Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2

### CHT-04 — Gửi hình ảnh

- **Hành vi:** chọn 1 ảnh từ thư viện hoặc chụp trực tiếp, xem trước (preview) trước khi gửi, kèm caption tuỳ chọn. Ảnh được nén/đổi kích thước phía client theo cấu hình chung trước upload; hiển thị placeholder mờ (blurhash hoặc màu nền) trong lúc tải lên.
- **Luồng chính:** bấm nút ảnh → chọn/chụp → preview → (nhập caption) → gửi → bubble ảnh với progress → hoàn tất.
- **Trạng thái UI:** uploading (progress %, nút huỷ), failed (nút thử lại ngay trên bubble), viewing (chạm để xem full-screen, pinch zoom).
- **Edge cases:** ảnh HEIC/định dạng lạ (convert hoặc báo không hỗ trợ); ảnh rất lớn (nén trước upload, không upload bản gốc nếu vượt ngưỡng cấu hình); user huỷ giữa chừng (huỷ request thật, dọn file tạm); quyền truy cập thư viện bị từ chối (màn hình hướng dẫn cấp quyền).
- **Acceptance criteria:**
  - [ ] Có màn hình preview trước khi gửi, huỷ preview thì không gửi gì
  - [ ] Bubble ảnh luôn có trạng thái uploading/failed/thành công rõ ràng
  - [ ] Chạm vào ảnh mở viewer full-screen, zoom được
  - [ ] Ảnh vượt ngưỡng dung lượng cấu hình được nén trước khi upload
- **Platform:** Mobile: dùng image picker/camera hệ thống. Web: file input + kéo-thả vào cửa sổ chat + paste từ clipboard. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2

### CHT-05 — Gửi video

- **Hành vi:** chọn video từ thư viện, hiển thị thumbnail + thời lượng + dung lượng trước khi gửi. Phát inline trong bubble (mobile) hoặc mở player; không tự phát kèm âm thanh.
- **Luồng chính:** chọn video → preview thumbnail/thời lượng → gửi → upload có progress → bubble video sẵn sàng phát.
- **Trạng thái UI:** uploading (progress + huỷ), processing (nếu server transcode — hiển thị "Đang xử lý"), failed (thử lại), error khi file không phải video hợp lệ.
- **Edge cases:** video vượt giới hạn thời lượng/dung lượng cấu hình (chặn trước upload, báo rõ giới hạn); định dạng không hỗ trợ phát trên nền tảng đích (server transcode sang định dạng phổ biến hoặc báo lỗi rõ); upload dở dang mất mạng (thử lại từ đầu, không gửi file lỗi).
- **Acceptance criteria:**
  - [ ] Trước khi gửi thấy được thumbnail, thời lượng, dung lượng video
  - [ ] Video vượt giới hạn bị chặn trước upload với thông báo nêu rõ giới hạn
  - [ ] Video phát được inline sau khi gửi xong trên cả web và mobile
- **Platform:** Mobile: player native của hệ điều hành. Web: HTML5 video. Logic upload giống nhau.
- **Scope:** Đã đăng ký §2.2

### CHT-06 — Gửi file đính kèm

- **Hành vi:** gửi file tài liệu (pdf, doc/docx, xls, zip, txt...) trong giới hạn dung lượng cấu hình (một con số duy nhất đặt trong config, hiển thị trong thông báo lỗi khi vượt). Bubble file hiển thị: icon theo loại, tên file, dung lượng, trạng thái tải xuống.
- **Luồng chính:** bấm đính kèm → chọn file → kiểm tra dung lượng/loại → gửi → người nhận chạm để tải/mở.
- **Trạng thái UI:** uploading (progress + huỷ), failed (thử lại), downloaded/openable phía người nhận.
- **Edge cases:** file vượt giới hạn (chặn, báo "File tối đa X MB" với X lấy từ config); loại file bị cấm theo policy (exe, script...) bị chặn và báo rõ; tên file có ký tự đặc biệt/tiếng Việt (giữ nguyên tên hiển thị, sanitize khi lưu trữ); file bị xoá trên server (bubble hiển thị "File không còn khả dụng").
- **Acceptance criteria:**
  - [ ] File vượt giới hạn dung lượng bị chặn trước upload, thông báo nêu đúng giới hạn từ config
  - [ ] Loại file trong danh sách cấm không gửi được
  - [ ] Bubble hiển thị đúng tên, loại, dung lượng; tải xuống được trên web và mobile
- **Platform:** Mobile: document picker hệ thống; mở file bằng app ngoài. Web: file input + kéo-thả; tải xuống qua trình duyệt. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2

### CHT-07 — Voice message

- **Hành vi:** ghi âm tin nhắn thoại ngay trong chat: giữ/bấm để ghi, hiển thị thời gian ghi realtime, nghe lại trước khi gửi hoặc huỷ (vuốt/nút huỷ). Phía người nhận: bấm play/pause, thanh tiến trình, thời lượng; đánh dấu "đã nghe" sau khi phát hết (hoặc phát đủ ngưỡng cấu hình).
- **Luồng chính:** bấm mic → xin quyền micro (lần đầu) → ghi → thả/bấm dừng → nghe lại → gửi; hoặc huỷ.
- **Trạng thái UI:** recording (đồng hồ đếm + sóng âm trực quan + nút huỷ nổi bật), preview (play nghe lại), uploading, playing/paused phía người nhận, failed.
- **Edge cases:** quyền micro bị từ chối (màn hình hướng dẫn cấp quyền, không crash); bị gián đoạn khi ghi (cuộc gọi đến, app xuống background — dừng và giữ bản nháp để gửi/huỷ khi quay lại); ghi quá ngắn (< 1 giây — coi là bấm nhầm, tự huỷ kèm rung/nháy nhẹ); đang phát voice thì chuyển hội thoại (dừng phát).
- **Acceptance criteria:**
  - [ ] Ghi âm có hiển thị thời gian realtime và huỷ được trước khi gửi
  - [ ] Nghe lại được bản ghi trước khi quyết định gửi
  - [ ] Voice đã nghe có dấu hiệu phân biệt với chưa nghe
  - [ ] Mất quyền micro hoặc bị gián đoạn không làm mất app state/crash
- **Platform:** Mobile: ghi âm native, phát qua loa ngoài/tai nghe theo cảm biến tiệm cận nếu hỗ trợ. Web: MediaRecorder của trình duyệt, cần HTTPS. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2

### CHT-08 — Pipeline tải lên media (dùng chung cho ảnh/video/file/voice)

- **Hành vi:** mọi upload đi qua một pipeline chung: hàng đợi upload, thanh/nhãn tiến trình %, huỷ được, tự thử lại giới hạn số lần khi lỗi mạng tạm thời, và thử lại thủ công sau khi hết lượt tự động. Upload chạy nền: rời màn hình chat không huỷ upload.
- **Luồng chính:** chọn media → vào hàng đợi → progress cập nhật trên bubble → server xác nhận → bubble chuyển trạng thái hoàn tất kèm URL media.
- **Trạng thái UI:** queued, uploading (% cụ thể), retrying, failed (nút thử lại + huỷ bỏ hẳn), done.
- **Edge cases:** tắt app giữa lúc upload trên mobile (upload được khôi phục hoặc đánh dấu failed rõ ràng khi mở lại, không treo ở "sending" vĩnh viễn); nhiều media gửi cùng lúc (xếp hàng, không nghẽn UI); server trả lỗi 4xx không thể retry (validation) — dừng ngay, báo lý do, không retry vô ích.
- **Acceptance criteria:**
  - [ ] Mọi bubble media đều hiển thị tiến trình upload dạng % hoặc vòng tiến trình
  - [ ] Huỷ upload dừng request thật và dọn sạch dữ liệu tạm
  - [ ] Upload lỗi có thử lại được ngay tại bubble, không phải gửi lại từ đầu quy trình chọn file
  - [ ] Không tồn tại tin nhắn kẹt vĩnh viễn ở trạng thái sending sau khi mở lại app
- **Platform:** Mobile: hỗ trợ background upload theo khả năng OS. Web: upload gắn với phiên trang, rời trang là huỷ (có cảnh báo nếu đang upload). Còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### CHT-09 — Sửa tin nhắn

- **Hành vi:** người gửi sửa được tin text của chính mình. Tin đã sửa có nhãn "đã chỉnh sửa"; chạm vào nhãn xem được lịch sử sửa (ít nhất bản trước gần nhất). Không sửa được tin media/voice/hệ thống.
- **Luồng chính:** long-press/menu tin → Sửa → nội dung nạp vào ô nhập kèm banner "Đang sửa tin nhắn" → lưu → bubble cập nhật tại chỗ + nhãn đã chỉnh sửa.
- **Trạng thái UI:** editing (banner trên ô nhập, nút huỷ sửa), saving, error khi sửa thất bại (giữ nội dung đang sửa, không mất).
- **Edge cases:** tin bị thu hồi trong lúc đang sửa (huỷ phiên sửa, báo tin không còn); sửa thành rỗng (không cho lưu); tin quá cũ — nếu dự án đặt giới hạn thời gian sửa thì lấy từ config và báo rõ khi quá hạn (mặc định: không giới hạn, nhưng phải ghi quyết định này vào business rules §5).
- **Acceptance criteria:**
  - [ ] Chỉ sửa được tin của chính mình và chỉ loại text
  - [ ] Tin đã sửa luôn có nhãn "đã chỉnh sửa" ở mọi phía (người gửi, người nhận, sau reload)
  - [ ] Xem được nội dung trước khi sửa từ nhãn đã chỉnh sửa
  - [ ] Nội dung sửa đồng bộ realtime tới người nhận đang mở hội thoại
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-10 — Thu hồi tin nhắn

- **Hành vi:** người gửi thu hồi tin của mình cho mọi phía. Sau thu hồi, bubble biến thành placeholder "Tin nhắn đã được thu hồi" cho tất cả thành viên; nội dung gốc không còn truy xuất được từ client. Quyền mở rộng: chủ/moderator Circle thu hồi được tin của thành viên trong group của Circle đó.
- **Luồng chính:** menu tin → Thu hồi → hộp xác nhận → placeholder thay thế tại chỗ, giữ nguyên vị trí/thời gian trong luồng chat.
- **Trạng thái UI:** confirming, recalling, placeholder (text mờ, không tương tác được: không reply/react/sửa lên placeholder).
- **Edge cases:** thu hồi khi người nhận đang reply vào tin đó (quote hiển thị "Tin nhắn gốc đã bị thu hồi"); thu hồi tin đang upload (huỷ upload + thu hồi); thông báo đẩy đã gửi trước đó (không bắt buộc thu hồi notification phía OS, nhưng mở app không được thấy nội dung đã thu hồi); thu hồi hàng loạt/spam (rate limit phía server).
- **Acceptance criteria:**
  - [ ] Sau thu hồi, không phía nào (kể cả người gửi) xem lại được nội dung gốc qua UI
  - [ ] Placeholder giữ đúng vị trí tin trong lịch sử chat
  - [ ] Không thể reply/react/ghim lên placeholder đã thu hồi
  - [ ] Moderator thu hồi tin người khác chỉ áp dụng trong group thuộc Circle mình quản lý
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-11 — Xoá tin nhắn phía mình

- **Hành vi:** mỗi user xoá được bất kỳ tin nào khỏi lịch sử hiển thị của riêng mình ("Xoá phía tôi"). Tin biến mất khỏi màn hình của user đó, không ảnh hưởng người khác, không hiện placeholder. Phân biệt rõ trong menu với "Thu hồi" (chỉ tin của mình mới có Thu hồi).
- **Luồng chính:** menu tin → Xoá phía tôi → xác nhận (nếu là hành động không khôi phục được) → tin biến mất khỏi UI của user.
- **Trạng thái UI:** confirming, deleted (không còn phần tử UI).
- **Edge cases:** xoá tin cuối của hội thoại (preview danh sách lùi về tin trước còn hiển thị với user đó); xoá tin đang được quote trong ô nhập (huỷ quote); đồng bộ đa thiết bị của cùng user (xoá trên máy này áp dụng cho các máy khác của user).
- **Acceptance criteria:**
  - [ ] Xoá phía mình không ảnh hưởng hiển thị của bất kỳ user nào khác
  - [ ] Preview trong danh sách hội thoại cập nhật đúng sau khi xoá tin cuối
  - [ ] Xoá đồng bộ trên mọi thiết bị của cùng user
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-12 — Reply dạng quote & nhảy tới tin gốc

- **Hành vi:** reply gắn quote của tin gốc (trích đoạn text hoặc nhãn loại media) hiển thị phía trên nội dung trả lời. Chạm vào quote → cuộn tới tin gốc và highlight ngắn. Reply được với mọi loại tin chưa bị thu hồi.
- **Luồng chính:** vuốt tin sang (mobile) hoặc menu → Trả lời → khối quote xuất hiện trên ô nhập → soạn → gửi → bubble hiển thị quote + nội dung.
- **Trạng thái UI:** composing-with-quote (có nút bỏ quote), jumping (loading nếu tin gốc chưa được tải — tự phân trang về quá khứ để lấy tin gốc), highlight tin gốc ~1-2 giây.
- **Edge cases:** tin gốc đã thu hồi (quote hiển thị "Tin nhắn gốc đã bị thu hồi", vẫn chạm được nhưng không nhảy); tin gốc nằm ngoài vùng đã tải (tự load thêm lịch sử cho tới khi gặp tin gốc hoặc hết dữ liệu — có điểm dừng, không load vô hạn); reply chuỗi (quote chỉ trỏ về tin gốc trực tiếp, không lồng quote nhiều cấp).
- **Acceptance criteria:**
  - [ ] Bubble reply luôn hiển thị quote đúng nội dung/loại của tin gốc tại thời điểm reply
  - [ ] Chạm quote cuộn đúng tới tin gốc và highlight, kể cả khi phải tải thêm lịch sử
  - [ ] Bỏ quote khi đang soạn được bằng một thao tác, tin gửi đi thành tin thường
  - [ ] Reply lên placeholder đã thu hồi bị chặn
- **Platform:** Mobile: vuốt ngang để reply nhanh. Web: nút reply khi hover + phím tắt. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2 (Reply)

### CHT-13 — Reaction

- **Hành vi:** react bằng bộ emoji chuẩn cố định của hệ thống (ví dụ: ❤️ 👍 😂 😮 😢 🙏 — danh sách đặt trong config dùng chung web/mobile, không để user tự nhập emoji bất kỳ ở bản baseline). Tổng hợp reaction hiển thị dưới bubble: emoji + số lượng. Chạm vào cụm reaction mở danh sách chi tiết: ai đã react emoji nào. React lại cùng emoji = gỡ reaction của mình; chọn emoji khác = đổi.
- **Luồng chính:** long-press/hover tin → thanh emoji → chọn → cụm reaction cập nhật realtime cho mọi phía. Mobile: double-tap vào tin = react nhanh bằng emoji mặc định (❤️).
- **Trạng thái UI:** reacting (cập nhật optimistic), detail sheet (danh sách người react, loading khi nhiều), error (rollback khi server từ chối).
- **Edge cases:** nhiều người react cùng lúc (server là nguồn sự thật, client reconcile); react lên tin đang upload (chặn tới khi tin sent); gỡ hết reaction (cụm reaction biến mất hoàn toàn, không để "0"); double-tap nhầm khi cuộn (chỉ kích hoạt khi tap đúng nhịp lên bubble, không xung đột với cuộn).
- **Acceptance criteria:**
  - [ ] Bộ emoji reaction giống hệt nhau trên web và mobile, lấy từ một nguồn config chung
  - [ ] React/gỡ/đổi cập nhật realtime cho mọi thành viên đang xem
  - [ ] Xem được danh sách người react theo từng emoji
  - [ ] Double-tap trên mobile react nhanh bằng emoji mặc định và double-tap lần nữa gỡ ra
- **Platform:** Mobile: long-press mở thanh reaction + double-tap react nhanh. Web: hover hiện nút reaction. Còn lại giống nhau.
- **Scope:** Đã đăng ký §2.2 (Reaction)

### CHT-14 — Ghim tin nhắn (PIN)

- **Hành vi:** ghim tin quan trọng trong phòng chat Circle để mọi thành viên xem lại nhanh: mọi thành viên ghim được, chủ/moderator bỏ ghim được mọi tin (giới hạn số tin ghim theo cấu hình). Tin đã ghim có dấu hiệu trên bubble; thanh tin ghim (pinned bar) cố định trên đầu màn hình chat — chạm vào nhảy tới tin ghim, chạm mở danh sách toàn bộ tin ghim của phòng.
- **Luồng chính:** menu tin → Ghim → pinned bar xuất hiện/cập nhật → chạm pinned bar nhảy tới tin; danh sách ghim: từ pinned bar hoặc menu hội thoại.
- **Trạng thái UI:** pinned bar (1 tin ghim gần nhất + tổng số), pin list (danh sách đầy đủ, mỗi item chạm để nhảy tới), empty (chưa có tin ghim — ẩn pinned bar).
- **Edge cases:** tin ghim bị thu hồi (tự động rời danh sách ghim, pinned bar cập nhật); tin ghim bị xoá phía mình (chỉ ẩn phía mình, vẫn ghim với người khác — hiển thị placeholder trong danh sách ghim phía mình); nhiều tin ghim (pinned bar hiển thị tin ghim mới nhất, có chỉ số tổng); ghim tin đang upload (chặn tới khi sent).
- **Acceptance criteria:**
  - [ ] Ghim/bỏ ghim đồng bộ realtime cho mọi thành viên
  - [ ] Pinned bar luôn hiển thị đúng tin ghim gần nhất và tổng số tin ghim
  - [ ] Chạm tin trong danh sách ghim nhảy đúng tới vị trí tin trong lịch sử
  - [ ] Tin ghim bị thu hồi tự động biến mất khỏi danh sách ghim ở mọi phía
- **Platform:** Giống nhau
- **Scope:** **Đề xuất bổ sung** — §2.2 chưa đăng ký ghim cho Chat (chỉ có "Ghim nội dung" ở Circle collaboration). Cần đưa vào SRS/backlog và được duyệt trước khi implement.

### CHT-15 — Typing indicator

- **Hành vi:** khi thành viên trong phòng chat Circle đang soạn, hiển thị "đang nhập…" kèm tên người đang nhập (nhiều người thì "A, B đang nhập…"). Sự kiện typing gửi throttled qua WebSocket, tự hết hạn sau vài giây không có phím mới; biến mất ngay khi tin được gửi hoặc user rời màn hình soạn.
- **Luồng chính:** user gõ → client gửi event typing (throttle) → phía nhận hiển thị indicator → dừng gõ quá thời gian timeout → indicator tự ẩn.
- **Trạng thái UI:** typing (dòng chữ/animation ba chấm ở cuối danh sách tin + ở danh sách phòng chat), idle.
- **Edge cases:** user gõ rồi xoá hết text (gửi sự kiện dừng); mất kết nối giữa chừng (indicator phía nhận tự hết hạn, không kẹt vĩnh viễn); nhiều người gõ cùng lúc trong phòng đông (giới hạn hiển thị tối đa 2 tên + "và người khác").
- **Acceptance criteria:**
  - [ ] Indicator xuất hiện trong thời gian ngắn sau khi phía kia bắt đầu gõ và tự ẩn khi họ dừng
  - [ ] Indicator không bao giờ kẹt hiển thị quá thời gian timeout dù mất gói tin "dừng gõ"
  - [ ] Sự kiện typing được throttle, không gửi theo từng ký tự
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-16 — Seen-by trong group

- **Hành vi:** với tin của mình trong group, xem được danh sách thành viên đã xem (avatar + thời gian xem) và thành viên chưa xem. Trạng thái của tin hiển thị theo mốc thấp nhất có ý nghĩa: `sent` → `delivered` → `seen` (ít nhất một người xem) kèm chi tiết khi chạm vào.
- **Luồng chính:** chạm/giữ tin của mình → "Chi tiết" → sheet hiển thị hai nhóm Đã xem / Chưa xem.
- **Trạng thái UI:** detail sheet (loading khi group đông), cập nhật realtime khi có thêm người xem.
- **Edge cases:** thành viên rời nhóm sau khi đã xem (vẫn ghi nhận đã xem tại thời điểm đó, hiển thị kèm ghi chú đã rời nếu cần); group rất đông (phân trang danh sách đã xem); tin hệ thống không áp dụng seen-by.
- **Acceptance criteria:**
  - [ ] Mở chi tiết tin thấy đúng danh sách đã xem/chưa xem tại thời điểm mở
  - [ ] Danh sách cập nhật realtime khi có thành viên mới xem
  - [ ] Bubble tin của mình hiển thị tóm tắt seen (chồng avatar người đã xem hoặc "Đã xem bởi N người"), chạm vào mở chi tiết Đã xem / Chưa xem
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-17 — Tìm kiếm trong phòng chat

- **Hành vi:** tìm theo từ khoá trong phạm vi một phòng chat Circle: hiển thị danh sách kết quả (đoạn trích có highlight từ khoá + thời gian), chạm kết quả nhảy tới đúng vị trí tin và highlight. Có điều hướng lên/xuống giữa các kết quả khi đang ở trong màn hình chat. Tin của người bị chặn không xuất hiện nội dung trong kết quả phía người chặn (theo CHT-23).
- **Luồng chính:** menu phòng chat → Tìm kiếm → nhập từ khoá (debounce) → danh sách kết quả → chạm → nhảy tới tin.
- **Trạng thái UI:** searching (loading), empty (không có kết quả — thông báo rõ), results list, highlight tại tin đích.
- **Edge cases:** từ khoá quá ngắn (yêu cầu tối thiểu 2 ký tự, báo cho user); kết quả trong tin đã thu hồi/xoá phía mình (không xuất hiện); tìm trong lịch sử rất dài (server-side search hoặc index local — không quét toàn bộ trên UI thread gây giật).
- **Acceptance criteria:**
  - [ ] Kết quả highlight đúng từ khoá và đúng phòng chat đang tìm
  - [ ] Chạm kết quả nhảy đúng vị trí tin trong lịch sử
  - [ ] Tin đã thu hồi/xoá phía mình không xuất hiện trong kết quả
  - [ ] Tìm kiếm không làm đơ UI với hội thoại dài
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-18 — Lưu nháp (draft) theo phòng chat Circle

- **Hành vi:** nội dung đang soạn dở (text + quote đang reply nếu có) được lưu tự động theo từng phòng chat Circle, khôi phục khi quay lại phòng. Danh sách phòng chat hiển thị nhãn "Nháp: …" tại item có nháp. Nháp xoá khi: gửi tin, user xoá hết text, hoặc bấm bỏ nháp.
- **Luồng chính:** soạn dở → rời phòng chat → quay lại → nội dung còn nguyên trong ô nhập.
- **Trạng thái UI:** draft indicator trong danh sách phòng chat (chữ "Nháp" + trích đoạn, màu phân biệt).
- **Edge cases:** nháp chứa quote của tin sau đó bị thu hồi (khôi phục nháp nhưng bỏ quote, báo nhẹ); đa thiết bị — bản baseline: nháp chỉ lưu local từng thiết bị (ghi rõ quyết định này), không đồng bộ server; app bị kill đột ngột (nháp đã debounce-lưu vẫn còn).
- **Acceptance criteria:**
  - [ ] Rời và quay lại phòng chat, nội dung soạn dở còn nguyên
  - [ ] Danh sách phòng chat hiển thị chỉ dấu nháp đúng phòng có nháp
  - [ ] Gửi tin xong nháp bị xoá, không khôi phục lại nội dung đã gửi
- **Platform:** Giống nhau (lưu local: AsyncStorage phía mobile, localStorage phía web)
- **Scope:** Đề xuất bổ sung

### CHT-19 — Mute thông báo theo phòng chat (theo Circle)

- **Hành vi:** tắt thông báo cho từng phòng chat Circle: tuỳ chọn tắt 1 giờ / 8 giờ / cho tới khi bật lại. Phòng đã mute có icon chuông gạch trong danh sách; tin mới vẫn tới và vẫn tăng bộ đếm trong app nhưng không đẩy push, không rung/âm thanh. Badge số chưa đọc vẫn hiển thị (mute ≠ đã đọc).
- **Luồng chính:** menu phòng chat / vuốt item → Tắt thông báo → chọn thời lượng → icon mute xuất hiện; bật lại tương tự.
- **Trạng thái UI:** muted (icon), timed mute (tự hết hạn đúng giờ đã chọn).
- **Edge cases:** được mention @ trong group đã mute (theo policy chuẩn: vẫn thông báo khi bị mention — ghi thành business rule §5 và hiển thị rõ trong UI chọn mute); hết hạn mute khi app đóng (server dựa vào mốc thời gian tuyệt đối, không phụ thuộc app chạy).
- **Acceptance criteria:**
  - [ ] Phòng chat đã mute không phát push thông báo cho tin thường
  - [ ] Mute theo giờ tự hết hạn đúng thời lượng đã chọn
  - [ ] Bị mention trong group đã mute vẫn nhận thông báo (đúng business rule §5)
- **Platform:** Mobile: vuốt item trong danh sách để mute nhanh. Web: menu "…". Còn lại giống nhau.
- **Scope:** Đề xuất bổ sung

### CHT-20 — Tin nhắn hệ thống

- **Hành vi:** các sự kiện vòng đời được ghi vào luồng chat dạng tin hệ thống căn giữa, không có bubble, không react/reply/ghim được, không tính vào badge chưa đọc của người gây ra sự kiện: thành viên vào/rời/bị xoá khỏi Circle, đổi tên Circle, đổi ảnh Circle, ghim tin (tuỳ chọn hiển thị), tạo sự kiện mới trong Circle, và nhật ký cuộc gọi **nhóm** từ module CAL (cuộc gọi nhóm bắt đầu/kết thúc/thời lượng/cuộc gọi nhóm bị nhỡ). **Cuộc gọi 1-1 của CAL tuyệt đối không được ghi vào bất kỳ phòng chat nào** — nhật ký cuộc gọi riêng tư không thuộc về nhóm (phối hợp playbook 06).
- **Luồng chính:** sự kiện xảy ra (từ Circle/CAL/server) → server ghi message type `system` → mọi client render đồng nhất.
- **Trạng thái UI:** chỉ là dòng nội dung hệ thống; không có trạng thái gửi riêng (do server sinh).
- **Edge cases:** sự kiện dồn dập (nhiều người vào cùng lúc — gộp thành một dòng "A, B và N người khác đã tham gia" nếu vượt ngưỡng cấu hình); user mở hội thoại sau thời gian dài vắng mặt (tin hệ thống vẫn đúng thứ tự thời gian trong lịch sử phân trang).
- **Acceptance criteria:**
  - [ ] Mọi sự kiện vào/rời/đổi tên nhóm đều có tin hệ thống tương ứng, đúng thứ tự thời gian
  - [ ] Tin hệ thống không nhận được reaction/reply và không có trạng thái seen riêng
  - [ ] Nhật ký cuộc gọi **nhóm** từ CAL hiển thị đúng định dạng hệ thống (gồm cuộc gọi nhóm bị nhỡ); không tồn tại tin hệ thống nào về cuộc gọi 1-1 trong phòng chat
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

### CHT-21 — Phân trang lịch sử & điều hướng tới tin chỉ định

- **Hành vi:** lịch sử tải theo trang (cursor-based, mới nhất trước), cuộn lên tự tải thêm trang cũ (infinite scroll ngược), giữ nguyên vị trí cuộn khi nạp thêm. Mọi thao tác "nhảy tới tin" (từ quote, tin ghim, kết quả tìm kiếm, thông báo) dùng chung một cơ chế: nếu tin chưa có trong bộ nhớ, tải trang chứa tin đó rồi cuộn + highlight.
- **Luồng chính:** mở hội thoại → tải trang mới nhất + nhảy xuống tin chưa đọc đầu tiên (nếu có) hoặc cuối danh sách → cuộn lên tải thêm.
- **Trạng thái UI:** loading trang cũ (spinner trên đầu), hết lịch sử (dòng "Đây là đầu cuộc trò chuyện"), jumping (skeleton ngắn khi tải trang chứa tin đích).
- **Edge cases:** tin mới tới trong lúc đang xem lịch sử cũ (không tự kéo user xuống đáy; hiển thị nút "Tin nhắn mới ↓"); tin đích đã bị xoá phía mình/thu hồi (nhảy tới vị trí gần nhất còn tồn tại + thông báo); phân trang khi có tin bị xoá giữa các trang (cursor theo message id/sequence, không dùng offset để tránh trùng/lọt).
- **Acceptance criteria:**
  - [ ] Cuộn lên tải thêm không làm nhảy vị trí đang đọc
  - [ ] Phân trang dùng cursor, không trùng/không lọt tin khi có tin mới chèn vào
  - [ ] Đang xem lịch sử cũ có tin mới tới thì xuất hiện nút quay xuống, không tự cuộn
  - [ ] Nhảy tới tin từ quote/ghim/tìm kiếm dùng cùng một cơ chế và luôn kết thúc bằng highlight tại tin đích (hoặc thông báo rõ nếu tin không còn)
- **Platform:** Mobile: FlatList inverted/ảo hoá danh sách. Web: virtual scroll tương đương. Logic phân trang giống nhau.
- **Scope:** Đề xuất bổ sung

### CHT-22 — Mention @thành viên và @all

- **Hành vi:** trong phòng chat Circle, user mention được thành viên cụ thể bằng @tên (autocomplete chỉ liệt kê thành viên của Circle đó) và mention toàn nhóm bằng @all. Mention hiển thị nổi bật (highlight) trong bubble đối với người được mention. @all là thao tác mạnh: baseline chỉ Owner/Admin của Circle mới dùng được (đặt trong config), kèm giới hạn tần suất chống spam (cooldown mỗi user/phòng theo config, enforce ở server); mention từng người cụ thể không giới hạn đối tượng nhưng server có trần số mention/tin.
- **Luồng chính:** gõ "@" trong ô soạn → danh sách thành viên Circle (lọc theo tên đang gõ) → chọn → token mention gắn vào nội dung → gửi → người được mention nhận badge mention riêng + thông báo ưu tiên.
- **Trạng thái UI:** mention picker (loading/không khớp kết quả), highlight mention trong bubble, badge mention trong danh sách phòng chat (CHT-02).
- **Edge cases:** mention người đã rời Circle (token hiển thị dạng tên thuần, không highlight, không thông báo); @all khi phòng đã mute phía người nhận (mention vẫn thắng mute theo BR-CHT-05, trừ khi user tắt mention toàn cục trong cài đặt thông báo); sửa tin có mention (mention mới phát sinh thông báo; mention bị gỡ không thu hồi thông báo đã gửi); spam @all liên tiếp (server từ chối trong thời gian cooldown, client hiển thị rõ thời gian chờ).
- **Acceptance criteria:**
  - [ ] Autocomplete mention chỉ chứa thành viên hiện tại của Circle
  - [ ] Người được mention thấy highlight trong bubble + badge mention tách khỏi badge chưa đọc thường
  - [ ] @all chỉ Owner/Admin dùng được (theo config), có cooldown chống spam enforce ở server
  - [ ] Mention vẫn thông báo khi phòng đã mute (BR-CHT-05), trừ khi user tắt mention toàn cục
- **Platform:** Mobile: mention picker dạng sheet phía trên bàn phím. Web: dropdown tại vị trí con trỏ. Logic dữ liệu giống nhau.
- **Scope:** Đề xuất bổ sung

### CHT-23 — Tin nhắn của người bị chặn trong phòng chat (block, PPL-08)

- **Hành vi:** khi user đã chặn một thành viên khác (theo PPL-08 — playbook 02), trong các phòng chat Circle mà cả hai cùng là thành viên, tin nhắn của người bị chặn hiển thị với người chặn dưới dạng placeholder "Tin nhắn của người bạn đã chặn" kèm tuỳ chọn "Hiển thị" để xem tạm nội dung của riêng tin đó. Block không làm thay đổi phòng chat đối với các thành viên còn lại, và người bị chặn không hề biết.
- **Luồng chính:** user thực hiện chặn (ở playbook 02) → mở phòng chat chung → mọi tin của người bị chặn (cả cũ lẫn mới) render thành placeholder → chạm "Hiển thị" để xem tạm một tin → rời phòng thì quay lại placeholder.
- **Trạng thái UI:** placeholder (không render nội dung/media/voice của tin bị chặn), revealed (nội dung hiển thị tạm trong phiên xem hiện tại).
- **Edge cases:** react/reply/ghim lên placeholder (chặn thao tác cho tới khi đã hiển thị tạm); tin của người bị chặn là tin cuối phòng (preview ở danh sách hiển thị placeholder, không lộ nội dung — theo CHT-02); mention từ người bị chặn (không phát badge/thông báo mention cho người chặn); bỏ chặn (mọi tin trở lại hiển thị bình thường ngay).
- **Acceptance criteria:**
  - [ ] Mọi tin của người bị chặn hiển thị placeholder phía người chặn — không lộ nội dung ở bất kỳ bề mặt nào (phòng chat, preview danh sách, thông báo đẩy, kết quả tìm kiếm)
  - [ ] "Hiển thị" chỉ mở tạm một tin trong phiên xem hiện tại, không bỏ chặn ngầm
  - [ ] Người bị chặn không nhận bất kỳ dấu hiệu nào về việc bị chặn từ phía chat
  - [ ] Bỏ chặn khôi phục hiển thị bình thường ngay lập tức
- **Platform:** Giống nhau
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### CHT-S01 — Forward tin nhắn

- **Hành vi:** chuyển tiếp một tin (text/media) sang phòng chat của Circle khác mà user là thành viên; tin được forward có nhãn "Đã chuyển tiếp". Không forward được tin đã thu hồi, voice chưa nghe xong vẫn forward được như file media thường.
- **Acceptance criteria:**
  - [ ] Màn hình chọn đích hiển thị danh sách Circle gần đây + tìm kiếm
  - [ ] Tin forward có nhãn rõ ràng ở phía nhận
  - [ ] Forward giữ nguyên loại và nội dung media gốc, không tải lên lại từ đầu nếu server hỗ trợ tham chiếu media

### CHT-S02 — Link preview

- **Hành vi:** tin text chứa URL hiển thị thẻ preview (tiêu đề, mô tả, ảnh đại diện) lấy từ metadata của trang đích, sinh phía server (tránh CORS và lộ IP client), có cache.
- **Acceptance criteria:**
  - [ ] URL đầu tiên trong tin hiển thị preview khi trang đích có metadata
  - [ ] Preview lỗi/không có metadata thì tin hiển thị bình thường, không lỗi UI
  - [ ] User tắt được link preview trong cài đặt (tuỳ chọn riêng tư)

### CHT-S03 — Nghe voice nâng cao: tốc độ & waveform

- **Hành vi:** phát voice với tốc độ 1x/1.5x/2x (nhớ lựa chọn), hiển thị waveform tĩnh của bản ghi, kéo (seek) trên waveform được.
- **Acceptance criteria:**
  - [ ] Đổi tốc độ ngay trong lúc đang phát, không phát lại từ đầu
  - [ ] Waveform render từ dữ liệu biên độ có sẵn kèm message, không tính lại mỗi lần render
  - [ ] Seek tới vị trí bất kỳ trên waveform phát đúng từ vị trí đó

### CHT-S04 — Gửi nhiều ảnh dạng album

- **Hành vi:** chọn nhiều ảnh trong một lần gửi: hiển thị dạng lưới album trong một bubble gộp (2-4 ảnh lưới, >4 hiển thị "+N"), mỗi ảnh vẫn mở full-screen và vuốt qua lại trong album.
- **Acceptance criteria:**
  - [ ] Nhiều ảnh gửi cùng lúc hiển thị dạng một album, không tách thành nhiều bubble rời
  - [ ] Từng ảnh trong album có trạng thái upload riêng, ảnh lỗi thử lại riêng không gửi lại cả album
  - [ ] Viewer full-screen chuyển qua lại giữa các ảnh trong album

### CHT-S05 — Offline queue trên mobile

- **Hành vi:** không có mạng vẫn soạn và "gửi" được: tin vào hàng đợi local (outbox bền vững qua SQLite/storage), tự động gửi theo đúng thứ tự khi có mạng trở lại, trạng thái hiển thị rõ "Đang chờ mạng".
- **Acceptance criteria:**
  - [ ] Gửi tin khi offline không báo lỗi cứng, tin nằm trong outbox kèm trạng thái chờ
  - [ ] Có mạng lại, outbox gửi tự động đúng thứ tự, không trùng nhờ `clientMessageId`
  - [ ] Kill app mở lại, outbox vẫn còn và tiếp tục gửi

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### CHT-W01 — Poll nhanh trong chat

Tạo bình chọn ngay trong hội thoại bằng một thao tác (câu hỏi + 2-4 lựa chọn), thành viên chạm để vote, kết quả cập nhật realtime và người tạo chốt poll để ghim kết quả. Giá trị: nhóm Circle ra quyết định nhanh (chọn quán, giờ đi chơi) mà không rời khỏi chat — đúng nhu cầu phối hợp nhóm của CIRCLE. **Effort: M**

### CHT-W02 — Tóm tắt hội thoại dài bằng AI

Khi user quay lại sau thời gian dài với hàng trăm tin chưa đọc, một nút "Tóm tắt" sinh bản tóm tắt ngắn: quyết định đã chốt, việc được giao, link/file quan trọng. Giá trị: giảm ma sát bắt kịp ngữ cảnh nhóm — điểm khác biệt rõ khi demo đồ án. Lưu ý bắt buộc: chỉ tóm tắt khi user chủ động bấm, nội dung gửi cho dịch vụ AI phải tuân chính sách dữ liệu của dự án. **Effort: L**

### CHT-W03 — Dịch tin nhắn tại chỗ

Long-press một tin → "Dịch": hiển thị bản dịch ngay dưới bubble (giữ nguyên bản gốc, có nút ẩn bản dịch), ngôn ngữ đích theo cài đặt ngôn ngữ của app. Giá trị: nhóm có thành viên dùng ngôn ngữ khác nhau vẫn trao đổi liền mạch; đồng thời demo khả năng tích hợp dịch vụ dịch. **Effort: M**

## 5. Business rules & invariants

- **BR-CHT-01 (Group-first — rule số 1 của module):** Chat CHỈ tồn tại dưới dạng phòng chat nhóm của Circle. Toàn hệ thống không có DM/chat 1-1 ở bất kỳ bề mặt nào (hồ sơ người dùng, khoảnh khắc, danh sách thành viên, kết quả tìm kiếm... đều không có điểm vào nhắn tin riêng). Mỗi Circle có đúng một phòng chat chính (baseline) và thành viên phòng chat luôn trùng thành viên Circle — không tồn tại phòng chat "mồ côi" không thuộc Circle nào, cũng không tồn tại conversation nào ngoài phòng chat của Circle. Danh sách chat = danh sách Circle sắp xếp theo hoạt động gần nhất (CHT-02).
- **BR-CHT-02:** Chỉ người gửi mới sửa/thu hồi được tin của mình; moderator/chủ Circle thu hồi được tin thành viên trong group của Circle mình quản lý; không ai sửa được tin của người khác.
- **BR-CHT-03:** Tin đã thu hồi không thể khôi phục nội dung từ bất kỳ client nào; dữ liệu phía server xử lý theo chính sách lưu trữ của dự án (xoá cứng hoặc xoá mềm có đánh dấu — quyết định một lần, ghi vào SRS, áp dụng nhất quán).
- **BR-CHT-04:** Thứ tự tin nhắn trong một phòng chat được quyết định bởi sequence phía server; client không tự sắp xếp lại theo đồng hồ thiết bị.
- **BR-CHT-05:** Mute hội thoại không áp dụng cho tin nhắn có mention trực tiếp tới user — mention vẫn thông báo (trừ khi user tắt toàn cục trong cài đặt thông báo).
- **BR-CHT-06:** Giới hạn dung lượng file, giới hạn ký tự tin nhắn, bộ emoji reaction, ngưỡng gộp tin hệ thống là các hằng số cấu hình dùng chung cho web và mobile — không hardcode rải rác trong code từng nền tảng.
- **BR-CHT-07:** Mọi message đều mang `clientMessageId` do client sinh khi gửi; server dedupe theo khoá này — retry ở bất kỳ lớp nào cũng không tạo tin trùng.
- **BR-CHT-08:** Quyết định về sửa tin nhắn: không đặt giới hạn thời gian sửa ở baseline, nhưng mọi lần sửa đều để lại dấu vết (nhãn + lịch sử sửa tối thiểu bản gần nhất).

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `ChatRoom` (id, circleId — **duy nhất**: một Circle ↔ một phòng chat chính, createdAt, lastMessageAt)
- `ChatRoomMember` (roomId, userId, lastReadMessageId, mutedUntil) — tư cách thành viên suy ra từ Circle membership; bảng này chỉ giữ trạng thái đọc/mute/draft theo user
- `Message` (id, roomId, senderId, clientMessageId, type: text|image|video|file|voice|system, content, mediaId?, replyToId?, mentionedUserIds?, isEdited, recalledAt?, createdAt, serverSeq)
- `MessageReaction` (messageId, userId, emoji)
- `PinnedMessage` (roomId, messageId, pinnedBy, pinnedAt)
- `MessageReadState` — suy ra từ `lastReadMessageId` của ChatRoomMember, kèm mốc seen-by theo message khi cần chi tiết (CHT-16)
- `MediaAsset` (id, uploaderId, kind, url, size, mime, duration?, waveform?)
- **Không tồn tại** entity `Conversation` / `DirectMessage` — mô hình dữ liệu không có khái niệm hội thoại 1-1 (BR-CHT-01).

**Endpoint REST gợi ý:**
- `GET /chat-rooms` (danh sách phòng = Circle của user + preview + unread/mention count), `GET /chat-rooms/:id/messages?cursor=` (phân trang)
- `POST /chat-rooms/:id/messages` (gửi, kèm `clientMessageId`), `PATCH /messages/:id` (sửa), `POST /messages/:id/recall`, `DELETE /messages/:id/for-me`
- `PUT /messages/:id/reactions/:emoji` / `DELETE ...` (react/gỡ), `POST /chat-rooms/:id/pins/:messageId` / `DELETE ...`
- `POST /chat-rooms/:id/read` (đánh dấu đã đọc tới messageId), `PATCH /chat-rooms/:id/mute`, `GET /chat-rooms/:id/messages/search?q=`

**Event realtime (WebSocket) gợi ý:**
- Client → Server: `message:send`, `typing:start` / `typing:stop`, `message:read`
- Server → Client: `message:new`, `message:updated` (sửa), `message:recalled`, `message:reaction`, `message:delivered` / `message:seen`, `mention:new`, `typing`, `pin:added` / `pin:removed`, `room:updated` (preview/badge)

## 7. Cross-cutting riêng cho module

(Ngoài gate chung trong cross-cutting-gate.md)

- **Thời gian hiển thị:** mọi timestamp hiển thị theo múi giờ và ngôn ngữ (locale) của user; phân tách ngày trong lịch sử ("Hôm nay", "Hôm qua", ngày cụ thể) theo locale.
- **Truy cập media:** URL media trong chat phải là URL có chữ ký/hết hạn hoặc qua endpoint kiểm tra quyền thành viên Circle của phòng chat — không dùng URL public vĩnh viễn cho nội dung trong Circle.
- **Hiệu năng danh sách:** danh sách tin bắt buộc ảo hoá (virtualized list) cả web và mobile; ảnh trong bubble tải bản thumbnail trước, bản gốc chỉ tải khi mở viewer.
- **Đồng bộ đa thiết bị:** read state, mute, xoá phía mình, draft (nếu sau này đồng bộ) phải nhất quán theo user chứ không theo thiết bị, ngoại trừ draft baseline là local (BR ghi rõ ở CHT-18).
- **Âm thanh thông báo trong app:** tin mới khi đang mở đúng hội thoại đó không phát âm thanh/push trùng.

## 8. Anti-patterns

- Tạo DM/chat 1-1 từ bất kỳ điểm vào nào (nút "nhắn tin" trên profile, reply riêng từ khoảnh khắc, nhắn riêng từ danh sách thành viên) — vi phạm trực tiếp BR-CHT-01 group-first. Nhu cầu "nói riêng với một người trong nhóm" phải giải quyết ngay trong phòng chat Circle bằng @mention/quote, không mở kênh riêng.
- Gửi tin bằng REST thuần + polling thay vì WebSocket đã có của hệ thống, gây độ trễ và tải server vô ích.
- Dùng offset pagination cho lịch sử chat → trùng/lọt tin khi có tin mới chèn vào; bắt buộc cursor theo sequence/id.
- Tin failed bị xoá khỏi UI và bắt user soạn lại từ đầu — mất nội dung người dùng là lỗi nghiêm trọng nhất của chat.
- Retry gửi tin mà không có `clientMessageId` dedupe → tin trùng khi mạng chập chờn.
- React/sửa/thu hồi chỉ cập nhật local của người thực hiện, không broadcast realtime → các phía thấy dữ liệu khác nhau.
- Kiểm tra quyền (thành viên Circle, moderator) chỉ ở client; server phải kiểm tra lại mọi thao tác quản trị.
- Lưu toàn bộ lịch sử chat vào state toàn cục không giới hạn → phình bộ nhớ trên mobile với hội thoại dài.
- Hiển thị trạng thái `seen` trong group bằng một icon duy nhất mà không có màn hình chi tiết seen-by → user không biết ai đã xem.
- Để giới hạn file/ký tự/emoji reaction hardcode khác nhau giữa web và mobile.

## 9. Self-audit checklist cho agent

Trước khi báo hoàn thành module Chat, agent tự kiểm đủ các mục Tier MUST:

- [ ] CHT-01: mỗi Circle đúng một phòng chat chính, thành viên đồng bộ Circle; không tồn tại hội thoại 1-1 ở bất kỳ bề mặt nào (BR-CHT-01)
- [ ] CHT-02: danh sách phòng chat = danh sách Circle theo hoạt động, đúng preview/badge chưa đọc/badge mention, chạy offline từ cache
- [ ] CHT-03: text có đủ vòng đời sending/sent/delivered/seen, failed gửi lại được, không trùng
- [ ] CHT-04 → CHT-06: ảnh/video/file có preview, giới hạn cấu hình, lỗi rõ ràng
- [ ] CHT-07: voice ghi/nghe lại/huỷ được, xử lý quyền micro và gián đoạn
- [ ] CHT-08: pipeline upload có progress/huỷ/thử lại, không kẹt trạng thái sending
- [ ] CHT-09: sửa tin có nhãn "đã chỉnh sửa" và xem được bản trước
- [ ] CHT-10: thu hồi ra placeholder ở mọi phía, không tương tác được lên placeholder
- [ ] CHT-11: xoá phía mình không ảnh hưởng user khác, đồng bộ đa thiết bị
- [ ] CHT-12: reply có quote, chạm quote nhảy đúng tin gốc kèm highlight
- [ ] CHT-13: reaction đúng bộ emoji cấu hình chung, xem được danh sách người react, double-tap mobile
- [ ] CHT-14: ghim/bỏ ghim realtime, pinned bar + danh sách ghim nhảy đúng vị trí (lưu ý: cần duyệt bổ sung scope)
- [ ] CHT-15: typing indicator có throttle và tự hết hạn
- [ ] CHT-16: seen-by trong group có màn hình chi tiết đã xem/chưa xem
- [ ] CHT-17: tìm kiếm trong hội thoại nhảy đúng vị trí, loại trừ tin thu hồi/xoá
- [ ] CHT-18: draft lưu/khôi phục theo hội thoại, có chỉ dấu trong danh sách
- [ ] CHT-19: mute theo thời lượng, mention vẫn thông báo theo BR-CHT-05
- [ ] CHT-20: tin hệ thống đủ sự kiện vòng đời Circle + nhật ký cuộc gọi NHÓM (không có nhật ký cuộc gọi 1-1), không react/reply được
- [ ] CHT-21: phân trang cursor, giữ vị trí cuộn, nhảy-tới-tin dùng chung một cơ chế
- [ ] CHT-22: mention @thành viên + @all (giới hạn quyền Owner/Admin + cooldown chống spam), badge mention tách khỏi badge chưa đọc
- [ ] CHT-23: tin của người bị chặn (PPL-08) hiển thị placeholder phía người chặn, không lộ nội dung ở mọi bề mặt
- [ ] Toàn bộ giới hạn/bộ emoji/ngưỡng lấy từ config chung, không hardcode lệch giữa web và mobile

## Changelog

- 2026-10-25 — Tạo bản đầu: playbook Chat đầy đủ Tier MUST (CHT-01 → CHT-21), SHOULD (5), WOW (3).
- 2026-10-25 — Chỉnh theo triết lý group-first: **bỏ toàn bộ chat 1-1/DM** — chat chỉ còn là chat nhóm của Circle (BR-CHT-01 viết lại thành rule số 1; CHT-01/CHT-02 đổi spec; CHT-03/CHT-16 chuyển seen sang ngữ cảnh nhóm; dữ liệu/API chuyển `Conversation` → `ChatRoom` gắn duy nhất `circleId`); bổ sung CHT-22 (@mention + @all có giới hạn quyền/cooldown) và CHT-23 (placeholder tin của người bị chặn, phối hợp PPL-08 ở playbook 02); tin hệ thống chỉ ghi nhật ký cuộc gọi nhóm — cuộc gọi 1-1 không ghi vào chat nhóm; trả lời khoảnh khắc đi vào phòng chat Circle (phối hợp MOM-06).
