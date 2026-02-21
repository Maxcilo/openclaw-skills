# EVM 工具集 - 最终版本

## 🎉 完整工具清单

### 核心工具（8个）
1. **evm-wallet-gen.js** - 地址生成器
2. **evm-batch-gen.js** - 批量生成器（支持 CSV/JSON/List）
3. **evm-batch-transfer.js** - 批量转账工具
4. **evm-collect.js** - 资金归集工具
5. **evm-balance.js** - 余额查询工具
6. **evm-info.js** - 地址信息查询
7. **evm-tx-history.js** - 交易历史查询
8. **evm.js** - 统一管理器

### 辅助工具（2个）
9. **evm-extract-addresses.js** - 地址列表提取工具
10. **evm-manager.sh** - 交互式管理脚本

---

## 📋 地址体系

### 已创建的地址
- **0号地址（主地址）**: `0x2fEE02faD2FF69A7905767b6E5B54C610D425941`
- **1-20号地址（子地址）**: 已生成并保存到 vault/

### 文件清单
```
vault/
├── evm-wallet-main.json                      # 主地址
├── batch-2026-02-21T08-46-15-{1-20}.json    # 单个子地址
├── batch-2026-02-21T08-46-15-summary.json   # 子地址汇总
├── 地址清单-0-20-完整版.md                   # 完整清单（含私钥）
└── 地址清单-0-20.csv                         # CSV 格式

workspace/
├── sub-wallets-1-20.json                     # 子地址导出
├── gas-distribution-0.01.json                # Gas 分发配置（0.01 ETH）
├── gas-distribution-0.001.json               # Gas 分发配置（0.001 ETH）
├── addresses-only.txt                        # 纯地址列表
└── 地址清单-0-20.md                          # 简化清单
```

---

## 🚀 快速开始

### 方式 1: 使用统一管理器
```bash
# 查看帮助
./evm.js --help

# 查询余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 批量查询
./evm.js balance --file sub-wallets-1-20.json

# 分发 Gas
./evm.js transfer --eth --file gas-distribution-0.01.json --dry-run
./evm.js transfer --eth --file gas-distribution-0.01.json

# 归集资金
./evm.js collect --eth --file sub-wallets-1-20.json
```

### 方式 2: 使用交互式脚本
```bash
# 启动交互式管理界面
./evm-manager.sh
```

**交互式菜单功能：**
1. 查询主地址余额
2. 查询所有子地址余额
3. 分发 Gas (0.01 ETH)
4. 分发 Gas (0.001 ETH)
5. 归集 ETH 到主地址
6. 归集代币到主地址
7. 查询主地址信息
8. 批量转账代币
9. 查看地址清单
0. 退出

---

## 💡 常用操作速查

### 1. 查询余额
```bash
# 主地址
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 所有子地址
./evm.js balance --file sub-wallets-1-20.json

# 查询代币余额
./evm.js balance --address 0x... --token 0xTokenAddress
```

### 2. 分发 Gas
```bash
# 每个地址 0.01 ETH（推荐）
./evm.js transfer --eth --file gas-distribution-0.01.json --dry-run
./evm.js transfer --eth --file gas-distribution-0.01.json

# 每个地址 0.001 ETH（测试）
./evm.js transfer --eth --file gas-distribution-0.001.json
```

### 3. 批量转账代币
```bash
# 准备接收列表
cat > airdrop.json << EOF
[
  {"address": "0x...", "amount": "100"}
]
EOF

# 模拟测试
./evm.js transfer --token 0xTokenAddress --file airdrop.json --dry-run

# 实际发送
./evm.js transfer --token 0xTokenAddress --file airdrop.json
```

### 4. 归集资金
```bash
# 归集 ETH
./evm.js collect --eth --file sub-wallets-1-20.json --dry-run
./evm.js collect --eth --file sub-wallets-1-20.json

# 归集代币
./evm.js collect --token 0xTokenAddress --file sub-wallets-1-20.json
```

### 5. 查询地址信息
```bash
# 基本信息
./evm.js info --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 包含常见代币
./evm.js info --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --tokens
```

---

## 📚 完整文档清单

