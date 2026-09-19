# AGENTS.md — CIRCLE

> **Vendor-neutral entry point** for any AI coding agent (Antigravity IDE, Claude Code, Cursor, Copilot, opencode, openclaw, ...) and human engineers (**Trương Công Bình - 23110184** & **Ninh Thị Mỹ Hạnh - 23110210**). Read this first.

CIRCLE is a social platform for group connectivity and interaction. Stack: **NestJS + Prisma + PostgreSQL + Redis** backend, **Next.js** web application with integrated **Admin Dashboard**, **React Native + Expo** mobile application, **Socket.IO + WebRTC** realtime communications, **Docker + Traefik** deployment.

---

## Start Here (Always Load)

- **Canonical Hiến Pháp (Single Source of Truth):** [`PROJECT_GOD.md`](./PROJECT_GOD.md)
- **Hard Rules (Must / Must-Not):** [`agentic/RULES.md`](./agentic/RULES.md)
- **Conventions & Traceability Keys:** [`agentic/CONVENTIONS.md`](./agentic/CONVENTIONS.md)

### Key Rules in One Line:
- **10 Hard Gates are inviolable:** Real working product, weekly reports, automated testing (Unit, Integration, API, E2E), automated CI/CD, authentic user dataset, and zero secret leaks.
- **Mandatory Peer Review:** Self-merging is strictly forbidden. Every PR by Bình must be reviewed & approved by Hạnh; every PR by Hạnh must be reviewed & approved by Bình.
- **Automated AI Usage Logging:** Every nontrivial AI interaction must automatically append an `AI-XXXX` entry to [`docs/ai-usage/log.md`](./docs/ai-usage/log.md). Engineers do NOT write this log by hand.
- **Never commit directly to `main` or `develop`:** Work in `<type>/<issue-id>-<slug>` branches. Conventional commits only.

---

## Understand the Repo (Before Real Work)

Do NOT re-scan the whole repository. Run the **`understand-the-repo`** skill: load [`agentic/map/INDEX.md`](./agentic/map/INDEX.md) + [`agentic/memory/MEMORY.md`](./agentic/memory/MEMORY.md), then deep-read only the specific module you intend to touch.

Existing knowledge to lean on (do not duplicate):
- Canonical project constitution → [`PROJECT_GOD.md`](./PROJECT_GOD.md)
- Architecture deep-dive → [`docs/architecture/`](./docs/architecture/)
- Capability catalog (code-grounded specs) → [`docs/capabilities/`](./docs/capabilities/)
- Living site & app map (features & test coverage) → [`.agents/SITEMAP.md`](./.agents/SITEMAP.md)
- Multi-tier testing strategy → [`.agents/TESTING.md`](./.agents/TESTING.md)
- Getting started / local dev / onboarding → [`docs/getting-started/`](./docs/getting-started/)
- Engineering design principles → [`docs/principles/principle.md`](./docs/principles/principle.md)
- Automated AI usage log → [`docs/ai-usage/log.md`](./docs/ai-usage/log.md)

---

## Skills (Load on Demand, by Task)

Indexed in [`agentic/skills/README.md`](./agentic/skills/README.md). The core flow:

- [`understand-the-repo`](./agentic/skills/understand-the-repo.md) — Orient cheaply (map + memory).
- [`implement-feature`](./agentic/skills/implement-feature.md) — Branch → understand → implement → test → review → commit → PR.
- [`run-tests`](./agentic/skills/run-tests.md) — Multi-tier tests (Jest, Supertest, Playwright, Expo).
- [`code-review`](./agentic/skills/code-review.md) — Self-review before commit against DoD.
- [`security-review`](./agentic/skills/security-review.md) — For auth, RBAC, inputs, or media uploads.
- [`commit-and-pr`](./agentic/skills/commit-and-pr.md) — Conventional Commits & mandatory peer review.
- [`deploy`](./agentic/skills/deploy.md) — Staging and production container deployment.
- [`docs-update`](./agentic/skills/docs-update.md) — Keep maps, capabilities, and diagrams in sync.
- [`learn-and-update`](./agentic/skills/learn-and-update.md) — Capture best practices, gotchas, and lessons.
- [`ai-log-entry`](./agentic/skills/ai-log-entry.md) — Automated `AI-XXXX` usage logging.

**Domain Skills:**
[`add-endpoint`](./agentic/skills/add-endpoint.md), [`add-frontend-feature`](./agentic/skills/add-frontend-feature.md), [`add-mobile-screen`](./agentic/skills/add-mobile-screen.md), [`db-schema-change`](./agentic/skills/db-schema-change.md), [`realtime-event`](./agentic/skills/realtime-event.md), [`webrtc-signaling`](./agentic/skills/webrtc-signaling.md), [`add-test`](./agentic/skills/add-test.md), [`debug`](./agentic/skills/debug.md), [`performance-review`](./agentic/skills/performance-review.md), [`secrets-incident`](./agentic/skills/secrets-incident.md).

---

## Quick Commands

```bash
# Backend (apps/backend or apps/api)
cd apps/backend && npm install && npm run start:dev   # NestJS dev server on :4000
cd apps/backend && npx prisma migrate dev             # Prisma migration
cd apps/backend && npm test                           # Jest unit tests

# Web & Integrated Admin (apps/web)
cd apps/web && npm install && npm run dev             # Next.js on :3000 (Admin at /admin)
cd apps/web && npm run build                          # Typecheck & production build
cd apps/web && npm run lint                           # Next.js ESLint

# Mobile (apps/mobile)
cd apps/mobile && npm install && npx expo start       # Expo development server

# Integrity Check
./scripts/check-agent-map.sh                          # Verify zero broken links across docs/skills
```

---

## Memory & Learning

- Repo-resident facts: [`agentic/memory/`](./agentic/memory/) (with `MEMORY.md` index).
- Continuous learning: [`agentic/learning/`](./agentic/learning/). Propose updates via PR; never auto-apply to rules.

---

## Adapters

- **Antigravity IDE:** Natively reads this `AGENTS.md` file on every turn.
- **Claude Code:** [`CLAUDE.md`](./CLAUDE.md) imports this file via `@path` (e.g. `@AGENTS.md`). See [`agentic/SETUP.md`](./agentic/SETUP.md) to enable native skill invocation.
- **Cursor / Copilot / opencode / openclaw:** Point tool at `AGENTS.md` at repository root.
