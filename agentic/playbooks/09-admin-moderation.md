# Playbook — Admin & Moderation (Management Website)

> Website quản trị và kiểm duyệt nội dung — đối chiếu PROJECT_GOD.md §2.2 mục "Applications": chỉ ghi "Management Website cho Admin", không có chi tiết tính năng; toàn bộ nội dung playbook này là baseline tối thiểu cho một mạng xã hội có nội dung do người dùng tạo (UGC), đánh dấu "Đề xuất bổ sung".

## 1. Tổng quan

- **Mục đích:** cho đội vận hành (chính là nhóm phát triển trong bối cảnh đồ án) khả năng tối thiểu để giữ nền tảng an toàn và vận hành được: xem bức tranh tổng quan, quản lý tài khoản, xử lý báo cáo vi phạm, gỡ nội dung không phù hợp, và truy vết mọi hành động quản trị.
- **Vì sao đây là baseline bắt buộc dù §2.2 không chi tiết:** CIRCLE cho phép người dùng tạo nội dung công khai trong nhóm (khoảnh khắc, tin nhắn, nội dung ẩn danh — xem `07-circle-collaboration.md`). Một hệ thống UGC không có đường xử lý báo cáo và gỡ nội dung là hệ thống chưa hoàn chỉnh về mặt vận hành và an toàn; playbook này định nghĩa mức tối thiểu đó, không mở rộng thành một hệ thống quản trị doanh nghiệp.
- **Actors:** Admin — vai trò quản trị **duy nhất** của hệ thống (toàn quyền quản trị, gồm cả quản lý các tài khoản admin khác và truy xuất danh tính nội dung ẩn danh theo quy trình ADM-06); User — người dùng thường (không có bất kỳ quyền quản trị nào); hệ thống (gắn cờ tự động theo ngưỡng báo cáo, ghi audit log). Toàn hệ thống chỉ có đúng 2 vai trò toàn cục: **User / Admin** — quyết định đơn giản hoá của chủ dự án (2026-10-25): CIRCLE là mạng xã hội nhóm, không phải nền tảng thương mại điện tử, nên không tách Super Admin / Admin thường.
- **Phạm vi giao diện:** chỉ Web (management website tách riêng khỏi web app người dùng). Không làm admin trên mobile app.
- **Quan hệ với module khác:**
  - **Account:** khoá/mở khoá tài khoản tác động trực tiếp vào khả năng đăng nhập của user.
  - **Circle collaboration (`07-circle-collaboration.md`):** hàng đợi báo cáo nhận các báo cáo nội dung ẩn danh; quyết định truy xuất danh tính người gửi ẩn danh vì lý do an toàn chỉ thực hiện qua quy trình của playbook này và có audit log.
  - **Notification (`08-notification.md`):** kết quả xử lý (cảnh cáo, khoá tài khoản, kết quả báo cáo) được thông báo cho user liên quan qua kênh Hệ thống.
  - **Chat / Realtime sharing:** tin nhắn và khoảnh khắc là đối tượng bị báo cáo và bị gỡ.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### ADM-01 — Đăng nhập admin tách biệt & mô hình 2 vai trò (User / Admin)

- **Hành vi:** admin đăng nhập qua trang đăng nhập riêng của management website (đường dẫn và bề mặt tách khỏi luồng đăng nhập user thường). Mô hình quyền của toàn hệ thống chỉ gồm 2 vai trò: **User** (người dùng thường, không có quyền quản trị) và **Admin** — vai trò quản trị duy nhất, gộp toàn bộ quyền: xem dashboard, quản lý user, xử lý báo cáo, quản lý nội dung, tạo/khoá tài khoản admin, và truy xuất danh tính nội dung ẩn danh theo quy trình ADM-06. Không tồn tại tầng quyền trung gian (không có "admin thường" bị giới hạn một phần). Tài khoản admin là tài khoản riêng có vai trò Admin rõ ràng, không dùng chung tài khoản user thường để "kiêm" quyền admin một cách tuỳ tiện.
- **Luồng chính:** Admin mở trang quản trị → đăng nhập bằng tài khoản admin → hệ thống kiểm tra vai trò (chỉ tài khoản có vai trò Admin mới vào được) → hiển thị toàn bộ chức năng quản trị → mọi API quản trị kiểm tra lại vai trò ở server.
- **Trạng thái UI:** error khi đăng nhập sai (thông báo chung chung, không tiết lộ tài khoản có tồn tại hay không); trạng thái bị khoá đăng nhập tạm sau nhiều lần sai liên tiếp; màn hình "Không có quyền" khi tài khoản không có vai trò Admin truy cập trực tiếp bằng URL.
- **Edge cases:** user thường đăng nhập nhầm vào trang admin → từ chối với thông báo trung tính; phiên admin hết hạn giữa thao tác → yêu cầu đăng nhập lại, không thực thi dở hành động; Admin tự khoá hoặc tự gỡ vai trò Admin của chính mình khi đang là Admin active cuối cùng → chặn (tránh việc hệ thống mất toàn bộ quyền quản trị — luôn tồn tại ít nhất một Admin đang hoạt động).
- **Acceptance criteria:**
  - [ ] Không tài khoản user thường nào gọi được bất kỳ API quản trị nào (kiểm chứng bằng test gọi API trực tiếp, không qua UI)
  - [ ] Vai trò Admin được enforce ở server cho mọi endpoint quản trị; ẩn menu ở client chỉ là hiển thị
  - [ ] Hệ thống luôn có ít nhất một Admin đang hoạt động (không khoá/xoá/gỡ vai trò được Admin cuối cùng)
  - [ ] Đăng nhập admin có chống brute-force (giới hạn số lần thử / khoá tạm)
