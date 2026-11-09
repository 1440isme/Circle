# Project: CIRCLE Bug Fixes, Dark Theme Standardization & Live UI/UX Master Inspection (Web + Mobile Parity)

## Architecture & System Overview
- **Backend**: NestJS + Prisma + PostgreSQL + Redis (Port 4000)
- **Web App**: Next.js 14 App Router + Tailwind CSS + Lucide Icons (Port 3000)
- **Mobile App**: React Native + Expo (apps/mobile) with unified design tokens and theme engine
- **Live Test Driver**: `scripts/brave-ctl.mjs` through `scripts/brave-bridge.mjs` (Port 9333) -> Brave DevTools (Port 9222)
- **Authentication**: `abc@abc.com` / `Password123@!`

## Root Cause Synthesis & Parity Analysis
1. **Create Poll Modal & Emoji Picker Distortion (Web & Mobile)**:
   - **Web**: `ChatComposer.tsx:419` defines `backdrop-blur-[2px]`. Under W3C CSS specifications, `backdrop-filter` creates a new containing block for `position: fixed` descendants, squashing the modal inside a 76px container and cutting off bottom 185.75px.
     - **Fix**: Wrap `CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx` in `createPortal(..., document.body)` with SSR hydration guards, and remove `backdrop-blur-[2px]` from composer wrapper.
   - **Mobile**: `MobileCreatePollModal.tsx` in `apps/mobile` uses RN Modal. Must verify keyboard avoiding behavior, safe area padding, bare icon styling, and dark theme contrast pairs when triggered from chat composer in `apps/mobile/app/circle/[id].tsx`.
2. **Widespread Dark Theme Display Inconsistencies (Web & Mobile)**:
   - **Web**: 7 phantom Tailwind tokens (`circle-dark-bg`, `circle-dark-border`, `circle-dark-hover`, `circle-dark-card`, `circle-primary-hover`, `circle-primary-dark`, `circle-success`), 18 invalid `backdrop-blur-xs`, 12 invalid `outline-hidden`, and contrast inversions (chevrons in date picker, modal cancel buttons).
     - **Fix**: Extend `apps/web/tailwind.config.ts`, replace invalid classes, standardize contrast pairs.
   - **Mobile**: Inspect theme colors in `apps/mobile/src/theme/`, chat components, tools, modals, and tabs for dark background contrast, text legibility, and bare icon invariant (no square box containers around navigation/tool icons).

## Feature Inventory
| # | Feature / Bug Item | Description | Milestone | Platform | Source |
|---|--------------------|-------------|-----------|----------|--------|
| 1 | Web Poll Modal Containing Block Trap | Create Poll modal layout distorted due to composer `backdrop-blur-[2px]` | M1 | Web | Survey 1, 2, 3 |
| 2 | Web Emoji Modal Containing Block Trap | Sibling bug trapped inside composer containing block | M1 | Web | Survey 1, 2 |
| 3 | Mobile Poll Modal & Composer Layout | Verify `MobileCreatePollModal.tsx`, keyboard handling, safe areas | M1 | Mobile | User Invariant |
| 4 | Web Phantom Tokens & Invalid Classes | 7 phantom tokens, 18 `backdrop-blur-xs`, 12 `outline-hidden` | M2 | Web | Survey 2 |
| 5 | Web Contrast Inversion Fixes | Date picker chevrons, modal cancel buttons, dark poll card contrast | M2 | Web | Survey 2 |
| 6 | Mobile Dark Theme Contrast & Icons | Chat bubbles, tools, tabs, modals, bare icon invariant | M2 | Mobile | User Invariant |
| 7 | Master Test Plan & Mobile Scenarios | 41 clickable interaction test cases (Web + Mobile parity matrix) | M3 | Cross-Platform | Survey 3 |
| 8 | Full Live E2E Verification & Screenshots | Live browser inspection via `scripts/brave-ctl.mjs` with screenshots | M4 | Web | Survey 3 |
| 9 | Quality, Typecheck & Integrity Gate | `apps/web` build, `apps/mobile` tsc, `apps/api` test, zero cheating audit | M5 | Cross-Platform | DoD & Hard Gates |
| 10 | Messenger-style Inline Edit Message | Toggle-show previous message inside same bubble with faded opacity, no modals | M1/M2 | Cross-Platform | User Invariant |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Architecture Mapping | Deep inspection of bugs, tokens, test environment & mobile parity | none | DONE |
| M1 | Fix Create Poll & Emoji Modals (Web + Mobile) | React Portal on Web, keyboard/layout audit on Mobile | M0 | IN_PROGRESS |
| M2 | Widespread Dark Theme Contrast & Token Fixes | Web token extensions & fixes + Mobile theme/dark contrast audit | M1 | PLANNED |
| M3 | Master Test Plan Finalization | Document 41 test cases and cross-platform verification scenarios | M0 | IN_PROGRESS |
| M4 | Live UI/UX Browser Verification | Execute test cases via `scripts/brave-ctl.mjs` with visual screenshots | M1, M2, M3 | PLANNED |
| M5 | Build, Typecheck & Forensic Audit Gate | `apps/web` build, `apps/mobile` tsc, `apps/api` test, forensic audit | M4 | PLANNED |

## Code Layout & Ownership
- **Milestone M1 Files**:
  - `apps/web/src/components/chat/CreatePollChatModal.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/ui/FullEmojiPickerModal.tsx`
  - `apps/mobile/src/components/chat/MobileCreatePollModal.tsx`
  - `apps/mobile/app/circle/[id].tsx`
- **Milestone M2 Files**:
  - `apps/web/tailwind.config.ts`
  - `apps/web/src/components/tools/CirclePlanningView.tsx`
  - `apps/web/src/components/tools/CirclePollView.tsx`
  - `apps/web/src/components/tools/CircleLocationView.tsx`
  - `apps/web/src/components/chat/ChatPollCard.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/ui/LanguageSwitcher.tsx`
  - `apps/web/src/components/ui/CustomDateTimePicker.tsx`
  - `apps/web/src/components/modals/CircleManagementModal.tsx`
  - `apps/web/src/components/modals/ClearChatModal.tsx`
  - `apps/web/src/components/modals/EditProfileModal.tsx`
  - `apps/mobile/src/theme/`
  - `apps/mobile/src/components/chat/`
  - `apps/mobile/src/components/tools/`
  - `apps/mobile/app/(tabs)/`
- **Milestone M3/M4 Files**:
  - `docs/test-plans/master-ui-ux-test-plan.md`
  - `scripts/run-ui-ux-tests.mjs`
  - `.agents/artifacts/screenshots/`
