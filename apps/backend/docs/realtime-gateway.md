# Backend Realtime Gateway & Signaling

Socket.IO architecture, room mechanics, and WebRTC signaling pipeline in CIRCLE.

---

## Gateway Architecture

- **Engine:** `@nestjs/platform-socket.io` backed by Redis Adapter for multi-instance horizontal scaling.
- **Connection Handshake:** Client supplies JWT in `auth: { token }`. Gateway verifies token signature and attaches `userId` to socket instance.
- **Room Topology:**
  - `user:<userId>` — Personal notification and direct call signaling stream.
  - `circle:<circleId>` — Member presence and general activity updates.
  - `channel:<channelId>` — Real-time chat messages and typing indicators.
  - `room:<roomId>` — WebRTC group audio/video participants.
- **Signaling Relays:** Events `rtc:offer`, `rtc:answer`, `rtc:ice-candidate` are validated to prevent unauthorized peer injection and forwarded to the designated target socket.
