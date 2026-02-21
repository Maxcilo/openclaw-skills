# EVM 工具集 - 快速参考卡

## 🔐 主地址
```
地址: 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
用途: 代币分发和归集
```

## 📦 工具列表

### 1. 地址生成器
```bash
./evm-wallet-gen.js                    # 生成1个
./evm-wallet-gen.js --count 5 --save   # 生成5个并保存
./evm-wallet-gen.js --mnemonic         # 带助记词
```

### 2. 批量转账
```bash
# ETH
./evm-batch-transfer.js --eth --to 0x... --amount 0.1
./evm-batch-transfer.js --eth --file recipients.json --dry-run

# ERC20
./evm-batch-transfer.js --token 0x... --file recipients.json
```

### 3. 归集工具
```bash
# ETH
./evm-collect.js --eth --file wallets.json --dry-run

# ERC20
./evm-collect.js --token 0x... --file wallets.json
```

## 📝 文件格式

### recipients.json (转账接收地址)
```json
[
  { "address": "0x...", "amount": "0.1" },
  { "address": "0x...", "amount": "0.2" }
]
```

### wallets.json (归集钱包)
```json
[
  { "address": "0x...", "privateKey": "0x..." }
]
```

## ⚠️ 安全检查清单

- [ ] 先用 `--dry-run` 模拟测试
- [ ] 确认地址和金额无误
- [ ] 确保主地址有足够的 ETH（gas）
- [ ] 小额测试后再大额操作
- [ ] 定期备份 vault/ 目录

## 🌐 常用 RPC

```bash
# Ethereum
--rpc https://eth.llamarpc.com

# Base
--rpc https://mainnet.base.org

# Arbitrum
--rpc https://arb1.arbitrum.io/rpc

# Polygon
--rpc https://polygon-rpc.com
```

## 🚀 快速开始

```bash
# 1. 查看帮助
./evm-batch-transfer.js --help

# 2. 运行测试脚本
./test-evm-tools.sh

# 3. 查看示例文件
cat examples/recipients-example.json
cat examples/wallets-example.json
```

## 📚 文档

- 详细指南: `EVM工具集使用指南.md`
- 主地址配置: `EVM主地址配置.md`
