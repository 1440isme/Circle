# Codebase Tour

High-level orientation of the CIRCLE repository structure and architectural boundaries.

---

## 1. Top-Level Structure

- **`apps/backend/`** (or **`apps/api/`**): The Modular Monolith backend written in NestJS. Exposes REST endpoints and Socket.IO gateways. Encapsulates business logic, Prisma ORM queries, and Redis caching. Dedicated docs in `apps/backend/docs/`.
- **`apps/web/`**: The Next.js web application utilizing App Router. Houses both consumer-facing social features (feed, circles, chat) and the unified administration dashboard (`/admin`).
- **`apps/mobile/`**: The cross-platform React Native mobile application built with Expo Router and NativeWind.
- **`packages/types/`**: Shared TypeScript contracts (DTOs, entity interfaces, socket payloads, WebRTC signaling schemas).
- **`packages/shared/`**: Shared utilities, formatters, and Zod validation schemas.
- **`packages/config/`**: Shared configs for ESLint, Prettier, TypeScript, and Tailwind.

---

## 2. Agentic & Specification Subsystems

- **`agentic/`**: The repo-resident AI coding framework providing hard rules, conventions, memory, skills, and map indexes.
- **`.agents/`**: Living sitemaps tracking feature completion and multi-tier testing conventions.
- **`docs/capabilities/`**: Code-grounded capability catalog by cluster.
- **`docs/evidence/`**: Academic evidence tracking (weekly reports, rubric audits) for Rubric Level 5 defense.
