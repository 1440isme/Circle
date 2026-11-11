## 2026-11-09T16:26:04Z
You are teamwork_test_writer_1, a quality assurance and test design engineer.
Your working directory is /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_test_writer_1.
You MUST read /home/tcb/Documents/TLCN/Circle/.agents/teamwork/ORIGINAL_REQUEST.md before starting.

DO NOT CHEAT. All test plans, cases, and test scripts must be genuine and reproducible.

MANDATORY USER INVARIANT:
"nhớ là mobile nữa chứ k phải mỗi web đâu nhé" - Ensure your test plan covers both Web and Mobile parity!

INPUTS TO READ:
- /home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_explorer_survey_3/analysis.md & handoff.md (41 mapped test cases across modules)
- /home/tcb/Documents/TLCN/Circle/.agents/teamwork/orchestrator/PROJECT.md

TASKS:
1. Formalize the Master Test Plan in `docs/test-plans/master-ui-ux-test-plan.md`:
   - Structure into 4 tiers:
     - Tier 1: Feature Coverage (all clickable actions and primary flows)
     - Tier 2: Boundary & Corner Cases (empty states, max characters, long polls, error states)
     - Tier 3: Cross-Feature Combinations (theme toggles during chat, language switch, responsive resize)
     - Tier 4: Real-World Scenarios (complete user session from auth to circle interaction)
   - Include all 41 test cases (TC-001 to TC-041) across Modules 01-07 and 09, detailing:
     - Step-by-step clickable user actions
     - Expected UI/UX behavior
     - Dark & Light theme contrast checks
     - Responsive layout checks
     - VI / EN internationalization checks
     - Visual screenshot target names (e.g. `tc01_login.png`, `tc12_create_poll_modal.png`)
   - Include Mobile Parity test scenarios comparing Web vs Mobile touch interactions, bottom sheets, navigation tabs, and bare icon styling.
2. Develop an automated/reproducible test runner script `scripts/run-ui-ux-tests.mjs`:
   - Uses `scripts/brave-ctl.mjs` API (status, navigate, click, eval, screenshot).
   - Automatically navigates to http://localhost:3000, performs login check with `abc@abc.com` / `Password123@!`, opens circle, tests chat composer plus button & Create Poll modal, toggles dark theme, toggles language, captures screenshots into `.agents/artifacts/screenshots/`, and validates key DOM assertions (e.g. modal center coordinates, contrast).
3. Test execution dry-run:
   - Run `node scripts/run-ui-ux-tests.mjs` or execute key test cases via `scripts/brave-ctl.mjs` to ensure the script executes cleanly without crashing.
4. Documentation:
   - Output your comprehensive handoff report to `/home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_test_writer_1/handoff.md`.
   - Update `progress.md` with timestamps and notify orchestrator when done.

## 2026-11-09T16:34:53Z
**Context**: Master Test Plan Update with New User UX Requirement
**Content**: The user has added a mandatory invariant:
1. **Messenger-style Edit Message Interaction (Web & Mobile Parity)**:
   - When message is edited, clicking/tapping "edited" / "đã chỉnh sửa" toggles the original/previous message directly inside the same bubble above the new content with faded/muted opacity (no modals or dialogs).
2. **Global Interaction Principle**:
   - Friction-free, inline interactions preferred everywhere; no unnecessary navigation or heavy modals for lightweight actions.
**Action**: Add dedicated test cases for this Messenger-style inline edit interaction on both Web and Mobile to `docs/test-plans/master-ui-ux-test-plan.md` and test scripts.

## 2026-11-09T16:57:30Z
**Context**: Milestone M3 Master Test Plan & Runner Execution Status Check
**Content**: Heartbeat check. Please update your progress.md with your latest test run results and status of `scripts/run-ui-ux-tests.mjs` and screenshots.
**Action**: Update progress.md and finalize your handoff.md report.
