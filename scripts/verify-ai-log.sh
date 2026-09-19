#!/usr/bin/env bash
# verify-ai-log.sh — Verifies that any commit modifying application source code
# also includes an updated record in docs/ai-usage/log.md per Hard Gate G3 (Rubric TC2.3 Level 5).
#
# Usage: ./scripts/verify-ai-log.sh [--staged|--pr]

set -euo pipefail

LOG_FILE="docs/ai-usage/log.md"

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ ERROR: $LOG_FILE not found!" >&2
  exit 1
fi

MODE="${1:---staged}"

if [ "$MODE" = "--staged" ]; then
  # Check files staged for commit
  CHANGED_FILES=$(git diff --cached --name-only || true)
elif [ "$MODE" = "--pr" ]; then
  # Check files against base branch (develop or main)
  BASE_BRANCH="${GITHUB_BASE_REF:-develop}"
  CHANGED_FILES=$(git diff --name-only "origin/$BASE_BRANCH"...HEAD 2>/dev/null || git diff --name-only HEAD~1 || true)
else
  CHANGED_FILES=$(git status --porcelain | awk '{print $2}' || true)
fi

# Check if application source code was modified
SOURCE_CHANGED=false
for file in $CHANGED_FILES; do
  if [[ "$file" =~ ^(apps|packages)/.*(\.ts|\.tsx|\.js|\.jsx|\.prisma)$ ]]; then
    SOURCE_CHANGED=true
    break
  fi
done

# If no application source code was modified, pass
if [ "$SOURCE_CHANGED" = false ]; then
  echo "✅ AI Log Check: No application source code changed. Check bypassed."
  exit 0
fi

# If source code was changed, docs/ai-usage/log.md MUST be modified
LOG_MODIFIED=false
for file in $CHANGED_FILES; do
  if [ "$file" = "$LOG_FILE" ]; then
    LOG_MODIFIED=true
    break
  fi
done

if [ "$LOG_MODIFIED" = false ]; then
  echo "======================================================================" >&2
  echo "❌ COMMIT / PR REJECTED: Hard Gate G3 (Rubric TC2.3 Level 5 Violation)" >&2
  echo "======================================================================" >&2
  echo "You have modified source code under apps/ or packages/, but" >&2
  echo "did not update or append an AI usage entry in:" >&2
  echo "  -> $LOG_FILE" >&2
  echo "" >&2
  echo "Please append a record conforming to the AI-XXXX specification" >&2
  echo "or instruct your AI assistant to run the 'ai-log-entry' skill." >&2
  echo "======================================================================" >&2
  exit 1
fi

# Verify the log file syntax contains at least one valid AI-XXXX header
LATEST_ENTRY=$(grep -E "^## AI-[0-9]{4}:" "$LOG_FILE" | tail -n 1 || true)
if [ -z "$LATEST_ENTRY" ]; then
  echo "❌ ERROR: No valid '## AI-XXXX:' entry found in $LOG_FILE" >&2
  exit 1
fi

echo "✅ AI Log Check passed: Source code changes accompanied by $LOG_FILE update ($LATEST_ENTRY)."
exit 0
