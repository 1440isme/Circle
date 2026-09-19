# Gotchas Memory

Known traps, framework quirks, and subtle pitfalls in CIRCLE. Consult this list before debugging weird behavior.

---

## 1. Database & Prisma (PostgreSQL / Neon)

- **Connection Limits & Pooling:** When connecting to Neon PostgreSQL, always use the pooled connection string (`?pgbouncer=true` or Neon pooled port `5433`) for application queries. Direct connection strings (`5432`) must only be used for migrations (`prisma migrate`).
- **Soft Deletes vs Cascades:** Models with `deletedAt` require filtering in queries (`where: { deletedAt: null }`). Prisma does not automatically filter soft-deleted child relations in cascade operations.
- **BigInt Serialization:** Prisma represents PostgreSQL `BigInt` as JavaScript `BigInt`, which throws `TypeError: Do not know how to serialize a BigInt` when serialized to JSON. Always convert BigInt to string in DTO transforms.

---

## 2. Next.js Web App

- **SSR Socket Connection:** Connecting to Socket.IO inside a Server Component throws `window is not defined`. Always wrap socket connection hooks inside `'use client'` components and run them inside `useEffect`.
- **Hydration Mismatches with Dates:** Formatting relative time on the server (SSR) and client causes hydration mismatch if the system clock or timezone differs. Use client-only mounting guards or ISO format before hydration.

---

## 3. Expo & React Native

- **Native WebRTC in Expo Go:** `react-native-webrtc` includes custom C++ native code and **cannot run inside standard Expo Go**. It requires a custom development client (`npx expo run:android` or EAS development build).
- **SecureStore Size Limit:** `expo-secure-store` has a key-value size limit of 2048 bytes on Android. Store only tokens (`accessToken`, `refreshToken`); never store large user profile objects.

---

## 4. Socket.IO & Realtime

- **Duplicate Event Handlers:** Attaching listeners inside React components without removing them in cleanup (`socket.off(...)`) causes duplicate event executions on component re-render.
- **Socket Token Expiration:** If the JWT access token expires while the socket is connected, the server must reject unauthorized events and trigger a token refresh without abruptly killing the socket transport if possible.
