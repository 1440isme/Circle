# Verified Facts Memory

Non-obvious technical facts confirmed by code examination and repository setup.

---

1. **Monorepo Structure:** The project is organized as a monorepo with `apps/` (`api`, `web`, `mobile`) and `packages/` (`types`, `shared`, `config`).
2. **Admin Dashboard Placement:** Admin functionality is integrated within `apps/web/src/app/admin/` rather than a distinct standalone application, sharing routing, auth providers, and design tokens.
3. **Repository OS:** GitHub Issues and Projects serve as the single management OS. Every PR must trace back to an issue.
4. **AI Logging Requirement:** All AI assistance must be logged into `docs/ai-usage/log.md` with an `AI-XXXX` identifier.
5. **Storage Provider:** Cloudflare R2 provides S3-compatible object storage for user media, eliminating egress fees.
