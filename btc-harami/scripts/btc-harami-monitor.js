#!/usr/bin/env node
/**
 * BTC 双孕线形态监控脚本（改进版）
 * 监控 1小时、4小时、日线 三个时间周期
 * - 检查趋势背景
 * - 显示北京时间（UTC+8）
 */

const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'harami-state.json');

// 计算K线实体
function getBody(candle) {
    return {
        top: Math.max(candle.open, candle.close),
        bottom: Math.min(candle.open, candle.close),
        size: Math.abs(candle.close - candle.open),
        isGreen: candle.close > candle.open
    };
}

// 检查趋势（看前面N根K线）
function checkTrend(data, index, lookback = 5) {
    if (index < lookback) return 'neutral';
    
    const recentCandles = data.slice(index - lookback, index);
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < recentCandles.length; i++) {
        if (recentCandles[i].close > recentCandles[i-1].close) upCount++;
        if (recentCandles[i].close < recentCandles[i-1].close) downCount++;
    }
    
    // 判断趋势
    if (upCount >= lookback * 0.6) return 'uptrend';
    if (downCount >= lookback * 0.6) return 'downtrend';
    return 'neutral';
}

// 检查是否为双孕线（改进版：考虑趋势）
function isDoubleHarami(data, index, minBodySize = 50) {
    if (index < 2) return false;
    
    const k1 = data[index - 2];
    const k2 = data[index - 1];
    const k3 = data[index];
    
    const b1 = getBody(k1);
    const b2 = getBody(k2);
    const b3 = getBody(k3);
    
    // K2和K3的实体都必须完全在K1内
    const k2Inside = b2.top <= b1.top && b2.bottom >= b1.bottom;
    const k3Inside = b3.top <= b1.top && b3.bottom >= b1.bottom;
    
    if (!k2Inside || !k3Inside) return false;
    
    // K2和K3应该是较小的实体
    const k2Small = b2.size < b1.size * 0.5;
    const k3Small = b3.size < b1.size * 0.5;
    
    if (!k2Small || !k3Small) return false;
    
    // 检查趋势背景
    const trend = checkTrend(data, index - 2, 5);
    
    // 如果K1实体较大，直接通过
    if (b1.size >= minBodySize * 2) return true;
    
    // 如果K1实体较小，必须有明确的趋势背景
    if (b1.size >= minBodySize) {
        if (trend === 'uptrend' && b1.isGreen) return true;  // 上涨后的阳线
        if (trend === 'downtrend' && !b1.isGreen) return true; // 下跌后的阴线
    }
    
    return false;
}

// 加载已通知的形态
function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载状态文件失败:', err.message);
    }
    return { notified: [] };
}

// 保存状态
function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('保存状态文件失败:', err.message);
    }
}

// 通过 OpenClaw CLI 发送 Telegram 消息
function sendTelegramMessage(message) {
    try {
        const cmd = `/root/.nvm/versions/node/v22.22.0/bin/openclaw message send --channel telegram --target 6311362800 --message ${JSON.stringify(message)}`;
        execSync(cmd, { stdio: 'inherit' });
        console.log('✓ 通知已发送');
    } catch (err) {
        console.error('发送通知失败:', err.message);
    }
}

// 格式化价格（带千位分隔符）
function formatPrice(price) {
    // 根据价格大小决定小数位数
    if (price >= 1000) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else if (price >= 1) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 4 
        });
    } else {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 4, 
            maximumFractionDigits: 8 
        });
    }
}

// 格式化时间戳为北京时间
function formatTimestamp(timestamp, timeframe) {
    const date = new Date(timestamp + 8 * 60 * 60 * 1000); // UTC+8
    if (timeframe === '1d') {
        return date.toISOString().split('T')[0];
    } else if (timeframe === '4h') {
        return date.toISOString().slice(0, 13).replace('T', ' ') + ':00';
    } else if (timeframe === '1h') {
        return date.toISOString().slice(0, 13).replace('T', ' ') + ':00';
    }
    return date.toISOString().replace('T', ' ').slice(0, 16);
}

