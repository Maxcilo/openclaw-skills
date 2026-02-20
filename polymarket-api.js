#!/usr/bin/env node
/**
 * Polymarket API 客户端
 * 用于获取玩家交易历史和计算真实胜率
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API基础URL
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

// 发起API请求
function apiRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 获取用户交易历史
async function getUserTrades(address) {
    try {
        console.log(`获取用户 ${address} 的交易历史...`);
        
        // 尝试不同的API端点
        const endpoints = [
            `${DATA_API}/trades?user=${address}`,
            `${CLOB_API}/trades?maker=${address}`,
            `${DATA_API}/positions?user=${address}`
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`尝试: ${endpoint}`);
                const data = await apiRequest(endpoint);
                return data;
            } catch (err) {
                console.log(`失败: ${err.message}`);
            }
        }
        
        throw new Error('所有API端点都失败了');
        
    } catch (error) {
        console.error('获取交易历史失败:', error.message);
        return null;
    }
}

// 计算真实胜率
function calculateWinRate(trades) {
    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            winRate: 0
        };
    }
    
    let wins = 0;
    let losses = 0;
    let total = 0;
    
    for (const trade of trades) {
        // 根据实际API响应结构调整
        if (trade.resolved || trade.status === 'closed') {
            total++;
            if (trade.profit > 0 || trade.pnl > 0) {
                wins++;
            } else {
                losses++;
            }
        }
    }
    
    const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
    
    return {
        totalTrades: total,
        wins,
        losses,
        winRate: parseFloat(winRate)
    };
}

// 分析玩家
async function analyzePlayer(username, address) {
    console.log('='.repeat(80));
    console.log(`分析玩家: ${username}`);
    console.log('='.repeat(80));
    console.log('');
    
    const trades = await getUserTrades(address);
    
    if (!trades) {
        console.log('❌ 无法获取交易数据');
        return null;
    }
    
    console.log('✅ 交易数据获取成功');
    console.log('交易记录数:', trades.length || 0);
    console.log('');
    
    const stats = calculateWinRate(trades);
    
    console.log('📊 统计数据:');
    console.log('总交易次数:', stats.totalTrades);
    console.log('赢的次数:', stats.wins);
    console.log('输的次数:', stats.losses);
    console.log('真实胜率:', stats.winRate + '%');
    console.log('');
    
    return {
        username,
        address,
        ...stats,
        trades
    };
}

// 批量分析玩家
async function analyzeMultiplePlayers(players) {
    console.log('='.repeat(80));
    console.log('批量分析玩家');
    console.log('='.repeat(80));
    console.log('');
    
    const results = [];
    
    for (const player of players) {
        const result = await analyzePlayer(player.username, player.address);
        if (result) {
            results.push(result);
        }
        console.log('');
    }
    
    // 按胜率排序
    results.sort((a, b) => b.winRate - a.winRate);
    
    console.log('='.repeat(80));
    console.log('分析结果汇总');
    console.log('='.repeat(80));
    console.log('');
    console.log('排名'.padEnd(6) + '玩家'.padEnd(20) + '交易次数'.padEnd(12) + '胜率');
    console.log('-'.repeat(80));
    
    results.forEach((r, i) => {
        const rank = (i + 1).toString().padEnd(6);
        const name = r.username.padEnd(20);
        const trades = r.totalTrades.toString().padEnd(12);
        const winRate = r.winRate + '%';
        console.log(rank + name + trades + winRate);
    });
    
    console.log('');
    console.log('='.repeat(80));
    
    return results;
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket API 客户端');
    console.log('');
    console.log('用法:');
    console.log('  node polymarket-api.js <address>           - 分析单个玩家');
    console.log('  node polymarket-api.js batch               - 批量分析');
    console.log('');
    console.log('示例:');
    console.log('  node polymarket-api.js 0x1234...5678');
    process.exit(0);
}

if (args[0] === 'batch') {
    // 批量分析高ROI玩家
    const players = [
        { username: 'kch123', address: '需要查找' },
        { username: 'Tiger200', address: '需要查找' },
        { username: 'BreezeScout', address: '需要查找' }
    ];
    
    analyzeMultiplePlayers(players).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
} else {
    const address = args[0];
    analyzePlayer('Unknown', address).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
}

module.exports = { getUserTrades, calculateWinRate, analyzePlayer };
