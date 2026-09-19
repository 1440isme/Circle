# Contributing to CIRCLE

Guidelines for contributing to the CIRCLE project. Adherence to these standards is strictly audited against Rubric Level 5 criteria.

> 📖 **Definitive Engineering SOP & Workflow Guide:** [`docs/guides/development-workflow.md`](./docs/guides/development-workflow.md)

---

## 1. Branching & GitFlow

- **Protected Branches:** `main` (Production) and `develop` (Integration core). No direct pushes permitted.
- **Feature Branches:** Branch from latest `develop`:
  - `feat/<issue-id>-<slug>`
  - `fix/<issue-id>-<slug>`
  - `docs/<issue-id>-<slug>`
  - `refactor/<issue-id>-<slug>`
  - `test/<issue-id>-<slug>`

---

## 2. Commit Standards

Use Conventional Commits with issue ID:
```bash
git commit -m "<type>(<scope>): <description> (#<issue-id>)"
```

---

## 3. Pull Requests & Mandatory Peer Review

1. Open PR targeting `develop`.
2. Fill out the 8-question PR template completely.
3. **Strict Peer Review:**
   - Bình must review Hạnh's PRs.
   - Hạnh must review Bình's PRs.
   - Self-merges are strictly prohibited.
4. All CI checks must be green.
5. All AI assistance must be logged in [`docs/ai-usage/log.md`](./docs/ai-usage/log.md).
