const { ethers } = require('ethers');
const fs = require('fs');

const provider = new ethers.providers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

const wallets = [
  'vault/evm-wallet-2026-02-21T08-32-03-1.json',
  'vault/evm-wallet-2026-02-21T08-32-03-2.json',
  'vault/evm-wallet-2026-02-21T08-32-03-3.json',
];

(async () => {
  console.log('📊 Sepolia测试网账户余额:\n');
  
  for (let i = 0; i < wallets.length; i++) {
    const data = JSON.parse(fs.readFileSync(wallets[i]));
    const balance = await provider.getBalance(data.address);
    
    console.log(`[${i}号] ${data.address}`);
    console.log(`     余额: ${ethers.utils.formatEther(balance)} ETH\n`);
  }
})();
