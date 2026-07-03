---
title: "GITHUB ACTIONS PROCESS"
summary: "# GitHub Actions Process"
created: "2026-07-03T19:43:46.040Z"
updated: "2026-07-03T19:43:46.040Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# GitHub Actions Process

## Deprecation Response: Jun 28, 2026

**Issue:** `actions/upload-artifact@v3` deprecated 2024-04-16, enforced 2026-06-28.  
**Impact:** All 9 repos' Dashboard Summary workflows failed simultaneously.  
**Resolution:** Centralized reusable workflow + version pinning + canary monitoring.

### Architecture

#### Shared Template
- **Location:** `sorensencc-dotcom/.github/.github/workflows/dashboard-summary.yml`
- **Pinned Versions:** `actions/checkout@v4`, `actions/upload-artifact@v4`
- **Runner:** `ubuntu-22.04` (explicit pin prevents auto-upgrade breakage)
- **Triggers:** `workflow_dispatch` (manual), `schedule` (3 AM UTC daily), `workflow_call` (reusable)

#### Calling Workflows (7 Repos)
All repos reference shared template:

```yaml
name: Dashboard Summary
on:
  workflow_dispatch:
  push:
    branches: [main, master]
  pull_request:

jobs:
  dashboard-summary:
    uses: sorensencc-dotcom/.github/.github/workflows/dashboard-summary.yml@main
```

Repos:
1. sorensencc-dotcom/rewrite-mcp
2. sorensencc-dotcom/cic
3. sorensencc-dotcom/cic-ingestion
4. sorensencc-dotcom/CIC_MEDIA_LIBRARY
5. sorensencc-dotcom/fds.fx.reporting
6. sorensencc-dotcom/CIC-DAG
7. sorensencc-dotcom/rewritelabs.io

### Maintenance

#### Adding New Workflows
1. Create in shared `.github` repo with `workflow_call` trigger
2. Add `workflow_dispatch` for testing
3. Pin all action versions to major release (e.g., `@v4`, not `@latest`)
4. Pin runner to ubuntu-22.04, not `ubuntu-latest`
5. Update `sorensencc-dotcom/.github/README.md` usage guide

#### Updating Pinned Versions
When deprecation enforced:
1. Update template in `sorensencc-dotcom/.github`
2. All calling workflows auto-updated (reference `@main`)
3. Test via manual trigger: `gh workflow run <name>.yml --repo sorensencc-dotcom/<repo>`

#### Monitoring
- **Script:** `C:\dev\tools\dashboard-canary.ps1`
- **Schedule:** Daily 3:30 AM UTC (30min after scheduled runs)
- **Alert:** Slack webhook on failure (set `SLACK_WEBHOOK_URL` env var)
- **Manual Check:** `.\dashboard-canary.ps1`

### Lessons Learned

1. **Central Template > Multiple Copies**  
   One fix updates all 7 repos instantly. Reduces drift + maintenance.

2. **Explicit Version Pins Required**  
   `@latest` or `@v3` auto-updates break workflows. Lock to major versions.

3. **Runner Must Be Explicit**  
   `ubuntu-latest` auto-upgrades OS, breaking builds. Pin to specific release.

4. **workflow_dispatch Needed for Testing**  
   Allows manual verification before scheduled runs. Catch deprecations early.

5. **Centralized Monitoring Essential**  
   Single canary script monitors 7 repos. Faster alerting than per-repo monitoring.

### Next Steps

- Monitor for new GitHub Actions deprecations via release notes
- Add pre-deprecation validation to CI gate (catch v3/latest before enforcement)
- Consider GitHub-hosted runners alternative if pin strategy becomes untenable
