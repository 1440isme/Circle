# CIRCLE --- PROJECT GOD FILE

## Canonical Project Definition, SDLC, Definition of Done & Evidence System

> **Document role:** Đây là **Single Source of Truth (SSOT)** cho toàn
> bộ dự án CIRCLE.\
> File này được viết để **2 sinh viên, giảng viên, reviewer và AI
> Agent** có thể hiểu cùng một cách: CIRCLE là gì, phải xây gì, xây theo
> quy trình nào, dùng công cụ gì, thế nào là "Done", và bằng chứng nào
> phải được tạo ra để đạt **Level 5 ở mọi tiêu chí rubric**.
>
> **Nguyên tắc tối cao:** Không chỉ xây một sản phẩm chạy được. Phải xây
> **sản phẩm + quy trình kỹ thuật + bằng chứng + khả năng giải thích**.

------------------------------------------------------------------------

# 0. DOCUMENT CONTROL

  -----------------------------------------------------------------------
  Field                               Value
  ----------------------------------- -----------------------------------
  Project                             CIRCLE

  Official title                      Xây dựng nền tảng mạng xã hội kết
                                      nối và tương tác nhóm -- CIRCLE

  Students                            Trương Công Bình (23110184), Ninh
                                      Thị Mỹ Hạnh (23110210)

  Supervisor                          Nguyễn Trần Thi Văn

  Duration                            19 tuần

  Start                               17/08/2026

  End                                 27/12/2026

  Current document date               15/09/2026

  Current phase                       Week 5 --- implementation
                                      foundation

  Target                              Level 5 / maximum on every rubric
                                      criterion

  Canonical product model             Client--Server + Modular Monolith

  Canonical backend                   NestJS + TypeScript + Prisma +
                                      PostgreSQL

  Web                                 Next.js

  Mobile                              React Native + Expo

  Realtime                            WebSocket / Socket.IO

  Containerization                    Docker

  CI/CD                               GitHub Actions

  Primary repository/process hub      GitHub

  Production strategy                 Small VPS + managed services

  Cloud/staging strategy              Azure for Students / Azure services
                                      where useful

  Media storage                       Cloudflare R2

  Redis                               Upstash Redis

  PostgreSQL                          Neon PostgreSQL

  Reverse proxy                       Traefik

  External edge/DNS                   Cloudflare

  Production packaging                Docker

  Project principle                   Evidence-driven SDLC
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 1. SOURCE OF TRUTH HIERARCHY

Khi có mâu thuẫn, dùng thứ tự ưu tiên sau:

1.  **Rubric môn học chính thức** --- quyết định tiêu chí đánh giá.
2.  **Nhiệm vụ thực hiện TLCN chính thức** --- quyết định nội dung/lĩnh
    vực và feature scope đã đăng ký.
3.  **Kế hoạch thực hiện TLCN chính thức** --- quyết định timeline/phase
    đã đăng ký.
4.  **Bản cam kết sản phẩm + KPI/metrics được chốt trước mốc 50%**.
5.  **File này** --- chuẩn hóa cách thực thi, quản lý và mở rộng các tài
    liệu trên.
6.  **SRS / SDD / ADR / backlog / issue / PR** --- chi tiết hóa quyết
    định đã được phê duyệt.
7.  **Source code / infrastructure / deployment** --- implementation
    truth.
8.  **AI suggestions / generated content** --- chỉ là input, không phải
    source of truth.

**Không được tự ý "sửa" nội dung chính thức của đề tài để hợp thức hóa
implementation.**

Nếu phát hiện mâu thuẫn: - STOP việc triển khai phần bị ảnh hưởng. - Tạo
Issue/Decision. - Xác định tác động. - Cập nhật tài liệu liên quan. -
Nếu thay đổi phạm vi/KPI lớn: xin ý kiến GVHD trước khi chốt.

------------------------------------------------------------------------

# 2. OFFICIAL PROJECT SCOPE

## 2.1. Mục tiêu

Xây dựng CIRCLE --- nền tảng mạng xã hội tập trung vào **kết nối và
tương tác trong các nhóm Circle**, hỗ trợ giao tiếp, chia sẻ realtime và
tổ chức hoạt động chung.

## 2.2. Các nhóm chức năng đã đăng ký

### Account

-   Đăng ký
-   Đăng nhập
-   Quản lý hồ sơ cá nhân

### Friend

-   Tìm kiếm người dùng
-   Gửi lời mời kết bạn
-   Chấp nhận / từ chối
-   Quản lý danh sách bạn bè

### Circle

-   Tạo Circle
-   Tham gia Circle
-   Quản lý Circle
-   Phân quyền thành viên phù hợp

### Realtime sharing

-   Chụp / chia sẻ hình ảnh realtime
-   Chọn Circle được xem
-   Xem và tương tác với khoảnh khắc

### Chat

-   Nhắn tin
-   Hình ảnh
-   Video
-   File
-   Voice message
-   Reply
-   Reaction

### Voice / Video

-   Gọi thoại trực tiếp
-   Gọi video trực tiếp giữa thành viên

### Circle collaboration

-   Album / ảnh theo chủ đề
-   Ghim nội dung
-   Chia sẻ vị trí
-   Plan hoạt động
-   Calendar / sự kiện
-   Vote
-   "Điều muốn nói" --- nội dung ẩn danh
-   Notification

### Applications

-   API Server
-   Web Application
-   Mobile Application
-   Management Website cho Admin

------------------------------------------------------------------------

# 3. ARCHITECTURE DECISION

## 3.1. Kiến trúc logic

**Client--Server + Modular Monolith**

``` text
                 ┌─────────────────────┐
                 │       Users         │
                 └──────────┬──────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Cloudflare / Edge │
                  └─────────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌────▼────┐
        │    Web    │ │   Mobile  │ │  Admin  │
        │  Next.js  │ │ RN + Expo │ │ Next.js │
        └─────┬─────┘ └─────┬─────┘ └────┬────┘
              └─────────────┼─────────────┘
                            │ HTTPS / WS
                     ┌──────▼──────┐
                     │   Traefik   │
                     │ TLS / Proxy │
                     └──────┬──────┘
                            │
                     ┌──────▼──────────────┐
                     │ NestJS API Server   │
                     │ Modular Monolith    │
                     ├─────────────────────┤
                     │ Auth                │
                     │ Users               │
                     │ Friends             │
                     │ Circles             │
                     │ Chat                │
                     │ Realtime            │
                     │ Media               │
                     │ Calls / Signaling   │
                     │ Album               │
                     │ Pin                 │
                     │ Location            │
                     │ Plan                │
                     │ Calendar            │
                     │ Vote                │
                     │ Anonymous Message   │
                     │ Notification        │
                     └──┬──────┬──────┬────┘
                        │      │      │
             ┌──────────▼┐ ┌──▼────┐ ┌▼────────┐
             │ PostgreSQL│ │ Redis │ │ R2      │
             │   Neon    │ │Upstash│ │ Media   │
             └───────────┘ └───────┘ └─────────┘
```

## 3.2. Production infrastructure

Production target:

-   Small VPS
-   Ubuntu 24.04 LTS
-   Docker / Docker Compose
-   Traefik
-   NestJS
-   Optional Next.js container if not hosted separately
-   Neon PostgreSQL
-   Upstash Redis
-   Cloudflare R2
-   Cloudflare DNS / edge
-   GitHub Container Registry (GHCR)
-   GitHub Actions
-   Health checks + logs + alerts

Suggested initial VPS class:

-   \~2 vCPU
-   \~4 GB RAM
-   \~60--80 GB SSD
-   Linux
-   Public IPv4
-   Docker support

**Do not self-host every dependency on one VPS.**

## 3.3. Azure strategy

Azure for Students is **not the mandatory production dependency**.

Use Azure primarily for: - Staging / cloud experiment - Azure Container
Apps experiments - Azure Container Registry where useful - Azure Monitor
where useful - Learning / deployment evidence

The application must remain portable.

## 3.4. Portability contract

Infrastructure-dependent values must come from environment
configuration:

``` text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
S3_REGION
JWT_SECRET
APP_URL
API_URL
TURN_SERVER
TURN_USERNAME
TURN_CREDENTIAL
```

Never hard-code environment-specific infrastructure into application
logic.

------------------------------------------------------------------------

# 4. IMPORTANT TECHNICAL RISK: WEBRTC

Voice/video is the highest technical-risk feature.

Architecture:

