import React from "react";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useDimensions } from "./useDimensions";
import { useCicColorScale } from "./useCicColorScale";

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
}

export function BarChart({ data }: BarChartProps) {
  const { ref, width, height } = useDimensions();
  const colors = useCicColorScale();

  if (!data || data.length === 0 || width === 0 || height === 0) {
    return <div ref={ref} style={{ width: "100%", height: 300 }} />;
  }

  const x = scaleBand({
    domain: data.map((d) => d.label),
    range: [0, width],
    padding: 0.2,
  });

  const y = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value))],
    range: [height, 0],
  });

  return (
    <div ref={ref} className="cic-chart" style={{ width: "100%", height: 300 }}>
      <svg width={width} height={height}>
        {data.map((d) => (
          <Bar
            key={d.label}
            x={x(d.label)}
            y={y(d.value)}
            width={x.bandwidth()}
            height={height - y(d.value)}
            fill={colors.accent}
          />
        ))}
      </svg>
    </div>
  );
}
