import React from 'react';
import { DataPoint } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export interface ScatterChartProps {
    data: DataPoint[];
    xAccessor?: (d: DataPoint) => number;
    yAccessor?: (d: DataPoint) => number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    height?: number;
    color?: string;
}
export declare const ScatterChart: React.ForwardRefExoticComponent<ScatterChartProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ScatterChart.d.ts.map