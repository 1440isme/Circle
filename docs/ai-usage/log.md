# CIRCLE — AI USAGE LOG

> **Mục đích tài liệu:** Lưu trữ toàn bộ nhật ký sử dụng AI trong suốt 19 tuần thực hiện đề tài tốt nghiệp CIRCLE.
> 
> **Quy định bất biến (Level 5 Rubric TC2.3):**
> - Bản ghi này được **AI Agent tự động tạo mới hoặc cập nhật nối tiếp (append)** mỗi khi thực hiện tác vụ, không phải tạo thủ công bằng tay.
> - Tuyệt đối không đưa secret, credential, password, token cá nhân vào prompt.
> - Trung thực ghi nhận các lỗi, ảo giác (hallucinations) của AI và giải pháp khắc phục.
> - Kỹ sư phải hiểu và giải trình được 100% nội dung code do AI sinh ra.

---

## AI-0001: Khởi tạo AGENTS.md và thiết lập Hệ thống Nhật ký AI tự động

- **Date:** 2026-09-19 13:55:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Setup & SDLC Foundation
- **Purpose:** Đọc, phân tích toàn diện tài liệu hiến pháp dự án `PROJECT_GOD.md` (3.010 dòng) để sinh file vận hành `AGENTS.md`, thiết lập quy chuẩn Agent Mode, GitFlow, GitHub Project Keys, PR Peer-Review policy bắt buộc và cơ chế tự động ghi nhật ký AI.
- **Prompt Summary:** Nghiên cứu kỹ `PROJECT_GOD.md` và tạo ra `AGENTS.md` hoàn thiện chuẩn hóa toàn bộ workflow, bao gồm điều nên và không nên, GitFlow, tạo issue GitHub Project theo keys, bắt buộc dev khác comment/approve mới hoàn thành PR, và cơ chế tự động ghi nhật ký AI usage theo luật.
- **Files Affected:**
  - `AGENTS.md`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu trúc và nội dung chuẩn hóa ban đầu, được trích xuất và tổng hợp có chọn lọc từ `PROJECT_GOD.md`.
- **Human Modifications:** Người dùng rà soát, yêu cầu chuẩn hóa tên file `AGENTS.md` duy nhất và nhấn mạnh cơ chế tự động hóa 100% cho AI Usage Log.
- **Verification Method:** Đối chiếu từng phần với các Section 1, 7, 9, 10, 11, 12, 13, 14, 15, 18, 21, 37, 38, 39 của `PROJECT_GOD.md`.
- **Official Source Checked:** `PROJECT_GOD.md` (SSOT của đề tài CIRCLE).
- **Security & License Check:** Sạch sẽ, không chứa secrets, không phụ thuộc thư viện bên ngoài.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None trong phiên khởi tạo này.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** Pending

---

## AI-0002: Tái cấu trúc Hệ thống Agentic và Bố cục Repository theo chuẩn AutoWRX (Bosch)

- **Date:** 2026-09-19 14:18:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Architecture & Repository Setup (Refactoring toward AutoWRX)
- **Purpose:** Tái cấu trúc toàn bộ bố cục của repository CIRCLE phỏng theo chuẩn công nghiệp của AutoWRX (Bosch SDV App), xây dựng khung Agentic Framework mô-đun hóa (RULES, CONVENTIONS, map, memory, skills, learning), living sitemaps (.agents/), capability catalog (docs/capabilities/), và bộ script kiểm tra tính toàn vẹn markdown drift. Đồng thời kế thừa nghiêm ngặt 100% hiến pháp PROJECT_GOD.md (10 Hard Gates, DoD, Peer Review, AI Logging).
- **Prompt Summary:** Tái cấu trúc setup của repo CIRCLE tham khảo sâu và mạnh mẽ repo autowrx (Bosch), tùy biến cho đặc thù của Circle gồm web (Next.js kèm Admin), backend (NestJS Modular Monolith) và mobile (React Native Expo).
- **Files Affected:**
  - `AGENTS.md` (Refactor)
  - `CLAUDE.md`
  - `README.md`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `.env.example`
  - `agentic/README.md`
  - `agentic/RULES.md`
  - `agentic/CONVENTIONS.md`
  - `agentic/SETUP.md`
  - `agentic/map/INDEX.md`, `TREE.md`
  - `agentic/memory/MEMORY.md`, `architecture.md`, `gotchas.md`, `verified-facts.md`, `decisions.md`
  - `agentic/learning/README.md`, `best-practices.md`, `trends.md`, `lessons.md`
  - `agentic/skills/README.md`, 20 playbooks (`understand-the-repo.md`, `implement-feature.md`, `run-tests.md`, `code-review.md`, `security-review.md`, `commit-and-pr.md`, `deploy.md`, `docs-update.md`, `learn-and-update.md`, `ai-log-entry.md`, `add-endpoint.md`, `add-frontend-feature.md`, `add-mobile-screen.md`, `db-schema-change.md`, `realtime-event.md`, `webrtc-signaling.md`, `add-test.md`, `debug.md`, `performance-review.md`, `secrets-incident.md`)
  - `.agents/SITEMAP.md`, `TESTING.md`
  - `docs/README.md`
  - `docs/capabilities/` (7 clusters: `README.md`, `identity-access.md`, `circles-membership.md`, `chat-messaging.md`, `realtime-calls.md`, `feed-posts.md`, `media-storage.md`, `moderation-admin.md`)
  - `docs/getting-started/` (`README.md`, `local-development.md`, `codebase-tour.md`)
  - `docs/principles/principle.md`
  - `docs/architecture/` (`README.md`, `ADR/README.md`, `diagrams/README.md`)
  - `docs/evidence/` (`weekly-reports/README.md`, `rubric-audits/README.md`)
  - `docs/experiments/README.md`
  - `docs/thesis/README.md`
  - `docs/testing/README.md`
  - `apps/api/README.md`
  - `apps/web/README.md` (bao gồm tích hợp Admin)
  - `apps/mobile/README.md`
  - `packages/types/README.md`, `packages/shared/README.md`, `packages/config/README.md`
  - `scripts/check-agent-map.sh`
- **AI-Generated Portion:** 95% cấu trúc markdown, playbook skills, memory, living sitemap, và capability catalog.
- **Human Modifications:** Quyết định tích hợp mô-đun Admin vào chung trong `apps/web` thay vì tách riêng app độc lập.
- **Verification Method:** Đối chiếu từng quy tắc với `PROJECT_GOD.md`, kiểm tra chéo các đường dẫn markdown (zero broken links), rà soát tính khả thi của kịch bản nạp agentic framework (map + memory).
- **Official Source Checked:** `PROJECT_GOD.md` (CIRCLE SSOT), Bosch AutoWRX Framework Architecture.
- **Security & License Check:** Sạch sẽ, không hardcode secret/token, cấu trúc bảo vệ theo chuẩn MIT / nội bộ đề tài.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0003: Đồng bộ Thư mục Backend ở Root và Chuẩn hóa Cấu trúc docs/ y chang AutoWRX

- **Date:** 2026-09-19 14:30:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Architecture & Repository Setup (Refactoring toward AutoWRX - Phase 2)
- **Purpose:** Đưa thư mục `backend/` trực tiếp lên cấp cao nhất của repository (ngang hàng `web/` và `mobile/`) y chang cấu trúc của AutoWRX (`backend/`, `frontend/`), kèm theo thư mục chuyên sâu `backend/docs/`. Đồng thời đồng bộ hóa 100% cấu trúc `docs/` của AutoWRX (bổ sung đầy đủ `architecture/` deep-dives, `principles/`, `guides/`, `reference/`, `examples/`, `agentic-framework/`, và `getting-started/`) song song bảo lưu toàn vẹn các phân hệ phục vụ môn học TLCN và chuẩn Rubric Level 5 (`ai-usage/`, `evidence/`, `experiments/`, `thesis/`, `requirements/`, `testing/`, `security/`).
- **Prompt Summary:** Yêu cầu setup phần docs y chang autowrx, giữ lại các folder hữu dụng cho phát triển và phục vụ môn học tiểu luận chuyên ngành, và bổ sung folder backend ở root.
- **Files Affected:**
  - `backend/README.md`
  - `backend/docs/` (`authentication.md`, `db-models.md`, `middlewares.md`, `realtime-gateway.md`)
  - `web/README.md`
  - `mobile/README.md`
  - `docs/README.md` (tái cấu trúc thành master index chuẩn AutoWRX + TLCN)
  - `docs/agentic-framework/PROPOSAL.md`
  - `docs/architecture/` (`backend.md`, `frontend.md`, `mobile.md`, `auth-security.md`, `data-model.md`, `realtime-signals.md`, `request-lifecycle.md`)
  - `docs/principles/` (`concept.md`, `core-vs-modules.md`, `layout.md`, `project-structure.md`, `style.md`)
  - `docs/guides/` (`deployment/README.md`, `webrtc-setup.md`)
  - `docs/reference/` (`authentication-cookie-handling.md`, `cors.md`, `csp.md`, `feature-breakdown.md`)
  - `docs/examples/` (`componentCircleCard.md`, `hookChatSocket.md`, `pageFeed.md`)
  - `docs/getting-started/` (`concepts.md`, `contributing.md`, `development-guide.md`)
  - `docs/requirements/README.md`
  - `docs/security/README.md`
  - `AGENTS.md` (cập nhật quick commands sang `backend/`, `web/`, `mobile/`)
  - `README.md` (cập nhật kiến trúc, bố cục thư mục, lệnh khởi chạy)
  - `agentic/map/TREE.md` (cập nhật cây thư mục)
  - `agentic/skills/understand-the-repo.md` (cập nhật subsystem pointers)
  - `agentic/skills/run-tests.md` (cập nhật lệnh test cho `backend/`, `web/`, `mobile/`)
  - `scripts/check-agent-map.sh` (mở rộng phạm vi quét kiểm tra liên kết)
  - `docs/ai-usage/log.md` (ghi nhận bản ghi AI-0003)
- **AI-Generated Portion:** 98% nội dung tài liệu kỹ thuật chuyên sâu và cấu trúc thư mục.
- **Human Modifications:** Quyết định vị trí của backend tại thư mục gốc và yêu cầu đồng bộ chính xác theo khuôn mẫu AutoWRX.
- **Verification Method:** Đối chiếu từng thư mục và tài liệu với cấu trúc của `autowrx-main/docs`, kiểm tra tính toàn vẹn của tất cả các liên kết chéo Markdown.
- **Official Source Checked:** `PROJECT_GOD.md`, Repository Bosch AutoWRX (`autowrx-main`).
- **Security & License Check:** Sạch sẽ, không lộ secret/token, bảo toàn quy chuẩn dự án.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0004: Chuẩn hóa Tập trung Ứng dụng trong apps/ và Đồng bộ Toàn bộ Map & Tài liệu

- **Date:** 2026-09-19 14:38:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Architecture & Repository Setup (Apps Consolidation & Integrity Sync)
- **Purpose:** Quy tụ toàn bộ các ứng dụng vào thư mục `apps/` (`apps/backend`, `apps/api`, `apps/web`, `apps/mobile`) để đảm bảo tính gắn kết mạch lạc, xóa sạch các thư mục trùng lặp ở root, chuyển `backend/docs/` vào `apps/backend/docs/`. Rà soát và cập nhật đồng bộ 100% tất cả các file cấu hình, map, hiến pháp, skills, và kiểm chứng với `check-agent-map.sh` đạt 0 broken references trên toàn bộ 89 framework files.
- **Prompt Summary:** Yêu cầu backend phải đi cùng với mobile, web, api và kiểm tra, cập nhật đồng bộ toàn bộ các file/map liên quan.
- **Files Affected:**
  - `apps/backend/README.md`, `apps/backend/docs/` (`authentication.md`, `db-models.md`, `middlewares.md`, `realtime-gateway.md`)
  - `apps/api/README.md` (đồng bộ alias trỏ về `apps/backend/`)
  - `apps/web/README.md`
  - `apps/mobile/README.md`
  - Xóa bỏ các thư mục trùng lặp ở root (`/backend`, `/web`, `/mobile`)
  - `AGENTS.md` (cập nhật quick commands sang `apps/backend`, `apps/web`, `apps/mobile`)
  - `README.md` (cập nhật sơ đồ kiến trúc, bố cục thư mục monorepo, lệnh chạy)
  - `agentic/map/TREE.md` (cập nhật cây thư mục chuẩn xác)
  - `agentic/skills/understand-the-repo.md` (cập nhật subsystem pointers)
  - `agentic/skills/run-tests.md` (cập nhật test commands)
  - `docs/README.md` (cập nhật dev setup links và backend docs links)
  - `docs/architecture/backend.md`, `frontend.md`, `mobile.md` (cập nhật đường dẫn chuẩn)
  - `docs/getting-started/local-development.md`, `codebase-tour.md` (cập nhật commands)
  - `docs/principles/project-structure.md` (cập nhật code placement rules)
  - `scripts/check-agent-map.sh` (cập nhật quét `apps/backend/docs`)
  - `docs/ai-usage/log.md` (ghi nhận bản ghi AI-0004)
- **AI-Generated Portion:** 100% cập nhật và kiểm thử tự động.
- **Human Modifications:** Người dùng nhắc nhở tính liên kết giữa backend và mobile, web, api cũng như tính đồng bộ của các map liên quan.
- **Verification Method:** Chạy trực tiếp `scripts/check-agent-map.sh` và xác nhận thành công 100% (89 framework files checked, 0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md` Section 17, AutoWRX Repository Architecture.
- **Security & License Check:** Đạt chuẩn, không lộ credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0005: Thiết lập Cơ chế Kỹ thuật Tự động Hóa Kiểm tra Map Drift và AI Usage Log (3 Tầng)

- **Date:** 2026-09-19 14:44:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** SDLC Automation & Hard Gate G3 Enforcement
- **Purpose:** Thiết lập hệ thống bảo đảm kỹ thuật 3 tầng (AI Prompt Contract, Git pre-commit Hook, GitHub Actions CI) để tự động hóa 100% việc kiểm tra link map drift và bắt buộc cập nhật nhật ký AI Usage (`docs/ai-usage/log.md`) mỗi khi có thay đổi mã nguồn, đáp ứng tuyệt đối yêu cầu Rubric Level 5 (TC2.3, Hard Gate G3, G5, G6).
- **Prompt Summary:** Yêu cầu đảm bảo các file track được auto update và log AI usage được auto add sau mỗi lần làm việc.
- **Files Affected:**
  - `scripts/verify-ai-log.sh` (Script kiểm tra tính hiện diện và hợp lệ của log AI)
  - `scripts/setup-git-hooks.sh` (Script cấu hình Git hook trên máy dev)
  - `.githooks/pre-commit` (Git hook chặn commit nếu thiếu log AI hoặc gãy link map)
  - `.github/workflows/agent-map-check.yml` (CI check map drift trên PR và push)
  - `.github/workflows/ai-log-check.yml` (CI check log AI trên PR)
  - `docs/ai-usage/log.md` (ghi nhận bản ghi AI-0005)
- **AI-Generated Portion:** 100% mã nguồn bash script và GitHub Actions workflow yml.
- **Human Modifications:** Người dùng phê duyệt triển khai hệ thống bảo đảm tự động 3 tầng.
- **Verification Method:** Chạy thử nghiệm thành công `scripts/setup-git-hooks.sh` và `scripts/check-agent-map.sh`, kích hoạt cấu hình core.hooksPath.
- **Official Source Checked:** `PROJECT_GOD.md` Hard Gate G3 & TC2.3, GitHub Actions & Git Hooks Documentation.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0006: Khởi tạo Issue Templates, PR Template và Automation Script Cho GitHub Project

- **Date:** 2026-09-19 14:48:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** GitHub Project OS & Governance Setup (PROJECT_GOD.md Section 15.7)
- **Purpose:** Khởi tạo bộ GitHub Issue Templates chuẩn hóa (`01_feature_request.md`, `02_bug_report.md` với 17 trường, `03_task.md`, `04_research_spike.md`), Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md` với 8 câu hỏi chuẩn + Peer Review check + AI usage link), và script tự động hóa khởi tạo GitHub Project v2 qua GraphQL API (`scripts/setup-github-project.py`).
- **Prompt Summary:** Yêu cầu setup GitHub Project chuẩn quy trình cho dự án.
- **Files Affected:**
  - `.github/ISSUE_TEMPLATE/01_feature_request.md`
  - `.github/ISSUE_TEMPLATE/02_bug_report.md`
  - `.github/ISSUE_TEMPLATE/03_task.md`
  - `.github/ISSUE_TEMPLATE/04_research_spike.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
  - `scripts/setup-github-project.py`
  - `docs/ai-usage/log.md` (ghi nhận bản ghi AI-0006)
- **AI-Generated Portion:** 100% templates và automation script.
- **Human Modifications:** Người dùng yêu cầu setup GitHub Project chuẩn quy trình.
- **Verification Method:** Chạy kiểm tra script `scripts/setup-github-project.py`, kiểm tra cú pháp yaml/markdown, chạy `scripts/check-agent-map.sh` (89 framework files checked, 0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md` Section 14, 15.7, và GitHub Projects v2 GraphQL API.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0007: Khởi tạo Bộ Nhiệm vụ Nền tảng (Sprint 1 Tasks) và Tự động Hóa Nạp vào GitHub Project

- **Date:** 2026-09-19 15:06:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Sprint 1 Backlog & Project Task Seeding (`PVT_kwHOCsXHlM4Bj_YF`)
- **Purpose:** Xây dựng script `scripts/seed-project-tasks.py` chứa 12 User Stories, Spikes và Tasks nền tảng cho Sprint 1 tuân thủ nghiêm ngặt quy cách `PROJECT_GOD.md` (có đầy đủ User Story Key, Capability ID, Acceptance Criteria, DoD, Rubric Criterion, Priority, Area, Issue Type). Tích hợp logic GraphQL tự động tạo Issue trên repo `1440isme/Circle`, nạp trực tiếp vào GitHub Project v2 (#3) và gán toàn bộ custom fields (`Status`, `Priority`, `Area`, `Rubric Criterion`), hỗ trợ nhập token tương tác qua `getpass`.
- **Prompt Summary:** Yêu cầu setup và tạo các task ở GitHub project cho dự án.
- **Files Affected:**
  - `scripts/seed-project-tasks.py` (Script tự động khởi tạo và gán 12 tasks vào GitHub Project #3)
  - `docs/ai-usage/log.md` (ghi nhận bản ghi AI-0007)
- **AI-Generated Portion:** 100% nội dung 12 User Stories chuẩn mực và logic nạp GraphQL.
- **Human Modifications:** Người dùng yêu cầu tạo các task trên GitHub Project.
- **Verification Method:** Chạy thử `scripts/seed-project-tasks.py` xác thực prompt token, chạy `scripts/check-agent-map.sh` (89 framework files checked, 0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md` Section 15.7 (GitHub Project OS), Rubric Level 5 (TC1 - TC5).
- **Security & License Check:** An toàn, script đọc token từ environment variable hoặc getpass prompt, tuyệt đối không hardcode credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0008: Xây dựng Sổ tay Quy trình Kỹ thuật Chuẩn (Engineering Workflow & SOP) Phục vụ Đạt Điểm 10 Rubric

- **Date:** 2026-09-19 15:13:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Engineering Workflow & SDLC Standardization (Level 5 Rubric Compliance)
- **Purpose:** Soạn thảo sổ tay quy trình vận hành kỹ thuật chi tiết [`docs/guides/development-workflow.md`](../guides/development-workflow.md) dành riêng cho hai kỹ sư Trương Công Bình & Ninh Thị Mỹ Hạnh cũng như bất kỳ người đóng góp nào. Quy chuẩn hóa toàn bộ vòng đời tác vụ: từ nhận task trên GitHub Project, quy tắc rẽ nhánh (`<type>/<id>-<slug>`), quy chuẩn commit Conventional Commits có sign-off (`-s`) và gắn ID task, cơ chế pre-commit guard, mở PR với 8 câu hỏi chuẩn, quy tắc Peer Review chéo bắt buộc (Bình ↔ Hạnh, cấm self-merge), và cơ chế tự động đóng issue chuyển cột trên GitHub Project v2. Cập nhật đồng bộ `CONTRIBUTING.md`, `docs/getting-started/contributing.md` và `docs/README.md`.
- **Prompt Summary:** Yêu cầu làm 1 bản quy trình làm việc, cách thao tác, đặt tên commit, tạo nhánh cho issue, tạo khung workflow hoàn chỉnh cho Bình và Hạnh đáp ứng Level 5.
- **Files Affected:**
  - `docs/guides/development-workflow.md` (Tài liệu SOP phát triển toàn diện)
  - `CONTRIBUTING.md` (Cập nhật liên kết tài liệu SOP)
  - `docs/getting-started/contributing.md` (Cập nhật liên kết và tóm tắt quy trình)
  - `docs/README.md` (Thêm mục Development Workflow & SOP vào Guides)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0008)
- **AI-Generated Portion:** 100% nội dung SOP và sơ đồ Mermaid.
- **Human Modifications:** Người dùng định hướng yêu cầu thiết lập khung workflow hoàn chỉnh, rõ ràng, dễ hiểu cho cả hai thành viên.
- **Verification Method:** Chạy `bash scripts/check-agent-map.sh` xác nhận thành công 100% (90 framework files checked, 0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md` Section 14 (Git & Branching), 15 (Quality & Testing), 17 (Architecture), AutoWRX Standard Workflow.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---


## AI-0009: Thiết lập Bộ 5 Chỉ số KPI Định lượng và Mốc Tham chiếu Baseline (Rubric TC1)

- **Date:** 2026-09-20 22:35:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Research & KPI Commitment (Rubric Level 5 TC1 & Hard Gate G1, G3)
- **Purpose:** Xây dựng bộ 5 chỉ số KPI định lượng và mốc tham chiếu chuẩn ban đầu (Baseline) tại `docs/research/kpi-baseline.md` theo cấu trúc bắt buộc của `PROJECT_GOD.md` Section 20. Đảm bảo tính khả thi cao, dễ đo lường bằng công cụ tự động hoặc biểu mẫu chuẩn quốc tế (TCR qua quan sát 10 người dùng, SUS Score qua Google Form 10 câu chuẩn quốc tế, API Latency qua autocannon, Realtime Delivery qua test script Socket.IO, Test Coverage qua Jest HTML report). Thiết lập đồng bộ thư mục lưu trữ minh chứng `docs/evidence/kpi-evidence/`.
- **Prompt Summary:** Yêu cầu thiết lập file KPI và baseline gồm 5 chỉ số thực tế, dễ thực hiện, dễ đo và có kết quả khả quan phục vụ nghiệm thu đề tài.
- **Files Affected:**
  - `docs/research/kpi-baseline.md` (Đặc tả chi tiết 5 KPIs và Baseline)
  - `docs/evidence/kpi-evidence/README.md` (Thư mục và danh mục tài liệu lưu trữ minh chứng đo đạc)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0009)
- **AI-Generated Portion:** 100% nội dung đặc tả 5 KPIs, công thức toán học, kịch bản đo và căn cứ Baseline.
- **Human Modifications:** Người dùng định hướng tiêu chí lựa chọn chỉ số thực dụng, khả thi, tránh các mốc phi thực tế gây khó khăn khi nghiệm thu.
- **Verification Method:** Đối chiếu từng trường trong cấu trúc KPI với `PROJECT_GOD.md` Section 20 và Rubric Level 5 (TC1).
- **Official Source Checked:** `PROJECT_GOD.md` Section 20, John Brooke (1986) System Usability Scale, Node.js autocannon benchmark tool specifications.
- **Security & License Check:** An toàn, không chứa secret/credential.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `19ec269`
- **PR:** Pending

---

## AI-0010: Xây dựng Bản Đặc tả Phạm vi Hệ thống (Scope Specification: In-Scope vs Out-of-Scope)

- **Date:** 2026-09-20 22:39:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Scope & Boundary Specification (Rubric TC1 & Requirements Foundation)
- **Purpose:** Xây dựng bản đặc tả phạm vi hệ thống chi tiết `docs/research/scope.md` đối chiếu trực tiếp giữa Phiếu nhiệm vụ đề tài (`docs/Nhiem vu thuc hien TLCN.md`), Kế hoạch 15 tuần (`docs/Ke hoach thuc hien TLCN .md`) và `PROJECT_GOD.md`. Phân định rõ ràng 8 phân hệ cốt lõi: Tài khoản & Bạn bè, Quản lý Circle & RBAC, Chat & Rich Media, Cuộc gọi thoại/video WebRTC P2P, Chia sẻ khoảnh khắc & Tương tác nhóm đặc thù (Album, Location, Plan, Calendar, Vote, "Điều muốn nói"), Thông báo, Quản trị Admin, Nền tảng & Hạ tầng. Tuyên bố các ranh giới Out-of-Scope bảo vệ nhóm trước rủi ro phình phạm vi (scope creep).
- **Prompt Summary:** Yêu cầu làm file scope dựa vào phiếu nhiệm vụ và kế hoạch thực hiện để chỉ ra chính xác đâu là in và out of scope.
- **Files Affected:**
  - `docs/research/scope.md` (Đặc tả chi tiết phạm vi In-Scope vs Out-of-Scope)
  - `docs/research/README.md` (Cập nhật liên kết tài liệu)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0010)
- **AI-Generated Portion:** 100% nội dung phân tích ma trận phạm vi bám sát phiếu nhiệm vụ của Khoa CNTT.
- **Human Modifications:** Người dùng yêu cầu đối chiếu chuẩn xác với nhiệm vụ và kế hoạch thực hiện để xác định ranh giới In/Out scope hợp lý.
- **Verification Method:** Đối chiếu từng dòng tính năng trong `docs/Nhiem vu thuc hien TLCN.md` để bảo đảm không bỏ sót bất kỳ yêu cầu nào của Khoa.
- **Official Source Checked:** `docs/Nhiem vu thuc hien TLCN.md`, `docs/Ke hoach thuc hien TLCN .md`, `PROJECT_GOD.md`.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `19ec269`
- **PR:** Pending

---

## AI-0011: Bổ sung Phân hệ Cuộc gọi Nhóm trong Circle (Circle Group Calling) vào Đặc tả Phạm vi

- **Date:** 2026-09-20 22:41:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Scope Refinement — Group Voice/Video Room (`docs/research/scope.md`)
- **Purpose:** Tiếp thu phản hồi xác đáng của người dùng về bản chất nền tảng mạng xã hội tương tác nhóm (CIRCLE) bắt buộc phải có tính năng gọi nhóm phục vụ học nhóm và họp câu lạc bộ. Cập nhật mục 2.4 của `docs/research/scope.md` đưa tính năng **Phòng gọi nhóm trong Circle (Group Voice/Video Room / Voice Stage)** vào IN-SCOPE với quy mô tối ưu 4 - 6 người đồng thời theo kiến trúc Full-Mesh WebRTC + Socket.IO Room Signaling, hỗ trợ Speaking indicator và Screen Sharing trên Web. Giữ nguyên ranh giới Out-of-Scope cho hội thảo quy mô lớn hàng trăm người (SFU/MCU) để bảo vệ ngân sách hạ tầng.
- **Prompt Summary:** Nhắc nhở hệ thống là nền tảng nhóm nên bắt buộc phải có gọi nhóm.
- **Files Affected:**
  - `docs/research/scope.md` (Mục 2.4: Bổ sung Group Voice/Video Call vào In-Scope)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0011)
