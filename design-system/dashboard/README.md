# CIC Design System Dashboard

**Interactive, token-driven control surface for the CIC design system.**

The dashboard is the single source of truth for:
- All 61 design tokens
- All component states
- All density modes
- Light/dark theme modes
- Motion and interaction rules
- Visual regression baselines
- Component previews
- Accessibility validation

## Structure

```
/design-system/dashboard
  /components
    TokenPreview.tsx       # Reusable token preview component
  /sections
    ColorSection.tsx      # Color tokens + WCAG validation
    SpacingSection.tsx    # Spacing scale + density system
    TypographySection.tsx # Type scale + line height
    InteractionsSection.tsx # Motion, focus, states
    ComponentsSection.tsx # Component registry + token usage
  index.tsx              # Main dashboard layout
  dashboard.css          # Dashboard styles (token-driven)
  README.md              # This file
```

## Features

### 1. **Colors Section**
- Live color swatches for all 7 color tokens
- Copy-to-clipboard token names
- WCAG AA/AAA contrast validation
- "Used in Components" mapping
- Light/dark mode toggle

### 2. **Spacing Section**
- Visual spacing scale (4px → 32px)
- Density system preview (compact/cozy/comfortable)
- Box model examples
- Row height demonstrations

### 3. **Typography Section**
- Type scale preview
- Line height variations
- Mono vs body font comparison
- Accessibility checklist

### 4. **Interactions Section**
- Motion tokens and durations
- Focus ring visualization
- Interactive state buttons (default/hover/pressed/disabled)
- Motion playground

### 5. **Components Section**
- Component registry (8+ components)
- Variant selector
- Token usage inspector
- Generated file references
- Storybook links

## Token Inspector

**Critical feature:** Hovering any element shows live CSS variable values.

```css
background: var(--cic-color-surface)
border: var(--cic-color-border)
padding: var(--cic-space-12)
border-radius: var(--cic-space-4)
```

This is the single most valuable debugging tool for CIC UI.

## Dark Mode Integration

The dashboard includes a theme toggle (☀️ Light / 🌙 Dark) that switches all previews to demonstrate dark mode compliance.

Supports:
- Surface layering for dark mode
- Contrast validation per theme
- Motion adjustments for dark mode

## Density System

Three density modes:
1. **Compact** — Dense tables, high-churn dashboards (4px padding)
2. **Cozy** — Default, balanced (8px padding)
3. **Comfortable** — Touch-friendly, accessibility mode (12px padding)

All previews reflect density changes.

## Usage

### Mount in React App

```tsx
import DesignSystemDashboard from "./design-system/dashboard";

export function App() {
  return (
    <div>
      <DesignSystemDashboard />
    </div>
  );
}
```

### Deploy

Host at: `https://cic.local/design-system`

Or include as a route in your Vite dev server.

## Testing

- **Unit Tests:** Token rendering and color contrast
- **Integration Tests:** Token → component mapping
- **Visual Tests:** Playwright snapshots
- **Accessibility Tests:** WCAG AA validation

## What This Unlocks

With the Design System Dashboard:
1. **Tokens become discoverable** — designers see every token at a glance
2. **Components become inspectable** — preview all states and variants
3. **Drift becomes visible** — token changes are immediately obvious
4. **Designers + engineers share the same UI contract** — no miscommunication
5. **Agents can eventually use it for UI self-healing** — detecting drift programmatically

## Related

- **Generator:** `npm run cic-ui add <component>`
- **Tokens:** `/docs/tokens/CIC_TOKEN_PACK_v2.0.md`
- **ESLint Rules:** `/src/tokens/cic-token-rules.js`
- **Drift Detector:** `/scripts/drift-detector.js`

## Next Steps

1. ✅ Dashboard scaffolding complete
2. ⏳ Wire TanStack Query for live data
3. ⏳ Add token inspector overlay
4. ⏳ Integrate drift detector visualization
5. ⏳ Add component state transitions
6. ⏳ Deploy to production

---

**Status:** v1.0 specification locked, component structure complete.

**Commit:** Ready for `npm test` + git commit.
