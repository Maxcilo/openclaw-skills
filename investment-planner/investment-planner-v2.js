#!/usr/bin/env node
/**
 * 投资计划模块 v2.0 - 期货交易建议
 * 作者: @Go8888I
 * 
 * 新增功能：
 * 1. 期货合约详细信息
 * 2. 保证金计算
 * 3. 杠杆收益计算
 * 4. 风险警告
 * 5. 具体执行步骤
 */

const fs = require('fs');
const path = require('path');

// 期货合约数据库
const FUTURES_DATABASE = {
  oil: {
    wti: {
      symbol: 'CL',
      name: 'WTI原油期货',
      exchange: 'NYMEX (CME Group)',
      contractSize: 1000, // 桶
      tickSize: 0.01, // 最小变动价位
      tickValue: 10, // 每跳价值 $10
      margin: 5000, // 初始保证金约 $5,000
      leverage: 20, // 约20倍杠杆
      tradingHours: '周日18:00 - 周五17:00 (美东时间)',
      expiryMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      minAccount: 10000, // 建议最小账户 $10,000
      website: 'https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.html'
    },
    brent: {
      symbol: 'BZ',
      name: '布伦特原油期货',
      exchange: 'ICE',
      contractSize: 1000,
      tickSize: 0.01,
      tickValue: 10,
      margin: 5500,
      leverage: 18,
      tradingHours: '周一01:00 - 周六00:00 (伦敦时间)',
      expiryMonths: ['所有月份'],
      minAccount: 10000,
      website: 'https://www.theice.com/products/219/Brent-Crude-Futures'
    }
  },
  gold: {
    gc: {
      symbol: 'GC',
      name: '黄金期货',
      exchange: 'COMEX (CME Group)',
      contractSize: 100, // 盎司
      tickSize: 0.10,
      tickValue: 10,
      margin: 8000,
      leverage: 25,
      tradingHours: '周日18:00 - 周五17:00 (美东时间)',
      expiryMonths: ['2月', '4月', '6月', '8月', '12月'],
      minAccount: 15000,
      website: 'https://www.cmegroup.com/markets/metals/precious/gold.html'
    }
  },
  gas: {
    ng: {
      symbol: 'NG',
      name: '天然气期货',
      exchange: 'NYMEX (CME Group)',
      contractSize: 10000, // MMBtu
      tickSize: 0.001,
      tickValue: 10,
      margin: 3000,
      leverage: 15,
      tradingHours: '周日18:00 - 周五17:00 (美东时间)',
      expiryMonths: ['所有月份'],
      minAccount: 8000,
      website: 'https://www.cmegroup.com/markets/energy/natural-gas/natural-gas.html'
    }
  }
};

/**
 * 计算期货交易方案
 */
function calculateFuturesStrategy(contract, capital, priceChange, riskPercent = 0.02) {
  const numContracts = Math.floor(capital * 0.8 / contract.margin); // 最多用80%资金
  const totalMargin = numContracts * contract.margin;
  const remainingCapital = capital - totalMargin;
  
  // 计算收益
  const priceMove = priceChange; // 价格变动百分比
  const dollarMove = 80 * priceMove; // 假设当前油价 $80
  const profitPerContract = dollarMove * contract.contractSize;
  const totalProfit = profitPerContract * numContracts;
  const roi = (totalProfit / totalMargin) * 100;
  
  // 计算风险
  const stopLossPercent = riskPercent; // 2% 止损
  const stopLossDollar = 80 * stopLossPercent;
  const lossPerContract = stopLossDollar * contract.contractSize;
  const totalLoss = lossPerContract * numContracts;
  const maxLossPercent = (totalLoss / capital) * 100;
  
  return {
    numContracts,
    totalMargin,
    remainingCapital,
    profitPerContract,
    totalProfit,
    roi,
    stopLossDollar,
    lossPerContract,
    totalLoss,
    maxLossPercent
  };
}

/**
 * 生成期货交易建议
 */
