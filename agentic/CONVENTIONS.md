# Conventions

Style, architectural guidelines, and process conventions for CIRCLE. **Always loaded** via [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md).

---

## 1. Traceability Keys

Every artifact in CIRCLE must be connected across the traceability chain:

| Prefix | Purpose | Example |
|---|---|---|
| `EPIC-<MODULE>` | Major feature block | `EPIC-AUTH`, `EPIC-CHAT`, `EPIC-CIRCLE` |
| `US-<MODULE>-<NUM>` | User Story | `US-AUTH-001`, `US-CHAT-005` |
| `AC-<MODULE>-<NUM>-<NUM>` | Acceptance Criteria | `AC-AUTH-001-01`, `AC-CHAT-005-02` |
| `BR-<MODULE>-<NUM>` | Business Rule | `BR-AUTH-001`, `BR-CIRCLE-003` |
| `NFR-<NUM>` | Non-functional quantitative requirement | `NFR-001` (Latency < 200ms) |
| `API-<MODULE>-<NUM>` | API endpoint contract | `API-AUTH-002` (`POST /api/v1/auth/refresh`) |
| `TC-<MODULE>-<NUM>` | Automated test case | `TC-AUTH-001`, `TC-CHAT-012` |
| `BUG-<MODULE>-<NUM>` | Defect identifier | `BUG-CHAT-003`, `BUG-RTC-001` |
| `ADR-<NUM>` | Architecture Decision Record | `ADR-001`, `ADR-005` |
| `CAP-<CLUSTER>-<NUM>` | Capability catalog entry | `CAP-AUTH-01`, `CAP-CHAT-02` |
| `AI-<NUM>` | AI usage log entry | `AI-0001`, `AI-0042` |

---

## 2. Git & Conventional Commits

- **Environment Discipline:**
  - `main`: Production (releases only).
  - `dev` (`develop`): Staging / Integration. All feature and fix branches MUST branch from `dev` and **merge into `dev`**.
