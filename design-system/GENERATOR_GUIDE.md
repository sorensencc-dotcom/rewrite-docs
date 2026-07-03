# Component Generator Guide

**Date:** 2026-06-22  
**Purpose:** How to use the CIC Component Generator for adding new components

## Quick Start

### Generate a Component

```bash
npm run cic-ui add button
npm run cic-ui add input
npm run cic-ui add form-field
npm run cic-ui add date-picker
```

**Output:**
- `src/components/cic/Button.tsx` — React component
- `src/components/cic/button.css` — Token-driven styles
- `src/stories/cic/Button.stories.tsx` — Storybook story
- `src/tests/cic/Button.test.tsx` — Jest unit tests
- `src/visual/cic/Button.spec.ts` — Playwright visual tests
- `docs/tokens/usage/Button.md` — Token map documentation

All files generated with boilerplate content, ready to implement.

### Naming Convention

**Use lowercase with optional hyphens:**
- Single word: `button`, `input`, `table`, `modal`
- Multiple words: `form-field`, `date-picker`, `multi-select`, `code-block`

The generator converts to PascalCase for component/file names:
- `button` → `Button.tsx`
- `form-field` → `FormField.tsx`
- `date-picker` → `DatePicker.tsx`

### Preview (Dry Run)

See what will be generated without writing files:

```bash
npm run cic-ui add button --dry-run
```

Output:
```
✓ Generating component: Button (button)
  [DRY-RUN] Would create: src/components/cic/Button.tsx
  [DRY-RUN] Would create: src/components/cic/button.css
  [DRY-RUN] Would create: src/stories/cic/Button.stories.tsx
  [DRY-RUN] Would create: src/tests/cic/Button.test.tsx
  [DRY-RUN] Would create: src/visual/cic/Button.spec.ts
  [DRY-RUN] Would create: docs/tokens/usage/Button.md
  [DRY-RUN] Would append to: src/components/cic/index.ts

✓ Dry-run complete (no files written)
```

## Component File Reference

### Component File (`.tsx`)

**Example:** `src/components/cic/Button.tsx`

```typescript
import React from 'react';
import './button.css';

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  ...props
}) => {
  return (
    <button
      className={`cic-button cic-button-${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : 'Button'}
      {...props}
    >
      {children}
    </button>
  );
};
```

**Template Substitutions:**
- `{{name}}` → lowercase component name (`button`)
- `{{Name}}` → PascalCase component name (`Button`)

### Styles File (`.css`)

**Example:** `src/components/cic/button.css`

```css
.cic-button {
  background: var(--cic-color-primary);
  color: var(--cic-color-text);
  padding: var(--cic-space-12) var(--cic-space-16);
  border: 1px solid var(--cic-color-border);
  border-radius: var(--cic-space-4);
  font-family: var(--cic-font-family-sans);
  font-size: var(--cic-font-size-14);
  font-weight: var(--cic-font-weight-600);
  cursor: pointer;
  transition: background var(--cic-motion-fade);
}

.cic-button:hover {
  background: var(--cic-color-primary); /* Token override in dark mode */
}

.cic-button:focus {
  outline: 2px solid var(--cic-color-focus-ring);
  outline-offset: 2px;
}

.cic-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.cic-button-primary {
  background: var(--cic-color-primary);
}

.cic-button-secondary {
  background: var(--cic-color-surface);
  border-color: var(--cic-color-border);
}

.cic-button-danger {
  background: var(--cic-color-error);
}
```

**Key Rules:**
- ✅ All colors from `--cic-color-*`
- ✅ All spacing from `--cic-space-*`
- ✅ All motion from `--cic-motion-*`
- ✅ All fonts from `--cic-font-*`
- ❌ No hardcoded `#hex` colors
- ❌ No hardcoded `px` values (use CSS vars)
- ❌ No hardcoded durations (use CSS vars)

### Storybook Story (`.stories.tsx`)

**Example:** `src/stories/cic/Button.stories.tsx`

```typescript
import { Button } from "../../../components/cic/Button";

export default {
  title: "CIC/Button",
  component: Button,
};

export const Default = () => <Button>Click me</Button>;

export const Primary = () => <Button variant="primary">Primary</Button>;

export const Secondary = () => <Button variant="secondary">Secondary</Button>;

export const Danger = () => <Button variant="danger">Delete</Button>;

export const Disabled = () => <Button disabled>Disabled</Button>;

export const Loading = () => <Button disabled>Loading...</Button>;

export const WithIcon = () => <Button>🔄 Refresh</Button>;

export const Focus = () => <Button autoFocus>Focused</Button>;
```

**Story Guidelines:**
- Include 6-8 variants (default, primary, secondary, danger, disabled, loading, etc.)
- Show all props variations
- Include accessibility states (focus, disabled)
- Include interactive states (hover, click)

### Jest Test File (`.test.tsx`)

**Example:** `src/tests/cic/Button.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/cic/Button';

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
    expect(button).toHaveAttribute('aria-label');
  });

  it('supports variant prop', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByText('Delete')).toHaveClass('cic-button-danger');
  });

  it('renders with custom className', () => {
    render(<Button className="custom">Click</Button>);
    expect(screen.getByText('Click')).toHaveClass('custom');
  });
});
```

**Test Guidelines:**
- ≥95% line coverage required
- Test all props
- Test all states (disabled, etc.)
- Test keyboard accessibility
- Test className handling

### Playwright Visual Test (`.spec.ts`)

