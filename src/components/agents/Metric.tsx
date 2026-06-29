import React from "react";
import "./metric.css";

export interface MetricProps {
  label: string;
  value: string | number;
}

export const Metric: React.FC<MetricProps> = ({ label, value }) => {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
};
