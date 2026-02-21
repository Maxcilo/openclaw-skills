# EVM 工具集完整清单

## 📦 已创建的工具

### 1. 地址生成器 (`evm-wallet-gen.js`)
生成 EVM 兼容的钱包地址

**功能：**
- ✅ 生成随机钱包（带助记词）
- ✅ 从助记词派生多个地址
- ✅ 自动保存到 vault/（权限 600）

**使用示例：**
```bash
./evm-wallet-gen.js                    # 生成1个
./evm-wallet-gen.js --count 5 --save   # 生成5个并保存
./evm-wallet-gen.js --mnemonic         # 带助记词
```

---

### 2. 批量转账工具 (`evm-batch-transfer.js`)
从主地址向多个地址批量发送 ETH 或 ERC20 代币

**功能：**
- ✅ 批量发送 ETH
- ✅ 批量发送 ERC20 代币
- ✅ 模拟模式（--dry-run）
- ✅ 自动计算 gas 费用
- ✅ 交易失败重试机制

**使用示例：**
```bash
# ETH 转账
./evm-batch-transfer.js --eth --file recipients.json --dry-run
./evm-batch-transfer.js --eth --file recipients.json

# ERC20 转账
./evm-batch-transfer.js --token 0x... --file recipients.json
```

---

### 3. 归集工具 (`evm-collect.js`)
从多个地址收集 ETH 或 ERC20 代币到主地址

**功能：**
- ✅ 归集 ETH（自动扣除 gas）
- ✅ 归集 ERC20 代币
- ✅ 自动检查余额和 gas 费用
- ✅ 跳过余额不足的地址
- ✅ 详细的执行报告

**使用示例：**
```bash
# 归集 ETH
./evm-collect.js --eth --file wallets.json --dry-run
./evm-collect.js --eth --file wallets.json

# 归集代币
./evm-collect.js --token 0x... --file wallets.json
```

---

### 4. 余额查询工具 (`evm-balance.js`)
查询地址的 ETH 和 ERC20 代币余额

**功能：**
- ✅ 查询单个地址余额
- ✅ 批量查询多个地址
- ✅ 支持 ETH 和 ERC20 代币
- ✅ 自动汇总统计

**使用示例：**
```bash
# 查询 ETH 余额
./evm-balance.js --address 0x...

# 查询代币余额
./evm-balance.js --address 0x... --token 0x...

# 批量查询
./evm-balance.js --file wallets.json
./evm-balance.js --file wallets.json --token 0x...
```

---

### 5. 地址信息查询工具 (`evm-info.js`)
查询地址的详细信息

**功能：**
- ✅ ETH 余额
- ✅ 交易数（nonce）
- ✅ 地址类型（EOA/合约）
- ✅ 常见代币余额（USDT、USDC、DAI 等）

**使用示例：**
```bash
# 基本信息
./evm-info.js --address 0x...

# 包含代币余额
./evm-info.js --address 0x... --tokens
```

---

## 📁 配置文件

### 主地址配置
- **文件**: `vault/evm-wallet-main.json`
- **地址**: `0x2fEE02faD2FF69A7905767b6E5B54C610D425941`
- **权限**: 600（仅所有者可读写）
- **用途**: 代币分发和归集

### 示例文件
- `examples/recipients-example.json` - 转账接收地址示例
- `examples/wallets-example.json` - 归集钱包示例

---

## 📚 文档

1. **EVM工具集使用指南.md** - 详细使用指南
2. **EVM主地址配置.md** - 主地址配置说明
3. **EVM工具快速参考.md** - 快速参考卡
4. **EVM工具集完整清单.md** - 本文档

---

## 🚀 快速开始

### 1. 测试工具
```bash
# 运行测试脚本
./test-evm-tools.sh
```

### 2. 查看主地址信息
```bash
./evm-info.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

### 3. 生成测试地址
```bash
./evm-wallet-gen.js --count 3 --save
```

### 4. 查询余额
```bash
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

---

## 🔧 常见使用场景

### 场景 1：空投代币分发
```bash
# 1. 准备接收地址列表
cat > recipients.json << EOF
[
  {"address": "0x...", "amount": "100"},
  {"address": "0x...", "amount": "200"}
]
EOF

# 2. 查询主地址代币余额
./evm-balance.js --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress

# 3. 模拟测试
./evm-batch-transfer.js --token 0xTokenAddress --file recipients.json --dry-run

# 4. 确认无误后执行
./evm-batch-transfer.js --token 0xTokenAddress --file recipients.json
```

