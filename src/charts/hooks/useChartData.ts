import { useMemo } from 'react';

export interface DataPoint {
  x: number | string | Date;
  y: number;
  [key: string]: any;
}

export interface ChartDataConfig {
  data: DataPoint[];
  xAccessor: (d: DataPoint) => number | string | Date;
  yAccessor: (d: DataPoint) => number;
}

export function useChartData(config: ChartDataConfig) {
  const { data, xAccessor, yAccessor } = config;

  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        data: [],
        xDomain: [0, 1],
        yDomain: [0, 1],
        xExtent: [0, 1],
        yExtent: [0, 1],
      };
    }

    const xValues = data.map(xAccessor);
    const yValues = data.map(yAccessor);

    const xMin = typeof xValues[0] === 'number' ? Math.min(...(xValues as number[])) : 0;
    const xMax = typeof xValues[0] === 'number' ? Math.max(...(xValues as number[])) : xValues.length - 1;
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    return {
      data,
      xDomain: [xMin, xMax],
      yDomain: [yMin, yMax],
      xExtent: [xMin, xMax],
      yExtent: [yMin, Math.max(yMax * 1.1, yMax + 1)],
    };
  }, [data, xAccessor, yAccessor]);
}
