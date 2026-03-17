# OpenClaw Skills Collection

A collection of skills for OpenClaw AI assistant.

## Available Skills

### 1. web-fetch
Web content fetching and processing tool with multiple implementations.

**Features:**
- Fetch web pages and extract content
- Support for various content types
- PDF processing
- Summary generation
- Telegram integration

**Location:** `web-fetch/`

### 2. liquidity-monitor
US Federal Reserve liquidity monitoring system with professional charts and intelligent analysis.

**Features:**
- Real-time monitoring of RRP, Bank Reserves, SOFR, TGA
- Professional PNG charts with 30-day trends
- Intelligent analysis and risk assessment
- Auto-send to Telegram (text + image)
- Smart persistent storage with incremental updates
- Automated daily reports (8:00 & 20:00 Shanghai time)

**Location:** `liquidity-monitor/`  
**Version:** v3.0.0  
**GitHub:** https://github.com/Maxcilo/liquidity-monitor

## Installation

### Using ClawHub

```bash
clawhub install <skill-name>
```

### Manual Installation

```bash
# Clone this repository
git clone https://github.com/Maxcilo/openclaw-skills.git

# Copy skill to OpenClaw workspace
cp -r openclaw-skills/<skill-name> ~/.openclaw/workspace/skills/
```

## Skill Structure

Each skill directory contains:
- `SKILL.md` - Skill definition and metadata
- `README.md` - Detailed documentation
- Implementation files (`.py`, `.js`, etc.)
- Configuration files
- Examples and tests

## Contributing

To add a new skill:

1. Create a new directory with your skill name
2. Add `SKILL.md` with skill definition
3. Add `README.md` with documentation
4. Include all necessary files
5. Submit a pull request

## License

Each skill may have its own license. Check individual skill directories for details.

## Author

Maxcilo

## Links

- OpenClaw: https://openclaw.ai
- ClawHub: https://clawhub.com
- GitHub: https://github.com/Maxcilo/openclaw-skills
