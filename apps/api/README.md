# apps/api — CIRCLE Backend Service (Alias / Equivalent to apps/backend)

Modular Monolith backend service for CIRCLE built with **NestJS**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Redis**.

> **Canonical Location:** See [`apps/backend/`](../backend/) for the full codebase and specialized backend documentation ([`apps/backend/docs/`](../backend/docs)).
> Per `PROJECT_GOD.md` Section 17, `apps/api` and `apps/backend` are synonymous names for this backend service.

## Core Architecture
- **Framework:** NestJS (Modular Monolith architecture)
- **Database ORM:** Prisma ORM connected to PostgreSQL (Neon)
- **Caching & Ephemeral Pub/Sub:** Redis (Upstash)
- **Realtime Gateway:** Socket.IO Gateway for chat, presence, notifications, and WebRTC signaling
- **Authentication:** JWT Access Token + Refresh Token Rotation with device fingerprinting
- **Storage Adapter:** Cloudflare R2 S3-compatible Object Storage

## Quick Commands
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
npm test
```
