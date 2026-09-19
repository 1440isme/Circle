# CIRCLE — Nền tảng Mạng xã hội Kết nối & Tương tác Nhóm

> **Đề tài Khóa luận Tốt nghiệp Kỹ sư:** Xây dựng nền tảng mạng xã hội kết nối và tương tác nhóm — CIRCLE\
> **Sinh viên thực hiện:** Trương Công Bình (MSSV: 23110184) & Ninh Thị Mỹ Hạnh (MSSV: 23110210)\
> **Giảng viên hướng dẫn:** ThS. Nguyễn Trần Thi Văn\
> **Thời gian thực hiện:** 19 tuần (17/08/2026 – 27/12/2026)\
> **Mục tiêu:** Đạt tiêu chuẩn Level 5 trên tất cả các tiêu chí của Rubric đánh giá.

---

## 🌟 Tổng Quan Dự Án

**CIRCLE** là nền tảng mạng xã hội hiện đại tập trung vào kết nối cộng đồng và tương tác nhóm thời gian thực. Hệ thống hỗ trợ đa nền tảng gồm ứng dụng Web (Next.js), Ứng dụng Di động (React Native + Expo), Backend dịch vụ Modular Monolith (NestJS + Prisma + PostgreSQL + Redis), và hệ thống giao tiếp đa phương tiện thời gian thực (Socket.IO + WebRTC).

---

## 🏗️ Kiến Trúc Công Nghệ

```text
               ┌───────────────────────┐
               │    Cloudflare Edge    │
               └───────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             │   Traefik Reverse Proxy   │
             └─────────────┬─────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  apps/web   │     │apps/backend │     │ apps/mobile │
│  (Next.js)  │     │  (NestJS)   │     │   (Expo)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
 ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
 │ Neon Postgres│    │Upstash Redis│    │Cloudflare R2│
 │   (Prisma)  │    │ (Pub/Sub)   │    │  (Storage)  │
 └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 📂 Bố Cục Thư Mục (Monorepo)

```text
circle/
├── apps/
│   ├── backend/         # NestJS Modular Monolith API, Prisma ORM, Socket.IO
│   │   └── docs/        # Backend architecture & technical deep-dives
│   ├── api/             # Alias trỏ về apps/backend (chuẩn PROJECT_GOD.md)
│   ├── web/             # Next.js Web App & Integrated Admin Dashboard (/admin)
│   └── mobile/          # React Native + Expo Mobile Application
├── packages/
│   ├── types/           # Shared TypeScript contracts, DTOs, socket events
│   ├── shared/          # Shared utilities, validators (Zod), formatters
│   └── config/          # Shared ESLint, Prettier, TypeScript, Tailwind configs
├── agentic/             # AI Coding Framework chuẩn AutoWRX (RULES, skills, memory)
├── .agents/             # Living Sitemaps (Web/Mobile) & Testing Strategy
├── docs/                # Architecture, Principles, Guides, Capabilities, Evidence
└── scripts/             # Integrity & automation scripts (check-agent-map.sh)
```

---

## 🚀 Khởi Chạy Nhanh

Xem hướng dẫn chi tiết tại [Tài liệu Bắt đầu (docs/getting-started/)](./docs/getting-started/README.md).

```bash
# 1. Cài đặt toàn bộ dependencies
npm install

# 2. Sinh Prisma client & chạy migration
cd apps/backend && npx prisma migrate dev

# 3. Khởi chạy server
npm run dev --prefix apps/web          # Web & Admin: http://localhost:3000
npm run start:dev --prefix apps/backend # Backend API: http://localhost:4000
npx expo start --prefix apps/mobile    # Mobile App
```

---

## 📜 Quy Trình & Hiến Pháp Dự Án

Toàn bộ quy trình phát triển, 10 Hard Gates, chu trình kiểm thử, và quản trị chất lượng được quy định nghiêm ngặt tại:
- **[PROJECT_GOD.md](./PROJECT_GOD.md)** — Hiến pháp Single Source of Truth của CIRCLE.
- **[AGENTS.md](./AGENTS.md)** — Entry point điều hành cho kỹ sư và AI Coding Agents.
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Quy chuẩn đóng góp, GitFlow, và Peer Review bắt buộc.
