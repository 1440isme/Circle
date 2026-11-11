# Detailed Record of Changes (teamwork_worker_impl_1)

## Overview
This document records all modifications implemented across the CIRCLE monorepo to address:
1. Create Poll chat modal layout distortion & CSS containing-block trap.
2. Phantom Tailwind token discrepancies & invalid CSS utility classes.
3. Dark theme contrast inversions across Web and Mobile.
4. Messenger-style inline edit message interaction with strict 100% Web + Mobile parity.
5. Mobile ergonomics, safe area, and dark theme parity.

---

## 1. Web Modals & CSS Architecture

### `apps/web/src/components/chat/CreatePollChatModal.tsx`
- **Root Cause**: Rendered as a nested child of `ChatComposer.tsx`, which had a non-none `backdrop-filter: blur(2px)`. Per W3C CSS Filters Level 1 specification, any element with a `filter` or `backdrop-filter` creates a containing block for `position: fixed` descendants, constraining the modal's `fixed inset-0` to the small composer area.
- **Fix**:
  - Implemented `createPortal(modalContent, document.body)` with an SSR `mounted` state guard (`const [mounted, setMounted] = useState(false)` + `useEffect(() => setMounted(true), [])`).
  - Added global Escape key listener (`useEffect` with `handleKeyDown`).
  - Added backdrop click-to-close (`onClick={(e) => e.target === e.currentTarget && onClose()}`).
  - Structured the modal dialog with `max-h-[90vh] flex flex-col` and applied `flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar` on the options container to ensure responsiveness across all viewport heights.
  - Replaced non-standard `backdrop-blur-xs` with standard `backdrop-blur-sm`.
  - Added `[color-scheme:light] dark:[color-scheme:dark]` to datetime input for native picker dark mode support.
  - Aligned action buttons with `hover:text-circle-sage`, `bg-circle-primary hover:bg-circle-sage text-white`.

### `apps/web/src/components/chat/ChatComposer.tsx`
- **Fix**: Removed `backdrop-blur-[2px]` from line 419 container to eliminate the CSS containing-block trap at its source, protecting any other relative or fixed elements placed near the composer.

### `apps/web/src/components/ui/FullEmojiPickerModal.tsx`
- **Fix**: Wrapped modal dialog with `createPortal(..., document.body)` with `mounted` SSR state guard and backdrop click-to-close to prevent similar viewport trapping.

---

## 2. Tailwind Configuration & Semantic Token Aliases

### `apps/web/tailwind.config.ts`
- **Root Cause**: Discrepancies between token definitions in `@circle/shared` and class names used in JSX led to phantom classes that emitted zero CSS (e.g. `bg-circle-dark-bg`, `border-circle-dark-border`, `hover:bg-circle-dark-hover`, `bg-circle-dark-card`, `bg-circle-primary-hover`).
- **Fix**: Added explicit aliases under `theme.extend.colors`:
  - `circle.primaryHover`: `'#059669'`
  - `circle.primaryDark`: `'#059669'`
  - `circle.success`: `'#10B981'`
  - `circle.dark.bg`: `'#131316'`
  - `circle.dark.border`: `'#2E2E35'`
  - `circle.dark.hover`: `'#2A2A30'`
  - `circle.dark.card`: `'#1D1D21'`

---

## 3. Invalid CSS Classes & Dark Theme Contrast Sweeps (Web)

Replaced all instances of non-standard `backdrop-blur-xs` (which does not exist in standard Tailwind v3.4) with `backdrop-blur-sm`, and replaced `focus:outline-hidden` (Tailwind v4 syntax) with standard `focus:outline-none`.

### Files Modified:
1. `apps/web/src/components/tools/CustomDateTimePicker.tsx`:
   - Replaced `focus:outline-hidden` -> `focus:outline-none`.
   - Added `dark:hover:text-white` to month navigation chevron buttons to fix low-contrast hover state.
2. `apps/web/src/components/circle/CircleManagementModal.tsx`:
   - Replaced 5 instances of `backdrop-blur-xs` with `backdrop-blur-sm`.
   - Replaced `focus:outline-hidden` -> `focus:outline-none`.
   - Fixed cancel buttons and close buttons contrast: added `dark:border-circle-dark-hairline dark:text-circle-dark-muted dark:hover:bg-circle-dark-wash` and `dark:hover:text-white`.
3. `apps/web/src/components/settings/SystemSettingsModal.tsx`:
   - Replaced 3 instances of `backdrop-blur-xs` with `backdrop-blur-sm`.
4. `apps/web/src/components/profile/EditProfileModal.tsx`:
   - Replaced `backdrop-blur-xs` with `backdrop-blur-sm`.
   - Added `dark:hover:bg-circle-dark-wash` to close button.
   - Replaced `circle-success` with `border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`.
5. `apps/web/src/components/navigation/LanguageSwitcher.tsx`:
   - Replaced phantom `circle-dark-card` with `circle-dark-elevated` and `circle-dark-surface`.
6. `apps/web/src/components/chat/ClearChatModal.tsx`:
   - Replaced `circle-dark-card` with `dark:bg-circle-dark-surface dark:border-circle-dark-hairline`.
7. `apps/web/src/components/chat/ChatPollCard.tsx`:
   - Standardized unselected option background in dark mode: `dark:bg-white/[0.04]` and `dark:border-circle-dark-hairline`.
   - Fixed unselected progress fill: `dark:bg-white/[0.04]`.
   - Standardized radio circle borders and check colors in dark mode.
