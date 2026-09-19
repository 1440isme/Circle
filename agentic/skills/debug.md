# Skill: Debug

Systematic defect investigation and regression test workflow for CIRCLE.

---

## When to Use
- Investigating reported bugs (`BUG-<MODULE>-<NUM>`) or unexpected test failures.

---

## Steps

1. **Reproduce the Defect:**
   - Create a minimal reproducing test case or curl command.
   - Verify the defect in local environment.
2. **Isolate Root Cause:**
   - Check application logs, database state, and network traces.
   - Trace flow through controller → service → database or socket gateway.
3. **Draft Bug Report:**
   - Fill the 17 standard bug fields defined in [`agentic/RULES.md`](../RULES.md).
4. **Implement Fix:**
   - Fix the underlying cause without breaking surrounding contracts.
5. **Add Regression Test:**
   - Add an automated test case named `TC-<MODULE>-<NUM>-regression` that would fail without this fix.
6. **Record Lesson:**
   - If the bug revealed a subtle trap, record it in [`agentic/memory/gotchas.md`](../memory/gotchas.md) or [`agentic/learning/lessons.md`](../learning/lessons.md).
