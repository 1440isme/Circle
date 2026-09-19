#!/usr/bin/env python3
"""
setup-github-project.py — Automates the creation and configuration of the canonical
GitHub Project (Projects v2) for CIRCLE according to PROJECT_GOD.md Section 15.7.

Requirements:
  - Python 3.8+
  - A GitHub Personal Access Token (PAT) with `repo` and `project` permissions.
    (Generate at: https://github.com/settings/tokens/new?scopes=repo,project)

Usage:
  export GITHUB_TOKEN="ghp_your_token_here"
  python3 scripts/setup-github-project.py
"""

import os
import sys
import json
import urllib.request
import urllib.error

GRAPHQL_URL = "https://api.github.com/graphql"
OWNER = "1440isme"
REPO = "Circle"
PROJECT_TITLE = "CIRCLE — Project OS"

def run_query(token: str, query: str, variables: dict = None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Circle-Project-Setup",
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
        print("==================================================================")
        print("🔑 GitHub Personal Access Token Required")
        print("==================================================================")
        print("To create and configure the GitHub Project automatically:")
        print("1. Go to: https://github.com/settings/tokens/new?scopes=repo,project")
        print("2. Generate a token with scopes: [repo, project]")
        print("3. Run this script:")
        print("     export GITHUB_TOKEN='ghp_...'")
        print("     python3 scripts/setup-github-project.py")
        print("==================================================================")
        sys.exit(1)

    print(f"🚀 Initializing GitHub Project for {OWNER}/{REPO}...")

    # 1. Fetch Owner ID & Repo ID
    owner_query = """
    query($login: String!, $name: String!) {
      user(login: $login) {
        id
        repository(name: $name) {
          id
        }
      }
    }
    """
    owner_data = run_query(token, owner_query, {"login": OWNER, "name": REPO})
    if not owner_data or not owner_data.get("user"):
        print("❌ Could not resolve repository or owner ID. Check your token.", file=sys.stderr)
        sys.exit(1)

    owner_id = owner_data["user"]["id"]
    repo_id = owner_data["user"]["repository"]["id"]
    print(f"✅ Found repository ID: {repo_id} (Owner: {OWNER})")

    # 2. Create ProjectV2 or use existing
    existing_project_id = os.environ.get("PROJECT_ID")
    if existing_project_id:
        project_id = existing_project_id
        project_url = f"https://github.com/users/{OWNER}/projects/{project_id}"
        print(f"🔄 Using existing Project ID: {project_id}")
    else:
        create_proj_mutation = """
        mutation($ownerId: ID!, $title: String!) {
          createProjectV2(input: {ownerId: $ownerId, title: $title}) {
            projectV2 {
              id
              url
            }
          }
        }
        """
        proj_data = run_query(token, create_proj_mutation, {"ownerId": owner_id, "title": PROJECT_TITLE})
        if not proj_data:
            print("❌ Failed to create ProjectV2. Ensure your token has 'project' scope.", file=sys.stderr)
            sys.exit(1)

        project_id = proj_data["createProjectV2"]["projectV2"]["id"]
        project_url = proj_data["createProjectV2"]["projectV2"]["url"]
        print(f"🎉 Created Project: {project_url} (ID: {project_id})")

    # 3. Link Project to Repository
    link_mutation = """
    mutation($projectId: ID!, $repoId: ID!) {
      linkProjectV2ToRepository(input: {projectId: $projectId, repositoryId: $repoId}) {
        repository {
          id
        }
      }
    }
    """
    run_query(token, link_mutation, {"projectId": project_id, "repoId": repo_id})
    print(f"✅ Linked project to {OWNER}/{REPO}")

    # 4. Create Custom Single-Select Fields
    create_field_mutation = """
    mutation($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      createProjectV2Field(input: {
        projectId: $projectId,
        dataType: SINGLE_SELECT,
        name: $name,
        singleSelectOptions: $options
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField {
            id
            name
          }
        }
      }
    }
    """

    fields_to_create = [
        ("Issue Type", [
            {"name": "Feature", "color": "BLUE", "description": "User Story / Feature"},
            {"name": "Bug", "color": "RED", "description": "Defect"},
            {"name": "Task", "color": "GRAY", "description": "Chore / Maintenance"},
            {"name": "Research", "color": "PURPLE", "description": "Research Spike / ADR"},
            {"name": "Security", "color": "ORANGE", "description": "Security Audit / Fix"},
            {"name": "Technical Debt", "color": "YELLOW", "description": "Refactoring"},
        ]),
        ("Priority", [
            {"name": "P0-Critical", "color": "RED", "description": "Must do now"},
            {"name": "P1-High", "color": "ORANGE", "description": "Current sprint goal"},
            {"name": "P2-Medium", "color": "YELLOW", "description": "Scheduled iteration"},
            {"name": "P3-Low", "color": "GRAY", "description": "Nice to have"},
        ]),
        ("Severity", [
            {"name": "Blocker", "color": "RED", "description": "System down / cannot proceed"},
            {"name": "Critical", "color": "ORANGE", "description": "Major feature broken"},
            {"name": "Major", "color": "YELLOW", "description": "Impaired function with workaround"},
            {"name": "Minor", "color": "BLUE", "description": "UI flaw / edge case"},
            {"name": "Trivial", "color": "GRAY", "description": "Cosmetic typo"},
        ]),
        ("Area", [
            {"name": "Auth", "color": "BLUE", "description": "Authentication & RBAC"},
            {"name": "Circles", "color": "PURPLE", "description": "Circle spaces & roles"},
            {"name": "Chat", "color": "GREEN", "description": "Text messaging & channels"},
            {"name": "Realtime", "color": "ORANGE", "description": "Socket.IO & WebRTC"},
            {"name": "Media", "color": "PINK", "description": "Cloudflare R2 storage"},
            {"name": "Web", "color": "BLUE", "description": "Next.js Web application"},
            {"name": "Mobile", "color": "GREEN", "description": "React Native Expo application"},
            {"name": "Admin", "color": "RED", "description": "Admin dashboard (/admin)"},
            {"name": "Infra", "color": "GRAY", "description": "Docker, Traefik, CI/CD"},
        ]),
        ("Rubric Criterion", [
            {"name": "TC1 (Problem & Domain)", "color": "GRAY", "description": "Level 5 Criteria 1"},
            {"name": "TC2.1 (Scope & System)", "color": "BLUE", "description": "Level 5 Criteria 2.1"},
            {"name": "TC2.2 (Database Design)", "color": "PURPLE", "description": "Level 5 Criteria 2.2"},
            {"name": "TC2.3 (AI Governance)", "color": "GREEN", "description": "Level 5 Criteria 2.3"},
            {"name": "TC2.4 (Security & RBAC)", "color": "RED", "description": "Level 5 Criteria 2.4"},
            {"name": "TC2.5 (Automated Testing)", "color": "ORANGE", "description": "Level 5 Criteria 2.5"},
            {"name": "TC3 (Execution Velocity)", "color": "BLUE", "description": "Level 5 Criteria 3"},
            {"name": "TC4 (Defense & Evidence)", "color": "PURPLE", "description": "Level 5 Criteria 4"},
            {"name": "TC5 (User Evaluation)", "color": "GREEN", "description": "Level 5 Criteria 5"},
        ]),
        ("Evidence Status", [
            {"name": "None", "color": "GRAY", "description": "No evidence yet"},
            {"name": "Draft", "color": "YELLOW", "description": "Evidence drafted"},
            {"name": "Reviewed", "color": "BLUE", "description": "Peer-reviewed"},
            {"name": "Defense-Ready", "color": "GREEN", "description": "Locked for final thesis defense"},
        ])
    ]

    for field_name, options in fields_to_create:
        res = run_query(token, create_field_mutation, {
            "projectId": project_id,
            "name": field_name,
            "options": options
        })
        if res:
            print(f"  + Configured field: {field_name}")

    print("\n==================================================================")
    print("✨ SUCCESS: GitHub Project setup complete!")
    print(f"👉 Project URL: {project_url}")
    print("==================================================================")

if __name__ == "__main__":
    main()
