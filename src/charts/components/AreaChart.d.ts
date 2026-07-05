import React from 'react';
import { DataPoint } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export interface AreaChartProps {
    data: DataPoint[];
    xAccessor?: (d: DataPoint) => number | string | Date;
    yAccessor?: (d: DataPoint) => number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    height?: number;
    color?: string;
}
export declare const AreaChart: React.ForwardRefExoticComponent<AreaChartProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=AreaChart.d.ts.map