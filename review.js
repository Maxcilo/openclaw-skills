#!/usr/bin/env node
/**
 * 复盘记录工具
 * 用于记录交易复盘和错误归集
 */

const fs = require('fs');
const path = require('path');

const REVIEW_FILE = path.join(__dirname, '复盘记录.json');
const MD_FILE = path.join(__dirname, '复盘记录.md');

// 错误分类
const ERROR_CATEGORIES = {
    'timing': '入场时机错误',
    'stoploss': '止损设置错误',
    'position': '仓位管理错误',
    'emotion': '情绪化交易',
    'analysis': '技术分析错误',
    'risk': '风险控制错误',
    'other': '其他错误'
};

// 加载复盘记录
function loadReviews() {
    try {
        if (fs.existsSync(REVIEW_FILE)) {
            return JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('加载失败:', err.message);
    }
    return { reviews: [], errors: [], improvements: [] };
}

// 保存复盘记录
function saveReviews(data) {
    try {
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(data, null, 2));
        updateMarkdown(data);
    } catch (err) {
        console.error('保存失败:', err.message);
    }
}

// 添加复盘
function addReview(review) {
    const data = loadReviews();
    
    const newReview = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ...review
    };
    
    data.reviews.push(newReview);
    saveReviews(data);
    
    console.log('✓ 复盘记录已添加');
    console.log(JSON.stringify(newReview, null, 2));
    
    return newReview;
}

// 添加错误记录
function addError(error) {
    const data = loadReviews();
    
    const newError = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ...error
    };
    
    data.errors.push(newError);
    saveReviews(data);
    
    console.log('✓ 错误记录已添加');
    console.log(JSON.stringify(newError, null, 2));
    
    return newError;
}

// 添加改进措施
function addImprovement(improvement) {
    const data = loadReviews();
    
    const newImprovement = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...improvement
    };
    
    data.improvements.push(newImprovement);
    saveReviews(data);
    
    console.log('✓ 改进措施已添加');
    console.log(JSON.stringify(newImprovement, null, 2));
    
    return newImprovement;
}

// 更新Markdown文件
function updateMarkdown(data) {
    const { reviews, errors, improvements } = data;
    
    let md = `# 交易复盘记录

## 📊 复盘统计

**总复盘次数：** ${reviews.length}
**记录错误：** ${errors.length}
**改进措施：** ${improvements.length}

---

## 📝 复盘记录

`;

    // 按日期分组复盘
    const reviewsByDate = {};
    reviews.forEach(r => {
        if (!reviewsByDate[r.date]) {
            reviewsByDate[r.date] = [];
        }
        reviewsByDate[r.date].push(r);
    });
    
    const dates = Object.keys(reviewsByDate).sort().reverse();
    
    if (dates.length === 0) {
        md += '暂无复盘记录\n\n';
    } else {
        dates.forEach(date => {
            md += `### ${date}\n\n`;
            
            reviewsByDate[date].forEach(r => {
                md += `#### ${r.title || '交易复盘'}\n\n`;
                if (r.tradeId) md += `**交易ID：** ${r.tradeId}\n\n`;
                if (r.summary) md += `**总结：** ${r.summary}\n\n`;
                if (r.whatWentWell) md += `**做得好的：**\n${r.whatWentWell}\n\n`;
                if (r.whatWentWrong) md += `**做得不好的：**\n${r.whatWentWrong}\n\n`;
                if (r.lessons) md += `**经验教训：**\n${r.lessons}\n\n`;
                if (r.nextSteps) md += `**下次改进：**\n${r.nextSteps}\n\n`;
                md += '---\n\n';
            });
        });
    }
    
    md += `## ❌ 错误归集

### 常见错误分类

`;

    // 按分类整理错误
    Object.keys(ERROR_CATEGORIES).forEach(key => {
        const categoryErrors = errors.filter(e => e.category === key);
        
        md += `#### ${ERROR_CATEGORIES[key]}\n\n`;
        
        if (categoryErrors.length === 0) {
            md += '- 暂无记录\n\n';
        } else {
            categoryErrors.forEach(e => {
                md += `- **[${e.date}]** ${e.description}`;
                if (e.impact) md += ` (影响: ${e.impact})`;
                if (e.solution) md += `\n  - 解决方案: ${e.solution}`;
                md += '\n';
            });
            md += '\n';
        }
    });
    
    md += `---

## 💡 改进措施

### 已实施的改进

`;

    const implemented = improvements.filter(i => i.status === 'done');
    if (implemented.length === 0) {
        md += '- 暂无记录\n\n';
    } else {
        implemented.forEach(i => {
            md += `- ✅ **[${i.date}]** ${i.description}\n`;
            if (i.result) md += `  - 效果: ${i.result}\n`;
        });
        md += '\n';
    }
    
    md += `### 待实施的改进

`;

    const pending = improvements.filter(i => i.status === 'pending');
    if (pending.length === 0) {
        md += '- 暂无记录\n\n';
    } else {
        pending.forEach(i => {
            md += `- ⏳ **[${i.date}]** ${i.description}\n`;
            if (i.priority) md += `  - 优先级: ${i.priority}\n`;
        });
        md += '\n';
    }
    
    md += `---

*最后更新：${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}*
`;
    
    fs.writeFileSync(MD_FILE, md);
}

