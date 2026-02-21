#!/bin/bash
# EVM 工具快速测试脚本

echo "🔐 EVM 工具集快速测试"
echo "===================="
echo ""

# 1. 测试地址生成器
echo "1️⃣ 测试地址生成器..."
./evm-wallet-gen.js
echo ""

# 2. 测试批量转账（模拟模式）
echo "2️⃣ 测试批量转账（模拟模式）..."
./evm-batch-transfer.js --eth --file examples/recipients-example.json --dry-run
echo ""

# 3. 测试归集工具（模拟模式）
echo "3️⃣ 测试归集工具（模拟模式）..."
./evm-collect.js --eth --file examples/wallets-example.json --dry-run
echo ""

echo "✅ 测试完成！"
echo ""
echo "📝 提示："
echo "  - 以上都是模拟测试，不会实际发送交易"
echo "  - 实际使用时请准备真实的地址和私钥"
echo "  - 记得先用 --dry-run 测试，确认无误后再实际执行"
