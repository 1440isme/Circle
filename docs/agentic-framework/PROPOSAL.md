# Agentic Framework Proposal & Architecture

Design proposal for the repo-resident, vendor-neutral agentic coding framework implemented in CIRCLE, inspired by Bosch AutoWRX.

---

## 1. Problem Statement
Traditional AI coding workflows suffer from:
- **Massive context pollution:** Pumping entire project rulebooks into LLM context windows wastes tokens and degrades reasoning.
- **Hallucinations & Drift:** Rules diverge from actual source code.
- **Vendor Lock-in:** Workflows tailored to a single tool (e.g. Cursor-only or Claude-only) fail when switching environments.

---

## 2. The Solution: Bosch AutoWRX Architecture
- **Layer 1: Entry Points:** `AGENTS.md` (vendor-neutral) + thin adapters (`CLAUDE.md`).
- **Layer 2: Hard Rules & Conventions:** `agentic/RULES.md` and `agentic/CONVENTIONS.md`.
- **Layer 3: Procedural Skills:** Plain markdown playbooks in `agentic/skills/` loaded strictly on-demand.
- **Layer 4: Repo-Resident Memory & Map:** `agentic/memory/` and `agentic/map/` allow cheap orientation without repo re-scanning.
- **Layer 5: Continuous Learning:** Capturing durable patterns in `agentic/learning/`.
- **Layer 6: Living Sitemaps & Capabilities:** Code-grounded specs in `.agents/SITEMAP.md` and `docs/capabilities/`.
