# Playbook — Circle

> Module trung tâm của CIRCLE: nhóm riêng tư/công khai nơi các thành viên chia sẻ và cộng tác — đối chiếu PROJECT_GOD.md §2.2 nhóm "Circle": Tạo Circle; Tham gia Circle; Quản lý Circle; Phân quyền thành viên phù hợp.

## 1. Tổng quan

- **Mục đích:** Quản lý vòng đời của một Circle (nhóm): tạo, cài đặt, chế độ riêng tư, thành viên và phân quyền — là "container" chứa toàn bộ hoạt động nhóm của CIRCLE.
- **Actors:**
  - Owner: người tạo Circle, giữ quyền cao nhất, chịu trách nhiệm cuối cùng về Circle.
  - Admin: thành viên được owner (hoặc admin có quyền) uỷ quyền quản trị.
  - Member: thành viên thường.
  - Non-member: user ngoài Circle (chỉ tương tác được với Circle public theo giới hạn).
  - Admin hệ thống (Management Website): can thiệp khi Circle vi phạm (khoá/giải tán bắt buộc) — ngoài luồng nghiệp vụ thường.
- **Quan hệ với module khác:**
  - Realtime sharing, Chat, Voice/Video và Circle collaboration (album, ghim, vị trí, plan, vote...) đều gắn vào một Circle cụ thể và kế thừa danh sách thành viên + quyền từ module này — không module nào tự định nghĩa thành viên riêng.
  - People & Invitations (playbook 02, PPL) cung cấp dữ liệu người quen (người trong các Circle chung, gợi ý theo Circle chung) để mời vào Circle; block ở đó giới hạn khả năng mời/thấy nhau kể cả trong Circle. **Được mời thẳng vào Circle là con đường gia nhập mặc định và chính của sản phẩm — không tồn tại bước kết bạn trung gian:** user không cần "kết bạn" trước mới được mời vào một Circle.
  - Notification thông báo lời mời, duyệt tham gia, thay đổi quyền, bị kick.
  - Account cung cấp danh tính và trạng thái tài khoản của thành viên.

## 2. Tính năng MUST (baseline best-practice — thiếu là chưa đạt chuẩn)

### CIR-01 — Tạo Circle
- **Hành vi:** User tạo Circle mới với tên (bắt buộc), avatar, mô tả, ảnh bìa (có thể bổ sung sau) và chế độ riêng tư ban đầu (CIR-03). Người tạo tự động là Owner và là thành viên đầu tiên. Circle vừa tạo ở trạng thái hoạt động ngay, có thể mời thành viên ngay.
- **Luồng chính:** Chọn "Tạo Circle" → nhập tên + chọn chế độ riêng tư (kèm giải thích hệ quả) → tuỳ chọn thêm avatar/mô tả → xác nhận → Circle được tạo, user là Owner → điều hướng vào Circle kèm gợi ý mời thành viên.
- **Trạng thái UI:** loading khi tạo, error (tên trống/quá dài, mất mạng), empty state bên trong Circle mới (chưa có nội dung — gợi ý các hành động đầu tiên: mời bạn, ghim lời chào).
- **Edge cases:** Tạo Circle trùng tên với Circle khác (cho phép trùng tên — định danh bằng ID, không phải tên); double-submit không tạo 2 Circle; user tạo quá nhiều Circle trong thời gian ngắn → rate limit cấu hình được; mất mạng giữa chừng → không tạo Circle "ma" nửa vời (giao dịch nguyên tử phía server).
- **Acceptance criteria:**
  - [ ] Tạo Circle thành công luôn gán đúng người tạo làm Owner và thành viên đầu tiên.
  - [ ] Tên Circle có giới hạn độ dài và không được toàn khoảng trắng.
  - [ ] Double-submit/retry không tạo Circle trùng.
  - [ ] Chế độ riêng tư được chọn ngay lúc tạo và hiển thị rõ trước khi xác nhận.
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2

### CIR-02 — Cài đặt & hồ sơ Circle
- **Hành vi:** Thông tin hiển thị của Circle gồm: tên, avatar, mô tả, ảnh bìa. Chỉ Owner/Admin có quyền theo ma trận quyền (CIR-06) mới sửa được. Thay đổi áp dụng cho mọi thành viên ngay lập tức và được ghi vào lịch sử hoạt động của Circle (ai sửa, sửa gì, khi nào) ở mức cơ bản.
- **Luồng chính:** Vào Circle → Cài đặt → sửa trường → lưu → server kiểm tra quyền → áp dụng + ghi log hoạt động → thành viên khác thấy bản mới ở lần tải tiếp theo (hoặc realtime nếu có cơ chế đồng bộ).
- **Trạng thái UI:** preview avatar/ảnh bìa trước khi lưu, crop ảnh như avatar cá nhân, error (không đủ quyền — không hiển thị nút sửa ngay từ đầu cho người không có quyền; ảnh sai định dạng/quá lớn), trạng thái đã lưu.
- **Edge cases:** Hai admin sửa cùng lúc → bản lưu sau thắng, không lỗi (last-write-wins cho trường thông tin đơn giản) và log ghi đủ cả hai; ảnh bìa bị xoá → quay về ảnh bìa mặc định; tên mới vi phạm từ ngữ cấm → từ chối kèm lý do.
- **Acceptance criteria:**
  - [ ] Server kiểm tra quyền sửa theo ma trận CIR-06, member thường gọi API sửa sẽ bị từ chối.
  - [ ] Upload avatar/ảnh bìa có crop, giới hạn định dạng và dung lượng như hồ sơ cá nhân.
  - [ ] Mọi thay đổi cài đặt đều có bản ghi hoạt động (actor, thời gian, trường thay đổi).
  - [ ] Người không có quyền không nhìn thấy nút sửa trong UI (nhưng server vẫn là chốt chặn chính).
