# Data Model Architecture

PostgreSQL relational database schema, Prisma entities, and relationships in CIRCLE.

---

## Entity Relationship Overview

```text
┌──────────┐       1:N       ┌──────────────┐       N:1       ┌──────────┐
│   User   ├─────────────────┤ CircleMember ├─────────────────┤  Circle  │
└────┬─────┘                 └──────────────┘                 └────┬─────┘
     │                                                             │
     │ 1:N                                                         │ 1:N
┌────▼─────┐                 ┌──────────────┐                 ┌────▼─────┐
│   Post   │                 │   Message    ├─────────────────┤ Channel  │
└────┬─────┘                 └──────┬───────┘       N:1       └──────────┘
     │ 1:N                          │ 1:N
┌────▼─────┐                 ┌──────▼───────┐
│ Comment  │                 │  Attachment  │
└──────────┘                 └──────────────┘
```

---

## Models & Responsibilities

- `User`: Identity, authentication credentials, avatar URL, bio, global role.
- `Circle`: Group space, visibility (`PUBLIC`/`PRIVATE`), vanity URL handle.
- `CircleMember`: Membership join entity carrying circle-specific role (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`).
- `Channel`: Sub-spaces within circles (`TEXT`, `VOICE`).
- `Message`: Chat messages, reactions, replies, and attachments.
- `Post`: Social updates published to circle or global feeds.
- `AuditLog`: Immutable action trail for administrative and moderation actions.
