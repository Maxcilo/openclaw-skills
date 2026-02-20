#!/usr/bin/env node
/**
 * Polymarket 新市场监控脚本
 * 监控新出现的市场，快速分析并通知
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'polymarket-monitor-state.json');
const TELEGRAM_ID = '6311362800';

// 加载状态
function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载状态失败:', err.message);
    }
    return { notified: [], lastCheck: 0 };
}

// 保存状态
function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('保存状态失败:', err.message);
    }
}

// API请求
function apiRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

// 发送Telegram通知
function sendNotification(message) {
    try {
        const cmd = `openclaw message send --channel telegram --target ${TELEGRAM_ID} --message ${JSON.stringify(message)}`;
        execSync(cmd, { 
            stdio: 'inherit',
            env: { 
                ...process.env, 
                PATH: '/root/.nvm/versions/node/v22.22.0/bin:' + process.env.PATH 
            }
        });
        console.log('✓ 通知已发送');
    } catch (err) {
        console.error('发送通知失败:', err.message);
    }
}

// 分析市场机会
function analyzeMarket(market) {
    const analysis = {
        market: market.question || market.title,
        url: `https://polymarket.com/event/${market.slug || market.id}`,
        volume: parseFloat(market.volume || 0),
        liquidity: parseFloat(market.liquidity || 0),
        opportunities: []
    };

    // 简单分析：基于市场描述判断
    const title = (market.question || market.title || '').toLowerCase();
    
    // 科技产品发布（通常高确定性）
    if (title.includes('iphone') || title.includes('apple') && title.includes('release')) {
        analysis.opportunities.push({
            type: '科技产品发布',
            outcome: '可能发布',
            probability: '80-90%',
            return: '10-25%',
            recommendation: '快速买入'
        });
    }
    
    // 美联储决议（高确定性）
    if (title.includes('fed') || title.includes('interest rate')) {
        analysis.opportunities.push({
            type: '美联储决议',
            outcome: '利率决定',
            probability: '90%+',
            return: '5-10%',
            recommendation: '高确定性机会'
        });
    }

    return analysis;
}

// 判断是否是重要市场
function isImportantMarket(market) {
    const title = (market.question || market.title || '').toLowerCase();
    
    // 排除加密货币相关
    const cryptoKeywords = [
        'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'token',
        'coin', 'blockchain', 'defi', 'nft', 'web3',
        'solana', 'cardano', 'polygon', 'avalanche',
        'dogecoin', 'shiba', 'xrp', 'bnb', 'usdt', 'usdc'
    ];
    
    if (cryptoKeywords.some(keyword => title.includes(keyword))) {
        return false; // 排除加密货币
    }
    
    // 关键词列表（不包含加密货币）
    const keywords = [
        // 科技产品
        'iphone', 'apple', 'google', 'microsoft', 'tesla', 'nvidia',
        'gpt', 'claude', 'ai model', 'product launch', 'release',
        
        // 重大事件
        'fed', 'interest rate', 'election', 'president',
        'olympics', 'world cup', 'super bowl',
        
        // 中文关键词
        '苹果', '发布', '美联储', '降息', '加息', '选举'
    ];
    
    return keywords.some(keyword => title.includes(keyword));
}

// 主函数
async function main() {
    console.log('[' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '] 开始检查新市场...');
    
    const state = loadState();
    
    try {
        // 获取最新市场（Gamma API）
        const url = 'https://gamma-api.polymarket.com/markets?limit=50&active=true';
        console.log('请求:', url);
        
        const markets = await apiRequest(url);
        
        if (!Array.isArray(markets)) {
            console.log('未获取到市场数据');
            return;
        }
        
        console.log(`获取到 ${markets.length} 个市场`);
        
        // 筛选新市场
        const newMarkets = markets.filter(m => {
            const marketId = m.id || m.slug;
            return marketId && !state.notified.includes(marketId);
        });
        
        console.log(`发现 ${newMarkets.length} 个新市场`);
        
        // 分析新市场
        for (const market of newMarkets) {
            const marketId = market.id || market.slug;
            
            // 只通知重要市场
            if (!isImportantMarket(market)) {
                state.notified.push(marketId);
                continue;
            }
            
            console.log(`\n分析新市场: ${market.question || market.title}`);
            
            const analysis = analyzeMarket(market);
            
            // 如果有机会，发送通知
            if (analysis.opportunities.length > 0) {
                let message = `🆕 新市场机会！\n\n`;
                message += `📊 ${analysis.market}\n\n`;
                
                analysis.opportunities.forEach((opp, i) => {
                    message += `${i + 1}. ${opp.type}\n`;
                    message += `   选项: ${opp.outcome}\n`;
                    message += `   概率: ${opp.probability}\n`;
                    message += `   回报: ${opp.return}\n`;
                    message += `   建议: ${opp.recommendation}\n\n`;
                });
                
                message += `🔗 ${analysis.url}\n`;
                message += `💰 交易量: $${(analysis.volume / 1000000).toFixed(1)}M`;
                
                sendNotification(message);
                console.log('✓ 已发送机会通知');
            } else {
                console.log('未发现明显机会');
            }
            
            // 标记为已通知
            state.notified.push(marketId);
        }
        
        // 清理旧记录（只保留最近1000个）
        if (state.notified.length > 1000) {
            state.notified = state.notified.slice(-1000);
        }
        
        state.lastCheck = Date.now();
        saveState(state);
        
        console.log('检查完成\n');
        
    } catch (err) {
        console.error('检查失败:', err.message);
    }
}

// 执行
main().catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
});