- **Platform:** Giống nhau (mobile chọn ảnh từ thư viện; web hỗ trợ drag-drop).
- **Scope:** Đã đăng ký §2.2

### CIR-03 — Chế độ riêng tư public / private & hệ quả
- **Hành vi:** Mỗi Circle thuộc một chế độ: **Public** — ai cũng tìm thấy, xem được thông tin cơ bản (tên, avatar, mô tả, số thành viên) và xin tham gia (có thể tham gia ngay hoặc qua duyệt tuỳ cấu hình); **Private** — không xuất hiện trong tìm kiếm/khám phá, chỉ tham gia được bằng lời mời, non-member không xem được bất kỳ nội dung hay danh sách thành viên nào. Đổi chế độ là quyền của Owner (theo CIR-06) và phải hiển thị rõ hệ quả trước khi xác nhận.
- **Luồng chính:** Owner vào Cài đặt → Riêng tư → chọn chế độ mới → hệ thống trình bày hệ quả cụ thể → xác nhận → áp dụng ngay: chuyển sang private sẽ ẩn Circle khỏi khám phá và vô hiệu các đường tham gia công khai; chuyển sang public mở lại tìm kiếm/khám phá.
- **Trạng thái UI:** badge chế độ riêng tư hiển thị cạnh tên Circle ở mọi bề mặt, dialog xác nhận khi đổi chế độ kèm danh sách hệ quả, thông báo cho thành viên khi chế độ thay đổi.
- **Edge cases:** Circle private có link mời đang lưu hành khi đổi qua lại public/private (link mời xử lý theo CIR-04, không tự thay đổi); non-member đang mở trang Circle public ngay lúc chuyển private → lần tải tiếp theo bị chặn hoàn toàn; thành viên hiện tại không bị ảnh hưởng bởi việc đổi chế độ.
- **Acceptance criteria:**
  - [ ] Circle private không xuất hiện trong tìm kiếm, khám phá, hay gợi ý cho non-member ở bất kỳ API nào.
  - [ ] Non-member gọi API xem nội dung/danh sách thành viên của Circle private bị từ chối (kiểm chứng ở tầng API, không chỉ UI).
  - [ ] Dialog đổi chế độ liệt kê đúng hệ quả của hướng đổi (sang public / sang private) trước khi xác nhận.
  - [ ] Thành viên nhận được thông báo khi chế độ riêng tư thay đổi.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-04 — Mời thành viên bằng link / mã mời
- **Hành vi:** Owner/Admin (theo CIR-06) tạo link hoặc mã mời để người khác tham gia Circle. Mỗi lời mời có thời hạn hết hạn và giới hạn lượt dùng (cấu hình được), và có thể bị thu hồi bất cứ lúc nào. Thu hồi hoặc hết hạn khiến link/mã vô hiệu ngay. Với Circle private, link mời là đường tham gia duy nhất ngoài duyệt xin tham gia.
- **Luồng chính:** Vào Circle → Mời thành viên → tạo link/mã (chọn thời hạn nếu có tuỳ chọn) → chia sẻ → người nhận mở link: nếu đã đăng nhập và hợp lệ → xem màn hình xác nhận tham gia (tên Circle, avatar, số thành viên, ai mời) → xác nhận → trở thành Member. Có thể mời trực tiếp bạn bè trong app (chọn từ danh sách bạn) song song với link/mã.
- **Trạng thái UI:** màn hình quản lý lời mời (link đang hoạt động, thời hạn còn lại, nút thu hồi), màn hình đích khi mở link (xác nhận tham gia / link hết hạn / link đã thu hồi / Circle đã giải tán), error khi đã là thành viên (điều hướng thẳng vào Circle).
- **Edge cases:** Mở link mời của Circle mình đã là thành viên → vào thẳng Circle; mở link khi chưa đăng nhập → qua luồng đăng nhập rồi quay lại đúng link mời; người bị chủ Circle ban (CIR-07) mở link mời → bị từ chối; hai người dùng cùng một link đồng thời khi sắp hết lượt → server chốt lượt dùng nguyên tử; người đã block người mời (hoặc ngược lại) → lời mời trực tiếp bị hạn chế theo rule của PPL (playbook 02).
- **Acceptance criteria:**
  - [ ] Link/mã mời hết hạn hoặc bị thu hồi sẽ bị từ chối ở server với thông báo rõ ràng, không tham gia được.
  - [ ] Giới hạn lượt dùng được thực thi nguyên tử ở server (không vượt lượt khi dùng đồng thời).
  - [ ] Thu hồi link có hiệu lực ngay lập tức.
  - [ ] Màn hình xác nhận tham gia hiển thị đủ thông tin Circle và người mời trước khi user đồng ý.
  - [ ] Thành viên bị ban không thể tham gia lại bằng bất kỳ link mời nào của Circle đó.
