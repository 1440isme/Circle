# Skill: Database Schema Change

Safe procedures for updating Prisma schemas, running migrations, and indexing in PostgreSQL.

---

## When to Use
- Adding new models, fields, relations, or indexes to PostgreSQL.

---

## Steps

1. **Edit Prisma Schema:**
   - Update `apps/api/prisma/schema.prisma`.
   - Ensure foreign keys have indexes (`@@index([userId])`).
   - Use soft-delete pattern (`deletedAt DateTime?`) where appropriate.
2. **Generate Migration:**
   ```bash
   cd apps/api
   npx prisma migrate dev --name <descriptive_migration_name>
   ```
3. **Verify Generated SQL:**
   - Inspect `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql` to ensure no unintended table drops or destructive alterations.
4. **Update Shared Types:**
   - Update corresponding interfaces in `packages/types/entities/`.
5. **Update ERD Diagrams:**
   - Update Mermaid ERD diagrams in `docs/architecture/diagrams/erd.md`.
