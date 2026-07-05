import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { scaleLinear, scaleBand } from '@visx/scale';
import { chartTokens } from '../tokens/chart-scales';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useChartData } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export const AreaChart = React.forwardRef(({ data, xAccessor = (d) => d.x, yAccessor = (d) => d.y, title, xLabel = 'Time', yLabel = 'Value', height = 400, color = chartTokens.colors.primary, }, ref) => {
    const { width, height: measuredHeight, ref: dimRef } = useChartDimensions();
    const chartData = useChartData({ data, xAccessor, yAccessor });
    const finalHeight = height > 0 ? height : measuredHeight;
    const finalWidth = width > 0 ? width : 800;
    if (!data || data.length === 0) {
        return (_jsx("div", { ref: dimRef || ref, style: { width: '100%', height: finalHeight }, className: "chart-wrapper", children: _jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: "No data available" }) }));
    }
    const innerWidth = finalWidth - chartTokens.margins.left - chartTokens.margins.right;
    const innerHeight = finalHeight - (title ? 32 : 0) - chartTokens.margins.top - chartTokens.margins.bottom;
    const xScale = scaleBand({
        domain: chartData.data.map((_, i) => i),
        range: [0, innerWidth],
        padding: 0.1,
    });
    const yScale = scaleLinear({
        domain: [0, chartData.yExtent[1]],
        range: [innerHeight, 0],
    });
    const points = chartData.data.map((d, i) => ({
        x: (xScale(i) || 0) + (xScale.bandwidth() / 2),
        y: yScale(yAccessor(d)),
    }));
    return (_jsxs("div", { ref: dimRef || ref, style: { width: '100%', height: finalHeight }, className: "chart-wrapper", children: [title && _jsx("h3", { style: { margin: '8px 16px 0', fontSize: '14px', fontWeight: 600 }, children: title }), _jsxs("svg", { width: finalWidth, height: finalHeight - (title ? 32 : 0), children: [_jsxs("g", { transform: `translate(${chartTokens.margins.left},${chartTokens.margins.top})`, children: [yScale.ticks(5).map((tick, i) => (_jsx("line", { x1: 0, x2: innerWidth, y1: yScale(tick), y2: yScale(tick), stroke: chartTokens.colors.neutral, strokeOpacity: 0.1, strokeWidth: 1 }, `grid-${i}`))), points.length > 0 && (_jsxs(_Fragment, { children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "areaGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.3" }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })] }) }), _jsx("polyline", { points: [
                                            ...points.map((p) => `${p.x},${p.y}`),
                                            `${points[points.length - 1]?.x},${innerHeight}`,
                                            `${points[0]?.x},${innerHeight}`,
                                        ].join(' '), fill: "url(#areaGradient)", stroke: "none" }), _jsx("polyline", { points: points.map((p) => `${p.x},${p.y}`).join(' '), fill: "none", stroke: color, strokeWidth: 2 })] }))] }), _jsx("text", { x: finalWidth / 2, y: finalHeight - (title ? 32 : 0) - 8, textAnchor: "middle", className: "chart-axis-label", children: xLabel }), _jsx("text", { transform: `rotate(-90) translate(-${(finalHeight - (title ? 32 : 0)) / 2}, 12)`, textAnchor: "middle", className: "chart-axis-label", children: yLabel })] })] }));
});
AreaChart.displayName = 'AreaChart';
//# sourceMappingURL=AreaChart.js.map