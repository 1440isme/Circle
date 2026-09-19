# Skill: Add Frontend Feature

Procedure for adding pages or components to the Next.js web application (`apps/web`), including integrated admin views.

---

## When to Use
- Building new UI pages, interactive components, or admin dashboard views.

---

## Steps

1. **Locate Route in App Router:**
   - Public/User routes: `apps/web/src/app/(main)/...` or `apps/web/src/app/(circle)/...`.
   - Admin routes: `apps/web/src/app/admin/...` with admin RBAC check.
2. **Server vs Client Components:**
   - Fetch initial data in Server Components (`page.tsx`) where possible.
   - For interactive state, forms, or socket connections, mark the component with `'use client'`.
3. **Data Fetching with TanStack Query:**
   - Create query/mutation hooks using `@tanstack/react-query`.
   - Cache invalidation on mutation success.
4. **State Management:**
   - Use Zustand stores (`src/stores/`) for cross-component client state.
5. **Update SITEMAP:**
   - Add page and test status to [`.agents/SITEMAP.md`](../../.agents/SITEMAP.md).
