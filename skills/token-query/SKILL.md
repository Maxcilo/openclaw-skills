# 代币查询 Skill

## 触发词
- 代币名称 + `？`（如 `eth？`、`btc？`）
- 多个代币：`eth？btc？lit？`

## 执行

### 1. 解析代币
从消息中提取所有代币名称（去掉 `？` 后缀）

### 2. 调用脚本
```bash
cd /root/.openclaw/workspace
node scripts/token-compare.js <代币1> <代币2> ...
```

### 3. 输出结果
直接输出脚本返回结果，不添加额外解释

## 示例
- 输入：`eth？`
- 执行：`node scripts/token-compare.js ETH`
- 输出：ETH 完整数据

- 输入：`eth？btc？`
- 执行：`node scripts/token-compare.js ETH BTC`
- 输出：ETH 和 BTC 对比表格
