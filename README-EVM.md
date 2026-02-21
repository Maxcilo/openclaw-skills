# EVM 工具集 - 完整版

## 🎯 主地址信息
- **地址**: `0x2fEE02faD2FF69A7905767b6E5B54C610D425941`
- **用途**: 代币分发和归集
- **配置文件**: `vault/evm-wallet-main.json`

---

## 🛠️ 工具清单（共7个）

### 1. 地址生成器 (`evm-wallet-gen.js`)
生成单个或多个钱包地址

```bash
# 生成1个随机钱包
./evm-wallet-gen.js

# 生成5个并保存到 vault/
./evm-wallet-gen.js --count 5 --save

# 使用助记词生成
./evm-wallet-gen.js --mnemonic
```

---

### 2. 批量地址生成器 (`evm-batch-gen.js`) ⭐ 新增
批量生成地址并导出为多种格式

```bash
# 生成10个地址
./evm-batch-gen.js --count 10

# 导出为 CSV
./evm-batch-gen.js --count 10 --format csv --output wallets.csv

# 导出为纯地址列表
./evm-batch-gen.js --count 10 --format list --output addresses.txt

# 保存到 vault/
./evm-batch-gen.js --count 10 --save

# 同时导出和保存
./evm-batch-gen.js --count 10 --save --format csv --output wallets.csv
```

**支持的导出格式：**
- `json` - JSON 格式（包含私钥和助记词）
- `csv` - CSV 格式（Excel 可打开）
- `list` - 纯地址列表（一行一个地址）

---

### 3. 批量转账工具 (`evm-batch-transfer.js`)
从主地址批量发送 ETH 或 ERC20 代币

```bash
# 批量发送 ETH
./evm-batch-transfer.js --eth --file recipients.json --dry-run
./evm-batch-transfer.js --eth --file recipients.json

# 批量发送 ERC20 代币
./evm-batch-transfer.js --token 0xTokenAddress --file recipients.json

# 使用自定义 RPC
./evm-batch-transfer.js --eth --file recipients.json --rpc https://mainnet.base.org
```

**recipients.json 格式：**
```json
[
  { "address": "0x...", "amount": "0.1" },
  { "address": "0x...", "amount": "0.2" }
]
```

---

### 4. 归集工具 (`evm-collect.js`)
从多个地址收集资金到主地址

```bash
# 归集 ETH
./evm-collect.js --eth --file wallets.json --dry-run
./evm-collect.js --eth --file wallets.json

# 归集 ERC20 代币
./evm-collect.js --token 0xTokenAddress --file wallets.json
```

**wallets.json 格式：**
```json
[
  { "address": "0x...", "privateKey": "0x..." },
  { "address": "0x...", "privateKey": "0x..." }
]
```

---

### 5. 余额查询工具 (`evm-balance.js`)
查询 ETH 和 ERC20 代币余额

```bash
# 查询单个地址的 ETH 余额
./evm-balance.js --address 0x...

# 查询单个地址的代币余额
./evm-balance.js --address 0x... --token 0xTokenAddress

# 批量查询 ETH 余额
./evm-balance.js --file wallets.json

# 批量查询代币余额
./evm-balance.js --file wallets.json --token 0xTokenAddress
```

---

### 6. 地址信息查询 (`evm-info.js`)
查询地址的详细信息

```bash
# 查询基本信息
./evm-info.js --address 0x...

# 包含常见代币余额（USDT、USDC、DAI 等）
./evm-info.js --address 0x... --tokens
```

**查询内容：**
- ETH 余额
- 交易数（nonce）
- 地址类型（EOA/合约）
- 常见代币余额

---

### 7. 交易历史查询 (`evm-tx-history.js`) ⭐ 新增
查询地址的交易历史

```bash
# 查询最近10笔交易
./evm-tx-history.js --address 0x... --api-key YOUR_ETHERSCAN_KEY

# 查询最近20笔交易
./evm-tx-history.js --address 0x... --api-key YOUR_KEY --limit 20
```

