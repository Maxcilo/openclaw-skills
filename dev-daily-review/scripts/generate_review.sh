#!/bin/bash
# Dev Daily Review - 生成每日开发复盘
set -euo pipefail

# 配置
BASE="${OPENCLAW_WORKSPACE:-/root/.openclaw/workspace}"
TODAY=$(date +%F)
DEV_DIR="$BASE/memory/dev"
DEV_LOG="$DEV_DIR/dev-$TODAY.md"
ISSUES="$DEV_DIR/issues.md"
TECH_DEBT="$DEV_DIR/tech-debt.md"
IMPROVEMENTS="$DEV_DIR/improvements.md"

# 日志函数
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}

# 错误处理函数
error_exit() {
  log "Error: $1"
  exit 1
}

# 1. 验证目录存在
if [ ! -d "$BASE" ]; then
  error_exit "Workspace directory not found: $BASE"
fi

if [ ! -d "$DEV_DIR" ]; then
  log "Warning: Dev directory not found, creating: $DEV_DIR"
  mkdir -p "$DEV_DIR" || error_exit "Failed to create dev directory"
fi

# 2. 输出信息
echo "Dev Daily Review Sources"
echo "========================"
echo "Dev log    : ${DEV_LOG:-N/A}"
echo "Issues     : ${ISSUES:-N/A}"
echo "Tech debt  : ${TECH_DEBT:-N/A}"
echo "Improvements: ${IMPROVEMENTS:-N/A}"
echo

# 3. 今日开发日志
echo "--- today's dev log ---"
if [ -n "${DEV_LOG:-}" ] && [ -f "$DEV_LOG" ]; then
  cat "$DEV_LOG" || log "Warning: Failed to read dev log"
  echo
else
  echo "No dev log for today."
  echo
fi

# 4. 待处理问题
echo "--- open issues ---"
if [ -n "${ISSUES:-}" ] && [ -f "$ISSUES" ]; then
  grep "⏳ 待处理" "$ISSUES" 2>/dev/null || echo "No open issues."
else
  echo "Issues file not found."
fi
echo

# 5. 技术债务
echo "--- tech debt summary ---"
if [ -n "${TECH_DEBT:-}" ] && [ -f "$TECH_DEBT" ]; then
  grep "^### #" "$TECH_DEBT" 2>/dev/null | head -5 || echo "No tech debt."
else
  echo "Tech debt file not found."
fi
echo

# 6. Git状态
echo "--- git status ---"
if [ -d "$BASE/.git" ]; then
  cd "$BASE" || error_exit "Failed to change to workspace directory"
  
  modified=$(git status --short 2>/dev/null | grep '^ M' | wc -l)
  untracked=$(git status --short 2>/dev/null | grep '^??' | wc -l)
  echo "Modified: $modified files, Untracked: $untracked files"
  
  if [ "$modified" -gt 0 ]; then
    echo "Recent changes:"
    git status --short 2>/dev/null | grep '^ M' | head -5
  fi
else
  echo "Not a git repository."
fi

log "Dev daily review completed"
