# Chat & Messaging Capabilities

Capabilities for direct 1-on-1 conversations and circle text channels.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-CHAT-01` | Real-time Channel Messaging | Circle Member | Planned |
| `CAP-CHAT-02` | Direct Private Messaging | User | Planned |
| `CAP-CHAT-03` | Message History & Infinite Scroll | Member | Planned |

---

## CAP-CHAT-01 — Real-time Channel Messaging

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Circle Member | Web (`/circle/:id/channel/:chId`) / Mobile | ❌ No | 🚧 WIP |

### Description
As a circle member, I can send and receive real-time messages in text channels with rich text, mentions, and media attachments.

### Acceptance Criteria
- When a member sends a message, it is broadcast via Socket.IO to all users currently in the channel room within 200ms.
- Messages are persisted in PostgreSQL with timestamps and sender metadata.

### API Contract
- `POST /api/v1/channels/:id/messages` (Bearer Auth) → `201 Created`
- Socket Event: `chat:message` → payload `{ id, channelId, content, senderId, createdAt }`
