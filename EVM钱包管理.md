# EVM钱包管理工具

## 当前钱包

### 0号账户（主账户）
- **地址:** `0xFF68AD2c40F028773A764D44269EE31c616A84E2`
- **助记词:** `since coral say year side pipe life gauge run hat acquire trade`
- **路径:** m/44'/60'/0'/0/0
- **文件:** `vault/evm-wallet-2026-02-21T08-32-03-1.json`

### 1号账户
- **地址:** `0x0a0A033b4CAF1Fb8A6af91f5386b057F174e7B58`
- **文件:** `vault/evm-wallet-2026-02-21T08-32-03-2.json`

### 2号账户
- **地址:** `0x6dffA7c3F1bC85CF84b468959A9E7687dcaeda37`
- **文件:** `vault/evm-wallet-2026-02-21T08-32-03-3.json`

## 批量转账工具

### 推荐使用
```bash
node batch-transfer-robust.js
```

### 配置说明
编辑脚本中的 CONFIG 对象：
- `amountPerWallet`: 每个账户转账金额（默认0.05 ETH）
- `sourceWallet`: 源账户路径
- `targetWallets`: 目标账户列表
- `maxRetries`: 最大重试次数（默认3次）

### RPC Endpoints
脚本会自动尝试以下RPC（按优先级）：
1. https://rpc.ankr.com/eth_sepolia
2. https://rpc2.sepolia.org
3. https://ethereum-sepolia-rpc.publicnode.com ✅ 当前可用

### 获取测试ETH
Sepolia水龙头：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

## 查询余额
```bash
node check-all-wallets.js
```

## 安全提醒
- 所有钱包文件存储在 `vault/` 目录（权限700）
- 私钥和助记词永不进入LLM上下文
- 仅在必要时读取，处理后立即返回结果
