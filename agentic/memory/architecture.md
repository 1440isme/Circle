# Architecture Memory

Durable structural realities that govern the CIRCLE codebase.

---

## 1. Modular Monolith Backend (`apps/api`)

- **Domain Boundaries:** The backend is organized as a Modular Monolith with clear domain boundaries (`auth`, `users`, `circles`, `chat`, `realtime`, `posts`, `media`, `admin`).
- **Dependency Inversion:** Modules interact through exported NestJS services or event emitters, never by reaching into another module's database tables directly.
- **Single Prisma Client:** All modules share a centralized Prisma service located in `src/database/prisma.service.ts`.
- **Stateless Application Layer:** All stateful data (sessions, cache, active socket rooms) is offloaded to Redis (Upstash) to enable multi-instance scaling.

---

## 2. Frontend Web & Unified Admin (`apps/web`)

- **Next.js App Router:** Server Components handle data fetching at the page layer; Client Components handle interactive state.
- **Admin Dashboard Integration:** The admin interface resides directly inside `apps/web/src/app/admin/` to maximize code reuse of components, API clients, and auth mechanisms, protected by strict RBAC guards.
- **Global Stores:** Zustand is used for client-only state (`authStore`, `chatStore`, `presenceStore`). Data caches are managed by TanStack Query.

---

## 3. Cross-Platform Mobile (`apps/mobile`)

- **Expo Router:** Mobile navigation follows the file-based Expo Router system (`app/(tabs)/`, `app/circle/[id]/`, etc.).
- **Shared Type Contracts:** Mobile strictly consumes types from `packages/types` ensuring 100% type parity with the backend and web platforms.

---

## 4. Realtime Layer (Socket.IO + WebRTC)

- **Signaling via Socket.IO:** WebRTC peer connections (audio/video calls) use the existing Socket.IO connection as the signaling channel.
- **Room Isolation:** Presence and chat events are scoped to circle rooms (`circle:<id>`) and direct messaging channels (`channel:<id>`).
