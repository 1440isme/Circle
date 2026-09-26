1. PHẦN MỞ ĐẦU
   1. Tính cấp thiết của đề tài

Trong bối cảnh chuyển đổi số mạnh mẽ, mạng xã hội đã trở thành nhân tố then chốt tái định hình phương thức giao tiếp và tương tác xã hội của người dùng hiện đại, đặc biệt là thế hệ trẻ. Tuy nhiên, các nền tảng mạng xã hội đại chúng hiện nay đang bộc lộ nhiều hạn chế rõ rệt: sự quá tải về mặt nội dung, thuật toán đề xuất mang tính thương mại hóa, tình trạng loãng thông tin và thiếu hụt những không gian tương tác riêng tư, sâu sắc. Phương thức kết nối phân tán qua nhiều ứng dụng riêng biệt - vừa phải dùng ứng dụng trò chuyện, vừa dùng công cụ tạo bình chọn, lập kế hoạch hay chia sẻ lịch trình - ra sự bất tiện lớn, gián đoạn trải nghiệm người dùng và làm giảm hiệu quả gắn kết trong các hội nhóm, tập thể.

Nhu cầu về một nền tảng mạng xã hội chuyên biệt, an toàn và tối ưu cho tương tác nhóm đang trở nên cấp thiết hơn bao giờ hết. Người dùng không chỉ dừng lại ở mong muốn kết bạn và nhắn tin thông thường, mà còn có nhu cầu tức thì trong việc chụp và chia sẻ khoảnh khắc theo thời gian thực (realtime), thực hiện cuộc gọi thoại/video chất lượng cao, lưu trữ album kỷ niệm chung hay chia sẻ vị trí và tâm tư qua không gian ẩn danh. Đối với các đội nhóm và cộng đồng, việc có một môi trường thống nhất giúp họ dễ dàng điều phối kế hoạch chung, tạo các cuộc bình chọn minh bạch và quản lý lịch trình hoạt động đồng bộ ngay trên một nền tảng duy nhất.

Về mặt công nghệ, việc xây dựng một hệ thống mạng xã hội tương tác nhóm đòi hỏi sự khắt khe về khả năng truyền tải dữ liệu thời gian thực (realtime communication) với độ trễ tối thiểu, tính toàn vẹn và bảo mật thông tin cao, cùng trải nghiệm người dùng mượt mà trên cả nền tảng Web lẫn Di động. Nắm bắt được xu thế đó, cùng với mong muốn áp dụng các công nghệ lập trình tiên tiến chuẩn doanh nghiệp, nhóm chúng em quyết định thực hiện đề tài "Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm – CIRCLE". Đề tài không chỉ giải quyết trọn vẹn bài toán kết nối thực tiễn mà còn là cơ hội để tiếp cận và làm chủ mô hình kiến trúc hiện đại Modular Monolith, kết hợp hệ sinh thái công nghệ mạnh mẽ như NestJS, TypeScript, Prisma, PostgreSQL, Next.js, React Native (Expo), Socket.IO và tự động hóa quy trình triển khai với Docker, GitHub Actions.

- 1. Mục tiêu của đề tài

Mục tiêu tổng quát của đề tài là xây dựng một nền tảng mạng xã hội kết nối và tương tác nhóm hoàn chỉnh, bảo mật, vận hành ổn định trên đa nền tảng (Web và Mobile), phục vụ hai đối tượng chính là Người dùng (End-User) và Quản trị viên hệ thống (Admin). Cụ thể:

Về mặt chức năng:

Module dành cho Người dùng (End-User):

Cung cấp các tính năng quản lý tài khoản, hồ sơ cá nhân và kết nối bạn bè (tìm kiếm, gửi/chấp nhận/từ chối lời mời).

Xây dựng không gian tương tác nhóm (Circle): cho phép tạo, tham gia và quản lý các nhóm tương tác riêng biệt.

Tích hợp cơ chế chia sẻ thời gian thực: chụp, chia sẻ và tương tác nhanh với các khoảnh khắc trong ngày.

Giao tiếp đa phương tiện: trò chuyện, gửi hình ảnh, video, tệp tin, tin nhắn thoại, ghim tin nhắn quan trọng và thực hiện cuộc gọi thoại, gọi video trực tiếp.

Tiện ích quản trị sinh hoạt nhóm: quản lý album ảnh theo chủ đề, chia sẻ vị trí giữa các thành viên, lập lịch và nhắc nhở sự kiện, tạo bình chọn, tạo vòng xoay may mắn, cùng tính năng chia sẻ ẩn danh.

Module dành cho Quản trị viên (Admin):

Xây dựng trang quản trị (Management Website) tập trung, cung cấp các công cụ: quản lý tài khoản người dùng, kiểm duyệt và quản lý các Circle, giám sát trạng thái hoạt động của hệ thống.

Thống kê các chỉ số tăng trưởng (lượng người dùng mới, số lượng tương tác, dữ liệu truyền tải) và xử lý các báo cáo vi phạm nội dung.

Về mặt phi chức năng:

Đảm bảo tính nhất quán, toàn vẹn dữ liệu và độ trễ tối thiểu trong các luồng tương tác thời gian thực (nhắn tin, gọi điện, chia sẻ khoảnh khắc).

Thiết kế giao diện theo chuẩn Responsive trên Web và tối ưu hóa trải nghiệm native mượt mà trên Mobile (UX/UI thân thiện, dễ thao tác).

Đảm bảo an toàn thông tin với cơ chế xác thực và phân quyền người dùng chặt chẽ, bảo vệ các dữ liệu nhạy cảm và quyền riêng tư trong từng Circle.

Tối ưu hóa hiệu năng truy vấn dữ liệu, xử lý đồng thời khi có nhiều thành viên cùng tương tác, bình chọn hoặc tham gia cuộc gọi trong cùng một nhóm.

Về mặt công nghệ:

Nghiên cứu và áp dụng mô hình kiến trúc Modular Monolith kết hợp mô hình Client–Server nhằm tối ưu hóa tổ chức mã nguồn, phân tách ranh giới các module nghiệp vụ rõ ràng, dễ mở rộng và bảo trì.

Xây dựng hệ thống Backend và RESTful API mạnh mẽ bằng NestJS kết hợp TypeScript, quản lý và thao tác cơ sở dữ liệu quan hệ PostgreSQL thông qua Prisma ORM.

Phát triển ứng dụng Web và Management Website hiện đại bằng Next.js; xây dựng ứng dụng di động đa nền tảng mượt mà bằng React Native và Expo.

Ứng dụng WebSocket / Socket.IO trong truyền tải dữ liệu và giao tiếp thời gian thực hai chiều (realtime communication).

Làm chủ quy trình đóng gói ứng dụng với Docker và tự động hóa quy trình kiểm thử, triển khai liên tục (CI/CD) qua GitHub Actions.

- 1. Cách tiếp cận và phương pháp nghiên cứu

Đối tượng nghiên cứu

Đề tài tập trung nghiên cứu các quy trình nghiệp vụ tương tác mạng xã hội theo mô hình nhóm (Circle) và các giải pháp công nghệ hiện đại nhằm hiện thực hóa hệ thống trên cả nền tảng Web lẫn Di động:

Nghiên cứu nghiệp vụ: Phân tích mô hình hoạt động của các nền tảng mạng xã hội và ứng dụng tương tác cộng đồng nổi bật (như Locket, BeReal, Discord, Telegram...) nhằm hiểu rõ luồng chia sẻ khoảnh khắc tức thì, cơ chế quản lý nhóm, phân quyền thành viên, luồng trao đổi đa phương tiện và các tiện ích điều phối sinh hoạt tập thể (bình chọn, lập kế hoạch, chia sẻ vị trí, chia sẻ ẩn danh).

Nghiên cứu kiến trúc hệ thống: Tìm hiểu sâu về mô hình kiến trúc Client–Server kết hợp Modular Monolith nhằm phân tách các domain nghiệp vụ rõ ràng thành từng module độc lập (User, Friendship, Circle, Chat, Moment, Planning...), giúp mã nguồn có độ gắn kết cao, giảm phụ thuộc lẫn nhau và dễ dàng bảo trì, mở rộng.

Nghiên cứu Backend & Cơ sở dữ liệu: Sử dụng NestJS cùng TypeScript để xây dựng RESTful API theo chuẩn module; áp dụng Prisma ORM kết hợp hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL nhằm mô hình hóa quan hệ thực thể, tối ưu truy vấn và đảm bảo tính toàn vẹn dữ liệu.

Nghiên cứu Frontend & Mobile: Sử dụng Next.js (React) để phát triển ứng dụng Web và giao diện quản trị (Management Website) tối ưu hiệu năng render; sử dụng React Native kết hợp Expo để phát triển ứng dụng di động đa nền tảng (iOS/Android) với giao diện mượt mà và tận dụng tốt các API phần cứng (Camera, Microphone, Geolocation).

Nghiên cứu Giao tiếp thời gian thực & Bảo mật: Tìm hiểu giao thức WebSocket / Socket.IO để xử lý luồng nhắn tin, chia sẻ khoảnh khắc và đồng bộ trạng thái trực tuyến; nghiên cứu giải pháp truyền thông đa phương tiện cho tính năng gọi thoại và gọi video; triển khai cơ chế xác thực và phân quyền người dùng chặt chẽ.

Nghiên cứu DevOps & Tự động hóa: Ứng dụng Docker để container hóa các dịch vụ và thiết lập luồng CI/CD tự động hóa quy trình kiểm thử, đóng gói và triển khai hệ thống thông qua GitHub Actions.

Phạm vi nghiên cứu

Trong khuôn khổ thời gian và nguồn lực thực hiện đề tài, nhóm tập trung giải quyết các bài toán cốt lõi của nền tảng mạng xã hội nhóm CIRCLE:

Quản lý định danh & Quan hệ người dùng: Đăng ký, đăng nhập, quản lý hồ sơ cá nhân; tìm kiếm, gửi, chấp nhận hoặc từ chối lời mời kết bạn.

Không gian kết nối nhóm (Circle): Khởi tạo, cấu hình, tham gia và quản trị thành viên trong từng vòng tròn nhóm riêng biệt.

Tương tác và giao tiếp đa phương tiện thời gian thực:

Chia sẻ khoảnh khắc realtime từ camera và tương tác phản hồi tức thì.

Hệ thống trò chuyện hỗ trợ tin nhắn văn bản, tệp tin, hình ảnh, video, tin nhắn thoại, phản hồi và ghim nội dung quan trọng.

Thực hiện cuộc gọi thoại và gọi hình ảnh trực tiếp.

Bộ công cụ điều phối sinh hoạt nhóm:

Quản lý album và kho lưu trữ hình ảnh theo chủ đề trong Circle.

Chia sẻ vị trí địa lý giữa các thành viên trong nhóm.

Lập kế hoạch hoạt động chung, tạo sự kiện/lịch trình tương lai kèm cơ chế thông báo nhắc lịch.

Tạo lập, tham gia và hiển thị kết quả bình chọn (Poll/Vote).

Kênh chia sẻ nội dung ẩn danh ("Điều muốn nói") nhằm tăng tính gắn kết và thấu hiểu nội bộ.

Quản trị hệ thống: Cung cấp giao diện web cho phép quản trị viên theo dõi người dùng, giám sát các nhóm và kiểm soát các thông báo, vi phạm nội dung.

