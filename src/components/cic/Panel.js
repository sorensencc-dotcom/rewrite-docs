import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import "./panel.css";
export const Panel = React.forwardRef(({ padding = "default", elevation = "default", header, footer, loading = false, children, className, ...props }, ref) => {
    return (_jsxs("section", { ref: ref, "data-cic-component": "panel", "data-padding": padding, "data-elevation": elevation, "data-loading": loading, "aria-busy": loading ? 'true' : 'false', className: className ? `cic-panel ${className}` : "cic-panel", ...props, children: [header && _jsx("div", { className: "cic-panel-header", children: header }), _jsx("div", { className: "cic-panel-body", "aria-live": "polite", "aria-atomic": "false", children: children }), footer && _jsx("div", { className: "cic-panel-footer", children: footer })] }));
});
Panel.displayName = "Panel";
//# sourceMappingURL=Panel.js.map