- **Platform:** Mobile hỗ trợ deep link mở thẳng vào app; web mở trang xác nhận tham gia — hành vi nghiệp vụ giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-05 — Xin tham gia & hàng đợi duyệt (Circle private / public có duyệt)
- **Hành vi:** Với Circle private, non-member chỉ vào được qua lời mời (CIR-04). Với Circle public bật chế độ duyệt, user gửi yêu cầu xin tham gia và chờ Owner/Admin duyệt. Hàng đợi duyệt hiển thị cho Owner/Admin: ai xin, khi nào, bạn chung/thành viên chung làm ngữ cảnh. Duyệt → thành viên mới; từ chối → yêu cầu biến mất, người xin không nhận thông báo bị từ chối.
- **Luồng chính:** User mở trang Circle public → "Xin tham gia" → (nếu bật duyệt) yêu cầu vào hàng đợi + thông báo cho Owner/Admin → Owner/Admin mở hàng đợi → Duyệt: user thành Member, nhận thông báo được chấp nhận → Từ chối: xoá yêu cầu, không thông báo.
- **Trạng thái UI:** trạng thái "Đã gửi yêu cầu — đang chờ duyệt" kèm nút huỷ yêu cầu phía người xin; empty state hàng đợi; badge số yêu cầu chờ cho Owner/Admin.
- **Edge cases:** Huỷ yêu cầu đang chờ (cho phép, không thông báo); gửi yêu cầu trùng khi đang chờ → idempotent; bị từ chối rồi xin lại (cho phép sau thời gian chờ cấu hình được, tránh spam); user bị ban gửi yêu cầu → tự động bị từ chối ở server; Owner tắt chế độ duyệt trong lúc có hàng đợi → các yêu cầu chờ được xử lý theo lựa chọn rõ ràng (tự duyệt hết hoặc huỷ hết) chứ không treo.
- **Acceptance criteria:**
  - [ ] Yêu cầu xin tham gia chỉ tồn tại một bản cho mỗi cặp (user, Circle) tại một thời điểm.
  - [ ] Từ chối không sinh notification cho người xin.
  - [ ] Người bị ban không thể tạo yêu cầu tham gia (server từ chối).
  - [ ] Owner/Admin thấy đúng số yêu cầu chờ và xử lý xong là cập nhật ngay.
  - [ ] Người xin có thể huỷ yêu cầu của mình bất cứ lúc nào trước khi được duyệt.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung (tham gia Circle đã đăng ký §2.2; cơ chế duyệt là phần bổ sung)

### CIR-06 — Vai trò thành viên & ma trận quyền
- **Hành vi:** Circle có 3 vai trò: **Owner** (1 người duy nhất), **Admin**, **Member**. Mọi hành động quản trị đều tra cứu ma trận quyền dưới đây ở server. Owner gán/gỡ vai trò Admin cho Member (và Admin không thể tự nâng quyền mình hay động vào Owner).
- **Luồng chính:** Owner/Admin mở Danh sách thành viên → chọn thành viên → hành động theo quyền (gán Admin, gỡ Admin, kick...) → server tra ma trận → thực hiện + ghi log hoạt động + thông báo cho người bị tác động khi phù hợp.
- **Trạng thái UI:** badge vai trò cạnh tên thành viên ở mọi danh sách; menu hành động chỉ hiển thị hành động người đang xem có quyền thực hiện; dialog xác nhận cho hành động nhạy cảm (kick, chuyển owner, giải tán).
- **Edge cases:** Admin cố kick Admin khác hoặc Owner → server từ chối theo ma trận; Owner bị khoá tài khoản → Circle vẫn vận hành bởi Admin nhưng các quyền "chỉ Owner" bị treo cho tới khi có cơ chế khôi phục/chuyển quyền (ghi rõ là giới hạn đã biết); gỡ quyền Admin của chính mình (Admin tự gỡ) → cho phép nếu không vi phạm ràng buộc nào.
- **Acceptance criteria:**
  - [ ] Ma trận quyền dưới đây được thực thi ở server cho mọi API quản trị; UI chỉ là lớp hiển thị.
  - [ ] Không hành động nào cho phép Admin tác động lên Owner hoặc lên Admin ngang cấp ngoài phạm vi ma trận.
  - [ ] Mọi thay đổi vai trò đều có notification cho người được gán/gỡ quyền và có log hoạt động.
  - [ ] Tại mọi thời điểm Circle đang hoạt động có đúng 1 Owner.

**Ma trận quyền (✓ = được phép):**

| Hành động | Owner | Admin | Member |
|---|---|---|---|
| Sửa tên/avatar/mô tả/ảnh bìa Circle | ✓ | ✓ | — |
| Đổi chế độ riêng tư public/private | ✓ | — | — |
| Tạo/thu hồi link mời | ✓ | ✓ | — |
| Duyệt yêu cầu tham gia | ✓ | ✓ | — |
| Gán/gỡ vai trò Admin | ✓ | — | — |
| Kick thành viên thường | ✓ | ✓ | — |
| Kick Admin khác | ✓ | — | — |
| Ban thành viên | ✓ | ✓ (chỉ Member) | — |
| Ghim nội dung trong Circle | ✓ | ✓ | Theo cấu hình Circle |
| Chuyển quyền Owner | ✓ (chủ động) | — | — |
| Giải tán Circle | ✓ | — | — |
| Rời Circle | Chỉ khi đã chuyển quyền hoặc giải tán | ✓ | ✓ |
- **Platform:** Giống nhau.
- **Scope:** Đã đăng ký §2.2 (phân quyền thành viên); ma trận chi tiết là phần cụ thể hoá