### 使用指南
1. **README-EVM.md** - 完整使用指南（推荐阅读）
2. **EVM工具集使用指南.md** - 详细使用说明
3. **EVM地址管理完整指南.md** - 地址管理指南
4. **EVM工具快速参考.md** - 快速参考卡
5. **EVM工具集完整清单.md** - 工具清单

### 配置文档
6. **EVM主地址配置.md** - 主地址配置说明
7. **地址清单-0-20.md** - 地址清单（简化版）

### 敏感文档（vault/）
8. **vault/地址清单-0-20-完整版.md** - 完整清单（含私钥）
9. **vault/地址清单-0-20.csv** - CSV 格式清单

---

## 🌐 多链支持

所有工具都支持通过 `--rpc` 参数切换网络：

```bash
# Ethereum 主网
./evm.js balance --address 0x... --rpc https://eth.llamarpc.com

# Base 网络
./evm.js balance --address 0x... --rpc https://mainnet.base.org

# Arbitrum 网络
./evm.js balance --address 0x... --rpc https://arb1.arbitrum.io/rpc

# Polygon 网络
./evm.js balance --address 0x... --rpc https://polygon-rpc.com

# Optimism 网络
./evm.js balance --address 0x... --rpc https://mainnet.optimism.io

# BSC 网络
./evm.js balance --address 0x... --rpc https://bsc-dataseed.binance.org
```

---

## ⚠️ 安全提醒

### 私钥安全
- ✅ 所有私钥已保存在 `vault/` 目录（权限 700）
- ✅ 文件权限设置为 600（仅所有者可读写）
- ✅ vault/ 已在 .gitignore 中
- ⚠️ 定期备份 vault/ 目录到安全位置
- ⚠️ 不要将私钥分享给任何人

### 操作安全
- ✅ 所有操作先使用 `--dry-run` 模拟测试
- ✅ 确认地址、金额、gas 费用无误
- ✅ 建议先小额测试（0.001 ETH）
- ✅ 确认成功后再大额操作

### 备份建议
```bash
# 备份 vault 目录
tar -czf vault-backup-$(date +%Y%m%d).tar.gz vault/

# 验证备份
tar -tzf vault-backup-*.tar.gz | head

# 恢复备份
tar -xzf vault-backup-*.tar.gz
```

---

## 📊 工具对比表

| 工具 | 功能 | 输入 | 输出 | 场景 |
|------|------|------|------|------|
| evm-wallet-gen.js | 生成地址 | 数量 | 地址+私钥 | 创建钱包 |
| evm-batch-gen.js | 批量生成 | 数量+格式 | CSV/JSON/List | 批量创建 |
| evm-batch-transfer.js | 批量转账 | 接收列表 | 交易哈希 | 空投/分发 |
| evm-collect.js | 资金归集 | 钱包列表 | 交易哈希 | 收集资金 |
| evm-balance.js | 余额查询 | 地址 | 余额 | 检查余额 |
| evm-info.js | 地址信息 | 地址 | 详细信息 | 全面查询 |
| evm-tx-history.js | 交易历史 | 地址+API Key | 交易列表 | 历史查询 |
| evm.js | 统一管理 | 命令+参数 | 各种 | 统一入口 |
| evm-extract-addresses.js | 提取地址 | 钱包文件 | 地址列表 | 地址提取 |
| evm-manager.sh | 交互管理 | 菜单选择 | 各种 | 交互操作 |

---

## 🎯 典型使用流程

### 流程 1: 初始化（首次使用）
```bash
# 1. 查看主地址
cat vault/evm-wallet-main.json

# 2. 向主地址充值 ETH（用于 gas）
# 在交易所或钱包向主地址转账

# 3. 确认到账
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 4. 分发 Gas 到子地址
./evm.js transfer --eth --file gas-distribution-0.01.json --dry-run
./evm.js transfer --eth --file gas-distribution-0.01.json

# 5. 验证分发结果
./evm.js balance --file sub-wallets-1-20.json
```