- 1. Ý nghĩa khoa học và thực tiễn

Về mặt khoa học: Đề tài là cơ hội để nhóm tiếp cận quy trình phát triển phần mềm hiện đại theo mô hình kiến trúc Client–Server kết hợp Modular Monolith. Việc áp dụng cấu trúc module hóa trên nền tảng NestJS và TypeScript giúp sinh viên hiểu sâu sắc cách tổ chức mã nguồn trong các hệ thống phần mềm lớn: phân định ranh giới miền nghiệp vụ rõ ràng, quản lý cơ chế Dependency Injection, tổ chức luồng xử lý thời gian thực qua WebSockets/Socket.IO, và thiết lập mô hình dữ liệu quan hệ chặt chẽ với Prisma ORM và PostgreSQL. Đồng thời, đề tài đóng góp góc nhìn thực nghiệm về việc đồng bộ hóa dữ liệu đa nền tảng (Web và Mobile Native).

Về mặt thực tiễn: Sản phẩm của đề tài có tính ứng dụng cao, đáp ứng nhu cầu thực tế của các nhóm bạn bè, gia đình, câu lạc bộ, lớp học hoặc các đội nhóm làm việc nhỏ về một không gian sinh hoạt số tập trung. Thay vì phải phân mảnh trải nghiệm trên nhiều ứng dụng riêng biệt, CIRCLE tích hợp trọn vẹn từ trò chuyện, gọi điện, chia sẻ khoảnh khắc tức thì đến quản lý kế hoạch, lịch trình, bình chọn và không gian chia sẻ ẩn danh. Hệ thống mang lại môi trường tương tác riêng tư, văn minh, nâng cao sự gắn kết và tính hiệu quả trong sinh hoạt tập thể thời đại số.

- 1. Kết quả dự kiến đạt được

Về mặt sản phẩm phần mềm

Nhóm cam kết hoàn thiện một nền tảng mạng xã hội đa nền tảng bao gồm: Hệ thống Backend API, Ứng dụng Di động (Mobile App), Ứng dụng Web (Web Client) và Trang quản trị (Management Website) với các phân hệ chức năng chính:

Phân hệ dành cho Người dùng (Mobile Application & Web Client):

Quản lý tài khoản & Bạn bè: Đăng ký, đăng nhập an toàn; cập nhật hồ sơ cá nhân; tìm kiếm bạn bè, gửi/nhận/từ chối lời mời kết bạn và quản lý danh bạ kết nối.

Chia sẻ Realtime: Chụp và đăng tải hình ảnh khoảnh khắc tức thì theo thời gian thực; cho phép bạn bè xem và tương tác cảm xúc nhanh với khoảnh khắc được chia sẻ.

Không gian tương tác nhóm (Circle): Tạo nhóm mới, tùy chỉnh thông tin, gửi lời mời tham gia, phân quyền thành viên và quản lý danh sách các Circle đang tham gia.

Giao tiếp đa phương tiện (Chat & Call):

Nhắn tin thời gian thực: trò chuyện cá nhân và trò chuyện nhóm; gửi hình ảnh, video, tệp tin đính kèm và tin nhắn thoại.

Hỗ trợ trả lời, tương tác biểu cảm và ghim các tin nhắn quan trọng trong nhóm.

Thực hiện cuộc gọi trực tiếp: cuộc gọi thoại và cuộc gọi hình ảnh chất lượng cao giữa các thành viên.

Bộ tiện ích sinh hoạt nhóm:

Quản lý hình ảnh: Tạo album hoặc phân mục ảnh theo chủ đề riêng của từng Circle; xem, thêm và lưu trữ kỷ niệm nhóm có tổ chức.

Chia sẻ vị trí: Bật/tắt và chia sẻ vị trí địa lý theo thời gian thực giữa các thành viên trong nhóm.

Lập kế hoạch hoạt động: Khởi tạo, phân công và quản lý tiến độ các kế hoạch chung của nhóm.

Lập lịch và sự kiện: Thiết lập lịch hoạt động, tạo sự kiện trong tương lai, cho phép thành viên xác nhận tham gia và nhận thông báo nhắc lịch tự động.

Bình chọn (Poll/Vote): Tạo cuộc bình chọn nội bộ, bỏ phiếu linh hoạt và theo dõi kết quả thống kê theo thời gian thực.

Điều muốn nói (Anonymous Messages): Không gian gửi bài viết/chia sẻ ẩn danh trong Circle, cho phép các thành viên đọc và tương tác an toàn.

Hệ thống thông báo (Notifications): Tiếp nhận thông báo đẩy tức thì về lời mời kết bạn, tin nhắn mới, lịch sự kiện sắp diễn ra, nhắc hẹn và hoạt động mới trong Circle.

Phân hệ dành cho Quản trị viên (Management Website / Admin Dashboard):

Quản lý người dùng: Tra cứu danh sách tài khoản, xem thông tin chi tiết, khóa/mở khóa tài khoản khi có dấu hiệu vi phạm.

Quản lý Circle: Giám sát danh sách nhóm, thành viên và các trạng thái hoạt động trên toàn hệ thống.

Quản lý nội dung & Báo cáo vi phạm: Kiểm duyệt các phản ánh vi phạm về tin nhắn, hình ảnh hoặc bài viết ẩn danh; thực hiện gỡ bỏ nội dung không phù hợp.

Báo cáo & Thống kê: Thống kê số lượng người dùng mới, lượng Circle được tạo, tần suất tương tác và lưu lượng dữ liệu trao đổi theo thời gian.

Cấu hình hệ thống: Quản lý các tham số vận hành, dịch vụ lưu trữ đa phương tiện và thông báo toàn hệ thống.

Về mặt kỹ thuật và công nghệ

Xây dựng thành công hệ thống Backend API vững chắc bằng NestJS kết hợp TypeScript, tuân thủ nghiêm ngặt nguyên lý thiết kế Modular Monolith và tiêu chuẩn RESTful API.

Thiết kế và triển khai cơ sở dữ liệu quan hệ PostgreSQL tối ưu thông qua Prisma ORM, đảm bảo tính toàn vẹn dữ liệu, quan hệ bảng chặt chẽ và hiệu năng truy vấn cao.

Xây dựng giao diện ứng dụng Web và trang quản trị hiện đại, mượt mà bằng Next.js (React).

Phát triển ứng dụng di động đa nền tảng (iOS và Android) native-like bằng React Native kết hợp nền tảng Expo, tích hợp đầy đủ các phần cứng thiết bị (Camera, Microphone, Vị trí/GPS).

Ứng dụng thành công WebSocket / Socket.IO để xử lý các kênh truyền thông hai chiều thời gian thực (nhắn tin, thông báo, cập nhật bình chọn, chia sẻ khoảnh khắc).

Đóng gói toàn bộ hệ thống bằng Docker và thiết lập pipeline CI/CD tự động hóa quy trình kiểm thử, build và triển khai qua GitHub Actions.

**Về mặt kiến thức và tài liệu**

Hoàn thành cuốn Báo cáo Tiểu luận chuyên ngành với cấu trúc khoa học, chi tiết, phản ánh trung thực toàn bộ quy trình khảo sát, phân tích thiết kế, cài đặt và kết quả kiểm thử hệ thống.

Nâng cao năng lực chuyên môn về kỹ nghệ phần mềm: kỹ năng làm việc nhóm, quản lý và kiểm soát mã nguồn với Git/GitHub, tư duy kiến trúc hệ thống và khả năng giải quyết các bài toán kỹ thuật phức tạp trong môi trường phát triển ứng dụng thời gian thực.

1. PHẦN NỘI DUNG

# CƠ SỞ HỆ THỐNG

## Tổng quan hệ thống mạng xã hội kết nối và tương tác nhóm

**Khái niệm hệ thống mạng xã hội kết nối và tương tác nhóm**

Hệ thống mạng xã hội kết nối và tương tác nhóm là một hệ thống thông tin trực tuyến được thiết kế chuyên biệt nhằm phục vụ nhu cầu kết nối, duy trì quan hệ và phối hợp hoạt động trong các tập thể, cộng đồng thu nhỏ (như bạn bè, gia đình, câu lạc bộ hay nhóm làm việc). Nền tảng cho phép người dùng định danh cá nhân, tạo lập các vòng tròn kết nối riêng tư (Circles), trao đổi thông tin đa phương tiện tức thì, chia sẻ khoảnh khắc theo thời gian thực và đồng bộ hóa các tiện ích sinh hoạt nhóm (lịch trình, bình chọn, kế hoạch, vị trí) một cách trực quan và bảo mật.

**Các thành phần chính của hệ thống tương tác nhóm CIRCLE**

**Quản lý tài khoản và quan hệ người dùng:** Đăng ký, đăng nhập và cập nhật hồ sơ cá nhân; tìm kiếm người dùng; gửi, tiếp nhận hoặc từ chối lời mời kết bạn; quản lý danh sách bạn bè thân thiết.

**Không gian nhóm:** Khởi tạo và cấu hình thông tin nhóm; quản lý danh sách thành viên, phân quyền vai trò; quản lý album hình ảnh và kho lưu trữ kỷ niệm theo chủ đề riêng của từng Circle.

**Hệ thống giao tiếp thời gian thực:** Trò chuyện cá nhân và nhóm qua tin nhắn văn bản, hình ảnh, video, tệp tin và tin nhắn thoại; tương tác biểu cảm, ghim thông tin quan trọng; thực hiện cuộc gọi thoại và gọi video trực tiếp.

**Chia sẻ khoảnh khắc (Realtime):** Ghi lại và chia sẻ hình ảnh tức thì từ camera; hỗ trợ bạn bè theo dõi, phản hồi nhanh và tạo cảm giác hiện diện đồng thời giữa các thành viên.

**Bộ công cụ điều phối sinh hoạt tập thể:** Chia sẻ vị trí địa lý theo thời gian thực; khởi tạo và phân công kế hoạch hoạt động; lập lịch sự kiện tương lai kèm cơ chế thông báo nhắc hẹn tự động; tạo cuộc bình chọn (Poll/Vote) minh bạch; không gian gửi tâm tư ẩn danh ("Điều muốn nói").

**Phân hệ quản trị và giám sát:** Quản lý trạng thái tài khoản người dùng; giám sát hoạt động của các nhóm; tiếp nhận và xử lý báo cáo vi phạm nội dung; thống kê lưu lượng tương tác và kiểm soát tính ổn định của toàn hệ thống.

**Kết luận**

Mạng xã hội tập trung vào tương tác nhóm là một xu hướng công nghệ thiết yếu, phản ánh sự chuyển dịch từ các nền tảng đại chúng rộng lớn sang những không gian số riêng tư, gắn kết và hiệu quả hơn. Việc xây dựng một hệ thống tương tác nhóm hiện đại, trực quan, hỗ trợ đa nền tảng và vận hành ổn định trên nền công nghệ thời gian thực như CIRCLE là giải pháp quan trọng nhằm đáp ứng nhu cầu giao tiếp sâu sắc và điều phối sinh hoạt tập thể trong kỷ nguyên số.



## Các vấn đề nghiệp vụ và kỹ thuật then chốt

**Xử lý thời gian thực và đồng bộ dữ liệu:**

