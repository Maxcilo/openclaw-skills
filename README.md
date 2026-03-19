# OpenClaw 技能集合

OpenClaw AI助手的技能集合。

## 可用技能

### 1. web-fetch
网页内容抓取和处理工具，提供多种实现方式。

**功能：**
- 抓取网页并提取内容
- 支持多种内容类型
- PDF处理
- 摘要生成
- Telegram集成

**位置：** `web-fetch/`

### 2. liquidity-monitor
美联储流动性监控系统，提供专业图表和智能分析。

**功能：**
- 实时监控 RRP、银行准备金、SOFR、TGA
- 专业PNG图表，展示30天趋势
- 智能分析和风险评估
- 自动发送到Telegram（文本+图片）
- 智能持久化存储，增量更新
- 每天自动报告（上海时间8:00和20:00）

**位置：** `liquidity-monitor/`  
**版本：** v3.0.0  
**GitHub：** https://github.com/Maxcilo/liquidity-monitor

## 安装

### 使用 ClawHub

```bash
clawhub install <技能名称>
```

### 手动安装

```bash
# 克隆此仓库
git clone https://github.com/Maxcilo/openclaw-skills.git

# 复制技能到OpenClaw工作区
cp -r openclaw-skills/<技能名称> ~/.openclaw/workspace/skills/
```

## 技能结构

每个技能目录包含：
- `SKILL.md` - 技能定义和元数据
- `README.md` - 详细文档
- 实现文件（`.py`、`.js`等）
- 配置文件
- 示例和测试

## 贡献

添加新技能：

1. 创建新目录，使用你的技能名称
2. 添加 `SKILL.md` 技能定义
3. 添加 `README.md` 文档
4. 包含所有必要文件
5. 提交pull request

## 许可证

每个技能可能有自己的许可证。查看各技能目录了解详情。

## 作者

Maxcilo

## 链接

- OpenClaw: https://openclaw.ai
- ClawHub: https://clawhub.com
- GitHub: https://github.com/Maxcilo/openclaw-skills
