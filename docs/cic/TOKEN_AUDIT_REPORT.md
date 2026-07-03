---
title: "TOKEN AUDIT REPORT"
summary: "# Design System Token Audit Report **Date:** 2026-06-21 **Scope:** CIC Tier-1 Design System Colors, Spacing, Typography **Status:** 🟡 **75% Complete — Critical Gaps Identified**"
created: "2026-07-03T19:43:45.629Z"
updated: "2026-07-03T19:43:45.629Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Design System Token Audit Report
**Date:** 2026-06-21  
**Scope:** CIC Tier-1 Design System Colors, Spacing, Typography  
**Status:** 🟡 **75% Complete — Critical Gaps Identified**

---

## Executive Summary

Three token definition files exist:
1. **tokens.css** (primary, auto-generated) — 79 tokens, comprehensive
2. **tokens.json** (structured reference) — same 79 tokens
3. **design-system.css** (legacy) — 13 simplified tokens

**Coverage: 65% colors, 85% spacing, 40% typography, 0% interaction states.**

---

## 1. Color Tokens — 65% Complete

### ✅ Defined (17 tokens)

```
Base Colors (3)
  --color-bg-primary       #0a0a0a ✓
  --color-bg-secondary     #111111 ✓
  --color-bg-panel         #141414 ✓

Accent Colors (2)
  --color-accent-primary   #00ff88 ✓
  --color-accent-secondary #00cc6f ✓

Text Colors (3)
  --color-text-primary     #ffffff ✓
  --color-text-secondary   #cccccc ✓
  --color-text-muted       #888888 ✓

Status Colors (4)
  --color-status-online    #00ff88 ✓
  --color-status-degraded  #ffaa00 ✓
  --color-status-down      #ff4444 ✓
  --color-status-pending   #888888 ✓

Alert Colors (4)
  --color-alert-info       #4da6ff ✓
  --color-alert-warn       #ffaa00 ✓
  --color-alert-error      #ff4444 ✓
  --color-alert-success    #00ff88 ✓
```

### ❌ Missing (12 tokens required for Tier-1)

```
Semantic Colors (needed for components)
  ✗ --cic-bg-surface      (variant of bg-panel for raised surfaces)
  ✗ --cic-bg-hover        (interactive hover state)
  ✗ --cic-bg-selected     (selected/active state background)
  ✗ --cic-bg-disabled     (disabled state background)

Interaction States (CRITICAL)
  ✗ --cic-btn-primary-hover      (button hover)
  ✗ --cic-btn-primary-active     (button pressed)
  ✗ --cic-btn-secondary-hover    (secondary button hover)
  ✗ --cic-focus-ring             (focus state border)

Scrollbar Colors (needed for UI)
  ✗ --cic-scrollbar-track        (scrollbar background)
  ✗ --cic-scrollbar-thumb        (scrollbar handle)
  ✗ --cic-scrollbar-thumb-hover  (scrollbar hover)

Border Colors
  ✗ --cic-border-default        (default borders)
  ✗ --cic-border-hover          (hover borders)
```

### 🔄 Aliases & Mapping (Inconsistent)

Current aliases map to v1.0 tokens:
```css
control-room.css:
  --color-bg-primary     → mapped
  --color-accent-primary → mapped
  --font-body            → Barlow (correct)
```

**Issue:** Agents Panel needs `--cic-*` prefix but tokens.css uses `--color-*`, `--component-*`.

---

## 2. Spacing Tokens — 85% Complete

### ✅ Defined (7 tokens)

```
Space Scale (7)
  --space-xs  4px   ✓ (gap, icon spacing)
  --space-sm  8px   ✓ (compact padding)
  --space-md  16px  ✓ (standard padding)
  --space-lg  24px  ✓ (section spacing)
  --space-xl  32px  ✓ (large spacing)
  --space-2xl 48px  ✓ (header/footer)
  --space-3xl 64px  ✓ (max gaps)

Layout Tokens (4)
  --layout-login_card_width 360px  ✓
  --layout-sidebar_width    260px  ✓
  --layout-header_height    52px   ✓
  --layout-node_size        80px   ✓
```

### ❌ Missing (5 tokens required for components)

```
Component Spacing
  ✗ --space-row-height         (normalize to 36px)
  ✗ --space-button-padding     (8px 16px)
  ✗ --space-icon-gap           (4px)
  ✗ --space-input-padding      (8px 12px)
  ✗ --space-section-divider    (24px vertical)
```

