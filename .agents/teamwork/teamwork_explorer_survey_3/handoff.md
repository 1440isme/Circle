# Handoff Report — Test Planning & UI/UX Technical Investigation

**Author:** teamwork_explorer_survey_3  
**Target:** Orchestrator & Team Engineers  
**Date:** 2026-11-09T16:19:30Z  
**Type:** Hard Handoff (Investigation & Test Plan Complete)  

---

## 1. Observation

1. **Testing Infrastructure Services & Ports:**
   Ran `ss -tulpn | grep -E ':(3000|4000|9222|9333)'`:
   - `127.0.0.1:9222`: Brave browser remote debugging port (PID 5585)
   - `127.0.0.1:9333`: `brave-bridge.mjs` Node HTTP server (PID 19722)
   - `*:4000`: NestJS backend API (`apps/backend`, PID 19509)
   - `*:3000`: Next.js web application (`apps/web`, PID 19651)
   All 4 services are verified active and responsive.

2. **Automation Control Client API:**
   Inspected `scripts/brave-ctl.mjs` and `scripts/brave-bridge.mjs`:
   `brave-ctl.mjs` supports actions: `status`, `eval`, `click`, `navigate`, and `screenshot`.
   Verified with `node scripts/brave-ctl.mjs status` returning active browser tabs, and `node scripts/brave-ctl.mjs navigate "http://localhost:3000"` returning `{ ok: true, title: "CIRCLE — Nền tảng Kết nối & Tương tác Nhóm Thân mật", url: "http://localhost:3000/" }`.

3. **Create Poll Modal Distortion Root Cause:**
   - In `apps/web/src/components/chat/ChatComposer.tsx` (lines 419-420, 694), `CreatePollChatModal` is rendered inside an ancestor container:
     `<div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3 sm:pb-4 flex flex-col items-center ... backdrop-blur-[2px]">`
   - Bounding rect inspection via `brave-ctl.mjs eval`:
     - Viewport dimensions: `width: 1920px, height: 925px`
     - Modal Overlay: `x: 416, y: 849, width: 1056, height: 76`
     - Modal Box: `top: 663.25, height: 447.5`
   - Even though the overlay has CSS `fixed inset-0`, its containing block is trapped within the 76px tall composer container because CSS specification dictates that any element with `backdrop-filter` (`backdrop-blur-[2px]`) acts as a containing block for `fixed` descendants.

4. **Dark Theme Display Inconsistencies:**
   - In `apps/web/src/components/tools/CirclePollView.tsx` (lines 253, 348), `CirclePlanningView.tsx` (lines 204, 212, 263), and `LanguageSwitcher.tsx` (line 39):
     Classes like `dark:border-circle-dark-border`, `dark:bg-circle-dark-bg`, `dark:hover:bg-circle-dark-hover`, and `dark:bg-circle-dark-card` are used.
   - In `apps/web/tailwind.config.ts` (lines 19-29):
     Configured tokens under `circle.dark` are ONLY: `canvas`, `surface`, `elevated`, `warm`, `hairline`, `text`, `muted`, `wash`, `primary`.
     Because `border`, `bg`, `hover`, and `card` are undefined in Tailwind config, Tailwind generates zero CSS rules for those classes, leaving elements with broken or light mode fallback styles.

5. **Module 09 (Admin Dashboard) Status:**
   - Evaluated route `/admin` with `node scripts/brave-ctl.mjs navigate "http://localhost:3000/admin"`.
   - Result: `{ ok: true, title: "404: This page could not be found.", url: "http://localhost:3000/admin" }`.
   - Confirmed `apps/web/src/app/admin` does not yet exist. In `agentic/playbooks/09-admin-moderation.md`, this is marked as "Proposal / Supplemental Baseline" and currently 🚧 WIP.

---

## 2. Logic Chain