### CIR-07 — Kick & ban thành viên
- **Hành vi:** Kick: loại thành viên khỏi Circle (người bị kick có thể tham gia lại sau nếu được mời/duyệt lại). Ban: loại khỏi Circle **và** chặn tham gia lại bằng mọi đường (link mời, xin tham gia) cho đến khi được gỡ ban. Cả hai đều theo ma trận CIR-06, có xác nhận, và người bị tác động nhận thông báo (với ban, thông báo không bắt buộc nêu lý do chi tiết).
- **Luồng chính:** Mở hồ sơ thành viên trong Circle → Kick hoặc Ban → dialog xác nhận nêu hậu quả (mất quyền xem nội dung Circle ngay lập tức; nội dung họ đã đăng xử lý theo CIR-07 edge cases) → server thực thi → thành viên biến mất khỏi danh sách, quyền truy cập nội dung Circle bị thu hồi ngay.
- **Trạng thái UI:** dialog xác nhận phân biệt rõ Kick vs Ban, danh sách bị ban riêng trong Cài đặt (chỉ Owner/Admin xem), trạng thái sau thao tác.
- **Edge cases:** Nội dung người bị kick/ban đã đăng trong Circle (ảnh album, bài ghim...) → mặc định giữ lại dưới tên hiển thị của họ kèm nhãn "đã rời Circle" trừ khi Owner xoá riêng (tránh phá vỡ ngữ cảnh chung); kick người đang là Admin bởi Owner → đồng thời gỡ vai trò Admin; ban người đang giữ yêu cầu xin tham gia khác → không liên quan Circle khác; người bị kick đang online trong Circle → phiên xem bị cắt ở lần tải/realtime event tiếp theo.
- **Acceptance criteria:**
  - [ ] Sau kick/ban, user bị mất quyền truy cập nội dung Circle ngay lập tức ở tầng API.
  - [ ] Người bị ban bị từ chối ở mọi đường tham gia lại (link mời còn hạn cũng không dùng được).
  - [ ] Gỡ ban đưa user về trạng thái non-member bình thường (không tự khôi phục tư cách thành viên).
  - [ ] Kick/ban đều có log hoạt động và dialog xác nhận trước khi thực thi.
  - [ ] Không thể kick/ban Owner; Admin không thể kick/ban Admin khác (theo CIR-06).
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-08 — Rời Circle & chuyển quyền Owner
- **Hành vi:** Member/Admin rời Circle bất cứ lúc nào (có xác nhận); sau khi rời, mất quyền xem nội dung Circle private ngay. **Owner không thể rời khi Circle còn thành viên khác**: bắt buộc chọn một trong hai — chuyển quyền Owner cho một Admin/Member khác, hoặc giải tán Circle (CIR-09). Chuyển quyền: người nhận trở thành Owner mới, Owner cũ trở thành Member (hoặc rời ngay nếu chọn), toàn bộ quá trình ghi log và thông báo cho cả hai phía + thành viên Circle.
- **Luồng chính:** Rời Circle: Cài đặt → Rời Circle → dialog nêu hậu quả → xác nhận → rời. Chuyển quyền: Owner chọn thành viên → xác nhận (nêu rõ quyền sẽ mất) → người nhận xác nhận đồng ý (bắt buộc phía người nhận) → chuyển giao nguyên tử.
- **Trạng thái UI:** dialog hậu quả khi rời; với Owner, dialog rời bị thay bằng lựa chọn "Chuyển quyền" / "Giải tán" / "Huỷ"; trạng thái chờ xác nhận khi chuyển quyền.
- **Edge cases:** Người được chuyển quyền từ chối hoặc không phản hồi → Owner cũ vẫn là Owner, không có trạng thái lơ lửng; Owner chuyển quyền cho người vừa bị ban/không còn là thành viên → server từ chối; member rời rồi tham gia lại → là thành viên mới hoàn toàn (không khôi phục vai trò Admin cũ, trừ khi được gán lại); nội dung người rời đã đăng xử lý như trường hợp kick (giữ + nhãn "đã rời Circle").
- **Acceptance criteria:**
  - [ ] API rời Circle từ chối Owner khi Circle còn thành viên khác, kèm hướng dẫn hai lựa chọn hợp lệ.
  - [ ] Chuyển quyền chỉ hoàn tất khi người nhận đồng ý; không tồn tại thời điểm Circle có 0 hoặc 2 Owner.
  - [ ] Sau khi rời, user mất quyền truy cập nội dung Circle private ngay lập tức.
  - [ ] Vai trò Admin cũ không tự khôi phục khi tham gia lại.
  - [ ] Chuyển quyền có notification cho Owner cũ, Owner mới và thông báo trong Circle.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-09 — Giải tán Circle