``` text
Client A
   │
   ├── Socket.IO signaling
   │
   ▼
NestJS Signaling
   │
   └──────────────► Client B

Media path:
Client A ◄──── WebRTC / ICE / STUN / TURN ────► Client B
```

Rules:

-   Socket.IO is signaling/control.
-   WebRTC carries audio/video.
-   Test STUN/TURN, NAT traversal, reconnect and permission failures.
-   Build a **PoC early**, not near final demo.
-   Document browser/mobile limitations.
-   Do not claim production-grade calling until it passes the defined
    acceptance criteria and tests.

------------------------------------------------------------------------

# 5. PROJECT SUCCESS MODEL

Success is NOT:

> "The app has many features."

Success is:

> **Problem validated + requirements traceable + design coherent +
> implementation complete + tests automated + code quality measurable +
> CI/CD reproducible + deployed product + real users + quantified
> improvement + AI usage controlled + every claim backed by evidence.**

The project therefore has two deliverables:

### A. Product

CIRCLE Web + Mobile + Admin + API + infrastructure.

### B. Engineering Evidence System

All artifacts required to prove the product was developed
professionally.

------------------------------------------------------------------------

# 6. RUBRIC TARGET --- LEVEL 5 MASTER CHECKLIST

## TC1 --- Practicality / understanding --- 10 points

Target:

-   ≥3 real stakeholders interviewed OR ≥30 valid survey responses.
-   Interview/survey records and data retained.
-   Clear context.
-   User personas.
-   Problem statement.
-   In-scope / out-of-scope.
-   Compare ≥3 existing solutions.
-   Identify gap / differentiation.
-   Commit ≥5 quantitative business KPIs before 50% project time.
-   Keep those KPIs consistent through defense.

**Never fabricate respondents, interviews or KPI results.**

Suggested evidence:

``` text
docs/research/
  stakeholder-interviews.md
  survey-design.md
  survey-results.md
  personas.md
  competitor-analysis.md
  problem-statement.md
  scope.md
  kpi-baseline.md
```

------------------------------------------------------------------------

## TC2.1 --- Requirements / design --- 10 points

Target:

-   100% user stories/use cases have acceptance criteria.
-   Business process model.
-   Business rules.
-   Data dictionary.
-   ≥4 design diagram types.
-   Diagrams must match code.
-   Random 5-point defense comparison target: 100% match.
-   ≥5 quantified NFRs.
-   Explain architecture and technology choices.
-   Explain alternatives and trade-offs.
-   Record design changes and reasons.

Minimum diagram set:

1.  Context diagram
2.  Component diagram
3.  ERD / Class diagram
4.  Sequence diagrams
5.  Deployment diagram

Recommended additional: - Activity diagram - State diagram for complex
flows - C4-style diagrams

Evidence:

``` text
docs/requirements/SRS.md
docs/requirements/user-stories.md
docs/requirements/business-rules.md
docs/requirements/data-dictionary.md
docs/architecture/SDD.md
docs/architecture/diagrams/
docs/architecture/ADR/
```

------------------------------------------------------------------------

## TC2.2 --- Product completeness --- 10 points

Target:

-   100% committed core functions stable.
-   ≥100% committed workload.
-   Production OR public staging accessible.
-   Real users accessing the product.
-   Live demo with 0 errors.
-   Exception handling.
-   Validation.
-   Authorization.
-   Logging.
-   Empty state.
-   Network loss state.
-   Timeout state.
-   Responsive / consistent UI.

Do not add features just to increase scope.

If time is limited: - Protect core features. - Improve
quality/evidence. - Remove nonessential implementation complexity
through documented scope decisions.

------------------------------------------------------------------------

## TC2.3 --- LLM / Agentic AI mastery --- 5 points

CIRCLE will use AI as an engineering tool, therefore the project must
maintain a complete **AI Usage Log**.

Each meaningful AI-assisted change should record:

``` text
Date
Developer
Tool
Model
Purpose
Prompt summary
Repository/files affected
AI-generated portion
Human modifications
Verification method
AI errors/hallucinations found
Resolution
Commit
PR
```

Level 5 target:

-   Complete AI Usage Log.
-   Traceable to Git history.
-   Explain 100% of ≥5 randomly selected AI-generated code positions.
-   Identify ≥5 actual AI errors/hallucinations.
-   Explain root cause.
-   Show fix commit.
-   Maintain systematic AI-output review checklist.
-   Verify against official documentation.
-   Check license.
-   Check sensitive-data exposure.

### AI review checklist

Before accepting AI output:

-   [ ] Is the claim supported by official docs / source code?
-   [ ] Does the API/library version actually support it?
-   [ ] Does the code compile?
-   [ ] Does it pass tests?
-   [ ] Does it satisfy acceptance criteria?
-   [ ] Does it introduce a security problem?
-   [ ] Does it leak secrets or sensitive data?
-   [ ] Does it violate dependency licenses?
-   [ ] Does it duplicate existing project abstractions?
-   [ ] Can the student explain the code?
-   [ ] Is the design consistent with SRS/SDD/ADR?

AI output is **never automatically correct**.

------------------------------------------------------------------------

## TC2.4 --- Code quality / quality management --- 10 points

Level 5 target:

-   Clear layered/modular architecture.
-   Consistent naming.
-   Published coding convention.
-   0 lint errors.
-   Static analysis: 0 Blocker/Critical.
-   Duplication ≤3%.
-   ≥90% project weeks with commits.
-   ≥90% changes through reviewed PRs.
-   Meaningful commit messages.
-   0 exposed secrets/API keys.
-   Environment configuration separated.
-   README.
-   Installation guide.
-   Deployment diagram.
-   Technical Debt Register + remediation plan.

Suggested tooling:

-   ESLint
-   Prettier
-   TypeScript strict mode
-   SonarQube/SonarCloud where practical
-   gitleaks
-   Dependabot / dependency scanning
-   GitHub Actions

------------------------------------------------------------------------

## TC2.5 --- Testing --- 5 points

Level 5 target:

-   Explicit test plan.
-   ≥4 testing layers.
-   Core module line coverage ≥70%.
-   ≥70% test cases automated.
-   Final CI run: 100% pass.
-   0 Critical/Blocker defects at defense.
-   Bug tracker with lifecycle.
-   Regression tests.
-   Tests traceable to acceptance criteria.
-   Negative and edge cases included.

Required layers:

1.  Unit
2.  Integration
3.  API
4.  E2E/UI

Additional recommended: - Performance / load - Security testing -
Realtime / WebSocket - WebRTC smoke / integration validation -
Mobile-specific tests where practical

Suggested tools:

``` text
Unit            Jest
Integration     Jest + test DB/container
API             Supertest / API runner
E2E Web         Playwright
Performance     k6
Security        dependency scanner + gitleaks + API security tests
```

------------------------------------------------------------------------

## TC2.6 --- CI/CD & operations --- 5 points

Level 5 target:

Pipeline ≥6 stages:

``` text
1. Checkout / validate
2. Lint / static analysis
3. Unit + integration + API tests
4. Security / dependency / secret scan
5. Docker build/package
6. Push versioned image
7. Automatic staging deployment
8. Health check / smoke test
```

Targets:

-   Green pipeline rate ≥90%.
-   ≥10 automated deployments during project.
-   Commit → staging ≤15 minutes.
-   Secrets managed by platform.
-   Versioned deployments.
-   Rollback mechanism.
-   Post-deployment health check.
-   Centralized logs.
-   Alerting.

Start CI/CD early. Do NOT wait until Week 17 to create the first
pipeline.

------------------------------------------------------------------------

## TC2.7 --- Real-user experiment --- 5 points

Level 5 target:

-   ≥10 real target users.
-   Not merely classmates.
-   Anonymous participant list.
-   Experiment minutes / records.
-   Task scripts defined before test.
-   Data collection method defined before test.
-   Task success ≥90%.
-   SUS ≥80 OR equivalent CSAT/NPS metric.
-   ≥1 improvement round.
-   Measure before vs after quantitatively.

Evidence:

``` text
docs/experiments/
  user-study-protocol.md
  participant-anonymized.csv
  task-script.md
  baseline-results.md
  improvement-round-1.md
  post-improvement-results.md
  analysis.md
```

Never manufacture user data.

------------------------------------------------------------------------

## TC3 --- Presentation --- 10 points

Level 5 target:

-   Time deviation ≤5%.
-   Live demo on deployed environment.
-   0 demo errors.
-   Correct business flow.
-   Visual/light slides.
-   Evidence for:
    -   CI/CD
    -   Coverage
    -   User experiment
    -   Metrics
