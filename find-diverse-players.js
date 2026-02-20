#!/usr/bin/env node
/**
 * 从历史总榜找多样化玩家
 */

const https = require('https');

function apiRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

// 快速评估（查看更多交易）
async function deepEvaluate(username, address) {
    // 获取更多交易记录
    const url = `https://data-api.polymarket.com/trades?user=${address}&limit=500`;
    const trades = await apiRequest(url);
    
    if (!Array.isArray(trades) || trades.length === 0) {
        return null;
    }
    
    // 统计市场
    const markets = {};
    let totalVolume = 0;
    let buyCount = 0;
    let sellCount = 0;
    
    for (const trade of trades) {
        const marketId = trade.condition_id || trade.market;
        const size = parseFloat(trade.size || 0);
        const price = parseFloat(trade.price || 0);
        const value = size * price;
        
        totalVolume += value;
        
        if (!markets[marketId]) {
            markets[marketId] = { count: 0, volume: 0 };
        }
        markets[marketId].count++;
        markets[marketId].volume += value;
        
        if (trade.side === 'BUY' || trade.side === 'buy') {
            buyCount++;
        } else {
            sellCount++;
        }
    }
    
    const marketCount = Object.keys(markets).length;
    const diversity = (marketCount / trades.length * 100).toFixed(1);
    
    // 找出最常交易的市场
    const topMarket = Object.entries(markets)
        .sort((a, b) => b[1].count - a[1].count)[0];
    
    const topMarketRatio = (topMarket[1].count / trades.length * 100).toFixed(1);
    
    return {
        username,
        address,
        tradeCount: trades.length,
        marketCount,
        diversity: parseFloat(diversity),
        totalVolume: totalVolume.toFixed(0),
        buyCount,
        sellCount,
        buySellRatio: sellCount > 0 ? (buyCount / sellCount).toFixed(2) : 'Inf',
        topMarketRatio: parseFloat(topMarketRatio),
        score: marketCount * 10 + (sellCount > 10 ? 50 : 0) + (marketCount > 5 ? 30 : 0)
    };
}

// 历史总榜玩家（从之前获取的）
const historicalPlayers = [
    { username: 'Theo4', address: '需要查找' },
    { username: 'Fredi9999', address: '需要查找' },
    { username: 'RepTrump', address: '需要查找' },
    { username: 'Len9311238', address: '需要查找' },
    { username: 'zxgngl', address: '需要查找' },
    { username: 'PrincessCaro', address: '需要查找' },
    { username: 'walletmobile', address: '需要查找' },
    { username: 'BetTom42', address: '需要查找' },
    { username: 'mikatrade77', address: '需要查找' },
    { username: 'alexmulti', address: '需要查找' },
    { username: 'Jenzigo', address: '需要查找' },
    { username: 'GCottrell93', address: '需要查找' }
];

console.log('='.repeat(80));
console.log('建议：从历史总榜找玩家');
console.log('='.repeat(80));
console.log('');
console.log('当前问题：');
console.log('- 本周排行榜玩家都在交易同一个市场');
console.log('- 无法评估真实胜率和多样性');
console.log('');
console.log('解决方案：');
console.log('1. 访问 https://polymarket.com/leaderboard');
console.log('2. 切换到 "All" (历史总榜)');
console.log('3. 获取历史总榜玩家地址');
console.log('4. 分析他们的长期交易记录');
console.log('');
console.log('或者：');
console.log('- 等待本周市场结算后再分析');
console.log('- 查看其他时间段的排行榜');
console.log('');

module.exports = { deepEvaluate };
