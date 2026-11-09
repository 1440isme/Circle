# BRIEFING — 2026-11-09T16:35:00Z

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
- Updated: 2026-11-09T16:35:00Z

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
- **Code layout**: `apps/web`, `apps/mobile`, `apps/api`

## Change Tracker
- **Files modified**:
  - `apps/web/src/components/chat/CreatePollChatModal.tsx`: Added createPortal, SSR guard, Escape listener, scroll containment, dark theme color-scheme.
  - `apps/web/src/components/chat/ChatComposer.tsx`: Removed backdrop-blur-[2px].
  - `apps/web/src/components/ui/FullEmojiPickerModal.tsx`: Wrapped with createPortal and mounted SSR guard.
  - `apps/web/tailwind.config.ts`: Added semantic aliases under circle and circle.dark.
  - `apps/web/src/components/tools/CustomDateTimePicker.tsx`: Fixed focus:outline-hidden and chevron dark hover contrast.
- **Build status**: Web build baseline passed (code 0), API tests baseline passed (186/186 passed), Mobile tsc baseline passed (code 0).
- **Pending issues**: Remaining class replacements, contrast fixes, Messenger-style inline edit interaction, mobile parity polish.

## Quality Status
- **Build/test result**: In-progress
- **Lint status**: Clean
- **Tests added/modified**: [TBD]

## Key Decisions Made
- Use React Portal (`createPortal`) with SSR `mounted` state guard for Web modals to escape stacking context / CSS filter traps.
- Ensure Mobile poll modal has equivalent ergonomics (SafeArea, Modal/BottomSheet, KeyboardAvoidingView, dark theme styling).
- Inline toggle for edited message history inside the message bubble directly with muted styling and chevron/faded text, completely eliminating modals.

## Artifact Index
- `.agents/teamwork/teamwork_worker_impl_1/changes.md`
- `.agents/teamwork/teamwork_worker_impl_1/handoff.md`
- `.agents/teamwork/teamwork_worker_impl_1/progress.md`