**Example:** `src/visual/cic/Button.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Button snapshots', async ({ page }) => {
  await page.goto('http://localhost:6006/story/cic-button--default');

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
  await page.goto('http://localhost:6006/story/cic-button--disabled');
  await expect(page).toHaveScreenshot('button-disabled.png', {
    maxDiffPixels: 50
  });

  // Hover state
  await page.goto('http://localhost:6006/story/cic-button--default');
  await page.hover('button');
  await expect(page).toHaveScreenshot('button-hover.png', {
    maxDiffPixels: 50
  });
});
```

**Visual Test Guidelines:**
- Test light + dark modes
- Test all major states (default, disabled, hover, focus)
- Approve baseline snapshots before commit
- maxDiffPixels=50 for minor rendering differences

### Token Map Documentation (`.md`)

**Example:** `docs/tokens/usage/Button.md`

```markdown
# Button Token Usage

## Component: Button

The Button component uses the following CIC design tokens.

## Color Tokens

| Property | Token | Value (Light) | Value (Dark) |
|----------|-------|---------------|--------------|
| Background | `--cic-color-primary` | #3b82f6 | #60a5fa |
| Text | `--cic-color-text` | #1f2937 | #f3f4f6 |
| Border | `--cic-color-border` | #d1d5db | #374151 |
| Focus Ring | `--cic-color-focus-ring` | #3b82f6 | #93c5fd |

## Spacing Tokens

| Property | Token | Value |
|----------|-------|-------|
| Padding (vertical) | `--cic-space-12` | 12px |
| Padding (horizontal) | `--cic-space-16` | 16px |
| Border Radius | `--cic-space-4` | 4px |

## Motion Tokens

| Property | Token | Value |
|----------|-------|-------|
| Hover Transition | `--cic-motion-fade` | 120ms ease |

## Typography Tokens

| Property | Token | Value |
|----------|-------|-------|
| Font Family | `--cic-font-family-sans` | system-ui, sans-serif |
| Font Size | `--cic-font-size-14` | 14px |
| Font Weight | `--cic-font-weight-600` | 600 (semibold) |

## Dark Mode

In dark mode, CSS vars override automatically:
- Background changes to brighter primary (#60a5fa)
- Text changes to light gray (#f3f4f6)
- Border changes to dark gray (#374151)

## Accessibility

- **Focus Ring:** 2px solid, 2px offset
- **Disabled State:** 60% opacity, `cursor: not-allowed`
- **ARIA Label:** Auto-generated from children or provided

## Usage Example

```tsx
import { Button } from '@/components/cic';

export function MyComponent() {
  return (
    <Button onClick={() => alert('Clicked!')}>
      Click me
    </Button>
  );
}
```

## Variants

| Variant | Background | Use Case |
|---------|------------|----------|
| default | Primary | General actions |
| primary | Bright Primary | Main CTAs |
| secondary | Surface | Secondary actions |
| danger | Error Red | Destructive actions |

---

**Last Updated:** 2026-06-22
```

## Workflow

### Step 1: Generate

```bash
npm run cic-ui add button
```

### Step 2: Implement

Edit the generated component file to add logic:

```bash
vim src/components/cic/Button.tsx
```

### Step 3: Test

```bash
npm test src/tests/cic/Button.test.tsx
npm run visual:test src/visual/cic/Button.spec.ts
```

### Step 4: Document

Fill in Storybook story and token map:

```bash
vim src/stories/cic/Button.stories.tsx
vim docs/tokens/usage/Button.md
```

### Step 5: Commit

```bash
git add src/components/cic/Button.tsx
git add src/components/cic/button.css
git add src/stories/cic/Button.stories.tsx
git add src/tests/cic/Button.test.tsx
git add src/visual/cic/Button.spec.ts
git add docs/tokens/usage/Button.md
git commit -m "feat(components): Add Button component"
```

## Configuration

### Output Directories

Edit `cic-ui/config.json` to customize where components are generated:

```json
{
  "componentDir": "src/components/cic",
  "styleDir": "src/components/cic",
  "storyDir": "src/stories/cic",
  "testDir": "src/tests/cic",
  "visualDir": "src/visual/cic",
  "tokenMapDir": "docs/tokens/usage"
}
```

### Listing Components

See all generated components:

```bash
npm run cic-ui list
```

Output:
```
Existing components (3):

  • Button
  • Input
  • Checkbox
```

## Troubleshooting

### Component already exists

```
✗ Error: Already exists: src/components/cic/Button.tsx
```

**Solution:** Use a different name or delete the existing component first.

### Config not found

```
✗ Config not found: cic-ui/config.json
```

**Solution:** Run from the project root directory (where `cic-ui/` exists).

### Invalid component name

```
✗ Invalid component name: "MyButton"
Use lowercase with hyphens: button, form-field, date-picker
```

**Solution:** Use lowercase names: `my-button`, `form-field`.

### Missing template

```
✗ Template not found: templates/component.tsx
```

**Solution:** Ensure all templates exist in `cic-ui/templates/`.

## Tips

- **Use `--dry-run`** to preview generation before committing
- **Update stories first** to lock component API before implementing
- **Run tests locally** before pushing (pre-commit hook will run them anyway)
- **Approve snapshots early** to avoid merge conflicts
- **Follow token naming** to pass ESLint rules

## Next Steps

1. Generate a component: `npm run cic-ui add button`
2. Implement the component logic
3. Write Jest tests (≥95% coverage)
4. Approve Playwright snapshots
5. Update Storybook story + token map
6. Commit

---

**Generator Status: Production-ready. Start with Tier 1 (Button) in Week 1.**
