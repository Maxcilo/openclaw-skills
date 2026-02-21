#!/bin/bash
# EVM 工具集备份脚本

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="evm-backup-$TIMESTAMP"

echo "💾 EVM 工具集备份"
echo "===================="
echo ""

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "✅ 创建备份目录: $BACKUP_DIR"
fi

echo "📦 开始备份..."
echo ""

# 备份 vault 目录
echo "1️⃣ 备份 vault/ 目录..."
if [ -d "vault" ]; then
    tar -czf "$BACKUP_DIR/$BACKUP_NAME-vault.tar.gz" vault/
    echo "   ✅ vault/ → $BACKUP_NAME-vault.tar.gz"
else
    echo "   ⚠️  vault/ 目录不存在"
fi

# 备份地址标签
echo "2️⃣ 备份地址标签..."
if [ -f "address-labels.json" ]; then
    cp address-labels.json "$BACKUP_DIR/$BACKUP_NAME-labels.json"
    echo "   ✅ address-labels.json → $BACKUP_NAME-labels.json"
else
    echo "   ⚠️  address-labels.json 不存在"
fi

# 备份配置文件
echo "3️⃣ 备份配置文件..."
if [ -f "sub-wallets-1-20.json" ]; then
    cp sub-wallets-1-20.json "$BACKUP_DIR/$BACKUP_NAME-wallets.json"
    echo "   ✅ sub-wallets-1-20.json → $BACKUP_NAME-wallets.json"
fi

if [ -f "addresses-only.txt" ]; then
    cp addresses-only.txt "$BACKUP_DIR/$BACKUP_NAME-addresses.txt"
    echo "   ✅ addresses-only.txt → $BACKUP_NAME-addresses.txt"
fi

# 备份 Gas 分发配置
if [ -f "gas-distribution-0.01.json" ]; then
    cp gas-distribution-0.01.json "$BACKUP_DIR/$BACKUP_NAME-gas-0.01.json"
    echo "   ✅ gas-distribution-0.01.json → $BACKUP_NAME-gas-0.01.json"
fi

if [ -f "gas-distribution-0.001.json" ]; then
    cp gas-distribution-0.001.json "$BACKUP_DIR/$BACKUP_NAME-gas-0.001.json"
    echo "   ✅ gas-distribution-0.001.json → $BACKUP_NAME-gas-0.001.json"
fi

echo ""
echo "📊 备份统计:"
echo ""

# 统计备份文件
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR/$BACKUP_NAME"* 2>/dev/null | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

echo "  - 备份文件数: $BACKUP_COUNT"
echo "  - 备份目录大小: $BACKUP_SIZE"
echo "  - 备份位置: $BACKUP_DIR/"
echo ""

# 列出备份文件
echo "📁 备份文件列表:"
echo ""
ls -lh "$BACKUP_DIR/$BACKUP_NAME"* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# 清理旧备份（保留最近10个）
echo "🧹 清理旧备份..."
BACKUP_TOTAL=$(ls -1 "$BACKUP_DIR"/evm-backup-* 2>/dev/null | wc -l)
if [ $BACKUP_TOTAL -gt 10 ]; then
    OLD_COUNT=$((BACKUP_TOTAL - 10))
    ls -1t "$BACKUP_DIR"/evm-backup-* | tail -n $OLD_COUNT | xargs rm -f
    echo "   ✅ 已删除 $OLD_COUNT 个旧备份（保留最近10个）"
else
    echo "   ✅ 备份数量: $BACKUP_TOTAL（无需清理）"
fi
echo ""

echo "✅ 备份完成！"
echo ""
echo "💡 恢复备份:"
echo "   tar -xzf $BACKUP_DIR/$BACKUP_NAME-vault.tar.gz"
echo "   cp $BACKUP_DIR/$BACKUP_NAME-labels.json address-labels.json"
echo ""
