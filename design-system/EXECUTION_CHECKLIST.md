# Component Library Execution Checklist

**Date:** 2026-06-22  
**Format:** Week-by-week deliverables with per-component checklist

## Q3 2026: Weeks 1-12

### Week 1: Phase 1 — Generator Validation ✅ IN PROGRESS

**Goal:** Validate Component Generator with sample component (Button)

- [ ] Test generator: `npm run cic-ui add button`
- [ ] Verify outputs:
  - [ ] `src/components/cic/Button.tsx` (exists, imports tokens)
  - [ ] `src/components/cic/button.css` (token-driven styles)
  - [ ] `src/stories/cic/Button.stories.tsx` (story variants)
  - [ ] `src/tests/cic/Button.test.tsx` (Jest tests)
  - [ ] `src/visual/cic/Button.spec.ts` (Playwright tests)
  - [ ] `docs/tokens/usage/Button.md` (token map)
- [ ] Run tests: `npm test` (all Button tests pass)
- [ ] Run visual: `npm run visual:test` (snapshot approval)
- [ ] ESLint check: `npm run eslint src/components/cic/Button.tsx` (pass)
- [ ] Verify barrel export updated: `export { Button } from './Button';` in `src/components/cic/index.ts`
- [ ] Document findings in `COMPONENT_INTEGRATION.md` (patterns confirmed)
- [ ] **Commit:** Button component + validation pass

**Files Created (Week 1):**
- [ ] Button.tsx (1 component)
- [ ] button.css (1 styles)
- [ ] Button.stories.tsx (1 story)
- [ ] Button.test.tsx (1 test)
- [ ] Button.spec.ts (1 visual)
- [ ] Button.md (1 token map)

**Success Criteria:**
- ✅ Generator works end-to-end
- ✅ All 6 file types generated correctly
- ✅ Tests pass (Jest + Playwright)
- ✅ ESLint compliant
- ✅ Token integration confirmed

---

### Weeks 2-4: Q3 Tier 1 — Core Components

**Goal:** Implement 6 core components (Button, Input, Checkbox, Radio, Toggle, Label)

#### Week 2: Button + Input

- [ ] **Button** (Week 1 carryover)
  - [ ] Implement variants: default, primary, secondary, danger
  - [ ] States: default, hover, disabled, loading, focus
  - [ ] Jest tests ≥95% coverage
  - [ ] Playwright snapshots (light + dark)
  - [ ] Storybook story complete
  - [ ] Token map complete
  - [ ] **Status:** Ready for merge

- [ ] **Input**
  - [ ] Generate: `npm run cic-ui add input`
  - [ ] Implement variants: text, email, password, disabled
  - [ ] States: default, focus, filled, error, placeholder
  - [ ] Accessibility: label association, aria-* attributes
  - [ ] Jest tests ≥95% coverage
  - [ ] Playwright snapshots (light + dark)
  - [ ] Token map
  - [ ] **Status:** Ready for merge

- [ ] **Commit:** Button + Input components

#### Week 3: Checkbox + Radio

- [ ] **Checkbox**
  - [ ] Generate: `npm run cic-ui add checkbox`
  - [ ] States: unchecked, checked, disabled, indeterminate
  - [ ] Keyboard: Space to toggle
  - [ ] Accessibility: `<label>` association, aria-checked
  - [ ] Tests + snapshots
  - [ ] **Status:** Ready for merge

- [ ] **Radio**
  - [ ] Generate: `npm run cic-ui add radio`
  - [ ] States: unselected, selected, disabled
  - [ ] Keyboard: Arrow keys to navigate group
  - [ ] Accessibility: `<fieldset>` + `<legend>`, aria-checked
  - [ ] Tests + snapshots
  - [ ] **Status:** Ready for merge

- [ ] **Commit:** Checkbox + Radio components

#### Week 4: Toggle + Label

- [ ] **Toggle**
  - [ ] Generate: `npm run cic-ui add toggle`
  - [ ] States: off, on, disabled
  - [ ] Keyboard: Space to toggle
  - [ ] Accessibility: aria-pressed, aria-label
  - [ ] Tests + snapshots
  - [ ] **Status:** Ready for merge

- [ ] **Label**
  - [ ] Generate: `npm run cic-ui add label`
  - [ ] Sizes: small, medium, large
  - [ ] Variants: default, required, optional
  - [ ] Keyboard: click targets
  - [ ] Accessibility: `<label>` semantics
  - [ ] Tests + snapshots
  - [ ] **Status:** Ready for merge

- [ ] **Commit:** Toggle + Label components
- [ ] **Week 4 Summary:**
  - [ ] All 6 Tier 1 components complete
  - [ ] 60+ generated files
  - [ ] 300+ Jest tests passing
  - [ ] 36 Playwright baselines approved
  - [ ] 100% ESLint compliant

---

### Weeks 5-8: Q3 Tier 2 — Container Components

**Goal:** Implement 6 container components (Panel, Card, Row, Grid, Modal, Popover)

- [ ] Panel (Week 5)
- [ ] Card (Week 5)
- [ ] Row (Week 6)
- [ ] Grid (Week 6)
- [ ] Modal (Week 7)
- [ ] Popover (Week 8)

**Files per week:** ~12 (2 components × 6 files each)  
**Cumulative total by Week 8:** 72 components files (12 new components)

---

