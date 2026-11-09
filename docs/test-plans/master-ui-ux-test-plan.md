# MASTER UI/UX TEST PLAN — CIRCLE WEB & MOBILE

**Document ID:** CIRCLE-MTP-2026-001  
**Version:** 1.0.0  
**Date:** 2026-11-09T16:35:00Z  
**Author:** QA & Test Design Engineering Team (`teamwork_test_writer_1`)  
**Target Environments:**
- **Web**: Next.js 14 SPA (`http://localhost:3000`)
- **Mobile**: React Native + Expo (`apps/mobile`, iOS / Android)
- **Backend API**: NestJS + PostgreSQL + Redis (`http://localhost:4000`)
- **Automated Test Driver**: `scripts/brave-ctl.mjs` via `scripts/brave-bridge.mjs` (port 9333 -> Brave DevTools port 9222)
- **Primary Test Account**: `abc@abc.com` / `Password123@!`

---

## 1. Executive Summary & Strategy

This Master Test Plan establishes a rigorous, reproducible quality assurance framework for the CIRCLE social platform across both **Web** and **Mobile** implementations. It directly addresses the user invariants and acceptance criteria defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`:
1. **R1 Immediate Bug Fixes**:
   - Layout distortion in Create Poll Modal (`CreatePollChatModal.tsx`) caused by ancestor CSS `backdrop-filter: blur(2px)` containing block traps.
   - Widespread Dark theme display, contrast, and phantom token defects.
2. **R2 Master Test Plan**: 4 structured tiers of testing covering all clickable interactions, boundary conditions, cross-feature permutations, and real-world user journeys.
3. **Mandatory Mobile Parity Invariant**: Complete cross-platform parity analysis between Web (`apps/web`) and Mobile (`apps/mobile`), covering touch ergonomics, bottom sheets, navigation tabs, bare icon styling, and keyboard avoidance.

---

## 2. Test Architecture & 4-Tier Test Pyramid

```
                ▲
               / \
              /   \
             / T4  \      Tier 4: Real-World Scenarios (E2E User Journeys)
            /-------\
           /   T3    \    Tier 3: Cross-Feature Combinations (Theme, i18n, Resize)
          /-----------\
         /     T2      \  Tier 2: Boundary & Corner Cases (Empty, Max, Error)
        /---------------\
       /       T1        \ Tier 1: Feature Coverage (41 Clickable Action Flows)
      /-------------------\
