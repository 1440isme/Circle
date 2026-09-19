# Decisions Memory (ADR Index)

Summary of key Architectural Decision Records (ADRs) recorded in `docs/architecture/ADR/`.

---

- **ADR-001: Modular Monolith over Microservices**
  - *Context:* Need fast iteration, shared transactions, and low deployment complexity for a 2-person team within 19 weeks.
  - *Decision:* Build `apps/api` as a Modular Monolith in NestJS with strict module boundaries rather than distributed microservices.
- **ADR-002: Prisma ORM over TypeORM**
  - *Context:* Type-safe queries, migration predictability, and schema-as-code.
  - *Decision:* Adopt Prisma ORM for PostgreSQL.
- **ADR-003: Integrated Admin Dashboard in Next.js**
  - *Context:* Whether to maintain a separate admin application (`apps/admin`) or co-locate within `apps/web`.
  - *Decision:* Unify Admin under `apps/web/src/app/admin/` with RBAC middleware to maximize component and API client reuse.
- **ADR-004: Cloudflare R2 for Media Storage**
  - *Context:* High bandwidth media uploads (images, audio, video) without unpredictable AWS S3 egress costs.
  - *Decision:* Use Cloudflare R2 with presigned upload URLs.
- **ADR-005: Socket.IO + WebRTC Hybrid Realtime**
  - *Context:* Group text chat requires persistent delivery and message persistence; voice/video requires low latency P2P.
  - *Decision:* Use Socket.IO for chat messaging and as the signaling channel for WebRTC peer connections.
