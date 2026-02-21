#!/usr/bin/env node
/**
 * EVM 批量查询工具
 * 快速查询多个地址的余额和信息
 * 
 * 使用方法：
 *   ./evm-batch-query.js --addresses 0x...,0x... 
 *   ./evm-batch-query.js --file addresses.txt
 */

const { ethers } = require('ethers');
const { utils } = ethers;
const { formatEther } = utils;
const fs = require('fs');

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// 批量查询余额
async function batchQuery(provider, addresses, tokenAddress = null) {
  console.log(`\n📊 批量查询 ${addresses.length} 个地址...\n`);
  
  const results = [];
  let totalBalance = 0n;
  
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    
    try {
      if (tokenAddress) {
        // 查询代币余额
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [balance, symbol, decimals] = await Promise.all([
          token.balanceOf(address),
          token.symbol(),
          token.decimals()
        ]);
        
        const divisor = ethers.BigNumber.from(10).pow(decimals);
        const balanceFormatted = balance.div(divisor).toString();
        
        totalBalance = totalBalance + BigInt(balance.toString());
        
        console.log(`[${i + 1}/${addresses.length}] ${address}`);
        console.log(`  💰 ${balanceFormatted} ${symbol}`);
        
        results.push({
          address,
          balance: balanceFormatted,
          symbol,
          success: true
        });
      } else {
        // 查询 ETH 余额
        const balance = await provider.getBalance(address);
        const balanceFormatted = formatEther(balance);
        
        totalBalance = totalBalance + BigInt(balance.toString());
        
        console.log(`[${i + 1}/${addresses.length}] ${address}`);
        console.log(`  💰 ${balanceFormatted} ETH`);
        
        results.push({
          address,
          balance: balanceFormatted,
          success: true
        });
      }
    } catch (error) {
      console.log(`[${i + 1}/${addresses.length}] ${address}`);
      console.log(`  ❌ 查询失败: ${error.message}`);
      
      results.push({
        address,
        error: error.message,
        success: false
      });
    }
    
    console.log('');
  }
  
  // 输出汇总
  console.log('📊 汇总统计:\n');
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${results.length - successCount}`);
  
  if (successCount > 0) {
    if (tokenAddress) {
      const symbol = results.find(r => r.symbol)?.symbol || 'TOKEN';
      console.log(`💰 总余额: ${formatEther(totalBalance.toString())} ${symbol}`);
    } else {
      console.log(`💰 总余额: ${formatEther(totalBalance.toString())} ETH`);
    }
  }
  
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📊 EVM 批量查询工具

使用方法：

1. 查询多个地址（逗号分隔）:
   ./evm-batch-query.js --addresses 0x...,0x...

2. 从文件读取地址列表:
   ./evm-batch-query.js --file addresses.txt

3. 查询代币余额:
   ./evm-batch-query.js --file addresses.txt --token 0xTokenAddress

4. 使用自定义 RPC:
   ./evm-batch-query.js --file addresses.txt --rpc https://mainnet.base.org

参数说明：
  --addresses <list>   地址列表（逗号分隔）
  --file <path>        地址列表文件（每行一个地址）
  --token <address>    代币合约地址（可选）
  --rpc <url>          RPC 节点地址（默认: https://eth.llamarpc.com）
  --help               显示帮助

地址列表文件格式:
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
0x1234567890123456789012345678901234567890
    `);
    process.exit(0);
  }
  
  // 解析参数
  let addresses = [];
  let tokenAddress = null;
  let rpcUrl = 'https://eth.llamarpc.com';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--addresses' && args[i + 1]) {
      addresses = args[i + 1].split(',').map(a => a.trim());
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      const content = fs.readFileSync(args[i + 1], 'utf8');
      addresses = content.split('\n').map(a => a.trim()).filter(a => a.length > 0);
      i++;
    } else if (args[i] === '--token' && args[i + 1]) {
      tokenAddress = args[i + 1];
      i++;
    } else if (args[i] === '--rpc' && args[i + 1]) {
      rpcUrl = args[i + 1];
      i++;
    }
  }
  
  // 验证参数
  if (addresses.length === 0) {
    console.error('❌ 请指定 --addresses 或 --file');
    process.exit(1);
  }
  
  // 连接 RPC
  console.log(`🌐 连接 RPC: ${rpcUrl}`);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  // 执行查询
  await batchQuery(provider, addresses, tokenAddress);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  });
}

module.exports = { batchQuery };
