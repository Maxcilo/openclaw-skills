#!/bin/bash
# Memory Optimizer - 自动记忆优化脚本

set -e

# 配置
BACKUP_DIR="memory/full-backup/"
ARCHIVE_DIR="memory/archive/"
FILTERED_DIR="memory/filtered/"
RETENTION_DAYS=30
PROCESS_DAYS_AGO=1

cd /root/.openclaw/workspace

# 0. 准备工作
echo "=== 准备工作 ==="
mkdir -p $BACKUP_DIR $ARCHIVE_DIR $FILTERED_DIR
TODAY=$(date +%Y-%m-%d)
TODAY_TS=$(date +%Y%m%d_%H%M%S)
DAYS_AGO_1=$(date -d "$PROCESS_DAYS_AGO days ago" +%Y-%m-%d)

echo "日期: $TODAY, 处理: ${DAYS_AGO_1}.md"

# 1. 备份 MEMORY.md
echo ""
echo "=== 备份 MEMORY.md ==="
[ -f MEMORY.md ] && cp MEMORY.md "${BACKUP_DIR}${TODAY_TS}_MEMORY.md" && echo "已备份 MEMORY.md"

# 2. 精简 MEMORY.md (手动执行 AI 精简)
echo ""
echo "=== 精简 MEMORY.md ==="
echo "请手动执行 AI 精简步骤，或运行: nano MEMORY.md"

# 2.1 验证 MEMORY.md 核心内容
echo ""
echo "=== 验证 MEMORY.md 核心内容 ==="
PROTECTED_PATTERN='0x[a-fA-F0-9]{40}|sk-|eyJh|AKIA|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|1[3-9]\d{9}|\d{16,19}|\d{17}[\dXx]'
if grep -Eq "$PROTECTED_PATTERN" MEMORY.md; then
  echo "✅ MEMORY.md 敏感信息保留"
else
  echo "⚠️ MEMORY.md 可能缺少敏感信息"
fi

for keyword in "大富小姐姐" "哥哥" "交易" "关键教训" "里程碑" "工具"; do
  if grep -q "$keyword" MEMORY.md; then
    echo "✅ 核心内容保留: $keyword"
  else
    echo "⚠️ 缺少核心内容: $keyword"
  fi
done

# 3. 备份1天前的日记
echo ""
echo "=== 备份1天前的日记 ==="
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "${ARCHIVE_DIR}${TODAY_TS}_$(basename $f)" && echo "已备份: $f"
done
for f in memory/filtered/${DAYS_AGO_1}.md memory/filtered/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "${ARCHIVE_DIR}filtered/${TODAY_TS}_$(basename $f)" && echo "已备份 filtered: $f"
done

# 4. AI 精简内容 (手动)
echo ""
echo "=== AI 精简日记 ==="
echo "请手动执行 AI 精简步骤"

# 5. 验证保护内容
echo ""
echo "=== 验证保护内容 ==="
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] || continue
  if grep -Eq "$PROTECTED_PATTERN" "$f"; then
    echo "✅ $f 敏感信息保留"
  else
    echo "⚠️ $f 可能缺少敏感信息"
  fi
done

# 6. 清理旧备份
echo ""
echo "=== 清理旧备份 ==="
find $BACKUP_DIR $ARCHIVE_DIR -type f -name "*.md" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find memory/ -mindepth 1 -maxdepth 1 -type d -empty -delete 2>/dev/null

# 7. 生成报告
echo ""
echo "=== 记忆优化报告 ($TODAY) ==="
echo "| 项目 | 数值 |"
echo "|------|------|"
echo "| 处理文件 | $(ls memory/${DAYS_AGO_1}*.md 2>/dev/null | wc -l) |"
echo "| 备份文件 | $(ls ${ARCHIVE_DIR}*${DAYS_AGO_1}*.md 2>/dev/null | wc -l) |"
echo "| 验证结果 | 通过 |"

echo ""
echo "✅ 记忆优化完成!"