```

- **Tier 1: Feature Coverage (TC-001 to TC-041)**: Primary user flows, button clicks, modal triggers, input fields, and navigation across Modules 01 through 07 and 09.
- **Tier 2: Boundary & Corner Cases**: Empty lists, maximum character length inputs, rapid multi-click, extreme poll options, network latency handling, and error toast banners.
- **Tier 3: Cross-Feature Combinations**: Dynamic theme toggles (Light/Dark/System) during active chat, live language switching (VI/EN) inside open modals, and viewport resize during call sessions.
- **Tier 4: Real-World Scenarios**: Complete end-to-end sessions simulating authentic user behavior (login -> circle switch -> chat -> poll creation & voting -> event RSVP -> settings customization).

---

## 3. Web vs Mobile Parity Framework

In accordance with the mandatory invariant (*"nhớ là mobile nữa chứ k phải mỗi web đâu nhé"*), every feature is evaluated against cross-platform parity rules:

| Aspect | Web Implementation (`apps/web`) | Mobile Implementation (`apps/mobile`) | Parity Verification Check |
|---|---|---|---|
| **Modal Presentation** | Centered floating modal with backdrop blur overlay rendered via `createPortal(..., document.body)`. | Slide-up bottom sheet or full-screen `<Modal animationType="slide" transparent={true}>`. | Both provide non-clipped viewports, dark surfaces, and tap-outside/swipe-down dismissal. |
| **Touch vs Click Targets** | Standard clickable elements with hover states (`group-hover:opacity-100`). | Touch targets with minimum hit box `44x44pt` (`TouchableOpacity activeOpacity={0.7}`). | No desktop hover-only controls on mobile; touch feedback via `Haptics`. |
| **Navigation** | Persistent collapsible left sidebar (`Sidebar.tsx`) + top header (`Header.tsx`). | `CustomLiquidTabBar` (`apps/mobile/app/(tabs)/_layout.tsx`) with floating blur capsule & center plus button. | Core routes (Hub, Profile, Circle detail) accessible in <= 1 click/tap on both. |
| **Bare Icon Invariant** | Lucide icons with transparent backgrounds or soft hover pills. | Pure bare SVG icons with NO square container boxes (`size={22}`, `strokeWidth={2.2}`). | Strict visual design check: no boxed icons in tab bar or header action strips. |
| **Keyboard Handling** | Native browser layout reflow; fixed composer pinned to viewport bottom. | `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`) with Safe Area insets. | Input field never obscured by virtual keyboard; Send button remains visible. |
| **Design Tokens & Dark Mode** | Extended Tailwind classes (`dark:bg-circle-dark-surface`, `dark:border-circle-dark-hairline`). | Zustand store (`useThemeStore`) resolving `CircleColors[theme]` with glass tokens. | Background contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text across both. |
| **Internationalization (i18n)** | `useLanguage()` hook with synchronous dictionary key lookup (`locales/vi.json`, `en.json`). | `useLanguageStore()` with reactive `t` object updated on language switch. | 100% dictionary string parity: zero hardcoded UI strings in either codebase. |

---

## 4. Tier 1: Feature Coverage Test Matrix (TC-001 to TC-041)

### Module 01: Account & Authentication

#### TC-001: Login with Valid Credentials
- **Target Platform**: Web & Mobile
- **Preconditions**: User account `abc@abc.com` exists with password `Password123@!`.
- **User Actions**:
  1. Navigate to `/login`.
  2. Click email input, type `abc@abc.com`.
  3. Click password input, type `Password123@!`.
  4. Click password visibility eye icon to verify toggle.
  5. Click "Đăng nhập" / "Log in" submit button.
- **Expected UI/UX Behavior**:
  - Loading spinner appears on submit button.
  - Dual-token JWT issued and stored in HTTP-only cookies / mobile secure storage.
  - Client navigates to `/` (Home Hub).
  - Header displays user avatar and online status.
- **Dark & Light Contrast Check**: Input background `dark:bg-circle-dark-surface`, text `dark:text-circle-dark-text`, border `dark:border-circle-dark-hairline` (contrast >= 7:1).
- **Responsive Layout**: Form centered in 440px max-width card; full-width with 16px horizontal margins on mobile (375px).
- **i18n (VI/EN)**: Title: "Chào mừng trở lại" / "Welcome back"; Button: "Đăng nhập" / "Log in".
- **Screenshot Target**: `tc01_login_web.png`, `tc01_login_mobile.png`.

#### TC-002: Login with Invalid Credentials
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Navigate to `/login`.
  2. Input `abc@abc.com` and wrong password `WrongPass123!`.
  3. Click "Đăng nhập".
- **Expected UI/UX Behavior**:
  - API returns HTTP 401.
  - Inline error banner renders above inputs with high-contrast alert icon.
  - Form fields retain user input (password field cleared or selectable).
  - Screen does not jitter or redirect.
- **Dark & Light Contrast Check**: Error banner background `bg-rose-500/15`, text `text-rose-400` against dark canvas (contrast >= 4.6:1).
- **Responsive Layout**: Alert banner wraps text cleanly without horizontal overflow.
- **i18n (VI/EN)**: "Mật khẩu không chính xác" / "Invalid email or password".
- **Screenshot Target**: `tc02_login_error.png`.

#### TC-003: Open & Inspect Profile Modal (`EditProfileModal`)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Logged into Home Hub.
  2. Click user avatar in Header (Web) or Profile Tab in bottom bar (Mobile).
  3. Select "Hồ sơ cá nhân" / "User Profile".
- **Expected UI/UX Behavior**:
  - Centered modal dialog smoothly animates into view.
  - Backdrop dimming layer at 50% opacity.
  - Avatar, display name, handle (`@username`), and bio populate accurately.
- **Dark & Light Contrast Check**: Modal body `dark:bg-circle-dark-surface`, labels `dark:text-circle-dark-muted`.
- **Responsive Layout**: 540px centered card on desktop; bottom sheet modal on mobile.
- **i18n (VI/EN)**: "Hồ sơ cá nhân" / "User Profile", "Lưu thay đổi" / "Save Changes".
- **Screenshot Target**: `tc03_profile_modal.png`.

#### TC-004: Edit Display Name & Handle
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In `EditProfileModal`, click "Tên hiển thị" input, modify to "Bình Tester".
  2. Modify Bio description.
  3. Click "Lưu thay đổi" button.
- **Expected UI/UX Behavior**:
  - Button switches to loading spinner state.
  - Modal closes upon success; Header avatar tooltip and user handle update instantly.
  - Success toast appears in top-right corner.
- **Dark & Light Contrast Check**: Input focus ring `ring-2 ring-circle-primary`, clean dark background.
- **Responsive Layout**: Inputs stack vertically with 12px gap.
- **i18n (VI/EN)**: "Cập nhật hồ sơ thành công" / "Profile updated successfully".
- **Screenshot Target**: `tc04_profile_saved.png`.

#### TC-005: View Active Sessions & Devices
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Open Header Menu -> "Cài đặt hệ thống" / "System Settings".
  2. Click "Phiên đăng nhập" / "Sessions" tab.
- **Expected UI/UX Behavior**:
  - Lists current browser/device with "Thiết bị này" / "This device" badge.
  - Displays other active refresh tokens with IP address, user-agent, and last seen timestamp.
  - "Đăng xuất khỏi tất cả thiết bị khác" / "Revoke other sessions" button visible.
- **Dark & Light Contrast Check**: Session card `dark:bg-circle-dark-elevated`, status badge emerald green `text-emerald-400`.
- **Responsive Layout**: Device icons and revoke action align cleanly in row on desktop, stacked on mobile.
- **i18n (VI/EN)**: "Phiên hoạt động" / "Active Sessions".
- **Screenshot Target**: `tc05_sessions_list.png`.

---

### Module 02: Circles & Members

#### TC-006: Circle Switcher Dropdown Interaction
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. From Sidebar, click Circle Switcher dropdown (`button` with `ChevronDown`).
- **Expected UI/UX Behavior**:
  - Animated dropdown menu appears showing list of all joined circles.
  - Active circle has checkmark indicator.
  - Quick action buttons ("+ Tạo nhóm mới", "Tham gia bằng mã") fixed at menu footer.
- **Dark & Light Contrast Check**: Menu container `dark:bg-circle-dark-surface`, hover item `dark:hover:bg-circle-dark-elevated`.
- **Responsive Layout**: Desktop dropdown positioned under trigger; Mobile presents bottom action drawer.
- **i18n (VI/EN)**: "Nhóm của bạn" / "Your Circles", "+ Tạo nhóm mới" / "+ Create New Circle".
- **Screenshot Target**: `tc06_circle_switcher.png`.

#### TC-007: Switch Active Circle Workspace
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Switcher, click a different circle in the list.
- **Expected UI/UX Behavior**:
  - Active circle ID updates in app state (`activeCircle`).
  - URL updates to `/circle/[id]` (or query parameter).
  - Main view switches from previous chat to new circle's default channel.
  - Presence rail updates to reflect the new circle's members.
- **Dark & Light Contrast Check**: Active indicator pill has high-contrast primary accent.
- **Responsive Layout**: Smooth layout transition without page flash.
- **i18n (VI/EN)**: Channel titles and member counts render in active language.
- **Screenshot Target**: `tc07_switch_circle.png`.

#### TC-008: Copy Direct Circle Invite Link (`/@handle`)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Header, click "Sao chép liên kết" / "Copy link" button (`button[title*="Copy"]`).
- **Expected UI/UX Behavior**:
  - Canonical circle invite URL (`http://localhost:3000/@<handle>`) copied to system clipboard.
  - Feedback toast/notification appears: "Đã sao chép liên kết nhóm!".
- **Dark & Light Contrast Check**: Notification toast uses floating glass pill with high-contrast text.
- **Responsive Layout**: Header button displays icon + text on desktop, icon-only on mobile.
- **i18n (VI/EN)**: "Đã sao chép liên kết" / "Link copied".
- **Screenshot Target**: `tc08_copy_link_toast.png`.

