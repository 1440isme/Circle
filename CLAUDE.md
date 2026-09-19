# CLAUDE.md — CIRCLE (Claude Code Adapter)

This is a thin adapter. The canonical agent rules live in vendor-neutral files and are imported below (Claude Code `@path` syntax — they expand at launch). Do not duplicate rules here.

@AGENTS.md
@agentic/RULES.md
@agentic/CONVENTIONS.md

## Claude Code Specifics

- **Skills:** The repo's skill playbooks are markdown in [`agentic/skills/`](./agentic/skills/). To invoke them via Claude Code's Skill tool natively, symlink them into `.claude/skills/` (see [`agentic/SETUP.md`](./agentic/SETUP.md)). Otherwise, load the matching skill file directly when a task fits.
- **Memory:** Claude Code's default memory is user-local (`~/.claude/...`). For this repo, prefer the **repo-resident** memory in [`agentic/memory/`](./agentic/memory/) so knowledge is shared across tools/machines and reviewable in PRs. Use user-local memory only for personal preferences.
- **Peer Review & Git Identity:** Never commit on `main` or `develop`. PRs require peer review approval (Bình ↔ Hạnh).
- **Plan Mode:** For non-trivial implementations, enter plan mode and get sign-off before coding.
- **Don't push/deploy unless explicitly asked;** commit only when asked. Each is separate authorization.

## Quick Orientation

Read [`AGENTS.md`](./AGENTS.md) → run `understand-the-repo` skill → load the task's skill → follow `implement-feature`.
