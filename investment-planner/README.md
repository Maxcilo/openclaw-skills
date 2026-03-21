# 投资计划模块 - 使用说明

## 概述

事件驱动的投资决策系统，根据地缘政治、经济政策、自然灾害等事件，自动分析影响并生成投资计划。

## 功能特性

- ✅ 事件库（5个预设事件）
- ✅ 影响分析引擎
- ✅ 资产筛选器（50+品种）
- ✅ 风险偏好配置（保守/平衡/激进）
- ✅ 自动生成投资计划
- ✅ 仓位分配优化

## 快速开始

### 1. 列出所有事件

```bash
node investment-planner.js list
```

**输出：**
```
📚 事件库:

📁 geopolitical:
   geopolitical.us-iran-conflict - 美国空袭伊朗
   geopolitical.russia-ukraine-escalation - 俄乌冲突升级

📁 economic:
   economic.fed-rate-hike - 美联储加息
   economic.china-stimulus - 中国经济刺激

📁 natural:
   natural.hurricane-season - 飓风季节
```

### 2. 分析事件影响

```bash
node investment-planner.js analyze geopolitical.us-iran-conflict
```

**输出：**
```
📊 事件分析: 美国空袭伊朗
📁 类别: 地缘政治
⏱️  持续时间: short-term

💡 影响分析:
   OIL: ↑ high (置信度: 85%)
   GOLD: ↑ medium (置信度: 75%)
   US_STOCKS: ↓ medium (置信度: 70%)
   CRYPTO: ↓ high (置信度: 65%)
   USD: ↑ low (置信度: 60%)
```

### 3. 生成投资计划

```bash
# 平衡型，10000美元
node investment-planner.js plan geopolitical.us-iran-conflict balanced 10000

# 保守型，5000美元
node investment-planner.js plan geopolitical.us-iran-conflict conservative 5000

# 激进型，20000美元
node investment-planner.js plan geopolitical.us-iran-conflict aggressive 20000
```

## 风险偏好

### 保守型 (Conservative)
- 最大杠杆: 2x
- 单品种最大仓位: 20%
- 偏好分红股票
- 避免杠杆 ETF

**适合：**
- 风险承受能力低
- 追求稳定收益
- 长期投资者

### 平衡型 (Balanced)
- 最大杠杆: 5x
- 单品种最大仓位: 30%
- 允许杠杆 ETF
- 平衡收益和风险

**适合：**
- 风险承受能力中等
- 追求合理收益
- 中期投资者

### 激进型 (Aggressive)
- 最大杠杆: 20x
- 单品种最大仓位: 50%
- 允许期货和高杠杆 ETF
- 追求高收益

**适合：**
- 风险承受能力高
- 追求高收益
- 短期交易者

## 资产类别

### 原油 (Oil)
- **期货:** WTI (CL), 布伦特 (BZ)
- **ETF:** USO (1x), UCO (2x), GUSH (3x)
- **股票:** XOM, CVX, COP

### 黄金 (Gold)
- **期货:** GC
- **ETF:** GLD, IAU

### 美股 (US Stocks)
- **做多:** SPY, QQQ
- **做空:** SH, PSQ, SQQQ

### 加密货币 (Crypto)
- **现货:** BTC, ETH
- **期货:** BTCUSDT, ETHUSDT

## 示例场景

### 场景 1: 美国空袭伊朗

**事件分析：**
- 石油供应 ↓ → 油价 ↑ (85% 置信度)
- 避险情绪 ↑ → 黄金 ↑ (75% 置信度)
- 风险资产 ↓ → 美股 ↓ (70% 置信度)
- 风险资产 ↓ → 加密货币 ↓ (65% 置信度)

**投资策略（平衡型，$10,000）：**
1. **做多原油 (30%)** - $3,000
   - USO: $1,000
   - XOM: $1,000
   - CVX: $1,000

2. **做多黄金 (30%)** - $3,000
   - GLD: $1,500
   - IAU: $1,500

3. **做空美股 (30%)** - $3,000
   - SH: $1,000
   - SQQQ: $1,000
   - PSQ: $1,000

**预期收益：**
- 油价上涨 10% → 原油仓位收益 ~$300
- 黄金上涨 5% → 黄金仓位收益 ~$150
- 美股下跌 5% → 做空仓位收益 ~$150
- **总收益:** ~$600 (6%)

### 场景 2: 美联储加息

**事件分析：**
- 美元 ↑ (90% 置信度)
- 黄金 ↓ (75% 置信度)
- 美股 ↓ (70% 置信度)
- 加密货币 ↓ (80% 置信度)

**投资策略：**
1. 做空黄金
2. 做空美股
3. 做空加密货币

## 计划文件

生成的计划保存为 JSON 文件：

```json
{
  "event": "美国空袭伊朗",
  "riskProfile": "平衡型",
  "capital": 10000,
  "positions": [
    {
      "asset": "oil",
      "action": "up",
      "symbol": "USO",
      "name": "美国原油基金",
      "allocation": 0.1,
      "amount": 1000,
      "leverage": 1,
      "risk": "low"
    }
  ],
  "totalAllocation": 0.9
}
```

## 注意事项

1. **时间衰减** - 杠杆 ETF 有时间衰减，不适合长期持有
2. **保证金要求** - 期货合约需要保证金，注意爆仓风险
3. **流动性** - 选择流动性高的品种，避免滑点
4. **止损** - 设置严格止损，避免黑天鹅事件
5. **分散投资** - 不要把所有资金投入单一品种
6. **市场变化** - 事件影响可能与预期不同，及时调整

## 扩展事件

你可以在 `investment-planner.js` 中添加新事件：

```javascript
EVENT_LIBRARY.geopolitical['your-event'] = {
  name: '你的事件名称',
  category: '地缘政治',
  effects: {
    oil: { direction: 'up', magnitude: 'high', confidence: 0.80 },
    gold: { direction: 'up', magnitude: 'medium', confidence: 0.70 }
  }
};
```

## 作者

[@Go8888I](https://twitter.com/Go8888I)

大富小姐姐 🎀

## 版本

v1.0.0 - 2026-03-11

## 许可证

MIT License