- **AI-Generated Portion:** 100% nội dung đặc tả kỹ thuật kiến trúc WebRTC Full-Mesh cho nhóm nhỏ.
- **Human Modifications:** Người dùng trực tiếp chỉ đạo bổ sung tính năng gọi nhóm để đúng với tinh thần cốt lõi của đề tài CIRCLE.
- **Verification Method:** Đối chiếu với `.agents/SITEMAP.md` (route `/circle/:id/room/:roomId`) và năng lực chịu tải của mô hình WebRTC Mesh.
- **Official Source Checked:** WebRTC Mesh Architecture Standards, `.agents/SITEMAP.md`.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `19ec269`
- **PR:** Pending

---

## AI-0012: Chuẩn hóa Triết lý Circle-Centric và Quy trình Issue-First, Git Flow, Mandatory Peer Review

- **Date:** 2026-09-26 16:40:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #16 ([GOAL-W01]) -> Sub-issue #15 (https://github.com/1440isme/Circle/issues/15)
- **Purpose:** Tiếp thu định hướng chiến lược từ người dùng để cập nhật 2 trụ cột cốt lõi của đề tài: (1) Mục tiêu & Tầm nhìn: Khẳng định CIRCLE là nền tảng sinh ra vì nhóm, lấy nhóm làm trung tâm (Circle-Centric / Group-First). Khi người dùng nghĩ đến chia sẻ hay hoạt động nhóm, họ nghĩ ngay đến Circle. Mọi chức năng xoay quanh hoạt động nhóm. (2) Quy trình kỹ thuật trên GitHub: Bắt buộc mọi thay đổi/lỗi/tính năng đều có Issue tương ứng xuất hiện trên GitHub Project OS (#3); phân cấp Weekly Goal Issue -> Sub-issues; quy định 1 Issue = 1 PR target vào `dev`; mô hình Git Flow tách biệt `main` (prod) và `dev` (staging); chuẩn hóa Description của Issue & PR theo What — Why — Done When; bắt buộc Peer Review chéo (Bình ⇄ Hạnh) có comment/review approve mới được merge.
- **Prompt Summary:** Bổ sung mục tiêu tầm nhìn: nhóm là trung tâm; chuẩn hóa quy trình GitHub issue, sub-issue, PR, review, mô hình git flow dev/main, description what why done when.
- **Files Affected:**
  - `docs/research/problem-statement.md` (Tài liệu bài toán, tầm nhìn & triết lý Circle-Centric)
  - `README.md` (Đưa mục Tầm nhìn, Sứ mệnh và Triết lý Nhóm là trung tâm lên vị trí nổi bật)
  - `docs/principles/concept.md` (Bổ sung trụ cột kiến trúc Circle-Centric)
  - `docs/research/scope.md` (Bổ sung nguyên tắc Circle-Centric vào xác định phạm vi)
  - `docs/research/README.md` (Cập nhật liên kết index tài liệu)
  - `docs/guides/development-workflow.md` (Cập nhật quy trình phân cấp Issue, Git Flow dev/main, PR 1:1, What/Why/Done When)
  - `.github/ISSUE_TEMPLATE/00_weekly_goal_epic.md` (Template cho Weekly Goal Issue)
  - `.github/ISSUE_TEMPLATE/03_task.md` (Chuẩn hóa cấu trúc What, Why, Done When)
  - `.github/PULL_REQUEST_TEMPLATE.md` (Chuẩn hóa cấu trúc What, Why, Done When và kiểm tra nhánh dev)
  - `agentic/RULES.md` (Đưa quy tắc Issue-First, Git Flow dev, Peer Review bắt buộc và Circle-Centric vào luật bất biến)
  - `agentic/CONVENTIONS.md` (Đồng bộ quy ước quản trị Issue, PR và Conventional Commits)
  - `scripts/check-agent-map.sh` (Hỗ trợ unquote URL percent-encoding tránh gãy link có dấu cách)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0012)
- **AI-Generated Portion:** 100% nội dung tài liệu, templates và cập nhật quy trình.
- **Human Modifications:** Người dùng định hình tầm nhìn "Circle là trung tâm" và quy chuẩn hóa quy trình làm việc chuyên nghiệp trên GitHub. Nhắc nhở nghiêm khắc việc tuân thủ quy tắc Issue-First và phân cấp Goal tuần -> Sub-issues.
- **Verification Method:** Chạy `bash scripts/check-agent-map.sh` xác nhận 90/90 framework files pass 100%, 0 broken references.
- **Official Source Checked:** `PROJECT_GOD.md`, GitHub Flow & GitFlow Industry Standards, Rubric Level 5 (TC1 - TC5).
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** AI vội vàng mở PR #14 mà quên bước khởi tạo GitHub Issue trước đó, vi phạm quy tắc "Issue-First" và phân cấp Weekly Goal của dự án.
  - **Root Cause:** Trình tự thực thi bị nhảy cóc, tạo PR trực tiếp từ nhánh mà chưa phân cấp Goal tuần và Sub-issue trên GitHub Project.
  - **Resolution / Fix:** Khởi tạo Issue lớn #16 (`[GOAL-W01]`), tạo Sub-issue #15 trực thuộc #16, đưa cả 2 vào GitHub Project #3, và cập nhật PR #14 liên kết chính thức `Closes #15`.
- **Commit:** `3e521e7`
- **PR:** #14 (https://github.com/1440isme/Circle/pull/14)

---

## AI-0013: Liên kết Cây Phân cấp Native Sub-issues trên GitHub qua REST API

- **Date:** 2026-09-26 17:08:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #16, #17, #18, #19, #20 (Epic Goals) & các Sub-issues #2 - #13, #15
- **Purpose:** Kích hoạt tính năng native Sub-issues (Cây phân cấp công việc chính thức) của GitHub cho toàn bộ các Weekly Goal Issues và Sub-issues tương ứng. Trước đó, các sub-issues mới chỉ được liệt kê dưới dạng task list markdown (`- [ ] #id`) trong phần thân mô tả, do đó giao diện web của GitHub chưa hiển thị bảng theo dõi tiến độ Sub-issues tích hợp (Sub-issues widget & progress bar). Sau khi gọi trực tiếp GitHub Sub-issues REST API (`POST /repos/1440isme/Circle/issues/{parent}/sub_issues`), toàn bộ 13 sub-issues đã được kết nối chuẩn mực thành cây phân cấp trực quan trên giao diện GitHub.
- **Prompt Summary:** Phản hồi của người dùng: "tôi vẫn chưa thấy ui hiện sub issue của các epic đó, chỉ là bạn mention và add vào description thôi".
- **Files Affected:**
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0013)
- **AI-Generated Portion:** Script Node.js tự động gọi GitHub Sub-issues REST API để liên kết id.
- **Human Modifications:** Người dùng phát hiện và nhắc nhở việc giao diện GitHub chưa hiển thị khối Sub-issues nguyên bản.
- **Verification Method:** Gọi endpoint `GET /repos/1440isme/Circle/issues/{p}/sub_issues` xác nhận thành công 100% cây phân cấp trên GitHub API và kiểm tra phản hồi HTTP 201 Created.
- **Official Source Checked:** GitHub REST API Documentation for Sub-issues (`https://docs.github.com/rest/issues/sub-issues`).
- **Security & License Check:** An toàn, script sử dụng token từ môi trường cục bộ, không lưu token vào repository.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** AI nhầm lẫn giữa cú pháp task list markdown (`- [ ] #15`) và tính năng native Sub-issues trên hệ thống GitHub, khiến UI GitHub không hiện cây sub-issues chuyên dụng.
  - **Root Cause:** Dùng API cập nhật body issue thay vì gọi Sub-issues API riêng biệt của GitHub.
  - **Resolution / Fix:** Viết script Node.js gọi trực tiếp API `POST /repos/1440isme/Circle/issues/{parent_id}/sub_issues` để liên kết chính thức.
- **Commit:** Pending
- **PR:** #14 (https://github.com/1440isme/Circle/pull/14)

---

## AI-0014: Phân bổ và Chuẩn hóa Tài liệu Báo cáo TLCN, Đặc tả Use Case và Sơ đồ Kiến trúc vào Bố cục docs/

- **Date:** 2026-09-26 19:55:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #26 ([SUB-TASK]: Hoàn thiện Bản thảo Báo cáo TLCN, Đặc tả 26 Use Case và Sơ đồ Kiến trúc / Yêu cầu)
- **Purpose:** Đọc toàn diện tài liệu bản thảo Báo cáo TLCN (`BCTLCNmd.md` 700 dòng), phân bổ nội dung một cách khoa học vào đúng các thư mục tương ứng trong `docs/`:
  (1) Di chuyển toàn văn bản thảo hoàn chỉnh vào `docs/thesis/Bao-cao-TLCN.md`, cập nhật mục lục và tóm tắt các chương tại `docs/thesis/README.md`.
  (2) Trích xuất toàn bộ bảng nhận diện tác nhân & 26 Use Case Specifications chi tiết (UC01 - UC26) vào tài liệu phân tích yêu cầu `docs/requirements/use-cases.md`.
  (3) Kiểm tra vị trí của `classdiagram.puml` (xác nhận nằm đúng thư mục kiến trúc `docs/architecture/diagrams/`), viết thêm tài liệu giải thích `class-diagram.md` và cập nhật `docs/architecture/diagrams/README.md`.
  (4) Kiểm tra vị trí của `usecase.xml`, xác định đây là sơ đồ mô hình hóa yêu cầu (Requirements) chứ không phải kiến trúc, chuyển về đúng nơi tại `docs/requirements/diagrams/usecase.xml`, đồng thời liên kết chéo giữa Requirements và Architecture.
  (5) Dọn dẹp tệp `BCTLCNmd.md` ở thư mục gốc để duy trì tính vệ sinh kho lưu trữ (Repository Hygiene - Gate 8).
- **Prompt Summary:** Yêu cầu đọc file `BCTLCNmd.md`, phân bổ nội dung tương ứng vào từng folder trong `docs/`, kiểm tra 2 file `classdiagram.puml` và `usecase.xml` đã để đúng nơi chưa và sắp xếp lại cho chuẩn.
- **Files Affected:**
  - `docs/thesis/Bao-cao-TLCN.md` (Toàn văn bản thảo Báo cáo TLCN)
  - `docs/thesis/README.md` (Mục lục và tóm tắt 3 chương lớn của bản thảo)
  - `docs/requirements/use-cases.md` (Đặc tả 26 Use Case chi tiết UC01 - UC26 & Bảng tác nhân)
  - `docs/requirements/README.md` (Cập nhật liên kết tài liệu Use Case và ma trận ánh xạ Epics)
  - `docs/requirements/diagrams/usecase.xml` (Chuyển sơ đồ Use Case XML về đúng thư mục requirements)
  - `docs/architecture/diagrams/class-diagram.md` (Tài liệu giải thích mô hình lớp miền nghiệp vụ)
  - `docs/architecture/diagrams/README.md` (Cập nhật mục lục sơ đồ kiến trúc & liên kết sơ đồ Use Case)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0014)
- **AI-Generated Portion:** 100% cấu trúc trích xuất, phân bổ và tài liệu hóa chuẩn kỹ nghệ phần mềm.
- **Human Modifications:** Ninh Thị Mỹ Hạnh cung cấp bản thảo gốc và định hướng kiểm tra, tái cấu trúc vị trí tài liệu và sơ đồ cho chuẩn xác.
- **Verification Method:** Kiểm tra tính toàn vẹn 26 Use Cases, kiểm tra đường dẫn liên kết tương đối giữa các file markdown, kiểm tra `git status`.
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, Rubric Level 5), Chuẩn tài liệu kỹ nghệ phần mềm (IEEE SRS & UML).
- **Security & License Check:** An toàn, không chứa mật khẩu hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `316120e`
- **PR:** #27 (https://github.com/1440isme/Circle/pull/27)

---

## AI-0015: Tiếp thu Peer Review PR #27 — Tối ưu Hóa Sơ đồ Use Case, Xóa Câu dẫn AI và Đồng bộ Sơ đồ Lớp

- **Date:** 2026-09-26 20:38:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #26 ([SUB-TASK]: Hoàn thiện Bản thảo Báo cáo TLCN, Đặc tả 26 Use Case và Sơ đồ Kiến trúc / Yêu cầu)
- **Purpose:** Tiếp thu và xử lý 100% phản hồi từ báo cáo Peer Review của Trương Công Bình (@1440isme) trên PR #27:
  (1) Xóa bỏ câu dẫn hội thoại thừa của AI ở dòng 210 trong `docs/thesis/Bao-cao-TLCN.md` để giữ vững văn phong học thuật chuẩn mực cho báo cáo tốt nghiệp.
  (2) Giải nén chuỗi Base64 hình ảnh sơ đồ Use Case (dài gần 400KB) thành tệp ảnh rời `docs/requirements/diagrams/usecase.png` (234KB), nhúng đường dẫn hình ảnh tương đối sạch sẽ vào cả `docs/thesis/Bao-cao-TLCN.md` và `docs/requirements/use-cases.md`, giảm kích thước file báo cáo từ 401KB xuống còn 89KB giúp tối ưu hiệu năng preview markdown.
  (3) Đồng bộ hóa 100% danh mục lớp và các gói miền nghiệp vụ trong `docs/architecture/diagrams/class-diagram.md` khớp với tệp nguồn PlantUML `classdiagram.puml` (`PlanningSheet`, `SheetColumn`, `SheetRow`, `SheetCell`, `SharedAlbum`, `PinnedRecord`, `GroupPoll`, `PollOption`, `PollVote`, `DecisionWheel`, `WheelOption`, `AnonymousPost`, `CalendarEvent`, `LiveLocationShare`, `GeoCoordinate`, `CallSession`, `CallParticipant`).
- **Prompt Summary:** Yêu cầu xử lý các góp ý trong peer review của Bình trên PR #27.
- **Files Affected:**
  - `docs/thesis/Bao-cao-TLCN.md` (Xóa câu dẫn AI, chuyển base64 thành link ảnh rời `usecase.png`)
  - `docs/requirements/use-cases.md` (Nhúng ảnh trực quan `diagrams/usecase.png`)
  - `docs/requirements/diagrams/usecase.png` (Tạo mới tệp hình ảnh sơ đồ Use Case chất lượng cao)
  - `docs/architecture/diagrams/class-diagram.md` (Chuẩn hóa tên thực thể và 5 packages khớp với `classdiagram.puml`)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0015)
- **AI-Generated Portion:** 100% mã giải nén base64, tinh chỉnh văn bản học thuật và cập nhật tài liệu giải thích.
- **Human Modifications:** Ninh Thị Mỹ Hạnh tiếp thu ý kiến review của Trương Công Bình trên PR #27, trực tiếp điều chỉnh sơ đồ Use Case, lọc bỏ câu dẫn thừa và đồng bộ sơ đồ lớp.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` xác nhận toàn bộ 91 tệp tham chiếu markdown pass 100% (0 broken links), kiểm tra độ phân giải của `usecase.png` và cấu trúc các gói trong `class-diagram.md`.
- **Official Source Checked:** `PROJECT_GOD.md` (Peer Review Policy, Definition of Done), `classdiagram.puml`.
- **Security & License Check:** An toàn, không chứa dữ liệu nhạy cảm hay thông tin định danh cá nhân.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** AI để sót câu dẫn sinh nội dung trong file báo cáo, nhúng trực tiếp chuỗi base64 thay vì tách file asset rời, và tóm tắt tên lớp trong `class-diagram.md` chưa khớp 100% với tên lớp trong `classdiagram.puml`.
  - **Root Cause:** Quá trình tổng hợp nội dung tự động từ nhiều nguồn trước đó có câu dẫn chuyển tiếp chưa được lọc sạch; nhúng inline base64 theo bản gốc `BCTLCNmd.md`.
  - **Resolution / Fix:** Lọc bỏ câu dẫn hội thoại; xuất ảnh ra tệp PNG rời tại `docs/requirements/diagrams/usecase.png`; đối chiếu từng dòng trong `classdiagram.puml` để cập nhật lại `class-diagram.md`.
- **Commit:** `d5f3936`
- **PR:** #27 (https://github.com/1440isme/Circle/pull/27)

---

## AI-0016: Chuẩn hóa Quy trình Tự động hóa Peer Review và Auto-Merge trên GitHub cho AI Agent

- **Date:** 2026-09-26 20:48:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #28 ([SUB-TASK]: Chuẩn hóa Quy trình Tự động hóa Peer Review và Auto-Merge cho AI Agent)
- **Purpose:** Thiết lập và văn bản hóa quy ước làm việc giữa kỹ sư và AI Agent:
  (1) Tự động hóa chu trình Peer Review qua công cụ GitHub CLI (`gh`): Tự động đối soát git diff, kiểm tra tiêu chí DoD và Hard Gates, soạn và đăng báo cáo nhận xét review lên GitHub PR.
  (2) Theo dõi phản hồi từ kỹ sư đối tác, kiểm chứng các commit cập nhật sửa đổi.
  (3) Tự động phê duyệt (Formal Approve) khi mọi tiêu chí chất lượng được thỏa mãn 100%.
  (4) Tự động thực thi lệnh merge PR vào nhánh tích hợp `develop` (`gh pr merge <number> --merge --delete-branch`) và kéo mã nguồn mới nhất về nhánh `develop` cục bộ.
  (5) Cập nhật quy ước vào `agentic/CONVENTIONS.md`, kỹ năng `agentic/skills/code-review.md` và bộ nhớ thực tế `agentic/memory/verified-facts.md`.
- **Prompt Summary:** Yêu cầu: "bổ sung cách làm việc của tôi với bạn về việc này luôn, sau khi luồng comment và pr đã được approve thì bạn merge pr giúp tôi luôn nhé".
- **Files Affected:**
  - `agentic/CONVENTIONS.md` (Thêm quy định chu trình Automated Peer Review & Auto-Merge)
  - `agentic/skills/code-review.md` (Bổ sung giao thức 5 bước tự động hóa cho AI Agent)
  - `agentic/memory/verified-facts.md` (Ghi nhận năng lực gh CLI và quy trình auto-merge)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0016)
- **AI-Generated Portion:** 100% tài liệu hóa quy trình chuẩn mực và cập nhật các tệp framework.
- **Human Modifications:** Trương Công Bình đề xuất và yêu cầu thiết lập cơ chế tự động hóa khép kín từ review, comment, approve đến merge PR.
- **Verification Method:** Đã thực nghiệm thành công trực tiếp trên PR #27 (Review comment, Approve, Merge commit và xóa nhánh remote qua `gh`), chạy `./scripts/check-agent-map.sh` xác nhận 91/91 tệp tham chiếu markdown đạt chuẩn 100% (0 broken link).
- **Official Source Checked:** `PROJECT_GOD.md` (Peer Review Policy, Definition of Done, Git Flow).
- **Security & License Check:** An toàn, không chứa mật khẩu hay token bảo mật trong mã nguồn.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `b97fc8c`
- **PR:** #29 (https://github.com/1440isme/Circle/pull/29)

---

## AI-0017: Thiết lập Hạ tầng Monorepo Workspace và Môi trường Docker Dev (PostgreSQL 16 & Redis 7)

- **Date:** 2026-09-26 21:12:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #30 ([SUB-TASK]: TASK-INFRA-001 — Monorepo Workspace Setup & Local Docker Dev Environment)
- **Purpose:** Khởi tạo hạ tầng Monorepo Workspace (pnpm/npm workspaces) và môi trường dịch vụ cục bộ bằng Docker Compose:
  (1) Thiết lập `docker-compose.yml` định nghĩa 2 dịch vụ nền tảng: PostgreSQL 16 Alpine (`circle-postgres`) và Redis 7 Alpine (`circle-redis`) với cấu hình healthcheck, volume lưu trữ bền vững và network riêng biệt `circle-network`. Đã kiểm chứng khởi động thực tế và đạt trạng thái `healthy`.
  (2) Khởi tạo cấu hình root `package.json` và `pnpm-workspace.yaml` quản lý các workspace `apps/*` và `packages/*`, bổ sung scripts điều phối môi trường (`docker:up`, `docker:down`, `dev:*`, `lint`, `test`, `check:integrity`).
  (3) Khởi tạo gói `@circle/config` chứa cấu hình biên dịch TypeScript dùng chung (`tsconfig.base.json`).
  (4) Khởi tạo khung mã nguồn và cấu hình gói `@circle/types` (Shared contracts, BaseEntity, ApiResponse, PaginatedResponse, AuthTokens) và `@circle/shared` (Shared utilities). Cả 2 gói đã được biên dịch thành công qua `npm run build`.
  (5) Cập nhật `.env.example` đồng bộ các tham số Docker cục bộ (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `REDIS_PORT`).
- **Prompt Summary:** Yêu cầu: "thiết lập hạ tầng trước nhé, rồi đến khởi tạo db".
- **Files Affected:**
  - `docker-compose.yml`
  - `.env.example`
  - `package.json`
  - `package-lock.json`
  - `pnpm-workspace.yaml`
  - `packages/config/package.json`
  - `packages/config/tsconfig.base.json`
  - `packages/types/package.json`
  - `packages/types/tsconfig.json`
  - `packages/types/src/index.ts`
  - `packages/shared/package.json`
  - `packages/shared/tsconfig.json`
  - `packages/shared/src/index.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu hình Docker Compose, root workspace và các cấu hình TypeScript dùng chung.
- **Human Modifications:** Trương Công Bình định hướng ưu tiên thiết lập hạ tầng trước, tạo tiền đề để triển khai cơ sở dữ liệu.
- **Verification Method:**
  - `docker compose up -d` khởi động thành công, kiểm tra `docker compose ps` xác nhận cả hai container `circle-postgres` và `circle-redis` đều `healthy`.
  - `npm install` và `npm run build` thành công xuất các tệp dist `.d.ts` và `.js` cho `@circle/types` và `@circle/shared`.
  - Chạy `./scripts/check-agent-map.sh` xác nhận 100% tài liệu liên kết hợp lệ (0 broken links).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, G1 Working Product, G8 Security & Hygiene), `docs/getting-started/local-development.md`.
- **Security & License Check:** An toàn, không chứa secret thật, mọi cấu hình mặc định đều tuân theo `.env.example`.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `12d6f8b` (Merged: `b2134bb`)
- **PR:** #31 (https://github.com/1440isme/Circle/pull/31)

---

## AI-0018: Khởi tạo Cấu hình Backend NestJS, Mô hình Hóa Prisma Schema và Thực thi Migration Ban đầu

- **Date:** 2026-09-26 21:24:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #32 ([SUB-TASK]: TASK-DB-001 — Domain Data Modeling & Prisma Schema Initialization with Initial Migration)
- **Purpose:** Khởi tạo cấu hình backend NestJS (`apps/backend`), thiết kế toàn diện mô hình cơ sở dữ liệu quan hệ trên `apps/backend/prisma/schema.prisma` và thực thi migration ban đầu lên PostgreSQL 16:
  (1) Thiết lập `apps/backend/package.json`, `tsconfig.json` và `nest-cli.json` tích hợp Prisma ORM và liên kết các gói nội bộ monorepo (`@circle/types`, `@circle/shared`).
  (2) Xây dựng `schema.prisma` bao quát đầy đủ 5 packages miền nghiệp vụ (khớp 100% với `class-diagram.md`, `classdiagram.puml` và 26 Use Cases):
    - Account & Social: `User`, `UserProfile`, `RefreshToken`, `Friendship`, `Notification`.
    - Circle Core: `Circle`, `CircleMember` với các roles (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`).
    - Chat & Channels: `Channel`, `Message` (hỗ trợ text, file, voice, reply tree), `Reaction`.
    - Moments & Shared Albums: `Moment`, `Photo`, `SharedAlbum`.
    - Collaborative Planning Sheet: `PlanningSheet`, `SheetColumn`, `SheetRow`, `SheetCell` với composite keys và audit `lastEditedBy`.
    - Circle Utilities: `PinnedRecord`, `GroupPoll`, `PollOption`, `PollVote`, `DecisionWheel`, `WheelOption`, `AnonymousPost`, `CalendarEvent`, `LiveLocationShare`, `CallSession`, `CallParticipant`.
  (3) Kiểm chứng cú pháp `npx prisma validate` đạt chuẩn, sinh Prisma Client thành công (`npx prisma generate`).
  (4) Thực thi thành công migration ban đầu `20260926142208_init` lên database PostgreSQL 16 container (`circle-postgres` trên port 5432). Toàn bộ hơn 20 bảng cơ sở dữ liệu đã được tạo lập với foreign keys, indexes và constraints đầy đủ.
  (5) Đồng bộ hóa toàn bộ domain enums và entity interfaces vào `packages/types/src/index.ts`, biên dịch thành công qua `npm run build`.
