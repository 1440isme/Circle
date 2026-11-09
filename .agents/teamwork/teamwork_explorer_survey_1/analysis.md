# Báo Cáo Kỹ Thuật: Điều Tra Lỗi Tràn & Méo Layout Modal "Tạo Bình Chọn" (CreatePollChatModal) Trong Khung Chat

- **Người thực hiện**: `teamwork_explorer_survey_1` (Technical Investigator)
- **Mục tiêu**: Điều tra và xác định nguyên nhân gốc rễ (Root Cause) gây lỗi biến dạng layout modal Tạo bình chọn (`CreatePollChatModal.tsx`) khi kích hoạt từ nút dấu cộng `(+)` trên Chat Composer, và đề xuất phương án khắc phục triệt để.
- **Môi trường thử nghiệm**: Linux, Brave DevTools Bridge (port 9333), Next.js frontend (port 3000), NestJS backend (port 4000).

---

## 1. Tóm Tắt Cốt Lõi (Executive Summary)

Khi người dùng nhấn vào nút dấu cộng `(+)` trên thanh soạn thảo tin nhắn (`ChatComposer.tsx`) và chọn **"Tạo bình chọn"** (`Create Poll`), modal `CreatePollChatModal.tsx` xuất hiện trong tình trạng **bị méo layout nghiêm trọng và bị cắt mất nửa dưới**:
1. Lớp phủ nền backdrop (`fixed inset-0`) không bao phủ toàn màn hình mà bị co rúm thành một dải hẹp ở đáy màn hình (chiều cao chỉ 76px).
2. Thẻ nội dung modal (`max-w-md`) bị kéo thụt xuống sâu bên dưới đáy viewport: điểm đáy của modal nằm ở tọa độ Y = 1110.75px (vượt ra ngoài màn hình 185.75px trên viewport cao 925px).
3. Người dùng **hoàn toàn không nhìn thấy và không thể click** vào nút **"Hủy"** (`Cancel`) và nút **"Tạo bình chọn"** (`Create Poll` submit button), cũng như trường chọn hạn chót (`deadline`).

### Nguyên nhân gốc rễ chính:
Thuộc tính `backdrop-blur-[2px]` (CSS `backdrop-filter: blur(2px)`) được đặt trên thẻ div bọc ngoài cùng của `ChatComposer.tsx` (dòng 419). Theo **Đặc tả CSS Transforms & Filter Effects của W3C**, bất kỳ phần tử tổ tiên nào có `backdrop-filter` khác `none` sẽ **thiết lập một Containing Block mới cho tất cả các phần tử con có `position: fixed`** thay vì gắn vào viewport cửa sổ trình duyệt.

Do đó, thẻ `<div className="fixed inset-0 z-50 flex items-center justify-center ...">` của modal bị khóa chặt bên trong khung chứa của composer (cao vỏn vẹn 76px ở đáy màn hình). Khi flexbox căn giữa theo trục dọc (`items-center`), modal cao 448px bị đặt tâm ở 887px, đẩy phần chân của modal tràn qua đáy màn hình và bị khuất hoàn toàn.

---

## 2. Cấu Trúc Phân Cấp DOM & Điểm Gắn (Mount Point Tree)

### Sơ đồ lồng ghép hiện tại:
```
HomePage (apps/web/src/app/page.tsx)
 └── FeedStream (apps/web/src/components/stream/FeedStream.tsx)
      └── ChannelChatView (apps/web/src/components/chat/ChannelChatView.tsx)
           │   [overflow-hidden, relative flex-1 flex flex-col h-full]
           │
           └── div.max-w-4xl.mx-auto (Dòng 602: Cột chat giới hạn chiều rộng)
                │
                └── ChatComposer (apps/web/src/components/chat/ChatComposer.tsx)
                     │
                     └── div (Dòng 419: pointer-events-none absolute bottom-0 left-0 right-0 z-20 backdrop-blur-[2px]) ⚠️ CONTAINING BLOCK TRAP
                          │
                          └── div (Dòng 420: pointer-events-auto w-full max-w-3xl flex flex-col gap-2)
                               │
                               ├── Action Capsule: Plus Button (+) -> Popover Menu -> Create Poll Button
                               │
                               └── CreatePollChatModal (Dòng 694)
                                    └── div (fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ...)
                                         └── div.relative.w-full.max-w-md (Card modal tạo bình chọn)
```

