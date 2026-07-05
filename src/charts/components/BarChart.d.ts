import React from 'react';
import { DataPoint } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export interface BarChartProps {
    data: DataPoint[];
    xAccessor?: (d: DataPoint) => number | string;
    yAccessor?: (d: DataPoint) => number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    height?: number;
    color?: string;
}
export declare const BarChart: React.ForwardRefExoticComponent<BarChartProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=BarChart.d.ts.map