#!/usr/bin/env node
/**
 * Simmer持仓结算监控
 * 检测持仓是否已结算，如果有结算就发送通知
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_live_c3f9aaf8996b520fdf181315659aa9d8a794b9222ec7fe85dfa8eef25eaa4028';
const STATE_FILE = path.join(__dirname, 'simmer-resolved-state.json');

function apiRequest(path) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.simmer.markets${path}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('加载状态失败:', e.message);
    }
    return { notified: [] };
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('保存状态失败:', e.message);
    }
}

function sendTelegramMessage(message) {
    try {
        const escaped = message.replace(/'/g, "'\\''");
        const cmd = `openclaw message send --channel telegram --target 6311362800 --message '${escaped}'`;
        execSync(cmd, {
            stdio: 'inherit',
            env: {
                ...process.env,
                PATH: '/root/.nvm/versions/node/v22.22.0/bin:' + process.env.PATH
            }
        });
        console.log('✓ 通知已发送');
    } catch (err) {
        console.error('发送通知失败:', err.message);
    }
}

async function main() {
    console.log(`[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 检查持仓结算...`);
    
    try {
        const positions = await apiRequest('/api/sdk/positions');
        const state = loadState();
        
        // 找出已结算的持仓
        const resolvedPositions = positions.positions.filter(p => p.status === 'resolved');
        
        // 找出新结算的（之前没通知过的）
        const newResolved = resolvedPositions.filter(p => !state.notified.includes(p.market_id));
        
        if (newResolved.length > 0) {
            console.log(`发现 ${newResolved.length} 个新结算的持仓`);
            
            // 发送通知
            const message = `🎯 持仓结算通知

${newResolved.map((p, i) => `${i + 1}. ${p.question.substring(0, 50)}
   成本: $${p.cost_basis.toFixed(2)}
   结算: $${p.current_value.toFixed(2)}
   盈亏: ${p.pnl >= 0 ? '✅' : '❌'} $${p.pnl.toFixed(2)}`).join('\n\n')}

总盈亏: $${positions.sim_pnl.toFixed(2)}
当前余额: $${(await apiRequest('/api/sdk/agents/me')).balance.toFixed(2)} $SIM`;
            
            sendTelegramMessage(message);
            
            // 更新状态
            newResolved.forEach(p => state.notified.push(p.market_id));
            saveState(state);
        } else {
            console.log('没有新结算的持仓');
        }
        
    } catch (err) {
        console.error('检查失败:', err.message);
    }
}

main();
