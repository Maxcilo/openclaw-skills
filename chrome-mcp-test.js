#!/usr/bin/env node
/**
 * Chrome DevTools MCP 测试脚本
 * 测试浏览器控制功能
 */

const { execSync } = require('child_process');

console.log('='.repeat(80));
console.log('Chrome DevTools MCP 测试');
console.log('='.repeat(80));
console.log('');

console.log('📦 检查安装...');
try {
    const version = execSync('chrome-devtools-mcp --version', { encoding: 'utf8' }).trim();
    console.log('✅ Chrome DevTools MCP 已安装，版本:', version);
} catch (err) {
    console.log('❌ Chrome DevTools MCP 未安装');
    console.log('请运行: npm install -g chrome-devtools-mcp');
    process.exit(1);
}

console.log('');
console.log('🔧 可用功能：');
console.log('');
console.log('1. 浏览器自动化');
console.log('   - 导航到URL');
console.log('   - 点击元素');
console.log('   - 填充表单');
console.log('   - 截图');
console.log('');
console.log('2. 性能分析');
console.log('   - 录制性能trace');
console.log('   - 提取性能洞察');
console.log('   - CrUX真实用户数据');
console.log('');
console.log('3. 网络监控');
console.log('   - 请求分析');
console.log('   - 响应检查');
console.log('');
console.log('4. 调试功能');
console.log('   - Console消息');
console.log('   - JavaScript执行');
console.log('   - 元素检查');
console.log('');

console.log('='.repeat(80));
console.log('');
console.log('💡 使用方式：');
console.log('');
console.log('由于OpenClaw目前不直接支持MCP协议，我们通过以下方式使用：');
console.log('');
console.log('方式1：命令行调用（推荐）');
console.log('  - 我可以通过exec工具调用chrome-devtools-mcp');
console.log('  - 适合自动化脚本');
console.log('');
console.log('方式2：Agent Browser（已有）');
console.log('  - 使用现有的agent-browser skill');
console.log('  - 更轻量级');
console.log('');
console.log('方式3：混合使用');
console.log('  - Chrome DevTools MCP用于性能分析');
console.log('  - Agent Browser用于快速操作');
console.log('');

console.log('='.repeat(80));
console.log('');
console.log('🚀 下一步：');
console.log('');
console.log('1. 研究Polymarket网站结构');
console.log('2. 分析API接口');
console.log('3. 开发自动化脚本');
console.log('4. 测试刷单流程');
console.log('');
console.log('='.repeat(80));