-   Speak naturally; do not read slides.
-   Both students can explain their contributions.

------------------------------------------------------------------------

## TC4 --- Thesis / references / format --- 10 points

Level 5 target:

Logical structure:

``` text
Problem
→ Theory
→ Requirements
→ Design
→ Implementation
→ Testing
→ Deployment
→ User experiment
→ Results
→ Discussion
→ Limitations
→ Conclusion
```

Target:

-   ≥5 quality foreign-language sources used meaningfully.
-   Sources should be defendable.
-   Similarity ≤20% excluding legitimate citations.
-   0 spelling/formatting errors.
-   100% figures/tables numbered.
-   100% figures/tables captioned.
-   100% figures/tables referenced in text.
-   One consistent citation style.

Prefer 10--15 strong sources where useful rather than padding
references.

------------------------------------------------------------------------

## TC5 --- Defense Q&A --- 15 points

Target:

-   ≥90% questions answered correctly and on point.
-   ≥95% technical questions answerable:
    -   source code
    -   architecture
    -   database
    -   testing
    -   deployment
    -   security
    -   CI/CD
    -   realtime
    -   AI usage
-   Explain limitations.
-   Explain alternatives.
-   Explain trade-offs.
-   Explain AI-supported sections.
-   Explain why a design was chosen.

Every important architecture/feature decision should therefore be
explainable in:

``` text
Problem
Options
Decision
Reason
Trade-off
Consequence
```

------------------------------------------------------------------------

## TC6 --- Outstanding results --- 5 points

Possible evidence:

-   Research paper.
-   Award.
-   Real organization adoption + confirmation.
-   IP / ownership result.
-   Open-source contribution.
-   Community use.
-   Strongly exceeding committed metrics.
-   Technical novelty recognized by council.

Do not design the project around an artificial "bonus feature".

Priority is first to secure TC1--TC5.

------------------------------------------------------------------------

# 7. HARD GATES --- NEVER VIOLATE

The official rubric includes score-blocking rules. Project management
must explicitly protect them.

### G1 --- Final product/metrics

Do not miss the required signed final product + metrics before the 50%
milestone.

### G2 --- Weekly reports

Maintain weekly progress records and supervisor confirmation. Target ≥1
report/week.

### G3 --- AI declaration/log

Submit AI Usage Log or the applicable no-AI declaration.

### G4 --- AI consistency

AI log must match Git history and defense explanations.

### G5 --- Testing

No "we tested manually" without documented testing evidence.

### G6 --- CI/CD

A working CI/CD pipeline must exist at defense.

### G7 --- Real users

Real-user experiment must actually happen.

### G8 --- Repository accessibility

Repository must be accessible to the council and build/deployment
instructions must work.

### G9 --- Scope proportionality

The project must remain proportional to 2 students / 19 weeks.

### G10 --- Academic integrity

Any serious plagiarism/ownership violation can override normal scoring.

------------------------------------------------------------------------

# 8. ACADEMIC OWNERSHIP / DEFENSE RULE

The council may randomly select items from thesis/code/evidence and ask
the student to explain:

-   What it does.
-   Why it exists.
-   Where data/parameters/libraries came from.
-   What happens if it is removed.
-   What the student's own contribution was.

Therefore:

> **Never merge code, diagrams, text or AI output that the responsible
> student cannot explain.**

AI assistance is allowed; lack of mastery is the risk.

------------------------------------------------------------------------

# 9. SDLC --- THE OFFICIAL CIRCLE WORKFLOW

Every feature follows:

``` text
Discovery
  ↓
Requirement
  ↓
User Story
  ↓
Acceptance Criteria
  ↓
Business Rules
  ↓
Data / API / Security impact
  ↓
Design
  ↓
ADR if decision is significant
  ↓
Task breakdown
  ↓
Issue
  ↓
Feature branch
  ↓
Implementation
  ↓
Tests
  ↓
Lint / static / security
  ↓
Documentation / diagrams
  ↓
Pull Request
  ↓
Review
  ↓
CI
  ↓
Merge
  ↓
Staging
  ↓
Smoke test
  ↓
Production
  ↓
Monitoring
  ↓
User feedback
  ↓
Improvement
```

No feature is considered complete merely because its UI appears.

------------------------------------------------------------------------

# 10. DEFINITION OF READY (DoR)

A work item is **Ready** only when:

-   [ ] Business/user problem is clear.
-   [ ] Scope is explicit.
-   [ ] User story exists.
-   [ ] Acceptance criteria exist.
-   [ ] Business rules identified.
-   [ ] Dependencies identified.
-   [ ] Data impact identified.
-   [ ] API contract identified if applicable.
-   [ ] Authorization/security impact identified.
-   [ ] UI/UX design available if applicable.
-   [ ] Test approach is known.
-   [ ] Owner is assigned.
-   [ ] Issue is small enough to implement and review.

------------------------------------------------------------------------

# 11. DEFINITION OF DONE --- MASTER

A feature is **DONE only if all applicable items below are complete.**

## A. Product requirement

-   [ ] Linked to User Story / Use Case.
-   [ ] Acceptance Criteria 100% satisfied.
-   [ ] Business rules implemented.
-   [ ] Negative cases considered.
-   [ ] Edge cases considered.

## B. Design

-   [ ] Architecture impact checked.
-   [ ] DB/ERD updated if needed.
-   [ ] Sequence diagram updated if needed.
-   [ ] Component/context/deployment diagram updated if needed.
-   [ ] ADR created if a significant architectural decision changed.
-   [ ] Design remains consistent with implementation.

## C. Implementation

-   [ ] Code follows project architecture.
-   [ ] Naming convention followed.
-   [ ] No unnecessary duplication.
-   [ ] Error handling exists.
-   [ ] Validation exists.
-   [ ] Authorization exists where needed.
-   [ ] Logging exists where needed.
-   [ ] Empty/loading/error/timeout/network states handled where
    applicable.
-   [ ] Environment-specific configuration is externalized.

## D. Tests

-   [ ] Unit tests where applicable.
-   [ ] Integration tests where applicable.
-   [ ] API tests where applicable.
-   [ ] E2E/UI tests for critical flows.
-   [ ] Negative cases tested.
-   [ ] Edge cases tested.
-   [ ] Regression test added for bug fixes.
-   [ ] Coverage impact checked.

## E. Security

-   [ ] No secrets in source.
-   [ ] Input validation.
-   [ ] Authentication checked.
-   [ ] Authorization checked.
-   [ ] Sensitive data handling checked.
-   [ ] Dependency/security scan passed.
-   [ ] Upload/media validation checked where applicable.

## F. Quality

-   [ ] ESLint passes.
-   [ ] Formatter passes.
-   [ ] TypeScript passes.
-   [ ] Static analysis passes.
-   [ ] No Blocker/Critical issue introduced.
-   [ ] Duplication acceptable.

## G. Git

-   [ ] Issue linked.
-   [ ] Branch follows convention.
-   [ ] Commits meaningful.
-   [ ] PR created.
-   [ ] PR reviewed.
-   [ ] CI green.
-   [ ] No unrelated changes included.

## H. AI

If AI was used:

-   [ ] AI Usage Log updated.
-   [ ] Prompt scope recorded.
-   [ ] AI-generated section recorded.
-   [ ] Human modifications recorded.
-   [ ] Verification recorded.
-   [ ] AI errors recorded if discovered.
-   [ ] Student can explain the resulting code.

## I. Documentation

-   [ ] README/docs updated where needed.
-   [ ] API docs updated where needed.
-   [ ] Diagram updated where needed.
-   [ ] Changelog/release notes updated when appropriate.
-   [ ] Technical debt recorded if knowingly deferred.

## J. Deployment

-   [ ] Staging deployment succeeds.
-   [ ] Smoke test succeeds.
-   [ ] Health check succeeds.
-   [ ] Logs checked.
-   [ ] Rollback path remains available.

Only after these conditions should the Issue be closed.

------------------------------------------------------------------------

# 12. BUG / DEFECT MANAGEMENT

## 12.1. Lifecycle

``` text
OPEN
 ↓
TRIAGED
 ↓
IN PROGRESS
 ↓
FIXED
 ↓
READY FOR TEST
 ↓
VERIFIED
 ↓
CLOSED
```

Reopened defects return to:

``` text
OPEN → TRIAGED
```

## 12.2. Every bug report must contain

