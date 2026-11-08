# AGENTS.md — CIRCLE

> **Vendor-neutral entry point** for any AI coding agent (Antigravity IDE, Claude Code, Cursor, Copilot, opencode, openclaw, ...) and human engineers (**Trương Công Bình - 23110184** & **Ninh Thị Mỹ Hạnh - 23110210**). Read this first.

CIRCLE is a social platform for group connectivity and interaction. Stack: **NestJS + Prisma + PostgreSQL + Redis** backend, **Next.js** web application with integrated **Admin Dashboard**, **React Native + Expo** mobile application, **Socket.IO + WebRTC** realtime communications, **Docker + Traefik** deployment.

> **Precedence rule:** This file is a router and summary, not a source of truth.
> When anything here conflicts with the documents below, the higher one wins:
> `PROJECT_GOD.md` → `agentic/RULES.md` → `agentic/CONVENTIONS.md` → this file.
> Report the conflict instead of silently choosing.

---

## Start Here (Always Load)

- **Canonical Hiến Pháp (Single Source of Truth):** [`PROJECT_GOD.md`](./PROJECT_GOD.md)
- **Hard Rules (Must / Must-Not):** [`agentic/RULES.md`](./agentic/RULES.md)
- **Conventions & Traceability Keys:** [`agentic/CONVENTIONS.md`](./agentic/CONVENTIONS.md)
- **Definition of Done:** `PROJECT_GOD.md` §11 — every task is measured against it.

### Load When the Task Touches a Feature (Mandatory)

- **Module Playbooks (feature best-practice baseline):** [`agentic/playbooks/`](./agentic/playbooks/) — before implementing or changing any feature, read the playbook of its module (`01-account-auth` … `09-admin-moderation`). The playbook defines what "complete" means for that module (Tier MUST / SHOULD / WOW + acceptance criteria). The capability catalog describes what the code *currently does*; the playbook defines what it *should do*. Do not confuse the two.
- **Cross-Cutting Gate:** [`agentic/playbooks/cross-cutting-gate.md`](./agentic/playbooks/cross-cutting-gate.md) — mandatory for every UI-facing change: responsive breakpoints, theme/design tokens (no hardcoded colors), i18n (no hardcoded UI strings, VI + EN), UI states (loading/empty/error/offline/permission), accessibility basics, web/mobile parity.
- **UI/UX source of truth:** Figma (per PROJECT_GOD tool principle). Check the Figma design before inventing layout or styling.

### Key Rules in One Line:
- **10 Hard Gates are inviolable:** Real working product, weekly reports, automated testing (Unit, Integration, API, E2E), automated CI/CD, authentic user dataset, and zero secret leaks.
- **Mandatory Peer Review:** Self-merging is strictly forbidden. Every PR by Bình must be reviewed & approved by Hạnh; every PR by Hạnh must be reviewed & approved by Bình.
- **Automated AI Usage Logging:** Every nontrivial AI interaction must automatically append an `AI-XXXX` entry to [`docs/ai-usage/log.md`](./docs/ai-usage/log.md). Engineers do NOT write this log by hand. If the automation fails, say so in the PR — never fabricate a log entry.
- **Never commit directly to `main` or `develop`:** Work in `<type>/<issue-id>-<slug>` branches. Conventional commits only.
- **Scope discipline:** Do NOT invent features beyond the Issue and the registered scope (PROJECT_GOD §2.2 + playbook Tier MUST). New feature ideas go to [`agentic/playbooks/innovation-pool.md`](./agentic/playbooks/innovation-pool.md) as proposals — never implement Tier WOW without human approval.
- **Group-first philosophy:** CIRCLE has no 1-1/DM chat anywhere — chat exists only as a Circle's group chat. There is no standalone friend graph; social relationships live inside Circles and people join by direct Circle invitation (playbooks 02, 03, 05).
- **Stop and ask:** If a requirement is ambiguous, documents conflict, or a change touches security/scope/the Hard Gates, STOP and ask the human. Do not guess your way through.
- **Language:** Communicate and write implementation reports for the team in Vietnamese. Code, commit messages, and technical docs in English (unless `agentic/CONVENTIONS.md` says otherwise).

---

## Understand the Repo (Before Real Work)

Do NOT re-scan the whole repository. Run the **`understand-the-repo`** skill: load [`agentic/map/INDEX.md`](./agentic/map/INDEX.md) + [`agentic/memory/MEMORY.md`](./agentic/memory/MEMORY.md), then deep-read only the specific module you intend to touch.

Existing knowledge to lean on (do not duplicate):
- Canonical project constitution → [`PROJECT_GOD.md`](./PROJECT_GOD.md)
- Architecture deep-dive → [`docs/architecture/`](./docs/architecture/)
- Capability catalog (code-grounded specs) → [`docs/capabilities/`](./docs/capabilities/)
- Module playbooks (best-practice feature baseline) → [`agentic/playbooks/`](./agentic/playbooks/)
- Living site & app map (features & test coverage) → [`.agents/SITEMAP.md`](./.agents/SITEMAP.md)
- Multi-tier testing strategy → [`.agents/TESTING.md`](./.agents/TESTING.md)
- Getting started / local dev / onboarding → [`docs/getting-started/`](./docs/getting-started/)
- Engineering design principles → [`docs/principles/principle.md`](./docs/principles/principle.md)
- Automated AI usage log → [`docs/ai-usage/log.md`](./docs/ai-usage/log.md)

