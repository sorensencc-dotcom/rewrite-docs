# CIC Cost & Usage System — Environment Variables

Reference for operators configuring cost tracking, reporting, and alerts.

---

## Core Configuration

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_ENV` | Controls dev/prod split for cost routing, dashboards, and ledger paths | `dev` |
| `CIC_COST_LEDGER_PATH` | Filesystem path for the unified cost ledger JSON | `./cic-usage-ledger.json` |
| `CIC_COST_REPORT_OUTPUT` | Directory for PDF/HTML cost reports | `./reports/` |

---

## PDF & Report Generation

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_PDF_REPORTS_ENABLED` | Enables PDF generation via Puppeteer (cron: daily midnight + Monday midnight) | `false` |
| `CIC_PUPPETEER_EXECUTABLE_PATH` | Optional override for Chromium/Chrome path | *(unset)* |

---

## EMA & Budget Alerts

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_COST_EMA_ALPHA` | Smoothing factor for exponential moving average (burn rate tracking) | `0.25` |
| `CIC_DAILY_BUDGET` | Daily cost threshold for budget alerts (USD) | `5.00` |
| `CIC_ALERT_THRESHOLD_MULTIPLIER` | Alert trigger: when daily cost > budget × multiplier | `1.5` |

---

## Local Savings & ROI

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_LOCAL_SAVINGS_ENABLED` | Enables local-vs-cloud ROI calculations | `true` |
| `CIC_GPU_PURCHASE_PRICE` | Purchase price of GPU (amortization base) | `8000` |
| `CIC_GPU_LIFETIME_DAYS` | Lifetime in days (amortization divisor) | `1825` |
| `CIC_GPU_POWER_COST_PER_DAY` | Daily power cost for GPU (electricity + cooling) | `5.00` |

---

## API Server

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_API_PORT` | Port for AutonomyAPIServer (cost API endpoints) | `3000` |
| `CIC_API_BIND` | Bind address | `0.0.0.0` |

---

## CLI & Reporting

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_REPORT_FORMAT` | Output format for `cic-report` CLI: `text`, `json`, or `pdf` | `text` |

---

## Notifications

| Variable | Description | Default |
|---------|-------------|---------|
| `CIC_NOTIFY_ENABLED` | Enable Slack/email cost digests (requires webhook or email config) | `false` |
| `CIC_SLACK_WEBHOOK_URL` | Slack incoming webhook URL for cost alerts | *(unset)* |
| `CIC_NOTIFY_EMAIL` | Email address for daily/weekly cost digests | *(unset)* |
| `CIC_NOTIFY_FROM` | Sender email address (for email digests) | `cic@example.com` |
| `CIC_SMTP_HOST` | SMTP server hostname | `localhost` |
| `CIC_SMTP_PORT` | SMTP server port | `25` |
| `CIC_SMTP_SECURE` | Use TLS for SMTP | `false` |
| `CIC_SMTP_USER` | SMTP authentication username (optional) | *(unset)* |
| `CIC_SMTP_PASS` | SMTP authentication password (optional) | *(unset)* |

---

## Usage Examples

### Enable daily PDF reports
```bash
export CIC_PDF_REPORTS_ENABLED=true
export CIC_COST_REPORT_OUTPUT=/var/cic/reports
```

### Set budget alert at $10/day
```bash
export CIC_DAILY_BUDGET=10.00
export CIC_ALERT_THRESHOLD_MULTIPLIER=1.0
```

### Local model ROI with custom GPU (A100)
```bash
export CIC_LOCAL_SAVINGS_ENABLED=true
export CIC_GPU_PURCHASE_PRICE=15000
export CIC_GPU_LIFETIME_DAYS=1460
export CIC_GPU_POWER_COST_PER_DAY=12.50
```

### Separate dev/prod tracking
```bash
export CIC_ENV=prod
export CIC_DAILY_BUDGET=100.00
```

### Enable Slack notifications
```bash
export CIC_NOTIFY_ENABLED=true
export CIC_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Enable email notifications (with Gmail SMTP)
```bash
export CIC_NOTIFY_ENABLED=true
export CIC_NOTIFY_EMAIL=ops@example.com
export CIC_SMTP_HOST=smtp.gmail.com
export CIC_SMTP_PORT=587
export CIC_SMTP_SECURE=true
export CIC_SMTP_USER=your-email@gmail.com
export CIC_SMTP_PASS=your-app-password
```

---

## API Endpoints

Once `CIC_API_PORT` is running, access:

- `GET /api/usage-summary` — Daily tokens, cost, per-stage breakdown
- `GET /api/agent-burn` — Per-agent token + cost map
- `GET /api/local-roi` — Savings/day, GPU cost/day, ROI multiplier
- `GET /api/usage-summary-env` — Dev/prod split + budget alert status
