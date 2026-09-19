#!/usr/bin/env bash
# setup-git-hooks.sh — Configures git to use repo-resident .githooks/ directory

set -euo pipefail

chmod +x .githooks/* scripts/*.sh 2>/dev/null || true
git config core.hooksPath .githooks

echo "✅ Git hooks configured successfully! Commits will now automatically enforce:"
echo "   - Agent Map & Markdown Link Integrity (scripts/check-agent-map.sh)"
echo "   - Automated AI Usage Logging (scripts/verify-ai-log.sh)"
