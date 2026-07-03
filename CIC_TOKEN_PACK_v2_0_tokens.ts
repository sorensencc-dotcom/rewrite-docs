/**
 * CIC Design Tokens — TypeScript Exports (v2.0.0)
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at: 2026-06-21T00:00:00.000Z
 *
 * Usage:
 *   import { colors, spacing, typography } from './tokens';
 *   <div style={{ background: colors.interaction.hover }} />
 */

/* ===== COLOR TOKENS ===== */

export const colors = {
  base: {
    primary: '#0a0a0a',
    secondary: '#111111',
    panel: '#141414',
  },
  accent: {
    primary: '#00ff88',
    secondary: '#00cc6f',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    muted: '#888888',
  },
  status: {
    online: '#00ff88',
    degraded: '#ffaa00',
    down: '#ff4444',
    pending: '#888888',
  },
  alert: {
    info: '#4da6ff',
    warn: '#ffaa00',
    error: '#ff4444',
    success: '#00ff88',
  },
  interaction: {
    bgHover: 'rgba(255, 255, 255, 0.08)',
    bgSelected: 'rgba(0, 255, 136, 0.15)',
    bgDisabled: 'rgba(255, 255, 255, 0.05)',
    focusRing: '#00ff88',
    borderHover: '#00ff88',
    borderFocus: '#00ff88',
    borderDisabled: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    primary: {
      bg: '#00ff88',
      fg: '#0a0a0a',
      hover: '#00cc6f',
      active: '#009955',
      disabled: 'rgba(0, 255, 136, 0.5)',
    },
    secondary: {
      bg: 'transparent',
      fg: '#00ff88',
      hover: '#141414',
      border: '#00ff88',
    },
  },
  scrollbar: {
    track: '#111111',
    thumb: '#333333',
    thumbHover: '#444444',
  },
  input: {
    border: '#222222',
    borderHover: '#00ff88',
  },
  code: {
    bg: '#050505',
    fg: '#e5e5e5',
  },
  table: {
    border: '#222222',
  },
};

/* ===== SPACING TOKENS ===== */

export const spacing = {
  scale: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  layout: {
    loginCardWidth: '360px',
    sidebarWidth: '260px',
    headerHeight: '52px',
    nodeSize: '80px',
  },
  component: {
    buttonPadding: '8px 16px',
    rowPadding: '0 12px',
    rowGap: '4px',
    iconGap: '4px',
    inputPadding: '8px 12px',
    panelPadding: '16px',
    tableCellPadding: '8px',
  },
  row: {
    height: '36px',
  },
};

/* ===== TYPOGRAPHY TOKENS ===== */

export const typography = {
  fontFamily: {
    heading: 'Playfair Display',
    subheading: 'Baskerville',
    body: 'Barlow',
    mono: 'JetBrains Mono',
  },
  scale: {
    h4: '1.6rem',
    h5: '1.3rem',
    bodyM: '1rem',
    bodyS: '0.95rem',
    label: '0.7rem',
    caption: '0.85rem',
  },
  lineHeight: {
    head: 1.2,
    body: 1.5,
    label: 1.4,
    mono: 1.6,
  },
};

/* ===== BORDER RADIUS TOKENS ===== */

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
};

/* ===== ELEVATION / SHADOW TOKENS ===== */

export const elevation = {
  none: '0px',
  low: '2px',
  med: '6px',
  high: '12px',
};

/* ===== COMPONENT TOKENS ===== */

export const component = {
  button: {
    padding: '8px 16px',
    radius: '4px',
    minWidth: '96px',
  },
  row: {
    height: '36px',
    padding: '0 12px',
    gap: '4px',
  },
  input: {
    padding: '8px 12px',
    radius: '4px',
    border: '#222222',
    focusRing: '2px solid #00ff88',
  },
  panel: {
    padding: '16px',
    borderRadius: '4px',
  },
  table: {
    headerBg: '#141414',
    headerFg: '#888888',
    rowHoverBg: 'rgba(255, 255, 255, 0.08)',
    border: '#222222',
    cellPadding: '8px',
  },
  code: {
    bg: '#050505',
    fg: '#e5e5e5',
    fontFamily: 'JetBrains Mono',
  },
};

/* ===== FOCUS & INTERACTION TOKENS ===== */

