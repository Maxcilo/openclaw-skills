# US Federal Reserve Liquidity Monitor

A comprehensive monitoring system for tracking US Federal Reserve liquidity indicators with professional charts and intelligent analysis.

## Features

- 📊 Real-time monitoring of RRP, Bank Reserves, SOFR, TGA
- 📈 Professional PNG charts with 30-day trends
- 🤖 Intelligent analysis and risk assessment
- 📱 Auto-send to Telegram (text + image)
- 💾 Smart persistent storage with incremental updates
- ⏰ Automated daily reports (8:00 & 20:00 Shanghai time)

## Quick Start

### Installation

1. Copy all files to your OpenClaw workspace:
```bash
cp -r liquidity-monitor /root/.openclaw/workspace/skills/
```

2. Install dependencies:
```bash
npm install chartjs-node-canvas canvas
```

3. Configure (optional):
```bash
# Edit liquidity-config.json to customize thresholds
```

### Usage

#### Manual Run

```bash
# Full report (text + image to Telegram)
node liquidity-report.js [telegram_user_id]

# Generate charts only
node liquidity-chart.js

# Update data only
node liquidity-storage.js update

# View statistics
node liquidity-storage.js stats
```

#### Trigger Words

In Telegram, say:
- "宏观数据"
- "流动性监控"
- "liquidity"

#### Automated Reports

Set up OpenClaw cron job:
```json
{
  "name": "Liquidity Monitor",
  "schedule": {
    "kind": "cron",
    "expr": "0 0,12 * * *",
    "tz": "Asia/Shanghai"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Run liquidity monitoring report"
  },
  "sessionTarget": "isolated"
}
```

## Output

### Text Report

```
💧 流动性监控
📅 2026-03-17

核心指标：
• 💵 RRP（逆回购）：5.82 亿 ⚠️
• 🏦 Bank Reserves（银行准备金）：3.04 万亿 ✅
• 📈 SOFR（担保隔夜融资利率）：3.70% ✅

风险评估：
• 🔴 风险
• 🔴 RRP接近0，流动性紧张

💰 净流动性：2.20 万亿
• TGA：8382亿，🔴 月底回收118亿

📖 数据解读：
• RRP极度紧张：当前5.8亿，接近枯竭
• TGA回收预期：月底需回收118亿

🎯 综合结论：
市场流动性处于紧张状态，需密切关注。
```

### Chart Image

![Liquidity Charts](example-chart.png)

- 1200x2440px PNG
- 3 charts combined
- 30-day trends

## Configuration

Edit `liquidity-config.json`:

```json
{
  "thresholds": {
    "rrp": {
      "critical": 100,
      "warning": 500,
      "abundant": 2000
    },
    "reserves": {
      "critical": 2500,
      "warning": 2800,
      "abundant": 3000
    }
  },
  "tgaTargets": {
    "03": { "endTarget": 8500 }
  }
}
```

## Data Sources

- **FRED API** (Federal Reserve Economic Data)
  - RRP: RRPONTSYD
  - Reserves: WRESBAL
  - SOFR: SOFR
  - TGA: WTREGEN

## Architecture

```
liquidity-monitor/
├── SKILL.md                    # Skill definition
├── README.md                   # This file
├── liquidity-monitor.js        # Core monitoring (445 lines)
├── liquidity-chart.js          # Chart generation (272 lines)
├── liquidity-storage.js        # Data persistence (207 lines)
├── liquidity-report.js         # Report sender (65 lines)
└── liquidity-config.json       # Configuration
```

## Performance

- Full run: ~15 seconds
- Data update: ~3 seconds
- Chart generation: ~8 seconds
- Message sending: ~4 seconds

## Requirements

- Node.js v14+
- chartjs-node-canvas
- canvas
- curl
- OpenClaw

## Limitations

- RRP/SOFR: T+1 data (next day)
- Reserves/TGA: Weekly Wednesday update
- FRED API: No rate limit but avoid frequent requests

## Version

**v3.0** - 2026-03-17

## Author

大富小姐姐 🎀

## License

MIT