- **Platform:** Chỉ Web (management website). "Giống nhau" không áp dụng — không có bản mobile.
- **Scope:** Đề xuất bổ sung

### ADM-02 — Dashboard số liệu tổng quan

- **Hành vi:** trang chủ quản trị hiển thị bức tranh vận hành tại một thời điểm: tổng số người dùng, tổng số Circle, tổng số khoảnh khắc đã chia sẻ, số báo cáo đang chờ xử lý (và phân rã theo trạng thái nếu có), kèm số tài khoản đang bị khoá và số nội dung đang bị gắn cờ. Các chỉ số là số đếm mô tả từ dữ liệu thật của hệ thống — playbook này không đặt ra con số kỳ vọng nào.
- **Luồng chính:** Admin đăng nhập → dashboard tải các thẻ chỉ số + danh sách rút gọn "báo cáo chờ xử lý mới nhất" → bấm vào thẻ/hàng chuyển tới màn hình chi tiết tương ứng (quản lý user, hàng đợi báo cáo).
- **Trạng thái UI:** loading skeleton cho từng thẻ độc lập (một chỉ số lỗi không làm trắng cả trang); trạng thái lỗi từng thẻ kèm nút thử lại; thời điểm cập nhật dữ liệu hiển thị rõ ("Cập nhật lúc...") để admin biết số liệu mới tới đâu.
- **Edge cases:** hệ thống mới khởi tạo chưa có dữ liệu → hiển thị 0 một cách rõ ràng (phân biệt "0 thật" với "lỗi tải"); chỉ số báo cáo chờ xử lý phải khớp đúng số vụ việc đang mở trong hàng đợi ADM-04 (cùng một truy vấn nguồn, không tính hai cách).
- **Acceptance criteria:**
  - [ ] Mọi chỉ số trên dashboard lấy từ dữ liệu thật tại thời điểm tải, hiển thị kèm mốc thời gian cập nhật
  - [ ] Số "báo cáo chờ xử lý" trên dashboard luôn khớp số vụ việc mở trong hàng đợi báo cáo
  - [ ] Bấm vào từng chỉ số điều hướng đúng tới màn hình quản lý tương ứng
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-03 — Quản lý người dùng: tìm kiếm, xem hồ sơ, khoá/mở khoá kèm lý do

