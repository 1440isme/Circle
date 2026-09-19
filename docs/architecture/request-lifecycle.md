# Request Lifecycle Traces

End-to-end request tracing and execution lifecycle across CIRCLE.

---

## 1. REST API Request Trace (`POST /api/v1/channels/:id/messages`)

1. **Client (Web / Mobile):** Sends HTTP POST with Bearer JWT and payload `{ content, attachments }`.
2. **Reverse Proxy (Traefik):** Verifies TLS certificate, terminates SSL, attaches `X-Forwarded-For`, proxies to `backend:4000`.
3. **NestJS Middlewares:**
   - Helmet sets HTTP security headers.
   - CORS middleware verifies allowed origins.
4. **Guards:**
   - `JwtAuthGuard`: Decodes JWT, validates signature against `JWT_ACCESS_SECRET`, sets `req.user`.
   - `CircleMemberGuard`: Queries Redis cache to verify `req.user.id` is an active member of the circle that owns `channelId`.
5. **Pipes:** `ValidationPipe` validates `CreateMessageDto` fields against class-validator constraints.
6. **Controller:** `ChatController.sendMessage()` calls `ChatService.sendMessage()`.
7. **Service Execution:**
   - Validates channel exists.
   - `PrismaService.message.create()` writes record to PostgreSQL.
   - Dispatches socket broadcast event via `RealtimeGateway.server.to(`channel:${id}`).emit('chat:message', newMessage)`.
8. **Response Serialization:** Global `TransformInterceptor` wraps response in standardized envelope `{ success: true, data: newMessage }`.
