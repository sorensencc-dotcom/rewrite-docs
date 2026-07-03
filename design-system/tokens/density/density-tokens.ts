// Density system configuration (3 modes: compact, cozy, comfortable)

export type DensityLevel = 'compact' | 'cozy' | 'comfortable';

export const densityFactors: Record<DensityLevel, number> = {
  compact: 0.8,
  cozy: 1.0,
  comfortable: 1.4,
};

export interface DensityTokens {
  factor: number;
  spacingDensity: string; // CSS calc() value
  buttonPaddingVertical: number;
  buttonPaddingHorizontal: number;
  inputHeight: number;
  inputPaddingVertical: number;
  inputPaddingHorizontal: number;
  panelPadding: number;
  rowPaddingVertical: number;
  tableRowHeight: number;
  tableRowPaddingVertical: number;
  tableRowPaddingHorizontal: number;
  scrollbarThumb: number;
}

export const densityTokensByMode: Record<DensityLevel, DensityTokens> = {
  compact: {
    factor: 0.8,
    spacingDensity: 'calc(12px * 0.8)',
    buttonPaddingVertical: 8,
    buttonPaddingHorizontal: 12,
    inputHeight: 32,
    inputPaddingVertical: 6,
    inputPaddingHorizontal: 10,
    panelPadding: 8,
    rowPaddingVertical: 4,
    tableRowHeight: 32,
    tableRowPaddingVertical: 4,
    tableRowPaddingHorizontal: 8,
    scrollbarThumb: 8,
  },
  cozy: {
    factor: 1.0,
    spacingDensity: 'calc(12px * 1.0)',
    buttonPaddingVertical: 12,
    buttonPaddingHorizontal: 16,
    inputHeight: 40,
    inputPaddingVertical: 10,
    inputPaddingHorizontal: 14,
    panelPadding: 12,
    rowPaddingVertical: 8,
    tableRowHeight: 40,
    tableRowPaddingVertical: 8,
    tableRowPaddingHorizontal: 12,
    scrollbarThumb: 10,
  },
  comfortable: {
    factor: 1.4,
    spacingDensity: 'calc(12px * 1.4)',
    buttonPaddingVertical: 16,
    buttonPaddingHorizontal: 20,
    inputHeight: 48,
    inputPaddingVertical: 14,
    inputPaddingHorizontal: 18,
    panelPadding: 16,
    rowPaddingVertical: 12,
    tableRowHeight: 48,
    tableRowPaddingVertical: 12,
    tableRowPaddingHorizontal: 16,
    scrollbarThumb: 12,
  },
};

export function getDensityTokens(mode: DensityLevel): DensityTokens {
  return densityTokensByMode[mode];
}

export function calculateDensitySpacing(base: number, mode: DensityLevel): number {
  return Math.round(base * densityFactors[mode]);
}
