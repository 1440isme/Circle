# Setup — Wiring CIRCLE into AI Tools

The CIRCLE Agentic Framework is **vendor-neutral**. Each AI coding assistant just needs to locate [`AGENTS.md`](../AGENTS.md) and load procedural skills on demand.

---

## 1. Antigravity IDE

Antigravity automatically detects `AGENTS.md` at the repository root and loads it as the supreme operational constitution.
- **Skills:** Antigravity agents load skills directly from [`agentic/skills/`](./skills/) when matching tasks are initiated.
- **Memory & Map:** Always instruct the agent to run the `understand-the-repo` skill first to load `agentic/map/INDEX.md` + `agentic/memory/MEMORY.md`.

---

## 2. Claude Code

[`CLAUDE.md`](../CLAUDE.md) imports [`AGENTS.md`](../AGENTS.md), [`agentic/RULES.md`](./RULES.md), and [`agentic/CONVENTIONS.md`](./CONVENTIONS.md) via `@path` imports.

### Optional: Native Skill Tool Symlinking
To invoke skills via Claude Code's native `/skill` command:
```bash
mkdir -p .claude/skills
for s in agentic/skills/*.md; do
  name=$(basename "$s" .md)
  [ "$name" = "README" ] && continue
  ln -sf "../../agentic/skills/$name.md" ".claude/skills/$name.md"
done
```

---

## 3. Cursor IDE

In Cursor Settings → Rules for AI / Project Rules:
- Add a reference pointing to `AGENTS.md` and `agentic/RULES.md`.
- Ensure `.cursorrules` or `.cursor/rules/` points to `agentic/CONVENTIONS.md`.

---

## 4. OpenCode & OpenClaw

Point the agent directly to `AGENTS.md` at repository root per the [agents.md specification](https://agents.md). Skills and memory are plain Markdown files that can be read on demand.

---

## 5. Verification Command

To verify that the framework and all internal Markdown hyperlinks resolve without drift, run:
```bash
./scripts/check-agent-map.sh
```
Expected output: `agent-map OK: all references in ... framework file(s) resolve.`
