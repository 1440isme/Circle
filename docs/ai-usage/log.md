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
- **Commit:** `cb56296`
- **PR:** Pending