- **Hành vi:** admin tìm kiếm người dùng (theo tên hiển thị, email, số điện thoại hoặc id), xem hồ sơ tổng hợp (thông tin cơ bản, Circle đang tham gia, trạng thái tài khoản, lịch sử bị xử lý nếu có), và khoá hoặc mở khoá tài khoản — mọi lần khoá bắt buộc nhập lý do.
- **Luồng chính:** Trang Người dùng → nhập từ khoá tìm kiếm → danh sách kết quả phân trang → mở chi tiết user → "Khoá tài khoản" → nhập lý do (bắt buộc) → xác nhận hai bước (ADM-08) → tài khoản bị khoá: user bị đăng xuất khỏi mọi phiên, không đăng nhập lại được, nhận thông báo qua kênh Hệ thống kèm lý do (theo `08-notification.md`). Mở khoá: "Mở khoá" → ghi lý do mở khoá → tài khoản hoạt động lại.
- **Trạng thái UI:** badge trạng thái tài khoản (Đang hoạt động / Đã khoá) nhất quán ở danh sách và chi tiết; lịch sử khoá/mở khoá hiển thị trong trang chi tiết (ai khoá, khi nào, lý do); empty state khi tìm không thấy; error khi thao tác thất bại (không đổi trạng thái hiển thị lạc quan sai sự thật).
- **Edge cases:** khoá user đang là Owner duy nhất của một Circle → cho phép khoá nhưng cảnh báo tác động tới Circle đó (xử lý ownership thuộc playbook Circle, admin site chỉ cảnh báo); khoá trùng (hai admin cùng khoá một user) → thao tác thứ hai nhận trạng thái đã khoá, không tạo bản ghi trùng; tài khoản admin không xuất hiện trong màn hình quản lý user thường — quản lý tài khoản admin nằm ở luồng riêng trong admin site mà mọi Admin đều truy cập được (vẫn áp dụng chốt chặn: không khoá/gỡ vai trò được Admin active cuối cùng); tìm kiếm không phân biệt hoa/thường và hỗ trợ tìm gần đúng theo tên hiển thị tiếng Việt (có dấu/không dấu).
- **Acceptance criteria:**
  - [ ] Khoá tài khoản mà không nhập lý do thì bị chặn ở cả client và server
  - [ ] User bị khoá bị vô hiệu mọi phiên đăng nhập hiện có và không tạo được phiên mới
  - [ ] Mọi lần khoá/mở khoá đều có bản ghi: người thực hiện, thời điểm, lý do — xem được trong chi tiết user và audit log (ADM-07)
  - [ ] Mở khoá khôi phục đầy đủ khả năng sử dụng, không mất dữ liệu của user
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-04 — Hàng đợi báo cáo (report queue)

- **Hành vi:** nơi tập trung mọi báo cáo vi phạm từ người dùng, bao phủ các loại đối tượng: **người dùng (user), khoảnh khắc (moment), tin nhắn (message), nội dung ẩn danh (anonymous post), Circle**. Mỗi vụ việc hiển thị: đối tượng bị báo cáo kèm ngữ cảnh xem được nội dung gốc, lý do báo cáo, người báo cáo, thời gian, số lần đối tượng bị báo cáo, và trạng thái xử lý.
- **Luồng chính:** Admin mở Hàng đợi → mặc định sắp xếp vụ chờ xử lý trước, cũ nhất trước → lọc theo loại đối tượng / trạng thái / mức độ → mở một vụ việc: xem nội dung bị báo cáo trong ngữ cảnh (tin nhắn kèm đoạn hội thoại xung quanh, khoảnh khắc kèm Circle chứa nó, nội dung ẩn danh chỉ gồm nội dung và metadata không định danh) → chọn hành động xử lý (ADM-05) → vụ việc chuyển trạng thái, ghi vào audit log.
- **Trạng thái UI:** badge số vụ đang chờ trên menu; empty state "Không còn báo cáo chờ xử lý"; trạng thái loading khi mở ngữ cảnh nội dung nặng (ảnh/video); đánh dấu vụ đang được một admin khác mở xử lý để tránh hai người xử lý trùng (cảnh báo mềm, không khoá cứng).
- **Edge cases:** nội dung bị báo cáo đã bị tác giả tự xoá trước khi admin xử lý → vụ việc vẫn hiển thị với trạng thái "nội dung đã bị xoá bởi tác giả" kèm bản chụp/dữ liệu lưu tại thời điểm báo cáo (hệ thống phải giữ snapshot tối thiểu của nội dung bị báo cáo để việc xử lý còn căn cứ); cùng một đối tượng bị nhiều người báo cáo → gộp thành một vụ việc chính với nhiều người báo cáo, không tạo nhiều vụ trùng; báo cáo nội dung ẩn danh: hàng đợi KHÔNG hiển thị danh tính người gửi (xem ADM-06); người báo cáo rút báo cáo → vụ việc ghi nhận nhưng không tự đóng nếu vẫn còn người báo cáo khác.
- **Acceptance criteria:**
  - [ ] Cả 5 loại đối tượng (user / moment / message / anonymous post / Circle) đều vào được cùng một hàng đợi với cùng bộ trạng thái
  - [ ] Mở vụ việc luôn xem được nội dung gốc hoặc snapshot tại thời điểm báo cáo, kể cả khi nội dung đã bị xoá sau đó
  - [ ] Nhiều báo cáo cho cùng một đối tượng được gộp một vụ việc, giữ đủ danh sách người báo cáo
  - [ ] Lọc theo loại đối tượng và trạng thái hoạt động đúng với phân trang
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-05 — Hành động xử lý và trạng thái vụ việc

