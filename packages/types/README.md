# packages/types — CIRCLE Shared Type Contracts

Single Source of Truth for TypeScript interfaces, DTO schemas, Enum definitions, Socket event payloads, and API response models shared across `apps/api`, `apps/web`, and `apps/mobile`.

## Package Contents
- `dtos/`: Request and response validation contracts
- `entities/`: Domain models (User, Circle, Channel, Message, Post, Reaction, Report)
- `socket-events/`: Typed Socket.IO event maps for server-to-client and client-to-server
- `webrtc/`: Signaling payloads (SDP offer/answer, ICE candidate, call states)
- `enums/`: Role types, Channel types, Notification types, Moderation statuses
