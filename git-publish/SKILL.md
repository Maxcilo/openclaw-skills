# Git Publish

> 将 Skill 发布到 GitHub 的工具

## 功能

1. **发布新 Skill** - 将本地 skill 发布到独立 GitHub 仓库
2. **更新 Skill** - 增量更新已发布的 skill
3. **自动同步** - 同时更新 PROJECTS.md 和 openclaw-skills 合集

## 使用方法

### 发布新 Skill

```bash
node scripts/git-publish.js <skill-path>
```

示例：
```bash
# 发布 skills/my-new-skill
node scripts/git-publish.js skills/my-new-skill

# 发布根目录的 skill
node scripts/git-publish.js my-awesome-tool
```

### 更新已存在的 Skill

```bash
node scripts/git-publish.js <skill-path> --update
```

示例：
```bash
# 更新 skill
node scripts/git-publish.js skills/my-new-skill --update
```

## 工作流程

1. 读取 `vault/github_token` 获取 GitHub 认证
2. 创建/克隆目标 GitHub 仓库
3. 复制 skill 文件（自动排除 node_modules）
4. 提交并推送到独立仓库
5. 更新 `PROJECTS.md` 添加项目记录
6. 同步到 `openclaw-skills` 合集

## Token 存储

将 GitHub token 存储在：
```
vault/github_token
```

格式：纯文本，无引号
