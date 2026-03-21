#!/usr/bin/env node
/**
 * BTC 日线双孕线回测脚本
 * 回测 2025年至今的所有双孕线形态，计算胜率
 */

const ccxt = require('ccxt');

// 计算K线实体
function getBody(candle) {
    return {
        top: Math.max(candle.open, candle.close),
        bottom: Math.min(candle.open, candle.close),
        size: Math.abs(candle.close - candle.open),
        isGreen: candle.close > candle.open
    };
}

// 检查是否为双孕线
function isDoubleHarami(k1, k2, k3, minBodySize = 500) {
    const b1 = getBody(k1);
    const b2 = getBody(k2);
    const b3 = getBody(k3);
    
    if (b1.size < minBodySize) return false;
    
    const k2Inside = b2.top <= b1.top && b2.bottom >= b1.bottom;
    const k3Inside = b3.top <= b1.top && b3.bottom >= b1.bottom;
    
    const k2Small = b2.size < b1.size * 0.5;
    const k3Small = b3.size < b1.size * 0.5;
    
    return k2Inside && k3Inside && k2Small && k3Small;
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

// 验证形态后续走势
function validateSignal(data, index, type) {
    // 看后续 5根K线（5天）的走势
    const k3 = data[index];
    const future = data.slice(index + 1, index + 6);
    
    if (future.length < 5) return null;
    
    const entryPrice = k3.close;
    const highestHigh = Math.max(...future.map(k => k.high));
    const lowestLow = Math.min(...future.map(k => k.low));
    
    const upMove = ((highestHigh - entryPrice) / entryPrice) * 100;
    const downMove = ((entryPrice - lowestLow) / entryPrice) * 100;
    
    let result = 'neutral';
    let profit = 0;
    
    if (type === '看涨双孕线') {
        if (upMove > 2.0) {
            result = 'win';
            profit = upMove;
        } else if (downMove > 2.0) {
            result = 'loss';
            profit = -downMove;
        }
    } else {
        if (downMove > 2.0) {
            result = 'win';
            profit = downMove;
        } else if (upMove > 2.0) {
            result = 'loss';
            profit = -upMove;
        }
    }
    
    return {
        result,
        profit: profit.toFixed(2),
        upMove: upMove.toFixed(2),
        downMove: downMove.toFixed(2),
        highestHigh,
        lowestLow
    };
}

async function backtest() {
    console.log('开始回测 2025年至今的 日线双孕线形态...\n');
    
    try {
        const exchange = new ccxt.binance();
        
        const startDate = new Date('2025-01-01T00:00:00Z').getTime();
        const now = Date.now();
        
        console.log('获取日线数据...');
        const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1d', startDate, 500);
        
        const allData = ohlcv.map(candle => ({
            timestamp: candle[0],
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5]
        }));
        
        console.log(`\n共获取 ${allData.length} 根日线K线\n`);
        console.log('='.repeat(80));
        
        const haramis = [];
        
        for (let i = 0; i < allData.length - 7; i++) {
            const k1 = allData[i];
            const k2 = allData[i + 1];
            const k3 = allData[i + 2];
            
            if (isDoubleHarami(k1, k2, k3)) {
                const b1 = getBody(k1);
                const type = b1.isGreen ? '看跌双孕线' : '看涨双孕线';
                
                const validation = validateSignal(allData, i + 2, type);
                
                if (validation) {
                    haramis.push({
                        index: i,
                        time: formatTime(k1.timestamp),
                        type,
                        entryPrice: k3.close,
                        entryDate: formatTime(k3.timestamp),
                        ...validation
                    });
                }
            }
        }
        
        console.log(`\n找到 ${haramis.length} 个双孕线形态\n`);
        
        let wins = 0;
        let losses = 0;
        let neutrals = 0;
        let totalProfit = 0;
        
        const bullishHaramis = haramis.filter(h => h.type === '看涨双孕线');
        const bearishHaramis = haramis.filter(h => h.type === '看跌双孕线');
        
        console.log('所有形态详情：\n');
        
        haramis.forEach((h, idx) => {
            const emoji = h.result === 'win' ? '✅' : h.result === 'loss' ? '❌' : '⚪';
            console.log(`${emoji} #${idx + 1} ${h.type}`);
            console.log(`   时间: ${h.time} ~ ${h.entryDate}`);
            console.log(`   入场: $${h.entryPrice.toLocaleString()}`);
            console.log(`   后续5天: 最高+${h.upMove}% / 最低-${h.downMove}%`);
            console.log(`   结果: ${h.result} (${h.profit > 0 ? '+' : ''}${h.profit}%)`);
            console.log('');
            
            if (h.result === 'win') wins++;
            else if (h.result === 'loss') losses++;
            else neutrals++;
            
            totalProfit += parseFloat(h.profit);
        });
        
        console.log('='.repeat(80));
        console.log('\n📊 回测统计\n');
        console.log(`总形态数: ${haramis.length}`);
        console.log(`  看涨双孕线: ${bullishHaramis.length}`);
        console.log(`  看跌双孕线: ${bearishHaramis.length}`);
        console.log('');
        console.log(`胜: ${wins} (${((wins / haramis.length) * 100).toFixed(1)}%)`);
        console.log(`负: ${losses} (${((losses / haramis.length) * 100).toFixed(1)}%)`);
        console.log(`平: ${neutrals} (${((neutrals / haramis.length) * 100).toFixed(1)}%)`);
        console.log('');
        console.log(`总盈亏: ${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(2)}%`);
        console.log(`平均盈亏: ${(totalProfit / haramis.length).toFixed(2)}%`);
        console.log('');
        
        const bullishWins = bullishHaramis.filter(h => h.result === 'win').length;
        const bearishWins = bearishHaramis.filter(h => h.result === 'win').length;
        
        if (bullishHaramis.length > 0) {
            console.log(`看涨双孕线胜率: ${((bullishWins / bullishHaramis.length) * 100).toFixed(1)}%`);
        }
        if (bearishHaramis.length > 0) {
            console.log(`看跌双孕线胜率: ${((bearishWins / bearishHaramis.length) * 100).toFixed(1)}%`);
        }
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('回测出错:', error.message);
    }
}

backtest().then(() => {
    console.log('\n回测完成');
    process.exit(0);
}).catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
});
