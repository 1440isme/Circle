# Master Technical Investigation & Test Plan

**Document ID:** TEST-PLAN-SURVEY-03  
**Date:** 2026-11-09T16:18:00Z  
**Author:** teamwork_explorer_survey_3 (Technical Investigator & Test Planner)  
**Target Platform:** CIRCLE Web Application (`apps/web` on port 3000, NestJS API on port 4000)  
**Execution Driver:** `scripts/brave-ctl.mjs` via `scripts/brave-bridge.mjs` (port 9333) -> Brave DevTools (`127.0.0.1:9222`)  

---

## 1. Executive Summary & Test Infrastructure

### 1.1 Testing Infrastructure Topology
The live automated test suite operates without external Playwright dependencies, driving the running Brave browser session directly through a high-performance Puppeteer WebSocket bridge:

| Service | Host / Port | Role | Verification Command |
|---|---|---|---|
| **Brave Browser** | `127.0.0.1:9222` | Remote debugging instance with active user session | `ss -tulpn \| grep 9222` |
| **Brave Bridge** | `127.0.0.1:9333` | HTTP JSON RPC proxy converting CLI commands to DevTools calls | `ss -tulpn \| grep 9333` |
| **Next.js Web App** | `localhost:3000` | Frontend application serving dynamic SPA Hub & Auth views | `curl -I http://localhost:3000` |
| **NestJS Backend** | `localhost:4000` | Core REST API, WebSockets, and Database operations | `curl -I http://localhost:4000/api` |

### 1.2 Automation API Reference (`scripts/brave-ctl.mjs`)
The control script accepts standardized CLI commands and routes JSON payloads to `http://127.0.0.1:9333`:

```bash
# 1. Query browser pages and active session
node scripts/brave-ctl.mjs status

# 2. Navigate page
node scripts/brave-ctl.mjs navigate "http://localhost:3000"

# 3. Click DOM element by CSS selector
node scripts/brave-ctl.mjs click "button[title='Attach file (max 25MB)']"

# 4. Evaluate arbitrary JavaScript expression in page context
node scripts/brave-ctl.mjs eval "document.title"
node scripts/brave-ctl.mjs eval "document.querySelector('input[type=email]').value = 'abc@abc.com'"

# 5. Capture visual artifact screenshot
node scripts/brave-ctl.mjs screenshot "filename.png"
```

*Note on Typing & Complex Actions:* Because `brave-ctl.mjs` forwards expressions directly to `page.evaluate()` via `eval`, typing and state manipulation are performed cleanly using DOM standard events:
```bash
node scripts/brave-ctl.mjs eval "(() => { const el = document.querySelector('input[type=email]'); el.value = 'abc@abc.com'; el.dispatchEvent(new Event('input', { bubbles: true })); return el.value; })()"
```

---

## 2. Immediate Bug Investigation & Root Causes

### 2.1 R1 Bug A: Create Poll Modal Layout Distortion
- **Location:** `apps/web/src/components/chat/CreatePollChatModal.tsx` rendered inside `apps/web/src/components/chat/ChatComposer.tsx` (line 694).
- **Direct Observation:**
  When triggered via the composer plus button -> "Create Poll", the overlay has bounding rect `y: 849px, height: 76px, width: 1056px`, despite having `fixed inset-0`.
- **Root Cause Analysis:**
  Ancestor `<div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center ... backdrop-blur-[2px]">` in `ChatComposer.tsx` (line 419) applies `backdrop-filter: blur(2px)`.
  **CSS Specification Standard:** Any element with a CSS `transform`, `filter`, `backdrop-filter`, or `perspective` creates a new containing block for all its descendants, including elements styled with `position: fixed`.
  Consequently, `CreatePollChatModal`'s `fixed inset-0` modal overlay is trapped inside the 76px tall chat input bar instead of covering the viewport (1920x925), distorting and severely clipping the 448px tall modal dialog.
- **Recommended Remediation:**
  1. Render `CreatePollChatModal` with React Portal (`createPortal(modal, document.body)`), OR
  2. Lift `CreatePollChatModal` out of `ChatComposer.tsx` into `ChannelChatView.tsx` or `page.tsx` outside of `backdrop-blur` containers.

