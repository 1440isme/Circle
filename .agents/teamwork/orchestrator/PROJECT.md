# Project: CIRCLE Bug Fixes, Dark Theme Standardization & Live UI/UX Master Inspection (Web + Mobile Parity)

## Architecture & System Overview
- **Backend**: NestJS + Prisma + PostgreSQL + Redis (Port 4000)
- **Web App**: Next.js 14 App Router + Tailwind CSS + Lucide Icons (Port 3000)
- **Mobile App**: React Native + Expo (apps/mobile) with unified design tokens and theme engine
- **Live Test Driver**: `scripts/brave-ctl.mjs` through `scripts/brave-bridge.mjs` (Port 9333) -> Brave DevTools (Port 9222)
- **Authentication**: `abc@abc.com` / `Password123@!`

## Root Cause Synthesis & Parity Analysis
1. **Create Poll Modal & Emoji Picker Distortion (Web & Mobile)**:
   - **Web**: `ChatComposer.tsx:419` defined `backdrop-blur-[2px]`, creating a CSS containing block for `fixed` descendants, squashing the modal inside a 76px container and cutting off bottom 185.75px.
     - **Fix Applied**: Wrapped `CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx` in `createPortal(..., document.body)` with SSR hydration guards, Escape listener, click-outside backdrop, and removed `backdrop-blur-[2px]` from composer wrapper.
   - **Mobile**: `MobileCreatePollModal.tsx` in `apps/mobile` verified with `useSafeAreaInsets`, dark canvas input background, high-contrast submit button (`colors.onPrimary`), and bare icon styling.
2. **Widespread Dark Theme Display Inconsistencies (Web & Mobile)**:
   - **Web**: Extended `apps/web/tailwind.config.ts` with 7 semantic aliases (`primaryHover`, `primaryDark`, `success`, `dark.bg`, `dark.border`, `dark.hover`, `dark.card`). Replaced 18/18 `backdrop-blur-xs` -> `backdrop-blur-sm` and 12/12 `focus:outline-hidden` -> `focus:outline-none`. Fixed contrast in 16 files (`CustomDateTimePicker.tsx`, `CircleManagementModal.tsx`, `ChatPollCard.tsx`, etc.).
   - **Mobile**: Standardized `MobileChatPollCard.tsx` and `MobilePollView.tsx` with high-contrast borders, options, progress fills, and bare icons.
3. **Messenger-Style Inline Edit Message Interaction (Web & Mobile Parity)**:
   - Shared Types (`@circle/types`): `previousContent?: string | null;` in `MessageEntity`.
   - Shared Locales (`@circle/shared`): `originalMessageLabel: 'Tin nhắn gốc'` / `'Original message'`.
   - Backend (`chat.service.ts`): Broadcasts `previousContent` on edit.
   - Web (`MessageBubble.tsx`) & Mobile (`MobileSwipeMessageBubble` in `apps/mobile/app/circle/[id].tsx`): Clicking/tapping `(đã sửa)` / `(edited)` toggles the original message directly INSIDE the same bubble with faded opacity, line-through text, and zero popups/modals.

## Feature Inventory
| # | Feature / Bug Item | Description | Milestone | Platform | Source | Status |
|---|--------------------|-------------|-----------|----------|--------|--------|
| 1 | Web Poll Modal Containing Block Trap | Create Poll modal layout distorted due to composer `backdrop-blur-[2px]` | M1 | Web | Survey 1, 2, 3 | DONE |
| 2 | Web Emoji Modal Containing Block Trap | Sibling bug trapped inside composer containing block | M1 | Web | Survey 1, 2 | DONE |
| 3 | Mobile Poll Modal & Composer Layout | Verify `MobileCreatePollModal.tsx`, keyboard handling, safe areas | M1 | Mobile | User Invariant | DONE |
| 4 | Web Phantom Tokens & Invalid Classes | 7 phantom tokens, 18 `backdrop-blur-xs`, 12 `outline-hidden` | M2 | Web | Survey 2 | DONE |
| 5 | Web Contrast Inversion Fixes | Date picker chevrons, modal cancel buttons, dark poll card contrast | M2 | Web | Survey 2 | DONE |
| 6 | Mobile Dark Theme Contrast & Icons | Chat bubbles, tools, tabs, modals, bare icon invariant | M2 | Mobile | User Invariant | DONE |
| 7 | Master Test Plan & Mobile Scenarios | 42 clickable interaction test cases (Web + Mobile parity matrix) | M3 | Cross-Platform | Survey 3 | DONE |
| 8 | Full Live E2E Verification & Screenshots | Live browser inspection via `scripts/brave-ctl.mjs` with screenshots | M4 | Web | Survey 3 | DONE |
| 9 | Quality, Typecheck & Integrity Gate | `apps/web` build, `apps/mobile` tsc, `apps/api` test, zero cheating audit | M5 | Cross-Platform | DoD & Hard Gates | DONE |
| 10 | Messenger-style Inline Edit Message | Toggle-show previous message inside same bubble with faded opacity, no modals | M1/M2 | Cross-Platform | User Invariant | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Architecture Mapping | Deep inspection of bugs, tokens, test environment & mobile parity | none | DONE |
| M1 | Fix Create Poll & Emoji Modals (Web + Mobile) | React Portal on Web, keyboard/layout audit on Mobile | M0 | DONE |
| M2 | Widespread Dark Theme Contrast & Token Fixes | Web token extensions & fixes + Mobile theme/dark contrast audit | M1 | DONE |
| M3 | Master Test Plan Finalization | Document 42 test cases and cross-platform verification scenarios | M0 | DONE |
| M4 | Live UI/UX Browser Verification | Execute test cases via `scripts/brave-ctl.mjs` with visual screenshots | M1, M2, M3 | DONE |
| M5 | Build, Typecheck & Forensic Audit Gate | `apps/web` build, `apps/mobile` tsc, `apps/api` test, forensic audit | M4 | DONE |

## Verification Summary
- **Gate Status**: PASS (GATE_STATUS.md)
- **Reviewer 1**: APPROVE (DoD & Code Review)
- **Reviewer 2**: APPROVE (UI/UX & Parity Review)
- **Challenger 1**: APPROVE (Live Browser Automation)
- **Challenger 2**: APPROVE (Adversarial Stress Testing)
- **Forensic Auditor**: CLEAN (Zero Integrity Violations)
- **Web Build**: `npm run build` PASS (code 0)
- **Mobile Typecheck**: `npx tsc --noEmit` PASS (code 0)
- **Backend Tests**: `npm test` PASS (11/11 suites, 186/186 unit/integration tests)
- **Live Test Runner**: `node scripts/run-ui-ux-tests.mjs` PASS (9/9 checks)
- **Documentation**: `./scripts/check-agent-map.sh` PASS (122/122 files)
- **Security Check**: `./.githooks/pre-commit` PASS (0 secret leaks)
