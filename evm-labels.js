#!/usr/bin/env node
/**
 * EVM 地址标签管理工具
 * 为地址添加标签和备注
 * 
 * 使用方法：
 *   ./evm-labels.js add --address 0x... --label "主地址"
 *   ./evm-labels.js list
 *   ./evm-labels.js get --address 0x...
 */

const fs = require('fs');
const path = require('path');

const LABELS_FILE = path.join(__dirname, 'address-labels.json');

// 加载标签
function loadLabels() {
  if (!fs.existsSync(LABELS_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(LABELS_FILE, 'utf8'));
}

// 保存标签
function saveLabels(labels) {
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
}

// 添加标签
function addLabel(address, label, note = null) {
  const labels = loadLabels();
  
  labels[address.toLowerCase()] = {
    address,
    label,
    note,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  saveLabels(labels);
  console.log(`✅ 已添加标签: ${address} → ${label}`);
}

// 获取标签
function getLabel(address) {
  const labels = loadLabels();
  const label = labels[address.toLowerCase()];
  
  if (label) {
    console.log(`\n📋 地址标签:\n`);
    console.log(`地址: ${label.address}`);
    console.log(`标签: ${label.label}`);
    if (label.note) {
      console.log(`备注: ${label.note}`);
    }
    console.log(`创建时间: ${label.createdAt}`);
    console.log(`更新时间: ${label.updatedAt}`);
  } else {
    console.log(`❌ 未找到标签: ${address}`);
  }
  
  return label;
}

// 列出所有标签
function listLabels() {
  const labels = loadLabels();
  const entries = Object.values(labels);
  
  if (entries.length === 0) {
    console.log('📭 暂无标签');
    return;
  }
  
  console.log(`\n📋 地址标签列表 (共 ${entries.length} 个):\n`);
  
  entries.forEach((label, i) => {
    console.log(`${i + 1}. ${label.label}`);
    console.log(`   地址: ${label.address}`);
    if (label.note) {
      console.log(`   备注: ${label.note}`);
    }
    console.log('');
  });
}

// 删除标签
function removeLabel(address) {
  const labels = loadLabels();
  const key = address.toLowerCase();
  
  if (labels[key]) {
    delete labels[key];
    saveLabels(labels);
    console.log(`✅ 已删除标签: ${address}`);
  } else {
    console.log(`❌ 未找到标签: ${address}`);
  }
}

// 导出标签
function exportLabels(outputFile) {
  const labels = loadLabels();
  const entries = Object.values(labels);
  
  // 导出为 CSV
  let csv = '地址,标签,备注,创建时间\n';
  entries.forEach(label => {
    csv += `"${label.address}","${label.label}","${label.note || ''}","${label.createdAt}"\n`;
  });
  
  fs.writeFileSync(outputFile, csv);
  console.log(`✅ 已导出到: ${outputFile}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🏷️  EVM 地址标签管理工具

使用方法：

1. 添加标签:
   ./evm-labels.js add --address 0x... --label "主地址"
   ./evm-labels.js add --address 0x... --label "子地址1" --note "用于测试"

2. 查询标签:
   ./evm-labels.js get --address 0x...

3. 列出所有标签:
   ./evm-labels.js list

4. 删除标签:
   ./evm-labels.js remove --address 0x...

5. 导出标签:
   ./evm-labels.js export --output labels.csv

6. 批量导入标签:
   ./evm-labels.js import --file labels.json

命令说明：
  add       添加标签
  get       查询标签
  list      列出所有标签
  remove    删除标签
  export    导出标签
  import    导入标签
  help      显示帮助

参数说明：
  --address <addr>     地址
  --label <text>       标签名称
  --note <text>        备注（可选）
  --output <file>      输出文件
  --file <file>        输入文件
    `);
    process.exit(0);
  }
  
  const command = args[0];
  
  // 解析参数
  let address = null;
  let label = null;
  let note = null;
  let output = null;
  let file = null;
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--address' && args[i + 1]) {
      address = args[i + 1];
      i++;
    } else if (args[i] === '--label' && args[i + 1]) {
      label = args[i + 1];
      i++;
    } else if (args[i] === '--note' && args[i + 1]) {
      note = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      file = args[i + 1];
      i++;
    }
  }
  
  // 执行命令
  switch (command) {
    case 'add':
      if (!address || !label) {
        console.error('❌ 请指定 --address 和 --label');
        process.exit(1);
      }
      addLabel(address, label, note);
      break;
      
    case 'get':
      if (!address) {
        console.error('❌ 请指定 --address');
        process.exit(1);
      }
      getLabel(address);
      break;
      
    case 'list':
      listLabels();
      break;
      
    case 'remove':
      if (!address) {
        console.error('❌ 请指定 --address');
        process.exit(1);
      }
      removeLabel(address);
      break;
      
    case 'export':
      if (!output) {
        console.error('❌ 请指定 --output');
        process.exit(1);
      }
      exportLabels(output);
      break;
      
    case 'import':
      if (!file) {
        console.error('❌ 请指定 --file');
        process.exit(1);
      }
      const importedLabels = JSON.parse(fs.readFileSync(file, 'utf8'));
      saveLabels(importedLabels);
      console.log(`✅ 已导入 ${Object.keys(importedLabels).length} 个标签`);
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 ./evm-labels.js --help 查看帮助');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addLabel, getLabel, listLabels, removeLabel, loadLabels };
