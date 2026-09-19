# Getting Started: Development Guide

Detailed setup, environment troubleshooting, and daily development workflows.

---

## 1. Local Database & Redis Setup via Docker
If not using cloud instances (Neon / Upstash), spin up local containers:
```bash
docker run -d --name circle-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=circle_dev postgres:16-alpine
docker run -d --name circle-redis -p 6379:6379 redis:7-alpine
```

---

## 2. Common Troubleshooting

### Prisma Connection Timeout
- Ensure `DATABASE_URL` in `.env` has valid credentials and matches host/port.
- Run `npx prisma db push` or `npx prisma migrate reset` in `backend/` for fresh local DBs.

### Web Next.js Port Conflicts
- Default port is 3000. If occupied: `npm run dev -- -p 3001`.
