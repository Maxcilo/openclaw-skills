#!/usr/bin/env node
/**
 * EVM 交易历史查询工具
 * 查询地址的交易历史
 * 
 * 使用方法：
 *   ./evm-tx-history.js --address 0x... --limit 10
 */

const { ethers } = require('ethers');
const { utils } = ethers;
const { formatEther } = utils;

// 查询交易历史（使用 Etherscan API）
async function queryTransactionHistory(address, apiKey, limit = 10) {
  console.log(`\n📜 查询交易历史: ${address}\n`);
  
  const baseUrl = 'https://api.etherscan.io/api';
  const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1') {
      throw new Error(data.message || '查询失败');
    }
    
    const transactions = data.result;
    
    if (transactions.length === 0) {
      console.log('📭 暂无交易记录');
      return [];
    }
    
    console.log(`📊 最近 ${transactions.length} 笔交易:\n`);
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
      const direction = isIncoming ? '📥 接收' : '📤 发送';
      const counterparty = isIncoming ? tx.from : tx.to;
      const value = formatEther(tx.value);
      const timestamp = new Date(parseInt(tx.timeStamp) * 1000).toLocaleString();
      
      console.log(`[${i + 1}] ${direction}`);
      console.log(`    对方: ${counterparty}`);
      console.log(`    金额: ${value} ETH`);
      console.log(`    时间: ${timestamp}`);
      console.log(`    哈希: ${tx.hash}`);
      console.log(`    状态: ${tx.isError === '0' ? '✅ 成功' : '❌ 失败'}`);
      console.log('');
    }
    
    return transactions;
  } catch (error) {
    console.error(`❌ 查询失败: ${error.message}`);
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📜 EVM 交易历史查询工具

使用方法：

1. 查询交易历史:
   ./evm-tx-history.js --address 0x... --api-key YOUR_KEY

2. 限制查询数量:
   ./evm-tx-history.js --address 0x... --api-key YOUR_KEY --limit 20

参数说明：
  --address <addr>     查询地址
  --api-key <key>      Etherscan API Key
  --limit <n>          查询数量（默认: 10）
  --help               显示帮助

获取 API Key:
  访问 https://etherscan.io/apis 注册并获取免费 API Key

⚠️  注意：
  - 免费 API Key 有速率限制（5次/秒）
  - 建议使用自己的 API Key
    `);
    process.exit(0);
  }
  
  // 解析参数
  let address = null;
  let apiKey = 'YourApiKeyToken'; // 默认 API Key（有限制）
  let limit = 10;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--address' && args[i + 1]) {
      address = args[i + 1];
      i++;
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1]);
      i++;
    }
  }
  
  // 验证参数
  if (!address) {
    console.error('❌ 请指定 --address');
    process.exit(1);
  }
  
  // 查询交易历史
  await queryTransactionHistory(address, apiKey, limit);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  });
}

module.exports = { queryTransactionHistory };
