# Skill: Deploy

Deployment workflow for staging and production environments using Docker, Traefik, and VPS.

---

## When to Use
- Deploying releases to staging or production.
- **Rule:** Never deploy unless explicitly instructed by the project lead or user.

---

## Steps

1. **Verify Artifacts:**
   - Confirm all CI checks passed on `main` or `develop`.
   - Confirm environment variables are populated on the host server (`.env.production`).
2. **Build & Package:**
   ```bash
   # Build container images
   docker compose -f docker-compose.prod.yml build
   ```
3. **Database Migration:**
   ```bash
   # Run Prisma migrations safely
   docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
   ```
4. **Deploy Containers:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
5. **Health Checks:**
   - Verify Traefik reverse proxy routing: `curl -I https://api.circle.example.com/health`
   - Verify WebSocket handshake.
   - Verify web landing page: `curl -I https://circle.example.com`
6. **Log Deployment in Evidence:**
   - Record the deployment timestamp and commit hash into `docs/evidence/deployment-logs.md`.