- **Hành vi:** Chỉ Owner được giải tán Circle. Đây là thao tác không khôi phục được trong luồng thường: phải qua dialog xác nhận nhiều lớp (nêu rõ hậu quả dữ liệu + yêu cầu xác nhận dứt khoát, vd gõ tên Circle hoặc tick hiểu hậu quả). Sau giải tán: Circle ngừng hoạt động, thành viên mất quyền truy cập, dữ liệu của Circle (nội dung, album, lịch sử) bị xoá hoặc chuyển trạng thái lưu trữ theo chính sách dữ liệu của dự án — hành vi cụ thể phải được ghi rõ trong dialog trước khi xác nhận.
- **Luồng chính:** Owner vào Cài đặt → Vùng nguy hiểm → Giải tán Circle → dialog liệt kê hậu quả (số thành viên bị ảnh hưởng, dữ liệu sẽ mất) → xác nhận dứt khoát → server thực thi giải tán → thông báo cho toàn bộ thành viên → Circle biến mất khỏi danh sách của mọi người.
- **Trạng thái UI:** dialog xác nhận nhiều bước, trạng thái đang xử lý (với Circle lớn việc xoá có thể chạy nền — hiển thị "đang giải tán" thay vì treo), thông báo hoàn tất cho Owner.
- **Edge cases:** Giải tán khi đang có sự kiện/plan đang chạy trong Circle → vẫn giải tán, mọi module con nhận sự kiện "Circle đã giải tán" để tự đóng; thành viên đang mở Circle lúc giải tán → bị đưa ra ngoài kèm thông báo ở lần tương tác tiếp theo; Owner thao tác nhầm → không có undo trong luồng thường (đây là lý do bắt buộc xác nhận nhiều lớp).
- **Acceptance criteria:**
  - [ ] Chỉ Owner gọi được API giải tán; Admin/Member bị từ chối ở server.
  - [ ] Dialog xác nhận hiển thị đúng số thành viên hiện tại và mô tả chính xác hậu quả dữ liệu trước khi cho xác nhận cuối.
  - [ ] Sau giải tán, mọi API nội dung của Circle từ chối truy cập từ mọi thành viên cũ.
  - [ ] Toàn bộ thành viên nhận được thông báo Circle đã giải tán.
  - [ ] Thao tác giải tán có log hệ thống (actor, thời gian, Circle ID).
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-10 — Tìm kiếm & khám phá Circle public
- **Hành vi:** User tìm Circle public theo tên/mô tả và duyệt mục khám phá (gợi ý theo bạn bè đang tham gia, Circle có bạn chung). Kết quả chỉ gồm Circle public; Circle private không xuất hiện dưới bất kỳ hình thức nào (kể cả gợi ý "bạn đang ở trong Circle này" đối với private — thông tin thành viên của private chỉ lộ cho người đã được mời).
- **Luồng chính:** Vào Khám phá/Tìm kiếm → nhập từ khoá hoặc duyệt gợi ý → mỗi kết quả hiển thị tên, avatar, mô tả ngắn, số thành viên, bạn bè của mình đang ở trong đó → mở trang Circle public → Xin tham gia/Tham gia ngay theo cấu hình duyệt (CIR-05).
- **Trạng thái UI:** loading, empty (không có Circle phù hợp), kết quả phân trang, badge "Bạn bè đang tham gia" khi có ngữ cảnh xã hội.
- **Edge cases:** Tìm đúng tên một Circle private → không có kết quả; Circle vừa chuyển từ public sang private trong lúc user đang xem danh sách → lần tải tiếp theo biến mất và trang chi tiết bị chặn; Circle đã giải tán không xuất hiện; sắp xếp kết quả ưu tiên Circle có bạn bè tham gia (nếu có dữ liệu) nhưng không lộ thông tin Circle private của bạn bè.
- **Acceptance criteria:**
  - [ ] Không truy vấn tìm kiếm/khám phá nào trả về Circle private (kiểm chứng bằng tài khoản non-member).
  - [ ] Kết quả hiển thị đúng số thành viên và ngữ cảnh bạn bè (chỉ với Circle public).
  - [ ] Circle đã giải tán hoặc đã chuyển private bị loại khỏi kết quả ở lần tải tiếp theo.
  - [ ] Từ trang kết quả, user vào được luồng tham gia đúng theo cấu hình duyệt của Circle đó.
- **Platform:** Giống nhau.
- **Scope:** Đề xuất bổ sung

