# Skill: Code Review

Self-review protocol before requesting peer review or opening a PR.

---

## When to Use
- When implementation is complete and before committing or asking the peer engineer (Bình ↔ Hạnh) to review.

---

## Self-Review Checklist

- [ ] **Acceptance Criteria:** Are all `AC-xxx` requirements met?
- [ ] **Edge Cases:** Are negative inputs, null values, expired tokens, and network drops handled gracefully?
- [ ] **No Dead Code:** Are temporary debugging `console.log`, commented-out blocks, or unused imports removed?
- [ ] **Type Safety:** 0 TypeScript `any` types; strictly typed inputs and return values.
- [ ] **Error Handling:** No empty `try {} catch {}` blocks; errors logged with context.
- [ ] **Security:** No hardcoded tokens, passwords, or API keys. Auth guards applied to protected routes.
- [ ] **Definition of Done:** Meets all DoD criteria defined in [`agentic/RULES.md`](../RULES.md).
- [ ] **AI Log:** Has an entry been drafted in [`docs/ai-usage/log.md`](../../docs/ai-usage/log.md)?

---

## Exit Criteria
- Diff is clean, focused, and under 400 lines where practical.
- Peer reviewer can understand the rationale easily.
