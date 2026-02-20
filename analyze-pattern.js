#!/usr/bin/env node
/**
 * 分析玩家最近100条交易的模式和专注领域
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

// 获取市场信息
async function getMarketInfo(conditionId) {
    try {
        const url = `https://gamma-api.polymarket.com/markets?condition_id=${conditionId}`;
        const data = await apiRequest(url);
        return data[0] || null;
    } catch (err) {
        return null;
    }
}

// 分析交易模式
async function analyzeTradePattern(username, address) {
    console.log('='.repeat(80));
    console.log(`分析玩家: ${username}`);
    console.log('地址:', address);
    console.log('='.repeat(80));
    console.log('');
    
    // 获取交易记录
    const url = `https://data-api.polymarket.com/trades?user=${address}&limit=100`;
    console.log(`📊 获取最近100条交易...\n`);
    
    const trades = await apiRequest(url);
    
    if (!Array.isArray(trades) || trades.length === 0) {
        console.log('❌ 没有找到交易记录\n');
        return null;
    }
    
    console.log(`✅ 找到 ${trades.length} 条交易记录\n`);
    
    // 统计数据
    const stats = {
        totalTrades: trades.length,
        totalVolume: 0,
        buyCount: 0,
        sellCount: 0,
        markets: {},
        categories: {},
        avgTradeSize: 0,
        largestTrade: 0,
        smallestTrade: Infinity
    };
    
    // 分析每笔交易
    for (const trade of trades) {
        const size = parseFloat(trade.size || 0);
        const price = parseFloat(trade.price || 0);
        const value = size * price;
        
        stats.totalVolume += value;
        
        if (trade.side === 'BUY' || trade.side === 'buy') {
            stats.buyCount++;
        } else {
            stats.sellCount++;
        }
        
        // 记录市场
        const marketId = trade.market || trade.asset_id;
        if (!stats.markets[marketId]) {
            stats.markets[marketId] = {
                count: 0,
                volume: 0,
                name: trade.market_slug || marketId
            };
        }
        stats.markets[marketId].count++;
        stats.markets[marketId].volume += value;
        
        // 更新交易大小统计
        if (value > stats.largestTrade) stats.largestTrade = value;
        if (value < stats.smallestTrade) stats.smallestTrade = value;
    }
    
    stats.avgTradeSize = stats.totalVolume / stats.totalTrades;
    
    // 按交易次数排序市场
    const topMarkets = Object.entries(stats.markets)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);
    
    // 显示统计
    console.log('📊 交易统计:');
    console.log('总交易次数:', stats.totalTrades);
    console.log('总交易量:', '$' + stats.totalVolume.toFixed(2));
    console.log('买入次数:', stats.buyCount);
    console.log('卖出次数:', stats.sellCount);
    console.log('买卖比:', (stats.buyCount / stats.sellCount).toFixed(2));
    console.log('平均交易额:', '$' + stats.avgTradeSize.toFixed(2));
    console.log('最大单笔:', '$' + stats.largestTrade.toFixed(2));
    console.log('最小单笔:', '$' + stats.smallestTrade.toFixed(2));
    console.log('');
    
    console.log('🎯 Top 10 交易市场:');
    console.log('排名'.padEnd(6) + '次数'.padEnd(8) + '交易量'.padEnd(15) + '市场');
    console.log('-'.repeat(80));
    
    topMarkets.forEach(([marketId, data], i) => {
        const rank = (i + 1).toString().padEnd(6);
        const count = data.count.toString().padEnd(8);
        const volume = ('$' + data.volume.toFixed(0)).padEnd(15);
        const name = (data.name || marketId).substring(0, 50);
        console.log(rank + count + volume + name);
    });
    
    console.log('');
    
    // 判断专注度
    const topMarketCount = topMarkets[0][1].count;
    const concentration = (topMarketCount / stats.totalTrades * 100).toFixed(1);
    
    console.log('🔍 专注度分析:');
    console.log('最常交易市场占比:', concentration + '%');
    
    if (concentration > 50) {
        console.log('✅ 高度专注 - 单一市场专家');
    } else if (concentration > 30) {
        console.log('⚠️  中度专注 - 偏好某些市场');
    } else {
        console.log('❌ 分散交易 - 多市场参与');
    }
    
    console.log('');
    
    return {
        username,
        address,
        ...stats,
        topMarkets,
        concentration: parseFloat(concentration)
    };
}

// 批量分析
async function analyzeBatch(players) {
    console.log('='.repeat(80));
    console.log('批量分析玩家交易模式');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    
    for (const [username, address] of Object.entries(players)) {
        const result = await analyzeTradePattern(username, address);
        if (result) {
            results.push(result);
        }
        console.log('');
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 按专注度排序
    results.sort((a, b) => b.concentration - a.concentration);
    
    console.log('='.repeat(80));
    console.log('专注度排名（单一赛道专家）');
    console.log('='.repeat(80));
    console.log('');
    console.log('排名'.padEnd(6) + '玩家'.padEnd(20) + '专注度'.padEnd(12) + '交易次数'.padEnd(12) + '评价');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.padEnd(20);
        const conc = (r.concentration + '%').padEnd(12);
        const trades = r.totalTrades.toString().padEnd(12);
        
        let rating = '';
        if (r.concentration > 50) {
            rating = '⭐⭐⭐ 单一赛道专家';
        } else if (r.concentration > 30) {
            rating = '⭐⭐ 偏好型';
        } else {
            rating = '⭐ 分散型';
        }
        
        console.log(rank + name + conc + trades + rating);
    });
    
    console.log('');
    console.log('='.repeat(80));
    
    return results;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket 交易模式分析工具');
    console.log('');
    console.log('用法:');
    console.log('  node analyze-pattern.js <username> <address>    - 分析单个玩家');
    console.log('  node analyze-pattern.js batch                   - 批量分析');
    console.log('');
    console.log('示例:');
    console.log('  node analyze-pattern.js kch123 0x6a72...3ee');
    console.log('  node analyze-pattern.js batch');
    process.exit(0);
}

const command = args[0];

if (command === 'batch') {
    // 加载玩家列表
    const { players } = require('./player-addresses.js');
    
    analyzeBatch(players).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
} else {
    const username = args[0];
    const address = args[1];
    
    if (!address) {
        console.error('❌ 请提供用户名和地址');
        process.exit(1);
    }
    
    analyzeTradePattern(username, address).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
}

module.exports = { analyzeTradePattern, analyzeBatch };
