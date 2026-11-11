# Comprehensive Dark Theme Defect Audit & Remediation Plan

**Working Directory**: `apps/web`  
**Investigator**: `teamwork_explorer_survey_2`  
**Date**: 2026-11-09  
**Status**: COMPLETE INVESTIGATION & REMEDIATION BLUEPRINT  

---

## 1. Executive Summary & Architectural Root Causes

An exhaustive audit of the `apps/web` frontend revealed that Dark theme degradation across views, modals, dropdowns, and message cards does not stem from a single broken stylesheet, but from **four distinct systemic root causes**:

1. **Phantom / Unregistered Tailwind Design Tokens**:
   Developers assumed several intuitive token names (`circle-dark-bg`, `circle-dark-border`, `circle-dark-hover`, `circle-dark-card`, `circle-primary-hover`, `circle-primary-dark`, `circle-success`) were defined in `tailwind.config.ts`. In reality, none of these tokens exist in Tailwind configuration. Consequently, in Dark mode, Tailwind emits zero CSS for these classes, causing transparent table backgrounds, missing borders, unstyled dropdown cards, and broken hover states.
2. **Modal Containing Block Trap (The Create Poll Layout Distortion Bug)**:
   In `ChatComposer.tsx:419`, the container uses `backdrop-blur-[2px]`. Under the W3C CSS Filter and Backdrop Filter specification, any non-none value for `backdrop-filter` creates a new containing block for all `position: fixed` descendants. Both `CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx` are rendered as children of `ChatComposer.tsx`. When opened, their `fixed inset-0` coordinates are constrained to the small bottom bar of the chat composer rather than the viewport, squishing and distorting the modal at the bottom of the screen.
3. **Invalid Tailwind CSS Utility Classes**:
   18 occurrences across 11 files use `backdrop-blur-xs`, and 12 occurrences across 8 files use `focus:outline-hidden`. In Tailwind CSS v3, the smallest blur utility is `backdrop-blur-sm`, and outline removal is `focus:outline-none`. Browsers ignore `backdrop-blur-xs`, resulting in completely flat, non-blurred modal backdrops.
4. **Hardcoded or Unsynchronized Foreground/Background Contrast Pairs**:
   Multiple buttons and embed cards hardcode dark text (`text-circle-charcoal` / `#17171A`) on `bg-circle-primary` or hover states without providing a dark variant, or omit `dark:border-circle-dark-hairline` on modal cancel buttons and search bars.

---

## 2. Root Cause 1: Phantom Design Tokens Matrix

The table below lists all phantom tokens identified across `apps/web/src`, their locations, and their exact token replacement according to CIRCLE Design Tokens (`tailwind.config.ts` and `agentic/playbooks/cross-cutting-gate.md`):

| Phantom Token | Affected Files & Lines | Root Defect | Correct CIRCLE Token Replacement |
|---|---|---|---|
| `circle-dark-bg` | `CirclePlanningView.tsx:130, 186, 263, 336, 367, 481`<br>`CirclePollView.tsx:140, 253`<br>`CircleLocationView.tsx:357` | Does not exist in `tailwind.config.ts`. Elements render with transparent or white background in dark mode. | `circle-dark-canvas` (`#131316`) for full-view canvases, or `circle-dark-surface` (`#1D1D21`) for cards |
| `circle-dark-border` | `CirclePlanningView.tsx:197, 198, 204, 212, 223, 239, 249, 320, 336, 395, 446, 461, 481`<br>`CirclePollView.tsx:168, 195, 253` | Does not exist in `tailwind.config.ts`. Table grid borders, poll card borders vanish in dark mode. | `circle-dark-hairline` (`#2E2E35`) or `white/10` |
| `circle-dark-hover` | `CirclePlanningView.tsx:237, 290, 343, 489`<br>`CirclePollView.tsx:202, 253, 371, 407` | Does not exist in `tailwind.config.ts`. Hovering rows or buttons produces zero visual feedback. | `circle-dark-elevated` (`#2A2A30`) or `circle-dark-wash` or `white/10` |
| `circle-dark-card` | `LanguageSwitcher.tsx:30, 39` | Does not exist in `tailwind.config.ts`. Language dropdown renders with transparent background in dark mode. | `circle-dark-surface` (`#1D1D21`) or `circle-dark-elevated` (`#2A2A30`) |
| `circle-primary-hover` | `CreatePollChatModal.tsx:165, 201`<br>`MomentPlacesMap.tsx:398`<br>`CirclePlanningView.tsx:270, 350, 496`<br>`CirclePollView.tsx:180, 278, 414` | Does not exist in `tailwind.config.ts`. Hovering primary CTA buttons has zero effect. | `circle-sage` (`#059669`) or `circle-primary/90` |
| `circle-primary-dark` | `MessageBubble.tsx:473` | Does not exist in `tailwind.config.ts`. Callback button hover state in call summary messages fails. | `circle-sage` (`#059669`) |
| `circle-success` | `EditProfileModal.tsx:239` | Does not exist in `tailwind.config.ts`. Success feedback banner in profile modal loses text/border color. | `emerald-500` / `emerald-600` or `circle-sage` |

