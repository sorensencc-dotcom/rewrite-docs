# J: Component Library Roadmap (Q3–Q4 2026)

**Status:** Specification locked → Implementation in progress  
**Scope:** 25+ components across 6 tiers via CIC Component Generator  
**Date:** 2026-06-22

## Overview

Phased component delivery using the CIC Component Generator (`npm run cic-ui add <component>`). Each component is token-driven, tested (Jest + Playwright), and Storybook-documented.

**Target:** 25+ components by Q4 2026.

## Delivery Timeline

### Q3 2026 (Weeks 1-12)

| Tier | Week | Category | Components | Status |
|------|------|----------|------------|--------|
| 1 | 1-4 | Core | Button, Input, Checkbox, Radio, Toggle, Label | 🔜 Ready |
| 2 | 5-8 | Container | Panel, Card, Row, Grid, Modal, Popover | Queued |
| 3 | 9-12 | Data | Table, Badge, Pill, Stat, Progress Bar, Skeleton | Queued |

### Q4 2026 (Weeks 13-24)

| Tier | Week | Category | Components | Status |
|------|------|----------|------------|--------|
| 4 | 13-16 | Form | Select, ComboBox, DatePicker, TimePicker, MultiSelect, Textarea | Queued |
| 5 | 17-20 | Feedback | Alert, Toast, Tooltip, Popover Advanced, Dialog, Drawer | Queued |
| 6 | 21-24 | Specialized | CodeBlock, Tabs, Breadcrumb, Stepper, Timeline, Autocomplete | Queued |

## Per-Component Deliverables

Each component generated via `npm run cic-ui add <component>` includes:

1. **Component File** — `src/components/cic/<ComponentName>.tsx`
   - React functional component
   - TypeScript props interface
   - Accessibility (ARIA attributes)
   - Dark mode support (via design tokens)

2. **Styles** — `src/components/cic/<componentname>.css`
   - 100% token-driven (no inline styles)
   - CIC design tokens (color, spacing, motion)
   - Dark mode CSS vars

3. **Storybook Story** — `src/stories/cic/<ComponentName>.stories.tsx`
   - Multiple variants (default, hover, disabled, loading, error, focus)
   - Component-specific use cases
   - Token showcase

4. **Jest Unit Tests** — `src/tests/cic/<ComponentName>.test.tsx`
   - Props validation
   - Accessibility (a11y) tests
   - Interaction tests (click, focus, keyboard)

5. **Playwright Visual Tests** — `src/visual/cic/<ComponentName>.spec.ts`
   - Dark mode baseline
   - Light mode baseline
   - Disabled/error states
   - Snapshot assertions (maxDiffPixels=50)

6. **Token Map Documentation** — `docs/tokens/usage/<ComponentName>.md`
   - Which tokens the component uses
   - Token override patterns
   - Dark mode behavior

7. **Accessibility Checklist** — Included in component file
   - WCAG AA compliance
   - Focus ring visibility
   - Semantic HTML

## Automation

**Generator CLI:**
```bash
npm run cic-ui add <component>
npm run cic-ui add button
npm run cic-ui add form-field
npm run cic-ui add date-picker
```

**Generate without writing (preview):**
```bash
npm run cic-ui add button --dry-run
```

**List existing components:**
```bash
npm run cic-ui list
```

**Test suite:**
```bash
npm test                  # Run all tests
npm run visual:test      # Playwright visual snapshots
npm run storybook        # Start Storybook
```

**Pre-commit checks:**
- ESLint token rules (all `--cic-*` CSS vars)
- Jest unit tests pass
- Playwright snapshots match (within 50px diff)

## Integration Points

### Design Tokens
Components import from:
- `design-system/tokens/colors.ts` — `--cic-color-*`
- `design-system/tokens/spacing.ts` — `--cic-space-*`
- `design-system/tokens/motion.ts` — `--cic-motion-*`
- `design-system/tokens/typography.ts` — `--cic-font-*`
- `design-system/tokens/dark-mode/` — Dark mode overrides

### Dashboard Integration
Generated components auto-wire into:
- Console v3 panels (AgentsPanel, IngestionPanel, DriftPanel, etc.)
- Design System Dashboard (Tier 1–3 evaluation layer)
- Operator Console (admin views)

### Storybook
- All components appear under **CIC/** folder
- Dark mode theme toggle
- Token editor (sandbox)
- Accessibility tab (a11y check)
- Responsive preview

## Success Criteria

✅ **Coverage**
- 25+ components by Q4 2026
- 6 tiers fully populated

✅ **Quality**
- 100% token coverage (no inline colors/spacing)
- 100% ESLint compliance (token rules + accessibility)
- 95%+ Jest test coverage
- 100% Playwright snapshot coverage
- WCAG AA accessibility (manual + automated)
- Zero visual drift (snapshot baseline match)

✅ **Process**
- Zero manual component scaffolding (all via generator)
- All tests pass on commit (pre-commit hook)
- Storybook auto-builds (CI pipeline)
- Components documented + discoverable

## Phases

### Phase 1: Generator Validation (Week 1)
- [x] Component Generator script ready
- [x] Templates complete (component.tsx, styles.css, story.tsx, test.tsx, visual.spec.ts, token-map.md)
- [x] Config locked (directories, output paths)
- [ ] Test generator with sample component (Button)
- [ ] Verify all outputs (file structure, token imports, test boilerplate)
- [ ] Document integration pattern in COMPONENT_INTEGRATION.md

### Phase 2: Q3 Tier 1 (Weeks 2-4)
- 6 core components: Button, Input, Checkbox, Radio, Toggle, Label
- Per-component: component + styles + story + test + visual + token-map
- All tests passing, snapshots approved

### Phase 3: Q3 Tier 2 (Weeks 5-8)
- 6 container components: Panel, Card, Row, Grid, Modal, Popover
- Dashboard integration (Panel as base for IngestionPanel, etc.)

### Phase 4: Q3 Tier 3 (Weeks 9-12)
- 6 data components: Table, Badge, Pill, Stat, Progress Bar, Skeleton

### Phase 5: Q4 Tier 4-6 (Weeks 13-24)
- Form (6), Feedback (6), Specialized (6)

## Files & Documentation

- **COMPONENT_LIBRARY_ROADMAP.md** (this file) — Top-level roadmap + timeline
- **Q3_TIER1_CORE.md** — Week 1-4 deliverables
- **Q3_TIER2_CONTAINERS.md** — Week 5-8 deliverables
- **Q3_TIER3_DATA.md** — Week 9-12 deliverables
- **Q4_TIER4_FORM.md** — Week 13-16 deliverables
- **Q4_TIER5_FEEDBACK.md** — Week 17-20 deliverables
- **Q4_TIER6_SPECIALIZED.md** — Week 21-24 deliverables
- **COMPONENT_INTEGRATION.md** — Wiring into dashboard + console
- **EXECUTION_CHECKLIST.md** — Week-by-week tasks
- **GENERATOR_GUIDE.md** — How to use the generator
- `cic-ui/` — Generator source + templates
- `cic-ui/config.json` — Output directory configuration

## Next Steps

1. ✅ Roadmap locked (this document)
2. ⏳ Test generator with Button component
3. ⏳ Approve Button (component + tests + snapshots)
4. ⏳ Begin Q3 Tier 1 execution
5. ⏳ Dashboard integration (wire Button, Input, etc. into existing panels)

---

**Status: Ready for Phase 1 (Generator Validation). Tier 1 components queued.**
