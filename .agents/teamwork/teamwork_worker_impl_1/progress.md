# Progress Log

- **Last visited**: 2026-11-09T16:58:30Z
- **Status**: Completed 100% of Web & Mobile fixes, contrast audits, Messenger-style inline edit message interaction with strict parity, and test validations.
- **Verification Summary**:
  - `apps/web`: `npm run build` PASSED (code 0, static pages generated).
  - `apps/mobile`: `npx tsc --noEmit` PASSED (code 0, 0 type errors).
  - `apps/backend`: `npm test` PASSED (11/11 test suites, 186/186 unit/integration tests passed).
- **Completed Components**:
  1. `CreatePollChatModal.tsx`: React Portal (`createPortal`) with SSR mount guard, Escape listener, click-outside backdrop, scroll containment, and dark color scheme.
  2. `ChatComposer.tsx`: Eliminated CSS containing-block trap (`backdrop-blur-[2px]`).
  3. `FullEmojiPickerModal.tsx`: React Portal (`createPortal`) with SSR mount guard and backdrop click-to-close.
  4. `tailwind.config.ts`: Added missing token aliases (`circle.primaryHover`, `circle.primaryDark`, `circle.success`, `circle.dark.bg`, `circle.dark.border`, `circle.dark.hover`, `circle.dark.card`).
  5. Utility & Contrast Sweeps: Replaced all 18 instances of invalid `backdrop-blur-xs` -> `backdrop-blur-sm` and all 12 instances of `focus:outline-hidden` -> `focus:outline-none`. Fixed dark contrast in `CustomDateTimePicker.tsx`, `CircleManagementModal.tsx`, `EditProfileModal.tsx`, `ClearChatModal.tsx`, `ChatPollCard.tsx`, `LanguageSwitcher.tsx`, `MomentHistoryView.tsx`, `MapLocationPickerModal.tsx`, `CircleAlbumsView.tsx`, `CircleCalendarView.tsx`, `CircleWheelView.tsx`, `CircleAnonymousView.tsx`, `CircleLocationView.tsx`.
  6. Messenger-Style Inline Edit Message (Strict Web + Mobile Parity):
     - Shared types: `previousContent?: string | null` added to `MessageEntity` in `@circle/types`.
     - Shared locales: Added `originalMessageLabel: 'Tin nhắn gốc'` / `'Original message'` in `@circle/shared`.
     - Backend: Broadcasts and responds with `previousContent` on `editMessage`.
     - Web: `MessageBubble.tsx` renders previous message directly inside the message bubble above current text with strike-through/faded styling and toggle chevron on `(đã sửa)`. Query cache retains `previousContent`.
     - Mobile: `MobileSwipeMessageBubble` in `apps/mobile/app/circle/[id].tsx` renders previous message inline above current text with faded/strike-through style, `(đã sửa)` touchable toggle with haptic feedback (`Haptics.selectionAsync()`). Query cache in `use-circle-queries.ts` retains `previousContent`.
  7. Mobile Parity & Dark Theme Polish:
     - `MobileCreatePollModal.tsx`: Added `useSafeAreaInsets` for dynamic bottom padding, dark canvas input background, high-contrast submit button text (`colors.onPrimary`).
     - `MobileChatPollCard.tsx`: Dark theme high contrast check mark, unselected option background, and progress bar fill.
     - `MobilePollView.tsx`: Dark theme high contrast buttons (`colors.onPrimary`).
