import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import "./grid.css";
export const Grid = React.forwardRef(({ cols = 12, children, className, ...props }, ref) => {
    return (_jsx("div", { ref: ref, "data-cic-component": "grid", style: { gridTemplateColumns: `repeat(${cols}, 1fr)` }, className: ["cic-grid", className].filter(Boolean).join(" "), ...props, children: children }));
});
Grid.displayName = "Grid";
//# sourceMappingURL=Grid.js.map