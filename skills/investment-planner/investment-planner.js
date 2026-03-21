#!/usr/bin/env node
/**
 * 投资计划模块 - 事件驱动投资决策系统
 * 作者: @Go8888I
 * 版本: 1.0.0
 */

const fs = require('fs');
const path = require('path');

// 事件库
const EVENT_LIBRARY = {
  geopolitical: {
    'us-iran-conflict': {
      name: '美国空袭伊朗',
      category: '地缘政治',
      probability: 'medium',
      impact: 'high',
      duration: 'short-term', // short-term, medium-term, long-term
      effects: {
        oil: { direction: 'up', magnitude: 'high', confidence: 0.85 },
        gold: { direction: 'up', magnitude: 'medium', confidence: 0.75 },
        us_stocks: { direction: 'down', magnitude: 'medium', confidence: 0.70 },
        crypto: { direction: 'down', magnitude: 'high', confidence: 0.65 },
        usd: { direction: 'up', magnitude: 'low', confidence: 0.60 }
      }
    },
    'russia-ukraine-escalation': {
      name: '俄乌冲突升级',
      category: '地缘政治',
      effects: {
        oil: { direction: 'up', magnitude: 'high', confidence: 0.80 },
        gas: { direction: 'up', magnitude: 'very-high', confidence: 0.90 },
        wheat: { direction: 'up', magnitude: 'high', confidence: 0.85 },
        us_stocks: { direction: 'down', magnitude: 'medium', confidence: 0.65 }
      }
    }
  },
  economic: {
    'fed-rate-hike': {
      name: '美联储加息',
      category: '经济政策',
      effects: {
        usd: { direction: 'up', magnitude: 'high', confidence: 0.90 },
        gold: { direction: 'down', magnitude: 'medium', confidence: 0.75 },
        us_stocks: { direction: 'down', magnitude: 'medium', confidence: 0.70 },
        crypto: { direction: 'down', magnitude: 'high', confidence: 0.80 }
      }
    },
    'china-stimulus': {
      name: '中国经济刺激',
      category: '经济政策',
      effects: {
        commodities: { direction: 'up', magnitude: 'high', confidence: 0.80 },
        china_stocks: { direction: 'up', magnitude: 'high', confidence: 0.85 },
        copper: { direction: 'up', magnitude: 'high', confidence: 0.75 }
      }
    }
  },
  natural: {
    'hurricane-season': {
      name: '飓风季节',
      category: '自然灾害',
      effects: {
        oil: { direction: 'up', magnitude: 'medium', confidence: 0.70 },
        gas: { direction: 'up', magnitude: 'high', confidence: 0.75 }
      }
    }
  }
};

// 资产数据库
const ASSETS_DATABASE = {
  oil: {
    futures: [
      { symbol: 'CL', name: 'WTI原油期货', leverage: 15, liquidity: 5, risk: 'high' },
      { symbol: 'BZ', name: '布伦特原油期货', leverage: 15, liquidity: 5, risk: 'high' }
    ],
    etf: [
      { symbol: 'USO', name: '美国原油基金', leverage: 1, liquidity: 5, risk: 'low' },
      { symbol: 'UCO', name: '2倍做多原油', leverage: 2, liquidity: 4, risk: 'medium' },
      { symbol: 'GUSH', name: '3倍做多油气股', leverage: 3, liquidity: 3, risk: 'very-high' }
    ],
    stocks: [
      { symbol: 'XOM', name: '埃克森美孚', leverage: 1, liquidity: 5, risk: 'low', dividend: true },
      { symbol: 'CVX', name: '雪佛龙', leverage: 1, liquidity: 5, risk: 'low', dividend: true },
      { symbol: 'COP', name: '康菲石油', leverage: 1, liquidity: 4, risk: 'low', dividend: true }
    ]
  },
  gold: {
    futures: [
      { symbol: 'GC', name: '黄金期货', leverage: 20, liquidity: 5, risk: 'high' }
    ],
    etf: [
      { symbol: 'GLD', name: 'SPDR黄金ETF', leverage: 1, liquidity: 5, risk: 'low' },
      { symbol: 'IAU', name: 'iShares黄金ETF', leverage: 1, liquidity: 5, risk: 'low' }
    ]
  },
  us_stocks: {
    index_etf: [
      { symbol: 'SPY', name: 'S&P500 ETF', leverage: 1, liquidity: 5, risk: 'low' },
      { symbol: 'QQQ', name: '纳斯达克100 ETF', leverage: 1, liquidity: 5, risk: 'low' }
    ],
    inverse_etf: [
      { symbol: 'SH', name: '做空S&P500', leverage: 1, liquidity: 4, risk: 'medium' },
      { symbol: 'PSQ', name: '做空纳斯达克100', leverage: 1, liquidity: 3, risk: 'medium' },
      { symbol: 'SQQQ', name: '3倍做空纳斯达克', leverage: 3, liquidity: 4, risk: 'very-high' }
    ]
  },
  crypto: {
    spot: [
      { symbol: 'BTC', name: '比特币', leverage: 1, liquidity: 5, risk: 'high' },
      { symbol: 'ETH', name: '以太坊', leverage: 1, liquidity: 5, risk: 'high' }
    ],
    futures: [
      { symbol: 'BTCUSDT', name: 'BTC永续合约', leverage: 125, liquidity: 5, risk: 'very-high' },
      { symbol: 'ETHUSDT', name: 'ETH永续合约', leverage: 125, liquidity: 5, risk: 'very-high' }
    ]
  }
};

