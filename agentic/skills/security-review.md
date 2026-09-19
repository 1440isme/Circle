# Skill: Security Review

Security audit checklist for sensitive changes in authentication, authorization, database queries, and media handling.

---

## When to Use
- Whenever altering authentication flows (`apps/api/src/modules/auth`).
- When adding or modifying RBAC guards or permissions (`ADMIN`, `MODERATOR`, `MEMBER`).
- When accepting user file uploads to Cloudflare R2.
- When creating raw database queries or complex Prisma aggregations.

---

## Audit Checklist

1. **Authentication & Tokens:**
   - Are JWT tokens signed with secure keys from environment variables?
   - Is Refresh Token Rotation enforced?
   - Are expired/revoked tokens rejected?
2. **Authorization & RBAC:**
   - Are circle-scoped operations verifying that the requester is a member of that circle?
   - Are admin endpoints (`/admin/*`) guarded by role checks?
3. **Input Validation & Sanitization:**
   - Are all request payloads validated via DTOs and class-validator?
   - Are HTML tags sanitized in user-generated text (posts, chat messages)?
4. **Media Upload Security:**
   - Are file MIME types and sizes validated before generating presigned R2 URLs?
   - Is direct execution of uploaded media prevented?
5. **Secrets Hygiene:**
   - Run `git status` and `git diff` to ensure no `.env` or credential files are staged.
