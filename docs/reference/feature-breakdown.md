# Feature Breakdown Reference

Comprehensive feature mapping from Epics to User Stories across CIRCLE modules.

---

## 1. EPIC-AUTH: Authentication & Identity
- `US-AUTH-001`: User registration with email/password and verification.
- `US-AUTH-002`: Secure login with dual-token issuance and rotation.
- `US-AUTH-003`: User logout and session invalidation.

## 2. EPIC-CIRCLE: Community Spaces & Roles
- `US-CIRCLE-001`: Circle creation, handle reservation, and privacy toggles.
- `US-CIRCLE-002`: Circle invite codes and link generation.
- `US-CIRCLE-003`: Member role management (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`).

## 3. EPIC-CHAT: Messaging & Realtime
- `US-CHAT-001`: Real-time text channel messaging with Socket.IO.
- `US-CHAT-002`: Direct 1-on-1 private messaging.
- `US-CHAT-003`: Message attachments with Cloudflare R2 presigned URLs.

## 4. EPIC-RTC: Voice & Video Calling
- `US-RTC-001`: 1-on-1 direct audio/video calling via WebRTC.
- `US-RTC-002`: Circle voice lounge room participation.

## 5. EPIC-ADMIN: Administration & Moderation
- `US-ADMIN-001`: Content report queue triage.
- `US-ADMIN-002`: User ban, suspension, and permission revocation.
- `US-ADMIN-003`: System telemetry and immutable audit logs.
