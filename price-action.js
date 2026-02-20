#!/usr/bin/env node
/**
 * 价格行为分析工具
 * 分析K线力量、关键位置、市场结构
 */

const ccxt = require('ccxt');

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

// 分析K线力量
function analyzeCandle(candle) {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const totalRange = candle.high - candle.low;
    
    const bodyRatio = body / totalRange;
    const isGreen = candle.close > candle.open;
    
    let strength = 'neutral';
    let type = '';
    
    // 判断K线类型和力量
    if (bodyRatio > 0.7) {
        strength = 'strong';
        type = isGreen ? '强势阳线' : '强势阴线';
    } else if (bodyRatio < 0.3) {
        if (upperShadow > body * 2) {
            type = '长上影线（流星线）';
            strength = 'bearish';
        } else if (lowerShadow > body * 2) {
            type = '长下影线（锤子线）';
            strength = 'bullish';
        } else {
            type = '十字星/小实体';
            strength = 'neutral';
        }
    } else {
        type = isGreen ? '普通阳线' : '普通阴线';
        strength = isGreen ? 'bullish' : 'bearish';
    }
    
    return {
        type,
        strength,
        body,
        bodyRatio: (bodyRatio * 100).toFixed(1),
        upperShadow,
        lowerShadow,
        isGreen
    };
}

// 识别形态
function identifyPattern(candles) {
    if (candles.length < 2) return null;
    
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);
    
    const prevIsGreen = prev.close > prev.open;
    const currIsGreen = curr.close > curr.open;
    
    // 吞没形态
    if (currBody > prevBody * 1.5) {
        if (!prevIsGreen && currIsGreen && 
            curr.close > prev.open && curr.open < prev.close) {
            return {
                name: '看涨吞没',
                signal: 'bullish',
                description: '大阳线吞没小阴线，看涨信号'
            };
        }
        if (prevIsGreen && !currIsGreen && 
            curr.close < prev.open && curr.open > prev.close) {
            return {
                name: '看跌吞没',
                signal: 'bearish',
                description: '大阴线吞没小阳线，看跌信号'
            };
        }
    }
    
    // 内包线
    if (curr.high <= prev.high && curr.low >= prev.low) {
        return {
            name: '内包线',
            signal: 'neutral',
            description: '市场犹豫，等待突破方向'
        };
    }
    
    return null;
}

// 分析市场结构
function analyzeStructure(candles, lookback = 10) {
    if (candles.length < lookback) return 'insufficient_data';
    
    const recent = candles.slice(-lookback);
    
    // 找高点和低点
    let highs = [];
    let lows = [];
    
    for (let i = 1; i < recent.length - 1; i++) {
        if (recent[i].high > recent[i-1].high && recent[i].high > recent[i+1].high) {
            highs.push(recent[i].high);
        }
        if (recent[i].low < recent[i-1].low && recent[i].low < recent[i+1].low) {
            lows.push(recent[i].low);
        }
    }
    
    if (highs.length < 2 || lows.length < 2) {
        return {
            trend: '震荡',
            description: '高低点不明显，市场震荡'
        };
    }
    
    // 判断趋势
    const highsRising = highs[highs.length - 1] > highs[0];
    const lowsRising = lows[lows.length - 1] > lows[0];
    
    if (highsRising && lowsRising) {
        return {
            trend: '上升',
            description: '高点和低点都在抬高，上升趋势'
        };
    } else if (!highsRising && !lowsRising) {
        return {
            trend: '下降',
            description: '高点和低点都在降低，下降趋势'
        };
    } else {
        return {
            trend: '震荡',
            description: '高低点方向不一致，震荡行情'
        };
    }
}

