#!/usr/bin/env node

/**
 * Git Publish Tool - 发布 Skill 到 GitHub
 * 
 * 用法:
 *   node git-publish.js <skill-path> [--update] [--topics=tag1,tag2] [--release=v1.0.0]
 * 
 * 示例:
 *   node git-publish.js skills/my-new-skill
 *   node git-publish.js skills/my-new-skill --update
 *   node git-publish.js skills/my-new-skill --topics=openclaw,trading --release=v1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ============== 配置 ==============
const VAULT_PATH = '/root/.openclaw/workspace/vault';
let GITHUB_TOKEN = '';
let GITHUB_USER = 'Maxcilo';
const COLLECTION_REPO = 'openclaw-skills';

// ============== 安全函数 ==============

function safeReadFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function safeWriteFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * 验证项目名称
 */
function validateProjectName(name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(name)) {
    throw new Error(`项目名称包含非法字符，只允许字母、数字、中划线，且不能以中划线开头`);
  }
  if (name.length > 100) throw new Error('项目名称过长');
  return true;
}

/**
 * 验证 topic 标签
 */
function validateTopic(topic) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(topic)) {
    throw new Error(`topic "${topic}" 包含非法字符`);
  }
  if (topic.length > 50) throw new Error(`topic "${topic}" 过长`);
  return true;
}

/**
 * 验证文件路径（防止符号链接攻击）
 */
function validateSourcePath(basePath, fileName) {
  const fullPath = path.join(basePath, fileName);
  const stat = fs.lstatSync(fullPath);
  
  // 检查是否是符号链接
  if (stat.isSymbolicLink()) {
    const realPath = fs.realpathSync(fullPath);
    throw new Error(`不支持符号链接: ${fileName} -> ${realPath}`);
  }
  
  // 检查目标是否在允许范围内
  if (!realPath.startsWith(basePath)) {
    throw new Error(`路径遍历检测: ${fileName}`);
  }
  
  return true;
}

function realPath(basePath) {
  return path.resolve(basePath);
}

/**
 * 安全执行命令
 */
function safeExec(command, options = {}) {
  const { throwOnError = true, ...execOptions } = options;
  try {
    return execSync(command, { stdio: 'pipe', ...execOptions }).toString('utf-8');
  } catch (error) {
    if (throwOnError) throw error;
    return null;
  }
}

/**
 * 安全调用 GitHub API
 */
