# Floating Glass Controls & Scroll-Under Content (Apple Liquid Glass Architecture)

> **Canonical Terminology & Brief Phrase:** `"floating glass controls with scroll-under content"`  
> **Source:** Trương Công Bình (2026-11-01)  
> **Scope:** Toàn bộ hệ thống CIRCLE — Web (`apps/web`) và Mobile (`apps/mobile`).

---

## 1. Triết Lý & Kiến Trúc 2 Lớp (Two-Layer Architecture)

Trong hệ thống CIRCLE (chuẩn hóa theo phong cách Liquid Glass của Apple / iOS 26), không tồn tại các thanh header hay footer dạng khối hộp đặc che khuất hoặc chia cắt nội dung.

Giao diện được tổ chức theo 2 lớp tách biệt:
1. **Lớp kính (Glass Layer):** Nơi chứa toàn bộ các điều khiển tương tác (floating controls) lơ lửng trên bề mặt với hiệu ứng kính mờ (`backdrop-blur`, viền hairline siêu mỏng, độ trong suốt quang học cao).
2. **Lớp nội dung (Content Layer):** Trải dài vô cực phía dưới lớp kính. Khi cuộn, nội dung trượt tự do qua bên dưới các thanh điều khiển (**scroll-under**), kết hợp với hiệu ứng làm mờ nhẹ ở mép cuộn (**scroll edge effect**).

---

## 2. Phân Loại Chi Tiết (Taxonomy)

| Thuật ngữ | Định dạng hiển thị | Ví dụ áp dụng trên CIRCLE |
| :--- | :--- | :--- |
| **Floating Tab Bar** | Thanh tab lơ lửng ở dưới đáy, cách các mép màn hình một khoảng đệm an toàn, các góc bo tròn mềm mại. | Thanh tab chính di động (`CustomLiquidTabBar`), thanh điều hướng trang. |
| **Floating Toolbar** | Thanh công cụ chứa một cụm các nút chức năng, dạng viên thuốc dài (elongated pill shape). | Cụm công cụ lọc feed, thanh công cụ bản đồ/vị trí, toolbar soạn thảo tương tác. |
| **Floating Action Button (FAB)** | Một nút tròn đơn lẻ dành cho hành động chính yếu nhất của màn hình. | Nút `+` tạo nhanh ở trung tâm tab bar, nút soạn tin nhắn mới, nút chia sẻ nhanh. |
| **Glass Button** | Nút bấm được phủ chất liệu kính mờ, phản xạ tinh tế, tương thích cả Dark/Light mode. | Nút Profile user, Logo app lơ lửng góc trên, nút chuyển Circle, nút đóng/thu gọn. |
| **Scroll-Under & Scroll Edge Effect** | Hiện tượng nội dung trượt ngầm bên dưới lớp kính mờ khi cuộn trang, mép cuộn có hiệu ứng mờ viền. | Danh sách tin nhắn chat trượt dưới thanh input/toolbar, feed cuộn dưới logo/profile lơ lửng. |

---

## 3. Quy Tắc Triển Khai Thực Tế (Engineering Rules)

1. **Không dùng Header/Footer Hộp Thô Cứng:** Loại bỏ các thanh `<header>` hoặc `<footer>` đặc nền, có viền chia cắt (`border-b`, `border-t` dày) đóng hộp nội dung.
2. **Đồng Bộ Song Hành Web + Mobile:**
   - **Web:** Sử dụng Tailwind `fixed` hoặc `sticky top-4`/`bottom-4`, `backdrop-blur-md`, `bg-white/70 dark:bg-black/70`, `border border-white/20 dark:border-white/10`, `rounded-full` hoặc `rounded-2xl`, `shadow-lg shadow-black/5`.
   - **Mobile (React Native):** Sử dụng `position: 'absolute'`, thư viện blur (`expo-blur` `BlurView`), `borderRadius`, `overflow: 'hidden'`, khoảng cách đáy `bottom: insets.bottom + 8`.
3. **Scroll Padding:** Nội dung cuộn ở bên dưới phải luôn có `paddingBottom` hoặc `paddingTop` phù hợp (bằng chiều cao control + khoảng đệm an toàn) để khi cuộn tới cuối, nội dung không bao giờ bị control che khuất tầm nhìn.
4. **Độ Mờ & Độ Đục Kính Cân Bằng (Balanced Legible Glass Standard):**
   - Tuyệt đối KHÔNG xóa trong suốt quá mức (dưới 80% opacity) khiến text, icon hoặc các nút bấm bị chìm hoặc lẫn vào hình ảnh/chữ trượt bên dưới content layer.
   - **Tỉ lệ chuẩn:** Light mode đạt `90% - 94%` opacity (`bg-white/92` đến `bg-white/95`); Dark mode đạt `88% - 92%` opacity (`bg-circle-dark-surface/92` hoặc `rgba(20, 20, 24, 0.90)`).
   - **Độ nhòe:** Luôn kết hợp độ mờ cao (`backdrop-blur-xl` trên Web, `intensity={75-85}` trên Mobile) để tán xạ ánh sáng nền, giữ vững độ tương phản và sự sắc nét tuyệt đối của các điều khiển trên lớp kính.
