#!/usr/bin/env node
/**
 * 预测市场交易记录工具（Simmer/Polymarket）
 * 用于记录预测市场的交易、结算和统计
 */

const fs = require('fs');
const path = require('path');

const TRADE_FILE = path.join(__dirname, '预测市场交易记录.json');
const MD_FILE = path.join(__dirname, '预测市场交易记录.md');

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

// 添加交易记录
function addTrade(trade) {
    const trades = loadTrades();
    
    const newTrade = {
        id: Date.now(),
        status: 'open', // open, resolved, cancelled
        platform: trade.platform || 'Simmer',
        tradeTime: trade.tradeTime || new Date().toISOString(),
        date: (trade.tradeTime || new Date().toISOString()).split('T')[0],
        ...trade
    };
    
    trades.push(newTrade);
    saveTrades(trades);
    
    console.log('✓ 交易记录已添加');
    console.log(JSON.stringify(newTrade, null, 2));
    
    return newTrade;
}

// 结算交易
function resolveTrade(tradeId, outcome, resolveTime) {
    const trades = loadTrades();
    const trade = trades.find(t => t.id === tradeId);
    
    if (!trade) {
        console.error('未找到交易记录');
        return null;
    }
    
    if (trade.status === 'resolved') {
        console.error('该交易已结算');
        return null;
    }
    
    trade.status = 'resolved';
    trade.outcome = outcome; // 'win', 'loss', 'refund'
    trade.resolveTime = resolveTime || new Date().toISOString();
    
    // 计算盈亏
    if (outcome === 'win') {
        // 盈利 = 投入 / 买入价格 - 投入
        trade.profitAmount = (trade.amount / trade.price - trade.amount).toFixed(2);
        trade.profitPercent = ((1 / trade.price - 1) * 100).toFixed(2);
    } else if (outcome === 'loss') {
        // 亏损 = -投入
        trade.profitAmount = (-trade.amount).toFixed(2);
        trade.profitPercent = '-100.00';
    } else if (outcome === 'refund') {
        // 退款 = 0
        trade.profitAmount = '0.00';
        trade.profitPercent = '0.00';
    }
    
    saveTrades(trades);
    
    console.log('✓ 交易已结算');
    console.log(JSON.stringify(trade, null, 2));
    
    return trade;
}

// 取消交易
function cancelTrade(tradeId, reason) {
    const trades = loadTrades();
    const trade = trades.find(t => t.id === tradeId);
    
    if (!trade) {
        console.error('未找到交易记录');
        return null;
    }
    
    trade.status = 'cancelled';
    trade.cancelReason = reason || '手动取消';
    trade.cancelTime = new Date().toISOString();
    
    saveTrades(trades);
    
    console.log('✓ 交易已取消');
    console.log(JSON.stringify(trade, null, 2));
    
    return trade;
}

// 统计数据
function getStats(trades) {
    const resolved = trades.filter(t => t.status === 'resolved');
    const open = trades.filter(t => t.status === 'open');
    const cancelled = trades.filter(t => t.status === 'cancelled');
    
    const total = resolved.length;
    const wins = resolved.filter(t => t.outcome === 'win').length;
    const losses = resolved.filter(t => t.outcome === 'loss').length;
    const refunds = resolved.filter(t => t.outcome === 'refund').length;
    const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
    
    const totalInvested = resolved.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2);
    const totalProfit = resolved.reduce((sum, t) => sum + parseFloat(t.profitAmount || 0), 0).toFixed(2);
    const roi = totalInvested > 0 ? (totalProfit / totalInvested * 100).toFixed(2) : 0;
    
    // 按策略统计
    const byStrategy = {};
    resolved.forEach(t => {
        const strategy = t.strategy || '未分类';
        if (!byStrategy[strategy]) {
            byStrategy[strategy] = { total: 0, wins: 0, profit: 0 };
        }
        byStrategy[strategy].total++;
        if (t.outcome === 'win') byStrategy[strategy].wins++;
        byStrategy[strategy].profit += parseFloat(t.profitAmount || 0);
    });
    
    return { 
        total, wins, losses, refunds, winRate, 
        totalInvested, totalProfit, roi,
        openPositions: open.length,
        cancelled: cancelled.length,
        byStrategy
    };
}