---

## 3. Root Cause 2: Create Poll Modal Layout Distortion Bug

### Observation & Technical Evidence
- **File**: `apps/web/src/components/chat/ChatComposer.tsx`
  - Line 419:
    ```tsx
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center bg-gradient-to-t ... backdrop-blur-[2px] transition-colors">
    ```
  - Line 694:
    ```tsx
    {circleId && (
      <CreatePollChatModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        circleId={circleId}
        onPollCreated={handlePollCreated}
      />
    )}
    ```
- **File**: `apps/web/src/components/chat/CreatePollChatModal.tsx`
  - Line 86:
    ```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
    ```
- **File**: `apps/web/src/components/ui/FullEmojiPickerModal.tsx`
  - Line 44:
    ```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
    ```

### Mechanism of Distortion
Under the **W3C CSS Filter and Backdrop Filter Module Level 1** specification:
> *"A computed value of other than 'none' for `backdrop-filter` creates a containing block for absolute and fixed positioning of descendant elements, and a new stacking context."*

Because `ChatComposer.tsx` defines `backdrop-blur-[2px]`, it creates a containing block for all its descendants. When `CreatePollChatModal` is triggered via the `+` button in the composer:
1. `position: fixed inset-0` does **not** attach to the viewport (`window`). It attaches to `ChatComposer`'s outer container (`absolute bottom-0 left-0 right-0`).
2. The modal's height and width are compressed into the chat composer's bounding box at the bottom of the screen, distorting the modal content into a squashed, scroll-blocked rectangle anchored to the chat input.
3. Furthermore, the parent container has `pointer-events-none`, which creates intermittent click trapping on the modal backdrop.

### Remediation Blueprint
Implement standard React Portal teleportation (`createPortal(content, document.body)`) inside `CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx`. This guarantees that the modal is mounted directly into `document.body` regardless of where it is invoked, completely bypassing any ancestor CSS filters, transforms, or containing blocks.

---

## 4. Detailed Component Audit by Category

### Category 1: Modals and Dialogs

