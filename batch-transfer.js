#!/usr/bin/env node
/**
 * 批量转账工具
 * 用法: node batch-transfer.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ============ 配置区 ============
const CONFIG = {
  // RPC endpoint (请替换为你自己的)
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  
  // 源账户 (从这个账户转出)
  sourceWallet: 'vault/evm-wallet-2026-02-21T08-32-03-1.json', // 0号账户
  
  // 目标账户列表 (转入这些账户)
  targetWallets: [
    'vault/evm-wallet-2026-02-21T08-32-03-2.json', // 1号
    'vault/evm-wallet-2026-02-21T08-32-03-3.json', // 2号
  ],
  
  // 每个账户转账金额 (ETH)
  amountPerWallet: '0.1',
  
  // Gas设置
  gasLimit: 21000,
  maxFeePerGas: null, // null = 自动
  maxPriorityFeePerGas: null, // null = 自动
};

// ============ 主函数 ============
async function main() {
  console.log('🚀 批量转账工具启动\n');
  
  // 1. 连接provider
  console.log('📡 连接到网络:', CONFIG.rpcUrl);
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  
  try {
    const network = await provider.getNetwork();
    console.log('✅ 网络:', network.name, '(chainId:', network.chainId, ')\n');
  } catch (e) {
    console.error('❌ 无法连接到网络:', e.message);
    process.exit(1);
  }
  
  // 2. 加载源账户
  console.log('📂 加载源账户:', CONFIG.sourceWallet);
  const sourceData = JSON.parse(fs.readFileSync(CONFIG.sourceWallet, 'utf8'));
  const sourceWallet = new ethers.Wallet(sourceData.privateKey, provider);
  console.log('   地址:', sourceWallet.address);
  
  const sourceBalance = await provider.getBalance(sourceWallet.address);
  console.log('   余额:', ethers.utils.formatEther(sourceBalance), 'ETH\n');
  
  // 3. 加载目标账户
  console.log('📋 目标账户列表:');
  const targets = [];
  for (let i = 0; i < CONFIG.targetWallets.length; i++) {
    const walletPath = CONFIG.targetWallets[i];
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const balance = await provider.getBalance(walletData.address);
    
    targets.push({
      index: i,
      address: walletData.address,
      balance: balance,
    });
    
    console.log(`   [${i}] ${walletData.address}`);
    console.log(`       余额: ${ethers.utils.formatEther(balance)} ETH`);
  }
  console.log('');
  
  // 4. 计算总成本
  const amountPerWallet = ethers.utils.parseEther(CONFIG.amountPerWallet);
  const totalAmount = amountPerWallet.mul(targets.length);
  
  // 估算gas费用
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
  const estimatedGasCost = gasPrice.mul(CONFIG.gasLimit).mul(targets.length);
  
  const totalCost = totalAmount.add(estimatedGasCost);
  
  console.log('💰 转账计划:');
  console.log('   每个账户:', CONFIG.amountPerWallet, 'ETH');
  console.log('   账户数量:', targets.length);
  console.log('   转账总额:', ethers.utils.formatEther(totalAmount), 'ETH');
  console.log('   预估Gas费:', ethers.utils.formatEther(estimatedGasCost), 'ETH');
  console.log('   总计成本:', ethers.utils.formatEther(totalCost), 'ETH');
  console.log('');
  
  // 5. 检查余额
  if (sourceBalance.lt(totalCost)) {
    console.error('❌ 余额不足！');
    console.error('   需要:', ethers.utils.formatEther(totalCost), 'ETH');
    console.error('   当前:', ethers.utils.formatEther(sourceBalance), 'ETH');
    console.error('   缺少:', ethers.utils.formatEther(totalCost.sub(sourceBalance)), 'ETH');
    process.exit(1);
  }
  
  // 6. 确认
  console.log('⚠️  即将开始批量转账！');
  console.log('   按 Ctrl+C 取消，或等待5秒后自动开始...\n');
  await sleep(5000);
  
  // 7. 执行转账
  console.log('🔄 开始批量转账...\n');
  const results = [];
  
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`[${i + 1}/${targets.length}] 转账到 ${target.address}`);
    
    try {
      const tx = await sourceWallet.sendTransaction({
        to: target.address,
        value: amountPerWallet,
        gasLimit: CONFIG.gasLimit,
        maxFeePerGas: CONFIG.maxFeePerGas,
        maxPriorityFeePerGas: CONFIG.maxPriorityFeePerGas,
      });
      
      console.log('   ✅ 交易已发送:', tx.hash);
      console.log('   ⏳ 等待确认...');
      
      const receipt = await tx.wait();
      console.log('   ✅ 已确认! Gas used:', receipt.gasUsed.toString());
      
      results.push({
        index: i,
        address: target.address,
        success: true,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
    } catch (e) {
      console.error('   ❌ 失败:', e.message);
      results.push({
        index: i,
        address: target.address,
        success: false,
        error: e.message,
      });
    }
    
    console.log('');
  }
  
  // 8. 汇总结果
  console.log('📊 转账完成！\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('成功:', successCount);
  console.log('失败:', failCount);
  console.log('');
  
  if (successCount > 0) {
    console.log('✅ 成功的交易:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   [${r.index}] ${r.address}`);
      console.log(`       Tx: ${r.txHash}`);
      console.log(`       Gas: ${r.gasUsed}`);
    });
    console.log('');
  }
  
  if (failCount > 0) {
    console.log('❌ 失败的交易:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   [${r.index}] ${r.address}`);
      console.log(`       错误: ${r.error}`);
    });
    console.log('');
  }
  
  // 9. 查询最终余额
  console.log('💰 最终余额:');
  const finalSourceBalance = await provider.getBalance(sourceWallet.address);
  console.log('   源账户:', ethers.utils.formatEther(finalSourceBalance), 'ETH');
  
  for (const target of targets) {
    const finalBalance = await provider.getBalance(target.address);
    console.log(`   [${target.index}] ${ethers.utils.formatEther(finalBalance)} ETH`);
  }
  
  console.log('\n✨ 完成！');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行
main().catch(e => {
  console.error('💥 发生错误:', e);
  process.exit(1);
});
