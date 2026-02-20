#!/usr/bin/env node
/**
 * Polymarket CLOB Client - 获取玩家真实胜率
 */

const { ClobClient } = require('@polymarket/clob-client');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Polymarket配置
const HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon

// 加载钱包
function loadWallet() {
    const walletFile = path.join(__dirname, 'vault', 'polymarket-wallet.json');
    if (!fs.existsSync(walletFile)) {
        console.error('❌ 钱包文件不存在');
        process.exit(1);
    }
    const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
    return new ethers.Wallet(walletData.privateKey);
}

// 初始化客户端（带认证）
async function initClient() {
    console.log('🔐 初始化Polymarket客户端...\n');
    
    const wallet = loadWallet();
    console.log('钱包地址:', wallet.address);
    
    try {
        // 第一步：创建基础客户端（L1认证）
        const baseClient = new ClobClient(
            HOST,
            CHAIN_ID,
            wallet
        );
        
        console.log('✅ 基础客户端创建成功');
        
        // 第二步：生成或获取API凭证
        console.log('🔑 生成API凭证...');
        const apiCreds = await baseClient.createOrDeriveApiKey();
        
        console.log('✅ API凭证获取成功');
        console.log('API Key:', apiCreds.apiKey);
        
        // 保存API凭证
        const credsFile = path.join(__dirname, 'vault', 'polymarket-api-creds.json');
        fs.writeFileSync(credsFile, JSON.stringify(apiCreds, null, 2), { mode: 0o600 });
        console.log('💾 API凭证已保存\n');
        
        // 第三步：使用API凭证创建完整客户端（L2认证）
        const client = new ClobClient(
            HOST,
            CHAIN_ID,
            wallet,
            apiCreds,
            0, // signatureType: 0 = EOA
            wallet.address // funder address
        );
        
        console.log('✅ 完整客户端初始化成功\n');
        return client;
        
    } catch (error) {
        console.error('❌ 初始化失败:', error.message);
        throw error;
    }
}

// 获取用户交易历史
async function getUserTrades(client, address) {
    try {
        console.log(`📊 获取用户 ${address} 的交易历史...\n`);
        
        // 获取交易记录
        const trades = await client.getTrades({ maker: address });
        
        console.log(`✅ 找到 ${trades.length} 条交易记录\n`);
        return trades;
        
    } catch (error) {
        console.error('❌ 获取交易失败:', error.message);
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
            totalProfit: 0
        };
    }
    
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    
    // 按市场分组
    const marketTrades = {};
    
    for (const trade of trades) {
        const marketId = trade.asset_id || trade.market;
        
        if (!marketTrades[marketId]) {
            marketTrades[marketId] = [];
        }
        marketTrades[marketId].push(trade);
    }
    
    // 计算每个市场的盈亏
    for (const [marketId, marketTradeList] of Object.entries(marketTrades)) {
        let position = 0;
        let cost = 0;
        
        for (const trade of marketTradeList) {
            const size = parseFloat(trade.size || 0);
            const price = parseFloat(trade.price || 0);
            
            if (trade.side === 'BUY') {
                position += size;
                cost += size * price;
            } else {
                position -= size;
                cost -= size * price;
            }
        }
        
        // 如果仓位已平仓，计算盈亏
        if (Math.abs(position) < 0.01) {
            if (cost > 0) {
                wins++;
                totalProfit += cost;
            } else if (cost < 0) {
                losses++;
                totalProfit += cost;
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
        totalProfit: totalProfit.toFixed(2)
    };
}

// 分析玩家
async function analyzePlayer(username, address) {
    console.log('='.repeat(80));
    console.log(`分析玩家: ${username}`);
    console.log('地址:', address);
    console.log('='.repeat(80));
    console.log('');
    
    const client = await initClient();
    const trades = await getUserTrades(client, address);
    
    if (trades.length === 0) {
        console.log('❌ 没有找到交易记录\n');
        return null;
    }
    
    const stats = calculateWinRate(trades);
    
    console.log('📊 统计数据:');
    console.log('总交易次数:', stats.totalTrades);
    console.log('赢的次数:', stats.wins);
    console.log('输的次数:', stats.losses);
    console.log('真实胜率:', stats.winRate + '%');
    console.log('总盈利:', stats.totalProfit);
    console.log('');
    
    return {
        username,
        address,
        ...stats,
        trades
    };
}

// 测试API连接
async function testConnection() {
    console.log('='.repeat(80));
    console.log('测试Polymarket API连接');
    console.log('='.repeat(80));
    console.log('');
    
    try {
        const client = await initClient();
        
        // 测试获取市场数据
        console.log('📊 测试获取市场数据...\n');
        
        // 获取服务器时间
        const serverTime = await client.getServerTime();
        console.log('✅ 服务器时间:', new Date(serverTime).toISOString());
        console.log('');
        
        console.log('='.repeat(80));
        console.log('✅ API连接成功！');
        console.log('='.repeat(80));
        
        return true;
        
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
        console.error('');
        console.error('可能的原因:');
        console.error('1. 网络连接问题');
        console.error('2. API端点变更');
        console.error('3. 需要额外的认证');
        console.error('');
        return false;
    }
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Polymarket CLOB Client');
    console.log('');
    console.log('用法:');
    console.log('  node polymarket-clob.js test                    - 测试API连接');
    console.log('  node polymarket-clob.js analyze <address>       - 分析玩家');
    console.log('');
    console.log('示例:');
    console.log('  node polymarket-clob.js test');
    console.log('  node polymarket-clob.js analyze 0x1234...5678');
    process.exit(0);
}

const command = args[0];

if (command === 'test') {
    testConnection().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('测试失败:', err);
        process.exit(1);
    });
} else if (command === 'analyze') {
    const address = args[1];
    if (!address) {
        console.error('❌ 请提供钱包地址');
        process.exit(1);
    }
    
    analyzePlayer('Unknown', address).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
} else {
    console.error('❌ 未知命令:', command);
    process.exit(1);
}

module.exports = { initClient, getUserTrades, calculateWinRate, analyzePlayer };
