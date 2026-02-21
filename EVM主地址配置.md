# EVM 主地址配置

## 主地址信息
- **地址**: `0x2fEE02faD2FF69A7905767b6E5B54C610D425941`
- **用途**: 代币的分发和归集
- **配置时间**: 2026-02-21
- **存储位置**: `vault/evm-wallet-main.json`

## 使用场景
1. **代币分发**: 从主地址向多个地址批量发送代币
2. **代币归集**: 从多个地址收集代币到主地址
3. **资金管理**: 统一管理和调度资金

## 安全提醒
- ⚠️ 私钥已安全存储在 `vault/evm-wallet-main.json`（权限 600）
- ⚠️ 不要在公开场合分享私钥
- ⚠️ 定期备份 vault/ 目录

## 相关工具
- 地址生成器: `./evm-wallet-gen.js`
- 批量转账工具: `./evm-batch-transfer.js`
- 归集工具: `./evm-collect.js`

## 工具使用示例

### 1. 批量转账 ETH
```bash
# 单个转账
./evm-batch-transfer.js --eth --to 0x... --amount 0.1

# 批量转账（从文件）
./evm-batch-transfer.js --eth --file recipients.json

# 模拟测试
./evm-batch-transfer.js --eth --file recipients.json --dry-run
```

### 2. 批量转账 ERC20 代币
```bash
# 单个转账
./evm-batch-transfer.js --token 0x... --to 0x... --amount 100

# 批量转账
./evm-batch-transfer.js --token 0x... --file recipients.json
```

### 3. 归集 ETH
```bash
# 归集所有子地址的 ETH 到主地址
./evm-collect.js --eth --file wallets.json

# 模拟测试
./evm-collect.js --eth --file wallets.json --dry-run
```

### 4. 归集 ERC20 代币
```bash
# 归集所有子地址的代币到主地址
./evm-collect.js --token 0x... --file wallets.json
```

## 文件格式

### recipients.json (批量转账接收地址)
```json
[
  { "address": "0x...", "amount": "0.1" },
  { "address": "0x...", "amount": "0.2" }
]
```

### wallets.json (归集钱包列表)
```json
[
  { "address": "0x...", "privateKey": "0x..." },
  { "address": "0x...", "privateKey": "0x..." }
]
```
