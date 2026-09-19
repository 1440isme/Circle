# Skill: Learn and Update

Capturing durable technical facts, lessons, and best practices into repo-resident memory.

---

## When to Use
- After discovering a non-obvious bug root cause.
- When finding a quirky behavior in a dependency (e.g. Prisma connection pooling, Expo native modules).
- When establishing a reusable architectural pattern.

---

## Steps

1. **Classify the Insight:**
   - Durable architectural truth? → [`agentic/memory/architecture.md`](../memory/architecture.md)
   - Dependency pitfall or trap? → [`agentic/memory/gotchas.md`](../memory/gotchas.md)
   - Code-confirmed reality? → [`agentic/memory/verified-facts.md`](../memory/verified-facts.md)
   - Engineering pattern? → [`agentic/learning/best-practices.md`](../learning/best-practices.md)
   - Bug post-mortem? → [`agentic/learning/lessons.md`](../learning/lessons.md)
2. **Format the Entry:**
   - Keep entries concise (2 to 5 lines). State the context, the symptom, the root cause, and the fix.
3. **Commit & PR:**
   - Include memory updates in the same PR or a standalone `docs/chore` PR.
