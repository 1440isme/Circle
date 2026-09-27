# CIRCLE — Site & Mobile App Map & Feature Coverage

> **Living document:** Tracks all Web pages (including integrated Admin) and Mobile screens, features, and test coverage status.
> **Legend:** ✅ Tested | ⚠️ Partial | ❌ Not tested | 🚧 WIP

---

## 🌐 Web Application (`apps/web`)

### 1. 🏠 Landing & Auth (`/`, `/login`, `/register`)
**Route:** `src/app/(auth)/`
**Description:** Public entry points, authentication, onboarding.

| Feature | Description | Web Route | Test Status |
|---|---|---|---|
| Landing Hero | Introduction to Circle platform | `/` | 🚧 WIP |
| User Registration | Email + Password + Profile setup | `/register` | ✅ Implemented |
| Email OTP Verification | 6-digit PIN input + activation flow | `/verify-otp` | ✅ Implemented |
| User Login | JWT Access + Refresh Token issuance | `/login` | ✅ Implemented |
| Password Recovery Request | Send OTP to reset password | `/forgot-password` | ✅ Implemented |
| Password Reset Form | 6-digit OTP verification + new password | `/reset-password` | ✅ Implemented |

### 2. 👥 Circles & Channels (`/circle/:id`)
**Route:** `src/app/(circle)/circle/[id]/`
**Description:** Circle space with channel hierarchies, member lists, and role management.

| Feature | Description | Web Route | Test Status |
|---|---|---|---|
| Circle Overview | Feed, pinned posts, announcements | `/circle/:id` | 🚧 WIP |
| Text Channel | Real-time group chat per channel | `/circle/:id/channel/:channelId` | 🚧 WIP |
| Voice/Video Room | WebRTC group audio/video stage | `/circle/:id/room/:roomId` | 🚧 WIP |
| Circle Settings | Roles, permissions, invites, ban list | `/circle/:id/settings` | 🚧 WIP |

### 3. 💬 Direct Messaging (`/messages`)
**Route:** `src/app/(chat)/messages/`
**Description:** 1-on-1 private conversations and direct audio/video calling.

| Feature | Description | Web Route | Test Status |
|---|---|---|---|
| Conversation List | Recent conversations and unread badges | `/messages` | 🚧 WIP |
| 1-on-1 Chat Stage | Real-time messaging, attachments | `/messages/:userId` | 🚧 WIP |
| Direct P2P Call | WebRTC audio/video call stage | `/messages/:userId/call` | 🚧 WIP |

### 4. 🛡️ Integrated Admin Dashboard (`/admin`)
**Route:** `src/app/admin/`
**Description:** Platform moderation, audit trails, and system telemetry. Protected by `ADMIN` / `MODERATOR` role guards.

| Feature | Description | Web Route | Test Status |
|---|---|---|---|
| Executive Overview | Active users, circles count, system health | `/admin` | 🚧 WIP |
| User Management | Search, view profiles, suspend/ban users | `/admin/users` | 🚧 WIP |
| Circle Moderation | Inspect circles, review flagged content | `/admin/circles` | 🚧 WIP |
| Report Resolution | Triage and resolve user violation reports | `/admin/reports` | 🚧 WIP |
| Audit Trail | Immutable system audit log inspection | `/admin/audit-logs` | 🚧 WIP |

---

## 📱 Mobile Application (`apps/mobile`)

### 1. 🔐 Mobile Auth & Onboarding
**Screen Path:** `app/(auth)/`

| Feature | Description | Mobile Screen | Test Status |
|---|---|---|---|
| Mobile Sign In | Biometric / SecureStore token login | `app/(auth)/login` | 🚧 WIP |
| Mobile Register | Mobile registration with avatar upload | `app/(auth)/register` | 🚧 WIP |

### 2. 📑 Main Tabs Navigation
**Screen Path:** `app/(tabs)/`

| Feature | Description | Mobile Screen | Test Status |
|---|---|---|---|
| Feed Tab | Global and circle activity feed | `app/(tabs)/index` | 🚧 WIP |
| Circles Tab | Joined circles drawer and discover list | `app/(tabs)/circles` | 🚧 WIP |
| Messages Tab | Direct chat list with unread counters | `app/(tabs)/messages` | 🚧 WIP |
| Profile Tab | User profile, preferences, settings | `app/(tabs)/profile` | 🚧 WIP |

### 3. 📞 Realtime Calling Stage
**Screen Path:** `app/call/`

| Feature | Description | Mobile Screen | Test Status |
|---|---|---|---|
| Mobile WebRTC Call | Native camera/mic WebRTC stage | `app/call/[id]` | 🚧 WIP |
