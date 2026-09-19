# Backend Database Models & Schemas

Prisma schema design and PostgreSQL storage architecture for CIRCLE.

---

## Core Models

- **User:** Primary user account, hashed credentials, avatar, bio, global role (`USER`, `ADMIN`).
- **Circle:** Group space with visibility (`PUBLIC`, `PRIVATE`), owner, channel list, member list.
- **CircleMember:** Join table with composite key `(circleId, userId)` and circle role (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`).
- **Channel:** Text or voice channel within a circle (`TEXT`, `VOICE`).
- **Message:** Chat message with content, sender, channel, attachments, reply reference.
- **Post:** Social feed post with text, image URLs, circle tag, author.
- **Comment & Reaction:** Interactivity on posts and messages.
- **Report & AuditLog:** Moderation queue items and immutable administrator action trails.

---

## Indexing Strategy

- Composite indexes on `(circleId, createdAt desc)` for fast channel message pagination.
- Unique index on `CircleMember(circleId, userId)` to prevent duplicate memberships.
- Soft-delete column `deletedAt` indexed for active record queries.