### 2.2 R1 Bug B: Widespread Dark Theme Display & Contrast Defects
- **Direct Observation:**
  Inspection of `apps/web/src/components/tools/CirclePollView.tsx`, `CirclePlanningView.tsx`, `LanguageSwitcher.tsx`, etc., revealed numerous unrendered or mismatched dark mode classes:
  - `dark:border-circle-dark-border`
  - `dark:bg-circle-dark-bg`
  - `dark:hover:bg-circle-dark-hover`
  - `dark:bg-circle-dark-card`
- **Root Cause Analysis:**
  In `apps/web/tailwind.config.ts`, the configured colors under `circle.dark` are:
  `canvas`, `surface`, `elevated`, `warm`, `hairline`, `text`, `muted`, `wash`, `primary`.
  There are **NO** definitions for `border`, `bg`, `hover`, or `card`!
  Tailwind silently fails to generate CSS rules for non-existent token names. As a result, elements fall back to light mode colors (`bg-white`, `border-gray-200`) or become transparent, causing illegible text and broken contrast in Dark mode.
- **Recommended Remediation:**
  1. Update `tailwind.config.ts` or replace invalid token references with standard tokens (`dark:bg-circle-dark-surface`, `dark:border-circle-dark-hairline`, `dark:hover:bg-circle-dark-elevated`).
  2. Enforce neutral background tokens and proper dark text tokens (`dark:text-circle-dark-text`, `dark:text-circle-dark-muted`).

---

## 3. Application Structure & Clickable Interaction Inventory

### Module 01: Account & Auth
- **Views:**
  - Login: `/login`
  - Registration: `/register`
  - Password Reset Request: `/forgot-password`
  - OTP Verification: `/verify-otp`
  - Password Reset Form: `/reset-password`
  - Profile Management: `EditProfileModal` (triggered from Header user dropdown)
  - Sessions Management: `SystemSettingsModal` -> Sessions Tab
- **Clickable Elements & Triggers:**
  - `input[type="email"]`, `input[type="password"]`
  - Password visibility toggles (`Eye` / `EyeOff` icons)
  - `button[type="submit"]` (Login, Register, Send OTP)
  - Links: `href="/forgot-password"`, `href="/login"`, `href="/register"`
  - Avatar preset buttons in `EditProfileModal`
  - Revoke session button (`useRevokeSessionMutation`)
  - Revoke all other sessions button (`useRevokeOtherSessionsMutation`)
  - Logout button (`useLogoutMutation`)
- **Key Validation Criteria:**
  - Dual-token JWT issuance (access token 15m, refresh token 7d)
  - Account unactivated redirects to `/verify-otp?email=...&from=login`
  - Strong password validation indicator (length >= 8, uppercase, lowercase, digit, special character)

### Module 02: Circles & Members
- **Views:**
  - Circle Switcher: `Sidebar.tsx` (top section)
  - Home Hub Grid: `FeedStream.tsx` (when `activeCircle === null`)
  - Create Circle Modal: `CreateCircleModal.tsx`
  - Join Circle Modal: `JoinCircleModal.tsx`
  - Member Rail: `PresenceRail.tsx`
  - Circle Settings & Management: `CircleManagementModal.tsx` (Tabs: `chatInfo`, `members`, `privacySupport`, `circleSettings`, `supportReports`)
- **Clickable Elements & Triggers:**
  - Circle Switcher dropdown trigger (`button` with `ChevronDown`)
  - Circle card click -> sets `activeCircle`
  - "+ Create New Circle" button (`setCreateModalOpen(true)`)
  - "Join with Code" button (`setJoinModalOpen(true)`)
  - "Copy Link" button (`handleCopyLink` -> `/@handle`)
  - Circle Settings gear button -> opens `CircleManagementModal`
  - Member nickname edit pencil icon -> `useUpdateMemberNicknameMutation`
  - Transfer ownership button -> `useTransferOwnershipMutation` (Owner only)
  - Remove member button (`useRemoveMemberMutation`)
  - Leave circle button (`useLeaveCircleMutation`)
  - Review join requests: Approve (`APPROVE`) / Reject (`REJECT`) buttons
  - Circle privacy mode radio toggle (PUBLIC / PRIVATE / INVITE_ONLY)
  - Delete circle button with confirmation dialog

