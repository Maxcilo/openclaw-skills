---
name: liquidity-monitor
description: US Federal Reserve liquidity monitoring system. Track RRP, Bank Reserves, SOFR, TGA, and net liquidity with professional charts and intelligent analysis. Auto-generate reports with text + charts sent to Telegram.
metadata:
  version: "3.0"
  author: "bigfuyou"
  category: "finance"
  tags: ["liquidity", "federal-reserve", "macro", "monitoring", "charts"]
triggers:
  - liquidity
  - 流动性
  - 宏观数据
  - 美联储
  - federal reserve
  - rrp
  - sofr
  - 逆回购
priority: 80
---

# Liquidity Monitor Skill

Monitor US Federal Reserve liquidity indicators with professional charts and intelligent analysis.

## Overview

This skill provides real-time monitoring of key Federal Reserve liquidity metrics:
- **RRP (Reverse Repo)**: Short-term funding market liquidity
- **Bank Reserves**: Banking system liquidity
- **SOFR (Secured Overnight Financing Rate)**: Market interest rate
- **TGA (Treasury General Account)**: Treasury cash balance
- **Net Liquidity**: RRP + Reserves - TGA

## Features

### 1. Data Collection
- Fetch data from FRED API (Federal Reserve Economic Data)
- Intelligent incremental updates (avoid redundant requests)
- Persistent storage with 64 days RRP/SOFR, 13 days Reserves/TGA
- Forward-filling for different update frequencies

### 2. Intelligent Analysis
- RRP status analysis (critical/low/normal)
- 7-day net liquidity trend analysis
- TGA monthly withdrawal/release forecast
- Comprehensive risk assessment
- Auto-generated conclusions

### 3. Visualization
- 3 professional PNG charts:
  - Core metrics (RRP + Reserves + TGA)
  - Net liquidity trend
  - SOFR rate trend
- 1 combined chart (1200x2440px)
- 30-day historical trends

### 4. Automation
- Auto-run daily at 8:00 and 20:00 (Shanghai time)
- Auto-send to Telegram (text + image, 2 messages)
- Cron job integration

## Usage

### Trigger Words

When user says:
- "宏观数据" / "liquidity" / "流动性监控"

### Actions

1. Run monitoring script to fetch latest data
2. Generate professional charts (3 individual + 1 combined)
3. Send text report to Telegram
4. Send combined chart image to Telegram

### Manual Commands

```bash
# Full report (text + image)
node scripts/liquidity-report.js [telegram_user_id]

# Generate charts only
node scripts/liquidity-chart.js

# Update data only
node scripts/liquidity-storage.js update

# View statistics
node scripts/liquidity-storage.js stats
```

## Implementation

### When Triggered

```javascript
// 1. Run monitoring and chart generation
execSync('cd /root/.openclaw/workspace && node scripts/liquidity-monitor.js');
execSync('cd /root/.openclaw/workspace && node scripts/liquidity-chart.js');

// 2. Send text report
const output = // ... extract text report from monitoring output
reply with text report

// 3. Send chart image
execSync(`openclaw message send --channel telegram --target ${userId} --media ${chartPath} --message "📊 趋势图表"`);
```

### File Structure

```
scripts/
├── liquidity-monitor.js    - Core monitoring script
├── liquidity-chart.js      - Chart generation + merging
├── liquidity-storage.js    - Data persistence
└── liquidity-report.js     - Full report sender

data/
├── liquidity-config.json   - Configuration
├── liquidity-storage.json  - Persistent storage
└── charts/
    ├── liquidity-core.png      - Core metrics chart
    ├── liquidity-net.png       - Net liquidity chart
    ├── liquidity-sofr.png      - SOFR rate chart
    └── liquidity-combined.png  - Combined chart
```

## Configuration

### liquidity-config.json

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
    },
    "sofr": {
      "low": 3.0,
      "high": 5.0
    }
  },
  "tgaTargets": {
    "01": { "endTarget": 7500 },
    "02": { "endTarget": 7500 },
    "03": { "endTarget": 8500 }
  }
}
```

## Output Example

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
• 🏦 美联储资产负债表：6646.34万亿（QT进行中）

📖 数据解读：
• RRP极度紧张：当前5.8亿，接近枯竭。这是短期资金市场压力的警示信号。
• TGA回收预期：月底需回收118亿达到目标，将抽离市场流动性。

🎯 综合结论：
市场流动性处于紧张状态，RRP接近枯竭是主要风险点。虽然准备金充足，但短期资金市场压力较大，需密切关注。
```

### Chart Image

- 1200x2440px PNG image
- 3 charts vertically stacked
- Professional styling with white background
- 30-day historical trends

## Dependencies

- Node.js
- chartjs-node-canvas
- canvas
- curl (for FRED API)
- OpenClaw (for Telegram messaging)

## Data Sources

- **FRED API** (Federal Reserve Economic Data)
  - RRP: RRPONTSYD
  - Reserves: WRESBAL
  - SOFR: SOFR
  - TGA: WTREGEN

## Update Frequency

- RRP/SOFR: Daily (workdays)
- Reserves/TGA: Weekly (Wednesday)
- Forward-filling: Auto-handle different frequencies

## Performance

- Full run time: ~15 seconds
- Data update: ~3 seconds
- Chart generation: ~8 seconds
- Message sending: ~4 seconds

## Error Handling

- 24 error handling points
- Retry mechanism for API calls
- Data validation
- Graceful degradation

## Limitations

1. **Data Delay**
   - RRP/SOFR: T+1 (next day update)
   - Reserves/TGA: Weekly Wednesday update

2. **API Limits**
   - FRED API requires no key
   - No explicit rate limit
   - Recommend avoiding frequent requests

3. **Chart Size**
   - Combined chart: 230KB
   - Telegram file limit: 50MB
   - Current size well below limit

## Future Improvements

- Add more indicators (M2, CPI, etc.)
- Support multiple time periods (weekly, monthly reports)
- Add historical comparison
- Web interface
- Real-time push notifications
- Machine learning predictions

## Version History

- **v1.0**: Basic data fetching and text report
- **v2.0**: ASCII charts and trend indicators
- **v2.1**: Professional PNG charts
- **v2.2**: Persistent storage and forward-filling
- **v3.0**: Data interpretation, chart merging, Telegram auto-send, code optimization

## License

MIT

## Author

大富小姐姐 🎀

## Last Updated

2026-03-17
