#!/usr/bin/env bash
# check-secrets.sh — Scan staged files or codebase for leaked API keys, tokens, and secrets.
# Used by git pre-commit hook and CI to enforce PROJECT_GOD Hard Gate: ZERO SECRET LEAKS.
#
# Usage:
#   scripts/check-secrets.sh --staged    # Check only files staged for git commit (pre-commit hook)
#   scripts/check-secrets.sh             # Check all tracked files

set -euo pipefail

if [ ! -f AGENTS.md ]; then
  echo "ERROR: run from repo root (AGENTS.md not found)" >&2
  exit 2
fi

MODE="all"
if [ "${1:-}" = "--staged" ]; then
  MODE="staged"
fi

python3 - "$MODE" <<'PY'
import os
import re
import subprocess
import sys

mode = sys.argv[1] if len(sys.argv) > 1 else "all"

# Secret regex patterns
PATTERNS = [
    ("Mapbox Public/Secret Token", re.compile(r'pk\.[a-zA-Z0-9_\-\.]{40,}')),
    ("Private Key Header", re.compile(r'-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----')),
    ("AWS / Cloudflare Access Key", re.compile(r'(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}')),
    ("GitHub Personal Access Token", re.compile(r'(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{82})')),
    ("Slack API Token", re.compile(r'xox[baprs]-[0-9a-zA-Z]{10,48}')),
    ("Stripe Secret Key", re.compile(r'sk_live_[0-9a-zA-Z]{24}')),
    ("Google API Key", re.compile(r'AIza[0-9A-Za-z\\-_]{35}')),
    ("Hardcoded Secret Assignment", re.compile(r'(?i)(?:jwt_secret|api_key|secret_key|private_key)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{20,}["\']')),
]

# Ignored paths / files
IGNORE_PATTERNS = [
    re.compile(r'^\.env\.example$'),
    re.compile(r'^\.env\.test$'),
    re.compile(r'^package-lock\.json$'),
    re.compile(r'^yarn\.lock$'),
    re.compile(r'^pnpm-lock\.yaml$'),
    re.compile(r'^\.git/'),
    re.compile(r'^node_modules/'),
    re.compile(r'^scripts/check-secrets\.sh$'),
    re.compile(r'^docs/ai-usage/'),
]

def should_ignore(filepath: str) -> bool:
    for pattern in IGNORE_PATTERNS:
        if pattern.search(filepath):
            return True
    return False

def get_files_to_check():
    if mode == "staged":
        res = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]
    else:
        res = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]

files = get_files_to_check()
violations = []

for filepath in files:
    if should_ignore(filepath):
        continue
    if not os.path.isfile(filepath):
        continue

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_idx, line in enumerate(f, 1):
                # Skip comments explaining secrets or regexes
                if "replace-with" in line or "dummy" in line or "example" in line:
                    continue
                for name, pattern in PATTERNS:
                    match = pattern.search(line)
                    if match:
                        matched_str = match.group(0)
                        masked = matched_str[:4] + "..." + matched_str[-4:] if len(matched_str) > 8 else "***"
                        violations.append({
                            "file": filepath,
                            "line": line_idx,
                            "rule": name,
                            "masked": masked
                        })
    except Exception as e:
        print(f"Warning: could not read {filepath}: {e}", file=sys.stderr)

if violations:
    print("\n" + "=" * 70, file=sys.stderr)
    print("❌ COMMIT REJECTED: Hardcoded Secrets / API Keys detected!", file=sys.stderr)
    print("Zero Secret Leaks is an inviolable Hard Gate in PROJECT_GOD.md.", file=sys.stderr)
    print("=" * 70, file=sys.stderr)
    for v in violations:
        print(f"  • [{v['rule']}] {v['file']}:{v['line']} -> {v['masked']}", file=sys.stderr)
    print("\nPlease move secrets to your local .env file and access via process.env.", file=sys.stderr)
    print("=" * 70 + "\n", file=sys.stderr)
    sys.exit(1)
else:
    print(f"✅ Secret check passed ({len(files)} files checked in mode '{mode}'). Zero secret leaks detected.")
    sys.exit(0)
PY
