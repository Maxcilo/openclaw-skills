#!/usr/bin/env node
/**
 * BTC 双孕线形态监控脚本 v2.1
 * - 支持本地K线缓存
 * - 回测胜率计算修正（含趋势验证、手续费）
 * - 使用 timeframe+timestamp 作为唯一ID
 */

const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'harami-state.json');
const THRESHOLDS = {
    '1h': { minBody: 50,  name: '1小时' },
    '4h': { minBody: 150, name: '4小时' },
    '1d': { minBody: 500, name: '日线' }
};

// 手续费率（双向0.1%）
const FEE_RATE = 0.001;

function loadKlineFromCache(timeframe) {
    const cacheDir = path.join(__dirname, '..', 'cache');
    const files = { '1h': 'btc-1h.json', '4h': 'btc-4h.json', '1d': 'btc-1d.json' };
    const cacheFile = path.join(cacheDir, files[timeframe]);
    if (!fs.existsSync(cacheFile)) return null;
    try {
        const raw = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (!Array.isArray(raw) || raw.length < 20) return null;
        // 宽松验证：只警告不失效
        for (let i = 1; i < raw.length; i++) {
            if (raw[i][0] <= raw[i-1][0]) {
                console.warn(`缓存时间戳可能不连续: ${i}`);
            }
        }
        return raw.map(c => ({
            timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5]
        }));
    } catch (e) {
        console.error('缓存读取失败:', e.message);
        return null;
    }
}

function getBody(candle) {
    return {
        top: Math.max(candle.open, candle.close),
        bottom: Math.min(candle.open, candle.close),
        size: Math.abs(candle.close - candle.open),
        isGreen: candle.close > candle.open
    };
}

function checkTrend(data, index, lookback = 5) {
    if (index < lookback) return 'neutral';
    const recent = data.slice(index - lookback, index);
    let ups = 0;
    for (let i = 1; i < recent.length; i++) {
        if (recent[i].close > recent[i-1].close) ups++;
    }
    const ratio = ups / lookback;
    if (ratio >= 0.6) return 'uptrend';
    if (ratio <= 0.4) return 'downtrend';
    return 'neutral';
}

function isDoubleHarami(data, index, timeframe) {
    const config = THRESHOLDS[timeframe];
    if (!config) return false;
    const minBodySize = config.minBody;
    
    if (index < 2) return false;
    const k1 = data[index - 2], k2 = data[index - 1], k3 = data[index];
    const b1 = getBody(k1), b2 = getBody(k2), b3 = getBody(k3);
    
    if (b1.size < minBodySize) return false;
    if (b2.top > b1.top || b2.bottom < b1.bottom) return false;
    if (b3.top > b1.top || b3.bottom < b1.bottom) return false;
    if (b2.size >= b1.size * 0.5 || b3.size >= b1.size * 0.5) return false;
    
    const trend = checkTrend(data, index - 2, 5);
    if (b1.size >= minBodySize * 2) return true;
    if (trend === 'uptrend' && b1.isGreen) return true;
    if (trend === 'downtrend' && !b1.isGreen) return true;
    
    return false;
}