**注意：** 需要 Etherscan API Key（免费注册：https://etherscan.io/apis）

---

## 📚 文档清单

1. **EVM工具集使用指南.md** - 详细使用指南
2. **EVM主地址配置.md** - 主地址配置说明
3. **EVM工具快速参考.md** - 快速参考卡
4. **EVM工具集完整清单.md** - 完整工具清单
5. **README-EVM.md** - 本文档（完整版）

---

## 🚀 快速开始

### 1. 测试所有工具
```bash
./test-evm-tools-full.sh
```

### 2. 查询主地址信息
```bash
./evm-info.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

### 3. 生成测试地址
```bash
# 生成5个地址并保存
./evm-batch-gen.js --count 5 --save

# 导出为 CSV（方便 Excel 查看）
./evm-batch-gen.js --count 5 --format csv --output test-wallets.csv
```

### 4. 查询余额
```bash
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

---

## 💡 实用场景

### 场景 1：批量空投代币

**步骤：**

1. **生成接收地址列表**
```bash
# 生成100个地址并导出为 CSV
./evm-batch-gen.js --count 100 --format csv --output airdrop-addresses.csv

# 或者导出为纯地址列表
./evm-batch-gen.js --count 100 --format list --output addresses.txt
```

2. **准备转账列表**
```bash
# 手动编辑 recipients.json
cat > recipients.json << EOF
[
  {"address": "0x...", "amount": "100"},
  {"address": "0x...", "amount": "100"}
]
EOF
```

3. **检查主地址余额**
```bash
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress
```

4. **模拟测试**
```bash
./evm-batch-transfer.js --token 0xTokenAddress --file recipients.json --dry-run
```

5. **执行空投**
```bash
./evm-batch-transfer.js --token 0xTokenAddress --file recipients.json
```

---

### 场景 2：多地址资金归集

**步骤：**

1. **准备钱包列表**
```bash
# 从 vault/ 目录提取钱包信息
# 或者手动创建 wallets.json
```

2. **查询所有地址余额**
```bash
./evm-balance.js --file wallets.json
./evm-balance.js --file wallets.json --token 0xTokenAddress
```

3. **模拟归集**
```bash
./evm-collect.js --eth --file wallets.json --dry-run
./evm-collect.js --token 0xTokenAddress --file wallets.json --dry-run
```

4. **执行归集**
```bash
# 先归集 ETH
./evm-collect.js --eth --file wallets.json

# 再归集代币
./evm-collect.js --token 0xTokenAddress --file wallets.json
```

---

### 场景 3：批量创建子地址并分发 Gas

**步骤：**

1. **批量生成子地址**
```bash
# 生成50个子地址并保存
./evm-batch-gen.js --count 50 --save --format json --output sub-wallets.json
```

2. **提取地址列表**
```bash
# 从 sub-wallets.json 提取地址
# 创建 recipients.json（每个地址分配 0.01 ETH 作为 gas）
```

3. **从主地址分发 Gas**
```bash
./evm-batch-transfer.js --eth --file recipients.json --dry-run
./evm-batch-transfer.js --eth --file recipients.json
```

4. **验证分发结果**
```bash
./evm-balance.js --file sub-wallets.json
```

---

## 🌐 支持的网络

所有工具都支持通过 `--rpc` 参数切换网络：

| 网络 | RPC 地址 |
|------|---------|
| Ethereum | `https://eth.llamarpc.com` |
| Base | `https://mainnet.base.org` |
| Arbitrum | `https://arb1.arbitrum.io/rpc` |
| Optimism | `https://mainnet.optimism.io` |
| Polygon | `https://polygon-rpc.com` |
| BSC | `https://bsc-dataseed.binance.org` |

**使用示例：**
```bash
# Base 网络
./evm-balance.js --address 0x... --rpc https://mainnet.base.org

# Arbitrum 网络
./evm-batch-transfer.js --eth --file recipients.json --rpc https://arb1.arbitrum.io/rpc
```

---

## ⚠️ 安全提醒