1. **Bug R1 (Create Poll Modal):**
   - Observation 3 proves that the overlay of `CreatePollChatModal` is constrained to `height: 76px, y: 849px` instead of the full viewport (`height: 925px`).
   - The ancestor element at line 419 in `ChatComposer.tsx` has `backdrop-filter: blur(2px)`.
   - Per W3C CSS Transforms Module Level 1 and CSS Filter Effects, an ancestor with `filter` or `backdrop-filter` establishes a local containing block for `position: fixed` descendants.
   - Therefore, the modal box (height 447.5px) is forced to position relative to the 76px input bar, pushing it downward and causing severe vertical clipping and distortion.
   - Solution logic: Moving `CreatePollChatModal` out of the composer into a React Portal (`createPortal(modal, document.body)`) or rendering it at the root of `HomePage` / `ChannelChatView` eliminates the containing block constraint and restores centered modal rendering.

2. **Bug R1 (Dark Theme Display Defects):**
   - Observation 4 shows that components rely on Tailwind classes `dark:border-circle-dark-border`, `dark:bg-circle-dark-bg`, and `dark:hover:bg-circle-dark-hover`.
   - Tailwind CSS only produces utility classes for keys explicitly declared in `tailwind.config.ts`.
   - The theme config lacks these keys; thus, the browser receives no dark background or dark border styles for these elements.
   - Solution logic: Standardizing all component styling to valid tokens (`dark:bg-circle-dark-surface`, `dark:border-circle-dark-hairline`, `dark:hover:bg-circle-dark-elevated`) or extending `tailwind.config.ts` will resolve the widespread dark display defects.

3. **Master Test Plan Feasibility (R2 & R3):**
   - Observation 1 & 2 confirm that `scripts/brave-ctl.mjs` connected to port 9333 and Brave 9222 executes commands, evaluates DOM queries, and captures high-resolution screenshots without requiring Playwright.
   - A complete 41-case test matrix covering Modules 01-07 and 09 has been compiled in `analysis.md` with exact CLI execution commands.

---

## 3. Caveats

- Direct P2P audio/video WebRTC calling between multiple separate users was inspected structurally via `CallStageModal.tsx` and `calls.controller.ts`; full end-to-end multi-peer media stream verification requires two active browser sessions running concurrently.
- Module 09 (Admin Dashboard) is not yet implemented on the web frontend (`/admin` returns 404); the test plan notes this as 🚧 WIP in compliance with `agentic/playbooks/09-admin-moderation.md`.
- No modifications were made to application source code during this turn, strictly adhering to the read-only Technical Investigator archetype.

---

## 4. Conclusion

The testing infrastructure and automation pipeline are fully operational and verified. The root causes for both immediate bug requirements (Create Poll layout distortion and Dark theme styling defects) have been definitively isolated down to the exact CSS containing block and Tailwind token mismatches. The comprehensive Master Test Plan detailing all clickable interactions across Modules 01–07, 09, contrast/responsiveness/i18n checks, and exact `brave-ctl.mjs` commands is finalized in `analysis.md`.

---

## 5. Verification Method

To independently verify all findings and test commands, execute:

1. **Verify Services & Port Status:**
   ```bash
   ss -tulpn | grep -E ':(3000|4000|9222|9333)'
   ```
2. **Verify Browser Bridge & Page Status:**
   ```bash
   node scripts/brave-ctl.mjs status
   ```
3. **Verify Modal Containing Block Issue Live:**
   ```bash
   # Navigate to circle, open plus menu, trigger Create Poll
   node scripts/brave-ctl.mjs eval "document.querySelectorAll('.group.cursor-pointer')[0].click()"
   node scripts/brave-ctl.mjs eval "document.querySelector('button[title*=\"Attach file\"]').click()"
   node scripts/brave-ctl.mjs eval "Array.from(document.querySelectorAll('.animate-in button')).find(b => b.innerText.includes('Create Poll')).click()"
   # Inspect overlay height (shows trapped ~76px height)
   node scripts/brave-ctl.mjs eval "(() => { const o = document.querySelector('form').parentElement.parentElement; const r = o.getBoundingClientRect(); return { y: r.y, height: r.height, width: r.width }; })()"
   ```
4. **Inspect Master Test Plan:**
   Review `/home/tcb/Documents/TLCN/Circle/.agents/teamwork/teamwork_explorer_survey_3/analysis.md`.
