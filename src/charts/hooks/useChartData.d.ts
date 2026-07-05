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
export declare function useChartData(config: ChartDataConfig): {
    data: DataPoint[];
    xDomain: number[];
    yDomain: number[];
    xExtent: number[];
    yExtent: number[];
};
//# sourceMappingURL=useChartData.d.ts.map