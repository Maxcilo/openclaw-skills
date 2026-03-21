#!/usr/bin/env node
/**
 * EVM 钱包地址生成器（使用 ethers.js）
 * 生成标准的以太坊兼容钱包地址
 * 
 * 使用方法：
 *   ./evm-wallet-gen.js                    # 生成1个地址
 *   ./evm-wallet-gen.js --count 5          # 生成5个地址
 *   ./evm-wallet-gen.js --save             # 保存到 vault/evm-wallet-*.json
 *   ./evm-wallet-gen.js --mnemonic         # 生成带助记词的钱包
 */

const { Wallet } = require('ethers');
const fs = require('fs');
const path = require('path');

// 生成随机钱包
function generateWallet() {
  const wallet = Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic ? {
      phrase: wallet.mnemonic.phrase,
      path: wallet.mnemonic.path,
      locale: wallet.mnemonic.locale
    } : null
  };
}

// 从助记词生成多个钱包（使用标准派生路径）
function generateFromMnemonic(mnemonic, index = 0) {
  // 标准以太坊派生路径: m/44'/60'/0'/0/index
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  
  // 先创建主钱包
  const masterWallet = Wallet.fromPhrase(mnemonic);
  
  // 如果 index 是 0，直接返回主钱包
  if (index === 0) {
    return {
      address: masterWallet.address,
      privateKey: masterWallet.privateKey,
      path: derivationPath,
      mnemonic: {
        phrase: mnemonic,
        path: derivationPath
      }
    };
  }
  
  // 否则需要派生
  // ethers v6 的派生方式
  const hdNode = masterWallet.mnemonic;
  if (!hdNode) {
    throw new Error('无法从助记词派生');
  }
  
  // 使用 neuter() 和 derivePath() 派生子钱包
  const derivedNode = hdNode.derivePath(derivationPath);
  const derivedWallet = new Wallet(derivedNode.privateKey);
  
  return {
    address: derivedWallet.address,
    privateKey: derivedWallet.privateKey,
    path: derivationPath,
    mnemonic: {
      phrase: mnemonic,
      path: derivationPath
    }
  };
}

// 保存到 vault
function saveToVault(wallet, index, prefix = 'evm-wallet') {
  const vaultDir = path.join(__dirname, 'vault');
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { mode: 0o700 });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${prefix}-${timestamp}-${index}.json`;
  const filepath = path.join(vaultDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(wallet, null, 2), { mode: 0o600 });
  return filepath;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  let count = 1;
  let save = false;
  let useMnemonic = false;
  let mnemonicPhrase = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--save') {
      save = true;
    } else if (args[i] === '--mnemonic') {
      useMnemonic = true;
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        mnemonicPhrase = args[i + 1];
        i++;
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
🔐 EVM 钱包地址生成器

使用方法：
  ./evm-wallet-gen.js                      # 生成1个随机钱包
  ./evm-wallet-gen.js --count 5            # 生成5个随机钱包
  ./evm-wallet-gen.js --save               # 保存到 vault/
  ./evm-wallet-gen.js --mnemonic           # 生成带助记词的钱包
  ./evm-wallet-gen.js --mnemonic "词组"    # 从助记词派生多个地址
  ./evm-wallet-gen.js --help               # 显示帮助

⚠️  安全警告：
  - 私钥和助记词是资产的唯一凭证，请妥善保管
  - 使用 --save 会将敏感信息保存到 vault/ 目录（权限 600）
  - 不要将私钥或助记词分享给任何人
  - vault/ 目录已在 .gitignore 中，不会被提交到 git
      `);
      process.exit(0);
    }
  }
  
  console.log(`\n🔐 生成 ${count} 个 EVM 钱包地址...\n`);
  
  if (useMnemonic && !mnemonicPhrase) {
    // 生成新的助记词
    const masterWallet = Wallet.createRandom();
    mnemonicPhrase = masterWallet.mnemonic.phrase;
    console.log(`📝 助记词: ${mnemonicPhrase}\n`);
    console.log(`⚠️  请务必备份助记词！可以用它恢复所有派生地址\n`);
  }
  
  for (let i = 0; i < count; i++) {
    let wallet;
    
    if (useMnemonic && mnemonicPhrase) {
      try {
        wallet = generateFromMnemonic(mnemonicPhrase, i);
        console.log(`钱包 #${i + 1} (派生路径: ${wallet.path}):`);
      } catch (error) {
        console.error(`❌ 生成钱包 #${i + 1} 失败:`, error.message);
        continue;
      }
    } else {
      wallet = generateWallet();
      console.log(`钱包 #${i + 1}:`);
    }
    
    console.log(`  地址:     ${wallet.address}`);
    console.log(`  私钥:     ${wallet.privateKey}`);
    if (wallet.mnemonic && !useMnemonic) {
      console.log(`  助记词:   ${wallet.mnemonic.phrase}`);
    }
    console.log('');
    
    if (save) {
      const filepath = saveToVault(wallet, i + 1);
      console.log(`  ✅ 已保存到: ${path.basename(filepath)}\n`);
    }
  }
  
  console.log('⚠️  警告: 请妥善保管私钥和助记词，不要泄露给任何人！');
  if (save) {
    console.log('📁 敏感文件已保存到 vault/ 目录（权限 600）\n');
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}

module.exports = { generateWallet, generateFromMnemonic, saveToVault };
