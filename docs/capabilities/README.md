# CIRCLE Capability Catalog

A code-grounded catalog of what CIRCLE does, organized into **clusters** of related capabilities. Each cluster is one file; each capability within a file follows a rigorous 8-section template so the catalog doubles as a verifiable specification and acceptance reference.

> **Source of Truth:** The implementation code. This catalog reflects reality; planned capabilities are marked *roadmap*.

---

## Capability Clusters

| Cluster | Focus | File |
|---|---|---|
| **Identity & Access** | Authentication, JWT, Refresh Token Rotation, RBAC | [`identity-access.md`](identity-access.md) |
| **Circles & Membership** | Circle creation, invite codes, roles, channels | [`circles-membership.md`](circles-membership.md) |
| **Chat & Messaging** | Direct & channel messaging, threads, read receipts | [`chat-messaging.md`](chat-messaging.md) |
| **Realtime & Calls** | WebRTC 1-on-1 and group voice/video calling | [`realtime-calls.md`](realtime-calls.md) |
| **Feed & Posts** | Circle posts, rich media, comments, reactions | [`feed-posts.md`](feed-posts.md) |
| **Media & Storage** | Cloudflare R2 uploads, presigned URLs, optimizations | [`media-storage.md`](media-storage.md) |
| **Moderation & Admin** | Content moderation, user bans, audit logs, reports | [`moderation-admin.md`](moderation-admin.md) |

---

## Standard Capability Template

Every capability follows this structure:

```markdown
## CAP-<CLUSTER>-NN — <Title>

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| <user/admin/member/guest> | <Page / Screen Name> (`/route`) | ✅ Yes / ❌ No | ✅/⚠️/❌ <N> cases |

### Description
As a <role>, I can <action> so that <value>.

### Acceptance Criteria
- When a <actor> <performs action> at <Location>, they see / get <result>.

### API Contract
- `<METHOD> /api/v1/...` (auth gating) → `<status>` <body>

### Quality Control
- Steps to manually verify in UI.

### Security
- Auth, RBAC, input sanitization, risks & mitigations.

### Data Processing & Retention
- Stored data, retention policy, encryption.
```
