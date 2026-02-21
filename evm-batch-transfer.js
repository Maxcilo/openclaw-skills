#!/usr/bin/env node
/**
 * EVM 批量转账工具
 * 从主地址向多个地址批量发送 ETH 或 ERC20 代币
 * 
 * 使用方法：
 *   ./evm-batch-transfer.js --help                           # 显示帮助
 *   ./evm-batch-transfer.js --eth --to 0x... --amount 0.1   # 发送 ETH
 *   ./evm-batch-transfer.js --token 0x... --file list.json  # 批量发送代币
 */

const { Wallet, JsonRpcProvider, parseEther, formatEther, Contract } = require('ethers');
const fs = require('fs');
const path = require('path');

// ERC20 ABI（只需要 transfer 和 balanceOf）
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// 加载主钱包
function loadMainWallet() {
  const walletPath = path.join(__dirname, 'vault', 'evm-wallet-main.json');
  if (!fs.existsSync(walletPath)) {
    throw new Error('主钱包不存在，请先配置主地址');
  }
  
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  return walletData;
}

// 批量发送 ETH
async function batchTransferETH(provider, wallet, recipients, dryRun = false) {
  console.log('\n📤 批量发送 ETH\n');
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 主地址余额: ${formatEther(balance)} ETH\n`);
  
  let totalAmount = 0n;
  const transactions = [];
  
  for (const recipient of recipients) {
    const amount = parseEther(recipient.amount.toString());
    totalAmount += amount;
    
    transactions.push({
      to: recipient.address,
      amount: amount,
      amountStr: recipient.amount
    });
  }
  
  console.log(`📊 转账统计:`);
  console.log(`  - 接收地址数: ${recipients.length}`);
  console.log(`  - 总金额: ${formatEther(totalAmount)} ETH`);
  console.log(`  - 预估 Gas: ~${recipients.length * 21000} gas\n`);
  
  if (totalAmount > balance) {
    throw new Error('余额不足');
  }
  
  if (dryRun) {
    console.log('🔍 模拟模式，不会实际发送交易\n');
    transactions.forEach((tx, i) => {
      console.log(`${i + 1}. ${tx.to} → ${tx.amountStr} ETH`);
    });
    return;
  }
  
  console.log('⚠️  即将发送真实交易，请确认...\n');
  
  const results = [];
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(`[${i + 1}/${transactions.length}] 发送 ${tx.amountStr} ETH 到 ${tx.to}...`);
    
    try {
      const txResponse = await wallet.sendTransaction({
        to: tx.to,
        value: tx.amount
      });
      
      console.log(`  ✅ 交易已发送: ${txResponse.hash}`);
      console.log(`  ⏳ 等待确认...`);
      
      const receipt = await txResponse.wait();
      console.log(`  ✅ 已确认 (区块 ${receipt.blockNumber})\n`);
      
      results.push({
        success: true,
        to: tx.to,
        amount: tx.amountStr,
        hash: txResponse.hash,
        blockNumber: receipt.blockNumber
      });
    } catch (error) {
      console.log(`  ❌ 失败: ${error.message}\n`);
      results.push({
        success: false,
        to: tx.to,
        amount: tx.amountStr,
        error: error.message
      });
    }
  }
  
  return results;
}

// 批量发送 ERC20 代币
async function batchTransferToken(provider, wallet, tokenAddress, recipients, dryRun = false) {
  console.log('\n📤 批量发送 ERC20 代币\n');
  
  const token = new Contract(tokenAddress, ERC20_ABI, wallet);
  
  // 获取代币信息
  const [symbol, decimals, balance] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.balanceOf(wallet.address)
  ]);
  
  console.log(`🪙 代币信息:`);
  console.log(`  - 合约地址: ${tokenAddress}`);
  console.log(`  - 代币符号: ${symbol}`);
  console.log(`  - 精度: ${decimals}`);
  console.log(`  - 主地址余额: ${formatEther(balance)} ${symbol}\n`);
  
  let totalAmount = 0n;
  const transactions = [];
  
  for (const recipient of recipients) {
    const amount = parseEther(recipient.amount.toString());
    totalAmount += amount;
    
    transactions.push({
      to: recipient.address,
      amount: amount,
      amountStr: recipient.amount
    });
  }
  
  console.log(`📊 转账统计:`);
  console.log(`  - 接收地址数: ${recipients.length}`);
  console.log(`  - 总金额: ${formatEther(totalAmount)} ${symbol}\n`);
  
  if (totalAmount > balance) {
    throw new Error(`代币余额不足 (需要 ${formatEther(totalAmount)} ${symbol})`);
  }
  
  if (dryRun) {
    console.log('🔍 模拟模式，不会实际发送交易\n');
    transactions.forEach((tx, i) => {
      console.log(`${i + 1}. ${tx.to} → ${tx.amountStr} ${symbol}`);
    });
    return;
  }
  
  console.log('⚠️  即将发送真实交易，请确认...\n');
  
  const results = [];
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(`[${i + 1}/${transactions.length}] 发送 ${tx.amountStr} ${symbol} 到 ${tx.to}...`);
    
    try {
      const txResponse = await token.transfer(tx.to, tx.amount);
      
      console.log(`  ✅ 交易已发送: ${txResponse.hash}`);
      console.log(`  ⏳ 等待确认...`);
      
      const receipt = await txResponse.wait();
      console.log(`  ✅ 已确认 (区块 ${receipt.blockNumber})\n`);
      
      results.push({
        success: true,
        to: tx.to,
        amount: tx.amountStr,
        hash: txResponse.hash,
        blockNumber: receipt.blockNumber
      });
    } catch (error) {
      console.log(`  ❌ 失败: ${error.message}\n`);
      results.push({
        success: false,
        to: tx.to,
        amount: tx.amountStr,
        error: error.message
      });
    }
  }
  
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 EVM 批量转账工具

使用方法：

1. 发送 ETH:
   ./evm-batch-transfer.js --eth --to 0x... --amount 0.1
   ./evm-batch-transfer.js --eth --file recipients.json

2. 发送 ERC20 代币:
   ./evm-batch-transfer.js --token 0x... --to 0x... --amount 100
   ./evm-batch-transfer.js --token 0x... --file recipients.json

3. 模拟模式（不实际发送）:
   ./evm-batch-transfer.js --eth --file recipients.json --dry-run

参数说明：
  --eth                发送 ETH
  --token <address>    发送 ERC20 代币（指定合约地址）
  --to <address>       接收地址（单个转账）
  --amount <value>     转账金额（单个转账）
  --file <path>        批量转账文件（JSON 格式）
  --rpc <url>          RPC 节点地址（默认: https://eth.llamarpc.com）
  --dry-run            模拟模式，不实际发送交易
  --help               显示帮助

批量转账文件格式 (recipients.json):
[
  { "address": "0x...", "amount": "0.1" },
  { "address": "0x...", "amount": "0.2" }
]

⚠️  安全提醒：
  - 请先使用 --dry-run 模拟测试
  - 确认接收地址和金额无误后再实际发送
  - 建议先小额测试
    `);
    process.exit(0);
  }
  
  // 解析参数
  let isETH = false;
  let tokenAddress = null;
  let recipients = [];
  let rpcUrl = 'https://eth.llamarpc.com';
  let dryRun = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--eth') {
      isETH = true;
    } else if (args[i] === '--token' && args[i + 1]) {
      tokenAddress = args[i + 1];
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      const address = args[i + 1];
      i++;
      if (args[i + 1] === '--amount' && args[i + 2]) {
        const amount = args[i + 2];
        recipients.push({ address, amount });
        i += 2;
      }
    } else if (args[i] === '--file' && args[i + 1]) {
      const filePath = args[i + 1];
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      recipients = recipients.concat(fileData);
      i++;
    } else if (args[i] === '--rpc' && args[i + 1]) {
      rpcUrl = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }
  
  // 验证参数
  if (!isETH && !tokenAddress) {
    console.error('❌ 请指定 --eth 或 --token <address>');
    process.exit(1);
  }
  
  if (recipients.length === 0) {
    console.error('❌ 请指定接收地址（--to 或 --file）');
    process.exit(1);
  }
  
  // 加载主钱包
  console.log('🔐 加载主钱包...');
  const walletData = loadMainWallet();
  console.log(`✅ 主地址: ${walletData.address}\n`);
  
  // 连接 RPC
  console.log(`🌐 连接 RPC: ${rpcUrl}`);
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(walletData.privateKey, provider);
  
  // 执行转账
  let results;
  if (isETH) {
    results = await batchTransferETH(provider, wallet, recipients, dryRun);
  } else {
    results = await batchTransferToken(provider, wallet, tokenAddress, recipients, dryRun);
  }
  
  // 输出结果
  if (results) {
    console.log('\n📊 转账结果汇总:\n');
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ 成功: ${success}`);
    console.log(`❌ 失败: ${failed}`);
    
    if (failed > 0) {
      console.log('\n失败的交易:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.to}: ${r.error}`);
      });
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  });
}

module.exports = { batchTransferETH, batchTransferToken };
