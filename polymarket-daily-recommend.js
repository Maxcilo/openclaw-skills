#!/usr/bin/env node
/**
 * Polymarket 每日推荐系统
 * 筛选高概率市场和临期机会，每天推送推荐
 */

const https = require('https');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    // 高概率市场筛选标准
    highProb: {
        minProbability: 0.85,      // 最低概率85%（降低标准）
        minVolume: 50000,          // 最低交易量$50k（降低标准）
        maxDaysToResolve: 60,      // 最多60天内结算（放宽）
        minReturn: 0.02            // 最低收益2%（降低标准）
    },
    
    // 临期机会筛选标准
    nearExpiry: {
        maxDaysToResolve: 14,      // 14天内结算（放宽）
        minSplit: 0.50,            // 最低分歧50/50（降低标准）
        minVolume: 10000           // 最低交易量$10k（降低标准）
    },
    
    // 推荐数量
    topHighProb: 5,
    topNearExpiry: 3,
    
    // Telegram配置
    telegramTarget: '6311362800'
};

// 获取市场数据
function fetchMarkets() {
    return new Promise((resolve, reject) => {
        const url = 'https://gamma-api.polymarket.com/markets?limit=100&active=true&closed=false';
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

// 计算距离结算天数
function getDaysToResolve(endDate) {
    if (!endDate) return 999;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

// 格式化价格
function formatPrice(price) {
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return '$' + (price / 1000).toFixed(0) + 'K';
    } else {
        return '$' + price.toFixed(0);
    }
}

// 筛选高概率市场
function filterHighProbMarkets(markets) {
    const filtered = markets
        .filter(m => {
            // 解析价格（可能是字符串数组）
            let prices = m.outcomePrices;
            if (typeof prices === 'string') {
                try {
                    prices = JSON.parse(prices);
                } catch (e) {
                    return false;
                }
            }
            if (!Array.isArray(prices) || prices.length === 0) return false;
            
            const prob = parseFloat(prices[0]);
            const volume = parseFloat(m.volume || m.volumeNum || 0);
            const days = getDaysToResolve(m.endDate);
            
            // 过滤已过期的市场
            if (days < 0) return false;
            
            const expectedReturn = prob > 0 ? (1 / prob - 1) : 0;
            
            return prob >= CONFIG.highProb.minProbability &&
                   volume >= CONFIG.highProb.minVolume &&
                   days <= CONFIG.highProb.maxDaysToResolve &&
                   expectedReturn >= CONFIG.highProb.minReturn;
        })
        .map(m => {
            let prices = m.outcomePrices;
            if (typeof prices === 'string') {
                prices = JSON.parse(prices);
            }
            const prob = parseFloat(prices[0]);
            const volume = parseFloat(m.volume || m.volumeNum || 0);
            const days = getDaysToResolve(m.endDate);
            const expectedReturn = (1 / prob - 1) * 100;
            
            return {
                question: m.question,
                probability: (prob * 100).toFixed(1),
                expectedReturn: expectedReturn.toFixed(1),
                volume: formatPrice(volume),
                daysToResolve: days,
                risk: prob >= 0.95 ? '极低' : prob >= 0.90 ? '低' : '中',
                url: `https://polymarket.com/event/${m.slug || m.id}`
            };
        })
        .sort((a, b) => parseFloat(b.expectedReturn) - parseFloat(a.expectedReturn))
        .slice(0, CONFIG.topHighProb);
    
    return filtered;
}

// 筛选临期机会
function filterNearExpiryMarkets(markets) {
    const filtered = markets
        .filter(m => {
            const days = getDaysToResolve(m.endDate);
            if (days < 0) return false; // 过滤已过期
            
            const volume = parseFloat(m.volume || m.volumeNum || 0);
            
            // 解析价格
            let prices = m.outcomePrices;
            if (typeof prices === 'string') {
                try {
                    prices = JSON.parse(prices);
                } catch (e) {
                    return false;
                }
            }
            
            if (days > CONFIG.nearExpiry.maxDaysToResolve) return false;
            if (volume < CONFIG.nearExpiry.minVolume) return false;
            if (!Array.isArray(prices) || prices.length < 2) return false;
            
            const prob1 = parseFloat(prices[0]);
            const prob2 = parseFloat(prices[1]);
            const maxProb = Math.max(prob1, prob2);
            
            return maxProb >= CONFIG.nearExpiry.minSplit;
        })
        .map(m => {
            const days = getDaysToResolve(m.endDate);
            const volume = parseFloat(m.volume || m.volumeNum || 0);
            let prices = m.outcomePrices;
            if (typeof prices === 'string') {
                prices = JSON.parse(prices);
            }
            const prob1 = parseFloat(prices[0]) * 100;
            const prob2 = parseFloat(prices[1]) * 100;
            
            return {
                question: m.question,
                prob1: prob1.toFixed(1),
                prob2: prob2.toFixed(1),
                volume: formatPrice(volume),
                daysToResolve: days,
                url: `https://polymarket.com/event/${m.slug || m.id}`
            };
        })
        .sort((a, b) => a.daysToResolve - b.daysToResolve)
        .slice(0, CONFIG.topNearExpiry);
    
    return filtered;
}

// 生成推荐消息
function generateMessage(highProb, nearExpiry) {
    // 如果没有任何推荐，返回null（静默）
    if (highProb.length === 0 && nearExpiry.length === 0) {
        return null;
    }
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        timeZone: 'Asia/Shanghai'
    });
    const timeStr = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
    });
    
    let message = `📊 Polymarket推荐 ${dateStr} ${timeStr}\n\n`;
    
    // 高概率市场
    if (highProb.length > 0) {
        message += `【高概率市场】稳健型\n\n`;
        highProb.forEach((m, i) => {
            message += `${i + 1}. ${m.question}\n`;
            message += `   概率：${m.probability}% | 收益：${m.expectedReturn}% | ${m.daysToResolve}天\n`;
            message += `   交易量：${m.volume} | 风险：${m.risk}\n`;
            message += `   ${m.url}\n\n`;
        });
    }
    
    // 临期机会
    if (nearExpiry.length > 0) {
        message += `【临期机会】激进型\n\n`;
        nearExpiry.forEach((m, i) => {
            message += `${i + 1}. ${m.question}\n`;
            message += `   概率：${m.prob1}% vs ${m.prob2}%\n`;
            message += `   交易量：${m.volume} | ${m.daysToResolve}天后结算\n`;
            message += `   ${m.url}\n\n`;
        });
    }
    
    // 风险提示
    message += `⚠️ 风险提示：\n`;
    message += `- 高概率不等于无风险\n`;
    message += `- 建议分散投资，单笔不超过总资金10%\n`;
    message += `- 仔细阅读市场规则和结算条件\n`;
    message += `- 注意流动性，大额交易可能有滑点\n`;
    
    return message;
}

