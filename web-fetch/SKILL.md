---
name: web-fetch
description: 智能网页抓取工具，支持微信公众号、推特、普通网页。自动选择最佳方案（Scrapling/Jina Reader），支持图片嵌入、PDF生成、AI摘要。
version: 1.4.0
author: "@Go8888I"
tags:
  - web-scraping
  - article-extraction
  - wechat
  - twitter
  - pdf-generation
  - ai-summary
read_when:
  - 用户要求抓取网页内容
  - 用户要求抓取微信公众号文章
  - 用户要求抓取推特内容
  - 用户要求生成文章摘要
  - 用户要求保存网页为 PDF
  - 用户要求下载网页图片
---

# Web Fetch - 智能网页抓取技能

智能网页抓取工具，自动选择最佳方案（Scrapling 或 Jina Reader），支持微信公众号、推特、普通网页。

## 功能特性

### v1.4.0 核心功能 ⭐⭐⭐

- 🤖 **AI 摘要** - 自动生成文章摘要，提取核心观点
- 📝 **聊天窗口显示** - 摘要直接显示在 Telegram 聊天窗口
- 🔢 **准确字数统计** - 仅统计纯文本（去除图片、URL、Markdown 标记）
- 📊 **完整统计信息** - 字数、图片数、时间戳
- 💾 **双格式输出** - 同时生成 MD + PDF 文件
- 📱 **Telegram 集成** - 自动发送文件到 Telegram

### 其他功能

- 📕 **PDF 生成** - A4 格式，美化样式，中文支持
- 🖼️ **图片嵌入** - Base64 嵌入或本地下载
- 🎯 **智能路由** - 自动选择最佳抓取方案
- 🔄 **自动降级** - 主方案失败后自动切换
- 🛡️ **安全可靠** - URL 验证、参数检查、内存限制
- 📱 **微信公众号支持** - 完美支持微信文章
- 🐦 **推特支持** - 完美支持推特内容

## 安装依赖

```bash
# 安装 Scrapling
pip install scrapling html2text curl-cffi browserforge

# 安装 PDF 生成依赖
pip install weasyprint markdown Pillow

# 确保 curl 已安装
curl --version
```

## 使用方法

### 方案 1：AI 摘要版（推荐）⭐⭐⭐

```bash
cd ~/.openclaw/workspace/skills/web-fetch
python3 web_fetch_with_summary.py <url>
```

**输出：**
- 📄 文章标题
- 🔗 来源 URL
- 📝 AI 生成的摘要（核心观点）
- 📊 统计信息（字数、图片数、时间戳）
- 💾 MD 文件 + PDF 文件
- 📱 自动发送到 Telegram

**示例：**
```bash
python3 web_fetch_with_summary.py https://mp.weixin.qq.com/s/xxxxx
```

**输出示例：**
```
📄 **GPT5.4发布，修正了比Claude便宜的大bug**

🔗 **来源：** https://mp.weixin.qq.com/s/4iut9Fr1k4fCaOpe4QdLjA

📝 **摘要：**
一觉醒来，GPT又上新了。这行业太卷了...

**重大更新：**
① 把GPT-5.3-Codex的代码能力合并进来了
② 工具调用和智能体工作流更强
③ 更强的网页搜索与深度研究能力

📊 **统计：**
- 字数：890 字
- 图片：7 张
- 抓取时间：2026-03-11 22:47

💾 **文件已发送到 Telegram** ✅
```

### 方案 2：PDF 版

```bash
python3 web_fetch_pdf.py <url>
```

**输出：** MD 文件 + PDF 文件

### 方案 3：图片嵌入版

```bash
python3 web_fetch_embedded.py <url>
```

**输出：** MD 文件（图片 Base64 嵌入）

### 方案 4：增强版

```bash
python3 web_fetch_enhanced.py <url>
```

**输出：** MD 文件（自动保存 + Telegram）

### 方案 5：基础版

```bash
python3 web_fetch.py <url>
```

**输出：** 纯文本到终端

