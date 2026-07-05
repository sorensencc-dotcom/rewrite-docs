import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import "./row.css";
export const Row = React.forwardRef(({ selected = false, children, className, onClick, ...props }, ref) => {
    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick(e);
        }
    };
    const isInteractive = !!onClick;
    const ariaProps = {};
    if (isInteractive) {
        ariaProps['role'] = 'button';
        ariaProps['aria-pressed'] = selected ? 'true' : 'false';
    }
    else {
        ariaProps['aria-selected'] = selected ? 'true' : 'false';
    }
    return (_jsx("div", { ref: ref, "data-cic-component": "row", "data-selected": selected, className: ["cic-row", className].filter(Boolean).join(" "), tabIndex: isInteractive ? 0 : -1, onClick: onClick, onKeyDown: handleKeyDown, ...ariaProps, ...props, children: children }));
});
Row.displayName = "Row";
//# sourceMappingURL=Row.js.map