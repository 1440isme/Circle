# CIRCLE UI Prototypes (Stitch HTML Showcases)

> **Bộ Prototype Giao diện Tương tác Nền tảng CIRCLE**  
> Được xuất bản trực tiếp từ **Google Stitch** (`projects/11855010937414066795` - `CIRCLE UI Design System`) dựa trên ngôn ngữ thiết kế tại [`docs/design.md`](../design.md).

---

## 1. Danh sách các Prototype Giao diện

Tất cả các tệp HTML dưới đây đã tích hợp sẵn Tailwind CSS, Google Fonts (`Plus Jakarta Sans`), icon Material Symbols và có thể **mở trực tiếp bằng bất kỳ trình duyệt web nào** (Chrome, Safari, Edge) mà không cần cài đặt môi trường phức tạp:

| Tệp Prototype | Nền tảng | Màn hình mô phỏng | Phân công Module tương ứng |
|---|---|---|---|
| [`web-hub.html`](./web-hub.html) | Desktop Web | Bố cục 3 cột (Left Rail, Feed, Presence Rail) | Cơ sở cho `apps/web` (Next.js) |
| [`mobile-home.html`](./mobile-home.html) | iOS Mobile | Dòng sự kiện nhóm & Floating Liquid Glass Tab Bar | Module 5 (Moments & Group Feed) |
| [`mobile-circle-detail.html`](./mobile-circle-detail.html) | iOS Mobile | Không gian Vòng tròn, thành viên, album | Module 3 (Circle Core & Quản trị) |
| [`mobile-chat.html`](./mobile-chat.html) | iOS Mobile | Khung chat nhóm realtime & bubble squircle | Module 4 (Nhắn tin nhóm & Media) |
| [`mobile-action-sheet.html`](./mobile-action-sheet.html) | iOS Mobile | Apple Bottom Sheet (Poll, Điều muốn nói) | Module 7 (Tiện ích Nhóm 7.1 & 7.2) |
| [`mobile-call-stage.html`](./mobile-call-stage.html) | iOS Mobile | Sân khấu FaceTime HUD Liquid Glass | Module 6 (WebRTC Call Thoại/Hình ảnh) |

---

## 2. Hướng dẫn Mở và Xem Trước
Bạn có thể mở trực tiếp các tệp này từ Visual Studio Code, Antigravity IDE hoặc trình duyệt:
```bash
# Xem giao diện Desktop Web Hub
xdg-open docs/ui-prototypes/web-hub.html

# Xem giao diện Mobile Video Call Stage
xdg-open docs/ui-prototypes/mobile-call-stage.html
```