// 更新Markdown文件
function updateMarkdown(trades) {
    const stats = getStats(trades);
    
    let md = `# 预测市场交易记录

## 📊 统计概览

**总交易次数：** ${stats.total}
**盈利次数：** ${stats.wins} ✅
**亏损次数：** ${stats.losses} ❌
**退款次数：** ${stats.refunds} 🔄
**胜率：** ${stats.winRate}%
**总投入：** $${stats.totalInvested}
**总盈亏：** $${stats.totalProfit}
**ROI：** ${stats.roi}%
**持仓中：** ${stats.openPositions}
**已取消：** ${stats.cancelled}

---

## 📈 策略表现

`;

    Object.entries(stats.byStrategy).forEach(([strategy, data]) => {
        const strategyWinRate = data.total > 0 ? (data.wins / data.total * 100).toFixed(2) : 0;
        md += `**${strategy}：** ${data.total}笔 | 胜率${strategyWinRate}% | 盈亏$${data.profit.toFixed(2)}\n`;
    });

    md += `\n---

## 🔥 持仓中

`;

    const openTrades = trades.filter(t => t.status === 'open');
    
    if (openTrades.length === 0) {
        md += '暂无持仓\n\n';
    } else {
        openTrades.forEach(t => {
            md += `### ${t.market}\n`;
            md += `- ID: ${t.id}\n`;
            md += `- 平台：${t.platform}\n`;
            md += `- 交易时间：${new Date(t.tradeTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n`;
            md += `- 选项：${t.option}\n`;
            md += `- 买入价格：${(t.price * 100).toFixed(1)}¢\n`;
            md += `- 投入金额：$${t.amount}\n`;
            md += `- 潜在收益：$${(t.amount / t.price - t.amount).toFixed(2)} (+${((1/t.price - 1) * 100).toFixed(1)}%)\n`;
            if (t.strategy) md += `- 策略：${t.strategy}\n`;
            if (t.reason) md += `- 依据：${t.reason}\n`;
            if (t.deadline) md += `- 截止时间：${new Date(t.deadline).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n`;
            md += '\n';
        });
    }
    
    md += `---

## 📝 已结算交易

`;

    // 按日期分组
    const resolvedTrades = trades.filter(t => t.status === 'resolved');
    const tradesByDate = {};
    resolvedTrades.forEach(t => {
        if (!tradesByDate[t.date]) {
            tradesByDate[t.date] = [];
        }
        tradesByDate[t.date].push(t);
    });
    
    // 按日期倒序
    const dates = Object.keys(tradesByDate).sort().reverse();
    
    if (dates.length === 0) {
        md += '暂无已结算交易\n';
    } else {
        dates.forEach(date => {
            md += `### ${date}\n\n`;
            
            tradesByDate[date].forEach(t => {
                let emoji = '🔄';
                if (t.outcome === 'win') emoji = '✅';
                if (t.outcome === 'loss') emoji = '❌';
                
                const profitSign = parseFloat(t.profitAmount) > 0 ? '+' : '';
                
                md += `${emoji} **${t.market}**\n`;
                md += `- 平台：${t.platform} | 策略：${t.strategy || '未分类'}\n`;
                md += `- 选项：${t.option} @ ${(t.price * 100).toFixed(1)}¢\n`;
                md += `- 投入：$${t.amount} | 盈亏：${profitSign}$${t.profitAmount} (${profitSign}${t.profitPercent}%)\n`;
                md += `- 交易时间：${new Date(t.tradeTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n`;
                md += `- 结算时间：${new Date(t.resolveTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n`;
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

if (command === 'add') {
    // 添加交易
    const [platform, market, option, price, amount, strategy, reason] = args.slice(1);
    
    if (!market || !option || !price || !amount) {
        console.error('用法: node prediction-log.js add <平台> <市场> <选项> <价格> <金额> [策略] [依据]');
        console.error('示例: node prediction-log.js add Simmer "BTC>100k?" Yes 0.65 100 Weather "NOAA预测"');
        process.exit(1);
    }
    
    addTrade({
        platform: platform || 'Simmer',
        market,
        option,
        price: parseFloat(price),
        amount: parseFloat(amount),
        strategy: strategy || '未分类',
        reason: reason || ''
    });
    
} else if (command === 'resolve') {
    // 结算交易
    const [tradeId, outcome] = args.slice(1);
    
    if (!tradeId || !outcome) {
        console.error('用法: node prediction-log.js resolve <交易ID> <结果>');
        console.error('结果: win | loss | refund');
        process.exit(1);
    }
    
    resolveTrade(parseInt(tradeId), outcome);
    
} else if (command === 'cancel') {
    // 取消交易
    const [tradeId, reason] = args.slice(1);
    
    if (!tradeId) {
        console.error('用法: node prediction-log.js cancel <交易ID> [原因]');
        process.exit(1);
    }
    
    cancelTrade(parseInt(tradeId), reason);
    
} else if (command === 'list') {
    // 列出所有交易
    const trades = loadTrades();
    console.log(JSON.stringify(trades, null, 2));
    
} else if (command === 'open') {
    // 列出持仓
    const trades = loadTrades();
    const open = trades.filter(t => t.status === 'open');
    console.log('持仓中:');
    open.forEach(t => {
        console.log(`ID: ${t.id} | ${t.platform} | ${t.market} | ${t.option} @ ${(t.price*100).toFixed(1)}¢ | $${t.amount}`);
    });
    
} else if (command === 'stats') {
    // 显示统计
    const trades = loadTrades();
    const stats = getStats(trades);
    console.log('交易统计:');
    console.log(`总交易: ${stats.total}`);
    console.log(`盈利: ${stats.wins} | 亏损: ${stats.losses} | 退款: ${stats.refunds}`);
    console.log(`胜率: ${stats.winRate}%`);
    console.log(`总投入: $${stats.totalInvested}`);
    console.log(`总盈亏: $${stats.totalProfit}`);
    console.log(`ROI: ${stats.roi}%`);
    console.log(`持仓中: ${stats.openPositions}`);
    
} else {
    console.log('预测市场交易记录工具');
    console.log('');
    console.log('用法:');
    console.log('  添加: node prediction-log.js add <平台> <市场> <选项> <价格> <金额> [策略] [依据]');
    console.log('  结算: node prediction-log.js resolve <交易ID> <结果>');
    console.log('  取消: node prediction-log.js cancel <交易ID> [原因]');
    console.log('  持仓: node prediction-log.js open');
    console.log('  列表: node prediction-log.js list');
    console.log('  统计: node prediction-log.js stats');
    console.log('');
    console.log('示例:');
    console.log('  node prediction-log.js add Simmer "BTC>100k?" Yes 0.65 100 Weather "NOAA预测"');
    console.log('  node prediction-log.js resolve 1234567890 win');
    console.log('  node prediction-log.js cancel 1234567890 "市场取消"');
}
