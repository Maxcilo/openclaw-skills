#!/usr/bin/env node
/**
 * 通过Gamma API搜索玩家信息
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

// 搜索玩家
async function searchPlayer(username) {
    console.log(`🔍 搜索玩家: ${username}\n`);
    
    // 尝试不同的API端点
    const endpoints = [
        `https://gamma-api.polymarket.com/users?username=${username}`,
        `https://gamma-api.polymarket.com/profile/${username}`,
        `https://data-api.polymarket.com/users/${username}`,
        `https://clob.polymarket.com/users/${username}`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`尝试: ${endpoint}`);
            const data = await apiRequest(endpoint);
            
            if (data && typeof data === 'object') {
                console.log('✅ 找到数据:');
                console.log(JSON.stringify(data, null, 2));
                return data;
            } else {
                console.log('❌ 无数据');
            }
        } catch (err) {
            console.log(`❌ 失败: ${err.message}`);
        }
        console.log('');
    }
    
    return null;
}

// 从排行榜获取玩家地址
async function getLeaderboard(timeframe = 'weekly') {
    console.log(`📊 获取${timeframe}排行榜...\n`);
    
    try {
        const url = `https://gamma-api.polymarket.com/leaderboard?timeframe=${timeframe}`;
        console.log(`请求: ${url}\n`);
        
        const data = await apiRequest(url);
        
        if (data && Array.isArray(data)) {
            console.log(`✅ 找到 ${data.length} 个玩家\n`);
            
            // 显示前10名
            console.log('排名'.padEnd(6) + '用户名'.padEnd(25) + '地址');
            console.log('-'.repeat(80));
            
            data.slice(0, 10).forEach((player, i) => {
                const rank = (i + 1).toString().padEnd(6);
                const name = (player.username || player.name || 'Unknown').padEnd(25);
                const addr = player.address || player.wallet || 'N/A';
                console.log(rank + name + addr);
            });
            
            return data;
        } else {
            console.log('❌ 数据格式错误');
            console.log(data);
        }
    } catch (err) {
        console.error('❌ 获取失败:', err.message);
    }
    
    return null;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket 玩家搜索工具');
    console.log('');
    console.log('用法:');
    console.log('  node search-players.js search <username>    - 搜索玩家');
    console.log('  node search-players.js leaderboard          - 获取排行榜');
    console.log('');
    console.log('示例:');
    console.log('  node search-players.js search kch123');
    console.log('  node search-players.js leaderboard');
    process.exit(0);
}

const command = args[0];

if (command === 'search') {
    const username = args[1];
    if (!username) {
        console.error('❌ 请提供用户名');
        process.exit(1);
    }
    
    searchPlayer(username).then(() => {
        process.exit(0);
    });
} else if (command === 'leaderboard') {
    getLeaderboard('weekly').then(() => {
        process.exit(0);
    });
} else {
    console.error('❌ 未知命令:', command);
    process.exit(1);
}

module.exports = { searchPlayer, getLeaderboard };
