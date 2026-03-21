#!/usr/bin/env node
/**
 * 代币对比工具 v6
 * - 优先级：代币名→交易所(币安现货/合约)→链上
 * - 支持手动修正数据并保存
 * - 所有字段都尝试获取，没有则空
 * - 参数竖向，代币横向
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'token-manual-data.json');

const colors = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', red: '\x1b[31m' };
function log(msg, color = 'reset') { console.log(colors[color] + msg + colors.reset); }

async function httpGet(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        return await res.json();
    } catch { return null; }
}

function formatNum(n, d = 2) {
    if (!n && n !== 0) return '';
    const v = parseFloat(n);
    if (isNaN(v)) return '';
    if (v >= 1e9) return (v/1e9).toFixed(d) + 'B';
    if (v >= 1e6) return (v/1e6).toFixed(d) + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(d) + 'K';
    return v.toFixed(d);
}

function formatSupply(n) {
    if (!n && n !== 0) return '';
    const v = parseFloat(n);
    if (isNaN(v)) return '';
    if (v >= 1e9) return (v/1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(2) + 'K';
    return v.toFixed(0);
}

function formatPrice(n) {
    if (!n && n !== 0) return '';
    const v = parseFloat(n);
    if (isNaN(v)) return '';
    if (v >= 1000) return '$' + v.toFixed(0);
    if (v >= 1) return '$' + v.toFixed(2);
    if (v >= 0.01) return '$' + v.toFixed(4);
    return '$' + v.toFixed(6);
}

function loadManualData() {
    try {
        if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {}
    return {};
}

function saveManualData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function manualOverride(symbol, field, value) {
    const data = loadManualData();
    if (!data[symbol]) data[symbol] = {};
    if (value === undefined || value === null || value === '') {
        delete data[symbol][field];
        if (Object.keys(data[symbol]).length === 0) delete data[symbol];
    } else {
        data[symbol][field] = value;
    }
    saveManualData(data);
    return data;
}

function listManualData() {
    const data = loadManualData();
    if (Object.keys(data).length === 0) { console.log('暂无手动修正数据'); return; }
    console.log('手动修正数据:');
    console.log(JSON.stringify(data, null, 2));
}

function isContractAddress(str) { return /^0x[a-fA-F0-9]{40}$/.test(str); }

async function getBinanceSpot(symbol) {
    const data = await httpGet(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`);
    return data?.lastPrice ? data : null;
}

// OKX 现货
async function getOkxSpot(symbol) {
    const data = await httpGet(`https://www.okx.com/priapi/v5/market/ticker?instId=${symbol.toUpperCase()}-USDT`);
    return data?.data?.[0] ? data.data[0] : null;
}

// OKX 合约
async function getOkxSwap(symbol) {
    const data = await httpGet(`https://www.okx.com/priapi/v5/market/ticker?instId=${symbol.toUpperCase()}-USDT-SWAP`);
    return data?.data?.[0] ? data.data[0] : null;
}

async function getBinanceFutures(symbol) {
    const data = await httpGet(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`);
    return data?.lastPrice ? data : null;
}

async function getBinanceWeb3(keyword) {
    const data = await httpGet(`https://web3.binance.com/bapi/defi/v5/public/wallet-direct/buw/wallet/market/token/search?keyword=${encodeURIComponent(keyword)}&chainIds=56,8453,CT_501`);
    if (data?.success && data?.data?.[0]) {
        const upper = keyword.toUpperCase();
        const exact = data.data.find(t => t.symbol?.toUpperCase() === upper);
        if (exact) return exact;
        const base = data.data.find(t => t.chainId === '8453');
        return base || data.data[0];
    }
    return null;
}

async function getCoinGecko(symbol) {
    const idMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana', 
        'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'DOT': 'polkadot', 'MATIC': 'matic-network',
        'LTC': 'litecoin', 'AVAX': 'avalanche-2', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos',
        'LIT': 'lighter', 'HYPE': 'hyperliquid', 'EDGE': 'edge', 'EDG': 'edge' };
    const id = idMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const data = await httpGet(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&sparkline=false`);
    return Array.isArray(data) && data[0] ? data[0] : null;
}

// 基础代币名称映射（后备）
const NAME_FALLBACK = {
    'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'BNB': 'BNB', 'SOL': 'Solana',
    'XRP': 'XRP', 'ADA': 'Cardano', 'DOGE': 'Dogecoin', 'DOT': 'Polkadot',
    'MATIC': 'Polygon', 'LTC': 'Litecoin', 'AVAX': 'Avalanche', 'LINK': 'Chainlink',
    'UNI': 'Uniswap', 'ATOM': 'Cosmos', 'LIT': 'Lighter', 'HYPE': 'Hyperliquid',
    'EDGE': 'Edge', 'PEPE': 'Pepe'
};

// 缓存机制
const CACHE = {
    names: {},      // 代币名称
    prices: {},    // 价格数据（5分钟有效）
    expires: 5 * 60 * 1000  // 5分钟
};

function getCached(key, type = 'prices') {
    const item = CACHE[type][key];
    if (item && Date.now() - item.time < CACHE.expires) {
        return item.data;
    }
    return null;
}

function setCached(key, data, type = 'prices') {
    CACHE[type][key] = { data, time: Date.now() };
}

// 获取所有数据源
async function fetchAllData(token) {
    const results = { binanceSpot: null, binanceFutures: null, okxSpot: null, okxSwap: null, web3: null, cg: null, name: null };
    
    // 尝试从 API 获取名称（优先 OKX）
    if (!CACHE.names[token.toUpperCase()]) {
        const okxName = await getOkxSpot(token);
        if (okxName?.instId) {
            // OKX 返回格式: LIT-USDT -> 提取 LIT
            CACHE.names[token.toUpperCase()] = okxName.instId.replace('-USDT', '');
        }
    }
    results.name = CACHE.names[token.toUpperCase()] || token.toUpperCase();
    
    // 并行请求所有数据源
    const [binanceSpot, binanceFutures, okxSpot, okxSwap, web3, cg] = await Promise.all([
        getBinanceSpot(token),
        getBinanceFutures(token),
        getOkxSpot(token),
        getOkxSwap(token),
        getBinanceWeb3(token),
        getCoinGecko(token)
    ]);
    
    results.binanceSpot = binanceSpot;
    results.binanceFutures = binanceFutures;
    results.okxSpot = okxSpot;
    results.okxSwap = okxSwap;
    results.web3 = web3;
    results.cg = cg;
    
    return results;
}

// 合并数据 - 8个字段必须有值，用后续数据源补充
function mergeData(allData, manualData, token) {
    const upper = token.toUpperCase();
    const manual = manualData[upper] || {};
    
    // 来源 - 只显示主要来源（优先数据源）
    let source = '';
    if (allData.binanceSpot) source = '币安现货';
    else if (allData.binanceFutures) source = '币安合约';
    else if (allData.okxSpot) source = 'OKX';
    else if (allData.okxSwap) source = 'OKX合约';
    else if (allData.web3) source = '链上';
    else if (allData.cg) source = 'CG';
    
    // 价格 - 币安>OKX>Web3>CG
    let price = manual.price 
        || allData.binanceSpot?.lastPrice 
        || allData.binanceFutures?.lastPrice 
        || allData.okxSpot?.last 
        || allData.okxSwap?.last 
        || allData.web3?.price 
        || allData.cg?.current_price
        || '';
    
    // 24h - 币安>OKX
    let changeStr = '';
    if (allData.binanceSpot?.lastPrice && allData.binanceSpot?.openPrice) {
        const c = (parseFloat(allData.binanceSpot.lastPrice) - parseFloat(allData.binanceSpot.openPrice)) / parseFloat(allData.binanceSpot.openPrice) * 100;
        changeStr = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
    } else if (allData.binanceFutures?.lastPrice && allData.binanceFutures?.openPrice) {
        const c = (parseFloat(allData.binanceFutures.lastPrice) - parseFloat(allData.binanceFutures.openPrice)) / parseFloat(allData.binanceFutures.openPrice) * 100;
        changeStr = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
    } else if (allData.okxSpot?.last && allData.okxSpot?.open24h) {
        const c = (parseFloat(allData.okxSpot.last) - parseFloat(allData.okxSpot.open24h)) / parseFloat(allData.okxSpot.open24h) * 100;
        changeStr = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
    } else if (allData.okxSwap?.last && allData.okxSwap?.open24h) {
        const c = (parseFloat(allData.okxSwap.last) - parseFloat(allData.okxSwap.open24h)) / parseFloat(allData.okxSwap.open24h) * 100;
        changeStr = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
    }
    
    // 市值 - 手动>CG>Web3
    let marketCap = manual.marketCap || allData.cg?.market_cap || allData.web3?.marketCap || '';
    // 如果市值还是没有，用价格×流通量估算
    if (!marketCap && price && circulating) {
        marketCap = parseFloat(price) * circulating;
    }
    
    // 流通量 - 手动>CG
    let circulating = manual.circulating ? parseFloat(manual.circulating) : (allData.cg?.circulating_supply || '');
    
    // 总量 - 手动>CG
    let total = manual.total ? parseFloat(manual.total) : (allData.cg?.total_supply || '');
    
    // FDV - 手动>CG>价格×总量
    let fdv = manual.fdv || allData.cg?.fully_diluted_valuation || '';
    // 如果没有FDV，用价格×总量计算
    if (!fdv && price && total) {
        fdv = parseFloat(price) * total;
    }
    
    // 成交量 - 币安>OKX>Web3
    let volume = allData.binanceSpot?.quoteVolume || allData.binanceFutures?.quoteVolume || allData.okxSpot?.volCcy24h || allData.okxSwap?.volCcy24h || allData.web3?.volume24h || '';
    
    // 流通率 - 计算
    let circRate = '';
    if (circulating && total) {
        circRate = (circulating / total * 100).toFixed(1) + '%';
    }
    
    return { source, price, change: changeStr, marketCap, fdv, volume, circulating, total, circRate };
}

async function compareTokens(tokens) {
    log(`\n🔍 对比代币: ${tokens.join(', ')}\n`, 'cyan');
    
    const manualData = loadManualData();
    const allData = {};
    const results = {};
    
    for (const token of tokens) {
        allData[token] = await fetchAllData(token);
        results[token.toUpperCase()] = mergeData(allData[token], manualData, token);
    }
    
    // 获取名称：全称 + 缩写（分行）
    const fullNames = tokens.map(t => CACHE.names[t.toUpperCase()] || NAME_FALLBACK[t.toUpperCase()] || t.toUpperCase());
    const symbols = tokens.map(t => t.toUpperCase());
    const maxFull = Math.max(...fullNames.map(t => t.length));
    const tokenWidth = Math.max(12, maxFull);
    const colWidth = tokenWidth;
    
    console.log('════════════════════════════════════════════════════════════════════════════════════');
    console.log('│ ' + ''.padEnd(tokenWidth) + ' │ ' + fullNames.map(t => t.padEnd(tokenWidth)).join(' │ ') + ' │');
    console.log('│ ' + ''.padEnd(tokenWidth) + ' │ ' + symbols.map(t => `(${t})`.padEnd(tokenWidth)).join(' │ ') + ' │');
    console.log('════════════════════════════════════════════════════════════════════════════════════');
    
    const params = [
        { key: 'source', label: '来源', fmt: v => v || '' },
        { key: 'price', label: '价格', fmt: v => formatPrice(v) },
        { key: 'change', label: '24h', fmt: v => v || '' },
        { key: 'volume', label: '成交量', fmt: v => formatNum(v) },
        { key: 'marketCap', label: '市值', fmt: v => formatNum(v) },
        { key: 'fdv', label: 'FDV', fmt: v => formatNum(v) },
        { key: 'circulating', label: '流通量', fmt: v => formatSupply(v) },
        { key: 'total', label: '总量', fmt: v => formatSupply(v) },
        { key: 'circRate', label: '流通率', fmt: v => v }
    ];
    
    for (const param of params) {
        const label = param.label.padEnd(tokenWidth);
        let row = `│ ${label} │ `;
        for (const token of tokens) {
            const upper = token.toUpperCase();
            let val = results[upper]?.[param.key];
            // 应用格式化
            if (val !== undefined && val !== '' && val !== null) {
                if (param.key === 'price') val = formatPrice(val);
                else if (param.key === 'source') val = val;
                else if (param.key === 'change') val = val;
                else if (['marketCap', 'fdv', 'volume'].includes(param.key)) val = formatNum(val);
                else if (['circulating', 'total'].includes(param.key)) val = formatSupply(val);
                else val = val;
            } else {
                val = '';
            }
            row += val.toString().padEnd(colWidth) + ' │ ';
        }
        console.log(row);
    }
    
    console.log('═════════════════════════════════════════════════════════════════════');
    console.log('📊 数据来源: OKX/币安现货, OKX/币安合约, Web3, CoinGecko');
    
    const modified = tokens.filter(t => manualData[t.toUpperCase()]);
    if (modified.length > 0) console.log(`✏️ 手动修正: ${modified.join(', ')}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('用法:');
    console.log('  node token-compare.js <代币1> <代币2> ...    对比代币');
    console.log('  node token-compare.js set <代币> <字段> <值>   手动修正');
    console.log('  node token-compare.js list                       查看手动修正');
    console.log('  node token-compare.js clear <代币>              清除修正');
    process.exit(1);
}

if (args[0] === 'list') listManualData();
else if (args[0] === 'set' && args.length >= 4) {
    const symbol = args[1].toUpperCase();
    manualOverride(symbol, args[2], args[3]);
    console.log(`✅ 已修正 ${symbol}.${args[2]} = ${args[3]}`);
} else if (args[0] === 'clear' && args.length >= 2) {
    manualOverride(args[1].toUpperCase(), 'total', '');
    console.log(`✅ 已清除 ${args[1].toUpperCase()} 的修正数据`);
} else compareTokens(args);
