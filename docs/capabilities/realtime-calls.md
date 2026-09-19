# Realtime & Calls Capabilities

Capabilities enabling low-latency peer-to-peer and room-based audio and video calling via WebRTC.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-RTC-01` | 1-on-1 Voice & Video Call | User | Planned |
| `CAP-RTC-02` | Circle Voice Room Presence | Circle Member | Planned |

---

## CAP-RTC-01 — 1-on-1 Voice & Video Call

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Authenticated User | Web (`/messages/:userId/call`) / Mobile (`app/call/[id]`) | ❌ No | 🚧 WIP |

### Description
As a user, I can initiate a direct voice or video call to another user with real-time audio/video streaming.

### Acceptance Criteria
- When a user calls a peer, a signaling invitation is sent via Socket.IO.
- Upon acceptance, an `RTCPeerConnection` is negotiated using ICE/STUN/TURN.
- Mute audio and toggle video controls update the media stream tracks in real time.

### API Contract
- Socket Event `rtc:offer` / `rtc:answer` / `rtc:ice-candidate`
