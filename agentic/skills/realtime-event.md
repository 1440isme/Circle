# Skill: Realtime Event

Procedure for adding Socket.IO realtime events for chat, presence, notifications, or signaling.

---

## When to Use
- Adding a new real-time message, status broadcast, or client-server socket event.

---

## Steps

1. **Define Event Types:**
   - Define payload interface in `packages/types/socket-events/`.
2. **Server Gateway Implementation (`apps/api`):**
   - Register event handler in `apps/api/src/modules/realtime/realtime.gateway.ts`.
   - Validate client JWT authentication on handshake.
   - Use room scoping: `client.to(`channel:${channelId}`).emit(event, data)`.
3. **Web Client Listener (`apps/web`):**
   - Attach listener in `useChatSocket` or `useCircleSocket`.
   - Clean up listeners on unmount (`socket.off(event)`).
4. **Mobile Client Listener (`apps/mobile`):**
   - Attach listener in mobile socket service.
