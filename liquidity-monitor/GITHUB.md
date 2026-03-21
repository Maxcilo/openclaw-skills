# GitHub推送指南

## 方法1: 使用GitHub Personal Access Token (推荐)

### 1. 创建GitHub Token

访问: https://github.com/settings/tokens/new

权限设置:
- ✅ repo (完整权限)
- ✅ workflow (如果需要GitHub Actions)

### 2. 创建GitHub仓库

访问: https://github.com/new

设置:
- 仓库名: `liquidity-monitor`
- 描述: `US Federal Reserve liquidity monitoring system with professional charts`
- 可见性: Public
- 不要初始化README (我们已经有了)

### 3. 推送代码

```bash
cd /root/.openclaw/workspace/skills/liquidity-monitor

# 设置远程仓库 (替换YOUR_USERNAME和YOUR_TOKEN)
git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/liquidity-monitor.git

# 推送
git branch -M main
git push -u origin main
```

## 方法2: 使用SSH Key

### 1. 生成SSH Key (如果没有)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```

### 2. 添加到GitHub

访问: https://github.com/settings/keys
点击 "New SSH key"，粘贴公钥

### 3. 推送代码

```bash
cd /root/.openclaw/workspace/skills/liquidity-monitor

# 设置远程仓库
git remote add origin git@github.com:YOUR_USERNAME/liquidity-monitor.git

# 推送
git branch -M main
git push -u origin main
```

## 方法3: 使用GitHub CLI

### 1. 安装gh CLI

```bash
# 如果未安装
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. 登录并推送

```bash
# 登录
gh auth login

# 创建仓库并推送
cd /root/.openclaw/workspace/skills/liquidity-monitor
gh repo create liquidity-monitor --public --source=. --remote=origin --push
```

## 推送后的步骤

### 1. 添加Topics

在GitHub仓库页面添加:
- liquidity
- federal-reserve
- monitoring
- charts
- macro-economics
- finance
- openclaw
- telegram-bot
- nodejs

### 2. 创建Release

```bash
gh release create v3.0.0 \
  --title "v3.0.0 - Initial Release" \
  --notes "Complete monitoring system with RRP, Reserves, SOFR, TGA tracking, professional charts, intelligent analysis, and Telegram integration"
```

或在GitHub网页上:
- Releases → Create a new release
- Tag: v3.0.0
- Title: v3.0.0 - Initial Release

### 3. 添加示例图片

```bash
cp /root/.openclaw/workspace/data/charts/liquidity-combined.png example-chart.png
git add example-chart.png
git commit -m "docs: add example chart"
git push
```

## 当前仓库状态

- 位置: `/root/.openclaw/workspace/skills/liquidity-monitor/`
- 分支: master (建议改为main)
- 提交数: 4
- 文件数: 12
- 状态: ✅ 准备就绪

## 需要帮助？

如果你有GitHub token，可以告诉我，我会帮你自动推送。

Token格式: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