Đảm bảo độ trễ thấp và thứ tự tin nhắn chính xác khi hàng loạt thành viên cùng nhắn tin, thả biểu cảm hoặc gửi tin nhắn thoại trong nhóm cùng lúc.

Xử lý xung đột dữ liệu đồng thời khi nhiều người dùng cùng tham gia bỏ phiếu trong các cuộc bình chọn (Poll/Vote), cập nhật trạng thái lịch trình hoặc đồng bộ hóa vị trí địa lý theo thời gian thực mà không làm sai lệch số liệu.

**Hiệu năng và khả năng mở rộng:**

Tối ưu hóa việc phân phối dữ liệu đa phương tiện (hình ảnh khoảnh khắc realtime, video, tệp tin và bản ghi âm giọng nói) nhằm giảm tải băng thông server.

Thiết kế cơ sở dữ liệu với Prisma và PostgreSQL bảo đảm đánh chỉ mục hiệu quả, tối ưu hóa các câu truy vấn quan hệ nhiều tầng để hệ thống phản hồi tức thì ngay cả khi lượng tương tác tăng cao.

**Bảo mật và quyền riêng tư:**

Xác thực và phân quyền đa lớp: Đảm bảo chỉ những thành viên thuộc Circle mới có quyền truy cập vào nội dung tin nhắn, album ảnh, vị trí và lịch trình nội bộ.

Bảo đảm tính ẩn danh tuyệt đối cho tính năng _"Điều muốn nói"_, ngăn chặn việc truy vết ngược lại danh tính người gửi ở cả tầng giao diện lẫn tầng lưu trữ dữ liệu.

Bảo vệ an toàn các luồng truyền thông thời gian thực (Socket/WebRTC) và mã hóa thông tin tài khoản người dùng.

**Độ tin cậy và tính ổn định:**

Duy trì kết nối liên tục qua WebSocket/Socket.IO, xử lý mượt mà kịch bản người dùng bị mất mạng đột ngột (network reconnection), tự động khôi phục phiên kết nối và đồng bộ lại các tin nhắn/thông báo chưa nhận.

Cơ chế xử lý lỗi ngoại lệ (exception handling), ghi log hoạt động và chiến lược sao lưu dữ liệu quan hệ định kỳ trên PostgreSQL.

**Quy trình quản trị và vận hành nhóm:**

Vòng đời của một nhóm (Circle): Khởi tạo nhóm 🡪 Mời/xét duyệt thành viên 🡪 Phân quyền vai trò (Owner, Member) 🡪 Cấu hình quy tắc hoạt động 🡪 Lưu trữ hoặc giải tán nhóm.

Quy trình kiểm duyệt và xử lý vi phạm: Tiếp nhận báo cáo vi phạm (nội dung độc hại, tin nhắn quấy rối, chia sẻ ẩn danh tiêu cực) 🡪 Quản trị viên can thiệp xử lý 🡪 Khóa tính năng hoặc đình chỉ tài khoản người dùng vi phạm.

**Luồng nghiệp vụ tương tác khép kín:**

Luồng chia sẻ khoảnh khắc: Chụp ảnh trực tiếp từ camera 🡪 Đẩy lên server tức thì 🡪 Phân phối realtime đến bạn bè trong Circle 🡪 Tiếp nhận phản hồi/cảm xúc 🡪 Tự động lưu trữ vào album kỷ niệm nhóm.

Luồng điều phối hoạt động: Đề xuất ý tưởng 🡪 Khởi tạo bình chọn (Vote) 🡪 Chốt kết quả 🡪 Tạo sự kiện trên lịch nhóm (Schedule) 🡪 Tự động gửi thông báo nhắc hẹn trước giờ khởi hành.

## Kiến trúc phần mềm và mô hình thiết kế: Modular Monolith kết hợp Client–Server)

Hệ thống CIRCLE được định hình nhằm giải quyết bài toán giao tiếp thời gian thực, quản lý tương tác nhóm đa chiều trên cả hai nền tảng Web và Di động. Để tối ưu hóa hiệu năng, giảm chi phí vận hành hạ tầng nhưng vẫn đảm bảo khả năng mở rộng trong tương lai, hệ thống áp dụng mô hình kiến trúc Client–Server phân tán kết hợp với phong cách tổ chức mã nguồn Modular Monolith ở tầng Backend.

Mô hình Client–Server phân tán đa nền tảng

Hệ thống phân tách rạch ròi giữa phía máy khách (Client) chịu trách nhiệm hiển thị giao diện, thu nhận tương tác người dùng và phía máy chủ (Server) quản trị dữ liệu, điều phối logic nghiệp vụ:

**Tầng Client:** Gồm hai phân hệ ứng dụng độc lập:

**Ứng dụng Di động (Mobile Client):** Xây dựng bằng React Native và Expo, là giao diện chính phục vụ người dùng cuối thực hiện các thao tác di động như: chụp và chia sẻ khoảnh khắc realtime, nhắn tin, gọi thoại/video, chia sẻ tọa độ vị trí và nhận thông báo đẩy.

**Ứng dụng Web & Quản trị (Web Client & Management):** Xây dựng bằng Next.js, cung cấp giao diện trải nghiệm mạng xã hội trên trình duyệt máy tính, đồng thời tích hợp bảng điều khiển trung tâm (Dashboard) cho Quản trị viên (Admin) quản lý người dùng, nhóm và kiểm duyệt nội dung.

**Tầng Server (Backend API & Realtime Gateway):** Xây dựng trên nền tảng NestJS, cung cấp hệ thống RESTful API chuẩn mực để xử lý dữ liệu có cấu trúc và tích hợp các WebSocket Gateways chuyên trách quản lý luồng dữ liệu song công hai chiều thời gian thực (Realtime Full-Duplex).

Kiến trúc Modular Monolith ở tầng Backend

Thay vì triển khai Microservices phức tạp đòi hỏi hạ tầng mạng phân tán tốn kém, hoặc kiến trúc Monolith truyền thống dễ dẫn đến tình trạng mã nguồn bị phụ thuộc chéo, CIRCLE áp dụng kiến trúc Modular Monolith:

**Tính đóng gói cao:** Toàn bộ mã nguồn Backend được nhóm thành các module nghiệp vụ biệt lập (AuthModule, UserModule, FriendshipModule, CircleModule, ChatModule, CallModule, MomentModule, MediaModule, ScheduleModule, PollModule, ConfessionModule, NotificationModule). Mỗi module chứa trọn vẹn:

**Controllers / Gateways:** Điểm tiếp nhận request HTTP và lắng nghe sự kiện WebSocket.

**Services:** Chứa quy tắc nghiệp vụ đặc thù của riêng module đó.

**Data Access Objects:** Thao tác với cơ sở dữ liệu thông qua Prisma Client.

**Liên kết lỏng lẻ:** Các module tương tác với nhau thông qua cơ chế Dependency Injection nội tại của NestJS hoặc cơ chế phát sự kiện bất đồng bộ. Một module chỉ phơi bày các interface/service công khai mà không cho phép module khác can thiệp trực tiếp vào cấu trúc dữ liệu nội bộ.

**Khả năng tiến hóa:** Với các ranh giới module rõ ràng, khi một phân hệ chịu tải đột biến (như ChatModule hoặc MomentModule), đội ngũ kỹ thuật có thể dễ dàng tách module đó thành một Microservice độc lập mà không cần phải tái cấu trúc lại toàn bộ hệ thống.

## Cơ chế bảo mật và xác thực

Hệ thống mạng xã hội tương tác nhóm CIRCLE quản lý lượng lớn dữ liệu nhạy cảm: thông tin danh tính, tin nhắn riêng tư, tọa độ GPS thời gian thực, tệp tin đa phương tiện và các bài viết ẩn danh. Do đó, hệ thống thiết lập cơ chế bảo mật đa tầng từ xác thực, phân quyền đến bảo vệ dữ liệu truyền tải.

Cơ chế xác thực

**Xác thực phi trạng thái với JWT:**

**Access Token:** Mang thời gian sống ngắn, dùng để chứng thực mọi yêu cầu gửi đến REST API qua HTTP Header và dùng làm vé xác thực khi bắt tay thiết lập kết nối WebSocket.

**Refresh Token:** Mang thời gian sống dài hơn, được lưu trữ bảo mật nhằm phục vụ việc cấp mới Access Token tự động mà không bắt người dùng phải đăng nhập lại nhiều lần.

**Mã hóa mật khẩu an toàn:** Sử dụng thuật toán băm một chiều bcrypt kết hợp salt ngẫu nhiên để mã hóa mật khẩu người dùng trước khi ghi nhận vào cơ sở dữ liệu, loại trừ rủi ro lộ mật khẩu gốc.

Cơ chế phân quyền đa cấp

**Phân quyền cấp hệ thống:** Sử dụng các NestJS Guards để phân định quyền hạn giữa hai nhóm đối tượng: User (người dùng thông thường) và Admin (quản trị viên quản lý báo cáo, người dùng và hệ thống).

**Phân quyền cấp độ nhóm:** Kiểm soát quyền hạn trong từng nhóm tương tác dựa trên vai trò:

_Owner (Trưởng nhóm):_ Có toàn quyền cấu hình nhóm, chuyển nhượng quyền, giải tán nhóm hoặc xóa thành viên.

_Member (Thành viên):_ Trò chuyện, chia sẻ khoảnh khắc, gọi điện, bỏ phiếu và gửi bài viết ẩn danh.

**Bảo vệ phòng chat và nhóm:** Mọi thao tác truy xuất dữ liệu hay tham gia vào các luồng Socket (Rooms) đều phải đi qua middleware kiểm tra tư cách thành viên (Member Guard). Thành viên ngoài nhóm tuyệt đối không thể lắng nghe hoặc phát tín hiệu vào Circle khác.

Bảo vệ dữ liệu truyền tải và tính riêng tư

**Mã hóa đường truyền:** Áp dụng giao thức HTTPS và WSS (WebSocket Secure) qua chứng chỉ SSL/TLS nhằm ngăn chặn nguy cơ tấn công nghe lén (Man-in-the-middle) và đánh cắp dữ liệu trên đường truyền.

**Bảo vệ tính ẩn danh ("Điều muốn nói"):** Thiết kế lược đồ dữ liệu tách rời định danh người dùng khỏi nội dung bài viết ẩn danh, đảm bảo không thể truy vết ngược lại danh tính người gửi ở cả giao diện lẫn cơ sở dữ liệu.

**Bảo vệ vị trí (Location Privacy):** Tọa độ địa lý chỉ được chia sẻ theo thời gian thực khi người dùng chủ động kích hoạt và được giới hạn phạm vi hiển thị trong Circle tương ứng; dữ liệu có thể tắt hoặc xóa ngay lập tức theo yêu cầu người dùng.

**Bảo vệ hệ thống:** Cấu hình CORS nghiêm ngặt, sử dụng Helmet bảo vệ HTTP Headers, và tích hợp cơ chế giới hạn tần suất gửi yêu cầu (Rate Limiting) để ngăn chặn tấn công Brute-Force hoặc Spam API.

## Các công nghệ sử dụng

Hệ sinh thái công nghệ của đề tài **CIRCLE** được lựa chọn đồng bộ, chuẩn hóa theo các công nghệ phát triển phần mềm hiện đại:

