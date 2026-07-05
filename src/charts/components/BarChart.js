import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { scaleLinear, scaleBand } from '@visx/scale';
import { chartTokens } from '../tokens/chart-scales';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useChartData } from '../hooks/useChartData';
import '../tokens/chart-colors.css';
export const BarChart = React.forwardRef(({ data, xAccessor = (d) => d.x, yAccessor = (d) => d.y, title, xLabel = 'Category', yLabel = 'Value', height = 400, color = chartTokens.colors.primary, }, ref) => {
    const { width, height: measuredHeight, ref: dimRef } = useChartDimensions();
    const chartData = useChartData({ data, xAccessor, yAccessor });
    const finalHeight = height > 0 ? height : measuredHeight;
    const finalWidth = width > 0 ? width : 800;
    if (!data || data.length === 0) {
        return (_jsx("div", { ref: dimRef || ref, style: { width: '100%', height: finalHeight }, className: "chart-wrapper", children: _jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: "No data available" }) }));
    }
    const innerWidth = finalWidth - chartTokens.margins.left - chartTokens.margins.right;
    const innerHeight = finalHeight - (title ? 32 : 0) - chartTokens.margins.top - chartTokens.margins.bottom;
    const maxValue = Math.max(...chartData.data.map(yAccessor));
    const xScale = scaleBand({
        domain: chartData.data.map((_, i) => i),
        range: [0, innerWidth],
        padding: 0.1,
    });
    const yScale = scaleLinear({
        domain: [0, maxValue],
        range: [innerHeight, 0],
    });
    const barWidth = xScale.bandwidth();
    return (_jsxs("div", { ref: dimRef || ref, style: { width: '100%', height: finalHeight }, className: "chart-wrapper", children: [title && _jsx("h3", { style: { margin: '8px 16px 0', fontSize: '14px', fontWeight: 600 }, children: title }), _jsxs("svg", { width: finalWidth, height: finalHeight - (title ? 32 : 0), children: [_jsxs("g", { transform: `translate(${chartTokens.margins.left},${chartTokens.margins.top})`, children: [yScale.ticks(5).map((tick, i) => (_jsx("line", { x1: 0, x2: innerWidth, y1: yScale(tick), y2: yScale(tick), stroke: chartTokens.colors.neutral, strokeOpacity: 0.1, strokeWidth: 1 }, `grid-${i}`))), chartData.data.map((d, i) => {
                                const xPos = xScale(i) || 0;
                                const yValue = yAccessor(d);
                                const yPos = yScale(yValue);
                                return (_jsx("rect", { x: xPos, y: yPos, width: barWidth, height: innerHeight - yPos, fill: color, opacity: 0.8 }, `bar-${i}`));
                            })] }), _jsx("text", { x: finalWidth / 2, y: finalHeight - (title ? 32 : 0) - 8, textAnchor: "middle", className: "chart-axis-label", children: xLabel }), _jsx("text", { transform: `rotate(-90) translate(-${(finalHeight - (title ? 32 : 0)) / 2}, 12)`, textAnchor: "middle", className: "chart-axis-label", children: yLabel })] })] }));
});
BarChart.displayName = 'BarChart';
//# sourceMappingURL=BarChart.js.map