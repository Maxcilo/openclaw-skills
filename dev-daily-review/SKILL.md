---
name: dev-daily-review
description: Generate daily development review summaries from dev logs, issues, and tech debt. Use when the user asks for 每日开发复盘, 开发日报, development review, dev review, bug/fix/improvement summary, or wants a concise report of today's coding work.
---

# Dev Daily Review

Generate a concise development review for the current day.

## Workflow

1. Check today's dev log at `memory/dev/YYYY-MM-DD.md`.
2. Check open issues at `memory/dev/issues.md`.
3. Check tech debt at `memory/dev/tech-debt.md`.
4. Extract development-related items such as:
   - 今天做了什么
   - 修了什么
   - 技术债务
   - 待办事项
5. If the dev log has no content, report that the review is skipped.
6. Optionally inspect current workspace changes to provide extra context.

## Data Sources

### Dev Logs
- `memory/dev/YYYY-MM-DD.md` - Daily development log
- Contains: projects, code stats, technical details, problems solved

### Issue Tracking
- `memory/dev/issues.md` - Problem tracking
- Contains: issue number, status, priority, solution

### Tech Debt
- `memory/dev/tech-debt.md` - Technical debt tracking
- Contains: priority, description, impact, effort

### Improvements
- `memory/dev/improvements.md` - Improvement suggestions
- Contains: categorized suggestions for future work

## Preferred output

- 今天做了什么
- 修了什么
- 技术债务
- 待办事项
- 一句话总结

If there is no relevant content, answer briefly that today's development review was skipped because there were no development records.

## Bundled script

Run:

```bash
bash scripts/generate_review.sh
```

This prints:
- Today's dev log path and content
- Open issues summary
- Tech debt summary
- Recent workspace git status

## Directory Structure

```
memory/
├── YYYY-MM-DD.md              (main memory, brief)
└── dev/                        (development only)
    ├── YYYY-MM-DD.md          (detailed dev log)
    ├── issues.md              (issue tracking)
    ├── tech-debt.md           (tech debt)
    └── improvements.md        (improvement suggestions)
```

## Benefits

- ✅ Development content stored separately
- ✅ Easy to view development history
- ✅ Issues and tech debt centrally managed
- ✅ Main memory stays concise