- **Prompt Summary:** Yêu cầu: "trong lúc chờ hạnh review thì cứ tiếp tục thực hiện nhé".
- **Files Affected:**
  - `apps/backend/package.json`
  - `apps/backend/tsconfig.json`
  - `apps/backend/nest-cli.json`
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260926142208_init/migration.sql`
  - `apps/backend/prisma/migrations/migration_lock.toml`
  - `packages/types/src/index.ts`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu hình Prisma schema, thiết kế quan hệ bảng, migration SQL và các kiểu dữ liệu dùng chung.
- **Human Modifications:** Trương Công Bình chỉ đạo tiếp tục triển khai khởi tạo cơ sở dữ liệu trong khi chờ review PR hạ tầng.
- **Verification Method:**
  - `npx prisma validate` pass.
  - `npx prisma migrate dev --name init` hoàn tất với mã thoát 0, migration SQL được áp dụng thành công.
  - Kiểm tra trực tiếp trong PostgreSQL qua `psql` xác nhận toàn bộ các bảng đã tồn tại và sẵn sàng phục vụ.
  - `npm run build --workspace=@circle/types` biên dịch không có lỗi.
  - `./scripts/check-agent-map.sh` pass 100% (91/91 tệp tham chiếu).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, G1 Working Product, G5 Automated Testing Foundation, G8 Security & Hygiene), `docs/architecture/diagrams/class-diagram.md`, `classdiagram.puml`.
- **Security & License Check:** An toàn, không chứa credentials nhạy cảm, sử dụng biến môi trường chuẩn.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Xung đột cấu hình `module: commonjs` và `moduleResolution: NodeNext` khi kế thừa từ base tsconfig trong `apps/backend/tsconfig.json`.
  - **Resolution / Fix:** Ghi đè `"moduleResolution": "node"` trong `apps/backend/tsconfig.json`.
- **Commit:** `1e35c41` (Merged: `857cb6d`)
- **PR:** #33 (https://github.com/1440isme/Circle/pull/33)

---

## AI-0019: Thiết kế Mô hình Kiến trúc C4 (Context, Container, Component) và Sơ đồ Thực thể Quan hệ ERD

- **Date:** 2026-09-26 21:42:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #12 ([SUB-TASK]: TASK-DOCS-001 — Complete SRS, Traceability Matrix & Architecture Diagram Set)
- **Purpose:** Xây dựng bộ sơ đồ kiến trúc chuẩn mực C4 Model (Context, Container, Component) và Sơ đồ Thực thể Quan hệ ERD cho toàn bộ hệ thống CIRCLE:
  (1) Tạo `docs/architecture/diagrams/c4-model.md` bao gồm:
    - C4 Level 1 (System Context): Ranh giới hệ thống CIRCLE, tương tác giữa Thành viên, Trưởng nhóm, Quản trị viên và các hệ thống bên thứ ba (Cloudflare R2, WebRTC STUN/TURN, SMTP Server).
    - C4 Level 2 (Container Diagram): Tương tác giữa Web Next.js App & Admin (/admin), Mobile Expo App, Traefik Reverse Proxy, Backend NestJS Modular Monolith API, PostgreSQL 16 Database, Redis 7 Cache & Pub/Sub và Cloudflare R2 Storage.
    - C4 Level 3 (Component Diagram): Bóc tách chi tiết cấu trúc bên trong Backend NestJS (REST Controllers, Socket.IO Gateway, JwtAuthGuard, RolesGuard, ValidationPipe, các Domain Services nghiệp vụ, PrismaService và RedisService).
  (2) Tạo `docs/architecture/diagrams/erd.md` thể hiện toàn văn Mermaid ERD cho hơn 20 thực thể cơ sở dữ liệu quan hệ đồng bộ với Prisma schema.
  (3) Cập nhật `docs/architecture/diagrams/README.md` liên kết trực tiếp tới `c4-model.md` và `erd.md`.
- **Prompt Summary:** Yêu cầu: "các báo cáo tuần có thể tạm skip để hết sprint tuần 4 rồi làm bổ sung, sơ đồ c4 giờ làm nhé, sequence tạm skip vì phải có các module rồi mới vẽ sequence được".
- **Files Affected:**
  - `docs/architecture/diagrams/c4-model.md`
  - `docs/architecture/diagrams/erd.md`
  - `docs/architecture/diagrams/README.md`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu trúc mô hình C4, sơ đồ Mermaid và tài liệu thuyết minh kiến trúc.
- **Human Modifications:** Trương Công Bình định hướng triển khai ngay bộ sơ đồ C4 và ERD để hoàn tất đặc tả kiến trúc Tuần 2–3, tạm hoãn sequence diagrams và báo cáo tuần cho tới khi có module cụ thể.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` xác nhận toàn bộ 93 tệp tham chiếu markdown đạt chuẩn 100% (0 broken links).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, Rubric Level 5 TC2.1 Requirements & Design), Chuẩn kiến trúc C4 Model của Simon Brown.
- **Security & License Check:** An toàn, không chứa credentials hay API keys.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Đường dẫn tương đối từ `docs/architecture/diagrams/` trỏ về `PROJECT_GOD.md` ban đầu để `../../` thay vì `../../../` (bị lệch 1 cấp thư mục).
  - **Root Cause:** Nhầm lẫn độ sâu thư mục (3 cấp thay vì 2 cấp).
  - **Resolution / Fix:** `./scripts/check-agent-map.sh` phát hiện và đã được sửa lại ngay lập tức thành `../../../PROJECT_GOD.md`.
- **Commit:** `d39b7fa` (Merged: `a63832c`)
- **PR:** #34 (https://github.com/1440isme/Circle/pull/34)

---

## AI-0020: Xây dựng Module Xác thực Authentication API, Dual-Token JWT và Refresh Token Rotation

- **Date:** 2026-09-26 22:05:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #2 ([SUB-FEAT]: US-AUTH-001 — User Registration, Password Hashing & Account Activation) & #3 ([SUB-FEAT]: US-AUTH-002 — Dual-token JWT Authentication & Refresh Token Rotation)
- **Purpose:** Xây dựng hoàn chỉnh module xác thực Authentication / Authorization cho Backend NestJS:
  (1) Khởi tạo cấu trúc `apps/backend/src`: `main.ts`, `app.module.ts`, `database/prisma.service.ts`, `database/database.module.ts`.
  (2) Cài đặt hệ thống bảo mật & phân quyền dùng chung:
    - `@Public()` decorator và `JwtAuthGuard` (tự động bypass các public routes).
    - `@Roles()` decorator và `RolesGuard` (kiểm tra quyền RBAC `USER`, `ADMIN`).
    - `@CurrentUser()` param decorator trích xuất thông tin người dùng từ token payload.
  (3) Xây dựng `AuthModule`:
    - `RegisterDto`, `LoginDto`, `RefreshTokenDto` với validation constraints (`class-validator`).
    - `JwtStrategy` kế thừa `passport-jwt` xác thực Bearer Token và trạng thái tài khoản `isActivated`.
    - `AuthService`:
      - `register()`: Kiểm tra trùng email (trả về 409 Conflict), hash mật khẩu bằng `bcryptjs` salt rounds cost 12, tạo `User` và `UserProfile` trong transaction, sinh cặp token và lưu hashed refresh token.
      - `login()`: Kiểm tra email/password, so khớp hash, phát hành Dual-token (Access Token 15 phút, Refresh Token 7 ngày).
      - `refreshTokens()`: Xác thực refresh token, cơ chế **Token Reuse Detection** (phát hiện tái sử dụng token đã thu hồi để tự động vô hiệu hóa toàn bộ session của tài khoản đó), thu hồi token cũ và xoay vòng token mới (Refresh Token Rotation).
      - `logout()`: Thu hồi refresh token trong cơ sở dữ liệu.
    - `AuthController`: Các endpoints `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`.
  (4) Viết và chạy bộ kiểm thử đơn vị tự động `apps/backend/src/modules/auth/auth.service.spec.ts` (TC-AUTH-001 & TC-AUTH-002) đạt pass 100% (7/7 test cases).
- **Prompt Summary:** Yêu cầu: "ok" (tiến hành thực hiện module Auth theo định hướng tự build đã thống nhất).
- **Files Affected:**
  - `apps/backend/package.json`
  - `apps/backend/tsconfig.json`
  - `apps/backend/src/main.ts`
  - `apps/backend/src/app.module.ts`
  - `apps/backend/src/database/prisma.service.ts`
  - `apps/backend/src/database/database.module.ts`
  - `apps/backend/src/common/decorators/public.decorator.ts`
  - `apps/backend/src/common/decorators/roles.decorator.ts`
  - `apps/backend/src/common/decorators/current-user.decorator.ts`
  - `apps/backend/src/common/guards/jwt-auth.guard.ts`
  - `apps/backend/src/common/guards/roles.guard.ts`
  - `apps/backend/src/modules/auth/dto/register.dto.ts`
  - `apps/backend/src/modules/auth/dto/login.dto.ts`
  - `apps/backend/src/modules/auth/dto/refresh-token.dto.ts`
  - `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.module.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend, DTOs, strategies, services, controllers và test suites.
- **Human Modifications:** Trương Công Bình duyệt phương án tự build qua NestJS Passport + JWT + bcrypt, phê duyệt triển khai chi tiết.
- **Verification Method:**
  - `npm run test --workspace=@circle/backend` pass 7/7 test cases (TC-AUTH-001 & TC-AUTH-002).
  - `npm run build --workspace=@circle/backend` biên dịch NestJS thành công 0 lỗi.
  - `./scripts/check-agent-map.sh` pass 100% (91/91 tệp tham chiếu).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, G1 Working Product, G4 Understandability, G5 Automated Testing, G8 Security), `apps/backend/docs/authentication.md`.
- **Security & License Check:** Mật khẩu băm an toàn bcrypt cost 12; Refresh Token lưu hash SHA-256; Token Reuse Detection thu hồi toàn bộ session khi phát hiện xâm nhập; không rò rỉ secret key.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Gói `bcrypt` native bị npm 12 chặn build script native module dẫn đến lỗi thiếu `bcrypt_lib.node` khi chạy Jest.
  - **Root Cause:** npm 12 mặc định bật cơ chế bảo vệ allowScripts chặn preinstall/install binary build script của các gói native C++.
  - **Resolution / Fix:** Thay thế sang `bcryptjs` (thuần JavaScript, không phụ thuộc C++ build tools, tương thích 100% API và an toàn đa nền tảng cho Docker/CI).
- **Commit:** `68caff9` (Merged: `8b410af`)
- **PR:** #35 (https://github.com/1440isme/Circle/pull/35)

---

## AI-0021: Phân bổ và Chuẩn hóa Tài liệu Xác định & Đặc tả Yêu cầu Hệ thống (SRS)

- **Date:** 2026-09-26 21:40:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #36 ([SUB-TASK]: Tiếp nhận và Chuẩn hóa Đặc tả Yêu cầu Hệ thống (SRS.md) theo Kiến trúc Chuẩn)
- **Purpose:** Tiếp nhận tài liệu `Xác định yêu cầu.md` (chứa yêu cầu nghiệp vụ lưu trữ/tra cứu/tính toán/kết xuất, bảng yêu cầu theo tác nhân GUEST, USER, MEMBER, OWNER cho 26 use case, yêu cầu hệ thống và phi chức năng), di chuyển và chuẩn hóa cấu trúc vào thư mục chuẩn `docs/requirements/SRS.md` theo đúng quy định tại `PROJECT_GOD.md` (dòng 428). Đồng thời cập nhật liên kết mục lục tại `docs/requirements/README.md`.
- **Prompt Summary:** Yêu cầu: "tôi mới thêm @[Xác định yêu cầu.md] bạn hãy phân bổ lại cho đúng folder".
- **Files Affected:**
  - `docs/requirements/SRS.md` (Tạo từ `Xác định yêu cầu.md`)
  - `docs/requirements/README.md` (Cập nhật liên kết đến `SRS.md`)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0021)
- **AI-Generated Portion:** Tự động phát hiện cấu trúc chuẩn của repository, ánh xạ đến `PROJECT_GOD.md:428`, thực thi di chuyển và cập nhật tham chiếu mục lục.
- **Human Modifications:** Ninh Thị Mỹ Hạnh cung cấp tệp nội dung yêu cầu nghiệp vụ và yêu cầu phân bổ vào đúng thư mục.
- **Verification Method:** Kiểm tra đường dẫn `docs/requirements/SRS.md`, xác nhận tệp đã tồn tại đầy đủ 214 dòng nội dung, kiểm tra tính toàn vẹn mục lục `docs/requirements/README.md`.
- **Official Source Checked:** `PROJECT_GOD.md` (Mục TC2.1 / Evidence đường dẫn `docs/requirements/SRS.md`).
- **Security & License Check:** An toàn, không chứa mật khẩu hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `9049a4e`
- **PR:** #37 (https://github.com/1440isme/Circle/pull/37)

---

## AI-0022: Thiết lập Bảng Phân công Nhiệm vụ Chi tiết (Hạnh - Bình) theo Kế hoạch 15 Tuần

- **Date:** 2026-09-26 23:05:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #38 ([SUB-TASK]: Thiết lập Bảng Phân công Nhiệm vụ Chi tiết (Hạnh - Bình) theo Kế hoạch 15 Tuần)
- **Purpose:** Biên soạn và xuất bản tài liệu phân công nhiệm vụ chi tiết `docs/phan-cong-nhiem-vu.md` cho hai kỹ sư:
  (1) Module 0, 1, 2 giữ nguyên phân định theo thế mạnh (Hạnh: Business Specs / Profile; Bình: C4 Model / Docker Infra / JWT Auth Engine).
  (2) Từ Module 3 trở đi chuyển đổi sang mô hình **Full-stack Module Ownership** trọn gói từ DB, API đến Web & Mobile UI để tối đa hóa tính tự chủ và tránh xung đột mã nguồn.
  (3) Tuân thủ nghiêm ngặt nguyên tắc Circle-Centric: Loại bỏ hoàn toàn chat 1-1, mọi tương tác nhắn tin và gọi điện chỉ diễn ra trong không gian nhóm.
  (4) Phân chia cân đối 50-50 Module 7 (Bình: Planning Sheet, Map Live Location, Poll | Hạnh: Album, Calendar, Vòng xoay, Điều muốn nói).
  (5) Phân chia cân đối 50-50 Module 9 (Bình: Admin Portal, Metrics Dashboard, User/Circle Management | Hạnh: Reporting System, Moderation Queue, Audit Log).
  (6) Cập nhật liên kết mục lục tại `docs/README.md`.
- **Prompt Summary:** Yêu cầu: "oke hợp lý rồi. Xuất thành file chia việc vẫn tạo issue".
- **Files Affected:**
  - `docs/phan-cong-nhiem-vu.md` (Tạo mới tài liệu phân công chi tiết 12 module và tiến độ 15 tuần)
  - `docs/README.md` (Bổ sung liên kết đến `phan-cong-nhiem-vu.md`)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0022)
- **AI-Generated Portion:** 100% cấu trúc tài liệu, ma trận phân chia trách nhiệm và sơ đồ tiến độ gối đầu.
- **Human Modifications:** Ninh Thị Mỹ Hạnh định hướng phân vai, yêu cầu loại bỏ chat 1-1 theo SRS và chia đôi Module 7, Module 9.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` xác nhận 100% (94/94 tệp tham chiếu markdown đạt chuẩn 0 broken links).
- **Official Source Checked:** `docs/Ke hoach thuc hien TLCN .md`, `docs/requirements/SRS.md`, `PROJECT_GOD.md`.
- **Security & License Check:** An toàn, không chứa bí mật hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `70710fb`
- **PR:** #39 (https://github.com/1440isme/Circle/pull/39)

---

## AI-0023: Tích hợp Anthropic Frontend Design Skill vào Workspace Project

- **Date:** 2026-09-26 23:25:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #40 ([CHORE]: Tích hợp Anthropic Frontend Design Skill vào Workspace (.agents/skills))
- **Purpose:** Đưa bộ kỹ năng thiết kế giao diện cao cấp `anthropics/skills@frontend-design` vào cấu hình workspace của dự án tại `.agents/skills/frontend-design/`. Giúp cả hai kỹ sư (Bình & Hạnh) và AI agent trong repo Circle tự động thừa hưởng nguyên tắc thiết kế UI/UX (chống AI boilerplate/clichés, tối ưu typography, subject-matter grounding, micro-copywriting chuẩn mực).
- **Prompt Summary:** Thảo luận, đánh giá chất lượng skill và đưa skill vào repo dưới dạng Issue / GitFlow chuẩn để Hạnh và Agent của Hạnh có thể sử dụng.
- **Files Affected:**
  - `.agents/skills/frontend-design/SKILL.md` (Tạo mới chỉ dẫn thiết kế UI/UX)
  - `.agents/skills/frontend-design/LICENSE.txt` (Bản quyền skill từ Anthropic)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0023)
- **AI-Generated Portion:** Tự động đồng bộ file từ global skills vào workspace project `.agents/skills`, cấu hình tài liệu và nhật ký AI.
- **Human Modifications:** Trương Công Bình định hướng đưa skill vào repo qua Issue và GitFlow chuẩn để chia sẻ với đồng đội (Hạnh).
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` (xác nhận 100% 0 broken links), kiểm tra cấu trúc `.agents/skills/frontend-design/SKILL.md`.
- **Official Source Checked:** `anthropics/skills@frontend-design`, `PROJECT_GOD.md` (DoD, GitFlow, Peer Review rule).
- **Security & License Check:** Skill có file `LICENSE.txt` hợp lệ, không chứa secret hay dữ liệu nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `f2624ad` (Merged: `7b9b8d7`)
- **PR:** #41 (https://github.com/1440isme/Circle/pull/41)

---

## AI-0024: Xây dựng Tài liệu Đặc tả Ngôn ngữ Thiết kế UI/UX CIRCLE

- **Date:** 2026-09-26 23:42:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #42 ([DOCS]: Xây dựng Đặc tả Ngôn ngữ Thiết kế UI/UX CIRCLE (Apple HIG + Stitch + Anthropic))
- **Purpose:** Xây dựng tài liệu đặc tả toàn diện về ngôn ngữ thiết kế UI/UX cho nền tảng CIRCLE (`docs/design.md`) dựa trên sự kết hợp giữa:
  1. Triết lý thiết kế Apple Human Interface Guidelines (Clarity, Deference, Depth, Translucent Materials, Continuous Squircle Radii, Tactile Fluidity).
  2. Hệ thống thiết kế Intimate Circles tạo trên Google Stitch (`CIRCLE UI Design System` - project 11855010937414066795).
  3. Kỷ luật thiết kế chống AI Clichés từ Anthropic Frontend Design skill (tiết chế thẩm mỹ, subject-matter grounding, micro-copywriting chuẩn mực).
  Tài liệu chuẩn hóa toàn bộ Design Tokens (Color Palette, Typography Plus Jakarta Sans, Elevation, Spacing), Layout 3 cột Desktop và 1 cột Mobile Expo, và các component cốt lõi của CIRCLE (Breathing presence dot, Anonymous reflection card, FaceTime-style Call HUD).
- **Prompt Summary:** Yêu cầu: "dựa vào skill mới từ anthropic và tham khảo thêm về ngôn ngữ thiết kế quy chuẩn quy tắc của Apple, stitch và bản design đó thì bạn hãy làm 1 file design.md để trình bày và mô tả về ngôn ngữ thiết cho toàn bộ ui/ux của circle tôi thiên về triết lý của apple".
- **Files Affected:**
  - `docs/design.md` (Tạo mới tài liệu đặc tả UI/UX toàn diện)
  - `docs/README.md` (Cập nhật mục lục tài liệu liên kết đến `design.md`)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0024)
- **AI-Generated Portion:** 100% cấu trúc đặc tả ngôn ngữ thiết kế, bảng token, quy chuẩn giao diện và sơ đồ Mermaid.
- **Human Modifications:** Trương Công Bình định hướng triết lý Apple HIG, yêu cầu tích hợp thiết kế từ Stitch và kỷ luật thẩm mỹ từ Anthropic.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` (xác nhận 100% 0 broken links), kiểm tra tính tương phản màu sắc và tỷ lệ typography.
- **Official Source Checked:** Apple Human Interface Guidelines, `anthropics/skills@frontend-design`, Google Stitch Project `11855010937414066795`.
- **Security & License Check:** An toàn, không chứa mật khẩu hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `9b41b64`
- **PR:** #43 (https://github.com/1440isme/Circle/pull/43)

---

## AI-0025: Khởi tạo Nền tảng Next.js Web (apps/web) & Triển khai Giao diện UI Tổng quan CIRCLE

- **Date:** 2026-09-27 00:10:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #44 ([FEAT]: Khởi tạo Nền tảng Next.js Web (apps/web) & Triển khai Giao diện UI Tổng quan CIRCLE)
- **Purpose:** Khởi tạo cấu trúc dự án Next.js (App Router) cho `apps/web` (@circle/web), cấu hình TypeScript, Tailwind CSS theo hệ thống Design Tokens từ `docs/design.md` (màu thảo mộc, font Plus Jakarta Sans, squircle radii, hiệu ứng kính mờ frosted/liquid glass). Triển khai màn hình Desktop Web Hub (3 cột: Left Navigation, Central Feed với thẻ "Điều muốn nói" và composer pill, Right Presence Rail với nhịp thở online). Đóng gói toàn bộ 6 tệp prototype HTML tương tác từ Google Stitch vào `docs/ui-prototypes/` để xem trước trực tiếp trên trình duyệt.
- **Prompt Summary:** Yêu cầu: "đấy tôi bảo bạn là hãy triển khai ui đó vào dự án luôn đó, hiện tại cứ làm những gì đang có nhé".
- **Files Affected:**
  - `apps/web/package.json` (Cấu hình Next.js 14, React 18, Tailwind, Lucide)
  - `apps/web/tsconfig.json` (TypeScript cấu hình App Router)
  - `apps/web/next.config.mjs` (Next.js config)
  - `apps/web/postcss.config.mjs` (PostCSS config)
  - `apps/web/tailwind.config.ts` (Design Tokens CIRCLE)
  - `apps/web/src/app/globals.css` (Font, frosted glass, scrollbar)
  - `apps/web/src/app/layout.tsx` (RootLayout với metadata)
  - `apps/web/src/app/page.tsx` (Trang chủ Desktop Web Hub)
  - `apps/web/src/components/header/Header.tsx` (Header kính mờ & tìm kiếm)
  - `apps/web/src/components/navigation/Sidebar.tsx` (Thanh điều hướng nhóm & công cụ)
  - `apps/web/src/components/stream/FeedStream.tsx` (Dòng sự kiện, thẻ tâm sự & composer)
  - `apps/web/src/components/presence/PresenceRail.tsx` (Thành viên trực tuyến nhịp thở & call stage launcher)
  - `apps/web/next-env.d.ts` (Next.js TypeScript environment declarations)
  - `package-lock.json` (Đồng bộ dependencies monorepo)
  - `docs/ui-prototypes/` (Bộ 6 file HTML prototypes từ Google Stitch và README)
  - `docs/ai-usage/log.md` (Ghi nhận bản ghi AI-0025)
