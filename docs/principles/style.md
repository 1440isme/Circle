# Styling Architecture & Design Tokens

Design token conventions, theming, and responsive styling in CIRCLE.

---

## 1. Design Token System
Shared tokens are defined in `packages/config/tailwind/tokens.js`:
- **Colors:** Neutral background scales, Brand Primary (Circle Violet), Success (Emerald), Danger (Rose).
- **Typography:** Inter for sans-serif UI typography, JetBrains Mono for code blocks.
- **Spacing Scale:** Standard 4px-based Tailwind scale.

---

## 2. Multi-Platform Consistency
- **Web (`web/`):** Tailwind CSS with Radix UI headless components for accessible modals, dropdowns, and tooltips.
- **Mobile (`mobile/`):** NativeWind mapping Tailwind classes to React Native StyleSheet primitives, ensuring identical color palettes and spacing.
