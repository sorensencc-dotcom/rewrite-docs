import React from 'react';
import { DataPoint } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export interface LineChartProps {
    data: DataPoint[];
    xAccessor?: (d: DataPoint) => number | string | Date;
    yAccessor?: (d: DataPoint) => number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    height?: number;
    color?: string;
}
export declare const LineChart: React.ForwardRefExoticComponent<LineChartProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=LineChart.d.ts.map