### 场景 2：多地址资金归集
```bash
# 1. 准备钱包列表
cat > wallets.json << EOF
[
  {"address": "0x...", "privateKey": "0x..."}
]
EOF

# 2. 查询所有地址余额
./evm-balance.js --file wallets.json

# 3. 模拟归集
./evm-collect.js --eth --file wallets.json --dry-run

# 4. 执行归集
./evm-collect.js --eth --file wallets.json
```

### 场景 3：批量创建子地址
```bash
# 1. 生成10个子地址
./evm-wallet-gen.js --count 10 --save

# 2. 提取地址列表（从 vault/ 目录）
# 3. 从主地址分发 ETH（用于 gas）
./evm-batch-transfer.js --eth --file sub-addresses.json
```

---

## 🌐 支持的网络

所有工具都支持通过 `--rpc` 参数指定不同的网络：

### Ethereum 主网
```bash
--rpc https://eth.llamarpc.com
```

### Base 网络
```bash
--rpc https://mainnet.base.org
```

### Arbitrum 网络
```bash
--rpc https://arb1.arbitrum.io/rpc
```

### Polygon 网络
```bash
--rpc https://polygon-rpc.com
```

### Optimism 网络
```bash
--rpc https://mainnet.optimism.io
```

---

## ⚠️ 安全提醒

### 私钥安全
- ✅ 所有私钥存储在 `vault/` 目录（权限 700）
- ✅ 文件权限设置为 600（仅所有者可读写）
- ✅ vault/ 已在 .gitignore 中
- ⚠️ 定期备份 vault/ 目录到安全位置
- ⚠️ 不要将私钥分享给任何人

### 测试流程
- ✅ 所有操作先使用 `--dry-run` 模拟测试
- ✅ 确认地址、金额、gas 费用无误
- ✅ 建议先小额测试
- ✅ 确认成功后再大额操作

### Gas 费用
- ✅ 批量转账前确保主地址有足够的 ETH
- ✅ 归集代币时，每个子地址需要有 ETH 支付 gas
- ✅ 归集 ETH 时会自动扣除 gas 费用

---

## 🛠️ 故障排查

### 问题 1：余额不足
```
❌ 余额不足
```
**解决方案：**
- 使用 `./evm-balance.js` 检查余额
- 确保主地址有足够的 ETH 和代币

### 问题 2：Gas 费用过高
```
⚠️ ETH 不足支付 gas
```
**解决方案：**
- 向子地址转入少量 ETH
- 或者先归集 ETH，再归集代币

### 问题 3：RPC 连接失败
```
❌ 连接 RPC 失败
```
**解决方案：**
- 检查网络连接
- 更换 RPC 节点
- 使用付费 RPC 服务（更稳定）

### 问题 4：交易失败
```
❌ 交易失败: execution reverted
```
**解决方案：**
- 检查代币合约地址
- 检查接收地址是否有效
- 确认代币授权（approve）
- 查看区块浏览器的详细错误

---

## 📊 工具对比

| 工具 | 主要功能 | 适用场景 |
|------|---------|---------|
| evm-wallet-gen.js | 生成地址 | 创建新钱包 |
| evm-batch-transfer.js | 批量转账 | 空投、分发 |
| evm-collect.js | 资金归集 | 收集资金 |
| evm-balance.js | 余额查询 | 检查余额 |
| evm-info.js | 地址信息 | 详细查询 |

---

## 🔄 更新日志

**2026-02-21**
- ✅ 创建 EVM 地址生成器
- ✅ 创建批量转账工具
- ✅ 创建归集工具
- ✅ 创建余额查询工具
- ✅ 创建地址信息查询工具
- ✅ 配置主地址
- ✅ 完善文档和示例

---

## 📞 技术支持

如有问题或建议，请联系开发者。

**相关资源：**
- [ethers.js 文档](https://docs.ethers.org/)
- [Ethereum 开发文档](https://ethereum.org/developers)
- [ERC20 标准](https://eips.ethereum.org/EIPS/eip-20)
