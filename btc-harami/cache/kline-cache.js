#!/usr/bin/env node
/**
 * BTC K线缓存 - 增量更新
 * 每天从币安获取最新K线数据，合并到本地缓存
 */

const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname);
const TIMEFRAMES = {
    '1h': { file: 'btc-1h.json', limit: 500 },
    '4h': { file: 'btc-4h.json', limit: 500 },
    '1d': { file: 'btc-1d.json', limit: 365 }
};

const exchange = new ccxt.binance();

async function loadCache(tf) {
    const file = path.join(CACHE_DIR, TIMEFRAMES[tf].file);
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    return [];
}

async function saveCache(tf, data) {
    const file = path.join(CACHE_DIR, TIMEFRAMES[tf].file);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function fetchAndMerge(tf) {
    const config = TIMEFRAMES[tf];
    const cache = await loadCache(tf);
    
    // 获取最新数据
    const latestTimestamp = cache.length > 0 
        ? Math.max(...cache.map(c => c[0])) 
        : 0;
    
    // 获取新数据 (从最新时间往后)
    const since = latestTimestamp + 1;
    let ohlcv;
    
    if (since > Date.now() - 60000) {
        console.log(`  ${tf}: 缓存已是最新`);
        return { updated: false, count: 0 };
    }
    
    try {
        ohlcv = await exchange.fetchOHLCV('BTC/USDT', tf, since, config.limit);
    } catch (e) {
        // 如果有错误，尝试从头获取
        console.log(`  ${tf}: 获取新数据失败，尝试全量更新`);
        ohlcv = await exchange.fetchOHLCV('BTC/USDT', tf, undefined, config.limit);
    }
    
    if (ohlcv.length === 0) {
        console.log(`  ${tf}: 无新数据`);
        return { updated: false, count: 0 };
    }
    
    // 合并数据 (按时间戳去重)
    const timestampSet = new Set(cache.map(c => c[0]));
    const newCandles = ohlcv.filter(c => !timestampSet.has(c[0]));
    
    if (newCandles.length === 0) {
        console.log(`  ${tf}: 无新增K线`);
        return { updated: false, count: 0 };
    }
    
    // 合并并排序
    const merged = [...cache, ...newCandles].sort((a, b) => a[0] - b[0]);
    
    // 保留最新 limit 条
    const trimmed = merged.slice(-config.limit);
    
    await saveCache(tf, trimmed);
    console.log(`  ${tf}: +${newCandles.length} 条 (共${trimmed.length}条)`);
    
    return { updated: true, count: newCandles.length, total: trimmed.length };
}

async function fullRefresh(tf) {
    const config = TIMEFRAMES[tf];
    console.log(`  ${tf}: 全量更新...`);
    
    const ohlcv = await exchange.fetchOHLCV('BTC/USDT', tf, undefined, config.limit);
    const data = ohlcv.sort((a, b) => a[0] - b[0]);
    
    await saveCache(tf, data);
    console.log(`  ${tf}: ${data.length} 条K线已保存`);
    
    return { updated: true, count: data.length };
}

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'update';
    
    console.log(`📊 BTC K线缓存管理 [${mode}]`);
    console.log('='.repeat(40));
    
    const results = [];
    
    if (mode === 'refresh') {
        // 全量刷新
        for (const tf of Object.keys(TIMEFRAMES)) {
            await fullRefresh(tf);
        }
    } else {
        // 增量更新
        for (const tf of Object.keys(TIMEFRAMES)) {
            const result = await fetchAndMerge(tf);
            results.push({ tf, ...result });
        }
    }
    
    console.log('='.repeat(40));
    const hasUpdate = results.some(r => r.updated);
    console.log(hasUpdate ? '✅ 更新完成' : '📝 已是最新');
    
    return hasUpdate ? 0 : 1;
}

main().catch(e => {
    console.error('错误:', e.message);
    process.exit(1);
});