function githubApi(method, endpoint, data = null) {
  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  let curlCmd = `curl -s -X ${method} "${url}"`;
  Object.entries(headers).forEach(([k, v]) => {
    curlCmd += ` -H "${k}: ${v}"`;
  });

  if (data) {
    const safeData = JSON.stringify(data);
    curlCmd += ` -d '${safeData}'`;
  }

  const result = execSync(curlCmd, { encoding: 'utf-8' });
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

// ============== 主逻辑 ==============

const args = process.argv.slice(2);

function showHelp() {
  console.log('用法: node git-publish.js <skill-path> [options]');
  console.log('');
  console.log('选项:');
  console.log('  --update        更新已存在的仓库');
  console.log('  --topics=       添加topics标签 (逗号分隔)');
  console.log('  --release=      创建release版本');
  console.log('');
  console.log('示例:');
  console.log('  node git-publish.js skills/my-skill');
  console.log('  node git-publish.js skills/my-skill --topics=openclaw,trading --release=v1.0.0');
}

if (args.length < 1 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

// 解析参数
let skillPath = args[0].replace(/^\.\//, '');
const isUpdate = args.includes('--update');

let topics = [];
let release = '';

args.forEach(arg => {
  if (arg.startsWith('--topics=')) {
    const value = arg.replace('--topics=', '');
    topics = value.split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t)
      .map(t => {
        validateTopic(t);
        return t;
      });
  }
  if (arg.startsWith('--release=')) {
    release = arg.replace('--release=', '').trim();
  }
});

let skillName = path.basename(skillPath);

// ============== 初始化 ==============

function init() {
  // 读取 token
  try {
    GITHUB_TOKEN = safeReadFile(path.join(VAULT_PATH, 'github_token')).trim();
  } catch (e) {
    console.error('❌ 未找到 GitHub token，请确保 vault/github_token 存在');
    process.exit(1);
  }

  // 读取用户名（可选）
  const userConfigPath = path.join(VAULT_PATH, 'github_user');
  if (fs.existsSync(userConfigPath)) {
    GITHUB_USER = safeReadFile(userConfigPath).trim();
  }

  // 验证项目名称
  validateProjectName(skillName);

  // 解析为绝对路径并验证
  skillPath = path.resolve(skillPath);
  
  // 检查 skill 路径是否存在
  if (!fs.existsSync(skillPath)) {
    console.error(`错误: Skill "${skillPath}" 不存在`);
    process.exit(1);
  }

  // 必须是目录
  if (!fs.statSync(skillPath).isDirectory()) {
    console.error(`错误: "${skillPath}" 必须是目录`);
    process.exit(1);
  }

  // 创建临时目录
  const tempDir = `/tmp/git-publish-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  fs.mkdirSync(tempDir, { recursive: true });

  return tempDir;
}

// ============== 主流程 ==============

async function main() {
  const tempDir = init();
  const baseRealPath = realPath(skillPath);

  console.log(`\n🚀 发布 Skill: ${skillName}`);

  try {
    // 读取描述
    let description = skillName;
    const skillReadmePath = path.join(skillPath, 'SKILL.md');
    if (fs.existsSync(skillReadmePath)) {
      const content = safeReadFile(skillReadmePath);
      const match = content.match(/^#\s+(.+)$/m);
      if (match) description = match[1].trim();
    }

    console.log(`📝 描述: ${description}`);
    if (topics.length) console.log(`🏷️  Topics: ${topics.join(', ')}`);
    if (release) console.log(`📦 Release: ${release}`);

    // 1. 创建或克隆仓库
    const cloneDir = path.join(tempDir, 'repo');
    fs.mkdirSync(cloneDir, { recursive: true });

    if (isUpdate) {
      console.log(`\n📥 更新现有仓库...`);
      safeExec(`git clone https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${skillName}.git ${cloneDir}`);
      
      // 清理旧文件，保留 .git
      fs.readdirSync(cloneDir).forEach(f => {
        if (f !== '.git') {
          const fullPath = path.join(cloneDir, f);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      });
    } else {
      console.log(`\n📦 创建新仓库...`);
    }

    // 2. 复制文件（带安全验证）
    const files = fs.readdirSync(skillPath);
    for (const f of files) {
      // 跳过敏感目录
      if (f === 'node_modules' || f === '__pycache__' || f === '.git') continue;
      
      const src = path.join(skillPath, f);
      const dest = path.join(cloneDir, f);
      
      // 验证路径安全
      validateSourcePath(baseRealPath, f);
      
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // 3. Git 操作
    if (!isUpdate) {
      safeExec(`git init`, { cwd: cloneDir });
      safeExec(`git config user.email "bot@openclaw.ai"`, { cwd: cloneDir });
      safeExec(`git config user.name "OpenClaw Bot"`, { cwd: cloneDir });
    }

    safeExec(`git add .`, { cwd: cloneDir });
    safeExec(`git commit -m "${isUpdate ? 'Update' : 'Initial'}: ${description.replace(/"/g, '\\"')}"`, { cwd: cloneDir });

    // 4. 创建 GitHub 仓库
    if (!isUpdate) {
      console.log(`🔧 创建 GitHub 仓库...`);
      try {
        githubApi('POST', '/user/repos', {
          name: skillName,
          private: false,
          auto_init: false
        });
      } catch (e) {
        if (e.message && !e.message.includes('already exists')) {
          throw e;
        }
        console.log(`⚠️ 仓库已存在`);
      }

      safeExec(`git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${skillName}.git`, { cwd: cloneDir });
    }

    // 5. 推送
    safeExec(`git push -u origin main`, { cwd: cloneDir });
    console.log(`✅ 已发布到: https://github.com/${GITHUB_USER}/${skillName}`);

    // 6. 添加 Topics
    if (topics.length) {
      console.log(`\n🏷️ 添加 Topics...`);
      try {
        githubApi('PATCH', `/repos/${GITHUB_USER}/${skillName}`, { topics });
        console.log(`✅ Topics: ${topics.join(', ')}`);
      } catch (e) {
        console.log(`⚠️ Topics 添加失败: ${e.message}`);
      }
    }

    // 7. 创建 Release
    if (release) {
      console.log(`\n📦 创建 Release...`);
      try {
        githubApi('POST', `/repos/${GITHUB_USER}/${skillName}/releases`, {
          tag_name: release,
          name: release,
          body: description
        });
        console.log(`✅ Release: ${release}`);
      } catch (e) {
        console.log(`⚠️ Release 创建失败: ${e.message}`);
      }
    }

    // 8. 更新 PROJECTS.md
    console.log(`\n📝 更新 PROJECTS.md...`);
    await updateProjectsMd(skillName, description);

    // 9. 同步到合集
    console.log(`\n🔄 同步到 openclaw-skills 合集...`);
    await syncToCollection(skillName, skillPath, baseRealPath);

    console.log(`\n🎉 发布完成!`);

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  } finally {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// ============== 辅助函数 ==============

async function updateProjectsMd(skillName, description) {
  try {
    const tempProjDir = `/tmp/projects-${Date.now()}`;
    safeExec(`git clone https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${COLLECTION_REPO}.git ${tempProjDir}`);

    const projectsPath = path.join(tempProjDir, 'PROJECTS.md');
    if (!fs.existsSync(projectsPath)) {
      console.log(`⚠️ PROJECTS.md 不存在`);
      return;
    }

    let content = safeReadFile(projectsPath);
    if (content.includes(skillName)) {
      console.log(`⚠️ 已存在于 PROJECTS.md`);
      return;
    }

    const lines = content.split('\n');
    const lastDataRow = lines.reduce((acc, line, i) => {
      if (line.match(/^\|\s*\d+\s*\|/)) acc = i;
      return acc;
    }, 0);

    if (lastDataRow > 0) {
      const num = lines.filter(l => l.match(/^\|\s*\d+\s*\|/)).length + 1;
      const newRow = `| ${num} | ${skillName} | ${description} | https://github.com/${GITHUB_USER}/${skillName} |`;
      lines.splice(lastDataRow + 1, 0, newRow);
      safeWriteFile(projectsPath, lines.join('\n'));

      safeExec(`git add .`, { cwd: tempProjDir });
      safeExec(`git commit -m "docs: update PROJECTS.md"`, { cwd: tempProjDir });
      safeExec(`git push`, { cwd: tempProjDir });
      console.log(`✅ PROJECTS.md 已更新`);
    }

    fs.rmSync(tempProjDir, { recursive: true, force: true });
  } catch (e) {
    console.log(`⚠️ PROJECTS.md 更新失败: ${e.message}`);
  }
}

async function syncToCollection(skillName, skillPath, baseRealPath) {
  try {
    const tempCollDir = `/tmp/collection-${Date.now()}`;
    safeExec(`git clone https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${COLLECTION_REPO}.git ${tempCollDir}`);

    const targetDir = path.join(tempCollDir, skillName);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    fs.mkdirSync(targetDir, { recursive: true });

    // 安全复制
    const files = fs.readdirSync(skillPath);
    for (const f of files) {
      if (f === 'node_modules' || f === '__pycache__' || f === '.git') continue;
      
      const src = path.join(skillPath, f);
      const dest = path.join(targetDir, f);
      
      validateSourcePath(baseRealPath, f);
      
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    safeExec(`git add .`, { cwd: tempCollDir });
    safeExec(`git commit -m "feat: add ${skillName}"`, { cwd: tempCollDir });
    safeExec(`git push`, { cwd: tempCollDir });
    console.log(`✅ 已同步到合集`);

    fs.rmSync(tempCollDir, { recursive: true, force: true });
  } catch (e) {
    console.log(`⚠️ 合集同步失败: ${e.message}`);
  }
}

main();
