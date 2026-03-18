#!/usr/bin/env node
/**
 * 流动性数据持久化存储
 * 智能增量更新，保留完整历史
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '..');
const DATA_DIR = path.join(WORKSPACE, 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'liquidity-storage.json');

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

async function getHistoryFRED(seriesId, days = 90) {
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startStr}&coed=${today}`;
  try {
    const csv = fetchCSV(url);
    return parseCSVMulti(csv);
  } catch (e) {
    console.warn(`⚠️ 获取 ${seriesId} 失败: ${e.message}`);
    return [];
  }
}

function loadStorage() {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    } catch (e) {
      console.warn('⚠️ 存储文件损坏，重新初始化');
    }
  }
  return {
    rrp: {},
    reserves: {},
    sofr: {},
    tga: {},
    lastUpdate: null
  };
}

function saveStorage(storage) {
  storage.lastUpdate = new Date().toISOString();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
}

async function updateStorage() {
  console.log('📥 更新流动性数据...');
  
  const storage = loadStorage();
  const lastUpdate = storage.lastUpdate ? new Date(storage.lastUpdate) : null;
  
  // 获取最近90天数据
  const [rrpHistory, reservesHistory, sofrHistory, tgaHistory] = await Promise.all([
    getHistoryFRED('RRPONTSYD', 90),
    getHistoryFRED('WRESBAL', 90),
    getHistoryFRED('SOFR', 90),
    getHistoryFRED('WTREGEN', 90)
  ]);
  
  let newCount = 0;
  
  // 更新 RRP
  rrpHistory.forEach(d => {
    if (!storage.rrp[d.observation_date]) {
      storage.rrp[d.observation_date] = d.RRPONTSYD;
      newCount++;
    }
  });
  
  // 更新 Reserves
  reservesHistory.forEach(d => {
    if (!storage.reserves[d.observation_date]) {
      storage.reserves[d.observation_date] = d.WRESBAL;
      newCount++;
    }
  });
  
  // 更新 SOFR
  sofrHistory.forEach(d => {
    if (!storage.sofr[d.observation_date]) {
      storage.sofr[d.observation_date] = d.SOFR;
      newCount++;
    }
  });
  
  // 更新 TGA
  tgaHistory.forEach(d => {
    if (!storage.tga[d.observation_date]) {
      storage.tga[d.observation_date] = (parseFloat(d.WTREGEN || 0) / 100).toString();
      newCount++;
    }
  });
  
  saveStorage(storage);
  
  console.log(`✅ 更新完成`);
  console.log(`   RRP: ${Object.keys(storage.rrp).length} 天`);
  console.log(`   Reserves: ${Object.keys(storage.reserves).length} 天`);
  console.log(`   SOFR: ${Object.keys(storage.sofr).length} 天`);
  console.log(`   TGA: ${Object.keys(storage.tga).length} 天`);
  console.log(`   新增数据点: ${newCount}`);
  console.log(`   最后更新: ${storage.lastUpdate}`);
}

function getHistory(days = 30) {
  const storage = loadStorage();
  
  // 收集所有日期
  const allDates = new Set([
    ...Object.keys(storage.rrp),
    ...Object.keys(storage.reserves),
    ...Object.keys(storage.sofr),
    ...Object.keys(storage.tga)
  ]);
  
  const sortedDates = Array.from(allDates).sort();
  
  // 前向填充
  let lastRrp = null, lastReserves = null, lastSofr = null, lastTga = null;
  const history = [];
  
  for (const date of sortedDates) {
    if (storage.rrp[date]) lastRrp = storage.rrp[date];
    if (storage.reserves[date]) lastReserves = storage.reserves[date];
    if (storage.sofr[date]) lastSofr = storage.sofr[date];
    if (storage.tga[date]) lastTga = storage.tga[date];
    
    if (lastRrp && lastReserves && lastSofr && lastTga) {
      history.push({
        date,
        rrp: lastRrp,
        reserves: lastReserves,
        sofr: lastSofr,
        tga: lastTga
      });
    }
  }
  
  // 返回最近N天
  return history.slice(-days);
}

// CLI
const command = process.argv[2];

if (command === 'update') {
  updateStorage().catch(e => {
    console.error('❌ 更新失败:', e.message);
    process.exit(1);
  });
} else if (command === 'get') {
  const days = parseInt(process.argv[3]) || 30;
  const history = getHistory(days);
  console.log(JSON.stringify({ history }, null, 2));
} else if (command === 'stats') {
  const storage = loadStorage();
  console.log('📊 存储统计:');
  console.log(`   RRP: ${Object.keys(storage.rrp).length} 天`);
  console.log(`   Reserves: ${Object.keys(storage.reserves).length} 天`);
  console.log(`   SOFR: ${Object.keys(storage.sofr).length} 天`);
  console.log(`   TGA: ${Object.keys(storage.tga).length} 天`);
  console.log(`   最后更新: ${storage.lastUpdate || '从未更新'}`);
} else {
  console.log('用法:');
  console.log('  node liquidity-storage.js update       # 更新数据');
  console.log('  node liquidity-storage.js get [days]   # 获取历史数据');
  console.log('  node liquidity-storage.js stats        # 查看统计');
}

module.exports = { updateStorage, getHistory, loadStorage };
