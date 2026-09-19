# Feed & Posts Capabilities

Capabilities supporting social posts, rich media updates, comments, and community interactions.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-FEED-01` | Create & Publish Feed Post | User | Planned |
| `CAP-FEED-02` | Post Comments & Reactions | User | Planned |

---

## CAP-FEED-01 — Create & Publish Feed Post

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Authenticated User | Web (`/feed`) / Mobile (`app/(tabs)/index`) | ❌ No | 🚧 WIP |

### Description
As an authenticated user, I can create a post with text content, images, and circle tag scoping so that friends and circle members can read and interact.

### Acceptance Criteria
- Post is persisted and propagated to follower/circle feeds.
- Supports image attachments via Cloudflare R2 URLs.

### API Contract
- `POST /api/v1/posts` (Bearer Auth) → `201 Created`
