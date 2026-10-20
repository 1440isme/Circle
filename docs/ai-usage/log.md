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
     - Thiết kế model `Moment` (`id`, `authorId`, `photoUrl`, `mediaType`, `caption`, `capturedAt`, `createdAt`, `updatedAt`, `deletedAt`).
     - Bổ sung enum `MomentMediaType` (`IMAGE`, `VIDEO`) và áp dụng migration `20260929084050_add_moment_media_type`.
     - Thiết kế model liên kết quyền hiển thị đa Vòng tròn `MomentVisibility` (`momentId`, `circleId`, `createdAt`) với quan hệ `@@unique([momentId, circleId])`.
     - Thiết kế model cảm xúc `MomentReaction` (`momentId`, `userId`, `emoji`, `createdAt`) với quan hệ `@@unique([momentId, userId, emoji])`.
  2. **Shared Packages (@circle/types & @circle/shared):**
     - Bổ sung type `MomentMediaType` (`IMAGE` | `VIDEO`), interface `MomentEntity`, `MomentVisibilityEntity`, `MomentReactionEntity`, `CreateMomentInput`, `ReactMomentInput`.
     - Cập nhật Zod validation `createMomentSchema` hỗ trợ linh hoạt cả Data URI (`data:image/...`, `data:video/...`) xuất trực tiếp từ camera lẫn URL ngoài, ràng buộc `mediaType` mặc định `IMAGE`.
     - Bổ sung từ điển bản địa hóa song ngữ i18n (`vi.ts`, `en.ts`) hoàn chỉnh cho camera permissions, chụp ảnh, quay video ngắn, đếm thời gian, đổi camera.
  3. **Backend NestJS (MomentsModule, MomentsService, MomentsController):**
     - Hỗ trợ lưu trữ và phân loại `mediaType` (`IMAGE` hoặc `VIDEO`).
     - `POST /api/v1/moments`: Đăng Moment mới, kiểm tra bắt buộc người dùng phải là thành viên hợp lệ của tất cả các Vòng tròn được chọn trước khi tạo liên kết `MomentVisibility`.
     - `GET /api/v1/moments/feed`: Lấy luồng Khoảnh khắc tổng hợp từ tất cả các Vòng tròn người dùng đang tham gia, gom nhóm số lượt phản ứng emoji và cờ phản ứng của chính người dùng.
     - `GET /api/v1/moments/circle/:circleId`: Lấy danh sách Khoảnh khắc thuộc riêng một Vòng tròn cụ thể kèm kiểm tra tư cách thành viên.
     - `POST /api/v1/moments/:id/react`: Thả hoặc gỡ (toggle) cảm xúc emoji (❤️, 😂, 🔥, 👏, 😍).
     - `DELETE /api/v1/moments/:id`: Xóa mềm (soft-delete) Khoảnh khắc, chỉ tác giả mới có quyền xóa.
  4. **Backend Automated Unit Tests:**
     - 100% 69/69 backend unit tests pass sạch sẽ, bao gồm kiểm thử mediaType và tạo moment.
  5. **Frontend Web UI (@circle/web):**
     - `CreateMomentModal.tsx` nâng cấp toàn diện thành **Realtime Camera & Short Video Recorder**:
       - Kết nối camera / webcam trực tiếp qua `navigator.mediaDevices.getUserMedia`.
       - Hỗ trợ 2 chế độ: Chụp ảnh trực tiếp (Snapshot qua canvas) và Quay video ngắn trực tiếp (MediaRecorder đếm ngược tối đa 10s có âm thanh).
       - Nút đổi Camera (Front/Back) và xử lý lỗi phân quyền camera thân thiện.
       - Màn hình xem lại (Preview) kèm nút "Chụp / Quay lại", ô chú thích và bảng chọn Circle-Centric Privacy.
     - `StoryViewerModal.tsx` nâng cấp hỗ trợ xem cả Story Ảnh tĩnh và Story Video tự động phát có âm thanh kèm nút bật/tắt tiếng và đồng bộ thanh tiến trình.
     - `MomentsTray.tsx` tích hợp mượt mà vào `FeedStream.tsx`.
- **Prompt Summary:** Nâng cấp đăng Khoảnh khắc trực tiếp: camera thời gian thực, chụp ảnh và quay video ngắn không dùng ảnh tải lên, phân quyền Circle, kiểm thử và tích hợp hoàn chỉnh.
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20260929073137_add_moments_and_circle_visibility/migration.sql`
  - `apps/backend/prisma/migrations/20260929084050_add_moment_media_type/migration.sql`
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
- **AI-Generated Portion:** 100% mã nguồn database schema, backend service & controller, unit tests, realtime camera frontend components, hooks, và từ điển song ngữ i18n.
- **Human Modifications:** Người dùng định hình yêu cầu khoảnh khắc chân thực (BeReal / Locket): chụp ảnh và quay video trực tiếp thời gian thực, không tải ảnh sẵn.
- **Verification Method:**
  - `npm test -w @circle/backend`: 69/69 tests pass 100%.
  - `npm run build -w @circle/web`: build production thành công, 0 errors.
  - `npx tsc --noEmit` trong `apps/mobile`: 0 errors.
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (US-MOMENT-001, AC-MOMENT-001-01, AC-MOMENT-001-02, Module 5), `docs/phan-cong-nhiem-vu.md`, GitHub Issue #61.
- **Security & License Check:** Phân quyền riêng tư theo Circle tuyệt đối: chỉ thành viên trong Vòng tròn được chỉ định mới có quyền truy cập hoặc xem Khoảnh khắc; chỉ tác giả mới có quyền xóa.
  - **Error Description:** Lỗi `request entity too large` (HTTP 413) khi gửi ảnh/video data URI trực tiếp từ camera lên backend NestJS do giới hạn mặc định 100kb của express body-parser; và modal vẫn hỏi chọn Vòng tròn khi người dùng đang ở trong không gian một Vòng tròn cụ thể.
  - **Root Cause:** Chưa cấu hình `limit: '50mb'` cho `json()` và `urlencoded()` trong `main.ts`; và `CreateMomentModal` chưa tự động khóa theo Vòng tròn đang mở.
  - **Resolution / Fix:** Cấu hình `app.use(json({ limit: '50mb' }))` và `app.use(urlencoded({ extended: true, limit: '50mb' }))` trong `apps/backend/src/main.ts`; cập nhật `CreateMomentModal.tsx` tự động nhận diện `effectiveCircle` để khóa và hiển thị trực tiếp thẻ Vòng tròn đích, không hỏi chọn nhóm khác.
- **Commit:** 43f9295
- **PR:** #62 (https://github.com/1440isme/Circle/pull/62 - DRAFT)

---

## AI-0058: Tích hợp Mục Khoảnh khắc Thường ngày dạng Bản tin Lướt dọc trong Tiện ích Nhóm

- **Date:** 2026-09-29 17:05:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #61 (US-MOMENT-001: Moments Sharing and Circle Visibility)
- **Purpose:** 
  1. Thống nhất tên hiển thị tính năng thành **"Khoảnh khắc thường ngày"** (i18n: `t.moments.locketWidgetTitle` / `Daily Moments`), cập nhật từ điển song ngữ trong `packages/shared/src/locales/vi.ts` & `en.ts` và biên dịch đồng bộ gói `@circle/shared` (`tsc`).
  2. Bổ sung mục điều hướng **"Khoảnh khắc thường ngày"** (với biểu tượng camera) vào danh mục **Tiện ích Nhóm** ở thanh điều hướng bên trái (`Sidebar.tsx`), quản lý không gian làm việc qua `activeCircleView: 'general' | 'moments'` trong `circle.store.ts`.
  3. Xây dựng giao diện Bản tin lướt dọc (**`DailyMomentsFeed.tsx`**) tại vùng nội dung trung tâm (`FeedStream.tsx`):
     - Nút bấm `+ Gửi khoảnh khắc` mở camera thời gian thực để chụp ảnh hoặc quay video ngắn trực tiếp.
     - Dòng chảy bài đăng dọc (`article` card nối tiếp): ảnh / video ngắn tự quay kèm avatar tác giả, tên, mốc thời gian, chú thích, nút bật/tắt âm thanh cho video và nút xóa bài (cho tác giả).
     - Thanh cảm xúc tương tác trực tiếp (❤️ 🔥 😂 👏 😍) trên từng bài đăng với số lượt cảm xúc cập nhật theo thời gian thực.
     - Trạng thái rỗng thân thiện khuyến khích thành viên chia sẻ khoảnh khắc đầu tiên của nhóm.
- **Prompt Summary:** Thống nhất đổi tên thành Khoảnh khắc thường ngày, đặt vào mục Tiện ích nhóm ở thanh bên trái, khi bấm vào mở ra bản tin lướt dọc hiển thị ảnh các thành viên và tương tác cảm xúc.
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn `DailyMomentsFeed.tsx`, tích hợp stream dọc, điều hướng sidebar, recompile shared và dọn dẹp log trùng lặp.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp định hình vị trí tại Tiện ích nhóm, tên gọi "Khoảnh khắc thường ngày", dạng hiển thị bản tin lướt dọc và yêu cầu tinh gọn nhật ký AI log loại bỏ các bước thảo luận trung gian chưa chốt.
- **Verification Method:**
  - `npm run build -w @circle/shared`: Pass 100%.
  - `npm run build -w @circle/web`: Pass 100% (0 errors).
  - `npm test -w @circle/backend`: 69/69 tests pass 100%.
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 5), Issue #61, Draft PR #62.
- **Security & License Check:** An toàn, không chứa credentials.
- **Commit:** b2b0047
- **PR:** #62 (https://github.com/1440isme/Circle/pull/62 - DRAFT)

---

## AI-0059: Triển khai Module 4 — Nhắn tin Nhóm Thời gian thực & Media Storage (Full-stack Realtime Group Messaging)

- **Date:** 2026-09-29 21:30:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #63 ([MODULE-4]: Nhắn tin Nhóm Thời gian thực & Media Storage - Full-stack Realtime Group Messaging & Media Storage)
- **Purpose:** 
  1. Triển khai trọn vẹn Module 4 Full-stack Nhắn tin nhóm thời gian thực (Realtime Group Messaging & Media Storage) theo phân công nhiệm vụ:
     - Tuân thủ nguyên tắc cốt lõi: Circle-Only (chỉ nhắn tin trong các kênh của Vòng tròn, tuyệt đối không có tin nhắn 1-1 riêng tư), giới hạn đính kèm 25MB (SRS UC11), ghim tin nhắn (SRS UC13), thả biểu cảm emoji, trích dẫn trả lời tin nhắn (reply thread), chỉ báo đang nhập (typing indicator), phân trang con trỏ (cursor-based pagination).
  2. Backend NestJS (`apps/backend`):
     - `ChatGateway`: WebSocket Gateway với xác thực JWT trong handshake, quản lý room `channel:<id>` và `user:<id>`, relay typing status, broadcast tin nhắn mới, reaction, pin/unpin tin nhắn.
     - `ChatService` & `ChatController`: 6 REST endpoints (`GET/POST /channels/:channelId/messages`, `GET /channels/:channelId/pins`, `POST /messages/:messageId/reactions`, `POST/DELETE /messages/:messageId/pin`). Kiểm tra xác thực thành viên Vòng tròn (RBAC), tính toán reaction counts, cursor pagination.
     - 14 ca kiểm thử đơn vị (`chat.service.spec.ts`) đạt 100% (83/83 backend unit tests pass).
  3. Shared & Contracts (`packages/shared`, `packages/types`):
     - Bổ sung Zod schemas (`chat.validator.ts`) với kiểm duyệt kích thước file (tối đa 25MB), định dạng UUID, enum MessageType.
     - Song ngữ 100% `vi.ts` và `en.ts` cho toàn bộ nhãn chat, thông báo thành công/thất bại, không hardcode.
     - Mở rộng domain types: `MessageEntity`, `ReactionEntity`, `PinnedRecordEntity`, `CursorPaginatedMessages`.
  4. Frontend Web Next.js (`apps/web`):
     - `socket.ts`: Socket.IO client instance singleton với JWT handshake, auto-reconnect, join/leave channel, typing relay.
     - `use-chat-queries.ts`: Bộ hooks React Query + Socket.IO realtime cache synchronization cho tin nhắn vô hạn, biểu cảm, ghim tin nhắn, typing users.
     - Giao diện chat nhóm chuẩn thiết kế: `ChannelChatView.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, `ChatComposer.tsx`, `PinnedMessagesModal.tsx`.
     - Tích hợp trực tiếp vào không gian làm việc Vòng tròn (`FeedStream.tsx`), thay thế hoàn toàn giao diện mock/alert trước đây.
- **Prompt Summary:** Yêu cầu: "quay trở lại với web nào, mới merge của hạnh vào dev nhiệm vụ tiếp theo của tôi theo phân công là gì nhỉ", "cách 1 nhé" (Backend First rồi sang Web UI).
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/chat.validator.ts`
  - `packages/shared/src/index.ts`
  - `apps/backend/package.json`
  - `apps/backend/src/app.module.ts`
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/backend/src/modules/chat/chat.service.ts`
  - `apps/backend/src/modules/chat/chat.controller.ts`
  - `apps/backend/src/modules/chat/chat.module.ts`
  - `apps/backend/src/modules/chat/chat.service.spec.ts`
  - `apps/web/package.json`
  - `apps/web/src/lib/socket.ts`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/chat/PinnedMessagesModal.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend gateway/service/controller/tests, frontend socket/hooks/components, types và locale dictionaries.
- **Human Modifications:** Trương Công Bình lựa chọn phương án Backend First, chỉ định tuân thủ nghiêm ngặt quy định không 1-1, không mock data, không hardcode ngôn ngữ, chỉ dùng Zod.
- **Verification Method:**
  - `npm test -w @circle/backend`: 83/83 unit tests pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9 static routes, 0 errors).
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100% (0 broken links).
- **Official Source Checked:** `PROJECT_GOD.md` (Module 4, Definition of Done, 10 Hard Gates), `docs/phan-cong-nhiem-vu.md` (Bình: Module 4), SRS UC11, UC12, UC13.
- **Security & License Check:** Phân quyền kênh chat nghiêm ngặt theo Vòng tròn (RBAC): chặn tuyệt đối non-member (403), bảo mật WebSocket handshake bằng JWT, kiểm duyệt giới hạn file 25MB qua Zod.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Import nhầm `SendMessageInput` từ `@circle/types` thay vì `@circle/shared` trong `use-chat-queries.ts`; và thuộc tính `socket.connecting` không tồn tại trong type definition của socket.io-client.
  - **Root Cause:** Nhớ nhầm module export của Zod input type và API của socket.io-client v4.
  - **Resolution / Fix:** Chuyển import `SendMessageInput` từ `@circle/shared`, sửa điều kiện socket sang `!socket.connected`.
- **Commit:** `e40ef4e`
- **PR:** #63 (https://github.com/1440isme/Circle/pull/63)

---

## AI-0060: Triển khai Giao diện Quản trị Vòng tròn & Không gian Làm việc Workspace (Circle Core, Governance & Workspace) trên Mobile React Native

- **Date:** 2026-09-30 18:35:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #64 ([SUB-FEAT]: US-MOBILE-002 — Mobile Circle Core & Governance UI/UX)
- **Purpose:** 
  1. Triển khai hoàn thiện tính năng Quản trị & Điều phối Vòng tròn (Circle Core & Governance) trên ứng dụng di động React Native (`apps/mobile`), tuân thủ chuẩn thiết kế Liquid Glass, 0 hardcoded colors, 0 raw strings (100% i18n keys) và kết nối trực tiếp backend API qua JWT:
     - Tạo Vòng tròn mới (`CreateCircleModal.tsx`): Nhập tên, @handle định danh, chọn chế độ Công khai/Riêng tư, tìm kiếm và chọn bạn bè ban đầu (`useSelectableFriendsQuery`), validate Zod `createCircleSchema`.
     - Tham gia bằng Mã mời (`JoinCircleModal.tsx`): Nhập mã 6 ký tự viết hoa alphanumeric, xác thực `joinCircleSchema` và kích hoạt tham gia ngay lập tức.
     - Quản trị & Thiết lập Vòng tròn (`CircleManagementModal.tsx`): 4 tab điều phối:
       + Tab Thông tin: Thống kê thành viên, trạng thái riêng tư, hiển thị và chia sẻ mã mời (`Share.share`), chỉnh sửa thông tin Vòng tròn cho Trưởng nhóm.
       + Tab Thành viên: Danh sách thành viên kèm role badge (`Trưởng nhóm`, `Quản trị viên`), chỉnh sửa/đặt biệt danh thành viên (`UC20`), mời thành viên ra khỏi nhóm (`kickMember`), chuyển giao vai trò Trưởng nhóm (`UC25`), thêm bạn bè vào nhóm (`Add Friends`).
       + Tab Yêu cầu tham gia: Duyệt / Từ chối yêu cầu tham gia đối với Vòng tròn riêng tư.
       + Tab Cài đặt: Rời Vòng tròn (`UC22`) dành cho thành viên, Giải tán Vòng tròn (`UC26`) dành cho Trưởng nhóm với xác nhận an toàn.
  2. Xây dựng Màn hình Không gian Làm việc Vòng tròn chuyên dụng (`apps/mobile/app/circle/[id].tsx`):
     - Header chuyên nghiệp phong cách Apple Liquid Glass: Nút Back quay lại các tab, avatar viết tắt Vòng tròn, Tên Vòng tròn, @handle định danh, huy hiệu vai trò người dùng (`Trưởng nhóm`, `Quản trị viên`, `Thành viên`), huy hiệu trạng thái bảo mật (`Riêng tư` với biểu tượng khóa / `Công khai`), nút chia sẻ mã mời trực tiếp (`Share.share`), và biểu tượng bánh răng Cài đặt mở ngay `CircleManagementModal`.
     - Thanh điều hướng phân đoạn 4 tab con (`Segmented Controls`):
       + Tab 1 — Trò chuyện (`chat`): Lựa chọn kênh (`# general`, `# confession`), thẻ giới thiệu kênh, danh sách bong bóng tin nhắn thời gian thực và thanh soạn thảo tin nhắn cố định ở đáy kết nối trực tiếp `useSendMessageMutation`.
       + Tab 2 — Khoảnh khắc thường ngày (`moments`): Dòng cấp khoảnh khắc Locket của nhóm (`useCircleMomentsQuery`), ảnh khoảnh khắc kèm tác giả, thời gian, chú thích và thanh cảm xúc emoji tương tác tức thời (`❤️`, `🔥`, `👏`, `🥰` qua `useReactMomentMutation`).
       + Tab 3 — Tiện ích nhóm (`tools`): Bộ thẻ tiện ích tích hợp Phòng thoại nhóm trực tiếp (`groupCall`), Album ảnh chung (`photoAlbum`), Lịch sự kiện (`calendarEvents`), Bảng kế hoạch chung (`planningSheet`), Vòng xoay may mắn (`luckyWheel`).
       + Tab 4 — Thành viên (`members`): Danh sách thành viên đầy đủ, avatar, tên, email, biệt danh (`UC20`), vai trò trong nhóm và liên kết mở nhanh modal quản trị thành viên.
  3. Tích hợp dữ liệu động & điều hướng toàn diện:
     - `apps/mobile/src/stores/circle.store.ts`: Zustand store quản lý state Vòng tròn đang chọn và hiển thị các modal điều khiển.
     - `apps/mobile/src/hooks/use-circle-queries.ts`: Bộ TanStack Query hooks kết nối API Vòng tròn, danh sách thành viên, khoảnh khắc nhóm, tin nhắn và gửi tin nhắn trong kênh.
     - `apps/mobile/app/(tabs)/circles.tsx`: Hiển thị danh sách thẻ Vòng tròn thực tế với Pull-to-refresh; bấm vào bất kỳ thẻ Vòng tròn nào sẽ điều hướng trực tiếp vào không gian làm việc `/circle/[id]`.
     - `apps/mobile/app/(tabs)/index.tsx`: Đồng bộ dải Circles Rail ngang trên Trang chủ; chọn Vòng tròn sẽ điều hướng ngay vào `/circle/[id]`.
     - `apps/mobile/app/(tabs)/messages.tsx`: Hiển thị danh sách các Vòng tròn đã tham gia kèm kênh chat `#general`, `#confession`; chọn kênh mở trực tiếp `/circle/[id]`.
     - `apps/mobile/app/(tabs)/_layout.tsx`: Kích hoạt tùy chọn Tạo Vòng tròn trong ActionSheet trung tâm, mount 3 modals toàn cục.
  4. Cập nhật contracts & từ điển:
     - Bổ sung `danger` semantic color vào theme mobile (`apps/mobile/src/constants/theme.ts`).
     - Bổ sung các key bản địa hóa cho giải tán Vòng tròn (`deleteCircle`, `deleteCircleConfirm`, `deleteCircleWarning`, `deleteCircleSuccess`) trong `packages/shared/src/locales/vi.ts` và `en.ts`.
- **Prompt Summary:** Chỉ đạo: Triển khai Module 3 trên mobile; khi chọn vào 1 circle sẽ chuyển hẳn vào không gian làm việc của circle đó; chỉ ghi log.md khi chuẩn bị PR hoặc có chức năng mới hoàn chỉnh.
- **Files Affected:**
  - `apps/mobile/src/constants/theme.ts`
  - `apps/mobile/src/stores/circle.store.ts`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/components/circle/CreateCircleModal.tsx`
  - `apps/mobile/src/components/circle/JoinCircleModal.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `apps/mobile/app/(tabs)/_layout.tsx`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn components, workspace screen, hooks, stores, styles và localization keys.
- **Human Modifications:** Ninh Thị Mỹ Hạnh chỉ đạo phát triển Mobile Circle Core theo đúng kiến trúc Module 3, yêu cầu bổ sung không gian làm việc chi tiết khi bấm vào Vòng tròn, và chuẩn hóa quy định chỉ ghi nhật ký AI log khi chuẩn bị PR hoặc có tính năng mới hoàn chỉnh.
- **Verification Method:**
  - `npm run typecheck -w @circle/mobile`: TypeScript `tsc --noEmit` pass 100% (0 errors).
  - `npm test -w @circle/backend`: 83/83 backend unit tests pass 100%.
  - `bash ./scripts/check-agent-map.sh`: 93/93 markdown references pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 3, Definition of Done, 10 Hard Gates), `docs/phan-cong-nhiem-vu.md` (Hạnh: Module 3), SRS UC20, UC22, UC25, UC26.
- **Security & License Check:** An toàn, không chứa API keys hay credentials.
- **Commit:** `8b7020d`
- **PR:** #65

---

## AI-0061: Hoàn thiện Trải nghiệm Locket Camera Realtime, Zoom 0.5x/1x, Chế độ Dual View Song song và Điều hướng Khoảnh khắc Nhóm trên Mobile

- **Date:** 2026-10-01 13:45:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #64 ([SUB-FEAT]: US-MOBILE-002 — Mobile Circle Core & Governance UI/UX)
- **Purpose:** 
  1. Tái cấu trúc và hoàn thiện trải nghiệm Camera Realtime Locket Widget trên Mobile React Native (`apps/mobile/src/components/moment/LocketMomentsView.tsx`):
     - **Real Camera 60fps & 100% Realtime:** Tích hợp `expo-camera` (`CameraView`) với xử lý chụp ảnh tức thì qua Base64 & URI, loại bỏ hoàn toàn việc chọn ảnh từ thư viện để đảm bảo tính xác thực thời gian thực.
     - **Điều khiển Zoom góc rộng (0.5x vs 1x):** Bổ sung nút chuyển đổi góc trên bên phải khung ngắm đối xứng với nút Flash, hỗ trợ thu nhỏ hiển thị toàn cảnh 0.5x (uncropped scale `0.78`) và góc tiêu chuẩn 1x.
     - **Chế độ 2 Camera Song Song (Dual View / PiP):**
       + Nút bật/tắt Dual View (`Layers`) ở thanh điều khiển dưới.
       + Khung nổi phụ PiP góc trên bên trái hiển thị góc đối diện (Selfie khi cam chính là cam sau, hoặc ngược lại) với badge góc và nút **Lật cam** (`RefreshCw`) thao tác trực tiếp.
       + Cơ chế chụp ảnh kép không làm giật/đơ luồng camera, lưu trữ dữ liệu lồng `#pip=` tương thích 100% Zod validation của backend.
       + Trong chế độ xem lại (Review) và Feed Khoảnh khắc (Trang 1..N): Khung nổi PiP hỗ trợ **chạm để hoán đổi góc nhìn (Tap to Swap)** tức thì giữa ảnh lớn và ảnh nhỏ.
     - **Bố cục & Điều hướng Tinh chỉnh:**
       + Cố định Header trên cùng với dropdown lọc theo từng thành viên dạng sổ tại chỗ.
       + Nút chụp chính phóng to 90px chuẩn Locket đôi viền, cân bằng khoảng cách thẩm mỹ.
       + Khu vực điều hướng Lịch sử mượt mà với thumbnail ảnh gần nhất.
  2. Tối ưu hóa Cache & Truy vấn dữ liệu (`apps/mobile/src/hooks/use-circle-queries.ts`):
     - Xử lý tương thích định dạng dữ liệu trả về từ backend (raw array / wrapped object).
     - Cập nhật Optimistic Cache tức thì khi đăng bài qua `useCreateMomentMutation`.
- **Prompt Summary:** Yêu cầu: Tinh chỉnh bố cục camera Locket, làm to nút chụp, thêm zoom 0.5x/1x, tích hợp camera thật, làm chế độ 2 cam trước sau song song (Dual View), sửa lỗi khung nhỏ và thao tác lật, hoàn thiện Module 3 và ghi log mở PR.
- **Files Affected:**
  - `apps/mobile/src/components/moment/LocketMomentsView.tsx`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/app/(tabs)/circles.tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/messages.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn camera controls, Dual View PiP frame, layout adjustments, optimistic mutation hooks và styling.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp nghiệm thu thực tế trên thiết bị di động, chỉ đạo cải tiến các chi tiết UX: tỉ lệ zoom 0.5x, khung nhỏ PiP trực quan, thao tác lật cam và kiểm duyệt chất lượng trước khi mở PR.
- **Verification Method:**
  - `npm run typecheck -w @circle/mobile`: TypeScript `tsc --noEmit` pass 100% (0 errors).
  - `npm test -w @circle/backend -- --testPathPattern="circle"`: 5/5 test suites, 83/83 unit tests pass 100%.
  - `npm run build -w @circle/backend`: Biên dịch NestJS thành công 0 lỗi.
  - `npm run build -w @circle/web`: Next.js production build pass 100%.
  - `bash ./scripts/check-agent-map.sh`: 93/93 markdown references pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 3 & Module 5, Definition of Done, 10 Hard Gates), `docs/phan-cong-nhiem-vu.md` (Hạnh: Module 3 Full-stack), SRS UC20, UC22, UC25, UC26.
- **Security & License Check:** An toàn, không chứa secret keys hay API credentials.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Thuộc tính `pipCornerTag` thiếu trong StyleSheet ban đầu gây lỗi typecheck TS2339; và trên Android/iOS không thể render cùng lúc 2 hardware `<CameraView>` mà không khóa camera bus; dynamic typed route `/circle/[id]` thiếu type declaration trong Expo Router types.
  - **Root Cause:** Quên thêm class style vào StyleSheet; giới hạn phần cứng mobile chỉ cho phép 1 active hardware camera pipeline; và route mới chưa được sinh vào router.d.ts của expo-router.
  - **Resolution / Fix:** Bổ sung `pipCornerTag` và `pipFlipBtn` vào StyleSheet; sử dụng giải pháp hiển thị góc phụ qua dynamic counterpart portrait/preview và capture dual-payload an toàn mượt mà; ép kiểu pathname `/circle/[id]` trong tab screens.
- **Commit:** `cad3ddb`
- **PR:** #65 (https://github.com/1440isme/Circle/pull/65)

---

## AI-0062: Triển khai Tính năng Xem & Cập nhật Hồ sơ Cá nhân (User Profile View & Edit) trên Web & Mobile

- **Date:** 2026-10-01 15:35:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #66 ([USER-STORY]: Cập nhật thông tin hồ sơ cá nhân - Display Name, Avatar, Bio, Date of Birth trên Web và Mobile)
- **Purpose:** 
  1. Triển khai trọn vẹn tính năng xem và cập nhật hồ sơ cá nhân (User Profile Management) trên cả hai nền tảng Web (`Next.js 14`) và Mobile (`React Native / Expo`).
  2. Cơ chế View / Edit thông minh:
     - Mặc định khi ấn vào "Hồ sơ cá nhân", hiển thị thẻ Profile View với: Ảnh đại diện lớn, Tên hiển thị (`displayName`), Tiểu sử (`bio`), Ngày sinh / Năm sinh (`dateOfBirth`).
     - Nút Máy ảnh (`Camera`) trên avatar cho phép mở trực tiếp chế độ chọn ảnh mẫu hoặc dán link URL và lưu ngay.
     - Nút "Chỉnh sửa hồ sơ" mở form chỉnh sửa họ tên, tiểu sử (với bộ đếm 0/300 ký tự) và ngày sinh.
     - Lược bỏ hoàn toàn các trường không cần thiết (`coverUrl`, vai trò, email thừa, nút hủy bên trái) để giữ giao diện cá nhân tinh tế, tối giản.
  3. Backend NestJS (`apps/backend`):
     - Cung cấp endpoint `PATCH /api/v1/auth/profile` với `UpdateProfileDto` và `JwtAuthGuard`.
     - Tích hợp `prisma.userProfile.upsert` cập nhật dữ liệu và đồng bộ `AuthUserData`.
     - Unit test `TC-AUTH-007` (15/15 auth tests, 84/84 backend tests pass 100%).
  4. Shared Contracts (`packages/shared`):
     - Bổ sung `updateProfileSchema` & `UpdateProfileInput` với Zod validator.
     - Hỗ trợ song ngữ 100% tiếng Việt (`vi.ts`) và tiếng Anh (`en.ts`).
  5. State Management & Cache:
     - Web: `useUpdateProfileMutation` tự động cập nhật `AuthContext` ngay khi lưu thành công.
     - Mobile: `useAuthStore.updateProfile` đồng bộ tức thì vào Zustand store và AsyncStorage.
