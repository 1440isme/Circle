# Identity & Access Capabilities

Capabilities related to user registration, authentication, token lifecycle, profile management, and role-based access control (RBAC).

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-AUTH-01` | User Registration & Verification | Guest | Planned |
| `CAP-AUTH-02` | Credential Login & Token Rotation | User | Planned |
| `CAP-AUTH-03` | Session Invalidation & Logout | User | Planned |

---

## CAP-AUTH-01 — User Registration & Verification

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Guest | Web (`/register`) / Mobile (`app/(auth)/register`) | ✅ Yes (Email, Name) | 🚧 WIP |

### Description
As a new user, I can register an account with email and password so that I can join circles and communicate with peers.

### Acceptance Criteria
- When a guest submits valid credentials, the system creates a new user record with hashed password (bcrypt) and generates an activation token.
- When an email is already registered, an explicit validation error is returned without exposing user enumeration timing flaws.

### API Contract
- `POST /api/v1/auth/register` (Public) → `201 Created` `{ id, email, username }`

### Security
- Passwords hashed with bcrypt (cost 12).
- Rate limit: 5 registration requests per IP per hour.