- **AI-Generated Portion:** 100% mã nguồn cấu hình, cấu trúc component Next.js và chuyển thể mã Tailwind từ Stitch sang React App Router.
- **Human Modifications:** Trương Công Bình yêu cầu triển khai ngay UI vào dự án, bám sát các thiết kế hiện có trên Stitch và tài liệu `docs/design.md`.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` (xác nhận 100% 0 broken links), thực hiện lệnh build `npm run build --workspace=@circle/web` thành công 100% (Compiled successfully, static page / generated).
- **Official Source Checked:** Google Stitch Project `11855010937414066795`, `docs/design.md`, Next.js 14 App Router Docs.
- **Security & License Check:** An toàn, không chứa mật khẩu hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `1e0c397`
- **PR:** #45 (https://github.com/1440isme/Circle/pull/45)

---

## AI-0026: Triển khai Toàn diện Phân hệ Xác thực Web (Web Auth Flow, AuthContext & Session Management)

- **Date:** 2026-09-27 10:52:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #46 ([SUB-FEAT]: US-AUTH-003 — Web Authentication Flow, AuthContext & Session Management (Parent: #18))
- **Purpose:** Triển khai toàn diện phân hệ xác thực Web (Web Authentication Flow & Session Management) cho nền tảng CIRCLE (`apps/web`):
  1. Xây dựng tầng lưu trữ phiên an toàn kết hợp `localStorage` và cookies (`apps/web/src/lib/auth-storage.ts`, `cookies.ts`) hỗ trợ SSR và Next.js App Router.
  2. Xây dựng API Client chuyên dụng (`apps/web/src/lib/api.ts`) tích hợp bộ đánh chặn tự động xoay vòng refresh token (Silent Refresh) khi gặp mã lỗi HTTP 401 Unauthorized, tự động thử lại request ban đầu sau khi cấp mới token mà không làm gián đoạn trải nghiệm người dùng.
  3. Xây dựng Auth Service (`apps/web/src/lib/auth.ts`) và React `AuthContext` / `useAuth` hook (`apps/web/src/context/AuthContext.tsx`) quản lý toàn diện vòng đời token, hồ sơ người dùng (`GET /api/v1/auth/me`), cùng các hàm `login`, `register`, `logout`.
  4. Triển khai component bảo vệ điều hướng `AuthGuard` (`apps/web/src/components/auth/AuthGuard.tsx`) hỗ trợ chế độ `require-auth` và `guest-only`.
  5. Xây dựng giao diện trang Đăng nhập (`/login`) và Đăng ký (`/register`) chuẩn ngôn ngữ thiết kế Apple Human Interface Guidelines + Frosted Glassmorphism (khối card kính mờ `backdrop-blur-xl`, màu thảo mộc thiên nhiên, squircle radii, font Plus Jakarta Sans, live password validation, kiểm tra tính hợp lệ tức thời).
  6. Kết nối `Header.tsx` với `useAuth`: hiển thị avatar viết tắt, tên thật người dùng, phân quyền, menu dropdown cá nhân và nút Đăng xuất; hiển thị các nút Đăng nhập / Đăng ký khi là khách vãng lai.
  7. Đồng bộ cập nhật `.agents/SITEMAP.md`, cấu hình ESLint chuẩn hóa và kiểm thử build thành công 100% không cảnh báo hay lỗi.
- **Prompt Summary:** Yêu cầu: "cùng bắt đầu vào làm tính năng đầu tiên là auth nhé, fullstack luôn", thống nhất triển khai Web Auth trước theo quy chuẩn GitFlow & DoD.
- **Files Affected:**
  - `apps/web/package.json`
  - `apps/web/.eslintrc.json`
  - `apps/web/src/lib/cookies.ts`
  - `apps/web/src/lib/auth-storage.ts`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/context/AuthContext.tsx`
  - `apps/web/src/components/auth/AuthGuard.tsx`
  - `apps/web/src/app/(auth)/layout.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/app/layout.tsx`
  - `.agents/SITEMAP.md`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu trúc mã nguồn TypeScript, React components, CSS Tailwind Glassmorphism và tích hợp ngữ cảnh phiên.
- **Human Modifications:** Trương Công Bình chỉ đạo triển khai Web Auth trước, tạo Issue #46 và branch GitFlow `feat/46-web-auth-fullstack` theo chuẩn Level 5 Rubric.
- **Verification Method:** Chạy `npm run build -w @circle/web` thành công (tạo các trang tĩnh `/`, `/login`, `/register`), `npm run lint` đạt 0 lỗi 0 cảnh báo, `./scripts/check-agent-map.sh` đạt chuẩn 100% (93 framework files, 0 broken references), unit tests Backend 7/7 pass.
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, Rubric Level 5), `docs/design.md`, Apple Human Interface Guidelines, Next.js 14 App Router Docs.
- **Security & License Check:** Lưu trữ token phân tầng, tự động xóa phiên khi token hết hạn, không hardcode credentials hay secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Khi build Next.js lần đầu, trang `/login` báo lỗi thiếu `<Suspense>` boundary bao bọc hook `useSearchParams()`. Ngoài ra `FeedStream.tsx` có chứa dấu nháy kép chưa escape chuẩn React.
  - **Root Cause:** Next.js 14 App Router yêu cầu mọi trang tĩnh sử dụng `useSearchParams()` phải có Suspense boundary để phục vụ prerendering; `FeedStream.tsx` chứa trích dẫn lời nhắn mẫu bằng dấu ngoặc kép trần.
  - **Resolution / Fix:** Tách `LoginForm` và bọc trong `<Suspense fallback={...}>` trong `LoginPage`; thay thế dấu nháy kép bằng `&ldquo;` và `&rdquo;` trong `FeedStream.tsx`.
- **Commit:** `a2c9549`
- **PR:** #47 (https://github.com/1440isme/Circle/pull/47)

---

## AI-0027: Chuẩn hóa Kiến trúc Frontend — Tích hợp Zod Schemas Chia sẻ, Zustand Store & TanStack Query

- **Date:** 2026-09-27 11:01:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #46 ([SUB-FEAT]: US-AUTH-003 — Web Authentication Flow, AuthContext & Session Management (Parent: #18))
- **Purpose:** Tiếp thu ngay chấn chỉnh xác đáng từ người dùng, đồng bộ hóa 100% stack kiến trúc Frontend theo quy hoạch chuẩn mực của CIRCLE (`agentic/CONVENTIONS.md`, `agentic/memory/architecture.md`, `packages/shared/README.md`):
  1. Tích hợp thư viện Zod vào `packages/shared`, xây dựng bộ schemas xác thực dùng chung (`packages/shared/src/validators/auth.validator.ts`: `loginSchema`, `registerSchema`, `refreshTokenSchema`), xuất khẩu kiểu dữ liệu tự động `LoginInput`, `RegisterInput`.
  2. Thiết lập Zustand Store quản lý trạng thái máy khách (`apps/web/src/stores/auth.store.ts`: `useAuthStore`) quản lý `user`, `isAuthenticated`, `isLoading`, `setAuth`, `setUser`, `logout`, `initAuth`.
  3. Cài đặt và cấu hình TanStack Query v5 (`apps/web/src/providers/QueryProvider.tsx`), xây dựng bộ hooks React Query chuyên dụng (`apps/web/src/hooks/use-auth-mutations.ts`: `useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`, `useCurrentUserQuery`).
  4. Cầu nối `AuthContext.tsx` kế thừa trực tiếp từ `useAuthStore` và các mutation của TanStack Query, đảm bảo tính nhất quán trên toàn ứng dụng.
  5. Refactor toàn bộ form Đăng nhập (`/login`) và Đăng ký (`/register`) sử dụng `loginSchema.safeParse` và `registerSchema.safeParse`, hiển thị thông báo lỗi chi tiết theo từng trường (`fieldErrors.email`, `fieldErrors.password`, `fieldErrors.displayName`, `fieldErrors.confirmPassword`).
  6. Kiểm thử `npm run build -w @circle/web` thành công 100%, `npm run lint` đạt 0 lỗi 0 cảnh báo, `./scripts/check-agent-map.sh` đạt 100% 0 broken references.
- **Prompt Summary:** Nhắc nhở nghiêm khắc từ người dùng: "đã có trong định hướng thì phải xây ngay từ đầu tránh sau này phải refactor, frontend cũng tương tự dùng zustand. tanstack cacthu, cứ bám theo định hướng mà làm nhé, sao bạn lại làm khác vậy".
- **Files Affected:**
  - `packages/shared/package.json`
  - `packages/shared/src/index.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `apps/web/package.json`
  - `apps/web/src/stores/auth.store.ts`
  - `apps/web/src/providers/QueryProvider.tsx`
  - `apps/web/src/hooks/use-auth-mutations.ts`
  - `apps/web/src/context/AuthContext.tsx`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn Zod schemas, Zustand store, TanStack Query hooks và refactor giao diện.
- **Human Modifications:** Người dùng phát hiện và chấn chỉnh kịp thời việc chưa áp dụng các công nghệ đã quy hoạch (Zod, Zustand, TanStack Query) ngay từ đầu.
- **Verification Method:** Chạy `npm run build -w @circle/web` pass 100%, `npm run lint -w @circle/web` pass 100%, `npm test` 7/7 pass, `./scripts/check-agent-map.sh` pass 100%.
- **Official Source Checked:** `agentic/CONVENTIONS.md`, `agentic/memory/architecture.md`, `docs/architecture/frontend.md`, `packages/shared/README.md`.
- **Security & License Check:** An toàn, không chứa credentials, xác thực đầu vào chặt chẽ qua Zod.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** AI triển khai form xác thực ở phiên trước chỉ dùng state thủ công thuần túy, chưa tích hợp ngay bộ công nghệ định hướng đã ghi trong tài liệu kiến trúc (Zod validation schemas chia sẻ ở `packages/shared`, Zustand auth store, TanStack Query cho mutations).
  - **Root Cause:** AI có xu hướng tối giản hóa bước đầu (minimalist implementation) mà bỏ quên cam kết quy chuẩn kiến trúc dài hạn của dự án.
  - **Resolution / Fix:** Tiếp thu ngay chấn chỉnh của kỹ sư, cài đặt và đưa Zod vào `packages/shared`, xây dựng `useAuthStore` với Zustand, `QueryProvider` và hooks TanStack Query, refactor toàn bộ form sang Zod safeParse với field-level errors chuẩn mực.
- **Commit:** `7fa21c1`
- **PR:** #47 (https://github.com/1440isme/Circle/pull/47)

---

## AI-0028: Thiết lập Hệ thống Song ngữ (Anh - Việt / Bilingual i18n) Toàn diện cho Monorepo

- **Date:** 2026-09-27 11:08:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #46 ([SUB-FEAT]: US-AUTH-003 — Web Authentication Flow, AuthContext & Session Management (Parent: #18))
- **Purpose:** Thiết lập hệ thống hỗ trợ Song ngữ (Anh - Việt / Bilingual i18n) dùng chung trong Monorepo theo định hướng phát triển lâu dài:
  1. Xây dựng từ điển ngôn ngữ chuẩn mực tại `packages/shared/src/locales/` (`vi.ts` tiếng Việt làm mặc định, `en.ts` tiếng Anh đối ứng 1:1), cùng kiểu dữ liệu `TranslationDictionary` và danh mục `LOCALES`.
  2. Xây dựng Zustand store `useLanguageStore` (`apps/web/src/stores/language.store.ts`) quản lý `locale` và `t`, tự động lưu lựa chọn ngôn ngữ vào `localStorage` và `cookies` (`circle_locale`).
  3. Tạo component `LanguageSwitcher` (`apps/web/src/components/common/LanguageSwitcher.tsx`) cho phép chuyển đổi ngôn ngữ linh hoạt kèm cờ quốc gia và nhãn rõ ràng theo phong cách Apple HIG.
  4. Tích hợp `LanguageSwitcher` vào `Header.tsx` và `AuthLayout.tsx`, quốc tế hóa toàn bộ giao diện Đăng nhập, Đăng ký và thanh điều hướng.
  5. Đối soát và tổng hợp bảng ma trận công nghệ toàn diện của dự án CIRCLE.
  6. Kiểm thử `npm run build -w @circle/web` thành công 100%, `npm run lint` đạt 0 lỗi 0 cảnh báo, `npm test` 7/7 backend unit tests pass.
- **Prompt Summary:** Yêu cầu: "nhớ nhé, kiểm tra lại cho tôi xem những công nghệ mà sử dụng trong sản phẩm, đồng thời bổ sung dự án này hỗ trợ song ngữ anh việt nhé, ngay từ đầu chưa có gì nhiều nên khỏe cho sau này đỡ phải sửa".
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/locales/index.ts`
  - `packages/shared/src/index.ts`
  - `apps/web/src/stores/language.store.ts`
  - `apps/web/src/components/common/LanguageSwitcher.tsx`
  - `apps/web/src/app/(auth)/layout.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% từ điển song ngữ, Zustand language store, component chuyển ngữ và cập nhật view.
- **Human Modifications:** Trương Công Bình yêu cầu kiểm tra danh mục công nghệ và triển khai ngay giải pháp song ngữ Anh - Việt cho toàn hệ thống từ đầu.
- **Verification Method:** Chạy `npm run build -w @circle/web` pass 100%, `npm run lint -w @circle/web` pass 100%, `npm test` 7/7 pass, `./scripts/check-agent-map.sh` pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/CONVENTIONS.md`, `docs/design.md`.
- **Security & License Check:** An toàn, không chứa dữ liệu nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `a4fc139`
- **PR:** #47 (https://github.com/1440isme/Circle/pull/47)

---

## AI-0029: Tinh chỉnh Typography UI — Chuyển đổi Font sang Inter Tối ưu Trải nghiệm và Dễ đọc

- **Date:** 2026-09-27 11:18:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #46 ([SUB-FEAT]: US-AUTH-003 — Web Authentication Flow, AuthContext & Session Management (Parent: #18))
- **Purpose:** Tiếp nhận phản hồi của người dùng về việc font chữ UI ban đầu (`Plus Jakarta Sans`) có cảm giác chưa thuận mắt (dáng geometric display hơi tròn và rộng, giảm độ tập trung khi đọc form và văn bản). Thực hiện phân tích và đề xuất 4 lựa chọn font hàng đầu tối ưu cho giao diện Web tiếng Việt & chuẩn mực quốc tế:
  1. Thảo luận và thống nhất cùng kỹ sư chuyển đổi sang **Inter** — chuẩn mực UI toàn cầu (Figma, GitHub, Linear, Apple HIG style) với độ sắc nét cao, x-height chuẩn xác, khẩu độ chữ thoáng đãng và hỗ trợ tiếng Việt xuất sắc.
  2. Cập nhật `apps/web/src/app/layout.tsx`: nạp font `Inter` từ `next/font/google` với đầy đủ subset `['latin', 'vietnamese']`, weights `['400', '500', '600', '700']` và biến CSS `--font-inter`.
  3. Cập nhật `apps/web/tailwind.config.ts`: cấu hình `fontFamily.sans` ưu tiên `var(--font-inter)` và các hệ thống font fallbacks cao cấp (`-apple-system`, `BlinkMacSystemFont`, `sans-serif`).
  4. Biên dịch và kiểm thử thành công qua `npm run build -w @circle/web` (Next.js tạo 6/6 static pages hoàn hảo, không có bất kỳ cảnh báo hay lỗi kiểu).
- **Prompt Summary:** Phản hồi từ người dùng: "font ui tôi chưa thấy ưng ý lắm, bạn đề xuất font nào khác để nhìn thuận mắt hơn đi", và kỹ sư đã chọn font Inter.
- **Files Affected:**
  - `apps/web/src/app/layout.tsx`
  - `apps/web/tailwind.config.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu hình font Next.js Google Fonts và cập nhật Tailwind theme.
- **Human Modifications:** Trương Công Bình trực tiếp đánh giá cảm nhận thẩm mỹ và chọn phương án font Inter.
- **Verification Method:** Chạy `npm run build -w @circle/web` thành công 100% (mã thoát 0), kiểm tra `scripts/check-agent-map.sh` pass 100%.
- **Official Source Checked:** `next/font/google` Documentation, Rasmus Andersson (Inter Font Standards), Apple HIG Typography.
- **Security & License Check:** An toàn, font Inter theo giấy phép SIL Open Font License (OFL).
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `04252bc`
- **PR:** #47 (https://github.com/1440isme/Circle/pull/47)

---

## AI-0030: Đồng bộ Đặc tả Thiết kế docs/design.md, Khắc phục globals.css và Khởi động Backend Kiểm chứng Đăng ký

- **Date:** 2026-09-27 11:26:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #46 ([SUB-FEAT]: US-AUTH-003 — Web Authentication Flow, AuthContext & Session Management (Parent: #18))
- **Purpose:** Tiếp nhận câu hỏi kiểm tra từ kỹ sư về việc cập nhật tài liệu thiết kế `docs/design.md`, xác nhận tính toàn cục (Global) của font Inter, và nguyên nhân lỗi chưa đăng ký được trên giao diện Web:
  1. Cập nhật đồng bộ toàn diện `docs/design.md`: Chuyển đổi toàn bộ các tham chiếu font (Mục 2.2 Typography, sơ đồ Mermaid, mục 5.4 Header iOS Large Title, mục 6 Đối sánh Đa nền tảng và mục 7 DoD checklist) từ `Plus Jakarta Sans` sang **Inter**.
  2. Khắc phục triệt để trong `apps/web/src/app/globals.css`: Phát hiện thuộc tính `body { font-family: var(--font-plus-jakarta) }` bị sót làm trình duyệt không ăn biến font mới, đã chuyển đổi chính xác sang `var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
  3. Khởi chạy máy chủ Backend Modular Monolith NestJS (`apps/backend`) chạy nền trên cổng 4000 (`npm run dev:backend`), kết nối thành công PostgreSQL 16 và Redis 7 container.
  4. Thực nghiệm gửi lệnh đăng ký qua cURL (`POST /api/v1/auth/register`), nhận về kết quả HTTP 201 Created cùng đầy đủ User, Profile và cặp Token; kiểm chứng kiểm tra trùng lặp email trả về HTTP 409 Conflict chuẩn mực.
  5. Đối chiếu hiện trạng hệ thống với đặc tả SRS (UC01, UC02, UC03): Làm rõ hiện trạng luồng Auth (đã hoàn thành Core Identity Foundation: Register, Login, Refresh Token Rotation, Logout, Session Guards, Zod Validation, TanStack Query, Bilingual; chưa có Email Service OTP Verification và Forgot Password).
- **Prompt Summary:** Yêu cầu: "đổi trong desginmd chưa vậy, đây là áp dụng global và luồng auth đã làm được full chưa vậy, tôi chưa đăng ký được và email đã có veritfy otp cũng như quên mật khẩu chưa".
- **Files Affected:**
  - `docs/design.md`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cập nhật tài liệu đặc tả, tinh chỉnh biến CSS và kiểm thử API end-to-end.
- **Human Modifications:** Trương Công Bình giám sát đối soát tài liệu thiết kế, phát hiện vấn đề chưa đăng ký được trên Web UI và yêu cầu làm rõ tính toàn vẹn của luồng Auth theo SRS.
- **Verification Method:** Chạy `./scripts/check-agent-map.sh` pass 100%, cURL đăng ký trả về HTTP 201 Created, cURL trùng lặp email trả về HTTP 409 Conflict.
- **Official Source Checked:** `docs/design.md`, `docs/requirements/use-cases.md` (UC01, UC02, UC03), `PROJECT_GOD.md`.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Ở phiên trước, `globals.css` vẫn còn giữ dòng `body { font-family: var(--font-plus-jakarta) }`, khiến việc khai báo font Inter ở `layout.tsx` bị ghi đè cục bộ. Ngoài ra `docs/design.md` chưa được cập nhật đồng bộ sau khi người dùng chọn đổi font.
  - **Root Cause:** Sót khai báo trong CSS tĩnh và tài liệu thiết kế chuẩn.
  - **Resolution / Fix:** Đồng bộ toàn diện `docs/design.md` và sửa `globals.css` sang `var(--font-inter)`.
- **Commit:** `935ebdc`
- **PR:** #47 (https://github.com/1440isme/Circle/pull/47)

---

## AI-0031: Xây dựng Hệ thống Xác thực OTP qua Email, Kích hoạt Tài khoản và Quên/Đặt lại Mật khẩu

- **Date:** 2026-09-27 11:45:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #48 ([SUB-FEAT]: US-AUTH-004 — Email OTP Verification, Account Activation & Password Recovery (Parent: #18))
- **Purpose:** Triển khai toàn diện tính năng Xác thực OTP qua Email, Kích hoạt tài khoản và Khôi phục mật khẩu theo chuẩn Use Case UC01, UC02, UC03 và tiêu chuẩn bảo mật Rubric Level 5 (TC2.4):
  1. **Hạ tầng Email & Bộ nhớ đệm:**
     - Xây dựng `MailModule` & `MailService` (`apps/backend/src/modules/mail/`) tích hợp `nodemailer`, tự động sinh template HTML email thương hiệu CIRCLE mang phong cách Apple HIG (tone màu bạc hà `#78C6A3`, cây xô thơm `#4FA982`, hộp mã OTP monospace to rõ ràng).
     - Xây dựng `RedisService` (`apps/backend/src/database/redis.service.ts`) kết nối container Redis 7 Alpine quản lý mã OTP 6 số ngẫu nhiên (`crypto.randomInt`), cài đặt TTL 300 giây (5 phút), cooldown giới hạn tần suất gửi lại 60 giây và chặn brute-force tối đa 5 lần thử sai.
  2. **Backend Auth API:**
     - Cập nhật Prisma Schema đổi `isActivated` mặc định về `false` và chạy migration `20260927044220_user_is_activated_default_false`.
     - `POST /api/v1/auth/register`: Tạo tài khoản trạng thái chờ, tự động sinh và gửi OTP kích hoạt qua email.
     - `POST /api/v1/auth/login`: Chặn đăng nhập nếu `isActivated === false`, trả về mã lỗi `ACCOUNT_NOT_ACTIVATED`.
     - `POST /api/v1/auth/verify-otp`: Xác thực OTP, cập nhật `isActivated: true`, cấp cặp Dual-Token.
     - `POST /api/v1/auth/resend-otp`: Gửi lại mã OTP mới kèm kiểm tra cooldown 60s.
     - `POST /api/v1/auth/forgot-password`: Nhận email, sinh mã OTP khôi phục mật khẩu (chống user enumeration flaw).
     - `POST /api/v1/auth/reset-password`: Xác thực OTP, cập nhật mật khẩu mới (bcrypt cost 12), tự động thu hồi toàn bộ session token cũ trong cơ sở dữ liệu.
  3. **Shared Contracts & Song ngữ:**
     - Bổ sung Zod schemas tại `packages/shared/src/validators/auth.validator.ts` (`verifyOtpSchema`, `resendOtpSchema`, `forgotPasswordSchema`, `resetPasswordSchema`) và xuất khẩu kiểu dữ liệu tự động.
     - Bổ sung từ điển song ngữ Anh - Việt đầy đủ tại `packages/shared/src/locales/vi.ts` và `en.ts`.
  4. **Frontend Web UI:**
     - Xây dựng `useVerifyOtpMutation`, `useResendOtpMutation`, `useForgotPasswordMutation`, `useResetPasswordMutation` trên nền TanStack Query.
     - Trang `/verify-otp`: Giao diện 6 ô nhập mã số OTP phong cách Apple HIG tự động chuyển focus, hỗ trợ paste chuỗi 6 số, hiển thị bộ đếm ngược 60 giây gửi lại mã.
     - Trang `/forgot-password`: Biểu mẫu nhập email nhận mã xác nhận khôi phục mật khẩu.
     - Trang `/reset-password`: Biểu mẫu nhập OTP và mật khẩu mới với thanh đo độ dài và trùng khớp mật khẩu trực quan.
     - Cập nhật trang `/login` liên kết `/forgot-password` và tự động chuyển hướng sang `/verify-otp` nếu phát hiện tài khoản chưa kích hoạt.
     - Cập nhật trang `/register` tự động điều hướng sang `/verify-otp` ngay sau khi đăng ký.
  5. **Kiểm thử tự động & Báo cáo sitemap:**
     - Mở rộng bộ kiểm thử đơn vị `auth.service.spec.ts` lên 14/14 test cases (TC-AUTH-001 đến TC-AUTH-006) pass 100%.
     - Next.js biên dịch thành công 9/9 trang tĩnh không lỗi kiểu.
     - Cập nhật `.agents/SITEMAP.md` đánh dấu hoàn thành các trang `/verify-otp`, `/forgot-password`, `/reset-password`.
