# CIRCLE — Memory System cho Agent

Gói này áp cơ chế trí nhớ xuyên phiên (kiểu Muse memory) vào workflow agent
hiện tại của CIRCLE. Vấn đề nó giải quyết: **agent nghe lời dặn trong phiên,
sang phiên sau quên sạch** — vì hệ thống hiện tại chỉ có đường *đọc* memory
(`understand-the-repo` nạp MEMORY.md) mà không có *kỷ luật ghi*, và cổng ghi
duy nhất (`agentic/learning/`, phải qua PR) quá nặng cho những ghi nhớ nhỏ.

Nguyên lý cốt lõi: trí nhớ tốt không đến từ model, mà từ 3 thứ —
**(1) cấu trúc 3 lớp** (index tinh gọn luôn được nạp / nhật ký ngày ghi rẻ /
hồ sơ sâu theo chủ đề), **(2) ghi ngay tại thời điểm được dặn hoặc bị sửa**,
**(3) luật thay thế rõ ràng** để memory không tự mâu thuẫn.

## Nội dung gói

| File | Dùng để |
|---|---|
| `MEMORY-PROTOCOL.md` | Đặc tả đầy đủ: chẩn đoán, cấu trúc 3 lớp, kỷ luật ghi/đọc, hai làn ghi (fast/slow), luật thay thế, nhịp tổng hợp cuối tuần |
| `agentic/skills/memory-protocol.md` | Skill cho agent — quy trình thực thi trong phiên (copy vào `agentic/skills/` của repo, đăng ký vào `agentic/skills/README.md`) |
| `agentic/memory/MEMORY.md` | Mẫu Lớp 1 đã **điền sẵn** các facts/preferences hiện có của CIRCLE từ PROJECT_GOD.md + AGENTS.md — thay cho `MEMORY.md` trống hiện tại |
| `agentic/memory/_templates/daily-log.md` | Mẫu nhật ký ngày (Lớp 2) |
| `agentic/memory/_templates/topic-file.md` | Mẫu hồ sơ chủ đề (Lớp 3) |
| `scripts/new-memory-log.sh` | Script tạo nhật ký ngày mới từ mẫu (copy vào `scripts/` của repo) |
| `AGENTS-patch.md` | Đoạn cần chèn/sửa trong AGENTS.md để "nối dây" giao thức vào entry point |

## Cách áp dụng (15 phút)

1. Copy `agentic/skills/memory-protocol.md` vào repo; thêm một dòng vào
   `agentic/skills/README.md`.
2. Thay `agentic/memory/MEMORY.md` bằng bản mẫu đã điền sẵn trong gói này
   (đọc lướt và sửa những chỗ chưa đúng với thực tế nhóm).
3. Tạo thư mục `agentic/memory/topics/` và `agentic/memory/_archive/`.
4. Áp `AGENTS-patch.md` vào AGENTS.md của repo.
5. Từ phiên làm việc tiếp theo: agent tự ghi khi Bình/Hạnh dặn hoặc sửa —
   kiểm chứng sau 1 tuần bằng cách hỏi agent ở phiên mới: "Tôi đã dặn gì về...?"