| **Phân hệ / Tầng**                  | **Công nghệ / Thư viện**  | **Vai trò và Lý do lựa chọn**                                                                                                                                                           |
| ----------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend Framework**               | **NestJS**                | Framework Node.js tiến tiến, hỗ trợ TypeScript mạnh mẽ, áp dụng cấu trúc module hóa chuẩn mực, tích hợp sẵn Dependency Injection và hỗ trợ kiến trúc Modular Monolith tối ưu.           |
| **Ngôn ngữ lập trình**              | **TypeScript**            | Đảm bảo tính an toàn kiểu dữ liệu (Type-safety), giảm thiểu lỗi lúc runtime, tối ưu hóa quá trình làm việc nhóm và bảo trì mã nguồn lớn.                                                |
| **Cơ sở dữ liệu**                   | **PostgreSQL**            | Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ, đảm bảo tính toàn vẹn dữ liệu (ACID), hỗ trợ đánh chỉ mục linh hoạt và xử lý tốt các cấu trúc dữ liệu quan hệ phức tạp.          |
| **ORM (Object-Relational Mapping)** | **Prisma ORM**            | Công cụ ORM hiện đại thế hệ mới, tự động sinh code type-safe client dựa trên Schema, trực quan hóa lược đồ cơ sở dữ liệu và quản lý Migration chính xác, dễ dàng.                       |
| **Realtime Communication**          | **WebSocket / Socket.IO** | Thiết lập kết nối song công hai chiều thời gian thực giữa Client và Server; hỗ trợ phân chia Room/Namespace phục vụ tính năng Chat, Call, chia sẻ vị trí và thông báo tức thì.          |
| **Web Application & Admin**         | **Next.js (React)**       | Framework React hỗ trợ Server-Side Rendering (SSR) và Client-Side Rendering linh hoạt, tối ưu hiệu năng hiển thị và xây dựng giao diện quản trị (Management Dashboard) trực quan.       |
| **Mobile Application**              | **React Native & Expo**   | Xây dựng ứng dụng di động đa nền tảng (iOS & Android) từ một cơ sở mã nguồn duy nhất; tận dụng tối đa các API native của thiết bị (Camera chụp ảnh realtime, Mic gọi điện, GPS vị trí). |
| **Đóng gói & Ảo hóa**               | **Docker**                | Đóng gói toàn bộ mã nguồn Backend, Cơ sở dữ liệu và các dịch vụ phụ trợ vào các Containers độc lập, đảm bảo tính nhất quán giữa môi trường phát triển và triển khai thực tế.            |
| **Tự động hóa CI/CD**               | **GitHub Actions**        | Tự động hóa quy trình kiểm tra chất lượng mã nguồn (Linting, Test) và tự động xây dựng (Build), đóng gói image khi có thay đổi trên kho lưu trữ GitHub.                                 |

# PHÂN TÍCH THIẾT KẾ

## Tổng quan kiến trúc hệ thống

## Mô hình hóa yêu cầu

### Nhận diện tác nhân và chức năng trong sơ đồ use case

Dựa trên yêu cầu nghiệp vụ của hệ thống Circle, các tác nhân tham gia vào hệ thống được chia thành hai nhóm chính: tác nhân người dùng trực tiếp và tác nhân/hệ thống hỗ trợ bên ngoài. Mỗi tác nhân sẽ tương tác với hệ thống thông qua các chức năng phù hợp với vai trò, quyền hạn và phạm vi công việc của mình.

Bảng 2.1. Các tác nhân và chức năng trong sơ đồ Use case

| **Tác nhân**                                | **Chức năng**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Khách vãng lai** (Guest)                  | \- Register Account (UC01)<br><br>\- Sign In (UC02)<br><br>\- Recover Password (UC03)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Người dùng** (User)                       | \- Manage User Profile (UC04)<br><br>\- Change Password & Notification Settings (UC05)<br><br>\- Manage Friend Connections (UC06)<br><br>\- Create Circle (UC07)<br><br>\- Search & Request Circle Join (UC08)                                                                                                                                                                                                                                                                                                                                                                 |
| **Thành viên nhóm** (Circle Member)         | \- Publish Circle Moment (UC09)<br><br>\- View & React to Moments (UC10)<br><br>\- Send Multimedia Messages (UC11)<br><br>\- Initiate Group Call (UC12)<br><br>\- Pin / Unpin Message (UC13)<br><br>\- Manage Shared Album (UC14)<br><br>\- Manage Group Poll (UC15)<br><br>\- Spin Decision Wheel (UC16)<br><br>\- Manage Group Calendar & Reminders (UC17)<br><br>\- Collaborate on Planning Sheet (UC18)<br><br>\- Share Live Location (UC19)<br><br>\- Update Circle Nickname (UC20)<br><br>\- Submit Anonymous Post ("Words Unsaid") (UC21)<br><br>\- Leave Circle (UC22) |
| **Trưởng nhóm** (Circle Owner)              | \- Update Circle Metadata (UC23)<br><br>\- Manage Circle Members (UC24)<br><br>\- Transfer Circle Ownership (UC25)<br><br>\- Dissolve Circle (UC26)                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Hệ thống Email** (Email Service)          | \- Send OTP Verification Code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Hệ thống WebSocket / WebRTC**             | \- Real-time synchronization (Chat, Planning Sheet, Live Location, Group Calls)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Dịch vụ Lưu trữ Đám mây** (Cloud Storage) | \- Media storage & processing (Moments, Shared Albums, Attachments)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### Lược đồ usecase

![Sơ đồ Use Case tổng thể hệ thống CIRCLE](../requirements/diagrams/usecase.png)

> **Ghi chú:** Tệp nguồn mô hình sơ đồ Use Case lưu trữ tại [`docs/requirements/diagrams/usecase.xml`](../requirements/diagrams/usecase.xml).

### Đặc tả Use case

#### 2.3.1. Use case Register Account

**Bảng 2.1. Mô tả use case Register Account**

| **Use Case: UC01: Register Account** | |
| --- | | --- |
| **Mô tả** | Cho phép khách vãng lai đăng ký tài khoản mới trên hệ thống bằng thông tin cá nhân. Hệ thống gửi mã xác minh OTP qua email để người dùng kích hoạt tài khoản trước khi đăng nhập. |
| **Tác nhân kích hoạt** | Khách vãng lai (Guest) |
| **Tiền điều kiện** | • Người dùng chưa đăng nhập hệ thống.<br><br>• Email đăng ký chưa tồn tại trên hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Tài khoản được tạo và kích hoạt thành công, chuyển đến màn hình đăng nhập.<br><br>• **Thất bại:** Tài khoản dừng ở trạng thái chưa xác minh (Pending) hoặc bị hủy bỏ (Rollback) nếu xảy ra lỗi hệ thống. |
| **Các bước thực hiện** | (1) Người dùng chọn chức năng "Đăng ký" trên màn hình khởi động.<br><br>(2) Hệ thống hiển thị biểu mẫu nhập: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.<br><br>(3) Người dùng nhập đầy đủ thông tin và gửi yêu cầu đăng ký.<br><br>(4) Hệ thống kiểm tra dữ liệu, tạo tài khoản tạm thời và gửi mã OTP qua email.<br><br>(5) Hệ thống chuyển sang màn hình nhập mã xác thực OTP.<br><br>(6) Người dùng nhập mã OTP nhận được từ email và xác nhận.<br><br>(7) Hệ thống kiểm tra mã OTP; nếu chính xác, kích hoạt tài khoản thành công.<br><br>(8) Hệ thống điều hướng người dùng sang màn hình Đăng nhập. |
| **Luồng thay thế** | **A1. Thông tin không hợp lệ:**<br><br>• 4a. Hệ thống phát hiện trường dữ liệu để trống hoặc mật khẩu không đủ độ dài an toàn.<br><br>• 4b. Hệ thống thông báo lỗi tương ứng và yêu cầu chỉnh sửa.<br><br>• 4c. Người dùng cập nhật lại thông tin và gửi lại yêu cầu.<br><br>**A2. Email đã tồn tại:**<br><br>• 4a. Hệ thống phát hiện email đã được sử dụng.<br><br>• 4b. Hệ thống thông báo email đã tồn tại và gợi ý đăng nhập hoặc dùng email khác.<br><br>**A3. Mã OTP sai hoặc hết hạn:**<br><br>• 7a. Hệ thống phát hiện mã OTP không đúng hoặc quá thời gian hiệu lực.<br><br>• 7b. Hệ thống thông báo lỗi và yêu cầu nhập lại hoặc gửi lại mã mới. |

2.3.2. Use case Sign In

**Bảng 2.2. Mô tả use case Sign In**

| **Use Case: UC02: Sign In** | |
| --- | | --- |
| **Mô tả** | Xác thực danh tính người dùng bằng Email và Mật khẩu, cấp mã định danh phiên làm việc (Access Token) để cấp quyền truy cập hệ thống. |
| **Tác nhân kích hoạt** | Khách vãng lai (Guest) |
| **Tiền điều kiện** | • Tài khoản đã đăng ký và kích hoạt email thành công. |
| **Hậu điều kiện** | • **Thành công:** Cấp mã phiên truy cập, người dùng chuyển sang vai trò User và được đưa vào trang chính.<br><br>• **Thất bại:** Từ chối truy cập, giữ nguyên giao diện và hiển thị thông báo lỗi. |
| **Các bước thực hiện** | (1) Người dùng chọn chức năng "Đăng nhập".<br><br>(2) Hệ thống hiển thị biểu mẫu gồm Email và Mật khẩu.<br><br>(3) Người dùng nhập thông tin tài khoản và nhấn "Đăng nhập".<br><br>(4) Hệ thống đối soát thông tin với cơ sở dữ liệu.<br><br>(5) Hệ thống tạo Token xác thực, lưu phiên làm việc và chuyển vào màn hình chính. |
| **Luồng thay thế** | **A1. Sai email hoặc mật khẩu:**<br><br>• 4a. Hệ thống phát hiện email không tồn tại hoặc mật khẩu không khớp.<br><br>• 4b. Hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại.<br><br>**A2. Tài khoản chưa kích hoạt:**<br><br>• 4a. Hệ thống phát hiện tài khoản chưa hoàn tất xác thực email.<br><br>• 4b. Hệ thống tự động chuyển hướng sang màn hình nhập mã OTP để kích hoạt.<br><br>**A3. Tài khoản bị tạm khóa:**<br><br>• 4a. Hệ thống phát hiện tài khoản bị khóa do vi phạm hoặc nhập sai nhiều lần.<br><br>• 4b. Hệ thống từ chối đăng nhập và hiển thị hướng dẫn hỗ trợ. |

2.3.3. Use case Recover Password

**Bảng 2.3. Mô tả use case Recover Password**

