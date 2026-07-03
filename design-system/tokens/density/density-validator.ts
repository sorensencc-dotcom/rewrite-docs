// Density system validator - ensures calculations are correct

import { densityTokensByMode, DensityLevel, densityFactors } from './density-tokens';

export interface DensityValidationResult {
  valid: boolean;
  mode: DensityLevel;
  factor: number;
  tests: {
    name: string;
    actual: number;
    expected: number;
    pass: boolean;
  }[];
  failures: string[];
}

export function validateDensityMode(mode: DensityLevel): DensityValidationResult {
  const tokens = densityTokensByMode[mode];
  const factor = densityFactors[mode];
  const failures: string[] = [];
  const tests: DensityValidationResult['tests'] = [];

  // Test 1: Density factor is correct
  if (tokens.factor !== factor) {
    failures.push(`Factor mismatch: tokens.factor=${tokens.factor}, expected=${factor}`);
  }
  tests.push({
    name: 'Density factor',
    actual: tokens.factor,
    expected: factor,
    pass: tokens.factor === factor,
  });

  // Test 2: Button padding vertical
  const expectedButtonPadV = Math.round(12 * factor);
  if (tokens.buttonPaddingVertical !== expectedButtonPadV) {
    failures.push(
      `Button padding (vertical): expected 12px * ${factor} = ${expectedButtonPadV}px, got ${tokens.buttonPaddingVertical}px`
    );
  }
  tests.push({
    name: 'Button padding (vertical)',
    actual: tokens.buttonPaddingVertical,
    expected: expectedButtonPadV,
    pass: tokens.buttonPaddingVertical === expectedButtonPadV,
  });

  // Test 3: Input height
  const baseInputHeight = 40; // cozy base
  const expectedInputHeight = Math.round(baseInputHeight * factor);
  if (tokens.inputHeight !== expectedInputHeight) {
    failures.push(`Input height: expected 40px * ${factor} = ${expectedInputHeight}px, got ${tokens.inputHeight}px`);
  }
  tests.push({
    name: 'Input height',
    actual: tokens.inputHeight,
    expected: expectedInputHeight,
    pass: tokens.inputHeight === expectedInputHeight,
  });

  // Test 4: Table row height
  const baseRowHeight = 40; // cozy base
  const expectedRowHeight = Math.round(baseRowHeight * factor);
  if (tokens.tableRowHeight !== expectedRowHeight) {
    failures.push(
      `Table row height: expected 40px * ${factor} = ${expectedRowHeight}px, got ${tokens.tableRowHeight}px`
    );
  }
  tests.push({
    name: 'Table row height',
    actual: tokens.tableRowHeight,
    expected: expectedRowHeight,
    pass: tokens.tableRowHeight === expectedRowHeight,
  });

  // Test 5: Panel padding
  const expectedPanelPadding = Math.round(12 * factor);
  if (tokens.panelPadding !== expectedPanelPadding) {
    failures.push(
      `Panel padding: expected 12px * ${factor} = ${expectedPanelPadding}px, got ${tokens.panelPadding}px`
    );
  }
  tests.push({
    name: 'Panel padding',
    actual: tokens.panelPadding,
    expected: expectedPanelPadding,
    pass: tokens.panelPadding === expectedPanelPadding,
  });

  // Test 6: Scrollbar thumb width
  const expectedScrollbarThumb = Math.round(10 * factor);
  if (tokens.scrollbarThumb !== expectedScrollbarThumb) {
    failures.push(
      `Scrollbar thumb: expected 10px * ${factor} = ${expectedScrollbarThumb}px, got ${tokens.scrollbarThumb}px`
    );
  }
  tests.push({
    name: 'Scrollbar thumb',
    actual: tokens.scrollbarThumb,
    expected: expectedScrollbarThumb,
    pass: tokens.scrollbarThumb === expectedScrollbarThumb,
  });

  return {
    valid: failures.length === 0,
    mode,
    factor,
    tests,
    failures,
  };
}

export function validateAllDensityModes(): {
  allValid: boolean;
  results: DensityValidationResult[];
  summary: string;
} {
  const results: DensityValidationResult[] = [];
  const modes: DensityLevel[] = ['compact', 'cozy', 'comfortable'];

  for (const mode of modes) {
    results.push(validateDensityMode(mode));
  }

  const allValid = results.every((r) => r.valid);
  const passed = results.filter((r) => r.valid).length;
  const total = results.length;
  const summary = `${passed}/${total} density modes valid`;

  return {
    allValid,
    results,
    summary,
  };
}

export function printDensityValidation(result: DensityValidationResult): string {
  const status = result.valid ? '✓' : '✗';
  const lines: string[] = [`${status} Density Mode: ${result.mode.toUpperCase()} (factor: ${result.factor})`];

  result.tests.forEach((test) => {
    const testStatus = test.pass ? '✓' : '✗';
    lines.push(`  ${testStatus} ${test.name}: ${test.actual}px (expected ${test.expected}px)`);
  });

  if (result.failures.length > 0) {
    lines.push(`  Failures:`);
    result.failures.forEach((f) => lines.push(`    - ${f}`));
  }

  return lines.join('\n');
}

export function printAllDensityValidation(): string {
  const validation = validateAllDensityModes();
  const lines: string[] = [
    `=== Density System Validation ===`,
    validation.summary,
    '',
  ];

  validation.results.forEach((result) => {
    lines.push(printDensityValidation(result));
  });

  if (validation.allValid) {
    lines.push(`✓ All density modes valid!`);
  } else {
    lines.push(`✗ Some density modes failed validation.`);
  }

  return lines.join('\n');
}
