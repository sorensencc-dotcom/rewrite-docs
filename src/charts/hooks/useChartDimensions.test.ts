import { renderHook } from '@testing-library/react';
import { useChartDimensions } from './useChartDimensions';

describe('useChartDimensions', () => {
  it('returns default dimensions initially', () => {
    const { result } = renderHook(() => useChartDimensions());

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(400);
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('provides a ref for chart container', () => {
    const { result } = renderHook(() => useChartDimensions());

    expect(result.current.ref).toHaveProperty('current');
  });

  it('handles dimension updates via ResizeObserver', () => {
    const { result } = renderHook(() => useChartDimensions());

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(400);
  });

  it('enforces minimum dimensions', () => {
    const { result } = renderHook(() => useChartDimensions());

    expect(result.current.width).toBeGreaterThanOrEqual(100);
    expect(result.current.height).toBeGreaterThanOrEqual(100);
  });
});
