# Technical Trends in CIRCLE

Evolving patterns and refactoring trajectories in this codebase.

---

1. **Strict Type Sharing:** Migrating all ad-hoc DTO definitions into canonical contracts inside `packages/types/`.
2. **Server Actions vs API Routes:** Utilizing Next.js Route Handlers for complex external webhooks and Server Components + React Query for user interactions.
3. **Component Unification:** Abstracting common UI patterns between `apps/web` and `apps/mobile` where viable through shared validation schemas (`packages/shared/validators`).
