# CIRCLE Agentic Coding Framework

A **repo-resident, vendor-neutral** engineering framework that lets any AI coding agent — Antigravity IDE, Claude Code, Cursor, Copilot, opencode, openclaw, or human engineers — work seamlessly in this repository.

This framework is built upon the hiến pháp [PROJECT_GOD.md](../PROJECT_GOD.md) and adopts the industrial design of Bosch's **AutoWRX** framework: load the same rules, memory, skills, and repo map; adhere to the exact implement → test → review → commit → PR → verify flow; and avoid re-scanning the entire codebase on every session.

---

## Layout

```text
AGENTS.md                       Vendor-neutral entry point (read by every AI coding tool)
CLAUDE.md                       Claude Code adapter (imports AGENTS.md via @path)
agentic/
  README.md                     This overview document
  RULES.md                      Hard gates & operational rules (must / must-not)
  CONVENTIONS.md                Coding, naming, GitFlow, commits, PR peer review rules
  SETUP.md                      How to wire this repository into each AI tool
  map/                          Navigational pointers and compact module tree
    INDEX.md                    Index pointing to architecture, capabilities, sitemaps
    TREE.md                     Compact module tree with one-line descriptions
  memory/                       Repo-resident durable knowledge base
    MEMORY.md                   Index of durable facts
    architecture.md             Modular monolith structure & layer boundaries
    gotchas.md                  Repo-specific pitfalls (Prisma/Neon, Expo WebRTC, etc.)
    verified-facts.md           Facts confirmed by code audit
    decisions.md                Architectural decision record summary
  learning/                     Continuous learning layer across sprints
    README.md
    best-practices.md
    trends.md
    lessons.md
  skills/                       Load-on-demand procedural playbooks
    README.md                   Skill index and selection matrix
    understand-the-repo.md      Orient cheaply without full-tree scanning
    implement-feature.md        Canonical implement → test → review → PR flow
    run-tests.md                Multi-tier test suites (Jest, Playwright, E2E)
    code-review.md              Self-review diff before commit against DoD
    security-review.md          Auth, RBAC, input sanitization, secret audit
    commit-and-pr.md            Conventional Commits & mandatory peer review
    deploy.md                   Staging & production deployment procedures
    docs-update.md              Keep docs & Mermaid diagrams in sync with code
    learn-and-update.md         Capture durable facts into memory & learning
    ai-log-entry.md             Automated AI usage logging (AI-XXXX)
    add-endpoint.md             NestJS + Prisma API endpoint creation
    add-frontend-feature.md     Next.js Web feature creation
    add-mobile-screen.md        React Native Expo screen creation
    db-schema-change.md         Prisma schema migration & indexing
    realtime-event.md           Socket.IO gateway event addition
    webrtc-signaling.md         WebRTC call signaling flow
    add-test.md                 Multi-tier test case authoring
    debug.md                    Root cause analysis & regression test creation
    performance-review.md       Query optimization, bundle size, latency NFRs
    secrets-incident.md         Credentials leak handling & git sanitization
```

---

## How an Agent Uses This (The Contract)

1. **On startup:** Read [`AGENTS.md`](../AGENTS.md) (and tool adapter like [`CLAUDE.md`](../CLAUDE.md)). These import [`agentic/RULES.md`](./RULES.md) + [`agentic/CONVENTIONS.md`](./CONVENTIONS.md) — the **always-loaded** foundation.
2. **Before doing real work:** Run the **`understand-the-repo`** skill: load [`agentic/map/INDEX.md`](./map/INDEX.md) + [`agentic/memory/MEMORY.md`](./memory/MEMORY.md) instead of re-scanning all files. Deep-read only the specific module you need to touch.
3. **For any specific task:** Load the matching procedural **skill** from [`agentic/skills/`](./skills/) on demand. Do not preload all skills at once.
4. **During execution:** Follow the standard flow in [`agentic/skills/implement-feature.md`](./skills/implement-feature.md).
5. **After execution:** Whenever AI is utilized, automatically append an entry to [`docs/ai-usage/log.md`](../docs/ai-usage/log.md) per [`agentic/skills/ai-log-entry.md`](./skills/ai-log-entry.md).
6. **When you learn something durable:** Propose updates to [`agentic/memory/`](./memory/) or [`agentic/learning/`](./learning/) via a PR.

---

## What is NOT Duplicated Here

To maintain token efficiency and prevent knowledge drift, this framework **points to** existing repo knowledge rather than copying it:

- **Canonical Constitution & Rubric Level 5:** [`PROJECT_GOD.md`](../PROJECT_GOD.md)
- **Living Sitemaps & Test Coverage:** [`.agents/SITEMAP.md`](../.agents/SITEMAP.md)
- **Multi-tier Testing Strategy:** [`.agents/TESTING.md`](../.agents/TESTING.md)
- **Capability Catalog:** [`docs/capabilities/`](../docs/capabilities/)
- **Architecture Deep-dive:** [`docs/architecture/`](../docs/architecture/)
- **Onboarding & Local Dev:** [`docs/getting-started/`](../docs/getting-started/)
- **Software Principles:** [`docs/principles/principle.md`](../docs/principles/principle.md)
- **AI Usage Log:** [`docs/ai-usage/log.md`](../docs/ai-usage/log.md)

[`agentic/map/`](./map/) serves as an **index of pointers** to the above resources. Update pointers when docs move; do not copy their contents into the agent framework.
