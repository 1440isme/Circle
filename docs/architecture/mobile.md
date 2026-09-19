# Mobile Architecture Deep-Dive

Technical architecture of the CIRCLE cross-platform mobile application (`apps/mobile/`).

---

## 1. Expo & React Native Framework

- **Framework:** React Native + Expo managed workflow with custom config plugins for native modules.
- **Routing:** Expo Router file-based routing matching the web route hierarchy (`app/(tabs)/`, `app/circle/[id]/`, `app/chat/[id]/`, `app/call/[id]/`).
- **Styling:** NativeWind (Tailwind CSS engine compiled for React Native StyleSheet).

---

## 2. Realtime & Native WebRTC Integration

- **Socket Client:** Native Socket.IO client maintaining persistent connection with automatic reconnect and token refresh logic.
- **Native WebRTC:** `react-native-webrtc` handles native camera/audio capture and hardware-accelerated video rendering.
- **Secure Token Storage:** Hardware keystore integration via `expo-secure-store`.