-   Title
-   Environment
-   Version/build
-   Severity
-   Priority
-   Preconditions
-   Reproduction steps
-   Expected result
-   Actual result
-   Evidence
-   Root cause
-   Fix
-   Regression test
-   Commit
-   PR
-   Verification result

## 12.3. Severity

``` text
BLOCKER   Cannot proceed / system unusable / defense-critical
CRITICAL  Major core function/security/data failure
MAJOR     Important function broken
MINOR     Limited impact
TRIVIAL   Cosmetic / very low impact
```

## 12.4. Bug rule

A bug is not "fixed" because the developer believes it is fixed.

It is fixed when: 1. Code changed. 2. Regression test exists where
appropriate. 3. CI passes. 4. Reviewer approves. 5. Tester verifies. 6.
Issue contains evidence.

------------------------------------------------------------------------

# 13. GIT STRATEGY

Use a lightweight Git Flow model.

``` text
main
  └── stable / production

develop
  └── integration

feature/<issue-id>-<short-name>
fix/<issue-id>-<short-name>
refactor/<issue-id>-<short-name>
docs/<issue-id>-<short-name>
test/<issue-id>-<short-name>
chore/<issue-id>-<short-name>
```

Rules:

-   Never develop directly on `main`.
-   Prefer PRs into `develop`.
-   Release from `develop` to `main` through a controlled PR/release
    process.
-   Emergency production fixes may use `fix/*` with expedited review.
-   Every meaningful change should map to an Issue.
-   Avoid giant PRs.

## Conventional Commit format

``` text
<type>(<scope>): <description> (#<issue>)
```

Examples:

``` text
feat(auth): add refresh token rotation (#42)
fix(chat): handle duplicate message delivery (#87)
test(circle): add membership authorization cases (#91)
refactor(media): extract storage adapter (#103)
docs(architecture): update realtime sequence diagram (#110)
ci(deploy): add staging health check (#122)
security(upload): validate file mime and size (#130)
perf(chat): reduce message query latency (#141)
```

Allowed types:

``` text
feat
fix
refactor
test
docs
chore
build
ci
perf
security
```

------------------------------------------------------------------------

# 14. PULL REQUEST POLICY

Every PR should answer:

``` text
What problem does this solve?
What changed?
Why this approach?
What alternatives were considered?
How was it tested?
What risks remain?
Did architecture/docs change?
Was AI used?
```

PR checklist:

-   [ ] Linked issue.
-   [ ] Scope focused.
-   [ ] Tests included.
-   [ ] CI green.
-   [ ] No secrets.
-   [ ] Docs/diagrams updated.
-   [ ] Reviewer understands the change.
-   [ ] No unexplained AI-generated code.
-   [ ] Breaking changes documented.

Target:

> ≥90% of meaningful changes should pass through reviewed PRs.

------------------------------------------------------------------------

# 15. GITHUB AS THE PROJECT OPERATING SYSTEM

Use GitHub as the central engineering hub.

## GitHub Issues

Use for: - Feature - Bug - Task - Research - Technical debt - Security -
Experiment

## GitHub Projects

Use for: - Product backlog - Sprint/weekly board - Status tracking -
Milestone tracking

Suggested states:

``` text
Backlog
Ready
In Progress
In Review
CI
Staging
Verified
Done
Blocked
```

## Pull Requests

Use for all meaningful implementation changes.

## GitHub Actions

Use for: - CI - Security - Docker - Deployment - Smoke tests

## GitHub Releases

Use for: - Versioned releases - Release notes - Production milestones

------------------------------------------------------------------------

# 15.5. PROJECT OPERATING SYSTEM DECISION — GITHUB AS THE CENTER

## Decision

**CIRCLE will use GitHub as the project's Operating System. Jira and ClickUp will not be used in parallel for the same work-management data.**

The reason is traceability. Source code, Issues, Pull Requests, commits, GitHub Actions, releases, and project planning can remain connected in one ecosystem.

The canonical engineering chain is:

```text
Requirement
   ↓
GitHub Issue
   ↓
Branch
   ↓
Commit
   ↓
Pull Request
   ↓
CI
   ↓
Deployment
   ↓
Evidence
```

GitHub Projects is the project-management layer on top of this chain.

## Tool responsibility model

| Tool | Responsibility | Canonical source? |
|---|---|---|
| GitHub Repository | Source code, Markdown docs, diagrams, configuration | **YES** |
| GitHub Issues | Requirements, tasks, bugs, research, technical debt | **YES** |
| GitHub Projects | Backlog, Kanban, roadmap, iterations, metrics | **YES** |
| GitHub Pull Requests | Review and integration gate | **YES** |
| GitHub Actions | CI/CD evidence | **YES** |
| Figma | UI/UX design and prototypes | YES for UI/UX |
| Google Forms/Sheets | Raw user research data | YES for raw research |
| Word/LaTeX | Final thesis submission | YES for submitted thesis |
| Jira | Not used by default | NO |
| ClickUp | Not used by default | NO |

### When Jira or ClickUp may be introduced

Only consider adding another project-management system if:

- the supervisor explicitly requires it;
- an external partner/client requires it;
- the team grows substantially;
- a specific enterprise workflow cannot reasonably be represented in GitHub.

Before introducing a second project-management system, create an ADR describing:
- why GitHub is insufficient;
- what the second system will own;
- how synchronization will work;
- which system remains canonical.

**Never create the same Bug/Task independently in Jira, ClickUp and GitHub and maintain all three manually.** Multiple manually synchronized sources of truth are an anti-pattern.

---

# 15.6. PROFESSIONAL BUG MANAGEMENT IN GITHUB

GitHub Issues is the canonical defect-management system for CIRCLE.

Each Bug Issue should use a standardized template:

```text
BUG-ID
Summary
Environment
Version / Build
Severity
Priority
Affected module
Precondition
Steps to reproduce
Expected result
Actual result
Evidence
Root cause
Fix
Regression test
Commit
Pull Request
Verification
```

Recommended GitHub Project custom fields:

```text
Type
Status
Priority
Severity
Area
Iteration
Assignee
Estimate
Target Date
Rubric Criterion
Evidence Status
```

Recommended labels:

```text
type:bug
type:feature
type:task
type:research
type:security
type:technical-debt

severity:blocker
severity:critical
severity:major
severity:minor
severity:trivial

area:auth
area:chat
area:realtime
area:media
area:mobile
area:web
area:admin
area:infra
```

Bug lifecycle:

```text
OPEN
  ↓
TRIAGED
  ↓
IN PROGRESS
  ↓
FIXED
  ↓
READY FOR TEST
  ↓
VERIFIED
  ↓
CLOSED
```

A bug is not considered fixed because the developer believes it is fixed. It is fixed only after implementation, appropriate regression testing, CI validation, review, and verification.

---

# 15.7. ONE PROJECT OS — ONE PLACE TO FIND EVERYTHING

The goal is not that every byte of information must physically live on one page.

The goal is:

> **Every important project artifact has one canonical location, and the GitHub Project can lead the team to it without information being lost.**

Create one main GitHub Project for CIRCLE with multiple views.

### View 01 — Executive Dashboard

Show:
- Overall project progress
- Current milestone
- Current week
- Blockers
- High-priority bugs
- Rubric risks
- Deployment status

### View 02 — Product Backlog

Show:
- Epic
- User Story
- Priority
- Status
- Owner
- Iteration

### View 03 — Current Week

Filter:

```text
Iteration = current week
```

### View 04 — Bug Board

Filter:

```text
Type = Bug
```

### View 05 — Rubric Dashboard

Show:

```text
Rubric Criterion
Target Level
Evidence Status
Risk
Owner
```

### View 06 — Technical Debt

Filter:

```text
Type = Technical Debt
```

### View 07 — Research & Evidence

Track:
- Research tasks
- User experiments
- KPI work
- AI evidence
- Testing evidence

### View 08 — 19-Week Roadmap

Track:
- W1 → W19
- major epics
- milestones
- deadlines

---

# 15.8. DIAGRAM MANAGEMENT — KEEP ARCHITECTURE CONNECTED TO WORK

**GitHub Projects is not the diagram editor. It is the management and traceability layer for diagrams.**

Architecture diagrams should be version-controlled inside the repository.

Recommended structure:

```text
docs/
└── architecture/
    └── diagrams/
        ├── context.mmd
        ├── component.mmd
        ├── erd.mmd
        ├── deployment.mmd
        └── sequence/
            ├── auth.mmd
            ├── chat.mmd
            ├── realtime.mmd
            └── call.mmd
```

