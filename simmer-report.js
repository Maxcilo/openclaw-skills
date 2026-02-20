#!/usr/bin/env node
/**
 * Simmer持仓报告 + 结算通知（合并版）
 * 每2小时运行一次
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
    } catch (e) {}
    return { notified: [] };
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {}
}

function sendMessage(message) {
    try {
        const escaped = message.replace(/'/g, "'\\''");
        execSync(`openclaw message send --channel telegram --target 6311362800 --message '${escaped}'`, {
            env: { ...process.env, PATH: '/root/.nvm/versions/node/v22.22.0/bin:' + process.env.PATH }
        });
    } catch (e) {}
}

async function main() {
    try {
        const [agent, positions] = await Promise.all([
            apiRequest('/api/sdk/agents/me'),
            apiRequest('/api/sdk/positions')
        ]);
        
        const state = loadState();
        const resolved = positions.positions.filter(p => p.status === 'resolved');
        const newResolved = resolved.filter(p => !state.notified.includes(p.market_id));
        
        // 发送结算通知（如果有）
        if (newResolved.length > 0) {
            const msg = `🎯 持仓结算通知\n\n${newResolved.map((p, i) => 
                `${i + 1}. ${p.question.substring(0, 50)}\n   成本: $${p.cost_basis.toFixed(2)}\n   结算: $${p.current_value.toFixed(2)}\n   盈亏: ${p.pnl >= 0 ? '✅' : '❌'} $${p.pnl.toFixed(2)}`
            ).join('\n\n')}\n\n总盈亏: $${positions.sim_pnl.toFixed(2)}`;
            
            sendMessage(msg);
            newResolved.forEach(p => state.notified.push(p.market_id));
            saveState(state);
        }
        
        // 发送持仓报告
        const activePositions = positions.positions.filter(p => p.status !== 'resolved');
        const msg = `📊 Simmer持仓报告 (${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})})\n\n💰 余额: $${agent.balance.toFixed(2)} $SIM\n📈 持仓数: ${activePositions.length}\n\n${activePositions.map((p, i) => 
            `${i + 1}. ${p.question.substring(0, 50)}\n   成本: $${p.cost_basis.toFixed(2)}\n   当前: $${p.current_value.toFixed(2)}\n   盈亏: $${p.pnl.toFixed(2)}`
        ).join('\n\n')}\n\n总盈亏: $${positions.sim_pnl.toFixed(2)}`;
        
        sendMessage(msg);
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
