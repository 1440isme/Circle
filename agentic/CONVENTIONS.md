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

- **1 Issue = 1 PR:** Every change, feature, bug fix, or task must have an Issue and a corresponding PR targeting `dev`.
- **Hierarchy:** Weekly Goal Issues (`[GOAL-WXX]: ...`) track weekly milestones; sub-issues track granular tasks.
- **Description Standard (What — Why — Done When):** Both Issues and PRs must explicitly define:
  1. **What:** Exact problem or change description.
  2. **Why:** Technical/business justification and value for group activity.
  3. **Done When:** Objective Acceptance Criteria (DoD) or verification evidence (test outputs, screenshots).
- **Mandatory Peer Review:** Ping the peer developer (**Bình ⇄ Hạnh**). Self-merging is strictly prohibited. At least 1 review approval with technical comments is mandatory before merge.
- **Automated Peer Review & Auto-Merge Lifecycle (Pair-Programming với AI Agent):** Khi kỹ sư (**Bình** hoặc **Hạnh**) yêu cầu AI Agent review một Pull Request:
  1. *Tự động đối soát & kiểm tra:* Agent tự động đọc git diff của PR, đối chiếu với Acceptance Criteria trong Issue liên kết, kiểm tra 10 Hard Gates, chạy `./scripts/check-agent-map.sh` và các bộ kiểm thử tự động.
  2. *Tự động đăng nhận xét (Review Comment):* Đăng tải chi tiết báo cáo Peer Review lên PR qua `gh pr review <number> --comment -F <file>`.
  3. *Theo dõi phản hồi & tái kiểm tra:* Rà soát các commit sửa đổi mới nhất của tác giả khi có comment phản hồi.
  4. *Tự động phê duyệt (Formal Approve):* Khi toàn bộ các điểm góp ý được hoàn thiện và thỏa mãn 100% Definition of Done (DoD), Agent tự động thực hiện `gh pr review <number> --approve -F <file>`.
  5. *Tự động Merge PR (Auto-Merge):* Ngay sau khi PR đã được phê duyệt hợp lệ (Approved), Agent tự động thực thi lệnh merge PR vào nhánh `develop` (`gh pr merge <number> --merge --delete-branch`), sau đó đồng bộ kéo mã nguồn mới về môi trường local (`git pull origin develop`).

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


