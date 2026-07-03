---
title: "CIC TOKEN PACK V2 0 IMPLEMENTATION GUIDE"
summary: "# CIC Token Pack v2.0 — Implementation Guide **Date:** 2026-06-21 **Status:** Phase 1 (CRITICAL) ready to execute **Timeline:** 30 min (Phase 1) + 1 hr (Phase 2) + 1.5 hr (Phase 3) = **2.5 hours total**"
created: "2026-07-03T19:43:45.358Z"
updated: "2026-07-03T19:43:45.358Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Token Pack v2.0 — Implementation Guide
**Date:** 2026-06-21  
**Status:** Phase 1 (CRITICAL) ready to execute  
**Timeline:** 30 min (Phase 1) + 1 hr (Phase 2) + 1.5 hr (Phase 3) = **2.5 hours total**

---

## What You Have

**Artifact D: Complete Token Pack v2.0**

1. **CIC_TOKEN_PACK_v2_0_tokens.css** — Drop-in replacement for tokens.css
   - 79 existing tokens (preserved)
   - 61 new tokens (organized by phase)
   - Ready to merge into `rewrite-mcp/apps/operator-ui/css/tokens.css`

2. **CIC_TOKEN_PACK_v2_0_tokens.ts** — TypeScript exports
   - Type-safe token access
   - Convenience functions: `cssVar.*`, `cssValue()`, `toCSSVar()`
   - Ready to drop into `rewrite-mcp/apps/operator-ui/css/tokens.ts`

3. **CIC_TOKEN_PACK_v2_0_tokens.json** — Structured reference
   - Mirrors CSS for tooling/validation
   - Ready to replace `rewrite-mcp/apps/control-plane/tokens.json`

4. **CIC_TOKEN_PACK_v2_0_COMPONENT_PATCHES.md** — Component update guide
   - Before/after patches for 8 components
   - 50+ CSS rules to update
   - ~60 hardcoded values to replace

5. **CIC_TOKEN_PACK_v2_0_FULL_LIST.md** — Reference
   - All 61 tokens with values & examples
   - Organized by phase & category
   - Copy-paste ready

---

## Execution Plan

### Phase 1: CRITICAL (30 min) — Agents Panel Unblocked

**Goal:** Add 25 tokens (8 interaction + 12 button + 5 row) so Agents Panel can render.

#### Step 1a: Backup current tokens.css (1 min)
```bash
cp rewrite-mcp/apps/operator-ui/css/tokens.css rewrite-mcp/apps/operator-ui/css/tokens.css.bak
```

#### Step 1b: Replace tokens.css (2 min)
Copy contents of `CIC_TOKEN_PACK_v2_0_tokens.css` into:
```
rewrite-mcp/apps/operator-ui/css/tokens.css
```

Or use sed/script:
```bash
# Copy generated file into place
cp CIC_TOKEN_PACK_v2_0_tokens.css rewrite-mcp/apps/operator-ui/css/tokens.css
```

#### Step 1c: Update CicButton component (5 min)
Apply patches from `CIC_TOKEN_PACK_v2_0_COMPONENT_PATCHES.md` section 1:
- File: `rewrite-mcp/projects/cic-operator-console/src/components/CicButton/CicButton.css`
- Changes: 12 hardcoded → 12 tokens
- Impact: Primary + Secondary buttons now token-driven

#### Step 1d: Update AgentList component (5 min)
Apply patches section 2:
- File: `rewrite-mcp/projects/cic-operator-console/src/components/AgentList/AgentList.css`
- Changes: 8 hardcoded → 8 tokens
- Impact: Row height corrected 32px → 36px, icon gap 6px → 4px

#### Step 1e: Test (10 min)
```bash
cd rewrite-mcp/projects/cic-operator-console
npm test

# Visual check
npm run dev  # Should see buttons + rows with new styling
```