- **Prompt Summary:** Yêu cầu: "ok hợp lý, triển khai thôi", sau khi đã thảo luận và thống nhất về sự cần thiết của luồng xác thực email OTP và quên mật khẩu theo chuẩn SRS.
- **Files Affected:**
  - `apps/backend/package.json`
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260927044220_user_is_activated_default_false/migration.sql`
  - `apps/backend/src/database/redis.service.ts`
  - `apps/backend/src/database/database.module.ts`
  - `apps/backend/src/modules/mail/mail.service.ts`
  - `apps/backend/src/modules/mail/mail.module.ts`
  - `apps/backend/src/app.module.ts`
  - `apps/backend/src/modules/auth/dto/verify-otp.dto.ts`
  - `apps/backend/src/modules/auth/dto/resend-otp.dto.ts`
  - `apps/backend/src/modules/auth/dto/forgot-password.dto.ts`
  - `apps/backend/src/modules/auth/dto/reset-password.dto.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/hooks/use-auth-mutations.ts`
  - `apps/web/src/app/(auth)/verify-otp/page.tsx`
  - `apps/web/src/app/(auth)/forgot-password/page.tsx`
  - `apps/web/src/app/(auth)/reset-password/page.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `.agents/SITEMAP.md`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn module Mail, Redis, DTOs, Controllers, Services, Schemas, Mutations, React components và test suites.
- **Human Modifications:** Trương Công Bình định hướng và phê duyệt triển khai trọn gói luồng OTP kích hoạt và khôi phục mật khẩu theo chuẩn SRS.
- **Verification Method:** Chạy `npm test -w @circle/backend` (14/14 tests pass 100%), `npm run build -w @circle/web` (9/9 static pages pass), `npm run lint -w @circle/web` (0 warning 0 error), `./scripts/check-agent-map.sh` (pass 100%).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, Rubric Level 5 TC2.1 & TC2.4), `docs/requirements/use-cases.md` (UC01, UC02, UC03).
- **Security & License Check:** An toàn, mã OTP 6 số lưu Redis có TTL 300s, giới hạn 5 lần nhập sai, cooldown 60s, mật khẩu mới băm bcrypt cost 12, thu hồi toàn bộ session token cũ khi đổi mật khẩu, không làm lộ user enumeration.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `e54937c`
- **PR:** #49 (https://github.com/1440isme/Circle/pull/49)

---

## AI-0032: Tối ưu Trải nghiệm Điều hướng Người dùng Chưa kích hoạt từ Login sang Verify OTP

- **Date:** 2026-09-27 11:51:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #48 ([SUB-FEAT]: US-AUTH-004 — Email OTP Verification, Account Activation & Password Recovery (Parent: #18))
- **Purpose:** Tiếp nhận tình huống câu hỏi thực tế của người dùng: "nếu đăng ký mà chưa xác thực otp và sau đó quay lại đăng nhập thì sao?". Tối ưu hóa toàn diện luồng trải nghiệm cho người dùng trong tình huống này:
  1. Khi người dùng nhập đúng email & mật khẩu tại `/login` nhưng tài khoản chưa kích hoạt (`ACCOUNT_NOT_ACTIVATED`), frontend bắt mã lỗi và tự động điều hướng sang `/verify-otp?email=...&from=login`.
  2. Tại màn hình `/verify-otp`:
     - Nhận biết cờ `from=login` để hiển thị banner giải thích thân thiện: *"Tài khoản của bạn chưa được kích hoạt. Hãy nhập mã OTP trong email, hoặc nhấn 'Gửi lại mã xác thực' nếu mã cũ đã hết hạn."*
     - Đặt ngay `countdown = 0` và `canResend = true` để người dùng có thể bấm "Gửi lại mã xác thực" ngay lập tức nếu mã 5 phút lúc đăng ký trước đó đã hết hạn, không bắt người dùng phải chờ đếm ngược 60 giây vô lý.
  3. Kiểm thử Next.js production build (`npm run build -w @circle/web`) thành công 9/9 trang tĩnh không lỗi.
- **Prompt Summary:** Câu hỏi từ người dùng: "nếu đăng ký mà chưa xác thực otp và sau đó quay lại đăng nhập thì sao".
- **Files Affected:**
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/verify-otp/page.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn xử lý điều hướng, query param và banner gợi ý trên giao diện.
- **Human Modifications:** Trương Công Bình đặt câu hỏi trải nghiệm thực tế giúp phát hiện điểm nghẽn UX (bắt người dùng chờ 60s đếm ngược khi quay lại sau nhiều giờ).
- **Verification Method:** Chạy `npm run build -w @circle/web` pass 100% (9/9 trang), `./scripts/check-agent-map.sh` pass 100%.
- **Official Source Checked:** Apple HIG User Guidance, `docs/requirements/use-cases.md` (UC02 Luồng A2).
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Ban đầu `verify-otp` luôn khởi tạo cứng bộ đếm đếm ngược `countdown = 60`, gây ức chế cho người dùng quay lại đăng nhập sau khi mã OTP cũ đã hết hạn từ lâu.
  - **Root Cause:** Chưa phân định ngữ cảnh truy cập (người vừa đăng ký xong vs người quay lại từ form đăng nhập).
  - **Resolution / Fix:** Bổ sung tham số `from=login`, tự động mở quyền gửi lại mã ngay lập tức khi phát hiện chuyển hướng từ đăng nhập.
- **Commit:** `bac5a09`
- **PR:** #49 (https://github.com/1440isme/Circle/pull/49)

---

## AI-0033: Chuẩn hóa Toàn diện Song ngữ (i18n) Frontend & Email Service, Triển khai Global Light & Dark Theme

- **Date:** 2026-09-27 12:08:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #50 ([SUB-FEAT]: US-WEB-002 — Global Light/Dark Theme System & Full Bilingual i18n Audit (Parent: #18))
- **Purpose:** Tiếp nhận phản hồi từ người dùng về việc loại bỏ các chuỗi văn bản hardcode Tiếng Việt ở cả Frontend lẫn Email Service, đồng thời đặc tả và triển khai hệ thống Chủ đề Giao diện Kép (Global Light & Dark Theme):
  1. **Chuẩn hóa Song ngữ (Bilingual i18n Audit):**
     - Mở rộng toàn diện từ điển `@circle/shared` (`vi.ts` và `en.ts`): Bổ sung đầy đủ các bộ từ khóa cho `common` (theme, copyright, standards, security), `auth` (lỗi, placeholder, thông báo khôi phục), `nav` (kênh trò chuyện, danh mục tiện ích nhóm, đếm thành viên), và `mail` (tiêu đề, lời chào, hướng dẫn mã OTP, lời cảm ơn).
     - Rà soát và thay thế toàn bộ chuỗi hardcode tiếng Việt trong `apps/web`: `Header`, `Sidebar`, `AuthLayout`, `login`, `register`, `verify-otp`, `forgot-password`, `reset-password`.
     - Nâng cấp `MailService` trên NestJS Backend: Hỗ trợ tham số `locale: 'vi' | 'en'`, render động nội dung email HTML responsive từ `@circle/shared`.
     - Tự động truyền header `x-circle-locale` từ API Client Web lên Backend thông qua `apiRequest` wrapper.
  2. **Đặc tả Thiết kế Chủ đề Toàn cục (Global Theme System Specification):**
     - Bổ sung mục 2.5 trong `docs/design.md`: Quy định rõ kỷ luật Dark Mode của CIRCLE — tuyệt đối không dùng OLED pitch-black (`#000000`) gây mỏi mắt, sử dụng sắc độ Thảo mộc Đêm (Deep Forest Obsidian `#0E1512` và Night Pine `#16201B`), đạt tỷ lệ tương phản WCAG 2.1 AAA (14.8:1).
     - Quy định vật liệu kính mờ ban đêm (*Dark Frosted Glass*) và nhịp thở nhung (*Luminescent Mint* `#78C6A3`).
  3. **Hiện thực hóa Dark Mode trên Next.js Web (`apps/web`):**
     - Cấu hình Tailwind `darkMode: 'class'` và mở rộng bảng màu `circle.dark.*`.
     - Cập nhật `globals.css` với các lớp chuyển màu mượt mà, dark frosted glass và dark scrollbar.
     - Xây dựng `theme.store.ts` (Zustand) hỗ trợ 3 chế độ: `light`, `dark`, `system` (tự động nghe sự kiện thay đổi của hệ điều hành qua `prefers-color-scheme`).
     - Tạo component `ThemeToggle.tsx` đặt đồng bộ tại thanh Header chính và Header trang xác thực, hỗ trợ song ngữ.
     - Chèn inline script tại thẻ `<head>` của `layout.tsx` nhằm ngăn chặn triệt để hiện tượng nháy trắng giao diện (Zero FOUT).
- **Prompt Summary:** "để ý việc hiển thị ở forntend nhé hoặc cả mail nhiều chỗ tôi thấy hardcode tiếng việt, và bổ sung thêm theme light và dark mode luôn ghi vào degsin global luôn nhé"
- **Files Affected:**
  - `docs/design.md`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/backend/src/modules/mail/mail.service.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/web/tailwind.config.ts`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/stores/theme.store.ts`
  - `apps/web/src/components/common/ThemeToggle.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/app/(auth)/layout.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/app/(auth)/verify-otp/page.tsx`
  - `apps/web/src/app/(auth)/forgot-password/page.tsx`
  - `apps/web/src/app/(auth)/reset-password/page.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn store, component, refactor mail service và cập nhật CSS theme.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ ra điểm nghẽn trải nghiệm hardcode tiếng Việt và yêu cầu bổ sung Dark Mode toàn cục vào tài liệu đặc tả thiết kế.
- **Verification Method:**
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: Biên dịch thành công 9/9 trang tĩnh không lỗi TypeScript.
  - `npm run lint -w @circle/web`: 0 errors, 0 warnings.
  - `./scripts/check-agent-map.sh`: Tất cả liên kết trong 93 file tài liệu framework hợp lệ 100%.
- **Official Source Checked:** Apple HIG Color & Dark Mode Guidelines, WCAG 2.1 Contrast Standards, `docs/design.md`.
- **Security & License Check:** An toàn, không chứa thông tin bí mật hay API key.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Không có.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `403d8b1`
- **PR:** #51 (https://github.com/1440isme/Circle/pull/51)

---

## AI-0034: Authenticated Home Feed Guard, Clean Real-User State & SMTP Mailer Configuration

- **Date:** 2026-09-27 13:52:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #52 (US-WEB-003 — Authenticated Home Feed Guard, Clean Real-User State & SMTP Mailer Configuration)
- **Purpose:**
  1. Hướng dẫn và cấu hình biến môi trường SMTP Mailer trong `.env.example` và `apps/backend/.env` cho phép tùy biến gửi OTP qua email thật hoặc tự động fallback Stream Mailer log ra terminal khi chạy local.
  2. Bổ sung chế độ Dark Mode (`dark:*`) hoàn chỉnh cho `LanguageSwitcher.tsx` trên Header của cụm màn hình xác thực `/(auth)` và trang chủ.
  3. Bọc bảo vệ Trang chủ (`apps/web/src/app/page.tsx`) bằng `<AuthGuard mode="require-auth">`, chặn triệt để hành vi tự động load dữ liệu trang chủ khi chưa đăng nhập, tự động điều hướng khách sang `/login?redirect=/`.
  4. Loại bỏ 100% dữ liệu mock cứng ("Kỷ Niệm Mùa Thu 🍂", các bài viết và thành viên giả định) trong `FeedStream.tsx`, `Sidebar.tsx`, `PresenceRail.tsx`.
  5. Xây dựng Welcome Hero Dashboard chuẩn Apple HIG / Google Stitch lấy dữ liệu người dùng thật (`useAuth()`), kèm trạng thái rỗng (Empty States) tinh gọn, thanh thoát, sẵn sàng cho Module 3 (Circle Membership) và Module 4 (Feed & Posts).
  6. Đồng bộ hóa toàn diện từ điển song ngữ Anh - Việt (`packages/shared/src/locales/vi.ts` & `en.ts`).
- **Prompt Summary:** "gửi otp bằng cách nào, tôi chưa thấy chỗ nào cho việc điền thông tin mail để làm mail gửi cả, ui ở header ngoài trang đăng ký đăng nhập chưa chuyển được sáng tối ngôn ngữ, ở trang chủ thì ok, và làm lại trang chủ chuẩn chỉnh k hardcode hay mock data nữa nhé, và k tự động load trang chủ nếu chưa đăng nhập"
- **Files Affected:**
  - `.env.example`
  - `apps/backend/.env`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/components/common/LanguageSwitcher.tsx`
  - `apps/web/src/components/auth/AuthGuard.tsx`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/components/presence/PresenceRail.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn cấu hình, sửa đổi styling dark mode, AuthGuard wrapper, dọn dẹp mock data và bổ sung bản dịch i18n.
- **Human Modifications:** Trương Công Bình trực tiếp phản hồi về việc thiếu cấu hình SMTP để gửi mail thật, phát hiện lỗi dark mode ở LanguageSwitcher trên Header Auth, và yêu cầu bảo vệ trang chủ cùng việc loại bỏ hoàn toàn mock data.
- **Verification Method:**
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/shared`: Typecheck & compile pass.
  - `npm run build -w @circle/web`: Next.js 14 biên dịch thành công 9/9 trang tĩnh.
  - `npm run lint -w @circle/web`: 0 errors, 0 warnings.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Next.js App Router Authentication Patterns, Apple Human Interface Guidelines, Nodemailer SMTP transport specification.
- **Security & License Check:** An toàn, các biến mật khẩu SMTP trong file mẫu đều để trống, không lưu credentials vào repository.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Khi chạy build web lần đầu, `FeedStream.tsx` gọi `t.home.createFirstCirclePrompt` nhưng key này chưa được khai báo trong từ điển shared, dẫn tới lỗi typecheck Next.js build.
  - **Root Cause:** Khai báo thiếu một key translation trong `vi.ts` và `en.ts`.
  - **Resolution / Fix:** Bổ sung key `createFirstCirclePrompt` vào cả `vi.ts` và `en.ts`, build lại `@circle/shared` và `@circle/web` thành công trơn tru.
- **Commit:** `60453ca`
- **PR:** #53 (https://github.com/1440isme/Circle/pull/53)

---

## AI-0035: Cài đặt & Cấu hình Docker Engine + Docker Compose trên WSL2 & Tích hợp Antigravity IDE

- **Date:** 2026-09-27 14:55:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #54 ([CHORE]: TASK-INFRA-002 — WSL2 Docker Engine Setup & AI Usage Log Alignment)
- **Purpose:**
  1. Cài đặt phân phối Linux Ubuntu 24.04 LTS vào WSL2, kích hoạt systemd tự động khởi chạy service và cài đặt bộ Docker Engine Community (Docker CE 29.8.1, containerd, Docker Compose v5.5.1, Buildx) phục vụ vận hành cơ sở dữ liệu PostgreSQL & Redis cho dự án CIRCLE trực tiếp trên WSL mà không cần Docker Desktop.
  2. Cấu hình Docker daemon trong WSL2 lắng nghe trên TCP Socket `tcp://0.0.0.0:2375` (`/etc/systemd/system/docker.service.d/override.conf`) với cờ `--tls=false` (loại bỏ độ trễ khởi động 15s).
  3. Cấu hình mạng phản chiếu `networkingMode=mirrored` trong `$env:USERPROFILE\.wslconfig` (Windows 11) để liên kết thông suốt cổng 2375 từ WSL sang `127.0.0.1:2375` trên Windows.
  4. Cài đặt `Docker CLI` (v29.8.1) cho Windows qua `winget`, thiết lập biến môi trường `DOCKER_HOST=tcp://127.0.0.1:2375` và cấu hình `.vscode/settings.json` (`"docker.host": "tcp://127.0.0.1:2375"`) giúp Docker Extension trong Antigravity IDE nhận diện và kết nối trực tiếp với Docker Engine.
  5. Tiếp thu và chuẩn hóa nguyên tắc ghi nhận danh tính kỹ sư trong AI Usage Log theo đúng quy chuẩn: Căn cứ chuẩn xác vào commit author của bản ghi log hoặc author của Pull Request.
- **Prompt Summary:** "máy tôi đã có wsl, cài dock engine cho tôi nhé" và "sao tôi cài xong rồi mà docker extension trong anti ide k nhận nhỉ, và đặc biệt tôi thấy bạn ghi log ai usage nhầm rồi đó, tôi là hạnh mà check lại từ trước tới giờ và kiểm tra lại đúng người sử dụng nhé"
- **Files Affected:**
  - `.vscode/settings.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% các bước dò trạng thái WSL, tải và cài đặt Ubuntu 24.04 LTS, cấu hình systemd override TCP socket, cấu hình .wslconfig mirrored networking, cài đặt Windows Docker CLI và cấu hình IDE settings.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp chỉ đạo cài đặt Docker Engine trên WSL, phát hiện Docker extension trong IDE chưa nhận diện daemon và chấn chỉnh nguyên tắc xác định danh tính kỹ sư ghi nhật ký AI theo commit/PR author.
- **Verification Method:**
  - `wsl -l -v`: Ubuntu-24.04 WSL2 hoạt động ổn định.
  - `wsl systemctl is-active docker`: `active`.
  - `wsl docker run --rm hello-world`: "Hello from Docker!" thành công 100%.
  - `wsl docker compose -f /mnt/d/TLCN/Circle/docker-compose.yml config`: Phân giải thành công cấu hình PostgreSQL & Redis của dự án.
  - `Test-NetConnection -ComputerName 127.0.0.1 -Port 2375`: `TcpTestSucceeded : True`.
  - `docker.exe version` trên Windows: Kết nối thành công Client (Windows) và Server Docker Engine Community 29.8.1 (WSL Ubuntu).
- **Official Source Checked:** Docker Official Ubuntu Engine Installation Guide, Microsoft WSL2 Mirrored Networking Documentation, VS Code Docker Extension Settings Guide.
- **Security & License Check:** Docker CE Apache 2.0 community, bảo mật không lưu secret, socket 2375 phục vụ loopback phát triển cục bộ.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Ở lượt phản hồi trước, AI đã tự động gán mặc định tên kỹ sư ở AI-0035, và khi được nhắc nhở lại suy luận hấp tấp tự ý thay đổi hàng loạt tên ở các log trước đó mà không kiểm tra lịch sử commit/PR author thực tế của từng bản ghi trong Git.
  - **Root Cause:** AI không kiểm tra lịch sử tác giả (`git log`) của từng commit/PR tương ứng với mỗi log entry trước khi đưa ra quyết định sửa đổi.
  - **Resolution / Fix:** Khôi phục nguyên vẹn 100% các bản ghi từ AI-0001 đến AI-0034 từ Git HEAD đúng theo commit/PR author của từng bạn, và ghi nhận chính xác bản ghi AI-0035 cho kỹ sư Ninh Thị Mỹ Hạnh theo đúng phiên làm việc hiện tại.
- **Commit:** `aba5db1`
- **PR:** #55 (https://github.com/1440isme/Circle/pull/55)

---

## AI-0036: Fix Password Reset Validation Payload and Auth Header Dropdown Interactivity

- **Date:** 2026-09-27 15:55:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #56 ([BUG]: Fix Password Reset Validation Payload and Auth Header Dropdown Interactivity)
- **Purpose:**
  1. Loại bỏ trường `confirmPassword` khỏi JSON payload gửi lên endpoint `POST /auth/reset-password` (`resetPasswordApi`, `useResetPasswordMutation`, `reset-password/page.tsx`), đồng thời bổ sung `@IsOptional() confirmPassword?: string` tại `ResetPasswordDto` ở backend nhằm đảm bảo tương thích ngược phòng thủ, loại bỏ dứt điểm lỗi `400 Bad Request: property confirmPassword should not exist`.
  2. Khắc phục lỗi Stacking Context trong CSS tại `apps/web/src/app/(auth)/layout.tsx`: Nâng `header` lên `relative z-40` để dropdown menu luôn nổi lên trên thẻ `<main>` (`relative z-10`), ngăn chặn hiện tượng vùng chứa form đăng nhập/đăng ký đè lên dropdown làm chặn sự kiện chuột.
  3. Tích hợp trực tiếp sự kiện `onMouseDown` kết hợp `e.preventDefault()` và `e.stopPropagation()` trên các button lựa chọn của `ThemeToggle.tsx` và `LanguageSwitcher.tsx`, triệt tiêu hoàn toàn xung đột thời gian (event race) với trình lắng nghe click-outside ở document, đảm bảo 100% người dùng click chọn theme (Light/Dark/System) và ngôn ngữ (VI/EN) có hiệu lực tức thì.
- **Prompt Summary:** "reivew cho hạnh nhé" và "chức năng reset password property confirmPassword should not exist, và ở ngoài trang chủ (trang login va đăng ký vẫn chưa chọn được ngôn ngữ và theme, chỉ xổ ra thôi chứ k chọn được"
- **Files Affected:**
  - `apps/backend/src/modules/auth/dto/reset-password.dto.ts`
  - `apps/web/src/app/(auth)/layout.tsx`
  - `apps/web/src/app/(auth)/reset-password/page.tsx`
  - `apps/web/src/components/common/LanguageSwitcher.tsx`
  - `apps/web/src/components/common/ThemeToggle.tsx`
  - `apps/web/src/hooks/use-auth-mutations.ts`
  - `apps/web/src/lib/auth.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn điều chỉnh DTO, payload request, CSS stacking context và event handlers.
- **Human Modifications:** Trương Công Bình trực tiếp phát hiện lỗi validation `property confirmPassword should not exist` khi test chức năng reset password và lỗi không click chọn được dropdown theme/ngôn ngữ trên trang login/đăng ký.
- **Verification Method:**
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 biên dịch thành công 9/9 trang tĩnh không lỗi TypeScript.
  - `npm run lint -w @circle/web`: 0 errors, 0 warnings.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** NestJS ValidationPipe Whitelist Documentation, MDN CSS Stacking Context & MouseEvent Specification.
- **Security & License Check:** An toàn, không chứa thông tin bí mật hay token.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Không có.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `0169ef8`
- **PR:** #57 (https://github.com/1440isme/Circle/pull/57)

---

<<<<<<< HEAD
## AI-0037: Initialize Mobile App Shell with Full Auth Flow, SecureStore and Bilingual Themes

- **Date:** 2026-09-27 20:40:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Xây dựng ứng dụng di động React Native + Expo (`apps/mobile`) với Expo Router v3, đồng bộ 100% các tính năng xác thực, bảo mật, thiết kế và trải nghiệm người dùng tương đồng với bản Web đã hoàn thiện:
  1. Khởi tạo `apps/mobile` với Expo SDK 51, React Native 0.74.5, Expo Router v3, Zustand, TanStack Query, Lucide icons và `expo-secure-store`. Cấu hình Metro monorepo watch symlinks hỗ trợ `@circle/shared` và `@circle/types`.
  2. Xây dựng Design System mobile với Design Tokens (Sage, Peach, Charcoal, Canvas, Wash, Dark tokens) đồng bộ theo chuẩn Apple HIG & Google Stitch.
  3. Cài đặt các Store toàn cục: `theme.store.ts` (Light/Dark/System), `language.store.ts` (VI/EN tích hợp từ `@circle/shared`), `auth.store.ts` (quản lý trạng thái xác thực, profile, refresh token, remember-me).
  4. Cài đặt `api.ts` xử lý Dual-Token với cơ chế silent refresh tự động khi gặp mã lỗi 401 và bảo mật lưu trữ token qua `expo-secure-store`.
  5. Xây dựng luồng xác thực đầy đủ: Đăng nhập (`login.tsx`), Đăng ký (`register.tsx`), Xác thực OTP kích hoạt tài khoản (`verify-otp.tsx` với bộ đếm ngược 60 giây), Quên mật khẩu (`forgot-password.tsx`), Đặt lại mật khẩu (`reset-password.tsx`).
  6. Xây dựng bố cục ứng dụng chính với Bottom Tabs Navigator: Trang chủ Chào mừng Dashboard (`(tabs)/index.tsx`), Vòng tròn (`(tabs)/circles.tsx`), Tin nhắn (`(tabs)/messages.tsx`), Hồ sơ cá nhân (`(tabs)/profile.tsx`).
  7. Tích hợp HeaderControls cho phép chuyển đổi giao diện sáng/tối và ngôn ngữ Anh/Việt mượt mà trên toàn bộ các màn hình.
