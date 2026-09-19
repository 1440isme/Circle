# Backend Authentication & Authorization

Deep-dive into the authentication and access control mechanisms of the CIRCLE backend.

---

## Architecture

- **Token Strategy:** Dual-token strategy: short-lived Access Token (JWT, 15m expiry) and long-lived Refresh Token (stored hashed in Redis/DB with device fingerprint, 7d expiry).
- **Rotation Policy:** On every refresh request, the existing refresh token is invalidated and replaced with a new pair. Reuse of an invalidated refresh token triggers immediate revocation of all active sessions for that user.
- **Role-Based Access Control (RBAC):** Roles (`ADMIN`, `MODERATOR`, `USER`) are attached to JWT claims and verified via `@Roles()` decorator and `RolesGuard`.
- **Circle-Scoped Permissions:** Member roles within a circle (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`) are validated via `CircleMemberGuard`.
