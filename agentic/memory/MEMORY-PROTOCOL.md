# MEMORY PROTOCOL — Cơ chế trí nhớ xuyên phiên cho Agent CIRCLE

> Mục tiêu: agent nhớ được điều đã được dặn **qua các phiên làm việc**, giống cách
> một đồng đội thật nhớ — không phải nhờ model thông minh hơn, mà nhờ **kỷ luật
> ghi (write discipline) + kỷ luật đọc (read discipline) + lớp lưu trữ đúng cấu trúc**.
> Giao thức này thay thế cách dùng rời rạc hiện tại của `agentic/memory/` +
> `agentic/learning/`, không thay đổi PROJECT_GOD.md hay RULES.md.

---

## 1. Vì sao agent hiện tại "quên"

Chẩn đoán trên chính hệ thống hiện tại của CIRCLE:

1. **Đọc có, ghi không.** `understand-the-repo` bảo agent *nạp* `agentic/memory/MEMORY.md`,
   nhưng không có quy tắc nào bảo agent *ghi lại* điều người dùng vừa dặn/sửa
   trong phiên. Thứ không được ghi thì phiên sau không tồn tại.
2. **Cổng ghi quá nặng.** `agentic/learning/` yêu cầu "đề xuất qua PR, không tự áp dụng" —
   đúng cho việc sửa RULES, nhưng nếu áp cho mọi ghi nhớ nhỏ thì agent sẽ bỏ qua
   vì ma sát quá lớn. Kết quả: không ghi gì cả.
3. **Một file phẳng cho mọi thứ.** Chỉ có một `MEMORY.md`: hoặc nó phình to đến
   mức không ai nạp nữa, hoặc mọi người ngại ghi nên nó trống.
4. **Không có "thời điểm ghi".** Điều giá trị nhất — lời nhắc/sửa của người dùng
   *ngay trong lúc làm việc* — không được định nghĩa là sự kiện phải ghi.
   Agent nghe, gật, rồi phiên sau mất.
5. **Không có luật thay thế.** Ghi mới chồng lên ghi cũ mà không ghi rõ cái nào
   còn hiệu lực → memory tự mâu thuẫn → agent hết tin và bỏ qua nó.

## 2. Cấu trúc 3 lớp

```
agentic/memory/
├── MEMORY.md            ← LỚP 1: Index tinh gọn (nạp đầu MỌI phiên)
├── 2026-10-25.md        ← LỚP 2: Nhật ký theo ngày (append-only)
├── 2026-10-26.md
├── topics/              ← LỚP 3: Hồ sơ sâu theo chủ đề
│   ├── webrtc-turn.md
│   ├── module-chat.md
│   └── ...
└── _archive/            ← Nhật ký cũ đã tổng hợp xong (theo tháng)
```

### Lớp 1 — Index (`MEMORY.md`)
- **Nạp đầu mọi phiên, không ngoại lệ** (kể cả task nhỏ).
- Chỉ chứa điều **bền**: facts về dự án/nhóm, preferences & working agreements,
  corrections đã chốt, decisions quan trọng (kèm link tới ADR/topic), open loops.
- **Giới hạn cứng: ≤ 200 dòng.** Vượt ngưỡng là phải cắt tỉa (mục 5), không nới.
- Mỗi mục có ngày và nguồn ("theo Bình, 2026-10-25"). Mục hết hiệu lực bị sửa
  tại chỗ kèm ghi chú thay thế — không để hai sự thật mâu thuẫn cùng "active".

### Lớp 2 — Nhật ký ngày (`YYYY-MM-DD.md`)
- Nơi ghi **ngay trong phiên**: rẻ, nhanh, append-only, không cần trau chuốt.
- Mọi capture trong ngày đều vào đây trước. Cuối tuần mới tổng hợp lên Lớp 1.
- Đây là "fast lane": được commit cùng PR của task đang làm, hoặc một commit
  `chore(memory)` trên branch làm việc — **không cần quy trình duyệt riêng**
  (peer vẫn thấy khi review PR như mọi thay đổi khác).

### Lớp 3 — Topic files (`topics/<slug>.md`)
- Bối cảnh sâu cho một chủ đề: một module, một quyết định kỹ thuật nhiều hệ quả,
  một gotcha tốn thời gian debug. Index (Lớp 1) chỉ giữ 1–2 dòng tóm tắt + link.
- Agent chỉ đọc topic file khi task chạm đúng chủ đề đó (đọc theo nhu cầu,
  không nạp tất cả).

## 3. Kỷ luật GHI — quan trọng nhất

### 3.1. Sự kiện kích hoạt ghi (capture triggers)
Khi một trong các điều sau xuất hiện trong phiên, agent **ghi ngay trong cùng
lượt làm việc đó** vào nhật ký ngày — không đợi cuối phiên, không đợi được nhắc:

