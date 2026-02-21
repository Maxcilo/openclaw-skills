const { ethers } = require('ethers');
const fs = require('fs');

// 使用公共RPC
const provider = new ethers.providers.JsonRpcProvider('https://rpc2.sepolia.org');

const wallet0 = JSON.parse(fs.readFileSync('vault/evm-wallet-2026-02-21T08-32-03-1.json'));

(async () => {
  try {
    console.log('正在查询余额...');
    const balance = await provider.getBalance(wallet0.address);
    console.log('0号账户地址:', wallet0.address);
    console.log('余额:', ethers.utils.formatEther(balance), 'ETH');
  } catch (e) {
    console.error('错误:', e.message);
  }
})();
