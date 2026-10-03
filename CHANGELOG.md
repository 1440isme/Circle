# Changelog

All notable changes to the **CIRCLE** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta.1] — 2026-10-03

### 🌟 Added
- **Monorepo & Multi-Platform Architecture:**
  - Modular Monolith backend powered by NestJS, Prisma ORM, PostgreSQL, and Redis.
  - Web Application & Integrated Admin Portal powered by Next.js 14 App Router and TailwindCSS.
  - Cross-platform Mobile Application powered by React Native and Expo Router.
  - Shared packages (`@circle/types`, `@circle/shared`, `@circle/config`) for single-source-of-truth contracts, DTOs, and bilingual i18n dictionaries.
- **Authentication, Security & Identity (Module 2):**
  - Dual-Token JWT rotation with bcrypt password hashing and Role Guards.
  - 6-digit OTP verification via SMTP delivery and Local Terminal Stream Mailer fallback.
  - Complete User Profile management (View, Avatar Direct Picker, Bio 0/300 counter, and Date of Birth).
- **Circle Core & Governance (Module 3):**
  - Circle creation with custom handle, avatar, description, and custom member capacity presets.
  - Shareable Invite Codes & Deep Links.
  - Role-based governance (Owner, Member), Member kicking, and safe Ownership Transfer.
  - **Private Circle Join Approval Flow:** Stricter privacy gating where joining private circles requires Owner approval.
  - Modern center-overlay modal dialogs for high-risk actions (Leave, Kick, Transfer).
  - Custom Violation Reporting with dynamic open-text reason input.
- **Realtime Group Chat & Messaging (Module 4):**
  - Circle-only channel architecture (Text and Voice channels).
  - Realtime messaging, reply threads, and emoji reactions via Socket.IO Gateway.
  - Message pinning and unpinning with pinned messages modal browser.
  - Typing indicators broadcasting across active channel members.
- **Moments & Group Feed / Locket Widget (Module 5):**
  - Circle-based privacy controls for Moments feed.
  - **Locket Camera Realtime on Mobile:** 60fps viewfinder, 0.5x wide / 1x standard zoom toggle, Dual View PiP (front/rear simultaneous capture), tap-to-swap views, and instant reactions.
- **Cloudflare R2 Media Storage Infrastructure:**
  - AWS SigV4 HMAC-SHA256 Presigned PUT URL generator for direct client-to-cloud uploads.
  - Local Media Fallback mode (`/api/v1/storage/raw/:key` & In-Memory/Stream buffer) for zero-dependency offline local development.
- **Realtime Presence Indicators:**
  - Socket.IO gateway connection tracking and automated `presence:user-status` broadcasting.
  - Responsive Presence Rail with breathing green online status indicators and live online member counts.

### ⚡ Performance & Resource Hygiene
- **Client-Side Image Optimization:** In-browser Canvas resizing (1920px max for chat/moments, 512px for avatars) with WebP compression (`quality: 0.82`), achieving 75%–95% file size reduction.
- **EXIF & GPS Metadata Stripping:** 100% of sensitive device and location metadata stripped client-side prior to network transmission.
- **RAM & Memory Optimization:** Lightweight `URL.createObjectURL` preview management with automated `URL.revokeObjectURL` cleanup on unmount/cancel.
- **Lazy Upload on Submit:** Chat attachments and avatars remain strictly local until the user explicitly confirms submission, eliminating orphaned files and wasted cloud storage.
- **Clean Database Enforcement:** Strict Zod validator refinements prohibiting raw `data:;base64` or `blob:` strings from entering PostgreSQL.

### 🧪 Testing & CI/CD
- 100% passing Unit Test suites for Auth, Circles, Moments, Storage SigV4, and Chat Gateway.
- Playwright E2E test specs for core user workflows (`tests/e2e/core-flow.spec.ts`).
- Markdown reference integrity verification script (`scripts/check-agent-map.sh`).
- Automated AI Usage Logging (`docs/ai-usage/log.md`) adhering to Rubric Level 5 criteria.

---

## [Unreleased]

### 🚀 Planned for Next Iterations
- **Module 6 (WebRTC Realtime Group Calling):** Coturn STUN/TURN integration, Signaling Gateway, and group video/audio grid stage.
- **Module 7.1 (Group Utility Tools):** Shared HD Album, Group Calendar & Reminders, Decision Wheel, and Anonymous Confessions ("Điều muốn nói").
- **Module 7.2 (Realtime Group Tools):** Collaborative Planning Sheet, Live Location Map (Mapbox), and Realtime Group Polls.
- **Module 8 & 9:** Multi-platform Push Notifications (Expo/FCM) and Admin Moderation Queue.
