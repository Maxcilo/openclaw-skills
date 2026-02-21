#!/bin/bash
# EVM 工具集完整测试脚本

echo "🔐 EVM 工具集完整测试"
echo "===================="
echo ""

# 主地址
MAIN_ADDRESS="0x2fEE02faD2FF69A7905767b6E5B54C610D425941"

# 1. 测试地址生成器
echo "1️⃣ 测试地址生成器..."
echo "生成1个随机钱包："
./evm-wallet-gen.js
echo ""

# 2. 测试地址信息查询
echo "2️⃣ 测试地址信息查询..."
echo "查询主地址信息："
./evm-info.js --address $MAIN_ADDRESS
echo ""

# 3. 测试余额查询
echo "3️⃣ 测试余额查询..."
echo "查询主地址 ETH 余额："
./evm-balance.js --address $MAIN_ADDRESS
echo ""

# 4. 测试批量转账（模拟模式）
echo "4️⃣ 测试批量转账（模拟模式）..."
echo "使用示例文件进行模拟转账："
./evm-batch-transfer.js --eth --file examples/recipients-example.json --dry-run
echo ""

# 5. 测试归集工具（模拟模式）
echo "5️⃣ 测试归集工具（模拟模式）..."
echo "使用示例文件进行模拟归集："
./evm-collect.js --eth --file examples/wallets-example.json --dry-run
echo ""

echo "✅ 所有测试完成！"
echo ""
echo "📝 提示："
echo "  - 以上都是模拟测试，不会实际发送交易"
echo "  - 主地址当前余额为 0，需要充值后才能使用"
echo "  - 实际使用时请准备真实的地址和私钥"
echo "  - 记得先用 --dry-run 测试，确认无误后再实际执行"
echo ""
echo "📚 查看文档："
echo "  - 详细指南: cat EVM工具集使用指南.md"
echo "  - 快速参考: cat EVM工具快速参考.md"
echo "  - 完整清单: cat EVM工具集完整清单.md"
