#!/usr/bin/env node
/**
 * 稳定版批量转账工具
 * 支持多RPC备份、自动重试、详细日志
 */

const { ethers } = require('ethers');
const fs = require('fs');

// ============ 配置 ============
const CONFIG = {
  // RPC列表 (按优先级排序，会自动尝试下一个)
  rpcUrls: [
    'https://rpc.ankr.com/eth_sepolia',
    'https://rpc2.sepolia.org',
    'https://ethereum-sepolia-rpc.publicnode.com',
  ],
  
  // 源账户
  sourceWallet: 'vault/evm-wallet-2026-02-21T08-32-03-1.json',
  
  // 目标账户
  targetWallets: [
    'vault/evm-wallet-2026-02-21T08-32-03-2.json',
    'vault/evm-wallet-2026-02-21T08-32-03-3.json',
  ],
  
  // 每个账户转账金额
  amountPerWallet: '0.05', // ETH
  
  // 重试设置
  maxRetries: 3,
  retryDelay: 5000, // 5秒
  
  // 超时设置
  rpcTimeout: 30000, // 30秒
  txTimeout: 120000, // 2分钟
};

// ============ 工具函数 ============
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, maxRetries = CONFIG.maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`  ⚠️  尝试 ${i + 1}/${maxRetries} 失败: ${e.message}`);
      if (i < maxRetries - 1) {
        console.log(`  ⏳ ${CONFIG.retryDelay / 1000}秒后重试...`);
        await sleep(CONFIG.retryDelay);
      } else {
        throw e;
      }
    }
  }
}

async function createProvider() {
  console.log('🔍 寻找可用的RPC...\n');
  
  for (let i = 0; i < CONFIG.rpcUrls.length; i++) {
    const url = CONFIG.rpcUrls[i];
    console.log(`[${i + 1}/${CONFIG.rpcUrls.length}] 测试 ${url}`);
    
    try {
      const provider = new ethers.providers.JsonRpcProvider({
        url: url,
        timeout: CONFIG.rpcTimeout,
      });
      
      // 测试连接
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 10000)
        ),
      ]);
      
      console.log(`  ✅ 连接成功! 当前区块: ${blockNumber}\n`);
      return provider;
      
    } catch (e) {
      console.log(`  ❌ 失败: ${e.message}`);
    }
  }
  
  throw new Error('所有RPC都无法连接');
}

// ============ 主函数 ============
async function main() {
  console.log('🚀 稳定版批量转账工具\n');
  console.log('配置:');
  console.log('  源账户:', CONFIG.sourceWallet);
  console.log('  目标数量:', CONFIG.targetWallets.length);
  console.log('  每个转账:', CONFIG.amountPerWallet, 'ETH');
  console.log('  最大重试:', CONFIG.maxRetries);
  console.log('');
  
  // 1. 创建provider
  const provider = await createProvider();
  
  // 2. 加载源账户
  console.log('📂 加载源账户...');
  const sourceData = JSON.parse(fs.readFileSync(CONFIG.sourceWallet));
  const wallet = new ethers.Wallet(sourceData.privateKey, provider);
  console.log('  地址:', wallet.address);
  
  // 3. 查询余额
  console.log('  查询余额...');
  const balance = await withRetry(() => provider.getBalance(wallet.address));
  console.log('  余额:', ethers.utils.formatEther(balance), 'ETH\n');
  
  // 4. 加载目标账户
  console.log('📋 目标账户:');
  const targets = [];
  for (let i = 0; i < CONFIG.targetWallets.length; i++) {
    const walletPath = CONFIG.targetWallets[i];
    const walletData = JSON.parse(fs.readFileSync(walletPath));
    
    console.log(`  [${i}] ${walletData.address}`);
    
    try {
      const targetBalance = await withRetry(() => 
        provider.getBalance(walletData.address)
      );
      console.log(`      当前余额: ${ethers.utils.formatEther(targetBalance)} ETH`);
    } catch (e) {
      console.log(`      ⚠️  无法查询余额: ${e.message}`);
    }
    
    targets.push(walletData.address);
  }
  console.log('');
  
  // 5. 计算总成本
  const amount = ethers.utils.parseEther(CONFIG.amountPerWallet);
  const totalAmount = amount.mul(targets.length);
  
  console.log('💰 转账计划:');
  console.log('  每个账户:', CONFIG.amountPerWallet, 'ETH');
  console.log('  账户数量:', targets.length);
  console.log('  转账总额:', ethers.utils.formatEther(totalAmount), 'ETH');
  console.log('');
  
  // 6. 检查余额
  if (balance.lt(totalAmount)) {
    console.error('❌ 余额不足！');
    console.error('  需要至少:', ethers.utils.formatEther(totalAmount), 'ETH');
    console.error('  当前余额:', ethers.utils.formatEther(balance), 'ETH');
    process.exit(1);
  }
  
  // 7. 确认
  console.log('⚠️  即将开始批量转账！');
  console.log('   按 Ctrl+C 取消，或等待3秒后自动开始...\n');
  await sleep(3000);
  
  // 8. 执行转账
  console.log('🔄 开始批量转账...\n');
  const results = [];
  
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`[${i + 1}/${targets.length}] 转账到 ${target}`);
    
    try {
      // 发送交易 (带重试)
      const tx = await withRetry(async () => {
        return await wallet.sendTransaction({
          to: target,
          value: amount,
        });
      });
      
      console.log('  ✅ 交易已发送:', tx.hash);
      console.log('  ⏳ 等待确认...');
      
      // 等待确认 (带超时)
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('确认超时')), CONFIG.txTimeout)
        ),
      ]);
      
      console.log('  ✅ 已确认! Gas:', receipt.gasUsed.toString());
      
      results.push({
        index: i,
        address: target,
        success: true,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
    } catch (e) {
      console.error('  ❌ 失败:', e.message);
      results.push({
        index: i,
        address: target,
        success: false,
        error: e.message,
      });
    }
    
    console.log('');
    
    // 短暂延迟，避免nonce冲突
    if (i < targets.length - 1) {
      await sleep(2000);
    }
  }
  
  // 9. 汇总结果
  console.log('📊 转账完成！\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('成功:', successCount);
  console.log('失败:', failCount);
  console.log('');
  
  if (successCount > 0) {
    console.log('✅ 成功的交易:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  [${r.index}] ${r.address}`);
      console.log(`      Tx: ${r.txHash}`);
      console.log(`      Gas: ${r.gasUsed}`);
    });
    console.log('');
  }
  
  if (failCount > 0) {
    console.log('❌ 失败的交易:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  [${r.index}] ${r.address}`);
      console.log(`      错误: ${r.error}`);
    });
    console.log('');
  }
  
  // 10. 查询最终余额
  console.log('💰 最终余额:');
  try {
    const finalBalance = await withRetry(() => provider.getBalance(wallet.address));
    console.log('  源账户:', ethers.utils.formatEther(finalBalance), 'ETH');
  } catch (e) {
    console.log('  源账户: 查询失败');
  }
  
  for (let i = 0; i < targets.length; i++) {
    try {
      const finalBalance = await withRetry(() => provider.getBalance(targets[i]));
      console.log(`  [${i}] ${ethers.utils.formatEther(finalBalance)} ETH`);
    } catch (e) {
      console.log(`  [${i}] 查询失败`);
    }
  }
  
  console.log('\n✨ 完成！');
}

// 运行
main().catch(e => {
  console.error('\n💥 发生错误:', e.message);
  process.exit(1);
});