### Weeks 9-12: Q3 Tier 3 — Data Components

**Goal:** Implement 6 data components (Table, Badge, Pill, Stat, Progress Bar, Skeleton)

- [ ] Badge + Pill (Week 9)
- [ ] Stat (Week 10)
- [ ] Table (Week 11)
- [ ] Progress Bar + Skeleton (Week 12)

**Cumulative total by Week 12:** 108 component files (18 components)

---

## Q4 2026: Weeks 13-24

### Weeks 13-16: Q4 Tier 4 — Form Components

- [ ] Select (Week 13)
- [ ] ComboBox (Week 14)
- [ ] DatePicker (Week 15)
- [ ] TimePicker + MultiSelect (Week 16)
- [ ] Textarea (Week 16)

**Cumulative:** 138 component files (23 components)

### Weeks 17-20: Q4 Tier 5 — Feedback Components

- [ ] Alert (Week 17)
- [ ] Toast (Week 18)
- [ ] Tooltip (Week 19)
- [ ] Dialog + Drawer (Week 20)
- [ ] Popover Advanced (Week 20)

**Cumulative:** 168 component files (28 components)

### Weeks 21-24: Q4 Tier 6 — Specialized Components

- [ ] CodeBlock (Week 21)
- [ ] Tabs + Breadcrumb (Week 22)
- [ ] Stepper + Timeline (Week 23)
- [ ] Autocomplete (Week 24)

**Cumulative:** 198 component files (33+ components)

---

## Dashboard Integration Milestones

### After Tier 1 (Week 4)
- Integrate Button, Input, Toggle into ControlsPanel
- Test agent refresh, filter, toggle flows

### After Tier 2 (Week 8)
- Integrate Panel, Card, Modal into console panels
- Test dashboard layout with new containers

### After Tier 3 (Week 12)
- Integrate Table into AgentsPanel, IngestionPanel
- Integrate Badge into status displays
- Integrate Progress Bar into pipeline runs

### After Tier 4 (Week 16)
- Integrate Select into filter dropdowns
- Integrate DatePicker into drift time-range filter

### After Tier 5 (Week 20)
- Integrate Alert + Toast into notification system
- Integrate Tooltip into field help

### After Tier 6 (Week 24)
- Integrate CodeBlock into documentation
- Integrate Tabs into multi-view panels

---

## Definition of Done (Per Component)

### Code
- ✅ Component file generated + implemented
- ✅ Styles 100% token-driven
- ✅ Props interface complete + typed
- ✅ Accessibility attributes (aria-*, semantic HTML)
- ✅ Dark mode support (via CSS vars)

### Tests
- ✅ Jest unit tests ≥95% coverage
- ✅ All tests passing on commit
- ✅ Props validation tests
- ✅ Keyboard navigation tests
- ✅ Accessibility tests (a11y)

### Visuals
- ✅ Playwright snapshot tests
- ✅ Light mode baseline approved
- ✅ Dark mode baseline approved
- ✅ Reduced motion baseline approved
- ✅ maxDiffPixels=50 threshold met

### Documentation
- ✅ Storybook story complete (6+ variants)
- ✅ Token map documentation (colors, spacing, motion, typography)
- ✅ Accessibility checklist completed
- ✅ Dark mode behavior documented

### Pre-Commit Checks
- ✅ ESLint passes (token rules)
- ✅ Jest passes
- ✅ Playwright snapshots match
- ✅ Barrel export auto-appended

### Dashboard Integration
- ✅ Component imported in target panels
- ✅ Panel integration tests pass
- ✅ Visual integration tested
- ✅ E2E flow tested (e.g., Button click → action → panel update)

---

## Metrics & Tracking

### By Week
- **Week 1:** 1 component (Button) ✓
- **Weeks 2-4:** 6 components (Tier 1)
- **Weeks 5-8:** 6 components (Tier 2)
- **Weeks 9-12:** 6 components (Tier 3)
- **Weeks 13-16:** 6 components (Tier 4)
- **Weeks 17-20:** 6 components (Tier 5)
- **Weeks 21-24:** 6 components (Tier 6)
- **Total Q3:** 18 components (60+ files)
- **Total Q4:** 18 components (60+ files)
- **Grand Total:** 36+ components (200+ files)

### By Quality
- **ESLint:** 100% pass rate
- **Jest Coverage:** ≥95% per component
- **Playwright:** 100% snapshot coverage (3+ variants per component)
- **Visual Drift:** 0 regressions (maxDiffPixels=50)
- **Accessibility:** WCAG AA compliant (manual + automated)

### By Velocity
- **Week 1-4:** 6 components (1.5/week)
- **Week 5-12:** 12 components (1.5/week)
- **Week 13-24:** 18 components (1.5/week)

---

## Next Steps

- [ ] **Week 1 (NOW):** Validate generator with Button
- [ ] **Week 2-4:** Execute Tier 1 (Button, Input, Checkbox, Radio, Toggle, Label)
- [ ] **Week 5-8:** Execute Tier 2 (Panel, Card, Row, Grid, Modal, Popover)
- [ ] **Week 9-12:** Execute Tier 3 (Table, Badge, Pill, Stat, Progress Bar, Skeleton)
- [ ] **Dashboard:** Start Tier 1 integration (Week 4 onwards)

---

**Status: Week 1 in progress. Button component validation pending.**