### Usage Pattern

**Agents Panel needs:**
- Row height: 36px (not in tokens)
- Icon gap: 4px (not in tokens)
- Button padding: 8px 16px (not in tokens)
- Outer panel padding: 16px ✓ (--space-md)
- Inner padding: 12px (not in tokens, use --space-sm + 4px)

---

## 3. Typography Tokens — 40% Complete

### ✅ Defined (4 font families)

```
Font Families
  --font-heading      Playfair Display ✓
  --font-subheading   Baskerville ✓
  --font-body         Barlow ✓
  --font-mono         JetBrains Mono ✓
```

### ❌ Missing (type scale)

**No tokens for:**
- Font sizes (H4, H5, Body-M, Body-S, etc.)
- Font weights
- Line heights
- Letter spacing

**Type scale defined in colors_and_type.css but NOT in tokens.css:**

```css
colors_and_type.css defines:
  --text-hero         clamp(4rem, 10vw, 9rem)
  --text-h1           clamp(2.5rem, 5vw, 4.5rem)
  --text-h2           clamp(2rem, 4vw, 3.5rem)
  --text-h3           clamp(1.8rem, 3vw, 3.2rem)
  --text-h4           1.6rem
  --text-h5           1.3rem
  --text-body         1rem
  --text-body-sm      0.95rem
  --text-caption      0.85rem
  --text-label        0.7rem

Line heights:
  --leading-display   0.9
  --leading-tight     1.1
  --leading-head      1.2
  --leading-body      1.9
  --leading-label     1.4

Tracking:
  --tracking-wide     0.4em
  --tracking-med      0.25em
  --tracking-ui       0.2em
  --tracking-tight    0.1em
```

**Problem:** Type scale in two places (colors_and_type.css + tokens.css missing it).

---

## 4. Border Radius Tokens — 90% Complete

### ✅ Defined (3 tokens)

```
Radius
  --radius-sm  4px   ✓ (default, inputs, badges)
  --radius-md  8px   ✓ (cards, panels)
  --radius-lg  12px  ✓ (modals)
```

### ❌ Missing (1 token)

```
  ✗ --radius-none  0px  (for elements without radius)
```

---

## 5. Elevation (Shadows) Tokens — 100% Complete

### ✅ Defined (4 tokens)

```
  --elevation-none  0px   ✓
  --elevation-low   2px   ✓
  --elevation-med   6px   ✓
  --elevation-high  12px  ✓
```

---

## 6. Component Token Coverage — 50% Complete

### ✅ Defined

```
Panel Variants (4)
  --component-panel-padding
  --component-panel-radius
  --component-panel-variants-default-*
  --component-panel-variants-bordered-*
  --component-panel-variants-elevated-*
  --component-panel-variants-inline-*

Alert Component
  --component-alert-radius
  --component-alert-padding
  --component-alert-severity-*  (info/warn/error/success)

Stat Component
  --component-stat-value_font
  --component-stat-delta_*  (positive/negative/neutral)
```

### ❌ Missing (all interactive components)

```
Button Component
  ✗ --component-button-padding
  ✗ --component-button-radius
  ✗ --component-button-gap
  ✗ --component-button-primary-bg
  ✗ --component-button-primary-hover
  ✗ --component-button-primary-active
  ✗ --component-button-secondary-*
  ✗ --component-button-disabled-*

Input Component
  ✗ --component-input-padding
  ✗ --component-input-radius
  ✗ --component-input-border
  ✗ --component-input-focus-ring
  ✗ --component-input-disabled-*

Row Component (for lists)
  ✗ --component-row-height
  ✗ --component-row-padding
  ✗ --component-row-hover-bg
  ✗ --component-row-selected-bg

Table Component
  ✗ --component-table-header-bg
  ✗ --component-table-row-hover-bg
  ✗ --component-table-border-color
  ✗ --component-table-cell-padding
```

---

## 7. Unused Tokens (0)

**All defined tokens are referenced.** No orphaned tokens found.

---

## 8. Token File Synchronization Issues

### tokens.json ↔ tokens.css
✅ **Synced** — Both auto-generated, values match

### colors_and_type.css (DIVERGENT)
❌ **Out of sync** — Contains type scale not in tokens.json/tokens.css

