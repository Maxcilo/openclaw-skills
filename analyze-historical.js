#!/usr/bin/env node
const { historicalPlayers } = require('./historical-players.js');
const { deepEvaluate } = require('./find-diverse-players.js');

async function main() {
    console.log('='.repeat(80));
    console.log('分析历史总榜玩家');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    let count = 0;
    
    for (const [username, address] of Object.entries(historicalPlayers)) {
        count++;
        console.log(`[${count}/${Object.keys(historicalPlayers).length}] 分析 ${username}...`);
        
        const result = await deepEvaluate(username, address);
        if (result) {
            results.push(result);
            console.log(`  ✅ ${result.marketCount}个市场, 多样性${result.diversity}%, 买卖比${result.buySellRatio}`);
        } else {
            console.log(`  ❌ 无交易记录`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('分析结果');
    console.log('='.repeat(80));
    console.log('');
    
    results.sort((a, b) => b.score - a.score);
    
    console.log('排名'.padEnd(6) + '玩家'.padEnd(20) + '市场数'.padEnd(10) + '多样性'.padEnd(12) + '买卖比'.padEnd(10) + '评分');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.padEnd(20);
        const markets = r.marketCount.toString().padEnd(10);
        const diversity = (r.diversity + '%').padEnd(12);
        const ratio = r.buySellRatio.padEnd(10);
        console.log(rank + name + markets + diversity + ratio + r.score);
    });
    
    console.log('');
    console.log('='.repeat(80));
    console.log('推荐跟单玩家（多市场 + 活跃交易）');
    console.log('='.repeat(80));
    console.log('');
    
    const recommended = results.filter(r => r.marketCount >= 5 && r.sellCount > 10).slice(0, 10);
    
    recommended.forEach((r, i) => {
        console.log(`${i + 1}. ${r.username}`);
        console.log(`   地址: ${r.address}`);
        console.log(`   市场数: ${r.marketCount}, 交易: ${r.tradeCount}, 买卖比: ${r.buySellRatio}`);
        console.log('');
    });
}

main().then(() => process.exit(0)).catch(err => {
    console.error('分析失败:', err);
    process.exit(1);
});
