# Skill: Add Test

Authoring multi-tier automated test cases in CIRCLE (Unit, Integration, API, E2E).

---

## When to Use
- Adding test coverage for new features or bug fixes to fulfill Rubric Level 5 (TC2.5 / TC5).

---

## Steps

1. **Identify Test Tier:**
   - **Unit:** Pure functions, DTO validators, formatting helpers (`tests/unit/` or colocated).
   - **Integration:** Service interaction with PostgreSQL Prisma or Redis (`tests/integration/`).
   - **API / Contract:** Supertest requests against NestJS endpoints (`tests/api/`).
   - **E2E Web:** Playwright browser scenarios (`tests/e2e/` or `.agents/tests/`).
2. **Assign Identifier:**
   - Use standard key: `TC-<MODULE>-<NUM>` (e.g. `TC-AUTH-001`).
3. **Structure (AAA Pattern):**
   - **Arrange:** Setup test data and mock external services (Cloudflare R2).
   - **Act:** Execute target function or API endpoint.
   - **Assert:** Verify response codes, database state, and side effects.
4. **Update SITEMAP:**
   - Record test coverage status in [`.agents/SITEMAP.md`](../../.agents/SITEMAP.md).
