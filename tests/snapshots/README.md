# Snapshot Testing Suite (Phase F)

Visual regression testing with Playwright + Jest snapshots.

## Running Tests

```bash
# Run all snapshot tests (headless)
npm run test:snapshot

# Run with browser visible
npm run test:snapshot:headed

# Debug mode with step-through
npm run test:snapshot:debug

# Run specific test file
npx playwright test tests/snapshots/components/button.spec.ts
```

## Structure

- `components/` — Component-level snapshots (Button, Input, Panel, Table, Alert)
- `pages/` — Page/panel-level snapshots (Dashboard, Token Drift)
- `__snapshots__/` — Baseline PNG snapshots (auto-generated)

## Test States Covered

**Components:**
- default
- hover
- focus
- filled (for inputs)
- disabled
- loading

**Pages:**
- Full dashboard layouts
- Individual panels (Agents, Ingestion, Drift, Memory, Settings)
- Token drift detection

## Token Drift Detection

Any change to design tokens (colors, spacing, typography, interaction) will fail the baseline snapshot. This ensures:
- No accidental CSS overrides
- No token value drift
- No dark-mode regressions
- No density (compact) inconsistencies

## Configuration

- **Viewport:** 1440x900 (desktop)
- **Color scheme:** dark
- **Device scale:** 1.0
- **Max diff pixels:** 50 (before failure)

See `playwright.config.ts` for full config.

## Baseline Workflow

1. **Initial run** — Creates `__snapshots__/` PNG files as baseline
2. **Subsequent runs** — Compares current render against baseline
3. **On failure** — Review diff, update baseline if intentional: `playwright test --update-snapshots`

## Continuous Integration

CI runs headless, retries twice on failure, blocks on visual regressions.