| **Use Case: UC03: Recover Password** | |
| --- | | --- |
| **Mô tả** | Hỗ trợ người dùng đặt lại mật khẩu mới khi bị quên thông qua mã xác nhận bảo mật gửi về email đã đăng ký. |
| **Tác nhân kích hoạt** | Khách vãng lai (Guest) |
| **Tiền điều kiện** | • Email yêu cầu khôi phục phải tồn tại trên hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Mật khẩu mới được cập nhật mã hóa trong cơ sở dữ liệu, hủy các phiên đăng nhập cũ.<br><br>• **Thất bại:** Mật khẩu cũ không thay đổi. |
| **Các bước thực hiện** | (1) Người dùng chọn "Quên mật khẩu?" tại màn hình đăng nhập.<br><br>(2) Hệ thống yêu cầu nhập địa chỉ Email đã đăng ký.<br><br>(3) Người dùng nhập email và bấm "Gửi mã xác nhận".<br><br>(4) Hệ thống kiểm tra email và gửi mã xác thực gồm 6 số.<br><br>(5) Người dùng nhập mã xác thực và thiết lập mật khẩu mới kèm xác nhận mật khẩu.<br><br>(6) Hệ thống kiểm tra mã hợp lệ, cập nhật mật khẩu mới và thông báo thành công.<br><br>(7) Hệ thống chuyển hướng về màn hình đăng nhập. |
| **Luồng thay thế** | **A1. Email không tồn tại:**<br><br>• 4a. Hệ thống không tìm thấy tài khoản với email đã nhập.<br><br>• 4b. Hệ thống thông báo lỗi và yêu cầu kiểm tra lại.<br><br>**A2. Mã xác nhận không đúng hoặc hết hạn:**<br><br>• 6a. Hệ thống phát hiện mã xác nhận không hợp lệ.<br><br>• 6b. Hệ thống thông báo lỗi và cho phép yêu cầu gửi lại mã mới. |

2.3.4. Use case Manage User Profile

**Bảng 2.4. Mô tả use case Manage User Profile**

| **Use Case: UC04: Manage User Profile** | |
| --- | | --- |
| **Mô tả** | Cho phép người dùng cập nhật hồ sơ cá nhân bao gồm: tên hiển thị, ảnh đại diện, tiểu sử và trạng thái hoạt động. |
| **Tác nhân kích hoạt** | Người dùng (User) |
| **Tiền điều kiện** | • Người dùng đã đăng nhập vào hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Thông tin cá nhân mới được cập nhật trên toàn hệ thống và hiển thị cho bạn bè.<br><br>• **Thất bại:** Thông tin cũ được giữ nguyên, báo lỗi cập nhật. |
| **Các bước thực hiện** | (1) Người dùng vào mục "Hồ sơ cá nhân" và chọn "Chỉnh sửa hồ sơ".<br><br>(2) Hệ thống hiển thị biểu mẫu chứa các thông tin hiện tại.<br><br>(3) Người dùng thay đổi ảnh đại diện, tên hiển thị, lời giới thiệu hoặc trạng thái.<br><br>(4) Người dùng nhấn "Lưu thay đổi".<br><br>(5) Hệ thống kiểm tra tính hợp lệ của tệp ảnh và độ dài ký tự, lưu dữ liệu và thông báo cập nhật thành công. |
| **Luồng thay thế** | **A1. Định dạng ảnh không hỗ trợ hoặc dung lượng quá lớn:**<br><br>• 5a. Hệ thống phát hiện tệp ảnh vượt quá 5MB hoặc sai định dạng.<br><br>• 5b. Hệ thống hiển thị cảnh báo và yêu cầu chọn lại tệp ảnh hợp lệ.<br><br>**A2. Tên hiển thị để trống:**<br><br>• 5a. Người dùng xóa trống trường tên hiển thị.<br><br>• 5b. Hệ thống yêu cầu tên hiển thị phải có ít nhất 1 ký tự. |

2.3.5. Use case Change Password & Notification Settings

**Bảng 2.5. Mô tả use case Change Password & Notification Settings**

| **Use Case: UC05: Change Password & Notification Settings** | |
| --- | | --- |
| **Mô tả** | Cho phép người dùng đổi mật khẩu đăng nhập định kỳ và tùy chỉnh bật/tắt nhận thông báo đẩy (tin nhắn nhóm, nhắc lịch hẹn, bài đăng mới). |
| **Tác nhân kích hoạt** | Người dùng (User) |
| **Tiền điều kiện** | • Người dùng đã đăng nhập hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Mật khẩu mới hoặc cấu hình nhận thông báo được lưu lại thành công.<br><br>• **Thất bại:** Giữ nguyên trạng thái cài đặt trước đó. |
| **Các bước thực hiện** | (1) Người dùng vào mục "Cài đặt & Bảo mật".<br><br>(2) Để đổi mật khẩu: Người dùng nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới rồi nhấn "Đổi mật khẩu".<br><br>(3) Hệ thống xác thực mật khẩu cũ và lưu mật khẩu mới đã mã hóa.<br><br>(4) Để cài đặt thông báo: Người dùng gạt bật/tắt các công tắc thông báo (thông báo âm thanh, rung, xem trước tin nhắn) và hệ thống lưu tự động. |
| **Luồng thay thế** | **A1. Nhập sai mật khẩu hiện tại:**<br><br>• 3a. Hệ thống đối soát thấy mật khẩu cũ không khớp.<br><br>• 3b. Hệ thống từ chối cập nhật và yêu cầu nhập lại đúng mật khẩu.<br><br>**A2. Mật khẩu mới trùng mật khẩu cũ:**<br><br>• 3a. Người dùng nhập mật khẩu mới giống hệt mật khẩu hiện tại.<br><br>• 3b. Hệ thống cảnh báo mật khẩu mới phải khác mật khẩu cũ. |

2.3.6. Use case Manage Friend Connections

**Bảng 2.6. Mô tả use case Manage Friend Connections**

| **Use Case: UC06: Manage Friend Connections** | |
| --- | | --- |
| **Mô tả** | Cho phép tìm kiếm người dùng khác qua email/tên, gửi lời mời kết bạn, đồng ý/từ chối lời mời hoặc hủy kết bạn để thuận tiện thêm vào các Circle. |
| **Tác nhân kích hoạt** | Người dùng (User) |
| **Tiền điều kiện** | • Người dùng đã đăng nhập hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Mối quan hệ bạn bè được thiết lập hoặc gỡ bỏ trong danh bạ hệ thống. |
| **Các bước thực hiện** | (1) Người dùng vào mục "Bạn bè" và nhập từ khóa tìm kiếm (email/tên).<br><br>(2) Hệ thống trả về danh sách tài khoản phù hợp.<br><br>(3) Người dùng bấm "Kết bạn" đối với tài khoản mong muốn.<br><br>(4) Hệ thống gửi thông báo yêu cầu kết bạn đến tài khoản nhận.<br><br>(5) Người nhận mở danh sách yêu cầu và chọn "Chấp nhận" hoặc "Từ chối".<br><br>(6) Nếu chấp nhận, hệ thống lưu trạng thái là bạn bè và đưa vào danh sách liên hệ. |
| **Luồng thay thế** | **A1. Hủy lời mời kết bạn đã gửi:**<br><br>• 3a. Người dùng bấm vào nút "Đã gửi lời mời".<br><br>• 3b. Hệ thống thu hồi lời mời kết bạn.<br><br>**A2. Hủy kết bạn (Unfriend):**<br><br>• 1a. Người dùng chọn một người trong danh sách bạn bè và bấm "Hủy kết bạn".<br><br>• 1b. Hệ thống xóa quan hệ liên kết bạn bè giữa hai tài khoản. |

2.3.7. Use case Create Circle

**Bảng 2.7. Mô tả use case Create Circle**

| **Use Case: UC07: Create Circle** | |
| --- | | --- |
| **Mô tả** | Khởi tạo một không gian Circle mới. Người tạo tự động trở thành Circle Owner duy nhất và mời bạn bè vào không gian này. |
| **Tác nhân kích hoạt** | Người dùng (User) |
| **Tiền điều kiện** | • Người dùng đã đăng nhập hệ thống. |
| **Hậu điều kiện** | • **Thành công:** Circle được tạo, người tạo trở thành Circle Owner, gửi lời mời đến bạn bè được chọn và mở giao diện nhóm.<br><br>• **Thất bại:** Hệ thống hủy tác vụ, hiển thị lỗi. |
| **Các bước thực hiện** | (1) Người dùng bấm biểu tượng "Tạo Circle mới".<br><br>(2) Hệ thống hiển thị biểu mẫu: Tên nhóm (bắt buộc), Ảnh đại diện/bìa nhóm, Mô tả mục đích nhóm, Số lượng người.<br><br>(3) Người dùng điền thông tin và bấm "Tiếp tục".<br><br>(4) Hệ thống hiển thị danh sách bạn bè để chọn mời.<br><br>(5) Người dùng chọn bạn bè và bấm "Xác nhận tạo".<br><br>(6) Hệ thống kiểm tra tổng sĩ số, khởi tạo nhóm, gán quyền Circle Owner và mở màn hình nhóm. |
| **Luồng thay thế** | **A1. Không chọn thành viên ngay:**<br><br>• 4a. Người dùng bỏ qua bước chọn bạn bè từ danh bạ.<br><br>• 4b. Hệ thống khởi tạo Circle với 1 thành viên duy nhất (N=1) chờ mời sau.<br><br>**A2. Vượt quá giới hạn số lượng thành viên :**<br><br>• 6a. Hệ thống phát hiện tổng số thành viên vượt quá số người quy định.<br><br>• 6b. Hệ thống cảnh báo: "Mỗi Circle chỉ tối đa số thành viên để đảm bảo tính gắn kết. Vui lòng bỏ chọn bớt thành viên."<br><br>• 6c. Người dùng giảm bớt số lượng bạn bè và xác nhận lại. |

2.3.8. Use case Search & Request Circle Join

**Bảng 2.8. Mô tả use case Search & Request Circle Join**

| **Use Case: UC08: Search & Request Circle Join** | |
| --- | | --- |
| **Mô tả** | Cho phép người dùng tìm kiếm Circle qua mã định danh (Circle ID) hoặc truy cập qua đường dẫn mời (Invite Link) để gửi yêu cầu gia nhập nhóm. |
| **Tác nhân kích hoạt** | Người dùng (User) |
| **Tiền điều kiện** | • Người dùng đã đăng nhập và chưa phải là thành viên của Circle đó. |
| **Hậu điều kiện** | • **Thành công:** Yêu cầu gia nhập được chuyển vào hàng đợi duyệt của Circle Owner.<br><br>• **Thất bại:** Không gửi được yêu cầu do nhóm đã đầy hoặc mã không hợp lệ. |
| **Các bước thực hiện** | (1) Người dùng nhập mã Circle ID vào ô tìm kiếm hoặc nhấn vào đường link mời được chia sẻ.<br><br>(2) Hệ thống truy xuất và hiển thị thông tin tóm tắt: Tên Circle, Avatar, số lượng thành viên hiện tại.<br><br>(3) Người dùng bấm nút "Xin tham gia Circle".<br><br>(4) Hệ thống ghi nhận yêu cầu và gửi thông báo chờ duyệt đến Circle Owner. |
| **Luồng thay thế** | **A1. Circle đã đủ số thành viên:**<br><br>• 2a. Hệ thống nhận diện Circle đã đạt sĩ số tối đa.<br><br>• 2b. Hệ thống vô hiệu hóa nút gửi yêu cầu và thông báo Circle đã đủ thành viên.<br><br>**A2. Đã có yêu cầu đang chờ xử lý:**<br><br>• 3a. Người dùng đã bấm gửi trước đó.<br><br>• 3b. Hệ thống hiển thị trạng thái "Đang chờ duyệt" và không cho gửi lặp lại. |

