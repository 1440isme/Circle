# Core vs. Domain Modules Philosophy

Guidelines on what belongs in core infrastructure versus domain-specific modules in CIRCLE.

---

## What Belongs in Core (`backend/src/common/`, `packages/shared/`)
- Global filters, interceptors, and exception handling.
- Database connection lifecycle (`PrismaService`).
- Base validation schemas and cryptographic token utilities.
- Shared TypeScript contracts and enums (`packages/types`).

## What Belongs in Domain Modules (`backend/src/modules/<module>/`)
- Domain-specific database models and Prisma extensions.
- Module controllers, DTOs, and business services.
- Event listeners and business rules specific to that domain.
- Admin sub-features relating to that domain.
