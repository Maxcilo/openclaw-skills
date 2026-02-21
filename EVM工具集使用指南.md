# EVM 工具集使用指南

## 工具概览

### 1. 地址生成器 (`evm-wallet-gen.js`)
生成 EVM 兼容的钱包地址

**功能：**
- 生成随机钱包（带助记词）
- 从助记词派生多个地址
- 自动保存到 vault/

**使用示例：**
```bash
# 生成1个随机钱包
./evm-wallet-gen.js

# 生成5个随机钱包并保存
./evm-wallet-gen.js --count 5 --save

# 生成带助记词的钱包
./evm-wallet-gen.js --mnemonic

# 从助记词派生3个地址
./evm-wallet-gen.js --mnemonic "your mnemonic phrase" --count 3
```

---

### 2. 批量转账工具 (`evm-batch-transfer.js`)
从主地址向多个地址批量发送 ETH 或 ERC20 代币

**功能：**
- 批量发送 ETH
- 批量发送 ERC20 代币
- 模拟模式（dry-run）
- 自动计算 gas 费用

**使用示例：**

#### 发送 ETH
```bash
# 单个转账
./evm-batch-transfer.js --eth --to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb --amount 0.1

# 批量转账
./evm-batch-transfer.js --eth --file recipients.json

# 模拟测试（不实际发送）
./evm-batch-transfer.js --eth --file recipients.json --dry-run
```

#### 发送 ERC20 代币
```bash
# 单个转账
./evm-batch-transfer.js --token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --to 0x... --amount 100

# 批量转账
./evm-batch-transfer.js --token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --file recipients.json

# 使用自定义 RPC
./evm-batch-transfer.js --token 0x... --file recipients.json --rpc https://mainnet.infura.io/v3/YOUR_KEY
```

**recipients.json 格式：**
```json
[
  { "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "amount": "0.1" },
  { "address": "0x1234567890123456789012345678901234567890", "amount": "0.2" },
  { "address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", "amount": "0.15" }
]
```

---

### 3. 归集工具 (`evm-collect.js`)
从多个地址收集 ETH 或 ERC20 代币到主地址

**功能：**
- 归集 ETH（自动扣除 gas）
- 归集 ERC20 代币
- 自动检查余额和 gas 费用
- 跳过余额不足的地址

**使用示例：**

#### 归集 ETH
```bash
# 归集所有子地址的 ETH
./evm-collect.js --eth --file wallets.json

# 模拟测试
./evm-collect.js --eth --file wallets.json --dry-run
```

#### 归集 ERC20 代币
```bash
# 归集所有子地址的代币
./evm-collect.js --token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --file wallets.json

# 使用自定义 RPC
./evm-collect.js --token 0x... --file wallets.json --rpc https://mainnet.infura.io/v3/YOUR_KEY
```

**wallets.json 格式：**
```json
[
  {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "privateKey": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  },
  {
    "address": "0x1234567890123456789012345678901234567890",
    "privateKey": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  }
]
```

---

## 主地址配置

**主地址：** `0x2fEE02faD2FF69A7905767b6E5B54C610D425941`

**用途：**
- 代币分发中心
- 资金归集目标
- 统一资金管理

**存储位置：** `vault/evm-wallet-main.json`

---

## 常见使用场景

### 场景 1：空投代币分发
```bash
# 1. 准备接收地址列表 recipients.json
# 2. 确保主地址有足够的代币和 ETH（支付 gas）
# 3. 先模拟测试
./evm-batch-transfer.js --token 0x... --file recipients.json --dry-run

# 4. 确认无误后实际发送
./evm-batch-transfer.js --token 0x... --file recipients.json
```

### 场景 2：多地址资金归集
```bash
# 1. 准备钱包列表 wallets.json（包含私钥）
# 2. 先模拟测试
./evm-collect.js --eth --file wallets.json --dry-run

# 3. 确认无误后实际归集
./evm-collect.js --eth --file wallets.json
```

