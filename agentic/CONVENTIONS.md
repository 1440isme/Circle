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

- **Branch format:** `<type>/<issue-id>-<slug>`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`, `ci`.
  - Example: `feat/42-refresh-token-rotation`, `fix/87-chat-duplicate-message`.
- **Commit message format:** `<type>(<scope>): <description> (#<issue-id>)`
  - Example: `feat(auth): implement refresh token rotation mechanism (#42)`
  - Example: `fix(chat): eliminate duplicate socket message delivery on reconnect (#87)`
  - Example: `test(circle): add authorization test cases for private circles (#91)`

---

## 3. Pull Request Template & Review Policy

Every PR targeting `develop` or `main` must use the standard 8-question PR template:
1. **What problem does this solve?** (Closes #...)
2. **What changed?** (Bullet points)
3. **Why this approach?** (Technical rationale)
4. **What alternatives were considered?**
5. **How was it tested?** (Test logs / screenshots)
6. **What risks remain?**
7. **Did architecture / docs change?** (Diagram updates, ADRs)
8. **Was AI used?** (Must link `AI-XXXX` in `docs/ai-usage/log.md`)

> **Mandatory Peer Review:** Ping the peer developer (Bình ↔ Hạnh). At least 1 human approval required before merge.

---

## 4. Backend Conventions (`apps/api`, NestJS + Prisma)

- **Architecture:** Modular Monolith. Each domain module in `src/modules/<domain>` must encapsulate its controller, service, DTOs, and internal logic.
- **Controllers:** Thin controllers. Responsible only for input extraction, guard triggering, and calling services. No direct database queries in controllers.
- **Services:** Business logic, transactions, and event emissions.
- **Database:** Access via Prisma client. Never write raw unparameterized SQL. Sensitive fields (passwords, tokens) must never be returned in responses.
- **Error Handling:** Standardized HTTP exceptions (`HttpException`, `NotFoundException`, `UnauthorizedException`). All errors intercepted by a global exception filter.
- **Validation:** Class-validator DTOs with strict validation pipes (`whitelist: true`, `forbidNonWhitelisted: true`).

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
