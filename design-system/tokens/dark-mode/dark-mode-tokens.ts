export const darkModeTokens = {
  // Surface elevation layers
  surfaceLayer0: '#0a0a0a', // Base background
  surfaceLayer1: '#1a1a1a', // Panels
  surfaceLayer2: '#262626', // Modals
  surfaceLayer3: '#323232', // Dropdowns

  // Text colors for dark backgrounds
  textPrimary: '#f3f4f6',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  textDisabled: '#6b7280',

  // Accent colors (brightened for dark mode)
  accentLight: '#60a5fa', // Primary (light)
  successLight: '#34d399', // Success (light)
  warningLight: '#fbbf24', // Warning (light)
  errorLight: '#f87171', // Error (light)
  infoLight: '#22d3ee', // Info (light)

  // Focus ring (brighter for dark backgrounds)
  focusRing: '#93c5fd', // Brighter accent for focus

  // Borders
  borderLight: '#374151', // Lighter borders on dark
  borderLighter: '#4b5563', // Even lighter for contrast

  // Overlay/backdrop
  backdropLight: 'rgba(0, 0, 0, 0.5)',
};

export const darkModeLayerMap = {
  0: darkModeTokens.surfaceLayer0,
  1: darkModeTokens.surfaceLayer1,
  2: darkModeTokens.surfaceLayer2,
  3: darkModeTokens.surfaceLayer3,
};

export const darkModeComponentDefaults = {
  sidebar: 'layer-1',
  mainContent: 'layer-0',
  modal: 'layer-2',
  dropdown: 'layer-3',
  card: 'layer-1',
  panel: 'layer-1',
};