function generateFuturesAdvice(eventKey, capital = 10000) {
  console.log(`\n🎯 期货交易建议生成器`);
  console.log(`💰 资金: $${capital.toLocaleString()}`);
  console.log(`${'='.repeat(60)}`);
  
  // 示例：美国空袭伊朗 → 做多原油
  if (eventKey === 'geopolitical.us-iran-conflict') {
    const contract = FUTURES_DATABASE.oil.wti;
    
    console.log(`\n📊 事件分析: 美国空袭伊朗`);
    console.log(`💡 影响: 石油供应中断 → 油价上涨`);
    console.log(`📈 置信度: 85%`);
    console.log(`⏱️  持续时间: 短期（1-4周）`);
    
    console.log(`\n🛢️  推荐品种: WTI 原油期货 (${contract.symbol})`);
    console.log(`📍 交易所: ${contract.exchange}`);
    console.log(`📦 合约规模: ${contract.contractSize.toLocaleString()} 桶`);
    console.log(`💵 保证金: $${contract.margin.toLocaleString()} / 合约`);
    console.log(`⚡ 杠杆: 约 ${contract.leverage}x`);
    console.log(`🌐 官网: ${contract.website}`);
    
    // 计算不同价格变动的收益
    console.log(`\n💰 收益预测（假设当前油价 $80）:`);
    
    const scenarios = [
      { change: 0.05, label: '保守（+5%）' },
      { change: 0.10, label: '中性（+10%）' },
      { change: 0.15, label: '激进（+15%）' }
    ];
    
    for (const scenario of scenarios) {
      const result = calculateFuturesStrategy(contract, capital, scenario.change);
      
      console.log(`\n${scenario.label}:`);
      console.log(`   合约数量: ${result.numContracts} 张`);
      console.log(`   占用保证金: $${result.totalMargin.toLocaleString()}`);
      console.log(`   剩余资金: $${result.remainingCapital.toLocaleString()}`);
      console.log(`   油价变动: $80 → $${(80 * (1 + scenario.change)).toFixed(2)} (+${(scenario.change * 100).toFixed(0)}%)`);
      console.log(`   单合约收益: $${result.profitPerContract.toLocaleString()}`);
      console.log(`   总收益: $${result.totalProfit.toLocaleString()}`);
      console.log(`   投资回报率: ${result.roi.toFixed(2)}%`);
    }
    
    // 风险分析
    console.log(`\n⚠️  风险分析:`);
    const riskResult = calculateFuturesStrategy(contract, capital, 0.10, 0.02);
    console.log(`   止损位置: -2% (油价 $80 → $78.40)`);
    console.log(`   单合约亏损: $${Math.abs(riskResult.lossPerContract).toLocaleString()}`);
    console.log(`   总亏损: $${Math.abs(riskResult.totalLoss).toLocaleString()}`);
    console.log(`   账户亏损: ${riskResult.maxLossPercent.toFixed(2)}%`);
    
    // 执行步骤
    console.log(`\n📝 执行步骤:`);
    console.log(`\n1️⃣  开户准备:`);
    console.log(`   - 选择期货经纪商（Interactive Brokers、盈透证券、国内期货公司）`);
    console.log(`   - 完成开户和资金入金（最低 $${contract.minAccount.toLocaleString()}）`);
    console.log(`   - 申请原油期货交易权限`);
    
    console.log(`\n2️⃣  交易准备:`);
    console.log(`   - 确认当前油价（实时行情）`);
    console.log(`   - 选择合约月份（建议近月合约，流动性最好）`);
    console.log(`   - 计算合约数量（${riskResult.numContracts} 张）`);
    console.log(`   - 准备保证金（$${riskResult.totalMargin.toLocaleString()}）`);
    
    console.log(`\n3️⃣  下单执行:`);
    console.log(`   - 交易品种: ${contract.symbol} (${contract.name})`);
    console.log(`   - 交易方向: 做多（Buy/Long）`);
    console.log(`   - 合约数量: ${riskResult.numContracts} 张`);
    console.log(`   - 订单类型: 限价单（Limit Order）或市价单（Market Order）`);
    console.log(`   - 止损价格: 当前价 × 0.98 (例如 $80 → $78.40)`);
    console.log(`   - 止盈价格: 当前价 × 1.10 (例如 $80 → $88.00)`);
    
    console.log(`\n4️⃣  风险管理:`);
    console.log(`   - 设置止损单（Stop Loss Order）`);
    console.log(`   - 监控持仓和保证金水平`);
    console.log(`   - 避免追加保证金（Margin Call）`);
    console.log(`   - 及时止盈（不要贪婪）`);
    
    console.log(`\n5️⃣  监控指标:`);
    console.log(`   - EIA 原油库存报告（每周三）`);
    console.log(`   - OPEC 产量数据`);
    console.log(`   - 地缘政治新闻`);
    console.log(`   - 美元指数变化`);
    
    // 替代方案
    console.log(`\n🔄 替代方案（如果资金不足）:`);
    console.log(`\n方案1: 原油 ETF（无杠杆）`);
    console.log(`   - USO (美国原油基金)`);
    console.log(`   - 最低投资: $100`);
    console.log(`   - 杠杆: 1x`);
    console.log(`   - 风险: 低`);
    console.log(`   - 预期收益: 油价变动 × 1`);
    
    console.log(`\n方案2: 杠杆 ETF（2-3倍）`);
    console.log(`   - UCO (2倍做多原油)`);
    console.log(`   - GUSH (3倍做多油气股)`);
    console.log(`   - 最低投资: $500`);
    console.log(`   - 杠杆: 2-3x`);
    console.log(`   - 风险: 中高`);
    console.log(`   - 预期收益: 油价变动 × 2-3`);
    
    console.log(`\n方案3: 能源股票`);
    console.log(`   - XOM (埃克森美孚)`);
    console.log(`   - CVX (雪佛龙)`);
    console.log(`   - 最低投资: $1,000`);
    console.log(`   - 杠杆: 1x`);
    console.log(`   - 风险: 低`);
    console.log(`   - 预期收益: 油价变动 × 0.7-0.8`);
    
    // 重要提示
    console.log(`\n⚠️  重要提示:`);
    console.log(`   1. 期货交易风险极高，可能损失全部本金`);
    console.log(`   2. 杠杆放大收益，也放大亏损`);
    console.log(`   3. 保证金不足会被强制平仓`);
    console.log(`   4. 建议先用模拟账户练习`);
    console.log(`   5. 不要用生活必需资金交易`);
    console.log(`   6. 严格执行止损，控制风险`);
    console.log(`   7. 地缘政治事件难以预测，保持谨慎`);
    
    console.log(`\n📚 学习资源:`);
    console.log(`   - CME Group 教育中心: https://www.cmegroup.com/education`);
    console.log(`   - 《期货市场教程》- 中国期货业协会`);
    console.log(`   - 《期货市场技术分析》- John Murphy`);
    console.log(`   - Investopedia 期货教程: https://www.investopedia.com/futures-4427756`);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`💡 建议: 如果是第一次交易期货，建议从 ETF 或股票开始`);
    console.log(`📊 风险等级: 期货 > 杠杆ETF > ETF > 股票`);
    console.log(`🎯 适合人群: 有经验的交易者，风险承受能力高`);
    console.log(`\n`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'futures') {
  const eventKey = args[1] || 'geopolitical.us-iran-conflict';
  const capital = parseFloat(args[2]) || 10000;
  generateFuturesAdvice(eventKey, capital);
} else {
  console.log(`
🎯 投资计划模块 v2.0 - 期货交易建议

命令:
  futures <event> [capital]  生成期货交易建议

参数:
  event    事件ID (如: geopolitical.us-iran-conflict)
  capital  投资资金 (默认: 10000)

示例:
  node investment-planner-v2.js futures geopolitical.us-iran-conflict 10000
  node investment-planner-v2.js futures geopolitical.us-iran-conflict 50000
  `);
}
