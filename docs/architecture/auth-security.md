# Auth & Security Architecture Deep-Dive

Authentication, token rotation, authorization, and attack surface mitigation in CIRCLE.

---

## 1. Authentication Strategy

- **Dual-Token System:**
  - **Access Token:** Short-lived JWT (15 minutes), signed with `JWT_ACCESS_SECRET`, carrying user ID and global role.
  - **Refresh Token:** Long-lived cryptographically secure string (7 days), stored hashed with bcrypt in Redis/DB with device fingerprint.
- **Refresh Token Rotation (RTR):**
  - Every token refresh issues a new Access Token AND a new Refresh Token.
  - The old Refresh Token is immediately marked used/revoked.
  - If a revoked token is used again, the server detects token reuse, invalidates all sessions for that account, and forces a password reset/re-login.

---

## 2. Multi-Level Authorization (RBAC)

1. **System Roles:** `ADMIN`, `MODERATOR`, `USER`.
2. **Circle Scoped Roles:** `OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`.
3. **Channel Scoped Permissions:** `READ_MESSAGES`, `SEND_MESSAGES`, `MANAGE_CHANNEL`.

---

## 3. Threat Model & Defenses

- **CSRF:** Avoided by using `Authorization: Bearer` headers instead of ambient cookies for API operations.
- **XSS:** Strict sanitization of user-generated markdown/HTML; HTTP-only secure cookie flags where cookies are used.
- **SQL Injection:** 100% prevented by Prisma ORM parameterized queries.
- **Egress Cost Attacks:** Direct browser-to-Cloudflare R2 uploads via presigned URLs prevent denial-of-service on API server bandwidth.