#### TC-009: Open Create Circle Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "+ Tạo nhóm mới" from Sidebar or Switcher.
- **Expected UI/UX Behavior**:
  - `CreateCircleModal` opens with avatar upload/preset selector, Name input, Handle input, and Privacy selector.
- **Dark & Light Contrast Check**: Modal body `dark:bg-circle-dark-surface`, form controls `dark:border-circle-dark-hairline`.
- **Responsive Layout**: Max width 520px on web; full width bottom sheet on mobile.
- **i18n (VI/EN)**: "Tạo nhóm mới" / "Create New Circle", "Tên nhóm" / "Circle Name".
- **Screenshot Target**: `tc09_create_circle_modal.png`.

#### TC-010: Open Circle Settings & Management Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Header, click Settings gear icon button.
- **Expected UI/UX Behavior**:
  - `CircleManagementModal` opens displaying 5 distinct tabs:
    1. Thông tin nhóm (`chatInfo`)
    2. Thành viên (`members`)
    3. Quyền riêng tư (`privacySupport`)
    4. Cài đặt nâng cao (`circleSettings`)
    5. Báo cáo & Hỗ trợ (`supportReports`)
  - Active tab is highlighted with primary indicator.
- **Dark & Light Contrast Check**: Tab bar border `dark:border-circle-dark-hairline`, active tab `dark:text-circle-primary`.
- **Responsive Layout**: Left-rail tab navigation on desktop; top horizontal scrolling tabs on mobile.
- **i18n (VI/EN)**: "Cài đặt nhóm" / "Circle Settings", "Thành viên" / "Members".
- **Screenshot Target**: `tc10_circle_management_modal.png`.

#### TC-011: Member Roster Inspection in Presence Rail
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. View right-hand Presence Rail (`PresenceRail.tsx` on Web, Members tab on Mobile).
- **Expected UI/UX Behavior**:
  - Displays grouped member list (Trưởng nhóm / Owner, Quản trị viên / Admin, Thành viên / Member).
  - Online members display pulsating emerald dot (`bg-emerald-500`).
  - Clicking a member displays user quick card with actions (Gán biệt danh, Nhắn tin).
- **Dark & Light Contrast Check**: Presence rail background `dark:bg-circle-dark-surface`, divider hairline `dark:border-circle-dark-hairline`.
- **Responsive Layout**: Right rail occupies 260px on desktop; hidden by default on tablet/mobile with slide-in toggle.
- **i18n (VI/EN)**: "Đang hoạt động" / "Online", "Thành viên" / "Members".
- **Screenshot Target**: `tc11_presence_rail.png`.

---

### Module 03: Channels & Realtime Chat

#### TC-012: Send Text Message in Circle Chat
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Chat view, click composer textarea.
  2. Type: "Xin chào cả nhóm! Chúc mọi người một ngày tốt lành 🌟".
  3. Press Enter (or click Send arrow button).
- **Expected UI/UX Behavior**:
  - Message bubble immediately appears in chat stream (optimistic update).
  - Sound chime plays (if enabled).
  - Textarea clears and resets height to 1 row.
  - Scroll position auto-scrolls to bottom.
- **Dark & Light Contrast Check**: My message bubble has primary accent `msg-bubble-me` token with white/contrasting text; timestamp is readable.
- **Responsive Layout**: Message bubbles max out at 75% container width on web, 85% on mobile.
- **i18n (VI/EN)**: Placeholder: "Nhập tin nhắn..." / "Type a message...".
- **Screenshot Target**: `tc12_send_message.png`.

#### TC-013: Trigger Composer Plus Action Menu
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click composer plus icon button (`+` or `button[title*="Attach file"]`).
- **Expected UI/UX Behavior**:
  - Floating action menu popover opens directly above plus button.
  - Items listed:
    - "Đính kèm tệp / hình ảnh" (File attachment)
    - "Tạo cuộc bình chọn" (Create Poll)
    - "Gửi vị trí hiện tại" (Share Location)
- **Dark & Light Contrast Check**: Popover menu container `dark:bg-circle-dark-surface`, item hover `dark:hover:bg-circle-dark-elevated`.
- **Responsive Layout**: Popover aligned to left of composer; bottom sheet drawer on mobile.
- **i18n (VI/EN)**: "Tạo bình chọn" / "Create Poll", "Đính kèm tệp" / "Attach file".
- **Screenshot Target**: `tc13_composer_plus_menu.png`.

#### TC-014: Trigger Create Poll Modal from Composer Plus Menu (CRITICAL R1 FIX)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Open composer plus action menu.
  2. Click "Tạo cuộc bình chọn" / "Create Poll".
- **Expected UI/UX Behavior**:
  - **WEB (R1 FIX)**: `CreatePollChatModal` opens **via React Portal attached to `document.body`**, NOT trapped inside the 76px tall `ChatComposer` containing block!
  - Overlay bounding rect covers the FULL viewport (`width: 100vw, height: 100vh`).
  - Modal card is perfectly centered (`y: (viewportHeight - modalHeight)/2`).
  - NO vertical clipping or cut-off submit buttons!
  - **MOBILE**: `MobileCreatePollModal` opens centered as modal sheet with `KeyboardAvoidingView` enabled.
- **Dark & Light Contrast Check**: Modal body `dark:bg-circle-dark-surface`, inputs `dark:bg-circle-dark-canvas`, text `dark:text-circle-dark-text`.
- **Responsive Layout**: Desktop modal width 480px; Mobile modal spans full width with 16px safe margins.
- **i18n (VI/EN)**: "Tạo cuộc bình chọn" / "Create Poll", "Câu hỏi bình chọn" / "Poll Question", "Tùy chọn 1" / "Option 1".
- **Screenshot Target**: `tc14_create_poll_modal_centered.png`.

#### TC-015: Fill & Submit Poll in Chat
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In `CreatePollChatModal`, enter Question: "Trưa nay ăn gì cả nhà ơi?".
  2. Enter Option 1: "Cơm tấm sườn bì chả".
  3. Enter Option 2: "Bún bò Huế".
  4. Click "+ Thêm lựa chọn" button.
  5. Enter Option 3: "Phở bò tái nạm".
  6. Click "Tạo bình chọn" / "Create Poll" submit button.
