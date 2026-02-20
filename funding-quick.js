#!/usr/bin/env node
/**
 * Binance 资金费率快速查询
 * 最及时的数据源
 */

const ccxt = require('ccxt');

async function quickCheck() {
    const exchange = new ccxt.binance();
    
    console.log('='.repeat(60));
    console.log('Binance 资金费率（最及时）');
    console.log('='.repeat(60));
    console.log('');
    
    const symbols = ['BTC/USDT:USDT', 'ETH/USDT:USDT'];
    
    for (const symbol of symbols) {
        try {
            const data = await exchange.fetchFundingRate(symbol);
            const rate = (data.fundingRate * 100).toFixed(4);
            const coin = symbol.split('/')[0];
            
            let signal = '';
            const rateNum = parseFloat(rate);
            
            if (rateNum > 0.1) signal = '极度看多（过热）⚠️';
            else if (rateNum > 0.05) signal = '偏多 📊';
            else if (rateNum > 0.01) signal = '中性偏多';
            else if (rateNum > -0.01) signal = '中性 ✅';
            else if (rateNum > -0.05) signal = '中性偏空';
            else if (rateNum > -0.1) signal = '偏空 📊';
            else signal = '极度看空（超卖）✅';
            
            console.log(`${coin.padEnd(6)} ${rate.padStart(8)}%   ${signal}`);
            
        } catch (error) {
            console.log(`${symbol}: 获取失败`);
        }
    }
    
    console.log('');
    console.log('💡 提示：');
    console.log('   负费率（空头多）→ 可能是做多机会');
    console.log('   正费率（多头多）→ 可能是做空机会');
    console.log('   但必须结合价格位置和K线形态判断');
    console.log('');
    console.log('='.repeat(60));
}

quickCheck().then(() => process.exit(0)).catch(err => {
    console.error('查询失败:', err.message);
    process.exit(1);
});
