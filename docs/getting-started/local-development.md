# Local Development Setup

How to set up, configure, and run CIRCLE on your local workstation.

---

## Prerequisites

- **Node.js:** v20.x or higher (LTS)
- **Package Manager:** npm (or pnpm/yarn)
- **Docker & Docker Compose:** For running local PostgreSQL and Redis if not using cloud instances.
- **Expo Go / Android Studio / Xcode:** For mobile testing.

---

## 1. Clone & Environment Configuration

```bash
git clone <repo-url> circle
cd circle
cp .env.example .env
```

Review `.env` and configure your local PostgreSQL database URL, Redis URL, JWT secrets, and Cloudflare R2 credentials.

---

## 2. Install Dependencies

```bash
# Install root & workspace packages
npm install
```

---

## 3. Database Migration & Prisma Client

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev
```

---

## 4. Run Development Servers

In separate terminal tabs:

```bash
# Tab 1: Backend API (NestJS)
npm run start:dev --prefix apps/backend

# Tab 2: Web & Admin Platform (Next.js)
npm run dev --prefix apps/web

# Tab 3: Mobile Application (Expo)
npx expo start --prefix apps/mobile
```

---

## 5. Verify Setup

- API Swagger docs: `http://localhost:4000/api/docs`
- Web Application: `http://localhost:3000`
- Integrated Admin: `http://localhost:3000/admin`
- Agent Integrity Check: `./scripts/check-agent-map.sh`
