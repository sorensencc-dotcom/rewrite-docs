# Component Integration Pattern

**Date:** 2026-06-22  
**Purpose:** Wire generated components into dashboard, console, design tokens, and Storybook

## Overview

Generated components auto-integrate into:
1. **Design Tokens** — Token imports (colors, spacing, motion, typography)
2. **Dashboard** — Console v3, Operator Console, Design System Dashboard
3. **Storybook** — Auto-discovery and theming
4. **Pre-commit Hooks** — ESLint, Jest, Playwright checks

## Part 1: Design Token Integration

### What Tokens Are Available

Each generated component can use these token categories:

```typescript
// Colors
--cic-color-primary        // Primary brand (blue)
--cic-color-success        // Success state (green)
--cic-color-warning        // Warning state (orange)
--cic-color-error          // Error state (red)
--cic-color-accent-light   // Dark mode accent (brightened)
--cic-color-text           // Text color (light/dark adaptive)
--cic-color-text-secondary // Secondary text
--cic-color-text-tertiary  // Tertiary text
--cic-color-border         // Border color
--cic-color-surface        // Surface background
--cic-color-background     // Page background
--cic-color-focus-ring     // Focus ring color

// Spacing
--cic-space-4              // 4px
--cic-space-8              // 8px
--cic-space-12             // 12px
--cic-space-16             // 16px
--cic-space-24             // 24px
--cic-space-32             // 32px
--cic-space-48             // 48px

// Motion
--cic-motion-fade          // Fade: 120ms ease (dark mode)
--cic-motion-slide         // Slide: 200ms ease (dark mode)
--cic-motion-scale         // Scale: 150ms ease (dark mode)
--cic-motion-ease          // ease (standard easing)

// Typography
--cic-font-family-mono     // Monospace font
--cic-font-family-sans     // Sans-serif font
--cic-font-size-12         // 12px
--cic-font-size-14         // 14px
--cic-font-size-16         // 16px
--cic-font-weight-400      // Regular
--cic-font-weight-600      // Semibold
--cic-font-weight-700      // Bold
```

### Template Example

All generated components use this pattern:

```css
/* src/components/cic/button.css */
.cic-button {
  background: var(--cic-color-primary);
  color: var(--cic-color-text);
  padding: var(--cic-space-12) var(--cic-space-16);
  border-radius: var(--cic-space-4);
  border: none;
  font-family: var(--cic-font-family-sans);
  font-size: var(--cic-font-size-14);
  font-weight: var(--cic-font-weight-600);
  transition: background var(--cic-motion-fade);
}

.cic-button:hover {
  background: var(--cic-color-primary); /* Lightens in dark mode via token override */
}

.cic-button:focus {
  outline: 2px solid var(--cic-color-focus-ring);
  outline-offset: 2px;
}

.cic-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark mode: CSS vars auto-override via [data-theme='dark'] */
```

## Part 2: Dashboard Integration

### Wiring Components into Panels

Example: Wire Button into ControlsPanel

```typescript
// src/components/console/ControlsPanel.tsx
import { Button, Input, Toggle } from '../cic';  // Auto-exported from barrel export

export function ControlsPanel() {
  return (
    <div className="controls-panel">
      <Button onClick={handleRefresh}>Refresh</Button>
      <Input 
        type="text" 
        placeholder="Filter agents..."
        onChange={handleFilter}
      />
      <Toggle 
        checked={showArchived}
        onChange={setShowArchived}
      />
    </div>
  );
}
```

### Barrel Export Pattern

Generated components auto-append to:

```typescript
// src/components/cic/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Checkbox } from './Checkbox';
// ... (auto-appended on each `npm run cic-ui add`)
```

### Panel Mapping

Generated components map to console panels:

| Component | Primary Use | Panel |
|-----------|------------|-------|
| Button | Actions (Refresh, Pause, Restart) | ControlsPanel, AlertsPanel |
| Input | Search, filter | AgentsPanel, IngestionPanel |
| Table | Data display | AgentsPanel (agent list), IngestionPanel (queue) |
| Badge | Status tags | AgentsPanel (status), MemoryPanel (cluster type) |
| Modal | Confirmation, detail view | Any (action trigger) |
| Tooltip | Field help | All panels |
| Panel | Container | Dashboard sections (TierPanel, StatusPanel) |
| Card | Grouped info | Agent detail card, config card |
| Select | Dropdown menus | Filters, settings |
| Toggle | Boolean controls | ShowArchived, ShowDLQ, etc. |

## Part 3: Storybook Integration

### Auto-Discovery

