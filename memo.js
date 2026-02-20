#!/usr/bin/env node
/**
 * 交易备忘录工具
 * 用于记录市场判断、关键位置、交易策略
 */

const fs = require('fs');
const path = require('path');

const MEMO_FILE = path.join(__dirname, '交易备忘录.json');
const MD_FILE = path.join(__dirname, '交易备忘录.md');

// 加载备忘录
function loadMemos() {
    try {
        if (fs.existsSync(MEMO_FILE)) {
            return JSON.parse(fs.readFileSync(MEMO_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载失败:', err.message);
    }
    return { memos: [] };
}

// 保存备忘录
function saveMemos(data) {
    try {
        fs.writeFileSync(MEMO_FILE, JSON.stringify(data, null, 2));
        updateMarkdown(data);
    } catch (err) {
        console.error('保存失败:', err.message);
    }
}

// 添加备忘录
function addMemo(memo) {
    const data = loadMemos();
    
    const newMemo = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ...memo
    };
    
    data.memos.push(newMemo);
    saveMemos(data);
    
    console.log('✓ 备忘录已添加');
    console.log(JSON.stringify(newMemo, null, 2));
    
    return newMemo;
}

// 更新Markdown
function updateMarkdown(data) {
    const { memos } = data;
    const latest = memos.length > 0 ? memos[memos.length - 1] : null;
    
    let md = `# 交易备忘录

## 📝 最新备忘（${latest ? latest.date : '待添加'}）

`;

    if (latest) {
        md += `### 市场判断
- **行情性质：** ${latest.marketType || '待判断'}
- **更新时间：** ${new Date(latest.timestamp).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}

`;

        if (latest.keyLevels) {
            md += `### 关键压力位

`;
            if (latest.keyLevels.btc) {
                md += `**BTC：**
- 压力区间：${latest.keyLevels.btc.resistance || '待定'}
- 支撑区间：${latest.keyLevels.btc.support || '待定'}

`;
            }
            
            if (latest.keyLevels.eth) {
                md += `**ETH：**
- 压力区间：${latest.keyLevels.eth.resistance || '待定'}
- 支撑区间：${latest.keyLevels.eth.support || '待定'}

`;
            }
        }
        
        if (latest.strategy) {
            md += `### 交易策略建议
${latest.strategy}

`;
        }
    }
    
    md += `---

## 📋 历史备忘

`;

    if (memos.length === 0) {
        md += `暂无备忘录

`;
    } else {
        memos.slice().reverse().forEach(m => {
            md += `### ${m.date}

**市场状态：** ${m.marketType || '待判断'}

`;
            
            if (m.keyLevels) {
                md += `**关键位置：**
`;
                if (m.keyLevels.btc) {
                    md += `- BTC压力：${m.keyLevels.btc.resistance || '待定'}`;
                    if (m.keyLevels.btc.support) md += ` | 支撑：${m.keyLevels.btc.support}`;
                    md += `\n`;
                }
                if (m.keyLevels.eth) {
                    md += `- ETH压力：${m.keyLevels.eth.resistance || '待定'}`;
                    if (m.keyLevels.eth.support) md += ` | 支撑：${m.keyLevels.eth.support}`;
                    md += `\n`;
                }
                md += `\n`;
            }
            
            if (m.strategy) {
                md += `**交易策略：**
${m.strategy}

`;
            }
            
            if (m.note) {
                md += `**注意事项：**
${m.note}

`;
            }
            
            md += `---\n\n`;
        });
    }
    
    md += `## 📊 备忘录模板

\`\`\`
### YYYY-MM-DD

**市场判断：**
- 行情性质：
- 趋势方向：

**关键位置：**
- BTC支撑/压力：
- ETH支撑/压力：

**交易策略：**
- 

**风险提示：**
- 
\`\`\`

---

*最后更新：${latest ? latest.date : '待添加'}*
`;
    
    fs.writeFileSync(MD_FILE, md);
}

// 命令行接口
const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
    if (args[1]) {
        try {
            const data = JSON.parse(args[1]);
            addMemo(data);
        } catch (err) {
            console.error('JSON解析失败:', err.message);
        }
    } else {
        console.log('用法: node memo.js add \'<JSON数据>\'');
    }
    
} else if (command === 'list') {
    const data = loadMemos();
    console.log(JSON.stringify(data, null, 2));
    
} else if (command === 'latest') {
    const data = loadMemos();
    if (data.memos.length > 0) {
        const latest = data.memos[data.memos.length - 1];
        console.log('最新备忘录:');
        console.log(JSON.stringify(latest, null, 2));
    } else {
        console.log('暂无备忘录');
    }
    
} else {
    console.log('交易备忘录工具');
    console.log('');
    console.log('用法:');
    console.log('  添加备忘: node memo.js add \'<JSON数据>\'');
    console.log('  列出全部: node memo.js list');
    console.log('  最新备忘: node memo.js latest');
    console.log('');
    console.log('JSON格式示例:');
    console.log('{');
    console.log('  "marketType": "反弹行情",');
    console.log('  "keyLevels": {');
    console.log('    "btc": {');
    console.log('      "resistance": "71,000 - 72,000",');
    console.log('      "support": "65,000 - 66,000"');
    console.log('    },');
    console.log('    "eth": {');
    console.log('      "resistance": "2,100 - 2,150",');
    console.log('      "support": "1,900 - 2,000"');
    console.log('    }');
    console.log('  },');
    console.log('  "strategy": "接近压力位时注意减仓",');
    console.log('  "note": "反弹行情，不追高"');
    console.log('}');
}
