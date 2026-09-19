# Skill: Understand the Repo

Cheap, token-efficient orientation for agents and engineers entering this repository.

---

## When to Use
- At the start of a session when you need context on CIRCLE.
- When beginning work on an unfamiliar area of the codebase.

---

## Steps

1. **Load Map & Memory First:**
   - Read [`agentic/map/INDEX.md`](../map/INDEX.md) and [`agentic/map/TREE.md`](../map/TREE.md) to locate relevant modules.
   - Read [`agentic/memory/MEMORY.md`](../memory/MEMORY.md) to check for established durable facts.
2. **Find the Subsystem Map:**
   - If working on backend/API: check [`apps/backend/README.md`](../../apps/backend/README.md) and [`docs/architecture/backend.md`](../../docs/architecture/backend.md).
   - If working on web: check [`apps/web/README.md`](../../apps/web/README.md) and [`.agents/SITEMAP.md`](../../.agents/SITEMAP.md).
   - If working on mobile: check [`apps/mobile/README.md`](../../apps/mobile/README.md).
   - If working on capabilities: check [`docs/capabilities/`](../../docs/capabilities/).
3. **Deep-Read ONLY the Target Files:**
   - Open only the specific module or file you intend to modify.
   - Do not scan the entire filesystem or dump unrelated files into your context window.

---

## Exit Criteria
- You know the file path of the code to change.
- You know the surrounding conventions and existing abstractions.
- Token consumption remains minimal.
