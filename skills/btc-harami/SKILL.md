---
name: btc-harami
description: BTC双孕线形态识别、回测和监控。用于识别BTC的双孕线K线形态（1小时、4小时、日线），提供历史回测分析和实时监控功能。适用场景：(1) 识别当前或历史双孕线形态 (2) 回测双孕线胜率 (3) 设置自动监控和通知 (4) 分析形态有效性
---

# BTC 双孕线形态识别

识别和监控BTC的双孕线K线形态，支持1小时、4小时、日线三个周期。

## 什么是双孕线

双孕线是一种K线反转形态，由3根K线组成：
- K1（母线）：较大的实体
- K2、K3（孕线）：小实体，完全在K1实体范围内

**关键特征：**
- K2和K3的实体必须完全在K1的实体范围内
- K2和K3的实体要明显小于K1（< 50%）
- 需要趋势背景支持

## 识别标准

### 周期阈值

| 周期 | K1最小实体 | 说明 |
|------|-----------|------|
| 1小时 | 50点 | 噪音大，需配合趋势 |
| 4小时 | 150点 | 平衡选择 |
| 日线 | 500点 | 最可靠 |

### 边界冗余（容错机制）

为了避免过于严格的边界判断，系统支持可配置的冗余范围：

| 周期 | 冗余比例 | 说明 |
|------|---------|------|
| 1小时 | ±0.1% | 连续性好，可以更严格 |
| 4小时 | ±0.2% | 平衡严格和宽松 |
| 日线 | ±0.5% | 可能有跳空，需要更大容错 |

**为什么需要冗余？**
- K线开盘收盘价可能有微小偏差（$0.01-$5）
- 大级别K线可能有跳空缺口
- 避免因为"差一点点"而错过有效形态

**示例：**
```
K1实体范围: $1,942.23 ~ $2,011.29
4小时冗余(±0.2%): $1,938.35 ~ $2,015.17

如果K2开盘价$1,942.22（差$0.01）
标准判断: ❌ 不在K1实体内
宽松判断: ✅ 在K1实体内（含冗余）
```

### 趋势判断

检查K1之前的5根K线：
- 60%以上上涨 → 上涨趋势
- 60%以上下跌 → 下跌趋势
- 其他 → 震荡

### 有效性判断

**强势双孕线（直接通过）：**
- K1实体 ≥ 2倍阈值

**需要趋势支持：**
- K1实体 ≥ 1倍阈值
- 且符合趋势背景：
  - 上涨趋势 + K1阳线 ✓
  - 下跌趋势 + K1阴线 ✓

## 回测数据（2025年至今）

### 1小时周期
- 形态数：429个
- 胜率：11.7%
- **结论：不建议使用**（噪音太大）

### 4小时周期
- 形态数：108个
- 胜率：26.9%
- 看涨胜率：32.7%
- 看跌胜率：22.0%
- **结论：可配合其他指标使用**

### 日线周期
- 形态数：13个
- 胜率：46.2%
- **看跌胜率：75.0%** ⭐⭐⭐
- **结论：日线看跌双孕线最可靠**

## 使用方法

### 1. 回测分析

运行回测脚本查看历史形态：

```bash
# 1小时回测
node scripts/btc-harami-backtest-1h.js

# 4小时回测
node scripts/btc-harami-backtest.js

# 日线回测
node scripts/btc-harami-backtest-1d.js
```

### 2. 实时监控

运行监控脚本检查当前形态：

```bash
node scripts/btc-harami-monitor.js
```

监控脚本会：
- 检查1小时、4小时、日线三个周期
- 发现新形态自动发送Telegram通知
- 避免重复通知（记录已通知的形态）

### 3. 设置定时监控

使用cron每小时自动检查：

```bash
0 * * * * cd /path/to/workspace && node btc-harami-monitor.js >> harami-monitor.log 2>&1
```

## 技术实现

### 核心算法

