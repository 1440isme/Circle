# Backend Architecture Deep-Dive

Comprehensive technical architecture for the CIRCLE backend service (`apps/backend/` or `apps/api/`).

---

## 1. Modular Monolith Design
The backend is structured as a **Modular Monolith** using NestJS. Each functional area (`auth`, `users`, `circles`, `chat`, `realtime`, `posts`, `media`, `admin`) is isolated inside its own module directory under `apps/backend/src/modules/`.

### Module Boundaries
- Modules interact via **Injected Public Services** or **Internal Event Emitters**.
- Direct cross-table querying of another module's database models without going through its service or shared Prisma repository is strictly forbidden.
- All database operations are mediated by the centralized `PrismaService`.

---

## 2. Request Lifecycle
1. **Traefik Reverse Proxy** terminates TLS and routes traffic to `:4000`.
2. **Global Middlewares:** Helmet (security headers), CORS validation, rate limiting.
3. **Pipes & Validation:** `ValidationPipe` with `class-validator`.
4. **Guards:** `JwtAuthGuard` extracts JWT from `Authorization: Bearer <token>`; `RolesGuard` evaluates role permissions.
5. **Controllers:** Thin controllers dispatch directly to domain services.
6. **Services:** Execute business logic and trigger transactions.
7. **Database / Cache:** Prisma queries PostgreSQL (Neon); Redis caches hot entities.