### 流程 2: 代币空投
```bash
# 1. 准备接收列表
cat > airdrop-100.json << EOF
[
  {"address": "0x019F2E31E9450CD77DDA247cCB76C56d26769094", "amount": "100"},
  {"address": "0xBCc7Ce14974EFde5Cb1501F526675D8A2473a7E2", "amount": "100"}
]
EOF

# 2. 检查主地址代币余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --token 0xTokenAddress

# 3. 模拟测试
./evm.js transfer --token 0xTokenAddress --file airdrop-100.json --dry-run

# 4. 实际发送
./evm.js transfer --token 0xTokenAddress --file airdrop-100.json

# 5. 验证结果
./evm.js balance --file sub-wallets-1-20.json --token 0xTokenAddress
```

### 流程 3: 资金归集
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
./evm.js info --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --tokens
```

---

## 🔧 高级功能

### 1. 提取地址列表
```bash
# 提取纯地址列表
./evm-extract-addresses.js --file sub-wallets-1-20.json --output addresses.txt

# 提取为 JSON 格式
./evm-extract-addresses.js --file sub-wallets-1-20.json --output addresses.json --format json
```

### 2. 自定义 RPC
```bash
# 使用自定义 RPC（Infura）
./evm.js balance --address 0x... --rpc https://mainnet.infura.io/v3/YOUR_KEY

# 使用自定义 RPC（Alchemy）
./evm.js balance --address 0x... --rpc https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### 3. 查询交易历史
```bash
# 需要 Etherscan API Key
./evm.js history --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941 --api-key YOUR_KEY

# 查询最近20笔交易
./evm.js history --address 0x... --api-key YOUR_KEY --limit 20
```

---

## 📝 操作记录模板

### 操作日志示例
```
===========================================
操作日期: 2026-02-21
操作类型: 分发 Gas
网络: Ethereum 主网
===========================================

主地址: 0x2fEE02faD2FF69A7905767b6E5B54C610D425941
接收地址: 1-20号子地址（共20个）
单笔金额: 0.01 ETH
总金额: 0.2 ETH
Gas 费用: ~0.0126 ETH
总花费: ~0.2126 ETH

交易哈希:
- 0x...
- 0x...
（共20笔）

状态: ✅ 成功
备注: 初始化子地址，为后续操作准备 gas

===========================================
```

---

## 🎓 学习资源

### 官方文档
- [ethers.js 文档](https://docs.ethers.org/)
- [Ethereum 开发文档](https://ethereum.org/developers)
- [ERC20 标准](https://eips.ethereum.org/EIPS/eip-20)

### 区块浏览器
- [Etherscan](https://etherscan.io/) - Ethereum 主网
- [Basescan](https://basescan.org/) - Base 网络
- [Arbiscan](https://arbiscan.io/) - Arbitrum 网络
- [Polygonscan](https://polygonscan.com/) - Polygon 网络

### Gas 追踪
- [ETH Gas Station](https://ethgasstation.info/)
- [Gas Tracker](https://etherscan.io/gastracker)

---

## 🆘 故障排查

### 常见问题

**Q1: 余额不足**
```bash
# 检查余额
./evm.js balance --address 0x2fEE02faD2FF69A7905767b6E5B54C610D425941

# 解决方案：向主地址充值
```

**Q2: Gas 不足**
```bash
# 向子地址分发 gas
./evm.js transfer --eth --file gas-distribution-0.001.json
```

**Q3: 交易失败**
```bash
# 在区块浏览器查看详细错误
# https://etherscan.io/tx/0x...
```

**Q4: RPC 连接失败**
```bash
# 更换 RPC 节点
./evm.js balance --address 0x... --rpc https://eth.llamarpc.com
```

---

## 📞 技术支持

如有问题或建议，请查阅文档或联系开发者。

**相关文件：**
- README-EVM.md（完整文档）
- EVM地址管理完整指南.md（管理指南）
- EVM工具快速参考.md（快速参考）

---

## 🎉 总结

**已完成的工作：**
- ✅ 创建了10个实用工具
- ✅ 生成了21个地址（0号主地址 + 1-20号子地址）
- ✅ 编写了9份完整文档
- ✅ 准备了 Gas 分发配置文件
- ✅ 所有私钥已安全保存到 vault/

**下一步建议：**
1. 向主地址充值 ETH
2. 使用交互式脚本 `./evm-manager.sh` 进行操作
3. 先小额测试，确认无误后再大额操作

**祝使用愉快！** 🎉

---

**创建时间**: 2026-02-21
**最后更新**: 2026-02-21
**版本**: 2.0 Final
