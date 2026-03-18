#!/usr/bin/env node
/**
 * US Treasury & Federal Reserve 流动性监控 v2.2
 * 核心指标: RRP, Bank Reserves, SOFR, TGA, Fed Balance Sheet
 * 新增: ASCII 图表可视化 + PNG 图表生成
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '..');
const DATA_DIR = path.join(WORKSPACE, 'data');
const DATA_FILE = path.join(DATA_DIR, 'liquidity-monitor.json');
const CONFIG_FILE = path.join(DATA_DIR, 'liquidity-config.json');

// 默认配置
const DEFAULT_CONFIG = {
  thresholds: {
    rrp: {
      critical: 100,
      warning: 500
    },
    reserves: {
      critical: 2.6,
      warning: 2.8,
      normal: 3.0,
      abundant: 3.2
    },
    sofr: {
      spike: 0.15,
      rise: 0.08
    },
    tga: {
      target: { min: 6000, max: 8500 },
      safety: 5000
    }
  },
  tgaMonthlyPeaks: {
    '01': 7842, '02': 8380, '03': 8093, '04': 9414, '05': 9172,
    '06': 7654, '07': 7865, '08': 7941, '09': 8068, '10': 9579,
    '11': 9538, '12': 9372
  },
  tgaTargets: {
    '03': { endTarget: 8500, label: '3月底目标' },
    '04': { endTarget: 10250, label: '4月底峰值（税收季）' }
  }
};

// ASCII 图表生成
function drawSparkline(data, width = 30, height = 5) {
  if (!data || data.length === 0) return '';
  
  const values = data.map(d => parseFloat(d));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  
  return values.slice(-width).map(v => {
    const normalized = (v - min) / range;
    const index = Math.floor(normalized * (chars.length - 1));
    return chars[index];
  }).join('');
}

function drawBarChart(value, max, width = 30, label = '') {
  const filled = Math.floor((value / max) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = ((value / max) * 100).toFixed(1);
  return `${label.padEnd(12)} ${bar} ${percent}%`;
}

function drawTrendIndicator(current, previous) {
  if (!previous) return '━';
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  
  if (Math.abs(changePercent) < 1) return '━ 持平';
  if (change > 0) return `↗ +${changePercent.toFixed(1)}%`;
  return `↘ ${changePercent.toFixed(1)}%`;
}

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    }
  } catch (e) {
    console.warn('⚠️ 配置文件加载失败，使用默认配置');
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return DEFAULT_CONFIG;
}

const CONFIG = loadConfig();

function fetchCSV(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const data = execSync(`curl -s --max-time 30 "${url}"`, { encoding: 'utf8' });
      if (data && data.length > 0) {
        return data;
      }
    } catch (err) {
      if (i === retries) {
        throw new Error(`Failed to fetch ${url}: ${err.message}`);
      }
      execSync('sleep 2');
    }
  }
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const lastLine = lines[lines.length - 1];
  const values = lastLine.split(',');
  const result = {};
  headers.forEach((h, i) => result[h] = values[i]);
  return result;
}

function parseCSVMulti(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, j) => row[h] = values[j]);
      data.push(row);
    }
  }
  return data;
}

function loadHistory() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️ 历史数据加载失败');
  }
  return { history: [] };
}

function saveHistory(data) {
  const history = loadHistory();
  history.history.push(data);
  if (history.history.length > 90) {
    history.history = history.history.slice(-90);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
}

function calculateMA(data, field, days) {
  if (data.length < days) return null;
  const recent = data.slice(-days);
  const sum = recent.reduce((acc, d) => acc + parseFloat(d[field] || 0), 0);
  return sum / days;
}

function calculateNetLiquidity(rrp, reserves, tga) {
  const rrpT = rrp / 1000;
  const reservesT = reserves / 1000000;
  const tgaT = tga / 10000;
  return rrpT + reservesT - tgaT;
}

function assessLiquidityRisk(current, history) {
  const alerts = [];
  let level = '✅ 正常';
  const { thresholds } = CONFIG;
  
  const rrp = parseFloat(current.rrp);
  const reserves = parseFloat(current.reserves) / 1000000;
  const sofr = parseFloat(current.sofr);
  const tga = parseFloat(current.tga);
  
  if (rrp < thresholds.rrp.critical) {
    alerts.push('🔴 RRP接近0，流动性紧张');
    level = '🔴 风险';
  } else if (rrp < thresholds.rrp.warning) {
    alerts.push('⚠️ RRP偏低，注意流动性');
    if (level !== '🔴 风险') level = '🟡 警惕';
  }
  
  if (reserves < thresholds.reserves.critical) {
    alerts.push(`🔴 准备金跌破${thresholds.reserves.critical}万亿，流动性稀缺`);
    level = '🔴 风险';
  } else if (reserves < thresholds.reserves.warning) {
    alerts.push(`⚠️ 准备金偏紧（${thresholds.reserves.critical}-${thresholds.reserves.warning}万亿）`);
    if (level !== '🔴 风险') level = '🟡 警惕';
  }
  
  if (history.length > 0) {
    const lastSofr = parseFloat(history[history.length - 1].sofr);
    const change = sofr - lastSofr;
    if (change > thresholds.sofr.spike) {
      alerts.push(`🔴 SOFR突然上升 ${change.toFixed(2)}%`);
      level = '🔴 风险';
    } else if (change > thresholds.sofr.rise) {
      alerts.push(`⚠️ SOFR上升 ${change.toFixed(2)}%`);
      if (level !== '🔴 风险') level = '🟡 警惕';
    }
  }
  
  if (tga < thresholds.tga.safety) {
    alerts.push(`🔴 TGA低于安全线（${thresholds.tga.safety}亿）`);
    level = '🔴 风险';
  }
  
  if (history.length >= 7) {
    const recent7 = history.slice(-7);
    const netLiquidities = recent7.map(h => 
      calculateNetLiquidity(parseFloat(h.rrp), parseFloat(h.reserves), parseFloat(h.tga))
    );
    const currentNet = calculateNetLiquidity(rrp, parseFloat(current.reserves), tga);
    const avgNet = netLiquidities.reduce((a, b) => a + b, 0) / netLiquidities.length;
    const change = ((currentNet - avgNet) / avgNet) * 100;
    
    if (change < -5) {
      alerts.push(`⚠️ 净流动性7日下降 ${Math.abs(change).toFixed(1)}%`);
      if (level !== '🔴 风险') level = '🟡 警惕';
    }
  }
  
  return { level, alerts };
}

async function getLatestFRED(seriesId) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=2026-02-01&coed=${today}`;
  try {
    const csv = fetchCSV(url);
    return parseCSV(csv);
  } catch (e) {
    console.warn(`⚠️ 获取 ${seriesId} 失败: ${e.message}`);
    return null;
  }
}

async function getHistoryFRED(seriesId, days = 30) {
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startStr}&coed=${today}`;
  try {
    const csv = fetchCSV(url);
    return parseCSVMulti(csv);
  } catch (e) {
    console.warn(`⚠️ 获取 ${seriesId} 历史数据失败: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('💧 流动性监控 v2.1\n');
  
  const results = await Promise.allSettled([
    getLatestFRED('RRPONTSYD'),
    getLatestFRED('WRESBAL'),
    getLatestFRED('SOFR'),
    getLatestFRED('WTREGEN'),
    getLatestFRED('WALCL'),
    getHistoryFRED('RRPONTSYD', 30),
    getHistoryFRED('WRESBAL', 30),
    getHistoryFRED('SOFR', 30),
    getHistoryFRED('WTREGEN', 30),
    getHistoryFRED('WALCL', 30)  // 添加美联储资产负债表历史
  ]);
  
  const [rrp, reserves, sofr, tgaLatest, fedBS, rrpHistory, reservesHistory, sofrHistory, tgaHistory, fedBSHistory] = 
    results.map(r => r.status === 'fulfilled' ? r.value : null);
  
  if (!rrp || !reserves || !sofr) {
    console.error('❌ 关键数据获取失败，无法继续');
    process.exit(1);
  }
  
  const tgaCurrent = tgaLatest ? parseFloat(tgaLatest.WTREGEN) / 100 : 0;
  const fedBSCurrent = fedBS ? parseFloat(fedBS.WALCL) / 1000 : 0;
  
  const current = {
    date: new Date().toISOString().slice(0, 10),
    rrp: rrp.RRPONTSYD || '0',
    reserves: reserves.WRESBAL || '0',
    sofr: sofr.SOFR || '0',
    tga: tgaCurrent.toString(),
    fedBS: fedBSCurrent.toString()
  };
  
  // 构建历史数据 - 使用日期匹配而不是索引匹配
  const history = [];
  const dateMap = {};
  
  // 收集所有数据到 dateMap
  rrpHistory?.forEach(d => {
    if (!dateMap[d.observation_date]) dateMap[d.observation_date] = {};
    dateMap[d.observation_date].rrp = d.RRPONTSYD;
  });
  
  reservesHistory?.forEach(d => {
    if (!dateMap[d.observation_date]) dateMap[d.observation_date] = {};
    dateMap[d.observation_date].reserves = d.WRESBAL;
  });
  
  sofrHistory?.forEach(d => {
    if (!dateMap[d.observation_date]) dateMap[d.observation_date] = {};
    dateMap[d.observation_date].sofr = d.SOFR;
  });
  
  tgaHistory?.forEach(d => {
    if (!dateMap[d.observation_date]) dateMap[d.observation_date] = {};
    dateMap[d.observation_date].tga = (parseFloat(d.WTREGEN || 0) / 100).toString();
  });
  
  fedBSHistory?.forEach(d => {
    if (!dateMap[d.observation_date]) dateMap[d.observation_date] = {};
    dateMap[d.observation_date].fedBS = (parseFloat(d.WALCL || 0) / 1000).toString();
  });
  
  // 前向填充并构建历史数组
  const sortedDates = Object.keys(dateMap).sort();
  let lastRrp = null, lastReserves = null, lastSofr = null, lastTga = null, lastFedBS = null;
  
  for (const date of sortedDates) {
    if (dateMap[date].rrp) lastRrp = dateMap[date].rrp;
    if (dateMap[date].reserves) lastReserves = dateMap[date].reserves;
    if (dateMap[date].sofr) lastSofr = dateMap[date].sofr;
    if (dateMap[date].tga) lastTga = dateMap[date].tga;
    if (dateMap[date].fedBS) lastFedBS = dateMap[date].fedBS;
    
    if (lastRrp && lastReserves && lastSofr && lastTga) {
      history.push({
        date,
        rrp: lastRrp,
        reserves: lastReserves,
        sofr: lastSofr,
        tga: lastTga,
        fedBS: lastFedBS
      });
    }
  }
  
  saveHistory(current);
  const risk = assessLiquidityRisk(current, history);
  
  console.log('📅 ' + current.date + '\n');
  
  console.log('💧 流动性监控\n');
  
  // 核心指标
  const rrpVal = parseFloat(current.rrp);
  const reservesVal = parseFloat(current.reserves) / 1000000;
  const sofrVal = parseFloat(current.sofr);
  
  let rrpStatus = '✅';
  if (rrpVal < CONFIG.thresholds.rrp.critical) rrpStatus = '⚠️';
  
  let reservesStatus = '✅';
  if (reservesVal > CONFIG.thresholds.reserves.abundant) reservesStatus = '💧';
  else if (reservesVal < CONFIG.thresholds.reserves.critical) reservesStatus = '🔴';
  else if (reservesVal < CONFIG.thresholds.reserves.warning) reservesStatus = '⚠️';
  
  console.log('核心指标：\n');
  console.log('• 💵 RRP（逆回购）：' + (rrpVal * 10).toFixed(2) + ' 亿 ' + rrpStatus);
  console.log('• 🏦 Bank Reserves（银行准备金）：' + reservesVal.toFixed(2) + ' 万亿 ' + reservesStatus);
  console.log('• 📈 SOFR（担保隔夜融资利率）：' + sofrVal.toFixed(2) + '% ✅');
  
  console.log('\n风险评估：\n');
  console.log('• ' + risk.level);
  if (risk.alerts.length > 0) {
    risk.alerts.forEach(a => console.log('• ' + a));
  }
  
  // 净流动性
  const netLiquidity = calculateNetLiquidity(rrpVal, parseFloat(current.reserves), tgaCurrent);
  console.log('\n💰 净流动性：' + netLiquidity.toFixed(2) + ' 万亿');
  console.log('   计算公式：RRP + Bank Reserves - TGA');
  
  // TGA
  const month = new Date().toISOString().slice(5, 7);
  const monthlyPeak = CONFIG.tgaMonthlyPeaks[month];
  if (monthlyPeak) {
    const diff = tgaCurrent - monthlyPeak;
    const flow = diff > 0 ? '💧 月底释放' + diff.toFixed(0) + '亿' : '🔴 月底回收' + Math.abs(diff).toFixed(0) + '亿';
    console.log('• TGA：' + tgaCurrent.toFixed(0) + '亿，' + flow + '（预测值：' + monthlyPeak + '亿）');
  }
  
  // 美联储资产负债表
  if (fedBSCurrent > 0) {
    // 判断 QT/QE 状态
    let qtStatus = '';
    if (history.length >= 2 && history[0].fedBS) {  // 至少需要2条数据
      const fedBS30dAgo = parseFloat(history[0].fedBS);
      if (fedBS30dAgo > 0) {
        const fedBSChange = fedBSCurrent - fedBS30dAgo;
        const fedBSChangePercent = (fedBSChange / fedBS30dAgo * 100).toFixed(2);
        const days = history.length;
        if (fedBSChange < 0) {
          qtStatus = '🔴 QT进行中（' + days + '日 ' + fedBSChangePercent + '%）';
        } else {
          qtStatus = '🟢 QE进行中（' + days + '日 +' + fedBSChangePercent + '%）';
        }
      } else {
        qtStatus = '（数据不足）';
      }
    } else {
      qtStatus = '（数据不足）';
    }
    console.log('• 🏦 美联储资产负债表：' + fedBSCurrent.toFixed(2) + '万亿 ' + qtStatus);
  }
  
  // 数据解读
  console.log('\n📖 数据解读：\n');
  
  // RRP解读
  if (rrpVal < 10) {
    console.log('• RRP极度紧张：当前' + (rrpVal * 10).toFixed(1) + '亿，接近枯竭。这是短期资金市场压力的警示信号。');
  } else if (rrpVal < 50) {
    console.log('• RRP偏低：当前' + (rrpVal * 10).toFixed(1) + '亿，市场流动性紧张。');
  } else {
    console.log('• RRP正常：当前' + (rrpVal * 10).toFixed(1) + '亿，短期资金充裕。');
  }
  
  // 净流动性解读
  if (history.length >= 7) {
    const netMA7 = history.slice(-7).map(h => 
      calculateNetLiquidity(parseFloat(h.rrp), parseFloat(h.reserves), parseFloat(h.tga))
    ).reduce((a, b) => a + b, 0) / 7;
    const change7d = netLiquidity - netMA7;
    const changePercent = (change7d / netMA7) * 100;
    
    if (changePercent > 2) {
      console.log('• 净流动性改善：7日上升' + changePercent.toFixed(1) + '%，市场流动性环境好转。');
    } else if (changePercent < -2) {
      console.log('• 净流动性收紧：7日下降' + Math.abs(changePercent).toFixed(1) + '%，需关注流动性压力。');
    } else {
      console.log('• 净流动性稳定：7日变化' + changePercent.toFixed(1) + '%，维持在' + netLiquidity.toFixed(2) + '万亿。');
    }
  }
  
  // 准备金解读
  if (reservesVal > CONFIG.thresholds.reserves.abundant) {
    console.log('• 准备金充裕：' + reservesVal.toFixed(2) + '万亿，银行体系流动性充足。');
  } else if (reservesVal < CONFIG.thresholds.reserves.warning) {
    console.log('• 准备金偏紧：' + reservesVal.toFixed(2) + '万亿，接近警戒线。');
  }
  
  // TGA解读
  const monthlyPeak2 = CONFIG.tgaMonthlyPeaks[month];
  if (monthlyPeak2) {
    const diff = tgaCurrent - monthlyPeak2;
    if (diff < 0) {
      console.log('• TGA回收预期：月底需回收' + Math.abs(diff).toFixed(0) + '亿达到预测值（' + monthlyPeak2 + '亿），将抽离市场流动性。');
    } else {
      console.log('• TGA释放预期：月底可释放' + diff.toFixed(0) + '亿（预测值：' + monthlyPeak2 + '亿），将增加市场流动性。');
    }
  }
  
  // 综合结论
  console.log('\n🎯 综合结论：');
  if (risk.level === '🔴 风险') {
    console.log('市场流动性处于紧张状态，RRP接近枯竭是主要风险点。虽然准备金充足，但短期资金市场压力较大，需密切关注。');
  } else if (risk.level === '🟡 警惕') {
    console.log('市场流动性偏紧，需要关注流动性指标变化，但整体风险可控。');
  } else {
    console.log('市场流动性正常，各项指标健康，流动性环境良好。');
  }
  
  console.log('\n💡 配置文件: ' + CONFIG_FILE);
  
  // 生成图表
  console.log('\n📊 生成图表...');
  try {
    execSync('node ' + path.join(__dirname, 'liquidity-chart.js'), { 
      stdio: 'pipe',
      cwd: path.dirname(__dirname)
    });
    console.log('✅ 图表已生成: data/charts/');
    
    // 输出图片路径，让 AI 在第二条消息中发送
    console.log('\n---SEND_IMAGE---');
    console.log('/root/.openclaw/workspace/data/charts/liquidity-combined.png');
    console.log('---END_IMAGE---');
  } catch (e) {
    console.warn('⚠️ 图表生成失败:', e.message);
  }
}

main().catch(e => {
  console.error('❌ 执行失败:', e.message);
  process.exit(1);
});