2.3.9. Use case Publish Circle Moment

**Bảng 2.9. Mô tả use case Publish Circle Moment**

| **Use Case: UC09: Publish Circle Moment** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên chụp hoặc tải ảnh khoảnh khắc trực tiếp trong ngày lên bảng tin riêng của Circl. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên hợp lệ của Circle.<br><br>• Đã cấp quyền truy cập Camera/Thư viện ảnh trên thiết bị. |
| **Hậu điều kiện** | • **Thành công:** Khoảnh khắc được tải lên, hiển thị trên khay Moment của nhóm và gửi thông báo đến các thành viên.<br><br>• **Thất bại:** Tải ảnh thất bại do lỗi mạng, cho phép thử lại. |
| **Các bước thực hiện** | (1) Thành viên vào Circle, bấm vào biểu tượng "Đăng Moment".<br><br>(2) Người dùng chụp ảnh trực tiếp từ camera hoặc chọn ảnh từ thiết bị, thêm dòng chú thích ngắn.<br><br>(3) Người dùng bấm nút "Chia sẻ".<br><br>(4) Hệ thống nén ảnh, lưu tệp lên hệ thống đám mây và lưu bản ghi gắn liền với CircleID.<br><br>(5) Hệ thống cập nhật khoảnh khắc mới lên đầu bảng tin Circle và gửi thông báo đẩy đến các thành viên. |
| **Luồng thay thế** | **A1. Tệp vượt quá dung lượng cho phép (>10MB):**<br><br>• 3a. Hệ thống phát hiện tệp ảnh quá lớn.<br><br>• 3b. Hệ thống thông báo lỗi và yêu cầu chọn ảnh khác hoặc nén tệp. |

2.3.10. Use case View & React to Moments

**Bảng 2.10. Mô tả use case View & React to Moments**

| **Use Case: UC10: View & React to Moments** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên xem các ảnh khoảnh khắc của các bạn trong nhóm, gửi biểu tượng cảm xúc (Reaction) hoặc phản hồi khoảnh khắc trực tiếp vào khung chat nhóm.. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Lượt thả cảm xúc hoặc bình luận hiển thị theo thời gian thực cho mọi thành viên trong Circle.<br><br>• **Thất bại:** Dữ liệu tương tác không được lưu do mất kết nối. |
| **Các bước thực hiện** | (1) Thành viên mở mục Moment trên giao diện Circle.<br><br>(2) Hệ thống hiển thị tuần tự các hình ảnh khoảnh khắc của các thành viên.<br><br>(3) Người dùng bấm chọn các biểu tượng cảm xúc nhanh hoặc chạm vào khung bình luận.<br><br>(4) Người dùng nhập nội dung và bấm gửi bình luận.<br><br>(5) Hệ thống cập nhật bình luận dưới Moment và phát thông báo qua WebSocket đến các thành viên trong nhóm. |
| **Luồng thay thế** | **A1. Rút lại hoặc đổi cảm xúc:**<br><br>• 3a. Người dùng bấm lại vào cảm xúc đã chọn để hủy, hoặc chọn biểu tượng mới.<br><br>• 3b. Hệ thống cập nhật giảm hoặc đổi loại biểu tượng tương ứng trên giao diện chung.<br><br>**A2. Moment đã bị tác giả xóa:**<br><br>• 3a. Người dùng tương tác vào ảnh vừa bị xóa.<br><br>• 3b. Hệ thống thông báo khoảnh khắc không còn khả dụng và làm mới bảng tin. |

2.3.11. Use case Send Multimedia Messages

**Bảng 2.11. Mô tả use case Send Multimedia Messages**

| **Use Case: UC11: Send Multimedia Messages** | |
| --- | | --- |
| **Mô tả** | Cho phép các thành viên trao đổi tin nhắn trò chuyện đa phương tiện trong nhóm, bao gồm: văn bản, hình ảnh, tập tin tài liệu và tin nhắn thoại. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle và đang tham gia phòng chat nhóm. |
| **Hậu điều kiện** | • **Thành công:** Tin nhắn được lưu vào cơ sở dữ liệu và đồng bộ tức thời đến cửa sổ chat của tất cả thành viên.<br><br>• **Thất bại:** Tin nhắn hiển thị trạng thái gửi lỗi kèm biểu tượng thử lại. |
| **Các bước thực hiện** | (1) Thành viên truy cập khung chat của Circle.<br><br>(2) Người dùng nhập nội dung tin nhắn hoặc đính kèm ảnh/tệp/thu âm giọng nói.<br><br>(3) Người dùng bấm nút "Gửi".<br><br>(4) Hệ thống mã hóa thông điệp, lưu vào bảng tin nhắn theo CircleID và phát sóng qua kênh thời gian thực (Socket).<br><br>(5) Giao diện người nhận tự động hiển thị tin nhắn mới mà không cần tải lại trang. |
| **Luồng thay thế** | **A1. Tệp đính kèm vượt quá giới hạn (>25MB):**<br><br>• 2a. Hệ thống kiểm tra dung lượng tệp vượt ngưỡng.<br><br>• 2b. Hệ thống từ chối tải tệp và yêu cầu chọn tệp có kích thước nhỏ hơn. |

2.3.12. Use case Initiate Group Call

**Bảng 2.12. Mô tả use case Initiate Group Call**

| **Use Case: UC12: Initiate Group Call** | |
| --- | | --- |
| **Mô tả** | Khởi tạo hoặc tham gia vào phiên gọi thoại (Voice call) hoặc gọi video đa thành viên theo thời gian thực bên trong Circle. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Thiết bị đã cấp quyền sử dụng Micro và Camera.<br><br>• Kết nối mạng Internet ổn định. |
| **Hậu điều kiện** | • **Thành công:** Phiên gọi nhóm thời gian thực (WebRTC) được kết nối giữa các thành viên tham gia.<br><br>• **Thất bại:** Cuộc gọi bị hủy hoặc ngắt kết nối do lỗi truyền dẫn. |
| **Các bước thực hiện** | (1) Thành viên bấm biểu tượng Gọi thoại hoặc Gọi video ở thanh điều hướng nhóm.<br><br>(2) Hệ thống khởi tạo phòng gọi trực tuyến và gửi tín hiệu đổ chuông đến tất cả thành viên trong Circle.<br><br>(3) Các thành viên khác bấm nút "Tham gia".<br><br>(4) Hệ thống kết nối luồng âm thanh và hình ảnh đa điểm giữa các thành viên.<br><br>(5) Khi kết thúc, người dùng bấm "Rời phòng gọi". Phiên gọi tự động đóng khi người cuối cùng rời đi. |
| **Luồng thay thế** | **A1. Cuộc gọi không có ai tham gia:**<br><br>• 2a. Hệ thống duy trì tín hiệu chuông tối đa 60 giây.<br><br>• 2b. Nếu không ai bắt máy, hệ thống tự động kết thúc và ghi thông báo "Cuộc gọi nhỡ" trong khung chat. |

2.3.13. Use case Pin / Unpin Message

**Bảng 2.13. Mô tả use case Pin / Unpin Message**

| **Use Case: UC13: Pin / Unpin Message** | |
| --- | | --- |
| **Mô tả** | Cho phép ghim các tin nhắn quan trọng, thông báo hoặc đường dẫn cần thiết lên thanh tiêu đề đầu khung chat của nhóm, hoặc gỡ ghim khi nội dung hết hiệu lực. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên Circle và tin nhắn được chọn đang tồn tại trong đoạn chat. |
| **Hậu điều kiện** | • **Thành công:** Tin nhắn được đưa vào thanh ghim đầu màn hình chat cho toàn bộ thành viên cùng thấy. |
| **Các bước thực hiện** | (1) Thành viên nhấn giữ vào một tin nhắn trong đoạn chat nhóm.<br><br>(2) Chọn mục "Ghim tin nhắn".<br><br>(3) Hệ thống hiển thị hộp thoại xác nhận: "Ghim tin nhắn này cho tất cả mọi người?".<br><br>(4) Người dùng bấm "Xác nhận".<br><br>(5) Hệ thống cập nhật trạng thái tin nhắn và hiển thị nội dung tóm tắt trên thanh ghim cố định của nhóm. |
| **Luồng thay thế** | **A1. Bỏ ghim tin nhắn:**<br><br>• 1a. Người dùng bấm vào danh sách tin ghim và chọn "Bỏ ghim".<br><br>• 1b. Hệ thống gỡ bỏ tin nhắn khỏi thanh thông báo đầu trang. |

2.3.14. Use case Manage Shared Album

**Bảng 2.14. Mô tả use case Manage Shared Album**

| **Use Case: UC14: Manage Shared Album** | |
| --- | | --- |
| **Mô tả** | Cung cấp kho lưu trữ hình ảnh/video chung của Circle, cho phép tạo các album theo chủ đề (du lịch, kỷ niệm), tải lên ảnh chất lượng cao và tải ảnh về thiết bị. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Album/ảnh mới được tải lên và lưu trữ theo nhóm.<br><br>• **Thất bại:** Báo lỗi tải tệp, ảnh không hiển thị trong album. |
| **Các bước thực hiện** | (1) Thành viên chuyển sang mục "Kho lưu trữ" -> chọn "Album ảnh".<br><br>(2) Người dùng bấm "Tạo Album mới", nhập tên chủ đề (ví dụ: "Chuyến đi Đà Lạt").<br><br>(3) Người dùng bấm "Thêm ảnh" và chọn các tệp ảnh từ thiết bị.<br><br>(4) Bấm "Tải lên".<br><br>(5) Hệ thống lưu trữ các tập tin, gắn với AlbumID và hiển thị danh mục ảnh trong nhóm. |
| **Luồng thay thế** | **A1. Xóa ảnh trong Album:**<br><br>• 2a. Thành viên mở xem ảnh do chính mình đăng tải và chọn "Xóa".<br><br>• 2b. Hệ thống xóa tệp ảnh khỏi album và cập nhật lại giao diện. |

2.3.15. Use case Manage Group Poll

**Bảng 2.15. Mô tả use case Manage Group Poll**

| **Use Case: UC15: Manage Group Poll** | |
| --- | | --- |
| **Mô tả** | Tạo các cuộc thăm dò ý kiến/biểu quyết tập thể với tùy chọn đơn/nhiều lựa chọn để lấy biểu quyết số đông của các thành viên trong nhóm. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Cuộc bình chọn được tạo trong khung chat, cập nhật tỷ lệ phần trăm biểu quyết theo thời gian thực. |
| **Các bước thực hiện** | (1) Thành viên bấm vào biểu tượng tiện ích -> chọn "Tạo bình chọn".<br><br>(2) Hệ thống mở biểu mẫu: Câu hỏi thăm dò, Các phương án lựa chọn, Tùy chọn cho phép chọn nhiều phương án hoặc thêm lựa chọn mới.<br><br>(3) Người dùng nhập nội dung và bấm "Đăng bình chọn".<br><br>(4) Hệ thống hiển thị bảng bình chọn vào phòng chat.<br><br>(5) Các thành viên tích chọn phương án của mình và bấm "Biểu quyết".<br><br>(6) Hệ thống tính toán lại tỷ lệ và cập nhật thanh tiến độ hiển thị cho cả nhóm. |
| **Luồng thay thế** | **A1. Thay đổi phương án bầu:**<br><br>• 5a. Thành viên bấm "Đổi bình chọn".<br><br>• 5b. Hệ thống cho phép chọn phương án khác và cập nhật lại số liệu. |

