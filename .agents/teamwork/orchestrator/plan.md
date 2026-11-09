# Orchestrator Master Execution Plan

## Objective
Thoroughly test all application features and clickable user interactions to evaluate UI/UX, fix widespread Dark theme display issues, and resolve the layout distortion bug in the Create Poll modal in chat (`CreatePollChatModal.tsx`).

## Governance & Team Roles
- **Orchestrator**: Coordinates workflow, monitors progress, manages gates, and reports results.
- **Explorers (`teamwork_explorer`)**: Technical investigation, code auditing, root cause analysis, and requirement extraction without code modification.
- **Workers (`teamwork_worker`)**: Implementation of bug fixes, token standardization, and test script integration.
- **Reviewers (`teamwork_reviewer`)**: Code review, DoD verification, layout inspection, and peer approval.
- **Challengers (`teamwork_challenger`)**: Live testing execution, stress testing, edge-case interaction probing using `scripts/brave-ctl.mjs`.
- **Auditor (`teamwork_auditor`)**: Forensic verification against facade implementations, hardcoded outputs, or integrity violations.

## Phases & Milestones

### Phase 0: Survey & Scoping (Parallel Explorers)
- **Explorer 1**: Investigate `CreatePollChatModal.tsx` and chat composer plus button integration to find root cause of layout distortion.
- **Explorer 2**: Investigate Dark theme token usage, CSS variables, glassmorphism styles, unreadable text/contrast bugs across `apps/web` (modals, dropdowns, message cards, popovers).
- **Explorer 3**: Investigate live testing infrastructure (`scripts/brave-ctl.mjs`, `scripts/brave-bridge.mjs`, active services on ports 4000, 3000, 9333, 9222) and map existing modules/pages/routes for test planning.

### Phase 1: Milestone M1 — CreatePollChatModal Layout Bug Fix
- Worker implements the fix in `CreatePollChatModal.tsx` / chat composer integration.
- Reviewer checks styling, container constraints, responsiveness, and dark/light tokens.
- Challenger verifies modal opens cleanly without distortion via brave-ctl.
- Forensic Auditor verifies genuine fix.

### Phase 2: Milestone M2 — Widespread Dark Theme Contrast & Styling Fixes
- Worker standardizes dark theme colors, background contrast, text contrast, glassmorphism borders/shadows across tested views, modals, dropdowns, and message cards.
- Reviewer inspects diffs against design tokens and `agentic/playbooks/cross-cutting-gate.md`.
- Challenger checks visual rendering in dark theme.
- Forensic Auditor confirms clean integrity.

### Phase 3: Milestone M3 — Master Test Plan & Clickable Interactions Catalog
- Comprehensive test plan covering all modules (Auth, Circles, Chat, Channels, Posts, Events, Polls, Settings, Admin).
- Clickable user interactions matrix (buttons, inputs, dropdowns, toggles, dialogs).

### Phase 4: Milestone M4 — Live UI/UX Browser Inspection (`scripts/brave-ctl.mjs`)
- Authenticate with `abc@abc.com` / `Password123@!` via `scripts/brave-ctl.mjs`.
- Execute test steps sequentially, capture visual screenshots for all tested views and interactions.
- Validate VI/EN i18n, responsive layout, dark theme visual quality, empty/loading states.

### Phase 5: Milestone M5 — Verification, Build, Test & Final Delivery
- Verify `apps/web`: `npm run build` passes.
- Verify `apps/api`: `npm test` passes.
- Document full test results, captured screenshots, and resolve any identified defects.
- Update `docs/ai-usage/log.md`.
- Final synthesis and reporting back to parent sentinel.
