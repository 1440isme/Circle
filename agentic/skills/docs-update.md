# Skill: Docs Update

Procedures for keeping documentation, capability catalogs, and architectural diagrams in sync with code.

---

## When to Use
- Whenever code changes alter API routes, database schemas, capabilities, or user-facing features.

---

## Checklist

1. **Capability Catalog (`docs/capabilities/`):**
   - If adding or changing a feature, update the matching cluster file (e.g. `chat-messaging.md`).
   - Ensure Acceptance Criteria and API contracts reflect reality.
2. **Site Map & Test Coverage (`.agents/SITEMAP.md`):**
   - Update the status column (`✅`, `⚠️`, `❌`, `🚧`) for affected web or mobile screens.
3. **Architecture Diagrams (`docs/architecture/diagrams/`):**
   - Update Mermaid sequence or ERD diagrams if models or flows changed.
4. **Link Integrity Check:**
   - Always run the check script to prevent broken links:
     ```bash
     ./scripts/check-agent-map.sh
     ```