### 场景 3：批量创建子地址
```bash
# 1. 生成10个子地址并保存
./evm-wallet-gen.js --count 10 --save

# 2. 从 vault/ 目录提取地址列表
# 3. 从主地址向子地址分发 ETH（用于支付 gas）
./evm-batch-transfer.js --eth --file sub-addresses.json
```

---

## 安全提醒

⚠️ **重要安全事项：**

1. **私钥安全**
   - 所有私钥存储在 `vault/` 目录（权限 700）
   - 文件权限设置为 600（仅所有者可读写）
   - vault/ 已在 .gitignore 中，不会被提交到 git
   - 定期备份 vault/ 目录到安全位置

2. **测试流程**
   - 所有操作先使用 `--dry-run` 模拟测试
   - 确认地址、金额、gas 费用无误
   - 建议先小额测试，确认成功后再大额操作

3. **Gas 费用**
   - 批量转账前确保主地址有足够的 ETH 支付 gas
   - 归集代币时，每个子地址需要有 ETH 支付 gas
   - 归集 ETH 时会自动扣除 gas 费用

4. **RPC 节点**
   - 默认使用公共 RPC：https://eth.llamarpc.com
   - 建议使用自己的 RPC 节点（Infura、Alchemy 等）
   - 使用 `--rpc` 参数指定自定义节点

5. **交易确认**
   - 所有交易都会等待链上确认
   - 失败的交易会记录错误信息
   - 可以通过交易哈希在区块浏览器查看详情

---

## 故障排查

### 问题 1：余额不足
```
❌ 余额不足
```
**解决方案：**
- 检查主地址 ETH 余额（用于支付 gas）
- 检查主地址代币余额（用于转账）
- 使用区块浏览器确认余额

### 问题 2：Gas 费用过高
```
⚠️ ETH 不足支付 gas
```
**解决方案：**
- 向子地址转入少量 ETH（用于支付 gas）
- 或者先归集 ETH，再归集代币

### 问题 3：RPC 连接失败
```
❌ 连接 RPC 失败
```
**解决方案：**
- 检查网络连接
- 更换 RPC 节点：`--rpc https://eth.llamarpc.com`
- 使用付费 RPC 服务（更稳定）

### 问题 4：交易失败
```
❌ 交易失败: execution reverted
```
**解决方案：**
- 检查代币合约地址是否正确
- 检查接收地址是否有效
- 确认代币授权（approve）是否足够
- 查看区块浏览器的详细错误信息

---

## 高级用法

### 使用不同网络

#### Base 网络
```bash
./evm-batch-transfer.js --eth --file recipients.json --rpc https://mainnet.base.org
```

#### Arbitrum 网络
```bash
./evm-batch-transfer.js --eth --file recipients.json --rpc https://arb1.arbitrum.io/rpc
```

#### Polygon 网络
```bash
./evm-batch-transfer.js --eth --file recipients.json --rpc https://polygon-rpc.com
```

### 批量操作脚本示例

创建 `batch-airdrop.sh`：
```bash
#!/bin/bash
# 批量空投脚本

TOKEN_ADDRESS="0xYourTokenAddress"
RECIPIENTS_FILE="recipients.json"

echo "开始空投..."

# 1. 模拟测试
./evm-batch-transfer.js --token $TOKEN_ADDRESS --file $RECIPIENTS_FILE --dry-run

# 2. 确认后执行
read -p "确认执行？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    ./evm-batch-transfer.js --token $TOKEN_ADDRESS --file $RECIPIENTS_FILE
    echo "空投完成！"
fi
```

---

## 更新日志

**2026-02-21**
- ✅ 创建 EVM 地址生成器
- ✅ 创建批量转账工具
- ✅ 创建归集工具
- ✅ 配置主地址
- ✅ 完善文档

---

## 技术支持

如有问题或建议，请联系开发者。

**相关文档：**
- [EVM主地址配置.md](./EVM主地址配置.md)
- [ethers.js 文档](https://docs.ethers.org/)