- **Hành vi:** tập hành động xử lý cố định áp cho một vụ việc: **Bỏ qua** (báo cáo không có căn cứ, đóng vụ), **Gỡ nội dung** (xoá/ẩn nội dung vi phạm khỏi mọi bề mặt hiển thị), **Cảnh cáo người dùng** (gửi cảnh cáo chính thức qua thông báo hệ thống, ghi vào hồ sơ xử lý của user), **Khoá tài khoản** (chuyển sang luồng ADM-03 kèm lý do dẫn chiếu vụ việc). Trạng thái vụ việc: Mới → Đang xử lý → Đã xử lý (kèm hành động đã chọn) / Đã bỏ qua. Mọi quyết định đều ghi người xử lý, thời điểm, hành động và ghi chú.
- **Luồng chính:** Admin mở vụ việc → (tự động hoặc thủ công) chuyển Đang xử lý → xem xét ngữ cảnh → chọn hành động → nếu là hành động nặng (gỡ nội dung hàng loạt, khoá tài khoản): qua xác nhận hai bước ADM-08 → thực thi → thông báo kết quả cho người bị xử lý và (mặc định) cho người báo cáo là vụ việc đã được xử lý → đóng vụ.
- **Trạng thái UI:** trạng thái vụ việc hiển thị dạng badge nhất quán trong hàng đợi và chi tiết; hành động đã thực thi không bấm lại được (chống thực thi trùng); thông báo thành công/thất bại rõ ràng sau mỗi hành động — thất bại thì vụ việc giữ nguyên trạng thái để thử lại.
- **Edge cases:** gỡ nội dung đã bị gỡ → idempotent; cảnh cáo user đã bị khoá → vẫn ghi nhận nhưng đánh dấu không gửi được thông báo ngay; admin chọn Khoá tài khoản từ vụ việc → lý do khoá tự dẫn chiếu id vụ việc để truy vết hai chiều; một vụ việc liên quan nhiều đối tượng (vd báo cáo Circle kèm nhiều khoảnh khắc) → cho phép xử lý từng đối tượng trong cùng vụ, vụ chỉ đóng khi mọi đối tượng đã có quyết định.
- **Acceptance criteria:**
  - [ ] Không vụ việc nào đóng mà không có quyết định thuộc tập hành động cố định và danh tính người quyết định
  - [ ] Gỡ nội dung làm nội dung biến mất khỏi mọi bề mặt người dùng (feed, album, tìm kiếm) nhưng vẫn xem lại được trong khu vực quản trị phục vụ khiếu nại/audit
  - [ ] Người bị cảnh cáo/khoá nhận được thông báo hệ thống; người báo cáo nhận được xác nhận vụ việc đã xử lý (không lộ chi tiết hình phạt nếu chính sách không cho phép — chọn một rule và áp nhất quán)
  - [ ] Mọi hành động xử lý đều xuất hiện trong audit log (ADM-07)
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-06 — Quản lý nội dung bị gắn cờ và quy trình truy xuất danh tính ẩn danh

- **Hành vi:** hai phần. (1) **Nội dung bị gắn cờ (flagged content):** danh sách nội dung bị hệ thống tự gắn cờ (đạt ngưỡng số báo cáo theo `07-circle-collaboration.md`, hoặc bị gỡ tự động tạm thời) và nội dung đã bị gỡ — admin xem lại, khôi phục nếu gỡ nhầm, hoặc xác nhận gỡ vĩnh viễn khỏi hiển thị. (2) **Truy xuất danh tính nội dung ẩn danh:** mặc định KHÔNG ai — kể cả Admin — xem được danh tính người gửi nội dung ẩn danh trong luồng thường ngày. Chỉ khi một vụ việc được đánh dấu vi phạm nghiêm trọng (theo tiêu chí ghi rõ: đe doạ an toàn, quấy rối có mục tiêu lặp lại, nội dung bất hợp pháp) thì Admin mới mở được danh tính của đúng nội dung đó, sau xác nhận hai bước và nhập lý do; lần truy xuất bị ghi audit log bất biến.
- **Luồng chính:** Trang Nội dung bị gắn cờ → lọc theo trạng thái (tạm ẩn / đã gỡ / đã khôi phục) → xem chi tiết kèm lịch sử báo cáo → Khôi phục hoặc Giữ gỡ. Truy xuất danh tính: từ vụ việc nghiêm trọng → Admin chọn "Truy xuất danh tính vì lý do an toàn" → nhập lý do + xác nhận hai bước → hệ thống hiển thị danh tính cho đúng vụ việc đó và ghi log.
- **Trạng thái UI:** nội dung tạm ẩn/đã gỡ phân biệt rõ bằng badge; hành động khôi phục có xác nhận; khu vực danh tính ẩn danh mặc định hiển thị "Ẩn danh — chưa truy xuất", không tải sẵn dữ liệu danh tính về client.
- **Edge cases:** tài khoản không có vai trò Admin cố truy xuất danh tính qua URL/API trực tiếp → bị chặn ở server và lần cố gắng bị ghi log; Admin truy xuất mà bỏ qua bước nhập lý do hoặc xác nhận hai bước → server từ chối; khôi phục nội dung mà Circle chứa nó đã bị xoá → nội dung không tái xuất hiện, hệ thống báo rõ; nội dung bị gắn cờ tự động nhưng admin xác nhận không vi phạm → khôi phục và ghi nhận để tránh gắn cờ lại cùng ngưỡng cho cùng nội dung.
- **Acceptance criteria:**
  - [ ] API quản trị thông thường không trả về danh tính người gửi nội dung ẩn danh trong bất kỳ response nào (kiểm chứng bằng test API theo từng vai trò)
  - [ ] Truy xuất danh tính chỉ khả thi với vai trò Admin, đúng một nội dung/vụ việc mỗi lần, bắt buộc lý do + xác nhận hai bước, và 100% lần truy xuất có audit log
  - [ ] Nội dung bị gỡ nhầm khôi phục lại được đầy đủ trạng thái hiển thị ban đầu
  - [ ] Mọi nội dung bị gắn cờ tự động đều xuất hiện trong danh sách này — không tồn tại nội dung bị ẩn khỏi người dùng mà admin không nhìn thấy ở đâu cả
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-07 — Audit log bất biến cho mọi hành động admin

