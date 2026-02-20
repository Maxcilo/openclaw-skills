#!/usr/bin/env node

/**
 * Twitter 监控 - 使用真实账号登录
 * 监控指定账号的推文，发现项目相关内容时通知
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  accountFile: path.join(__dirname, 'vault', 'twitter-monitor-account.json'),
  stateFile: path.join(__dirname, 'data', 'twitter-monitor-state.json'),
  
  // 监控的账号
  watchAccounts: [
    { username: 'luyuban69', name: '鹿鱼班' },
    { username: 'AWUFDC', name: 'AWUFDC' }
  ],
  
  // 项目关键词
  projectKeywords: [
    '项目', 'project', '代币', 'token', 'airdrop', '空投',
    'mint', '铸造', 'launch', '上线', 'presale', '预售',
    'IDO', 'ICO', 'NFT', 'DeFi', 'GameFi',
    '合约', 'contract', 'CA', '0x',
    '官网', 'website', 'discord', 'telegram',
    '白名单', 'whitelist', 'OG', 'WL', '公售',
    '发售', 'sale', '认购', '抢购'
  ]
};

// 加载账号信息
function loadAccount() {
  try {
    if (!fs.existsSync(CONFIG.accountFile)) {
      throw new Error('账号文件不存在');
    }
    return JSON.parse(fs.readFileSync(CONFIG.accountFile, 'utf8'));
  } catch (err) {
    console.error('❌ 加载账号失败:', err.message);
    process.exit(1);
  }
}

// 加载状态
function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (err) {
    console.error('加载状态失败:', err.message);
  }
  return { seenTweets: {}, lastChecked: {} };
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

// 检查是否是项目推文
function isProjectTweet(text) {
  const lowerText = text.toLowerCase();
  const matchedKeywords = CONFIG.projectKeywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  return matchedKeywords.length > 0 ? matchedKeywords : false;
}

// 发送通知
function sendNotification(account, tweet, keywords) {
  const message = `🐦 推特项目提醒

👤 账号：@${account.username} (${account.name})
🏷️ 关键词：${keywords.join(', ')}
📝 内容：${tweet.text}
🔗 ${tweet.url}
⏰ ${new Date(tweet.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  console.log('\n' + '='.repeat(60));
  console.log(message);
  console.log('='.repeat(60) + '\n');
  
  // 保存通知记录
  const notifFile = path.join(__dirname, 'data', 'twitter-notifications.jsonl');
  const dir = path.dirname(notifFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const record = {
    timestamp: new Date().toISOString(),
    account: account.username,
    tweet: tweet,
    keywords: keywords,
    message: message
  };
  
  fs.appendFileSync(notifFile, JSON.stringify(record) + '\n');
  
  return message;
}

// 使用 playwright 或 puppeteer 登录并抓取
async function monitorWithLogin() {
  console.log('🔐 使用登录账号监控推特...\n');
  console.log('⚠️  注意：此功能需要安装 playwright 或 puppeteer');
  console.log('暂时使用公开 API 方式，稍后升级为登录模式\n');
  
  // TODO: 实现登录逻辑
  // 这里先用之前的公开 API 方式
  
  console.log('💡 提示：完整的登录监控功能正在开发中');
  console.log('当前使用公开接口模式\n');
}

// 主监控逻辑（使用公开接口）
async function monitor() {
  console.log(`\n[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始监控推文...`);
  
  const state = loadState();
  const notifications = [];
  
  for (const account of CONFIG.watchAccounts) {
    try {
      console.log(`\n📱 检查 @${account.username}...`);
      
      // 使用 Twitter syndication API
      const cmd = `curl -s "https://cdn.syndication.twimg.com/timeline/profile?screen_name=${account.username}&limit=20"`;
      const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      
      const data = JSON.parse(output);
      const tweets = [];
      
      if (data.timeline && data.timeline.entries) {
        for (const entry of data.timeline.entries) {
          if (entry.content && entry.content.tweet) {
            const tweet = entry.content.tweet;
            tweets.push({
              id: tweet.id_str,
              text: tweet.text || tweet.full_text || '',
              timestamp: new Date(tweet.created_at).getTime(),
              url: `https://twitter.com/${account.username}/status/${tweet.id_str}`
            });
          }
        }
      }
      
      console.log(`   获取到 ${tweets.length} 条推文`);
      
      if (!state.seenTweets[account.username]) {
        state.seenTweets[account.username] = [];
      }
      
      const seenIds = new Set(state.seenTweets[account.username]);
      const newTweets = tweets.filter(t => !seenIds.has(t.id));
      
      if (newTweets.length > 0) {
        console.log(`   发现 ${newTweets.length} 条新推文`);
        
        for (const tweet of newTweets) {
          const keywords = isProjectTweet(tweet.text);
          
          if (keywords && keywords.length > 0) {
            console.log(`   ✅ 项目推文！`);
            const message = sendNotification(account, tweet, keywords);
            notifications.push(message);
          } else {
            console.log(`   ⏭️  普通推文: ${tweet.text.substring(0, 50)}...`);
          }
          
          seenIds.add(tweet.id);
        }
        
        // 只保留最近100条
        state.seenTweets[account.username] = Array.from(seenIds).slice(-100);
      } else {
        console.log(`   没有新推文`);
      }
      
      state.lastChecked[account.username] = new Date().toISOString();
      
    } catch (err) {
      console.error(`   ❌ 检查失败: ${err.message}`);
    }
  }
  
  saveState(state);
  
  if (notifications.length > 0) {
    console.log(`\n✅ 发现 ${notifications.length} 条项目推文，已发送通知`);
  } else {
    console.log('\n✓ 检查完成，暂无新的项目推文');
  }
  
  return notifications;
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Twitter 监控脚本（登录模式）

用法:
  node twitter-monitor-login.js           # 单次检查
  node twitter-monitor-login.js --loop    # 持续监控（每5分钟）
  node twitter-monitor-login.js --test    # 测试账号

监控账号:
${CONFIG.watchAccounts.map(a => `  - @${a.username} (${a.name})`).join('\n')}
    `);
    process.exit(0);
  }
  
  if (args.includes('--test')) {
    console.log('🧪 测试账号信息...\n');
    const account = loadAccount();
    console.log(`✅ 账号: ${account.email}`);
    console.log(`✅ 用途: ${account.purpose}`);
    console.log(`✅ 创建时间: ${account.created_at}\n`);
    process.exit(0);
  }
  
  if (args.includes('--loop')) {
    console.log('🔄 启动持续监控模式...');
    console.log('检查间隔: 5 分钟\n');
    
    // 立即执行一次
    monitor().catch(console.error);
    
    // 定时执行
    setInterval(() => {
      monitor().catch(console.error);
    }, 5 * 60 * 1000);
    
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