## 智能路由策略

| 网站类型 | 优先方案 | 备用方案 | 原因 |
|---------|---------|---------|------|
| 微信公众号 | Scrapling | - | Jina Reader 会 403 |
| 推特 | Jina Reader | - | Scrapling 需要 JS |
| 其他网站 | Scrapling | Jina Reader | 节省 Jina 配额 |

**为什么优先 Scrapling？**
- Jina Reader 每天只有 200 次免费配额
- Scrapling 无限制使用
- 把 Jina 配额留给真正需要的场景

## 配置

### 环境变量

```bash
# 启用调试模式
export DEBUG=true

# 自定义超时时间（秒）
export JINA_TIMEOUT=30
export SCRAPLING_TIMEOUT=60

# 自定义重试次数
export MAX_RETRIES=2

# 自定义内容长度限制
export MIN_CONTENT_LENGTH_JINA=100
export MIN_CONTENT_LENGTH_SCRAPLING=50
export MAX_CONTENT_SIZE=10485760  # 10MB
```

## 技术细节

### AI 摘要生成

1. 提取纯文本（去除 Base64 图片）
2. 去除 Markdown 标记
3. 截取前 5000 字符
4. 生成摘要（3-5 个核心观点，不超过 300 字）
5. 显示在聊天窗口

### 字数统计

1. 去除所有 Base64 图片数据
2. 去除普通图片链接
3. 去除 Markdown 标记（#、*、_、`、[]、()）
4. 去除多余空白
5. 统计纯文本字数

### 安全特性

- ✅ URL 验证（格式、长度、控制字符、NULL 字节）
- ✅ 参数验证（maxChars 范围）
- ✅ 命令注入防护（列表参数）
- ✅ 内存限制（最大 10MB）
- ✅ 重定向限制（最多 5 次）
- ✅ 超时保护
- ✅ 异常处理

## 性能

- **普通网站：** 2-3 秒
- **微信公众号：** 3-4 秒
- **推特：** 1-2 秒
- **内存占用：** < 50MB

## 示例场景

### 场景 1：抓取微信公众号文章

```bash
python3 web_fetch_with_summary.py https://mp.weixin.qq.com/s/xxxxx
```

**输出：**
- AI 生成的文章摘要
- 完整的 MD 文件（含图片）
- 美化的 PDF 文件
- 自动发送到 Telegram

### 场景 2：抓取推特内容

```bash
python3 web_fetch_with_summary.py https://twitter.com/user/status/xxxxx
```

**输出：**
- 推特内容摘要
- MD + PDF 文件
- 发送到 Telegram

### 场景 3：批量抓取

```bash
for url in $(cat urls.txt); do
    python3 web_fetch_with_summary.py "$url"
    sleep 2
done
```

## 注意事项

1. **图片数量** - 图片过多（>20 张）时，MD 文件会很大（Base64 编码）
2. **PDF 推荐** - 图片多时推荐查看 PDF 版本（压缩优化，阅读体验好）
3. **Jina 配额** - Jina Reader 每天 200 次，优先使用 Scrapling
4. **网络要求** - 需要稳定的网络连接
5. **依赖安装** - 确保所有依赖已正确安装

## 故障排查

### 问题：抓取失败

**可能原因：**
- 网站需要登录
- 网站有极端反爬
- 网络连接问题

**解决方案：**
- 检查 URL 是否正确
- 尝试在浏览器中手动访问
- 检查网络连接

### 问题：PDF 生成失败

**可能原因：**
- weasyprint 未安装
- 图片过大

**解决方案：**
```bash
pip install weasyprint markdown Pillow
```

## 更新日志

详见 [CHANGELOG.md](https://github.com/Maxcilo/web-fetch/blob/main/CHANGELOG.md)

## 作者

**[@Go8888I](https://twitter.com/Go8888I)** - 推特关注获取更多更新

大富小姐姐 🎀

## 相关链接

- GitHub: https://github.com/Maxcilo/web-fetch
- 作者推特: https://twitter.com/Go8888I