// 主分析函数
async function analyzePriceAction(symbol, timeframe = '1h', keyLevels = {}) {
    try {
        const exchange = new ccxt.binance();
        
        // 获取K线数据
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, 50);
        
        const candles = ohlcv.map(c => ({
            timestamp: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
            volume: c[5]
        }));
        
        const currentCandle = candles[candles.length - 1];
        const currentPrice = currentCandle.close;
        
        // 分析最新K线
        const candleAnalysis = analyzeCandle(currentCandle);
        
        // 识别形态
        const pattern = identifyPattern(candles);
        
        // 分析市场结构
        const structure = analyzeStructure(candles);
        
        // 分析与关键位置的关系
        let levelAnalysis = {};
        if (keyLevels.resistance) {
            const distToResistance = ((currentPrice - keyLevels.resistance) / keyLevels.resistance * 100).toFixed(2);
            levelAnalysis.resistance = {
                level: keyLevels.resistance,
                distance: distToResistance,
                status: Math.abs(distToResistance) < 1 ? '接近' : distToResistance > 0 ? '已突破' : '远离'
            };
        }
        if (keyLevels.support) {
            const distToSupport = ((currentPrice - keyLevels.support) / keyLevels.support * 100).toFixed(2);
            levelAnalysis.support = {
                level: keyLevels.support,
                distance: distToSupport,
                status: Math.abs(distToSupport) < 1 ? '接近' : distToSupport < 0 ? '已跌破' : '远离'
            };
        }
        
        // 生成报告
        console.log('='.repeat(80));
        console.log(`${symbol} 价格行为分析 (${timeframe})`);
        console.log('='.repeat(80));
        console.log('');
        
        console.log(`📍 当前价格：$${formatPrice(currentPrice)}`);
        console.log('');
        
        console.log('📊 最新K线分析：');
        console.log(`   类型：${candleAnalysis.type}`);
        console.log(`   实体占比：${candleAnalysis.bodyRatio}%`);
        console.log(`   力量：${candleAnalysis.strength === 'strong' ? '强势' : candleAnalysis.strength === 'neutral' ? '中性' : candleAnalysis.isGreen ? '偏多' : '偏空'}`);
        console.log('');
        
        if (pattern) {
            console.log(`🎯 识别形态：${pattern.name}`);
            console.log(`   信号：${pattern.signal === 'bullish' ? '看涨' : pattern.signal === 'bearish' ? '看跌' : '中性'}`);
            console.log(`   说明：${pattern.description}`);
            console.log('');
        }
        
        console.log(`📈 市场结构：${structure.trend}趋势`);
        console.log(`   ${structure.description}`);
        console.log('');
        
        if (Object.keys(levelAnalysis).length > 0) {
            console.log('🎚️  关键位置：');
            if (levelAnalysis.resistance) {
                console.log(`   压力位：$${formatPrice(levelAnalysis.resistance.level)} (${levelAnalysis.resistance.status}, ${levelAnalysis.resistance.distance > 0 ? '+' : ''}${levelAnalysis.resistance.distance}%)`);
            }
            if (levelAnalysis.support) {
                console.log(`   支撑位：$${formatPrice(levelAnalysis.support.level)} (${levelAnalysis.support.status}, ${levelAnalysis.support.distance > 0 ? '+' : ''}${levelAnalysis.support.distance}%)`);
            }
            console.log('');
        }
        
        // 交易建议
        console.log('💡 交易建议：');
        
        let suggestion = '';
        if (pattern && pattern.signal === 'bearish' && levelAnalysis.resistance && levelAnalysis.resistance.status === '接近') {
            suggestion = '⚠️ 看跌形态出现在压力位附近，建议减仓或止盈';
        } else if (pattern && pattern.signal === 'bullish' && levelAnalysis.support && levelAnalysis.support.status === '接近') {
            suggestion = '✅ 看涨形态出现在支撑位附近，可以考虑抄底';
        } else if (candleAnalysis.type === '长上影线（流星线）' && levelAnalysis.resistance && levelAnalysis.resistance.status === '接近') {
            suggestion = '⚠️ 压力位出现长上影线，上方卖压大，建议减仓';
        } else if (candleAnalysis.type === '长下影线（锤子线）' && levelAnalysis.support && levelAnalysis.support.status === '接近') {
            suggestion = '✅ 支撑位出现长下影线，下方买盘强，可以考虑入场';
        } else if (structure.trend === '上升' && candleAnalysis.strength === 'strong' && candleAnalysis.isGreen) {
            suggestion = '✅ 上升趋势中出现强势阳线，可以持有或加仓';
        } else if (structure.trend === '下降' && candleAnalysis.strength === 'strong' && !candleAnalysis.isGreen) {
            suggestion = '⚠️ 下降趋势中出现强势阴线，建议减仓或观望';
        } else {
            suggestion = '📊 市场信号不明确，建议观望等待更清晰的信号';
        }
        
        console.log(`   ${suggestion}`);
        console.log('');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('分析出错:', error.message);
    }
}

// 命令行接口
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('价格行为分析工具');
    console.log('');
    console.log('用法:');
    console.log('  node price-action.js <symbol> [timeframe] [resistance] [support]');
    console.log('');
    console.log('示例:');
    console.log('  node price-action.js BTC/USDT 1h 71000 68000');
    console.log('  node price-action.js ETH/USDT 4h 2150 2000');
    process.exit(0);
}

const symbol = args[0];
const timeframe = args[1] || '1h';
const resistance = args[2] ? parseFloat(args[2]) : null;
const support = args[3] ? parseFloat(args[3]) : null;

const keyLevels = {};
if (resistance) keyLevels.resistance = resistance;
if (support) keyLevels.support = support;

analyzePriceAction(symbol, timeframe, keyLevels).then(() => {
    process.exit(0);
}).catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
});
