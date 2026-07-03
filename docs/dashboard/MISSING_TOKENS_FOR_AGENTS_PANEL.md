# Missing Design System Tokens — Agents Panel (Phase 1.5)
**Date:** 2026-06-21  
**Target:** CIC Design System v1.2.0  
**Scope:** Add 28 missing tokens required for Tier-1 compliance

---

## Summary

| Category | Missing | Priority | Effort |
|----------|---------|----------|--------|
| Interaction States | 8 | CRITICAL | 30min |
| Component Colors | 12 | HIGH | 1hr |
| Spacing (Components) | 5 | HIGH | 15min |
| Type Scale (Typography) | 10 | MEDIUM | 30min |
| Scrollbar | 3 | MEDIUM | 10min |
| **TOTAL** | **38** | — | **2hr 25min** |

---

## 1. Interaction State Tokens (CRITICAL — 8 tokens)

Add to `:root` in `rewrite-mcp/apps/operator-ui/css/tokens.css`:

```css
/* Interaction States — Focus, Hover, Active, Disabled */
--cic-bg-hover:          rgba(255, 255, 255, 0.08);    /* 8% white overlay */
--cic-bg-selected:       rgba(0, 255, 136, 0.15);      /* Accent + transparency */
--cic-bg-disabled:       rgba(255, 255, 255, 0.05);    /* 5% white, dimmed */

--cic-focus-ring:        #00ff88;                       /* Accent green */
--cic-focus-ring-width:  2px;                           /* Standard focus width */

--cic-border-hover:      #00ff88;                       /* Accent on hover */
--cic-border-focus:      #00ff88;                       /* Accent on focus */
--cic-border-disabled:   rgba(255, 255, 255, 0.1);     /* 10% white */
```

**Usage:**
```css
.agent-row:hover {
  background: var(--cic-bg-hover);
}
.agent-row.selected {
  background: var(--cic-bg-selected);
}
button:focus-visible {
  outline: var(--cic-focus-ring-width) solid var(--cic-focus-ring);
}
```

---

## 2. Button Component Tokens (HIGH — 12 tokens)

Add to `:root`:

```css
/* Primary Button */
--cic-btn-primary-bg:          #00ff88;                  /* Accent green */
--cic-btn-primary-fg:          #0a0a0a;                 /* Dark text on light bg */
--cic-btn-primary-hover:       #00cc6f;                 /* Secondary accent */
--cic-btn-primary-active:      #009955;                 /* Darker green */
--cic-btn-primary-disabled:    rgba(0, 255, 136, 0.5); /* 50% opacity */

/* Secondary Button */
--cic-btn-secondary-bg:        transparent;             /* No background */
--cic-btn-secondary-fg:        #00ff88;                 /* Accent text */
--cic-btn-secondary-hover:     var(--color-bg-panel);   /* Light background */
--cic-btn-secondary-border:    #00ff88;                 /* Accent border */

/* Button Sizing */
--cic-btn-padding:             8px 16px;                /* Compact: 8px v, 16px h */
--cic-btn-radius:              4px;                     /* Sharp */
--cic-btn-min-width:           96px;                    /* Minimum button width */
```

**Usage:**
```css
.button-primary {
  background: var(--cic-btn-primary-bg);
  color: var(--cic-btn-primary-fg);
  padding: var(--cic-btn-padding);
  border-radius: var(--cic-btn-radius);
  min-width: var(--cic-btn-min-width);
}
.button-primary:hover {
  background: var(--cic-btn-primary-hover);
}
.button-primary:active {
  background: var(--cic-btn-primary-active);
}
.button-primary:disabled {
  background: var(--cic-btn-primary-disabled);
  cursor: not-allowed;
}
```

---

## 3. Row Component Tokens (HIGH — 4 tokens)

Add to `:root`:

```css
/* List Row / Table Row */
--cic-row-height:              36px;                    /* Standard row height */
--cic-row-padding:             0 12px;                  /* Horizontal only */
--cic-row-gap:                 4px;                     /* Icon/content spacing */
--cic-row-hover-bg:            var(--cic-bg-hover);     /* Hover state */
--cic-row-selected-bg:         var(--cic-bg-selected);  /* Selected state */
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
.agent-row:hover {
  background: var(--cic-row-hover-bg);
}
.agent-row.selected {
  background: var(--cic-row-selected-bg);
}
```

---

## 4. Input Component Tokens (HIGH — 5 tokens)

Add to `:root`:

```css
/* Text Input, Textarea, Select */
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
}
input:hover {
  border-color: var(--cic-input-border-hover);
}
input:focus-visible {
  outline: var(--cic-input-focus-ring);
  outline-offset: 2px;
}
```

---

## 5. Scrollbar Component Tokens (MEDIUM — 3 tokens)

Add to `:root`:

```css
/* Scrollbar styling */
--cic-scrollbar-track:         #111111;                 /* Track background */
--cic-scrollbar-thumb:         #333333;                 /* Handle color */
--cic-scrollbar-thumb-hover:   #444444;                 /* Handle on hover */
```

**Usage:**
```css
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--cic-scrollbar-track);
}
::-webkit-scrollbar-thumb {
  background: var(--cic-scrollbar-thumb);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--cic-scrollbar-thumb-hover);
}

/* Firefox */
* {
  scrollbar-color: var(--cic-scrollbar-thumb) var(--cic-scrollbar-track);
  scrollbar-width: thin;
}
```

