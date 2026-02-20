#!/usr/bin/env node
/**
 * CoinGlass API 资金费率获取
 * 获取多交易所资金费率对比数据
 */

const https = require('https');

const API_KEY = '21af95a867b44056bca5b47eba90c27e';
const BASE_URL = 'https://open-api.coinglass.com/public/v2';

// 发起API请求
function apiRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${endpoint}`;
        
        const options = {
            headers: {
                'coinglassSecret': API_KEY
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success) {
                        resolve(json.data);
                    } else {
                        reject(new Error(json.msg || 'API请求失败'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 格式化资金费率
function formatRate(rate) {
    return (rate * 100).toFixed(4) + '%';
}

// 分析资金费率
function analyzeRate(rate) {
    const ratePercent = rate * 100;
    
    if (ratePercent > 0.1) {
        return '极度看多（过热）';
    } else if (ratePercent > 0.05) {
        return '偏多';
    } else if (ratePercent > 0.01) {
        return '中性偏多';
    } else if (ratePercent > -0.01) {
        return '中性';
    } else if (ratePercent > -0.05) {
        return '中性偏空';
    } else if (ratePercent > -0.1) {
        return '偏空';
    } else {
        return '极度看空（超卖）';
    }
}

// 获取资金费率
async function getFundingRate(symbol = 'BTC') {
    try {
        console.log('='.repeat(80));
        console.log(`${symbol} 多交易所资金费率对比`);
        console.log('='.repeat(80));
        console.log('');
        
        const data = await apiRequest(`/funding?symbol=${symbol}`);
        
        if (!data || !data.uMarginList) {
            console.log('❌ 无法获取数据');
            return;
        }
        
        // 解析数据
        const rates = data.uMarginList.map(item => ({
            exchange: item.exchangeName,
            rate: parseFloat(item.rate),
            nextFundingTime: item.nextFundingTime
        }));
        
        // 排序（从高到低）
        rates.sort((a, b) => b.rate - a.rate);
        
        // 显示表格
        console.log('交易所'.padEnd(20) + '资金费率'.padEnd(15) + '市场情绪');
        console.log('-'.repeat(80));
        
        for (const r of rates) {
            const rateStr = formatRate(r.rate).padEnd(15);
            const signal = analyzeRate(r.rate);
            console.log(`${r.exchange.padEnd(20)}${rateStr}${signal}`);
        }
        
        // 计算平均值
        const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
        const avgSignal = analyzeRate(avgRate);
        
        console.log('-'.repeat(80));
        console.log(`${'平均'.padEnd(20)}${formatRate(avgRate).padEnd(15)}${avgSignal}`);
        console.log('');
        
        // 综合分析
        console.log('💡 综合分析：');
        
        if (avgRate > 0.1) {
            console.log('   ⚠️ 平均资金费率极高，多头过度拥挤');
            console.log('   反向思维：大量做多时，做空可能更好');
            console.log('   建议：考虑做空或减仓，设好止损');
        } else if (avgRate > 0.05) {
            console.log('   📊 平均资金费率偏高，多头情绪较强');
            console.log('   建议：注意是否过度乐观，接近压力位需谨慎');
        } else if (avgRate > -0.05) {
            console.log('   ✅ 平均资金费率中性，市场健康');
            console.log('   建议：根据价格行为和技术形态判断');
        } else if (avgRate > -0.1) {
            console.log('   📊 平均资金费率偏低，空头情绪较强');
            console.log('   反向思维：负费率说明有人做空，做多可能有机会');
            console.log('   建议：结合价格位置，接近支撑位可考虑做多');
        } else {
            console.log('   ✅ 平均资金费率极低，空头过度拥挤');
            console.log('   反向思维：大量做空时，做多可能更好');
            console.log('   建议：考虑做多或抄底，分批建仓，设好止损');
        }
        
        console.log('');
        
        // 显示极端值
        const highest = rates[0];
        const lowest = rates[rates.length - 1];
        
        console.log('📊 极端值：');
        console.log(`   最高：${highest.exchange} ${formatRate(highest.rate)}`);
        console.log(`   最低：${lowest.exchange} ${formatRate(lowest.rate)}`);
        console.log(`   差值：${formatRate(highest.rate - lowest.rate)}`);
        console.log('');
        
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('获取数据失败:', error.message);
    }
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('CoinGlass 资金费率工具');
    console.log('');
    console.log('用法:');
    console.log('  node coinglass-funding.js <symbol>');
    console.log('');
    console.log('示例:');
    console.log('  node coinglass-funding.js BTC');
    console.log('  node coinglass-funding.js ETH');
    console.log('');
    console.log('支持的币种: BTC, ETH, BNB, SOL, XRP 等');
    process.exit(0);
}

const symbol = args[0].toUpperCase();

getFundingRate(symbol).then(() => {
    process.exit(0);
}).catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
});