```javascript
// 配置：可调整的冗余比例
const TOLERANCE_CONFIG = {
    '1h': 0.001,  // 0.1%
    '4h': 0.002,  // 0.2%
    '1d': 0.005   // 0.5%
};

// 1. 计算K线实体
function getBody(candle) {
    return {
        top: Math.max(candle.open, candle.close),
        bottom: Math.min(candle.open, candle.close),
        size: Math.abs(candle.close - candle.open),
        isGreen: candle.close > candle.open
    };
}

// 2. 检查双孕线（含冗余）
function isDoubleHarami(data, index, minBodySize, timeframe) {
    const k1 = data[index - 2];
    const k2 = data[index - 1];
    const k3 = data[index];
    
    const b1 = getBody(k1);
    const b2 = getBody(k2);
    const b3 = getBody(k3);
    
    // 计算冗余范围
    const tolerance = k1.close * (TOLERANCE_CONFIG[timeframe] || 0.002);
    const b1TopTolerant = b1.top + tolerance;
    const b1BottomTolerant = b1.bottom - tolerance;
    
    // K2和K3实体必须在K1内（含冗余）
    const k2Inside = b2.top <= b1TopTolerant && b2.bottom >= b1BottomTolerant;
    const k3Inside = b3.top <= b1TopTolerant && b3.bottom >= b1BottomTolerant;
    
    // K2和K3实体要小
    const k2Small = b2.size < b1.size * 0.5;
    const k3Small = b3.size < b1.size * 0.5;
    
    // 检查趋势背景
    const trend = checkTrend(data, index - 2, 5);
    
    // 判断有效性
    if (b1.size >= minBodySize * 2) return true;
    
    if (b1.size >= minBodySize) {
        if (trend === 'uptrend' && b1.isGreen) return true;
        if (trend === 'downtrend' && !b1.isGreen) return true;
    }
    
    return false;
}
```

### 数据获取

使用ccxt库获取K线数据：

```javascript
const ccxt = require('ccxt');
const exchange = new ccxt.binance();

// 获取K线数据
const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1d', startTime, 100);
```

## 使用建议

### 推荐策略

1. **重点关注日线看跌双孕线**（75%胜率）
   - 出现在上涨后
   - K1是大阳线
   - 可考虑做空或减仓

2. **4小时看涨双孕线作为参考**（32.7%胜率）
   - 出现在下跌后
   - 配合其他指标确认
   - 可考虑抄底

3. **1小时周期仅供参考**
   - 噪音太大
   - 不建议单独使用

### 注意事项

⚠️ **双孕线不是圣杯**
- 胜率最高也只有75%（日线看跌）
- 需要配合其他指标和市场环境
- 注意风险管理

⚠️ **时区问题**
- 监控脚本显示北京时间（UTC+8）
- 交易所数据是UTC时间
- 注意时间转换

⚠️ **假信号过滤**
- K1实体太小的形态质量差
- 没有趋势背景的形态可靠性低
- 极端行情后的形态更有效

⚠️ **边界冗余的使用**
- 系统默认使用冗余机制（1h: ±0.1%, 4h: ±0.2%, 1d: ±0.5%）
- 可以在监控脚本中调整`TOLERANCE_CONFIG`
- 冗余太大会增加误判，太小会错过有效形态
- 建议保持默认配置

⚠️ **价格显示问题**
- 监控脚本已修复价格格式化问题
- 所有价格都会显示完整的万位数和千位分隔符
- 格式：$68,486.46（不是$8,486.46）

## 详细文档

完整的识别指南和案例分析，请参考：
- [references/guide.md](references/guide.md) - 详细识别指南

## 依赖

- Node.js
- ccxt库（`npm install ccxt`）
- Telegram通知需要配置OpenClaw

## 文件说明

**scripts/**
- `btc-harami-monitor.js` - 实时监控脚本
- `btc-harami-backtest.js` - 4小时回测
- `btc-harami-backtest-1h.js` - 1小时回测
- `btc-harami-backtest-1d.js` - 日线回测

**references/**
- `guide.md` - 完整识别指南
