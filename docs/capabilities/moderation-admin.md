# Moderation & Admin Capabilities

Capabilities for platform moderation, report triage, user suspensions, and audit trail inspection.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-ADMIN-01` | Content Report Triage | Admin / Moderator | Planned |
| `CAP-ADMIN-02` | User Account Suspension & Ban | Admin | Planned |
| `CAP-ADMIN-03` | Audit Log Inspection | Admin | Planned |

---

## CAP-ADMIN-01 — Content Report Triage

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Admin / Moderator | Web Admin (`/admin/reports`) | ⚠️ Partial (Reporter & Target User) | 🚧 WIP |

### Description
As an administrator or moderator, I can review flagged messages, posts, and circles, view the evidence context, and mark reports as resolved or dismiss them.

### Acceptance Criteria
- When an admin views the report dashboard, reports are sorted by severity and timestamp.
- Actioning a report creates an immutable entry in the system audit log.

### API Contract
- `GET /api/v1/admin/reports` (Admin Auth) → `200 OK`
- `PATCH /api/v1/admin/reports/:id/resolve` (Admin Auth) → `200 OK`