---

## Skills (Load on Demand, by Task)

Indexed in [`agentic/skills/README.md`](./agentic/skills/README.md). The core flow:

- [`understand-the-repo`](./agentic/skills/understand-the-repo.md) — Orient cheaply (map + memory).
- [`implement-feature`](./agentic/skills/implement-feature.md) — Branch → understand → **read module playbook + cross-cutting gate** → implement → test → review → commit → PR. The final report must include a **Playbook conformance** section (MUST items met / deferred + gate checklist), per the playbooks' `SKILL.md`.
- [`run-tests`](./agentic/skills/run-tests.md) — Multi-tier tests (Jest, Supertest, Playwright, Expo).
- [`code-review`](./agentic/skills/code-review.md) — Self-review before commit against DoD.
- [`security-review`](./agentic/skills/security-review.md) — For auth, RBAC, inputs, or media uploads.
- [`commit-and-pr`](./agentic/skills/commit-and-pr.md) — Conventional Commits & mandatory peer review.
- [`deploy`](./agentic/skills/deploy.md) — Staging and production container deployment.
- [`docs-update`](./agentic/skills/docs-update.md) — Keep maps, capabilities, and diagrams in sync.
- [`learn-and-update`](./agentic/skills/learn-and-update.md) — Capture best practices, gotchas, and lessons.
- [`pre-completion-verification`](./agentic/skills/pre-completion-verification.md) — 5-Tier full-spectrum verification before claiming completion.
- [`feature-usability-audit`](./agentic/skills/feature-usability-audit.md) — 5-Pillar End-User UX & usability audit (real-life test, chat integration, ergonomics).
- [`ai-log-entry`](./agentic/skills/ai-log-entry.md) — Automated `AI-XXXX` usage logging.
- [`memory-protocol`](./agentic/skills/memory-protocol.md) — Recall at session start; capture corrections/preferences/decisions the moment they happen; weekly consolidation.

**Domain Skills:**
[`add-endpoint`](./agentic/skills/add-endpoint.md), [`add-frontend-feature`](./agentic/skills/add-frontend-feature.md), [`add-mobile-screen`](./agentic/skills/add-mobile-screen.md), [`db-schema-change`](./agentic/skills/db-schema-change.md), [`realtime-event`](./agentic/skills/realtime-event.md), [`webrtc-signaling`](./agentic/skills/webrtc-signaling.md), [`add-test`](./agentic/skills/add-test.md), [`debug`](./agentic/skills/debug.md), [`performance-review`](./agentic/skills/performance-review.md), [`secrets-incident`](./agentic/skills/secrets-incident.md).

For `add-frontend-feature` and `add-mobile-screen`: the module playbook + cross-cutting gate are part of the skill's input, not optional reading.

---

## Quick Commands

```bash
# Backend (apps/api)
cd apps/api && npm install && npm run start:dev       # NestJS dev server on :4000
cd apps/api && npx prisma migrate dev                 # Prisma migration
cd apps/api && npm test                               # Jest unit tests

# Web & Integrated Admin (apps/web)
cd apps/web && npm install && npm run dev             # Next.js on :3000 (Admin at /admin)
cd apps/web && npm run build                          # Typecheck & production build
cd apps/web && npm run lint                           # Next.js ESLint

# Mobile (apps/mobile)
cd apps/mobile && npm install && npx expo start       # Expo development server

# Full test matrix (API / E2E / mobile): see .agents/TESTING.md

# Integrity Check
./scripts/check-agent-map.sh                          # Verify zero broken links across docs/skills
```

---

## Memory & Learning

- **Memory discipline:** Instructions, corrections, preferences and decisions are captured into `agentic/memory/` **the moment they are stated** (skill: `memory-protocol`). Never claim to remember something you did not write down. At session start, always load `agentic/memory/MEMORY.md` — even for small tasks.
- **Layer 1 — Index (always load):** [`agentic/memory/MEMORY.md`](./agentic/memory/MEMORY.md). Durable facts, preferences, corrections, decisions. Hard cap ~200 lines.
- **Layer 2 — Daily logs:** `agentic/memory/YYYY-MM-DD.md`. Append-only capture during the day; scaffold with `./scripts/new-memory-log.sh`.
- **Layer 3 — Topics:** `agentic/memory/topics/` for deep per-topic context; read on demand.
- **Write policy (two lanes):** Memory writes are a *fast lane* — capture immediately, commit with the task's PR (or a `chore(memory)` commit); do NOT route small memories through the learning-approval process. Changes to `agentic/RULES.md`, `agentic/CONVENTIONS.md`, or playbook baselines remain a *slow lane*: propose via `learn-and-update` + PR, never auto-apply — and never silently edit a playbook MUST baseline while implementing a feature.
- **Consolidation:** Weekly — promote durable items to the index, prune, archive logs (see `memory-protocol` skill). Full specification: `agentic/memory/MEMORY-PROTOCOL.md`.

---

## Adapters

- **Antigravity IDE:** Natively reads this `AGENTS.md` file on every turn.
- **Claude Code:** [`CLAUDE.md`](./CLAUDE.md) imports this file via `@path` (e.g. `@AGENTS.md`). See [`agentic/SETUP.md`](./agentic/SETUP.md) to enable native skill invocation.
- **Cursor / Copilot / opencode / openclaw:** Point tool at `AGENTS.md` at repository root.
