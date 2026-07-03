# CIC Design System v2.0 — Complete Token List
**Date:** 2026-06-21  
**Total Tokens:** 61 new + 79 existing = 140 complete system  
**Target File:** `rewrite-mcp/apps/operator-ui/css/tokens.css`

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Interaction States | 8 | CRITICAL |
| Button Component | 12 | CRITICAL |
| Row Component | 5 | HIGH |
| Input Component | 5 | HIGH |
| Scrollbar Component | 3 | HIGH |
| Typography / Type Scale | 10 | MEDIUM |
| Panel Component | 4 | MEDIUM |
| Icon Spacing | 2 | MEDIUM |
| Table Component | 5 | MEDIUM |
| Code Block | 3 | LOW |
| **TOTAL** | **61** | — |

---

## Phase 1: CRITICAL (Blocking — 30 min)

### 1. Interaction States (8 tokens)

```css
--cic-bg-hover:          rgba(255, 255, 255, 0.08);    /* Subtle white overlay */
--cic-bg-selected:       rgba(0, 255, 136, 0.15);      /* Accent + transparency */
--cic-bg-disabled:       rgba(255, 255, 255, 0.05);    /* Dimmed */
--cic-focus-ring:        #00ff88;                       /* Bright accent */
--cic-focus-ring-width:  2px;                           /* Standard width */
--cic-border-hover:      #00ff88;                       /* Accent on hover */
--cic-border-focus:      #00ff88;                       /* Accent on focus */
--cic-border-disabled:   rgba(255, 255, 255, 0.1);     /* 10% white */
```

**Usage:**
```css
.element:hover { background: var(--cic-bg-hover); }
.element.selected { background: var(--cic-bg-selected); }
input:focus-visible { outline: var(--cic-focus-ring-width) solid var(--cic-focus-ring); }
button:disabled { border-color: var(--cic-border-disabled); cursor: not-allowed; }
```

---

### 2. Button Component (12 tokens)

```css
--cic-btn-primary-bg:          #00ff88;                  /* Primary action */
--cic-btn-primary-fg:          #0a0a0a;                 /* Dark text */
--cic-btn-primary-hover:       #00cc6f;                 /* Secondary accent */
--cic-btn-primary-active:      #009955;                 /* Pressed state */
--cic-btn-primary-disabled:    rgba(0, 255, 136, 0.5); /* 50% opacity */

--cic-btn-secondary-bg:        transparent;             /* No fill */
--cic-btn-secondary-fg:        #00ff88;                 /* Accent text */
--cic-btn-secondary-hover:     var(--color-bg-panel);   /* Light bg */
--cic-btn-secondary-border:    #00ff88;                 /* Accent border */

--cic-btn-padding:             8px 16px;                /* Vertical 8px, horizontal 16px */
--cic-btn-radius:              4px;                     /* Sharp corners */
--cic-btn-min-width:           96px;                    /* Minimum width */
```

**Usage:**
```css
.button-primary {
  background: var(--cic-btn-primary-bg);
  color: var(--cic-btn-primary-fg);
  padding: var(--cic-btn-padding);
  border-radius: var(--cic-btn-radius);
  min-width: var(--cic-btn-min-width);
  border: none;
}
.button-primary:hover { background: var(--cic-btn-primary-hover); }
.button-primary:active { background: var(--cic-btn-primary-active); }
.button-primary:disabled { background: var(--cic-btn-primary-disabled); }

.button-secondary {
  background: var(--cic-btn-secondary-bg);
  color: var(--cic-btn-secondary-fg);
  border: 1px solid var(--cic-btn-secondary-border);
  padding: var(--cic-btn-padding);
  border-radius: var(--cic-btn-radius);
}
.button-secondary:hover { background: var(--cic-btn-secondary-hover); }
```

---

### 3. Row Component (5 tokens)

```css
--cic-row-height:              36px;                    /* Standard row */
--cic-row-padding:             0 12px;                  /* Horizontal only */
--cic-row-gap:                 4px;                     /* Icon/content spacing */
--cic-row-hover-bg:            var(--cic-bg-hover);     /* Hover state */
--cic-row-selected-bg:         var(--cic-bg-selected);  /* Active state */
```

