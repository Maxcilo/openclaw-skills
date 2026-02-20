#!/usr/bin/env node
/**
 * 资金费率分析工具
 * 获取并分析永续合约资金费率
 */

const ccxt = require('ccxt');

// 格式化资金费率
function formatFundingRate(rate) {
    return (rate * 100).toFixed(4) + '%';
}

// 分析资金费率
function analyzeFundingRate(rate, symbol) {
    const ratePercent = rate * 100;
    
    let signal = '';
    let description = '';
    let tradingAdvice = '';
    
    if (ratePercent > 0.1) {
        signal = '极度看多（过热）';
        description = '资金费率极高，多头支付空头，多头过度拥挤';
        tradingAdvice = '⚠️ 市场过热，多头拥挤，考虑做空或减仓\n   反向思维：大量做多时，做空可能更好';
    } else if (ratePercent > 0.05) {
        signal = '偏多';
        description = '资金费率较高，多头占优';
        tradingAdvice = '📊 多头情绪较强，注意是否过度乐观\n   建议：结合价格位置判断，接近压力位需谨慎';
    } else if (ratePercent > 0.01) {
        signal = '中性偏多';
        description = '资金费率正常偏多';
        tradingAdvice = '✅ 市场情绪正常，多头略占优';
    } else if (ratePercent > -0.01) {
        signal = '中性';
        description = '资金费率接近零';
        tradingAdvice = '✅ 多空平衡，市场健康';
    } else if (ratePercent > -0.05) {
        signal = '中性偏空';
        description = '资金费率负值，空头略占优';
        tradingAdvice = '✅ 市场情绪正常，空头略占优\n   反向思维：负费率说明有人做空，做多可能有机会';
    } else if (ratePercent > -0.1) {
        signal = '偏空';
        description = '资金费率较低，空头支付多头，空头较多';
        tradingAdvice = '📊 空头情绪较强，但可能是抄底机会\n   反向思维：大量做空时，做多可能更好\n   建议：结合价格位置判断，接近支撑位可考虑做多';
    } else {
        signal = '极度看空（超卖）';
        description = '资金费率极低，空头过度拥挤';
        tradingAdvice = '✅ 市场超卖，空头拥挤，考虑做多或抄底\n   反向思维：极度负费率是反向信号，做多机会大\n   建议：分批建仓，设好止损';
    }
    
    return {
        signal,
        description,
        tradingAdvice,
        ratePercent: ratePercent.toFixed(4)
    };
}

// 获取资金费率
async function getFundingRate(symbol) {
    try {
        const exchange = new ccxt.binance();
        
        // 获取资金费率
        const fundingRate = await exchange.fetchFundingRate(symbol);
        
        return {
            symbol: fundingRate.symbol,
            fundingRate: fundingRate.fundingRate,
            fundingTimestamp: fundingRate.fundingTimestamp,
            nextFundingTime: fundingRate.fundingDatetime
        };
    } catch (error) {
        console.error('获取资金费率失败:', error.message);
        return null;
    }
}

// 主分析函数
async function analyzeFunding(symbol) {
    console.log('='.repeat(80));
    console.log(`${symbol} 资金费率分析`);
    console.log('='.repeat(80));
    console.log('');
    
    const data = await getFundingRate(symbol);
    
    if (!data) {
        console.log('❌ 无法获取资金费率数据');
        return;
    }
    
    const analysis = analyzeFundingRate(data.fundingRate, symbol);
    
    console.log(`📊 当前资金费率：${formatFundingRate(data.fundingRate)}`);
    console.log(`⏰ 下次结算时间：${data.nextFundingTime || '未知'}`);
    console.log('');
    
    console.log(`🎯 市场情绪：${analysis.signal}`);
    console.log(`📝 说明：${analysis.description}`);
    console.log('');
    
    console.log(`💡 交易建议：`);
    console.log(`   ${analysis.tradingAdvice}`);
    console.log('');
    
    // 资金费率解读
    console.log('📚 资金费率解读：');
    console.log('   • 正值：多头支付空头（市场看多）');
    console.log('   • 负值：空头支付多头（市场看空）');
    console.log('   • 极高正值（>0.1%）：多头过度拥挤，反转风险');
    console.log('   • 极低负值（<-0.1%）：空头过度拥挤，反弹机会');
    console.log('');
    
    console.log('='.repeat(80));
    
    return {
        rate: data.fundingRate,
        analysis
    };
}