// 风险等级配置
const RISK_PROFILES = {
  conservative: {
    name: '保守型',
    max_leverage: 2,
    max_position_size: 0.2, // 单个品种最大仓位 20%
    prefer_dividend: true,
    avoid_leveraged_etf: true
  },
  balanced: {
    name: '平衡型',
    max_leverage: 5,
    max_position_size: 0.3,
    prefer_dividend: false,
    avoid_leveraged_etf: false
  },
  aggressive: {
    name: '激进型',
    max_leverage: 20,
    max_position_size: 0.5,
    prefer_dividend: false,
    avoid_leveraged_etf: false
  }
};

/**
 * 分析事件影响
 */
function analyzeEvent(eventKey) {
  const [category, eventId] = eventKey.split('.');
  const event = EVENT_LIBRARY[category]?.[eventId];
  
  if (!event) {
    throw new Error(`事件未找到: ${eventKey}`);
  }
  
  console.log(`\n📊 事件分析: ${event.name}`);
  console.log(`📁 类别: ${event.category}`);
  console.log(`⏱️  持续时间: ${event.duration || 'N/A'}`);
  console.log(`\n💡 影响分析:`);
  
  const opportunities = [];
  
  for (const [asset, effect] of Object.entries(event.effects)) {
    const arrow = effect.direction === 'up' ? '↑' : '↓';
    const action = effect.direction === 'up' ? '做多' : '做空';
    
    console.log(`   ${asset.toUpperCase()}: ${arrow} ${effect.magnitude} (置信度: ${(effect.confidence * 100).toFixed(0)}%)`);
    
    opportunities.push({
      asset,
      action: effect.direction,
      magnitude: effect.magnitude,
      confidence: effect.confidence
    });
  }
  
  return { event, opportunities };
}

/**
 * 筛选资产
 */
