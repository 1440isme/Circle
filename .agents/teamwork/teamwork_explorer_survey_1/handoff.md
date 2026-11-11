# Handoff Report: Create Poll Modal Layout Distortion Bug Investigation

- **Author**: `teamwork_explorer_survey_1` (Technical Investigator)
- **Target Role / Agent**: Implementer / Orchestrator (`57bfc123-1132-43b5-92f4-d09fe4f1ccf6`)
- **Date**: 2026-11-09T16:24:00Z
- **Type**: Hard Handoff (Investigation Complete & Verified)

---

## 1. Observation

1. **Mount point in Chat Composer**:
   In `apps/web/src/components/chat/ChatComposer.tsx` lines 419-420 and lines 693-700:
   ```tsx
   419: <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center bg-gradient-to-t from-white/98 dark:from-circle-dark-surface/98 via-white/80 dark:via-circle-dark-surface/80 to-transparent backdrop-blur-[2px] transition-colors">
   420:   <div className="pointer-events-auto w-full max-w-3xl flex flex-col gap-2">
   ...
   693:     {circleId && (
   694:       <CreatePollChatModal
   695:         isOpen={isCreatePollOpen}
   696:         onClose={() => setIsCreatePollOpen(false)}
   697:         circleId={circleId}
   698:         onPollCreated={handlePollCreated}
   699:       />
   700:     )}
   701:   </div>
   702: </div>
   ```

2. **Modal Markup in `CreatePollChatModal.tsx`**:
   In `apps/web/src/components/chat/CreatePollChatModal.tsx` lines 85-88:
   ```tsx
   85: return (
   86:   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
   87:     <div className="relative w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-xl animate-in zoom-in-95 duration-150">
   ```

3. **Live Browser Runtime Inspection (`scripts/brave-ctl.mjs eval`)**:
   Querying the bounding rects and ancestor computed styles:
   - Composer root container computed style: `backdropFilter = "blur(2px)"`.
   - Composer root container rect: `{ top: 849, bottom: 925, left: 416, right: 1472, width: 1056, height: 76 }`.
   - Backdrop (`fixed inset-0`) computed rect: `{ top: 849, bottom: 925, left: 416, right: 1472, width: 1056, height: 76 }`.
   - Modal card (`relative w-full max-w-md`) computed rect: `{ top: 663.25, bottom: 1110.75, width: 448, height: 447.5 }`.
   - Submit button (`button[type="submit"]`) computed rect: `{ top: 1053.75, bottom: 1085.75, height: 32 }`.
   - Viewport height: `window.innerHeight = 925`.
   - Visual inspection screenshot (`create_poll_chat_modal_opened.png`): Modal card is visibly pushed downwards, cutting off the bottom 185.75px. Submit and Cancel buttons are completely offscreen.

4. **Sibling Defect**:
   In `apps/web/src/components/chat/ChatComposer.tsx` line 519: `FullEmojiPickerModal` is mounted inside the exact same container.
   Computed rect when opened: `backdrop.height = 76`, `modal.bottom = 1123` (vượt ngoài màn hình 198px, screenshot `emoji_modal_distortion.png`).

5. **Test Fix Validation in Live Runtime**:
   When simulating `createPortal(modalContent, document.body)` in Brave DevTools:
   - Backdrop rect: `{ top: 0, bottom: 925, left: 0, right: 1920, width: 1920, height: 925 }`.
   - Modal card rect: `{ top: 238.75, bottom: 686.25, width: 448, height: 447.5 }`.
   - Submit button rect: `{ top: 629.25, bottom: 661.25, height: 32 }`.
   - Visual inspection screenshot (`poll_modal_portaled_perfect.png`): 100% perfectly centered and fully interactive.

---

## 2. Logic Chain

1. **Step 1 (Containing Block Formation)**:
   CSS Specifications (CSS Filters and Transforms Module) mandate that any element with a `backdrop-filter` property other than `none` acts as a containing block for descendants with `position: fixed`.
   Observation #1 shows line 419 sets `backdrop-blur-[2px]`, creating a containing block with bounding rect `top: 849, bottom: 925, height: 76` (Observation #3).

2. **Step 2 (Trapping of Fixed Backdrop)**:
   Because the composer div is the containing block, `CreatePollChatModal`'s `<div className="fixed inset-0 ...">` (Observation #2) does not expand to the viewport (`1920x925`), but instead is constrained to `height: 76px` at the bottom of the window (`top: 849` to `bottom: 925`).