- **Hành vi:** mọi hành động quản trị đều được ghi log: ai (admin id + vai trò), làm gì (loại hành động + đối tượng), khi nào (timestamp server), kèm ngữ cảnh tối thiểu (lý do, id vụ việc liên quan, giá trị trước/sau với hành động thay đổi trạng thái). Log chỉ ghi thêm (append-only): không có chức năng sửa hay xoá log ở bất kỳ vai trò nào, kể cả Admin. Admin tra cứu log theo người thực hiện, loại hành động, đối tượng, khoảng thời gian.
- **Luồng chính:** Mọi thao tác ở ADM-03/05/06/08 tự động ghi log tại server trong cùng giao dịch với hành động → trang Audit log cho phép lọc và xem chi tiết từng dòng → xuất log (liên kết ADM-S02) khi cần đối chiếu.
- **Trạng thái UI:** danh sách log phân trang, mới nhất trước; chi tiết một dòng log hiển thị đầy đủ trường; empty state theo bộ lọc; không tồn tại nút sửa/xoá trong giao diện.
- **Edge cases:** hành động thất bại giữa chừng (đã ghi log nhưng thao tác lỗi) → log ghi cả kết quả thất bại, không ghi log "thành công giả"; đồng hồ hệ thống là nguồn thời gian duy nhất (không nhận timestamp từ client); log chứa dữ liệu nhạy cảm tối thiểu cần thiết — không ghi nội dung tin nhắn đầy đủ vào log, chỉ ghi id đối tượng.
- **Acceptance criteria:**
  - [ ] 100% hành động thuộc các nhóm: khoá/mở khoá user, xử lý báo cáo, gỡ/khôi phục nội dung, truy xuất danh tính, đăng nhập admin, thay đổi tài khoản admin — đều có dòng log tương ứng (đối chiếu tự động được bằng test)
  - [ ] Không tồn tại API/UI nào sửa hoặc xoá được bản ghi audit log ở mọi vai trò
  - [ ] Lọc log theo admin, loại hành động và khoảng thời gian trả kết quả đúng và phân trang được
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

### ADM-08 — Xác nhận hai bước cho hành động nặng