8. `apps/web/src/components/chat/MessageBubble.tsx`:
   - Replaced non-existent `hover:bg-circle-primary-dark` with `hover:bg-circle-sage`.
9. `apps/web/src/components/moments/MomentHistoryView.tsx`:
   - Replaced `backdrop-blur-xs` with `backdrop-blur-sm`.
10. `apps/web/src/components/chat/MapLocationPickerModal.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm` and `focus:outline-hidden` with `focus:outline-none`.
    - Added dark text styling `dark:text-circle-dark-text` to search results.
11. `apps/web/src/components/tools/CircleAlbumsView.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm` and `focus:outline-hidden` with `focus:outline-none`.
12. `apps/web/src/components/tools/CircleCalendarView.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm` and `focus:outline-hidden` with `focus:outline-none`.
13. `apps/web/src/components/tools/LocationSearchInput.tsx`:
    - Replaced `focus:outline-hidden` with `focus:outline-none` and added `dark:border-circle-dark-hairline`.
14. `apps/web/src/components/tools/CircleWheelView.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm` and `focus:outline-hidden` with `focus:outline-none`.
15. `apps/web/src/components/tools/CircleAnonymousView.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm` and `focus:outline-hidden` with `focus:outline-none`.
16. `apps/web/src/components/tools/CircleLocationView.tsx`:
    - Replaced `backdrop-blur-xs` with `backdrop-blur-sm`.

---

## 4. Messenger-Style Inline Edit Message Interaction (Web & Mobile Parity)

Per user invariant and UX design principle:
- Zero modals, popups, or separate dialogs for viewing edit history.
- Clicking or tapping on "(đã chỉnh sửa)" / "(edited)" directly toggles the previous content inline right inside the same message bubble above the current content.
- Previous content is styled with a muted/faded opacity, line-through italic text, and an original message label.

### Modifications:
1. `packages/types/src/index.ts`:
   - Added `previousContent?: string | null` to `MessageEntity`.
   - Rebuilt package via `npm run build`.
2. `packages/shared/src/locales/vi.ts` & `packages/shared/src/locales/en.ts`:
   - Added `originalMessageLabel: 'Tin nhắn gốc'` (VI) / `'Original message'` (EN).
   - Rebuilt package via `npm run build`.
3. `apps/backend/src/modules/chat/chat.service.ts`:
   - Updated `editMessage` method: captures existing content and sets `formatted.previousContent = message.content;` before broadcasting `circle:message-updated` and returning response.
4. `apps/web/src/hooks/use-chat-queries.ts`:
   - Updated `handleMessageUpdated`: preserves `previousContent` when updating the React Query message cache.
5. `apps/web/src/components/chat/MessageBubble.tsx`:
   - Added `const [showOriginal, setShowOriginal] = useState(false)`.
   - Rendered inline previous message block inside bubble above current content when `showOriginal` is true.
   - Rendered toggle chevron button with `editedLabel` allowing instant toggling without popups.
6. `apps/mobile/src/hooks/use-circle-queries.ts`:
   - Updated `handleMessageUpdated`: preserves `previousContent` in mobile React Query cache.
7. `apps/mobile/app/circle/[id].tsx`:
   - Added `const [showOriginal, setShowOriginal] = useState(false)` to `MobileSwipeMessageBubble`.
   - Rendered inline previous message view directly above current message text with faded opacity, line-through decoration, history icon, and `(đã sửa)` touchable trigger with `Haptics.selectionAsync()`.

---

## 5. Mobile Parity & Dark Theme Polish

1. `apps/mobile/src/components/chat/MobileCreatePollModal.tsx`:
   - Imported and utilized `useSafeAreaInsets` to provide dynamic safe area bottom padding (`Math.max(insets.bottom, 20)`).
   - Configured input fields to use `isDark ? colors.canvas : colors.wash` with `colors.hairline` borders for dark theme readability.
   - Set submit button text and activity indicator colors to `colors.onPrimary || (isDark ? '#131316' : '#FFFFFF')` ensuring high contrast on primary green.
2. `apps/mobile/src/components/chat/MobileChatPollCard.tsx`:
   - Configured check mark icon color: `isSenderMe ? (isDark ? '#131316' : '#000000') : colors.onPrimary || '#FFFFFF'`.
   - Configured unselected option backgrounds in dark theme to `rgba(255, 255, 255, 0.08)` to prevent swampy/muddy appearance.
   - Configured progress bar fill to high-contrast translucent white/wash.
3. `apps/mobile/src/components/tools/MobilePollView.tsx`:
   - Updated submit buttons (`emptyCreateBtnText`, `modalSubmitText`) to use `colors.onPrimary` for consistent high-contrast accessibility.

---

## 6. Verification Results

| Suite / Check | Command | Result | Notes |
|---|---|---|---|
| Web Production Build | `npm run build` in `apps/web` | **PASS (code 0)** | 11/11 static pages generated, zero TypeScript errors |
| Mobile Typecheck | `npx tsc --noEmit` in `apps/mobile` | **PASS (code 0)** | 0 TypeScript errors across the entire React Native codebase |
| Backend Jest Tests | `npm test` in `apps/backend` | **PASS (code 0)** | 11/11 test suites passed, 186/186 unit/integration tests passed |
| Invalid Class Sweep | Ripgrep regex check | **PASS (0 found)** | 0 instances of `backdrop-blur-xs` or `outline-hidden` remain |
