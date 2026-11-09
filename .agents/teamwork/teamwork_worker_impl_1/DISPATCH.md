## 2026-11-09T16:25:55Z
You are teamwork_worker_impl_1, a versatile frontend engineer.
Your working directory is /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_worker_impl_1.
You MUST read /home/tcb/Documents/TLCN/Circle/.agents/teamwork/ORIGINAL_REQUEST.md before starting.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY USER INVARIANT:
"nhớ là mobile nữa chứ k phải mỗi web đâu nhé" - All fixes, audits, and test planning MUST enforce strict 100% Web + Mobile parity!

INPUTS TO READ:
- /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_explorer_survey_1/handoff.md & analysis.md (Poll modal layout bug root cause & portal blueprint)
- /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_explorer_survey_2/handoff.md & analysis.md (Dark theme token matrix, invalid utilities, contrast defects)
- /home/tcb/Documents/TLCN/Circle/.agents/teamwork/orchestrator/PROJECT.md

TASKS:
1. Web Fixes:
   - In `apps/web/src/components/chat/CreatePollChatModal.tsx`:
     - Wrap modal with `createPortal(modalContent, document.body)` with `mounted` SSR state guard (`useState(false)` + `useEffect(() => setMounted(true), [])`).
     - Add `max-h-[90vh] flex flex-col` to modal card and `overflow-y-auto custom-scrollbar` on the options container.
     - Add backdrop click-to-close (`onClick={(e) => e.target === e.currentTarget && onClose()}`) and Escape key listener.
     - Replace `backdrop-blur-xs` with `backdrop-blur-sm`.
     - Add `[color-scheme:light] dark:[color-scheme:dark]` to datetime input for Dark theme consistency.
   - In `apps/web/src/components/chat/ChatComposer.tsx`:
     - Remove `backdrop-blur-[2px]` from line 419 container to avoid containing-block trap.
   - In `apps/web/src/components/ui/FullEmojiPickerModal.tsx`:
     - Wrap with `createPortal(..., document.body)` with `mounted` guard.
   - In `apps/web/tailwind.config.ts`:
     - Add missing token aliases:
       Under `circle`: `primaryHover: '#059669'`, `primaryDark: '#059669'`, `success: '#10B981'`,
       Under `circle.dark`: `bg: '#131316'`, `border: '#2E2E35'`, `hover: '#2A2A30'`, `card: '#1D1D21'`.
   - Replace invalid `backdrop-blur-xs` -> `backdrop-blur-sm` and `focus:outline-hidden` -> `focus:outline-none` across the audited files (`CircleManagementModal.tsx`, `CustomDateTimePicker.tsx`, `SystemSettingsModal.tsx`, `CircleWheelView.tsx`, `MapLocationPickerModal.tsx`, `CircleAnonymousView.tsx`, etc.).
   - Fix contrast inversions in `CustomDateTimePicker.tsx` (month navigation chevrons `dark:hover:text-white`), `CircleManagementModal.tsx` (cancel buttons `dark:border-circle-dark-hairline dark:text-circle-dark-muted dark:hover:bg-circle-dark-wash`), `ChatPollCard.tsx` (dark mode unselected option backgrounds and borders).
2. Mobile Parity Fixes:
   - Inspect `apps/mobile/src/components/chat/MobileCreatePollModal.tsx` and `apps/mobile/app/circle/[id].tsx`:
     - Ensure poll creation modal and composer render cleanly with proper keyboard handling, safe area padding, and dark theme contrast.
     - Ensure bare icon invariant (no square box containers) and floating glass controls standard on mobile.
   - Audit and fix any dark theme contrast or styling bugs across mobile chat and tools components.
3. Verification:
   - Run `cd /home/tcb/Documents/TLCN/Circle/apps/web && npm run build` (must succeed with 0 errors).
   - Run `npx tsc --noEmit -p /home/tcb/Documents/TLCN/Circle/apps/mobile/tsconfig.json` (must succeed with 0 errors).
   - Run `cd /home/tcb/Documents/TLCN/Circle/apps/api && npm test` (must pass).
   - Verify live in browser using `node scripts/brave-ctl.mjs` to ensure Poll modal is perfectly centered and dark theme renders cleanly.
4. Documentation:
   - Document all changes in `/home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_worker_impl_1/changes.md`.
   - Write 5-component handoff report in `/home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_worker_impl_1/handoff.md`.
   - Log non-trivial AI interaction in `docs/ai-usage/log.md`.
   - Update `progress.md` and send message to orchestrator when finished.


## 2026-11-09T16:34:47Z
**Context**: User Requirement & Core UX Principle Update (MANDATORY INVARIANT)
**Content**: The user has added an urgent requirement and core UX principle:
1. **Messenger-style Edit Message Interaction (Web & Mobile Parity)**:
   - When a message is edited, an "edited" / "đã chỉnh sửa" indicator is displayed in/above the message bubble.
   - Clicking/tapping on the "edited" indicator toggles the display of the previous/original message directly INSIDE THE SAME MESSAGE BUBBLE right above the current content, rendered with a faded/muted opacity (exactly like Facebook Messenger).
   - Absolutely NO popup, modal, or separate dialog for viewing edit history.
   - Parity: implement inline on both Web (`MessageBubble.tsx`) and Mobile (`MobileMessageBubble` in `apps/mobile/app/circle/[id].tsx` or `src/components/chat/`).
2. **Global Interaction Principle**:
   - Always design inline, friction-free interactions that are most convenient for the user. Never navigate away to a separate screen or heavy modal for small actions.
**Action**: Please incorporate this Messenger-style inline edit message interaction into your implementation on both Web and Mobile, along with the dark theme and poll modal fixes.