export const interaction = {
  focusRing: {
    color: '#00ff88',
    width: '2px',
  },
  hover: {
    bg: 'rgba(255, 255, 255, 0.08)',
    border: '#00ff88',
  },
  active: {
    bg: 'rgba(0, 255, 136, 0.15)',
  },
  disabled: {
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

/* ===== CONVENIENCE EXPORTS ===== */

export const token = {
  colors,
  spacing,
  typography,
  radius,
  elevation,
  component,
  interaction,
} as const;

/**
 * CSSVariable utility — convert token to CSS custom property name
 * @example toCSSVar('colors.interaction.hover') => '--cic-bg-hover'
 */
export function toCSSVar(path: string): string {
  const parts = path.split('.');
  return `--${parts.join('-').toLowerCase()}`;
}

/**
 * CSSValue utility — get CSS variable reference
 * @example cssValue('colors.interaction.hover') => 'var(--cic-bg-hover)'
 */
export function cssValue(path: string): string {
  return `var(${toCSSVar(path)})`;
}

/**
 * Quick access to CSS custom properties
 * @example cssVar('btn-primary-bg') => 'var(--cic-btn-primary-bg)'
 */
export const cssVar = {
  // Interaction States
  bgHover: 'var(--cic-bg-hover)',
  bgSelected: 'var(--cic-bg-selected)',
  bgDisabled: 'var(--cic-bg-disabled)',
  focusRing: 'var(--cic-focus-ring)',
  focusRingWidth: 'var(--cic-focus-ring-width)',
  borderHover: 'var(--cic-border-hover)',
  borderFocus: 'var(--cic-border-focus)',
  borderDisabled: 'var(--cic-border-disabled)',

  // Button
  btnPrimaryBg: 'var(--cic-btn-primary-bg)',
  btnPrimaryFg: 'var(--cic-btn-primary-fg)',
  btnPrimaryHover: 'var(--cic-btn-primary-hover)',
  btnPrimaryActive: 'var(--cic-btn-primary-active)',
  btnPrimaryDisabled: 'var(--cic-btn-primary-disabled)',
  btnSecondaryBg: 'var(--cic-btn-secondary-bg)',
  btnSecondaryFg: 'var(--cic-btn-secondary-fg)',
  btnSecondaryHover: 'var(--cic-btn-secondary-hover)',
  btnSecondaryBorder: 'var(--cic-btn-secondary-border)',
  btnPadding: 'var(--cic-btn-padding)',
  btnRadius: 'var(--cic-btn-radius)',
  btnMinWidth: 'var(--cic-btn-min-width)',

  // Row
  rowHeight: 'var(--cic-row-height)',
  rowPadding: 'var(--cic-row-padding)',
  rowGap: 'var(--cic-row-gap)',
  rowHoverBg: 'var(--cic-row-hover-bg)',
  rowSelectedBg: 'var(--cic-row-selected-bg)',

  // Input
  inputPadding: 'var(--cic-input-padding)',
  inputRadius: 'var(--cic-input-radius)',
  inputBorder: 'var(--cic-input-border)',
  inputBorderHover: 'var(--cic-input-border-hover)',
  inputFocusRing: 'var(--cic-input-focus-ring)',

  // Scrollbar
  scrollbarTrack: 'var(--cic-scrollbar-track)',
  scrollbarThumb: 'var(--cic-scrollbar-thumb)',
  scrollbarThumbHover: 'var(--cic-scrollbar-thumb-hover)',

  // Typography
  typeH4: 'var(--cic-type-h4)',
  typeH5: 'var(--cic-type-h5)',
  typeBodyM: 'var(--cic-type-body-m)',
  typeBodyS: 'var(--cic-type-body-s)',
  typeLabel: 'var(--cic-type-label)',
  typeCaption: 'var(--cic-type-caption)',
  leadingHead: 'var(--cic-leading-head)',
  leadingBody: 'var(--cic-leading-body)',
  leadingLabel: 'var(--cic-leading-label)',
  leadingMono: 'var(--cic-leading-mono)',

  // Panel
  panelBg: 'var(--cic-panel-bg)',
  panelPadding: 'var(--cic-panel-padding)',
  panelBorderRadius: 'var(--cic-panel-border-radius)',
  panelElevation: 'var(--cic-panel-elevation)',

  // Icon
  iconGap: 'var(--cic-icon-gap)',
  iconSize: 'var(--cic-icon-size)',

  // Table
  tableHeaderBg: 'var(--cic-table-header-bg)',
  tableHeaderFg: 'var(--cic-table-header-fg)',
  tableRowHoverBg: 'var(--cic-table-row-hover-bg)',
  tableBorder: 'var(--cic-table-border)',
  tableCellPadding: 'var(--cic-table-cell-padding)',

  // Code
  codeBg: 'var(--cic-code-bg)',
  codeFg: 'var(--cic-code-fg)',
  codeFont: 'var(--cic-code-font)',
} as const;