2.3.16. Use case Spin Decision Wheel

**Bảng 2.16. Mô tả use case Spin Decision Wheel**

| **Use Case: UC16: Spin Decision Wheel** | |
| --- | | --- |
| **Mô tả** | Cung cấp công cụ Vòng xoay may mắn ngẫu nhiên, cho phép các thành viên cấu hình các tùy chọn (ăn gì, ai trả tiền, ai làm việc nhà) và quay đồng bộ cùng xem kết quả. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Vòng xoay quay đồng bộ trên màn hình các thành viên và công bố kết quả trúng vào khung chat. |
| **Các bước thực hiện** | (1) Thành viên mở tiện ích "Vòng xoay may mắn".<br><br>(2) Người dùng nhập danh sách các ô lựa chọn (ví dụ: Tên các món ăn) hoặc chọn mẫu có sẵn.<br><br>(3) Người dùng bấm nút "Bắt đầu quay".<br><br>(4) Hệ thống tạo giá trị ngẫu nhiên từ máy chủ, gửi tín hiệu đồng bộ góc quay và thời gian quay đến tất cả thành viên đang mở vòng xoay.<br><br>(5) Vòng xoay dừng lại tại ô trúng thưởng, hệ thống gửi thông báo kết quả chung cuộc vào nhóm. |
| **Luồng thay thế** | **A1. Không đủ số lượng ô lựa chọn:**<br><br>• 2a. Người dùng chỉ nhập 1 lựa chọn hoặc để trống.<br><br>• 2b. Hệ thống yêu cầu phải nhập tối thiểu 2 lựa chọn để có thể quay. |

2.3.17. Use case Manage Group Calendar & Reminders

**Bảng 2.17. Mô tả use case Manage Group Calendar & Reminders**

| **Use Case: UC17: Manage Group Calendar & Reminders** | |
| --- | | --- |
| **Mô tả** | Giao diện lịch biểu theo tháng/tuần, cho phép tạo các sự kiện hẹn mốc thời gian rõ ràng (hẹn ăn uống, sinh nhật, hạn nộp bài) kèm cơ chế gửi thông báo nhắc hẹn tự động. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Sự kiện xuất hiện trên Lịch nhóm và lập lịch thông báo hẹn giờ cho từng thành viên. |
| **Các bước thực hiện** | (1) Thành viên vào mục "Lịch nhóm" (Group Calendar).<br><br>(2) Chọn một ngày trên giao diện lịch và bấm "Thêm sự kiện".<br><br>(3) Nhập thông tin: Tiêu đề sự kiện, Giờ bắt đầu/kết thúc, Địa điểm, Thời gian nhắc nhở (trước 15 phút, 1 tiếng, 1 ngày).<br><br>(4) Bấm "Lưu sự kiện".<br><br>(5) Hệ thống lưu trữ sự kiện và lập trình lịch chạy thông báo đến toàn bộ thành viên khi đến hạn. |
| **Luồng thay thế** | **A1. Thời gian sự kiện không hợp lệ:**<br><br>• 3a. Giờ kết thúc được chọn trước giờ bắt đầu.<br><br>• 3b. Hệ thống báo lỗi và yêu cầu điều chỉnh thời gian hợp lý.<br><br> <br><br/><br><br>**A2. Xóa sự kiện:**<br><br> <br><br>• 1a. Thành viên mở xem chi tiết sự kiện và bấm "Xóa sự kiện".<br><br> <br><br>• 1b. Hệ thống gỡ sự kiện khỏi lịch và hủy bỏ thông báo nhắc hẹn. |

2.3.18. Use case Collaborate on Planning Sheet

**Bảng 2.18. Mô tả use case Collaborate on Planning Sheet**

| **Use Case: UC18: Collaborate on Planning Sheet** | |
| --- | | --- |
| **Mô tả** | Cung cấp không gian làm việc dạng bảng tính linh hoạt (Dynamic Grid), cho phép mọi thành viên trong Circle tự do tạo bảng, thêm/xóa cột, thêm/xóa dòng và cùng chỉnh sửa nội dung văn bản trong các ô dữ liệu (Cells) theo thời gian thực mà không bị giới hạn bởi các trường thông tin cố định. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Người dùng là thành viên hợp lệ của Circle.<br><br>• Bảng kế hoạch của Circle đang hoạt động hoặc được khởi tạo mới. |
| **Hậu điều kiện** | • **Thành công:** Dữ liệu chỉnh sửa (nội dung ô, trạng thái hoàn thành, thêm dòng) được lưu và đồng bộ tức thời đến màn hình của mọi thành viên đang theo dõi bảng.<br><br>• **Thất bại:** Thao tác bị gián đoạn do mất kết nối; hệ thống giữ lại bản nháp cục bộ và thông báo đồng bộ hóa thất bại. |
| **Các bước thực hiện** | **(1)** Thành viên truy cập vào phân hệ Bảng kế hoạch (Planning Sheet) của Circle.<br><br>**(2)** Hệ thống truy vấn và hiển thị ma trận bảng tính hiện tại gồm các Cột (SheetColumn), Hàng (SheetRow) và các Ô dữ liệu chuỗi (SheetCell).<br><br>**(3)** Thành viên nhấp chọn vào một ô bất kỳ trên lưới để nhập liệu (văn bản, số liệu hoặc ký tự tự do) hoặc chọn thao tác thêm hàng/thêm cột.<br><br>**(4)** Thành viên hoàn tất nhập nội dung ô và xác nhận bằng cách nhấn Enter hoặc nhấp ra ngoài ô (mất tiêu điểm/blur).<br><br>**(5)** Hệ thống xác thực dữ liệu chuỗi, cập nhật bản ghi SheetCell kèm định danh người sửa cuối cùng (last_edited_by) và thời điểm cập nhật.<br><br>**(6)** Hệ thống phát tín hiệu đồng bộ hóa qua giao thức WebSocket đến các máy khách khác trong nhóm.<br><br>**(7)** Màn hình của toàn bộ thành viên đang theo dõi bảng lập tức cập nhật giá trị mới của ô mà không cần tải lại trang. |
| **Luồng thay thế** | **A1. Tự do thêm hoặc đổi tên Cột (Add / Rename Column):**<br><br>• 3a. Thành viên nhấn nút "Thêm cột" hoặc nhấp đúp vào tiêu đề của một cột hiện có.<br><br>• 3b. Thành viên nhập tiêu đề mới cho cột và nhấn lưu.<br><br>• 3c. Hệ thống sinh thêm thuộc tính cột mới (SheetColumn), tự động mở rộng ma trận ô cho các hàng hiện hữu và đồng bộ cấu trúc mới cho cả nhóm.<br><br>**A2. Thêm hoặc xóa Dòng (Add / Delete Row):**<br><br>• 3a. Thành viên nhấn nút "Thêm dòng" ở cuối bảng hoặc chọn xóa một dòng không còn dùng.<br><br>• 3b. Hệ thống khởi tạo một hàng mới (SheetRow) với các ô dữ liệu trống hoặc gỡ bỏ các ô thuộc hàng đó, sau đó cập nhật tức thời cho các thành viên.<br><br>**A3. Xung đột chỉnh sửa đồng thời trên cùng một ô (Concurrent Edit Conflict):**<br><br>• 5a. Hệ thống phát hiện hai thành viên cùng chỉnh sửa và gửi dữ liệu về cùng một tọa độ ô (SheetCell) tại cùng một thời điểm.<br><br>• 5b. Hệ thống áp dụng quy tắc cập nhật theo mốc thời gian sau cùng (**Last-write-wins**), ghi nhận giá trị của người thao tác cuối và cập nhật lại thông tin last_edited_by cho toàn bộ nhóm. |

2.3.19. Use case Share Live Location

**Bảng 2.19. Mô tả use case Share Live Location**

| **Use Case: UC19: Share Live Location** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên chia sẻ vị trí địa lý thời gian thực của mình trên bản đồ nội bộ nhóm trong một khoảng thời gian nhất định (15 phút, 1 giờ) để phục vụ việc hẹn gặp, đưa đón. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Thiết bị cấp quyền định vị GPS (Location Services).<br><br>• Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Tọa độ của thành viên hiển thị và di chuyển trực tiếp trên bản đồ số của nhóm.<br><br>• **Thất bại:** Không thể lấy tọa độ do tắt định vị GPS. |
| **Các bước thực hiện** | (1) Thành viên bấm tiện ích "Vị trí trực tiếp" trong nhóm.<br><br>(2) Chọn khoảng thời gian muốn chia sẻ (ví dụ: 15 phút, 1 giờ).<br><br>(3) Người dùng bấm "Bắt đầu chia sẻ".<br><br>(4) Ứng dụng liên tục lấy tọa độ GPS từ thiết bị và gửi về máy chủ theo chu kỳ định sẵn.<br><br>(5) Bản đồ nhóm của các thành viên khác hiển thị avatar của người dùng đang di chuyển tương ứng. |
| **Luồng thay thế** | **A1. Dừng chia sẻ trước hạn:**<br><br>• 3a. Người dùng bấm nút "Dừng chia sẻ vị trí" <br><br>• 3b. Hệ thống ngắt truyền tọa độ và gỡ biểu tượng vị trí khỏi bản đồ nhóm. |

2.3.20. Use case Update Circle Nickname

**Bảng 2.20. Mô tả use case Update Circle Nickname**

| **Use Case: UC20: Update Circle Nickname** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên (hoặc bạn bè) đặt hoặc đổi biệt danh riêng của mình trong một Circle cụ thể mà không làm ảnh hưởng đến tên hiển thị chung của tài khoản ngoài hệ thống. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Tên hiển thị của thành viên trong các đoạn chat, khoảnh khắc, danh sách nhóm này được cập nhật theo biệt danh mới. |
| **Các bước thực hiện** | (1) Thành viên vào phần "Cài đặt nhóm" -> chọn "Biệt danh của tôi trong nhóm".<br><br>(2) Hệ thống hiển thị hộp thoại chứa biệt danh hiện tại.<br><br>(3) Người dùng nhập biệt danh mới (ví dụ: "Bếp trưởng", "Thủ quỹ") và bấm "Lưu".<br><br>(4) Hệ thống cập nhật trường nickname trong bảng thành viên nhóm.<br><br>(5) Hệ thống phát thông báo vào khung chat: "\[Tên cũ\] đã đổi biệt danh thành \[Tên mới\]". |
| **Luồng thay thế** | **A1. Xóa biệt danh:**<br><br>• 3a. Người dùng để trống ô nhập biệt danh và bấm lưu.<br><br>• 3b. Hệ thống khôi phục lại việc hiển thị tên tài khoản gốc. |

2.3.21. Use case Submit Anonymous Post ("Words Unsaid")

**Bảng 2.21. Mô tả use case Submit Anonymous Post ("Words Unsaid")**