function formatPrice(price) {
    price = Number(price);
    if (isNaN(price)) return 'N/A';
    let result = price >= 1000 ? price.toFixed(2) : price.toFixed(4);
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

function formatTimestamp(timestamp, timeframe) {
    const date = new Date(timestamp);
    const offsets = { '1h': 60, '4h': 240, '1d': 1440 };
    date.setMinutes(date.getMinutes() + (offsets[timeframe] || 60) * 60);
    return date.toISOString().slice(0, 16).replace('T', ' ');
}

async function getBacktestStats(timeframe) {
    let data;
    const cacheDir = path.join(__dirname, '..', 'cache');
    const files = { '1h': 'btc-1h.json', '4h': 'btc-4h.json', '1d': 'btc-1d.json' };
    const cacheFile = path.join(cacheDir, files[timeframe]);
    
    if (fs.existsSync(cacheFile)) {
        const raw = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        data = raw.map(c => ({open: c[1], close: c[4], high: c[2], low: c[3]}));
    } else {
        const exchange = new ccxt.binance();
        const ohlcv = await exchange.fetchOHLCV('BTC/USDT', timeframe, undefined, 200);
        data = ohlcv.map(c => ({open: c[1], close: c[4], high: c[2], low: c[3]}));
    }
    
    let bullishWins = 0, bullishLoss = 0, bullishTotal = 0, bullishNeutral = 0;
    let bearishWins = 0, bearishLoss = 0, bearishTotal = 0, bearishNeutral = 0;
    
    for (let i = 10; i < data.length - 10; i++) {
        const k1 = data[i-2], k2 = data[i-1], k3 = data[i];
        const b1 = getBody(k1), b2 = getBody(k2), b3 = getBody(k3);
        
        // 修复1：增加趋势验证
        const trend = checkTrend(data, i - 2, 5);
        if (trend === 'neutral') continue;
        
        if (b1.size < THRESHOLDS[timeframe].minBody) continue;
        if (b2.size >= b1.size * 0.5 || b3.size >= b1.size * 0.5) continue;
        if (b2.top > b1.top || b2.bottom < b1.bottom) continue;
        if (b3.top > b1.top || b3.bottom < b1.bottom) continue;
        
        const entry = k3.close;
        const isBearish = k1.close < k1.open;
        
        const future = data.slice(i+1, i+11);
        if (future.length < 5) continue;
        
        let maxRise = 0, maxDrop = 0;
        for (const f of future) {
            const change = (f.close - entry) / entry;
            if (change > maxRise) maxRise = change;
            if (change < maxDrop) maxDrop = change;
        }
        
        // 修复2：扣除手续费
        const netProfit = isBearish ? maxDrop - FEE_RATE * 2 : maxRise - FEE_RATE * 2;
        
        if (isBearish) {
            bearishTotal++;
            if (maxDrop - FEE_RATE * 2 < -0.03) bearishWins++;
            else if (maxRise + FEE_RATE * 2 > 0.02) bearishLoss++;
            else bearishNeutral++;
        } else {
            bullishTotal++;
            if (netProfit > 0.03) bullishWins++;
            else if (netProfit < -0.02) bullishLoss++;
            else bullishNeutral++;
        }
    }
    
    const bWinRate = bearishTotal > 0 ? (bearishWins / bearishTotal * 100).toFixed(1) : 'N/A';
    const rWinRate = bullishTotal > 0 ? (bullishWins / bullishTotal * 100).toFixed(1) : 'N/A';
    return {
        bearish: bWinRate, bullish: rWinRate,
        bTotal: bearishTotal, rTotal: bullishTotal,
        bWins: bearishWins, rWins: bullishWins,
        bNeutral: bearishNeutral, rNeutral: bullishNeutral
    };
}

async function checkTimeframe(exchange, timeframe) {
    const config = THRESHOLDS[timeframe];
    if (!config) return null;
    
    let data = loadKlineFromCache(timeframe);
    if (!data || data.length < 20) {
        const limit = timeframe === '1d' ? 100 : 200;
        const ohlcv = await exchange.fetchOHLCV('BTC/USDT', timeframe, undefined, limit);
        data = ohlcv.map(c => ({
            timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5]
        }));
    }
    
    if (data.length < 10) return null;
    const index = data.length - 1;
    
    if (!isDoubleHarami(data, index, timeframe)) return null;
    
    const k1 = data[index - 2], k2 = data[index - 1], k3 = data[index];
    const b1 = getBody(k1), b2 = getBody(k2), b3 = getBody(k3);
    const trend = checkTrend(data, index - 2, 5);
    
    return {
        timeframe,
        type: b1.isGreen ? '看跌双孕线' : '看涨双孕线',
        signal: b1.isGreen ? '⬇️ 可能见顶回落' : '⬆️ 可能见底反转',
        trend: trend === 'uptrend' ? '(前期上涨)' : trend === 'downtrend' ? '(前期下跌)' : '',
        // 修复3：使用 timeframe+timestamp 作为唯一ID
        haramiId: `${timeframe}_${k3.timestamp}`,
        k1: { time: formatTimestamp(k1.timestamp, timeframe), open: k1.open, close: k1.close, body: b1.size.toFixed(2), color: b1.isGreen ? '阳线' : '阴线' },
        k2: { time: formatTimestamp(k2.timestamp, timeframe), open: k2.open, close: k2.close, body: b2.size.toFixed(2), color: b2.isGreen ? '阳线' : '阴线' },
        k3: { time: formatTimestamp(k3.timestamp, timeframe), open: k3.open, close: k3.close, body: b3.size.toFixed(2), color: b3.isGreen ? '阳线' : '阴线' }
    };
}