### So sánh với các Modal khác trong ứng dụng:
- Các modal hoạt động bình thường như `CreateCircleModal`, `JoinCircleModal`, `CircleManagementModal` được gắn ở root của `page.tsx`, không nằm trong phần tử có `backdrop-filter` hoặc `overflow: hidden`.
- Các modal trong `ChannelChatView` như `ClearChatModal`, `PinnedMessagesModal` được gắn ở cấp root của `ChannelChatView` (chiều cao 925px và không có `backdrop-filter`).
- Riêng `CreatePollChatModal` (và `FullEmojiPickerModal`) bị đặt sâu bên trong `ChatComposer` dưới một container có `backdrop-blur-[2px]`, `absolute bottom-0`, và `pointer-events-none`.

---

## 3. Dữ Liệu Đo Đạc Thực Tế Qua Trình Duyệt (Live DOM Metrics)

Dữ liệu trích xuất trực tiếp từ Brave DevTools API (`scripts/brave-ctl.mjs eval`) trên màn hình 1920x925:

| Thuộc tính đo đạc | Trạng thái lỗi (Hiện tại) | Sau khi gỡ `backdrop-filter` hoặc Portal vào `body` |
|---|---|---|
| **Backdrop `top` / `bottom`** | `top: 849px`, `bottom: 925px` | `top: 0px`, `bottom: 925px` |
| **Backdrop `left` / `right`** | `left: 416px`, `right: 1472px` | `left: 0px`, `right: 1920px` |
| **Backdrop `height` x `width`** | **76px** x 1056px (Bị kẹt ở composer) | **925px** x 1920px (Bao phủ toàn màn hình) |
| **Modal Card `top`** | `663.25px` | `238.75px` |
| **Modal Card `bottom`** | **1110.75px** (Tràn dưới đáy 185.75px!) | **686.25px** (Căn giữa hoàn hảo) |
| **Submit Button `top` - `bottom`** | **1053.75px - 1085.75px** (Vượt ngoài màn hình!) | **629.25px - 661.25px** (Hiển thị rõ ràng, click tốt) |
| **Khả năng tương tác** | **Bị chặn / Không thể submit** | **Tương tác 100% bình thường** |

### Ảnh chụp thực chứng:
1. `poll_modal_distortion.png`: Minh chứng modal bị thụt xuống đáy, mất các nút thao tác.
2. `poll_modal_fixed_backdrop_test.png` & `poll_modal_portaled_perfect.png`: Minh chứng modal hiển thị ngay ngắn, căn giữa hoàn chỉnh khi áp dụng giải pháp.

---

## 4. Phát Hiện Lỗi Tương Tự (Sibling Defect Discovery)

Trong quá trình điều tra `ChatComposer.tsx`, phát hiện component **`FullEmojiPickerModal`** (Dòng 519 trong `ChatComposer.tsx`) cũng được render tại cùng vị trí con của container `backdrop-blur-[2px]`:
- Khi click vào biểu tượng mặt cười (Emoji) ở bên phải thanh composer, `FullEmojiPickerModal` cũng bị rơi vào Containing Block Trap:
  - `backdrop.height`: 76px (`top: 849, bottom: 925`).
  - `modal.bottom`: **1123px** (vượt ngoài màn hình gần 200px!).
  - Nửa dưới danh sách emoji bị biến mất dưới đáy viewport (đã chụp ảnh minh chứng tại `emoji_modal_distortion.png`).

---

## 5. Danh Sách Các Khiếm Khuyết Bổ Sung Trong `CreatePollChatModal.tsx`

Bên cạnh lỗi Containing Block, `CreatePollChatModal.tsx` còn có 4 khiếm khuyết về UX/UI và Dark theme:
1. **Thiếu giới hạn chiều cao tối đa (`max-h`) & vùng cuộn**:
   - Modal hiện dùng `className="relative w-full max-w-md ... p-6"`, không có `max-h-[85vh]` hay `overflow-y-auto`.
   - Khi người dùng thêm nhiều lựa chọn (hỗ trợ tối đa 8 phương án), chiều cao form tăng thêm hơn 250px, gây tràn màn hình trên các thiết bị có chiều cao thấp (laptop 768p, tablet, mobile).