## Mermaid

Prefer Mermaid whenever practical.

Benefits:
- stored as text;
- Git diff works;
- PR review works;
- AI Agents can read it;
- changes are traceable;
- no dependency on a binary design file.

## draw.io

Use draw.io when complex visual layout is needed.

Commit the source `.drawio` file, not only exported PNG/PDF files.

## Figma

Use Figma for:
- UI/UX
- screen design
- prototypes
- design system

A relevant Figma design should be referenced from its Feature Issue and/or PR.

## Diagram traceability

Each important diagram should have:

```text
Diagram ID
Title
Purpose
Related requirement IDs
Related ADR
Related module/code
Last reviewed commit
Owner
```

Example:

```text
ARCH-SEQ-CHAT-001
→ US-CHAT-001
→ AC-CHAT-001-01
→ ADR-007
→ apps/api/src/modules/chat
→ PR #128
```

## Diagram–code audit

At every major milestone:

1. Select representative diagrams/flows.
2. Compare diagrams with actual source code.
3. Record the audit result.
4. Create an Issue for every mismatch.
5. Update the diagram or implementation.
6. Review through a PR.
7. Close the issue with evidence.

Target:

> **100% diagram/code match in the required sample audit.**

---

# 15.9. DOCUMENTATION NAVIGATION — PREVENT PEOPLE AND AGENTS FROM GETTING LOST

Repository root should contain:

```text
README.md
PROJECT_GOD.md
AGENTS.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md
```

README must contain a Project Map:

```text
Project Map
├── Requirements
├── Architecture
├── ADR
├── API
├── Testing
├── Security
├── Deployment
├── Operations
├── AI Usage
├── Experiments
├── Thesis
└── Evidence
```

`PROJECT_GOD.md` is the high-level map and project constitution.

`AGENTS.md` is the machine-facing entry point for AI Agents.

Detailed technical documents live under `docs/`.

GitHub Issues and Pull Requests connect requirements, implementation, review, CI/CD, and evidence.

---

# 16. RECOMMENDED TOOLCHAIN

## Core

  Need                       Tool
  -------------------------- ------------------------------------------------
  Source control             Git + GitHub
  Issue tracking             GitHub Issues
  Planning                   GitHub Projects
  Code review                GitHub Pull Requests
  CI/CD                      GitHub Actions
  Documentation              Markdown in repository
  Architecture diagrams      Mermaid + draw.io/appropriate diagram tool
  UI design                  Figma
  API testing                Postman/Insomnia or automated API suite
  Unit/integration           Jest
  Web E2E                    Playwright
  Performance                k6
  Static quality             ESLint + SonarQube/SonarCloud
  Secret scanning            gitleaks
  Dependency scanning        Dependabot / GitHub security tooling
  Container                  Docker
  Container registry         GHCR
  Reverse proxy              Traefik
  DNS/edge                   Cloudflare
  PostgreSQL                 Neon
  Redis                      Upstash
  Media                      Cloudflare R2
  Production                 VPS
  Staging/cloud experiment   Azure
  Survey                     Google Forms
  Survey analysis            Google Sheets / Python
  Thesis                     Word/LaTeX according to faculty requirement
  Evidence storage           Repository + approved university/cloud storage

### Important tool principle

Do not create a fragmented tool ecosystem where the same information
exists in five places.

**GitHub = engineering source of truth.**

Figma = UI/UX source of truth.

Google Forms/Sheets = raw user-research data.

Official university documents = academic source of truth.

------------------------------------------------------------------------

# 17. REPOSITORY STRUCTURE

Recommended structure:

``` text
circle/
├── apps/
│   ├── api/
│   ├── web/
│   ├── mobile/
│   └── admin/
│
├── packages/
│   ├── shared/
│   ├── types/
│   └── config/
│
├── docs/
│   ├── research/
│   ├── requirements/
│   ├── architecture/
│   │   ├── diagrams/
│   │   └── ADR/
│   ├── api/
│   ├── testing/
│   ├── security/
│   ├── deployment/
│   ├── operations/
│   ├── ai-usage/
│   ├── experiments/
│   ├── thesis/
│   └── evidence/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── api/
│   ├── e2e/
│   └── performance/
│
├── docker/
├── scripts/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── AGENTS.md
├── PROJECT_GOD.md
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── docker-compose.yml
└── .env.example
```

`PROJECT_GOD.md` is the canonical project definition.

`AGENTS.md` should contain a concise machine-facing version of the
operational rules and point back to this file.

------------------------------------------------------------------------

# 18. REQUIREMENTS TRACEABILITY

Every important requirement must be traceable:

``` text
Business Problem
    ↓
Epic
    ↓
User Story / Use Case
    ↓
Acceptance Criteria
    ↓
Design
    ↓
Issue
    ↓
Code
    ↓
Test Case
    ↓
PR
    ↓
CI
    ↓
Deployment
    ↓
UAT
    ↓
Metric / Evidence
```

Recommended IDs:

``` text
EPIC-AUTH
US-AUTH-001
AC-AUTH-001-01
BR-AUTH-001
NFR-001
API-AUTH-001
TC-AUTH-001
BUG-AUTH-001
ADR-001
```

------------------------------------------------------------------------

# 19. NON-FUNCTIONAL REQUIREMENTS

At least 5 NFRs must be quantitatively constrained.

Recommended initial categories:

### NFR-001 Performance

Define measurable API latency target for agreed representative
endpoints.

### NFR-002 Availability

Define staging/production availability target appropriate to a student
project.

### NFR-003 Reliability

Define acceptable error rate for critical workflows.

### NFR-004 Security

No secrets in repository; authentication/authorization must pass
security test suite.

### NFR-005 Deployment

Commit-to-staging target ≤15 minutes.

### NFR-006 Test quality

Core module line coverage ≥70%.

### NFR-007 UI

Critical screens must remain usable across agreed responsive
breakpoints.

### NFR-008 Realtime

Define measurable delivery/acknowledgement behavior for agreed realtime
events.

**Important:** Exact numeric thresholds for project-specific NFRs must
be agreed and recorded in SRS/KPI baseline. Do not invent measured
results in advance.

------------------------------------------------------------------------

# 20. KPI SYSTEM

At least 5 business KPIs must be committed before the 50% milestone.

Potential KPI categories:

1.  User task completion rate.
2.  Circle creation/join success rate.
3.  Core interaction success rate.
4.  Message/realtime delivery success rate.
5.  User satisfaction / SUS.
6.  Time required to complete representative collaboration tasks.
7.  User retention/return rate during the experiment where meaningful.

Each KPI needs:

``` text
KPI ID
Definition
Formula
Target
Baseline
Measurement method
Data source
Measurement date
Owner
Evidence location
```

Do not change KPI definitions after measurement merely to improve the
result.

------------------------------------------------------------------------

# 21. AI USAGE LOG TEMPLATE

``` markdown
## AI-XXXX

- Date:
- Student:
- Tool:
- Model:
- Purpose:
- Prompt summary:
- Files affected:
- AI-generated section:
- Human modifications:
- Verification:
- Official source checked:
- Tests:
- Security check:
- License check:
- AI error found:
- Root cause:
- Fix:
- Commit:
- PR:
```

For significant AI-assisted work, keep the original prompt or an
accurate prompt summary where policy/privacy permits.

Never put: - secrets - passwords - private credentials - sensitive
personal data - production tokens

into AI prompts.

------------------------------------------------------------------------

# 22. ARCHITECTURE DECISION RECORDS

Create an ADR for meaningful architectural choices.

Template:

``` markdown
# ADR-XXX — Title

## Status
Accepted / Superseded / Rejected

## Context
What problem exists?

## Options
1. Option A
2. Option B
3. Option C

## Decision
What did we choose?

## Reasons
- ...
- ...
- ...

## Trade-offs
- Benefits
- Costs
- Risks

## Consequences
What becomes easier/harder?

## Evidence
Links to experiment / documentation / issue / PR.
```

Required early ADR:

### ADR-011 --- Deployment & Infrastructure Strategy

Options considered:

1.  Azure-only
2.  VPS-only
3.  Hybrid
4.  Fully managed/serverless

Decision:

> **Hybrid** --- VPS for production, Azure for staging/cloud
> experiments, managed PostgreSQL/Redis/object storage, Dockerized
> application.

Reasoning:

-   Cost control.
-   Portability.
-   Operational learning.
-   Linux/Docker/networking evidence.
-   CI/CD evidence.
-   Reduced operational burden by using managed stateful services.
-   Avoid hard dependency on one cloud.

