# apps/web — CIRCLE Web & Admin Platform

Modern full-stack web application and unified admin dashboard built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**.

## Core Architecture
- **Framework:** Next.js (App Router, Server Components + Client Islands)
- **Styling:** Tailwind CSS + Radix UI primitives
- **State Management:** Zustand stores (`authStore`, `chatStore`, `presenceStore`)
- **Server Cache & Data Fetching:** TanStack Query (React Query)
- **Realtime Client:** Socket.IO Client + WebRTC PeerConnection wrappers
- **Admin Dashboard:** Integrated under `/admin` route group with strict RBAC guards (`ADMIN`, `MODERATOR`)

## Directory Layout
```text
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, Register, Password Reset routes
│   │   ├── (main)/             # Feed, Explore, Profile routes
│   │   ├── (circle)/           # Circle space, Channels, Voice rooms
│   │   ├── (chat)/             # Direct messaging interface
│   │   └── admin/              # Unified Admin Dashboard (/admin/users, /admin/reports, etc.)
│   ├── components/
│   │   ├── ui/                 # Reusable design system primitives
│   │   ├── shared/             # Header, Sidebar, Navigation modals
│   │   ├── circle/             # Circle-specific components
│   │   ├── chat/               # Chat window, message bubble, media preview
│   │   ├── call/               # WebRTC audio/video call stage
│   │   └── admin/              # Audit tables, metric charts, ban dialogs
│   ├── hooks/                  # Custom React hooks (useAuth, useSocket, useWebRTC)
│   ├── stores/                 # Zustand client stores
│   └── lib/                    # API client, socket client, validation schemas
```

## Quick Commands
```bash
npm install
npm run dev      # Next.js dev server on http://localhost:3000
npm run build    # Typecheck & production build
npm run lint     # Next.js ESLint verification
```