| Sự kiện | Ví dụ |
|---|---|
| Người dùng **sửa** agent | "Đừng dùng thư viện X nữa", "Tôi đã nói là ghim phải có từ đầu" |
| Người dùng nêu **preference / luật làm việc** | "Từ giờ báo cáo PR viết tiếng Việt", "Luôn chạy test trước khi commit" |
| **Decision** được chốt (kèm lý do) | "Chọn Socket.IO thay vì native ws vì team quen hơn" |
| **Gotcha** phát hiện khi debug | "TURN qua mạng trường phải dùng cổng 443" |
| **Cam kết / deadline / open loop** mới | "Thứ 6 này demo với giảng viên phần chat" |
| Thông tin bền về người/dự án | Đổi giảng viên hướng dẫn, thêm thành viên, đổi deadline đồ án |

### 3.2. Cách ghi
- Một dòng một ý, có loại + ngày + nguồn:
  `- [correction] Không dùng thư viện X cho upload — theo Bình, 2026-10-25.`
- Điều bền (sẽ còn đúng sau nhiều tuần) → **đồng thời** cập nhật Lớp 1 ngay,
  không chờ tổng hợp cuối tuần.
- Nếu điều mới **thay thế** điều cũ: sửa tại chỗ ở Lớp 1 và ghi vào nhật ký
  `[correction] X thay thế Y (Y ghi ngày ...)` — luật thay thế ở mục 4.
- **Chỉ xác nhận "đã ghi nhớ" SAU khi file đã được ghi thành công**, và nói rõ
  đã ghi gì, ở đâu — một dòng là đủ: "Đã ghi vào memory hôm nay: ...".
  Không bao giờ nói "tôi sẽ nhớ" mà không có thao tác ghi đi kèm.

### 3.3. Không ghi vào memory
- Tiến độ task, trạng thái PR, việc đã làm xong → đó là việc của GitHub Issues/PR.
- Nội dung code, cấu trúc repo → git và `agentic/map/` đã có.
- Bí mật: token, mật khẩu, key, thông tin cá nhân nhạy cảm → **tuyệt đối không**.
- Suy đoán của agent chưa được người dùng xác nhận → nếu ghi, gắn nhãn `[chưa xác nhận]`.

### 3.4. Hai làn ghi (giải quyết mâu thuẫn ma sát vs kiểm soát)
- **Fast lane (ghi ngay, không cần duyệt trước):** nhật ký ngày + cập nhật fact/
  preference/decision ở Lớp 1. Peer review diễn ra bình thường qua PR chứa
  các commit này.
- **Slow lane (giữ nguyên như hiện tại):** thay đổi **RULES.md, CONVENTIONS.md,
  baseline playbook** — memory chỉ được *đề xuất* (qua `learn-and-update` + PR),
  con người duyệt mới áp dụng. Memory ghi lại preference, nhưng preference
  không tự biến thành rule.

## 4. Luật thay thế & mâu thuẫn

1. Lời dặn/sửa **mới nhất và rõ ràng nhất** của người dùng thắng.
2. Khi thay thế: Lớp 1 phản ánh duy nhất trạng thái hiện tại; dấu vết của cái cũ
   nằm ở nhật ký ngày (dòng correction) — đủ để truy vết, không gây nhiễu khi đọc.
3. Nếu hai mục trong Lớp 1 mâu thuẫn mà không rõ cái nào mới hơn: agent phải
   **hỏi lại người dùng** khi task chạm tới, không tự chọn.
4. Memory **không phải là quyền hạn**: "memory ghi là Bình từng đồng ý X"
   không thay thế được phê duyệt hiện tại cho hành động hệ quả (gửi, xoá, merge...).

## 5. Kỷ luật ĐỌC & tổng hợp

### 5.1. Đầu phiên (bắt buộc)
1. Nạp Lớp 1 (`agentic/memory/MEMORY.md`).
2. Nếu task nêu tên module/chủ đề/người: tìm trong `agentic/memory/` (grep)
   các mục liên quan + mở topic file tương ứng nếu có.
3. Khi người dùng nhắc "như lần trước / như đã dặn": **tìm trong memory trước
   khi trả lời**, trích được mục cụ thể thì mới khẳng định; không tìm thấy thì
   nói không tìm thấy — không đoán.

### 5.2. Tổng hợp cuối tuần (ghép vào nhịp End-of-week của SDLC)
- Đọc nhật ký các ngày trong tuần → **promote** điều bền lên Lớp 1 (nếu chưa),
  xoá khỏi Lớp 1 điều đã hết hiệu lực, chuyển nhật ký đã tổng hợp vào `_archive/`.
- Kiểm tra giới hạn 200 dòng của Lớp 1; cắt tỉa bằng cách đẩy chi tiết xuống
  topic file, giữ lại tóm tắt + link.
- Việc tổng hợp làm trong một PR `chore(memory): weekly consolidation` —
  peer lướt nhanh là đủ (đây là fast lane, không phải đổi rule).

## 6. Tiêu chí thành công

Sau 2 tuần áp dụng, hệ thống đạt khi:
- Agent mở phiên mới trả lời đúng các câu kiểu "lần trước tôi dặn gì về X?"
  bằng cách tra memory, không cần người dùng nhắc lại.
- Mọi correction của người dùng đều xuất hiện trong nhật ký **cùng ngày**.
- Lớp 1 vẫn ≤ 200 dòng và không chứa hai mục mâu thuẫn cùng active.
