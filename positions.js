#!/usr/bin/env node
/**
 * 快速查看持仓列表
 */

const fs = require('fs');
const path = require('path');

const TRADE_FILE = path.join(__dirname, '交易记录.json');

// 加载交易记录
function loadTrades() {
    try {
        if (fs.existsSync(TRADE_FILE)) {
            return JSON.parse(fs.readFileSync(TRADE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载失败:', err.message);
    }
    return [];
}

// 格式化价格
function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else if (price >= 1) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 4 
        });
    } else {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 4, 
            maximumFractionDigits: 8 
        });
    }
}

// 格式化时间
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示持仓列表
function showPositions() {
    const trades = loadTrades();
    const openTrades = trades.filter(t => t.status === 'open');
    
    if (openTrades.length === 0) {
        console.log('📭 暂无持仓');
        return;
    }
    
    console.log('🔥 持仓列表\n');
    console.log('='.repeat(80));
    
    openTrades.forEach((t, idx) => {
        const emoji = t.direction === '做多' ? '📈' : '📉';
        const leverage = t.leverage > 1 ? ` ${t.leverage}x` : '';
        
        console.log(`\n${idx + 1}. ${emoji} ${t.symbol} ${t.direction}${leverage}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   开仓: ${formatTime(t.openTime)} @ $${formatPrice(t.entryPrice)}`);
        console.log(`   数量: ${t.quantity}`);
        
        if (t.stopLoss) {
            const slDistance = ((t.stopLoss - t.entryPrice) / t.entryPrice * 100).toFixed(2);
            console.log(`   止损: $${formatPrice(t.stopLoss)} (${slDistance}%)`);
        }
        
        if (t.takeProfit) {
            const tpDistance = ((t.takeProfit - t.entryPrice) / t.entryPrice * 100).toFixed(2);
            console.log(`   止盈: $${formatPrice(t.takeProfit)} (${tpDistance}%)`);
        }
        
        if (t.reason) {
            console.log(`   依据: ${t.reason}`);
        }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n总持仓: ${openTrades.length} 笔`);
}

showPositions();