function filterAssets(assetType, action, riskProfile) {
  const profile = RISK_PROFILES[riskProfile];
  const assets = ASSETS_DATABASE[assetType];
  
  if (!assets) {
    return [];
  }
  
  let filtered = [];
  
  // 合并所有子类别
  for (const [subType, items] of Object.entries(assets)) {
    // 如果是做空，只选择 inverse_etf 或 futures
    if (action === 'down') {
      if (subType === 'inverse_etf' || subType === 'futures') {
        filtered = filtered.concat(items);
      }
    } else {
      // 做多，排除 inverse_etf
      if (subType !== 'inverse_etf') {
        filtered = filtered.concat(items);
      }
    }
  }
  
  // 根据风险偏好过滤
  filtered = filtered.filter(asset => {
    // 杠杆限制
    if (asset.leverage > profile.max_leverage) {
      return false;
    }
    
    // 保守型避免杠杆 ETF
    if (profile.avoid_leveraged_etf && asset.leverage > 1) {
      return false;
    }
    
    // 保守型偏好分红股
    if (profile.prefer_dividend && asset.dividend === false) {
      return false;
    }
    
    return true;
  });
  
  // 按流动性和风险排序
  filtered.sort((a, b) => {
    // 优先流动性
    if (a.liquidity !== b.liquidity) {
      return b.liquidity - a.liquidity;
    }
    // 其次风险（保守型优先低风险）
    const riskOrder = { 'low': 1, 'medium': 2, 'high': 3, 'very-high': 4 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
  
  return filtered;
}

/**
 * 生成投资计划
 */
function generatePlan(eventKey, riskProfile = 'balanced', capital = 10000) {
  console.log(`\n🎯 投资计划生成器`);
  console.log(`💰 资金: $${capital.toLocaleString()}`);
  console.log(`📊 风险偏好: ${RISK_PROFILES[riskProfile].name}`);
  console.log(`${'='.repeat(60)}`);
  
  // 分析事件
  const { event, opportunities } = analyzeEvent(eventKey);
  
  // 生成策略
  console.log(`\n📋 投资策略:`);
  
  const plan = {
    event: event.name,
    riskProfile: RISK_PROFILES[riskProfile].name,
    capital,
    positions: [],
    totalAllocation: 0
  };
  
  const profile = RISK_PROFILES[riskProfile];
  
  // 按置信度排序
  opportunities.sort((a, b) => b.confidence - a.confidence);
  
  // 为每个机会分配资金
  for (const opp of opportunities) {
    if (plan.totalAllocation >= 1.0) break;
    
    const assets = filterAssets(opp.asset, opp.action, riskProfile);
    
    if (assets.length === 0) {
      console.log(`\n⚠️  ${opp.asset.toUpperCase()}: 无符合风险偏好的品种`);
      continue;
    }
    
    // 根据置信度和风险偏好分配仓位
    const baseAllocation = opp.confidence * 0.5; // 最高 50%
    const allocation = Math.min(baseAllocation, profile.max_position_size);
    
    console.log(`\n${opp.action === 'up' ? '📈' : '📉'} ${opp.asset.toUpperCase()} (${opp.action === 'up' ? '做多' : '做空'}):`);
    console.log(`   置信度: ${(opp.confidence * 100).toFixed(0)}%`);
    console.log(`   建议仓位: ${(allocation * 100).toFixed(0)}%`);
    console.log(`   可选品种:`);
    
    // 显示前 3 个品种
    const topAssets = assets.slice(0, 3);
    for (let i = 0; i < topAssets.length; i++) {
      const asset = topAssets[i];
      const positionSize = (capital * allocation) / topAssets.length;
      
      console.log(`   ${i + 1}. ${asset.symbol} - ${asset.name}`);
      console.log(`      杠杆: ${asset.leverage}x | 流动性: ${'⭐'.repeat(asset.liquidity)} | 风险: ${asset.risk}`);
      console.log(`      建议金额: $${positionSize.toFixed(2)}`);
      
      plan.positions.push({
        asset: opp.asset,
        action: opp.action,
        symbol: asset.symbol,
        name: asset.name,
        allocation: allocation / topAssets.length,
        amount: positionSize,
        leverage: asset.leverage,
        risk: asset.risk
      });
    }
    
    plan.totalAllocation += allocation;
  }
  
  // 保存计划
  const planFile = path.join(__dirname, `plan-${Date.now()}.json`);
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 总仓位: ${(plan.totalAllocation * 100).toFixed(0)}%`);
  console.log(`💰 已分配资金: $${(capital * plan.totalAllocation).toFixed(2)}`);
  console.log(`💵 剩余资金: $${(capital * (1 - plan.totalAllocation)).toFixed(2)}`);
  console.log(`\n📁 计划已保存: ${planFile}`);
  
  return plan;
}

/**
 * 列出所有事件
 */
function listEvents() {
  console.log(`\n📚 事件库:`);
  
  for (const [category, events] of Object.entries(EVENT_LIBRARY)) {
    console.log(`\n📁 ${category}:`);
    for (const [eventId, event] of Object.entries(events)) {
      console.log(`   ${category}.${eventId} - ${event.name}`);
    }
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listEvents();
} else if (command === 'analyze') {
  const eventKey = args[1];
  if (!eventKey) {
    console.error('❌ 请指定事件: node investment-planner.js analyze <event>');
    process.exit(1);
  }
  analyzeEvent(eventKey);
} else if (command === 'plan') {
  const eventKey = args[1];
  const riskProfile = args[2] || 'balanced';
  const capital = parseFloat(args[3]) || 10000;
  
  if (!eventKey) {
    console.error('❌ 请指定事件: node investment-planner.js plan <event> [risk] [capital]');
    process.exit(1);
  }
  
  generatePlan(eventKey, riskProfile, capital);
} else {
  console.log(`
🎯 投资计划模块 - 使用说明

命令:
  list                           列出所有事件
  analyze <event>                分析事件影响
  plan <event> [risk] [capital]  生成投资计划

参数:
  event    事件ID (如: geopolitical.us-iran-conflict)
  risk     风险偏好 (conservative/balanced/aggressive)
  capital  投资资金 (默认: 10000)

示例:
  node investment-planner.js list
  node investment-planner.js analyze geopolitical.us-iran-conflict
  node investment-planner.js plan geopolitical.us-iran-conflict balanced 10000
  node investment-planner.js plan economic.fed-rate-hike conservative 5000
  `);
}
