#!/usr/bin/env node
/**
 * 生成EVM钱包并注册Polymarket账号
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 生成新钱包
function generateWallet() {
    console.log('🔐 生成新的EVM钱包...\n');
    
    const wallet = ethers.Wallet.createRandom();
    
    const walletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        createdAt: new Date().toISOString()
    };
    
    console.log('✅ 钱包生成成功！\n');
    console.log('📍 钱包地址:', walletInfo.address);
    console.log('🔑 私钥:', walletInfo.privateKey);
    console.log('📝 助记词:', walletInfo.mnemonic);
    console.log('');
    
    // 保存到vault（敏感信息）
    const vaultDir = path.join(__dirname, 'vault');
    if (!fs.existsSync(vaultDir)) {
        fs.mkdirSync(vaultDir, { mode: 0o700 });
    }
    
    const walletFile = path.join(vaultDir, 'polymarket-wallet.json');
    fs.writeFileSync(walletFile, JSON.stringify(walletInfo, null, 2), { mode: 0o600 });
    
    console.log('💾 钱包信息已保存到:', walletFile);
    console.log('⚠️  请妥善保管私钥和助记词！\n');
    
    return walletInfo;
}

// 主函数
async function main() {
    console.log('='.repeat(80));
    console.log('Polymarket 钱包生成器');
    console.log('='.repeat(80));
    console.log('');
    
    const wallet = generateWallet();
    
    console.log('='.repeat(80));
    console.log('下一步：注册Polymarket账号');
    console.log('='.repeat(80));
    console.log('');
    console.log('1. 访问 https://polymarket.com');
    console.log('2. 点击 "Sign Up"');
    console.log('3. 选择 "Connect Wallet"');
    console.log('4. 使用以下地址连接:');
    console.log('   ' + wallet.address);
    console.log('');
    console.log('或者，我可以帮你自动化注册流程...');
    console.log('');
    console.log('='.repeat(80));
}

if (require.main === module) {
    main().catch(err => {
        console.error('错误:', err);
        process.exit(1);
    });
}

module.exports = { generateWallet };
