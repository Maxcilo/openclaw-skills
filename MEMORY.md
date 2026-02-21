# 长期记忆

## 身份
大富小姐姐 🎀 | 哥哥(isaga @isagago 6311362800) | GMT+8

## 核心技能
加密货币分析 | K线形态 | 浏览器自动化 | **合约短期交易** | **预测市场交易**

## 关键数据
**双孕线胜率：** 日线看跌75% > 4h看涨32.7% > 1h不可用
**套利阈值：** >0.3%价差 | Polymarket价差过大无机会
**⚠️ 血的教训：** 长期持有合约亏损80000u | 合约只用于短期
**Polymarket对冲：** 买强队赢 + 买弱队不赢 = 覆盖两个结果 | "不赢"包含平局
**高手教训：** swisstony亏损$57k | 对冲不是无风险 | 不要盲目跟单

## 工具
agent-browser | ccxt | ethers.js（EVM批量转账）

## 文件
- 双孕线指南：`双孕线识别指南.md`
- 价格行为：`价格行为分析指南.md` | `price-action.js` 📊 K线力量分析
- 资金费率：`资金费率分析指南.md` | `funding-quick.js` 💰 快速查询（Binance）
- 监控脚本：`btc-harami-monitor.js` ✅ | `polymarket-monitor.js` ⚡ 新市场监控
- 日程：`哥哥的日程.md`
- 交易记录：`trade-log.js` | `positions.js` | 别名`pos`
- 复盘记录：`review.js` | `复盘记录.md`
- 开仓检查：`开仓检查清单.md` ⚠️ 每次开仓前必读
- 交易备忘：`memo.js` | `交易备忘录.md` 📝 市场判断和关键位
- 数据访问：`数据访问指南.md` 🔐 敏感信息处理规则
- 备份指南：`备份指南.md` | 快速备份：`./backup.sh`
- Polymarket研究：`polymarket-*.md` | `polymarket-api.js` 🎯 高胜率玩家跟单
- Polymarket策略：`event-analysis-profit-guide.md` 💡 事件分析盈利完整指南
- Simmer训练：`simmer-training-mode.md` 🎓 | `simmer-training-analysis.py` 📊
- 双代理系统：`dual-agent-trading-system.md` 👥 交易员+分析师
- EVM钱包：`EVM钱包管理.md` 💼 批量转账工具

## 安全架构
- `vault/` - 完整敏感数据（权限700，永不进LLM）
  - simmer-credentials.json（Simmer API密钥）
  - evm-wallet-*.json（EVM钱包）
  - trades-full.json, review-full.json, assets-full.json
- `data/` - 脱敏数据（供LLM使用）
- `memory/filtered/` - 脱敏记忆
- `memory/full/` - 完整记忆（敏感）

## Simmer预测市场
- **平台：** Simmer.markets（AI代理预测市场）
- **账户：** 已认领，真实交易已启用
- **余额：** $10,000 $SIM（虚拟货币训练）
- **模式：** 🎓 训练模式（大胆交易，累积数据）
- **技能：** polymarket-weather-trader（天气）| polymarket-mert-sniper（临期狙击）
- **双代理：** 交易员小富（执行）+ 我（分析优化）
- **自动化：** Weather Trader每2分钟 | Mert Sniper每3分钟
