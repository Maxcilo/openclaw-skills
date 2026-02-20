#!/usr/bin/env node
/**
 * 交易记录工具（支持合约交易）
 * 用于添加、查询、统计交易记录
 */

const fs = require('fs');
const path = require('path');

const TRADE_FILE = path.join(__dirname, '交易记录.json');
const MD_FILE = path.join(__dirname, '交易记录.md');

// 加载交易记录
function loadTrades() {
    try {
        if (fs.existsSync(TRADE_FILE)) {
            return JSON.parse(fs.readFileSync(TRADE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载交易记录失败:', err.message);
    }
    return [];
}

// 保存交易记录
function saveTrades(trades) {
    try {
        fs.writeFileSync(TRADE_FILE, JSON.stringify(trades, null, 2));
        updateMarkdown(trades);
    } catch (err) {
        console.error('保存交易记录失败:', err.message);
    }
}

// 添加开仓记录
function addOpenPosition(trade) {
    const trades = loadTrades();
    
    const newTrade = {
        id: Date.now(),
        status: 'open',
        openTime: trade.openTime || new Date().toISOString(),
        date: (trade.openTime || new Date().toISOString()).split('T')[0],
        ...trade
    };
    
    trades.push(newTrade);
    saveTrades(trades);
    
    console.log('✓ 开仓记录已添加');
    console.log(JSON.stringify(newTrade, null, 2));
    
    return newTrade;
}

// 平仓
function closePosition(tradeId, exitPrice, exitTime) {
    const trades = loadTrades();
    const trade = trades.find(t => t.id === tradeId);
    
    if (!trade) {
        console.error('未找到交易记录');
        return null;
    }
    
    if (trade.status === 'closed') {
        console.error('该交易已平仓');
        return null;
    }
    
    trade.status = 'closed';
    trade.exitPrice = exitPrice;
    trade.exitTime = exitTime || new Date().toISOString();
    
    // 计算盈亏（正确公式）
    const priceChange = trade.direction === '做多' 
        ? (exitPrice - trade.entryPrice) 
        : (trade.entryPrice - exitPrice);
    
    // 毛利润 = 价格差 × 数量
    const grossProfit = priceChange * trade.quantity;
    
    // 手续费（假设开仓+平仓各0.05%）
    const feeRate = 0.0005;
    const openFee = trade.entryPrice * trade.quantity * feeRate;
    const closeFee = exitPrice * trade.quantity * feeRate;
    const totalFee = openFee + closeFee;
    
    // 净盈利 = 毛利润 - 手续费
    trade.profitAmount = (grossProfit - totalFee).toFixed(2);
    
    // 收益率（相对于仓位价值）
    const positionValue = trade.entryPrice * trade.quantity;
    trade.profitPercent = (parseFloat(trade.profitAmount) / positionValue * 100).toFixed(2);
    
    saveTrades(trades);
    
    console.log('✓ 平仓记录已更新');
    console.log(JSON.stringify(trade, null, 2));
    
    return trade;
}

// 统计数据
function getStats(trades) {
    const closed = trades.filter(t => t.status === 'closed');
    const open = trades.filter(t => t.status === 'open');
    
    const total = closed.length;
    const wins = closed.filter(t => parseFloat(t.profitAmount) > 0).length;
    const losses = closed.filter(t => parseFloat(t.profitAmount) < 0).length;
    const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
    const totalProfit = closed.reduce((sum, t) => sum + parseFloat(t.profitAmount || 0), 0).toFixed(2);
    
    return { total, wins, losses, winRate, totalProfit, openPositions: open.length };
}

// 更新Markdown文件
function updateMarkdown(trades) {
    const stats = getStats(trades);
    
    let md = `# 交易记录

## 📊 统计概览

**总交易次数：** ${stats.total}
**盈利次数：** ${stats.wins}
**亏损次数：** ${stats.losses}
**胜率：** ${stats.winRate}%
**总盈亏：** $${stats.totalProfit}
**持仓中：** ${stats.openPositions}

---

## 🔥 持仓中

`;

    const openTrades = trades.filter(t => t.status === 'open');
    
    if (openTrades.length === 0) {
        md += '暂无持仓\n\n';
    } else {
        openTrades.forEach(t => {
            const currentPL = t.currentPrice ? 
                (t.direction === '做多' 
                    ? (t.currentPrice - t.entryPrice) * t.quantity * (t.leverage || 1)
                    : (t.entryPrice - t.currentPrice) * t.quantity * (t.leverage || 1)
                ).toFixed(2) : '未知';
            
            md += `### ${t.symbol} ${t.direction} ${t.leverage ? `${t.leverage}x` : ''}\n`;
            md += `- ID: ${t.id}\n`;
            md += `- 开仓时间：${new Date(t.openTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n`;
            md += `- 开仓价格：$${t.entryPrice}\n`;
            md += `- 数量：${t.quantity}\n`;
            if (t.stopLoss) md += `- 止损：$${t.stopLoss}\n`;
            if (t.takeProfit) md += `- 止盈：$${t.takeProfit}\n`;
            if (t.tradeType) md += `- 类型：${t.tradeType}\n`;
            if (t.reason) md += `- 依据：${t.reason}\n`;
            md += `- 当前盈亏：$${currentPL}\n`;
            md += '\n';
        });
    }
    
    md += `---

## 📝 已平仓交易

`;

    // 按日期分组
    const closedTrades = trades.filter(t => t.status === 'closed');
    const tradesByDate = {};
    closedTrades.forEach(t => {
        if (!tradesByDate[t.date]) {
            tradesByDate[t.date] = [];
        }
        tradesByDate[t.date].push(t);
    });
    
    // 按日期倒序
    const dates = Object.keys(tradesByDate).sort().reverse();
    
    if (dates.length === 0) {
        md += '暂无已平仓交易\n';
    } else {
        dates.forEach(date => {
            md += `### ${date}\n\n`;
            
            tradesByDate[date].forEach(t => {
                const emoji = parseFloat(t.profitAmount) > 0 ? '✅' : '❌';
                const profitSign = parseFloat(t.profitAmount) > 0 ? '+' : '';
                
                md += `${emoji} **${t.symbol}** ${t.direction} ${t.leverage ? `${t.leverage}x` : ''}\n`;
                md += `- 开仓：${new Date(t.openTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})} @ $${t.entryPrice}\n`;
                md += `- 平仓：${new Date(t.exitTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})} @ $${t.exitPrice}\n`;
                md += `- 数量：${t.quantity} | 盈亏：${profitSign}$${t.profitAmount} (${profitSign}${t.profitPercent}%)\n`;
                if (t.reason) md += `- 依据：${t.reason}\n`;
                if (t.note) md += `- 备注：${t.note}\n`;
                md += '\n';
            });
        });
    }
    
    md += `---

*最后更新：${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}*
`;
    
    fs.writeFileSync(MD_FILE, md);
}

// 命令行接口
const args = process.argv.slice(2);
const command = args[0];

if (command === 'open') {
    // 开仓
    const [symbol, direction, entryPrice, quantity, leverage, stopLoss, takeProfit, tradeType, reason] = args.slice(1);
    
    if (!symbol || !direction || !entryPrice || !quantity) {
        console.error('用法: node trade-log.js open <币种> <方向> <入场价> <数量> [杠杆] [止损] [止盈] [类型] [依据]');
        process.exit(1);
    }
    
    addOpenPosition({
        symbol,
        direction,
        entryPrice: parseFloat(entryPrice),
        quantity: parseFloat(quantity),
        leverage: leverage ? parseFloat(leverage) : 1,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        tradeType: tradeType || '现货',
        reason: reason || ''
    });
    
} else if (command === 'close') {
    // 平仓
    const [tradeId, exitPrice] = args.slice(1);
    
    if (!tradeId || !exitPrice) {
        console.error('用法: node trade-log.js close <交易ID> <出场价>');
        process.exit(1);
    }
    
    closePosition(parseInt(tradeId), parseFloat(exitPrice));
    
} else if (command === 'list') {
    // 列出所有交易
    const trades = loadTrades();
    console.log(JSON.stringify(trades, null, 2));
    
} else if (command === 'open-list') {
    // 列出持仓
    const trades = loadTrades();
    const open = trades.filter(t => t.status === 'open');
    console.log('持仓中:');
    open.forEach(t => {
        console.log(`ID: ${t.id} | ${t.symbol} ${t.direction} ${t.leverage}x | 入场: $${t.entryPrice} | 数量: ${t.quantity}`);
    });
    
} else if (command === 'stats') {
    // 显示统计
    const trades = loadTrades();
    const stats = getStats(trades);
    console.log('交易统计:');
    console.log(`总交易: ${stats.total}`);
    console.log(`盈利: ${stats.wins} | 亏损: ${stats.losses}`);
    console.log(`胜率: ${stats.winRate}%`);
    console.log(`总盈亏: $${stats.totalProfit}`);
    console.log(`持仓中: ${stats.openPositions}`);
    
} else {
    console.log('交易记录工具');
    console.log('');
    console.log('用法:');
    console.log('  开仓: node trade-log.js open <币种> <方向> <入场价> <数量> [杠杆] [止损] [止盈] [类型] [依据]');
    console.log('  平仓: node trade-log.js close <交易ID> <出场价>');
    console.log('  持仓: node trade-log.js open-list');
    console.log('  列表: node trade-log.js list');
    console.log('  统计: node trade-log.js stats');
    console.log('');
    console.log('示例:');
    console.log('  node trade-log.js open ETH 做多 2072.28 1 5 2035 2150 合约 "双孕线形态"');
    console.log('  node trade-log.js close 1234567890 2100');
}
