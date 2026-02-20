#!/usr/bin/env node

/**
 * Twitter 爬虫 - 使用公开接口
 * 不需要登录，直接抓取推文
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  accounts: [
    { username: 'luyuban69', name: '鹿鱼班' },
    { username: 'AWUFDC', name: 'AWUFDC' }
  ],
  stateFile: path.join(__dirname, 'data', 'twitter-state.json'),
  
  // 项目关键词
  projectKeywords: [
    '项目', 'project', '代币', 'token', 'airdrop', '空投',
    'mint', '铸造', 'launch', '上线', 'presale', '预售',
    'IDO', 'ICO', 'NFT', 'DeFi', 'GameFi',
    '合约', 'contract', 'CA', '0x',
    '官网', 'website', 'discord', 'telegram',
    '白名单', 'whitelist', 'OG', 'WL', '公售'
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
  return { lastChecked: {}, seenTweets: {} };
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
  return CONFIG.projectKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

// 使用 Twitter 的 syndication API（公开接口）
function fetchTweets(username) {
  return new Promise((resolve, reject) => {
    // 使用 Twitter 的公开 API
    const url = `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${username}&limit=20`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tweets = [];
          
          if (json.timeline && json.timeline.entries) {
            for (const entry of json.timeline.entries) {
              if (entry.content && entry.content.tweet) {
                const tweet = entry.content.tweet;
                tweets.push({
                  id: tweet.id_str,
                  text: tweet.text || tweet.full_text || '',
                  created_at: tweet.created_at,
                  url: `https://twitter.com/${username}/status/${tweet.id_str}`
                });
              }
            }
          }
          
          resolve(tweets);
        } catch (err) {
          reject(new Error(`解析失败: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 发送通知（输出到控制台，由 OpenClaw 捕获）
function sendNotification(account, tweet) {
  const message = `🐦 推特项目提醒

👤 账号：@${account.username} (${account.name})
📝 内容：${tweet.text}
🔗 链接：${tweet.url}
⏰ 时间：${new Date(tweet.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  console.log('\n' + '='.repeat(60));
  console.log(message);
  console.log('='.repeat(60) + '\n');
  
  // 保存到文件，供后续处理
  const notifFile = path.join(__dirname, 'data', 'twitter-notifications.jsonl');
  const dir = path.dirname(notifFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const record = {
    timestamp: new Date().toISOString(),
    account: account.username,
    tweet: tweet,
    message: message
  };
  
  fs.appendFileSync(notifFile, JSON.stringify(record) + '\n');
}

// 主监控逻辑
async function monitor() {
  console.log(`\n[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始检查推文...`);
  
  const state = loadState();
  let hasNewProjectTweets = false;
  
  for (const account of CONFIG.accounts) {
    try {
      console.log(`\n📱 检查 @${account.username}...`);
      
      const tweets = await fetchTweets(account.username);
      console.log(`   获取到 ${tweets.length} 条推文`);
      
      if (!state.seenTweets[account.username]) {
        state.seenTweets[account.username] = [];
      }
      
      const seenIds = new Set(state.seenTweets[account.username]);
      const newTweets = tweets.filter(t => !seenIds.has(t.id));
      
      if (newTweets.length > 0) {
        console.log(`   发现 ${newTweets.length} 条新推文`);
        
        for (const tweet of newTweets) {
          // 检查是否是项目相关
          if (isProjectTweet(tweet.text)) {
            console.log(`   ✅ 项目推文: ${tweet.text.substring(0, 50)}...`);
            sendNotification(account, tweet);
            hasNewProjectTweets = true;
          } else {
            console.log(`   ⏭️  普通推文: ${tweet.text.substring(0, 50)}...`);
          }
          
          // 记录已见过的推文
          seenIds.add(tweet.id);
        }
        
        // 只保留最近100条的ID
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
  
  if (hasNewProjectTweets) {
    console.log('\n✅ 发现新的项目推文，已发送通知');
  } else {
    console.log('\n✓ 检查完成，暂无新的项目推文');
  }
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Twitter 监控脚本

用法:
  node twitter-crawler.js           # 单次检查
  node twitter-crawler.js --loop    # 持续监控（每5分钟）
  node twitter-crawler.js --test    # 测试抓取

监控账号:
${CONFIG.accounts.map(a => `  - @${a.username} (${a.name})`).join('\n')}
    `);
    process.exit(0);
  }
  
  if (args.includes('--test')) {
    console.log('🧪 测试抓取推文...\n');
    fetchTweets('elonmusk')
      .then(tweets => {
        console.log(`成功获取 ${tweets.length} 条推文\n`);
        tweets.slice(0, 3).forEach(t => {
          console.log(`- ${t.text.substring(0, 100)}...`);
        });
      })
      .catch(err => console.error('测试失败:', err.message));
    return;
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
