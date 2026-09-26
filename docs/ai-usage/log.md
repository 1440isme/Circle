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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Human Modifications:** Người dùng cung cấp bản thảo gốc và định hướng kiểm tra, tái cấu trúc vị trí tài liệu và sơ đồ cho chuẩn xác.
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Human Modifications:** Trương Công Bình review chi tiết từng dòng, phát hiện câu dẫn sót của AI, chuỗi base64 phình to và sự lệch tên thực thể giữa tài liệu md và puml.
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Developer:** Trương Công Bình & Ninh Thị Mỹ Hạnh
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
- **Human Modifications:** Người dùng cung cấp tệp nội dung yêu cầu nghiệp vụ và yêu cầu phân bổ vào đúng thư mục.
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
- **Developer:** Ninh Thị Mỹ Hạnh & Trương Công Bình
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




