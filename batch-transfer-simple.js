#!/usr/bin/env node
/**
 * 简化版批量转账工具
 * 使用公共RPC，适合快速测试
 */

const { ethers } = require('ethers');
const fs = require('fs');

// ============ 配置 ============
const CONFIG = {
  // 使用公共RPC (可能较慢)
  rpcUrl: 'https://rpc2.sepolia.org',
  
  // 源账户
  sourceWallet: 'vault/evm-wallet-2026-02-21T08-32-03-1.json',
  
  // 目标账户
  targetWallets: [
    'vault/evm-wallet-2026-02-21T08-32-03-2.json',
    'vault/evm-wallet-2026-02-21T08-32-03-3.json',
  ],
  
  // 每个账户转账金额
  amountPerWallet: '0.05', // 0.05 ETH
};

async function main() {
  console.log('🚀 简化版批量转账\n');
  
  // 连接
  const provider = new ethers.providers.JsonRpcProvider({
    url: CONFIG.rpcUrl,
    timeout: 60000, // 60秒超时
  });
  
  // 加载源账户
  const sourceData = JSON.parse(fs.readFileSync(CONFIG.sourceWallet));
  const wallet = new ethers.Wallet(sourceData.privateKey, provider);
  
  console.log('源账户:', wallet.address);
  
  // 查询余额
  console.log('查询余额...');
  const balance = await provider.getBalance(wallet.address);
  console.log('余额:', ethers.utils.formatEther(balance), 'ETH\n');
  
  // 加载目标
  const targets = CONFIG.targetWallets.map(path => {
    const data = JSON.parse(fs.readFileSync(path));
    return data.address;
  });
  
  console.log('目标账户:');
  targets.forEach((addr, i) => console.log(`  [${i}] ${addr}`));
  console.log('');
  
  // 转账金额
  const amount = ethers.utils.parseEther(CONFIG.amountPerWallet);
  console.log('每个账户转账:', CONFIG.amountPerWallet, 'ETH');
  console.log('总计:', ethers.utils.formatEther(amount.mul(targets.length)), 'ETH\n');
  
  // 开始转账
  console.log('开始转账...\n');
  
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`[${i + 1}/${targets.length}] 转账到 ${target}`);
    
    try {
      const tx = await wallet.sendTransaction({
        to: target,
        value: amount,
      });
      
      console.log('  Tx:', tx.hash);
      console.log('  等待确认...');
      
      await tx.wait();
      console.log('  ✅ 已确认\n');
      
    } catch (e) {
      console.error('  ❌ 失败:', e.message, '\n');
    }
  }
  
  console.log('✨ 完成！');
}

main().catch(console.error);
