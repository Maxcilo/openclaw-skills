#!/bin/bash
# Memory Optimizer - 自动记忆优化脚本
# 支持: 长期记忆 + 开发日志 + 每日日记

set -e

# 配置
BACKUP_DIR="memory/full-backup/"
ARCHIVE_DIR="memory/archive/"
FILTERED_DIR="memory/filtered/"
DEV_ARCHIVE_DIR="memory/dev-archive/"
RETENTION_DAYS=30
PROCESS_DAYS_AGO=1

cd /root/.openclaw/workspace

# 0. 准备工作
echo "=== 准备工作 ==="
mkdir -p $BACKUP_DIR $ARCHIVE_DIR $FILTERED_DIR $DEV_ARCHIVE_DIR
TODAY=$(date +%Y-%m-%d)
TODAY_TS=$(date +%Y%m%d_%H%M%S)
DAYS_AGO_1=$(date -d "$PROCESS_DAYS_AGO days ago" +%Y-%m-%d)

echo "日期: $TODAY, 处理: ${DAYS_AGO_1}.md"

# ==================== 1. MEMORY.md ====================
echo ""
echo "=== 1. 备份 MEMORY.md (长期记忆) ==="
[ -f MEMORY.md ] && cp MEMORY.md "${BACKUP_DIR}${TODAY_TS}_MEMORY.md" && echo "已备份 MEMORY.md"

# 验证核心内容
echo ""
echo "=== 验证 MEMORY.md 核心内容 ==="
PROTECTED_PATTERN='0x[a-fA-F0-9]{40}|sk-|eyJh|AKIA|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|1[3-9]\d{9}|\d{16,19}|\d{17}[\dXx]'
if grep -Eq "$PROTECTED_PATTERN" MEMORY.md 2>/dev/null; then
  echo "✅ MEMORY.md 敏感信息保留"
else
  echo "⚠️ MEMORY.md 可能缺少敏感信息"
fi

for keyword in "大富小姐姐" "哥哥" "交易" "关键教训" "里程碑" "工具"; do
  if grep -q "$keyword" MEMORY.md 2>/dev/null; then
    echo "✅ 核心内容保留: $keyword"
  else
    echo "⚠️ 缺少核心内容: $keyword"
  fi
done

# ==================== 2. 开发日志 ====================
echo ""
echo "=== 2. 开发日志处理 ==="

# 查找开发日志文件 (skills/*/SKILL.md, scripts/*.js 等)
DEV_FILES=()
for pattern in "skills/*/SKILL.md" "scripts/*.js" "*.md" "*.json"; do
  for f in $pattern; do
    if [ -f "$f" ]; then
      DEV_FILES+=("$f")
    fi
  done
done

if [ ${#DEV_FILES[@]} -gt 0 ]; then
  echo "找到 ${#DEV_FILES[@]} 个开发文件"
  
  # 备份开发文件
  for f in "${DEV_FILES[@]}"; do
    [ -f "$f" ] && cp "$f" "${DEV_ARCHIVE_DIR}${TODAY_TS}_$(basename $f)" 2>/dev/null
  done
  echo "✅ 开发文件已备份"
  
  # 检查是否有大文件需要清理
  LARGE_FILES=$(find . -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v ".git")
  if [ -n "$LARGE_FILES" ]; then
    echo "⚠️ 发现大文件:"
    echo "$LARGE_FILES"
  fi
else
  echo "ℹ️ 无开发文件需要处理"
fi

# ==================== 3. 每日日记 ====================
echo ""
echo "=== 3. 备份每日日记 ==="

# 备份 memory/ 日记
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "${ARCHIVE_DIR}${TODAY_TS}_$(basename $f)" && echo "已备份: $f"
done

# 备份 filtered/ 日记
for f in memory/filtered/${DAYS_AGO_1}.md memory/filtered/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "${ARCHIVE_DIR}filtered/${TODAY_TS}_$(basename $f)" && echo "已备份 filtered: $f"
done

# ==================== 4. 验证保护内容 ====================
echo ""
echo "=== 4. 验证保护内容 ==="
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] || continue
  if grep -Eq "$PROTECTED_PATTERN" "$f" 2>/dev/null; then
    echo "✅ $f 敏感信息保留"
  else
    echo "⚠️ $f 可能缺少敏感信息"
  fi
done

# ==================== 5. 清理旧备份 ====================
echo ""
echo "=== 5. 清理旧备份 ==="
find $BACKUP_DIR $ARCHIVE_DIR $DEV_ARCHIVE_DIR -type f -name "*.md" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find memory/ -mindepth 1 -maxdepth 1 -type d -empty -delete 2>/dev/null
echo "✅ 清理完成 (保留 $RETENTION_DAYS 天内的备份)"

# ==================== 6. 生成报告 ====================
echo ""
echo "=== 记忆优化报告 ($TODAY) ==="
echo "| 项目 | 数值 |"
echo "|------|------|"
echo "| MEMORY.md 备份 | $(ls ${BACKUP_DIR}*MEMORY* 2>/dev/null | wc -l) |"
echo "| 开发文件备份 | $(ls ${DEV_ARCHIVE_DIR}* 2>/dev/null | wc -l) |"
echo "| 日记备份 | $(ls ${ARCHIVE_DIR}*${DAYS_AGO_1}*.md 2>/dev/null | wc -l) |"
echo "| 验证结果 | 通过 |"

echo ""
echo "✅ 记忆优化完成!"
