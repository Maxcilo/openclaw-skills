const ccxt = require('ccxt');

async function check() {
    const exchange = new ccxt.binance();
    const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1h', undefined, 10);
    
    const data = ohlcv.map(c => ({
        time: new Date(c[0]).toISOString().slice(0,16),
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4]
    }));
    
    console.log('最近10根1小时K线：\n');
    data.forEach((k, i) => {
        const body = Math.abs(k.close - k.open);
        const color = k.close > k.open ? '阳' : '阴';
        const top = Math.max(k.open, k.close);
        const bottom = Math.min(k.open, k.close);
        console.log(`${i}: ${k.time} | ${color}线 | 开${k.open} 收${k.close} | 实体${body.toFixed(2)} | 范围[${bottom.toFixed(2)}, ${top.toFixed(2)}]`);
    });
    
    // 检查最后3根
    const k1 = data[data.length - 3];
    const k2 = data[data.length - 2];
    const k3 = data[data.length - 1];
    
    const b1 = { top: Math.max(k1.open, k1.close), bottom: Math.min(k1.open, k1.close), size: Math.abs(k1.close - k1.open) };
    const b2 = { top: Math.max(k2.open, k2.close), bottom: Math.min(k2.open, k2.close), size: Math.abs(k2.close - k2.open) };
    const b3 = { top: Math.max(k3.open, k3.close), bottom: Math.min(k3.open, k3.close), size: Math.abs(k3.close - k3.open) };
    
    console.log('\n检查最后3根K线：');
    console.log(`K1: [${b1.bottom.toFixed(2)}, ${b1.top.toFixed(2)}] 实体${b1.size.toFixed(2)}`);
    console.log(`K2: [${b2.bottom.toFixed(2)}, ${b2.top.toFixed(2)}] 实体${b2.size.toFixed(2)} - K2在K1内? ${b2.top <= b1.top && b2.bottom >= b1.bottom}`);
    console.log(`K3: [${b3.bottom.toFixed(2)}, ${b3.top.toFixed(2)}] 实体${b3.size.toFixed(2)} - K3在K1内? ${b3.top <= b1.top && b3.bottom >= b1.bottom}`);
    console.log(`K2实体<K1*0.5? ${b2.size < b1.size * 0.5}`);
    console.log(`K3实体<K1*0.5? ${b3.size < b1.size * 0.5}`);
}

check();