------------------------------------------------------------------------

# 23. TECHNICAL DEBT REGISTER

Every knowingly deferred technical issue goes into:

``` text
TD-001
Title:
Context:
Why deferred:
Risk:
Impact:
Estimated effort:
Priority:
Target resolution:
Related issue:
```

Technical debt is not hidden.

------------------------------------------------------------------------

# 24. SECURITY BASELINE

Minimum:

-   HTTPS.
-   Secure authentication.
-   Authorization on protected resources.
-   Password hashing.
-   Token/session security.
-   Input validation.
-   Rate limiting where appropriate.
-   File type/size validation.
-   Safe upload handling.
-   Secrets outside source code.
-   Dependency scanning.
-   Secret scanning.
-   Safe error responses.
-   Audit/security logs where appropriate.
-   CORS policy.
-   Environment separation.
-   Database access restrictions.
-   Least privilege.
-   Backup strategy.
-   Restore procedure.

------------------------------------------------------------------------

# 25. OBSERVABILITY / OPERATIONS

Production/staging should expose at minimum:

``` text
/health
```

Health checks should verify appropriate dependencies without exposing
secrets.

Operational evidence:

-   Application logs.
-   Reverse proxy logs.
-   Deployment logs.
-   Health check results.
-   Error events.
-   Alert configuration.
-   Deployment version.
-   Rollback procedure.

------------------------------------------------------------------------

# 26. BACKUP / RECOVERY

Before production:

-   Define database backup strategy.
-   Define media recovery assumptions.
-   Define restore procedure.
-   Test restore at least once.
-   Document RPO/RTO assumptions appropriate to project scale.

A backup that has never been restored is not proven reliable.

------------------------------------------------------------------------

# 27. TEST STRATEGY

## Unit

Test: - business rules - validation - pure services - permission
decisions - utility logic

## Integration

Test: - database interactions - Prisma behavior - module boundaries -
transactional behavior

## API

Test: - authentication - authorization - validation - success paths -
error paths - pagination/filtering where relevant

## E2E

Test critical user journeys:

-   Register/login
-   Friend request
-   Create/join Circle
-   Send message
-   Send media
-   Reaction/reply
-   Realtime update
-   Create plan/calendar/vote
-   Notification
-   Admin critical workflow

## Non-functional

Where applicable:

-   API performance
-   realtime behavior
-   load
-   reliability
-   security
-   deployment smoke

------------------------------------------------------------------------

# 28. TEST CASE FORMAT

``` text
TC-ID:
Requirement:
Acceptance Criterion:
Precondition:
Input:
Steps:
Expected Result:
Actual Result:
Status:
Environment:
Automation:
Regression:
Related Bug:
Evidence:
```

Negative/edge test examples:

``` text
invalid credentials
expired token
unauthorized Circle access
empty Circle
empty album
oversized upload
unsupported file
network interruption
request timeout
duplicate realtime event
concurrent action
deleted resource
non-member access
admin-only endpoint accessed by normal user
```

------------------------------------------------------------------------

# 29. RELEASE STRATEGY

Semantic versioning where practical:

``` text
MAJOR.MINOR.PATCH
```

Examples:

``` text
v0.1.0
v0.2.0
v0.9.0
v1.0.0
```

Production releases should be:

-   versioned
-   traceable to commit
-   reproducible
-   rollbackable

Never deploy an untraceable "latest".

------------------------------------------------------------------------

# 30. CI/CD TARGET

Example GitHub Actions flow:

``` text
Pull Request
   │
   ├── Checkout
   ├── Install
   ├── Typecheck
   ├── Lint
   ├── Static analysis
   ├── Unit tests
   ├── Integration/API tests
   ├── Security/dependency/secret scan
   └── Build
            │
            ▼
        Merge
            │
            ▼
      Docker Build
            │
            ▼
      Push GHCR image
            │
            ▼
      Deploy Staging
            │
            ▼
      Health Check
            │
            ▼
       Smoke Tests
            │
            ▼
         Success
```

Target: - ≥6 stages. - ≥10 automated deployments. - ≥90% green. - commit
→ staging ≤15 minutes.

------------------------------------------------------------------------

# 31. ROLLBACK STRATEGY

Use immutable/versioned Docker tags:

``` text
circle-api:commit-sha
circle-api:v0.8.0
```

Rollback:

``` text
current version
     ↓
health failure / incident
     ↓
select previous known-good version
     ↓
redeploy
     ↓
health check
     ↓
smoke test
     ↓
incident recorded
```

Document rollback before the first serious production deployment.

------------------------------------------------------------------------

# 32. WEEKLY SDLC CADENCE

Every week:

### Monday / start of week

-   Review roadmap.
-   Review blockers.
-   Select issues.
-   Confirm acceptance criteria.
-   Assign owners.

### During implementation

-   Feature branches.
-   Small commits.
-   Tests alongside code.
-   Update docs/diagrams.
-   AI log updated continuously.

### End of week

-   Merge reviewed PRs.
-   Run CI.
-   Deploy staging.
-   Verify.
-   Update progress report.
-   Record metrics.
-   Update rubric evidence dashboard.
-   Update technical debt.
-   Update thesis notes.
-   Prepare supervisor report/signature as required.

Target:

> ≥1 documented progress report per week.

------------------------------------------------------------------------

# 33. 19-WEEK ROADMAP

The official submitted plan remains the scope/timeline baseline.
Engineering controls are added around it.

## W1--W3 --- Discovery / requirements / architecture

Official: - Survey - Scope - Requirements - Use cases - Client--Server +
Modular Monolith - DB design - Sequence diagrams

Engineering overlay: - Stakeholder research - Survey ≥30 target
responses OR ≥3 real stakeholders - Personas - Competitor comparison
≥3 - ≥5 KPI candidates - SRS - Business rules - Data dictionary - NFRs -
Context/component/ERD/sequence/deployment - ADRs

## W4--W6 --- Foundation

Official: - NestJS - Prisma - PostgreSQL - AuthN/AuthZ -
Account/Friend/Circle API - Basic Web/Mobile

Engineering overlay: - Repository structure - Git conventions - PR
process - CI baseline - lint/typecheck - unit/API tests - security
scanning - Docker local development - first staging experiment

## W7--W10 --- Communication / realtime

Official: - Chat - image/video/file - reply/reaction - voice message -
realtime sharing - Socket.IO - voice/video

Engineering overlay: - realtime test strategy - WebRTC PoC - performance
baseline - media security - integration tests - failure/reconnect
tests - observability

## W11--W13 --- Circle collaboration

Official: - Album - Pin - Location - Plan - Calendar - Vote - anonymous
"Điều muốn nói" - Notifications

Engineering overlay: - acceptance criteria completion - regression
suite - authorization matrix - notification reliability - diagrams kept
synchronized

## W14 --- Integration

Official: - complete Web/Mobile - integrate APIs - Admin Management
Website - permissions

Engineering overlay: - full integration - responsive pass -
accessibility/usability pass - admin security review - staging UAT

## W15--W16 --- Full testing / deployment

Official: - full system testing - functional/API/realtime/auth - bug
fixing - optimization - Docker deployment

Engineering overlay: - 4-layer test suite - coverage ≥70% core -
security scans - performance - bug burn-down - backup/restore -
production readiness - monitoring

## W17 --- CI/CD / documentation / demo

Official: - GitHub Actions - deployment test - report - documentation -
demo

Engineering overlay: - ≥6 pipeline stages - automated staging -
deployment evidence - ≥10 automated deployments accumulated - rollback -
health/log/alert - evidence package

## W18 --- Real-user experiment

The submitted official plan has blank W18/W19 rows.

Project engineering target: - ≥10 real target users - task script -
baseline - SUS - task success - observation - anonymized records

## W19 --- Improvement / finalization

-   implement highest-impact improvement
-   re-run user study measurement
-   before/after comparison
-   final regression
-   final deployment
-   final evidence audit
-   thesis finalization
-   defense rehearsal
-   ownership/AI Q&A rehearsal

------------------------------------------------------------------------

# 34. MILESTONE GATES

## Gate A --- Requirements Complete

Must have: - SRS - personas - scope - use cases - AC - business rules -
data dictionary - NFR - initial KPI - competitor analysis

## Gate B --- Architecture Complete

Must have: - context - component - ERD/class - sequence - deployment -
ADRs

## Gate C --- Foundation Stable

Must have: - API boot - DB - Auth - basic client - CI - tests - Docker
local

