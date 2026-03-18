#!/bin/bash
# Liquidity Monitor - ClawHub发布脚本

echo "📦 准备发布 Liquidity Monitor v3.0.0 到 ClawHub..."
echo ""

# 检查登录状态
if ! clawhub whoami &>/dev/null; then
  echo "❌ 未登录 ClawHub"
  echo ""
  echo "请先登录："
  echo "  clawhub login"
  echo ""
  echo "或使用token登录："
  echo "  clawhub login --token YOUR_TOKEN --no-browser"
  echo ""
  exit 1
fi

echo "✅ 已登录 ClawHub"
echo ""

# 发布
echo "📤 发布中..."
clawhub publish . \
  --slug liquidity-monitor \
  --name "US Federal Reserve Liquidity Monitor" \
  --version 3.0.0 \
  --changelog "Initial release: Complete monitoring system with RRP, Reserves, SOFR, TGA tracking, professional charts, intelligent analysis, and Telegram integration" \
  --tags "latest,finance,monitoring,charts,macro,federal-reserve"

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 发布成功！"
  echo ""
  echo "查看: https://clawhub.com/skills/liquidity-monitor"
else
  echo ""
  echo "❌ 发布失败"
  exit 1
fi