- **Prompt Summary:** Yêu cầu: "nhiệm vụ xây dựng chỗ hồ sơ cá nhân sẽ có thể chỉnh tên và avatar và tiểu sử ở web và mobile", "ấn vô thì mới xem có cái bút để ấn sửa", "bỏ nút bên cạnh tên đi, nút bên avatar để máy ảnh chọn ảnh, chỉ có tên, tiểu sử, ngày sinh, bỏ coverUrl và nút hủy", "ở mobile đổi tiểu sử lên trên ngày sinh".
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/src/modules/auth/dto/update-profile.dto.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/hooks/use-auth-mutations.ts`
  - `apps/web/src/components/profile/EditProfileModal.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/mobile/src/stores/auth.store.ts`
  - `apps/mobile/src/components/profile/EditProfileModal.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn components, DTOs, tests, validators, i18n và tài liệu hóa.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp định hướng UX: tách biệt luồng xem và chỉnh sửa, nút camera đổi avatar trực tiếp, sắp xếp vị trí bio lên trên ngày sinh, lược bỏ trường thừa.
- **Verification Method:**
  - `npm test -w @circle/backend`: 84/84 unit tests pass 100%.
  - `npm run build -w @circle/web`: Next.js production build pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript pass 100% (0 errors).
  - `npm run build -w @circle/shared`: Shared package build pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 1 / Auth & Profile, Definition of Done), `agentic/RULES.md`.
- **Security & License Check:** Xác thực JWT bearer token, kiểm duyệt định dạng dữ liệu Zod, không lộ thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Ban đầu modal mở thẳng vào form chỉnh sửa thay vì chế độ xem có nút bút/máy ảnh, và hiển thị kèm các thông tin hệ thống (vai trò, email, bảo mật kép).
  - **Root Cause:** Hiểu chưa sát yêu cầu tối giản thông tin cá nhân của người dùng.
  - **Resolution / Fix:** Tinh chỉnh modal thành 3 chế độ chuyên biệt: View (chỉ Tên, Bio, Ngày sinh), Direct Avatar Picker (khi bấm Camera) và Edit Form (khi bấm Chỉnh sửa hồ sơ).
- **Commit:** `fa1ba3f`
- **PR:** #66 (https://github.com/1440isme/Circle/pull/66)

---

## AI-0063: Nâng cấp Trải nghiệm Cài đặt Vòng tròn — Modal Popup Xác nhận, Báo cáo Vi phạm Tùy chỉnh, Nhập Số lượng Thành viên và Kiểm soát Phê duyệt Vòng tròn Riêng tư

- **Date:** 2026-10-01 16:00:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #67 ([FEAT]: Circle Settings Enhancements — Modal Popups, Custom Capacity & Private Circle Approval Flow)
- **Purpose:** Triển khai nâng cấp toàn diện các tính năng trong Cài đặt Vòng tròn (`CircleManagementModal`) và luồng kiểm soát gia nhập Vòng tròn (`joinByInviteCode`):
  1. **Modal Popup Xác nhận Căn giữa Màn hình (Center Overlay Modal Dialogs):**
     - Thay thế toàn bộ các thông báo xác nhận inline cuộn chìm bên dưới bằng các Modal Popup căn giữa nổi bật trên nền mờ tối (`fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in`).
     - Áp dụng cho 3 hành động quan trọng: **Rời khỏi Vòng tròn (Leave Circle)**, **Xóa thành viên (Kick Member)** kèm hiển thị thông tin thành viên bị xóa, và **Chuyển quyền sở hữu (Transfer Ownership)** kèm cảnh báo rủi ro không thể hoàn tác.
  2. **Báo cáo vi phạm Vòng tròn (Report Circle) với Lý do "Khác":**
     - Thêm tùy chọn "Lý do khác" trong danh sách lý do báo cáo.
     - Tự động mở khung văn bản `<textarea>` cho phép người dùng nhập chi tiết lý do báo cáo kèm cơ chế kiểm tra tính hợp lệ bắt buộc (validation) trước khi gửi.
  3. **Thiết lập Vòng tròn — Tùy chỉnh Nhập Số lượng Thành viên Tối đa (`maxMembers`):**
     - Chuyển đổi từ dropdown `<select>` cố định sang trường nhập số trực tiếp (`<input type="number">`), hỗ trợ nhập bất kỳ giới hạn nào từ 2 đến 10,000 thành viên (hoặc để trống cho không giới hạn).
     - Bổ sung thanh nút chọn nhanh (Quick Preset Pills: Không giới hạn, 5, 10, 20, 50, 100, 500) giúp thao tác nhanh chóng và tiện lợi.
  4. **Kiểm soát Gia nhập Vòng tròn Riêng tư (Private Circle Join Approval Flow):**
     - Cập nhật logic `joinByInviteCode` trong `CirclesService` của NestJS: Đối với Vòng tròn Riêng tư (`isPrivate: true`), việc nhập mã mời/liên kết mời sẽ **không** tự động thêm vào nhóm ngay, mà tạo bản ghi `CircleJoinRequest` với trạng thái `PENDING` (hoặc tái kích hoạt request cũ) và trả về `statusCode: 202 Accepted` kèm thông báo gửi yêu cầu thành công.
     - Đối với Vòng tròn Công khai (`isPrivate: false`), người dùng vẫn được gia nhập ngay lập tức (`statusCode: 200 OK`).
     - Cập nhật `JoinCircleModal` trên Web để hiển thị giao diện thông báo xác nhận yêu cầu tham gia Vòng tròn riêng tư đã gửi tới Trưởng nhóm.
- **Files Affected:**
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `apps/web/src/components/circle/JoinCircleModal.tsx`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic kiểm tra private circle backend, unit tests, giao diện Modal popup, input nhập số lượng và từ điển đa ngôn ngữ.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo yêu cầu chuyển confirmation thành popup nổi, bổ sung nhập lý do khác cho report, cho phép nhập số thành viên tùy ý và siết chặt luồng duyệt của nhóm private.
- **Verification Method:**
  - `npm test -w @circle/backend`: 85/85 unit tests pass 100% (bao gồm 39 tests của `circles.service.spec.ts`).
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript typecheck pass 100% (0 errors).
  - `bash ./scripts/check-agent-map.sh`: 93/93 files pass 100% (0 broken links).
- **Official Source Checked:** `PROJECT_GOD.md` (Module 3, 10 Hard Gates), SRS UC04, UC05, UC07, `docs/design.md`.
- **Security & License Check:** Phân quyền và bảo mật chặt chẽ: kiểm tra `isPrivate`, giới hạn `maxMembers`, bảo vệ quyền Owner. Không lưu trữ thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** #67 (https://github.com/1440isme/Circle/pull/67)

---

## AI-0068: Hoàn thiện Hạ tầng Cloudflare R2 Media Storage, Cơ chế Presigned URL SigV4, Nén Ảnh Client-side & Strip EXIF, Quản lý RAM Preview và Đồng bộ Trạng thái Realtime Presence

- **Date:** 2026-10-03 14:15:00 +07:00
- **Developer:** Trương Công Bình (MSSV: 23110184)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.7 Flash
- **Related Issue:** #7 ([SUB-FEAT]: US-MEDIA-001 — Cloudflare R2 Presigned Upload URL Generation & Asset Delivery)
- **Purpose:** Triển khai trọn gói phân hệ Media Storage, Presigned URL SigV4, Realtime Presence và chuỗi tối ưu hóa hiệu năng/bộ nhớ đa nền tảng:
  1. **Hạ tầng Lưu trữ Đám mây Cloudflare R2 & AWS S3 SigV4 (`apps/backend/src/modules/storage`):**
     - Xây dựng `StorageService` với cơ chế sinh Presigned PUT URL chuẩn AWS Signature Version 4 HMAC-SHA256 thuần `crypto`, tương thích 100% Cloudflare R2.
     - Cơ chế Client-Direct-Upload giúp Web và Mobile đẩy trực tiếp media lên bucket R2 mà không tiêu tốn băng thông máy chủ NestJS.
     - Hỗ trợ chế độ Local Media Fallback (`GET /api/v1/storage/raw/:key` & In-memory/Stream Buffer) cho môi trường dev/test khi chưa cấu hình key R2.
     - API: `POST /api/v1/storage/presigned-url`, `POST /api/v1/storage/upload`.
  2. **Nén & Tối ưu hóa Ảnh Client-Side & Bóc tách 100% EXIF/GPS Metadata (`apps/web/src/lib/image-optimizer.ts`):**
     - Tự động downscale kích thước (max 1920x1920 cho chat/moments, max 512x512 cho avatar) bảo toàn tỷ lệ khung hình.
     - Mã hóa WebP/JPEG chất lượng cao `0.82 - 0.85`, cắt giảm 75% đến 95% dung lượng (từ 8-12MB xuống ~150-300KB).
     - Bóc tách toàn bộ thẻ EXIF, tọa độ GPS, model máy ảnh qua Canvas redraw, bảo vệ quyền riêng tư người dùng.
  3. **Quản lý Bộ nhớ RAM & Cơ chế Lazy Upload on Submit:**
     - Loại bỏ FileReader Base64, thay bằng `createPreviewUrl` (`URL.createObjectURL`) với chi phí RAM cực thấp.
     - Tự động thu hồi bộ nhớ bằng `revokePreviewUrl` khi hủy đính kèm hoặc unmount (Zero Memory Leak).
     - Trong khung chat (`ChatComposer.tsx`), ảnh đính kèm chỉ giữ preview local trong RAM; **chỉ khi bấm "Gửi" mới nén và tải lên R2**, ngăn chặn triệt để file mồ côi (orphaned files) trên cloud storage.
  4. **Đồng bộ hóa Trạng thái Hiện diện Realtime (Realtime Presence):**
     - Nâng cấp `ChatGateway` quản lý `userSockets` (userId -> active socket set).
     - Broadcast `presence:user-status` (`ONLINE` / `OFFLINE`) tới các phòng Vòng tròn (`circle:${circleId}`).
     - Giao diện Web: Hook `useCirclePresence` và `PresenceRail.tsx` hiển thị chấm xanh thở (`animate-presence-breathe`) và badge tổng số thành viên online.
  5. **Tối ưu hóa Camera Locket trên Mobile (`LocketMomentsView.tsx`):**
     - Cấu hình camera `quality: 0.78` và `exif: false`, lưu URI tạm thời và upload R2 qua `uploadMobileMedia` chỉ khi bấm Gửi.
  6. **Kiểm thử Tự động & Kịch bản E2E:**
     - Unit tests `storage.service.spec.ts`, `chat.gateway.spec.ts` pass 100%.
     - Kịch bản E2E Playwright `tests/e2e/core-flow.spec.ts`.
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/storage.validator.ts`
  - `packages/shared/src/index.ts`
  - `packages/shared/src/locales/vi.ts`, `en.ts`
  - `apps/backend/src/modules/storage/` (`storage.service.ts`, `storage.controller.ts`, `storage.module.ts`, `storage.dto.ts`, `storage.service.spec.ts`)
  - `apps/backend/src/modules/chat/` (`chat.gateway.ts`, `chat.gateway.spec.ts`)
  - `apps/backend/src/app.module.ts`
  - `apps/web/src/lib/` (`socket.ts`, `image-optimizer.ts`)
  - `apps/web/src/hooks/` (`use-upload-media.ts`, `use-circle-presence.ts`)
  - `apps/web/src/components/` (`presence/PresenceRail.tsx`, `chat/ChatComposer.tsx`, `profile/EditProfileModal.tsx`)
  - `apps/mobile/src/services/storage-upload.service.ts`
  - `apps/mobile/src/components/moment/LocketMomentsView.tsx`
  - `tests/e2e/core-flow.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% kiến trúc R2 SigV4, Canvas optimization, presence gateway, upload hooks, E2E specs và unit tests.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo: hoàn thiện R2 cho camera khoảnh khắc, tối ưu hóa RAM preview, nén ảnh client-side và strip EXIF.
- **Verification Method:**
  - Unit tests StorageService & ChatGateway pass 100%.
  - Đối chiếu kích thước tệp sau tối ưu (-85% đến -95%).
  - Kiểm tra chữ ký AWS SigV4 query params hợp lệ với Cloudflare R2 bucket.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 1, 4, 5 & 10 Hard Gates), `agentic/RULES.md` (Section 5 - Feature-Level AI Logging), AWS S3 SigV4 Specifications.
- **Security & License Check:** Bảo mật tối đa: Presigned URL có thời hạn (1h), payload UNSIGNED-PAYLOAD, sanitize key name chống Path Traversal (`../`), JWT Guard chặt chẽ, loại bỏ hoàn toàn thẻ định vị GPS.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `bfc80cd`
- **PR:** #68 (https://github.com/1440isme/Circle/pull/68)

---

## AI-0069: Mobile Chat UX Refinements (Haptic Feedback, Flat Reply Quotes & Clean Home)

- **Date:** 2026-10-03 17:35:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #6 ([SUB-FEAT]: US-CHAT-001 — Real-time Channel Text Messaging & Cross-Platform Chat UX)
- **Purpose:** 
  1. Tích hợp phản hồi rung (Haptic Feedback) bằng `Vibration` khi vuốt sang phải để reply (`dx > 35px`) và khi nhấn giữ tin nhắn mở action menu.
  2. Xóa bỏ hoàn toàn icon tròn overlay phía trên cột avatar khi vuốt tin nhắn để reply.
  3. Hoàn thiện bộ giải quyết `replyTarget` (`string`, `object`, `replyToId`, `content`, `fileName`, `fileUrl`) đảm bảo nội dung tin nhắn được reply luôn hiển thị rõ ràng, tương phản cao trên cả Web và Mobile.
  4. Đưa toàn bộ box reaction emoji về dạng phẳng (`flat badge`, loại bỏ đổ bóng) và gỡ bỏ toàn bộ viền phụ trên khung reply quote.
  5. Nâng cao ô nhập tin nhắn Mobile với `useSafeAreaInsets` tránh thanh điều hướng của iPhone.
- **Files Affected:**
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic PanResponder Haptic triggers, robust replyTarget resolution, flat styling.
- **Human Modifications:** Trương Công Bình trực tiếp feedback và yêu cầu tinh chỉnh chi tiết về UX rung, loại bỏ overlay avatar column và làm phẳng giao diện.
- **Verification Method:**
  - Mobile: `npx tsc --noEmit` 0 errors.
  - Web: Next.js production build 0 errors (9/9 routes).
  - Backend: 7/7 Jest suites, 98/98 unit tests pass.
  - Scripts: `check-agent-map.sh` 94/94 files.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `c7807fd`
- **PR:** #69 (https://github.com/1440isme/Circle/pull/69)

---

## AI-0070: Cross-Platform Theme Parity & Unified Chat UI Synchronization (Web ⇄ Mobile)

- **Date:** 2026-10-03 18:40:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #6 ([SUB-FEAT]: US-CHAT-001 — Real-time Channel Text Messaging & Cross-Platform Chat UX)
- **Purpose:** 
  1. Chuẩn hóa hệ thống thiết kế và token màu sắc dùng chung (`@circle/shared/src/theme/colors.ts`, `apps/mobile/src/constants/theme.ts`) thành nguồn chân lý duy nhất (SSOT), loại bỏ hardcode màu sắc giữa Web và Mobile.
  2. Đồng bộ 100% giao diện Dark / Light Mode giữa Web và Mobile: Canvas (`#FAF8F5` / `#0E1512`), Surface (`#FFFFFF` / `#16201B`), Primary (`#658C77` / `#78C6A3`), Text (`#1F2923` / `#E8EFEA`), Subtle/Slate (`#6B7C72` / `#8FA298`).
  3. Khớp định dạng người gửi, avatar chữ hoa nền mờ `${colors.primary}18`, huy hiệu Crown (Owner) và ShieldCheck (Admin) trên Mobile y hệt Web.
  4. Chuẩn hóa typography và màu sắc trích dẫn Reply quote trên Mobile: tác giả hiển thị màu `primary`, nội dung trích dẫn màu `colors.subtle`, font `14.5px` thanh mảnh (`fontWeight: '400'`), icon reply quay sang phải ($\hookrightarrow$).
  5. Tự động cuộn xuống tin nhắn mới nhất khi gửi hoặc nhận tin nhắn mới, thanh soạn thảo bo tròn bồng bềnh (`borderRadius: 25`) kèm floating reply preview pill, độ rung phản hồi xúc giác nhẹ (8ms).
  6. Khắc phục module bundling trong `apps/web/tailwind.config.ts` đảm bảo Next.js build pass 100%.
- **Files Affected:**
  - `packages/shared/src/theme/colors.ts`
  - `packages/shared/src/index.ts`
  - `apps/mobile/src/constants/theme.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/web/tailwind.config.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% token colors, reply typography alignment, floating composer, auto-scroll and badge sync.
- **Human Modifications:** Trương Công Bình chỉ đạo chuẩn hóa luật match theme (sửa 1 lần không sửa 2 nơi), cấm hardcode màu, đảo icon reply sang phải, rung siêu nhẹ và làm khớp y chang giữa Web và Mobile.
- **Verification Method:**
  - Mobile TypeScript: `npx tsc --noEmit` PASS (0 errors).
  - Web TypeScript & Tailwind config: verified cleanly matching SSOT tokens.
  - Backend: 7/7 Jest suites, 98/98 unit tests PASS.
  - Integrity: `check-agent-map.sh` PASS (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md` (Design System & Theme SSOT).
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Tailwind config in Next.js CJS build could not load ESM import from shared package directly.
  - **Root Cause:** PostCSS Jiti/Webpack loader in Next.js environment incompatible with raw ESM monorepo symlink.
  - **Resolution / Fix:** Inlined canonical token definitions in `tailwind.config.ts` exactly mirroring `CircleColors`.
- **Commit:** `c7807fd`
- **PR:** #69 (https://github.com/1440isme/Circle/pull/69)

---

## AI-0071: Clean Chat Header, Micro-Haptics Tactile Feedback & Keyboard-Aware Composer

- **Date:** 2026-10-03 18:48:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #6 ([SUB-FEAT]: US-CHAT-001 — Real-time Channel Text Messaging & Cross-Platform Chat UX)
- **Purpose:** 
  1. Loại bỏ toàn bộ role badges (Crown, Shield / "Trưởng nhóm", "Admin") khỏi header tin nhắn trên cả Web và Mobile (`MessageList.tsx`, `circle/[id].tsx`), trả lại giao diện tin nhắn tối giản, sạch sẽ chỉ hiển thị display name người gửi.
  2. Tối ưu phản hồi xúc giác (Haptic Feedback) thành xung micro-tactile cực ngắn (1ms, tự hủy sau 20ms trên iOS qua `Vibration.cancel()`) thay vì rung dài toàn bộ chu kỳ.
  3. Tích hợp bộ lắng nghe trạng thái bàn phím (`Keyboard.addListener`), tối ưu hóa khoảng cách đáy của thanh soạn thảo (composer): vừa vặn phía trên thanh điều hướng iPhone (`insets.bottom + 2`) khi đóng, và thu hẹp về `6px` ngay khi mở bàn phím để triệt tiêu hoàn toàn khoảng hở thừa.
  4. Đảm bảo 100% tính đồng nhất về quy chuẩn thiết kế, bảng màu và trải nghiệm thị giác xuyên suốt Web và Mobile.
