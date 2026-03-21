#!/bin/bash
# EVM 工具集一键安装和初始化脚本

echo "🔐 EVM 工具集初始化"
echo "===================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 检查 ethers.js
if ! node -e "require('ethers')" 2>/dev/null; then
    echo "⚠️  未找到 ethers.js，正在安装..."
    npm install ethers
    echo ""
fi

echo "✅ ethers.js 已安装"
echo ""

# 设置权限
echo "📝 设置工具权限..."
chmod +x evm*.js evm*.sh 2>/dev/null
echo "✅ 权限设置完成"
echo ""

# 创建 vault 目录
if [ ! -d "vault" ]; then
    echo "📁 创建 vault 目录..."
    mkdir -p vault
    chmod 700 vault
    echo "✅ vault 目录已创建（权限 700）"
else
    echo "✅ vault 目录已存在"
fi
echo ""

# 检查主地址
if [ -f "vault/evm-wallet-main.json" ]; then
    echo "✅ 主地址已配置"
    MAIN_ADDRESS=$(cat vault/evm-wallet-main.json | grep -o '"address":"[^"]*"' | cut -d'"' -f4)
    echo "   地址: $MAIN_ADDRESS"
else
    echo "⚠️  主地址未配置"
    echo "   请运行: ./evm-wallet-gen.js --save"
fi
echo ""

# 检查子地址
SUB_WALLETS_COUNT=$(ls vault/batch-*.json 2>/dev/null | wc -l)
if [ $SUB_WALLETS_COUNT -gt 0 ]; then
    echo "✅ 子地址已生成: $SUB_WALLETS_COUNT 个"
else
    echo "⚠️  子地址未生成"
    echo "   请运行: ./evm-batch-gen.js --count 20 --save"
fi
echo ""

# 检查地址标签
if [ -f "address-labels.json" ]; then
    LABELS_COUNT=$(cat address-labels.json | grep -o '"address"' | wc -l)
    echo "✅ 地址标签已添加: $LABELS_COUNT 个"
else
    echo "⚠️  地址标签未添加"
    echo "   请运行: ./evm-labels.js add --address 0x... --label \"标签\""
fi
echo ""

# 显示可用工具
echo "📦 可用工具:"
echo ""
echo "  基础工具:"
echo "    ./evm.js                    - 统一管理器"
echo "    ./evm-manager.sh            - 交互式管理"
echo "    ./evm-wallet-gen.js         - 地址生成器"
echo "    ./evm-batch-gen.js          - 批量生成器"
echo ""
echo "  查询工具:"
echo "    ./evm-balance.js            - 余额查询"
echo "    ./evm-batch-query.js        - 批量查询"
echo "    ./evm-info.js               - 地址信息"
echo "    ./evm-tx-history.js         - 交易历史"
echo ""
echo "  转账工具:"
echo "    ./evm-batch-transfer.js     - 批量转账"
echo "    ./evm-collect.js            - 资金归集"
echo ""
echo "  管理工具:"
echo "    ./evm-labels.js             - 标签管理"
echo "    ./evm-validate.js           - 地址验证"
echo "    ./evm-extract-addresses.js  - 地址提取"
echo ""

# 显示快速开始
echo "🚀 快速开始:"
echo ""
echo "  1. 交互式管理（推荐）:"
echo "     ./evm-manager.sh"
echo ""
echo "  2. 查询主地址余额:"
echo "     ./evm.js balance --address $MAIN_ADDRESS"
echo ""
echo "  3. 查看地址标签:"
echo "     ./evm-labels.js list"
echo ""
echo "  4. 查看完整文档:"
echo "     cat EVM工具集-完整版-v3.0.md"
echo ""

# 显示安全提醒
echo "⚠️  安全提醒:"
echo "  - 所有私钥保存在 vault/ 目录（权限 600）"
echo "  - 请定期备份 vault/ 目录"
echo "  - 不要将私钥分享给任何人"
echo ""

echo "✅ 初始化完成！"
