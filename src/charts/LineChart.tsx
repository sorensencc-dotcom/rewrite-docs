import React from "react";
import { LinePath } from "@visx/shape";
import { scaleLinear, scaleTime } from "@visx/scale";
import { curveMonotoneX } from "@visx/curve";
import { useDimensions } from "./useDimensions";
import { useCicColorScale } from "./useCicColorScale";

interface DataPoint {
  ts: Date;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
}

export function LineChart({ data }: LineChartProps) {
  const { ref, width, height } = useDimensions();
  const colors = useCicColorScale();

  if (!data || data.length === 0 || width === 0 || height === 0) {
    return <div ref={ref} style={{ width: "100%", height: 300 }} />;
  }

  const x = scaleTime({
    domain: [data[0].ts, data[data.length - 1].ts],
    range: [0, width],
  });

  const y = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value))],
    range: [height, 0],
  });

  return (
    <div ref={ref} className="cic-chart" style={{ width: "100%", height: 300 }}>
      <svg width={width} height={height}>
        <LinePath
          data={data}
          x={(d) => x(d.ts)}
          y={(d) => y(d.value)}
          stroke={colors.accent}
          strokeWidth={2}
          curve={curveMonotoneX}
        />
      </svg>
    </div>
  );
}
