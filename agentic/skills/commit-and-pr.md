# Skill: Commit and Pull Request

Protocol for committing code and opening Pull Requests in CIRCLE.

---

## When to Use
- When a task or feature implementation is complete, tested, and self-reviewed.

---

## 1. Commit Formatting

Commits must follow Conventional Commits:
```bash
git commit -m "<type>(<scope>): <summary> (#<issue-id>)"
```

- Example: `feat(auth): implement refresh token rotation mechanism (#42)`
- Example: `fix(chat): eliminate duplicate socket message delivery on reconnect (#87)`

---

## 2. Opening the Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin <type>/<issue-id>-<slug>
   ```
2. Open a PR targeting `develop` (never directly to `main`).
3. Fill out the **8-question PR Template**:
   - 1. What problem does this solve? (`Closes #<issue-id>`)
   - 2. What changed?
   - 3. Why this approach?
   - 4. What alternatives were considered?
   - 5. How was it tested? (Paste test command and logs)
   - 6. What risks remain?
   - 7. Did architecture/docs change?
   - 8. Was AI used? (Link `AI-XXXX` in `docs/ai-usage/log.md`)

---

## 3. Mandatory Peer Review Policy

- **No Self-Merging:** Strictly prohibited.
- **Assignee Pairing:**
  - If PR author is **Trương Công Bình**, assign reviewer **Ninh Thị Mỹ Hạnh**.
  - If PR author is **Ninh Thị Mỹ Hạnh**, assign reviewer **Trương Công Bình**.
- Reviewer must inspect: AC compliance, negative tests, secrets leak check, AI log alignment.
- CI pipeline must be all green (lint, typecheck, tests).
