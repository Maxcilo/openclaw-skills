#!/usr/bin/env node
/**
 * 分析玩家已结算市场的胜率
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

// 获取市场信息（包括是否已结算）
async function getMarketInfo(conditionId) {
    try {
        const url = `https://gamma-api.polymarket.com/markets?condition_id=${conditionId}`;
        const data = await apiRequest(url);
        return data[0] || null;
    } catch (err) {
        return null;
    }
}

// 分析已结算市场的胜率
async function analyzeSettledWinRate(username, address) {
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
    
    // 按市场分组
    const markets = {};
    
    for (const trade of trades) {
        const conditionId = trade.condition_id;
        const tokenId = trade.asset_id;
        const size = parseFloat(trade.size || 0);
        const price = parseFloat(trade.price || 0);
        const side = trade.side;
        
        if (!markets[conditionId]) {
            markets[conditionId] = {
                conditionId,
                tokenId,
                trades: [],
                position: 0,
                cost: 0,
                outcome: null,
                resolved: false
            };
        }
        
        markets[conditionId].trades.push(trade);
        
        // 计算仓位和成本
        if (side === 'BUY' || side === 'buy') {
            markets[conditionId].position += size;
            markets[conditionId].cost += size * price;
        } else {
            markets[conditionId].position -= size;
            markets[conditionId].cost -= size * price;
        }
    }
    
    console.log(`📊 参与了 ${Object.keys(markets).length} 个市场\n`);
    console.log('🔍 检查市场结算状态...\n');
    
    // 检查每个市场的结算状态
    let checkedCount = 0;
    for (const [conditionId, market] of Object.entries(markets)) {
        checkedCount++;
        if (checkedCount <= 5) { // 只检查前5个，避免太多请求
            const marketInfo = await getMarketInfo(conditionId);
            if (marketInfo) {
                market.resolved = marketInfo.closed || marketInfo.resolved || false;
                market.outcome = marketInfo.outcome || null;
                market.marketName = marketInfo.question || marketInfo.title || 'Unknown';
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // 统计已结算市场
    const settledMarkets = Object.values(markets).filter(m => m.resolved);
    const unsettledMarkets = Object.values(markets).filter(m => !m.resolved);
    
    console.log(`✅ 已结算市场: ${settledMarkets.length}`);
    console.log(`⏳ 未结算市场: ${unsettledMarkets.length}`);
    console.log('');
    
    if (settledMarkets.length === 0) {
        console.log('❌ 没有已结算的市场，无法计算胜率\n');
        console.log('💡 说明：这些玩家的交易都在等待市场结算');
        console.log('   - 可能是长期市场（如2028总统选举）');
        console.log('   - 或者是最近的市场还未结算');
        console.log('');
        return {
            username,
            address,
            totalMarkets: Object.keys(markets).length,
            settledMarkets: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            note: '无已结算市场'
        };
    }
    
    // 计算胜率
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    
    console.log('📊 已结算市场详情:\n');
    console.log('市场'.padEnd(50) + '仓位'.padEnd(12) + '成本'.padEnd(15) + '结果');
    console.log('-'.repeat(80));
    
    for (const market of settledMarkets) {
        const name = (market.marketName || market.conditionId).substring(0, 48);
        const position = market.position.toFixed(2).padEnd(12);
        const cost = ('$' + market.cost.toFixed(2)).padEnd(15);
        
        let result = '';
        let profit = 0;
        
        // 如果仓位接近0，说明已平仓
        if (Math.abs(market.position) < 0.01) {
            if (market.cost > 0) {
                wins++;
                profit = market.cost;
                result = '✅ 赢 +$' + profit.toFixed(2);
            } else if (market.cost < 0) {
                losses++;
                profit = market.cost;
                result = '❌ 输 $' + profit.toFixed(2);
            } else {
                result = '➖ 平';
            }
        } else {
            // 仓位未平，根据outcome判断
            if (market.outcome) {
                // 这里需要更复杂的逻辑判断是否赢
                result = '⏳ 持仓中';
            } else {
                result = '❓ 未知';
            }
        }
        
        totalProfit += profit;
        console.log(name.padEnd(50) + position + cost + result);
    }
    
    console.log('');
    
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
    
    console.log('📊 胜率统计:');
    console.log('已结算交易:', total);
    console.log('赢的次数:', wins);
    console.log('输的次数:', losses);
    console.log('真实胜率:', winRate + '%');
    console.log('总盈亏:', '$' + totalProfit.toFixed(2));
    console.log('');
    
    return {
        username,
        address,
        totalMarkets: Object.keys(markets).length,
        settledMarkets: settledMarkets.length,
        wins,
        losses,
        winRate: parseFloat(winRate),
        totalProfit: totalProfit.toFixed(2)
    };
}

// 批量分析
async function analyzeBatch(players) {
    console.log('='.repeat(80));
    console.log('批量分析玩家胜率');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    
    for (const [username, address] of Object.entries(players)) {
        const result = await analyzeSettledWinRate(username, address);
        if (result) {
            results.push(result);
        }
        console.log('');
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 按胜率排序
    results.sort((a, b) => b.winRate - a.winRate);
    
    console.log('='.repeat(80));
    console.log('胜率排名');
    console.log('='.repeat(80));
    console.log('');
    console.log('排名'.padEnd(6) + '玩家'.padEnd(20) + '已结算'.padEnd(10) + '胜率'.padEnd(12) + '盈亏');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.padEnd(20);
        const settled = r.settledMarkets.toString().padEnd(10);
        const winRate = (r.winRate + '%').padEnd(12);
        const profit = '$' + r.totalProfit;
        console.log(rank + name + settled + winRate + profit);
    });
    
    console.log('');
    console.log('='.repeat(80));
    
    return results;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket 胜率分析工具');
    console.log('');
    console.log('用法:');
    console.log('  node analyze-winrate.js <username> <address>    - 分析单个玩家');
    console.log('  node analyze-winrate.js batch                   - 批量分析');
    console.log('');
    console.log('示例:');
    console.log('  node analyze-winrate.js kch123 0x6a72...3ee');
    console.log('  node analyze-winrate.js batch');
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
    
    analyzeSettledWinRate(username, address).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
}

module.exports = { analyzeSettledWinRate, analyzeBatch };
