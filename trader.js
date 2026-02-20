#!/usr/bin/env node
/**
 * 交易员分析系统
 * 提供纯技术分析和交易建议
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 运行价格行为分析
function runPriceAction(symbol, timeframe, resistance, support) {
    const cmd = `node ${__dirname}/price-action.js ${symbol} ${timeframe} ${resistance} ${support}`;
    const output = execSync(cmd, { encoding: 'utf8' });
    return output;
}

// 生成交易建议
function generateTradeAdvice(symbol, currentPrice, resistance, support, analysis) {
    const distToResistance = ((currentPrice - resistance) / resistance * 100);
    const distToSupport = ((currentPrice - support) / support * 100);
    
    let signal = 'neutral';
    let advice = {};
    
    // 判断交易信号
    if (Math.abs(distToResistance) < 1) {
        // 接近压力位
        if (analysis.includes('长上影线') || analysis.includes('看跌吞没')) {
            signal = 'short';
            advice = {
                direction: '做空',
                entry: currentPrice,
                stopLoss: resistance * 1.01,
                target: support,
                reason: '接近压力位出现看跌信号'
            };
        } else {
            signal = 'wait';
            advice = {
                direction: '观望',
                reason: '接近压力位，等待明确信号'
            };
        }
    } else if (Math.abs(distToSupport) < 1) {
        // 接近支撑位
        if (analysis.includes('长下影线') || analysis.includes('看涨吞没')) {
            signal = 'long';
            advice = {
                direction: '做多',
                entry: currentPrice,
                stopLoss: support * 0.99,
                target: resistance,
                reason: '接近支撑位出现看涨信号'
            };
        } else {
            signal = 'wait';
            advice = {
                direction: '观望',
                reason: '接近支撑位，等待明确信号'
            };
        }
    } else {
        // 在区间中间
        signal = 'wait';
        advice = {
            direction: '观望',
            reason: '价格在区间中间，等待接近关键位置'
        };
    }
    
    return { signal, advice };
}

// 主函数
async function traderAnalysis(symbol, timeframe, resistance, support) {
    console.log('='.repeat(80));
    console.log('【交易员技术分析】');
    console.log('='.repeat(80));
    console.log('');
    
    // 运行价格行为分析
    const priceActionOutput = runPriceAction(symbol, timeframe, resistance, support);
    console.log(priceActionOutput);
    
    // 这里可以添加更多分析逻辑
    
    console.log('='.repeat(80));
    console.log('【交易员建议】');
    console.log('='.repeat(80));
    console.log('');
    console.log('注意：这是纯技术分析，未考虑仓位和风险管理');
    console.log('请等待助手的风险评估后再做决定');
    console.log('');
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length < 4) {
    console.log('交易员分析系统');
    console.log('');
    console.log('用法:');
    console.log('  node trader.js <symbol> <timeframe> <resistance> <support>');
    console.log('');
    console.log('示例:');
    console.log('  node trader.js BTC/USDT 1h 71000 68000');
    process.exit(0);
}

const symbol = args[0];
const timeframe = args[1];
const resistance = parseFloat(args[2]);
const support = parseFloat(args[3]);

traderAnalysis(symbol, timeframe, resistance, support).then(() => {
    process.exit(0);
}).catch(err => {
    console.error('分析失败:', err);
    process.exit(1);
});