**Usage:**
```css
.agent-row {
  height: var(--cic-row-height);
  padding: var(--cic-row-padding);
  display: flex;
  align-items: center;
  gap: var(--cic-row-gap);
}
.agent-row:hover { background: var(--cic-row-hover-bg); }
.agent-row.selected { background: var(--cic-row-selected-bg); }
```

---

## Phase 2: HIGH (Polish — 1 hour)

### 4. Input Component (5 tokens)

```css
--cic-input-padding:           8px 12px;                /* Compact padding */
--cic-input-radius:            4px;                     /* Match buttons */
--cic-input-border:            #222222;                 /* Dark border */
--cic-input-border-hover:      var(--cic-border-hover); /* Accent on hover */
--cic-input-focus-ring:        2px solid var(--cic-focus-ring);
```

**Usage:**
```css
input, textarea, select {
  padding: var(--cic-input-padding);
  border-radius: var(--cic-input-radius);
  border: 1px solid var(--cic-input-border);
  background: var(--color-bg-panel);
  color: var(--color-text-primary);
}
input:hover { border-color: var(--cic-input-border-hover); }
input:focus-visible {
  outline: var(--cic-input-focus-ring);
  outline-offset: 2px;
}
input:disabled {
  background: var(--cic-bg-disabled);
  border-color: var(--cic-border-disabled);
}
```

---

### 5. Scrollbar Component (3 tokens)

```css
--cic-scrollbar-track:         #111111;                 /* Track background */
--cic-scrollbar-thumb:         #333333;                 /* Handle color */
--cic-scrollbar-thumb-hover:   #444444;                 /* On hover */
```

**Usage:**
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--cic-scrollbar-track); }
::-webkit-scrollbar-thumb {
  background: var(--cic-scrollbar-thumb);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--cic-scrollbar-thumb-hover); }

/* Firefox */
* {
  scrollbar-color: var(--cic-scrollbar-thumb) var(--cic-scrollbar-track);
  scrollbar-width: thin;
}
```

---

### 6. Typography / Type Scale (10 tokens)

```css
/* Font Sizes */
--cic-type-h4:                 1.6rem;                  /* Heading 4 */
--cic-type-h5:                 1.3rem;                  /* Heading 5 */
--cic-type-body-m:             1rem;                    /* Body Medium */
--cic-type-body-s:             0.95rem;                 /* Body Small */
--cic-type-label:              0.7rem;                  /* Label / UI */
--cic-type-caption:            0.85rem;                 /* Caption / hint */

