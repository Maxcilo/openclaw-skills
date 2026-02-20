#!/usr/bin/env node
/**
 * 自动化注册Polymarket账号
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 执行agent-browser命令
function agentBrowser(command) {
    try {
        const result = execSync(`agent-browser ${command}`, { 
            encoding: 'utf8',
            timeout: 30000
        });
        return result;
    } catch (err) {
        console.error('命令执行失败:', err.message);
        return null;
    }
}

// 加载钱包信息
function loadWallet() {
    const walletFile = path.join(__dirname, 'vault', 'polymarket-wallet.json');
    if (!fs.existsSync(walletFile)) {
        console.error('❌ 钱包文件不存在，请先运行 generate-polymarket-wallet.js');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(walletFile, 'utf8'));
}

// 注册Polymarket账号
async function registerPolymarket() {
    console.log('='.repeat(80));
    console.log('Polymarket 自动注册');
    console.log('='.repeat(80));
    console.log('');
    
    const wallet = loadWallet();
    console.log('📍 使用钱包地址:', wallet.address);
    console.log('');
    
    console.log('步骤1：打开Polymarket首页...');
    agentBrowser('open https://polymarket.com');
    agentBrowser('wait 3000');
    
    console.log('步骤2：查找Sign Up按钮...');
    const snapshot = agentBrowser('snapshot -i');
    console.log(snapshot);
    
    console.log('');
    console.log('⚠️  注意：');
    console.log('Polymarket需要连接钱包（如MetaMask）才能注册');
    console.log('agent-browser无法直接操作浏览器钱包扩展');
    console.log('');
    console.log('💡 替代方案：');
    console.log('1. 手动在浏览器中导入钱包');
    console.log('2. 使用Polymarket API直接交互');
    console.log('3. 使用Puppeteer + MetaMask自动化');
    console.log('');
    
    agentBrowser('close');
    
    console.log('='.repeat(80));
    console.log('钱包信息：');
    console.log('地址:', wallet.address);
    console.log('私钥:', wallet.privateKey);
    console.log('助记词:', wallet.mnemonic);
    console.log('='.repeat(80));
}

// 主函数
if (require.main === module) {
    registerPolymarket().catch(err => {
        console.error('注册失败:', err);
        process.exit(1);
    });
}

module.exports = { registerPolymarket };
