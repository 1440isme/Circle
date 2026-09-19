# Frontend Web Architecture Deep-Dive

Technical architecture of the CIRCLE web application and integrated admin dashboard (`apps/web/`).

---

## 1. Next.js App Router Architecture

- **Server Components (RSC):** Pages in `apps/web/src/app/` are React Server Components by default, fetching data server-side and streaming HTML to reduce client JavaScript bundle size.
- **Client Components ('use client'):** Interactive components (chat windows, call stages, modals, forms) are isolated at the leaf level of the component tree.
- **Integrated Admin Dashboard:** Admin routes reside under `apps/web/src/app/admin/`, sharing the layout, authentication context, design system, and UI components of the main application while being protected by admin-level route guards.

---

## 2. State Management & Data Caching

- **Server Cache:** `TanStack Query` (React Query) handles API queries, deduplication, caching, and optimistic updates.
- **Client Stores:** `Zustand` manages global ephemeral client state (`authStore`, `chatStore`, `presenceStore`).
- **Styling:** `Tailwind CSS` utility classes backed by a unified design token system in `packages/config/tailwind`.
