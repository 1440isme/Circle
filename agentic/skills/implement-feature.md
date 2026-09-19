# Skill: Implement Feature

The canonical implementation lifecycle for adding or changing features in CIRCLE.

---

## When to Use
- Implementing an assigned GitHub Issue (User Story `US-xxx` or Defect `BUG-xxx`).

---

## Steps

1. **Check DoR (Definition of Ready):**
   - Confirm Issue has clear Acceptance Criteria (`AC-xxx`), Business Rules (`BR-xxx`), and test expectations.
2. **Branch Creation:**
   - Ensure you are branching from the latest `develop`:
     ```bash
     git checkout develop && git pull
     git checkout -b <type>/<issue-id>-<slug>
     ```
3. **Inspect Existing Abstractions:**
   - Search `apps/` and `packages/` to reuse existing hooks, services, or types before creating new ones.
4. **Implement Code:**
   - Adhere to the conventions in [`agentic/CONVENTIONS.md`](../CONVENTIONS.md).
   - Keep controllers thin in `apps/api`.
   - Separate server/client components in `apps/web`.
   - Update shared contracts in `packages/types` if API shapes change.
5. **Run Tests & Verify:**
   - Run unit and integration tests (see [`run-tests.md`](run-tests.md)).
   - Add regression tests if fixing a bug.
6. **Self-Review:**
   - Run [`code-review.md`](code-review.md) against the Definition of Done.
7. **Commit & Open PR:**
   - Follow [`commit-and-pr.md`](commit-and-pr.md).
8. **Automated AI Usage Logging:**
   - Follow [`ai-log-entry.md`](ai-log-entry.md) to append an `AI-XXXX` record to `docs/ai-usage/log.md`.

---

## Exit Criteria
- Code builds with 0 errors.
- Tests pass.
- Definition of Done satisfied.
- AI Log entry appended.