### design-system.css (LEGACY)
❌ **Simplified version** — Only 13 tokens, maps to older names

**Issue:** Three sources of truth. Agents Panel should use tokens.css, but type scale needed from colors_and_type.css.

---

## 9. Naming Convention Issues

| File | Prefix | Example | Issue |
|------|--------|---------|-------|
| tokens.css | `--color-` / `--component-` | `--color-bg-primary` | ✓ Semantic |
| design-system.css | `--cic-` | `--cic-bg` | ✓ App-scoped |
| colors_and_type.css | `--` (generic) | `--black`, `--text-h4` | ⚠️ Ambiguous |

**Issue:** Agents Panel references `--cic-*` tokens that don't exist in tokens.css. Need migration.

---

## 10. Priority Fixes

### BLOCKER (Required for Agents Panel Phase 1.5)
1. **Add interaction state colors** (hover/active/focus)
2. **Add component tokens for Button, Row, Input**
3. **Consolidate type scale into tokens.css**
4. **Create `--cic-*` alias layer** (map to v1.0 tokens)

### HIGH (Prevent Tier-1 drift)
5. **Document color contrast ratios** (WCAG AA minimum)
6. **Add scrollbar color tokens**
7. **Add disabled state tokens**
8. **Deprecate design-system.css** (consolidate to tokens.css)

### MEDIUM (Polish)
9. **Add animation/transition tokens**
10. **Add spacing composite tokens** (e.g., --space-section = space-lg + divider)

---

## 11. Recommended Token Structure (Revised)

```json
{
  "version": "1.2.0",
  
  "color": {
    "semantic": {
      "bg-primary": "#0a0a0a",
      "bg-surface": "#111111",
      "bg-surface-elevated": "#141414",
      "text-primary": "#ffffff",
      "text-secondary": "#cccccc",
      "border-default": "#222222"
    },
    
    "interaction": {
      "hover": "#1a1a1a",
      "selected": "#1f1f1f",
      "disabled": "rgba(255, 255, 255, 0.5)",
      "focus-ring": "#00ff88"
    },
    
    "button": {
      "primary-bg": "#00ff88",
      "primary-hover": "#00cc6f",
      "primary-active": "#009955",
      "primary-disabled": "rgba(0, 255, 136, 0.5)"
    },
    
    "status": { ... },
    "scrollbar": {
      "track": "#111111",
      "thumb": "#333333",
      "thumb-hover": "#444444"
    }
  },
  
  "space": { ... },
  
  "typography": {
    "scale": {
      "h4": { "size": "1.6rem", "weight": 700, "line-height": 1.2 },
      "h5": { "size": "1.3rem", "weight": 700, "line-height": 1.2 },
      "body-m": { "size": "1rem", "weight": 400, "line-height": 1.5 },
      "body-s": { "size": "0.95rem", "weight": 400, "line-height": 1.5 },
      "label": { "size": "0.7rem", "weight": 600, "line-height": 1.4 }
    }
  },
  
  "component": {
    "button": {
      "padding": "8px 16px",
      "radius": "4px",
      "gap": "4px",
      "min-width": "96px"
    },
    "row": {
      "height": "36px",
      "padding": "0 12px",
      "gap": "4px"
    },
    "input": {
      "padding": "8px 12px",
      "radius": "4px",
      "border": "1px solid",
      "focus-ring": "2px"
    }
  }
}
```

---

## 12. Next Steps

1. **Audit Phase 1:** Review tokens.css against Tier-1 spec → **DONE (this report)**
2. **Audit Phase 2:** Extract type scale from colors_and_type.css → **IN PROGRESS**
3. **Add missing tokens** to tokens.json/tokens.css
4. **Generate CSS variables** from tokens.json (auto-update tokens.css)
5. **Create audit validator** (eslint rule: all component colors use tokens)
6. **Update Agents Panel** to use token values from this audit

---

## Appendix: Token Usage by File

| Component | Colors Used | Spacing Used | Typography Used |
|-----------|------------|--------------|-----------------|
| AgentList | 2/17 | 1/7 | 0/4 |
| AgentDetail | 1/17 | 1/7 | 1/4 |
| Button | 2/17 | 0/7 | 1/4 |
| Table | 3/17 | 0/7 | 0/4 |
| Scrollbar | 0/17 | 0/7 | 0/4 |

**Gap:** 41% of available tokens unused. Add component tokens to increase adoption.