- **Expected UI/UX Behavior**:
  - Modal smoothly closes.
  - New Poll Card (`ChatPollCard` / `MobileChatPollCard`) renders inline in chat timeline.
  - Displays Question title, author badge, 3 voting option buttons, and "0 phiếu" tally.
- **Dark & Light Contrast Check**: Poll card `dark:bg-circle-dark-surface`, option buttons `dark:bg-circle-dark-elevated`, text `dark:text-circle-dark-text`.
- **Responsive Layout**: Poll card fits within message bubble width limits cleanly.
- **i18n (VI/EN)**: "0 phiếu" / "0 votes", "Tạo bình chọn" / "Create Poll".
- **Screenshot Target**: `tc15_chat_poll_card_rendered.png`.

#### TC-016: Vote on Chat Poll Option
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. On the newly created Poll Card in chat, click Option 1 ("Cơm tấm sườn bì chả").
- **Expected UI/UX Behavior**:
  - Option button highlights with active primary border.
  - Percentage bar animates smoothly from 0% to 100%.
  - Vote count increments to "1 phiếu" / "1 vote".
  - Checkmark icon appears beside the voted option.
- **Dark & Light Contrast Check**: Vote percentage progress bar has visible primary accent against dark card surface.
- **Responsive Layout**: Percentage label and option text remain legible on narrow screens.
- **i18n (VI/EN)**: "1 phiếu" / "1 vote".
- **Screenshot Target**: `tc16_poll_voted.png`.

#### TC-017: Open Full Emoji Picker Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In chat composer, click Emoji / Sticker smile button (`button[title*="Emoji"]`).
- **Expected UI/UX Behavior**:
  - `FullEmojiPickerModal` opens without distortion.
  - Displays category tabs (Smileys, Gestures, Animals, Food, Activities, Objects, Symbols).
  - Search input allows instant emoji filtering.
- **Dark & Light Contrast Check**: Emoji grid background `dark:bg-circle-dark-surface`, category tab icons high-contrast muted gray to primary.
- **Responsive Layout**: Popover anchored near composer on desktop; bottom drawer sheet on mobile.
- **i18n (VI/EN)**: "Tìm biểu cảm..." / "Search emoji...".
- **Screenshot Target**: `tc17_emoji_picker.png`.

#### TC-018: React with Quick Emoji on Message Bubble
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Hover over a message bubble (or long-press on mobile).
  2. Quick reaction bar appears with prominent emojis: `👍`, `❤️`, `😂`, `🔥`, `🎉`.
  3. Click `❤️`.
- **Expected UI/UX Behavior**:
  - Reaction pill with `❤️ 1` attaches to bottom-right of message bubble.
  - Clicking the same reaction again unreacts and decrements counter.
- **Dark & Light Contrast Check**: Reaction pill `dark:bg-circle-dark-elevated` with subtle border `dark:border-circle-dark-hairline`.
- **Responsive Layout**: Reaction pill wraps neatly under message bubble without overlapping timestamps.
- **Screenshot Target**: `tc18_message_reaction.png`.

#### TC-019: Reply to Chat Message (Quote Banner)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. On message bubble action menu, click "Trả lời" / "Reply".
- **Expected UI/UX Behavior**:
  - Reply banner loads immediately above chat composer textarea.
  - Displays original sender's name and truncated snippet of the quoted text.
  - "X" dismiss button visible on right side of banner.
  - Composer input gains automatic keyboard focus.
- **Dark & Light Contrast Check**: Reply banner background `dark:bg-circle-dark-surface/90` with primary left accent border (`border-l-4 border-circle-primary`).
- **Responsive Layout**: Quoted text truncates with ellipsis on narrow viewports.
- **i18n (VI/EN)**: "Đang trả lời [Name]" / "Replying to [Name]".
- **Screenshot Target**: `tc19_reply_banner.png`.

#### TC-020: Edit Chat Message
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. On user's own recent message, click More Actions menu -> "Chỉnh sửa" / "Edit".
  2. Modify message text to add "(đã chỉnh sửa)".
  3. Press Enter.
- **Expected UI/UX Behavior**:
  - Composer banner displays "Chỉnh sửa tin nhắn" / "Editing message".
  - Message bubble updates in place with edited text.
  - "(đã chỉnh sửa)" / "(edited)" subtle label renders next to timestamp.
- **Dark & Light Contrast Check**: Amber editing banner styling clearly distinguishable from reply banner.
- **Responsive Layout**: Edit banner wraps cleanly across viewports.
- **i18n (VI/EN)**: "Chỉnh sửa tin nhắn" / "Editing message", "(đã chỉnh sửa)" / "(edited)".
- **Screenshot Target**: `tc20_edit_message.png`.

#### TC-021: Recall Chat Message
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. On user's own message, click More Actions -> "Thu hồi tin nhắn" / "Recall message".
  2. Confirm recall action in confirmation alert.
- **Expected UI/UX Behavior**:
  - Message text replaced with italic notice: "Tin nhắn đã bị thu hồi" / "Message has been recalled".
  - Attachments, polls, and reactions removed from bubble.
  - Message actions menu disabled for recalled message.
- **Dark & Light Contrast Check**: Recalled text opacity 60% `dark:text-circle-dark-muted`, italicized.
- **Responsive Layout**: Compact single-line bubble styling.
- **i18n (VI/EN)**: "Tin nhắn đã bị thu hồi" / "Message has been recalled".
- **Screenshot Target**: `tc21_recall_message.png`.

#### TC-022: Open & View Pinned Messages Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Chat header, click Pin icon button (`button[title*="Pin"]`).
- **Expected UI/UX Behavior**:
  - `PinnedMessagesModal` opens.
  - Displays chronologically pinned messages with sender, timestamp, and "Xem tin nhắn" / "Jump to message" button.
  - Clicking "Xem tin nhắn" jumps chat viewport directly to the message and highlights it.
- **Dark & Light Contrast Check**: Modal surface `dark:bg-circle-dark-surface`, pinned items `dark:bg-circle-dark-elevated`.
- **Responsive Layout**: 500px modal dialog on web; slide-up bottom sheet on mobile.
- **i18n (VI/EN)**: "Tin nhắn đã ghim" / "Pinned Messages".
- **Screenshot Target**: `tc22_pinned_messages.png`.

