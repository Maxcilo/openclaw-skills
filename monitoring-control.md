# 监控任务管理

## 📋 可用的监控任务

### 1. 双孕线监控（BTC/ETH K线形态）
**功能：** 监控1小时、4小时、日线双孕线形态 + 关键位置提醒
**频率：** 每小时
**启动命令：**
```bash
# 添加到cron
(crontab -l 2>/dev/null; echo "0 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node btc-harami-monitor.js >> /root/.openclaw/workspace/harami-monitor.log 2>&1") | crontab -
```
**停止命令：**
```bash
crontab -l | grep -v btc-harami-monitor | crontab -
```

---

### 2. Polymarket新市场监控
**功能：** 监控新出现的重要市场（科技、政治、体育等，排除加密货币）
**频率：** 每30分钟
**启动命令：**
```bash
(crontab -l 2>/dev/null; echo "*/30 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node polymarket-monitor.js >> /root/.openclaw/workspace/polymarket-monitor.log 2>&1") | crontab -
```
**停止命令：**
```bash
crontab -l | grep -v polymarket-monitor | crontab -
```

---

### 2.5. Polymarket智能推荐
**功能：** 每小时扫描市场，发现高概率机会时推荐（有推荐才发送，无推荐静默）
**频率：** 每小时整点
**筛选标准：** 高概率≥85%，临期≤14天
**启动命令：**
```bash
(crontab -l 2>/dev/null; echo "0 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node polymarket-daily-recommend.js >> /root/.openclaw/workspace/polymarket-recommend.log 2>&1") | crontab -
```
**停止命令：**
```bash
crontab -l | grep -v polymarket-daily-recommend | crontab -
```

---

### 3. Weather Trader（天气市场交易）
**功能：** 使用NOAA预报自动交易温度市场
**频率：** 每5分钟
**启动命令：**
```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/.openclaw/workspace/run-weather-trader.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1") | crontab -
```
**停止命令：**
```bash
crontab -l | grep -v weather-trader | crontab -
```

---

### 4. Mert Sniper（临期市场狙击）
**功能：** 狙击即将到期的高确定性市场
**频率：** 每10分钟
**启动命令：**
```bash
(crontab -l 2>/dev/null; echo "*/10 * * * * /root/.openclaw/workspace/run-mert-sniper.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1") | crontab -
```
**停止命令：**
```bash
crontab -l | grep -v mert-sniper | crontab -
```

---

## 🎯 快速启动组合

### 启动所有监控
```bash
# 双孕线 + Polymarket + Weather + Mert
(crontab -l 2>/dev/null; \
echo "0 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node btc-harami-monitor.js >> /root/.openclaw/workspace/harami-monitor.log 2>&1"; \
echo "*/30 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node polymarket-monitor.js >> /root/.openclaw/workspace/polymarket-monitor.log 2>&1"; \
echo "*/5 * * * * /root/.openclaw/workspace/run-weather-trader.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1"; \
echo "*/10 * * * * /root/.openclaw/workspace/run-mert-sniper.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1") | crontab -
```

### 只启动加密货币监控
```bash
# 双孕线监控
(crontab -l 2>/dev/null; echo "0 * * * * cd /root/.openclaw/workspace && /root/.nvm/versions/node/v22.22.0/bin/node btc-harami-monitor.js >> /root/.openclaw/workspace/harami-monitor.log 2>&1") | crontab -
```

### 只启动Simmer训练
```bash
# Weather Trader + Mert Sniper
(crontab -l 2>/dev/null; \
echo "*/5 * * * * /root/.openclaw/workspace/run-weather-trader.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1"; \
echo "*/10 * * * * /root/.openclaw/workspace/run-mert-sniper.sh >> /root/.openclaw/workspace/simmer-training.log 2>&1") | crontab -
```

### 停止所有监控
```bash
crontab -r
```

---

## 📊 查看状态

### 查看当前运行的任务
```bash
crontab -l
```

### 查看日志
```bash
# 双孕线监控
tail -f /root/.openclaw/workspace/harami-monitor.log

# Polymarket监控
tail -f /root/.openclaw/workspace/polymarket-monitor.log

# Simmer训练
tail -f /root/.openclaw/workspace/simmer-training.log
```

---

## 💡 使用建议

**日常使用：**
- 只启动你需要的监控
- 不需要时随时停止
- 避免过多后台任务

**训练模式：**
- 启动Weather Trader + Mert Sniper
- 累积交易数据
- 定期查看日志

**正常交易：**
- 启动双孕线监控
- 关注关键位置
- 及时调整策略

---

## 🎮 我的角色

**当你说"启动监控"时，我会：**
1. 询问你要启动哪些监控
2. 执行相应的启动命令
3. 确认任务已添加
4. 告诉你下次执行时间

**当你说"停止监控"时，我会：**
1. 询问你要停止哪些监控
2. 执行相应的停止命令
3. 确认任务已移除

**当你说"查看监控"时，我会：**
1. 列出当前运行的任务
2. 显示最近的日志
3. 报告执行状态

---

**✅ 所有监控已停止，等待你的指令启动！**
