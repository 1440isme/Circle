# Project Structure & Directory Taxonomy

Rules and guidelines on where code, types, tests, and documentation live in CIRCLE.

---

## Code Placement Rules

1. **Backend Code:** Strictly inside `apps/backend/src/` (or `apps/api/src/`). Domain code in `src/modules/<domain>/`.
2. **Web Code:** Inside `apps/web/src/`. Routes in `src/app/`, components in `src/components/`.
3. **Mobile Code:** Inside `apps/mobile/app/` (routes) and `apps/mobile/src/` (components, services).
4. **Shared Contracts:** Interfaces, DTO types, and socket event signatures in `packages/types/`.
5. **Testing:** Unit tests colocated with source files; E2E tests in `tests/e2e/`.
6. **Agent Rules:** Under `agentic/`. Canonical entry in `AGENTS.md`.
7. **Documentation:** Under `docs/`. Index in `docs/README.md`.