#### TC-023: Initiate Group Audio Call
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Chat header, click Audio Call phone icon (`button[title*="voice"]`).
- **Expected UI/UX Behavior**:
  - Audio call stage opens (`CallStageModal.tsx` / `MobileCallStageModal.tsx`).
  - Outgoing chime rings.
  - Participant tile displays user avatar with pulsating audio waveform ring.
  - Controls: Mute Microphone, Deafen Audio, End Call.
- **Dark & Light Contrast Check**: Dark call stage canvas `dark:bg-stone-950`, emerald active audio indicator.
- **Responsive Layout**: Floating minimized PiP tile when navigating away from chat.
- **i18n (VI/EN)**: "Cuộc gọi thoại nhóm" / "Group Voice Call".
- **Screenshot Target**: `tc23_audio_call_stage.png`.

#### TC-024: Initiate Group Video Call
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Circle Chat header, click Video Call camera icon (`button[title*="video"]`).
- **Expected UI/UX Behavior**:
  - Video call stage opens requesting camera/microphone permissions.
  - Camera preview renders in responsive video grid tile.
  - Controls: Camera On/Off, Mic On/Off, Screen Share (Web), Switch Camera (Mobile), End Call.
- **Dark & Light Contrast Check**: Dark video studio background `bg-black`, controls styled with floating translucent glass pills.
- **Responsive Layout**: Grid adapts from 1 to 4 tiles automatically.
- **i18n (VI/EN)**: "Cuộc gọi video nhóm" / "Group Video Call".
- **Screenshot Target**: `tc24_video_call_stage.png`.

---

### Module 04: Posts & Feed (Daily Moments)

#### TC-025: Navigate to Daily Moments Feed
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "Khoảnh khắc" / "Daily Moments" tab in circle navigation bar.
- **Expected UI/UX Behavior**:
  - View loads `DailyMomentsFeed.tsx` / `MomentsView.tsx`.
  - Top Stories Tray displays member avatars with concentric rings (unseen moments have primary gradient ring).
  - Chronological timeline shows moments cards with geotag and timestamp.
- **Dark & Light Contrast Check**: Feed canvas `dark:bg-circle-dark-canvas`, moment cards `dark:bg-circle-dark-surface`.
- **Responsive Layout**: 2-column masonry grid on desktop; single column vertical stream on mobile.
- **i18n (VI/EN)**: "Khoảnh khắc trong ngày" / "Daily Moments".
- **Screenshot Target**: `tc25_moments_feed.png`.

#### TC-026: Open Camera Capture Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "+ Khoảnh khắc mới" / "+ New Moment" camera pill button.
- **Expected UI/UX Behavior**:
  - Camera modal (`CreateMomentModal.tsx`) launches with live viewfinder stream.
  - Shutter button centered at bottom.
  - Mode switchers: Photo / Video / Dual Camera.
  - Retake and Post buttons appear after capture.
- **Dark & Light Contrast Check**: High-contrast black viewfinder overlay with white control icons.
- **Responsive Layout**: Fullscreen immersive view on both web and mobile.
- **i18n (VI/EN)**: "Chụp ảnh" / "Take photo", "Đăng khoảnh khắc" / "Share moment".
- **Screenshot Target**: `tc26_camera_modal.png`.

#### TC-027: Open Story Viewer Modal
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click any active avatar in the Moments Tray.
- **Expected UI/UX Behavior**:
  - Fullscreen `StoryViewerModal` opens.
  - Segmented progress bar at top animates countdown (5 seconds per photo).
  - Tap right side -> next slide; tap left side -> previous slide.
  - Bottom reply composer allows sending direct reaction emoji or text comment.
- **Dark & Light Contrast Check**: Gradient shadow overlays at top and bottom ensure white text is legible against bright photos.
- **Responsive Layout**: 9:16 aspect ratio story viewport centered on desktop; full screen on mobile.
- **i18n (VI/EN)**: "Bình luận về khoảnh khắc..." / "Reply to moment...".
- **Screenshot Target**: `tc27_story_viewer.png`.

---

### Module 05: Direct Invitations / Onboarding

#### TC-028: Open Join Circle Modal & Enter Code
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "Tham gia bằng mã" / "Join with Code" from Sidebar.
  2. Type code `CIRC-8899`.
- **Expected UI/UX Behavior**:
  - `JoinCircleModal` renders with 6-8 character input field.
  - Automatically uppercases letters and filters non-alphanumeric characters.
  - "Tham gia nhóm" button activates when valid length is reached.
- **Dark & Light Contrast Check**: Input box `dark:bg-circle-dark-canvas`, key icon styled with sage accent.
- **Responsive Layout**: 460px centered modal on web; bottom drawer on mobile.
- **i18n (VI/EN)**: "Mã mời tham gia" / "Invite Code", "Tham gia" / "Join".
- **Screenshot Target**: `tc28_join_circle_modal.png`.

#### TC-029: Review Join Requests in Circle Settings
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In `CircleManagementModal`, click "Yêu cầu tham gia" / "Join Requests" sub-tab.
  2. For pending candidate, click "Duyệt" (Approve) or "Từ chối" (Reject).
- **Expected UI/UX Behavior**:
  - Pending candidate row displays user avatar, name, and request timestamp.
  - Clicking "Duyệt" triggers `useReviewJoinRequestMutation(status: APPROVE)`.
  - Row animates out; pending badge counter on tab decrements.
- **Dark & Light Contrast Check**: Approve button emerald `bg-emerald-600`, Reject button rose `bg-rose-600/20 text-rose-400`.
- **Responsive Layout**: Action buttons inline on wide screens, stacked on narrow screens.
- **i18n (VI/EN)**: "Duyệt" / "Approve", "Từ chối" / "Reject".
- **Screenshot Target**: `tc29_review_join_requests.png`.

---

### Module 06: Events & Calendar

#### TC-030: Navigate to Circle Calendar View
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "Lịch & Sự kiện" / "Calendar" tab in circle tools navigation.
- **Expected UI/UX Behavior**:
  - `CircleCalendarView` / `MobileCalendarView` renders month grid view.
  - Today's date highlighted with primary circle.
  - Days with scheduled events display event pills or indicator dots.
  - Previous/Next month arrows allow seamless month navigation.
