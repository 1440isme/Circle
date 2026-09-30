# Rules (Must / Must-Not)

Hard rules for any AI agent or engineer working in the CIRCLE repository. **Always loaded** via [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md). Violating these rules is a direct defect, not a matter of style preference.

---

## 1. Source of Truth Hierarchy

When conflicts or ambiguities arise, you must strictly follow this priority order:

1. **Official Course Rubric** — Supreme criteria for Level 5 evaluation.
2. **Official TLCN Mission Document** — Official feature scope and registered domain.
3. **Official TLCN Implementation Plan** — Approved 19-week timeline and milestones.
4. **Product Commitment & KPI Metrics** — Formal commitment locked before the 50% milestone.
5. **[`PROJECT_GOD.md`](../PROJECT_GOD.md)** — Canonical project definition, SDLC, DoD, and evidence governance.
6. **SRS / SDD / ADR / Backlog / Issues / PRs** — Technical specifications for approved decisions.
7. **Source Code / Infrastructure / Deployment** — Implementation reality.
8. **AI Suggestions & Generated Content** — **Input suggestions only, never truth.**

> [!CAUTION]
> **Immutable Rule:** Never silently alter the official scope or requirements to fit implementation. If a discrepancy is found: **STOP → Open an Issue/Discussion → Report to Engineers (Bình & Hạnh) & Supervisor (ThS. Nguyễn Trần Thi Văn)**.

---

## 2. 10 Hard Gates (Rubric Level 5 Red Lines)

- **G1 (Working Product & Real Metrics):** Production-ready system deployed with authentic measurement metrics.
- **G2 (Weekly Reports):** No missed weekly reports (`docs/evidence/weekly-reports/Wxx.md`).
- **G3 (AI Usage Declaration):** Zero unlogged AI usage; must record every AI interaction in [`docs/ai-usage/log.md`](../docs/ai-usage/log.md).
- **G4 (AI Code Understandability):** Engineers must be able to explain 100% of any randomly selected AI-generated code during thesis defense.
- **G5 (Automated Testing):** Comprehensive automated testing suites (Unit, Integration, API, E2E) are mandatory; manual-only testing fails Level 5.
- **G6 (Automated CI/CD):** Fully automated CI/CD pipeline with at least 10 automated deployments across the lifecycle.
- **G7 (Authentic User Testing):** Real user experiment dataset with anonymized protocols and verifiable survey records.
- **G8 (Repository Accessibility & Security):** Zero leaked credentials, secrets, or API keys in git history; pristine repository hygiene.
- **G9 (Scope Proportionality):** Core registered features must be rock-solid before adding peripheral extras.
- **G10 (Academic Integrity):** Zero fabricated data, simulated metrics, fake survey respondents, or fake commit history.

---

## 3. Git, Branching & Peer Review Rules

- **Issue-First Rule:** Every single task, bug fix, feature, or refactor **MUST be tracked by a GitHub Issue** before any work begins.
- **Issue Hierarchy:** Weekly Goal Issues (`[GOAL-WXX]: ...`) track sprint milestones; child task issues track concrete deliverables.
- **1 Issue = 1 PR:** Every issue has a corresponding PR targeting the **`dev`** branch (Staging/Integration).
- **Environment Discipline:** `main` is production (releases only). `dev` (`develop`) is integration. All feature/fix branches branch from `dev` and **MUST merge into `dev`**.
- **Description Standard:** Both Issues and PRs must explicitly answer: **What** (what changed), **Why** (reason/value), and **Done When** (acceptance criteria / verification proof).
- **Never commit directly to `main` or `develop`.**
- **Branch naming convention:** `<type>/<issue-id>-<slug>` (e.g. `feat/42-refresh-token-rotation`, `fix/87-chat-duplicate-message`).
- **Strict Peer Review Policy:**
  - Self-merging PRs is **STRICTLY PROHIBITED**.
  - Every PR created by Bình **must be reviewed and approved with comments by Hạnh**.
  - Every PR created by Hạnh **must be reviewed and approved with comments by Bình**.
  - Review comments must verify Acceptance Criteria, negative test cases, security checks, and AI usage accuracy.
- **Signed commits:** All commits must adhere to Conventional Commits and include issue references (`#<issue-id>`).
- **Never force-push to shared branches.**

---

## 4. Code Changes & Architecture Discipline

- **Circle-Centric (Group-First) Priority:** Every feature must serve group activities and collaboration. The Circle is the core atom of data, state, and interaction. Never introduce isolated features that diverge from the group-first mission.
- **Do not push or deploy unless explicitly instructed.**
- **Prefer existing abstractions:** Before creating a new service, helper, hook, or component, inspect the codebase to reuse existing utilities.
- **Backend layering (`apps/api`):** Modular monolith; controllers must be thin; business logic belongs in services; database queries through Prisma; domain modules must encapsulate their internals.
- **Web layering (`apps/web`):** Next.js App Router; server components by default; client components (`'use client'`) isolated at the leaves; admin routes unified under `/admin` with RBAC guards.
- **Mobile layering (`apps/mobile`):** React Native Expo; screen components separated from business hooks and native modules (`react-native-webrtc`).
- **Shared contracts (`packages/types`):** Any data model, DTO, or socket event used across client and server must reside in `packages/types`.

