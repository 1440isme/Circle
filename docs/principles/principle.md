# CIRCLE Engineering & Design Principles

Core design philosophies and architectural rules governing all code written in CIRCLE.

---

## 1. Modular Monolith Backend Principles (`apps/api`)

- **High Cohesion, Low Coupling:** Each module (`auth`, `users`, `circles`, `chat`, etc.) must manage its own domain models and internal business services.
- **Strict Boundary Traversal:** Cross-module queries must go through public services or event emitters, never by directly querying foreign models or mutating another module's state.
- **Thin Controllers:** Controllers only deserialize requests, trigger validation pipes, invoke services, and serialize responses. Zero SQL or business rules in controllers.
- **Database Encapsulation:** All interactions with PostgreSQL must happen via the centralized `PrismaService`.

---

## 2. Full-Stack Web & Admin Principles (`apps/web`)

- **Server-First Mindset:** Pages and data fetching should default to React Server Components (RSC) to minimize client bundle size and latency.
- **Isolate Client State:** Mark with `'use client'` only components requiring user interactivity, browser APIs, or real-time socket connections.
- **Unified Admin Interface:** Maintain the admin portal inside `apps/web/src/app/admin/` with strict role-based route guards.

---

## 3. Mobile Principles (`apps/mobile`)

- **Strict Type Parity:** Mobile application must import all DTOs, domain interfaces, and socket event contracts directly from `packages/types`.
- **Defensive Hardware Access:** Always request permissions gracefully (camera, microphone for WebRTC) with intuitive fallback states when denied.
- **Secure Token Storage:** Store sensitive authentication tokens in hardware-backed secure storage (`expo-secure-store`).

---

## 4. Operational & Agentic Discipline

- **No Drive-by Refactoring:** Never reformat or overhaul unrelated files outside the scope of your assigned GitHub Issue.
- **Definition of Done is Absolute:** Every PR must satisfy the Master DoD before merging.