### Module 03: Channels & Realtime Chat
- **Views:**
  - Channel Chat Feed: `ChannelChatView.tsx`
  - Message Bubble: `MessageBubble.tsx`
  - Chat Composer: `ChatComposer.tsx`
  - Pinned Messages: `PinnedMessagesModal.tsx`
  - Clear Chat History: `ClearChatModal.tsx`
- **Clickable Elements & Triggers:**
  - Composer Textarea (`input` / `textarea`) with Enter to send
  - Composer Action Plus Button (`+`) -> opens action menu:
    - Attach file (file input)
    - Create Poll (`setIsCreatePollOpen(true)`)
    - Send current location
  - Composer Sticker/Emoji button -> opens `FullEmojiPickerModal`
  - Composer Voice Record button -> toggles voice recording
  - Message bubble click -> toggles timestamp display on top
  - Message quick reactions: `👍`, `❤️`, `😂`, `🔥`, `🎉`
  - Message bubble More Actions menu (`MoreVertical`):
    - Reply -> loads quote banner into composer
    - Edit message (if sender is me and within allowed edit window)
    - Recall message (if sender is me)
    - Copy text to clipboard
    - Pin message (`usePinMessageMutation`)
    - Delete for me (`useDeleteForMeMutation`)
  - Header search icon -> opens search bar filter
  - Header pin icon -> opens `PinnedMessagesModal`
  - Header start audio/video call buttons -> triggers `initiateCallMutation`

### Module 04: Posts & Feed (Daily Moments)
- **Views:**
  - Daily Moments Feed: `DailyMomentsFeed.tsx`
  - Moments Tray: `MomentsTray.tsx`
  - Camera Capture Modal: `CreateMomentModal.tsx`
  - Story Viewer Modal: `StoryViewerModal.tsx`
  - Places Map: `MomentPlacesMap.tsx`
- **Clickable Elements & Triggers:**
  - "+ New Moment" camera pill button -> opens `CreateMomentModal`
  - Camera switch mode (PHOTO / VIDEO / GIF)
  - Flip camera button (User / Environment facing)
  - Capture shutter button -> captures canvas blob
  - Retake button / Send button
  - Story Tray avatar click -> opens `StoryViewerModal`
  - Story viewer reaction emojis and comment composer
  - "Places Map" button -> toggles map view with geotagged moments

### Module 05: Direct Invitations / Onboarding
- **Views:**
  - Direct invite link handling: `/@handle`
  - Join Circle modal: `JoinCircleModal.tsx`
  - Join requests queue in `CircleManagementModal` (requests sub-tab)
- **Clickable Elements & Triggers:**
  - Invite Code input: automatic uppercase normalization, alphanumeric filtering
  - Submit Join Code button (`useJoinCircleMutation`)
  - Pending approval notification banner (when circle requires owner review)
  - Owner Approve (`APPROVE`) / Reject (`REJECT`) buttons with badge counter

### Module 06: Events & Calendar
- **Views:**
  - Circle Calendar: `CircleCalendarView.tsx`
  - Date & Time Picker: `CustomDateTimePicker.tsx`
  - Location Search: `LocationSearchInput.tsx` (Mapbox Geocoding)
  - Calendar Chat Embed: `CalendarEventChatEmbed.tsx`
- **Clickable Elements & Triggers:**
  - Calendar month navigation: `ChevronLeft` / `ChevronRight`
  - Month/Year selector dropdown with wheel picker
  - Date grid cell click -> selects `selectedDate`
  - "+ New Event" button -> opens create event modal
  - Event title, description, and reminder minutes inputs
  - Location input with Mapbox autocomplete suggestions
  - Inline RSVP buttons on events and chat messages:
    - `Going` (`YES`)
    - `Maybe` (`MAYBE`)
    - `Can't go` (`NO`)
  - Edit event / Delete event / Cancel event action buttons