// 批量分析（多交易所对比）
async function analyzeMultipleExchanges(symbol) {
    console.log('='.repeat(80));
    console.log(`${symbol} 多交易所资金费率对比`);
    console.log('='.repeat(80));
    console.log('');
    
    const exchanges = [
        { name: 'Binance', exchange: new ccxt.binance() },
        { name: 'OKX', exchange: new ccxt.okx() },
        { name: 'Bybit', exchange: new ccxt.bybit() }
    ];
    
    const results = [];
    
    for (const { name, exchange } of exchanges) {
        try {
            const fundingRate = await exchange.fetchFundingRate(symbol);
            results.push({
                exchange: name,
                rate: fundingRate.fundingRate,
                ratePercent: (fundingRate.fundingRate * 100).toFixed(4),
                nextFunding: fundingRate.fundingDatetime
            });
        } catch (error) {
            console.log(`${name}: 获取失败 (${error.message})`);
        }
    }
    
    if (results.length === 0) {
        console.log('❌ 无法获取任何交易所数据');
        return;
    }
    
    // 排序（从高到低）
    results.sort((a, b) => b.rate - a.rate);
    
    console.log('交易所'.padEnd(15) + '资金费率'.padEnd(15) + '市场情绪');
    console.log('-'.repeat(80));
    
    for (const r of results) {
        const analysis = analyzeFundingRate(r.rate, symbol);
        const rateStr = formatFundingRate(r.rate).padEnd(15);
        console.log(`${r.exchange.padEnd(15)}${rateStr}${analysis.signal}`);
    }
    
    // 计算平均值
    const avgRate = results.reduce((sum, r) => sum + r.rate, 0) / results.length;
    const avgAnalysis = analyzeFundingRate(avgRate, symbol);
    
    console.log('-'.repeat(80));
    console.log(`${'平均'.padEnd(15)}${formatFundingRate(avgRate).padEnd(15)}${avgAnalysis.signal}`);
    console.log('');
    
    console.log('💡 综合判断：');
    console.log(`   ${avgAnalysis.tradingAdvice}`);
    console.log('');
    console.log('='.repeat(80));
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('资金费率分析工具');
    console.log('');
    console.log('用法:');
    console.log('  node funding-rate.js <symbol>           - 分析单个币种');
    console.log('  node funding-rate.js compare            - 对比多个币种');
    console.log('  node funding-rate.js exchanges [symbol] - 对比多个交易所');
    console.log('');
    console.log('示例:');
    console.log('  node funding-rate.js BTC/USDT:USDT');
    console.log('  node funding-rate.js ETH/USDT:USDT');
    console.log('  node funding-rate.js compare');
    console.log('  node funding-rate.js exchanges BTC/USDT:USDT');
    process.exit(0);
}

if (args[0] === 'compare') {
    const symbols = [
        'BTC/USDT:USDT',
        'ETH/USDT:USDT',
        'BNB/USDT:USDT',
        'SOL/USDT:USDT',
        'XRP/USDT:USDT'
    ];
    
    // 多币种对比
    const results = [];
    const exchange = new ccxt.binance();
    
    for (const symbol of symbols) {
        const data = await getFundingRate(symbol);
        if (data) {
            const analysis = analyzeFundingRate(data.fundingRate, symbol);
            results.push({
                symbol,
                rate: data.fundingRate,
                ratePercent: analysis.ratePercent,
                signal: analysis.signal
            });
        }
    }
    
    results.sort((a, b) => b.rate - a.rate);
    
    console.log('='.repeat(80));
    console.log('多币种资金费率对比');
    console.log('='.repeat(80));
    console.log('');
    console.log('币种'.padEnd(20) + '资金费率'.padEnd(15) + '市场情绪');
    console.log('-'.repeat(80));
    
    for (const r of results) {
        const rateStr = formatFundingRate(r.rate).padEnd(15);
        console.log(`${r.symbol.padEnd(20)}${rateStr}${r.signal}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    process.exit(0);
    
} else if (args[0] === 'exchanges') {
    // 多交易所对比
    const symbol = args[1] || 'BTC/USDT:USDT';
    await analyzeMultipleExchanges(symbol);
    process.exit(0);
    
} else {
    const symbol = args[0];
    
    analyzeFunding(symbol).then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('分析失败:', err);
        process.exit(1);
    });
}