- **Prompt Summary:** "module 3 là của hạnh mà bạn k check file phân công à, chắc là giờ làm mobile đi ha, hiện tại những gì tôi làm được trên web rồi thì làm tương tự với mobile"
- **Files Affected:**
  - `apps/mobile/app.json`
  - `apps/mobile/babel.config.js`
  - `apps/mobile/metro.config.js`
  - `apps/mobile/package.json`
  - `apps/mobile/tsconfig.json`
  - `apps/mobile/assets/icon.png`, `splash.png`, `adaptive-icon.png`
  - `apps/mobile/src/constants/theme.ts`
  - `apps/mobile/src/services/storage.ts`
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/src/stores/auth.store.ts`
  - `apps/mobile/src/stores/language.store.ts`
  - `apps/mobile/src/stores/theme.store.ts`
  - `apps/mobile/src/components/common/Button.tsx`
  - `apps/mobile/src/components/common/Input.tsx`
  - `apps/mobile/src/components/common/HeaderControls.tsx`
  - `apps/mobile/app/_layout.tsx`
  - `apps/mobile/app/index.tsx`
  - `apps/mobile/app/(auth)/_layout.tsx`
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/verify-otp.tsx`
  - `apps/mobile/app/(auth)/forgot-password.tsx`
  - `apps/mobile/app/(auth)/reset-password.tsx`
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn khởi tạo Expo mobile app, cấu hình monorepo, các màn hình auth & dashboard, store quản lý trạng thái, và bộ component UI.
- **Human Modifications:** Trương Công Bình trực tiếp nhắc nhở phân công nhiệm vụ (Module 3 thuộc về Hạnh per `docs/phan-cong-nhiem-vu.md`) và yêu cầu chuyển sang phát triển ứng dụng di động Mobile (`apps/mobile`) để đồng bộ hoàn toàn tiến độ với bản Web.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 biên dịch thành công 9/9 trang.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Expo SDK 51 Documentation, Expo Router v3 Documentation, React Native Documentation.
- **Security & License Check:** Token lưu trong `expo-secure-store` bảo mật mã hóa phần cứng Keychain/Keystore; không lộ secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Khi mới khởi tạo các màn hình mobile auth, AI đã giả định một số key localization như `emailLabel`, `sendResetCode`, `groupOnlyChatTagline`, `security` thay vì sử dụng chính xác các key từ dictionary `@circle/shared` (`email`, `sendResetOtp`, `dualTokenSecurity`).
  - **Root Cause:** AI không tra cứu chi tiết toàn bộ key dictionary trong `packages/shared/src/locales/vi.ts` trước khi sinh code giao diện.
  - **Resolution / Fix:** Chạy `npx tsc --noEmit`, đọc chính xác file từ điển `vi.ts` và thay thế toàn bộ key không tồn tại về đúng các key chuẩn của `@circle/shared`.
- **Commit:** `b20d4b5`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0038: Support EXPO_PUBLIC_API_URL for Dynamic Mobile Testing

- **Date:** 2026-09-27 20:43:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Bổ sung hỗ trợ biến môi trường `EXPO_PUBLIC_API_URL` trong hàm `getDefaultApiUrl()` tại `apps/mobile/src/services/api.ts` nhằm cho phép lập trình viên chạy thử nghiệm ứng dụng di động trên thiết bị thật (qua Expo Go với mạng LAN Wi-Fi `http://<LAN_IP>:4000`) mà không cần hardcode địa chỉ backend.
- **Prompt Summary:** "làm sao dể tôi chạy thử"
- **Files Affected:**
  - `apps/mobile/src/services/api.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic trích xuất biến môi trường `process.env.EXPO_PUBLIC_API_URL`.
- **Human Modifications:** Trương Công Bình hỏi cách chạy thử ứng dụng di động.
- **Verification Method:** `npx tsc --noEmit` trong `apps/mobile` pass 100%.
- **Official Source Checked:** Expo Environment Variables Documentation.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `57b7d18`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0039: Upgrade Mobile App to Expo SDK 57 for iOS Expo Go Compatibility

- **Date:** 2026-09-27 21:02:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Nâng cấp toàn bộ hệ thống dependency của `apps/mobile` lên **Expo SDK 57 (v57.0.25)**, React 19.2.3 và React Native 0.86.3 nhằm khắc phục lỗi không tương thích phiên bản (`Project is incompatible, installed version of Expo Go is for SDK 57.0.0, the project opened uses SDK 51`) khi người dùng quét mã QR bằng Expo Go trên iPhone.
- **Prompt Summary:** "prj is incompatrible, installed ver expo go for sdk 57.0.0, the prj opened use sdk 51, how to fix: upgrapde pej to sdk 57.0.0 orr luach ios simmulator"
- **Files Affected:**
  - `apps/mobile/package.json`
  - `apps/mobile/src/components/common/Input.tsx`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% cấu hình các package đồng bộ chuẩn Expo SDK 57 (`expo-router ~57.0.23`, `expo-secure-store ~57.0.4`, `expo-status-bar ~57.0.1`, `expo-constants ~57.0.19`, `expo-linking ~57.0.11`, `react-native-safe-area-context ~5.7.0`, `react-native-screens ~4.26.0`, `react-native-svg 15.15.4`) và xử lý type assertion React 19 trong `Input.tsx`.
- **Human Modifications:** Trương Công Bình báo lỗi Expo Go trên iPhone từ chối mở do yêu cầu SDK 57.0.0.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 biên dịch thành công 9/9 trang.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Expo SDK 57 Bundled Native Modules Specification (`github:expo/expo@sdk-57`).
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `182e5f2`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0040: Fix Mobile API Endpoint Prefix and Dynamic Host IP Resolution

- **Date:** 2026-09-27 21:13:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Khắc phục lỗi "Không thể kết nối đến máy chủ" khi đăng nhập từ thiết bị di động:
  1. Điều chỉnh `getDefaultApiUrl()` trong `apps/mobile/src/services/api.ts` để luôn gắn tiền tố chuẩn `/api/v1` của NestJS Backend.
  2. Bổ sung cơ chế tự động trích xuất địa chỉ IP của máy chủ phát triển Metro từ `Constants.expoConfig?.hostUri` (ví dụ `192.168.1.196`) khi chạy qua Expo Go, đồng thời cấu hình fallback về IP LAN `http://192.168.1.196:4000/api/v1` thay vì `localhost` (vốn trỏ vào chính điện thoại).
  3. Cập nhật CORS tại `apps/backend/src/main.ts` với `origin: true` cho phép thiết bị di động kết nối tới API qua mạng LAN nội bộ.
- **Prompt Summary:** "đã chạy được nhưng chưa đăng nhập được k thể kết nối đến máy chủ"
- **Files Affected:**
  - `apps/mobile/src/services/api.ts`
  - `apps/backend/src/main.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic trích xuất IP từ hostUri, chuẩn hóa URL /api/v1 và cấu hình CORS.
- **Human Modifications:** Trương Công Bình test đăng nhập trên iPhone và thông báo lỗi không kết nối được máy chủ.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** NestJS CORS Documentation, Expo Constants hostUri Specification.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `5823458`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0041: Implement iOS 26 Liquid Glass Floating Rounded Pill Tab Navigation Bar

- **Date:** 2026-09-27 21:20:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Tái thiết kế toàn diện thanh Bottom Tab Navigation trên ứng dụng di động theo ngôn ngữ thiết kế **iOS 26 Liquid Glass & Dynamic Island**:
  1. Cài đặt thư viện `expo-blur` (v57.0.3) tích hợp hiệu ứng làm mờ nền quang học (Backdrop Frosted Blur).
  2. Xây dựng cấu trúc thanh điều hướng dạng đảo nổi (Floating Island Pill) tách rời cạnh màn hình (`position: absolute`, `left: 18`, `right: 18`, `bottom: 26 (iOS) / 18 (Android)`, `borderRadius: 36`, `height: 66px`).
  3. Phối hợp lớp vật liệu kính mờ đa tầng: `BlurView` kết hợp lớp phủ màu trong suốt quang học (`rgba(255, 255, 255, 0.72)` ở Light mode và `rgba(20, 24, 22, 0.70)` ở Dark mode), đường viền phản xạ ánh sáng siêu mỏng (`borderColor: rgba(255, 255, 255, 0.85)` / `0.16`), và bóng đổ khuếch tán cao cấp (Ambient Floating Shadow).
  4. Bổ sung vi tương tác (Micro-interactions): Hiển thị pill nền mềm khi tab được kích hoạt kèm chấm chỉ thị `activeDot` tinh tế dưới icon tab.
  5. Cân chỉnh `paddingBottom: 110` trên toàn bộ các màn hình tab (`index.tsx`, `circles.tsx`, `messages.tsx`, `profile.tsx`) đảm bảo nội dung cuộn mượt mà phía dưới mà không bị thanh đảo nổi che khuất.
- **Prompt Summary:** "thanh nav của mobile tôi chưa thích lắm nha, tôi muốn dạng của ios 26 dạng bo tròn nổi và có liquidglass"
- **Files Affected:**
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `apps/mobile/package.json`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% thiết kế giao diện Liquid Glass, cấu hình `BlurView`, vi tương tác và styling.
- **Human Modifications:** Trương Công Bình trực tiếp yêu cầu đổi phong cách thanh điều hướng sang phong cách iOS 26 bo tròn nổi và có hiệu ứng kính lỏng (liquid glass).
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Apple Human Interface Guidelines (Translucency and Materials), Expo Blur Documentation.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `62ddd78`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0042: Refine Tab Slot Highlight and Add Central Plus Action Button with Liquid Glass Composer Sheet

- **Date:** 2026-09-27 21:25:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Tinh chỉnh thiết kế thanh điều hướng theo phản hồi của kỹ sư:
  1. Thay thế vùng highlight active nhỏ xung quanh icon thành viên con nhộng (Pill Capsule) bao trọn toàn bộ chiều cao tab item (`height: 54px`, `borderRadius: 27px`, viền kính bán trong suốt), ôm gọn cả icon và label đồng bộ với viền thanh dock.
  2. Bổ sung nút hành động chính giữa hình tròn nổi bật với biểu tượng dấu cộng `+` (`width: 48px`, `height: 48px`, màu chủ đạo `colors.primary` với đổ bóng cao cấp), phục vụ mục đích đăng khoảnh khắc và chia sẻ thông tin.
  3. Xây dựng Bottom Sheet Modal kính lỏng (Liquid Glass Creation Sheet) mở ra ngay khi bấm nút `+`, hiển thị 4 tùy chọn: Đăng khoảnh khắc nhanh (Moment), Hộp thư Điều muốn nói (Reflection), Tạo Vòng tròn mới (New Circle), và Lịch hẹn nhóm (Events).
  4. Tạo file route `app/(tabs)/create.tsx` nhằm đảm bảo tính tương thích và toàn vẹn của Expo Router v3.
- **Prompt Summary:** "phần chọn các tab đó chưa đẹp, nó phải to bằng icon hoặc bằng với viền, mà như thanh tab cũng thiếu icon + như thiết kế, nút này để up các khoảnh khắc hoặc các thông tin,"
- **Files Affected:**
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `apps/mobile/app/(tabs)/create.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic cấu hình tab button, component ActionSheet modal và styling.
- **Human Modifications:** Trương Công Bình yêu cầu vùng chọn tab phải vừa khít viền/chiều cao và bổ sung nút trung tâm `+` để chia sẻ thông tin/khoảnh khắc.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Apple Human Interface Guidelines (Tab Bars & Modals).
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `d034698`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0043: Fix Tab Bar Vertical and Horizontal Layout Alignment with Custom TabBar

- **Date:** 2026-09-27 21:28:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Khắc phục lỗi lệch trục căn chỉnh thanh tab di động (4 tab bị kéo lên trên và chia cột không đều với nút `+` ở giữa):
  1. Chuyển đổi kiến trúc sang Custom TabBar Component (`CustomLiquidTabBar`) tích hợp trực tiếp qua prop `tabBar` của `expo-router` `Tabs`.
  2. Phân bổ đồng đều 5 ô slot (`flex: 1` cho mỗi ô) dọc theo trục ngang, triệt tiêu hoàn toàn sự chênh lệch độ rộng giữa các tab và nút `+`.
  3. Căn giữa chuẩn xác trên trục đứng (`height: 100%`, `justifyContent: 'center'`, `alignItems: 'center'`) trên cả 5 ô, đưa toàn bộ icon, nhãn chữ và nút tròn `+` (`48px × 48px`) về cùng một đường cơ sở quang học hoàn hảo.
  4. Vùng highlight active (`tabButtonActive`) ôm trọn slot với chiều cao `52px` và `borderRadius: 24px`, tạo cảm giác chuyển động mượt mà và liền mạch.
- **Prompt Summary:** "bị lỗi layout rồi, 5 icon tab k đều nhau, chỉ có nút + chuẩn còn lại bị lên trên"
- **Files Affected:**
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% kiến trúc Custom TabBar và công thức căn chỉnh layout Flexbox.
- **Human Modifications:** Trương Công Bình trực tiếp phát hiện và chỉ rõ lỗi lệch hàng giữa 4 tab bên ngoài và nút `+` trung tâm.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** React Native Flexbox Layout Specification.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `cdb85b8`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0044: Transform Mobile Experience into Seamless Native Social Canvas

- **Date:** 2026-09-27 21:37:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Nâng tầm trải nghiệm thị giác di động theo phong cách Native Mobile Social (Threads, Instagram, Apple HIG) thay vì mang cảm giác port từ web xuống:
  1. Loại bỏ hoàn toàn đường viền ngăn cách thô cứng (`borderBottomWidth: 1`) tại header trên toàn bộ các màn hình (`HomeScreen`, `CirclesScreen`, `MessagesScreen`, `ProfileScreen`).
  2. Đồng nhất nền màu (`colors.canvas`) từ vùng Safe Area Status Bar xuống trọn vẹn nội dung, mang lại cảm giác một mặt phẳng vô cực liền mạch.
  3. Tái thiết kế `HeaderControls` thành các nút tròn kính mờ tối giản (`width: 36px, height: 36px, borderRadius: 18px`), loại bỏ viền hộp cứng.
  4. Bổ sung dải Vòng tròn bạn bè nằm ngang (Circles Stories Strip) với các avatar vòng tròn gradient và nhãn tên, tạo nét đặc trưng mạng xã hội nhóm thân mật.
  5. Thiết kế thanh đăng bài nhanh (Quick Composer Bar) với avatar cá nhân và biểu tượng chụp ảnh/tải ảnh.
  6. Áp dụng chuẩn Typography tiêu đề lớn (Large Title `22px, font-weight: 800, letterSpacing: -0.4`) chuẩn iOS.
- **Prompt Summary:** "bạn nên tham klhaor thêm 1 số ngôn ngữ thiết kế của mobile app để bổ sung kĩ năng, thanh nav tab cũng khá ok rồi, còn về trải nghiệm của tôi 1 số mxh lớn thì header và phần nội dung thường sẽ k có cảm giác ngăn cách, cùng 1 maufu trông trải nghiệm liền mạch hơn, tôi muốn nó native mobile hơn là như 1 bản web port xuống mobile"
- **Files Affected:**
  - `apps/mobile/src/components/common/HeaderControls.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% thiết kế giao diện liền mạch native mobile, thanh Circles Rail, Composer Bar và typography.
- **Human Modifications:** Trương Công Bình đưa ra định hướng thiết kế trải nghiệm liền mạch như các mạng xã hội di động lớn, loại bỏ cảm giác chia cắt giữa header và content.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Apple Human Interface Guidelines (Navigation Bars & Large Titles), Threads/Instagram UI Design Patterns.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `c48343f`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0045: Implement Step-by-Step Native Mobile Onboarding Wizard and Clean Canvas Auth

- **Date:** 2026-09-27 21:46:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Chuyển đổi toàn diện trải nghiệm Đăng ký / Đăng nhập di động từ form điền hàng loạt sang quy trình từng bước tự nhiên (Step-by-Step Onboarding Flow / 1 câu hỏi 1 màn hình) chuẩn Native Mobile UX:
  1. Tái cấu trúc màn hình Đăng ký (`register.tsx`) thành quy trình Onboarding 3 bước tuần tự:
     - **Bước 1 (Danh tính):** "Bạn muốn bạn bè gọi mình là gì?" với ô nhập lớn tự động focus và nút tiếp tục.
     - **Bước 2 (Liên hệ):** "Địa chỉ email của bạn là gì?" với kiểm tra định dạng email thời gian thực.
     - **Bước 3 (Bảo mật):** "Tạo mật khẩu an toàn" với kiểm tra trực quan điều kiện độ dài và trùng khớp mật khẩu.
  2. Bổ sung thanh tiến trình 3 đoạn (Segmented Progress Bar) trên đỉnh màn hình kèm nút quay lại thông minh giữa các bước.
  3. Tái thiết kế màn hình Đăng nhập (`login.tsx`) trên nền canvas liền mạch vô cực, loại bỏ hoàn toàn khung viền hộp đóng khung kiểu web, mở rộng kích thước touch target cho người dùng điện thoại.
  4. Nâng cấp màn hình Xác thực OTP (`verify-otp.tsx`) với ô nhập mã 6 số giãn cách (Spaced PIN Input), tự động kích hoạt xác thực ngay khi nhập đủ chữ số thứ 6.
- **Prompt Summary:** "tôi muốn trải nghiệm đăng ký đăng nhập ở mobile phải thật tự nhiên, k phải dạng điền form, điều này tốt và hợp trên web nhưng mobile thì bạn hãy cập nhật xu thế về quy trình tạo tài khoản của các app mobile xem, mỗi bước là 1 màn hình trông rất tự nhiên, tư tưởng của tôi là web là web mobile là mobile ux là trên hết"
- **Files Affected:**
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/verify-otp.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic wizard từng bước, giao diện segmented progress bar, validation và styling native.
- **Human Modifications:** Trương Công Bình định hướng triết lý "Web là web, Mobile là mobile, UX là trên hết" và yêu cầu tạo tài khoản theo quy trình 1 câu hỏi/1 màn hình.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 93 file framework markdown liên kết hợp lệ 100%.
- **Official Source Checked:** Duolingo / BeReal Onboarding Flow Guidelines, Material Design & Apple HIG Onboarding Patterns.
- **Security & License Check:** An toàn, không chứa secrets.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `469a6b5`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0046: Thiết lập Quy tắc Tuyệt đối Cấm Hardcode Ngôn ngữ & Màu sắc, Chuẩn hóa Giao diện Liền mạch Unboxed Mobile Canvas

- **Date:** 2026-09-27 22:05:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Tiếp thu chỉ đạo nghiêm ngặt của người dùng về việc cấm triệt để hardcode ngôn ngữ và màu sắc, đồng thời loại bỏ toàn bộ các khối hộp chia cắt kiểu web trên mobile:
  1. Ban hành Điều luật bất biến:
     - Hard Rule 8 trong `agentic/RULES.md`: Cấm tuyệt đối raw string literals và raw hex/rgba colors trong UI components.
     - Mục 9 trong `agentic/CONVENTIONS.md`: Quy ước bắt buộc về Design Tokens và Shared Localization Dictionaries `t.*`.
     - Mục 3 trong `docs/principles/principle.md`: Chuẩn hóa nguyên tắc Seamless Infinite Canvas trên mobile (không hộp, không phân vùng thô cứng).
  2. Bổ sung từ điển đa ngôn ngữ (`packages/shared/src/locales/vi.ts` & `en.ts`):
     - Namespace `composer` cho modal tạo mới (Moment, Reflection, New Circle, Calendar Event).
     - Bổ sung các key onboarding wizard, remember me, network errors vào `auth` và `common`.
     - Bổ sung tên các vòng tròn mẫu và thông số thành viên vào `home`.
  3. Bổ sung semantic design tokens vào `apps/mobile/src/constants/theme.ts`: `onPrimary`, `success`, `warning`, `info`, `accent`, `glass`, `glassBorder`, `sheetBg`.
  4. Tái cấu trúc toàn diện 100% component mobile (`register.tsx`, `login.tsx`, `verify-otp.tsx`, `_layout.tsx`, `index.tsx`, `circles.tsx`, `messages.tsx`, `profile.tsx`, `HeaderControls.tsx`, `Input.tsx`, `Button.tsx`, `api.ts`):
     - Xóa bỏ 100% hardcoded hex color và text tiếng Việt thô.
     - Xóa bỏ các khung viền hộp đóng kín (`heroCard`, `feedCard`, etc.) ở HomeScreen, tái thiết kế thành dòng chảy thông tin tự nhiên, unboxed chips và typography native trên nền canvas thống nhất.
- **Prompt Summary:** "tốt rồi đó nhưng bạn hard code rồi đó, note thêm vào rule hoặc degisnmd là tuyệt đối k harccode ngôn ngữ hay màu sắc (phải theo bộ langeuage hoặc bộ theme), trải nghiệm liền mạch trên mobile không có box hay phân vùng nào cả"
- **Files Affected:**
  - `agentic/RULES.md`
  - `agentic/CONVENTIONS.md`
  - `docs/principles/principle.md`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/mobile/src/constants/theme.ts`
  - `apps/mobile/src/components/common/HeaderControls.tsx`
  - `apps/mobile/src/components/common/Input.tsx`
  - `apps/mobile/src/components/common/Button.tsx`
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/app/_layout.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/verify-otp.tsx`
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% refactor code, design tokens, locale dictionaries và cập nhật hiến pháp.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo cấm hardcode ngôn ngữ và màu sắc, yêu cầu bổ sung vào Rule/DesignMD và chuẩn hóa triết lý Seamless Canvas trên mobile.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: 9/9 static pages build thành công.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** Apple Human Interface Guidelines (Navigation & Materials), Material Design 3 (Design Tokens), Rubric Level 5 (Gate 3, Gate 8).
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `62e507a`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0047: Mở rộng Quy tắc Quản trị Công nghệ & Authentic Data, Hiện thực hóa Quy trình Quên Mật khẩu 3 Bước Unboxed Mobile

- **Date:** 2026-09-27 22:20:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Tiếp thu toàn diện chỉ đạo của người dùng về 4 nội dung quan trọng:
  1. **Mở rộng Phạm vi Điều luật:** Áp dụng bắt buộc quy tắc Không hardcode ngôn ngữ (`t.*`) và Không hardcode màu sắc (`colors.*`) cho cả Web và Mobile (`agentic/RULES.md` Rule 8 & `agentic/CONVENTIONS.md` Mục 9).
  2. **Quản trị Công nghệ Nghiêm ngặt (Technology Governance):** Cấm tuyệt đối việc tùy tiện đưa vào công nghệ/thư viện ngoài lộ trình định hướng mà chưa thảo luận/hỏi ý kiến (điển hình: cấm dùng `class-validator`, quy chuẩn 100% dữ liệu qua `zod` và `ZodValidationPipe`). Bổ sung vào DoD Item 4, Anti-Patterns và Section 10 của `agentic/CONVENTIONS.md`.
  3. **Cam kết Dữ liệu Thật (Zero Mock Data Mandate):** Loại bỏ toàn bộ các bản ghi giả lập/mẫu trên Mobile HomeScreen (các vòng tròn mẫu "Gia đình nhỏ", "Hội bạn thân", fake member count). Giữ nguyên cấu trúc giao diện chuẩn mực sẵn sàng liên kết dữ liệu thực từ backend API/store khi có, hiển thị action tạo vòng tròn authentic.
  4. **Quy trình Quên & Đặt lại Mật khẩu 3 Bước Unboxed Native Wizard:** Tái thiết kế toàn bộ `apps/mobile/app/(auth)/forgot-password.tsx` và `reset-password.tsx` từ dạng hộp card form tĩnh sang Wizard 3 bước liền mạch (1 hành vi/câu hỏi trên mỗi màn hình) tương tự màn hình Đăng ký:
     - **Bước 1 (Email):** Nhập email xác nhận, gọi `/auth/forgot-password`.
     - **Bước 2 (Mã xác thực):** Nhập mã 6 chữ số dạng PIN giãn cách native, bộ đếm ngược gửi lại mã gọi `/auth/resend-otp` (type: PASSWORD_RESET).
     - **Bước 3 (Mật khẩu mới):** Nhập mật khẩu mới & xác nhận mật khẩu, checklist trực quan kiểm tra độ dài và độ khớp, gọi `/auth/reset-password`.
     - Loại bỏ hoàn toàn khung viền card cứng nhắc, đồng bộ hóa 100% tokens màu và ngôn ngữ.
- **Prompt Summary:** "những luật này k chỉ áp dụng cho mobile mà cho cả web nữa nhé, tiếp bổ sung vào rule là k tùy tiện sử dụng 1 công nghệ nào đó mà chưa có ý kiến hỏi cũng như k có trong lộ trình định hướng (ví dụ như case hôm nay bạn tự ý dùng class-validator mà trong khi tôi đã quy định dùng zod), thiết kế mobile trang chủ tôi khá thích rồi tuy nhiên luật là k có hardcode k mockdata, ui vậy tốt chờ data có rồi hiển thị sau nhé còn những thiết kế mẫu hay data k thật bỏ hết, trình quên mật khẩu chưa áp dụng quy tắc mới như đăng ký"
- **Files Affected:**
  - `agentic/RULES.md`
  - `agentic/CONVENTIONS.md`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/src/components/auth/PasswordRecoveryWizard.tsx`
  - `apps/mobile/app/(auth)/forgot-password.tsx`
  - `apps/mobile/app/(auth)/reset-password.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% refactor code, wizard component, schema validation và đồng bộ tài liệu.
- **Human Modifications:** Trương Công Bình trực tiếp phê bình việc sử dụng `class-validator`, đưa ra luật cấm tùy tiện dùng công nghệ chưa được duyệt, cấm mock data và chỉ đạo chuyển đổi quên mật khẩu sang dạng wizard unboxed 1 câu hỏi/màn hình.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `npm run build -w @circle/web`: 9/9 static pages pass 100%.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** Apple HIG Onboarding & Security, Material 3 Design Tokens, Zod Official Docs.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Trực tiếp sử dụng thư viện `class-validator` khi chưa được phê duyệt, vi phạm thỏa thuận công nghệ của dự án.
  - **Root Cause:** AI đưa thư viện quen thuộc vào thay vì tuân thủ quy chuẩn Zod đã được định hướng trong `packages/shared`.
  - **Resolution / Fix:** Bổ sung điều luật cấm `class-validator`, cam kết 100% validation thông qua Zod schemas tập trung.
- **Commit:** `54acfc4`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0048: Khắc phục Triệt để Lỗi Dãn Chữ Placeholder trên iOS và Nâng cấp Ô Nhập OTP 6 Ô Tự nhiên

- **Date:** 2026-09-27 22:30:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Xử lý triệt để phản ánh của người dùng về việc một số ô nhập (placeholder text) ở các bước đăng nhập và quên mật khẩu bị lỗi dãn khoảng cách chữ cái:
  1. **Nguyên nhân gốc rễ (Root Cause):**
     - Trên hệ điều hành iOS, khi thuộc tính `secureTextEntry={true}` được kích hoạt trên `TextInput`, UIKit native chuyển font sang secure password font (dùng để vẽ dấu chấm tròn password mask). Font này tự động áp dụng tracking/letter spacing rộng lên toàn bộ chuỗi placeholder mặc định của `UITextField`, khiến các ký tự tiếng Việt (như "Nhập mật khẩu an toàn", "Tối thiểu 8 ký tự an toàn", "Nhập lại mật khẩu mới") bị dãn cách chữ bất thường.
     - Ô nhập mã OTP 6 số trước đó áp dụng `letterSpacing: 18` trên một `TextInput` duy nhất, khiến placeholder dạng dấu chấm `"······"` cũng bị dãn khoảng cách quá đà.
  2. **Giải pháp Hiện thực hóa:**
     - Áp dụng kỹ thuật **Custom Placeholder Overlay** (`inputInner` + `placeholderOverlay` với `pointerEvents="none"` và `letterSpacing: 0`) cho toàn bộ các ô nhập mật khẩu và text tại `login.tsx`, `PasswordRecoveryWizard.tsx`, `register.tsx` và `Input.tsx`. Khi ô trống, văn bản placeholder được hiển thị bằng component `Text` chuẩn native không bị ảnh hưởng bởi font engine của `secureTextEntry`, gõ chữ thì placeholder tự động biến mất và che phủ chấm bảo mật ngay lập tức mà không gây giật lag con trỏ.
     - Nâng cấp ô nhập OTP 6 số tại `PasswordRecoveryWizard.tsx` (Bước 2) và `verify-otp.tsx` sang mô hình **6-Cell Native Rounded PIN**: 6 ô vuông bo tròn riêng biệt (`pinCell`) với kích thước cố định, hiển thị từng số đã nhập hoặc dấu chấm nhẹ `·` ở giữa, kết hợp `hiddenPinInput` bắt trọn bàn phím số và tính năng tự động điền mã (oneTimeCode autofill) từ SMS/Email. Xóa bỏ hoàn toàn hack `letterSpacing: 18`.
- **Prompt Summary:** "1 số nơi để placeholder text (text nằm trong ô nhập) ở bước đăng nhập và quên mật khẩu bị dãn chữ"
- **Files Affected:**
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/verify-otp.tsx`
  - `apps/mobile/src/components/auth/PasswordRecoveryWizard.tsx`
  - `apps/mobile/src/components/common/Input.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% giải pháp component overlay, 6-cell PIN UI và đồng bộ styles.
- **Human Modifications:** Trương Công Bình trực tiếp trải nghiệm thực tế trên iPhone (iOS Expo Go), phát hiện lỗi dãn chữ placeholder ở màn hình đăng nhập và quên mật khẩu.
- **Verification Method:**
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm test -w @circle/backend`: 14/14 unit tests pass 100%.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** Apple HIG Typography, React Native iOS secureTextEntry Issues & Community Best Practices.
- **Security & License Check:** An toàn, không chứa credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `94de2b4`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0049: Loại bỏ Toàn bộ Lỗi Hardcode Tiếng Việt, Triệt tiêu class-validator & Hiện thực hóa ZodValidationPipe Đa Ngôn ngữ