All generated components appear in Storybook under **CIC/** folder:

```
CIC/
  ├── Button
  ├── Input
  ├── Checkbox
  ├── ... (auto-added on each generation)
```

### Story Template Pattern

Each story includes:

```typescript
// src/stories/cic/Button.stories.tsx
export default {
  title: "CIC/Button",
  component: Button,
};

export const Default = () => <Button>Click me</Button>;
export const Hover = () => <Button>Hover me</Button>;
export const Disabled = () => <Button disabled>Disabled</Button>;
export const Loading = () => <Button loading>Loading...</Button>;
export const Error = () => <Button variant="error">Error</Button>;
export const Focus = () => <Button autoFocus>Focused</Button>;
```

### Dark Mode Toggle

Storybook automatically provides:
- Light mode (default)
- Dark mode (via `[data-theme='dark']` CSS selector)
- Reduced motion (via `@media (prefers-reduced-motion: reduce)`)

## Part 4: Test Integration

### Jest Tests (Unit)

```typescript
// src/tests/cic/Button.test.tsx
describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('respects disabled prop', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });

  it('is keyboard accessible', () => {
    render(<Button>Click</Button>);
    const button = screen.getByText('Click');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(button).toHaveFocus();
  });
});
```

### Playwright Visual Tests

```typescript
// src/visual/cic/Button.spec.ts
import { test, expect } from '@playwright/test';

test('Button snapshots', async ({ page }) => {
  await page.goto('http://localhost:5174/stories/button');

  // Light mode snapshot
  await expect(page).toHaveScreenshot('button-default.png', {
    maxDiffPixels: 50
  });

  // Dark mode snapshot
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await expect(page).toHaveScreenshot('button-dark.png', {
    maxDiffPixels: 50
  });

  // Disabled state
  await page.click('button:has-text("Disabled")');
  await expect(page).toHaveScreenshot('button-disabled.png', {
    maxDiffPixels: 50
  });
});
```

### Token Map Documentation

```markdown
# Button Token Usage

## Colors

- **Background:** `--cic-color-primary`
- **Text:** `--cic-color-text`
- **Border:** `--cic-color-border`
- **Focus Ring:** `--cic-color-focus-ring`

## Spacing

- **Padding:** `var(--cic-space-12) var(--cic-space-16)` (12px vertical, 16px horizontal)
- **Border Radius:** `var(--cic-space-4)` (4px)

## Motion

- **Transition:** `background var(--cic-motion-fade)` (120ms fade on hover)

## Dark Mode

In dark mode, `--cic-color-primary` becomes `#60a5fa` (brightened for dark backgrounds).

## Accessibility

- Focus ring: 2px solid `--cic-color-focus-ring` (#93c5fd)
- Focus offset: 2px
- Hover state: Color transition (no instant changes)
- Disabled: 60% opacity + `cursor: not-allowed`
```

## Part 5: Pre-Commit Hooks

### ESLint Token Rules

Generated components must pass token rules:

```bash
npm run eslint src/components/cic/Button.tsx
```

Rules enforced:
- ✅ All colors come from `--cic-color-*` CSS vars
- ✅ All spacing comes from `--cic-space-*` CSS vars
- ✅ All motion comes from `--cic-motion-*` CSS vars
- ✅ All typography comes from `--cic-font-*` CSS vars
- ❌ No `#rgb()` hex colors
- ❌ No `px` inline padding/margin
- ❌ No hardcoded millisecond durations

### Jest Coverage

Required: ≥95% line coverage per component

```bash
npm test src/tests/cic/Button.test.tsx -- --coverage
```

### Playwright Snapshot Approval

New snapshots must be approved before merge:

```bash
npm run visual:test -- --update
git add src/visual/cic/*.png
```

## Part 6: Workflow

### Generating a New Component

```bash
# 1. Generate component (all 6 files created)
npm run cic-ui add button

# 2. Edit component to implement logic
vim src/components/cic/Button.tsx

# 3. Write/update tests
vim src/tests/cic/Button.test.tsx

# 4. Run tests locally
npm test src/tests/cic/Button.test.tsx
npm run visual:test

# 5. Approve snapshots
npm run visual:test -- --update

# 6. Commit (pre-commit hook runs ESLint + Jest + visual checks)
git add src/components/cic/Button.tsx src/tests/cic/Button.test.tsx ...
git commit -m "feat(components): Add Button component"
```

### Integrating into Dashboard

```bash
# 1. Import component in panel
import { Button } from '../cic';

# 2. Use in JSX
<Button onClick={handleRefresh}>Refresh</Button>

# 3. Test integration
npm test src/tests/console/ControlsPanel.test.tsx

# 4. Commit
git add src/components/console/ControlsPanel.tsx
git commit -m "feat(console): Wire Button into ControlsPanel"
```

## Summary

Generated components integrate seamlessly via:

1. **Token system** — All styling via CSS vars
2. **Dashboard wiring** — Import + use in panels
3. **Storybook** — Auto-discovery + dark mode toggle
4. **Testing** — Jest (unit) + Playwright (visual)
5. **Pre-commit gates** — ESLint + test pass required

**No manual scaffolding. All via generator.**

---

**Next:** Test generator with sample Button component (Phase 1).
