#!/usr/bin/env node
/**
 * Chrome DevTools MCP 包装器
 * 让OpenClaw可以通过命令行使用Chrome DevTools MCP
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BROWSER_STATE_FILE = path.join(__dirname, '.chrome-devtools-state.json');

// 保存浏览器状态
function saveState(state) {
    fs.writeFileSync(BROWSER_STATE_FILE, JSON.stringify(state, null, 2));
}

// 加载浏览器状态
function loadState() {
    try {
        if (fs.existsSync(BROWSER_STATE_FILE)) {
            return JSON.parse(fs.readFileSync(BROWSER_STATE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载状态失败:', err.message);
    }
    return { browserUrl: null, pid: null };
}

// 启动Chrome DevTools MCP服务器
async function startServer(options = {}) {
    const args = [
        'chrome-devtools-mcp',
        '--no-usage-statistics',  // 禁用统计
        '--no-performance-crux',  // 禁用CrUX
    ];
    
    if (options.headless) args.push('--headless');
    if (options.isolated) args.push('--isolated');
    if (options.browserUrl) args.push(`--browserUrl=${options.browserUrl}`);
    
    console.log('启动Chrome DevTools MCP服务器...');
    console.log('命令:', 'npx', args.join(' '));
    
    const proc = spawn('npx', args, {
        stdio: 'inherit',
        detached: true
    });
    
    proc.on('error', (err) => {
        console.error('启动失败:', err);
    });
    
    // 保存进程信息
    saveState({
        pid: proc.pid,
        startTime: Date.now(),
        options
    });
    
    console.log('服务器已启动，PID:', proc.pid);
    console.log('使用 Ctrl+C 停止服务器');
    
    // 不要等待进程结束
    proc.unref();
}

// 停止服务器
function stopServer() {
    const state = loadState();
    if (state.pid) {
        try {
            process.kill(state.pid, 'SIGTERM');
            console.log('服务器已停止');
            saveState({});
        } catch (err) {
            console.error('停止失败:', err.message);
        }
    } else {
        console.log('没有运行中的服务器');
    }
}

// 命令行接口
const command = process.argv[2];

switch (command) {
    case 'start':
        const options = {
            headless: process.argv.includes('--headless'),
            isolated: process.argv.includes('--isolated'),
            browserUrl: process.argv.find(arg => arg.startsWith('--browserUrl='))?.split('=')[1]
        };
        startServer(options);
        break;
        
    case 'stop':
        stopServer();
        break;
        
    case 'status':
        const state = loadState();
        if (state.pid) {
            console.log('服务器状态: 运行中');
            console.log('PID:', state.pid);
            console.log('启动时间:', new Date(state.startTime).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}));
        } else {
            console.log('服务器状态: 未运行');
        }
        break;
        
    default:
        console.log('Chrome DevTools MCP 包装器');
        console.log('');
        console.log('用法:');
        console.log('  node chrome-mcp-wrapper.js start [--headless] [--isolated]');
        console.log('  node chrome-mcp-wrapper.js stop');
        console.log('  node chrome-mcp-wrapper.js status');
        console.log('');
        console.log('选项:');
        console.log('  --headless    无头模式');
        console.log('  --isolated    使用临时用户目录');
        console.log('  --browserUrl  连接到现有浏览器');
        break;
}
