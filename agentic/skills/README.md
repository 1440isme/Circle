# CIRCLE Skills Catalog

Playbooks for AI coding agents and engineers. Skills are concise, load-on-demand procedural guides. **Do not preload all skills at once** — load the skill that matches your task.

---

## Core Lifecycle Skills

| Skill | When to Use | Procedure |
|---|---|---|
| [`understand-the-repo.md`](understand-the-repo.md) | Start of a session or exploring an unfamiliar area | Orient via map + memory without scanning the whole repo |
| [`implement-feature.md`](implement-feature.md) | Working on an issue or user story | Understand → Inspect → Plan → Implement → Test → PR |
| [`run-tests.md`](run-tests.md) | Verifying changes | Run Jest, Playwright, or mobile test suites |
| [`code-review.md`](code-review.md) | Before committing or requesting peer review | Self-review diff against Definition of Done |
| [`security-review.md`](security-review.md) | Modifying auth, RBAC, inputs, or media uploads | Audit attack surface, validation, and secrets |
| [`commit-and-pr.md`](commit-and-pr.md) | Ready to commit and open a Pull Request | Conventional Commits & mandatory peer review workflow |
| [`deploy.md`](deploy.md) | Staging or production deployment | Docker Compose, Traefik, and container checks |
| [`docs-update.md`](docs-update.md) | Architecture, capabilities, or APIs change | Keep diagrams, SRS, and capability catalog in sync |
| [`learn-and-update.md`](learn-and-update.md) | After solving a non-obvious bug or finding a pattern | Record insights into `agentic/memory/` and `agentic/learning/` |
| [`pre-completion-verification.md`](pre-completion-verification.md) | Before declaring any task, feature or release as done | 5-Tier full-spectrum verification (builds, tests, types, zero base64, fallbacks) |
| [`feature-usability-audit.md`](feature-usability-audit.md) | Before closing or advancing beyond any feature group | 5-Pillar End-User UX & usability audit (real-life test, chat integration, ergonomics) |
| [`ai-log-entry.md`](ai-log-entry.md) | After every AI coding / refactoring session | Automatically append record to `docs/ai-usage/log.md` |
| [`memory-protocol.md`](memory-protocol.md) | Recall at session start; capture corrections/preferences/decisions the moment they happen; weekly consolidation | Load Layer 1 memory at session start; capture in-session triggers; weekly consolidation |

---

## Feature Playbooks & Quality Baseline

| Guide | When to Use | Procedure |
|---|---|---|
| [`../playbooks/README.md`](../playbooks/README.md) | Implementing or reviewing any module feature | Consult module playbook (`01-account-auth`...`09-admin-moderation`) + `cross-cutting-gate.md` (responsive, tokens, i18n, states, parity) |

---

## Technical Domain Skills

| Skill | When to Use | Procedure |
|---|---|---|
| [`add-endpoint.md`](add-endpoint.md) | Adding or changing NestJS API endpoints | Controller, Service, DTO, Prisma query, Swagger |
| [`add-frontend-feature.md`](add-frontend-feature.md) | Adding Web pages or components in Next.js | Page route, Server/Client component, Store, Query |
| [`add-mobile-screen.md`](add-mobile-screen.md) | Adding screens in React Native Expo | Expo Router, NativeWind, hooks, device permissions |
| [`db-schema-change.md`](db-schema-change.md) | Modifying database models | Prisma schema update, migration, seed, rollback check |
| [`realtime-event.md`](realtime-event.md) | Adding Socket.IO events | Gateway handler, room emissions, client listeners |
| [`webrtc-signaling.md`](webrtc-signaling.md) | Working on voice/video calling | SDP offer/answer, ICE candidate exchange, TURN test |
| [`add-test.md`](add-test.md) | Adding automated test coverage | Unit, Integration, API, or Playwright E2E tests |
| [`debug.md`](debug.md) | Investigating defects and bugs | Root cause analysis, repro, fix, regression test |
| [`performance-review.md`](performance-review.md) | Profiling latency, DB queries, or bundle size | Prisma query explain, caching, bundle analysis |
| [`secrets-incident.md`](secrets-incident.md) | Accidental credential or token commit | Invalidate, rotate, sanitize git history, post-mortem |