---

## 5. Automated AI Usage Logging (Rule 7 & TC2.3 Level 5)

- **AI Agents must automatically append a log record to [`docs/ai-usage/log.md`](../docs/ai-usage/log.md)** for every nontrivial coding, refactoring, or documentation session.
- **Timing of Logging:** Chỉ ghi/cập nhật `docs/ai-usage/log.md` khi tính năng/nhiệm vụ đã hoàn thiện và chuẩn bị mở PR, hoặc khi chốt một chức năng mới độc lập hoàn chỉnh. Tuyệt đối không ghi log phân mảnh cho từng lần tinh chỉnh, trao đổi thảo luận hay các bước sửa đổi nhỏ trung gian chưa chốt.
- **Engineers do not write AI logs manually.** The AI agent is responsible for creating the record format `AI-XXXX`.
- **Honest defect & hallucination reporting:** Any AI mistake, hallucination, or syntax error must be recorded under `AI Errors / Hallucinations Found` with its root cause and fix.

---

## 6. Definition of Done (DoD) Master

No PR or Issue may be marked **Done** unless:
1. **Requirements:** 100% of Acceptance Criteria (`AC-xxx`) and Business Rules (`BR-xxx`) are satisfied.
2. **Architecture:** Documentation and Mermaid diagrams in `docs/architecture/` are updated.
3. **Quality & Tests:** Unit and integration tests added; all existing tests pass; 0 lint errors, 0 TypeScript errors.
4. **Security:** Auth & RBAC enforced; inputs validated with Zod schemas; zero hardcoded secrets.
5. **AI Logging:** Linked entry `AI-XXXX` recorded in `docs/ai-usage/log.md`.
6. **Peer Review:** Approved by the peer engineer.

---

## 7. What Not to Do (Anti-Patterns)

- ❌ Never skip or comment out failing tests to force CI to pass.
- ❌ Never use empty `try {} catch {}` blocks to swallow errors silently.
- ❌ Never commit `.env`, private keys, or credentials to git.
- ❌ Never invent or hallucinate API endpoints, statuses, or user metrics. If unsure, mark `UNKNOWN — needs verification`.
- ❌ Never perform destructive git commands (`git reset --hard`, `git push --force`) on shared branches.
- ❌ Never leave trailing or dead code when replacing features.
- ❌ Never introduce unapproved technologies, third-party libraries, or deviate from the approved architectural roadmap without explicit written discussion and approval (e.g. NEVER arbitrarily use `class-validator` when `Zod` has been mandated).
- ❌ Never commit mock data, dummy datasets, or fake entities into production UI components (Web & Mobile). When backend data is not yet available, UI must display authentic empty states or loading skeletons (Gate 10 - Academic & Production Integrity).
- ❌ Never hardcode raw strings for user-facing texts on Web or Mobile (must use shared localization dictionary `t.*`).
- ❌ Never hardcode raw hex/rgba color values in Web or Mobile UI components (must use design token palette `colors.*` or Tailwind tokens).

---

## 8. Zero Hardcode, Zero Mock Data & Seamless Design Token Mandate (Web & Mobile)

- **Zero Hardcoded Localization (Web & Mobile):** Every human-readable label, prompt, title, error message, button, and placeholder MUST be declared in `packages/shared/src/locales/vi.ts` and `en.ts` and accessed via `t.*`. No inline Vietnamese or English string literals in UI JSX/TSX.
- **Zero Hardcoded Theme Colors (Web & Mobile):** Every color rendered in UI components MUST be resolved from design tokens (`colors.*` from `useThemeStore` / `CircleColors` on mobile, Tailwind theme tokens on web). Raw hex values (`#FFFFFF`, `#000000`, etc.) and arbitrary `rgba(...)` in component styling are strictly forbidden.
- **Zero Mock Data in Components:** Components must strictly bind to real data from stores/APIs. Fake sample circles, mock member counts, or simulated entities are strictly banned from UI code. If data is pending or empty, show authentic Empty States.
- **Seamless Infinite Canvas on Mobile:** Mobile applications (`apps/mobile`) must deliver an organic, fluid native mobile experience without rigid rectangular bounding boxes, artificial card partitions, or abrupt header divides. Content flows continuously on a unified canvas background (`colors.canvas`), guided by typography scale, icon accents, and breathing room (whitespace).
- **Step-by-Step Native Flow:** Multi-step workflows on mobile (Registration, Forgot Password, Account Setup) must follow an unboxed step-by-step wizard pattern (1 action/question per screen) rather than legacy long form-filling.