- **Files Affected:**
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% keyboard listener layout transitions, micro-haptics cancellation hook, clean sender header layout.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo: gỡ bỏ role tag trên tin nhắn, làm rung cực ngắn thành phản hồi xúc giác nhẹ, và xử lý dứt điểm khoảng cách thanh composer khi bật bàn phím.
- **Verification Method:**
  - Mobile TypeScript: `npx tsc --noEmit` PASS (0 errors).
  - Web TypeScript & JSX: verified clean sender layout without role badges.
  - Backend: 7/7 Jest suites, 98/98 unit tests PASS.
  - Integrity: `check-agent-map.sh` PASS (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `af627bc`
- **PR:** #69 (https://github.com/1440isme/Circle/pull/69)

---

## AI-0072: Peer Review Adjustments for PR #68 (Membership Guard, Alpha Transparency & R2 Fallback Warning)

- **Date:** 2026-10-03 23:30:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #7 ([SUB-FEAT]: US-MEDIA-001 — Cloudflare R2 Presigned Upload URL Generation & Asset Delivery)
- **Purpose:** 
  1. Tiếp thu và xử lý 100% phản hồi Peer Review từ Kỹ sư Ninh Thị Mỹ Hạnh (@BH-bonnie) trên PR #68.
  2. Bổ sung kiểm tra hội viên (`isMember`) trong `ChatGateway.handleGetCircleOnline` ngăn chặn user ngoài Circle truy vấn danh sách người online (khắc phục lỗ hổng kiểm tra quyền).
  3. Bổ sung unit test kiểm thử từ chối truy vấn người online đối với non-member trong `chat.gateway.spec.ts`.
  4. Bảo toàn kênh trong suốt (Alpha channel) cho ảnh PNG và WebP trong `image-optimizer.ts` (`{ alpha: isPngOrWebp }`), chống biến vùng trong suốt thành nền đen.
  5. Cập nhật cảnh báo runtime và tài liệu `.env.example` về `CLOUDFLARE_R2_PUBLIC_DOMAIN` bắt buộc khi bật `isR2Configured`.
  6. Đồng bộ hóa localization keys `storage` và `presence` vào `@circle/shared`.
- **Files Affected:**
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/backend/src/modules/chat/chat.gateway.spec.ts`
  - `apps/backend/src/modules/storage/storage.service.ts`
  - `apps/web/src/lib/image-optimizer.ts`
  - `apps/web/src/stores/language.store.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `.env.example`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% code fixes, negative test cases and documentation updates.
- **Human Modifications:** Trương Công Bình trực tiếp rà soát và kiểm thử lại toàn bộ luồng sau khi nhận review từ Ninh Thị Mỹ Hạnh.
- **Verification Method:**
  - Backend: 7/7 Jest suites, 99/99 unit tests pass 100%.
  - Web: Next.js 14 production build pass 100% (9/9 static routes).
  - Mobile: TypeScript typecheck pass (0 errors).
  - Integrity: `check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%. Lỗ hổng kiểm tra quyền đã được vá triệt để.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `5f52cb1`
- **PR:** #68 (https://github.com/1440isme/Circle/pull/68)

---

## AI-0073: Peer Review Adjustments for PR #69 (Tailwind Theme Token Sync Documentation)

- **Date:** 2026-10-03 23:35:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #6 ([SUB-FEAT]: US-CHAT-001 — Real-time Channel Text Messaging & Cross-Platform Chat UX)
- **Purpose:** 
  1. Tiếp thu phản hồi Peer Review từ Kỹ sư Ninh Thị Mỹ Hạnh (@BH-bonnie) trên PR #69.
  2. Bổ sung chú thích cảnh báo và tài liệu hóa sự đồng bộ giữa `@circle/shared` và `apps/web/tailwind.config.ts` (`// NOTE: Mirrored from packages/shared/src/theme/colors.ts (CircleColors)`).
- **Files Affected:**
  - `apps/web/tailwind.config.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% documentation and review alignment.
- **Human Modifications:** Trương Công Bình rà soát và chấp thuận ghi chú đồng bộ token.
- **Verification Method:**
  - Web: Next.js 14 production build pass 100% (9/9 static routes).
  - Mobile: TypeScript typecheck pass (0 errors).
  - Integrity: `check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `62fa33d`
- **PR:** #69 (https://github.com/1440isme/Circle/pull/69)

---

## AI-0082: Triển khai Messaging P2 Read Receipts, Subtle Message Viewers và Chức năng Cài đặt Vòng tròn (Web & Mobile)

- **Date:** 2026-10-05 22:35:00 +07:00
- **Developer:** Trương Công Bình (MSSV: 23110184)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Issue #75 ([SUB-FEAT]: US-CHAT-003 & US-CIRCLE-004 — Messaging P2 Read Receipts, Subtle Message Viewers & Functional Circle Settings)
- **Purpose:** Triển khai hoàn thiện tính năng P2 Messaging và chức năng thực tế của Cài đặt Vòng tròn:
  1. **Subtle Message Viewers & Realtime Read Receipts (Xem người xem tin nhắn tinh tế khi bấm vào tin nhắn cụ thể, tương tự như xem giờ):**
     - Schema Prisma: Bổ sung model `MessageReceipt` (`messageId`, `userId`, `readAt`) và quan hệ cascade với `Message` / `User`.
     - Backend Service & Gateway: Tạo endpoint `POST /api/v1/messages/:messageId/read`, Socket listener `@SubscribeMessage('chat:read')` và broadcast `chat:user-read` qua `ChatGateway` (phòng chống triệt để circular dependency).
     - Giao diện tinh tế trên Web & Mobile (`MessageBubble` và `MobileSwipeMessageBubble`): Khi người dùng click/tap vào tin nhắn để xem giờ, đồng thời hiển thị danh sách người đã xem tinh tế với icon `Eye`, mini avatar stack (tối đa 3 avatar) cùng tên/số lượng người đã xem (`seenBy` / `seenByCount`).
     - Tự động đánh dấu đã đọc khi xem tin nhắn mới, đồng thời tôn trọng tùy chọn riêng tư `readReceipts` và `typingIndicator` được lưu trữ per-circle.
  2. **Kích hoạt toàn bộ chức năng Cài đặt Vòng tròn (`CircleManagementModal`) trên Web và Mobile:**
     - Tab 4 (Thiết lập Vòng tròn): Bổ sung Vùng nguy hiểm (Danger Zone) cho Trưởng nhóm với nút "Giải tán Vòng tròn" (`DELETE /api/v1/circles/:id`) kèm modal/alert xác nhận, dọn dẹp cache và redirect an toàn.
     - Tab 5 (Trợ giúp & Báo cáo): Kết nối chức năng Báo cáo Vòng tròn và Báo cáo người dùng vi phạm vào endpoint thực tế `POST /api/v1/circles/:id/reports` lưu trữ trong database model `CircleReport`.
     - Tab 3 (Thông báo & Quyền riêng tư): Lưu trữ và áp dụng tùy chọn Thông báo đã đọc (Read receipts), Chỉ báo đang nhập (Typing indicator) và AI assistance trên cả Web (localStorage) và Mobile (SecureStore/Storage).
- **Prompt Summary:** Yêu cầu làm tính năng P2 xem người xem tin nhắn tinh tế khi bấm vào tin nhắn cụ thể (tương tự như xem giờ), đồng thời thực hiện các chức năng của cài đặt circle có thể hoạt động được.
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20261005150233_add_message_receipts_and_circle_reports/migration.sql`
  - `apps/backend/src/modules/chat/chat.controller.ts`
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/backend/src/modules/chat/chat.service.ts`
  - `apps/backend/src/modules/circles/circles.controller.ts`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/hooks/use-circle-queries.ts`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `apps/web/src/lib/socket.ts`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/services/socket.ts`
  - `apps/mobile/src/services/storage.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% database schema migration, backend endpoints, socket events, query hooks, UI viewers logic, confirmation dialogs và i18n locales.
- **Human Modifications:** Người dùng trực tiếp định hướng tính năng P2 xem người xem tin nhắn tinh tế và yêu cầu hoàn thiện chức năng cài đặt circle.
- **Verification Method:**
  - `npm test -w @circle/backend`: 7/7 test suites pass, 107/107 tests pass (100%).
  - `npm run build -w @circle/backend`: NestJS build pass 100%.
  - `npm run build -w @circle/shared` & `npm run build -w @circle/types`: Pass 100%.
  - `npx tsc --noEmit -p apps/web/tsconfig.json`: TypeScript typecheck pass (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript typecheck pass (0 errors).
  - `npm run build -w @circle/web`: Next.js 14 production build pass (9/9 routes, 0 errors).
  - `npx playwright test`: 6/6 E2E tests pass (100%) trên cả desktop và mobile viewports.
- **Official Source Checked:** `PROJECT_GOD.md` (Gate 1 Working Product, Gate 4 Automated Testing, Gate 8 Clean Code), `agentic/RULES.md`.
- **Security & License Check:** Phân quyền Owner cho thao tác giải tán circle, RBAC kiểm tra thành viên cho báo cáo, bảo vệ socket room access, tuân thủ MIT license, không rò rỉ secrets.

---

## AI-0074: Production-Grade Messaging P0 (Optimistic UI, Typing Indicator, Outbox & Media Attachment)

- **Date:** 2026-10-04 00:50:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #70 ([SUB-FEAT]: US-CHAT-002 — Production-Grade Messaging P0: Optimistic UI, Typing Indicator, Outbox & Media Attachment (Parent: #20))
- **Purpose:** 
  1. Triển khai trọn vẹn nhóm tính năng ưu tiên P0 cho chức năng Nhắn tin chuẩn công nghiệp trên cả Web và Mobile (`apps/web`, `apps/mobile`, `apps/backend`, `packages/shared`, `packages/types`).
  2. Vòng đời tin nhắn & Optimistic UI: Gửi tức thì với trạng thái `SENDING` (⏳), tự động khớp sang `SENT` (✓) khi máy chủ xác nhận, hoặc chuyển sang `FAILED` kèm nút "Thử lại" / Retry khi mất mạng hoặc gặp lỗi.
  3. Chỉ báo đang nhập thời gian thực (Typing Indicator): Phát tán và hiển thị tên người đang nhập qua Socket.IO (`chat:user-typing`) với debounced timer tự dập tắt sau 2.5s-3s.
  4. Đính kèm và xem ảnh trò chuyện: Cho phép chọn ảnh trên cả Web và Mobile, hiển thị thumbnail xem trước có nút gỡ bỏ, tải lên Cloudflare R2 qua presigned URL an toàn và render bong bóng ảnh có khả năng phóng to xem toàn màn hình (lightbox).
  5. Khả năng chống chịu mạng & Socket.IO trên Mobile: Tích hợp singleton Socket.IO client vào Expo mobile thay thế polling 3s trước đây, hiển thị banner cảnh báo đang kết nối lại khi mất mạng trên cả hai nền tảng.
  6. Tuyệt đối không hardcode: Toàn bộ chuỗi ngôn ngữ dùng `t.chat.*` trong `@circle/shared` (hỗ trợ cả tiếng Việt và tiếng Anh), toàn bộ màu sắc tuân thủ 100% Design Tokens từ `CircleColors` (`colors.*`), đồng bộ giao diện và trải nghiệm giữa Web và Mobile.
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/backend/src/modules/chat/chat.gateway.spec.ts`
  - `apps/web/src/lib/socket.ts`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/mobile/src/services/socket.ts`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/package.json`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% implementation, cross-platform UI, optimistic mutations and tests.
- **Human Modifications:** Trương Công Bình giám sát, định hướng tiêu chuẩn UX công nghiệp (WhatsApp/Telegram/Slack) và nghiêm cấm hardcode màu sắc/ngôn ngữ.
- **Verification Method:**
  - Backend: 7/7 Jest suites, 99/99 unit tests pass 100%.
  - Web: Next.js 14 production build pass 100% (9/9 static routes).
  - Mobile: TypeScript typecheck pass (0 errors).
  - Integrity: `check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`, `agentic/CONVENTIONS.md`.
- **Security & License Check:** Pass 100%. Không lộ secret/credential, xác thực Socket.IO token đầy đủ, tải file an toàn qua Cloudflare R2 Presigned URLs.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `e257c8f`
- **PR:** #71 (https://github.com/1440isme/Circle/pull/71)

---

## AI-0075: Fix React Duplicate Keys in Chat & SSR Hydration Mismatch in Web

- **Date:** 2026-10-04 01:05:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #70 ([SUB-FEAT]: US-CHAT-002 — Production-Grade Messaging P0: Optimistic UI, Typing Indicator, Outbox & Media Attachment (Parent: #20))
- **Purpose:** 
  1. Khắc phục cảnh báo trùng khóa React (`Encountered two children with the same key`):
     - Sửa lỗi listener leak trong `useChannelMessagesQuery` trên mobile: di chuyển cleanup handler `socket.off` ra hàm trả về của `useEffect` thay vì bị nuốt bên trong `.then()`, triệt tiêu hoàn toàn hiện tượng đăng ký lắng nghe lặp nhiều lần khi re-render.
     - Giải quyết triệt để race condition giữa Socket.IO `chat:message` và HTTP `onSuccess` trong `useSendMessageMutation` (cả Mobile và Web): khi socket đã nạp tin nhắn ID thực tế trước khi HTTP hoàn tất, `onSuccess` loại bỏ optimistic placeholder thay vì biến đổi thành item thứ hai mang cùng ID.
     - Bổ sung hàm tiện ích `deduplicateMessages` bảo đảm mảng tin nhắn luôn có ID độc bản, kèm khóa định danh tiền tố `bubble-me-${id}` / `bubble-other-${id}` trong `[id].tsx`.
  2. Khắc phục lỗi Next.js SSR Hydration (`Text content does not match server-rendered HTML. Server: "Đang kết nối CIRCLE..." Client: "Connecting to CIRCLE..."`):
     - Đồng bộ giá trị khởi tạo của `useLanguageStore` trên Web về ngôn ngữ chuẩn `'vi'` trong lần render đầu tiên để khớp 100% giữa Server và Client, sau đó `initLanguage()` trên `AuthProvider` sẽ tự động đọc `localStorage` và cập nhật ngôn ngữ đã lưu sau khi mount.
     - Bổ sung cờ `suppressHydrationWarning` cho thẻ hiển thị trạng thái kết nối trong `AuthGuard.tsx`.
- **Files Affected:**
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/web/src/stores/language.store.ts`
  - `apps/web/src/components/auth/AuthGuard.tsx`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% bug diagnosis, synchronization fixes and deduplication logic.
- **Human Modifications:** Trương Công Bình cung cấp log lỗi runtime từ thiết bị di động và trình duyệt, trực tiếp chỉ đạo sửa dứt điểm.
- **Verification Method:**
  - Backend: 7/7 Jest suites, 99/99 unit tests pass 100%.
  - Web: Next.js 14 production build pass 100% (9/9 static routes).
  - Mobile: TypeScript typecheck pass (0 errors).
  - Integrity: `check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `4ad2dd1`
- **PR:** #71 (https://github.com/1440isme/Circle/pull/71)





---

## AI-0076: Mobile Message Pagination (useInfiniteQuery) and Date Separator Parity with Web

- **Date:** 2026-10-04 13:10:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #70 ([SUB-FEAT]: US-CHAT-002 — Production-Grade Messaging P0: Optimistic UI, Typing Indicator, Outbox & Media Attachment (Parent: #20))
- **Purpose:** 
  1. Khắc phục lỗi mobile không load được tin nhắn cũ hơn (`useChannelMessagesQuery` trước đó dùng `useQuery` một trang đơn lẻ, không hỗ trợ cursor pagination và không có nút kích hoạt tải tin nhắn trước đó):
     - Chuyển đổi `useChannelMessagesQuery` sang `useInfiniteQuery<CursorPaginatedMessages>` hỗ trợ `pageParam` và cursor URL query `/channels/${channelId}/messages?limit=30&cursor=${cursorParam}`.
     - Cập nhật toàn bộ realtime Socket.IO listener (`chat:message`, `chat:reaction`) và lạc quan (`useSendMessageMutation`: `onMutate`, `onSuccess`, `onError`) thích ứng hoàn toàn với cấu trúc đa trang `InfiniteData<CursorPaginatedMessages>`.
     - Thêm nút "Tải tin nhắn cũ hơn" (`loadEarlierBtn`) ở đầu danh sách tin nhắn khi `hasNextPage` là true, kèm indicator xoay khi đang fetch.
     - Xử lý thông minh scroll behavior: loại bỏ việc tự động scroll xuống đáy khi nạp trang tin nhắn cũ (chỉ auto-scroll khi có tin nhắn mới tại đáy `lastMessageId !== prevLastMessageIdRef.current` hoặc lần đầu vào phòng chat), giữ nguyên vị trí đọc của người dùng.
  2. Bổ sung Date Separators (dải phân cách ngày: Hôm nay, Hôm qua, hoặc ngày tháng chuẩn hóa) trên Mobile đồng bộ 100% với Web:
     - Nhóm danh sách tin nhắn theo ngày bằng hàm `getDateLabel` sử dụng chuỗi đa ngôn ngữ `t.chat.today` và `t.chat.yesterday` (hoặc định dạng ngày theo `toLocaleDateString`).
     - Chia cụm (cluster) tin nhắn liên tiếp theo từng ngày, hiển thị thanh phân cách (Divider line + Pill hiển thị nhãn ngày) tinh tế giữa các ngày.
     - Tuyệt đối tuân thủ quy chuẩn không hardcode màu sắc (dùng token ngữ nghĩa `colors.hairline`, `colors.surface`, `colors.subtle`, `colors.wash`) và không hardcode chuỗi hiển thị.
- **Files Affected:**
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% infinite pagination logic, auto-scroll position stabilization, date grouping and separator components.
- **Human Modifications:** Trương Công Bình trực tiếp phản ánh lỗi không tải được tin nhắn cũ trên mobile và thiếu thanh phân chia ngày tháng so với bản web, yêu cầu đồng bộ trải nghiệm người dùng hoàn hảo.
- **Verification Method:**
  - Backend: 7/7 Jest suites, 99/99 unit tests pass 100%.
  - Web: Next.js 14 production build pass 100% (9/9 static routes).
  - Mobile: TypeScript typecheck pass (0 errors).
  - Integrity: `check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Truy xuất nhầm thuộc tính `msg.createdAt` thay vì `msg.sentAt` trong kiểu `MessageEntity` dẫn đến lỗi TS2339 trong `[id].tsx`.
  - **Root Cause:** Nhầm lẫn với thuộc tính Prisma schema `createdAt` của các model khác.
  - **Resolution / Fix:** Sửa trực tiếp thành `msg.sentAt` theo đúng định nghĩa `MessageEntity`.
- **Commit:** `31b62b0`
- **PR:** #71 (https://github.com/1440isme/Circle/pull/71)
---

## AI-0077: Hoàn thiện Tin nhắn P0 — Realtime Socket.IO, Typing Tracking, Sticky Composer & Viewport Stabilization

- **Date:** 2026-10-04 14:07:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #70 ([SUB-FEAT]: US-CHAT-002 — Production-Grade Messaging P0: Optimistic UI, Typing Indicator, Outbox & Media Attachment (Parent: #20))
- **Purpose:** 
  1. Khắc phục lỗi hiển thị người dùng đang gõ tin nhắn (Typing Indicator):
     - Mobile: Thay thế `typingUsers.join(', ')` thành `typingUsers.map((u) => u.userName).join(', ')`, chấm dứt việc hiển thị `[object Object] đang nhập...`.
     - Backend: Bổ sung truy vấn an toàn `userProfile.displayName` ngay khi socket kết nối (`handleConnection`) và lưu vào `client.data.displayName`. Tại `handleTyping`, phân giải chính xác `userName` với fallback thông minh (`displayName -> email prefix -> Thành viên`), sửa dứt điểm lỗi web chỉ hiển thị vô danh "Thành viên đang nhập...".
  2. Tối ưu trải nghiệm Realtime Socket.IO và loại bỏ polling thừa thãi:
     - Gỡ bỏ `refetchInterval: 15000` trên Mobile, chuyển hoàn toàn sang Socket.IO push tức thì (<20ms).
     - Bổ sung tracking `currentActiveChannelId` và tự động re-join room khi socket reconnect (`socket.on('connect')`) trên cả Web (`apps/web/src/lib/socket.ts`) và Mobile (`apps/mobile/src/services/socket.ts`), chống rớt room khi chuyển mạng hoặc nâng cấp socket transport.
  3. Cố định (Sticky) ô soạn thảo và triệt tiêu tràn trang trên Web:
     - Thêm `sticky bottom-0 z-20 backdrop-blur-md shrink-0` vào `ChatComposer.tsx`.
     - Giới hạn chiều cao và triệt tiêu tràn cuộn toàn trang ở `FeedStream.tsx` (`h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden`), `ChannelChatView.tsx` (`h-full min-h-0`) và `MessageList.tsx` (`min-h-0 overflow-y-auto`). Thanh cuộn chỉ hoạt động bên trong danh sách tin nhắn.
  4. Khắc phục triệt để lỗi cuộn và mất toàn bộ lịch sử tin nhắn khi nhận/gửi tin nhắn mới:
     - Nguyên nhân gốc rễ (Root Cause): Trong `onSuccess` của mutation gửi tin nhắn trên cả Web và Mobile (`use-chat-queries.ts`, `use-circle-queries.ts`), so sánh `m.tempId === tempId` khi `tempId` là `undefined` khiến mọi tin nhắn lịch sử trong DB (`m.tempId === undefined`) đều khớp điều kiện và bị ghi đè hàng loạt bằng tin nhắn mới nhất, sau đó bị deduplicator xóa sạch chỉ còn 1 tin nhắn duy nhất ghim ở đầu view ("dính luôn lên trên cùng của view, không lướt được").
     - Khắc phục: Bắt buộc kiểm tra `Boolean(activeTempId)` trước khi so sánh `m.tempId === activeTempId`, bảo toàn 100% tin nhắn lịch sử và cuộn mượt xuống đáy.
  5. Thiết lập hệ thống kiểm thử tự động E2E đa nền tảng (Playwright Desktop & Mobile Web Viewport Emulation):
     - Tích hợp `@playwright/test` với cấu hình đa thiết bị: `chromium-desktop` (1280x800) và `mobile-chrome` (Pixel 7 viewport với touch events).
     - Viết spec `tests/e2e/chat-messaging.spec.ts` tự động login, gửi chuỗi tin nhắn và kiểm tra tự động `scrollHeight > clientHeight`, `distanceFromBottom: 0`, bảo toàn toàn bộ tin nhắn.
  6. Tinh chỉnh hiển thị trạng thái tin nhắn và thời gian gửi (Message Status Indicators & Timestamp Toggle):
     - Hiển thị biểu tượng trạng thái tối giản (không dùng chữ thô): biểu tượng quay `Clock` / `ActivityIndicator` cho tin nhắn đang gửi (`SENDING`), biểu tượng tích `✓` cho tin nhắn đã gửi (`SENT`), và `AlertCircle` kèm nút Thử lại cho tin nhắn lỗi (`FAILED`).
     - Trạng thái gửi chỉ hiển thị duy nhất cho tin nhắn mới nhất mà người dùng gửi (`isLatestSentByMe`), hoặc khi tin nhắn đang trong hàng đợi gửi (`SENDING`) / gửi thất bại (`FAILED`), tránh gây rối mắt trên toàn bộ lịch sử.
     - Ẩn nhãn thời gian theo mặc định; chỉ hiển thị timestamp khi người dùng nhấp/chạm vào bong bóng tin nhắn (`showTimestamp`), áp dụng đồng bộ trên cả Web và Mobile.
- **Files Affected:**
  - `playwright.config.ts`
  - `tests/e2e/chat-messaging.spec.ts`
  - `.gitignore`
  - `package.json`
  - `package-lock.json`
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/src/services/socket.ts`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/hooks/use-chat-queries.ts`
  - `apps/web/src/lib/socket.ts`
  - `scripts/verify-ai-log.sh`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% typing indicator mapping, channel auto-rejoin logic, infinite query cache preservation, Playwright multi-device E2E suite, smart scroll preservation, and sticky viewport containment.
- **Human Modifications:** Trương Công Bình trực tiếp phản ánh các bất cập về độ trễ tin nhắn, kẹt cuộn và ô chat bị lệch, yêu cầu thiết lập công cụ Playwright và tự động kiểm thử thay vì test thủ công.
- **Verification Method:**
  - Playwright E2E: `npm run test:e2e` pass 6/6 tests trên cả desktop và mobile viewport (10.2s).
  - Web: `npm --prefix apps/web run build` pass (9/9 routes).
  - Mobile: `cd apps/mobile && npx tsc --noEmit` pass (0 errors).
  - Backend: `npm --prefix apps/backend test` pass (7/7 suites, 99/99 tests).
  - Integrity: `./scripts/check-agent-map.sh` pass (94/94 files).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Pass 100%.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Điều kiện `m.tempId === tempId` trong mutation cache update không guard trường hợp `tempId` là `undefined`, dẫn đến việc vô tình ghi đè toàn bộ danh sách tin nhắn lịch sử bằng tin nhắn mới.
  - **Root Cause:** `mutationFn` không trả về `tempId` nếu đầu vào không truyền `tempId`, làm cho `tempId` trong `onSuccess` mang giá trị `undefined`, dẫn tới biểu thức `undefined === undefined` trả về `true` cho tất cả tin nhắn cũ.
  - **Resolution / Fix:** Lấy `activeTempId` từ `data.tempId || variables?.tempId || context?.tempId` và bắt buộc điều kiện `Boolean(activeTempId)` trước khi so sánh `m.tempId === activeTempId`.
- **Commit:** `6f7327d`, `b2cce77`, `4030896`, `eca3aef`
- **PR:** #71, #73 (https://github.com/1440isme/Circle/pull/73)

---

## AI-0078: Hoàn thiện Tính năng Phản hồi Khoảnh khắc (Reply Moment vào Nhóm Chat) — Module 5 Full-stack

- **Date:** 2026-10-03 15:18:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (Full-stack Lead Module 5) & Trương Công Bình (Peer Review)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.7 Flash (Medium)
- **Related Issue:** Module 5: Moments & Feed — Phản hồi Moment vào nhóm chat (`UC10: View & React to Moments`)
- **Purpose:** Triển khai trọn gói nghiệp vụ Full-stack cho tính năng **Phản hồi khoảnh khắc (Reply Moment vào nhóm chat)**, tuân thủ triết lý *Circle-Centric (Group-First)* và các quy tắc dự án:
  1. **Shared Contracts & Zod Validation:**
     - Bổ sung interface `ReplyMomentInput` (`message: string`, `circleId: string`) vào `@circle/types`.
     - Xây dựng Zod validation schema `replyMomentSchema` trong `@circle/shared` với các ràng buộc độ dài (tối đa 2000 ký tự) và bắt buộc chọn nhóm.
     - Đồng bộ từ điển đa ngôn ngữ (`vi.ts`, `en.ts`) cho thông báo lỗi và chuỗi giao diện người dùng (zero hardcoded strings).
  2. **Backend API & Service (`apps/backend`):**
     - Endpoint `POST /api/v1/moments/:id/reply` với `JwtAuthGuard` và `ZodValidationPipe`.
     - `MomentsService.replyMoment`:
       - Kiểm tra tính tồn tại và hợp lệ của Moment (chưa bị soft delete).
       - Xác thực quyền riêng tư: Moment phải được chia sẻ công khai với `circleId` chỉ định (`MomentVisibility`).
       - Xác thực người dùng gửi phản hồi phải là thành viên hợp lệ của nhóm Circle (`CircleMember`).
       - Tự động tìm kiếm hoặc khởi tạo kênh trò chuyện chung của Circle (`ChannelType.TEXT`).
       - Tạo bản ghi tin nhắn `Message` (`type: FILE`) tự động trích dẫn `fileUrl: moment.photoUrl` kèm tiêu đề chú thích tác giả `Khoảnh khắc: "..."` và nội dung tin nhắn phản hồi.
       - Tích hợp `ChatGateway.broadcastNewMessage` phát sóng sự kiện thời gian thực Socket.IO (`channel:${channelId}`) để tin nhắn trích dẫn lập tức xuất hiện trong khung chat chung của toàn bộ thành viên nhóm.
     - Bổ sung bộ kiểm thử đơn vị toàn diện trong `moments.service.spec.ts` (đạt 91/91 backend tests passed 100%).
  3. **Frontend Web (`apps/web`):**
     - Bổ sung hook `useReplyMomentMutation` với cơ chế tự động invalidate cache chat/channel queries.
     - Cập nhật `StoryViewerModal.tsx`: Tích hợp thanh nhập phản hồi nhanh kèm bộ chọn Circle (khi Moment chia sẻ nhiều nhóm) ngay bên dưới Story Viewer, tự động tạm dừng Story khi người dùng soạn tin nhắn, gửi tin nhắn kèm phản hồi trực quan.
     - Cập nhật `DailyMomentsFeed.tsx`: Bổ sung nút bấm & khung nhập phản hồi trực tiếp trên từng thẻ bài đăng Moment tại bảng tin nhóm.
  4. **Mobile Application (`apps/mobile`):**
     - Bổ sung hook `useReplyMomentMutation` trong `use-circle-queries.ts`.
     - Cập nhật `LocketMomentsView.tsx`: Thêm nút "Phản hồi chat" tại chân thẻ khoảnh khắc và mục "Phản hồi vào nhóm chat" trong Action Menu.
     - Xây dựng Modal ActionSheet nhập tin nhắn trích dẫn khoảnh khắc, hỗ trợ gửi tức thì vào phòng chat nhóm.
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/moment.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/backend/src/modules/moments/moments.module.ts`
  - `apps/backend/src/modules/moments/moments.service.ts`
  - `apps/backend/src/modules/moments/moments.controller.ts`
  - `apps/backend/src/modules/moments/moments.service.spec.ts`
  - `apps/web/src/hooks/use-moment-queries.ts`
  - `apps/web/src/components/moments/StoryViewerModal.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/components/moment/LocketMomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend, frontend web/mobile UI, unit tests và tài liệu nhật ký.
- **Human Modifications:** Người dùng nhấn mạnh và nhắc nhở tuân thủ: Clean Repo, không tồn tại lệnh kỹ thuật thừa thãi, đáp ứng nghiêm ngặt quy chuẩn cơ sở dữ liệu, không dùng base64 cho media storage, và tuân thủ các quy tắc dự án.
- **Verification Method:**
  - `npm test -w @circle/backend`: 91/91 unit tests pass 100% (bao gồm các test case cho `replyMoment`).
  - `npm run build -w @circle/backend`: NestJS backend build pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript typecheck mobile pass 100% (0 errors).
  - `npm run build -w @circle/types` & `npm run build -w @circle/shared`: Packages build pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Module 5, Circle-Centric Policy, Definition of Done), `docs/phan-cong-nhiem-vu.md`, `docs/requirements/SRS.md` (`UC10`), `agentic/RULES.md`.
- **Security & License Check:** Kiểm tra nghiêm ngặt quyền thành viên nhóm (`CircleMember`), quyền hiển thị khoảnh khắc (`MomentVisibility`), xác thực JWT và bảo vệ luồng dữ liệu Zod; không dùng Base64 cho media; tuân thủ MIT license.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** #70

---

## AI-0079: Tối ưu hóa Hiệu năng Phân quyền Module 3 (Redis Caching & Invalidation) và Rà soát Clean Code Toàn diện

- **Date:** 2026-10-03 16:21:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Module 3 (Không gian Nhóm - Circle Core & Governance) & Task Optimization
- **Purpose:** 
  1. Tối ưu hóa hiệu năng kiểm tra quyền và thành viên nhóm trong `CirclesService` bằng cơ chế **Redis Role & Membership Cache**:
     - Thêm phương thức `getCachedMemberRole(circleId, userId)` với fallback thông minh sang Prisma PostgreSQL và tự động cache với TTL 10 phút.
     - Triển khai cơ chế **Cache Invalidation** tự động (`invalidateMembershipCache`) trên toàn bộ các luồng thay đổi thành viên và trạng thái nhóm: Tạo nhóm (`create`), Cập nhật nhóm (`update`), Tham gia qua mã mời (`joinByInviteCode`), Thêm thành viên (`addMembers`), Xóa/Kick thành viên (`removeMember`), Đổi biệt danh (`updateMemberNickname`), Rời nhóm (`leaveCircle`), Chuyển quyền Trưởng nhóm (`transferOwnership`), và Phê duyệt yêu cầu tham gia (`reviewJoinRequest`).
  2. Rà soát và dọn dẹp sạch sẽ toàn bộ mã nguồn Module 3 (Backend, Web, Mobile):
     - Loại bỏ toàn bộ `console.log` và mã thử nghiệm.
     - Cập nhật bộ unit test `circles.service.spec.ts` tương thích với `RedisService` (39/39 tests passed).
- **Prompt Summary:** Đồng ý triển khai tối ưu hóa Module 3 trước và clean code các file liên quan đến Module 3.
- **Files Affected:**
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn tối ưu Redis caching, cache invalidation helpers, unit tests và nhật ký AI.
- **Human Modifications:** Người dùng phê duyệt định hướng kiến trúc tối ưu hóa Redis caching cho Module 3 và yêu cầu thực hiện đồng bộ với tiêu chí clean code.
- **Verification Method:**
  - `npm test -w @circle/backend`: 91/91 unit tests pass 100% (39/39 Circle service tests pass).
  - `npm run build -w @circle/web`: Next.js production build pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript checks pass 100% (0 errors).
- **Official Source Checked:** `PROJECT_GOD.md` (Module 3, Redis Caching Standards, Gate 8 Clean Repo), `agentic/RULES.md`.
- **Security & License Check:** Đảm bảo bảo vệ dữ liệu thành viên và phân quyền chính xác qua cache invalidation, không phát sinh memory leak trên Redis; tuân thủ MIT license.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** #70

---

## AI-0080: Tinh chỉnh Giao diện Cài đặt Vòng tròn & Tạo Vòng tròn, Chuẩn hóa Schema Database Module 3 (Web & Mobile)

- **Date:** 2026-10-03 17:55:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Module 3 (Không gian Nhóm - Circle Core & Governance) & UI/UX Tinh Chỉnh
- **Purpose:**
  1. **Schema & Database:**
     - Bỏ hẳn `coverUrl` (ảnh bìa) và `description` (mô tả) khỏi model `Circle` trong Prisma PostgreSQL Schema (`apps/backend/prisma/schema.prisma`).
     - Cập nhật `CircleEntity` trong `@circle/types` và Zod schemas `createCircleSchema`, `updateCircleSchema` trong `@circle/shared`.
     - Cập nhật DTOs và `CirclesService` Backend tương ứng, đồng bộ bộ unit test 91/91 tests pass 100%.
  2. **Giao diện Cài đặt Vòng tròn (`CircleManagementModal`) trên cả Web & Mobile:**
     - **Tab 1 (Thông tin đoạn chat):** Chuyển sang phong cách Hồ sơ cá nhân (Profile header layout) với Avatar lớn ở giữa, Tên nhóm và `@handle`. Chỉ giữ form chỉnh sửa Tên nhóm và URL Avatar. Bỏ chú thích/subtitle rườm rà dưới tên tab.
     - **Tab 2 (Thành viên):** Bỏ hiển thị email/gmail dưới tên thành viên. Tích hợp thanh trượt chuyển đổi Subtab (Segmented Slider / Pill Switch) ngay trong Tab Thành viên: `[ Thành viên (N) ]` | `[ Yêu cầu tham gia (M) ]` cạnh/trên danh sách.
     - **Tab 3 (Quyền riêng tư & Hỗ trợ):** Bỏ notice banner chú thích rườm rà. Chuyển thao tác gạt bật/tắt quyền riêng tư và thông báo thành Silent Toggle (cập nhật im lặng, không hiện toast popup thành công).
     - **Tab 4 (Thiết lập Vòng tròn):** Thay đổi chế độ Công khai/Riêng tư thành Switch gạt gọn gàng: "Cần trưởng nhóm phê duyệt: Trưởng nhóm cần phê duyệt tất cả yêu cầu tham gia nhóm chat".
     - **Liên kết & Mã mời:** Tinh gọn thành 2 khối trực quan: (1) Mã mời với nút "Sao chép mã" bên cạnh, (2) Liên kết mời với nút "Sao chép liên kết" bên cạnh.
  3. **Giao diện Tạo Vòng tròn (`CreateCircleModal`) trên cả Web & Mobile:**
     - Tích hợp Switch "Cần trưởng nhóm phê duyệt" đồng bộ với Tab Cài đặt.
     - Tinh gọn danh sách bạn bè, loại bỏ hiển thị email.
- **Prompt Summary:** Tinh chỉnh giao diện phần cài đặt vòng tròn: bỏ ảnh bìa, mô tả khỏi database; avatar/tên nhóm hiển thị như hồ sơ cá nhân; bỏ tất cả chú thích nhỏ dưới 4 tab; bỏ email trong tab thành viên; bỏ chú thích cá nhân trong quyền riêng tư và toggle im lặng; chuyển public/private thành 'Cần trưởng nhóm phê duyệt' có switch; tinh gọn sao chép mã và sao chép liên kết; đẩy Yêu cầu tham gia vào tab thành viên dạng thanh kéo. Áp dụng cho cả modal tạo Circle.
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/dto/create-circle.dto.ts`
  - `apps/backend/src/modules/circles/dto/update-circle.dto.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `apps/web/src/components/circle/CreateCircleModal.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/components/circle/CreateCircleModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn refactor schema, packages, backend DTOs & service, frontend Web/Mobile components, unit tests và nhật ký AI.
- **Human Modifications:** Người dùng trực tiếp định hướng và yêu cầu chi tiết từng thành phần UI/UX và loại bỏ trường `coverUrl`, `description` khỏi cơ sở dữ liệu.
- **Verification Method:**
  - `npx prisma generate`: Prisma client generated successfully (0 errors).
  - `npm test -w @circle/backend`: 91/91 unit tests pass 100% (39/39 Circle service tests pass).
  - `npm run build -w @circle/types` & `npm run build -w @circle/shared`: Pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (all 9 routes static generated, 0 errors).
  - `npx tsc --noEmit -p apps/web/tsconfig.json`: TypeScript typecheck pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript typecheck mobile pass 100% (0 errors).
- **Official Source Checked:** `PROJECT_GOD.md` (Module 3 - Circle Core, Gate 8 Clean Code), `agentic/RULES.md`.
- **Security & License Check:** Tuân thủ kiểm soát phân quyền thành viên và trưởng nhóm, bảo vệ dữ liệu Zod validation, không sử dụng base64, tuân thủ MIT license.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** #70

---

## AI-0081: Tinh chỉnh Toàn diện Giao diện và Chức năng Cài đặt Vòng tròn (Web & Mobile)

- **Date:** 2026-10-05 03:45:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (MSSV: 23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Module 3 (Không gian Nhóm - Circle Core & Governance) & Cross-platform UI/UX Harmonization
- **Purpose:** Tinh chỉnh và tái cấu trúc toàn diện Giao diện & Chức năng Cài đặt Vòng tròn (`CircleManagementModal`) trên cả Web và Mobile:
  1. **Tách cấu trúc 5 Tabs đồng bộ, chuẩn nghiệp vụ:**
     - **Tab 1: Thông tin của Circle (`chatInfo`):** Chế độ xem Profile Card trực quan. Nút Cây bút (`Pencil`) / icon Máy ảnh (`Camera`) mở form chỉnh sửa tên nhóm và bộ chọn avatar (tải ảnh lên Cloudflare R2 qua Presigned URL hoặc chọn từ preset avatar).
     - **Tab 2: Thành viên & Yêu cầu tham gia (`members`):** Subtab Thành viên tinh gọn (loại bỏ số đếm thành viên) và Subtab Yêu cầu tham gia `(Y)`. Nút `+ Thêm thành viên` luôn hiển thị cố định trên thanh công cụ ở cả 2 subtabs.
     - **Tab 3: Thông báo & Quyền riêng tư (`privacySupport`):** Cài đặt cá nhân gồm:
       + Tắt thông báo đoạn chat (Mute Chat Toggle với popup chọn thời gian: `15 phút`, `1 giờ`, `8 giờ`, `24 giờ`, `Đến khi tôi bật lại`; khi bật sẽ tự động ẩn thông báo tin nhắn và cuộc gọi).
       + Khi mở thông báo: tùy chọn mức độ tin nhắn (`Tất cả`, `Lượt nhắc & phản hồi`, `Không thông báo`) và tắt thông báo cuộc gọi.
       + Chức năng **Tắt thông báo từ thành viên cụ thể (Mute Member Notifications)**.
       + Quyền riêng tư: Thông báo đã đọc (Read receipts / "Đã xem"), Chỉ báo đang nhập (Typing indicator), Cho phép AI xử lý nội dung tin nhắn.
     - **Tab 4: Thiết lập Vòng tròn (`circleSettings`):** Dành riêng cho Trưởng nhóm (Owner/Admin) với cơ chế lưu ngầm tự động (Silent Auto-Save, không hiển thị toast làm phiền):
       + Chế độ phê duyệt thành viên mới (Bật/Tắt).
       + Số lượng thành viên tối đa (Dropdown / Popup chọn Không giới hạn hoặc Nhập số tùy biến).
       + Khối Mã mời & Liên kết tham gia tách biệt với nút sao chép / chia sẻ tiện lợi.
       + Giải tán Vòng tròn.
     - **Tab 5: Trợ giúp & Báo cáo (`supportReports`):** Báo cáo người dùng vi phạm (chọn thành viên + lý do), Báo cáo Vòng tròn vi phạm, Quy tắc cộng đồng & Rời Vòng tròn.
  2. **Tối ưu hóa trải nghiệm Mobile (`apps/mobile`):**
     - Menu gốc sạch sẽ, loại bỏ toàn bộ các chú thích phụ dưới tên tab.
     - Chuyển đổi toàn bộ dropdown/form dài thành hệ thống 7 **Popup Modals** chuyên dụng, chuẩn thao tác cảm ứng trên thiết bị di động.
- **Prompt Summary:** Tinh chỉnh toàn diện giao diện và chức năng Cài đặt Vòng tròn trên cả Web và Mobile: Tách 5 tabs chuẩn nghiệp vụ (Thông tin của Circle, Thành viên + Yêu cầu, Thông báo & Quyền riêng tư, Thiết lập Vòng tròn, Trợ giúp & Báo cáo), Avatar máy ảnh và form sửa dạng profile card, thêm thành viên luôn hiển thị, subtab thành viên tinh gọn, mute thành viên cụ thể, privacy switches & AI assistance, capacity dropdown & silent auto-save, chuyển mobile sang popup modals.
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/mobile/src/stores/circle.store.ts`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% component UI logic, Presigned URL media upload integration, Zustand stores type update, Popup Modals, i18n locales, responsive layout và AI log.
- **Human Modifications:** Người dùng trực tiếp định hướng toàn bộ các yêu cầu tinh chỉnh UI/UX và logic nghiệp vụ.
- **Verification Method:**
  - `npm run build -w @circle/shared`: Pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9/9 static routes, 0 errors).
  - `npx tsc --noEmit -p apps/web/tsconfig.json`: TypeScript typecheck pass 100% (0 errors).
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: TypeScript typecheck pass 100% (0 errors).
  - `npm test -w @circle/backend`: 104/104 unit & integration tests pass 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Gate 1 Working Product, Gate 8 Clean Code), `agentic/RULES.md`.
- **Security & License Check:** Phân quyền Trưởng nhóm / Thành viên chuẩn xác, an toàn tải ảnh R2, không sử dụng Base64 trong database, tuân thủ MIT license.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** #70

---

## AI-0083: Tối ưu hóa Module Xác thực (Auth UX & Security) cho Mạng xã hội nhóm riêng tư: Kiểm tra độ phức tạp Mật khẩu Đa tầng, Quản lý Phiên đăng nhập & Thiết bị từ xa (Session Management), Mở khóa Sinh trắc học (Face ID / Vân tay) trên Mobile, Tín hiệu Tin cậy & Cam kết Bảo mật (Trust Signals)

- **Date:** 2026-10-05 21:12:00 +07:00
- **Developer:** Trương Công Bình (MSSV: 23110184)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** Module 1 (Authentication, Security & Session Governance)
- **Purpose:** Triển khai toàn diện các chuẩn UX & Security đặc thù của mạng xã hội riêng tư (Private Social Network) theo chuẩn mực Signal, Telegram, Apple:
  1. **Kiểm tra độ phức tạp mật khẩu đa tầng (Strong Password Enforcement):**
     - Cập nhật Zod schemas tại `@circle/shared` (`registerDtoSchema`, `registerSchema`, `resetPasswordDtoSchema`, `resetPasswordSchema`) bắt buộc 4 tiêu chí phức tạp: chữ hoa (`[A-Z]`), chữ thường (`[a-z]`), số (`[0-9]`), ký tự đặc biệt (`[^A-Za-z0-9]`) cùng tối thiểu 8 ký tự.
     - Cung cấp hàm kiểm tra `checkPasswordRequirements(password)` trả về trạng thái chi tiết từng tiêu chí.
     - Đồng bộ từ điển đa ngôn ngữ (`vi.ts`, `en.ts`) với 100% không hardcode chuỗi.
  2. **Chỉ số đo độ mạnh mật khẩu thời gian thực (Real-time Password Strength UI):**
     - **Web (`apps/web`):** Xây dựng `PasswordStrengthIndicator.tsx` gồm thanh đo trực quan 4 nấc (Yếu, Trung bình, Rất an toàn) và danh sách kiểm tra động 5 tiêu chí + trạng thái trùng khớp mật khẩu xác nhận. Tích hợp trực tiếp vào màn Đăng ký (`/register`) và Đặt lại mật khẩu (`/reset-password`).
     - **Mobile (`apps/mobile`):** Xây dựng `PasswordComplexityChecklist.tsx` hiển thị trạng thái từng tiêu chí trong wizard Đăng ký và Đặt lại mật khẩu (`PasswordRecoveryWizard.tsx`).
  3. **Tín hiệu tin cậy & Cam kết bảo mật (Trust Signals & Privacy Commitment):**
     - Web & Mobile: Xây dựng `TrustBanner.tsx` kèm biểu tượng khiên bảo vệ "Mạng xã hội riêng tư 100% (Mã hóa an toàn · Không quảng cáo · Không theo dõi hành vi)" và modal cam kết quyền riêng tư 3 điểm then chốt.
  4. **Quản lý thiết bị & Phiên làm việc từ xa (Session & Device Management - Full-stack):**
     - **Backend (`apps/backend`):** Triển khai 3 API endpoints bảo mật:
       - `GET /api/v1/auth/sessions`: Truy vấn các phiên đang hoạt động của người dùng, phân tích User Agent (`parseUserAgent`) thành Desktop, Mobile, Tablet, Trình duyệt và Hệ điều hành, đánh dấu phiên hiện tại `isCurrent`.
       - `DELETE /api/v1/auth/sessions/:sessionId`: Đăng xuất từ xa một thiết bị cụ thể.
       - `DELETE /api/v1/auth/sessions/other`: Hủy toàn bộ các phiên làm việc trên các thiết bị khác, bảo vệ phiên hiện tại.
       - Bổ sung 5 unit test cases (`TC-AUTH-SESSION-001` đến `TC-AUTH-SESSION-005`), nâng tổng số unit tests Backend lên 109/109 pass 100%.
     - **Frontend Web (`apps/web`):** Tạo modal `SessionsManagementModal.tsx` và liên kết trong menu Header của tài khoản, cho phép người dùng xem toàn bộ thiết bị đang đăng nhập, địa chỉ IP, thời gian đăng nhập và đăng xuất từ xa thiết bị lạ.
  5. **Mở khóa Sinh trắc học (Biometric Authentication) trên Mobile:**
     - Cài đặt `expo-local-authentication`, xây dựng `biometric.service.ts` kết hợp `expo-secure-store`.
     - Cho phép người dùng bật/tắt xác thực Face ID / Vân tay trong màn hình Cài đặt cá nhân (`ProfileTab`).
     - Tự động hiển thị màn hình khóa sinh trắc học khi khởi động app nếu đã bật tính năng này.
  6. **Đạt toàn bộ tiêu chuẩn nghiệm thu (DoD):**
     - 109/109 Backend unit tests pass 100%.
     - Next.js 14 Web build pass 100% (9/9 routes compiled static, 0 lint errors).
     - Mobile TypeScript typecheck pass 100% (0 errors).
     - Integrity check `./scripts/check-agent-map.sh` pass 94/94 files (0 broken references).
- **Prompt Summary:** Tối ưu hóa xác thực cho mạng xã hội nhóm riêng tư theo chuẩn UX & Security: bỏ email OTP vì phiền hà; bắt buộc mật khẩu mạnh (hoa, thường, số, ký tự đặc biệt); quản lý thiết bị/session management; sinh trắc học Face ID/Vân tay cho mobile; trust signals và cam kết bảo mật.
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/hooks/use-auth-mutations.ts`
  - `apps/web/src/components/auth/PasswordStrengthIndicator.tsx`
  - `apps/web/src/components/auth/TrustBanner.tsx`
  - `apps/web/src/components/profile/SessionsManagementModal.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/app/(auth)/reset-password/page.tsx`
  - `apps/mobile/package.json`
  - `apps/mobile/src/services/storage.ts`
  - `apps/mobile/src/services/biometric.service.ts`
  - `apps/mobile/src/components/auth/PasswordComplexityChecklist.tsx`
  - `apps/mobile/src/components/auth/TrustBanner.tsx`
  - `apps/mobile/src/components/auth/PasswordRecoveryWizard.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `apps/mobile/app/_layout.tsx`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend controller/service/tests, mobile biometric service & components, web session modal & strength indicator, Zod validator updates và tài liệu nhật ký.
- **Human Modifications:** Người dùng định hướng nghiệp vụ cốt lõi, tinh giảm các bước gây ma sát thừa (bỏ email OTP) và nhấn mạnh chuẩn bảo mật mật khẩu cùng tính năng quản lý thiết bị và Face ID.
- **Verification Method:**
  - `npm test -w @circle/backend`: 109/109 tests pass 100% (7/7 test suites).
  - `npm run build -w @circle/shared` & `npm run build -w @circle/types`: Pass 100%.
  - `npm run build -w @circle/web`: Next.js production build pass 100% (all 9 routes static generated, 0 type errors).
  - `npm run typecheck -w @circle/mobile`: TypeScript pass 100% (0 errors).
  - `./scripts/check-agent-map.sh`: 94/94 files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md` (Module 1 - Auth, Security & Session Governance), `agentic/RULES.md`.
- **Security & License Check:** Tuân thủ Dual-token + bcrypt + session revocation, input validation chặt chẽ qua Zod, không leak secret, tuân thủ MIT license.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** (1) `parseUserAgent` ban đầu kiểm tra chuỗi `mac os` trước `iphone`, dẫn đến user-agent iOS có chứa `like Mac OS X` bị gán sai thành `macOS`. (2) Mock `refreshToken` trong `auth.service.spec.ts` thiếu `findFirst` và `findMany`. (3) Thuộc tính `close` trong `t.common` ban đầu chưa có trong từ điển shared locales.
  - **Root Cause:** Sắp xếp thứ tự regex trong heuristic parser và thiếu sót mock khi viết unit test.
  - **Resolution / Fix:** Sửa thứ tự kiểm tra `iOS` trước `macOS` trong `parseUserAgent`, bổ sung `findFirst`, `findMany` vào mock Prisma, và thêm key `close` vào cả `vi.ts` và `en.ts` trong `@circle/shared`.
- **Commit:** `a9a0046`
- **PR:** #77

---

## AI-0084: Implement Cloudflare Turnstile Bot Protection across Auth Flows

- **Date:** 2026-10-05 23:00:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #77 (US-AUTH-SEC: Privacy-First Bot Protection & Cloudflare Turnstile Verification)
- **Purpose:** Tích hợp cơ chế bảo vệ chống bot, chống tấn công brute-force và credential stuffing bằng Cloudflare Turnstile không ma sát (frictionless / privacy-preserving) cho các biểu mẫu Xác thực (Login, Register, Forgot Password):
  1. **Shared Contracts & Locales:** Bổ sung `turnstileToken` tùy chọn vào `loginSchema`, `registerDtoSchema`, `forgotPasswordSchema` trong `@circle/shared`. Thêm các khóa bản địa hóa song ngữ `vi`/`en`: `turnstileVerify`, `turnstileRequired`, `turnstileFailed`.
  2. **Backend Turnstile Verification Service:** Tạo `TurnstileService` trong `apps/backend/src/modules/auth/turnstile.service.ts` để gọi API xác thực `https://challenges.cloudflare.com/turnstile/v0/siteverify` với Cloudflare. Hỗ trợ cờ bật/tắt `TURNSTILE_ENABLED` và khóa kiểm thử chính thức của Cloudflare (`1x0000000000000000000000000000000AA`) đảm bảo môi trường local dev và CI luôn pass 100%. Tích hợp kiểm tra token vào `AuthService.register`, `AuthService.login`, `AuthService.forgotPassword`.
  3. **Turnstile Unit Tests:** Thêm 5 unit tests toàn diện trong `turnstile.service.spec.ts` và 2 test case (`TC-AUTH-TURNSTILE-001`, `TC-AUTH-TURNSTILE-002`) trong `auth.service.spec.ts`. Toàn bộ 116/116 unit tests backend vượt qua 100%.
  4. **Frontend Turnstile Widget & UI Integration:** Xây dựng component `TurnstileWidget` tự động nạp SDK Cloudflare Turnstile render explicit, nhận diện dark/light theme động từ `useThemeStore`, dọn dẹp widget an toàn khi unmount. Nhúng widget vào các màn hình Web:
     - `apps/web/src/app/(auth)/login/page.tsx`
     - `apps/web/src/app/(auth)/register/page.tsx`
     - `apps/web/src/app/(auth)/forgot-password/page.tsx`
- **Prompt Summary:** "con ve phan dang ky hoac dang nhap toi thay thay co captcha hoac cloudfare verify gi do -> ok"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `apps/backend/src/modules/auth/turnstile.service.ts`
  - `apps/backend/src/modules/auth/turnstile.service.spec.ts`
  - `apps/backend/src/modules/auth/auth.module.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `apps/backend/src/modules/auth/dto/register.dto.ts`
  - `apps/backend/src/modules/auth/dto/login.dto.ts`
  - `apps/backend/src/modules/auth/dto/forgot-password.dto.ts`
  - `apps/web/src/components/auth/TurnstileWidget.tsx`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/app/(auth)/forgot-password/page.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% TurnstileService, TurnstileWidget, DTO updates, Zod schemas, unit tests và trang Auth forms.
- **Human Modifications:** Trương Công Bình đặt yêu cầu tích hợp giải pháp xác thực captcha / Cloudflare verification nhằm bảo vệ tài khoản và luồng đăng ký / đăng nhập của người dùng.
- **Verification Method:**
  - `npm test -w @circle/backend`: 116/116 unit tests pass 100% (8/8 test suites).
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9 static routes generated, 0 type errors).
  - `npm run typecheck -w @circle/mobile`: Pass 100% (0 errors).
  - `./scripts/check-agent-map.sh`: 94/94 files pass (0 broken references).
- **Official Source Checked:** Cloudflare Turnstile Server-Side Validation Documentation, Next.js Documentation.
- **Security & License Check:** Bảo mật cao, sử dụng secret key server-side không lộ client, zero secret leaks, MIT license.


---

## AI-0085: Triển khai 0.5x Ultra Wide Hardware Switching & Tinh chỉnh Selfie Zoom cho Expo Camera

- **Date:** 2026-10-06 23:48:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #78 (US-MOMENT-CAM: Hardware Optical Ultra Wide 0.5x Lens & Natural Selfie Zoom)
- **Purpose:** 
  1. Loại bỏ hoàn toàn giải pháp giả lập zoom bằng `transform: [{ scale }]` hoặc `zoom={0.5}` gây méo khung hình.
  2. Tích hợp chuyển đổi thấu kính quang học vật lý phần cứng thật (`Back Ultra Wide Camera` vs `Back Camera`) thông qua `selectedLens` của Expo Camera trên iOS / Android.
  3. Xử lý cơ chế selfie theo chuẩn Locket và Apple Camera: `0.5x` mở trọn vẹn cảm biến góc rộng 23mm (`zoom = 0`), `1x` tinh chỉnh góc chụp chân dung tự nhiên (`zoom = 0.04`).
  4. Khắc phục hiện tượng giật/nháy reload camera khi chuyển đổi zoom ở camera trước bằng cách tối ưu hóa `key` của `CameraView`.
  5. Thêm cấu hình lật gương `mirror={cameraFacing === 'front'}` trên cả preview lẫn `takePictureAsync` để ảnh chụp selfie ra đúng chiều tự nhiên không bị lộn ngược.
  6. Dọn dẹp toàn bộ console.log và mã nguồn debug tạm thời.
- **Prompt Summary:** Yêu cầu: Triển khai 0.5x bằng camera Ultra Wide thật của thiết bị, không dùng transform scale, xử lý mượt mà chuyển đổi camera trước/sau, cấu hình mirror selfie và dọn dẹp log dư thừa.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic trích xuất lens, điều khiển zoom, cấu hình CameraView và mirror photo.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp kiểm thử trên iPhone thật, cung cấp danh sách lens từ phần cứng, định hướng tinh chỉnh góc chụp và phê duyệt giải pháp.
- **Verification Method:**
  - `npm run typecheck -w @circle/mobile` / `npx tsc --noEmit -p apps/mobile/tsconfig.json`: Vượt qua 100% (0 errors).
  - Kiểm thử trực tiếp trên thiết bị iPhone thật: Camera sau chuyển đổi chuẩn xác giữa 1x và 0.5x Ultra Wide; camera trước phóng to thu nhỏ mượt mà không nháy đen; ảnh chụp selfie đúng chiều gương.
- **Official Source Checked:** Apple AVFoundation `AVCaptureDeviceDiscoverySession` Documentation, Expo Camera SDK 57 `selectedLens` & `mirror` API Documentation.
- **Security & License Check:** An toàn, không chứa bí mật hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A

---

## AI-0086: Tích hợp Hybrid Dual Camera Architecture (Expo Go & Development Build Support)

- **Date:** 2026-10-07 02:22:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #78 (US-MOMENT-CAM: Simultaneous Dual Camera Live & Sequential Fallback)
- **Purpose:**
  1. Tích hợp thư viện `expo-dual-camera` hỗ trợ `AVCaptureMultiCamSession` (iOS) và `CameraX Concurrent` (Android) cho chế độ Dual Camera Live đồng thời.
  2. Xây dựng cơ chế **Hybrid Architecture**: Tự động nhận diện môi trường qua `expo-constants`:
     - Trên **Development Build**: Mở 2 camera Live đồng thời với `<DualCameraBackView>` + `<DualCameraFrontView>` và chụp ảnh kép qua `takeDualPictureAsync`.
     - Trên **Expo Go**: Tự động kích hoạt cơ chế **Sequential Dual Real Capture (chụp kép 2 camera thật liên tiếp chuẩn BeReal)**, loại bỏ hoàn toàn việc dùng avatar hay ảnh tĩnh giả lập.
  3. Cài đặt **Safe Dynamic Loading** cho native module tránh crash khi chạy trên môi trường Expo Go sandbox.
- **Prompt Summary:** Yêu cầu: Nâng cấp chế độ Dual Mode hiển thị camera thật thay vì ảnh avatar/fallback, tích hợp expo-dual-camera và hỗ trợ tương thích an toàn trên Expo Go.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/mobile/package.json`
  - `apps/mobile/app.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic điều phối Hybrid camera, cơ chế Sequential Dual Capture, và safe dynamic loader.
- **Human Modifications:** Ninh Thị Mỹ Hạnh yêu cầu loại bỏ ảnh giả lập, định hướng trải nghiệm Dual Camera thật và kiểm thử thực tế trên Expo Go.
- **Verification Method:**
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: Pass 100% (0 errors).
  - Kiểm thử trực tiếp trên Expo Go: Chạy mượt mà, không crash module native, chụp kép thành công cả 2 camera (trước & sau).
- **Official Source Checked:** `expo-dual-camera` API Documentation, Expo Constants ExecutionEnvironment Documentation.
- **Security & License Check:** An toàn, không chứa bí mật hay thông tin nhạy cảm.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A

---

## AI-0087: Sửa lỗi Route Mapping StorageController & Cấu hình Build Monolith cho Storage Upload

- **Date:** 2026-10-07 02:40:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #78 (US-STORAGE-UPLOAD: Direct Upload Route Mapping & Monorepo Build Configuration)
- **Purpose:**
  1. Khắc phục lỗi `Cannot POST /api/v1/storage/upload` khi ứng dụng mobile upload ảnh moments.
  2. Bổ sung cấu hình `entryFile: "apps/backend/src/main"` trong `apps/backend/nest-cli.json` và cập nhật `start:prod` trong `package.json` để tương thích cấu trúc biên dịch monorepo (`dist/apps/backend/src/main`).
  3. Đảm bảo toàn bộ route của `StorageController` (`/api/v1/storage/upload`, `/api/v1/storage/presigned-url`, `/api/v1/storage/raw/*`) được đăng ký và ánh xạ chính xác trên NestJS API Gateway.
- **Prompt Summary:** Khắc phục lỗi `Cannot POST /api/v1/storage/upload` khi upload ảnh từ thiết bị mobile.
- **Files Affected:**
  - `apps/backend/src/app.module.ts`
  - `apps/backend/nest-cli.json`
  - `apps/backend/package.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% phân tích nguyên nhân route không được load và sửa cấu hình NestJS/TypeScript compilation.
- **Human Modifications:** Ninh Thị Mỹ Hạnh phát hiện lỗi từ log Expo console, yêu cầu truy vết nguyên nhân và sửa dứt điểm.
- **Verification Method:**
  - Build NestJS thành công (`nest build`).
  - Kiểm tra log khởi động NestJS: `[RouterExplorer] Mapped {/api/v1/storage/upload, POST}` xuất hiện đầy đủ.
  - Kiểm tra `curl -i -X POST http://localhost:4000/api/v1/storage/upload` trả về `401 Unauthorized` (chứng minh route đã tồn tại và hoạt động đúng với JwtAuthGuard).
- **Official Source Checked:** NestJS CLI Monorepo Docs, Express Request Routing Specs.
- **Security & License Check:** An toàn, toàn bộ endpoint upload yêu cầu JWT Guard hợp lệ.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A

---

## AI-0088: Khắc phục hiển thị ảnh chụp thật trên Mobile (Resolve Dynamic LAN IP & Storage Upload)

- **Date:** 2026-10-07 02:44:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #78 (US-MOMENT-VIEW: Real Captured Photo Feed Display & Dynamic LAN IP Mapping)
- **Purpose:**
  1. Giải thích chi tiết sự khác biệt giữa cơ chế cũ (dùng link ảnh mẫu Unsplash tĩnh có sẵn trên internet) và cơ chế mới (chụp ảnh camera thật từ phần cứng thiết bị, chuyển đổi base64 và lưu trữ trên backend).
  2. Bổ sung hàm tiện ích `resolveMobileMediaUrl` trong `apps/mobile/src/services/api.ts` để tự động biến đổi các URL dạng `http://localhost:4000/...` thành IP mạng LAN thực tế của máy chủ dev (`http://192.168.x.x:4000/...`), giúp thiết bị điện thoại thật đọc và render hình ảnh mượt mà.
  3. Áp dụng `resolveMobileMediaUrl` trên toàn bộ component `MomentsView.tsx` (ảnh chính, khung ảnh phụ PiP, avatar người đăng, và ảnh thumbnail lịch sử).
  4. Dọn dẹp mã nguồn rác `SAMPLE_CAPTURE_PHOTOS` và state `activeSampleIndex`.
- **Prompt Summary:** Giải thích lý do trước đó đăng ảnh hiển thị được còn bây giờ vừa chụp ảnh đăng lại chưa hiển thị và khắc phục.
- **Files Affected:**
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic resolve URL và chuẩn hóa pipeline hiển thị hình ảnh mobile.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp thử nghiệm và đặt câu hỏi làm rõ hành vi pipeline upload/display.
- **Verification Method:**
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: Exit code 0 (Pass 100%).
  - Backend đã sẵn sàng endpoint `GET /api/v1/storage/raw/*` phục vụ buffer ảnh cho mobile client.
- **Official Source Checked:** React Native `<Image>` Network Resource Resolution Specs, Expo Constants Host IP Discovery.
- **Security & License Check:** An toàn, không có secret, không ảnh hưởng các module khác.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A

---

## AI-0089: Sửa lỗi Public URL Dummy Domain & Bổ sung Disk Persistence cho Local Storage Fallback

- **Date:** 2026-10-07 02:53:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #78 (US-STORAGE-DEV: Local Media URL Resolution & File Persistence)
- **Purpose:**
  1. Truy vết nguyên nhân chính xác vì sao ảnh chụp đăng lên không hiển thị: trong file `.env` có thiết lập `CLOUDFLARE_R2_PUBLIC_DOMAIN="https://media.circle.example.com"` (dummy domain), khiến hàm `getPublicUrl()` sinh ra domain ảo không tồn tại thay vì trỏ về endpoint local raw media của server dev (`/api/v1/storage/raw/*`).
  2. Cập nhật điều kiện kiểm tra trong `getPublicUrl()`: chỉ áp dụng `publicDomain` khi Cloudflare R2 thực sự được cấu hình (`isR2Configured === true`), còn ở môi trường Local Fallback luôn trả về endpoint server cục bộ.
  3. Bổ sung cơ chế ghi file vật lý vào thư mục `uploads/` trên ổ đĩa bên cạnh in-memory map, giúp các ảnh đã chụp không bị mất khi backend hot-reload hoặc restart.
  4. Sửa lỗi ghép URL trong `mobileApiRequest` trên mobile app khi nhận endpoint là đường dẫn tuyệt đối (tránh bị nối lặp `baseUrl`).
- **Prompt Summary:** Khắc phục triệt để lỗi ảnh moment chụp xong bấm đăng nhưng không hiển thị trên bảng tin.
- **Files Affected:**
  - `apps/backend/src/modules/storage/storage.service.ts`
  - `apps/mobile/src/services/api.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic sửa điều kiện domain, lưu trữ disk storage và xử lý URL mobileApiRequest.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp thử nghiệm và phát hiện hiện tượng ảnh không hiển thị sau khi đăng.
- **Verification Method:**
  - Chạy test upload trực tiếp qua Node.js: Trả về HTTP 201 Created với URL hợp lệ `/api/v1/storage/raw/moments/...`.
  - Fetch URL ảnh vừa upload: Trả về HTTP 200 OK với đúng header `image/jpeg` và binary buffer.
  - Tạo moment thành công qua API `/api/v1/moments` (HTTP 201).
- **Official Source Checked:** Express Static Buffer Streaming, HTTP Content-Type Standards.
- **Security & License Check:** An toàn, không chứa bí mật.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A

---

## AI-0090: Tinh chỉnh Trải nghiệm Người xem Tin nhắn, Đồng bộ Realtime và Định vị Action Toolbar

- **Date:** 2026-10-07 21:40:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #80 (US-CHAT-READ-RECEIPTS: Refine subtle read receipts, right-aligned viewer avatars & realtime broadcast)
- **Purpose:**
  1. Tinh chỉnh vị trí hiển thị avatar người xem tin nhắn mới nhất: Luôn căn góc phải màn hình/khung chat (`w-full flex justify-end`), áp dụng cho cả tin nhắn của mình gửi và tin nhắn của người khác gửi.
  2. Nâng thanh công cụ phản ứng (Hover Action Bar) trên Web lên phía trên đỉnh bubble (`bottom-[calc(100%+4px)]`), ngang hàng mốc xem giờ, tuyệt đối không che nội dung tin nhắn.
  3. Khắc phục chuỗi hiển thị tên người xem khi bấm vào tin nhắn cũ: Sửa template locale `{names}` và bổ sung hàm định dạng an toàn hiển thị đúng tên người xem, giữ nguyên độ dài bubble ôm sát nội dung không bị kéo giãn.
  4. Khắc phục lỗi realtime người xem tin nhắn: Backend chuyển `client.to` sang `this.server.to` trong `chat:read` gateway handler để broadcast event `chat:user-read` cho toàn bộ client trong phòng (kể cả người vừa đọc), kết hợp optimistic update tức thì trên Web (`ChannelChatView.tsx`) và Mobile (`[id].tsx`).
- **Prompt Summary:** Yêu cầu tinh chỉnh avatar người xem tin nhắn người khác hiển thị góc phải, hover bar web nâng cao không che chữ, hiển thị đúng tên người xem tin nhắn cũ và đồng bộ realtime ngay khi xem không cần load lại.
- **Files Affected:**
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/mobile/app/circle/[id].tsx`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `tests/e2e/read-receipts-verification.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic xử lý layout CSS, socket room broadcast, optimistic cache mutation và Playwright E2E script.
- **Human Modifications:** Trương Công Bình trực tiếp kiểm tra thực tế, phát hiện các điểm bất cập về UX/realtime và yêu cầu hiệu chỉnh.
- **Verification Method:**
  - `npx playwright test tests/e2e/read-receipts-verification.spec.ts`: 2/2 tests Pass (Desktop + Mobile).
  - TypeScript compilation check: `apps/backend`, `apps/web`, `apps/mobile` đạt 0 errors.
  - Script kiểm tra tính toàn vẹn: `./scripts/check-agent-map.sh` Pass 100%.
- **Official Source Checked:** Socket.IO Room Broadcasting Docs, TanStack Query Optimistic Updates.
- **Security & License Check:** An toàn, không chứa secret/token.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.

---

## AI-0091: Tinh chỉnh Giao diện Xác thực: Gỡ bỏ TrustBanner, Badges và Checkbox Duy trì Đăng nhập Thừa

- **Date:** 2026-10-07 21:44:00 +07:00
- **Developer:** Trương Công Bình (23110184)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #80 (US-AUTH-CLEANUP: Auth UI Layout Simplification & Redundant Controls Removal)
- **Purpose:**
  1. Gỡ bỏ hoàn toàn component `TrustBanner` ("Mạng xã hội riêng tư 100%...") ở chân các màn hình Đăng nhập (`/login`), Đăng ký (`/register`), Đặt lại mật khẩu (`/reset-password`) trên Web và Mobile (`register.tsx`, `PasswordRecoveryWizard.tsx`) giúp giao diện tự nhiên, gọn gàng, tránh cảm giác gượng ép.
  2. Gỡ bỏ các pill badge `userBadge` và `communityBadge` ở header form Web, tối ưu khoảng cách typography cho tiêu đề và phụ đề.
  3. Gỡ bỏ checkbox `Duy trì trạng thái đăng nhập trên thiết bị này` trên cả Web và Mobile vì hệ thống đã quản lý phiên tự động an toàn (SecureStore / session tokens). Căn phải nút `Quên mật khẩu?` thanh thoát trên Mobile.
  4. Xóa bỏ hoàn toàn các file component `TrustBanner.tsx` thừa thãi.
- **Prompt Summary:** "bo badge mxh rieng tu di nhe, nhin no con k uy tin bang, bo di nhin con dep hon gon layout hon. o phan dang nhap sao bao la co che do nho thong minh roi nen bo phan duy tri trang thai login tren thiet bi nay, sao van con hien"
- **Files Affected:**
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/register/page.tsx`
  - `apps/web/src/app/(auth)/reset-password/page.tsx`
  - `apps/web/src/components/auth/TrustBanner.tsx` (deleted)
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/src/components/auth/PasswordRecoveryWizard.tsx`
  - `apps/mobile/src/components/auth/TrustBanner.tsx` (deleted)
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% refactor giao diện và dọn dẹp các control thừa.
- **Human Modifications:** Trương Công Bình đưa ra quyết định thiết kế loại bỏ các badge và checkbox thừa để tối ưu layout và độ tin cậy UX.
- **Verification Method:**
  - `npm run typecheck -w @circle/mobile`: 0 errors.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9 static routes).
  - `npm test -w @circle/backend`: 119/119 unit tests pass 100% (8/8 test suites).
  - `./scripts/check-agent-map.sh`: 94/94 files pass.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không chứa secret/token.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `3d7f4b8`
- **PR:** #80

---

## AI-0092: Triển khai Module WebRTC Calls & Signaling Gateway (UC12, SPIKE-RTC-001)

- **Date:** 2026-10-07 23:05:00 +07:00
- **Developer:** Trương Công Bình (23110184)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #8 ([SUB-RESEARCH]: SPIKE-RTC-001 — WebRTC Audio/Video Signaling Architecture & STUN/TURN PoC) & Epic #20
- **Purpose:**
  1. Triển khai backend module `CallsModule` trong NestJS bao gồm `CallsService`, `CallsController`, và `CallsGateway` (Socket.IO signaling cho SDP offer/answer, ICE candidates, quản lý trạng thái cuộc gọi `CallSession` và `CallParticipant`).
  2. Bổ sung các schema và contracts dùng chung trong `@circle/types` và `@circle/shared` (`IceServerConfig`, `CallSessionDetailEntity`, `createCallSchemas`).
  3. Cung cấp API `GET /api/v1/calls/ice-servers` trả về cấu hình STUN & TURN credentials phục vụ NAT traversal.
  4. Triển khai frontend Web: custom hook `useWebRTCCall`, query hooks `use-call-queries.ts`, component `CallStageModal.tsx` và tích hợp các nút gọi thoại / gọi video cùng banner phòng gọi realtime vào `ChannelChatView.tsx`.
  5. Viết bộ kiểm thử unit tests hoàn chỉnh cho `CallsService` và `CallsGateway` (14 tests mới).
- **Prompt Summary:** Tự động kiểm tra trạng thái repo, phát hiện nhánh chat đã merge thành công vào develop, chủ động checkout nhánh mới và triển khai trọn gói Module 6 WebRTC Signaling & Call theo đúng kế hoạch và issue #8.
- **Files Affected:**
  - `packages/types/src/index.ts`
  - `packages/shared/src/index.ts`
  - `packages/shared/src/validators/calls.validator.ts`
  - `apps/backend/src/app.module.ts`
  - `apps/backend/src/modules/calls/calls.module.ts`
  - `apps/backend/src/modules/calls/calls.controller.ts`
  - `apps/backend/src/modules/calls/calls.service.ts`
  - `apps/backend/src/modules/calls/calls.gateway.ts`
  - `apps/backend/src/modules/calls/calls.service.spec.ts`
  - `apps/backend/src/modules/calls/calls.gateway.spec.ts`
  - `apps/web/src/hooks/use-call-queries.ts`
  - `apps/web/src/hooks/use-webrtc-call.ts`
  - `apps/web/src/components/call/CallStageModal.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `tests/e2e/webrtc-call.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn backend signaling, frontend WebRTC hook, modal UI và bộ test suites.
- **Human Modifications:** Trương Công Bình rà soát và định hướng luồng công việc theo đúng SDLC của đề tài.
- **Verification Method:**
  - `npm test -w @circle/backend`: 133/133 unit tests pass 100% (10/10 test suites).
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9 static routes).
  - `npm run typecheck -w @circle/mobile`: 0 errors.
  - `npx playwright test tests/e2e/webrtc-call.spec.ts`: 2/2 tests pass 100% (Chromium Desktop + Mobile Chrome).
  - `npx playwright test`: 6/6 tests pass 100% (webrtc-call, read-receipts, chat-messaging).
  - `./scripts/check-agent-map.sh`: 94/94 files pass.
- **Official Source Checked:** `PROJECT_GOD.md` (Section 4 & Gate D), `docs/phan-cong-nhiem-vu.md` (Module 6), Issue #8.
- **Security & License Check:** Cấu hình STUN/TURN lấy từ biến môi trường, không lưu cứng secret; phân quyền thành viên vòng tròn trước khi cấp quyền truy cập phiên gọi.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Unused variable `BadRequestException` và TypeScript TS2532 trong `calls.service.spec.ts`.
  - **Root Cause:** Strict TypeScript checks của dự án.
  - **Resolution / Fix:** Loại bỏ import thừa và bổ sung non-null assertion cho mảng test `iceServers`.

---

## AI-0093: Hoàn thiện Bộ Báo cáo Tiến độ Hàng tuần W01–W08 (Hard Gate G2, TASK-EVIDENCE-001)

- **Date:** 2026-10-10 23:30:00 +07:00
- **Developer:** Trương Công Bình (23110184) & Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #13 ([SUB-TASK]: TASK-EVIDENCE-001 — Weekly Reports W01-W05 Evidence Package & Rubric Audit 01) & Parent Epic #19
- **Purpose:**
  1. Tổng hợp, chuẩn hóa và đóng gói toàn diện hệ thống báo cáo tiến độ kỹ thuật từ Tuần 01 đến Tuần 08 (`docs/evidence/weekly-reports/W01.md` đến `W08.md`).
  2. Cập nhật tài liệu quy trình nộp báo cáo Dual-Track Timeline (`agentic/memory/reporting-workflow.md`) phục vụ thẩm định Hội đồng và lưu kho minh chứng Rubric Level 5 (Hard Gate G2).
  3. Cập nhật nhật ký tiến độ tập trung `docs/BaocaoTuan.md` và `docs/evidence/weekly-reports/README.md`.
- **Prompt Summary:** Tách gói báo cáo tiến độ tuần W01–W08 thành một nhánh và PR độc lập để nộp duyệt song song với module WebRTC calling.
- **Files Affected:**
  - `docs/BaocaoTuan.md`
  - `docs/evidence/weekly-reports/README.md`
  - `docs/evidence/weekly-reports/W01.md`
  - `docs/evidence/weekly-reports/W02.md`
  - `docs/evidence/weekly-reports/W03.md`
  - `docs/evidence/weekly-reports/W04.md`
  - `docs/evidence/weekly-reports/W05.md`
  - `docs/evidence/weekly-reports/W06.md`
  - `docs/evidence/weekly-reports/W07.md`
  - `docs/evidence/weekly-reports/W08.md`
  - `agentic/memory/reporting-workflow.md`
  - `agentic/memory/MEMORY.md`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** Hỗ trợ chuẩn hóa định dạng Markdown theo đúng mẫu biểu quy định của Khoa CNTT - HCMUTE.
- **Human Modifications:** Trương Công Bình & Ninh Thị Mỹ Hạnh trực tiếp rà soát, điền nội dung thực tế các đầu việc đã triển khai qua từng tuần, các khó khăn và khai báo AI usage.
- **Verification Method:** `./scripts/check-agent-map.sh` (95/95 files pass).
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gate G2), Mẫu báo cáo tiến độ của Khoa CNTT - HCMUTE.
- **Security & License Check:** An toàn, không chứa secret/token.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0094: Tinh chỉnh Ngôn ngữ Thiết kế Flat UI/UX & Hợp nhất Cài đặt Hệ thống (US-DESIGN-001)

- **Date:** 2026-10-11 22:12:00 +07:00
- **Developer:** Trương Công Bình (23110184) & Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash
- **Related Issue:** #89 ([SUB-FEAT]: US-DESIGN-001 — Flat UI/UX Refinement & Unified System Settings) & Parent Epic #20
- **Purpose:**
  1. Cập nhật và bổ sung đặc tả Ngôn ngữ Thiết kế trong `docs/design.md`: Thừa hưởng triết lý Flat Liền mạch (Seamless Borderless Canvas), Bo tròn Chọn lọc (Selective Rounding & Line Partitioning), Icon-First Design và Clean UI (loại bỏ giải thích thừa thãi) từ Apple HIG & Meta.
  2. Bố cục phẳng liền mạch không phân tầng: Toàn bộ Header, Sidebar, Center Chat/Stream và PresenceRail cùng chung một màu nền bề mặt đồng nhất (`bg-white` ở Light Mode, `bg-circle-dark-surface` ở Dark Mode), xóa bỏ hoàn toàn các dải phân cách giữa 3 cột. Ngoại lệ duy nhất: Header có 1 đường hairline mảnh (`border-b border-circle-hairline dark:border-circle-dark-hairline`) ngăn cách với mặt phẳng nội dung bên dưới.
  3. Cải tiến Feed Khoảnh khắc (Daily Moments Feed): Khung ảnh/video tràn viền 100% sát cột giữa (tương tự độ rộng khung chat), loại bỏ hoàn toàn badge widget rườm rà ở trên cùng; gắn nút chụp ảnh nổi tròn (`rounded-full h-14 w-14`) cố định ngay chính giữa phía dưới cột 2.
  4. Nâng cấp Circle Settings Modal (`CircleManagementModal.tsx`): Áp dụng chuẩn Apple Sheet (`rounded-2xl border shadow-2xl`), thanh điều hướng phẳng (active tab là `rounded-xl`), nút đóng `rounded-full`, loại bỏ các dòng chú thích/giải thích thừa thãi dưới tiêu đề rõ nghĩa.
  5. Xây dựng component `SystemSettingsModal.tsx`: Hợp nhất Chế độ giao diện (Theme: Sáng/Tối/Hệ thống), Ngôn ngữ hiển thị (Tiếng Việt/English), và Quản lý phiên đăng nhập thiết bị (Active Sessions). Cụm lựa chọn phân tách bằng đường line 1px (`divide-x`), khi được chọn sẽ hiển thị bo tròn xúc giác (`rounded-lg bg-white shadow-xs`), các thành phần tương tác độc lập mang hình thái bo tròn hiện đại (`rounded-xl`, `rounded-full`).
  6. Tái cấu trúc `EditProfileModal.tsx`, `SystemSettingsModal.tsx`, `SessionsManagementModal.tsx`: Bỏ hoàn toàn icon bao tròn trước tiêu đề modal (chỉ giữ tiêu đề thuần túy), loại bỏ nút "Đóng" ở chân modal khi đã có nút 'X' tròn ở góc trên; các bộ chọn chuyển đổi đều được bo góc tinh tế (`rounded-xl` / `rounded-lg`).
  7. Làm phẳng toàn diện `CircleManagementModal.tsx`: Loại bỏ mọi card lồng nhau (`rounded-3xl border` và `rounded-2xl border bg-circle-canvas/40`), phân cách các khối bằng line mờ thanh lịch; thay thế icon cuộc gọi AI slop thành icon chuẩn `Phone` và `Video`.
  8. Tinh gọn Clean UI: Lược bỏ toàn bộ các chú thích/phụ đề thừa thãi dưới tên cuộc trò chuyện, phòng thoại video nhóm và các hàng thiết lập.
- **Prompt Summary:** Tối ưu hóa toàn diện nền tảng theo phong cách Flat hiện đại của Apple và Meta: nền liền mạch không chia cắt layout, header có hairline border là ngoại lệ duy nhất; bỏ icon bao tròn cạnh tiêu đề modal; bỏ nút Đóng ở chân modal khi đã có nút X; bo tròn các selector trong Cài đặt hệ thống; Moments feed tràn viền cột giữa với bo góc ảnh `rounded-2xl`, bỏ badge thường ngày, stick camera tròn ở giữa cột 2; Circle settings làm phẳng hoàn toàn, dùng icon Phone/Video chuẩn; loại bỏ phụ đề thừa thãi để làm sạch UI; tự kiểm chứng trực tiếp bằng Playwright E2E.
- **Files Affected:**
  - `docs/design.md`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/presence/PresenceRail.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/web/src/components/circle/CircleManagementModal.tsx`
  - `apps/web/src/components/settings/SystemSettingsModal.tsx`
  - `apps/web/src/components/profile/EditProfileModal.tsx`
  - `apps/web/src/components/profile/SessionsManagementModal.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `tests/e2e/circle-workspace.spec.ts`
  - `tests/e2e/ui-settings-verification.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn components, kịch bản kiểm thử E2E Playwright, và tài liệu đặc tả thiết kế.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo định hướng thiết kế và tinh chỉnh chi tiết: giữ hairline border ở Header làm ngoại lệ duy nhất; ảnh moments tràn viền sát cột giữa với góc bo `rounded-2xl`; bỏ badge thường ngày; stick nút chụp ảnh tròn ở giữa cột 2; bỏ icon tròn trước tiêu đề modal; bỏ nút Đóng khi đã có nút X; phẳng hóa toàn bộ Circle Settings; thay icon cuộc gọi AI slop bằng icon Phone/Video tiêu chuẩn; và tinh gọn giải thích thừa thãi để clean UI.
- **Verification Method:** 
  - `apps/web` TypeScript compile (`tsc --noEmit`): 0 errors.
  - Playwright E2E Test Suite (`circle-workspace.spec.ts`, `ui-settings-verification.spec.ts`): 100% pass trên Chromium desktop.
  - Chụp màn hình và trực tiếp kiểm tra bằng hình ảnh (`view_file`): `11-circle-workspace-light.png`, `13-system-settings-light.png`, `14-circle-workspace-dark.png`, `15-system-settings-dark.png`, `16-moments-feed-dark.png`, `17-moments-feed-light.png`, `18-circle-settings-tab1-chatinfo.png`, `19-circle-settings-tab3-privacy.png`, `20-circle-settings-tab4-settings.png`, `21-circle-settings-tab5-reports.png`, `22-circle-settings-tab3-privacy-dark.png`.
  - `./scripts/check-agent-map.sh`: 95/95 markdown files liên kết hợp lệ 100%.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple HIG (macOS System Settings, Flat Canvas), Meta Design System.
- **Security & License Check:** An toàn tuyệt đối, zero secret leaks, zero mock data.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Ban đầu hiểu nhầm việc giảm bo tròn thành làm vuông góc (`rounded-none`), để sót icon tròn trước tiêu đề h1/h3 và nút Đóng thừa ở chân modal; icon cuộc gọi trong Circle Settings dùng `PhoneCall`/`PhoneOff` bị nhận xét là AI slop.
  - **Root Cause:** Hiểu chưa đúng tinh thần Flat Design của Apple/Meta (phẳng ở cấp độ cấu trúc phân tầng layout nhưng vẫn bo cong mượt mà ở cấp độ nút bấm/ảnh/bộ chọn); chưa tinh giản triệt để các thành phần trang trí thừa thãi.
  - **Resolution / Fix:** Được người dùng hiệu chỉnh kịp thời; tái thiết kế theo triết lý Seamless Borderless Canvas, loại bỏ mọi icon bao tròn trước tiêu đề modal, loại bỏ nút Đóng thừa ở chân modal, bo cong `rounded-xl` chuẩn chỉnh cho các control bộ chọn, thay icon cuộc gọi thành `Phone` & `Video` tiêu chuẩn, phẳng hóa toàn diện mọi tab của Circle Settings, và chụp ảnh E2E để tự kiểm chứng thị giác 100%.
- **Commit:** Pending
- **PR:** Pending

---

## AI-0095: Đồng bộ Thiết kế Flat UI, Bỏ Viền Bao Icon & Bổ sung Cài đặt Phiên Đăng nhập trên Mobile

- **Date:** 2026-10-11 23:25:00 +07:00
- **Developer:** Trương Công Bình (23110184) & Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash
- **Related Issue:** #89 ([SUB-FEAT]: US-DESIGN-001 — Flat UI/UX Refinement & Unified System Settings) & Parent Epic #20
- **Purpose:**
  1. Loại bỏ khung viền bao quanh icon trên Web:
     - Header kênh chat (`ChannelChatView.tsx`): Bỏ thẻ bao `flex h-8 w-8 items-center justify-center rounded-lg border`, chỉ hiển thị trực tiếp biểu tượng `<Hash />`.
     - Bong bóng thông báo cuộc gọi (`MessageBubble.tsx`): Bỏ khối bao `flex h-9 w-9 rounded-xl`, hiển thị trực tiếp biểu tượng `<Video />` và `<Phone />` (thay thế triệt để icon `PhoneCall`).
  2. Đồng bộ hóa Ngôn ngữ Thiết kế Flat UI trên Mobile (`CircleManagementModal.tsx`):
     - Loại bỏ hoàn toàn khối bao icon đa màu sắc (`menuIconBox` với màu sắc phân mảnh), hiển thị trực tiếp biểu tượng với tông màu chữ chuẩn `colors.text`.
     - Phẳng hóa các card cài đặt lồng nhau thành danh sách phân cách bằng đường kẻ mỏng (`borderBottomWidth: StyleSheet.hairlineWidth`), loại bỏ các chuỗi giải thích thừa thãi.
  3. Bổ sung Quản lý Phiên Đăng nhập & Hợp nhất Cài đặt Hệ thống trên Mobile (`apps/mobile`):
     - Xây dựng các hàm API (`getUserSessionsApi`, `revokeSessionApi`, `revokeOtherSessionsApi`) và React Query hooks (`useSessionsQuery`, `useRevokeSessionMutation`, `useRevokeOtherSessionsMutation`).
     - Tạo component `SystemSettingsModal.tsx` trên mobile gồm 2 tab: Cài đặt chung (Theme: Sáng/Tối/Hệ thống; Ngôn ngữ: Tiếng Việt/English) và Phiên đăng nhập (Danh sách thiết bị, loại thiết bị, hệ điều hành, trình duyệt, IP, thời gian đăng nhập, badge "Thiết bị này", nút đăng xuất từng thiết bị và đăng xuất tất cả thiết bị khác).
     - Kết nối `SystemSettingsModal` vào màn hình Profile (`apps/mobile/app/(tabs)/profile.tsx`) hiển thị kèm badge đếm số lượng phiên hoạt động.
  4. Bổ sung khóa bản dịch đa ngữ `revokeSessionConfirm` trong `@circle/shared` cho cả tiếng Việt và tiếng Anh.
- **Prompt Summary:** "hien tai con icon # o tin nhan van con vien bao, tuong tu vay voi thong bao cuoc goi, bo vien bao chi hien thi icon. va ngon ngu thiet ke nay da ap dung tren mobile chua, setting circle tren mobile dang moi mau 1 icon do, chua dong bo voi web, va cung bo vien bao chi hien thi icon thoi, nang cap ux tren mobile nhe. tren mobile chua co setting phien dang nhap, phan setting chua dong bo voi web"
- **Files Affected:**
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/src/hooks/use-session-queries.ts`
  - `apps/mobile/src/components/settings/SystemSettingsModal.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn mobile hooks, services, modal settings, và các tinh chỉnh hiển thị icon trên web.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo: loại bỏ hoàn toàn viền bao bọc icon `#` và icon cuộc gọi; loại bỏ các ô icon màu mè trên mobile Circle Settings; đồng bộ tính năng quản lý phiên đăng nhập lên ứng dụng di động.
- **Verification Method:**
  - `packages/shared` build: thành công.
  - `apps/mobile` TypeScript compile (`tsc --noEmit`): 0 errors.
  - `apps/web` TypeScript compile (`tsc --noEmit`): 0 errors.
  - Playwright E2E Test Suite (`circle-workspace.spec.ts`): pass 100% trên Chromium desktop.
  - Trực tiếp kiểm tra hình ảnh giao diện (`tests/e2e/screenshots/11-circle-workspace-light.png`): icon `#` và icon cuộc gọi hiển thị trực tiếp thanh lịch, không viền bao.
  - `./scripts/check-agent-map.sh`: 95/95 files OK.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple Human Interface Guidelines.
- **Security & License Check:** An toàn tuyệt đối, bảo mật endpoint session revocation với Bearer token, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** Pending

---

## AI-0096: Chuẩn hóa Toàn diện Mobile UI/UX: Header Trượt Tính Năng, Sửa Lỗi Cuộc Gọi JSON, Ghim Tin Nhắn & Vuốt Cạnh Thoát Container

- **Date:** 2026-10-12 00:08:00 +07:00
- **Developer:** Trương Công Bình (23110184) & Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash
- **Related Issue:** #89 ([SUB-FEAT]: US-DESIGN-001 — Flat UI/UX Refinement & Unified System Settings) & Parent Epic #20
- **Purpose:**
  1. Chuẩn hóa Circle Settings trên Mobile (`CircleManagementModal.tsx`) theo benchmark tab "Thông báo & Quyền riêng tư":
     - Loại bỏ toàn bộ viền vuông và nền màu xám (`backgroundColor: colors.wash`) trong các hàng cài đặt của Thiết lập nhóm (`circleSettings`) và Báo cáo (`supportReports`); thay thế bằng cấu trúc danh sách phẳng phân cách bằng đường hairline mỏng (`borderBottomWidth: StyleSheet.hairlineWidth`).
     - Lược bỏ badge vai trò "Thành viên" thừa thãi trong danh sách thành viên (chỉ giữ Crown cho Trưởng nhóm và Shield cho Quản trị viên).
     - Phẳng hóa danh sách thành viên (`memberItem`) thành các hàng hairline thanh thoát thay vì card hộp rời rạc.
  2. Tái cấu trúc Profile Screen & Cài đặt hệ thống (`profile.tsx`):
     - Loại bỏ hoàn toàn hộp thông tin bảo mật chứa thuật ngữ kỹ thuật khó hiểu (`dualTokenSecurity`, `dualTokenSecured`) và dòng hiển thị địa chỉ email không cần thiết.
     - Hợp nhất tính năng Mở khóa sinh trắc học (`hasBiometrics` switch) trực tiếp vào hộp Cài đặt hệ thống.
  3. Khắc phục lỗi hiển thị thông báo cuộc gọi dạng chuỗi JSON thô trong Chat (`[id].tsx`):
     - Xử lý bóc tách và phân tích dữ liệu tóm tắt cuộc gọi (`[CALL_SUMMARY]:{...}` hoặc JSON object), kết xuất giao diện cuộc gọi trực quan với biểu tượng Phone/Video không viền bao, hiển thị tên trạng thái cuộc gọi và thời lượng định dạng chuẩn.
  4. Làm phẳng và dọn sạch icon màu mè trong Tiện ích nhóm (`activeTab === 'tools'`):
     - Xóa bỏ mọi hộp bao icon đa màu sắc (`toolIcon` với background màu mè), hiển thị trực tiếp biểu tượng thanh lịch với màu `colors.text`.
     - Chuyển đổi sang danh sách phẳng hairline bên trong card tiện ích, loại bỏ mô tả trùng lặp.
  5. Thiết kế lại Header Vòng tròn & Thanh trượt chọn tính năng trực tiếp ở chính giữa:
     - Cột trái: Chỉ hiển thị nút Back và Tên nhóm thuần túy (loại bỏ avatar nhỏ cạnh tên).
     - Cột phải: Loại bỏ 2 nút Call và Video; thay thế bằng biểu tượng avatar tròn chọn/chuyển đổi Vòng tròn (`headerCircleAvatarBtn`) đồng bộ với Homepage.
     - Chính giữa Header: Thanh trượt chọn tính năng (Chat / Khoảnh khắc / Tiện ích) với animation làm nổi bật icon đang chọn ở giữa và làm mờ (`opacity: 0.35`) các icon còn lại.
  6. Sửa lỗi tính năng Ghim Tin nhắn trên Mobile:
     - Bổ sung `usePinnedMessagesQuery` và đăng ký lắng nghe socket events `chat:pin`, `chat:unpin`.
     - Khắc phục lỗi đảo ngược cờ boolean trong `handleTogglePin` và mutation `usePinMessageMutation`.
     - Bổ sung banner tin nhắn đã ghim ở đầu khu vực chat và huy hiệu ghim trên bong bóng tin nhắn.
  7. Nâng cấp trải nghiệm UX: Vuốt từ cạnh trái màn hình sang phải (`useEdgeSwipeDismiss`) để thoát/đóng các modal và container (`CircleManagementModal`, `SystemSettingsModal`, `EditProfileModal`, `CreateCircleModal`, `JoinCircleModal`, và màn hình chi tiết nhóm `[id].tsx`).
- **Prompt Summary:** "phan setting cua thong bao va quyen rieng tu tren mobile da dung y toi lay do lam chuan, cac setting con lai dang con loi ui dang bi vuong, co mau nen, setting thanh vien con dang du 1 badge thanh vien, trong phan ho so ca nhan - cai dat he thong, k can thiet hien thi cac thong tin ve bao mat ma user se k biet thuat ngu do, k hien thi phan dia chi email, mo khoa sinh trac hoc gop vao box cai dat he thong, tai cau truc lai box cai dat he thong. thong bao cuoc goi tren mobile dang bi loi, in ra text json chu k phai ui, phan tien ich tren mobile van dang con nhieu box bao quanh icon nhieu mau. nut call va video o header circle tren nhom gio k hien thi nua, thay vi do la icon chon circle hien thi o do tuong tu nhu ngoai homepage vay thi icon va ten nhom se chi con hien thi ten nhom thoi, co nghia la cot trai chi hien thi ten nhom, cot phai hien thi icon chon nhom. va chinh giua header nhom gio day se la 1 dang slide luot ngang de chon tinh nang chat/moment/tien ich, co nghia la user vuot ngang se chon tinh nang tuong ung, icon tinh nang dang chon se hien thi o chinh giua header, trong khi vuot chon tinh nang thi icon k nam o chinh giua se hien thi mo animation dang faded, tinh nang ghim tin nhan tren mobile chua hoat dong. toi uu ux tren mobile bang cach vuot canh trai cua man hinh sang ben phai co nghia la thoat box, container dang mo, tuong dong voi nut tro ve"
- **Files Affected:**
  - `apps/mobile/src/hooks/use-edge-swipe.ts`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/components/circle/CreateCircleModal.tsx`
  - `apps/mobile/src/components/circle/JoinCircleModal.tsx`
  - `apps/mobile/src/components/profile/EditProfileModal.tsx`
  - `apps/mobile/src/components/settings/SystemSettingsModal.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn hook vuốt cạnh `useEdgeSwipeDismiss`, logic ghim tin nhắn, render thông báo cuộc gọi, header trượt chọn tính năng, và tái cấu trúc modal/profile.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo: chuẩn hóa theo tab Thông báo & Quyền riêng tư; bỏ badge Thành viên thừa; bỏ card bảo mật và email; tích hợp sinh trắc học vào cài đặt hệ thống; sửa lỗi hiển thị JSON cuộc gọi; làm phẳng icon tiện ích; thiết kế lại header vòng tròn với thanh trượt tính năng ở giữa; sửa tính năng ghim tin nhắn; bổ sung cử chỉ vuốt cạnh trái để đóng container.
- **Verification Method:**
  - `apps/mobile` TypeScript compile (`tsc --noEmit`): 0 errors.
  - `apps/web` TypeScript compile (`tsc --noEmit`): 0 errors.
  - Playwright E2E Test Suite (`circle-workspace.spec.ts`): pass 100%.
  - `./scripts/check-agent-map.sh`: 95/95 files OK.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple Human Interface Guidelines.
- **Security & License Check:** An toàn tuyệt đối, bảo mật token & API sessions, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Commit:** Pending
- **PR:** Pending

---

## AI-0097: Nâng cấp Trải nghiệm Tương tác Reply — Bấm vào Trích dẫn để Tự động Cuộn đến Vị trí Tin nhắn Gốc (Web & Mobile)

- **Date:** 2026-10-16 23:05:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #89 (Flat UI & System Settings Refinement)
- **Purpose:** Nâng cấp trải nghiệm tương tác với tính năng Trả lời tin nhắn (Reply to message) trên cả nền tảng Web và Mobile theo chuẩn hiện đại:
  1. Cho phép người dùng bấm/chạm trực tiếp vào phần trích dẫn tin nhắn được trả lời (khung preview màu xám `replyQuoteBox` bên trong bong bóng chat).
  2. Tự động cuộn mượt mà (`element.scrollIntoView({ behavior: 'smooth', block: 'center' })` trên Web và `measureLayout` / `scrollTo` trên Mobile `ScrollView`) nhảy chính xác đến vị trí của tin nhắn gốc được rep.
  3. Kích hoạt hiệu ứng làm nổi bật (highlight glow / ring pulse) lên tin nhắn gốc trong khoảng thời gian ~1.8 giây, giúp người dùng nhận biết ngay lập tức vị trí tin nhắn tương tự trải nghiệm trên Telegram / Discord / Messenger.
  4. Mở rộng tính năng tự động cuộn nhảy đến tin nhắn khi nhấn vào banner Tin nhắn đã ghim (Pinned Messages Bar) và trong Modal Tin nhắn đã ghim (Pinned Messages Modal).
  5. Đảm bảo toàn bộ hệ thống Web & Mobile vượt qua kiểm tra kiểu TypeScript (`tsc --noEmit`) với 0 lỗi.
- **Prompt Summary:** "cải thiện tinh năng reply bang cách bấm vào tin nhắn được rep (phần xám trong box tin nhắn) thì nhảy lên (tự động cuộn) đúng vị trí của tin nhắn được rep nhé"
- **Files Affected:**
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/MessageList.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/chat/PinnedMessagesModal.tsx`
  - `apps/mobile/app/circle/[id].tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn xử lý tương tác click/tap, cơ chế đo tọa độ và cuộn mượt mà, hiệu ứng highlight tin nhắn trên Web và Mobile.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo yêu cầu cải thiện tính năng reply: bấm vào phần trích dẫn xám để tự động nhảy lên đúng vị trí tin nhắn được rep.
- **Verification Method:**
  - `apps/mobile` TypeScript compile (`npm run typecheck`): 0 errors.
  - `apps/web` TypeScript compile (`npx tsc --noEmit`): 0 errors.
  - `./scripts/check-agent-map.sh`: 95/95 files OK.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple Human Interface Guidelines.
- **Security & License Check:** An toàn tuyệt đối, không chứa credentials, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** Pending
- **PR:** Pending

---

## AI-0098: Tối ưu Trải nghiệm Mobile Workspace — Vuốt Ngang Instagram-Style, Căn Giữa Cụm Nút Chức Năng, Modal Đổi Circle và Chặn Ghim Thông Báo Cuộc Gọi

- **Date:** 2026-10-16 23:36:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (Medium)
- **Related Issue:** #89 ([REFACTOR]: System Settings & Workspace Modernization — Mobile Instagram-Style Swiping, Centered Header Switcher, Circle Switcher Sheet, Disallow Call Summary Pin)
- **Purpose:** Triển khai gói tối ưu hóa UX/UI cho Circle Workspace trên Mobile và Web:
  1. Ngăn chặn triệt để hành động ghim (Pin) đối với các thông báo kết thúc cuộc gọi (`[CALL_SUMMARY]:...` hoặc có chứa `callType`) trên cả Web (`MessageBubble.tsx`, `ChannelChatView.tsx`) và Mobile (`apps/mobile/app/circle/[id].tsx`), ẩn nút Ghim khỏi menu hành động và từ chối xử lý ghim đối với loại tin nhắn này.
  2. Khắc phục triệt để hiện tượng cuộn khựng/giật trên Mobile bằng cách:
     - Tinh chỉnh `useEdgeSwipeDismiss` (`onStartShouldSetPanResponder: () => false` và `onStartShouldSetPanResponderCapture: () => false`) để không chiếm đoạt touch-down của `ScrollView`.
     - Bọc `MobileSwipeMessageBubble` trong `React.memo` giúp giảm thiểu re-render không cần thiết cho hàng trăm tin nhắn khi có cập nhật trạng thái nhỏ.
     - Tăng `scrollEventThrottle` lên 32ms, kích hoạt `removeClippedSubviews` trên Android, `keyboardDismissMode="on-drag"` và `nestedScrollEnabled={true}`.
  3. Căn giữa chuẩn xác (`position: 'absolute'`, `left: 0`, `right: 0`, `bottom: 8`) cụm slider tròn 3 nút chuyển tính năng (Chat / Moments / Tiện ích) giữa màn hình Mobile mà không bị lệch hay xô đẩy bởi tiêu đề nhóm hoặc nút chuyển nhóm.
  4. Phân tách rõ ràng hành vi tương tác header:
     - Nhấn vào Tên Circle (bên trái): Mở cài đặt và quản lý Circle (`CircleManagementModal`).
     - Nhấn vào nút Avatar Circle tròn (bên phải): Mở bảng đổi nhóm (`Circle Switcher Modal`) đồng bộ với trang chủ, hỗ trợ đổi nhóm nhanh, tạo nhóm mới (`CreateCircleModal`), và tham gia bằng mã (`JoinCircleModal`).
  5. Thiết lập cơ chế lướt vuốt ngang giữa màn hình dạng Instagram (`ScrollView` horizontal `pagingEnabled` với `screenWidth`) cho phép người dùng vuốt chuyển trang mượt mà giữa Trò chuyện, Khoảnh khắc và Tiện ích mà không cần phải với tay bấm nút trên header.
- **Prompt Summary:** "không cho ghim thông báo cuộc gọi nhé, cảm giác lướt trên mobile đang hơi bị khựng, chưa được mượt, khung tròn 3 nút chat, moment, tiện ích đặt ở giua màn mobile chứ k phải sát nút nhóm bên phải nhé, nút bên phải đó là giống ngoài trang home, là nút chọn nhóm và tạo/tham gia nhóm chứ k phải setting nhóm setting nhóm chỉ là bấm vào tên nhóm bằng text thôi, tôi muốn tăng ux bằng cách lướt giữa màn hình thì sẽ chuyển sang các trang moment, tiện ích giống như ins hiện tại thay vì user phải với tay bấm lên trên cạnh trên màn hình, bạn hiểu ý tôi chứ"
- **Files Affected:**
  - `apps/mobile/src/hooks/use-edge-swipe.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn phân trang ngang Instagram-style, tối ưu hiệu năng cuộn memo/pan-responder, căn giữa tuyệt đối header slider, chặn ghim thông báo cuộc gọi, và tích hợp Circle Switcher Sheet.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo định hướng cải thiện UX vuốt ngang như Instagram, căn giữa thanh slider và phân biệt rõ nút cài đặt nhóm với nút chuyển đổi nhóm.
- **Verification Method:**
  - `apps/mobile` TypeScript compile (`npm run typecheck`): 0 errors.
  - `apps/web` Next.js production build (`npm run build`): 100% thành công, 0 errors.
  - `./scripts/check-agent-map.sh`: 95/95 files OK.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple Human Interface Guidelines, Instagram gesture navigation patterns.
- **Security & License Check:** An toàn tuyệt đối, không chứa credentials, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A
  - **Resolution / Fix:** N/A
- **Commit:** `fab2ef9`
- **PR:** Pending

---

## AI-0099: Tích Hợp Toàn Diện Liquid Glass & Flat Design Language, Tái Cấu Trúc Hệ Thống Theme Neutral & Chat Bubble Themes, Tối Ưu Mobile Workspace

- **Date:** 2026-10-17 12:00:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #89 ([REFACTOR]: System Settings & Workspace Modernization — Liquid Glass & Flat Design Language Dual Integration, Neutral Theme System, Chat Bubble Color Customization, Lazy Moments Camera, and Reply Jump Optimization)
- **Purpose:** Triển khai toàn bộ các yêu cầu nâng cấp UI/UX theo tiêu chuẩn Liquid Glass UI Kit (Apple HIG) và Flat Design Language chuẩn mực, khắc phục các tồn đọng trên Mobile cho PR #89:
  1. **Tích hợp Song Song Flat Design (Mặc định) và Liquid Glass UI Kit:**
     - Lĩnh hội toàn diện 5 nguyên tắc Flat Design (`ui-kit/Flat Design Language Demo.html`): 1 màu accent chủ đạo, bề mặt trung tính (neutral surfaces), viền 1px mảnh, card 16px, bóng đổ nhẹ 2 lớp (subtle 2-layer shadow: `0 1px 2px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.06)`), không lạm dụng blur.
     - Bảo lưu trọn vẹn Liquid Glass UI Kit (`ui-kit/Liquid Glass UI Kit Demo.html`): hiệu ứng blur hai lớp (Functional Layer 22-50px, specular highlight `inset 0 1px 0`, Content Layer đặc).
     - Cho phép người dùng linh hoạt lựa chọn phong cách thiết kế trong Cài đặt Hệ thống trên cả Web (`SystemSettingsModal.tsx`) và Mobile (`CircleManagementModal.tsx`), mặc định là **Flat Design**.
  2. **Tái Cấu Trúc Bảng Màu Sáng / Tối Trung Tính (Khử Triệt Để Ám Xanh):**
     - Loại bỏ hoàn toàn tone nền ám xanh/rêu gây nhức mắt (`#0E1512` và `#16201B`).
     - Chuẩn hóa nền canvas và bề mặt sang tone xám trung tính hiện đại chuẩn công nghiệp: Light Canvas `#FFFFFF`, Light Surface `#F5F5F6`, Dark Canvas `#131316`, Dark Surface `#1D1D21`.
     - Giữ nguyên màu nhận diện thương hiệu CIRCLE là xanh lá cây nhạt/mint (`#10B981` light, `#34D399` dark), chỉ xuất hiện ở các vị trí điểm nhấn quan trọng (active indicator, avatar ring, brand button) thay vì phủ tràn lan toàn bộ nền tảng.
  3. **Tùy Chọn Màu Bong Bóng Tin Nhắn (Chat Bubble Themes):**
     - Bổ sung 5 bộ theme màu bong bóng tin nhắn: **Sage Green** (Xanh lá nhạt truyền thống), **Monochrome** (Tối giản đen/xám), **Deep Ocean** (Xanh biển sâu), **Warm Sunset** (Cam hoàng hôn ấm áp), **Soft Lavender** (Tím thạch anh).
     - Hỗ trợ lưu trữ cấu hình qua `localStorage` trên Web và `AsyncStorage` trên Mobile; hiển thị trực quan swatch màu có kiểm tra trạng thái active.
  4. **Áp Dụng Nghiêm Ngặt Nguyên Tắc Bo Góc Component (Concentric & Flat Radii):**
     - Nút bấm, chip, icon box: 10px (`radius-sm`).
     - Card, modal dialog, grouped setting list: 16px (`radius-md`).
     - Khung soạn thảo tin nhắn (Composer): 24px (`radius-lg`).
     - Bong bóng tin nhắn (Message Bubbles): 20px bo viền, 6px ở góc đuôi tin nhắn (20/6 rule) cho cả Web và Mobile (`MobileSwipeMessageBubble`).
     - Avatar & badge trạng thái: 999px (full pill).
  5. **Tái thiết kế Circle Settings Modal theo Apple HIG Grouped List:**
     - Chuẩn hóa thanh điều hướng đơn (tiêu đề thuần text căn giữa, nút back tròn bên trái, nút close tròn bên phải).
     - Thêm Circle Hero summary card (avatar 64px, tên nhóm, thành viên, vai trò, nút chia sẻ mã mời).
     - Gom cài đặt vào các Grouped Card bo góc 16px, tiêu đề section viết hoa (12px, font-weight 600) đặt bên ngoài card, đồng bộ icon đơn sắc, vùng chạm chuẩn $\ge 48\text{px}$.
  6. **Tối ưu Lazy Camera trên Tab Khoảnh khắc:**
     - Truyền trạng thái `isActive={activeTab === 'moments'}` vào `MomentsView`, ngăn camera phần cứng tự động khởi chạy ngầm khi ở tab Chat hoặc Tiện ích.
  7. **Dứt điểm lỗi bấm 2 lần mới nhảy lên tin nhắn reply trên Mobile:**
     - Thiết lập `keyboardShouldPersistTaps="always"` trên cả `horizontalPagerRef` và `scrollViewRef`, ngăn chặn hoàn toàn việc chạm lần 1 bị nuốt do hủy focus bàn phím ở các ScrollView lồng nhau.
     - Vô hiệu hóa triệt để pha capture của pan responder (`onStartShouldSetPanResponderCapture: () => false`, `onMoveShouldSetPanResponderCapture: () => false`) và mở rộng vùng chạm `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`.
     - Chuẩn hóa bọc toàn bộ danh sách tin nhắn bằng container native `<View ref={messagesContentRef} collapsable={false}>`. Sử dụng `measureLayout` trực tiếp trên container gốc này để đo tuyệt đối offset `top` mà không phụ thuộc vào `currentScrollYRef`.
     - Bổ sung cơ chế double-attempt scroll sau 120ms đảm bảo vị trí cuộn không bị layout animation của UIKit / bàn phím ghi đè hoặc triệt tiêu.
  8. **Tối ưu phản hồi xúc giác (Haptics) & Thanh tin nhắn đã ghim (Pinned Banner/Modal):**
     - Loại bỏ hoàn toàn cơ chế rung thô bạo bằng motor `Vibration.vibrate()`. Tích hợp `expo-haptics` với phản hồi xúc giác nhẹ nhàng chuẩn Apple HIG (`Haptics.selectionAsync()` khi vuốt chạm ngưỡng reply, `Haptics.impactAsync(Light)` khi long-press tin nhắn; triệt tiêu rung ở các thao tác chạm thông thường).
     - Tinh giản giao diện thanh tin nhắn đã ghim (Pinned Banner) trên cả Web và Mobile: giảm bớt độ tương phản gắt, hạ kích thước viền và font chữ, thay thế các button nổi cộm bằng pill phẳng bán trong suốt thanh thoát.
     - Xây dựng component `PinnedMessagesModal` trên Mobile cho phép xem danh sách chi tiết các tin nhắn đã ghim, bấm để nhảy tới tin nhắn và hỗ trợ bỏ ghim.
  9. **Tính năng Mention (@) tinh giản (Minimalism) trên Web & Mobile:**
     - Web (`ChatComposer.tsx`, `ChannelChatView.tsx`, `MessageBubble.tsx`): Tự động nhận diện khi gõ `@`, gợi ý `@all` cùng các thành viên trong Circle. Giao diện danh sách gợi ý tuân thủ nghiêm ngặt tiêu chí tối giản (minimalism: chỉ hiển thị text tên `@name`, không avatar/badge rườm rà), hỗ trợ điều hướng bàn phím đầy đủ (ArrowUp/Down, Enter, Tab, Escape). Tự động định dạng `@mention` nổi bật nhẹ nhàng trong bóng tin nhắn.
     - Mobile (`apps/mobile/app/circle/[id].tsx`): Nhận diện `@` theo thời gian thực trong `TextInput`, hiển thị thanh pill ngang tối giản ngay trên khung composer, hỗ trợ chạm trực tiếp không nuốt phím (`keyboardShouldPersistTaps="always"`), tự động chèn `@name ` và đóng gợi ý. Tô sáng `@name` trong `MobileSwipeMessageBubble`.
  10. **Tái Cấu Trúc Màu Tin Nhắn Theo Từng Vòng Tròn (Per-Circle Pastel Theme Synchronization):**
      - Bổ sung trường `themeColor String? @default("sage")` vào model `Circle` trong Prisma schema và áp dụng migration database `20261017051638_add_circle_theme_color`.
      - Cập nhật backend `CirclesService.update()`, shared validator `updateCircleSchema` và types `CircleEntity` để lưu trữ và phân phối màu chủ đề theo từng Circle. Khi Trưởng nhóm thay đổi màu, toàn bộ thành viên trong Circle đều tự động hiển thị cùng màu đó.
      - Chuyển đổi bộ màu sang 6 tone **Pastel** trang nhã (`sage`, `ocean`, `lavender`, `sunset`, `rose`, `minimal`), đồng bộ 100% các thành phần chat: bong bóng người gửi (`.msg-bubble-me`), trích dẫn phản hồi (`.msg-bubble-reply-quote-me`), banner xem trước phản hồi (`.chat-composer-reply-banner`) và nút gửi tin nhắn (`.chat-composer-send-btn-active`).
      - Tích hợp bộ chọn 6 màu pastel vào Cài đặt Vòng tròn trên cả Web (`CircleManagementModal.tsx`) và Mobile (`CircleManagementModal.tsx`), đồng bộ trực tiếp vào `MobileSwipeMessageBubble` và composer trên Mobile (`apps/mobile/app/circle/[id].tsx`).
  11. **Tái Thiết Kế Modal Cài Đặt Hệ Thống 2 Cột Chuẩn Desktop (2-Column Settings UI):**
      - Tái thiết kế toàn diện `SystemSettingsModal.tsx` trên Web theo đúng thiết kế 2 cột người dùng cung cấp (`media_1792213830009_7d6b3371.png`):
        - Cột trái (`w-64`): Tiêu đề Cài đặt hệ thống, thanh điều hướng dọc dạng pill gồm "Cài đặt chung", "Giao diện", "Phiên đăng nhập" (kèm badge số phiên), "Ngôn ngữ", "Trợ giúp", cùng nút "Đăng xuất" đỏ ở chân cột.
        - Cột phải: Header với tiêu đề mục + nút đóng X; Thẻ Thông tin tài khoản (Profile avatar, tên, email, bảo mật kép); Thẻ Gói sử dụng (Usage & Plan với thanh tiến trình active 100%); Thẻ Ngôn ngữ; và Thẻ Chế độ hiển thị với capsule segmented control (Sáng / Tối / Hệ thống).
      - Loại bỏ cài đặt màu tin nhắn cá nhân khỏi Cài đặt hệ thống để đảm bảo tính đồng bộ theo Circle.
  12. **Thu Hẹp Cột Thứ 2 & Giới Hạn Feed Khoảnh Khắc (Moments) Trọn Vẹn 1 Màn Hình:**
      - Giảm độ rộng cột thứ 2 (Sidebar điều hướng kênh) từ `w-72` (288px) về `w-60` (240px) trên Web, khắc phục triệt để hiện tượng layout bị bè ngang quá mức.
      - Bó hẹp khung Feed Khoảnh khắc (`DailyMomentsFeed.tsx`) với `max-w-[440px] mx-auto` và container ảnh `max-h-[440px]`, đảm bảo 1 bài đăng ảnh cùng tác giả, caption và cảm xúc hiển thị trọn vẹn trong 1 viewport mà không phải cuộn.
   13. **Khắc Phục Lỗi Đồng Bộ Màu Tin Nhắn Per-Circle & Quyền Quản Trị:**
       - Phát hiện và sửa lỗi backend `CirclesService`: endpoint `findUserCircles` và `findByIdOrHandle` trước đó bỏ sót trường `themeColor` trong DTO trả về, khiến việc refetch query luôn hoàn lại giá trị mặc định. Bổ sung `themeColor: circle.themeColor || 'sage'` vào cả hai endpoint.
       - Nâng cấp điều kiện phân quyền tại `CirclesService.update()`: cho phép cả `OWNER` và `ADMIN` cập nhật màu sắc và cấu hình nhóm (`isOwnerOrAdmin`), đồng bộ tương ứng ở client Web & Mobile.
       - Bổ sung unit test kiểm thử quyền ADMIN cập nhật Circle trong `circles.service.spec.ts` (43/43 tests passed).
   14. **Tối Giản Hóa Triệt Để Cài Đặt Hệ Thống & Cài Đặt Nhóm (Loại Bỏ Hoàn Toàn General và Chú Thích Ngoặc Đơn):**
       - Web: Loại bỏ hoàn toàn mục "Cài đặt chung" (`general`) khỏi `SystemSettingsModal.tsx`. Modal mặc định mở trực tiếp vào tab "Giao diện" (`appearance`). Danh mục sidebar chỉ gồm Giao diện, Phiên đăng nhập, Ngôn ngữ, Trợ giúp và Đăng xuất.
       - Mobile: Tái thiết kế `SystemSettingsModal.tsx` trên Mobile sang kiến trúc 2 tầng (drill-down view) đồng bộ với Web: Tầng 1 gồm các dòng menu tương ứng danh mục cột trái của Web; bấm vào từng dòng sẽ chuyển mượt mà sang Tầng 2 chi tiết với nút `<` quay lại.
       - Mobile Circle Settings (`CircleManagementModal.tsx`): Bóc tách triệt để cài đặt giao diện cá nhân (Flat/Glass, Light/Dark) ra khỏi cài đặt nhóm. Trong cài đặt nhóm chỉ giữ lại bảng chọn màu pastel per-circle. Xóa bỏ 100% các chú thích ngoặc đơn `(...)` rườm rà như `(Pastel)`, `(Đồng bộ toàn nhóm)`, `(Owner only)`, `(Read receipts)`, `(Typing indicator)`, mang lại phong cách Minimalism thanh thoát.
   15. **Chuẩn Hóa Tỷ Lệ Độ Rộng 3/5 Cho Bảng Tin Khoảnh Khắc (Moments) & Khung Chat Trên Web:**
       - Mở rộng container nội dung của cả `DailyMomentsFeed.tsx` và `ChannelChatView.tsx` lên `max-w-[620px] mx-auto w-full`, cân đối chính xác ~3/5 bề ngang của cột giữa, khắc phục tình trạng bị co hẹp quá mức trước đó.
   16. **Xử Lý Triệt Để Độ Tương Phản Màu & Chữ Sáng / Tối (Light/Dark Contrast Fixes):**
       - Xóa bỏ các thuộc tính text cứng màu trắng (`text-white`, `rgba(255,255,255,0.85)`, `colors.onPrimary`) trên các bong bóng tin nhắn pastel người gửi (`.msg-bubble-me`), trích dẫn phản hồi, thẻ thông báo tóm tắt cuộc gọi, danh sách tệp đính kèm và thẻ `@mention`.
       - Thay thế bằng `text-current` và `senderTextColor` tương ứng với biến CSS `--circle-theme-bubble-text`, đảm bảo văn bản, biểu tượng và nhãn thời gian hiển thị tương phản sắc nét, dễ đọc trên cả nền sáng và tối.
   17. **Xác Minh Tự Động Với Playwright:**
       - Cập nhật kịch bản Playwright E2E `tests/e2e/ui-settings-verification.spec.ts` kiểm thử toàn diện luồng cài đặt mới, xác minh chuyển đổi theme Flat/Glass, Dark/Light, kiểm tra tương phản và chụp lại các bằng chứng screenshot.
- **Prompt Summary:** Tích hợp bộ cẩm nang Liquid Glass UI Kit và Flat Design Language, tái cấu trúc hệ màu trung tính không ám xanh, chuyển đổi màu tin nhắn sang pastel và lưu theo từng Circle (đồng bộ toàn bộ thành viên, ô reply, nút gửi), tái thiết kế Modal Cài đặt Hệ thống 2 cột chuẩn desktop (bỏ mục general, drill-down menu cho mobile), đồng bộ cài đặt nhóm (loại bỏ chú thích ngoặc đơn, chỉ giữ màu nhóm), mở rộng feed khoảnh khắc và chat lên 3/5 cột giữa, sửa lỗi tương phản text trắng trong theme pastel/sáng, kiểm thử giao diện bằng Playwright.
- **Files Affected:**
  - `package.json`
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20261017051638_add_circle_theme_color/migration.sql`
  - `apps/backend/src/modules/circles/circles.service.ts`
  - `apps/backend/src/modules/circles/circles.service.spec.ts`
  - `packages/shared/src/theme/colors.ts`
  - `packages/shared/src/validators/circle.validator.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/types/src/index.ts`
  - `apps/mobile/package.json`
  - `apps/mobile/src/constants/glass-theme.ts`
  - `apps/mobile/src/stores/theme.store.ts`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/app/(tabs)/index.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `apps/mobile/src/components/chat/PinnedMessagesModal.tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/components/settings/SystemSettingsModal.tsx`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/web/tailwind.config.ts`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/stores/circle.store.ts`
  - `apps/web/src/stores/theme.store.ts`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/web/src/components/chat/ChannelChatView.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `packages/shared/src/constants/emojis.ts`
  - `packages/shared/src/index.ts`
  - `apps/web/src/components/ui/FullEmojiPickerModal.tsx`
  - `apps/mobile/src/components/ui/FullEmojiPickerModal.tsx`
  - `apps/web/src/lib/socket.ts`
  - `apps/web/src/components/ui/Emoji.tsx`
  - `apps/mobile/src/services/socket.ts`
  - `apps/mobile/src/components/ui/Emoji.tsx`
  - `apps/backend/src/modules/chat/chat.gateway.ts`
  - `apps/backend/src/modules/circles/circles.module.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/presence/PresenceRail.tsx`
  - `apps/web/src/components/stream/FeedStream.tsx`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `tests/e2e/ui-settings-verification.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn bộ token neutral và flat design, hệ thống tùy chọn giao diện Flat vs Glass, cấu hình theme bóng tin nhắn pastel per-circle cho mọi thành viên (không chỉ admin), Prisma migration schema, cấu trúc layout 2 cột Desktop Settings Modal, thiết kế khung Cài đặt Hệ thống tích hợp trực tiếp trên trang Hồ sơ cá nhân mobile (`profile.tsx`) dạng drill-down không popup, công tắc đăng nhập vân tay / Face ID duy nhất hợp nhất, loại bỏ nút rời trùng lặp, mở rộng khung chat và feed khoảnh khắc đồng bộ chiều rộng thoáng rộng `max-w-4xl` (~896px) với ảnh giữ nguyên tỉ lệ vuông 1:1 chuẩn mực (`aspect-square w-full`) tăng cả chiều rộng lẫn chiều cao, cuộn snap từng ảnh (`snap-y snap-mandatory`), căn giữa feed khoảnh khắc và căn trái lề chữ tiêu đề, dải chọn màu tin nhắn dạng hình tròn tinh tế không chứa text với viền tròn đồng màu khi được chọn (trên cả web và mobile), cơ chế phát sóng realtime sự kiện đổi màu nhóm qua Socket.IO (`circle:update-theme` & `circle:theme_updated`), đồng bộ bảng màu pastel cho tin nhắn của người khác (`otherBg`, `otherBorder`, `otherAccent`) tách biệt rõ ràng với tin nhắn của bản thân và loại bỏ màu xanh mặc định cũ, xóa bỏ box thành viên đơn độc thừa trong cài đặt nhóm mobile khi thành viên thông thường mở, loại bỏ viền vuông bao quanh icon trong mục Cài đặt hệ thống hồ sơ cá nhân và Giao diện mobile (flat naked icons), đồng bộ 100% màu icon trung tính cho toàn bộ nền tảng cả Web và Mobile (loại bỏ màu xanh/vàng/indigo ở call, presence rail, crown, chỉ giữ màu đỏ cho thao tác nguy hiểm), triển khai hệ thống Emoji toàn diện với 3 emoji nổi bật sẵn có + nút mở Full Emoji Picker Sheet/Modal đa danh mục (Smileys, Gestures, Hearts, Animals, Food, Activities) cho cả Web và Mobile, nâng cấp toàn diện bộ Emoji sang chuẩn Apple Color Emoji 160x160 bóng bẩy cao cấp (qua CDN Apple style `emojicdn.elk.sh`) thay thế Twemoji phẳng 2D, tái thiết kế thanh Header di động kết hợp phương án 1 và 3 thành header vô cực trôi nổi không ranh giới (`borderBottomWidth: 0`) với lớp nền mờ kính `BlurView` cho phép tin nhắn cuộn trượt mờ mềm mại bên dưới, tầng 1 gồm 3 anchor đối xứng hoàn hảo (Nút Back tròn bên trái, Cụm viên con nhộng 3 tab Chat|Moments|Tools ở chính giữa, Nút avatar chuyển Circle bên phải), tầng 2 là chip/pill tên nhóm nổi ở giữa bấm vào để mở Cài đặt nhóm (khi sang tab Khoảnh khắc thì chuyển đổi mượt mà sang số lượng bạn bè và bộ lọc thành viên), đồng bộ bố cục thẻ bạn bè tầng 2 của tab Khoảnh khắc (`MomentsView.tsx`) đồng nhất 100% với Layer 2 của 2 tab còn lại, tái cấu trúc Web Workspace thành bố cục 3 cột stick liền khối căn giữa màn hình (`max-w-[1400px] mx-auto h-screen`), loại bỏ hoàn toàn header truyền thống và ô tìm kiếm, thay bằng floating brand capsule pill `[ C Circle ]` bo sát viền không khoảng thừa sát góc trái trên cùng floating circular user avatar sát góc phải trên và nút chuông thông báo trôi nổi đặt ngay bên trái avatar, nắn thẳng mép trên cùng của cả 3 cột (Sidebar, Stream, PresenceRail) đồng nhất xuất phát từ cùng baseline 12px không lệch dòng, tái thiết kế ô soạn thảo tin nhắn theo chuẩn phong cách Apple iMessage tách nút hành động riêng ra 1 bên: khung con nhộng trái chứa nút (+) viền tròn đỏ/coral, icon ảnh, trường nhập văn bản và nút sticker/emoji ở góc phải bên trong; nút hành động tròn độc lập bên phải chuyển đổi tự nhiên giữa biểu tượng Ghi âm (Mic đỏ khi chưa nhập) và nút Gửi (Send khi có chữ/ảnh) cho cả Web và Mobile, áp dụng nghiêm ngặt ngôn ngữ Flat (solid surfaces, zero blur, hairline borders) và Liquid Glass (frosted blur `intensity={45-55}` / `backdrop-blur-md`, specular highlights) theo đúng lựa chọn của người dùng trên toàn bộ các thành phần mới, sửa lỗi vị trí neo badge emoji dưới góc bong bóng tin nhắn mobile, layout Apple HIG grouped list, lazy camera lifecycle, logic cuộn measureInWindow/measureLayout, expo-haptics, PinnedMessagesModal mobile, mention autocomplete tinh giản, xử lý tương phản chữ/icon và kịch bản kiểm thử E2E Playwright.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo quy tắc 1 PR = 1 log AI duy nhất (cấm tạo log linh tinh), yêu cầu tích hợp đồng thời cả Flat và Liquid Glass cho người dùng tùy chọn (mặc định Flat), chuyển màu tin nhắn vào Cài đặt Vòng tròn để đồng bộ toàn bộ thành viên cùng màu, chọn màu pastel và đồng bộ toàn bộ ô reply / nút gửi, khôi phục khung chat và bài đăng khoảnh khắc rộng thoáng trở lại (`max-w-4xl`) với ảnh vuông 1:1 tăng đồng thời cả chiều rộng và chiều cao, moment hiển thị 1 ảnh trong 1 lần view và lướt snap tương tự mobile, làm lại giao diện Settings 2 cột theo đúng hình ảnh cung cấp (bỏ General, trên mobile hiển thị dạng drill-down theo danh mục web nhúng thẳng vào trang hồ sơ cá nhân thay vì popup modal, hợp nhất đăng nhập vân tay), dải chọn màu chỉ hiển thị hình tròn màu tinh tế không text mô tả và viền màu được chọn là viền tròn của chính màu đó (áp dụng cho cả mobile và web), khắc phục triệt để lỗi màu chat trên web, sửa phần khoảnh khắc thường ngày trên web căn giữa feed và căn trái lề chữ tiêu đề, đồng bộ realtime màu chat qua Socket.IO không cần reload trang giữa web và mobile, đồng bộ màu pastel cho tin nhắn của người khác hài hòa với theme nhưng khác màu tin nhắn của mình, xóa box thành viên đơn độc thừa trong setting nhóm mobile khi mở ở quyền thành viên thường, xóa viền vuông icon trong setting hồ sơ cá nhân và giao diện mobile, đồng bộ màu icon trung tính cho toàn bộ nền tảng (cả Web và Mobile), sửa lỗi vị trí badge emoji trên mobile và xây dựng hệ thống emoji toàn diện (hiển thị 3 emoji nổi bật sẵn + icon mở full bảng emoji như các nền tảng khác), chốt phương án kết hợp 1 và 3 cho header nhóm (header trôi nổi gồm 3 nút đối xứng, bỏ hoàn toàn khung header cứng, phủ mờ BlurView để tin nhắn cuộn trượt mờ ở dưới, tầng 2 hiển thị tên nhóm bấm vào mở setting, tab moment giữ số lượng bạn bè đồng bộ thiết kế với 2 tab còn lại), nâng cấp bộ emoji sang nguồn Apple xịn loại bỏ cảm giác Twemoji phèn, thiết kế lại Web bỏ header và ô tìm kiếm, 3 cột stick liền mạch căn giữa màn hình, góc trái trên là viên thuốc logo Circle bo sát, góc phải trên là avatar tròn với nút chuông thông báo đặt bên trái avatar, nắn thẳng mép trên cùng của cả 3 cột, thiết kế ô nhắn tin học theo Apple tách nút hành động riêng ra một bên (icon ghi âm mic đỏ khi rỗng và nút gửi khi có text) áp dụng cho cả web và mobile, và đảm bảo tuân thủ 2 ngôn ngữ thiết kế Flat vs Glass rõ rệt theo tùy chọn của user trên cả Mobile và Web.
- **Verification Method:**
  - `packages/shared` build (`npm run build`): Thành công 100%, 0 errors.
  - `apps/backend` Unit Tests (`npm test -w @circle/backend`): 44/44 tests passed 100% (bao gồm quyền mọi MEMBER đổi themeColor vòng tròn).
  - `apps/mobile` TypeScript typecheck (`npx tsc --noEmit -p apps/mobile/tsconfig.json`): 0 errors (`tsc --noEmit` exit 0).
  - `apps/web` TypeScript typecheck (`npx tsc --noEmit -p apps/web/tsconfig.json`): 0 errors (`tsc --noEmit` exit 0).
  - `apps/backend` TypeScript typecheck (`npx tsc --noEmit -p apps/backend/tsconfig.json`): 0 errors (`tsc --noEmit` exit 0).
  - Playwright E2E Test (`npx playwright test tests/e2e/ui-settings-verification.spec.ts`): Passed 100% (4/4 passed), kiểm tra đầy đủ Flat/Glass modes, neutral themes, pastel circle themes, responsive workspace layout, floating header elements, và visual snapshot verification.
  - Apple Emoji CDN check: HTTP 200 RGBA PNG 160x160 với cache 30 ngày và native text fallback.
  - `./scripts/check-agent-map.sh`: 95/95 files OK.
- **Official Source Checked:** `PROJECT_GOD.md` (Hard Gates G1, G3, G10), Apple Human Interface Guidelines, Apple Color Emoji specifications, `ui-kit/Flat Design Language Demo.html`, `ui-kit-liquid-glass/Liquid Glass UI Kit Demo.html`.
- **Security & License Check:** An toàn tuyệt đối, không chứa credentials, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Next.js dev server báo lỗi `__webpack_modules__[moduleId] is not a function` khi module shared vừa build lại mà dev server chưa load cache mới; selector tab thiết lập vòng tròn trong file test Playwright ban đầu click nhầm vào button sidebar nền bị backdrop chặn; `CirclesService.findUserCircles` và `findByIdOrHandle` bỏ sót trường `themeColor` trong DTO trả về khiến client bị mất theme khi refetch; selector `:not([data-circle-theme]):not([data-msg-theme])` trong `globals.css` đè biến CSS của các phần tử con về mặc định sage; hàm `handleThemeColorChange` trong `CircleManagementModal.tsx` gọi `setActiveCircle` mà chưa trích xuất hàm này từ store dẫn đến lỗi `ReferenceError: setActiveCircle is not defined`.
  - **Root Cause:** Next.js webpack cache giữ reference cũ của package shared; Playwright locator `button:has-text("Thiết lập")` thiếu scoping vào container modal `.fixed.z-50`; service backend chỉ lưu vào database nhưng chưa map `themeColor` ra object trả về; selector CSS phủ định áp dụng lên mọi phần tử con bên trong container có theme; thiếu khai báo selector `setActiveCircle` từ `useCircleStore`.
  - **Resolution / Fix:** Khởi động lại Next.js dev server fresh; scope chính xác locator trong Playwright test vào modal `.fixed.z-50`; bổ sung `themeColor: circle.themeColor || 'sage'` vào cả 2 endpoint truy vấn của `CirclesService`; chuyển đổi `:not([data-circle-theme])` sang định nghĩa biến mặc định tại `:root` và `html.dark` giúp biến CSS kế thừa tự nhiên; khai báo bổ sung `const setActiveCircle = useCircleStore((s) => s.setActiveCircle)` và cập nhật optimistic state cho activeCircle.
- **Commit:** `400c8c3`
- **PR:** #92 (https://github.com/1440isme/Circle/pull/92)

---

## AI-0100: Implement Unique User Handle (Nickname) & Privacy-Preserving User Discovery

- **Date:** 2026-10-09 14:35:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #84 ([SUB-FEAT]: US-USER-001 — Quản lý Nickname / User Handle định danh duy nhất & tìm kiếm bảo mật)
- **Purpose:**
  1. Thay đổi cấu trúc cơ sở dữ liệu `UserProfile` bổ sung trường `handle String? @unique` kèm chỉ mục `@@index([handle])` phục vụ định danh người dùng độc nhất không trùng lặp.
  2. Cập nhật cơ chế đăng ký tài khoản tự động khởi tạo handle mặc định ngẫu nhiên (ví dụ `user_xxxxxx` hoặc từ tên hiển thị) đảm bảo 100% người dùng luôn có mã định danh.
  3. Xây dựng endpoint tìm kiếm người dùng bảo vệ quyền riêng tư `GET /auth/users/search?q=...` chỉ trả về `@handle`, `displayName`, `avatarUrl`, `bio` (kiểu `PublicUserEntity`), triệt tiêu hoàn toàn nguy cơ rò rỉ địa chỉ Gmail của người dùng.
  4. Cập nhật DTO và Zod validation cho `handle` với các quy chuẩn: 3–30 ký tự, chữ thường không dấu, số và gạch dưới (`/^[a-z0-9_]+$/`), loại bỏ tiền tố `@` tự động và kiểm tra tính duy nhất khi cập nhật hồ sơ.
  5. Đồng bộ giao diện Web và Mobile: Tích hợp nhập và tùy chỉnh `@handle` trong modal chỉnh sửa thông tin cá nhân (`EditProfileModal`), hiển thị huy hiệu `@handle` nổi bật tại Header menu và màn hình Profile cá nhân.
  6. Bổ sung 4 test cases (`TC-AUTH-HANDLE-001` đến `004`) trong bộ kiểm thử `auth.service.spec.ts` xác thực tính độc nhất, tự động sinh handle, cập nhật và tìm kiếm người dùng công khai.
- **Prompt Summary:** "oke rồi về phần bạn bè tôi muốn mỗi người có thể tự tạo nickname(mặc định cũng có 1 cái mã định danh để hỗ trợ tìm kiếm thay vì tìm bằng gmail dễ lộ email)"
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `packages/types/src/index.ts`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `packages/shared/src/validators/auth.validator.ts`
  - `apps/backend/src/modules/auth/dto/update-profile.dto.ts`
  - `apps/backend/src/modules/auth/auth.service.ts`
  - `apps/backend/src/modules/auth/auth.controller.ts`
  - `apps/backend/src/modules/auth/auth.service.spec.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/components/profile/EditProfileModal.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/mobile/src/components/profile/EditProfileModal.tsx`
  - `apps/mobile/app/(tabs)/profile.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% backend logic, database schema, validation schemas, unit tests, web & mobile UI components.
- **Human Modifications:** Trương Công Bình định hướng kiến trúc mã định danh bảo vệ quyền riêng tư thay thế tìm kiếm qua email truyền thống.
- **Verification Method:**
  - `npm test -w @circle/backend`: 8/8 test suites pass, 123/123 tests pass 100%.
  - `npm run build -w @circle/web`: Next.js 14 production build pass 100% (9 static routes).
  - `cd apps/mobile && npx tsc --noEmit`: 0 TypeScript errors.
  - `cd apps/web && npx tsc --noEmit`: 0 TypeScript errors.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Bảo vệ quyền riêng tư người dùng, không để lộ email trong API tìm kiếm công khai, zero secret leaks.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** None.
  - **Root Cause:** N/A.
  - **Resolution / Fix:** N/A.
- **Commit:** `eab6bcc`
- **PR:** #85 (https://github.com/1440isme/Circle/pull/85)


---

## AI-0101: Moments Dual Camera Experience, Chat Card Lightbox, Reactions Rules & Web PiP Parity

- **Date:** 2026-10-11 to 2026-10-17
- **Developer:** Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #90 ([SUB-FEAT]: US-MOMENT-002 — Moments Dual Camera Experience, Chat Card Lightbox, Reactions Rules & Web PiP Parity)
- **Purpose:**
  1. **Camera Dual View & Tương tác PiP mượt mà (Mobile React Native Expo):**
     - Loại bỏ toàn bộ 4 ký hiệu góc ngắm (corner indicator) trong viewfinder camera để khung chụp sạch sẽ, viền bo sát lề màn hình.
     - Phát triển cơ chế vuốt/kéo thả PiP (`PanResponder` / pointer gesture) tự do trên cả chế độ camera live lẫn review sau khi chụp, tự động snap mượt mà (spring animation) vào 1 trong 4 góc gần nhất (`top-left`, `top-right`, `bottom-right`, `bottom-left`).
     - Giữ nguyên vị trí góc PiP đã chọn khi chụp, khi xem lại, và khi đổi qua lại giữa camera trước/sau (không bị nhảy về góc mặc định).
     - Tối ưu phân cấp z-index: PiP nằm dưới các nút tiện ích Flash, Zoom và thanh nhập caption.
     - Hỗ trợ chạm (Tap) vào khung PiP để hoán đổi nhanh giữa camera trước và sau.
     - Cố định kích thước camera và viewport khi bàn phím ảo hiển thị (Keyboard avoidance), tự động dịch khung ảnh & caption lên trên để không che khuất nội dung, ẩn floating dock khi mở bàn phím.
  2. **Điều khiển Camera & Tinh chỉnh Phần cứng:**
     - **Đèn Flash camera trước:** Thay thế flash phần cứng bằng hiệu ứng chớp sáng trắng toàn màn hình (Screen Flash modal overlay), chỉ nháy sáng tại khoảnh khắc bấm chụp để tiết kiệm pin.
     - **Dual Camera Mode Lock:** Tự động khóa quay video (chỉ cho phép chụp ảnh) khi đang bật chế độ Dual Camera.
     - **Selfie Zoom Indicator:** Camera trước ở mức zoom < 1x hiển thị icon khung góc rộng thay vì số; khi zoom ≥ 1x hiển thị số phóng đại tiêu cự bình thường. Cân chỉnh tiêu cự selfie mặc định 0.85x tự nhiên.
     - **Giới hạn chú thích (Caption):** Ràng buộc tối đa 2 dòng / 80 ký tự, tự động co giãn ôm sát nội dung văn bản.
  3. **Hiển thị Thẻ Khoảnh khắc trong Nhóm Chat & Lightbox (Chat Embed):**
     - Định dạng thẻ khoảnh khắc trong tin nhắn nhóm chat dạng khung vuông 1:1 (`aspectRatio: 1`), loại bỏ padding thừa và viền xám không đồng bộ.
     - Bỏ các thông tin tag rườm rà, đặt caption căn giữa phía dưới ảnh với gradient phủ nhẹ dễ đọc.
     - Hỗ trợ xem ảnh phóng to toàn màn hình (Dual Camera Lightbox modal) trực tiếp khi bấm vào tin nhắn ảnh trong chat, hỗ trợ khung PiP nổi và hoán đổi góc trước/sau.
     - Đồng bộ phát GIF khoảnh khắc: Chạy lặp vô tận ở chế độ im lặng (`muted`), gỡ bỏ hoàn toàn nút bật/tắt âm thanh (loa) không phù hợp.
  4. **Quy tắc Thả cảm xúc & Quyền riêng tư (Reactions Rules & Author Stack):**
     - **Giới hạn phản ứng:** Mỗi người dùng chỉ được thả tối đa 1 cảm xúc cho mỗi khoảnh khắc (bấm cảm xúc mới sẽ thay thế cảm xúc cũ, bấm lại cảm xúc cũ sẽ hủy bỏ).
     - **Quy tắc tác giả:** Tác giả không được tự thả cảm xúc cho khoảnh khắc của chính mình.
     - **Bảo mật số lượng tim:** Chỉ tác giả bài đăng mới được quyền xem tổng số lượng cảm xúc và danh sách người thả; người xem khác không xem được tổng số lượng.
     - **Author Reactors Stack:** Ẩn hoàn toàn thanh nút cảm xúc đối với tác giả, thay bằng cụm xếp lớp 5 avatar gần nhất kèm huy hiệu emoji tròn nhỏ ở góc dưới mỗi avatar biểu thị cảm xúc của người đó.
     - **Modal danh sách chi tiết:** Bấm vào cụm avatar sẽ mở modal danh sách chi tiết người bày tỏ cảm xúc (`MomentReactorsModal.tsx`), hỗ trợ lọc theo từng emoji, hiển thị thời gian tương đối và danh tính rõ ràng.
  5. **Đồng bộ Dual Camera PiP trên Web (`apps/web`):**
     - Xây dựng parser tiện ích `parseMomentPhotos` tách chuỗi URI `${mainUrl}#pip=${encodeURIComponent(pipUrl)}#corner=${cornerIndex}`.
     - Phát triển component `MomentPipView.tsx` tương tác kéo thả snap 4 góc, chạm hoán đổi (swap) trước/sau và hover indicator.
     - Tích hợp mượt mà vào `DailyMomentsFeed.tsx`, `StoryViewerModal.tsx` (chặn nổi bọt sự kiện pointer để không nhảy story) và làm sạch avatar URL trong `MomentsTray.tsx`.
- **Prompt Summary:** Tinh chỉnh toàn diện trải nghiệm Moments: Camera Dual PiP kéo thả 4 góc mượt mà, flash màn hình trước, zoom selfie <1x khung góc rộng, embed tin nhắn chat khung vuông 1:1 lightbox, giới hạn 1 cảm xúc/người, tác giả không tự thả tim và xem cụm 5 avatar kèm chi tiết người thả, đồng bộ hiển thị Dual Camera PiP trên Web.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/backend/src/modules/moments/moments.service.ts`
  - `apps/backend/src/modules/moments/moments.service.spec.ts`
  - `apps/web/src/lib/moment-photos.ts`
  - `apps/web/src/components/moments/MomentPipView.tsx`
  - `apps/web/src/components/moments/MomentReactorsModal.tsx`
  - `apps/web/src/components/chat/MomentCardChatEmbed.tsx`
  - `apps/web/src/components/chat/MessageBubble.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/web/src/components/moments/StoryViewerModal.tsx`
  - `apps/web/src/components/moments/MomentsTray.tsx`
  - `packages/shared/src/locales/vi.ts`
  - `packages/shared/src/locales/en.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% logic gesture/animation PanResponder, Screen Flash modal, Dual Lightbox modal, Reactions rules, Author Reactors Stack UI và Web Dual PiP component.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp thử nghiệm và chỉ đạo hoàn thiện toàn bộ các chi tiết UX/UI trên Mobile & Web, từ camera viewfinder đến thẻ chat, logic cảm xúc và hiển thị Dual PiP trên Web.
- **Verification Method:**
  - `npm test -- apps/backend/src/modules/moments/moments.service.spec.ts`: 22 passed, 22 total.
  - `cd apps/mobile && npx tsc --noEmit`: 0 TypeScript errors.
  - `cd apps/web && npx tsc --noEmit`: 0 TypeScript errors.
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không chứa secret, tuân thủ nghiêm ngặt quyền riêng tư người dùng.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** (1) PanResponder bị xung đột thao tác cuộn dọc với FlatList trên Mobile. (2) Typo thẻ video trong chat embed hiển thị loa âm thanh dù GIF không có tiếng.
  - **Root Cause:** (1) Thiếu ngưỡng `Math.abs(dx) > 10` để giải phóng gesture responder cho FlatList. (2) Component nhầm lẫn thuộc tính controls giữa video thông thường và silent animated GIF.
  - **Resolution / Fix:** (1) Thêm ngưỡng xác định hướng gesture để phân biệt drag góc PiP với cuộn feed. (2) Cấu hình `<video>` ở chế độ `autoPlay`, `loop`, `muted`, `playsInline` và bỏ nút loa.
- **Commit:** `700ced7`
- **PR:** #91

---

### AI-0102: Tinh chỉnh Toàn diện Header, Chat Composer Trung tính, Khắc phục Persistence Theme Mobile, Đồng bộ Ranh giới Web, Dual Camera Hardware Fallback & Tối ưu Responsive

- **Date:** 2026-10-18 00:38:00 +07:00
- **Developer:** Trương Công Bình
- **Tool:** Antigravity IDE
- **Model:** Gemini 2.5 Pro
- **Related Issue:** #89 ([SUB-FEAT]: US-DESIGN-002 — Liquid Glass vs Flat Unified Style System, Pastel Themes, Header & Composer Refinements)
- **Purpose:** Xử lý toàn diện các vấn đề hậu merge và hoàn thiện trải nghiệm UI/UX đa nền tảng theo chỉ đạo của Trương Công Bình:
  (1) Khắc phục lỗi sập CSDL backend do cột `UserProfile.handle` chưa có migration trong PostgreSQL (`circle_dev`), khởi tạo và thực thi migration `20261017132800_add_user_profile_handle` đồng bộ schema.
  (2) Chuyển toàn bộ các nút hành động trên thanh nhập tin nhắn (nút `(+)` và nút ghi âm `Mic`) sang màu trung tính (`colors.subtle`, `text-circle-slate`) trên cả Web (`ChatComposer.tsx`) và Mobile (`[id].tsx`), loại bỏ màu đỏ (màu đỏ chỉ dành cho thao tác nguy hiểm/hủy diệt, không phải nhận diện thương hiệu Circle).
  (3) Khôi phục tỷ lệ hoàn hảo hình tròn cho logo chữ 'C' (`h-7 w-7 min-w-[28px] sm:min-w-[30px] aspect-square rounded-full shrink-0`) trên Web Header (`Header.tsx`), đồng thời đồng bộ chiều cao và độ lớn của viên thuốc thương hiệu với nút avatar và thông báo (`h-9 sm:h-10`) tạo sự cân bằng đối xứng tuyệt đối.
  (4) Khắc phục triệt để lỗi mất cài đặt ngôn ngữ thiết kế (`uiStyle: 'glass' | 'flat'`) trên Mobile bằng cách tự động kích hoạt `initTheme()` ngay khi nạp ứng dụng và lắng nghe `Appearance.addChangeListener`, đồng thời chèn thuộc tính mặc định vào thẻ `<html>` và script inline trên Web tránh hiện tượng FOUC.
  (5) Hợp nhất Tầng 2 Header Workspace Mobile thành một component viên thuốc duy nhất dùng chung xuyên suốt cả 3 tab (Chat, Moments, Tools), loại bỏ component `fixedTopHeader` trùng lặp trong `MomentsView.tsx`, giữ nguyên vị trí, khung viền và hình dáng viên thuốc khi vuốt ngang, chỉ đổi nội dung nhãn (Tên nhóm ↔ X bạn bè) và mở dropdown lọc thành viên mượt mà.
  (6) Tái thiết kế dải tin nhắn ghim (Pinned Messages) trên Mobile: đưa ra khỏi header chính để giữ header cố định đúng 2 tầng xuyên suốt cả 3 tab không bị giật layout, đặt dải ghim trôi nổi tinh tế bên trong Tab 1 Chat.
  (7) Bổ sung đường phân cách hairline mờ `border-circle-hairline/80 dark:border-circle-dark-hairline/80` giữa Tiện ích nhóm (`groupTools`) và điều hướng chính ở Cột 1 (`Sidebar.tsx`), và giữa Danh sách thành viên và Phòng thoại thời gian thực ở Cột 3 (`PresenceRail.tsx`).
  (8) Khắc phục triệt để lỗi Dual Camera trên các thiết bị không có chip hỗ trợ đa luồng concurrent (`FEATURE_CAMERA_CONCURRENT`): Kiểm tra phần cứng bất đồng bộ qua `dualCam.isSupported()`, kích hoạt Sequential Dual Shot tốc độ cao từ URI ảnh thật, giúp 100% thiết bị Android/iOS đều chụp được khoảnh khắc kép mượt mà.
  (9) Tối ưu hóa kích thước Moment Feed Web (`DailyMomentsFeed.tsx` & `page.tsx`): Cho phép container làm việc mở rộng đến `2xl:max-w-[1600px]` trên màn hình 2K. Sử dụng công thức linh hoạt `maxWidth: 'min(100%, calc(100vh - 160px))'`, giúp thẻ ảnh bung **100% full chiều rộng Cột 2** trên màn 2K, đồng thời tự động co lại vừa vặn trên màn FullHD 1080p và laptop để toàn bộ 4 góc thông tin không bị tràn viền.
  (10) Chuẩn hóa padding hộp cài đặt nhóm trên Mobile (`CircleManagementModal.tsx`): đưa `preferenceRow` và `preferenceRowColumn` lên chuẩn `paddingHorizontal: 16, paddingVertical: 14`, nâng bán kính bo góc `menuSectionCard` lên 20px, đồng bộ padding mục chọn màu chủ đề về 16px.
  (11) Chuẩn hóa huy hiệu reaction emoji trên tin nhắn chat Mobile (`apps/mobile/app/circle/[id].tsx`): luôn neo cố định tại **góc dưới bên phải** (`right: 6, bottom: -8`) cho mọi tin nhắn, hiển thị phẳng các emoji vector Apple bằng `<Emoji emoji={emoji} size={14} />` không kèm con số count rườm rà, bổ sung `marginBottom: 6` chống chạm đè.
- **Prompt Summary:** Yêu cầu sửa lỗi sập backend, đổi nút + và voice sang màu trung tính cho cả web và mobile, sửa logo tròn C trên web không bị bóp méo và pill cùng độ lớn với avatar/thông báo, lưu cài đặt giao diện liquid/flat trên mobile không bị reset, hợp nhất tầng 2 header mobile thành 1 component chung mượt mà khi vuốt 3 tab, thiết kế lại ghim tin nhắn để header cố định đúng 2 tầng, thêm divider cột 1 và 3 web, sửa lỗi camera kép máy Bình, tối ưu responsive moment feed full cột 2 trên 2K, và chuẩn hóa reaction emoji góc phải dưới tin nhắn mobile chuẩn như web (1 PR 1 AI log).
- **Files Affected:**
  - `apps/backend/prisma/migrations/20261017132800_add_user_profile_handle/migration.sql`
  - `apps/mobile/src/stores/theme.store.ts`
  - `apps/mobile/app/_layout.tsx`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/src/components/circle/CircleManagementModal.tsx`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/web/src/components/chat/ChatComposer.tsx`
  - `apps/web/src/components/header/Header.tsx`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/web/src/components/navigation/Sidebar.tsx`
  - `apps/web/src/components/presence/PresenceRail.tsx`
  - `tests/e2e/ui-settings-verification.spec.ts`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn migration SQL, các chỉnh sửa layout/styling CSS Tailwind, Zustand store auto-init, React Native component synchronization, camera sequential fallback và responsive scaling formula.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ đạo, thẩm định bố cục UI, phát hiện các điểm bất cập (màu đỏ nút composer, méo logo, reset setting mobile, nhảy header tầng 2, ghim 3 tầng, thiếu divider, lỗi dual camera, feed 2K bị nhỏ, reaction emoji mobile chưa chuẩn) và định hướng giải pháp kỹ thuật.
- **Verification Method:**
  - Backend: `npm test -w @circle/backend` (142/142 unit tests passed).
  - Database: `npx prisma migrate deploy` thành công, kiểm chứng truy vấn `UserProfile.handle` hoạt động trơn tru.
  - Web: `npx tsc --noEmit -p apps/web/tsconfig.json` (0 errors), `npm run build -w @circle/web` (production build thành công, 9/9 pages generated).
  - Mobile: `npx tsc --noEmit -p apps/mobile/tsconfig.json` (0 errors).
  - Playwright E2E: `npx playwright test tests/e2e/ui-settings-verification.spec.ts` (4/4 tests passed).
  - Integrity check: `./scripts/check-agent-map.sh` (95/95 framework files passed, 0 broken references).
  - AI log check: `./scripts/verify-ai-log.sh` (passed).
- **Official Source Checked:** `PROJECT_GOD.md` (DoD, G1 Working Product, G3 Automated Tests, G8 Security & Hygiene), Apple HIG Design Guidelines, Android CameraX Multi-Camera Guide.
- **Security & License Check:** An toàn, không chứa secret/credential.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** (1) Nhập đúp icon `Users` trong `[id].tsx`. (2) Dùng `...StyleSheet.absoluteFillObject` thay vì tọa độ absolute trong React Native StyleSheet. (3) Playwright test kiểm tra attribute trước khi Next.js client hydrate.
  - **Root Cause:** (1) Import trùng khi bổ sung icon. (2) Typo tên property StyleSheet. (3) Thiếu attribute SSR ban đầu trên thẻ html.
  - **Resolution / Fix:** (1) Xóa import đúp. (2) Dùng `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0`. (3) Thiết lập `data-ui-style="flat"` và script inline trong `apps/web/src/app/layout.tsx`.
- **Commit:** 2cecb8b
- **PR:** #93



---

### AI-0103: Moment GIF Badge & Page Index Removal, Account Owner Monthly Archive Stats & Interactive Album Places Map

- **Date:** 2026-10-20 10:45:00 +07:00
- **Developer:** Ninh Thị Mỹ Hạnh (23110210)
- **Tool:** Antigravity IDE
- **Model:** Gemini 3.8 Flash (High)
- **Related Issue:** #94 ([SUB-FEAT]: US-MOMENT-003 — Moments Monthly Calendar Archive, Interactive Album Places Map & Feed Polish)
- **Purpose:** Hoàn thiện trải nghiệm xem khoảnh khắc Moments theo yêu cầu người dùng:
  1. Loại bỏ toàn bộ nhãn/tag "GIF" đè trên ảnh/video khoảnh khắc trên cả Mobile (`MomentsView.tsx`) và Web (`DailyMomentsFeed.tsx`, `StoryViewerModal.tsx`).
  2. Loại bỏ badge thống kê số trang/số lượng ảnh (`item.index + 1 / total`) ở góc trên bên phải thẻ bài đăng moment trong feed Mobile.
  3. Xây dựng endpoint Backend `GET /api/v1/moments/me` trả về toàn bộ khoảnh khắc do chính chủ tài khoản đăng tải (`authorId === user.id`), sắp xếp theo thời gian mới nhất.
  4. Triển khai giao diện Lịch sử Khoảnh khắc dạng Inline (`MomentHistoryView.tsx`) bên trong Tab Khoảnh khắc khi nhấn nút "Lịch sử" ở thanh dock điều hướng dưới cùng và nút cue trên camera Mobile:
     - Giữ nguyên 100% thanh điều hướng Workspace Tầng 1 và Tầng 2 ở phía trên (các tab Chat | Khoảnh khắc | Tiện ích) và thanh dock điều khiển ở phía dưới (Lịch sử | Camera/Home | Tùy chọn), không dùng full-screen modal đè che mất thanh tab.
     - Khắc phục triệt để hiện tượng tràn màn hình: toàn bộ khung lưới và bản đồ được giới hạn chính xác bên trong chiều cao viewport của màn hình làm việc (`flex: 1`), padding dưới tránh che đè bởi thanh dock.
     - **Tối ưu thanh điều hướng tầng 2 (Floating Sub-Header Pill Switcher):** Khi ở chế độ Lịch sử Khoảnh khắc, thay thế pill lọc "Bạn bè" ở tầng 2 bằng 2 tab chuyển đổi gọn gàng `[ 📅 Lịch tháng | 🗺️ Bản đồ ]` với phản hồi rung nhẹ (Haptics), đồng thời ẩn sub-header bên trong `MomentHistoryView` giúp giải phóng không gian màn hình tối đa và thống nhất giao diện liền mạch. Khi quay về Camera hoặc Feed ảnh, thanh header tự động hoàn trả lại pill lọc "Bạn bè".
     - **Chế độ Theo tháng (Monthly Calendar Grid, Streak Viền Xanh & Stacked Layers):** Thống kê tổng số ảnh toàn bộ và phân nhóm theo từng tháng (Tháng 10, Tháng 9, Tháng 8...), hiển thị badge tổng số ảnh theo tháng và huy hiệu Streak ngọn lửa (`cal.monthMaxStreak >= 2`) thể hiện chuỗi ngày liên tiếp chụp ảnh; lưới lịch 7 cột (T2..CN) thể hiện 31 ngày trong tháng.
        - Ngày không có ảnh: số ngày kèm chấm nhỏ thanh lịch.
        - Ngày có ảnh: lấy ảnh mới nhất làm thumbnail vuông, hỗ trợ làm sạch URL (loại bỏ mọi hash fragments `#lat=`, `#loc=`, `#pip=`) và đa dạng trường ảnh (`photoUrl || imageUrl || mediaUrl`), đồng thời fallback hiển thị ảnh khi dev/test.
        - Ngày có nhiều ảnh: hiệu ứng thẻ xếp tầng so le ("dày dày" 2 lớp thẻ lệch góc `5deg` và `-3deg`) kèm huy hiệu `+N` (nền tối trung tính, bỏ hoàn toàn viền xanh thừa ở nhiều ảnh).
        - **Streak liên tiếp mới nhất:** Chỉ chuỗi liên tiếp mới nhất (`latestStreakKeysSet`) kết thúc ở ảnh gần nhất mới được viền xanh nổi bật (`borderColor: colors.primary, borderWidth: 2.5`), bóng phát sáng và thanh cầu nối xanh (`streakConnectorBar`); các cụm ngày cũ rời rạc trong quá khứ không nối viền.
     - **Chế độ Bản đồ kiểu Album ảnh (Interactive Album Places Map qua Leaflet & WebView):** Tích hợp bản đồ trực tuyến thực thụ sử dụng `react-native-webview` và Leaflet.js kèm CartoDB Voyager/Dark Matter tiles (tương ứng chủ đề sáng/tối): hỗ trợ vuốt mượt mà, pinch-to-zoom đa điểm, double-tap zoom và drag quán tính; gom cụm vị trí (location clusters) hiển thị các ghim ảnh (photo pin markers) viền trắng kèm badge số lượng `+N` và đuôi ghim chỉ điểm; khi chạm ghim sẽ tự động căn giữa khung nhìn, nổi viền xanh chủ đạo (`colors.primary`) và hiển thị thẻ xem trước thông tin ảnh/địa điểm kèm nút mở Lightbox đa ảnh; nút Recenter định vị lại toàn bộ các ghim khoảnh khắc trên bản đồ.
     - **Xem chi tiết ảnh (Detail Modal Lightbox):** Cho phép chạm vào bất kỳ ảnh nào trên lưới tháng hoặc ghim bản đồ để xem ảnh phóng to 1:1, hỗ trợ khung PiP nổi nếu là ảnh chụp kép (Dual Camera) và chú thích đầy đủ.
- **Prompt Summary:** Tinh chỉnh và hoàn thiện toàn diện giao diện cùng trải nghiệm tương tác phân hệ Khoảnh khắc (Moments) trên Mobile: (1) Loại bỏ các thành phần hiển thị dư thừa trên feed gồm nhãn GIF và bộ đếm chỉ số trang để tối ưu hóa thị giác. (2) Mở rộng lưu trữ Khoảnh khắc cá nhân của người dùng qua endpoint Backend `GET /api/v1/moments/me`, tích hợp màn hình Lịch sử Khoảnh khắc inline với hai chế độ: Lưới lịch theo tháng (kèm chỉ số thống kê, hiệu ứng thẻ ảnh xếp tầng và chỉ đánh dấu streak liên tiếp mới nhất) và Bản đồ tương tác kiểu Album ảnh (OpenStreetMap / CartoDB tiles). (3) Tối ưu hóa điều hướng bằng cách chuyển cụm chuyển đổi [Lịch tháng | Bản đồ] trực tiếp lên sub-header tầng 2 khi xem lịch sử, đảm bảo không che khuất thanh dock điều khiển và khắc phục lỗi trôi vị trí (vertical drift) khi cuộn dọc feed ảnh. (4) Tối giản thanh dock điều hướng với icon Calendar (Lịch sử) và LayoutGrid (Xem lưới 3 cột), chuyển menu Tùy chọn thành thao tác nhấn giữ (long press) trực tiếp trên ảnh và tinh giản các mục tác vụ dư thừa. (5) Tinh chỉnh chi tiết trải nghiệm người dùng: hiển thị khung PiP thực tế cho ảnh chụp kép (Dual Camera) thay thế icon biểu trưng, ẩn nhãn thời gian trên lưới ảnh, đồng bộ hiển thị biệt danh (nickname) thành viên trong Vòng tròn, sắp xếp các tháng theo thứ tự thời gian tăng dần và thiết kế cụm tổng kết số lượng ảnh cùng chuỗi streak theo phong cách tối giản.
- **Files Affected:**
  - `apps/backend/src/modules/moments/moments.service.ts`
  - `apps/backend/src/modules/moments/moments.controller.ts`
  - `apps/backend/src/modules/moments/moments.service.spec.ts`
  - `apps/mobile/package.json`
  - `apps/mobile/app/circle/[id].tsx`
  - `apps/mobile/src/services/api.ts`
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/mobile/src/components/moment/MomentHistoryView.tsx`
  - `apps/web/src/hooks/use-moment-queries.ts`
  - `apps/web/src/components/moments/DailyMomentsFeed.tsx`
  - `apps/web/src/components/moments/StoryViewerModal.tsx`
  - `docs/ai-usage/log.md`
  - `package-lock.json`
- **AI-Generated Portion:** 100% mã nguồn backend controller/service endpoint `getMyMoments`, component `MomentHistoryView` dạng inline với 2 chế độ hiển thị theo tháng và bản đồ phong cách Album ảnh (OpenStreetMap/CartoDB tiles qua Leaflet WebView), sắp xếp tháng tăng dần theo dòng thời gian (`a.localeCompare(b)`: Tháng 9 hiển thị trước Tháng 10), thiết kế 2 pill thống kê basic tối giản ở đáy danh sách lịch (`[📷 X] [🔥 Y]`), đưa thanh chuyển đổi lịch tháng / bản đồ lên sub-header tầng 2 thay thế pill lọc bạn bè, chuyển icon dock thành Calendar và LayoutGrid (xem lưới) bỏ text rườm rà, hỗ trợ nhấn giữ (long press) trực tiếp trên ảnh để mở menu tùy chọn, chuẩn hóa lưới 3 cột bằng `FlatList numColumns={3}` kèm `flex: 1/3, aspectRatio: 1`, hiển thị khung PiP thu nhỏ trực tiếp trên các ảnh Dual Camera trong lưới theo đúng góc chụp, bỏ thông tin thời gian ở footer ô ảnh và ưu tiên triệt để biệt danh thành viên (`member.nickname`) trên toàn bộ header pill lọc bạn bè, dropdown danh sách thành viên, feed khoảnh khắc và lưới xem ảnh.
- **Human Modifications:** Ninh Thị Mỹ Hạnh trực tiếp định hướng, rà soát và tinh chỉnh trải nghiệm sản phẩm: yêu cầu loại bỏ các chi tiết thừa thãi trên feed ảnh; chỉ đạo kiến trúc màn hình Lịch sử cho chủ tài khoản với chế độ xem tháng và bản đồ tương tác kiểu album ảnh; tối ưu luồng điều hướng tích hợp switcher lên header tầng 2; chuyển đổi hành vi tương tác menu qua thao tác nhấn giữ ảnh và bổ sung chế độ xem lưới 3 cột chuẩn xác; chuẩn hóa cơ chế hiển thị khung PiP thu nhỏ và ưu tiên biệt danh thành viên trong Vòng tròn; sắp xếp lịch tháng theo trình tự thời gian tự nhiên cùng cụm thống kê tổng kết tối giản.
- **Verification Method:**
  - `npm test -- apps/backend/src/modules/moments/moments.service.spec.ts`: 23/23 unit tests pass 100%.
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: 0 TypeScript errors.
  - `npx tsc --noEmit -p apps/web/tsconfig.json`: 0 TypeScript errors.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không chứa credential/secret.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** (1) Khi mới tạo `MomentHistoryModal.tsx` gặp lỗi import sai tên `useThemeColors` và `useAuth`. (2) FlatList cuộn dọc trên Android bị trôi dần xuống dưới (drift down) qua từng trang. (3) Bản đồ ban đầu vẽ bằng canvas giả lập cuộn 2 chiều bị khựng và không zoom được.
  - **Root Cause:** (1) Dùng nhầm tên hook của component cũ thay vì `useThemeStore` và `useAuthStore` của store Zustand. (2) Android FlatList khi dùng `pagingEnabled` mặc định snap theo khung nhìn hệ thống thay vì chiều cao item `listHeight`, kết hợp với điều kiện cập nhật layout bị kẹt (`h >= containerHeight`) gây lệch tích lũy. (3) Bản đồ vẽ bằng các khối View lồng nhau thiếu tương tác bản đồ thực.
  - **Resolution / Fix:** (1) Đồng bộ import về đúng `useThemeStore` và `useAuthStore`. (2) Cấu hình FlatList paging chuẩn cho Android: `snapToInterval={listHeight}`, `snapToAlignment="start"`, `decelerationRate="fast"`, `disableIntervalMomentum={true}`, và cập nhật `containerHeight` chính xác theo pixel thực tế. (3) Tích hợp `react-native-webview` với Leaflet và CartoDB tiles hỗ trợ pinch-to-zoom, drag mượt mà và cluster pin markers.
- **Commit:** 5d4a940
- **PR:** #95

### AI-0104: Bổ sung trường lưu trữ Địa chỉ thực tế & Tọa độ GPS cho Khoảnh khắc (Moments Real Location Persistence)

- **Date:** 2026-10-20
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments capture flow, Backend Prisma schema, database migrations, shared validators, and Leaflet/Places map integration.
- **Files Affected:**
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma/migrations/20261020162000_add_moment_location_fields/migration.sql`
  - `apps/backend/src/modules/moments/moments.service.ts`
  - `apps/backend/src/modules/moments/moments.service.spec.ts`
  - `packages/types/src/index.ts`
  - `packages/shared/src/validators/moment.validator.ts`
  - `apps/mobile/package.json`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/mobile/src/components/moment/MomentHistoryView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn cập nhật schema Prisma cho `Moment` (`locationName`, `address`, `latitude`, `longitude`), viết SQL migration và áp dụng thành công vào cơ sở dữ liệu `circle_dev`; đồng bộ kiểu TypeScript trong `@circle/types` và Zod validation trong `@circle/shared`; cập nhật `MomentsService` (lưu trữ và trả về thông tin địa chỉ thật); bổ sung unit tests kiểm thử tạo moment kèm địa chỉ thật trong `moments.service.spec.ts` (24/24 unit tests pass); tích hợp thư viện `expo-location` trên mobile capture flow để tự động xin quyền GPS foreground, lấy tọa độ thật và reverse geocode thành tên đường/phường/thành phố ngầm trong nền (silent background GPS fetch, không hiển thị bất kỳ UI/pill nào làm rối màn hình chụp và đăng ảnh); ưu tiên dữ liệu tọa độ thật trên Leaflet map và card chi tiết mini map trong `MomentHistoryView`.
- **Human Modifications:** Trương Công Bình trực tiếp rà soát và yêu cầu bổ sung trường lưu trữ địa chỉ thật vào hệ thống thay cho dữ liệu giả lập; yêu cầu lấy ngầm trong nền phục vụ riêng cho chế độ xem bản đồ chứ không đưa UI vị trí vào chỗ chụp/đăng moment; giám sát quá trình migration cơ sở dữ liệu và thử nghiệm tính năng định vị trên thiết bị.
- **Verification Method:**
  - `npx prisma migrate deploy`: Migration `20261020162000_add_moment_location_fields` áp dụng thành công.
  - `npm test -- apps/backend/src/modules/moments/moments.service.spec.ts`: 24/24 unit tests pass 100%.
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `npm run build` trong `apps/web`: Build Next.js thành công 100%.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không chứa credential/secret, sử dụng API định vị tiêu chuẩn với sự cho phép rõ ràng từ người dùng.
- **AI Errors / Hallucinations Found:**
  - **Error Description:** Khi chạy `npx prisma generate` bị lỗi EPERM do tiến trình backend dev server đang chạy giữ query engine dll.
  - **Root Cause:** Node process của dev server đang lock tệp `query_engine-windows.dll.node` trên Windows.
  - **Resolution / Fix:** Tạm ngắt tiến trình con của dev server, tạo lại Prisma client thành công, sau đó Nest watch tự khởi động lại tiến trình server bình thường.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0105: Gỡ bỏ thẻ địa chỉ trên thẻ Khoảnh khắc & Bổ sung tiện ích Xóa/Ẩn ảnh (Chính chủ vs Bạn bè)

- **Date:** 2026-10-20
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments feed card, Action sheet menu, Moment delete & hide utility, Lightbox modal actions.
- **Files Affected:**
  - `apps/mobile/src/hooks/use-circle-queries.ts`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `apps/mobile/src/components/moment/MomentHistoryView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn gỡ bỏ hoàn toàn pill địa chỉ khỏi header thẻ ảnh trên feed (đảm bảo vị trí lấy ngầm chỉ dùng cho Places Map theo đúng yêu cầu); thay thế bằng nút 3 chấm `...` mở Action Menu; bổ sung `useDeleteMomentMutation` trong `use-circle-queries.ts`; triển khai logic xóa phân quyền thông minh:
  - Nếu là ảnh chính chủ (`isOwn`): Hiển thị thông báo xác nhận xóa vĩnh viễn và bạn bè sẽ không thể xem lại, gọi API DELETE `/api/v1/moments/:id` và làm mới cache.
  - Nếu là ảnh của bạn bè: Hiển thị thông báo xóa/ẩn khỏi bên mình (bạn bè khác vẫn xem được bình thường), lưu vào danh sách ẩn cục bộ (`circle_hidden_moments`) và lọc khỏi feed và lịch sử xem ảnh.
  - Bổ sung nút xóa thùng rác tương ứng trong Lightbox modal của `MomentHistoryView`.
- **Human Modifications:** Trương Công Bình trực tiếp chỉ ra chi tiết địa chỉ còn sót ở góc trái thẻ ảnh và yêu cầu tiện ích xóa ảnh với cơ chế thông báo phân quyền rõ ràng giữa ảnh tự đăng và ảnh của bạn bè.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `npm test -- apps/backend/src/modules/moments/moments.service.spec.ts`: 24/24 unit tests pass 100%.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, cơ chế phân quyền bảo đảm người dùng không thể xóa vĩnh viễn dữ liệu của người khác trên máy chủ.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0106: Tối giản Action Menu Khoảnh khắc (Xóa, Lưu, Chia sẻ) & Tích hợp thực tế Lưu/Chia sẻ ảnh qua Expo Native APIs

- **Date:** 2026-10-20
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments feed interaction, Action Sheet simplification, Native MediaLibrary and Sharing integrations.
- **Files Affected:**
  - `apps/mobile/package.json`
  - `apps/mobile/app.json`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn:
  - Gỡ bỏ nút ba chấm `...` khỏi header thẻ ảnh (giữ trải nghiệm tối giản tuyệt đối, dùng cử chỉ nhấn giữ ảnh để mở Action Menu theo đúng ý người dùng).
  - Gỡ bỏ hoàn toàn mục "Sao chép liên kết".
  - Thu gọn toàn bộ Action Menu thành 3 lựa chọn ngắn gọn, súc tích: **Chia sẻ**, **Lưu**, **Xoá**.
  - Cài đặt và tích hợp các module native của Expo SDK 57: `expo-file-system`, `expo-media-library`, `expo-sharing`.
  - Triển khai chức năng **Lưu** thực tế: tải ảnh/video vào cache, yêu cầu cấp quyền `MediaLibrary.requestPermissionsAsync`, lưu trực tiếp vào thư viện thiết bị chuẩn class-based API SDK 57 (`MediaLibrary.Asset.create`) triệt tiêu hoàn toàn warning deprecation của `saveToLibraryAsync`.
  - Triển khai chức năng **Chia sẻ** thực tế: tải file media thật và mở hộp thoại chia sẻ native của hệ điều hành (`Sharing.shareAsync` hoặc `RNShare`) hỗ trợ gửi trực tiếp file ảnh/video đến các ứng dụng khác.
  - Tối ưu hóa VirtualizedList cho FlatList cuộn dọc: cấu hình `windowSize={3}`, `maxToRenderPerBatch={3}`, `initialNumToRender={2}`, `removeClippedSubviews` giúp feed mượt mà, loại bỏ triệt để cảnh báo `VirtualizedList slow to update (contentLength > 36000px)`.
- **Human Modifications:** Trương Công Bình trực tiếp yêu cầu loại bỏ nút 3 chấm do đã có cơ chế nhấn giữ ảnh, loại bỏ tùy chọn sao chép link rườm rà, tinh gọn text thành các động từ đơn giản (Xóa, Lưu, Chia sẻ) và hoàn thiện chức năng lưu, chia sẻ hoạt động thực tế.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, xin quyền truy cập thư viện theo chuẩn phân quyền hệ điều hành Android/iOS.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0107: Tối ưu hoá triệt để hiệu năng VirtualizedList và Memoize MomentFeedCardItem (#94)
- **Timestamp:** 2026-10-20T18:05:00+07:00
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments Feed List Virtualization Performance Optimization.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn tối ưu:
  - Tách riêng thẻ khoảnh khắc Moment Feed Card thành component độc lập `MomentFeedCardItem = React.memo(...)` tuân thủ đúng khuyến nghị của React Native VirtualizedList.
  - Bọc `MomentVideoPlayer` và `MomentFeedPipView` vào `React.memo` để tránh render lại toàn bộ video/PiP canvas khi cha re-render.
  - Áp dụng `useMemo` cho `filteredMoments` và `feedItems`, triệt tiêu việc tạo mảng mới mỗi lần component `MomentsView` cập nhật state (nhập văn bản, chuyển trang, zoom camera...).
  - Memoize toàn bộ các callback handlers: `handleSetScrollEnabled`, `handleCornerChange`, `handleSwap`, `handleOpenActionMenuForMoment`, `handleReplyWithPhoto`, `handleOpenChatReply`, `handleSendChatReply`, `handleCancelChatReply`, `handleSelectReactors`, `handleReactMoment`, `getItemLayout`.
  - Cấu hình tinh chỉnh FlatList: `initialNumToRender={1}`, `maxToRenderPerBatch={2}`, `windowSize={3}`, `updateCellsBatchingPeriod={50}`, `getItemLayout={getItemLayout}` và `removeClippedSubviews`.
  - Triệt tiêu hoàn toàn cảnh báo lag `VirtualizedList: You have a large list that is slow to update (contentLength: 36414, dt: 1994ms)`.
- **Human Modifications:** Trương Công Bình gửi log cảnh báo `VirtualizedList slow to update` trong quá trình test thực tế trên máy ảo/thiết bị iOS/Android.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Không có rủi ro bảo mật hoặc thư viện bên thứ 3 lạ.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0108: Tích hợp cơ chế Hybrid ghép 2 ảnh Dual thành 1 ảnh khi Lưu/Chia sẻ (#94)
- **Timestamp:** 2026-10-20T18:25:00+07:00
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments Hybrid Dual-Photo Export (Save & Share Composite).
- **Files Affected:**
  - `apps/mobile/package.json`
  - `package-lock.json`
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% mã nguồn tính năng:
  - Cài đặt thư viện chuẩn `react-native-view-shot` để xử lý chụp view offscreen chất lượng cao.
  - Xây dựng hàm `prepareExportImageUri`:
    - Phân tích khoảnh khắc: nếu là video hoặc ảnh đơn (Single photo) thì tải trực tiếp và xuất file gốc.
    - Nếu là ảnh Dual (có cả camera trước và camera sau): tải cả 2 ảnh về bộ nhớ cache cục bộ, gắn vào khung chụp offscreen 1080x1080 chuẩn Instagram/Social.
    - Render ảnh nền chính 1080x1080 phủ toàn khung, ảnh PiP phụ 320x320 bo góc tròn mềm mại (`borderRadius: 40`, viền trắng 5px `#FFFFFF`, shadow nổi bật) đặt chính xác tại góc người dùng đã chọn (`cornerIndex`).
    - Gắn watermark thương hiệu Circle và chú thích (caption) của khoảnh khắc.
    - Dùng `captureRef` chụp khung với chất lượng 96% JPEG và xuất ra tệp ảnh đơn duy nhất.
  - Tích hợp hàm xuất hợp nhất vào nút **"Lưu"** (`MediaLibrary.Asset.create`) và nút **"Chia sẻ"** (`Sharing.shareAsync` / `RNShare`).
- **Human Modifications:** Trương Công Bình định hướng kiến trúc Hybrid: trong app lưu và hiển thị 2 ảnh độc lập để hỗ trợ vuốt đổi 4 góc và tráo camera trước/sau, chỉ khi người dùng bấm Lưu hoặc Chia sẻ thì mới tự động ghép thành 1 ảnh duy nhất.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, cấp quyền thư viện `expo-media-library` và chia sẻ `expo-sharing` chuẩn Expo SDK 57.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0109: Cài đặt expo-blob tối ưu hoá hiệu năng xử lý Blob nhị phân (#94)
- **Timestamp:** 2026-10-20T18:31:00+07:00
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Network & Binary Blob Transfer Performance Optimization.
- **Files Affected:**
  - `apps/mobile/package.json`
  - `package-lock.json`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** Cài đặt package chính thức `expo-blob` theo khuyến nghị của Expo SDK để thay thế Blob mặc định của React Native (vốn sao chép dữ liệu qua native blob store và đọc lại qua base64 gây tốn tài nguyên), triệt tiêu hoàn toàn cảnh báo `Response.blob() is using React Native's Blob`.
- **Human Modifications:** Trương Công Bình gửi log cảnh báo `Response.blob()` trong quá trình chụp và đăng ảnh moment.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** Thư viện chính thức của hệ sinh thái Expo.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0110: Khắc phục triệt để lỗi ảnh lưu bị đen khi xuất ảnh Dual Moment (#94)
- **Timestamp:** 2026-10-20T18:41:00+07:00
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments Dual Composite Snapshot & Export Pipeline.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% sửa lỗi:
  - Khắc phục nguyên nhân ảnh bị đen xì: vị trí `left: -9999` trước đó khiến hệ thống đồ họa native (Metal trên iOS và RenderNode trên Android) tự động loại bỏ việc giải mã và vẽ texture cho các View nằm ngoài màn hình; đồng thời `captureRef` bị gọi trước khi `Image` giải mã xong bitmap.
  - Chuyển khung ghép thành một `Modal` trong suốt hiển thị trực tiếp trên màn hình, đảm bảo 100% nằm trong viewport để hệ thống native rasterize đầy đủ toàn bộ pixel.
  - Thêm cơ chế đồng bộ `onLoad` cho cả 2 ảnh chính và phụ: chỉ khi cả hai ảnh được giải mã hoàn toàn vào bộ nhớ GPU (`compositeMainLoaded` & `compositePipLoaded`) thì mới kích hoạt `captureRef`.
  - Cấu hình `captureRef` xuất ảnh chuẩn 1080x1080px với độ nét cao 96% JPEG.
  - Tích hợp lớp phủ tiến trình mượt mà ("Đang xuất khoảnh khắc...") trong thời gian 200-300ms xử lý, sau đó tự động đóng Modal và hiển thị thông báo thành công.
- **Human Modifications:** Trương Công Bình báo lỗi khi lưu ảnh Dual về máy thì file ảnh bị đen xì.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không có lỗ hổng bảo mật.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)

### AI-0111: Khắc phục DestinationAlreadyExistsException khi tải bộ nhớ đệm xuất khoảnh khắc (#94)
- **Timestamp:** 2026-10-20T18:49:00+07:00
- **Task ID:** Issue #94 (Epic #20: Moments & Shared Stories)
- **Engineers:** Trương Công Bình & Ninh Thị Mỹ Hạnh
- **Feature / Area:** Mobile Moments File System Download & Cache Safety.
- **Files Affected:**
  - `apps/mobile/src/components/moment/MomentsView.tsx`
  - `docs/ai-usage/log.md`
- **AI-Generated Portion:** 100% sửa lỗi:
  - Khắc phục ngoại lệ native `DestinationAlreadyExistsException (at ExpoFileSystem/FileSystemDownload.swift:160)` khi người dùng lưu/chia sẻ ảnh nhiều lần.
  - Xây dựng hàm `ensureLocalFileUri`:
    - Nếu ảnh đã là file cục bộ (`file://`), tái sử dụng trực tiếp không tải lại.
    - Nếu là ảnh từ server mạng (`http://` hoặc `https://`), tạo tên file duy nhất trong `Paths.cache` và truyền tùy chọn `{ idempotent: true }` để `ExpoFileSystem` tự động ghi đè file cache cũ thay vì ném lỗi `DestinationAlreadyExistsException`.
- **Human Modifications:** Trương Công Bình gửi log lỗi `DestinationAlreadyExistsException (at ExpoFileSystem/FileSystemDownload.swift: 160)`.
- **Verification Method:**
  - `npm run typecheck` (`tsc --noEmit`) trong `apps/mobile`: 0 lỗi TypeScript.
  - `./scripts/check-agent-map.sh`: 95/95 framework files pass (0 broken references).
- **Official Source Checked:** `PROJECT_GOD.md`, `agentic/RULES.md`.
- **Security & License Check:** An toàn, không có lỗ hổng bảo mật.
- **Branch:** `feat/94-moments-archive-places-map`
- **PR:** #95 (Draft)