- **Hành vi:** các hành động có tác động lớn hoặc khó đảo ngược bắt buộc qua xác nhận hai bước: (bước 1) dialog tóm tắt chính xác hành động và đối tượng bị ảnh hưởng, (bước 2) admin nhập lại lý do hoặc gõ xác nhận (vd nhập chữ "KHOÁ" / nhập lại tên đối tượng) mới thực thi được. Nhóm hành động nặng tối thiểu: khoá tài khoản, gỡ nội dung hàng loạt (từ 2 nội dung trở lên trong một thao tác), truy xuất danh tính nội dung ẩn danh, khoá/vô hiệu tài khoản admin.
- **Luồng chính:** Admin chọn hành động nặng → dialog bước 1 hiển thị tóm tắt (hành động gì, lên đối tượng nào, hệ quả) → bước 2 yêu cầu nhập lý do/gõ xác nhận → nút thực thi chỉ bật khi nhập đúng → thực thi → ghi audit log → thông báo kết quả.
- **Trạng thái UI:** nút thực thi bị vô hiệu cho tới khi điều kiện xác nhận thỏa; dialog không đóng được bằng thao tác lỡ tay (bấm ra ngoài) ở bước 2; trạng thái đang thực thi chống bấm trùng.
- **Edge cases:** admin mở dialog rồi để lâu tới hết phiên → thực thi bị chặn, yêu cầu đăng nhập lại, không thực thi "hộ"; xác nhận hợp lệ nhưng đối tượng đã thay đổi trạng thái trong lúc chờ (user đã bị khoá bởi admin khác) → kiểm tra lại trạng thái tại thời điểm thực thi và báo rõ thay vì thực thi mù; không áp dụng vòng lặp xác nhận cho hành động nhẹ (bỏ qua báo cáo, đánh dấu đang xử lý) để tránh mệt mỏi xác nhận (confirmation fatigue) làm admin bấm qua loa cả với hành động nặng.
- **Acceptance criteria:**
  - [ ] Không hành động nặng nào thực thi được nếu thiếu bước xác nhận và lý do (kiểm chứng bằng gọi API trực tiếp bỏ qua UI — server vẫn chặn vì thiếu trường lý do/xác nhận)
  - [ ] Tóm tắt trong dialog khớp đúng đối tượng và hệ quả thật sẽ thực thi (đúng id đối tượng, đúng số lượng với gỡ hàng loạt)
  - [ ] Hành động nhẹ không bị áp xác nhận hai bước
- **Platform:** Chỉ Web.
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### ADM-S01 — Thống kê tăng trưởng theo tuần

- **Hành vi:** biểu đồ và bảng số liệu theo tuần: người dùng mới, Circle mới, khoảnh khắc mới, số báo cáo nhận được và đã xử lý — để nhóm theo dõi sức khoẻ nền tảng theo thời gian thay vì chỉ nhìn tổng tích luỹ.
- **Acceptance criteria:**
  - [ ] Số liệu theo tuần khớp với tổng tích luỹ trên dashboard khi cộng dồn (cùng định nghĩa chỉ số)
  - [ ] Chọn được khoảng tuần tuỳ ý và biểu đồ hiển thị đúng dữ liệu của khoảng đó

### ADM-S02 — Xuất báo cáo CSV

- **Hành vi:** xuất dữ liệu quản trị ra CSV: danh sách người dùng (lọc theo trạng thái), hàng đợi báo cáo theo khoảng thời gian, và audit log theo bộ lọc hiện tại — phục vụ báo cáo đồ án và đối chiếu ngoài hệ thống.
- **Acceptance criteria:**
  - [ ] File CSV mở đúng bằng Excel/Google Sheets (encoding UTF-8 có BOM, tiêu đề cột rõ ràng, tiếng Việt không lỗi font)
  - [ ] Dữ liệu xuất ra tôn trọng đúng bộ lọc đang áp dụng; chỉ tài khoản có vai trò Admin mới xuất được
  - [ ] Mọi lần xuất audit log đều tự nó được ghi vào audit log

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### ADM-W01 — Gợi ý ưu tiên hàng đợi báo cáo theo mức độ nghiêm trọng

Hệ thống tự chấm điểm ưu tiên cho từng vụ việc trong hàng đợi dựa trên tín hiệu khách quan: số người báo cáo, tốc độ báo cáo tăng đột biến, lịch sử vi phạm của đối tượng, loại nội dung (nội dung ẩn danh bị báo cáo quấy rối xếp cao hơn tranh chấp thông thường) — và gợi ý thứ tự xử lý kèm lý do gợi ý hiển thị rõ. Giá trị: khi hàng đợi dài, admin xử lý đúng việc nguy hiểm trước thay vì thuần tuý theo thứ tự thời gian; gợi ý chỉ là thứ tự đề xuất, quyết định cuối vẫn của admin và mọi tiêu chí chấm điểm đều minh bạch, xem lại được.
**Effort: M**

### ADM-W02 — Tóm tắt vụ việc bằng AI

Với vụ việc phức tạp (tin nhắn bị báo cáo nằm trong hội thoại dài, Circle bị báo cáo kèm nhiều nội dung), AI tóm tắt ngữ cảnh thành vài dòng: nội dung chính bị báo cáo, diễn biến xung quanh, điểm cần admin chú ý — kèm liên kết nhảy tới đúng vị trí gốc để admin tự kiểm chứng. Giá trị: giảm mạnh thời gian đọc hiểu ngữ cảnh cho mỗi vụ việc, admin vẫn quyết định dựa trên dữ liệu gốc chứ không dựa trên tóm tắt.
**Effort: M**

