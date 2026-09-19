# Realtime Signals Architecture

Socket.IO pub/sub, presence tracking, and WebRTC signaling architecture in CIRCLE.

---

## 1. Socket.IO Gateway & Redis Pub/Sub

- **Horizontal Scaling:** Uses `@socket.io/redis-adapter` backed by Upstash Redis.
- **Event Scoping:**
  - `circle:<id>`: Circle-wide member join/leave, role changes, and channel updates.
  - `channel:<id>`: Text chat streaming, typing indicators, read receipts.
  - `user:<id>`: Personal direct message notifications and private call invitations.

---

## 2. WebRTC Audio/Video Signaling

```text
Peer A (Caller)                 Socket.IO Server                Peer B (Callee)
      │                                │                               │
      ├─── rtc:call-user ─────────────►│─── rtc:incoming-call ────────►│
      │                                │                               │
      │◄── rtc:call-accepted ──────────│◄── rtc:accept-call ───────────┤
      │                                │                               │
      ├─── rtc:offer (SDP) ───────────►│─── rtc:offer ────────────────►│
      │                                │                               │
      │◄── rtc:answer (SDP) ───────────│◄── rtc:answer ────────────────┤
      │                                │                               │
      ├─── rtc:ice-candidate ─────────►│─── rtc:ice-candidate ────────►│
      │◄── rtc:ice-candidate ──────────│◄── rtc:ice-candidate ─────────┤
      │                                                                │
      ▼══════════════ Direct P2P Encrypted Media Stream ══════════════▼
```
