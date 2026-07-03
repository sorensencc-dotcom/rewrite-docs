---
title: "PHASE 3 6 SETUP COMPLETE"
summary: "# Phase 3.6 ConsoleV3 Setup Complete"
created: "2026-07-03T19:43:45.428Z"
updated: "2026-07-03T19:43:45.428Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase 3.6 ConsoleV3 Setup Complete

**Date:** 2026-06-25  
**Commit:** f2423a0  
**Status:** ✅ Ready for testing

## What's Done

### 1. Backend Endpoints (TorqueQuery)
Added 3 GET endpoints to `castironforge/torque-query/src/main.py` (lines 165-214):

- **GET /console/health**  
  Returns: `{ status: "healthy", serviceCount: 5, timestamp }`

- **GET /console/pipelines**  
  Returns: Array of 3 mock pipelines with state/progress

- **GET /console/alerts**  
  Returns: Array of 2 mock alerts with severity/message

### 2. Frontend Wiring (useConsoleAPI.ts)
Updated endpoint defaults in `src/ui/console-v3/useConsoleAPI.ts`:
- Changed port from 3100 → 8000 (TorqueQuery default)
- Added `/console/` namespace to all paths
- Endpoints configurable via env vars (REACT_APP_*_ENDPOINT)

### 3. Development Environment (.env.development)
Created `.env.development` with endpoint overrides for local testing.

### 4. Accessibility + Keyboard
Already wired in ConsoleV3.tsx:
- ARIA live regions for announcements
- Keyboard shortcuts (Ctrl+R, Ctrl+Shift+R, etc.)
- Panel focus navigation ([ / ])
- Screen reader support

## Test It

### Quick Start
```powershell
# Terminal 1: Start API
cd c:\dev\castironforge\torque-query
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start Storybook
cd c:\dev
npm run storybook
```

Then open: **http://localhost:6006**  
Navigate to: **ConsoleV3 > Main > Default**

### Using Test Script
```powershell
cd c:\dev
.\scripts\test-console-v3-setup.ps1
```
Automatically starts TorqueQuery + tests endpoints + launches Storybook.

## Expected Behavior

When Storybook loads the Default story:
1. ✓ 6 panels render (Health, Pipelines, Agents, Alerts, Workspace, Controls)
2. ✓ Health panel shows "healthy" + "5 services"
3. ✓ Pipelines panel shows "3 active pipelines"
4. ✓ Alerts panel shows "2 active alerts"
5. ✓ Polling starts immediately (intervals: health 10s, pipelines 5s, alerts 3s)
6. ✓ Keyboard shortcuts work (Ctrl+R to refresh, [ / ] to navigate panels)

## Next (Optional)

### E2E Accessibility Testing
```bash
npx playwright test ConsoleV3.a11y.test.ts
npx playwright test ConsoleV3.a11y.test.ts --headed
```

### Make Mock Data Dynamic
Currently static. Enhance to cycle states:
- Pipeline progress increments each poll
- Alerts clear/reappear
- Health status degrades on demand

### MSW Mocks in Storybook
Install @storybook/addon-msw for offline testing without running TorqueQuery.

## Architecture

```
ConsoleV3 Root (src/ui/console-v3/ConsoleV3.tsx)
├── useConsolePolling() hook starts on mount
│   ├── useHealthStatus() → polls /console/health every 10s
│   ├── usePipelines() → polls /console/pipelines every 5s
│   └── useAlerts() → polls /console/alerts every 3s
├── ConsoleLiveRegions (ARIA announcements)
├── installKeyboardHook (Ctrl+R, [ / ], etc.)
└── 6-panel layout (Health 60% + Pipelines 40% tier 1, etc.)
    └── Each panel wired to live API data + refresh callbacks
```

TorqueQuery serves all 3 endpoints from one FastAPI process on port 8000.