## Gate D --- Realtime Risk Burned Down

Must have: - Socket.IO proof - realtime tests - WebRTC PoC - media flow
proof - failure handling

## Gate E --- 50% Commitment Freeze

Must have: - final committed feature scope - ≥5 KPI - signed/approved
product commitment evidence as required - no silent scope expansion

## Gate F --- Feature Complete

Must have: - core features implemented - acceptance criteria tracked -
tests - docs - staging

## Gate G --- Production Ready

Must have: - security - tests - Docker - deployment - monitoring -
backup/restore - rollback

## Gate H --- User Experiment Complete

Must have: - ≥10 target users - task success - SUS - before/after
improvement

## Gate I --- Defense Ready

Must have: - 100% evidence matrix - stable production - final CI - final
test report - thesis - presentation - Q&A knowledge base

------------------------------------------------------------------------

# 35. RUBRIC EVIDENCE MATRIX

Maintain a living table:

  Criterion   Target                              Evidence                    Status
  ----------- ----------------------------------- --------------------------- --------
  TC1         ≥3 stakeholders or ≥30 surveys      research docs               ☐
  TC1         ≥3 competitors                      comparison                  ☐
  TC1         ≥5 KPIs                             KPI baseline/commitment     ☐
  TC2.1       100% AC                             SRS/backlog                 ☐
  TC2.1       ≥4 diagrams                         SDD                         ☐
  TC2.1       ≥5 NFR                              SRS                         ☐
  TC2.1       100% diagram/code match             audit                       ☐
  TC2.2       100% core functions                 UAT/demo                    ☐
  TC2.2       public production/staging + users   deployment                  ☐
  TC2.2       0 demo blockers                     final rehearsal             ☐
  TC2.3       full AI log                         AI log + Git                ☐
  TC2.3       ≥5 AI errors fixed                  AI log + commits            ☐
  TC2.4       0 lint                              CI report                   ☐
  TC2.4       0 Blocker/Critical                  static analysis             ☐
  TC2.4       duplication ≤3%                     static report               ☐
  TC2.4       ≥90% weeks commits                  Git audit                   ☐
  TC2.4       ≥90% reviewed PR                    Git audit                   ☐
  TC2.4       0 secrets                           gitleaks                    ☐
  TC2.5       ≥4 test layers                      test plan/code              ☐
  TC2.5       core coverage ≥70%                  coverage                    ☐
  TC2.5       automation ≥70%                     test report                 ☐
  TC2.5       final CI 100% pass                  CI                          ☐
  TC2.5       0 Critical/Blocker                  bug tracker                 ☐
  TC2.6       ≥6 pipeline stages                  Actions                     ☐
  TC2.6       green ≥90%                          Actions history             ☐
  TC2.6       ≥10 auto deploys                    deploy history              ☐
  TC2.6       ≤15 min commit→staging              pipeline logs               ☐
  TC2.6       health/log/alert                    ops evidence                ☐
  TC2.7       ≥10 target users                    anonymized list             ☐
  TC2.7       success ≥90%                        experiment                  ☐
  TC2.7       SUS ≥80                             survey                      ☐
  TC2.7       before/after improvement            experiment                  ☐
  TC3         ≤5% timing deviation                rehearsal                   ☐
  TC3         live deployed demo, 0 errors        rehearsal                   ☐
  TC4         ≥5 foreign sources                  thesis                      ☐
  TC4         similarity ≤20%                     report                      ☐
  TC4         0 formatting errors                 QA                          ☐
  TC4         100% figure/table references        QA                          ☐
  TC5         ≥90% overall Q&A                    mock defense                ☐
  TC5         ≥95% technical                      mock defense                ☐
  TC6         evidence if achieved                award/paper/adoption/etc.   ☐

------------------------------------------------------------------------

# 36. EVIDENCE DIRECTORY

Recommended:

``` text
docs/evidence/
├── rubric-dashboard.md
├── weekly-reports/
├── signed-documents/
├── final-commitment/
├── git-audit/
├── ai/
├── static-analysis/
├── security/
├── testing/
├── cicd/
├── deployment/
├── user-experiment/
├── thesis/
└── outstanding-results/
```

Never create fake evidence files.

Evidence should contain: - date - source - metric - method - owner -
related commit/issue where applicable

------------------------------------------------------------------------

# 37. "AGENT MODE" --- RULES FOR AI CODING AGENTS

Any AI Agent working on CIRCLE must obey these rules.

## Rule 1 --- Read before changing

Before modifying code, inspect: - `PROJECT_GOD.md` - relevant SRS -
relevant SDD/ADR - existing module - existing tests - relevant
issue/acceptance criteria

## Rule 2 --- Do not invent project facts

Never invent: - requirements - users - survey results - KPI results - AI
errors - deployment results - performance numbers -
ownership/contribution - library behavior

If unknown, state:

``` text
UNKNOWN — needs verification
```

## Rule 3 --- Preserve source of truth

Do not silently alter: - official scope - committed KPI - architecture -
acceptance criteria

Create a proposed change instead.

## Rule 4 --- Prefer existing abstractions

Before creating: - service - utility - hook - component - module -
database abstraction

search the repository for an existing equivalent.

## Rule 5 --- No blind implementation

For a feature: 1. understand requirement 2. inspect code 3. identify
impact 4. propose/confirm design 5. implement 6. test 7. lint/typecheck
8. security check 9. update docs 10. report evidence

## Rule 6 --- Never bypass quality gates

Do not: - disable tests just to pass CI - suppress lint without reason -
ignore type errors - remove validation to simplify implementation -
hard-code secrets - hide errors - fake test output

## Rule 7 --- AI output is untrusted

Every generated code block must be treated as a proposal requiring
verification.

## Rule 8 --- Keep changes reviewable

Prefer small PR-sized changes.

## Rule 9 --- Explain every nontrivial change

Report: - what - why - alternatives - risks - tests - files - evidence

## Rule 10 --- Definition of Done is mandatory

Do not label a feature complete if the applicable DoD items are
unfinished.

------------------------------------------------------------------------

# 38. AI AGENT WORKFLOW

When given an implementation task:

``` text
READ
 ↓
PLAN
 ↓
INSPECT
 ↓
IMPLEMENT
 ↓
TEST
 ↓
VERIFY
 ↓
DOCUMENT
 ↓
REPORT
```

Agent final report:

``` markdown
## Implementation Report

### Issue
#...

### Changed
- ...

### Design
- ...

### Tests
- Unit:
- Integration:
- API:
- E2E:

### Quality
- Lint:
- Typecheck:
- Static analysis:
- Security:

### Documentation
- ...

### AI
- AI used:
- Log entry:

### Risks
- ...

### Remaining work
- ...

### DoD
- [x] ...
- [ ] ...
```

------------------------------------------------------------------------

# 39. WHAT NOT TO DO

Never:

-   Build everything first and document later.
-   Wait until Week 17 to start CI/CD.
-   Wait until the end to discover WebRTC does not work.
-   Use only manual testing.
-   Keep requirements only in chat messages.
-   Keep bugs only in memory.
-   Make diagrams after implementation without reconciling them.
-   Store secrets in `.env` committed to Git.
-   Put fake survey/user results into the thesis.
-   Invent performance metrics.
-   Claim AI hallucinations that did not actually happen.
-   Copy AI-generated thesis content without understanding and
    verification.
-   Add huge features simply to look impressive.
-   Self-host PostgreSQL/Redis/media on the VPS without a reason.
-   Deploy an unversioned `latest` and lose rollback capability.
-   Merge unreviewed critical changes directly into production.
-   Close a bug without verification.
-   Close a feature without DoD.

------------------------------------------------------------------------

# 40. SCOPE CONTROL

Because CIRCLE is a 2-student / 19-week project:

### Priority 1 --- Must protect

-   Official registered features.
-   Authentication/authorization.
-   Circle.
-   Chat/realtime.
-   Voice/video PoC + implementation.
-   Core collaboration tools.
-   Web/Mobile/Admin.
-   Testing.
-   Deployment.
-   User experiment.
-   Thesis/evidence.

### Priority 2 --- Engineering quality

-   Observability.
-   Security hardening.
-   Performance.
-   CI/CD maturity.
-   Documentation.
-   UX improvements.

### Priority 3 --- Optional

Only if all core commitments are safe.

Any new feature must answer:

``` text
Does it improve rubric score?
Does it support the problem?
Can 2 students finish it?
What existing work does it displace?
What evidence will it generate?
```

