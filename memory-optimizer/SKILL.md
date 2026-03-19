---
name: memory-optimizer
description: 记忆结构优化任务。定期压缩/精简日记文件，备份后处理，保护敏感信息。触发词：记忆优化、压缩日记、memory optimize、clean memory。
---

# Memory Optimizer

记忆结构优化任务：定期压缩旧日记，备份后处理，保护敏感信息。

## 执行前提

- 仅处理 **1天前** 的日记文件（避免影响近期工作）
- 必须在处理前 **先备份**
- 必须保护敏感信息不被删除

## 执行步骤

### 0. 准备工作

```bash
mkdir -p memory/archive/ memory/archive/filtered/
TODAY=$(date +%Y-%m-%d)
TODAY_TS=$(date +%Y%m%d_%H%M%S)
DAYS_AGO_1=$(date -d '1 days ago' +%Y-%m-%d)
cd /root/.openclaw/workspace
```

### 1. 备份 MEMORY.md

```bash
[ -f MEMORY.md ] && cp MEMORY.md "memory/archive/${TODAY_TS}_MEMORY.md"
```

### 2. 精简 MEMORY.md

**底线：只精简过时信息，核心身份和关键规则必须保留**

**✅ 必须保留：**
- 身份（名字、哥哥信息）
- 核心技能列表
- 关键教训（交易铁律）
- 重要里程碑
- 工具和脚本列表
- Cron 任务配置
- 安全架构

**❌ 可以精简：**
- 详细的参数说明（简化为概要）
- 过时的代码示例
- 临时调试信息
- 已完成的任务细节

读取 MEMORY.md，按规则精简后写回原文件。

### 2.1 验证 MEMORY.md 核心内容

```bash
echo "=== 验证 MEMORY.md 核心内容 ==="
for keyword in "大富小姐姐" "哥哥" "交易" "关键教训" "里程碑" "工具"; do
  if grep -q "$keyword" MEMORY.md; then
    echo "✅ 核心内容保留: $keyword"
  else
    echo "⚠️ 缺少核心内容: $keyword"
  fi
done
```

### 3. 备份1天前的日记

```bash
# 备份 memory/ 目录
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "memory/archive/${TODAY_TS}_$(basename $f)"
done

# 备份 memory/filtered/ 目录
for f in memory/filtered/${DAYS_AGO_1}.md memory/filtered/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] && cp "$f" "memory/archive/filtered/${TODAY_TS}_$(basename $f)"
done
```

### 4. AI 精简内容

**底线：只能删除临时信息，关键决策必须保留**

**✅ 必须保留（不可删除）：**
- 关键决策和结论
- 重要经验教训（可传承的）
- 永久有用的配置/地址
- 里程碑、成就
- 密码/密钥占位符（如 [KEY]）

**❌ 可以删除（时效性信息）：**
- 临时状态（如"正在等待"、"处理中"）
- 队列信息、时间表
- 调试日志
- 重复内容
- 已过期的任务状态
- 临时的测试数据

对每个待处理文件读取内容，按上述规则精简后写回原文件。

### 5. 验证保护内容

```bash
PROTECTED_PATTERN='0x[a-fA-F0-9]{40}|sk-|eyJh|AKIA|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|1[3-9]\d{9}|\d{16,19}|\d{17}[\dXx]'

echo "=== 验证 MEMORY.md ==="
if grep -Eq "$PROTECTED_PATTERN" MEMORY.md; then
  echo "✅ MEMORY.md 敏感信息保留"
else
  echo "⚠️ MEMORY.md 可能缺少敏感信息，请检查"
fi

# 验证 memory/
for f in memory/${DAYS_AGO_1}.md memory/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] || continue
  if grep -Eq "$PROTECTED_PATTERN" "$f"; then
    echo "✅ $f 敏感信息保留"
  else
    echo "⚠️ $f 可能缺少敏感信息，请检查"
  fi
done

# 验证 filtered/
for f in memory/filtered/${DAYS_AGO_1}.md memory/filtered/${DAYS_AGO_1}-*.md; do
  [ -f "$f" ] || continue
  if grep -Eq "$PROTECTED_PATTERN" "$f"; then
    echo "✅ $f 敏感信息保留"
  else
    echo "⚠️ $f 可能缺少敏感信息，请检查"
  fi
done
```

### 6. 清理旧备份

```bash
# 清理30天前旧备份（使用 full-backup 目录避免误删）
find memory/full-backup/ memory/archive/ -type f -name "*.md" -mtime +30 -delete 2>/dev/null

# 删除顶层空目录
find memory/ -mindepth 1 -maxdepth 1 -type d -empty -delete
```

### 7. 生成报告

```bash
echo "## 记忆优化报告 ($TODAY)"
echo "| 项目 | 数值 |"
echo "|------|------|"
echo "| 处理文件 | X |"
echo "| 备份文件 | X |"
echo "| 节省 | X% |"
echo "| 验证结果 | 通过/失败 |"
```

## 安全规则

1. **先备份再处理** - 任何修改前必须先备份
2. **备份加时间戳** - 避免覆盖：`${TODAY_TS}_filename.md`
3. **保护敏感信息** - 钱包地址、API Key、邮箱等不得删除
4. **验证后报告** - 处理完成必须验证并生成报告
5. **恢复机制** - 验证失败时从备份恢复

## 注意事项

- 此任务可通过 cron 自动执行（建议每天执行一次）
- 如果1天前没有文件，跳过处理
- 如果没有需要精简的内容，保持原样
