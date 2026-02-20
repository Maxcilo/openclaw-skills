#!/usr/bin/env node

/**
 * Twitter 监控脚本
 * 监控指定账号的新推文，发现项目相关内容时通知
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  accounts: [
    { username: 'luyuban69', name: '鹿鱼班' },
    { username: 'AWUFDC', name: 'AWUFDC' }
  ],
  stateFile: path.join(__dirname, 'data', 'twitter-monitor-state.json'),
  checkInterval: 5 * 60 * 1000, // 5分钟检查一次
  
  // 项目关键词（用于识别项目推文）
  projectKeywords: [
    '项目', 'project', '代币', 'token', 'airdrop', '空投',
    'mint', '铸造', 'launch', '上线', 'presale', '预售',
    'IDO', 'ICO', 'NFT', 'DeFi', 'GameFi',
    '合约地址', 'contract', 'CA:', '0x',
    '官网', 'website', 'discord', 'telegram',
    '白名单', 'whitelist', 'OG', 'WL'
  ]
};

// 加载状态
function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (err) {
    console.error('加载状态失败:', err.message);
  }
  return { lastTweets: {} };
}

// 保存状态
function saveState(state) {
  try {
    const dir = path.dirname(CONFIG.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('保存状态失败:', err.message);
  }
}

// 检查推文是否包含项目关键词
function isProjectTweet(text) {
  const lowerText = text.toLowerCase();
  return CONFIG.projectKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

// 使用 agent-browser 获取推文
async function fetchTweets(username) {
  try {
    console.log(`\n📱 检查 @${username} 的推文...`);
    
    // 使用 agent-browser 访问 Twitter
    const url = `https://twitter.com/${username}`;
    const cmd = `cd /root/.openclaw/workspace/skills/agent-browser && node cli.js navigate "${url}" --snapshot`;
    
    const output = execSync(cmd, { 
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 简单解析输出（实际需要更复杂的解析）
    // 这里先返回模拟数据，后续完善
    return {
      success: true,
      tweets: []
    };
    
  } catch (err) {
    console.error(`获取 @${username} 推文失败:`, err.message);
    return { success: false, tweets: [] };
  }
}

// 发送 Telegram 通知
function sendNotification(account, tweet) {
  try {
    const message = `🐦 推特项目提醒\n\n👤 账号：@${account.username} (${account.name})\n📝 内容：${tweet.text}\n🔗 链接：${tweet.url}\n⏰ 时间：${tweet.time}`;
    
    console.log('\n' + '='.repeat(60));
    console.log(message);
    console.log('='.repeat(60));
    
    // 写入通知文件，让 AI 助手读取并发送
    const notifFile = path.join(__dirname, 'data', 'twitter-notification.txt');
    const dir = path.dirname(notifFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(notifFile, message + '\n---\n' + new Date().toISOString() + '\n');
    
    console.log('✅ 通知已保存，等待发送\n');
    return true;
    
  } catch (err) {
    console.error('发送通知失败:', err.message);
    return false;
  }
}

// 主监控逻辑
async function monitor() {
  console.log(`\n[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始监控...`);
  
  const state = loadState();
  let hasNewTweets = false;
  
  for (const account of CONFIG.accounts) {
    const result = await fetchTweets(account.username);
    
    if (!result.success) {
      continue;
    }
    
    const lastTweetId = state.lastTweets[account.username];
    const newTweets = [];
    
    for (const tweet of result.tweets) {
      // 如果是新推文
      if (!lastTweetId || tweet.id > lastTweetId) {
        newTweets.push(tweet);
        
        // 检查是否是项目相关
        if (isProjectTweet(tweet.text)) {
          console.log(`\n✅ 发现项目推文: @${account.username}`);
          sendNotification(account, tweet);
          hasNewTweets = true;
        }
      }
    }
    
    // 更新最新推文ID
    if (result.tweets.length > 0) {
      state.lastTweets[account.username] = result.tweets[0].id;
    }
  }
  
  if (hasNewTweets) {
    saveState(state);
  }
  
  console.log('监控完成\n');
}

// 单次运行模式
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Twitter 监控脚本

用法:
  node twitter-monitor.js           # 单次检查
  node twitter-monitor.js --loop    # 持续监控
  node twitter-monitor.js --test    # 测试通知

监控账号:
${CONFIG.accounts.map(a => `  - @${a.username} (${a.name})`).join('\n')}
    `);
    process.exit(0);
  }
  
  if (args.includes('--test')) {
    console.log('📢 测试通知...');
    sendNotification(
      { username: 'test', name: '测试账号' },
      { 
        text: '这是一个测试项目推文，包含关键词：空投、代币',
        url: 'https://twitter.com/test/status/123',
        time: new Date().toLocaleString('zh-CN')
      }
    );
    process.exit(0);
  }
  
  if (args.includes('--loop')) {
    console.log('🔄 启动持续监控模式...');
    console.log(`检查间隔: ${CONFIG.checkInterval / 1000 / 60} 分钟\n`);
    
    // 立即执行一次
    monitor().catch(console.error);
    
    // 定时执行
    setInterval(() => {
      monitor().catch(console.error);
    }, CONFIG.checkInterval);
    
  } else {
    // 单次执行
    monitor()
      .then(() => process.exit(0))
      .catch(err => {
        console.error('监控失败:', err);
        process.exit(1);
      });
  }
}

module.exports = { monitor, CONFIG };
