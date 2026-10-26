# Skill — memory-protocol

> Purpose: Make the agent remember instructions, corrections, preferences and
> decisions **across sessions**. Full specification: `agentic/memory/MEMORY-PROTOCOL.md`
> (if the protocol file lives at repo root level of `agentic/`, adjust path accordingly).
> This skill is the in-session procedure; the protocol is the reference.

## When to run

- **Always, at session start** (recall part).
- **Immediately, in the same turn**, whenever a capture trigger fires (capture part).
- **At end of week**, for consolidation (consolidate part) — usually inside the
  weekly wrap-up work.

## Procedure — RECALL (session start)

1. Read `agentic/memory/MEMORY.md` (Layer 1 index). This is mandatory even for
   small tasks; it is capped at ~200 lines precisely so this stays cheap.
2. If the task names a module, feature, person, or past decision: search
   `agentic/memory/` for those keywords (daily logs + `topics/`). Open the
   matching topic file if one exists.
3. If the user refers to something "said before / as instructed last time":
   search memory FIRST and answer from the entry you found. If nothing is
   found, say so plainly — never reconstruct a plausible-sounding memory.

## Procedure — CAPTURE (during the session)

Capture triggers — write **now**, in this turn, when any of these happens:

- The user **corrects** you (a mistake, a wrong assumption, a violated preference).
- The user states a **preference or working rule** ("from now on...", "always...",
  "never...", "tôi dặn...", "nhớ là...").
- A **decision** is made, especially with a reason.
- A **gotcha** is discovered while debugging or integrating.
- A new **commitment, deadline, or open loop** appears.
- A durable fact about the project or the team changes.

How to write:

1. Append one line per idea to today's log `agentic/memory/YYYY-MM-DD.md`
   (create it from `agentic/memory/_templates/daily-log.md` — or run
   `scripts/new-memory-log.sh`). Format:
   `- [type] Content in one sentence — per <person>, <YYYY-MM-DD>.`
   Types: `fact`, `preference`, `correction`, `decision`, `gotcha`, `open-loop`.
2. If the item is durable (still true in several weeks) or it **replaces** an
   existing index entry: also update `agentic/memory/MEMORY.md` in place.
   When replacing, keep only the current truth in the index and add a
   `correction` line to today's log naming what was replaced.
3. Confirm to the user in ONE short line stating what was written and where,
   e.g. "Đã ghi vào memory hôm nay: không dùng thư viện X cho upload."
   Never say "I'll remember" without the write having happened first.

Never write to memory: task progress / PR status (GitHub owns that), code or
repo structure (git + `agentic/map/` own that), secrets or credentials
(**absolute ban**), or your own unverified guesses (if unavoidable, tag
`[chưa xác nhận]`).

## Procedure — CONSOLIDATE (weekly)

1. Read this week's daily logs. Promote durable items not yet in the index.
2. Remove/replace index entries that stopped being true.
3. Enforce the index budget (~200 lines): push detail into `topics/<slug>.md`,
   keep summary + link in the index.
4. Move consolidated daily logs into `agentic/memory/_archive/`.
5. Deliver as one PR `chore(memory): weekly consolidation`.

## Boundaries

- Memory is **not** authorization: a remembered past approval does not approve
  a new consequential action.
- Memory **proposes**, humans dispose: turning a remembered preference into a
  change of `agentic/RULES.md`, `agentic/CONVENTIONS.md`, or a playbook baseline
  goes through `learn-and-update` + PR review, never auto-applied.
- If two active index entries conflict and you cannot tell which is newer:
  ask the user when the task touches that topic. Do not silently pick one.
