# ConsoleV3 - Operator Dashboard

Phase 3.6 accessible operator console with 6-panel dashboard, keyboard navigation, and screen reader support.

## Quick Start

### Development (Storybook + API)

Terminal 1 - Start API server (port 3100):
```bash
npm run console-api:dev
```

Terminal 2 - Start Storybook (port 6006):
```bash
npm run storybook
```

Then browse to: **http://localhost:6006/?path=/story/consolev3-main--default**

### Testing

Automated WCAG AA accessibility tests:
```bash
npm run console-v3:test              # headless
npm run console-v3:test:headed       # watch mode (browser visible)
```

## Architecture

### Components

- **ConsoleV3.tsx** - Root component with 6 panels, polling, keyboard hooks
  - Tier 1: Health (60%) + Pipelines (40%)
  - Tier 2: Agents (33%) + Alerts (33%) + Workspace (33%)
  - Tier 3: Controls (keyboard reference)

- **useConsoleAPI.ts** - Data fetching hooks
  - `useHealthStatus()` - GET /health
  - `usePipelines()` - GET /pipelines
  - `useAlerts()` - GET /alerts
  - `useConsolePolling()` - All three with intervals

- **live-regions.tsx** - ARIA announcements
  - Status region (10s health updates)
  - Alert region (3s alert changes)
  - Log region (panel navigation)

- **keyboard-shortcuts.ts** - Keyboard bindings
  - Ctrl+R: Refresh health
  - Ctrl+Shift+R: Refresh all
  - P+N: Pause pipeline
  - [ / ]: Navigate panels

- **focus-order.tsx** - Focus management
  - Tab order through 5+ panels
  - Preserved on panel navigation

### API Endpoints

All return JSON. Port defaults to 3100 (configurable via PORT env var).

#### GET /health
```json
{
  "status": "OK|DEGRADED|DOWN",
  "serviceCount": 5,
  "timestamp": 1719237600000
}
```

#### GET /pipelines
```json
[
  {
    "id": "pipeline-001",
    "name": "Build & Test",
    "state": "idle|running|paused|failed",
    "progress": 65,
    "timestamp": 1719237600000
  }
]
```

#### GET /alerts
```json
[
  {
    "id": "alert-001",
    "severity": "info|warning|error",
    "message": "High memory usage",
    "timestamp": 1719237600000
  }
]
```

## Accessibility

### WCAG AA Conformance
- ✅ ARIA landmarks (role="region", role="main")
- ✅ Heading hierarchy (h1 > h2)
- ✅ Keyboard navigation (Tab, arrows, Ctrl shortcuts)
- ✅ Live regions (status, alert, log)
- ✅ Focus indicators (2px outline on :focus)
- ✅ Color contrast (4.5:1 text, 3:1 UI)

### Screen Reader Testing

**Automated (Playwright):**
```bash
npm run console-v3:test:headed
```

**Manual (NVDA/JAWS):**

1. Download NVDA (Windows) or JAWS (Windows/Mac)
2. Load Storybook: http://localhost:6006/?path=/story/consolev3-main--default
3. Test points:
   - Tab through panels → each announced as "region: [name]"
   - Ctrl+R → hear "Health panel refreshed"
   - [ key → hear "Focused panel N"
   - Panel changes → live region announces updates

**VoiceOver (macOS):**
- Cmd+F5 to start
- VO+U open rotor
- Navigate landmarks and buttons
- Test same shortcuts above

## Storybook Stories

- **Default** - Main ConsoleV3 with polling
- **MockMode** - Ready for MSW (when added)
- **AccessibilityTest** - Explicit a11y context + test instructions
- **DarkMode** - Dark theme variant

## Configuration

Endpoints configurable via environment variables:

```bash
REACT_APP_HEALTH_ENDPOINT=http://localhost:3100/health
REACT_APP_PIPELINES_ENDPOINT=http://localhost:3100/pipelines
REACT_APP_ALERTS_ENDPOINT=http://localhost:3100/alerts
```

Default: all point to `http://localhost:3100`

## Files

```
src/ui/console-v3/
├── ConsoleV3.tsx              # Root component (327 lines)
├── useConsoleAPI.ts           # Polling hooks (160 lines)
├── live-regions.tsx           # ARIA regions (200 lines)
├── live-regions.test.tsx      # Region tests
├── keyboard-shortcuts.ts       # Keyboard bindings (180 lines)
├── keyboard-shortcuts.test.tsx # Shortcut tests
├── focus-order.tsx            # Focus management (150 lines)
├── focus-order.test.tsx       # Focus tests
├── ConsoleV3.a11y.test.ts     # Accessibility suite (250 lines)
└── index.ts                   # Exports

src/stories/console-v3/
└── ConsoleV3.stories.tsx      # Storybook stories (60 lines)

src/server/
└── consoleAPI.ts              # API stub (60 lines)
```

## Known Limitations

- API stub returns static mock data (no real backend wiring yet)
- Build has pre-existing TypeScript errors (not blocking Storybook)
- Tests use Playwright; requires Chrome/Chromium

## Next Steps

1. ✅ Mount in Storybook
2. ✅ Wire API polling hooks
3. ✅ Keyboard + live regions
4. ✅ Accessibility tests
5. → Wire real backend endpoints
6. → Run NVDA/JAWS manual validation
7. → Mount in main app routing (not Storybook)