| File | Lines | Issue Description | Remediation |
|---|---|---|---|
| `CreatePollChatModal.tsx` | 86 | `backdrop-blur-xs` is an invalid Tailwind class. Trapped in parent containing block. | Use `createPortal`, replace `backdrop-blur-xs` with `backdrop-blur-sm`. |
| `CreatePollChatModal.tsx` | 104 | Close button lacks explicit dark hover text (`text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash`). | Add `hover:text-circle-charcoal dark:hover:text-circle-dark-text`. |
| `CreatePollChatModal.tsx` | 165, 201 | Uses non-existent `hover:text-circle-primary-hover` and `hover:bg-circle-primary-hover`. | Replace with `hover:text-circle-sage` and `hover:bg-circle-sage` (or `hover:bg-circle-primary/90`). |
| `ClearChatModal.tsx` | 34 | Uses `dark:bg-circle-charcoal` (inconsistent with all other modals) and `dark:border-circle-dark-surface` (muddy low-contrast border). | Replace with `dark:bg-circle-dark-surface` and `dark:border-circle-dark-hairline`. |
| `CircleManagementModal.tsx` | 736 | Outer modal overlay uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleManagementModal.tsx` | 1184 | Close button uses `hover:bg-white` in light mode and `hover:text-circle-charcoal` without `dark:hover:text-circle-dark-text`. | Add `dark:hover:text-circle-dark-text`. |
| `CircleManagementModal.tsx` | 1346 | `p-1 rounded-md border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate hover:bg-circle-canvas transition-colors` missing dark hover bg. | Add `dark:hover:bg-circle-dark-elevated`. |
| `CircleManagementModal.tsx` | 1470 | Danger button uses `border border-circle-hairline` without dark border variant. | Add `dark:border-circle-dark-hairline` or `dark:border-red-900/50`. |
| `CircleManagementModal.tsx` | 2119 | Report form Cancel button: `border border-circle-hairline text-circle-slate` has no dark border, no dark text, and no hover state. | Change to `border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash`. |
| `CircleManagementModal.tsx` | 2286, 2317, 2348, 2379 | Confirmation dialog overlays (Kick, Transfer, Leave, Delete) use `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleManagementModal.tsx` | 2299, 2330, 2361, 2392 | Confirmation dialog Cancel buttons (Kick, Transfer, Leave, Delete): `border border-circle-hairline text-circle-slate` completely lack dark mode border and text styling. | Change to `border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash`. |
| `CircleManagementModal.tsx` | 1861 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `SystemSettingsModal.tsx` | 244, 833, 870 | Outer modal and nested confirmation dialogs use `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `EditProfileModal.tsx` | 204 | Backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `EditProfileModal.tsx` | 231 | Close button has `hover:text-circle-charcoal` without `dark:hover:bg-circle-dark-wash`. | Add `dark:hover:bg-circle-dark-wash`. |
| `EditProfileModal.tsx` | 239 | Uses phantom token `circle-success` (`border-circle-success/30 bg-circle-success/10 text-circle-success`). | Replace with `border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`. |
| `SessionsManagementModal.tsx` | 116 | Back button has `hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated` but `text-circle-slate` lacks `dark:text-circle-dark-muted`. | Add `dark:text-circle-dark-muted`. |
| `MapLocationPickerModal.tsx` | 325 | Backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `MapLocationPickerModal.tsx` | 354 | Search icon `text-circle-slate` lacks `dark:text-circle-dark-muted`. | Add `dark:text-circle-dark-muted`. |
| `MapLocationPickerModal.tsx` | 360 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `MapLocationPickerModal.tsx` | 368 | Clear button `hover:text-circle-charcoal` lacks dark hover text. | Add `dark:hover:text-circle-dark-text`. |
| `CircleWheelView.tsx` | 391 | Create Wheel modal backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleWheelView.tsx` | 417, 453 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `CircleAnonymousView.tsx` | 232 | Compose modal backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleAnonymousView.tsx` | 282 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `CircleCalendarView.tsx` | 760 | Create Event modal backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleCalendarView.tsx` | 786, 836, 855 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `CircleAlbumsView.tsx` | 434 | Create Album modal backdrop uses `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |
| `CircleAlbumsView.tsx` | 460, 473 | Uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |

---

### Category 2: Dropdown Menus and Popovers

