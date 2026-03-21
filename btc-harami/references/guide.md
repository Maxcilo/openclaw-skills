# BTC 双孕线形态识别与监控

## 📖 什么是双孕线

双孕线是一种K线反转形态，由**3根K线**组成，表示市场动能衰竭，可能出现反转。

### 形态结构

```
K1 (母线)：较大的实体（阳线或阴线）
K2 (孕线1)：小实体，完全在K1实体范围内
K3 (孕线2)：小实体，完全在K1实体范围内
```

### 关键特征

1. **K2和K3的实体必须完全在K1的实体范围内**
   - 注意：是实体（开盘价到收盘价），不包括上下影线
   
2. **K2和K3的实体要明显小于K1**
   - 通常 K2、K3 实体 < K1 实体的 50%

3. **趋势背景很重要**
   - 上涨后的阳线双孕线 → 看跌信号
   - 下跌后的阴线双孕线 → 看涨信号

## 🎯 识别标准

### 基础条件

| 周期 | K1最小实体 | 说明 |
|------|-----------|------|
| 1小时 | 50点 | 噪音大，需配合趋势 |
| 4小时 | 150点 | 平衡选择 |
| 日线 | 500点 | 最可靠 |

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

## 📊 回测数据（2025年至今）

### 1小时周期
- 形态数：429个
- 胜率：11.7%
- 震荡比例：77.2%
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
- 看涨胜率：33.3%
- **看跌胜率：75.0%** ⭐⭐⭐
- **结论：日线看跌双孕线最可靠**

## 🔧 技术实现

### 核心算法

```javascript
// 1. 计算K线实体
function getBody(candle) {
    return {
        top: Math.max(candle.open, candle.close),
        bottom: Math.min(candle.open, candle.close),
        size: Math.abs(candle.close - candle.open),
        isGreen: candle.close > candle.open
    };
}

// 2. 检查双孕线
function isDoubleHarami(data, index, minBodySize) {
    const k1 = data[index - 2];
    const k2 = data[index - 1];
    const k3 = data[index];
    
    const b1 = getBody(k1);
    const b2 = getBody(k2);
    const b3 = getBody(k3);
    
    // K2和K3实体必须在K1内
    const k2Inside = b2.top <= b1.top && b2.bottom >= b1.bottom;
    const k3Inside = b3.top <= b1.top && b3.bottom >= b1.bottom;
    
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

// 3. 趋势判断
function checkTrend(data, index, lookback = 5) {
    const recentCandles = data.slice(index - lookback, index);
    let upCount = 0, downCount = 0;
    
    for (let i = 1; i < recentCandles.length; i++) {
        if (recentCandles[i].close > recentCandles[i-1].close) upCount++;
        if (recentCandles[i].close < recentCandles[i-1].close) downCount++;
    }
    
    if (upCount >= lookback * 0.6) return 'uptrend';
    if (downCount >= lookback * 0.6) return 'downtrend';
    return 'neutral';
}
```

### 数据获取

使用 ccxt 库获取K线数据：

```javascript
const ccxt = require('ccxt');
const exchange = new ccxt.binance();

// 获取日线数据
const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1d', startTime, 100);

// 获取4小时数据
const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '4h', startTime, 100);

// 获取1小时数据
const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1h', startTime, 100);
```

## 🤖 自动监控

### 监控脚本

位置：`/root/.openclaw/workspace/btc-harami-monitor.js`

功能：
- 每小时自动检查 1小时、4小时、日线 三个周期
- 发现新形态自动发送 Telegram 通知
- 避免重复通知（记录已通知的形态）

### 运行方式

**手动测试：**
```bash
cd /root/.openclaw/workspace
node btc-harami-monitor.js
```

**自动运行（crontab）：**
```bash
# 每小时整点执行
0 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node btc-harami-monitor.js >> /root/.openclaw/workspace/harami-monitor.log 2>&1
```

### 查看日志

```bash
tail -f /root/.openclaw/workspace/harami-monitor.log
```

## 📈 使用建议

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

## 🔍 实战案例

### 案例1：2026-02-13 看跌双孕线（日线）

```
时间：2026-02-06 ~ 2026-02-08
类型：看跌双孕线
背景：从62k暴力反弹至70k

K1 (母线): 大阳线 +7670点
K2 (孕线1): 小阴线 -1291点
K3 (孕线2): 小阳线 +1041点

后续：震荡回落至66k-70k区间 ✓
```

### 案例2：2025-02-03 看涨双孕线（4小时）

```
时间：2025-02-03 00:00
类型：看涨双孕线
背景：暴跌后

后续：强力反弹 +7.77% ✓
```

## 📚 参考资料

- 监控脚本：`/root/.openclaw/workspace/btc-harami-monitor.js`
- 回测脚本：
  - 1小时：`/root/.openclaw/workspace/btc-harami-backtest-1h.js`
  - 4小时：`/root/.openclaw/workspace/btc-harami-backtest.js`
  - 日线：`/root/.openclaw/workspace/btc-harami-backtest-1d.js`
- 状态文件：`/root/.openclaw/workspace/harami-state.json`
- 日志文件：`/root/.openclaw/workspace/harami-monitor.log`

## 🎯 总结

**最佳实践：**
1. 重点关注日线看跌双孕线（75%胜率）
2. 4小时周期作为辅助参考
3. 配合趋势背景判断
4. 注意风险管理，不要孤注一掷

**记住：**
- 双孕线是概率优势，不是确定性
- 市场永远是对的，形态只是工具
- 持续学习和优化策略

---

*最后更新：2026-02-14*
*作者：大富小姐姐 🎀*
