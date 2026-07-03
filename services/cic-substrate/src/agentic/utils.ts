// Shared utilities for agentic layer

export function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min));
}
