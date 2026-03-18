#!/usr/bin/env node
/**
 * 流动性监控完整报告（文本+图片）
 * 用法: node liquidity-report.js [telegram_user_id]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '..');
const SCRIPTS_DIR = path.join(WORKSPACE, 'scripts');
const CHARTS_DIR = path.join(WORKSPACE, 'data', 'charts');
const TELEGRAM_USER_ID = process.argv[2] || '6311362800';

async function sendReport() {
  console.log('📊 生成流动性监控报告...\n');
  
  // 1. 运行监控脚本生成数据和图表
  console.log('1️⃣ 运行监控脚本...');
  const output = execSync(`node ${path.join(SCRIPTS_DIR, 'liquidity-monitor.js')}`, { 
    encoding: 'utf8',
    cwd: WORKSPACE
  });
  
  // 2. 生成图表（包括合并）
  console.log('2️⃣ 生成图表...');
  execSync(`node ${path.join(SCRIPTS_DIR, 'liquidity-chart.js')}`, {
    encoding: 'utf8',
    cwd: WORKSPACE
  });
  
  // 3. 提取文本报告（去掉配置文件路径和图表生成信息）
  const lines = output.split('\n');
  const reportLines = [];
  let skipNext = false;
  
  for (const line of lines) {
    if (line.includes('💡 配置文件:') || 
        line.includes('📊 生成图表') || 
        line.includes('✅ 图表已生成')) {
      skipNext = true;
      continue;
    }
    if (!skipNext) {
      reportLines.push(line);
    }
  }
  
  const textReport = reportLines.join('\n').trim();
  
  // 4. 发送文本报告
  console.log('3️⃣ 发送文本报告...');
  const textFile = '/tmp/liquidity-report.txt';
  fs.writeFileSync(textFile, textReport);
  
  execSync(`openclaw message send --channel telegram --target ${TELEGRAM_USER_ID} --message "${textReport.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8'
  });
  
  console.log('✅ 文本报告已发送');
  
  // 5. 发送图片
  console.log('4️⃣ 发送图片...');
  const combinedImagePath = path.join(CHARTS_DIR, 'liquidity-combined.png');
  execSync(`openclaw message send --channel telegram --target ${TELEGRAM_USER_ID} --media ${combinedImagePath} --message "📊 趋势图表"`, {
    encoding: 'utf8'
  });
  
  console.log('✅ 图片已发送');
  console.log('\n🎉 流动性监控报告发送完成！');
}

sendReport().catch(e => {
  console.error('❌ 发送失败:', e.message);
  process.exit(1);
});
