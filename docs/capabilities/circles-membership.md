# Circles & Membership Capabilities

Capabilities governing circle spaces, channel creation, invite codes, and community membership management.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-CIRCLE-01` | Circle Creation & Customization | User | Planned |
| `CAP-CIRCLE-02` | Invite Code Generation & Joining | User | Planned |
| `CAP-CIRCLE-03` | Role & Permission Assignment | Circle Owner/Admin | Planned |

---

## CAP-CIRCLE-01 — Circle Creation & Customization

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Authenticated User | Web (`/circle/create`) / Mobile | ❌ No | 🚧 WIP |

### Description
As an authenticated user, I can create a new circle with name, description, and privacy level (Public / Private) so that I can organize a community space.

### Acceptance Criteria
- When a user creates a circle, they are automatically designated as `OWNER`.
- System creates default `#general` text channel and `#lounge` voice room.

### API Contract
- `POST /api/v1/circles` (Bearer Auth) → `201 Created` `{ id, name, handle, role: "OWNER" }`
