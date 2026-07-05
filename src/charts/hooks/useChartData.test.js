import { renderHook } from '@testing-library/react';
import { useChartData } from './useChartData';
describe('useChartData', () => {
    it('returns normalized domains for valid data', () => {
        const data = [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 15 },
        ];
        const { result } = renderHook(() => useChartData({
            data,
            xAccessor: (d) => d.x,
            yAccessor: (d) => d.y,
        }));
        expect(result.current.xDomain).toEqual([0, 2]);
        expect(result.current.yDomain).toEqual([10, 20]);
        expect(result.current.yExtent[0]).toBe(10);
        expect(result.current.yExtent[1]).toBeGreaterThan(20);
    });
    it('handles empty data', () => {
        const { result } = renderHook(() => useChartData({
            data: [],
            xAccessor: (d) => d.x,
            yAccessor: (d) => d.y,
        }));
        expect(result.current.data).toEqual([]);
        expect(result.current.xDomain).toEqual([0, 1]);
        expect(result.current.yDomain).toEqual([0, 1]);
    });
    it('memoizes results when data does not change', () => {
        const data = [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
        ];
        const xAccessor = (d) => d.x;
        const yAccessor = (d) => d.y;
        const { result, rerender } = renderHook(() => useChartData({ data, xAccessor, yAccessor }), { initialProps: { data, xAccessor, yAccessor } });
        const firstResult = result.current;
        rerender();
        const secondResult = result.current;
        expect(firstResult.xDomain).toEqual(secondResult.xDomain);
    });
    it('handles negative values', () => {
        const data = [
            { x: -5, y: -10 },
            { x: 0, y: 5 },
            { x: 5, y: 20 },
        ];
        const { result } = renderHook(() => useChartData({
            data,
            xAccessor: (d) => d.x,
            yAccessor: (d) => d.y,
        }));
        expect(result.current.xDomain[0]).toBe(-5);
        expect(result.current.yDomain[0]).toBe(-10);
    });
});
//# sourceMappingURL=useChartData.test.js.map