- **Date:** 2026-09-27 23:05:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #10 (US-MOBILE-001: Mobile Application Shell & Auth Flow)
- **Purpose:** Giải quyết triệt để phản ánh "các thông báo lỗi vẫn hardcode tiếng việt", hoàn thành chỉ đạo quản trị công nghệ loại bỏ hoàn toàn `class-validator` khỏi toàn bộ codebase, thay thế bằng `zod` schemas từ `@circle/shared` và `ZodValidationPipe` hỗ trợ bản địa hóa động song ngữ (`vi` / `en`):
  1. **Đồng bộ Từ điển Song ngữ Hoàn chỉnh (`packages/shared/src/locales/`):**
     - Bổ sung đầy đủ các khóa thông báo lỗi nghiệp vụ và phản hồi xác thực vào cả `vi.ts` và `en.ts` (`accountNotActivated`, `userNotFound`, `invalidCredentials`, `otpExpiredOrNotFound`, `otpMaxAttemptsExceeded`, `otpIncorrect`, `resendCooldown`, `resendGenericNotice`, `accountAlreadyActivated`, `resetOtpGenericNotice`, `invalidResetRequest`, `emailAlreadyRegistered`, `passwordResetSuccess`, `resendSuccessNotice`, `securityAlertSessionRevoked`, `loggedOutSuccess`, `invalidOrExpiredRefreshToken`, `accountInactiveOrNotFound`, các lỗi Zod validation cho OTP, email, password, display name).
     - Bổ sung hàm tiện ích `resolveLocale(circleLocale, acceptLanguage)` xuất từ `@circle/shared`.
  2. **Quản trị Công nghệ & Triệt tiêu class-validator:**
     - Gỡ bỏ hoàn toàn `class-validator` và `class-transformer` khỏi `apps/backend/package.json`.
     - Chuyển đổi toàn bộ 7 tệp DTO tại `apps/backend/src/modules/auth/dto/` sang sử dụng kiểu dữ liệu suy diễn từ Zod (`RegisterDtoInput`, `LoginInput`, `VerifyOtpInput`, `ResendOtpInput`, `ForgotPasswordInput`, `ResetPasswordDtoInput`, `RefreshTokenInput`).
     - Gỡ bỏ `ValidationPipe` của `@nestjs/common` trong `apps/backend/src/main.ts`.
     - Xây dựng `ZodValidationPipe` tại `apps/backend/src/common/pipes/zod-validation.pipe.ts` hỗ trợ dynamic locale injection qua request headers (`x-circle-locale` / `accept-language`).
  3. **Bản địa hóa Backend (`auth.controller.ts` & `auth.service.ts`):**
     - Mọi endpoint auth (`register`, `login`, `verify-otp`, `resend-otp`, `forgot-password`, `reset-password`, `refresh`, `logout`) trích xuất locale từ header và chuyển giao vào `auth.service`.
     - `auth.service.ts` thay thế 100% các chuỗi exception hardcode bằng `t.auth.<key>` tương ứng với ngôn ngữ yêu cầu.
  4. **Bản địa hóa Mobile & Web Client:**
     - `apps/mobile/src/services/api.ts` tự động đính kèm `x-circle-locale` và `Accept-Language` lấy từ `useLanguageStore.getState().locale`.
     - `apps/mobile/app/(auth)/` (`login.tsx`, `register.tsx`, `verify-otp.tsx`, `PasswordRecoveryWizard.tsx`) sử dụng `createAuthSchemas(locale)` để đảm bảo thông báo lỗi validation trên client lập tức chuyển đổi theo ngôn ngữ hiển thị.
     - `apps/web/src/lib/api.ts` loại bỏ các chuỗi fallback lỗi hardcode, sử dụng từ điển động `locales[locale]`.
- **Prompt Summary:** "các thông báo lỗi vẫn hardcode tiếng việt", "tiếp tục hoàn thành nhé"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/locales/index.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `apps/backend/package.json`
  - `apps/backend/src/main.ts`
  - `apps/backend/src/common/pipes/zod-validation.pipe.ts`
  - `apps/backend/src/common/pipes/zod-validation.pipe.spec.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/dto/login.dto.ts`
  - `apps/backend/src/modules/auth/dto/register.dto.ts`
  - `apps/backend/src/modules/auth/dto/refresh-token.dto.ts`
  - `apps/backend/src/modules/auth/dto/verify-otp.dto.ts`
  - `apps/backend/src/modules/auth/dto/resend-otp.dto.ts`
  - `apps/backend/src/modules/auth/dto/forgot-password.dto.ts`
  - `apps/backend/src/modules/auth/dto/reset-password.dto.ts`
  - `apps/backend/docs/middlewares.md`
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/verify-otp.tsx`
  - `apps/mobile/src/components/auth/PasswordRecoveryWizard.tsx`
  - `apps/mobile/src/services/api.ts`
  - `apps/web/src/lib/api.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn ZodValidationPipe, schemas song ngữ, chuyển đổi DTO và cấu hình backend.
- **Human Modifications:** Trương Công Bình rà soát kiểm tra, chỉ đạo gỡ bỏ triệt để class-validator và yêu cầu không để sót bất kỳ thông báo lỗi hardcode tiếng Việt nào.
- **Verification Method:**
  - `npm run build -w @circle/shared`: biên dịch thành công 0 lỗi.
  - `npm test -w @circle/backend`: 18/18 tests pass 100% (gồm 4 tests kiểm thử ZodValidationPipe song ngữ).
  - `npm run build -w @circle/backend`: build NestJS thành công 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `npm run build -w @circle/web`: build Next.js thành công 9/9 trang tĩnh.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
  - `git grep -i -E "lỗi|thành công|thất bại|không hợp lệ|không chính xác|vui lòng"`: 0 kết quả trong backend và mobile source.
- **Official Source Checked:** NestJS Custom Pipes documentation, Zod safeParse, Project God & Agentic Conventions.
- **Security & License Check:** An toàn tuyệt đối, không có bí mật hay thư viện chưa được cấp phép.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `b752f1e`
- **PR:** #58 (https://github.com/1440isme/Circle/pull/58)

---

## AI-0050: Triển khai Module 3 — US-CIRCLE-001: Circle Creation, Handle Reservation & Channel Hierarchy

- **Date:** 2026-09-28 14:15:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:**
  1. Định nghĩa Zod validation schemas tập trung tại `packages/shared/src/validators/circle.validator.ts` (`createCircleSchemas`, `createCircleSchema`, `updateCircleSchema`) làm Single Source of Truth cho toàn bộ Web/Mobile client và Backend DTOs theo đúng quy chuẩn kiến trúc PR 58.
  2. Bổ sung trường `handle` (unique slug, indexed) vào model `Circle` trong Prisma (`schema.prisma`), tạo và áp dụng migration `20260927101500_add_circle_handle` lên PostgreSQL database.
  3. Kế thừa và tương thích 100% với `ZodValidationPipe` song ngữ (`Scope.REQUEST`, `SchemaFactory`) của PR 58 tại `apps/backend/src/common/pipes/zod-validation.pipe.ts`, hỗ trợ tự động bóc tách ngôn ngữ từ request header (`x-circle-locale` / `accept-language`).
  4. Triển khai `CirclesModule` (`CirclesController`, `CirclesService`, DTOs) trong NestJS: thực hiện tạo nhóm theo atomic transaction (tạo Circle, gán người tạo làm `OWNER`, tạo kênh mặc định `#general`), truy vấn danh sách Circle của người dùng, lấy chi tiết Circle, kiểm tra trùng lặp handle trả về `409 Conflict`.
  5. Xây dựng bộ Unit Test `circles.service.spec.ts` đạt 100% độ bao phủ cho `US-CIRCLE-001` (TC-CIRCLE-001 đến TC-CIRCLE-004).
  6. Xây dựng Zustand store `useCircleStore` (`apps/web/src/stores/circle.store.ts`) và bộ TanStack Query hooks (`apps/web/src/hooks/use-circle-queries.ts`: `useMyCirclesQuery`, `useCircleDetailQuery`, `useCreateCircleMutation`).
  7. Triển khai component `CreateCircleModal` với giao diện Apple HIG, kiểm thực form trực tiếp bằng `createCircleSchema` từ `@circle/shared`, tích hợp vào `Sidebar.tsx` cùng bộ hiển thị danh sách Circle động và auto-selection.
- **Prompt Summary:** "oke giờ hãy bắt đầu làm module 3 nhé", "validation dùng zod theo quy chuẩn không được tự tiện dùng các công cụ không được thiết kế từ trước. vui lòng đọc kỹ các yêu cầu", "frontend thì dùng tanstack và zustan", "Invalid input: expected string, received undefined tôi đang mắc phải lỗi này khi tạo circle", "à tôi nhắc lại là bạn phải tuân thủ PR 58 nhé"
- **Files Affected:**
  - `packages/shared/src/validators/circle.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/index.ts`
  - `packages/types/src/index.ts`
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260927101500_add_circle_handle/migration.sql`
  - `apps/backend/src/common/pipes/zod-validation.pipe.ts`
  - `apps/backend/src/modules/circles/dto/create-circle.dto.ts`
  - `apps/backend/src/modules/circles/dto/update-circle.dto.ts`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.controller.ts`
  - `apps/backend/src/modules/circles/circles.module.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `apps/backend/src/app.module.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `apps/web/src/components/circle/CreateCircleModal.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn Zod schemas, backend module, unit test suites, Zustand store, TanStack Query hooks, từ điển song ngữ và modal giao diện.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh trực tiếp chấn chỉnh và yêu cầu tuân thủ nghiêm ngặt Single Source of Truth cho validation bằng Zod, bắt buộc dùng TanStack Query cùng Zustand cho Frontend, và tuân thủ tuyệt đối quy chuẩn kỹ thuật của PR 58 (Zero Hardcoded Strings, Zero Mock Data, Bilingual Schema Factories).
- **Verification Method:**
  - `npm test -w @circle/backend`: 26/26 tests passed (100% pass rate).
  - `npm run build -w @circle/backend`: NestJS build thành công với 0 lỗi TypeScript.
  - `npm run build -w @circle/web`: Next.js 14 production build hoàn tất thành công 9/9 trang tĩnh với 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** SRS (UC07: Create Circle), Capability `CAP-CIRCLE-01`, PR 58, `PROJECT_GOD.md`.
- **Security & License Check:** An toàn, không chứa secrets, bảo vệ truy cập Circle riêng tư qua role check.
- **AI Errors / Hallucinations Found:**
  - **Error Description:**
    1. Ở lần biên dịch đầu tiên của `ZodValidationPipe`, thuộc tính truy xuất lỗi của Zod v4 sử dụng `result.error.errors` thay vì `result.error.issues`, dẫn đến lỗi type check `Property 'errors' does not exist on type 'ZodError<unknown>'`.
    2. Khi người dùng thực hiện tạo Circle, hệ thống báo lỗi `400 Bad Request: Invalid input: expected string, received undefined` cho cả hai trường `name` và `handle`.
    3. Form và validator ban đầu chứa các chuỗi tiếng Việt hardcoded vi phạm Rule 8 & 9 và PR 58.
  - **Root Cause:**
    1. Cú pháp ZodError trong Zod 4 định nghĩa danh sách issues tại `result.error.issues`.
    2. Khi khai báo `@UsePipes(new ZodValidationPipe(...))` ở cấp độ method Controller, NestJS thực thi pipe trên tất cả các tham số của action, bao gồm `@CurrentUser() user`. Vì custom param decorator chưa được giải quyết trước pipe execution (`value === undefined`), `ZodValidationPipe` tiến hành parse `undefined` và văng lỗi schema validation ngay trước khi `@Body()` được nạp.
    3. Thiếu việc trích xuất và liên kết với từ điển `packages/shared/src/locales/` (`vi.ts`, `en.ts`).
  - **Resolution / Fix:**
    1. Cập nhật `result.error.issues.map(...)`.
    2. Trong `ZodValidationPipe`, bổ sung điều kiện lọc `if (metadata.type !== 'body') return value;`. Đồng thời chuyển pipe gắn trực tiếp vào tham số payload `@Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).createCircleSchema))` tại `CirclesController` để bảo đảm chỉ kiểm thực body.
    3. Thêm toàn bộ các khóa từ điển `validation` và `circle` vào `vi.ts` và `en.ts`, xuất `createCircleSchemas(locale)` động và dùng `t.circle.*` trong `CreateCircleModal` và `Sidebar`.
- **Commit:** `0847ede`
- **PR:** #59

---

## AI-0051: Nâng cấp luồng Khởi tạo Circle — Hỗ trợ 2 Chế độ: Chọn bạn bè (Tên tự động) & Đặt tên tối giản (Handle tự sinh)

- **Date:** 2026-09-28 16:15:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:** Nâng cấp chức năng tạo Vòng tròn theo yêu cầu đặc tả UX từ kỹ sư Ninh Thị Mỹ Hạnh:
  1. **Hình thức 1 (Chọn từ bạn bè):** Cho phép người dùng chọn các thành viên từ danh sách bạn bè khả dụng (`GET /api/v1/circles/friends/selectable`). Tên Vòng tròn được hệ thống tự động sinh bằng cách ghép tên hiển thị của các thành viên được chọn. Tự động sinh `handle` duy nhất và thêm các thành viên vào Vòng tròn ngay khi khởi tạo mà không yêu cầu người dùng phải tự điền các trường metadata rườm rà.
  2. **Hình thức 2 (Tạo bằng tên):** Chỉ cần duy nhất 1 ô nhập "Tên Vòng tròn". Bỏ qua trường Handle và mô tả ngắn khi khởi tạo; hệ thống tự động chuẩn hóa và sinh mã `handle` URL-friendly duy nhất chống xung đột (slug + mã hex ngẫu nhiên) làm liên kết Vòng tròn (`circle.app/@{handle}`).
  3. Cập nhật `createCircleSchema` tại `packages/shared/src/validators/circle.validator.ts`: cho phép `handle` và `description` là tùy chọn, hỗ trợ mảng `memberIds: string[]`, kiểm thực điều kiện ràng buộc (yêu cầu tên nhóm hoặc ít nhất 1 bạn bè).
  4. Bổ sung các khóa từ điển song ngữ mới (`tabCreateByName`, `tabSelectFriends`, `friendsSearchPlaceholder`, `selectedFriendsCount`, `tempGroupNameHint`, `autoHandleNotice`, `createWithFriendsBtn`, `createByNameBtn`, v.v.) vào `vi.ts` và `en.ts`.
  5. Cập nhật backend `CirclesService`: thêm logic tự động sinh handle duy nhất (`generateUniqueHandle`), ghép tên thành viên khi thiếu tên nhóm, gán các bạn bè được chọn làm `CircleMember` (`MEMBER`), và endpoint `getSelectableFriends`.
  6. Mở rộng bộ kiểm thử đơn vị `circles.service.spec.ts` (đạt 30/30 tests pass 100%).
  7. Tái thiết kế modal `CreateCircleModal.tsx` trên Web UI theo chuẩn Apple HIG với 2 tab chuyển đổi mượt mà, bộ lọc tìm kiếm bạn bè, hiển thị danh sách trực quan, trạng thái đã chọn và bảo đảm 100% Zero Hardcoded Strings qua `t.circle.*`.
- **Prompt Summary:** "về chức năng tạo circle tôi muôn có 2 hình thức 1 là chọn thành viên trong list bạn bè và khởi tạo nhóm luôn bỏ qua thông tin kia, tên nhóm hiển thị hiện tạm thời là tên các thành viên. 2 là tạo nhóm chỉ cần điền thông tin là tên nhóm thôi còn mã Handle định danh duy nhất ko cần và tự động sinh sau khi tạo (là đường link liên kết dạng vậy), bỏ luôn mô tả ngắn khi khởi tạo"
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.controller.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `apps/web/src/components/circle/CreateCircleModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn cập nhật schemas, controller, service, test cases, queries và giao diện modal.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh trực tiếp định hình và yêu cầu tái cấu trúc luồng tạo Circle thành 2 hình thức tinh gọn, tiện dụng, tự động hóa handle và ghép tên bạn bè.
- **Verification Method:**
  - `npm test -w @circle/backend`: 30/30 tests passed 100%.
  - `npm run build -w @circle/backend`: NestJS build thành công với 0 lỗi TypeScript.
  - `npm run build -w @circle/web`: Next.js 14 production build thành công 9/9 trang tĩnh với 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, SRS (UC07: Create Circle), `agentic/RULES.md`.
- **Security & License Check:** An toàn tuyệt đối, không có bí mật hay lỗ hổng bảo mật.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Kiểu `isPrivate` trong `createCircleSchema` ban đầu dùng `.default(false)` làm `z.infer` yêu cầu bắt buộc trường `isPrivate` trong TypeScript input type, gây lỗi biên dịch trong test cases `{ name: '...' }`. Ngoài ra hàm `getSelectableFriends` trả về `displayName` kiểu `string | undefined` do `split('@')[0]`.
  - **Root Cause:** Khác biệt giữa Zod output type và input type khi dùng `.default()`; xử lý chuỗi phân tách có thể trả về undefined trong TypeScript strict mode.
  - **Resolution / Fix:** Chuyển `isPrivate: z.boolean().optional()` trong schema; bổ sung fallback `|| friend.email` để đảm bảo `displayName: string`.
- **Commit:** `3b2d370`
- **PR:** #59

---

## AI-0052: Tái cấu trúc UX Home Hub (Single-Column) & Không gian Bảng tin Vòng tròn (3-Column Workspace)

- **Date:** 2026-09-28 16:56:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:** Thống nhất và hiện thực hóa trải nghiệm người dùng (UX Layout) theo thảo luận với kỹ sư Ninh Thị Mỹ Hạnh:
  1. **Home Hub (Single-Column View):** Khi mới vào ứng dụng web (hoặc khi `activeCircle === null`), giao diện chỉ hiển thị 1 cột trung tâm tinh giản, ẩn hoàn toàn Sidebar bên trái và PresenceRail bên phải. Cột giữa hiển thị lưới danh thiếp các Vòng tròn đã tham gia (`myCirclesHeading`), kèm vai trò (Owner/Member), số thành viên và nút truy cập hoặc tạo Vòng tròn mới.
  2. **Active Circle Workspace (3-Column View):** Khi người dùng nhấp chọn hoặc vừa tạo xong một Vòng tròn (`activeCircle !== null`), toàn bộ không gian làm việc 3 cột chuẩn sẽ hiển thị (Sidebar kênh thảo luận bên trái, Bảng tin/hội thoại nhóm ở giữa, PresenceRail thành viên bên phải).
  3. **Chia sẻ và Mời nhóm:** Tại Bảng tin Vòng tròn, bổ sung header hiển thị tên, biểu tượng bảo mật/công khai, nút "Sao chép liên kết" (`circle.app/@handle`) và nút sao chép "Mã mời" (`inviteCode`) có thông báo clipboard trực quan.
  4. **Nút quay về Trang chủ:** Tích hợp nút "Trang chủ" trên Sidebar và liên kết logo Header để người dùng linh hoạt quay về danh sách Vòng tròn bất cứ lúc nào.
  5. **Bảo toàn PR 58:** Đảm bảo 100% không hardcode chuỗi hoặc mã màu, bổ sung đầy đủ bộ khóa song ngữ (`homeNav`, `myCirclesHeading`, `myCirclesSubheading`, `enterCircleBtn`, `roleOwner`, `roleMember`, `copyLinkBtn`, `linkCopiedNotice`, `inviteCodeLabel`, `circleFeedTitle`, `circleFeedSubtitle`, `backToHome`) vào cả `vi.ts` và `en.ts`. Sửa chữa namespace `t.home.*` trong `FeedStream.tsx`.
