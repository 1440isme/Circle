#!/usr/bin/env bash
# new-memory-log.sh — Tạo nhật ký memory của hôm nay từ template (nếu chưa có).
# Dùng: ./scripts/new-memory-log.sh [YYYY-MM-DD]   (mặc định: hôm nay)
# Đặt tại scripts/ của repo CIRCLE. Yêu cầu cấu trúc agentic/memory/ theo MEMORY-PROTOCOL.

set -euo pipefail

DATE="${1:-$(date +%F)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEM_DIR="$ROOT/agentic/memory"
TARGET="$MEM_DIR/$DATE.md"
TEMPLATE="$MEM_DIR/_templates/daily-log.md"

mkdir -p "$MEM_DIR/topics" "$MEM_DIR/_archive"

if [[ -f "$TARGET" ]]; then
  echo "Đã tồn tại: $TARGET"
  exit 0
fi

if [[ -f "$TEMPLATE" ]]; then
  sed "s/YYYY-MM-DD/$DATE/g" "$TEMPLATE" > "$TARGET"
else
  printf '# Memory log — %s\n' "$DATE" > "$TARGET"
fi

echo "Đã tạo: $TARGET"
