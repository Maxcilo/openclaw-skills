# EVM 地址管理完整指南

## 📋 地址体系

### 地址编号规则
- **0号地址**: 主地址（用于代币分发和归集）
- **1-20号地址**: 子地址（用于分散持有或测试）

### 主地址信息
```
编号: 0
地址: 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
私钥: 0x3e28bc642f1ac02e575581a9957e6f769c37cf671c934c039c20181bcf68c016
用途: 代币分发和归集中心
```

---

## 📁 文件清单

### 地址清单文件
1. **vault/地址清单-0-20-完整版.md** - 完整清单（含私钥和助记词）
2. **vault/地址清单-0-20.csv** - CSV 格式（Excel 可打开）
3. **地址清单-0-20.md** - 简化版清单（仅地址）

### 钱包文件
1. **vault/evm-wallet-main.json** - 主地址配置
2. **vault/batch-2026-02-21T08-46-15-{1-20}.json** - 单个子地址文件
3. **vault/batch-2026-02-21T08-46-15-summary.json** - 子地址汇总
4. **sub-wallets-1-20.json** - 子地址导出文件

### Gas 分发配置
1. **gas-distribution-0.01.json** - 每个地址 0.01 ETH
2. **gas-distribution-0.001.json** - 每个地址 0.001 ETH

---

## 🚀 常用操作

### 1. 查询余额

#### 查询主地址余额
```bash
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

#### 批量查询所有子地址余额
```bash
./evm.js balance --file sub-wallets-1-20.json
```

#### 查询特定代币余额
```bash
# 查询主地址的 USDT 余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xdAC17F958D2ee523a2206206994597C13D831ec7

# 批量查询子地址的代币余额
./evm.js balance --file sub-wallets-1-20.json --token 0xTokenAddress
```

---

### 2. 分发 Gas

#### 方案 A: 每个地址 0.01 ETH（推荐）
```bash
# 1. 模拟测试
./evm.js transfer --eth --file gas-distribution-0.01.json --dry-run

# 2. 查看需要的总金额
# 总计: 20 × 0.01 = 0.2 ETH + gas 费用

# 3. 确认主地址有足够余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 4. 实际发送
./evm.js transfer --eth --file gas-distribution-0.01.json
```

#### 方案 B: 每个地址 0.001 ETH（测试用）
```bash
# 小额测试
./evm.js transfer --eth --file gas-distribution-0.001.json --dry-run
./evm.js transfer --eth --file gas-distribution-0.001.json
```

#### 方案 C: 自定义金额
```bash
# 创建自定义分发列表
cat > custom-gas.json << EOF
[
  {"address": "0x019F2E31E9450CD77DDA247cCB76C56d26769094", "amount": "0.05"},
  {"address": "0xBCc7Ce14974EFde5Cb1501F526675D8A2473a7E2", "amount": "0.03"}
]
EOF

./evm.js transfer --eth --file custom-gas.json
```

---

### 3. 批量转账代币

#### 空投代币到所有子地址
```bash
# 1. 准备接收地址列表
cat > token-airdrop.json << EOF
[
  {"address": "0x019F2E31E9450CD77DDA247cCB76C56d26769094", "amount": "100"},
  {"address": "0xBCc7Ce14974EFde5Cb1501F526675D8A2473a7E2", "amount": "100"}
]
EOF

# 2. 检查主地址代币余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress

# 3. 模拟测试
./evm.js transfer --token 0xTokenAddress --file token-airdrop.json --dry-run

# 4. 实际发送
./evm.js transfer --token 0xTokenAddress --file token-airdrop.json
```

---

### 4. 归集资金

#### 归集 ETH 到主地址
```bash
# 1. 查询所有子地址余额
./evm.js balance --file sub-wallets-1-20.json

# 2. 模拟归集
./evm.js collect --eth --file sub-wallets-1-20.json --dry-run

# 3. 实际归集
./evm.js collect --eth --file sub-wallets-1-20.json
```

#### 归集代币到主地址
```bash
# 1. 查询代币余额
./evm.js balance --file sub-wallets-1-20.json --token 0xTokenAddress

# 2. 确保每个子地址有足够的 ETH 支付 gas
./evm.js balance --file sub-wallets-1-20.json

# 3. 如果 gas 不足，先分发 gas
./evm.js transfer --eth --file gas-distribution-0.001.json

# 4. 归集代币
./evm.js collect --token 0xTokenAddress --file sub-wallets-1-20.json --dry-run
./evm.js collect --token 0xTokenAddress --file sub-wallets-1-20.json
```

---

### 5. 查询地址详细信息

#### 查询主地址信息
```bash
./evm.js info --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
```

#### 查询主地址信息（包含常见代币）
```bash
./evm.js info --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --tokens
```

---

## 💡 实用场景

### 场景 1: 初始化子地址（分发 Gas）

**目标**: 给所有子地址分发 0.01 ETH 作为 gas

**步骤**:
```bash
# 1. 确认主地址余额（需要至少 0.2 ETH + gas）
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 2. 模拟测试
./evm.js transfer --eth --file gas-distribution-0.01.json --dry-run

# 3. 实际发送
./evm.js transfer --eth --file gas-distribution-0.01.json

# 4. 验证结果
./evm.js balance --file sub-wallets-1-20.json
```

---

### 场景 2: 代币空投

**目标**: 向所有子地址空投 100 个代币

**步骤**:
```bash
# 1. 准备空投列表
cat > airdrop-100.json << EOF
[
  {"address": "0x019F2E31E9450CD77DDA247cCB76C56d26769094", "amount": "100"},
  {"address": "0xBCc7Ce14974EFde5Cb1501F526675D8A2473a7E2", "amount": "100"}
  // ... 其他地址
]
EOF