**Exit Criteria:**
- ✅ CicButton renders with accent green (#00ff88)
- ✅ AgentList rows 36px tall, 4px icon gap
- ✅ Hover states work (rgba(255,255,255,0.08))
- ✅ Tests pass

---

### Phase 2: HIGH (1 hour) — Complete Styling

**Goal:** Add 18 tokens (5 input + 3 scrollbar + 10 typography) for full component coverage.

#### Step 2a: Update CicInput component (10 min)
Apply patches section 3:
- File: `rewrite-mcp/projects/cic-operator-console/src/components/CicInput/CicInput.css`
- Changes: 7 hardcoded → 7 tokens
- Impact: Input borders, focus rings, disabled states all tokenized

#### Step 2b: Add scrollbar styles (5 min)
Apply patches section 5:
- File: `rewrite-mcp/apps/operator-ui/css/control-room.css` or main stylesheet
- Changes: 4 hardcoded → 4 tokens
- Impact: Scrollbar track/thumb/hover colors controlled by tokens

#### Step 2c: Update typography classes (10 min)
In component stylesheets, replace hardcoded font-size + line-height:

Example pattern:
```css
/* BEFORE */
.heading { font-size: 1.6rem; line-height: 1.2; font-weight: 700; }
.body { font-size: 1rem; line-height: 1.5; font-weight: 400; }
.label { font-size: 0.7rem; line-height: 1.4; font-weight: 600; }

/* AFTER */
.heading { 
  font-size: var(--cic-type-h4);
  line-height: var(--cic-leading-head);
  font-weight: 700;
}
.body { 
  font-size: var(--cic-type-body-m);
  line-height: var(--cic-leading-body);
  font-weight: 400;
}
.label { 
  font-size: var(--cic-type-label);
  line-height: var(--cic-leading-label);
  font-weight: 600;
}
```

Apply to:
- `AgentList.css` (.agent-name → --cic-type-body-s)
- `AgentDetail.css` (any heading/body text)
- `CicPanel.css` (.panel-title, .panel-subtitle)
- All other components using font-size

#### Step 2d: Sync tokens.json (5 min)
```bash
cp CIC_TOKEN_PACK_v2_0_tokens.json rewrite-mcp/apps/control-plane/tokens.json
```

#### Step 2e: Test (30 min)
```bash
npm test

# Visual:
# - Form inputs show correct padding
# - Scrollbar themed (dark track, gray thumb)
# - Typography size/weight consistent
# - Focus rings are bright green + 2px wide
```

**Exit Criteria:**
- ✅ Inputs: 8px 12px padding, 4px radius, dark border
- ✅ Scrollbar: 8px track, 12px thumb, hover brightens
- ✅ Typography: h4=1.6rem, body=1rem, label=0.7rem
- ✅ Tests pass
- ✅ No visual regressions from Phase 1

---

### Phase 3: MEDIUM (1.5 hours) — Extended Coverage

**Goal:** Add 18 tokens (4 panel + 2 icon + 5 table + 3 code) to complete Tier-1 design system.

#### Step 3a: Update CicTable component (15 min)
Apply patches section 4:
- File: `rewrite-mcp/projects/cic-operator-console/src/components/CicTable/CicTable.css`
- Changes: 6 hardcoded → 6 tokens
- Impact: Table headers, cells, row hover all tokenized

#### Step 3b: Update CicPanel component (10 min)
Apply patches section 6:
- File: `rewrite-mcp/projects/cic-operator-console/src/components/CicPanel/CicPanel.css` (or create)
- Changes: 6 tokens used
- Impact: Panel padding, border-radius, elevation controlled

#### Step 3c: Add Code block component (10 min)
Apply patches section 7:
- File: `rewrite-mcp/apps/operator-ui/css/code-block.css` (or add to component)
- Changes: 5 tokens used
- Impact: Code blocks have dark bg (#050505), light fg, monospace font

#### Step 3d: Consolidate design-system.css (15 min)
Apply patches section 8:
- File: `rewrite-mcp/apps/control-plane/dashboard/src/design-system.css`
- Action: Migrate from `--cic-*` (old, simplified) to `--cic-*` (new, comprehensive) OR deprecate entirely
- Update imports: Point to tokens.css instead

#### Step 3e: Create ESLint rules (10 min)
Add validation to prevent hardcoded values:

**File:** `.eslintrc.js` (at repo root or component level)

```javascript
module.exports = {
  rules: {
    'no-hardcoded-colors': [
      'error',
      {
        allowedPatterns: [
          /^rgba?\(/, // Allow rgba() definitions
          /^var\(--/, // Allow CSS variables
          /^transparent$/,
          /^inherit$/,
          /^currentColor$/,
        ],
      },
    ],
  },
};
```

Or use existing ESLint plugin: `eslint-plugin-stylelint`

#### Step 3f: Full validation (30 min)
```bash
# Run all tests
npm test

# Check token coverage
npm run token-report  # (creates coverage report)

# Visual regression
npm run test:visual  # Compare screenshots before/after

# ESLint validation
npx eslint . --rule 'no-hardcoded-colors: error'

# Lighthouse (if applicable)
npm run lighthouse
```

**Exit Criteria:**
- ✅ Tables: Header dark bg, cells 8px padding, hover states
- ✅ Panels: 16px padding, 4px radius, elevation shadows
- ✅ Code: Dark bg (#050505), light text, mono font
- ✅ Icons: 4px gap from text, 16px size
- ✅ Zero hardcoded colors in CSS
- ✅ Token coverage 100%
- ✅ All tests pass
- ✅ No visual regressions

---

## Files to Modify (Summary)

| File | Phase | Changes | Impact |
|------|-------|---------|--------|
| tokens.css | 1 | Add 61 tokens | Source of truth |
| CicButton.css | 1 | 12 rules | Buttons themed |
| AgentList.css | 1 | 8 rules | Rows fixed |
| CicInput.css | 2 | 7 rules | Forms styled |
| Scrollbar global | 2 | 4 rules | Scrolling themed |
| Typography (all) | 2 | 10+ rules | Type system unified |
| CicTable.css | 3 | 6 rules | Tables themed |
| CicPanel.css | 3 | 6 rules | Panels styled |
| Code blocks | 3 | 5 rules | Code blocks dark |
| design-system.css | 3 | Consolidate | Single source |
| tokens.json | 3 | Sync | Auto-sync tooling |

---

## Commit Strategy

**Option A: Atomic commits (phase-based)**
```bash
# Phase 1
git add tokens.css CicButton.css AgentList.css
git commit -m "[claude] feat(phase-27-4): Add 25 critical design tokens + button/row components"

# Phase 2
git add CicInput.css control-room.css tokens.json + typography updates
git commit -m "[claude] feat(phase-27-4): Add 18 input/scrollbar/typography tokens"

# Phase 3
git add CicTable.css CicPanel.css code-block.css design-system.css .eslintrc.js
git commit -m "[claude] feat(phase-27-4): Complete 18 extended tokens + consolidate design system"
```

**Option B: Single commit (if all at once)**
```bash
git add .
git commit -m "[claude] feat(phase-27-4): CIC Design System v2.0 (61 tokens, 100% Tier-1 coverage)"
```

---

## Rollback Plan

If anything breaks:

```bash
# Restore backup
cp rewrite-mcp/apps/operator-ui/css/tokens.css.bak rewrite-mcp/apps/operator-ui/css/tokens.css

# Revert component changes
git checkout rewrite-mcp/projects/cic-operator-console/src/components/

# Reset
git reset --hard HEAD~1
```

---

## Next Artifacts

After this pack:
- **B:** Updated `MISSING_TOKENS_FOR_AGENTS_PANEL.md` (shows Phase 1/2/3 progress)
- **C:** Updated `TOKEN_COVERAGE_MATRIX.md` (shows 100% coverage after Phase 3)

---

## Success Criteria

✅ **Phase 1 Complete:**
- Agents Panel renders with correct colors/spacing
- Button + Row components use tokens
- Tests pass

✅ **Phase 2 Complete:**
- Input fields styled with tokens
- Scrollbars themed
- Typography unified
- Tests pass

✅ **Phase 3 Complete:**
- Tables, panels, code blocks all tokenized
- design-system.css consolidated
- ESLint rules enforcing token usage
- 100% token coverage
- All tests pass
- Zero visual regressions

---

## Timeline Estimate

| Phase | Duration | Parallelizable? | Critical Path? |
|-------|----------|-----------------|---|
| Phase 1 | 30 min | No (blocking) | YES |
| Phase 2 | 1 hr | Partial | YES |
| Phase 3 | 1.5 hr | Yes (independent) | NO |
| **Total** | **2.5 hr** | — | — |

**Critical path:** Phase 1 → Phase 2 (type scale) → Phase 3 can parallel

**Recommended approach:** Execute Phase 1 fully, test, then Phase 2 + 3 in parallel.

---

## Quick Start

1. **Copy files:**
   ```bash
   cp CIC_TOKEN_PACK_v2_0_tokens.css rewrite-mcp/apps/operator-ui/css/tokens.css
   cp CIC_TOKEN_PACK_v2_0_tokens.json rewrite-mcp/apps/control-plane/tokens.json
   cp CIC_TOKEN_PACK_v2_0_tokens.ts rewrite-mcp/apps/operator-ui/css/tokens.ts
   ```

2. **Apply Phase 1 patches:**
   - Edit CicButton.css (section 1)
   - Edit AgentList.css (section 2)

3. **Test:**
   ```bash
   npm test
   npm run dev
   ```

4. **Commit:**
   ```bash
   git add .
   git commit -m "[claude] feat: CIC Design System v2.0 Phase 1 (25 critical tokens)"
   ```

5. **Proceed to Phase 2/3** (use sections 3-8 of component patches)

---

## Support

**If token not working:**
- Check CSS variable name in tokens.css (must start with `--cic-`)
- Verify component is using correct var() syntax
- Run `npm test` to catch compilation errors

**If visual mismatched:**
- Compare before/after with browser DevTools
- Check token value in Computed Styles panel
- Verify no conflicting CSS rules

**If ESLint fails:**
- Update .eslintrc.js with correct rule config
- Run `npx eslint . --fix` to auto-fix some issues

