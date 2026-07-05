import { jsx as _jsx } from "react/jsx-runtime";
import "./status-pill.css";
const statusLabels = {
    healthy: "Healthy",
    degraded: "Degraded",
    offline: "Offline",
    starting: "Starting",
};
export const StatusPill = ({ status }) => {
    return (_jsx("span", { className: `status-pill status-pill--${status}`, children: statusLabels[status] }));
};
//# sourceMappingURL=StatusPill.js.map