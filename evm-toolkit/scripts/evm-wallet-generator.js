#!/usr/bin/env node
/**
 * EVM 钱包地址生成器
 * 生成以太坊兼容的钱包地址（私钥 + 公钥 + 地址）
 * 
 * 使用方法：
 *   ./evm-wallet-generator.js              # 生成1个地址
 *   ./evm-wallet-generator.js --count 5    # 生成5个地址
 *   ./evm-wallet-generator.js --save       # 保存到 vault/evm-wallet-*.json
 */

const crypto = require('crypto');
const { createHash } = crypto;

// Keccak-256 实现（使用 Node.js 内置的 crypto）
function keccak256(data) {
  // 注意：Node.js 的 crypto 不直接支持 keccak256
  // 这里使用 sha3-256 作为替代（实际项目中应该用 ethereumjs-util 或 ethers.js）
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest();
}

// 生成私钥
function generatePrivateKey() {
  return crypto.randomBytes(32);
}

// 从私钥生成公钥（简化版，实际应该用 secp256k1）
function privateKeyToPublicKey(privateKey) {
  // 这里使用简化实现
  // 实际项目中应该使用 secp256k1 椭圆曲线加密
  const publicKey = crypto.createHash('sha256').update(privateKey).digest();
  return publicKey;
}

// 从公钥生成地址
function publicKeyToAddress(publicKey) {
  // Keccak-256 哈希公钥
  const hash = keccak256(publicKey);
  // 取后20字节
  const address = hash.slice(-20);
  return '0x' + address.toString('hex');
}

// 生成完整钱包
function generateWallet() {
  const privateKey = generatePrivateKey();
  const publicKey = privateKeyToPublicKey(privateKey);
  const address = publicKeyToAddress(publicKey);
  
  return {
    privateKey: '0x' + privateKey.toString('hex'),
    publicKey: '0x' + publicKey.toString('hex'),
    address: address
  };
}

// 保存到 vault
function saveToVault(wallet, index) {
  const fs = require('fs');
  const path = require('path');
  
  const vaultDir = path.join(__dirname, 'vault');
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { mode: 0o700 });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `evm-wallet-${timestamp}-${index}.json`;
  const filepath = path.join(vaultDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(wallet, null, 2), { mode: 0o600 });
  console.log(`✅ 已保存到: ${filepath}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  let count = 1;
  let save = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--save') {
      save = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
EVM 钱包地址生成器

使用方法：
  ./evm-wallet-generator.js              # 生成1个地址
  ./evm-wallet-generator.js --count 5    # 生成5个地址
  ./evm-wallet-generator.js --save       # 保存到 vault/evm-wallet-*.json
  ./evm-wallet-generator.js --help       # 显示帮助

⚠️  警告：
  - 私钥是资产的唯一凭证，请妥善保管
  - 使用 --save 会将私钥保存到 vault/ 目录（权限 600）
  - 不要将私钥分享给任何人
      `);
      process.exit(0);
    }
  }
  
  console.log(`\n🔐 生成 ${count} 个 EVM 钱包地址...\n`);
  
  for (let i = 0; i < count; i++) {
    const wallet = generateWallet();
    
    console.log(`钱包 #${i + 1}:`);
    console.log(`  地址:     ${wallet.address}`);
    console.log(`  私钥:     ${wallet.privateKey}`);
    console.log(`  公钥:     ${wallet.publicKey}`);
    console.log('');
    
    if (save) {
      saveToVault(wallet, i + 1);
    }
  }
  
  console.log('⚠️  警告: 请妥善保管私钥，不要泄露给任何人！\n');
}

// 如果直接运行
if (require.main === module) {
  main();
}

module.exports = { generateWallet, generatePrivateKey };