| File | Lines | Issue Description | Remediation |
|---|---|---|---|
| `LanguageSwitcher.tsx` | 30, 39 | Uses phantom token `circle-dark-card` on trigger hover (`dark:hover:bg-circle-dark-card`) and popover menu container (`dark:bg-circle-dark-card/95`). Popover renders with broken background in dark mode. | Replace with `dark:hover:bg-circle-dark-elevated` and `dark:bg-circle-dark-surface/95` (or `dark:bg-circle-dark-elevated/95`). |
| `Sidebar.tsx` | 141-158 | Circle selector popover: items lack explicit badge text color on line 158 (`bg-circle-primary/10 text-[9px] font-bold`). | Add `text-circle-sage dark:text-circle-primary`. |
| `ChannelChatView.tsx` | 486-508 | Header 3-dots action menu: Search and Pin item icons hardcode `text-circle-slate` without `dark:text-circle-dark-muted`. | Add `dark:text-circle-dark-muted` on lines 495 and 506. |
| `LocationSearchInput.tsx` | 147 | Autocomplete dropdown header separator has `border-b border-circle-hairline/40` without dark border. | Add `dark:border-circle-dark-hairline/40`. |
| `LocationSearchInput.tsx` | 110 | Input uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `Header.tsx` | 116 | Popover mixes `.glass` class with explicit background classes. In Flat mode, `.glass` override applies `!important` border and surface. | Harmonize popover styling using explicit design tokens `bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl`. |

---

### Category 3: Chat Message Cards, Reaction Bars, Reply Threads, Pinned Items

| File | Lines | Issue Description | Remediation |
|---|---|---|---|
| `MessageBubble.tsx` | 473 | Callback button in call summary message uses phantom token `hover:bg-circle-primary-dark`. | Replace with `hover:bg-circle-sage` or `hover:bg-circle-primary/90`. |
| `MessageBubble.tsx` | 580 | Overlapping reaction badge: `bg-white/95 dark:bg-circle-dark-surface px-1.5 py-0.5`. Glassmorphism blur missing for smooth bubble blend. | Add `backdrop-blur-sm` and ensure border uses `dark:border-circle-dark-hairline`. |
| `MessageBubble.tsx` | 626 | 3-dots menu button hover state in light mode uses `hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas`. | Standardize with `hover:bg-circle-wash dark:hover:bg-circle-dark-wash`. |
| `ChatPollCard.tsx` | 114 | Unselected option in sender's own message: `border-white/15 bg-black/10 hover:bg-black/15 text-current`. In dark mode emerald bubble (`#064E3B`), `bg-black/10` produces poor contrast. | Use `bg-black/20 hover:bg-black/30 dark:bg-white/10 dark:hover:bg-white/15` for consistent visibility across both light and dark themes. |
| `ChatPollCard.tsx` | 141 | Unselected radio circle border hardcodes `border-circle-slate/40` without dark variant. | Add `dark:border-circle-dark-muted/40`. |
| `CalendarEventChatEmbed.tsx` | 261, 289, 401, 431 | Date block header, RSVP checkmark, and avatar initials hardcode `bg-circle-primary text-circle-charcoal`. In dark mode, `#17171A` text on mint green `#34D399` has acceptable contrast, but should use theme token `text-circle-charcoal dark:text-circle-dark-canvas`. | Explicitly specify `text-circle-charcoal dark:text-[#131316]`. |
| `PinnedMessagesModal.tsx` | 135 | File attachment badge inside pinned card hardcodes `text-circle-slate` without dark text variant. | Add `dark:text-circle-dark-muted`. |

---

### Category 4: Group Tools Views (Planning, Polls, Location, CustomDateTimePicker)