If the answer is weak, reject it.

------------------------------------------------------------------------

# 41. CURRENT INFRASTRUCTURE COST PHILOSOPHY

Target a low-cost but professionally operated architecture:

``` text
Production:
VPS
+
Neon PostgreSQL
+
Upstash Redis
+
Cloudflare R2
+
Cloudflare
+
GHCR

Staging/experiment:
Azure Student where useful
```

Principles:

-   Keep application cloud-agnostic.
-   Use managed stateful services where they reduce operational risk.
-   Use VPS to demonstrate Linux/Docker/networking/CI/CD/operations.
-   Do not pay for infrastructure before local architecture is stable.
-   Measure actual resource consumption before scaling.
-   Record infrastructure cost assumptions in deployment docs.
-   Avoid architecture decisions based only on free-tier availability.

------------------------------------------------------------------------

# 42. DEPLOYMENT PHASE PLAN

### Phase 1 --- Local

-   Docker Compose
-   PostgreSQL local
-   Redis local
-   API
-   Web
-   Mobile development
-   tests

### Phase 2 --- Staging

-   Azure or equivalent
-   public URL
-   CI deployment
-   health check
-   smoke tests

### Phase 3 --- Production

-   VPS
-   Cloudflare
-   Traefik
-   Docker
-   managed DB/Redis/R2
-   monitoring
-   backup
-   rollback

### Phase 4 --- Evidence

-   deployment history
-   pipeline metrics
-   uptime/health evidence
-   logs
-   screenshots
-   rollback proof

------------------------------------------------------------------------

# 43. FINAL DEFENSE PACKAGE

Before defense, produce:

``` text
01 Official documents
02 Weekly progress reports
03 Final product commitment + KPI
04 Git repository + history
05 AI Usage Log / declaration
06 SRS
07 SDD
08 Architecture diagrams
09 ADRs
10 Coding convention
11 Static analysis
12 Secret scan
13 Test plan
14 Test cases
15 Automated test code
16 Coverage report
17 Defect tracker
18 CI/CD configuration
19 Pipeline history
20 Deployment URL
21 Monitoring/health/alert evidence
22 User experiment report
23 Before/after improvement
24 Thesis similarity report
25 References
26 Presentation
27 Demo script
28 Mock defense Q&A
29 Outstanding-result evidence if any
```

------------------------------------------------------------------------

# 44. FINAL QUALITY GATE

The project is **Defense Ready** only when all are true:

### Product

-   [ ] Core scope 100% working.
-   [ ] Production/public staging working.
-   [ ] No demo blocker.
-   [ ] Critical workflows manually rehearsed.

### Requirements

-   [ ] 100% AC.
-   [ ] Business rules.
-   [ ] Data dictionary.
-   [ ] ≥4 diagram types.
-   [ ] ≥5 quantified NFR.
-   [ ] Diagram/code audit = 100%.

### Code

-   [ ] 0 lint errors.
-   [ ] 0 Blocker/Critical static issues.
-   [ ] Duplication ≤3%.
-   [ ] ≥90% weeks with commits.
-   [ ] ≥90% reviewed PRs.
-   [ ] 0 exposed secrets.
-   [ ] Technical debt register.

### Testing

-   [ ] ≥4 test layers.
-   [ ] Core coverage ≥70%.
-   [ ] Automated tests ≥70%.
-   [ ] Final CI = 100% pass.
-   [ ] 0 Critical/Blocker open.
-   [ ] Regression suite.

### CI/CD

-   [ ] ≥6 stages.
-   [ ] Green ≥90%.
-   [ ] ≥10 auto deploys.
-   [ ] Commit→staging ≤15 min.
-   [ ] Secrets managed properly.
-   [ ] Versioned deployment.
-   [ ] Rollback.
-   [ ] Health check.
-   [ ] Logs.
-   [ ] Alerts.

### AI

-   [ ] Full AI Usage Log.
-   [ ] Git traceability.
-   [ ] ≥5 real AI errors found/fixed.
-   [ ] Root causes documented.
-   [ ] ≥5 random code positions explainable at 100%.
-   [ ] Review checklist.

### Users

-   [ ] ≥10 target users.
-   [ ] ≥90% task success.
-   [ ] SUS ≥80.
-   [ ] ≥1 measured improvement round.
-   [ ] Before/after evidence.

### Thesis

-   [ ] ≥5 quality foreign sources.
-   [ ] ≤20% similarity.
-   [ ] 0 formatting/spelling errors.
-   [ ] 100% figures/tables numbered/captioned/referenced.

### Presentation

-   [ ] Time deviation ≤5%.
-   [ ] Live deployed demo.
-   [ ] 0 errors.
-   [ ] Evidence shown.
-   [ ] Both students can explain system.

### Defense

-   [ ] ≥90% general Q&A target.
-   [ ] ≥95% technical Q&A target.
-   [ ] Architecture trade-offs known.
-   [ ] Testing/deployment known.
-   [ ] AI-supported code known.
-   [ ] Limitations and alternatives known.

------------------------------------------------------------------------

# 45. PROJECT MANTRA

> **CIRCLE is not "an app we need to finish".**
>
> CIRCLE is a **small, evidence-driven software engineering project**.
>
> Every requirement must lead to acceptance criteria.\
> Every implementation must lead to tests.\
> Every important decision must have a reason.\
> Every important change must be traceable.\
> Every bug must have a lifecycle.\
> Every deployment must be reproducible.\
> Every AI-assisted change must be explainable.\
> Every metric must have evidence.\
> Every claim in the thesis must be defensible.
>
> **Build the product. Build the process. Build the evidence. Build the
> ability to defend it.**

------------------------------------------------------------------------

# 46. OFFICIAL SOURCE DOCUMENTS

This file is derived from and must remain consistent with the three
uploaded official project documents:

1.  **Kế hoạch thực hiện TLCN.docx**
    -   19-week schedule
    -   feature phases
    -   expected deliverables
2.  **Nhiệm vụ thực hiện TLCN.docx**
    -   registered theory
    -   registered technologies
    -   registered practical scope
    -   Web / Mobile / Admin / API
3.  **Rubric_Do_An_Mon_Hoc_CNPM_sinhvien.docx**
    -   100-point evaluation structure
    -   Level 1--5 criteria
    -   quantitative metrics
    -   hard gates
    -   mandatory evidence
    -   academic integrity / ownership rules

When this file is updated, verify that no change contradicts those
official documents.

------------------------------------------------------------------------

# 47. CHANGE LOG

  -----------------------------------------------------------------------
  Date                    Change                  Reason
  ----------------------- ----------------------- -----------------------
  2026-09-15              Created PROJECT_GOD.md  Establish project-wide
                                                  SSOT and SDLC/evidence
                                                  system

  2026-09-15              Adopted hybrid VPS +    Cost, portability,
                          Azure strategy          operational learning,
                                                  rubric evidence

  2026-09-15              Added managed           Reduce stateful-service
                          Neon/Upstash/R2         operational burden

  2026-09-15              Added GitHub-centered   Traceability and
                          workflow                collaboration

  2026-09-15              Added Level-5 evidence  Align implementation
                          system                  with rubric

  2026-09-15              Added AI governance     TC2.3 Level-5 readiness

  2026-09-15              Added real-user         TC2.7 Level-5 readiness
                          experiment              
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 48. NEXT ACTIONS --- IMMEDIATE

At the current Week 5 state, execute in this order:

1.  Put this file into the repository as `PROJECT_GOD.md`.
2.  Create `AGENTS.md` as the concise AI-facing entry point.
3.  Create the GitHub Project board.
4.  Create Issue/PR templates.
5.  Establish branch + commit conventions.
6.  Create the initial CI pipeline.
7.  Finish/verify SRS, user stories and acceptance criteria.
8.  Finish the architecture/diagram set.
9.  Create the KPI commitment/baseline package before the 50% gate.
10. Start AI Usage Log immediately.
11. Start bug tracker immediately.
12. Start technical debt register immediately.
13. Build test automation alongside features.
14. Build WebRTC PoC before the realtime phase becomes critical.
15. Keep Docker reproducible locally.
16. Deploy staging before final weeks.
17. Accumulate ≥10 automated deployments during the project.
18. Prepare real-user experiment materials before implementation is
    complete.
19. Perform at least one measured improvement round.
20. Run a final rubric/evidence audit before defense.

**Do not wait until the end to create evidence. Evidence is a by-product
of the normal SDLC and must be generated continuously.**
