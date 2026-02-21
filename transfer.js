#!/usr/bin/env node
/**
 * 统一批量转账工具
 * 基于 vault/地址清单-0-20-完整版.md 账号系统
 * 0号为主地址，1-20号为子地址
 * 
 * 用法:
 *   node transfer.js                          # 从0号分发到1-20号（默认每个0.01 ETH）
 *   node transfer.js --amount 0.05            # 自定义金额
 *   node transfer.js --to 1,2,3               # 只转到指定编号
 *   node transfer.js --to 1-5                 # 转到1-5号
 *   node transfer.js --collect                # 从1-20号归集到0号
 *   node transfer.js --collect --from 1,2,3   # 从指定编号归集
 *   node transfer.js --balance                # 查询所有地址余额
 *   node transfer.js --dry-run                # 模拟模式
 *   node transfer.js --rpc <url>              # 自定义RPC
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const DEFAULT_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const DEFAULT_AMOUNT = '0.01';
const WALLET_LIST_FILE = 'vault/地址清单-0-20-完整版.md';

// ============ 解析地址清单 ============
function loadWallets() {
  const content = fs.readFileSync(path.join(__dirname, WALLET_LIST_FILE), 'utf8');
  const wallets = [];
  
  // 解析每个地址块
  const blocks = content.split(/### \d+号地址/);
  
  // 用正则匹配所有地址信息
  const regex = /编号:\s*(\d+)\s*\n地址:\s*(0x[a-fA-F0-9]{40})\s*\n私钥:\s*(0x[a-fA-F0-9]{64})/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    wallets.push({
      index: parseInt(match[1]),
      address: match[2],
      privateKey: match[3],
    });
  }
  
  // 按编号排序
  wallets.sort((a, b) => a.index - b.index);
  return wallets;
}

// ============ 解析目标编号 ============
function parseTargets(str, maxIndex) {
  const targets = new Set();
  
  for (const part of str.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = start; i <= end; i++) targets.add(i);
    } else {
      targets.add(parseInt(trimmed));
    }
  }
  
  return [...targets].filter(n => n >= 0 && n <= maxIndex).sort((a, b) => a - b);
}

// ============ 工具函数 ============
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries - 1) throw e;
      console.log(`    ⚠️ 重试 ${i+1}/${retries}: ${e.message}`);
      await sleep(3000);
    }
  }
}

// ============ 查询余额 ============
async function queryBalances(provider, wallets) {
  console.log('📊 查询所有地址余额...\n');
  
  let total = ethers.BigNumber.from(0);
  
  for (const w of wallets) {
    const balance = await withRetry(() => provider.getBalance(w.address));
    total = total.add(balance);
    const balStr = ethers.utils.formatEther(balance);
    const tag = w.index === 0 ? '（主地址）' : '';
    const indicator = balance.gt(0) ? '💰' : '  ';
    console.log(`  ${indicator} [${String(w.index).padStart(2)}] ${w.address}  ${balStr} ETH ${tag}`);
  }
  
  console.log(`\n  总计: ${ethers.utils.formatEther(total)} ETH`);
}

// ============ 分发 ============
async function distribute(provider, wallets, targetIndices, amount, dryRun) {
  const source = wallets.find(w => w.index === 0);
  if (!source) throw new Error('找不到0号主地址');
  
  const targets = wallets.filter(w => targetIndices.includes(w.index));
  if (targets.length === 0) throw new Error('没有有效的目标地址');
  
  const wallet = new ethers.Wallet(source.privateKey, provider);
  const balance = await provider.getBalance(source.address);
  const amountWei = ethers.utils.parseEther(amount);
  const totalAmount = amountWei.mul(targets.length);
  
  console.log('📤 从主地址分发ETH\n');
  console.log('  源地址:   [0] ' + source.address);
  console.log('  余额:     ' + ethers.utils.formatEther(balance) + ' ETH');
  console.log('  每个转:   ' + amount + ' ETH');
  console.log('  目标数:   ' + targets.length);
  console.log('  总计:     ' + ethers.utils.formatEther(totalAmount) + ' ETH');
  console.log('  目标编号: ' + targetIndices.join(', '));
  console.log('');
  
  if (balance.lt(totalAmount)) {
    console.error('❌ 余额不足！需要 ' + ethers.utils.formatEther(totalAmount) + ' ETH');
    process.exit(1);
  }
  
  if (dryRun) {
    console.log('🔍 模拟模式，不实际发送\n');
    targets.forEach(t => console.log('  [' + t.index + '] ' + t.address + ' ← ' + amount + ' ETH'));
    return;
  }
  
  console.log('⏳ 3秒后开始转账（Ctrl+C取消）...\n');
  await sleep(3000);
  
  let success = 0, fail = 0;
  
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`[${i+1}/${targets.length}] → [${t.index}] ${t.address}`);
    
    try {
      const tx = await withRetry(() => wallet.sendTransaction({
        to: t.address,
        value: amountWei,
      }));
      console.log('    Tx: ' + tx.hash);
      await tx.wait();
      console.log('    ✅ 已确认');
      success++;
    } catch (e) {
      console.log('    ❌ 失败: ' + e.message);
      fail++;
    }
    
    if (i < targets.length - 1) await sleep(1000);
  }
  
  console.log('\n📊 结果: ✅ ' + success + ' 成功, ❌ ' + fail + ' 失败');
  
  const finalBalance = await provider.getBalance(source.address);
  console.log('💰 主地址剩余: ' + ethers.utils.formatEther(finalBalance) + ' ETH');
}

// ============ 归集 ============
async function collect(provider, wallets, fromIndices, dryRun) {
  const target = wallets.find(w => w.index === 0);
  if (!target) throw new Error('找不到0号主地址');
  
  const sources = wallets.filter(w => fromIndices.includes(w.index));
  if (sources.length === 0) throw new Error('没有有效的源地址');
  
  console.log('📥 归集ETH到主地址\n');
  console.log('  目标地址: [0] ' + target.address);
  console.log('  源地址数: ' + sources.length);
  console.log('  源编号:   ' + fromIndices.join(', '));
  console.log('');
  
  if (dryRun) {
    console.log('🔍 模拟模式\n');
    for (const s of sources) {
      const balance = await withRetry(() => provider.getBalance(s.address));
      console.log('  [' + s.index + '] ' + ethers.utils.formatEther(balance) + ' ETH');
    }
    return;
  }
  
  console.log('⏳ 3秒后开始归集...\n');
  await sleep(3000);
  
  let totalCollected = ethers.BigNumber.from(0);
  let success = 0, fail = 0;
  
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    const wallet = new ethers.Wallet(s.privateKey, provider);
    const balance = await withRetry(() => provider.getBalance(s.address));
    
    console.log(`[${i+1}/${sources.length}] ← [${s.index}] ${s.address} (${ethers.utils.formatEther(balance)} ETH)`);
    
    if (balance.eq(0)) {
      console.log('    跳过（余额为0）');
      continue;
    }
    
    const gasPrice = await provider.getGasPrice();
    const gasCost = gasPrice.mul(21000);
    const sendAmount = balance.sub(gasCost);
    
    if (sendAmount.lte(0)) {
      console.log('    跳过（余额不够付gas）');
      continue;
    }
    
    try {
      const tx = await withRetry(() => wallet.sendTransaction({
        to: target.address,
        value: sendAmount,
        gasLimit: 21000,
        gasPrice: gasPrice,
      }));
      console.log('    Tx: ' + tx.hash);
      await tx.wait();
      console.log('    ✅ 归集 ' + ethers.utils.formatEther(sendAmount) + ' ETH');
      totalCollected = totalCollected.add(sendAmount);
      success++;
    } catch (e) {
      console.log('    ❌ 失败: ' + e.message);
      fail++;
    }
    
    if (i < sources.length - 1) await sleep(1000);
  }
  
  console.log('\n📊 结果: ✅ ' + success + ' 成功, ❌ ' + fail + ' 失败');
  console.log('💰 总归集: ' + ethers.utils.formatEther(totalCollected) + ' ETH');
  
  const finalBalance = await provider.getBalance(target.address);
  console.log('💰 主地址余额: ' + ethers.utils.formatEther(finalBalance) + ' ETH');
}

// ============ 主函数 ============
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 统一批量转账工具（0-20号账号系统）

用法:
  node transfer.js                     分发到1-20号（默认0.01 ETH）
  node transfer.js --amount 0.05       自定义金额
  node transfer.js --to 1,2,3          只转到指定编号
  node transfer.js --to 1-5            转到1-5号
  node transfer.js --collect           从1-20号归集到0号
  node transfer.js --collect --from 3  从指定编号归集
  node transfer.js --balance           查询所有余额
  node transfer.js --dry-run           模拟模式
  node transfer.js --rpc <url>         自定义RPC
`);
    process.exit(0);
  }
  
  // 解析参数
  let rpcUrl = DEFAULT_RPC;
  let amount = DEFAULT_AMOUNT;
  let isCollect = false;
  let isBalance = false;
  let dryRun = false;
  let targetStr = null;
  let fromStr = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rpc' && args[i+1]) { rpcUrl = args[++i]; }
    else if (args[i] === '--amount' && args[i+1]) { amount = args[++i]; }
    else if (args[i] === '--to' && args[i+1]) { targetStr = args[++i]; }
    else if (args[i] === '--from' && args[i+1]) { fromStr = args[++i]; }
    else if (args[i] === '--collect') { isCollect = true; }
    else if (args[i] === '--balance') { isBalance = true; }
    else if (args[i] === '--dry-run') { dryRun = true; }
  }
  
  // 加载钱包
  console.log('🔐 加载账号系统...');
  const wallets = loadWallets();
  console.log('  已加载 ' + wallets.length + ' 个地址（0-' + wallets[wallets.length-1].index + '号）\n');
  
  // 连接RPC
  console.log('🌐 连接: ' + rpcUrl);
  const provider = new ethers.providers.JsonRpcProvider({ url: rpcUrl, timeout: 30000 });
  const block = await provider.getBlockNumber();
  console.log('  ✅ 区块: ' + block + '\n');
  
  if (isBalance) {
    await queryBalances(provider, wallets);
  } else if (isCollect) {
    const fromIndices = fromStr
      ? parseTargets(fromStr, 20)
      : Array.from({length: 20}, (_, i) => i + 1); // 1-20
    await collect(provider, wallets, fromIndices, dryRun);
  } else {
    const targetIndices = targetStr
      ? parseTargets(targetStr, 20)
      : Array.from({length: 20}, (_, i) => i + 1); // 1-20
    await distribute(provider, wallets, targetIndices, amount, dryRun);
  }
  
  console.log('\n✨ 完成！');
}

main().catch(e => {
  console.error('\n💥 错误:', e.message);
  process.exit(1);
});