---

## 6. Typography Type Scale Tokens (MEDIUM — 10 tokens)

**Current location:** `colors_and_type.css` (17-110, not in tokens.css)  
**Action:** Copy to tokens.css for single source of truth

Add to `:root`:

```css
/* Type Scale */
--cic-type-h4:                 1.6rem;                  /* Heading 4 */
--cic-type-h5:                 1.3rem;                  /* Heading 5 */
--cic-type-body-m:             1rem;                    /* Body Medium */
--cic-type-body-s:             0.95rem;                 /* Body Small */
--cic-type-label:              0.7rem;                  /* Label */
--cic-type-caption:            0.85rem;                 /* Caption */

/* Line Heights */
--cic-leading-head:            1.2;                     /* Heading line height */
--cic-leading-body:            1.5;                     /* Body line height */
--cic-leading-label:           1.4;                     /* Label line height */

/* Font Families (references) */
--cic-font-mono:               var(--font-mono);        /* JetBrains Mono */
--cic-font-ui:                 var(--font-body);        /* Barlow (UI font) */
```

**Usage:**
```css
.heading-h4 {
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
```

---

## 7. Panel Component Tokens (MEDIUM — 2 tokens)

Add to `:root`:

```css
/* Panel (already defined but need aliases for clarity) */
--cic-panel-bg:                var(--color-bg-panel);   /* #141414 */
--cic-panel-padding:           16px;                    /* Outer: space-md */
--cic-panel-border-radius:     4px;                     /* radius-sm */
--cic-panel-elevation:         var(--elevation-med);    /* 6px shadow */
```

---

## 8. Icon Spacing Tokens (MEDIUM — 2 tokens)

Add to `:root`:

```css
/* Icon Gap (used throughout) */
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
}
```

---

## 9. Table Component Tokens (MEDIUM — 5 tokens)

Add to `:root`:

```css
/* Table styling */
--cic-table-header-bg:         var(--color-bg-panel);   /* #141414 */
--cic-table-header-fg:         var(--color-text-muted); /* #888888 */
--cic-table-row-hover-bg:      var(--cic-bg-hover);
--cic-table-border:            #222222;                 /* Dark border */
--cic-table-cell-padding:      8px;                     /* Compact cells */
```

**Usage:**
```css
table th {
  background: var(--cic-table-header-bg);
  color: var(--cic-table-header-fg);
  padding: var(--cic-table-cell-padding);
}
table tr:hover {
  background: var(--cic-table-row-hover-bg);
}
table td {
  padding: var(--cic-table-cell-padding);
  border: 1px solid var(--cic-table-border);
}
```

---

## 10. Code Block / Monospace Tokens (LOW — 3 tokens)

Add to `:root`:

```css
/* Code blocks, logs, terminals */
--cic-code-bg:                 #050505;                 /* Darker background */
--cic-code-fg:                 #e5e5e5;                 /* Light text */
--cic-code-font:               var(--font-mono);        /* JetBrains Mono */
```

**Usage:**
```css
.code-block, .log-output {
  background: var(--cic-code-bg);
  color: var(--cic-code-fg);
  font-family: var(--cic-code-font);
  font-size: 12px;
  padding: 12px;
  overflow-x: auto;
}
```

---

## Implementation Order (Recommended)

### Phase 1: CRITICAL (30 min) — Blocking Agents Panel
1. Add interaction state tokens (Section 1)
2. Add button component tokens (Section 2)
3. Add row component tokens (Section 3)

### Phase 2: HIGH (1 hr) — Polish & Completeness
4. Add input component tokens (Section 4)
5. Add type scale tokens (Section 6)
6. Add scrollbar tokens (Section 5)

### Phase 3: MEDIUM (45 min) — Extended Coverage
7. Add remaining component tokens (Sections 7-10)
8. Update tokens.json to match tokens.css
9. Create alias layer (--cic-* → --color-* mapping)

---

## File Locations

**Primary token definition:**
- `rewrite-mcp/apps/operator-ui/css/tokens.css` — Edit here

**Source of truth (JSON):**
- `rewrite-mcp/apps/control-plane/tokens.json` — Update to match

**Type scale source (legacy):**
- `rewrite-mcp/apps/operator-ui/css/colors_and_type.css` — Lines 64-95 (copy from here)

**Components that reference tokens:**
- `rewrite-mcp/projects/cic-operator-console/src/App.css`
- `rewrite-mcp/projects/cic-operator-console/src/index.css`
- All React component .css files

---

## Validation Checklist

After adding all tokens:

- [ ] tokens.css contains all 38 new tokens
- [ ] tokens.json updated to match
- [ ] No token name conflicts
- [ ] All tokens have documented usage
- [ ] ESLint rule added: `no-hardcoded-colors` (use tokens instead)
- [ ] Agents Panel components updated to use new tokens
- [ ] Visual regression test: compare before/after screenshots

---

## Next: Agents Panel Implementation

Once tokens added, update Agents Panel components:
1. AgentList.css — use --cic-row-* tokens
2. Button.css — use --cic-btn-* tokens
3. Input.css — use --cic-input-* tokens
4. Scrolling.css — use --cic-scrollbar-* tokens
5. Typography — use --cic-type-* tokens

Total changes: ~8 component files, ~150 lines modified.