// 发送Telegram消息
function sendTelegramMessage(message) {
    try {
        const escapedMessage = message.replace(/'/g, "'\\''");
        const cmd = `openclaw message send --channel telegram --target ${CONFIG.telegramTarget} --message '${escapedMessage}'`;
        execSync(cmd, { 
            stdio: 'inherit',
            env: { 
                ...process.env, 
                PATH: '/root/.nvm/versions/node/v22.22.0/bin:' + process.env.PATH 
            }
        });
        console.log('✓ 推荐已发送');
    } catch (err) {
        console.error('发送失败:', err.message);
    }
}

// 主函数
async function main() {
    console.log('[' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '] 开始生成每日推荐...');
    
    try {
        // 获取市场数据
        console.log('获取市场数据...');
        const markets = await fetchMarkets();
        console.log(`获取到 ${markets.length} 个市场`);
        
        // 筛选高概率市场
        console.log('筛选高概率市场...');
        const highProb = filterHighProbMarkets(markets);
        console.log(`找到 ${highProb.length} 个高概率市场`);
        
        // 筛选临期机会
        console.log('筛选临期机会...');
        const nearExpiry = filterNearExpiryMarkets(markets);
        console.log(`找到 ${nearExpiry.length} 个临期机会`);
        
        // 生成推荐消息
        const message = generateMessage(highProb, nearExpiry);
        
        // 如果没有推荐，静默退出
        if (!message) {
            console.log('没有符合条件的市场，静默退出');
            return;
        }
        
        // 发送推荐
        console.log('发送推荐...');
        sendTelegramMessage(message);
        
        console.log('完成');
    } catch (err) {
        console.error('错误:', err.message);
    }
}

// 运行
main();
