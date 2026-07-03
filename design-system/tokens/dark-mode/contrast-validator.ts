// WCAG contrast ratio calculator and validator

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(foreground: string, background: string): number {
  const [r1, g1, b1] = hexToRgb(foreground);
  const [r2, g2, b2] = hexToRgb(background);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function isWCAGAA(ratio: number): boolean {
  return ratio >= 4.5; // WCAG AA minimum for normal text
}

export function isWCAGAAA(ratio: number): boolean {
  return ratio >= 7; // WCAG AAA minimum
}

export function validateContrastPair(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { ratio: number; valid: boolean; message: string } {
  const ratio = getContrastRatio(foreground, background);
  const validator = level === 'AA' ? isWCAGAA : isWCAGAAA;
  const valid = validator(ratio);
  const minRatio = level === 'AA' ? 4.5 : 7;

  return {
    ratio: Math.round(ratio * 100) / 100,
    valid,
    message: valid
      ? `✓ WCAG ${level} contrast ratio: ${ratio.toFixed(2)}:1 (minimum: ${minRatio}:1)`
      : `✗ Fails WCAG ${level} contrast ratio: ${ratio.toFixed(2)}:1 (minimum: ${minRatio}:1)`,
  };
}

export const darkModeContrastTests = {
  textOnLayer0: {
    foreground: '#f3f4f6', // --cic-color-text
    background: '#0a0a0a', // layer-0
  },
  textOnLayer1: {
    foreground: '#f3f4f6',
    background: '#1a1a1a', // layer-1
  },
  textOnLayer2: {
    foreground: '#f3f4f6',
    background: '#262626', // layer-2
  },
  textOnLayer3: {
    foreground: '#f3f4f6',
    background: '#323232', // layer-3
  },
  secondaryTextOnLayer1: {
    foreground: '#d1d5db', // text-secondary
    background: '#1a1a1a',
  },
};

export function validateDarkModeContrast(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  let failed = 0;

  Object.entries(darkModeContrastTests).forEach(([name, { foreground, background }]) => {
    const result = validateContrastPair(foreground, background, 'AA');
    if (result.valid) {
      passed++;
    } else {
      failed++;
      failures.push(`${name}: ${result.message}`);
    }
  });

  return { passed, failed, failures };
}
