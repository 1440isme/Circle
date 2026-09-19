#!/usr/bin/env python3
"""
seed-project-tasks.py — Automatically creates Sprint 1 & foundational User Stories / Tasks
on GitHub Repository (1440isme/Circle) and attaches them directly to GitHub Project #3
(CIRCLE — Project OS), assigning Area, Priority, and Rubric Criterion fields.

Usage:
  export GITHUB_TOKEN="ghp_your_token_here"
  python3 scripts/seed-project-tasks.py
"""

import os
import sys
import json
import urllib.request
import urllib.error

GRAPHQL_URL = "https://api.github.com/graphql"
OWNER = "1440isme"
REPO = "Circle"
PROJECT_ID = "PVT_kwHOCsXHlM4Bj_YF"  # Project #3

TASKS = [
    {
        "title": "[FEAT]: US-AUTH-001 — User Registration, Password Hashing & Account Activation",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-AUTH-001`
- **Parent Epic:** `EPIC-AUTH`
- **Capability ID:** `CAP-AUTH-01`
- **Target Area:** `Auth`
- **Rubric Criterion:** `TC2.4 (Security & RBAC)`

---

### 2. User Story Statement
**Là một:** `Guest`  
**Tôi muốn:** `Đăng ký tài khoản với email, username và mật khẩu bảo mật`  
**Để:** `Có tài khoản gia nhập các circle cộng đồng`  

---

### 3. Acceptance Criteria (DoD)
- [ ] `AC-AUTH-001-01`: Mật khẩu được hash bằng bcrypt (cost 12), không lưu plaintext.
- [ ] `AC-AUTH-001-02`: Email trùng lặp trả về 409 Conflict mà không để lộ user enumeration flaw.
- [ ] `AC-AUTH-001-03`: Unit test `TC-AUTH-001` pass 100%.

---

### 4. AI Usage Declaration
- [ ] Cam kết tự động log `AI-XXXX` vào `docs/ai-usage/log.md`.""",
        "labels": ["type:feature", "area:auth"],
        "priority": "P0-Critical",
        "area": "Auth",
        "rubric": "TC2.4 (Security & RBAC)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-AUTH-002 — Dual-token JWT Authentication & Refresh Token Rotation",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-AUTH-002`
- **Parent Epic:** `EPIC-AUTH`
- **Capability ID:** `CAP-AUTH-02`
- **Target Area:** `Auth`
- **Rubric Criterion:** `TC2.4 (Security & RBAC)`

---

### 2. User Story Statement
**Là một:** `User`  
**Tôi muốn:** `Đăng nhập hệ thống và tự động refresh token trong nền`  
**Để:** `Duy trì phiên đăng nhập bảo mật không bị ngắt quãng`  

---

### 3. Acceptance Criteria (DoD)
- [ ] `AC-AUTH-002-01`: Access token 15m; Refresh token 7d lưu hashed trong Redis/DB.
- [ ] `AC-AUTH-002-02`: Tái sử dụng Refresh token đã bị thu hồi kích hoạt cơ chế revoke toàn bộ session của tài khoản đó.
- [ ] `AC-AUTH-002-03`: Test tự động `TC-AUTH-002` pass 100%.""",
        "labels": ["type:feature", "area:auth"],
        "priority": "P0-Critical",
        "area": "Auth",
        "rubric": "TC2.4 (Security & RBAC)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-CIRCLE-001 — Circle Creation, Handle Reservation & Channel Hierarchy",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-CIRCLE-001`
- **Parent Epic:** `EPIC-CIRCLE`
- **Capability ID:** `CAP-CIRCLE-01`
- **Target Area:** `Circles`
- **Rubric Criterion:** `TC2.1 (Scope & System)`

---

### 2. User Story Statement
**Là một:** `User`  
**Tôi muốn:** `Tạo một Circle mới với tên, handle duy nhất và kênh mặc định`  
**Để:** `Xây dựng không gian sinh hoạt nhóm riêng biệt`  

---

### 3. Acceptance Criteria (DoD)
- [ ] `AC-CIRCLE-001-01`: Người tạo tự động nhận role `OWNER`.
- [ ] `AC-CIRCLE-001-02`: Tự động sinh kênh văn bản `#general` và phòng thoại `#lounge`.
- [ ] `AC-CIRCLE-001-03`: Test tự động `TC-CIRCLE-001` pass 100%.""",
        "labels": ["type:feature", "area:circles"],
        "priority": "P0-Critical",
        "area": "Circles",
        "rubric": "TC2.1 (Scope & System)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-CIRCLE-002 — Circle Invite Codes, Join Requests & Role Hierarchy",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-CIRCLE-002`
- **Parent Epic:** `EPIC-CIRCLE`
- **Capability ID:** `CAP-CIRCLE-02`
- **Target Area:** `Circles`
- **Rubric Criterion:** `TC2.4 (Security & RBAC)`

---

### 2. Acceptance Criteria (DoD)
- [ ] `AC-CIRCLE-002-01`: Mã mời (invite code) có thời hạn và giới hạn số lượt sử dụng.
- [ ] `AC-CIRCLE-002-02`: Phân quyền RBAC theo các vai trò: `OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`.
- [ ] `AC-CIRCLE-002-03`: Test tự động `TC-CIRCLE-002` pass 100%.""",
        "labels": ["type:feature", "area:circles"],
        "priority": "P1-High",
        "area": "Circles",
        "rubric": "TC2.4 (Security & RBAC)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-CHAT-001 — Real-time Channel Text Messaging via Socket.IO & Redis Adapter",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-CHAT-001`
- **Parent Epic:** `EPIC-CHAT`
- **Capability ID:** `CAP-CHAT-01`
- **Target Area:** `Chat`
- **Rubric Criterion:** `TC2.1 (Scope & System)`

---

### 2. Acceptance Criteria (DoD)
- [ ] `AC-CHAT-001-01`: Tin nhắn phát tán qua Socket.IO room `channel:<id>` dưới 200ms.
- [ ] `AC-CHAT-001-02`: Tin nhắn được lưu bền vững trong PostgreSQL qua Prisma.
- [ ] `AC-CHAT-001-03`: Tự động reconnect và re-join room khi mạng chập chờn.""",
        "labels": ["type:feature", "area:chat", "area:realtime"],
        "priority": "P0-Critical",
        "area": "Chat",
        "rubric": "TC2.1 (Scope & System)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-MEDIA-001 — Cloudflare R2 Presigned Upload URL Generation & Asset Delivery",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-MEDIA-001`
- **Parent Epic:** `EPIC-MEDIA`
- **Capability ID:** `CAP-MEDIA-01`
- **Target Area:** `Media`
- **Rubric Criterion:** `TC2.2 (Database & Storage)`

---

### 2. Acceptance Criteria (DoD)
- [ ] `AC-MEDIA-001-01`: API sinh presigned PUT URL trực tiếp tới Cloudflare R2 (hạn 5 phút).
- [ ] `AC-MEDIA-001-02`: Validate chặt MIME type (image/jpeg, image/png, image/webp) và max size (10MB).
- [ ] `AC-MEDIA-001-03`: Test tự động `TC-MEDIA-001` pass 100%.""",
        "labels": ["type:feature", "area:media"],
        "priority": "P1-High",
        "area": "Media",
        "rubric": "TC2.2 (Database Design)",
        "issue_type": "Feature"
    },
    {
        "title": "[RESEARCH]: SPIKE-RTC-001 — WebRTC Audio/Video Signaling Architecture & STUN/TURN PoC",
        "body": """### 1. Research Scope & Objectives
- **Topic:** WebRTC PeerConnection negotiation qua Socket.IO gateway.
- **Rubric Criterion:** `TC2.1 (Scope & Architecture)`
- **Target Area:** `Realtime`

---

### 2. Key Deliverables
- [ ] Kiểm chứng luồng signaling (offer, answer, ICE candidates) giữa 2 trình duyệt.
- [ ] Kiểm thử qua mạng NAT khắc nghiệt với TURN server.
- [ ] Soạn tài liệu hướng dẫn và sequence diagram vào `docs/architecture/diagrams/`.""",
        "labels": ["type:research", "area:realtime"],
        "priority": "P1-High",
        "area": "Realtime",
        "rubric": "TC2.1 (Scope & System)",
        "issue_type": "Research"
    },
    {
        "title": "[FEAT]: US-WEB-001 — Next.js Responsive App Shell (Left Rail, Channel Drawer, Main Stage)",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-WEB-001`
- **Target Area:** `Web`
- **Rubric Criterion:** `TC2.1 (Scope & UI)`

---

### 2. Acceptance Criteria (DoD)
- [ ] Layout 3 cột: Left Rail (Circle Icons) + Secondary Sidebar (Channels) + Main Stage.
- [ ] Responsive mượt mà trên desktop và mobile web.
- [ ] Cập nhật trạng thái trong `.agents/SITEMAP.md`.""",
        "labels": ["type:feature", "area:web"],
        "priority": "P0-Critical",
        "area": "Web",
        "rubric": "TC2.1 (Scope & System)",
        "issue_type": "Feature"
    },
    {
        "title": "[FEAT]: US-MOBILE-001 — React Native Expo Router Tab Navigation & SecureStore Integration",
        "body": """### 1. User Story ID & Traceability Keys
- **User Story Key:** `US-MOBILE-001`
- **Target Area:** `Mobile`
- **Rubric Criterion:** `TC2.1 (Scope & Mobile)`

---

### 2. Acceptance Criteria (DoD)
- [ ] Điều hướng 4 tab chính: Feed, Circles, Messages, Profile.
- [ ] Lưu trữ JWT token trong `expo-secure-store`.
- [ ] Cập nhật trạng thái trong `.agents/SITEMAP.md`.""",
        "labels": ["type:feature", "area:mobile"],
        "priority": "P1-High",
        "area": "Mobile",
        "rubric": "TC2.1 (Scope & System)",
        "issue_type": "Feature"
    },
    {
        "title": "[TASK]: TASK-CI-001 — Automated Testing, Map Drift & AI Log Verification Pipeline",
        "body": """### 1. Task Objective
- Thiết lập CI pipeline tự động chạy kiểm thử đơn vị, kiểm tra map drift, và bắt buộc AI log trên mọi PR.
- **Rubric Criterion:** `TC2.5 (Automated Testing & CI/CD)` (Hard Gate G5, G6)

---

### 2. Checklist
- [x] Script `check-agent-map.sh` chạy trong GitHub Actions.
- [x] Script `verify-ai-log.sh` bảo vệ Hard Gate G3.
- [ ] Thêm Jest test runner tự động trong `backend/` và `web/`.""",
        "labels": ["type:task", "area:infra"],
        "priority": "P0-Critical",
        "area": "Infra",
        "rubric": "TC2.5 (Automated Testing)",
        "issue_type": "Task"
    },
    {
        "title": "[TASK]: TASK-DOCS-001 — Complete SRS, Traceability Matrix & Architecture Diagram Set",
        "body": """### 1. Task Objective
- Hoàn thiện tài liệu SRS, ma trận truy vết và sơ đồ kiến trúc chuẩn bị cho mốc đánh giá 50% (Hard Gate G1, G9).

---

### 2. Checklist
- [ ] Hoàn thiện `docs/requirements/` với đầy đủ user stories và business rules.
- [ ] Hoàn thiện sơ đồ Mermaid C4 Context và Sequence Diagrams trong `docs/architecture/diagrams/`.
- [ ] Đối chiếu tiêu chuẩn Rubric Level 5 trong `PROJECT_GOD.md`.""",
        "labels": ["type:task", "area:infra"],
        "priority": "P0-Critical",
        "area": "Infra",
        "rubric": "TC1 (Problem & Domain)",
        "issue_type": "Task"
    },
    {
        "title": "[TASK]: TASK-EVIDENCE-001 — Weekly Reports W01-W05 Evidence Package & Rubric Audit 01",
        "body": """### 1. Task Objective
- Hoàn thiện gói hồ sơ bằng chứng tuần 1 đến tuần 5 (Hard Gate G2, G3).
- **Rubric Criterion:** `TC4 (Defense & Evidence)`

---

### 2. Checklist
- [ ] Báo cáo `docs/evidence/weekly-reports/` W01 đến W05.
- [ ] Biên bản tự chấm Rubric Audit #1 (`docs/evidence/rubric-audits/audit-01.md`).
- [ ] Kiểm tra tính toàn vẹn của `docs/ai-usage/log.md`.""",
        "labels": ["type:task", "area:infra"],
        "priority": "P1-High",
        "area": "Infra",
        "rubric": "TC4 (Defense & Evidence)",
        "issue_type": "Task"
    }
]

def run_query(token: str, query: str, variables: dict = None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Circle-Task-Seeder",
    }
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(GRAPHQL_URL, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "errors" in data:
                print("❌ GraphQL Error:", json.dumps(data["errors"], indent=2), file=sys.stderr)
                return None
            return data.get("data")
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.read().decode('utf-8')}", file=sys.stderr)
        return None

def main():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        try:
            import getpass
            print("==================================================================")
            print("🔑 GitHub Personal Access Token (PAT) Input")
            print("==================================================================")
            token = getpass.getpass("👉 Paste your GitHub Personal Access Token (PAT) and hit Enter: ").strip()
        except Exception:
            pass

    if not token:
        print("==================================================================")
        print("❌ Error: GitHub Personal Access Token Required")
        print("==================================================================")
        print("Run this command with your GitHub token:")
        print("  export GITHUB_TOKEN='ghp_...'")
        print("  python3 scripts/seed-project-tasks.py")
        print("==================================================================")
        sys.exit(1)

    print(f"🚀 Seeding Sprint 1 tasks for {OWNER}/{REPO} into Project {PROJECT_ID}...")

    # 1. Fetch Repository ID
    repo_query = """
    query($login: String!, $name: String!) {
      repository(owner: $login, name: $name) {
        id
      }
    }
    """
    repo_data = run_query(token, repo_query, {"login": OWNER, "name": REPO})
    if not repo_data or not repo_data.get("repository"):
        print("❌ Could not resolve repository ID.", file=sys.stderr)
        sys.exit(1)
    repo_id = repo_data["repository"]["id"]

    # 2. Fetch Project Fields to get Field IDs & Option IDs
    project_query = """
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
    """
    fields_data = run_query(token, project_query, {"projectId": PROJECT_ID})
    field_map = {}
    if fields_data and fields_data.get("node"):
        for f in fields_data["node"]["fields"]["nodes"]:
            if "name" in f:
                field_map[f["name"]] = {
                    "id": f["id"],
                    "options": {opt["name"]: opt["id"] for opt in f.get("options", [])}
                }
    print(f"✅ Found configured fields on project: {list(field_map.keys())}")

    # 3. Create Issues and Add to Project
    create_issue_mutation = """
    mutation($repoId: ID!, $title: String!, $body: String!) {
      createIssue(input: {repositoryId: $repoId, title: $title, body: $body}) {
        issue {
          id
          number
          url
        }
      }
    }
    """

    add_item_mutation = """
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
    """

    update_field_mutation = """
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item {
          id
        }
      }
    }
    """

    for i, t in enumerate(TASKS, 1):
        print(f"\n[{i}/{len(TASKS)}] Creating Issue: {t['title']}...")
        issue_res = run_query(token, create_issue_mutation, {
            "repoId": repo_id,
            "title": t["title"],
            "body": t["body"]
        })
        if not issue_res:
            continue
        issue_id = issue_res["createIssue"]["issue"]["id"]
        issue_num = issue_res["createIssue"]["issue"]["number"]
        issue_url = issue_res["createIssue"]["issue"]["url"]
        print(f"  + Created Issue #{issue_num}: {issue_url}")

        # Add to Project
        add_res = run_query(token, add_item_mutation, {
            "projectId": PROJECT_ID,
            "contentId": issue_id
        })
        if not add_res:
            continue
        item_id = add_res["addProjectV2ItemById"]["item"]["id"]
        print(f"  + Added to Project (Item ID: {item_id})")

        # Set Status
        if "Status" in field_map:
            status_options = field_map["Status"]["options"]
            target_status = None
            for candidate in ["Todo", "To Do", "Backlog", "Ready"]:
                if candidate in status_options:
                    target_status = status_options[candidate]
                    break
            if target_status:
                run_query(token, update_field_mutation, {
                    "projectId": PROJECT_ID,
                    "itemId": item_id,
                    "fieldId": field_map["Status"]["id"],
                    "optionId": target_status
                })

        # Set Priority
        if "Priority" in field_map and t["priority"] in field_map["Priority"]["options"]:
            run_query(token, update_field_mutation, {
                "projectId": PROJECT_ID,
                "itemId": item_id,
                "fieldId": field_map["Priority"]["id"],
                "optionId": field_map["Priority"]["options"][t["priority"]]
            })

        # Set Area
        if "Area" in field_map and t["area"] in field_map["Area"]["options"]:
            run_query(token, update_field_mutation, {
                "projectId": PROJECT_ID,
                "itemId": item_id,
                "fieldId": field_map["Area"]["id"],
                "optionId": field_map["Area"]["options"][t["area"]]
            })

        # Set Rubric Criterion
        if "Rubric Criterion" in field_map and t["rubric"] in field_map["Rubric Criterion"]["options"]:
            run_query(token, update_field_mutation, {
                "projectId": PROJECT_ID,
                "itemId": item_id,
                "fieldId": field_map["Rubric Criterion"]["id"],
                "optionId": field_map["Rubric Criterion"]["options"][t["rubric"]]
            })

    print("\n==================================================================")
    print("✨ SUCCESS: All 12 foundational tasks have been seeded into GitHub Project!")
    print(f"👉 View Project Board: https://github.com/users/{OWNER}/projects/3")
    print("==================================================================")

if __name__ == "__main__":
    main()