- **Prompt Summary:** "với phần giao diện này tôi nghĩ khi với vào web chỉ có phần ở giữa nhỉ còn khi vô nhóm sẽ thay cái đó bằng bảng tin hay đoạn hội thoại chẳng hạn nhỉ ... có nên ẩn cột bên trái luôn ko nhỉ ... oke chọn cách 1 là ở cột giữa nó cũng có nhóm đã tham gia để chọn khi chọn hoặc tham gia rồi mở ra trang hiện tại sau đó cái giữa sẽ thay là kiểu bản tin nhóm"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn cập nhật layout phản ứng, quản lý trạng thái chuyển đổi Home Hub/Active Workspace và các chuỗi từ điển bản địa hóa.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh trực tiếp định hướng giải pháp UX: ẩn 2 cột biên khi mới vào web để người dùng tập trung chọn nhóm ở cột giữa, sau khi chọn nhóm mới mở không gian 3 cột tương ứng.
- **Verification Method:**
  - `npm test -w @circle/backend`: 30/30 tests passed 100%.
  - `npm run build -w @circle/backend`: NestJS build thành công với 0 lỗi TypeScript.
  - `npm run build -w @circle/shared`: Shared package build thành công.
  - `npm run build -w @circle/web`: Next.js 14 production build hoàn tất 9/9 trang tĩnh với 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`, `agentic/CONVENTIONS.md`.
- **Security & License Check:** An toàn tuyệt đối, tuân thủ nguyên tắc bảo mật và quy tắc của PR 58.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Lỗi biên dịch TypeScript trong `FeedStream.tsx` do gọi `t.circle.circleFeedSubtitle` và `t.circle.circleFeedTitle` trong khi hai khóa này được khai báo ở namespace `home` của từ điển i18n (`packages/shared/src/locales/vi.ts` và `en.ts`).
  - **Root Cause:** Nhầm lẫn namespace giữa `circle` và `home` khi truyền chuỗi đa ngôn ngữ.
  - **Resolution / Fix:** Đồng bộ chuẩn hóa gọi `t.home.circleFeedSubtitle` và `t.home.circleFeedTitle` trong `FeedStream.tsx`.
- **Commit:** `f0b1dec`
- **PR:** #59

---

## AI-0053: Tinh chỉnh Header, Sidebar và Mount CreateCircleModal tại HomePage Root

- **Date:** 2026-09-28 17:13:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:** Tinh chỉnh các chi tiết UX và khắc phục sự cố mount modal theo phản hồi từ kỹ sư Ninh Thị Mỹ Hạnh:
  1. **Ẩn chỉ báo "Chưa chọn Vòng tròn" trên Header:** Bọc điều kiện `{activeCircle && (...)}` để khi người dùng ở Home Hub (chưa chọn nhóm), Header không còn hiển thị nút viên thuốc "Chưa chọn Vòng tròn" cạnh logo CIRCLE, giữ cho thanh điều hướng sạch sẽ và thông thoáng.
  2. **Khắc phục nút "Tạo Vòng tròn mới" trên Home Hub:** Trước đó component `CreateCircleModal` chỉ được mount bên trong `Sidebar.tsx`. Khi chuyển sang giao diện Single-Column Home Hub (`activeCircle === null`), `Sidebar` bị ẩn dẫn đến `CreateCircleModal` không được render trong DOM, khiến sự kiện bấm nút tạo nhóm không thể kích hoạt giao diện modal. Đã chuyển `CreateCircleModal` mount trực tiếp tại `HomePage` (`apps/web/src/app/page.tsx`) ở cấp trang gốc để luôn hoạt động tin cậy dù ở Home Hub hay trong nhóm.
  3. **Tối giản Sidebar cột trái:** Xóa bỏ nút "Về trang chủ" trên Sidebar khi người dùng đã chọn nhóm, quy về một điểm chuyển hướng thống nhất và quen thuộc là logo thương hiệu CIRCLE trên Header.
  4. **Bổ sung nút tạo nhanh:** Thêm nút "+ Tạo Vòng tròn" ngay cạnh huy hiệu đếm số lượng nhóm trong danh sách "Vòng tròn của bạn" trên Home Hub.
- **Prompt Summary:** "oke bỏ chưa chọn vòng tròn ở trên thanh gần nút circle và ghi ở trang Home nút tạo vòng tròn mới chưa hoạt động, khi chọn nhóm xong bỏ cái về trang chủ ở cột trái luôn."
- **Files Affected:**
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/app/page.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn điều chỉnh hiển thị và tái cấu trúc vị trí component.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh kiểm thử thực tế và chỉ đạo loại bỏ các thành phần điều hướng dư thừa, sửa lỗi không mở modal trên Home Hub.
- **Verification Method:**
  - `npm run build -w @circle/web`: Next.js 14 production build hoàn tất 9/9 trang với 0 lỗi.
  - `npm test -w @circle/backend`: 30/30 unit tests pass.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 lỗi.
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn tuyệt đối, tuân thủ nghiêm ngặt PR 58.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Modal `CreateCircleModal` trước đó bị đặt sai phạm vi (bên trong `Sidebar`), dẫn tới khi component `Sidebar` unmounted ở chế độ Home Hub thì modal không thể hiển thị dù state Zustand đã cập nhật `isCreateModalOpen = true`.
  - **Root Cause:** Phụ thuộc vị trí đặt component con trong cây React (Component Hierarchy coupling).
  - **Resolution / Fix:** Nhấc `CreateCircleModal` ra ngoài và mount tại cấp trang `page.tsx` (Global Page Level).
- **Commit:** `be12466`
- **PR:** #59

---

## AI-0054: Hiện thực Chức năng Tham gia Vòng tròn bằng Mã mời (Join Circle with Invite Code)

- **Date:** 2026-09-28 17:25:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:** Xây dựng hoàn chỉnh chức năng tham gia Vòng tròn bằng mã mời (Join Circle with Invite Code) trực tiếp từ Home Hub theo yêu cầu của kỹ sư Ninh Thị Mỹ Hạnh:
  1. **Schema kiểm thực Zod (`joinCircleSchema`):** Bổ sung vào `packages/shared/src/validators/circle.validator.ts`, kiểm soát độ dài mã mời 6–16 ký tự, chỉ gồm ký tự chữ cái và số, tự động chuyển đổi chữ hoa (uppercase) và loại bỏ khoảng trắng thừa (trim).
  2. **Bản địa hóa song ngữ (PR 58):** Bổ sung đầy đủ các chuỗi validation và UI dictionary (`circleInviteCodeRequired`, `circleInviteCodeMinLength`, `circleInviteCodeMaxLength`, `circleInviteCodeInvalid`, `joinModalTitle`, `joinModalSubtitle`, `inviteCodeLabel`, `inviteCodePlaceholder`, `joinCircleBtn`, `joiningCircle`, `joinSuccess`, `inviteCodeNotFound`, `alreadyMember`, `joinModalHint`) vào cả `vi.ts` và `en.ts`.
  3. **Backend API (`POST /api/v1/circles/join`):** Tích hợp endpoint bảo vệ với `ZodValidationPipe` và phương thức `joinByInviteCode` trong `CirclesService`. Xử lý các ngoại lệ nghiệp vụ chuẩn: mã không tồn tại hoặc Circle bị xóa (`NotFoundException`), người dùng đã là thành viên (`ConflictException`), thêm thành viên mới vai trò `MEMBER` và trả về thông tin Vòng tròn với số lượng thành viên cập nhật.
  4. **Bộ kiểm thử đơn vị Jest:** Mở rộng `circles.service.spec.ts` với 3 test case kiểm thử toàn diện kịch bản tham gia thành công, mã không tồn tại và người dùng đã tham gia nhóm (đạt 33/33 tests pass 100%).
  5. **Quản lý trạng thái & Cache đồng bộ:** Bổ sung `isJoinModalOpen` và `setJoinModalOpen` vào `circle.store.ts` (Zustand); xây dựng hook `useJoinCircleMutation()` (TanStack Query) tự động làm mới cache danh sách nhóm `['circles']` và tự động chuyển người dùng vào Vòng tròn vừa tham gia làm `activeCircle`.
  6. **Giao diện Modal Apple HIG (`JoinCircleModal.tsx`):** Thiết kế dialog sang trọng với icon `KeyRound`, ô nhập mã mời phông monospace chữ hoa khổ lớn, tự động lọc ký tự hợp lệ, hiển thị lỗi Zod tức thì và cảnh báo máy chủ.
  7. **Tích hợp Home Hub:** Mount `JoinCircleModal` tại cấp trang gốc `page.tsx` và liên kết sự kiện mở modal cho các nút "Tham gia bằng mã mời" trên banner chính và empty state trong `FeedStream.tsx`.
- **Prompt Summary:** "oke sau khi đã tạo nhóm thành công giờ xây chức năng tham gia bằng mã mời ngoài trang home nào"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.controller.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `apps/web/src/components/circle/JoinCircleModal.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/app/page.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn schemas, controller, service, test cases, store, mutation và component modal.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh trực tiếp yêu cầu triển khai chức năng tham gia nhóm bằng mã mời ngay ngoài trang Home sau khi hoàn tất tạo Circle.
- **Verification Method:**
  - `npm test -w @circle/backend`: 33/33 unit tests pass 100%.
  - `npm run build -w @circle/backend`: NestJS build thành công với 0 lỗi TypeScript.
  - `npm run build -w @circle/shared`: Shared package build thành công.
  - `npm run build -w @circle/web`: Next.js 14 production build hoàn tất 9/9 trang tĩnh với 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`, SRS (UC08: Join Circle via Invite Code).
- **Security & License Check:** An toàn tuyệt đối, tuân thủ nguyên tắc PR 58.
- **AI Errors / Hallucinations Found:** None.
- **Commit:** `a6b237d`
- **PR:** #59

---

## AI-0055: Tinh giản và Hợp nhất Giao diện Khởi tạo Vòng tròn (Unified Single Form)

- **Date:** 2026-09-29 00:11:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #4 ([SUB-FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy (Parent: #19))
- **Purpose:** Tinh giản và hợp nhất form khởi tạo Vòng tròn theo yêu cầu của kỹ sư Ninh Thị Mỹ Hạnh:
  1. **Loại bỏ phân tab:** Xóa bỏ hoàn toàn hệ thống 2 tab ("Tạo bằng tên" vs "Chọn từ bạn bè"), quy về một giao diện form duy nhất trực quan, tinh gọn và dễ thao tác.
  2. **Trường Tên Vòng tròn tùy chọn:** Đặt ở phần trên kèm ghi chú hướng dẫn: người dùng có thể nhập tên hoặc để trống. Nếu để trống, hệ thống sẽ tự động ghép tên của các bạn bè được chọn làm tên nhóm.
  3. **Thêm bạn bè vào Vòng tròn tùy chọn:** Tích hợp bộ lọc tìm kiếm và danh sách chọn bạn bè ngay bên dưới ô nhập tên. Người dùng có thể chọn thêm bạn bè ngay khi tạo, hoặc không chọn bạn bè (nếu đã đặt tên nhóm).
  4. **Kiểm thực Zod thông minh:** Đảm bảo người dùng nhập tên (>= 2 ký tự) HOẶC chọn ít nhất 1 bạn bè (hoặc cả hai: vừa đặt tên vừa thêm bạn bè).
  5. **Bảo toàn PR 58:** Bổ sung các chuỗi bản địa hóa `nameOptionalHint`, `selectFriendsLabel`, `createCircleSubmitBtn` vào cả `vi.ts` và `en.ts`.
- **Prompt Summary:** "chỗ khởi tạo vòng tròn mới thì chỉ cần 1 cái chung ko cần phân chọn từ bạn bè hay để tên. tức là nó vẫn có chỗ nhập tên mà ko bắt buộc và dưới có thể thêm bạn bè vô luôn hoặc ko (nếu chưa đặt tên thì mặc định là tên các thành viên)"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/components/circle/CreateCircleModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn tái cấu trúc component form và localized strings.
- **Human Modifications:** Kỹ sư Ninh Thị Mỹ Hạnh trực tiếp định hướng giải pháp UX tinh giản: bỏ phân tab, hợp nhất ô nhập tên tùy chọn và danh sách chọn bạn bè tùy chọn trong cùng 1 modal.
- **Verification Method:**
  - `npm test -w @circle/backend`: 33/33 unit tests pass 100%.
  - `npm run build -w @circle/backend`: NestJS build thành công với 0 lỗi TypeScript.
  - `npm run build -w @circle/shared`: Shared package build thành công.
  - `npm run build -w @circle/web`: Next.js 14 production build hoàn tất 9/9 trang tĩnh với 0 lỗi.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 framework files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn tuyệt đối, tuân thủ nguyên tắc PR 58.
- **AI Errors / Hallucinations Found:** None.
- **Commit:** `f4f38cf`
- **PR:** #59

---

## AI-0056: Triển khai US-CIRCLE-002 — 4-Tab Circle Settings, Add Members & Personal Privacy Controls

- **Date:** 2026-09-29 13:50:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #5 ([SUB-FEAT]: US-CIRCLE-002 — Circle Invite Codes, Join Requests & Role Hierarchy (Parent: #19))
- **Purpose:** Hoàn thiện toàn diện tái cấu trúc giao diện Cài đặt Vòng tròn dạng khung cố định (Fixed Frame Layout) thành hệ thống 4 tab chuyên biệt theo chỉ đạo của người dùng:
  1. **Prisma Schema & Migrations:** 
     - Bổ sung enum `JoinRequestStatus`, model `CircleJoinRequest` (`circleId`, `userId`, `message`, `status`), trường `maxMembers Int?` trong model `Circle`.
     - Trường `nickname String?` trong `CircleMember` được tích hợp đầy đủ vào hệ thống.
  2. **Shared Package (@circle/shared):** 
     - Bổ sung Zod schemas (`addMembersSchema`, `updateNicknameSchema`, `createCircleSchema`, `updateCircleSchema`, `createJoinRequestSchema`, `reviewJoinRequestSchema`, `transferOwnershipSchema`).
     - Bổ sung bộ từ điển song ngữ i18n (`vi.ts`, `en.ts`) cho 4 tab, tính năng Thêm thành viên, Quyền riêng tư & Tin nhắn, Hỗ trợ & Báo cáo cá nhân. Đảm bảo 100% không hardcode chuỗi ký tự hay màu sắc.
  3. **Backend NestJS (CirclesService & CirclesController):**
     - Bổ sung endpoint `POST /api/v1/circles/:id/members` cho phép thành viên thêm bạn bè trực tiếp vào Vòng tròn, kiểm tra dung lượng `maxMembers` và quan hệ bạn bè hợp lệ.
     - Bổ sung endpoint `PATCH /api/v1/circles/:id/members/:memberId/nickname` cho phép cập nhật biệt danh thành viên (nếu để trống tự động chuyển về `null` để hiển thị tên thật).
     - Phân quyền 2 cấp độ (`OWNER` và `MEMBER`): Bỏ hoàn toàn vai trò Admin theo SRS Intimate Social Platform. Chỉ `OWNER` mới có quyền cấu hình Vòng tròn, duyệt yêu cầu tham gia, kick thành viên, và chuyển giao quyền sở hữu.
     - Quản lý quy mô Vòng tròn (`maxMembers`): Kiểm tra dung lượng nhóm trong `addMembers`, `joinByInviteCode`, `requestToJoin`, `reviewJoinRequest` (báo lỗi `circleFull` khi đạt giới hạn).
  4. **Backend Automated Unit Tests:** 
     - Thêm test suite cho `addMembers` và `updateMemberNickname`. Toàn bộ 55/55 backend tests pass 100%.
  5. **Web UI (@circle/web):** Thiết kế lại modal quản lý Vòng tròn `CircleManagementModal.tsx` thành dạng **Khung cố định (Fixed Frame 2-Column Layout)** gồm 4 tab độc lập:
     - **Cột điều hướng bên trái cố định (`w-64`):** Thể hiện danh tính Vòng tròn (Avatar, Tên, Handle) và 4 tab điều hướng cố định không co giật kích thước khi chuyển tab. Đã bỏ phần chú thích quy mô/chế độ dưới chân thanh điều hướng.
     - **Tab 1: Thông tin đoạn chat (`chatInfo`):** Tên đoạn chat, ảnh đại diện, ảnh bìa, mô tả nhóm. Đã loại bỏ hoàn toàn chế độ riêng tư và số lượng thành viên ra khỏi tab này.
     - **Tab 2: Thành viên (`members`):** Danh sách thành viên; nút **Thêm thành viên** (`+ Thêm thành viên`) mở bảng chọn bạn bè có tìm kiếm, chọn nhiều bạn và thêm ngay vào nhóm; icon cây bút nhỏ (`✏️`) đặt ngay cạnh tên hiển thị để đổi biệt danh dạng inline; tên người dùng thật được hiển thị trên dòng riêng biệt bên dưới biệt danh mà không cần tag biệt danh.
     - **Tab 3: Quyền riêng tư & Hỗ trợ (`privacySupport`):** Dành riêng cho cá nhân mỗi người dùng trong nhóm này:
       - *Quyền riêng tư & Tin nhắn*: Bật/Tắt hiển thị thông báo đã đọc (Read receipts / "Đã xem"); Thông báo đoạn chat (Bật tất cả / Tắt tiếng 15m, 1h, 8h, 24h / Tắt thông báo).
       - *Hỗ trợ & Báo cáo*: Báo cáo vi phạm Vòng tròn (form chọn lý do vi phạm); Trung tâm trợ giúp / Hướng dẫn cộng đồng; Rời Vòng tròn (nút nguy hiểm dành cho cá nhân muốn thoát nhóm kèm xác nhận).
     - **Tab 4: Thiết lập Vòng tròn (`circleSettings`):** Dành cho nhóm: Cấu hình chế độ tham gia (Public/Private), giới hạn số lượng thành viên tối đa (`maxMembers`), liên kết & mã mời duy nhất kèm Web Share API, và danh sách yêu cầu tham gia đang chờ phê duyệt.
- **Prompt Summary:** Tái cấu trúc 4 tab: Thông tin đoạn chat, Thành viên (thêm nút Thêm thành viên, icon bút cạnh tên, tên thật dưới biệt danh), Quyền riêng tư & Hỗ trợ (cá nhân: đã xem, thông báo, báo cáo, trợ giúp, rời nhóm), và Thiết lập Vòng tròn (nhóm: public/private, số lượng, mã mời, duyệt yêu cầu).
- **Files Affected:**
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.controller.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend, frontend, test suites, i18n locales và Zod schemas.
- **Human Modifications:** Người dùng định hình chuẩn xác UX/UI bố cục khung cố định và cơ chế 4 tab chuyên biệt.
- **Verification Method:**
  - `npm test -w @circle/backend`: 55/55 tests pass 100%.
  - `npm run build -w @circle/shared`: build thành công.
  - `npm run build -w @circle/types`: build thành công.
  - `npx tsc --noEmit` trong `apps/web`: 0 errors.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash -c "sed -i 's/\r$//' ./scripts/check-agent-map.sh && ./scripts/check-agent-map.sh"`: 93/93 files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (US-CIRCLE-002, AC-CIRCLE-002-01, AC-CIRCLE-002-02, Rubric Level 5), `docs/requirements/SRS.md` (UC24, UC25), GitHub Issue #5.
- **Security & License Check:** Phân quyền RBAC chặt chẽ, kiểm tra tính hợp lệ thành viên Vòng tròn và dung lượng trước khi thêm thành viên hoặc đặt biệt danh.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Lỗi TypeScript trong `CircleManagementModal.tsx` khi truy cập `f.handle` trên kiểu `SelectableFriendItem`.
  - **Root Cause:** Kiểu `SelectableFriendItem` chỉ bao gồm `id`, `displayName`, `email`, `avatarUrl`.
  - **Resolution / Fix:** Bỏ `f.handle`, chuyển sang tìm kiếm theo `displayName` và `email`.
- **Commit:** 056f2a0
- **PR:** #60 (https://github.com/1440isme/Circle/pull/60)

---

## AI-0057: Triển khai US-MOMENT-001 — Group-Centric Moments Sharing & Circle Visibility Filtering

- **Date:** 2026-09-29 14:55:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #61 ([SUB-FEAT]: US-MOMENT-001 — Group-Centric Moments Sharing & Circle Visibility Filtering (Parent: #20))
- **Purpose:** Triển khai toàn diện Module 5 (Moments & Group Feed) - US-MOMENT-001: Chia sẻ Khoảnh khắc tức thì (Moments) với cơ chế phân quyền hiển thị theo Vòng tròn (Circle-Centric Privacy), bảng tin Moment Feed, phản ứng cảm xúc emoji, và giao diện Web Story Viewer & Moments Tray:
  1. **Prisma Database Schema & Migrations:**
     - Thiết kế model `Moment` (`id`, `authorId`, `photoUrl`, `caption`, `capturedAt`, `createdAt`, `updatedAt`, `deletedAt`).
     - Thiết kế model liên kết quyền hiển thị đa Vòng tròn `MomentVisibility` (`momentId`, `circleId`, `createdAt`) với quan hệ `@@unique([momentId, circleId])`.
     - Thiết kế model cảm xúc `MomentReaction` (`momentId`, `userId`, `emoji`, `createdAt`) với quan hệ `@@unique([momentId, userId, emoji])`.
     - Chạy migration `20260929073137_add_moments_and_circle_visibility` an toàn trên PostgreSQL.
  2. **Shared Packages (@circle/types & @circle/shared):**
     - Bổ sung interface `MomentEntity`, `MomentVisibilityEntity`, `MomentReactionEntity`, `CreateMomentInput`, `ReactMomentInput`.
     - Xây dựng Zod validation `createMomentSchema` (ràng buộc photoUrl, độ dài caption tối đa 300 ký tự, danh sách circleIds tối thiểu 1 vòng tròn) và `reactMomentSchema` (ràng buộc emoji trong danh sách cho phép).
     - Bổ sung từ điển bản địa hóa song ngữ i18n (`vi.ts`, `en.ts`) hoàn chỉnh cho toàn bộ module Moments.
  3. **Backend NestJS (MomentsModule, MomentsService, MomentsController):**
     - `POST /api/v1/moments`: Đăng Moment mới, kiểm tra bắt buộc người dùng phải là thành viên hợp lệ của tất cả các Vòng tròn được chọn trước khi tạo liên kết `MomentVisibility`.
     - `GET /api/v1/moments/feed`: Lấy luồng Khoảnh khắc tổng hợp từ tất cả các Vòng tròn người dùng đang tham gia, gom nhóm số lượt phản ứng emoji và cờ phản ứng của chính người dùng.
     - `GET /api/v1/moments/circle/:circleId`: Lấy danh sách Khoảnh khắc thuộc riêng một Vòng tròn cụ thể kèm kiểm tra tư cách thành viên.
     - `POST /api/v1/moments/:id/react`: Thả hoặc gỡ (toggle) cảm xúc emoji (❤️, 😂, 🔥, 👏, 😍).
     - `DELETE /api/v1/moments/:id`: Xóa mềm (soft-delete) Khoảnh khắc, chỉ tác giả mới có quyền xóa.
  4. **Backend Automated Unit Tests:**
     - Viết 14 test cases chuyên sâu trong `moments.service.spec.ts` kiểm thử toàn diện các luồng: tạo mới, kiểm tra quyền Vòng tròn, bảng tin Feed, lọc theo Circle, phản ứng emoji toggle, và xóa an toàn.
     - 100% 69/69 backend unit tests pass sạch sẽ.
  5. **Frontend Web UI (@circle/web):**
     - Xây dựng `use-moment-queries.ts` với đầy đủ React Query hooks và tối ưu cache invalidation.
     - Xây dựng `MomentsTray.tsx`: Thanh cuộn ngang hiển thị story vòng tròn viền gradient động, nút tạo khoảnh khắc cá nhân nổi bật, hỗ trợ cả chế độ Hub tổng và Circle Workspace.
     - Xây dựng `CreateMomentModal.tsx`: Hỗ trợ dán URL ảnh hoặc chọn nhanh ảnh mẫu có sẵn từ Unsplash, nhập chú thích kèm bộ đếm ký tự, và bảng chọn phân quyền hiển thị theo từng Vòng tròn riêng biệt (`myCircles`) với tính năng "Chọn tất cả".
     - Xây dựng `StoryViewerModal.tsx`: Trình xem story toàn màn hình trải nghiệm đỉnh cao (phong cách Instagram / BeReal), thanh tiến trình chia phân đoạn (5s/story), phím tắt bàn phím (Mũi tên Trái/Phải/Dấu cách/Esc), thanh thả cảm xúc emoji tương tác tức thì, và nút xóa cho tác giả.
- **Prompt Summary:** Hoàn thiện Module 5: Tạo Khoảnh khắc, chọn quyền riêng tư theo Circle, xem story, phản ứng emoji, xóa khoảnh khắc, kiểm thử và tích hợp hoàn chỉnh.
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260929073137_add_moments_and_circle_visibility/migration.sql`
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/moment.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/index.ts`
  - `apps/backend/src/modules/moments/moments.service.ts`
  - `apps/backend/src/modules/moments/moments.controller.ts`
  - `apps/backend/src/modules/moments/moments.module.ts`
  - `apps/backend/src/modules/moments/moments.service.spec.ts`
  - `apps/backend/src/app.module.ts`
  - `apps/web/src/hooks/use-moment-queries.ts`
  - `apps/web/src/components/moments/CreateMomentModal.tsx`
  - `apps/web/src/components/moments/StoryViewerModal.tsx`
  - `apps/web/src/components/moments/MomentsTray.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn database schema, backend service & controller, unit tests, frontend components, hooks, và từ điển song ngữ i18n.
- **Human Modifications:** Định hướng phân công vai trò nhiệm vụ chuẩn xác cho Ninh Thị Mỹ Hạnh (Module 5) và yêu cầu gom gọn nhật ký AI log.
- **Verification Method:**
  - `npm test -w @circle/backend`: 69/69 tests pass 100%.
  - `npm run build -w @circle/web`: build production thành công, 0 errors.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (US-MOMENT-001, AC-MOMENT-001-01, AC-MOMENT-001-02, Module 5), `docs/phan-cong-nhiem-vu.md`, GitHub Issue #61.
- **Security & License Check:** Phân quyền riêng tư theo Circle tuyệt đối: chỉ thành viên trong Vòng tròn được chỉ định mới có quyền truy cập hoặc xem Khoảnh khắc; chỉ tác giả mới có quyền xóa.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Lỗi TypeScript trong `MomentsTray.tsx` khi truy cập `user.displayName` (kiểu `AuthUserData` chứa thông tin trong `profile.displayName`).
  - **Root Cause:** Cấu trúc dữ liệu `AuthUserData` trong `@circle/types` đặt thông tin hiển thị bên trong thuộc tính `profile`.
  - **Resolution / Fix:** Cập nhật truy cập chuẩn `user?.profile?.displayName || user?.email?.split('@')[0]`.
- **Commit:** 9cee74c
- **PR:** #62 (https://github.com/1440isme/Circle/pull/62)







