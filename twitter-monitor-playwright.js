#!/usr/bin/env node

/**
 * Twitter 监控 - Playwright 登录版本
 * 真正登录推特账号，监控指定用户的推文
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  accountFile: path.join(__dirname, 'vault', 'twitter-monitor-account.json'),
  stateFile: path.join(__dirname, 'data', 'twitter-monitor-state.json'),
  cookiesFile: path.join(__dirname, 'data', 'twitter-cookies.json'),
  
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
  return JSON.parse(fs.readFileSync(CONFIG.accountFile, 'utf8'));
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
🔗 ${tweet.url}
⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

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

// 登录推特
async function loginTwitter(page, account) {
  console.log('🔐 正在登录推特...');
  
  try {
    // 访问登录页面
    await page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 输入邮箱/用户名
    console.log('   输入邮箱...');
    await page.fill('input[autocomplete="username"]', account.email);
    await page.click('button:has-text("Next"), button:has-text("下一步")');
    await page.waitForTimeout(2000);
    
    // 可能需要输入备份码
    const needsBackupCode = await page.locator('input[data-testid="ocfEnterTextTextInput"]').isVisible().catch(() => false);
    if (needsBackupCode && account.backup_code) {
      console.log('   需要备份码，正在输入...');
      await page.fill('input[data-testid="ocfEnterTextTextInput"]', account.backup_code);
      await page.click('button[data-testid="ocfEnterTextNextButton"]');
      await page.waitForTimeout(2000);
    }
    
    // 输入密码
    console.log('   输入密码...');
    await page.fill('input[name="password"]', account.password);
    await page.click('button[data-testid="LoginForm_Login_Button"]');
    await page.waitForTimeout(3000);
    
    // 检查是否登录成功
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');
    
    if (isLoggedIn) {
      console.log('✅ 登录成功！\n');
      
      // 保存 cookies
      const cookies = await page.context().cookies();
      const dir = path.dirname(CONFIG.cookiesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG.cookiesFile, JSON.stringify(cookies, null, 2));
      
      return true;
    } else {
      console.log('❌ 登录失败\n');
      return false;
    }
    
  } catch (err) {
    console.error('❌ 登录出错:', err.message);
    return false;
  }
}

// 抓取用户推文
async function fetchUserTweets(page, username) {
  try {
    console.log(`📱 访问 @${username} 的主页...`);
    
    await page.goto(`https://twitter.com/${username}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 滚动加载推文
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    
    // 提取推文
    const tweets = await page.evaluate(() => {
      const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
      const results = [];
      
      tweetElements.forEach((el, index) => {
        if (index >= 10) return; // 只取前10条
        
        const textEl = el.querySelector('[data-testid="tweetText"]');
        const timeEl = el.querySelector('time');
        const linkEl = el.querySelector('a[href*="/status/"]');
        
        if (textEl && timeEl && linkEl) {
          const text = textEl.innerText;
          const timestamp = timeEl.getAttribute('datetime');
          const url = 'https://twitter.com' + linkEl.getAttribute('href');
          const id = url.split('/status/')[1]?.split('?')[0];
          
          if (id) {
            results.push({ id, text, timestamp, url });
          }
        }
      });
      
      return results;
    });
    
    console.log(`   获取到 ${tweets.length} 条推文`);
    return tweets;
    
  } catch (err) {
    console.error(`   ❌ 抓取失败: ${err.message}`);
    return [];
  }
}

// 主监控逻辑
async function monitor() {
  console.log(`\n[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始监控推文...`);
  
  const account = loadAccount();
  const state = loadState();
  const notifications = [];
  
  let browser;
  let page;
  
  try {
    // 启动浏览器
    console.log('🚀 启动浏览器...\n');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    
    // 尝试加载已保存的 cookies
    if (fs.existsSync(CONFIG.cookiesFile)) {
      const cookies = JSON.parse(fs.readFileSync(CONFIG.cookiesFile, 'utf8'));
      await context.addCookies(cookies);
      console.log('✅ 已加载保存的登录状态\n');
    }
    
    page = await context.newPage();
    
    // 检查是否需要登录
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle' });
    const currentUrl = page.url();
    const needsLogin = currentUrl.includes('/login');
    
    if (needsLogin) {
      const loginSuccess = await loginTwitter(page, account);
      if (!loginSuccess) {
        throw new Error('登录失败');
      }
    } else {
      console.log('✅ 已登录状态\n');
    }
    
    // 监控每个账号
    for (const watchAccount of CONFIG.watchAccounts) {
      const tweets = await fetchUserTweets(page, watchAccount.username);
      
      if (!state.seenTweets[watchAccount.username]) {
        state.seenTweets[watchAccount.username] = [];
      }
      
      const seenIds = new Set(state.seenTweets[watchAccount.username]);
      const newTweets = tweets.filter(t => !seenIds.has(t.id));
      
      if (newTweets.length > 0) {
        console.log(`   发现 ${newTweets.length} 条新推文\n`);
        
        for (const tweet of newTweets) {
          const keywords = isProjectTweet(tweet.text);
          
          if (keywords && keywords.length > 0) {
            console.log(`   ✅ 项目推文！`);
            const message = sendNotification(watchAccount, tweet, keywords);
            notifications.push(message);
          } else {
            console.log(`   ⏭️  普通推文: ${tweet.text.substring(0, 50)}...`);
          }
          
          seenIds.add(tweet.id);
        }
        
        state.seenTweets[watchAccount.username] = Array.from(seenIds).slice(-100);
      } else {
        console.log(`   没有新推文\n`);
      }
      
      state.lastChecked[watchAccount.username] = new Date().toISOString();
    }
    
    saveState(state);
    
    if (notifications.length > 0) {
      console.log(`\n✅ 发现 ${notifications.length} 条项目推文，已发送通知`);
    } else {
      console.log('\n✓ 检查完成，暂无新的项目推文');
    }
    
  } catch (err) {
    console.error('\n❌ 监控失败:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return notifications;
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Twitter 监控脚本（Playwright 登录版）

用法:
  node twitter-monitor-playwright.js           # 单次检查
  node twitter-monitor-playwright.js --loop    # 持续监控（每5分钟）

监控账号:
${CONFIG.watchAccounts.map(a => `  - @${a.username} (${a.name})`).join('\n')}
    `);
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

module.exports = { monitor };
