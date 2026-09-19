# Production Deployment Guide

Guide for deploying CIRCLE using Docker, Traefik reverse proxy, and cloud services.

---

## 1. Infrastructure Topology

- **Host Server:** Ubuntu 22.04 LTS (VPS / Cloud VM).
- **Reverse Proxy & SSL:** Traefik container managing Let's Encrypt certificates automatically.
- **Database:** Neon Serverless PostgreSQL.
- **Cache & Pub/Sub:** Upstash Redis.
- **Object Storage:** Cloudflare R2.

---

## 2. Deployment Steps

```bash
# 1. Clone repository on server
git clone https://github.com/1440isme/Circle.git /opt/circle
cd /opt/circle

# 2. Configure production environment
cp .env.example .env.production
nano .env.production

# 3. Build and launch containers
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d
```
