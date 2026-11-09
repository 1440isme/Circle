# BRIEFING — 2026-11-09T17:00:00Z

## Mission
Implement frontend fixes for Poll modal layout bug, Tailwind token discrepancies, invalid utility classes, dark theme contrast across Web and Mobile with 100% parity, and Messenger-style inline edit message interaction on both Web and Mobile.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa
- Working directory: /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_worker_impl_1
- Original parent: 57bfc123-1132-43b5-92f4-d09fe4f1ccf6
- Milestone: Poll Layout Bug & Dark Theme Polish (Web + Mobile Parity)

## 🔒 Key Constraints
- Strict 100% Web + Mobile parity ("nhớ là mobile nữa chứ k phải mỗi web đâu nhé").
- Genuine implementation — no cheating, no hardcoded verification strings.
- Minimal change principle: modify only what is necessary, no unrelated refactoring.
- All builds and tests must pass cleanly: Web build, Mobile typecheck, API tests.
- Verify live in browser using `brave-ctl.mjs`.
- Messenger-style edit message interaction: clicking/tapping "(edited)" indicator toggles previous/original message directly INSIDE THE SAME MESSAGE BUBBLE above current content with muted opacity. NO modals, popups, or dialogs.

## Current Parent
- Conversation ID: 57bfc123-1132-43b5-92f4-d09fe4f1ccf6
- Updated: 2026-11-09T17:00:00Z

## Task Summary
- **What to build**:
  1. Fix `CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx` with `createPortal(..., document.body)`, SSR mount guard, Escape listener, click-outside backdrop, scroll containment.
  2. Remove containing-block trap `backdrop-blur-[2px]` in `ChatComposer.tsx`.
  3. Update `tailwind.config.ts` with missing token aliases (`circle.primaryHover`, `circle.primaryDark`, `circle.success`, `circle.dark.bg`, `circle.dark.border`, `circle.dark.hover`, `circle.dark.card`).
  4. Replace `backdrop-blur-xs` -> `backdrop-blur-sm` and `focus:outline-hidden` -> `focus:outline-none`.
  5. Fix dark mode contrast inversions (`CustomDateTimePicker.tsx`, `CircleManagementModal.tsx`, `ChatPollCard.tsx`, `ClearChatModal.tsx`, `LanguageSwitcher.tsx`, `EditProfileModal.tsx`).
  6. Messenger-style inline edit message interaction on Web (`MessageBubble.tsx`) and Mobile (`apps/mobile/app/circle/[id].tsx`).
  7. Mobile parity audit and fixes in mobile chat poll modal / composer / safe area / dark theme.
- **Success criteria**: Web build passes, Mobile tsc passes, API tests pass, Poll modal centered in browser, Dark mode high contrast, Messenger-style inline edit message works on Web & Mobile.
- **Interface contracts**: `/home/tcb/Documents/TLCN/Circle/.agents/teamwork/orchestrator/PROJECT.md`
- **Code layout**: `apps/web`, `apps/mobile`, `apps/backend`, `packages/types`, `packages/shared`

## Change Tracker
- **Files modified**:
  - `apps/web/src/components/chat/CreatePollChatModal.tsx`: Portal wrap, SSR mount guard, Escape listener, scroll containment, color-scheme.
  - `apps/web/src/components/chat/ChatComposer.tsx`: Removed containing-block trap `backdrop-blur-[2px]`.
  - `apps/web/src/components/ui/FullEmojiPickerModal.tsx`: Portal wrap, SSR mount guard, backdrop click-to-close.
  - `apps/web/tailwind.config.ts`: Added semantic aliases under `circle` and `circle.dark`.
  - Utility & contrast fixes across 14 Web files: `CustomDateTimePicker.tsx`, `CircleManagementModal.tsx`, `SystemSettingsModal.tsx`, `EditProfileModal.tsx`, `LanguageSwitcher.tsx`, `ClearChatModal.tsx`, `ChatPollCard.tsx`, `MessageBubble.tsx`, `MomentHistoryView.tsx`, `MapLocationPickerModal.tsx`, `CircleAlbumsView.tsx`, `CircleCalendarView.tsx`, `CircleWheelView.tsx`, `CircleAnonymousView.tsx`, `CircleLocationView.tsx`.
  - `packages/types/src/index.ts`: Added `previousContent?: string | null` to `MessageEntity`.
  - `packages/shared/src/locales/vi.ts` & `en.ts`: Added `originalMessageLabel`.
  - `apps/backend/src/modules/chat/chat.service.ts`: Populates `previousContent` on edit message broadcast and response.
  - `apps/web/src/hooks/use-chat-queries.ts`: Retains `previousContent` on query cache update.
  - `apps/web/src/components/chat/MessageBubble.tsx`: Inline Messenger-style toggle for previous message inside bubble.
  - `apps/mobile/src/hooks/use-circle-queries.ts`: Retains `previousContent` on query cache update.
  - `apps/mobile/app/circle/[id].tsx`: Messenger-style inline toggle in `MobileSwipeMessageBubble` with haptics.
  - `apps/mobile/src/components/chat/MobileCreatePollModal.tsx`: Safe area insets, dark theme canvas background, high-contrast submit button.
  - `apps/mobile/src/components/chat/MobileChatPollCard.tsx`: High-contrast checkmark, unselected background, progress bar fill in dark theme.
  - `apps/mobile/src/components/tools/MobilePollView.tsx`: High-contrast submit buttons.
- **Build status**: Web build PASSED (`npm run build`, code 0), Mobile tsc PASSED (`npx tsc --noEmit`, code 0), API tests PASSED (`npm test`, 186/186 passed).
- **Pending issues**: None. Ready for handoff and forensic audit.

## Quality Status
- **Build/test result**: 100% PASS
  - Web: `npm run build` -> 0 errors, 11/11 static pages generated.
  - Mobile: `npx tsc --noEmit` -> 0 type errors.
  - Backend: Jest unit & integration tests -> 11 test suites passed, 186 tests passed.
- **Lint status**: Clean (no code linter errors introduced).
- **Tests added/modified**: Verified against Jest regression test suite in `apps/backend`.

## Key Decisions Made
- Use React Portal (`createPortal(modalContent, document.body)`) with SSR `mounted` state guard for Web modals to escape stacking context / CSS filter traps.
- In Next.js Tailwind, define color aliases under `theme.extend.colors.circle` rather than mutating existing token structures.
- Messenger-style edit message interaction: toggle previous message directly inside the message bubble above current text with faded/strike-through styling, completely avoiding separate dialogs/popups. Strict parity enforced across Web (`MessageBubble.tsx`) and Mobile (`[id].tsx`).

## Artifact Index
- `.agents/teamwork/teamwork_worker_impl_1/changes.md` — Detailed file-by-file changes and rationale
- `.agents/teamwork/teamwork_worker_impl_1/handoff.md` — 5-component handoff report
- `.agents/teamwork/teamwork_worker_impl_1/progress.md` — Liveness and progress status log