## 5. Business rules & invariants

- Quyền quản trị enforce ở server cho mọi thao tác; giao diện chỉ là lớp hiển thị. Không có ngoại lệ "ẩn nút là đủ".
- Mọi hành động thay đổi trạng thái hệ thống của admin đều: có danh tính người thực hiện, có lý do (với hành động nặng và khoá user), và có audit log. Thiếu một trong ba là chưa đạt chuẩn.
- Audit log là bất biến và append-only ở tầng dữ liệu — kể cả Admin không sửa/xoá được.
- Danh tính người gửi nội dung ẩn danh là dữ liệu được bảo vệ đặc biệt: không xuất hiện trong API/UI thông thường của cả admin site; truy xuất là ngoại lệ có quy trình riêng (ADM-06), không phải tính năng tra cứu.
- Gỡ nội dung là gỡ khỏi hiển thị người dùng, không phải xoá vĩnh viễn dữ liệu đang còn liên quan vụ việc/audit — xoá cứng chỉ theo chính sách lưu trữ riêng, ngoài phạm vi playbook này.
- Toàn hệ thống chỉ có 2 vai trò toàn cục: User và Admin; Admin là vai trò quản trị duy nhất (không tách Super Admin / Admin thường) — quyết định của chủ dự án, 2026-10-25.
- Hệ thống luôn tồn tại ít nhất một Admin đang hoạt động.
- Nội dung bị hệ thống tự động tạm ẩn vì đạt ngưỡng báo cáo luôn phải xuất hiện trước mắt admin (ADM-06); không tồn tại trạng thái "bị ẩn mà không ai chịu trách nhiệm xem lại".

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `AdminUser` (id, email, role: admin|super_admin, status, lastLoginAt) — tách khỏi bảng user thường hoặc gắn role có kiểm soát chặt; chọn một mô hình và ghi rõ
- `Report` (id, targetType: user|moment|message|anonymous_post|circle, targetId, snapshotRef, status: new|in_progress|resolved|dismissed, assigneeId, createdAt) — gộp nhiều báo cáo viên vào `ReportReporter` (reportId, reporterId, reason)
- `ModerationAction` (id, reportId, adminId, action: dismiss|remove_content|warn|ban, note, createdAt)
- `FlaggedContent` (targetType, targetId, flagSource: threshold|admin, status: hidden|removed|restored)
- `UserSanction` (userId, type: warn|ban|unban, reason, adminId, reportId nullable, createdAt)
- `AdminAuditLog` (id, adminId, role, action, targetType, targetId, reason, metadata, result, createdAt) — bảng append-only, không cấp quyền UPDATE/DELETE cho application role ở tầng DB nếu hạ tầng cho phép
- `IdentityReveal` (anonymousPostId, reportId, superAdminId, reason, createdAt) — bản ghi riêng phục vụ đối chiếu audit

**Endpoint gợi ý (toàn bộ dưới prefix riêng, vd `/admin-api`, yêu cầu phiên admin):**
- `POST /admin-api/auth/login`, `POST /admin-api/auth/logout`
- `GET /admin-api/dashboard/summary`
- `GET /admin-api/users?q=...&status=...`, `GET /admin-api/users/:id`, `POST /admin-api/users/:id/ban`, `POST /admin-api/users/:id/unban`
- `GET /admin-api/reports?status=...&targetType=...`, `GET /admin-api/reports/:id`, `POST /admin-api/reports/:id/actions`
- `GET /admin-api/flagged`, `POST /admin-api/flagged/:id/restore`, `POST /admin-api/flagged/:id/confirm-remove`
- `POST /admin-api/anonymous-posts/:id/reveal-identity` (chỉ vai trò Admin, bắt buộc reason)
- `GET /admin-api/audit-logs?...filters`, `GET /admin-api/stats/weekly`, `GET /admin-api/exports/...` (CSV)

## 7. Cross-cutting riêng cho module

(Ngoài gate chung ở `cross-cutting-gate.md`.)