### Module 07: Notifications & Settings
- **Views:**
  - Header Notification Bell (static indicator)
  - Header User Dropdown
  - System Settings Modal: `SystemSettingsModal.tsx`
    - Appearance Tab (Theme, UI Style, Chat Bubble Theme)
    - Security Tab (Change Password)
    - Sessions Tab (Device list, Revoke)
    - Language Tab (VI / EN)
    - Help Tab (Shortcuts, FAQ)
- **Clickable Elements & Triggers:**
  - Header avatar button -> toggles dropdown menu
  - "User Profile" -> opens `EditProfileModal`
  - "System Settings" -> opens `SystemSettingsModal`
  - Theme toggles: `Light`, `Dark`, `System`
  - UI Style toggles: `Flat Design`, `Liquid Glass`
  - Message bubble theme color pills (Sage, Mint, Sky, Coral, Lavender)
  - Language options: `Tiếng Việt` / `English`
  - Change password form inputs & submit button

### Module 09: Admin Dashboard (Status: 🚧 WIP / 404)
- **Investigation Finding:**
  - Header includes `<Link href="/admin">` for users with `globalRole === 'ADMIN'`.
  - However, `apps/web/src/app/admin` directory does NOT exist.
  - Navigating to `/admin` renders the Next.js `404: This page could not be found.` page.
  - Testing status: Documented as 🚧 WIP in accordance with `.agents/SITEMAP.md` and `agentic/playbooks/09-admin-moderation.md`.

---

## 4. Master Test Plan Matrix

