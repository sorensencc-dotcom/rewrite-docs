import React from "react";
import "./status-pill.css";

export interface StatusPillProps {
  status: "healthy" | "degraded" | "offline" | "starting";
}

const statusLabels = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  starting: "Starting",
};

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  return (
    <span className={`status-pill status-pill--${status}`}>
      {statusLabels[status]}
    </span>
  );
};
