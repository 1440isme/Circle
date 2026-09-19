# apps/backend — CIRCLE Backend Service

Modular Monolith backend service for CIRCLE built with **NestJS**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Redis**.

> **Note:** In codebase documents and `PROJECT_GOD.md`, `apps/backend` is also referred to interchangeably as `apps/api`. Both refer to this exact same service.

## Core Architecture
- **Framework:** NestJS (Modular Monolith architecture)
- **Database ORM:** Prisma ORM connected to PostgreSQL (Neon)
- **Caching & Ephemeral Pub/Sub:** Redis (Upstash)
- **Realtime Gateway:** Socket.IO Gateway for chat, presence, and WebRTC signaling
- **Authentication:** JWT Access Token + Refresh Token Rotation
- **Storage Adapter:** Cloudflare R2 S3-compatible Object Storage

## Directory Layout
```text
apps/backend/
├── docs/                   # Backend-specific architecture & deep-dives (AutoWRX style)
│   ├── authentication.md   # JWT, token rotation, and RBAC guards
│   ├── db-models.md        # Prisma models, relations, and indexing
│   ├── middlewares.md      # Interceptors, filters, and validation pipes
│   └── realtime-gateway.md # Socket.IO gateway and WebRTC signaling
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & token rotation
│   │   ├── users/          # User profiles and relationships
│   │   ├── circles/        # Circle spaces, channels, and roles
│   │   ├── chat/           # Direct and channel messaging
│   │   ├── realtime/       # Socket.IO gateway & WebRTC signaling
│   │   ├── posts/          # Feed posts, comments, reactions
│   │   ├── media/          # Cloudflare R2 presigned URLs
│   │   └── admin/          # Platform moderation & audit logs
│   ├── common/             # Interceptors, filters, guards, decorators
│   ├── database/           # Prisma service and seed scripts
│   └── main.ts             # Application entrypoint
├── prisma/
│   ├── schema.prisma       # Canonical Prisma database schema
│   └── migrations/         # PostgreSQL migration history
└── test/                   # Jest e2e & integration test suites
```

## Quick Commands
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
npm test
```