| ID | Module | Feature / Interaction | Expected UI/UX Behavior | Contrast & Dark Mode Check | i18n VI / EN Check | Verification CLI Command |
|---|---|---|---|---|---|---|
| **TC-001** | M01 | Login with valid credentials (`abc@abc.com`) | Dual-token issued, redirects to Home Hub | Legible inputs, `dark:bg-circle-dark-canvas` | "Đăng nhập" / "Log in" | `node scripts/brave-ctl.mjs navigate "http://localhost:3000/login"` |
| **TC-002** | M01 | Login with invalid credentials | Inline API error banner with alert icon | High-contrast coral banner | "Đăng nhập thất bại" / "Login failed" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-003** | M01 | Open Profile Modal (`EditProfileModal`) | Modal opens centered, loads user details | Modal surface `dark:bg-circle-dark-surface` | "Hồ sơ cá nhân" / "User Profile" | `node scripts/brave-ctl.mjs eval "document.querySelectorAll('header button')[1].click()"` |
| **TC-004** | M01 | Edit Display Name & Handle | Input accepts text, saves on Submit | Input border `dark:border-circle-dark-hairline` | "Lưu thay đổi" / "Save changes" | `node scripts/brave-ctl.mjs screenshot "profile_modal.png"` |
| **TC-005** | M01 | View Active Sessions (`SystemSettingsModal`) | Lists current & other active devices | Device pills contrast against dark bg | "Phiên đăng nhập" / "Devices & Sessions" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-006** | M02 | Circle Switcher Dropdown | Expands list of joined circles | Dropdown background `dark:bg-circle-dark-surface` | "Nhóm của bạn" / "Your Circles" | `node scripts/brave-ctl.mjs eval "document.querySelector('aside button').click()"` |
| **TC-007** | M02 | Switch active circle | Updates central feed & presence rail | Smooth transition, no layout flicker | Correct circle name & handle | `node scripts/brave-ctl.mjs eval "document.querySelectorAll('.animate-in button')[0].click()"` |
| **TC-008** | M02 | Copy Circle Link (`/@handle`) | Copies URL to clipboard, triggers alert | Alert text clear, no truncated toast | "Đã sao chép liên kết" / "Link copied" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Copy\"]').click()"` |
| **TC-009** | M02 | Open Create Circle Modal | Opens modal with form inputs | Background backdrop blur, dark surface | "Tạo nhóm mới" / "Create New Circle" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Create\"]').click()"` |
| **TC-010** | M02 | Open Circle Settings Modal | Modal opens with 5 tabs, default active | Tab active indicator visible in Dark mode | "Cài đặt nhóm" / "Circle Settings" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Settings\"]').click()"` |
| **TC-011** | M02 | View Member Roster in Presence Rail | Displays avatars, roles, online status | Emerald pulse dot visible on dark surface | "Thành viên" / "Members" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-012** | M03 | Send Text Chat Message | Appends bubble immediately, plays chime | Sender bubble `msg-bubble-me` token | "Gửi tin nhắn" / "Send message" | `node scripts/brave-ctl.mjs eval "document.querySelector('textarea').value = 'Hello'; ..."` |
| **TC-013** | M03 | Trigger Plus Action Menu in Composer | Popover displays: Attach, Poll, Location | Popover card `dark:bg-circle-dark-surface` | "Đính kèm tệp" / "Attach file" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Attach\"]').click()"` |
| **TC-014** | M03 | **Open Create Poll Modal from Plus Menu (R1 Fix)** | Modal centered in viewport, NOT clipped | Modal dark surface, legible inputs | "Tạo cuộc bình chọn" / "Create Poll" | `node scripts/brave-ctl.mjs eval "document.querySelectorAll('.animate-in button')[1].click()"` |
| **TC-015** | M03 | Submit Poll in Chat | Poll card renders with voting options | Card background `dark:bg-circle-dark-surface` | "Bình chọn" / "Vote" | `node scripts/brave-ctl.mjs screenshot "chat_poll_card.png"` |
| **TC-016** | M03 | Vote on Chat Poll Option | Vote percentage bar updates animates | Percentage bar visible against dark bg | "phiếu" / "votes" | `node scripts/brave-ctl.mjs eval "document.querySelector('.group-poll button').click()"` |
| **TC-017** | M03 | Open Full Emoji Picker | Grid of emojis with categories | Picker modal `dark:bg-circle-dark-surface` | "Biểu cảm" / "Emoji" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"React\"]').click()"` |
| **TC-018** | M03 | React with Quick Emoji (`👍`, `❤️`, `😂`) | Counter increments on bubble pill | Reaction pill `dark:bg-circle-dark-elevated` | Emoji glyph legible | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title=\"👍\"]').click()"` |
| **TC-019** | M03 | Reply to Chat Message | Quote banner loads into composer | Quote author and text readable | "Đang trả lời..." / "Replying to..." | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-020** | M03 | Edit Chat Message | Edit banner loads, Enter updates text | Amber highlight banner in Dark mode | "Chỉnh sửa tin nhắn" / "Editing message" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-021** | M03 | Recall Chat Message | Bubble updates to italic "Recalled" | Italic text opacity 60% legible | "Tin nhắn đã bị thu hồi" / "Recalled" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-022** | M03 | Open Pinned Messages Modal | Lists pinned messages with jump action | Pinned card border `dark:border-circle-dark-hairline` | "Tin nhắn đã ghim" / "Pinned" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Pinned\"]').click()"` |
| **TC-023** | M03 | Start Group Audio Call | Call stage session initiates, ring chime | Green live indicator pulse | "Cuộc gọi thoại nhóm" / "Voice Room" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"voice\"]').click()"` |
| **TC-024** | M03 | Start Group Video Call | WebRTC stage opens with camera tiles | Dark video stage `dark:bg-black` | "Cuộc gọi video nhóm" / "Video Call" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"video\"]').click()"` |
| **TC-025** | M04 | Navigate to Daily Moments Feed | Shows stories tray & moments timeline | Tray avatars with concentric rings | "Khoảnh khắc" / "Daily Moments" | `node scripts/brave-ctl.mjs eval "document.querySelectorAll('aside button')[2].click()"` |
| **TC-026** | M04 | Open Camera Capture Modal | Camera stream initializes, preview loads | Clean dark backdrop overlay | "Chụp ảnh" / "Take photo" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Moment\"]').click()"` |
| **TC-027** | M04 | Open Story Viewer Modal | Fullscreen story slides with progress | High-contrast overlays on photo | "Bình luận..." / "Reply..." | `node scripts/brave-ctl.mjs eval "document.querySelector('.story-avatar').click()"` |
| **TC-028** | M05 | Open Join Circle Modal | Input accepts code, auto-uppercases | Key icon with sage accent | "Mã mời tham gia" / "Join Code" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-029** | M05 | Review Join Requests in Settings | Approves/rejects pending user request | Badge counter decrements | "Duyệt yêu cầu" / "Review requests" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-030** | M06 | Navigate to Calendar View | Month grid renders with marked events | Date cells `dark:border-circle-dark-hairline` | "Lịch & Sự kiện" / "Calendar" | `node scripts/brave-ctl.mjs eval "document.querySelectorAll('aside button')[4].click()"` |
| **TC-031** | M06 | Open Create Event Modal | Form with CustomDateTimePicker & Mapbox | Picker dropdown `dark:bg-circle-dark-surface` | "Sự kiện mới" / "New Event" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Event\"]').click()"` |
| **TC-032** | M06 | Respond RSVP (Going / Maybe / No) | Roster updates with checkmark count | Badge colors visible against dark mode | "Tham gia" / "Going" | `node scripts/brave-ctl.mjs eval "document.querySelector('button[text=\"Going\"]').click()"` |
| **TC-033** | M06 | Jump from Calendar Embed in Chat | Scrolls chat and highlights event embed | Ring animation `ring-circle-primary` | "Xem trong Lịch" / "View in Calendar" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-034** | M07 | Toggle Dark / Light Theme (R1) | Theme switches instantly without reload | All surfaces invert tokens cleanly | "Chế độ tối" / "Dark Mode" | `node scripts/brave-ctl.mjs eval "document.documentElement.classList.toggle('dark')"` |
| **TC-035** | M07 | Toggle Flat Design vs Liquid Glass | Glass applies blur, flat applies solid | Concentric radii and border opacity | "Thiết kế phẳng" / "Flat Design" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-036** | M07 | Toggle Language VI / EN | UI updates all strings synchronously | All nav labels, buttons, headers match | "Tiếng Việt" / "English" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-037** | M07 | Open System Settings Modal | Multi-tab settings dialog opens | Tab sidebar and content panels legible | "Cài đặt hệ thống" / "System Settings" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-038** | M07 | Change Password in Settings | Validates current & new passwords | Field error text readable in red/rose | "Đổi mật khẩu" / "Change Password" | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-039** | M09 | Navigate to `/admin` Route | Verify route status (Currently 404 WIP) | 404 page renders cleanly | "Không tìm thấy trang" / "Not found" | `node scripts/brave-ctl.mjs navigate "http://localhost:3000/admin"` |
| **TC-040** | Common | Responsive Viewport: Tablet (768px) | Sidebar collapses into drawer | Touch tap targets >= 44x44px | Layout clean, no horizontal overflow | `node scripts/brave-ctl.mjs eval "..."` |
| **TC-041** | Common | Responsive Viewport: Mobile (375px) | 1-column layout, bottom bar navigation | Safe area padding respected | Minimal header with brand pill | `node scripts/brave-ctl.mjs eval "..."` |

---

## 5. Verification Command Cheat Sheet for Testing Team

Execute these exact shell commands to walk through the test suite:

```bash
# Verify all infrastructure ports
ss -tulpn | grep -E ':(3000|4000|9222|9333)'

# Check browser connection
node scripts/brave-ctl.mjs status

# Navigate to Home Hub
node scripts/brave-ctl.mjs navigate "http://localhost:3000"
node scripts/brave-ctl.mjs screenshot "home_hub.png"

# Enter active circle workspace
node scripts/brave-ctl.mjs eval "document.querySelectorAll('.group.cursor-pointer')[0].click()"
node scripts/brave-ctl.mjs screenshot "circle_workspace.png"

# Trigger Create Poll modal (R1 test)
node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Attach file\"]').click()"
node scripts/brave-ctl.mjs eval "Array.from(document.querySelectorAll('.animate-in button')).find(b => b.innerText.includes('Create Poll')).click()"
node scripts/brave-ctl.mjs screenshot "poll_modal_layout.png"

# Toggle Dark mode
node scripts/brave-ctl.mjs eval "document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-theme', 'dark');"
node scripts/brave-ctl.mjs screenshot "dark_mode_overview.png"

# Inspect modal bounding box to ensure no distortion
node scripts/brave-ctl.mjs eval "(() => { const m = document.querySelector('form')?.parentElement; if (!m) return 'none'; const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()"
```