### CIR-11 — Tạo Circle kèm chọn thành viên tiện lợi
- **Hành vi:** Luồng tạo Circle gồm tối đa 2 bước: (1) thông tin Circle (tên, avatar, chế độ riêng tư — theo CIR-01/CIR-03), (2) thêm thành viên bằng bộ chọn thành viên (member picker) đa nguồn trong một màn hình duy nhất. Bước 2 **luôn bỏ qua được** bằng nút "Tạo trước, mời sau" nổi bật ngang hàng nút tiếp tục — không bao giờ ép user chọn người mới tạo được Circle, vì ép chọn người ngay là điểm ma sát lớn nhất của luồng tạo nhóm. Người được chọn đã có tài khoản sẽ nhận lời mời trong app (hoặc trở thành thành viên ngay theo chính sách của Circle); người chưa có tài khoản được mời qua link/QR/SĐT và ở trạng thái "đã mời — chờ tham gia".
- **Luồng chính:** Bước 1: nhập tên + chọn chế độ riêng tư → "Tiếp tục". Bước 2: member picker gồm các nguồn trong cùng một màn hình: ô tìm kiếm theo tên/username/số điện thoại (ở trên cùng); mục **"Gợi ý từ các Circle của bạn"** — người quen từ các Circle khác của user, xếp theo số Circle chung giảm dần, sau đó theo mức tương tác gần đây (dữ liệu người quen lấy từ playbook 02 — PPL); mục **"Gần đây"** — người vừa tương tác; mục **"Chọn từ một Circle có sẵn"** — chọn một Circle cũ rồi tick từng thành viên trong đó (chỉ đưa vào những người được tick, không sao chép mù toàn bộ danh sách). Người được chọn hiển thị dạng chips kèm bộ đếm "Đã chọn N người". Bấm "Tạo Circle" → Circle được tạo + các lựa chọn được xử lý → màn hình thành công hiển thị ngay link mời + QR để copy/chia sẻ, cùng danh sách lời mời đang chờ. Chọn "Tạo trước, mời sau" ở bước 2 → bỏ qua picker → vào thẳng màn hình thành công với link mời + QR.
- **Trạng thái UI:** picker có trạng thái rỗng có hướng dẫn: khi user chưa chọn ai và không có gợi ý nào (user mới tinh), hiển thị hướng dẫn dùng link mời/QR thay vì danh sách trống; loading khi tìm kiếm/tải gợi ý; error theo từng người khi gửi lời mời thất bại (nêu rõ ai chưa mời được, cho thử lại, không huỷ luồng tạo); màn hình thành công; trạng thái "đã mời — chờ tham gia" hiển thị phân biệt rõ với "đã là thành viên".
- **Edge cases:** Cùng một người xuất hiện ở nhiều nguồn (gợi ý + tìm kiếm + Circle có sẵn) → hợp nhất thành một chip/lựa chọn duy nhất, bộ đếm không tăng trùng; người được chọn có quan hệ block hai chiều với người tạo → không thêm được, hiển thị lý do chung không lộ chi tiết block (theo rule của PPL); tổng số chọn vượt giới hạn thành viên (CIR-S03 nếu bật) → chặn chọn thêm kèm thông báo khi chạm trần; mời bằng SĐT chưa có tài khoản → lời mời gắn với SĐT đó, khi người kia đăng ký bằng đúng SĐT thì lời mời chờ tự khớp và hiển thị cho họ; user thoát giữa bước 2 khi chưa xác nhận → không sinh Circle rỗng ngoài ý muốn; double-submit ở bước xác nhận → không tạo 2 Circle (kế thừa CIR-01); lời mời trong app cho người đã là thành viên Circle khác không liên quan → không ảnh hưởng gì.
- **Acceptance criteria:**
  - [ ] Luồng tạo Circle tối đa 2 bước; bước 2 luôn có nút "Tạo trước, mời sau" và tạo được Circle thành công mà không chọn thành viên nào.
  - [ ] Picker hiển thị đủ 4 nguồn trong một màn hình: tìm kiếm (tên/username/SĐT), "Gợi ý từ các Circle của bạn" (sắp xếp theo số Circle chung + tương tác gần đây, dữ liệu từ playbook 02), "Gần đây", "Chọn từ một Circle có sẵn" với tick chọn từng người.
  - [ ] Đa chọn dạng chips kèm bộ đếm số người đã chọn; chọn trùng một người từ nhiều nguồn chỉ tính một lần.
  - [ ] Người chưa có tài khoản được mời qua link/QR/SĐT ngay trong picker và hiển thị trạng thái "đã mời — chờ tham gia"; lời mời theo SĐT tự khớp khi người đó đăng ký.
  - [ ] Sau khi tạo, màn hình thành công hiển thị link mời + QR copy/chia sẻ được ngay, và danh sách lời mời đang chờ với hành động thu hồi / gửi lại (quản lý tiếp ở mục thành viên của Circle).
  - [ ] Trạng thái rỗng của picker hướng dẫn dùng link mời; lỗi mời từng người hiển thị riêng và thử lại được mà không làm mất Circle vừa tạo.
- **Platform:** Mobile: picker là bottom sheet toàn màn hình, ô tìm kiếm sticky phía trên, hàng chips + bộ đếm cố định phía trên danh sách và không bị bàn phím che. Web: modal/panel tương đương, cùng cấu trúc nguồn và thứ tự. Mọi chuỗi giao diện qua i18n; tuân thủ cross-cutting gate.
- **Scope:** Đề xuất bổ sung

## 3. Tính năng SHOULD

### CIR-S01 — QR code mời tham gia Circle
- **Hành vi:** Ngoài link/mã chữ (CIR-04), Circle có mã QR tương ứng với một lời mời đang hoạt động; thành viên quét QR bằng app để vào thẳng màn hình xác nhận tham gia. QR dùng chung vòng đời với lời mời gốc (hết hạn/thu hồi cùng lúc).
- **Acceptance criteria:**
  - [ ] QR trỏ tới đúng lời mời đang hoạt động; thu hồi lời mời thì QR vô hiệu ngay.
  - [ ] Quét QR khi chưa đăng nhập sẽ qua đăng nhập rồi quay lại đúng màn hình xác nhận tham gia.

### CIR-S02 — Nội quy Circle cho thành viên mới
- **Hành vi:** Owner/Admin soạn nội quy ngắn của Circle (quy tắc ứng xử, mục đích nhóm). Thành viên mới thấy nội quy ở màn hình xác nhận tham gia và trong mục thông tin Circle; Owner có thể bật tuỳ chọn yêu cầu thành viên mới xác nhận đã đọc nội quy mới hoàn tất tham gia.
- **Acceptance criteria:**
  - [ ] Nội quy hiển thị cho người sắp tham gia trước khi họ xác nhận vào Circle.
  - [ ] Khi bật chế độ bắt buộc, user chưa tick xác nhận đã đọc thì chưa trở thành thành viên.
  - [ ] Sửa nội quy có log hoạt động và thành viên hiện tại xem lại được bất cứ lúc nào.