// 检查单个时间周期
async function checkTimeframe(exchange, timeframe, minBodySize) {
    const limit = timeframe === '1d' ? 20 : 100;
    const ohlcv = await exchange.fetchOHLCV('BTC/USDT', timeframe, undefined, limit);
    
    const data = ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
    }));
    
    if (data.length < 10) return null;
    
    const index = data.length - 1;
    
    if (isDoubleHarami(data, index, minBodySize)) {
        const k1 = data[index - 2];
        const k2 = data[index - 1];
        const k3 = data[index];
        
        const b1 = getBody(k1);
        const b2 = getBody(k2);
        const b3 = getBody(k3);
        
        const trend = checkTrend(data, index - 2, 5);
        const trendText = trend === 'uptrend' ? '(前期上涨)' : trend === 'downtrend' ? '(前期下跌)' : '';
        
        return {
            timeframe,
            type: b1.isGreen ? '看跌双孕线' : '看涨双孕线',
            signal: b1.isGreen ? '⬇️ 可能见顶回落' : '⬆️ 可能见底反转',
            trend: trendText,
            k1: {
                time: formatTimestamp(k1.timestamp, timeframe),
                open: k1.open,
                close: k1.close,
                body: b1.size.toFixed(2),
                color: b1.isGreen ? '阳线' : '阴线'
            },
            k2: {
                time: formatTimestamp(k2.timestamp, timeframe),
                open: k2.open,
                close: k2.close,
                body: b2.size.toFixed(2),
                color: b2.isGreen ? '阳线' : '阴线'
            },
            k3: {
                time: formatTimestamp(k3.timestamp, timeframe),
                open: k3.open,
                close: k3.close,
                body: b3.size.toFixed(2),
                color: b3.isGreen ? '阳线' : '阴线'
            },
            haramiId: `${timeframe}_${k1.timestamp}_${k3.timestamp}`
        };
    }
    
    return null;
}

// 主监控函数
async function monitor() {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    console.log(`[${now} 北京时间] 开始检查双孕线形态...`);
    
    try {
        const exchange = new ccxt.binance();
        const state = loadState();
        
        // 检查三个时间周期
        const timeframes = [
            { tf: '1h', minBody: 50, name: '1小时' },
            { tf: '4h', minBody: 150, name: '4小时' },
            { tf: '1d', minBody: 500, name: '日线' }
        ];
        
        let foundNew = false;
        
        for (const { tf, minBody, name } of timeframes) {
            console.log(`检查 ${name} 周期...`);
            
            const harami = await checkTimeframe(exchange, tf, minBody);
            
            if (harami && !state.notified.includes(harami.haramiId)) {
                const message = `🎀 双孕线形态提醒

⏰ 周期：${name}
📊 类型：${harami.type} ${harami.trend}
📅 时间：${harami.k1.time} ~ ${harami.k3.time}
💰 当前价格：$${formatPrice(harami.k3.close)}

K1 (母线): ${harami.k1.color}
  开盘: $${formatPrice(harami.k1.open)}
  收盘: $${formatPrice(harami.k1.close)}
  实体: ${harami.k1.body}

K2 (孕线1): ${harami.k2.color}
  开盘: $${formatPrice(harami.k2.open)}
  收盘: $${formatPrice(harami.k2.close)}
  实体: ${harami.k2.body}

K3 (孕线2): ${harami.k3.color}
  开盘: $${formatPrice(harami.k3.open)}
  收盘: $${formatPrice(harami.k3.close)}
  实体: ${harami.k3.body}

${harami.signal}`;
                
                console.log('\n' + '='.repeat(60));
                console.log(message);
                console.log('='.repeat(60) + '\n');
                
                // 发送 Telegram 通知
                sendTelegramMessage(message);
                
                // 记录已通知
                state.notified.push(harami.haramiId);
                foundNew = true;
            }
        }
        
        // 只保留最近100个记录
        if (state.notified.length > 100) {
            state.notified = state.notified.slice(-100);
        }
        saveState(state);
        
        if (!foundNew) {
            console.log('未发现新的双孕线形态');
        }
        
    } catch (error) {
        console.error('监控出错:', error.message);
    }
}

// 执行监控
monitor().then(() => {
    console.log('检查完成');
    process.exit(0);
}).catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
});