3. **Step 3 (Flex Centering Offset Displacement)**:
   The backdrop uses `flex items-center justify-center`. Centering a 447.5px card inside a 76px tall box places the vertical center at `Y = 887px`. Half the height (`223.75px`) is placed below `887px`, ending at `Y = 1110.75px`.
   Because `window.innerHeight = 925px`, `1110.75 - 925 = 185.75px` of the modal card falls below the viewport.

4. **Step 4 (Interaction Blockage)**:
   The submit button is located at `1053.75px - 1085.75px` (Observation #3), which is completely invisible and unreachable. Users cannot submit or cancel polls.

5. **Step 5 (Validation of Remediation)**:
   Observation #5 proves that detaching the modal from this containing block via `createPortal(..., document.body)` immediately restores proper viewport bounds (`0` to `925px`) and centers the card at `top: 238.75, bottom: 686.25`.

---

## 3. Caveats

1. **Next.js Hydration & SSR**:
   `document.body` is not available on the server. The portal implementation in `CreatePollChatModal.tsx` MUST use a `mounted` state (`useState(false)` + `useEffect(() => setMounted(true), [])`) to prevent SSR errors and hydration mismatches.
2. **Mobile App Independence**:
   `apps/mobile/src/components/chat/MobileCreatePollModal.tsx` uses React Native's native `<Modal>` component, which renders in a native window hierarchy and is not affected by this CSS containing-block issue.
3. **No alternative interpretations**:
   The root cause is 100% reproducible and confirmed via both visual rendering and mathematical DOM coordinates.

---

## 4. Conclusion

The layout distortion and truncation of `CreatePollChatModal` is caused by `ChatComposer.tsx` line 419 having `backdrop-blur-[2px]`, which creates a CSS containing block that traps the `fixed inset-0` modal inside a 76px high container at the bottom of the screen.

### Remediation Action Plan:
1. **`apps/web/src/components/chat/CreatePollChatModal.tsx`**:
   - Wrap modal markup with `createPortal(modalContent, document.body)` with `mounted` guard.
   - Add `max-h-[90vh] flex flex-col` to modal card and `overflow-y-auto custom-scrollbar` to options form to ensure safety on short viewports with up to 8 options.
   - Add backdrop click-to-close (`onClick={(e) => e.target === e.currentTarget && onClose()}`) and Escape key listener.
   - Add `[color-scheme:light] dark:[color-scheme:dark]` to `<input type="datetime-local" ... />` for Dark theme consistency.
2. **`apps/web/src/components/chat/ChatComposer.tsx`**:
   - Remove `backdrop-blur-[2px]` from line 419 outer wrapper div.
3. **`apps/web/src/components/ui/FullEmojiPickerModal.tsx`**:
   - Wrap with `createPortal(..., document.body)` to fix the identical issue for the emoji picker.

---

## 5. Verification Method

1. **Live Browser Verification via Brave Bridge**:
   - Navigate to chat: `node scripts/brave-ctl.mjs navigate http://localhost:3000`
   - Open plus menu: `node scripts/brave-ctl.mjs eval "document.querySelector('button[title^=\"Attach file\"]').click()"`
   - Click Create Poll: `node scripts/brave-ctl.mjs eval "Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Poll') && b.querySelector('svg.lucide-vote'))?.click()"`
   - Verify bounding rect via script:
     ```bash
     node scripts/brave-ctl.mjs eval "(() => {
       const form = document.querySelector('form.space-y-4');
       const card = form?.parentElement;
       const submit = form?.querySelector('button[type=\"submit\"]');
       return {
         cardTop: card?.getBoundingClientRect().top,
         cardBottom: card?.getBoundingClientRect().bottom,
         submitBottom: submit?.getBoundingClientRect().bottom,
         windowHeight: window.innerHeight,
         isFullyVisible: submit ? submit.getBoundingClientRect().bottom <= window.innerHeight : false
       };
     })()"
     ```
     **Passing Criteria**: `isFullyVisible: true`, `cardBottom < windowHeight`.

2. **Full Application Build**:
   ```bash
   cd /home/tcb/Documents/TLCN/Circle/apps/web && npm run build
   ```
   **Passing Criteria**: Zero TypeScript errors, successful static/SSR generation.

3. **Backend Unit / Integration Tests**:
   ```bash
   cd /home/tcb/Documents/TLCN/Circle/apps/api && npm test
   ```
   **Passing Criteria**: All tests pass without regression.