### CIR-S03 — Giới hạn số lượng thành viên theo cấu hình
- **Hành vi:** Mỗi Circle có giới hạn số thành viên tối đa theo cấu hình hệ thống (và Owner không tự nâng được quá trần hệ thống). Khi đạt giới hạn, mọi đường tham gia (link mời, duyệt, QR) đều dừng lại với thông báo rõ ràng "Circle đã đủ thành viên".
- **Acceptance criteria:**
  - [ ] Kiểm tra giới hạn thực thi nguyên tử ở server khi tham gia (không vượt giới hạn khi nhiều người vào đồng thời).
  - [ ] Link mời của Circle đã đầy hiển thị trạng thái "đã đủ thành viên" thay vì lỗi chung chung.
  - [ ] Số thành viên hiển thị ở mọi bề mặt khớp với số bản ghi thành viên thật.

## 4. Tính năng WOW (sáng tạo — chỉ làm khi được duyệt)

### CIR-W01 — Circle Wrapped: tổng kết kỷ niệm nhóm theo kỳ
Mỗi tháng/quý, Circle nhận một bản tổng kết tự động dạng thẻ hình: số khoảnh khắc đã chia sẻ, ảnh được yêu thích nhất, thành viên hoạt động nhất, các plan đã hoàn thành cùng nhau. Giá trị cho user: tạo cảm xúc "nhóm mình đã có một hành trình", cho thành viên lý do chia sẻ lại và gắn bó — đây là loại nội dung mà các nhóm chat thường không tự tổng kết được.
- **Effort:** M

### CIR-W02 — Theme riêng cho từng Circle
Mỗi Circle chọn một màu nhấn và ảnh bìa theo mùa/sự kiện (vd bìa sinh nhật, bìa chuyến đi), áp dụng cho header và các bề mặt bên trong Circle đó. Giá trị cho user: mỗi nhóm có "không khí" riêng, mở app là nhận ra ngay đang ở nhóm nào, giảm nhầm lẫn khi user thuộc nhiều Circle.
- **Effort:** M

### CIR-W03 — "Ngày này trong Circle": nhắc lại kỷ niệm cũ
Đúng ngày này của các kỳ trước, Circle được nhắc lại một khoảnh khắc/ảnh/plan đáng nhớ kèm gợi ý tương tác lại (bình luận, lên plan tương tự). Giá trị cho user: khơi lại kỷ niệm chung là chất kết dính mạnh nhất của nhóm bạn, tạo nội dung quay lại tự nhiên mà không cần ai chủ động đăng bài.
- **Effort:** S

## 5. Business rules & invariants

- Tại mọi thời điểm, một Circle đang hoạt động có đúng một Owner; không tồn tại Circle vô chủ hoặc hai Owner.
- Circle private là vô hình tuyệt đối với non-member: không tìm kiếm, không khám phá, không xem thông tin cơ bản ngoài những gì một link mời hợp lệ chủ động hiển thị ở màn hình xác nhận tham gia.
- Ban ghi đè mọi đường tham gia: link mời, QR, xin tham gia đều phải kiểm tra danh sách ban ở server.
- Ma trận quyền CIR-06 là nguồn sự thật duy nhất cho hành động quản trị; mọi API quản trị Circle phải tra cứu nó, không rải rác điều kiện quyền ở từng màn hình.
- Giải tán Circle là thao tác của riêng Owner, không khôi phục được trong luồng thường, và phải qua xác nhận nhiều lớp.
- Người rời/kick/ban mất quyền truy cập nội dung Circle private ngay lập tức; nội dung họ đã đóng góp được giữ lại kèm nhãn "đã rời Circle" trừ khi bị xoá riêng theo quyết định quản trị.
- Vai trò Admin không tự khôi phục khi một thành viên tham gia lại Circle.
- Tên Circle không cần duy nhất; định danh Circle luôn bằng ID nội bộ.
- **Được mời thẳng vào Circle là con đường gia nhập mặc định và chính của sản phẩm; không tồn tại bước kết bạn trung gian.** Mọi đường gia nhập (tạo Circle kèm chọn thành viên — CIR-11, link/mã mời, QR, xin tham gia) đều dẫn thẳng tới tư cách thành viên Circle; phía người được mời, dữ liệu người quen và các giới hạn block tuân theo playbook 02 (People & Invitations — PPL).

## 6. Dữ liệu & API gợi ý

**Entity chính:**
- `Circle`: id, name, avatarUrl, coverUrl, description, privacy (public/private), joinApprovalRequired, memberLimit, ownerId, status (active/dissolving/dissolved), createdAt.
- `CircleMember`: circleId, userId, role (owner/admin/member), joinedAt, status (active/left/kicked/banned) — ràng buộc: mỗi Circle tối đa một bản ghi role=owner đang active.
- `CircleInvite`: id, circleId, code, createdBy, expiresAt, maxUses, usedCount, revokedAt.
- `CircleJoinRequest`: circleId, userId, createdAt, status (pending/approved/declined/cancelled).
- `CircleBan`: circleId, userId, bannedBy, createdAt.
- `CircleActivityLog`: circleId, actorId, action (settings-changed, role-changed, member-kicked, privacy-changed, ownership-transferred...), detail, createdAt.