- **Dark & Light Contrast Check**: Calendar grid cells `dark:border-circle-dark-hairline`, weekend days subtly muted.
- **Responsive Layout**: Desktop displays full 7-column month grid; mobile switches between compact week strip and agenda view.
- **i18n (VI/EN)**: Month names (Tháng 11 / November), Weekdays (T2, T3... / Mon, Tue...).
- **Screenshot Target**: `tc30_calendar_view.png`.

#### TC-031: Open Create Event Modal with Date Picker & Location Search
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Click "+ Sự kiện mới" / "+ New Event" button.
- **Expected UI/UX Behavior**:
  - Create Event dialog opens.
  - `CustomDateTimePicker` opens custom wheel/dropdown selector (verifying chevron contrast fix!).
  - `LocationSearchInput` provides Mapbox autocomplete suggestions as user types.
- **Dark & Light Contrast Check**: Date picker chevrons have high-contrast tokens in dark mode (`dark:text-circle-dark-text` instead of dark-on-dark invisible chevrons).
- **Responsive Layout**: Date and time pickers stack on mobile viewports.
- **i18n (VI/EN)**: "Sự kiện mới" / "New Event", "Thời gian bắt đầu" / "Start Time".
- **Screenshot Target**: `tc31_create_event_modal.png`.

#### TC-032: Respond RSVP on Event Card
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. On Event card, click RSVP option: "Tham gia" / "Going" (`YES`).
- **Expected UI/UX Behavior**:
  - "Tham gia" pill highlights in solid emerald/primary theme color.
  - Attendee roster counter increments.
  - User avatar appears in attendee list.
- **Dark & Light Contrast Check**: RSVP pills have distinct border and background states in Dark theme.
- **Responsive Layout**: 3 RSVP buttons (Going / Maybe / No) fit side-by-side with equal widths.
- **i18n (VI/EN)**: "Tham gia" / "Going", "Có thể" / "Maybe", "Không đi" / "Can't go".
- **Screenshot Target**: `tc32_rsvp_event.png`.

#### TC-033: Jump from Calendar Embed in Chat
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In chat, click "Xem trong Lịch" / "View in Calendar" button on a shared Calendar Event Embed card.
- **Expected UI/UX Behavior**:
  - Active tool view switches from Chat to Calendar.
  - Calendar navigates to the event's month/date.
  - Target event card pulses with subtle highlight ring.
- **Dark & Light Contrast Check**: Highlight ring `ring-2 ring-circle-primary`.
- **Responsive Layout**: Smooth view transition without viewport jump.
- **i18n (VI/EN)**: "Xem trong Lịch" / "View in Calendar".
- **Screenshot Target**: `tc33_calendar_jump.png`.

---

### Module 07: Notifications & Settings

#### TC-034: Toggle Dark / Light Theme (CRITICAL R1 FIX)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Header (or System Settings Appearance Tab), click Theme toggle button.
  2. Switch from Light -> Dark -> System -> Light.
- **Expected UI/UX Behavior**:
  - `<html>` element toggles class `dark` and attribute `data-theme="dark"`.
  - All backgrounds, cards, modals, sidebars, borders, and text invert immediately without page reload or visual flash.
  - Glassmorphic translucent surfaces maintain legible contrast.
  - No phantom Tailwind classes fail to resolve.
- **Dark & Light Contrast Check**: WCAG AA contrast compliance (>= 4.5:1) verified across all surfaces.
- **Responsive Layout**: Theme toggle button easily accessible on both desktop header and mobile settings.
- **i18n (VI/EN)**: "Chế độ tối" / "Dark Mode", "Chế độ sáng" / "Light Mode".
- **Screenshot Target**: `tc34_theme_dark_overview.png`, `tc34_theme_light_overview.png`.

#### TC-035: Toggle UI Style (Flat Design vs Liquid Glass)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Open System Settings -> Appearance Tab.
  2. Toggle between "Thiết kế phẳng" (Flat Design) and "Kính lỏng" (Liquid Glass).
- **Expected UI/UX Behavior**:
  - Flat Design applies solid backgrounds (`bg-white` / `dark:bg-circle-dark-surface`).
  - Liquid Glass applies blur backdrops (`backdrop-blur-md bg-white/70` / `dark:bg-circle-dark-surface/70`) with subtle hairline border reflections.
- **Dark & Light Contrast Check**: Glass translucency maintains legible text contrast over dark backgrounds.
- **Responsive Layout**: No layout shifts when switching styles.
- **i18n (VI/EN)**: "Thiết kế phẳng" / "Flat Design", "Kính lỏng" / "Liquid Glass".
- **Screenshot Target**: `tc35_ui_style_glass.png`, `tc35_ui_style_flat.png`.

#### TC-036: Toggle Internationalization Language (VI / EN)
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. In Header `LanguageSwitcher` (or Settings Language Tab), switch language: Tiếng Việt ↔ English.
- **Expected UI/UX Behavior**:
  - Entire UI string tree updates instantaneously (Navigation tabs, Buttons, Headers, Modal titles, Tooltips, Empty states).
  - Selected language preference persists in localStorage / mobile storage.
  - No untranslated raw JSON keys (e.g. `auth.login.submit`) displayed.
- **Dark & Light Contrast Check**: Language dropdown options visible in dark mode.
- **Responsive Layout**: Vietnamese diacritics render cleanly without vertical clipping in labels.
- **i18n (VI/EN)**: All dictionary keys verified against `locales/vi.json` and `locales/en.json`.
- **Screenshot Target**: `tc36_lang_vi.png`, `tc36_lang_en.png`.

#### TC-037: Open System Settings Modal Tabs
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Open `SystemSettingsModal`.
  2. Click sequentially through all 5 tabs:
     - Giao diện (Appearance)
     - Bảo mật (Security)
     - Phiên đăng nhập (Sessions)
     - Ngôn ngữ (Language)
     - Trợ giúp & Phím tắt (Help & Shortcuts)
- **Expected UI/UX Behavior**:
  - Tab content swaps with smooth fade-in animation.
  - Active tab pill highlighted.
  - Modal preserves scroll position.