| **Use Case: UC21: Submit Anonymous Post ("Words Unsaid")** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên gửi bài viết tâm sự hoặc chia sẻ ẩn danh vào chuyên mục "Điều muốn nói" của nhóm, danh tính người gửi được mã hóa và ẩn giấu hoàn toàn đối với cả nhóm và Trưởng nhóm. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Là thành viên của Circle. |
| **Hậu điều kiện** | • **Thành công:** Bài viết ẩn danh xuất hiện trên bảng tin "Điều muốn nói" của nhóm mà không kèm theo bất kỳ thông tin nhận diện tác giả nào. |
| **Các bước thực hiện** | (1) Thành viên vào chuyên mục "Điều muốn nói" (Words Unsaid).<br><br>(2) Chọn "Gửi bài viết ẩn danh".<br><br>(3) Người dùng soạn thảo nội dung (tâm sự, góp ý, khen ngợi) và chọn màu thiệp/hình nền trang trí.<br><br>(4) Bấm "Gửi ẩn danh".<br><br>(5) Hệ thống kiểm tra nội dung, lược bỏ toàn bộ siêu dữ liệu (author_id) khi hiển thị ra phía ngoài và đăng bài viết vào bảng tin nhóm.<br><br>(6) Các thành viên khác có thể đọc và thả cảm xúc ẩn danh lên bài viết. |
| **Luồng thay thế** | **A1. Nội dung rỗng:**<br><br>• 3a. Người dùng chưa nhập ký tự nào.<br><br>• 3b. Hệ thống vô hiệu hóa nút gửi cho đến khi có nội dung hợp lệ. |

2.3.22. Use case Leave Circle

**Bảng 2.22. Mô tả use case Leave Circle**

| **Use Case: UC22: Leave Circle** | |
| --- | | --- |
| **Mô tả** | Cho phép thành viên tự nguyện rút khỏi Circle. Quyền truy cập vào các dữ liệu mới của nhóm bị thu hồi, nhưng lịch sử hoạt động cũ vẫn bảo lưu cho những người còn lại. |
| **Tác nhân kích hoạt** | Thành viên nhóm (Circle Member) |
| **Tiền điều kiện** | • Người dùng đang là thành viên của Circle mục tiêu. |
| **Hậu điều kiện** | • **Thành công:** Hủy bỏ tư cách thành viên, chuyển trạng thái LEFT, đóng quyền truy cập dữ liệu nhóm.<br><br> <br>• **Thất bại:** Bị hệ thống chặn rời nếu đang là Circle Owner mà chưa bàn giao quyền. |
| **Các bước thực hiện** | (1) Thành viên vào "Cài đặt nhóm" -> chọn "Rời khỏi Circle".<br><br>(2) Hệ thống hiển thị hộp thoại cảnh báo về việc sẽ không thể truy cập lại nhóm nếu không được mời lại.<br><br>(3) Người dùng bấm "Xác nhận rời".<br><br>(4) Hệ thống chuyển trạng thái thành viên sang LEFT, ngắt phiên kết nối liên kết nhóm.<br><br>(5) Hệ thống phát tin nhắn tự động: "\[Tên người dùng\] đã rời khỏi nhóm" vào đoạn chat chung.<br><br>(6) Người dùng được chuyển về màn hình danh sách nhóm cá nhân. |
| **Luồng thay thế** | **A1. Circle Owner rời nhóm khi nhóm còn người (N>1):**<br><br>• 3a. Hệ thống phát hiện người yêu cầu rời nhóm là Circle Owner duy nhất.<br><br>• 3b. Hệ thống chặn rời nhóm và yêu cầu thực hiện use case UC25: Transfer Circle Ownership trước.<br><br>**A2. Thành viên cuối cùng rời nhóm (N=1):**<br><br>• 3a. Hệ thống cảnh báo việc rời nhóm sẽ xóa vĩnh viễn Circle này.<br><br>• 3b. Nếu người dùng tiếp tục, hệ thống chuyển sang tự động kích hoạt UC26: Dissolve Circle. |

2.3.23. Use case Update Circle Metadata

**Bảng 2.23. Mô tả use case Update Circle Metadata**

| **Use Case: UC23: Update Circle Metadata** | |
| --- | | --- |
| **Mô tả** | Cho phép Trưởng nhóm chỉnh sửa các thuộc tính cốt lõi của Circle: đổi tên nhóm, thay đổi ảnh đại diện/bìa, cập nhật tiểu sử giới thiệu và thiết lập chế độ duyệt thành viên (tự do vào hoặc phải duyệt). |
| **Tác nhân kích hoạt** | Trưởng nhóm (Circle Owner) |
| **Tiền điều kiện** | • Đang giữ vai trò Circle Owner của Circle đó. |
| **Hậu điều kiện** | • **Thành công:** Thông tin định danh mới của nhóm được cập nhật trên cơ sở dữ liệu và hiển thị ngay cho các thành viên. |
| **Các bước thực hiện** | (1) Circle Owner vào "Cài đặt nhóm" -> chọn "Chỉnh sửa thông tin Circle".<br><br>(2) Hệ thống mở giao diện biểu mẫu thông tin nhóm hiện tại.<br><br>(3) Owner thay đổi tên, tải ảnh đại diện mới hoặc chỉnh sửa đoạn mô tả.<br><br>(4) Bấm "Lưu thay đổi".<br><br>(5) Hệ thống kiểm tra dữ liệu hợp lệ và lưu cập nhật, gửi thông báo thay đổi đến các thành viên trong nhóm. |
| **Luồng thay thế** | **A1. Tên nhóm để trống:**<br><br>• 3a. Owner xóa trống tên nhóm.<br><br>• 3b. Hệ thống thông báo lỗi và yêu cầu phải có tên Circle. |

2.3.24. Use case Manage Circle Members

**Bảng 2.24. Mô tả use case Manage Circle Members**

| **Use Case: UC24: Manage Circle Members** | |
| --- | | --- |
| **Mô tả** | Cung cấp quyền kiểm duyệt thành viên cho Owner: phê duyệt hoặc từ chối các đơn xin vào nhóm, và trục xuất (xóa) những thành viên vi phạm quy tắc ra khỏi nhóm. |
| **Tác nhân kích hoạt** | Trưởng nhóm (Circle Owner) |
| **Tiền điều kiện** | • Đang giữ vai trò Circle Owner. |
| **Hậu điều kiện** | • **Thành công:** Thành viên mới được thêm vào hoặc thành viên bị chỉ định bị gạch tên khỏi danh sách nhóm. |
| **Các bước thực hiện** | _(Trường hợp xóa thành viên khỏi nhóm):_<br><br>(1) Owner mở mục "Quản lý thành viên" trong phần Cài đặt nhóm.<br><br>(2) Hệ thống liệt kê danh sách toàn bộ thành viên đang có mặt.<br><br>(3) Owner chọn biểu tượng tùy chọn bên cạnh tên thành viên cần loại và chọn "Mời ra khỏi nhóm".<br><br>(4) Hệ thống yêu cầu xác nhận hành động xóa.<br><br>(5) Owner nhấn "Xác nhận".<br><br>(6) Hệ thống hủy quyền thành viên của tài khoản đó, ngắt kết nối trực tuyến và cập nhật danh sách. |
| **Luồng thay thế** | **A1. Phê duyệt yêu cầu tham gia nhóm:**<br><br>• 1a. Owner chuyển sang tab "Yêu cầu chờ duyệt" -> chọn "Đồng ý" hoặc "Từ chối".<br><br>• 1b. Nếu đồng ý và sĩ số N≤Max, hệ thống đưa tài khoản vào nhóm làm Circle Member.<br><br>• 1c. Nếu nhóm đã đạt giới hạn người, hệ thống khóa duyệt và báo Circle đã đủ số lượng. |

2.3.25. Use case Transfer Circle Ownership

**Bảng 2.25. Mô tả use case Transfer Circle Ownership**

| **Use Case: UC25: Transfer Circle Ownership** | |
| --- | | --- |
| **Mô tả** | Cho phép Circle Owner chuyển giao toàn quyền quản trị nhóm cao nhất (Owner) cho một thành viên hoạt động khác trong Circle. |
| **Tác nhân kích hoạt** | Trưởng nhóm (Circle Owner) |
| **Tiền điều kiện** | • Đang giữ vai trò Circle Owner.<br><br>• Nhóm có ít nhất từ 2 thành viên trở lên. |
| **Hậu điều kiện** | • **Thành công:** Thành viên được chọn trở thành Circle Owner mới, Owner cũ hạ bậc trở thành Circle Member bình thường. |
| **Các bước thực hiện** | (1) Owner vào "Cài đặt nhóm" -> chọn "Chuyển quyền Trưởng nhóm".<br><br>(2) Hệ thống hiển thị danh sách các thành viên hiện tại trong nhóm.<br><br>(3) Owner chọn thành viên muốn giao quyền.<br><br>(4) Hệ thống hiển thị cảnh báo: "Bạn sẽ mất quyền Trưởng nhóm và trở thành thành viên thường. Hành động này không thể hoàn tác!".<br><br>(5) Owner nhập mật khẩu tài khoản để xác thực bảo mật và nhấn "Xác nhận chuyển nhượng".<br><br>(6) Hệ thống hoán đổi vai trò giữa 2 tài khoản trong cơ sở dữ liệu và thông báo vào đoạn chat chung. |
| **Luồng thay thế** | **A1. Nhập sai mật khẩu xác nhận:**<br><br>• 5a. Hệ thống kiểm tra mật khẩu không chính xác.<br><br>• 5b. Hệ thống từ chối chuyển quyền và yêu cầu xác thực lại. |

2.3.26. Use case Dissolve Circle

**Bảng 2.26. Mô tả use case Dissolve Circle**

| **Use Case: UC26: Dissolve Circle** | |
| --- | | --- |
| **Mô tả** | Cho phép Circle Owner giải tán nhóm hoàn toàn, chấm dứt hoạt động của Circle, thu hồi quyền truy cập của toàn bộ thành viên và đưa dữ liệu vào diện xóa/lưu trữ vĩnh viễn. |
| **Tác nhân kích hoạt** | Trưởng nhóm (Circle Owner) |
| **Tiền điều kiện** | • Đang giữ vai trò Circle Owner. |
| **Hậu điều kiện** | • **Thành công:** Circle bị đóng hoàn toàn khỏi hệ sinh thái hoạt động, hủy mọi quyền truy cập của các thành viên. |
| **Các bước thực hiện** | (1) Owner vào "Cài đặt nâng cao" của Circle -> chọn "Giải tán Circle" (Dissolve Circle).<br><br>(2) Hệ thống hiển thị hộp thoại cảnh báo: "Toàn bộ tin nhắn, lịch trình, ảnh và dữ liệu của nhóm sẽ bị xóa vĩnh viễn đối với tất cả thành viên."<br><br>(3) Owner nhập mã xác nhận (hoặc mật khẩu tài khoản) và bấm "Xác nhận giải tán".<br><br>(4) Hệ thống cập nhật cờ xóa is_deleted = true, thu hồi mọi token truy cập của các thành viên liên quan.<br><br>(5) Hệ thống điều hướng tất cả thành viên đang trực tuyến trong Circle ra màn hình chính và thông báo nhóm đã giải tán. |
| **Luồng thay thế** | **A1. Hủy bỏ thao tác:**<br><br>• 3a. Owner bấm "Hủy bỏ".<br><br>• 3b. Hệ thống đóng hộp thoại và giữ nguyên hiện trạng của Circle. |