// 命令行接口
const args = process.argv.slice(2);
const command = args[0];

if (command === 'review') {
    // 添加复盘
    const [title, tradeId, summary, whatWentWell, whatWentWrong, lessons, nextSteps] = args.slice(1);
    
    if (!title) {
        console.error('用法: node review.js review <标题> [交易ID] [总结] [做得好] [做得不好] [教训] [改进]');
        process.exit(1);
    }
    
    addReview({
        title,
        tradeId: tradeId || null,
        summary: summary || '',
        whatWentWell: whatWentWell || '',
        whatWentWrong: whatWentWrong || '',
        lessons: lessons || '',
        nextSteps: nextSteps || ''
    });
    
} else if (command === 'error') {
    // 添加错误
    const [category, description, impact, solution] = args.slice(1);
    
    if (!category || !description) {
        console.error('用法: node review.js error <分类> <描述> [影响] [解决方案]');
        console.error('分类: timing|stoploss|position|emotion|analysis|risk|other');
        process.exit(1);
    }
    
    if (!ERROR_CATEGORIES[category]) {
        console.error('无效的分类，可选: ' + Object.keys(ERROR_CATEGORIES).join('|'));
        process.exit(1);
    }
    
    addError({
        category,
        description,
        impact: impact || '',
        solution: solution || ''
    });
    
} else if (command === 'improve') {
    // 添加改进措施
    const [description, priority] = args.slice(1);
    
    if (!description) {
        console.error('用法: node review.js improve <描述> [优先级]');
        process.exit(1);
    }
    
    addImprovement({
        description,
        priority: priority || 'medium'
    });
    
} else if (command === 'done') {
    // 标记改进措施为已完成
    const [improvementId, result] = args.slice(1);
    
    if (!improvementId) {
        console.error('用法: node review.js done <改进ID> [效果]');
        process.exit(1);
    }
    
    const data = loadReviews();
    const improvement = data.improvements.find(i => i.id === parseInt(improvementId));
    
    if (!improvement) {
        console.error('未找到改进措施');
        process.exit(1);
    }
    
    improvement.status = 'done';
    improvement.result = result || '';
    improvement.completedDate = new Date().toISOString().split('T')[0];
    
    saveReviews(data);
    console.log('✓ 改进措施已标记为完成');
    
} else if (command === 'list') {
    // 列出所有记录
    const data = loadReviews();
    console.log(JSON.stringify(data, null, 2));
    
} else {
    console.log('复盘记录工具');
    console.log('');
    console.log('用法:');
    console.log('  添加复盘: node review.js review <标题> [交易ID] [总结] [做得好] [做得不好] [教训] [改进]');
    console.log('  添加错误: node review.js error <分类> <描述> [影响] [解决方案]');
    console.log('  添加改进: node review.js improve <描述> [优先级]');
    console.log('  完成改进: node review.js done <改进ID> [效果]');
    console.log('  列出记录: node review.js list');
    console.log('');
    console.log('错误分类: timing|stoploss|position|emotion|analysis|risk|other');
    console.log('');
    console.log('示例:');
    console.log('  node review.js review "ETH做多复盘" 1234567890 "盈利5%" "入场时机准确" "止盈太早" "要有耐心"');
    console.log('  node review.js error emotion "FOMO追高" "亏损10%" "等待回调再入场"');
    console.log('  node review.js improve "每次交易前检查大周期趋势" high');
}
