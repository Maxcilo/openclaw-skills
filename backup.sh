#!/bin/bash
# 快速备份脚本

WORKSPACE="/root/.openclaw/workspace"
BACKUP_DIR="$WORKSPACE/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.tar.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 打包重要文件
cd "$WORKSPACE"
tar -czf "$BACKUP_FILE" \
  --exclude='backups' \
  --exclude='node_modules' \
  --exclude='*.log' \
  *.md \
  *.json \
  *.js \
  memory/ 2>/dev/null

# 显示结果
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ 备份成功！"
    echo "📦 文件: $BACKUP_FILE"
    echo "📊 大小: $SIZE"
    echo ""
    echo "最近的备份："
    ls -lht "$BACKUP_DIR" | head -6
else
    echo "❌ 备份失败"
    exit 1
fi
