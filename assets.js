#!/usr/bin/env node
/**
 * 资产统计工具（安全版）
 * 完整数据保存到vault，自动生成脱敏摘要
 */

const fs = require('fs');
const path = require('path');

const VAULT_FILE = path.join(__dirname, 'vault/assets-full.json');
const SUMMARY_FILE = path.join(__dirname, 'data/finance/assets-summary.json');
const MD_FILE = path.join(__dirname, '资产统计.md');

// 加载完整资产记录（从vault）
function loadAssets() {
    try {
        if (fs.existsSync(VAULT_FILE)) {
            return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载失败:', err.message);
    }
    return { records: [] };
}

// 保存资产记录（到vault）
function saveAssets(data) {
    try {
        // 保存完整数据到vault
        fs.writeFileSync(VAULT_FILE, JSON.stringify(data, null, 2));
        fs.chmodSync(VAULT_FILE, 0o600);
        
        // 生成脱敏摘要
        generateSummary(data);
        
        // 更新Markdown
        updateMarkdown(data);
    } catch (err) {
        console.error('保存失败:', err.message);
    }
}

// 生成脱敏摘要
function generateSummary(data) {
    const latest = data.records.length > 0 ? data.records[data.records.length - 1] : null;
    
    if (!latest) return;
    
    // 将具体金额转换为范围
    const getRange = (amount) => {
        if (amount < 10000) return '<10k';
        if (amount < 50000) return '10k-50k';
        if (amount < 100000) return '50k-100k';
        if (amount < 200000) return '100k-200k';
        if (amount < 500000) return '200k-500k';
        return '>500k';
    };
    
    const summary = {
        summary: {
            lastUpdate: latest.date,
            totalAssetsRange: getRange(latest.total + (latest.debt || 0)),
            netWorthRange: getRange(latest.total),
            hasDebt: (latest.debt || 0) > 0
        },
        distribution: {
            crypto: {
                percentage: '100%',
                mainPlatforms: ['交易所', '链上钱包'],
                hasContract: (latest.crypto?.contract || 0) > 0
            },
            traditional: {
                percentage: '0%'
            }
        },
        note: '此为脱敏摘要，不包含具体金额、账户信息'
    };
    
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
}

// 更新Markdown（脱敏版）
function updateMarkdown(data) {
    const latest = data.records.length > 0 ? data.records[data.records.length - 1] : null;
    
    let md = `# 资产统计记录

## 📊 最新统计

**更新时间：** ${latest ? latest.date : '待更新'}
**总资产：** 已记录（查看完整数据请访问vault）

---

## 📈 资产分布

`;

    if (latest) {
        md += `### 加密货币
- **交易所现货：** 主要资产
- **合约持仓：** ${(latest.crypto?.contract || 0) > 0 ? '有持仓' : '无'}
- **链上钱包：** 部分资产

### 传统资产
- **银行存款：** ${(latest.traditional?.bank || 0) > 0 ? '有' : '无'}
- **其他投资：** ${(latest.traditional?.other || 0) > 0 ? '有' : '无'}

### 负债情况
- **需偿还：** ${(latest.debt || 0) > 0 ? '有' : '无'}

`;
    } else {
        md += `### 加密货币
- **交易所现货：** 待统计
- **合约持仓：** 待统计
- **链上钱包：** 待统计

### 传统资产
- **银行存款：** 待统计
- **其他投资：** 待统计

`;
    }
    
    md += `---

## 📝 历史记录

`;

    if (data.records.length === 0) {
        md += `暂无记录

`;
    } else {
        data.records.slice().reverse().forEach((r, idx) => {
            const prev = data.records.length - idx - 2 >= 0 ? data.records[data.records.length - idx - 2] : null;
            const change = prev ? ((r.total - prev.total) / prev.total * 100).toFixed(2) : null;
            const changeSign = change && change > 0 ? '+' : '';
            
            md += `### ${r.date}\n\n`;
            
            if (change !== null) {
                md += `**较上周：** ${changeSign}${change}%\n\n`;
            }
            
            md += `**资产分布：**\n`;
            md += `- 加密货币：主要资产\n`;
            md += `- 传统资产：${(r.traditional?.bank || 0) + (r.traditional?.other || 0) > 0 ? '有' : '无'}\n`;
            md += `- 负债：${(r.debt || 0) > 0 ? '有' : '无'}\n`;
            md += `\n`;
            
            if (r.note) {
                md += `**备注：** ${r.note.replace(/\d+k/gi, '[金额]').replace(/\d+/g, 'X')}\n\n`;
            }
            
            md += `---\n\n`;
        });
    }
    
    md += `## 📋 统计模板

每周更新时填写（告诉AI即可）：

\`\`\`
总资产：XXX
交易所：XXX
链上：XXX
负债：XXX
\`\`\`

---

## ⚠️ 注意事项

1. 每周一晚上8点更新
2. 此文件只记录概况，不包含具体金额
3. 完整数据保存在 \`vault/assets-full.json\`（权限700）
4. 需要查看具体金额时，从vault读取

---

## 🔐 数据访问

**查看脱敏摘要：**
- 使用 \`data/finance/assets-summary.json\`

**查看完整数据：**
- 仅在必要时从 \`vault/assets-full.json\` 读取
- 本地处理后返回结果
- 不在对话中暴露完整金额

---

*最后更新：${latest ? latest.date : '待更新'}*
`;
    
    fs.writeFileSync(MD_FILE, md);
}

// 添加资产记录
function addRecord(record) {
    const data = loadAssets();
    
    const newRecord = {
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ...record
    };
    
    data.records.push(newRecord);
    saveAssets(data);
    
    console.log('✓ 资产记录已添加到vault');
    console.log('✓ 脱敏摘要已生成');
    
    return newRecord;
}

// 查看最新记录（脱敏版）
function showLatest() {
    const summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
    console.log('最新资产统计（脱敏）:');
    console.log(JSON.stringify(summary, null, 2));
}

// 命令行接口
const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
    if (args[1]) {
        try {
            const data = JSON.parse(args[1]);
            addRecord(data);
        } catch (err) {
            console.error('JSON解析失败:', err.message);
        }
    } else {
        console.log('用法: node assets.js add \'<JSON数据>\'');
    }
    
} else if (command === 'latest') {
    showLatest();
    
} else {
    console.log('资产统计工具（安全版）');
    console.log('');
    console.log('用法:');
    console.log('  添加记录: node assets.js add \'<JSON数据>\'');
    console.log('  查看摘要: node assets.js latest');
    console.log('');
    console.log('说明:');
    console.log('  - 完整数据保存到 vault/assets-full.json（权限600）');
    console.log('  - 自动生成脱敏摘要到 data/finance/assets-summary.json');
    console.log('  - 不在对话中暴露具体金额');
}