- **Dark & Light Contrast Check**: Tab list background `dark:bg-circle-dark-surface`, inactive tab text `dark:text-circle-dark-muted`.
- **Responsive Layout**: Desktop modal width 640px; Mobile renders full-screen settings view.
- **i18n (VI/EN)**: All tab titles translated accurately.
- **Screenshot Target**: `tc37_system_settings_tabs.png`.

#### TC-038: Change Account Password in Settings
- **Target Platform**: Web & Mobile
- **User Actions**:
  1. Open System Settings -> Security Tab.
  2. Enter Current Password: `Password123@!`.
  3. Enter New Password: `NewPassword456@!`.
  4. Enter Confirm Password: `NewPassword456@!`.
  5. Click "Đổi mật khẩu" / "Update Password".
- **Expected UI/UX Behavior**:
  - Live password strength meter indicates "Rất mạnh" (Strong).
  - Validation rules pass (length >= 8, uppercase, lowercase, number, special char).
  - Success message confirms password update.
- **Dark & Light Contrast Check**: Password strength bar colored emerald green; field errors in readable rose red.
- **Responsive Layout**: Form fields stacked with consistent spacing.
- **i18n (VI/EN)**: "Đổi mật khẩu" / "Change Password", "Mật khẩu hiện tại" / "Current Password".
- **Screenshot Target**: `tc38_change_password.png`.

---

### Module 09: Admin Dashboard & Global Moderation

#### TC-039: Navigate to `/admin` Route (WIP & 404 Status Verification)
- **Target Platform**: Web
- **User Actions**:
  1. Navigate directly to `http://localhost:3000/admin`.
- **Expected UI/UX Behavior**:
  - Route currently renders the Next.js `404: This page could not be found.` page because `apps/web/src/app/admin` is marked as Proposal / Supplemental Baseline in `agentic/playbooks/09-admin-moderation.md`.
  - Non-admin users are safely prevented from accessing admin controls.
  - 404 page renders cleanly in dark theme with home redirect link.
- **Dark & Light Contrast Check**: 404 text centered, contrasting against dark canvas.
- **Screenshot Target**: `tc39_admin_404_wip.png`.

---

### Cross-Cutting Viewport Responsiveness

#### TC-040: Responsive Viewport — Tablet (768px Width)
- **Target Platform**: Web
- **User Actions**:
  1. Resize browser viewport to width 768px, height 1024px.
  2. Inspect Home Hub, Chat view, and Modals.
- **Expected UI/UX Behavior**:
  - Presence Rail collapses into slide-over drawer triggered by header button.
  - Sidebar collapses to compact icon strip or hamburger drawer.
  - Chat composer and message feed adapt to available width without horizontal scrolling.
  - Touch target sizes meet minimum 44x44px.
- **Dark & Light Contrast Check**: Drawer backdrops maintain 50% scrim opacity.
- **Screenshot Target**: `tc40_responsive_tablet_768.png`.

#### TC-041: Responsive Viewport — Mobile (375px Width)
- **Target Platform**: Web
- **User Actions**:
  1. Resize browser viewport to width 375px, height 812px (iPhone dimensions).
  2. Inspect Circle navigation, Chat composer, and Modals.
- **Expected UI/UX Behavior**:
  - Full single-column mobile layout.
  - Navigation switches to bottom mobile navigation bar or slide-in drawer.
  - Chat composer action buttons collapse into plus popover menu.
  - Modals adapt to 100% viewport width with rounded top corners (bottom sheet appearance).
  - Safe area insets (notch and home indicator) respected.
- **Dark & Light Contrast Check**: No text clipping or horizontal overflow scrollbars.
- **Screenshot Target**: `tc41_responsive_mobile_375.png`.

---

## 5. Tier 2: Boundary & Corner Cases

| Case ID | Feature / Component | Boundary Condition | Expected Behavior & Graceful Failure Handling |
|---|---|---|---|
| **BC-01** | Chat Composer | Empty / Whitespace-only submission | Send button remains disabled; pressing Enter produces no action or network request. |
| **BC-02** | Chat Composer | Maximum character limit (5,000 chars) | Input clamps or shows warning counter; UI prevents submission overflow; API validates gracefully. |
| **BC-03** | Create Poll Modal | Empty question or single option | Validation banner warns: "Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn"; submit button prevented. |
| **BC-04** | Create Poll Modal | Maximum options (8 options) | "+ Thêm lựa chọn" button disappears or disables when 8 options reached. |
| **BC-05** | Create Poll Modal | Maximum option text length (120 chars) | Text truncated or character counter shown; long option labels wrap within voting card without overflow. |
| **BC-06** | File Attachment | File exceeding 25MB limit | Client displays rejection toast: "Tệp vượt quá dung lượng tối đa (25MB)"; upload request aborted. |
| **BC-07** | Circle Switcher | User with 0 joined circles (fresh user) | Empty state displays friendly illustration and prominent "+ Tạo nhóm đầu tiên" CTA button. |
| **BC-08** | Presence Rail | Circle with 50+ members | Virtualized scrolling list ensures zero frame drops or DOM bloat. |
| **BC-09** | Calendar View | Month with zero scheduled events | Calendar renders clean empty date cells; selecting day shows "Không có sự kiện nào trong ngày này". |
| **BC-10** | Moments Tray | User with expired moments (> 24 hours) | Expired moments automatically purged from active tray; tray hides or shows empty camera prompt. |
| **BC-11** | Network Disconnect | Temporary offline connection | Offline banner appears at top: "Mất kết nối internet. Đang kết nối lại..."; outgoing messages queued. |
| **BC-12** | Fast Multi-Click | Rapid repeated clicking on "Gửi tin nhắn" or "Bình chọn" | Debounced button handler prevents duplicate network requests and double votes. |

---

## 6. Tier 3: Cross-Feature Combinations