# 2. 检查主地址代币余额（需要至少 2000 个代币）
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress

# 3. 模拟测试
./evm.js transfer --token 0xTokenAddress --file airdrop-100.json --dry-run

# 4. 实际发送
./evm.js transfer --token 0xTokenAddress --file airdrop-100.json

# 5. 验证结果
./evm.js balance --file sub-wallets-1-20.json --token 0xTokenAddress
```

---

### 场景 3: 资金归集

**目标**: 将所有子地址的 ETH 和代币归集到主地址

**步骤**:
```bash
# 1. 查询所有子地址余额
./evm.js balance --file sub-wallets-1-20.json
./evm.js balance --file sub-wallets-1-20.json --token 0xTokenAddress

# 2. 先归集代币（需要 gas）
./evm.js collect --token 0xTokenAddress --file sub-wallets-1-20.json --dry-run
./evm.js collect --token 0xTokenAddress --file sub-wallets-1-20.json

# 3. 再归集 ETH（会自动扣除 gas）
./evm.js collect --eth --file sub-wallets-1-20.json --dry-run
./evm.js collect --eth --file sub-wallets-1-20.json

# 4. 验证主地址余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress
```

---

### 场景 4: 测试转账功能

**目标**: 小额测试转账功能

**步骤**:
```bash
# 1. 向1号地址发送 0.001 ETH
./evm.js transfer --eth --to 0x019F2E31E9450CD77DDA247cCB76C56d26769094 --amount 0.001

# 2. 查询1号地址余额
./evm.js balance --address 0x019F2E31E9450CD77DDA247cCB76C56d26769094

# 3. 从1号地址归集回主地址
cat > test-collect.json << EOF
[
  {
    "address": "0x019F2E31E9450CD77DDA247cCB76C56d26769094",
    "privateKey": "0x8af894a0f51f4e0f996cc94074f780e36d416088a39443401ebb71d9ebb45366"
  }
]
EOF

./evm.js collect --eth --file test-collect.json
```

---

## 🌐 多链支持

### Ethereum 主网
```bash
./evm.js balance --address 0x... --rpc https://eth.llamarpc.com
```

### Base 网络
```bash
./evm.js balance --address 0x... --rpc https://mainnet.base.org
```

### Arbitrum 网络
```bash
./evm.js balance --address 0x... --rpc https://arb1.arbitrum.io/rpc
```

### Polygon 网络
```bash
./evm.js balance --address 0x... --rpc https://polygon-rpc.com
```

---

## ⚠️ 安全检查清单

### 操作前检查
- [ ] 确认主地址有足够的 ETH（用于 gas）
- [ ] 确认主地址有足够的代币（用于转账）
- [ ] 先使用 `--dry-run` 模拟测试
- [ ] 确认接收地址和金额无误
- [ ] 建议先小额测试（0.001 ETH）

### 操作后检查
- [ ] 查询主地址余额变化
- [ ] 查询子地址余额变化
- [ ] 在区块浏览器确认交易状态
- [ ] 记录交易哈希

### 安全提醒
- ⚠️ 所有私钥已保存在 vault/ 目录（权限 600）
- ⚠️ 定期备份 vault/ 目录到安全位置
- ⚠️ 不要将私钥分享给任何人
- ⚠️ 不要在公开场合展示私钥
- ⚠️ 建议将助记词抄写在纸上

---

## 📊 Gas 费用估算

### Ethereum 主网（参考）
- **ETH 转账**: ~21,000 gas
- **ERC20 转账**: ~65,000 gas
- **批量操作**: 单笔 × 数量

### 费用计算
```
总费用 = Gas Price × Gas Limit × 数量
```

**示例**（Gas Price = 30 Gwei）:
- 20笔 ETH 转账: 21,000 × 30 × 20 = 12,600,000 Gwei = 0.0126 ETH
- 20笔代币转账: 65,000 × 30 × 20 = 39,000,000 Gwei = 0.039 ETH

---

## 🔧 故障排查

### 问题 1: 余额不足
```
❌ 余额不足
```
**解决方案**:
```bash
# 查询余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 向主地址充值
```

### 问题 2: Gas 不足
```
⚠️ ETH 不足支付 gas
```
**解决方案**:
```bash
# 向子地址分发 gas
./evm.js transfer --eth --file gas-distribution-0.001.json
```

### 问题 3: 交易失败
```
❌ 交易失败: execution reverted
```
**解决方案**:
- 检查代币合约地址
- 检查接收地址是否有效
- 在区块浏览器查看详细错误
- 尝试增加 gas limit

---

## 📝 操作记录模板

### 操作日志
```
日期: 2026-02-21
操作: 分发 Gas
网络: Ethereum 主网
主地址: 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
接收地址: 1-20号子地址
金额: 每个 0.01 ETH
总金额: 0.2 ETH
Gas 费用: 0.0126 ETH
交易哈希: 0x...
状态: 成功
备注: 初始化子地址
```

---

## 🎯 下一步建议

1. **向主地址充值**
   - 充值 ETH（用于 gas）
   - 充值代币（用于分发）

2. **初始化子地址**
   - 分发 gas 到所有子地址
   - 验证余额

3. **测试功能**
   - 小额测试转账
   - 测试归集功能

4. **正式使用**
   - 批量空投代币
   - 定期归集资金

---

**创建时间**: 2026-02-21
**最后更新**: 2026-02-21
**版本**: 1.0
