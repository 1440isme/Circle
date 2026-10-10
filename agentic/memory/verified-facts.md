# Verified Facts Memory

Non-obvious technical facts confirmed by code examination and repository setup.

---

1. **Monorepo Structure:** The project is organized as a monorepo with `apps/` (`api`, `web`, `mobile`) and `packages/` (`types`, `shared`, `config`).
2. **Admin Dashboard Placement:** Admin functionality is integrated within `apps/web/src/app/admin/` rather than a distinct standalone application, sharing routing, auth providers, and design tokens.
3. **Repository OS:** GitHub Issues and Projects serve as the single management OS. Every PR must trace back to an issue.
4. **AI Logging Requirement:** All AI assistance must be logged into `docs/ai-usage/log.md` with an `AI-XXXX` identifier.
5. **Storage Provider:** Cloudflare R2 provides S3-compatible object storage for user media, eliminating egress fees.
6. **Automated Peer Review & Merge Protocol:** GitHub CLI (`gh`) is installed and authenticated for engineer accounts (`1440isme`, `BH-bonnie`). The AI Agent handles the end-to-end peer review workflow: inspecting diffs, publishing structured review comments via `gh pr review`, re-evaluating fixes, approving PRs upon DoD satisfaction, and executing `gh pr merge --merge --delete-branch` directly into `develop`.
7. **Project Board OS Hierarchy & 1-Issue = 1-PR Invariant:** 
   - GitHub Projects (Project 3 `CIRCLE — Project OS`) is configured with a strict 3-tier structure:
     - **Tier 1 (Root View):** Filtered with `no:parent`, displaying ONLY the 10 Epic Goals (`[GOAL-W01]` to `[GOAL-W15]`).
     - **Tier 2 (Sub-issues):** Granular tasks nested inside their parent Epic Goal via GitHub Sub-issues API.
     - **Tier 3 (Pull Requests):** PRs link directly to their dedicated Tier 2 Sub-issue via GitHub's native `Linked pull requests` field and `Fixes #<id>` in PR body.
   - Creating standalone / floating PRs without a dedicated issue, or grouping multiple PRs under a generic issue, is strictly prohibited. Every single PR must map 1-1 to exactly one dedicated issue.
   - **User "Push" Command Contract:** Always interpreted as a complete 5-stage lifecycle: Verify/Create Issue ➔ Verify Branch ➔ Pre-commit Verify & Commit ➔ Push Remote ➔ Open Pull Request with two-way traceability and peer review request. Raw unlinked pushes are strictly forbidden.