- **Branch format:** `<type>/<issue-id>-<slug>`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`, `ci`, `infra`, `spike`.
  - Example: `feat/42-refresh-token-rotation`, `fix/87-chat-duplicate-message`.
- **Commit message format:** `<type>(<scope>): <description> (#<issue-id>)`
  - All commits must include the `-s` sign-off flag.
  - Example: `feat(auth): implement refresh token rotation mechanism (#42)`
  - Example: `fix(chat): eliminate duplicate socket message delivery on reconnect (#87)`
  - Example: `test(circle): add authorization test cases for private circles (#91)`

---

## 3. Issue & Pull Request Governance

- **Strict 1 Issue = 1 PR Invariant:** 
  - Every pull request MUST have exactly one dedicated GitHub Issue created BEFORE coding/branching.
  - Zero unlinked / floating PRs. Never open a PR without an issue number in the title (`(#<issue-id>)`) and `Fixes #<issue-id>` in the body.
  - Never reuse a single issue for multiple independent PRs; if further changes or fixes are needed, open a new task/bug issue.
- **AI Agent "Push" Workflow Interpretation:**
  - When the engineer issues commands such as *"push", "push lên", "push it", "push chưa"*, the AI Agent interprets this as an instruction to finalize the deliverable lifecycle:
    1. **Verify / Create Issue:** Confirm a dedicated GitHub Issue exists (or create one and link it to the parent Epic Goal).
    2. **Branch Check:** Confirm branch naming conforms to `<type>/<issue-id>-<slug>`.
    3. **Pre-commit Verification:** Run automated pre-commit checks and commit with sign-off (`-s`) citing the issue ID.
    4. **Push Remote:** Push the branch to GitHub remote.
    5. **Open Pull Request:** Open a PR targeting `develop` with `Closes #<id>`, embedding traceability metadata and requesting peer review.
  - Raw unlinked `git push` without an issue or PR is strictly forbidden.
- **Project OS Traceability Hierarchy:**
  - **Level 1 (Root):** Epic Goals (`[GOAL-WXX]: ...`) representing weekly milestones.
  - **Level 2 (Sub-issues):** Granular deliverable issues linked via GitHub Sub-issues API (`parent: #<epic-id>`).
  - **Level 3 (PRs):** Implementation PRs linked directly to their Level 2 issue via GitHub's native `Linked pull requests` field.
- **Description Standard (What — Why — Done When):** Both Issues and PRs must explicitly define:
  1. **What:** Exact problem or change description.
  2. **Why:** Technical/business justification and value for group activity.
  3. **Done When:** Objective Acceptance Criteria (DoD) or verification evidence (test outputs, screenshots).
- **Mandatory Peer Review:** Ping the peer developer (**Bình ⇄ Hạnh**). Self-merging is strictly prohibited. At least 1 review approval with technical comments is mandatory before merge.
- **Automated Peer Review & Auto-Merge Lifecycle (AI Pair-Programming):** When an engineer requests an AI agent to review a PR:
  1. *Automated Verification:* Inspect git diff, verify against Acceptance Criteria in the linked issue, validate the 10 Hard Gates, run `./scripts/check-agent-map.sh`, and run automated test suites.
  2. *Structured Review Comment:* Submit detailed peer review feedback via `gh pr review <number> --comment -F <file>`.
  3. *Review Fixes:* Re-evaluate code revisions following author updates.
  4. *Formal Approval:* Once all criteria and Definition of Done (DoD) are 100% satisfied, approve via `gh pr review <number> --approve -F <file>`.
  5. *Automated Merge:* After formal approval is recorded, merge the PR into `develop` (`gh pr merge <number> --merge --delete-branch`) and synchronize local repository (`git pull origin develop`).

---

## 4. Backend Conventions (`apps/api`, NestJS + Prisma)

- **Architecture:** Modular Monolith. Each domain module in `src/modules/<domain>` must encapsulate its controller, service, DTOs, and internal logic.
- **Controllers:** Thin controllers. Responsible only for input extraction, guard triggering, and calling services. No direct database queries in controllers.
- **Services:** Business logic, transactions, and event emissions.
- **Database:** Access via Prisma client. Never write raw unparameterized SQL. Sensitive fields (passwords, tokens) must never be returned in responses.
- **Error Handling:** Standardized HTTP exceptions (`HttpException`, `NotFoundException`, `UnauthorizedException`). All errors intercepted by a global exception filter.
- **Validation:** Zod schemas centralized in `packages/shared` consumed via `ZodValidationPipe`. Arbitrary introduction of unapproved libraries (such as `class-validator`) is strictly forbidden.

---

## 5. Web & Admin Conventions (`apps/web`, Next.js)

- **Routing:** Next.js App Router (`src/app/`).
  - Public/App routes: `(auth)/`, `(main)/`, `(circle)/`, `(chat)/`.
  - Admin dashboard: `/admin/` route group with subroutes `/admin/users`, `/admin/circles`, `/admin/reports`, `/admin/audit-logs`.
- **Server Components:** Default to React Server Components for data fetching. Use `'use client'` only when state, event handlers, browser APIs, or real-time hooks are needed.
- **State Management:** Zustand for client state (`authStore`, `chatStore`, `presenceStore`). TanStack Query for server state caching.
- **Styling:** Tailwind CSS with a shared token system.

---

## 6. Mobile Conventions (`apps/mobile`, React Native Expo)

- **Routing:** Expo Router file-based navigation (`app/`).
- **Styling:** NativeWind (Tailwind classes) with responsive sizing for tablets and mobile screens.
- **Tokens & Storage:** Auth tokens stored securely via `expo-secure-store`. Cache stored via MMKV.
- **WebRTC:** Integrated via `react-native-webrtc` using Expo config plugins.

---

## 7. Realtime & WebRTC Conventions

- **Socket.IO:** Handshake authentication using JWT. Automatic token refresh handling on socket reconnect.
- **Rooms:** Clients join rooms scoped to Circle (`circle:<id>`) or Chat Channel (`channel:<id>`).
- **Signaling:** WebRTC peer connection signaling (offer, answer, candidate) routed via Socket.IO events with strict participant validation.
- **Network Resiliency:** Always test with STUN/TURN fallback configurations.

---

## 8. Living Documentation & Capabilities

- Keep [`.agents/SITEMAP.md`](../.agents/SITEMAP.md) updated with feature coverage and test statuses (`✅ Tested`, `⚠️ Partial`, `❌ Not tested`, `🚧 WIP`).
- When introducing or altering capabilities, update the relevant cluster in [`docs/capabilities/`](../docs/capabilities/).

---

## 9. Design Tokens, Localization & Seamless Canvas Conventions (Web & Mobile)

- **Shared Localization Protocol (Web & Mobile):**
  - All UI strings must be added to `packages/shared/src/locales/vi.ts` (Vietnamese) and `en.ts` (English).
  - Web components consume `useLanguageStore((s) => s.t)`.
  - Mobile screens consume `useLanguageStore((s) => s.t)`.
  - Never introduce localized strings directly in JSX elements.
- **Design Tokens & Theme Invariance (Web & Mobile):**
  - All styling colors must map to tokens in `CircleColors` (`primary`, `canvas`, `surface`, `wash`, `subtle`, `text`, `coral`, `peach`, `border`, `hairline`, `onPrimary`, `success`, `info`, `accent`).
  - Dark mode and light mode transitions must be completely fluid without hardcoded `#FFF` or `#000` overrides.
- **Seamless Mobile Canvas Experience:**
  - Mobile UI is an unboxed, infinite canvas. Avoid nested rectangular box cards with thick outlines or contrasting container boxes.
  - Headers must merge seamlessly with the screen canvas background (`colors.canvas`) without harsh divider lines.
  - Floating controls (such as the Liquid Glass Tab Bar) float gracefully over the canvas.

---

## 10. Technology Governance & Authentic Data Mandate

- **Strict Technology Stack Discipline:** Never adopt, install, or implement any unapproved technology, framework, or library (e.g. `class-validator`) that is not part of the approved thesis architecture without prior alignment and explicit written direction from engineers (Bình & Hạnh).
- **Zero Mock Data in Production UI:** Never hardcode dummy records, fake sample circles, or mock member statistics in UI code. The UI must bind to real state or render an authentic empty state / loading skeleton.