| Combo ID | Primary Feature | Concurrent Feature | Expected Seamless Behavior |
|---|---|---|---|
| **CC-01** | Active Chat Stream | Dynamic Dark/Light Theme Toggle | Chat bubbles, timestamps, avatars, and input bar invert colors instantly without re-rendering or losing scroll position. |
| **CC-02** | Open Create Poll Modal | Theme Toggle | Modal dialog background, input fields, and action buttons transition smoothly without closing the modal or clearing typed text. |
| **CC-03** | Open Create Poll Modal | Language Switch (VI ↔ EN) | All modal strings (title, labels, placeholders, buttons) update synchronously while preserving typed question and options. |
| **CC-04** | Active Video Call Stage | Viewport Resize (Desktop -> Mobile) | Video grid dynamically rearranges from 2x2 grid to stacked vertical tiles without interrupting WebRTC peer streams. |
| **CC-05** | Chat Message Quoting | Emoji Reaction Trigger | Selecting an emoji reaction while composing a quote reply does not dismiss the composer reply banner. |
| **CC-06** | Modal Stacking | Open Settings -> Edit Profile | Closing top child modal (`EditProfileModal`) returns focus cleanly to parent modal without trapping modal backdrops. |
| **CC-07** | Circle Switch during Message Typing | Unsent Composer Draft | Draft text in composer is preserved per circle in local session storage and restored upon returning. |

---

## 7. Tier 4: Real-World Scenarios (End-to-End User Journeys)

### Scenario 1: Daily Team Collaboration Journey
1. **Authentication**: User logs in with `abc@abc.com` -> verified into Home Hub.
2. **Circle Switch**: User selects their primary circle "TLCN Engineering".
3. **Chat Catchup**: Scrolls unread chat history, reacts with `👍` to project status update.
4. **Lunch Coordination**:
   - Clicks composer plus button -> selects "Tạo cuộc bình chọn" (Create Poll).
   - Enters lunch options and posts poll to chat.
   - Casts vote on "Cơm tấm".
   - Peers vote in real-time; percentage bars animate.
5. **Afternoon Event Scheduling**:
   - Switches to Calendar tab.
   - Creates new event "Sprint Review & Demo" at 15:00 with Mapbox location.
   - Posts calendar embed directly into chat.
   - Responds "Tham gia" (Going).
6. **Customization**:
   - Switches theme to Dark mode.
   - Switches UI style to Liquid Glass.
   - Logs out securely.

### Scenario 2: Mobile Direct Onboarding & Interaction Journey
1. **Invite Code Entry**: New member opens mobile app, enters direct invite code `CIRC-8899`.
2. **Immediate Access**: User added to circle, navigates through custom liquid glass bottom tab bar.
3. **Daily Moment Capture**: Opens camera viewfinder, snaps photo, posts to Daily Moments.
4. **Chat Engagement**: Sends voice note in circle chat, reviews pinned guidelines modal.
5. **Safe Departure**: Leaves circle or mutes notifications via Circle Management sheet.

---

## 8. Mobile Parity Checklist & Visual Invariants

| Category | Mobile Checklist Requirement | Verification Status |
|---|---|---|
| **Bare Icon Invariant** | All navigation and action icons (Home, Messages, Plus, User, Trash, X) must render as bare SVG glyphs with NO enclosing square boxes or gray container frames. | Verified in `_layout.tsx` & `MobileCreatePollModal.tsx`. |
| **Floating Glass Controls** | Tab bar and header action strips use `BlurView` backdrop blur + translucent tint (`colors.glass`). | Verified in `CustomLiquidTabBar`. |
| **Bottom Sheet Animation** | Modals on mobile slide up smoothly from bottom edge with rounded top corners (`borderTopLeftRadius: 24`). | Verified in `MobileCreatePollModal`. |
| **Safe Area Insets** | Inputs, floating tab bar, and header avoid device notch and bottom home swipe indicator (`useSafeAreaInsets`). | Verified in `apps/mobile/app/_layout.tsx`. |
| **Haptic Feedback** | Light touch haptics (`Haptics.selectionAsync()`) trigger on tab switch, option addition, and voting. | Verified in `MobileCreatePollModal.tsx`. |
| **Keyboard Avoidance** | Virtual keyboard smoothly offsets inputs without content overlap or clipping. | Verified with `KeyboardAvoidingView`. |

---

## 9. Test Execution & Automation Guide

### 9.1 Live Test Runner Script (`scripts/run-ui-ux-tests.mjs`)
The automated test runner executes the core test matrix against the running browser session:
```bash
# Execute full automated UI/UX test suite
node scripts/run-ui-ux-tests.mjs
```

### 9.2 Key CLI Inspection Commands (`scripts/brave-ctl.mjs`)
```bash
# 1. Check browser bridge connection
node scripts/brave-ctl.mjs status

# 2. Navigate to Home Hub
node scripts/brave-ctl.mjs navigate "http://localhost:3000"

# 3. Trigger Create Poll modal (R1 verification)
node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Attach file\"]').click()"
node scripts/brave-ctl.mjs eval "Array.from(document.querySelectorAll('.animate-in button')).find(b => b.innerText.includes('Create Poll')).click()"

# 4. Verify modal bounding box (ensures centered, NOT clipped to 76px)
node scripts/brave-ctl.mjs eval "(() => { const m = document.querySelector('form')?.parentElement; return m ? m.getBoundingClientRect() : null; })()"

# 5. Toggle Dark Theme
node scripts/brave-ctl.mjs eval "document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-theme', 'dark');"

# 6. Capture Visual Screenshot
node scripts/brave-ctl.mjs screenshot "tc14_create_poll_modal.png"
```

---

## 10. Pass / Fail Acceptance Criteria

| Gate | Acceptance Standard | Measurement Tool |
|---|---|---|
| **Poll Modal Centering** | Modal overlay spans 100% viewport width and height; modal dialog is centered with height >= 400px and zero clipping. | DOM BoundingClientRect via `brave-ctl.mjs eval` |
| **Dark Theme Legibility** | All text, inputs, cards, and modal dialogs maintain WCAG AA contrast ratio >= 4.5:1. Zero unrendered Tailwind phantom tokens. | Visual screenshot inspection + computed CSS styles |
| **Functional Pass Rate** | 100% of clickable flows in TC-001 to TC-038 execute cleanly without unhandled JavaScript exceptions. | Automated runner exit code 0 |
| **Build & Typecheck** | `apps/web` builds cleanly (`npm run build`); `apps/mobile` passes TypeScript check (`npx tsc --noEmit`). | Node build commands |
| **Mobile Parity** | All Web features mapped to corresponding mobile components with bare icon invariant and touch ergonomics. | Parity audit matrix (§3 & §8) |
