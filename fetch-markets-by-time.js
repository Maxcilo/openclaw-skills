#!/usr/bin/env node
const https = require('https');

function apiRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function fetchMarkets() {
    console.log('📊 获取Polymarket市场列表...\n');
    
    try {
        // 尝试Gamma API
        const url = 'https://gamma-api.polymarket.com/markets?limit=100&active=true';
        console.log(`请求: ${url}\n`);
        
        const markets = await apiRequest(url);
        
        if (!Array.isArray(markets)) {
            console.log('❌ 数据格式错误');
            console.log(markets);
            return;
        }
        
        console.log(`✅ 找到 ${markets.length} 个市场\n`);
        
        // 提取关键信息并按结束时间排序
        const marketList = markets
            .map(m => ({
                title: m.question || m.title || 'Unknown',
                endDate: m.end_date_iso || m.endDate || m.closed_time,
                volume: parseFloat(m.volume || 0),
                liquidity: parseFloat(m.liquidity || 0),
                active: m.active !== false,
                closed: m.closed || false,
                url: `https://polymarket.com/event/${m.slug || m.id}`
            }))
            .filter(m => m.active && !m.closed && m.endDate)
            .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        
        console.log('='.repeat(80));
        console.log('按结束时间排序的市场（近期优先）');
        console.log('='.repeat(80));
        console.log('');
        console.log('排名'.padEnd(6) + '结束时间'.padEnd(20) + '交易量'.padEnd(15) + '市场');
        console.log('-'.repeat(80));
        
        marketList.slice(0, 30).forEach((m, i) => {
            const rank = (i + 1).toString().padEnd(6);
            const endDate = new Date(m.endDate).toISOString().substring(0, 16).replace('T', ' ').padEnd(20);
            const volume = ('$' + (m.volume / 1000000).toFixed(1) + 'M').padEnd(15);
            const title = m.title.substring(0, 40);
            console.log(rank + endDate + volume + title);
        });
        
        console.log('');
        console.log('='.repeat(80));
        
        // 保存到文件
        const fs = require('fs');
        fs.writeFileSync('markets-by-time.json', JSON.stringify(marketList, null, 2));
        console.log('💾 已保存到 markets-by-time.json');
        
    } catch (error) {
        console.error('❌ 获取失败:', error.message);
    }
}

fetchMarkets();
