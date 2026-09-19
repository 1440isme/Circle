# Skill: Add Mobile Screen

Procedure for adding a new screen or navigation flow to the React Native Expo app (`apps/mobile`).

---

## When to Use
- Building mobile screens for Feed, Circles, Chat, Profile, or Calling.

---

## Steps

1. **File-Based Routing in Expo Router:**
   - Create screen file in `apps/mobile/app/` (e.g. `apps/mobile/app/circle/[id]/index.tsx`).
2. **Styling with NativeWind:**
   - Use Tailwind utility classes via NativeWind.
   - Respect safe areas (`useSafeAreaInsets` from `react-native-safe-area-context`).
3. **Consume Shared Types:**
   - Import DTOs and models directly from `packages/types`.
4. **Hardware & Permissions:**
   - If screen accesses camera/microphone (e.g. WebRTC calls), use Expo permission hooks (`expo-camera`, `expo-av`).
5. **Update SITEMAP:**
   - Add screen and test status to [`.agents/SITEMAP.md`](../../.agents/SITEMAP.md).
