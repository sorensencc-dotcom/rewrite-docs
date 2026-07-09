---
title: "Roadmap Runner"
summary: "Service that executes phase milestones and tracks progress."
updated: "2026-07-09"
tags:
  - operations
---
# Roadmap Runner

Service that executes phase milestones and tracks progress.

## CLI

```bash
cic-cli roadmap run --phase=27
cic-cli roadmap status
```

## Execution Model

1. Parse milestone config
2. Enqueue tasks
3. Track completion
4. Generate report

Referenced by:
- `reference/integration-guide.md`

---

**Configuration:** See `cic/roadmap-config.yaml`
