# apps/mobile — CIRCLE Mobile Application

Native cross-platform mobile application for Android and iOS built with **React Native**, **Expo**, **TypeScript**, and **NativeWind / Tailwind CSS**.

## Core Architecture
- **Framework:** React Native + Expo (EAS Build / Managed Workflow with config plugins)
- **Navigation:** Expo Router (File-based navigation)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Realtime & Calling:** Socket.IO Client + `react-native-webrtc` (native WebRTC streaming)
- **Local Storage:** SecureStore (JWT storage) + MMKV (fast key-value cache)
- **Push Notifications:** Expo Push Notifications

## Directory Layout
```text
apps/mobile/
├── app/
│   ├── (auth)/             # Mobile Auth screens (Login, Register, OTP)
│   ├── (tabs)/             # Main tab navigator (Feed, Circles, Messages, Profile)
│   ├── circle/[id]/        # Mobile Circle detail & channel screens
│   ├── chat/[id]/          # Mobile Direct chat screen
│   └── call/[id]/          # Mobile WebRTC call stage (Audio/Video)
├── src/
│   ├── components/         # Mobile native UI components
│   ├── hooks/              # Mobile hooks (useSocket, useWebRTCMobile, usePush)
│   ├── stores/             # Zustand stores
│   └── services/           # Mobile API client & audio/camera device manager
└── assets/                 # App icons, splash screens, fonts
```

## Quick Commands
```bash
npm install
npx expo start       # Start Expo Dev Server
npx expo run:android # Run on Android Emulator/Device
npx expo run:ios     # Run on iOS Simulator
```
