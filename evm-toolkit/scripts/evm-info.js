#!/usr/bin/env node
/**
 * EVM 地址信息查询工具
 * 查询地址的详细信息：ETH余额、交易数、代币余额等
 * 
 * 使用方法：
 *   ./evm-info.js --address 0x...                    # 查询地址信息
 *   ./evm-info.js --address 0x... --tokens          # 包含常见代币余额
 */

const { ethers } = require('ethers');
const { Contract, utils } = ethers;
const { formatEther } = utils;

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// 常见代币列表（Ethereum 主网）
const COMMON_TOKENS = {
  'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA'
};

// 查询地址信息
async function queryAddressInfo(provider, address, includeTokens = false) {
  console.log(`\n📊 查询地址信息: ${address}\n`);
  
  try {
    // 1. 查询 ETH 余额
    const balance = await provider.getBalance(address);
    console.log(`💰 ETH 余额: ${formatEther(balance)} ETH`);
    
    // 2. 查询交易数（nonce）
    const txCount = await provider.getTransactionCount(address);
    console.log(`📝 交易数: ${txCount}`);
    
    // 3. 查询代码（判断是否为合约）
    const code = await provider.getCode(address);
    const isContract = code !== '0x';
    console.log(`🔧 地址类型: ${isContract ? '合约地址' : '外部账户 (EOA)'}`);
    
    if (isContract) {
      console.log(`📦 合约代码长度: ${code.length} 字节`);
    }
    
    // 4. 查询常见代币余额
    if (includeTokens) {
      console.log(`\n🪙 常见代币余额:\n`);
      
      for (const [symbol, tokenAddress] of Object.entries(COMMON_TOKENS)) {
        try {
          const token = new Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, decimals] = await Promise.all([
            token.balanceOf(address),
            token.decimals()
          ]);
          
          if (balance.gt(0)) {
            const divisor = ethers.BigNumber.from(10).pow(decimals);
            const balanceFormatted = balance.div(divisor).toString();
            const remainder = balance.mod(divisor);
            const decimalPart = remainder.mul(1000000).div(divisor).toString().padStart(6, '0');
            const fullBalance = `${balanceFormatted}.${decimalPart}`;
            
            console.log(`  ${symbol.padEnd(6)} ${fullBalance}`);
          }
        } catch (error) {
          // 跳过查询失败的代币
        }
      }
    }
    
    return {
      address,
      ethBalance: formatEther(balance),
      txCount,
      isContract,
      codeLength: code.length
    };
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
🔍 EVM 地址信息查询工具

使用方法：

1. 查询基本信息:
   ./evm-info.js --address 0x...

2. 包含常见代币余额:
   ./evm-info.js --address 0x... --tokens

3. 使用自定义 RPC:
   ./evm-info.js --address 0x... --rpc https://mainnet.infura.io/v3/YOUR_KEY

参数说明：
  --address <addr>     查询地址
  --tokens             包含常见代币余额查询
  --rpc <url>          RPC 节点地址（默认: https://eth.llamarpc.com）
  --help               显示帮助

支持的常见代币:
  USDT, USDC, DAI, WETH, WBTC, UNI, LINK
    `);
    process.exit(0);
  }
  
  // 解析参数
  let address = null;
  let includeTokens = false;
  let rpcUrl = 'https://eth.llamarpc.com';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--address' && args[i + 1]) {
      address = args[i + 1];
      i++;
    } else if (args[i] === '--tokens') {
      includeTokens = true;
    } else if (args[i] === '--rpc' && args[i + 1]) {
      rpcUrl = args[i + 1];
      i++;
    }
  }
  
  // 验证参数
  if (!address) {
    console.error('❌ 请指定 --address');
    process.exit(1);
  }
  
  // 连接 RPC
  console.log(`🌐 连接 RPC: ${rpcUrl}`);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  // 查询信息
  await queryAddressInfo(provider, address, includeTokens);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  });
}

module.exports = { queryAddressInfo, COMMON_TOKENS };