### 私钥安全
- ✅ 所有私钥存储在 `vault/` 目录（权限 700）
- ✅ 文件权限设置为 600（仅所有者可读写）
- ✅ vault/ 已在 .gitignore 中，不会被提交到 git
- ⚠️ 定期备份 vault/ 目录到安全位置
- ⚠️ 不要将私钥分享给任何人
- ⚠️ 导出的 CSV/JSON 文件也包含私钥，请妥善保管

### 测试流程
- ✅ 所有操作先使用 `--dry-run` 模拟测试
- ✅ 确认地址、金额、gas 费用无误
- ✅ 建议先小额测试（0.001 ETH 或少量代币）
- ✅ 确认成功后再大额操作

### Gas 费用
- ✅ 批量转账前确保主地址有足够的 ETH 支付 gas
- ✅ 归集代币时，每个子地址需要有 ETH 支付 gas
- ✅ 归集 ETH 时会自动扣除 gas 费用
- ⚠️ Gas 价格波动较大，建议在 gas 较低时操作

---

## 🛠️ 故障排查

### 问题 1：余额不足
```
❌ 余额不足
```
**解决方案：**
```bash
# 检查主地址余额
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 检查代币余额
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress
```

### 问题 2：Gas 费用不足
```
⚠️ ETH 不足支付 gas
```
**解决方案：**
```bash
# 向子地址转入少量 ETH（0.001-0.01 ETH）
./evm-batch-transfer.js --eth --to 0xSubAddress --amount 0.01
```

### 问题 3：RPC 连接失败
```
❌ 连接 RPC 失败
```
**解决方案：**
- 检查网络连接
- 更换 RPC 节点：`--rpc https://eth.llamarpc.com`
- 使用付费 RPC 服务（Infura、Alchemy）

### 问题 4：交易失败
```
❌ 交易失败: execution reverted
```
**解决方案：**
- 检查代币合约地址是否正确
- 检查接收地址是否有效
- 确认代币授权（approve）是否足够
- 在区块浏览器查看详细错误信息

---

## 📊 工具对比表

| 工具 | 主要功能 | 输入 | 输出 | 适用场景 |
|------|---------|------|------|---------|
| evm-wallet-gen.js | 生成地址 | 数量 | 地址+私钥 | 创建新钱包 |
| evm-batch-gen.js | 批量生成 | 数量+格式 | CSV/JSON/List | 批量创建地址 |
| evm-batch-transfer.js | 批量转账 | 接收列表 | 交易哈希 | 空投、分发 |
| evm-collect.js | 资金归集 | 钱包列表 | 交易哈希 | 收集资金 |
| evm-balance.js | 余额查询 | 地址 | 余额 | 检查余额 |
| evm-info.js | 地址信息 | 地址 | 详细信息 | 全面查询 |
| evm-tx-history.js | 交易历史 | 地址+API Key | 交易列表 | 历史查询 |

---

## 🔄 更新日志

**2026-02-21 v2.0**
- ✅ 新增批量地址生成器（支持 CSV/JSON/List 导出）
- ✅ 新增交易历史查询工具
- ✅ 完善所有工具的错误处理
- ✅ 优化文档结构
- ✅ 添加更多使用场景示例

**2026-02-21 v1.0**
- ✅ 创建基础工具集（生成、转账、归集、查询）
- ✅ 配置主地址
- ✅ 创建示例文件和文档

---

## 📞 技术支持

如有问题或建议，请联系开发者。

**相关资源：**
- [ethers.js 文档](https://docs.ethers.org/)
- [Ethereum 开发文档](https://ethereum.org/developers)
- [ERC20 标准](https://eips.ethereum.org/EIPS/eip-20)
- [Etherscan API](https://docs.etherscan.io/)

---

## 📝 许可证

本工具集仅供学习和个人使用，请遵守相关法律法规。

**免责声明：**
- 使用本工具集产生的任何损失，开发者不承担责任
- 请妥善保管私钥，不要泄露给任何人
- 建议先小额测试，确认无误后再大额操作
