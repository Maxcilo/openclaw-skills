#!/usr/bin/env node
/**
 * 快速筛选活跃且多样化的玩家
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

// 快速评估玩家
async function quickEvaluate(username, address) {
    const url = `https://data-api.polymarket.com/trades?user=${address}&limit=100`;
    const trades = await apiRequest(url);
    
    if (!Array.isArray(trades) || trades.length === 0) {
        return null;
    }
    
    // 统计市场数量
    const markets = new Set();
    let totalVolume = 0;
    let buyCount = 0;
    let sellCount = 0;
    
    for (const trade of trades) {
        markets.add(trade.condition_id || trade.market);
        const size = parseFloat(trade.size || 0);
        const price = parseFloat(trade.price || 0);
        totalVolume += size * price;
        
        if (trade.side === 'BUY' || trade.side === 'buy') {
            buyCount++;
        } else {
            sellCount++;
        }
    }
    
    const marketCount = markets.size;
    const diversity = (marketCount / trades.length * 100).toFixed(1);
    const buySellRatio = sellCount > 0 ? (buyCount / sellCount).toFixed(2) : 'Inf';
    
    return {
        username,
        address,
        tradeCount: trades.length,
        marketCount,
        diversity: parseFloat(diversity),
        totalVolume: totalVolume.toFixed(0),
        buySellRatio,
        score: marketCount * 10 + (sellCount > 0 ? 20 : 0) // 评分：市场多样性 + 有卖出
    };
}

// 批量筛选
async function screenPlayers(players) {
    console.log('='.repeat(80));
    console.log('快速筛选活跃玩家');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    let count = 0;
    
    for (const player of players) {
        count++;
        console.log(`[${count}/${players.length}] 评估 ${player.username}...`);
        
        const result = await quickEvaluate(player.username, player.address);
        if (result) {
            results.push(result);
            console.log(`  ✅ ${result.marketCount}个市场, 多样性${result.diversity}%, 买卖比${result.buySellRatio}`);
        } else {
            console.log(`  ❌ 无交易记录`);
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('筛选结果');
    console.log('='.repeat(80));
    console.log('');
    
    // 按评分排序
    results.sort((a, b) => b.score - a.score);
    
    console.log('排名'.padEnd(6) + '玩家'.padEnd(25) + '市场数'.padEnd(10) + '多样性'.padEnd(12) + '买卖比'.padEnd(10) + '评分');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.substring(0, 23).padEnd(25);
        const markets = r.marketCount.toString().padEnd(10);
        const diversity = (r.diversity + '%').padEnd(12);
        const ratio = r.buySellRatio.padEnd(10);
        const score = r.score;
        
        console.log(rank + name + markets + diversity + ratio + score);
    });
    
    console.log('');
    console.log('='.repeat(80));
    console.log('推荐跟单玩家（市场多样性高 + 有卖出操作）');
    console.log('='.repeat(80));
    console.log('');
    
    const recommended = results.filter(r => r.marketCount >= 3 && r.buySellRatio !== 'Inf').slice(0, 10);
    
    if (recommended.length === 0) {
        console.log('❌ 没有找到符合条件的玩家');
        console.log('');
        console.log('建议：');
        console.log('1. 扩大搜索范围（查看更多排行榜玩家）');
        console.log('2. 降低筛选标准（接受2个市场）');
        console.log('3. 查看历史排行榜（All time）');
    } else {
        recommended.forEach((r, i) => {
            console.log(`${i + 1}. ${r.username}`);
            console.log(`   地址: ${r.address}`);
            console.log(`   市场数: ${r.marketCount}, 多样性: ${r.diversity}%, 买卖比: ${r.buySellRatio}`);
            console.log('');
        });
    }
    
    return results;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket 玩家筛选工具');
    console.log('');
    console.log('用法:');
    console.log('  node screen-players.js                - 筛选本周排行榜玩家');
    console.log('');
    process.exit(0);
}

// 新玩家列表
const newPlayers = [
    { username: 'MrSparklySimpsons', address: '0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6' },
    { username: 'tbs8t', address: '0x4bd74aef0ee5f1ec0718890f55c15f047e28373e' },
    { username: 'BWArmageddon', address: '0x9976874011b081e1e408444c579f48aa5b5967da' },
    { username: '0x8dxd', address: '0x63ce342161250d705dc0b16df89036c8e5f9ba9a' },
    { username: 'WOMENBESHOPPING', address: '0x13414a77a4be48988851c73dfd824d0168e70853' },
    { username: 'chungguskhan', address: '0x7744bfd749a70020d16a1fcbac1d064761c9999e' },
    { username: 'C.SIN', address: '0x91654fd592ea5339fc0b1b2f2b30bfffa5e75b98' },
    { username: 'hioa', address: '0xccb290b1c145d1c95695d3756346bba9f1398586' },
    { username: 'Vanchalkenstein', address: '0x9c16127eccf031df45461ef1e04b52ea286a09cb' },
    { username: 'HorizonSplendidView', address: '0x02227b8f5a9636e895607edd3185ed6ee5598ff7' },
    { username: 'bossoskil1', address: '0xa5ea13a81d2b7e8e424b182bdc1db08e756bd96a' },
    { username: 'MCgenius', address: '0x0b9cae2b0dfe7a71c413e0604eaac1c352f87e44' }
];

screenPlayers(newPlayers).then(() => {
    process.exit(0);
}).catch(err => {
    console.error('筛选失败:', err);
    process.exit(1);
});

module.exports = { quickEvaluate, screenPlayers };