/* Line Heights */
--cic-leading-head:            1.2;                     /* Tight for headings */
--cic-leading-body:            1.5;                     /* Comfortable for body */
--cic-leading-label:           1.4;                     /* Label line height */
--cic-leading-mono:            1.6;                     /* Code/monospace */
```

**Usage:**
```css
.h4 {
  font-size: var(--cic-type-h4);
  line-height: var(--cic-leading-head);
  font-weight: 700;
}
.body-m {
  font-size: var(--cic-type-body-m);
  line-height: var(--cic-leading-body);
  font-weight: 400;
}
.label {
  font-size: var(--cic-type-label);
  line-height: var(--cic-leading-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.code {
  font-size: 12px;
  line-height: var(--cic-leading-mono);
  font-family: var(--font-mono);
}
```

---

## Phase 3: MEDIUM (Extended — 1.5 hours)

### 7. Panel Component (4 tokens)

```css
--cic-panel-bg:                var(--color-bg-panel);   /* #141414 */
--cic-panel-padding:           16px;                    /* Outer spacing */
--cic-panel-border-radius:     4px;                     /* Match buttons */
--cic-panel-elevation:         var(--elevation-med);    /* 6px shadow */
```

**Usage:**
```css
.panel {
  background: var(--cic-panel-bg);
  padding: var(--cic-panel-padding);
  border-radius: var(--cic-panel-border-radius);
  box-shadow: 0 var(--cic-panel-elevation) rgba(0, 0, 0, 0.5);
}
```

---

### 8. Icon Spacing (2 tokens)

```css
--cic-icon-gap:                4px;                     /* Icon to text/content */
--cic-icon-size:               16px;                    /* Standard icon size */
```

**Usage:**
```css
.flex-with-icon {
  display: flex;
  align-items: center;
  gap: var(--cic-icon-gap);
}
.icon {
  width: var(--cic-icon-size);
  height: var(--cic-icon-size);
  flex-shrink: 0;
}
```

---

### 9. Table Component (5 tokens)

```css
--cic-table-header-bg:         var(--color-bg-panel);   /* #141414 */
--cic-table-header-fg:         var(--color-text-muted); /* #888888 */
--cic-table-row-hover-bg:      var(--cic-bg-hover);
--cic-table-border:            #222222;                 /* Dark border */
--cic-table-cell-padding:      8px;                     /* Compact cells */
```

**Usage:**
```css
table {
  width: 100%;
  border-collapse: collapse;
}
table th {
  background: var(--cic-table-header-bg);
  color: var(--cic-table-header-fg);
  padding: var(--cic-table-cell-padding);
  text-align: left;
  font-weight: 600;
}
table td {
  padding: var(--cic-table-cell-padding);
  border: 1px solid var(--cic-table-border);
}
table tr:hover {
  background: var(--cic-table-row-hover-bg);
}
```

---

### 10. Code Block / Monospace (3 tokens)

```css
--cic-code-bg:                 #050505;                 /* Darker background */
--cic-code-fg:                 #e5e5e5;                 /* Light text */
--cic-code-font:               var(--font-mono);        /* JetBrains Mono */
```

**Usage:**
```css
.code-block, .log-output, .terminal {
  background: var(--cic-code-bg);
  color: var(--cic-code-fg);
  font-family: var(--cic-code-font);
  font-size: 12px;
  line-height: var(--cic-leading-mono);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

pre {
  background: var(--cic-code-bg);
  color: var(--cic-code-fg);
  padding: 16px;
  overflow-x: auto;
}
```

---

## Implementation Checklist

**Phase 1 (CRITICAL):**
- [ ] Add 8 interaction state tokens
- [ ] Add 12 button component tokens
- [ ] Add 5 row component tokens
- [ ] Test: AgentList + CicButton visual match

**Phase 2 (HIGH):**
- [ ] Add 5 input component tokens
- [ ] Add 3 scrollbar component tokens
- [ ] Add 10 typography / type scale tokens
- [ ] Test: Form inputs + scrolling behavior

**Phase 3 (MEDIUM):**
- [ ] Add 4 panel component tokens
- [ ] Add 2 icon spacing tokens
- [ ] Add 5 table component tokens
- [ ] Add 3 code block tokens
- [ ] Update all component CSS files to use new tokens
- [ ] Sync tokens.json to match tokens.css

**Validation:**
- [ ] No hardcoded colors in component CSS
- [ ] All tokens referenced in at least one component
- [ ] ESLint rule: no-hardcoded-colors enforced
- [ ] Visual regression test: before/after screenshots match

---

## File Locations

**Primary definition:**
`rewrite-mcp/apps/operator-ui/css/tokens.css` — Edit here, add all 61 tokens to `:root`

**Structured reference (auto-sync after):**
`rewrite-mcp/apps/control-plane/tokens.json` — Update values to match .css

**Components to update:**
- `rewrite-mcp/projects/cic-operator-console/src/components/AgentList/AgentList.css`
- `rewrite-mcp/projects/cic-operator-console/src/components/CicButton/CicButton.css`
- `rewrite-mcp/projects/cic-operator-console/src/components/CicInput/CicInput.css`
- `rewrite-mcp/projects/cic-operator-console/src/components/CicTable/CicTable.css`
- `rewrite-mcp/apps/operator-ui/css/control-room.css`
- All `.css` files in `apps/operator-ui/css/` directory

---

## Copy-Paste Template

```css
:root {
  /* === Phase 1: Interaction States (8) === */
  --cic-bg-hover:          rgba(255, 255, 255, 0.08);
  --cic-bg-selected:       rgba(0, 255, 136, 0.15);
  --cic-bg-disabled:       rgba(255, 255, 255, 0.05);
  --cic-focus-ring:        #00ff88;
  --cic-focus-ring-width:  2px;
  --cic-border-hover:      #00ff88;
  --cic-border-focus:      #00ff88;
  --cic-border-disabled:   rgba(255, 255, 255, 0.1);

  /* === Phase 1: Button Component (12) === */
  --cic-btn-primary-bg:          #00ff88;
  --cic-btn-primary-fg:          #0a0a0a;
  --cic-btn-primary-hover:       #00cc6f;
  --cic-btn-primary-active:      #009955;
  --cic-btn-primary-disabled:    rgba(0, 255, 136, 0.5);
  --cic-btn-secondary-bg:        transparent;
  --cic-btn-secondary-fg:        #00ff88;
  --cic-btn-secondary-hover:     var(--color-bg-panel);
  --cic-btn-secondary-border:    #00ff88;
  --cic-btn-padding:             8px 16px;
  --cic-btn-radius:              4px;
  --cic-btn-min-width:           96px;

  /* === Phase 1: Row Component (5) === */
  --cic-row-height:              36px;
  --cic-row-padding:             0 12px;
  --cic-row-gap:                 4px;
  --cic-row-hover-bg:            var(--cic-bg-hover);
  --cic-row-selected-bg:         var(--cic-bg-selected);

  /* === Phase 2: Input Component (5) === */
  --cic-input-padding:           8px 12px;
  --cic-input-radius:            4px;
  --cic-input-border:            #222222;
  --cic-input-border-hover:      var(--cic-border-hover);
  --cic-input-focus-ring:        2px solid var(--cic-focus-ring);

  /* === Phase 2: Scrollbar Component (3) === */
  --cic-scrollbar-track:         #111111;
  --cic-scrollbar-thumb:         #333333;
  --cic-scrollbar-thumb-hover:   #444444;

  /* === Phase 2: Typography / Type Scale (10) === */
  --cic-type-h4:                 1.6rem;
  --cic-type-h5:                 1.3rem;
  --cic-type-body-m:             1rem;
  --cic-type-body-s:             0.95rem;
  --cic-type-label:              0.7rem;
  --cic-type-caption:            0.85rem;
  --cic-leading-head:            1.2;
  --cic-leading-body:            1.5;
  --cic-leading-label:           1.4;
  --cic-leading-mono:            1.6;

  /* === Phase 3: Panel Component (4) === */
  --cic-panel-bg:                var(--color-bg-panel);
  --cic-panel-padding:           16px;
  --cic-panel-border-radius:     4px;
  --cic-panel-elevation:         var(--elevation-med);

  /* === Phase 3: Icon Spacing (2) === */
  --cic-icon-gap:                4px;
  --cic-icon-size:               16px;

  /* === Phase 3: Table Component (5) === */
  --cic-table-header-bg:         var(--color-bg-panel);
  --cic-table-header-fg:         var(--color-text-muted);
  --cic-table-row-hover-bg:      var(--cic-bg-hover);
  --cic-table-border:            #222222;
  --cic-table-cell-padding:      8px;

  /* === Phase 3: Code Block (3) === */
  --cic-code-bg:                 #050505;
  --cic-code-fg:                 #e5e5e5;
  --cic-code-font:               var(--font-mono);
}
```

---

## Next Steps

1. Copy-paste template above into `tokens.css` `:root`
2. Generate artifact **D** (CIC Token Pack v2.0 TS + CSS) with component patches
3. Update docs **B** (MISSING_TOKENS_FOR_AGENTS_PANEL.md) and **C** (TOKEN_COVERAGE_MATRIX.md)
4. Commit: `[claude] feat(phase-27-4): CIC Design System v2.0 (61 new tokens, full Tier-1 coverage)`

