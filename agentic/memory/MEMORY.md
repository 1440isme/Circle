# Memory Index

Repo-resident knowledge base for CIRCLE. Each file records durable, non-obvious facts that span modules and cannot be derived from a single file or git log.

Load this index + the relevant topic file; do not re-derive facts every session.

- [Architecture](architecture.md) — Durable architectural choices: Modular Monolith, module encapsulation, shared types contract.
- [Gotchas](gotchas.md) — Known traps, pitfalls, and framework quirks (Prisma + Neon pooling, Expo WebRTC, Socket.IO auth).
- [Verified facts](verified-facts.md) — Technical realities confirmed by inspecting code and dependencies.
- [Decisions](decisions.md) — Summary of key Architectural Decision Records (ADRs).

---

> **Update Rule:** Propose changes via PR (see [`../skills/learn-and-update.md`](../skills/learn-and-update.md)). Never edit rules to "fix" a memory fact — fix the code, then update memory.