- **Bảo mật bề mặt quản trị là cross-cutting số một:** admin site là mục tiêu tấn công giá trị cao — bắt buộc HTTPS, cookie phiên có cờ bảo mật (HttpOnly, Secure, SameSite), chống CSRF cho mọi API quản trị, và rate limit riêng cho trang đăng nhập admin.
- **Nguyên tắc đặc quyền tối thiểu (least privilege) áp ở mọi lớp:** mỗi vai trò chỉ thấy và gọi được đúng chức năng của mình; dữ liệu danh tính ẩn danh không bao giờ được tải "dư" về client.
- **Tính nhất quán số liệu:** dashboard, hàng đợi và thống kê dùng chung định nghĩa chỉ số — không màn hình nào tự định nghĩa lại cách đếm.
- **Khả năng đảo ngược có kiểm soát:** hành động quản trị nên đảo ngược được khi có thể (mở khoá, khôi phục nội dung) và mọi lần đảo ngược cũng là một hành động có audit log, không phải xoá dấu vết hành động cũ.
- **Ngôn ngữ giao diện trung tính, nghiệp vụ:** văn bản trong admin site (lý do khoá, cảnh cáo gửi user) phải chuyên nghiệp và rõ ràng vì chúng hiển thị cho người dùng bị xử lý và có thể được trích dẫn khi khiếu nại.

## 8. Anti-patterns

- Cấp quyền quản trị một cách tuỳ tiện (vd gán cờ admin trực tiếp trong DB không qua luồng quản lý tài khoản admin) mà không có đăng nhập tách biệt và không chống brute-force riêng cho bề mặt admin.
- Chỉ ẩn nút chức năng ở frontend trong khi API quản trị không kiểm tra vai trò.
- Khoá tài khoản không cần lý do, hoặc lý do chỉ lưu ở ghi chú tự do không ai xem lại được.
- Xoá cứng nội dung bị báo cáo ngay khi xử lý — mất căn cứ khi có khiếu nại và mất dữ liệu cho audit.
- Audit log lưu chung bảng có thể sửa/xoá, hoặc chỉ ghi log ở client.
- Cho Circle Admin hoặc Admin thường xem danh tính người gửi nội dung ẩn danh "để tiện xử lý" — phá vỡ cam kết ẩn danh đã tuyên bố với người dùng trong `07-circle-collaboration.md`.
- Áp xác nhận hai bước cho mọi thao tác kể cả thao tác nhẹ — gây confirmation fatigue, admin bấm cho qua và cơ chế mất tác dụng đúng lúc cần.
- Dashboard hiển thị số liệu "ước lượng" hoặc cache không ghi thời điểm cập nhật, khiến admin ra quyết định trên số liệu cũ mà không biết.

## 9. Self-audit checklist cho agent

- [ ] ADM-01: đăng nhập admin tách biệt, mô hình 2 vai trò User / Admin (Admin gộp toàn quyền quản trị), quyền enforce ở server cho mọi endpoint, luôn còn ít nhất một Admin active
- [ ] ADM-02: dashboard hiển thị tổng user / Circle / khoảnh khắc / báo cáo chờ xử lý từ dữ liệu thật, có mốc thời gian cập nhật, số báo cáo khớp hàng đợi
- [ ] ADM-03: tìm kiếm và xem được hồ sơ user; khoá/mở khoá bắt buộc lý do, khoá làm vô hiệu mọi phiên đăng nhập
- [ ] ADM-04: hàng đợi báo cáo đủ 5 loại đối tượng, gộp báo cáo trùng, xem được nội dung gốc/snapshot kể cả khi đã bị xoá
- [ ] ADM-05: đủ 4 hành động xử lý (bỏ qua / gỡ nội dung / cảnh cáo / khoá tài khoản) với bộ trạng thái vụ việc đầy đủ, không đóng vụ thiếu quyết định
- [ ] ADM-06: danh sách nội dung bị gắn cờ bao quát mọi nội dung bị tự động ẩn; truy xuất danh tính ẩn danh chỉ vai trò Admin + lý do + xác nhận hai bước + audit log
- [ ] ADM-07: audit log append-only, không có đường sửa/xoá ở mọi vai trò, lọc được theo người/loại/thời gian
- [ ] ADM-08: hành động nặng (khoá tài khoản, gỡ hàng loạt, truy xuất danh tính, vô hiệu admin) bắt buộc xác nhận hai bước enforce cả ở server
- [ ] Không còn anti-pattern nào ở mục 8 xuất hiện trong phần implement

## Changelog

- 2026-10-25 — Tạo bản đầu.
- 2026-10-25 — Đơn giản hoá mô hình quản trị theo quyết định của chủ dự án: gộp Super Admin và Admin thành **một vai trò Admin duy nhất** (toàn hệ thống chỉ còn 2 vai trò User / Admin). Các chốt an toàn giữ nguyên: truy xuất danh tính ẩn danh vẫn bắt buộc lý do + xác nhận hai bước + audit log; không khoá/gỡ vai trò được Admin active cuối cùng; audit log bất biến.