| File | Lines | Issue Description | Remediation |
|---|---|---|---|
| `CirclePlanningView.tsx` | 130, 186, 367 | View containers use phantom token `dark:bg-circle-dark-bg`. Rendered transparent/white in dark mode. | Replace with `dark:bg-circle-dark-canvas`. |
| `CirclePlanningView.tsx` | 197, 198, 204, 212, 223, 239, 249, 320, 395, 446, 461 | Spreadsheet table borders, headers, and separators use phantom token `dark:border-circle-dark-border` or `dark:divide-circle-dark-border`. Table grid disappears in dark mode. | Replace with `dark:border-circle-dark-hairline` and `dark:divide-circle-dark-hairline`. |
| `CirclePlanningView.tsx` | 237, 290, 343, 489 | Row and button hover states use phantom token `dark:hover:bg-circle-dark-hover`. Zero hover effect in dark mode. | Replace with `dark:hover:bg-circle-dark-elevated` or `dark:hover:bg-white/5`. |
| `CirclePlanningView.tsx` | 263, 336, 481 | Cell editing input and modal inputs use phantom tokens `dark:border-circle-dark-border` and `dark:bg-circle-dark-bg`. Inputs look transparent and broken. | Replace with `dark:border-circle-dark-hairline dark:bg-circle-dark-canvas dark:text-white`. |
| `CirclePlanningView.tsx` | 270, 350, 496 | CTA buttons use phantom token `hover:bg-circle-primary-hover`. | Replace with `hover:bg-circle-sage`. |
| `CirclePollView.tsx` | 140 | Container uses phantom token `dark:bg-circle-dark-bg`. | Replace with `dark:bg-circle-dark-canvas`. |
| `CirclePollView.tsx` | 168, 195 | Poll cards use phantom token `dark:border-circle-dark-border`. | Replace with `dark:border-circle-dark-hairline`. |
| `CirclePollView.tsx` | 202 | Closed poll badge uses phantom token `dark:bg-circle-dark-hover`. | Replace with `dark:bg-circle-dark-elevated`. |
| `CirclePollView.tsx` | 253 | Poll option container uses phantom tokens `dark:border-circle-dark-border`, `dark:hover:border-circle-dark-hover`, and `dark:bg-circle-dark-bg/50`. Poll options become completely unstyled in dark mode. | Replace with `border-gray-200 dark:border-circle-dark-hairline hover:border-gray-300 dark:hover:border-circle-dark-muted bg-gray-50/50 dark:bg-circle-dark-surface/50`. |
| `CirclePollView.tsx` | 278 | Active option text uses phantom token `dark:text-circle-primary-hover`. | Replace with `dark:text-circle-primary`. |
| `CirclePollView.tsx` | 371, 407 | Delete and Cancel buttons use phantom token `dark:hover:bg-circle-dark-hover`. | Replace with `dark:hover:bg-circle-dark-elevated`. |
| `CirclePollView.tsx` | 180, 414 | Submit buttons use phantom token `hover:bg-circle-primary-hover`. | Replace with `hover:bg-circle-sage`. |
| `CustomDateTimePicker.tsx` | 279 | Trigger button uses invalid class `focus:outline-hidden`. | Replace with `focus:outline-none`. |
| `CustomDateTimePicker.tsx` | 343, 350 | Month navigation chevron buttons: `hover:text-circle-charcoal` without `dark:hover:text-circle-dark-text`. When hovered in dark mode, the chevron icon turns `#17171A` and becomes completely invisible against the dark background. | Add `dark:hover:text-white` or `dark:hover:text-circle-dark-text`. |
| `CircleLocationView.tsx` | 357 | Container uses phantom token `dark:bg-circle-dark-bg`. | Replace with `dark:bg-circle-dark-canvas`. |
| `CircleLocationView.tsx` | 265 | Leaflet map popup template hardcodes `<p class="font-bold text-circle-charcoal">${name}</p>`. In dark mode, leaflet container text has contrast issues. | Add dark mode popup class `dark:text-circle-dark-text` or style via Leaflet CSS. |
| `CircleLocationView.tsx` | 471 | Accuracy overlay uses invalid `backdrop-blur-xs`. | Replace with `backdrop-blur-sm`. |

---

## 5. Token System Standardization & Remediation Plan

To permanently prevent regression and align `apps/web` with CIRCLE's Design Constitution (`PROJECT_GOD.md §11` and `agentic/playbooks/cross-cutting-gate.md §2`), we recommend a two-pronged remediation:

### Step 1: Update `tailwind.config.ts` (Defensive Aliases)
Add standard semantic aliases into `apps/web/tailwind.config.ts` under `theme.extend.colors.circle`:
```ts
// In apps/web/tailwind.config.ts
colors: {
  circle: {
    // existing light tokens ...
    primaryHover: '#059669', // alias for sage hover
    success: '#10B981',
    dark: {
      // existing dark tokens ...
      bg: '#131316',        // alias to canvas
      border: '#2E2E35',    // alias to hairline
      hover: '#2A2A30',     // alias to elevated
      card: '#1D1D21',      // alias to surface
    },
  },
}
```
*Rationale*: Adding these aliases provides immediate backward-compatibility for any future author or missed edge case while retaining full fidelity with Circle's obsidian/mint color palette.

### Step 2: Teleport Modals Using React Portals
In `apps/web/src/components/chat/CreatePollChatModal.tsx` and `FullEmojiPickerModal.tsx`:
Wrap the modal return statement in `createPortal(content, document.body)` with a client-side mount check:
```tsx
import { createPortal } from 'react-dom';

export const CreatePollChatModal: React.FC<CreatePollChatModalProps> = (...) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* modal content */}
    </div>,
    document.body
  );
};
```
*Result*: Completely resolves the layout distortion when opened from the chat composer, and ensures keyboard focus trap and z-index layering work across all screen viewports.

### Step 3: Global Sweep of Invalid Classes
1. Replace all 18 occurrences of `backdrop-blur-xs` with `backdrop-blur-sm`.
2. Replace all 12 occurrences of `focus:outline-hidden` with `focus:outline-none`.
3. Replace all instances of `circle-dark-bg`, `circle-dark-border`, `circle-dark-hover`, `circle-dark-card`, `circle-primary-hover` with their standard counterparts:
   - `dark:bg-circle-dark-canvas` / `dark:bg-circle-dark-surface`
   - `dark:border-circle-dark-hairline`
   - `dark:hover:bg-circle-dark-elevated`
   - `hover:bg-circle-sage`

### Step 4: Fix Contrast Inversions
- In `CustomDateTimePicker.tsx:343, 350`: add `dark:hover:text-white`.
- In `CircleManagementModal.tsx:2119, 2299, 2330, 2361, 2392`: add `dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash`.
- In `LanguageSwitcher.tsx:30, 39`: replace `circle-dark-card` with `circle-dark-surface` / `circle-dark-elevated`.
- In `ChatPollCard.tsx:114, 141`: ensure contrast of unselected options on dark bubbles.

---

## 6. Verification Protocol

1. **Static Analysis & Lint Verification**:
   - Run `./scripts/check-agent-map.sh` to ensure doc links integrity.
   - Run `cd apps/web && npm run build` to verify Next.js TypeScript and Tailwind build without warnings.
2. **Interactive UI Verification with Brave DevTools (`scripts/brave-ctl.mjs`)**:
   - Toggle Dark Theme in Settings or Header ThemeToggle (`data-theme="dark"` and class `dark` on `html`).
   - Trigger the `+` button in the Chat Composer and select **Create Poll** (`CreatePollChatModal.tsx`).
     - *Verify*: The modal must appear dead-center on the screen with dim backdrop (`bg-black/60 backdrop-blur-sm`), unconstrained by the composer bar.
     - *Verify*: Input fields, deadline picker, and submit buttons must have crisp dark canvas backgrounds (`#131316`), clear hairline borders (`#2E2E35`), and legible white text (`#F2F2F4`).
   - Open **Group Tools** -> **Planning Sheet** (`CirclePlanningView.tsx`) in Dark mode.
     - *Verify*: Table grid, headers, cells, and editing inputs have visible borders and dark canvas background.
   - Open **Group Tools** -> **Group Poll** (`CirclePollView.tsx`) in Dark mode.
     - *Verify*: Poll cards and options show clean hairline borders and correct vote percentages with contrast.
   - Click Language Switcher in Header/Auth layout in Dark mode.
     - *Verify*: Popover renders with solid dark surface background, not transparent.
   - Open **Custom Date Time Picker** (`CustomDateTimePicker.tsx`) in Calendar / Events.
     - *Verify*: Hovering month navigation chevrons does not turn icons dark/invisible.
