import React from 'react';
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
export declare const HeatMap: React.ForwardRefExoticComponent<HeatMapProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=HeatMap.d.ts.map