2. **Thiếu sự kiện đóng khi bấm backdrop (Backdrop Click to Close)**:
   - Thẻ backdrop ngoài cùng không có `onClick` kiểm tra `e.target === e.currentTarget`, buộc người dùng phải tìm nút X nhỏ ở góc.
3. **Thiếu phím tắt `Escape`**:
   - Không lắng nghe phím `Escape` để đóng modal nhanh theo tiêu chuẩn trợ năng WAI-ARIA.
4. **Không chỉ định `color-scheme` cho `datetime-local` input**:
   - Trường `<input type="datetime-local" ... />` trên trình duyệt Chromium/WebKit ở Dark theme sẽ hiển thị icon lịch màu đen trên nền tối nếu không có class `[color-scheme:light] dark:[color-scheme:dark]`, làm icon bị chìm khó nhìn.

---

## 6. Kế Hoạch Khắc Phục Chi Tiết (Actionable Remediation Plan)

### Chiến lược khắc phục gồm 2 lớp bảo vệ (Defense in Depth):
1. **Lớp 1 (Triệt để)**: Sử dụng React Portal (`createPortal(..., document.body)`) trong `CreatePollChatModal.tsx` (và `FullEmojiPickerModal.tsx`). Điều này đảm bảo modal luôn được gắn trực tiếp vào `document.body`, hoàn toàn độc lập với bất kỳ CSS transform, filter, backdrop-filter, overflow, hay z-index nào của các component cha.
2. **Lớp 2 (Vệ sinh CSS)**: Loại bỏ `backdrop-blur-[2px]` thừa thãi khỏi container ngoài cùng của `ChatComposer.tsx` (dòng 419) để tránh tạo containing block ngoài ý muốn cho các phần tử con khác.

---

### Chi tiết thay đổi Code đề xuất:

#### 1. File: `apps/web/src/components/chat/CreatePollChatModal.tsx`

```tsx
// THAY ĐỔI 1: Import createPortal và useEffect
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// THAY ĐỔI 2: Thêm state mounted và Escape key listener
export const CreatePollChatModal: React.FC<CreatePollChatModalProps> = ({
  isOpen,
  onClose,
  circleId,
  onPollCreated,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [mounted, setMounted] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const createPollMutation = useCreatePollMutation(circleId);

  if (!isOpen || !mounted) return null;

// THAY ĐỔI 3: Cải tiến Backdrop & Form Container
  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <Vote className="w-5 h-5 text-circle-primary shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.createPoll}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {t.collab.createPollHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 custom-scrollbar">
            {/* Question */}
            <div>
              <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                {t.collab.pollTitle} *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.collab.pollQuestionPlaceholder}
                autoFocus
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 focus:outline-none focus:border-circle-primary transition-all"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                {t.collab.addOption} *
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={t.collab.pollOptionPlaceholder.replace('{index}', String(idx + 1))}
                      className="flex-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 focus:outline-none focus:border-circle-primary transition-all"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title={t.collab.removeOption}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-circle-primary hover:text-circle-primary-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.collab.addOption}</span>
                </button>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                {t.collab.pollDeadline}
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:border-circle-primary transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-circle-primary hover:bg-circle-primary-hover text-white transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <span>{t.collab.createPoll}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
```

---

#### 2. File: `apps/web/src/components/chat/ChatComposer.tsx`

**Dòng 419**:
```diff
-    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center bg-gradient-to-t from-white/98 dark:from-circle-dark-surface/98 via-white/80 dark:via-circle-dark-surface/80 to-transparent backdrop-blur-[2px] transition-colors">
+    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center bg-gradient-to-t from-white/98 dark:from-circle-dark-surface/98 via-white/80 dark:via-circle-dark-surface/80 to-transparent transition-colors">
```

---

#### 3. File: `apps/web/src/components/ui/FullEmojiPickerModal.tsx`

Áp dụng mẫu `createPortal` tương tự với `mounted` check để giải quyết dứt điểm lỗi bị cắt chân khi mở từ Chat Composer.
