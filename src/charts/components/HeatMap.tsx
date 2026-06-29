import React, { useMemo } from 'react';
import { scaleLinear } from '@visx/scale';
import { chartTokens } from '../tokens/chart-scales';
import { useChartDimensions } from '../hooks/useChartDimensions';
import '../tokens/chart-colors.css';

export interface HeatMapDataPoint {
  row: string;
  col: string;
  value: number;
}

export interface HeatMapProps {
  data: HeatMapDataPoint[];
  title?: string;
  height?: number;
  colorScale?: (value: number) => string;
}

const defaultColorScale = (value: number): string => {
  const normalized = Math.max(0, Math.min(1, value));
  const hue = (1 - normalized) * 240;
  return `hsl(${hue}, 100%, 50%)`;
};

export const HeatMap = React.forwardRef<HTMLDivElement, HeatMapProps>(
  (
    {
      data,
      title,
      height = 400,
      colorScale = defaultColorScale,
    },
    ref,
  ) => {
    const { width, height: measuredHeight, ref: dimRef } = useChartDimensions();
    const finalHeight = height > 0 ? height : measuredHeight;
    const finalWidth = width > 0 ? width : 800;

    const { rows, cols, cellWidth, cellHeight, valueScale } = useMemo(() => {
      if (!data || data.length === 0) {
        return { rows: [], cols: [], cellWidth: 0, cellHeight: 0, valueScale: scaleLinear({ domain: [0, 1], range: [0, 1] }) };
      }

      const uniqueRows = Array.from(new Set(data.map((d) => d.row)));
      const uniqueCols = Array.from(new Set(data.map((d) => d.col)));
      const values = data.map((d) => d.value);

      const cw = (finalWidth - chartTokens.margins.left - chartTokens.margins.right) / uniqueCols.length;
      const ch = (finalHeight - (title ? 32 : 0) - chartTokens.margins.top - chartTokens.margins.bottom) / uniqueRows.length;

      const vs = scaleLinear({
        domain: [Math.min(...values), Math.max(...values)],
        range: [0, 1],
      });

      return {
        rows: uniqueRows,
        cols: uniqueCols,
        cellWidth: cw,
        cellHeight: ch,
        valueScale: vs,
      };
    }, [data, finalWidth, finalHeight, title]);

    if (!data || data.length === 0) {
      return (
        <div ref={dimRef || ref} style={{ width: '100%', height: finalHeight }} className="chart-wrapper">
          <div style={{ padding: '20px', textAlign: 'center' }}>No data available</div>
        </div>
      );
    }

    const dataMap = new Map(data.map((d) => [`${d.row}:${d.col}`, d.value]));

    return (
      <div ref={dimRef || ref} style={{ width: '100%', height: finalHeight }} className="chart-wrapper">
        {title && <h3 style={{ margin: '8px 16px 0', fontSize: '14px', fontWeight: 600 }}>{title}</h3>}
        <svg
          width={finalWidth}
          height={finalHeight - (title ? 32 : 0)}
        >
          <g transform={`translate(${chartTokens.margins.left},${chartTokens.margins.top})`}>
            {rows.map((row, ri) =>
              cols.map((col, ci) => {
                const value = dataMap.get(`${row}:${col}`) ?? 0;
                const normalized = valueScale(value);
                const color = colorScale(normalized);

                return (
                  <g key={`${row}-${col}`}>
                    <rect
                      x={ci * cellWidth}
                      y={ri * cellHeight}
                      width={cellWidth}
                      height={cellHeight}
                      fill={color}
                      stroke={chartTokens.colors.neutral}
                      strokeWidth={1}
                    />
                    {cellWidth > 30 && cellHeight > 30 && (
                      <text
                        x={ci * cellWidth + cellWidth / 2}
                        y={ri * cellHeight + cellHeight / 2}
                        textAnchor="middle"
                        dy="0.33em"
                        className="chart-axis-label"
                        fontSize={10}
                      >
                        {value.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              }),
            )}
          </g>

          {/* Row labels */}
          <g>
            {rows.map((row, i) => (
              <text
                key={`row-${i}`}
                x={chartTokens.margins.left - 8}
                y={chartTokens.margins.top + i * cellHeight + cellHeight / 2}
                textAnchor="end"
                dy="0.33em"
                className="chart-axis-label"
                fontSize={11}
              >
                {row}
              </text>
            ))}
          </g>

          {/* Column labels */}
          <g>
            {cols.map((col, i) => (
              <text
                key={`col-${i}`}
                x={chartTokens.margins.left + i * cellWidth + cellWidth / 2}
                y={chartTokens.margins.top - 8}
                textAnchor="middle"
                className="chart-axis-label"
                fontSize={11}
              >
                {col}
              </text>
            ))}
          </g>
        </svg>
      </div>
    );
  },
);

HeatMap.displayName = 'HeatMap';
