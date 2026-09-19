# Visual Layout & Component Concepts

Visual hierarchy and layout standards across CIRCLE web and mobile clients.

---

## 1. Web Layout Architecture (`web/`)
- **Root Layout (`src/app/layout.tsx`):** Provides global providers (TanStack Query, ThemeProvider, ToastProvider).
- **App Shell Layout (`src/app/(main)/layout.tsx`):** Three-column layout:
  - **Left Rail (72px):** Joined circles list and direct messages icon.
  - **Secondary Sidebar (240px):** Channels, members, or conversation threads.
  - **Main Stage (Flexible):** Active feed, chat conversation, or WebRTC call stage.
- **Admin Shell (`src/app/admin/layout.tsx`):** Collapsible admin navigation with metric overview headers.

---

## 2. Mobile Layout Architecture (`mobile/`)
- **Bottom Tabs:** Feed, Circles, Messages, Profile.
- **Header & Modals:** Stack-based navigation for circle channel drill-downs and calling stage overlays.