**Endpoint / event gợi ý:**
- `POST /circles`, `GET /circles/:id`, `PATCH /circles/:id`, `DELETE /circles/:id` (giải tán)
- `GET /circles/search`, `GET /circles/discover`
- `POST /circles/:id/invites`, `DELETE /circles/:id/invites/:inviteId`, `GET /circles/:id/invites`
- `POST /circles/join` (theo code/link mời), `POST /circles/:id/join-requests`, `POST /circles/:id/join-requests/:requestId/approve|decline`, `DELETE /circles/:id/join-requests/mine`
- `GET /circles/:id/members`, `PATCH /circles/:id/members/:userId/role`, `DELETE /circles/:id/members/:userId` (kick)
- `POST /circles/:id/bans`, `DELETE /circles/:id/bans/:userId`, `GET /circles/:id/bans`
- `POST /circles/:id/leave`, `POST /circles/:id/transfer-ownership`
- Event nội bộ: `circle.created`, `circle.privacy-changed`, `circle.member-joined`, `circle.member-removed`, `circle.ownership-transferred`, `circle.dissolved` (cho Chat, Album, Plan, Notification... tự áp dụng hệ quả).

## 7. Cross-cutting riêng cho module (ngoài gate chung ở cross-cutting-gate.md)

- **Kiểm tra thành viên tập trung:** mọi module con (Chat, Realtime sharing, Album, Plan, Vote...) phải hỏi module Circle về tư cách thành viên và quyền trước khi cho truy cập dữ liệu của Circle; không module nào tự lưu danh sách thành viên riêng.
- **Lan truyền thay đổi quyền riêng tư/quyền hạn:** khi chế độ riêng tư, vai trò, hoặc tư cách thành viên thay đổi, các bề mặt đang mở của user bị tác động phải phản ánh ở sự kiện realtime tiếp theo hoặc lần tải dữ liệu kế tiếp — không để user đã bị kick tiếp tục xem nội dung vì cache cũ.
- **Không lộ Circle private qua bề mặt phụ:** notification, gợi ý bạn bè, hồ sơ công khai của thành viên, và kết quả tìm kiếm người dùng không được làm lộ tên/tồn tại của Circle private đối với non-member.
- **Đếm thành viên nhất quán:** số thành viên hiển thị ở tìm kiếm, khám phá, cài đặt và màn hình mời phải cùng một nguồn dữ liệu.

## 8. Anti-patterns — những cách làm sai phổ biến phải tránh

- Kiểm tra quyền quản trị chỉ ở UI (ẩn nút) nhưng API vẫn cho member thường gọi.
- Để Owner rời Circle mà không chuyển quyền/giải tán, tạo Circle vô chủ.
- Link mời vĩnh viễn, không hết hạn, không thu hồi được.
- Circle private vẫn xuất hiện trong gợi ý/tìm kiếm vì quên lọc ở một endpoint phụ.
- Đặt nút Giải tán cạnh nút Rời Circle hoặc không có xác nhận nhiều lớp.
- Ban chỉ là kick mạnh hơn về lời nói: người bị ban vẫn vào lại được bằng link mời cũ.
- Xoá trắng nội dung của thành viên bị kick, làm mất ngữ cảnh của cả nhóm, mà không có quyết định quản trị riêng.
- Tự khôi phục vai trò Admin cho thành viên quay lại Circle.

## 9. Self-audit checklist cho agent

- [ ] CIR-01: Tạo Circle gán đúng Owner, chống double-submit, chọn riêng tư ngay từ đầu.
- [ ] CIR-02: Cài đặt Circle (tên/avatar/mô tả/ảnh bìa) kiểm tra quyền ở server và có log hoạt động.
- [ ] CIR-03: Public/private có hệ quả rõ ràng; private vô hình với non-member ở tầng API.
- [ ] CIR-04: Link/mã mời có hết hạn, giới hạn lượt dùng nguyên tử, thu hồi hiệu lực ngay; người bị ban không dùng được.
- [ ] CIR-05: Hàng đợi duyệt hoạt động đúng (từ chối không thông báo, huỷ được, chống trùng, chống ban).
- [ ] CIR-06: Ma trận quyền Owner/Admin/Member được thực thi ở server cho mọi API quản trị.
- [ ] CIR-07: Kick và ban phân biệt rõ; ban chặn mọi đường quay lại; mất quyền truy cập ngay ở API.
- [ ] CIR-08: Owner không rời được khi còn thành viên; chuyển quyền cần người nhận đồng ý và luôn có đúng 1 Owner.
- [ ] CIR-09: Giải tán chỉ Owner, xác nhận nhiều lớp nêu đúng hậu quả dữ liệu, thông báo toàn bộ thành viên.
- [ ] CIR-10: Tìm kiếm/khám phá chỉ trả Circle public; Circle đã giải tán/đổi private biến mất ở lần tải tiếp theo.
- [ ] CIR-11: Tạo Circle tối đa 2 bước, luôn có "Tạo trước, mời sau"; picker đa nguồn (tìm kiếm / gợi ý từ các Circle của bạn / gần đây / chọn từ một Circle có sẵn) dạng chips + bộ đếm, không trùng người; mời người chưa có tài khoản qua link/QR/SĐT; màn hình thành công có link mời + QR và danh sách lời mời chờ thu hồi/gửi lại được.

## Changelog

- 2026-10-25 — Tạo bản đầu.
- 2026-10-25 — Bổ sung MUST CIR-11 (tạo Circle kèm chọn thành viên tiện lợi: luồng tối đa 2 bước, member picker đa nguồn, "Tạo trước, mời sau"); chốt mời thẳng vào Circle là đường gia nhập chính theo triết lý group-first (không qua bước kết bạn trung gian), liên kết playbook 02 (PPL) cho phía người được mời và dữ liệu gợi ý.
