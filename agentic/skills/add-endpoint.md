# Skill: Add Endpoint

Procedure for creating a new API endpoint in the NestJS Modular Monolith (`apps/api`).

---

## When to Use
- Adding a new REST endpoint to support web or mobile features.

---

## Steps

1. **Check Shared Contracts:**
   - Define request/response interfaces in `packages/types/dtos/<module>/`.
2. **Create DTO with Validation:**
   - Create DTO class in `apps/api/src/modules/<module>/dto/` using `class-validator` and `class-transformer`.
3. **Implement Service Logic:**
   - Implement business logic in `apps/api/src/modules/<module>/<module>.service.ts`.
   - Interact with PostgreSQL via `PrismaService`.
4. **Expose in Controller:**
   - Add handler to `apps/api/src/modules/<module>/<module>.controller.ts`.
   - Apply guards (`@UseGuards(JwtAuthGuard, RolesGuard)`).
   - Add Swagger annotations (`@ApiOperation`, `@ApiResponse`).
5. **Write Unit & Integration Tests:**
   - Add test case in `apps/api/test/` or colocated `.spec.ts`.
6. **Update Capability Catalog:**
   - Add or update the API contract in [`docs/capabilities/`](../../docs/capabilities/).
