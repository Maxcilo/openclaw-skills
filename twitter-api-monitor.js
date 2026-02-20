#!/usr/bin/env node

/**
 * Twitter 监控 - 使用官方 API v2
 * 监控指定账号的推文，发现项目相关内容时通知
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  keysFile: path.join(__dirname, 'vault', 'twitter-api-keys.json'),
  stateFile: path.join(__dirname, 'data', 'twitter-api-state.json'),
  
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

// 加载 API Keys
function loadKeys() {
  return JSON.parse(fs.readFileSync(CONFIG.keysFile, 'utf8'));
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
  return { lastTweetId: {}, lastChecked: {} };
}

// 保存状态
function saveState(state) {
  const dir = path.dirname(CONFIG.stateFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
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
🔗 https://twitter.com/${account.username}/status/${tweet.id}
⏰ ${new Date(tweet.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

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

// 主监控逻辑
async function monitor() {
  console.log(`\n[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始监控推文...`);
  
  const keys = loadKeys();
  const state = loadState();
  const notifications = [];
  
  try {
    // 初始化 Twitter API 客户端
    const client = new TwitterApi(keys.bearer_token);
    const roClient = client.readOnly;
    
    console.log('✅ Twitter API 连接成功\n');
    
    // 监控每个账号
    for (const account of CONFIG.watchAccounts) {
      try {
        console.log(`📱 检查 @${account.username}...`);
        
        // 获取用户信息
        const user = await roClient.v2.userByUsername(account.username);
        if (!user.data) {
          console.log(`   ❌ 用户不存在\n`);
          continue;
        }
        
        const userId = user.data.id;
        
        // 获取最新推文
        const params = {
          max_results: 10,
          'tweet.fields': ['created_at', 'text']
        };
        
        // 如果有上次的推文ID，只获取之后的
        if (state.lastTweetId[account.username]) {
          params.since_id = state.lastTweetId[account.username];
        }
        
        const timeline = await roClient.v2.userTimeline(userId, params);
        const tweets = timeline.data?.data || [];
        
        console.log(`   获取到 ${tweets.length} 条推文`);
        
        if (tweets.length > 0) {
          // 更新最新推文ID
          state.lastTweetId[account.username] = tweets[0].id;
          
          // 检查每条推文
          for (const tweet of tweets.reverse()) {
            const keywords = isProjectTweet(tweet.text);
            
            if (keywords && keywords.length > 0) {
              console.log(`   ✅ 项目推文！`);
              const message = sendNotification(account, tweet, keywords);
              notifications.push(message);
            } else {
              console.log(`   ⏭️  普通推文: ${tweet.text.substring(0, 50)}...`);
            }
          }
        } else {
          console.log(`   没有新推文`);
        }
        
        state.lastChecked[account.username] = new Date().toISOString();
        console.log('');
        
      } catch (err) {
        console.error(`   ❌ 检查失败: ${err.message}\n`);
      }
    }
    
    saveState(state);
    
    if (notifications.length > 0) {
      console.log(`✅ 发现 ${notifications.length} 条项目推文，已发送通知`);
    } else {
      console.log('✓ 检查完成，暂无新的项目推文');
    }
    
    return notifications;
    
  } catch (err) {
    console.error('\n❌ 监控失败:', err.message);
    if (err.code === 429) {
      console.error('⚠️  API 请求超限，请稍后再试');
    }
    throw err;
  }
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Twitter 监控脚本（官方 API v2）

用法:
  node twitter-api-monitor.js           # 单次检查
  node twitter-api-monitor.js --loop    # 持续监控（每小时）
  node twitter-api-monitor.js --test    # 测试连接

监控账号:
${CONFIG.watchAccounts.map(a => `  - @${a.username} (${a.name})`).join('\n')}
    `);
    process.exit(0);
  }
  
  if (args.includes('--test')) {
    console.log('🧪 测试 Twitter API 连接...\n');
    const keys = loadKeys();
    const client = new TwitterApi(keys.bearer_token);
    
    client.v2.me()
      .then(user => {
        console.log('✅ API 连接成功！');
        console.log(`账号: @${user.data.username}`);
        console.log(`名称: ${user.data.name}\n`);
      })
      .catch(err => {
        console.error('❌ API 连接失败:', err.message);
      });
    return;
  }
  
  if (args.includes('--loop')) {
    console.log('🔄 启动持续监控模式...');
    console.log('检查间隔: 1 小时\n');
    
    // 立即执行一次
    monitor().catch(console.error);
    
    // 定时执行
    setInterval(() => {
      monitor().catch(console.error);
    }, 60 * 60 * 1000);
    
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

module.exports = { monitor };
