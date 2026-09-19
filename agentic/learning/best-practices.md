# Best Practices in CIRCLE

Proven engineering patterns discovered and established across the 19 weeks of development.

---

## 1. Backend & Data Access
- **Presigned URLs for Media:** Always generate presigned upload URLs on the backend (`apps/api`) so clients upload directly to Cloudflare R2, keeping large media blobs off API server memory.
- **Index Guarding:** Always add database indexes on foreign keys (`userId`, `circleId`, `channelId`) and sorting timestamps (`createdAt desc`).
- **Prisma Transactions:** Wrap multi-table write operations (e.g., creating a circle + assigning the creator as owner in membership table) inside `prisma.$transaction`.

---

## 2. Frontend Web & Mobile
- **Optimistic UI Updates:** For chat message delivery and post reactions, update the local TanStack Query cache optimistically, then roll back if the server/socket rejects.
- **Isolate Socket Listeners:** Keep socket event listeners inside dedicated custom hooks (`useCircleSocket`, `useChatSocket`) rather than scattering them in UI components.