function sendTelegramMessage(message) {
    try {
        const cmd = `/root/.nvm/versions/node/v22.22.0/bin/openclaw message send --channel telegram --target 6311362800 --message ${JSON.stringify(message)}`;
        execSync(cmd, { stdio: 'inherit' });
        console.log('✓ 通知已发送');
    } catch (err) {
        console.error('发送通知失败:', err.message);
    }
}

function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            console.error('状态文件读取失败:', e.message);
        }
    }
    return { notified: [] };
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
    const exchange = new ccxt.binance();
    const state = loadState();
    
    console.log(`[${new Date().toISOString()} UTC] 开始检查双孕线形态...`);
    
    let foundNew = false;
    
    for (const tf of ['1h', '4h', '1d']) {
        console.log(`检查 ${THRESHOLDS[tf].name} 周期...`);
        
        try {
            const harami = await checkTimeframe(exchange, tf);
            
            // 修复3：使用 haramiId 作为唯一标识
            if (harami && !state.notified.includes(harami.haramiId)) {
                const stats = await getBacktestStats(tf);
                
                const message = "🎀 双孕线形态提醒\n\n" +
                    "🪙 交易对：BTC/USDT（币安）\n" +
                    "⏰ 周期：" + THRESHOLDS[tf].name + "\n" +
                    "📊 类型：" + harami.type + " " + harami.trend + "\n" +
                    "📅 时间：" + harami.k1.time + " ~ " + harami.k3.time + "\n" +
                    "💰 当前价格：$" + formatPrice(harami.k3.close) + "\n" +
                    "📈 历史回测（" + THRESHOLDS[tf].name + "）：\n" +
                    "   看跌形态：胜率" + stats.bearish + "% (" + stats.bWins + "/" + stats.bTotal + ", 未结算" + stats.bNeutral + ")\n" +
                    "   看涨形态：胜率" + stats.bullish + "% (" + stats.rWins + "/" + stats.rTotal + ", 未结算" + stats.rNeutral + ")\n\n" +
                    "K1 (母线): " + harami.k1.color + "\n" +
                    "  开盘: $" + formatPrice(harami.k1.open) + "\n" +
                    "  收盘: $" + formatPrice(harami.k1.close) + "\n" +
                    "  实体: $" + harami.k1.body + "\n\n" +
                    "K2 (孕线1): " + harami.k2.color + "\n" +
                    "  开盘: $" + formatPrice(harami.k2.open) + "\n" +
                    "  收盘: $" + formatPrice(harami.k2.close) + "\n" +
                    "  实体: $" + harami.k2.body + "\n\n" +
                    "K3 (孕线2): " + harami.k3.color + "\n" +
                    "  开盘: $" + formatPrice(harami.k3.open) + "\n" +
                    "  收盘: $" + formatPrice(harami.k3.close) + "\n" +
                    "  实体: $" + harami.k3.body + "\n\n" +
                    harami.signal;
                
                console.log('\n' + message + '\n');
                sendTelegramMessage(message);
                state.notified.push(harami.haramiId);
                foundNew = true;
            }
        } catch (e) {
            console.error('检查失败:', e.message);
        }
    }
    
    if (state.notified.length > 100) {
        state.notified = state.notified.slice(-100);
    }
    saveState(state);
    
    if (!foundNew) {
        console.log('未发现新的双孕线形态');
    }
}

main().catch(e => {
    console.error('监控出错:', e.message);
    process.exit(1);
});
