#!/usr/bin/env node
/**
 * 使用公开API获取玩家数据（不需要认证）
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

// 获取玩家交易历史（公开API）
async function getPlayerTrades(address) {
    console.log(`📊 获取玩家 ${address} 的交易历史...\n`);
    
    try {
        // 使用Data API（公开）
        const url = `https://data-api.polymarket.com/trades?user=${address}&limit=100`;
        console.log(`请求: ${url}\n`);
        
        const data = await apiRequest(url);
        
        if (Array.isArray(data)) {
            console.log(`✅ 找到 ${data.length} 条交易记录\n`);
            return data;
        } else {
            console.log('❌ 数据格式错误');
            console.log(data);
            return [];
        }
    } catch (err) {
        console.error('❌ 获取失败:', err.message);
        return [];
    }
}

// 计算真实胜率
function calculateWinRate(trades) {
    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalProfit: 0,
            totalVolume: 0
        };
    }
    
    // 按市场分组
    const markets = {};
    let totalVolume = 0;
    
    for (const trade of trades) {
        const marketId = trade.market || trade.asset_id;
        const size = parseFloat(trade.size || 0);
        const price = parseFloat(trade.price || 0);
        const value = size * price;
        
        totalVolume += value;
        
        if (!markets[marketId]) {
            markets[marketId] = {
                trades: [],
                position: 0,
                cost: 0
            };
        }
        
        markets[marketId].trades.push(trade);
        
        if (trade.side === 'BUY' || trade.side === 'buy') {
            markets[marketId].position += size;
            markets[marketId].cost += value;
        } else {
            markets[marketId].position -= size;
            markets[marketId].cost -= value;
        }
    }
    
    // 计算已平仓市场的盈亏
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    
    for (const [marketId, market] of Object.entries(markets)) {
        // 如果仓位接近0，认为已平仓
        if (Math.abs(market.position) < 0.01) {
            if (market.cost > 0) {
                wins++;
                totalProfit += market.cost;
            } else if (market.cost < 0) {
                losses++;
                totalProfit += market.cost;
            }
        }
    }
    
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
    
    return {
        totalTrades: total,
        wins,
        losses,
        winRate: parseFloat(winRate),
        totalProfit: totalProfit.toFixed(2),
        totalVolume: totalVolume.toFixed(2),
        openPositions: Object.keys(markets).length - total
    };
}

// 分析玩家
async function analyzePlayer(username, address) {
    console.log('='.repeat(80));
    console.log(`分析玩家: ${username}`);
    console.log('地址:', address);
    console.log('='.repeat(80));
    console.log('');
    
    const trades = await getPlayerTrades(address);
    
    if (trades.length === 0) {
        console.log('❌ 没有找到交易记录\n');
        return null;
    }
    
    const stats = calculateWinRate(trades);
    
    console.log('📊 统计数据:');
    console.log('已平仓交易:', stats.totalTrades);
    console.log('赢的次数:', stats.wins);
    console.log('输的次数:', stats.losses);
    console.log('真实胜率:', stats.winRate + '%');
    console.log('总盈利:', '$' + stats.totalProfit);
    console.log('总交易量:', '$' + stats.totalVolume);
    console.log('未平仓位:', stats.openPositions);
    console.log('');
    
    return {
        username,
        address,
        ...stats
    };
}

// 批量分析
async function analyzeBatch(players) {
    console.log('='.repeat(80));
    console.log('批量分析玩家');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    
    for (const [username, address] of Object.entries(players)) {
        const result = await analyzePlayer(username, address);
        if (result) {
            results.push(result);
        }
        console.log('');
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 按胜率排序
    results.sort((a, b) => b.winRate - a.winRate);
    
    console.log('='.repeat(80));
    console.log('分析结果汇总');
    console.log('='.repeat(80));
    console.log('');
    console.log('排名'.padEnd(6) + '玩家'.padEnd(20) + '交易'.padEnd(8) + '胜率'.padEnd(10) + '盈利');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.padEnd(20);
        const trades = r.totalTrades.toString().padEnd(8);
        const winRate = (r.winRate + '%').padEnd(10);
        const profit = '$' + r.totalProfit;
        console.log(rank + name + trades + winRate + profit);
    });
    
    console.log('');
    console.log('='.repeat(80));
    
    return results;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket 玩家分析工具（公开API）');
    console.log('');
    console.log('用法:');
    console.log('  node analyze-players.js <username> <address>    - 分析单个玩家');
    console.log('  node analyze-players.js batch                   - 批量分析');
    console.log('');
    console.log('示例:');
    console.log('  node analyze-players.js kch123 0x6a72...3ee');
    console.log('  node analyze-players.js batch');
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
    
    analyzePlayer(username, address).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
}

module.exports = { getPlayerTrades, calculateWinRate, analyzePlayer, analyzeBatch };
