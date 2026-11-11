The user requests: "lần này tôi có thêm cho bạn teamwork để tổ chức 1 đội làm việc cho hiệu quả. bạn tự tổ chức sao cho khoa học và hiệu quả làm việc như review cho nhau hoặc 1 kiểm soát 1 làm việc rồi báo cáo, đó tuỳ tôi cho bạn thoải mái tổ chức team của bạn, miễn sao hoàn thành thật tốt cho tôi". Thoroughly test all application features and clickable user interactions to evaluate UI/UX, fix widespread Dark theme display issues, and resolve the layout bug in the Create Poll modal in chat.

Working directory: /home/tcb/Documents/TLCN/Circle
Integrity mode: development

## Requirements

### R1. Immediate Bug Fixes (Dark Theme & Poll Modal Layout)
Fix widespread Dark theme display bugs across application views, modals, dropdowns, and message cards, ensuring proper contrast, legible glassmorphism, and consistent token usage. Resolve the layout distortion of the Create Poll modal (`CreatePollChatModal.tsx`) when opened via the chat composer plus button.

### R2. Master Test Plan & Phased UI/UX Testing
Develop a comprehensive test plan detailing all clickable interactions and features across application modules. Sequentially execute testing and inspection according to the plan, verifying UI/UX, contrast, layout, responsiveness, and i18n VI/EN.

### R3. Controlled Testing Environment & Live Browser Inspection
Perform all live UI/UX testing using the provided local setup: backend on port 4000, frontend on port 3000, and browser interaction driven by `scripts/brave-ctl.mjs` through `scripts/brave-bridge.mjs` (port 9333) connected to Brave DevTools (`127.0.0.1:9222`) using test account `abc@abc.com` / `Password123@!`. Do not use Playwright directly.

### R4. Team Organization & Governance
Organize the team into complementary roles (e.g. implementer, reviewer, QA auditor) for rigorous cross-review and verification before reporting. Adhere to project guidelines (`PROJECT_GOD.md`, `agentic/memory/MEMORY.md`, and log non-trivial AI usage into `docs/ai-usage/log.md`).

## Acceptance Criteria

### Bug Fixes
- [ ] Create Poll modal (`CreatePollChatModal.tsx`) renders cleanly without layout distortion when triggered from the chat composer plus button.
- [ ] Dark theme displays properly across tested views, modals, dropdowns, and message cards without unreadable text, broken contrast, or misaligned glassmorphism styling.

### Test Execution & Documentation
- [ ] A detailed master test plan covering clickable user interactions across modules is documented.
- [ ] Live testing is conducted using `scripts/brave-ctl.mjs` with visual screenshots captured for tested views and interactions.
- [ ] A structured test report records all test steps, passed items, and any identified UI/UX defects.

### Build & Quality
- [ ] Web application build (`apps/web`: `npm run build`) and backend tests (`apps/api`: `npm test`) pass without regression.
