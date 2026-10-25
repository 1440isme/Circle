# AGENTS PATCH — Nối Memory Protocol vào AGENTS.md

> Áp 3 thay đổi nhỏ sau vào `AGENTS.md` ở repo root. Mục tiêu: biến memory từ
> "có thư mục" thành "có hành vi" — agent bị bắt buộc **đọc đầu phiên** và
> **ghi ngay khi được dặn/sửa**.
> *(Lưu ý: Các thay đổi này ĐÃ ĐƯỢC ÁP SẴN vào AGENTS.md tại repo root).*

## 1. Thêm vào mục "Key Rules in One Line"

```markdown
- **Memory discipline:** Instructions, corrections, preferences and decisions are captured into `agentic/memory/` **the moment they are stated** (skill: `memory-protocol`). Never claim to remember something you did not write down. At session start, always load `agentic/memory/MEMORY.md` — even for small tasks.
```

## 2. Thêm vào danh sách Skills (core flow)

```markdown
- [`memory-protocol`](../skills/memory-protocol.md) — Recall at session start; capture corrections/preferences/decisions the moment they happen; weekly consolidation.
```
*(Tại root AGENTS.md đường dẫn là `./agentic/skills/memory-protocol.md`)*

## 3. Thay toàn bộ mục "Memory & Learning" bằng

```markdown
## Memory & Learning

- **Layer 1 — Index (always load):** [`agentic/memory/MEMORY.md`](MEMORY.md). Durable facts, preferences, corrections, decisions. Hard cap ~200 lines.
- **Layer 2 — Daily logs:** `agentic/memory/YYYY-MM-DD.md`. Append-only capture during the day; scaffold with `./scripts/new-memory-log.sh`.
- **Layer 3 — Topics:** `agentic/memory/topics/` for deep per-topic context; read on demand.
- **Write policy (two lanes):** Memory writes are a *fast lane* — capture immediately, commit with the task's PR (or a `chore(memory)` commit); do NOT route small memories through the learning-approval process. Changes to `agentic/RULES.md`, `agentic/CONVENTIONS.md`, or playbook baselines remain a *slow lane*: propose via [`learn-and-update`](../skills/learn-and-update.md) + PR, never auto-apply.
- **Consolidation:** Weekly — promote durable items to the index, prune, archive logs (see `memory-protocol` skill).
- Full specification: [`agentic/memory/MEMORY-PROTOCOL.md`](MEMORY-PROTOCOL.md)
```
*(Tại root AGENTS.md các đường dẫn có tiền tố `./agentic/...`)*

## Ghi chú khi áp patch

- Nếu đặt `MEMORY-PROTOCOL.md` ngay trong `agentic/` thay vì `agentic/memory/`,
  sửa đường dẫn ở dòng cuối mục 3 và trong skill `memory-protocol`.
- Sau khi áp, kiểm chứng bằng một phiên mới hoàn toàn: hỏi agent một điều đã
  dặn ở phiên trước (vd một preference) — agent phải tra được từ file, không
  cần nhắc lại.
