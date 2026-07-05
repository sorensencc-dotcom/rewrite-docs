import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import "./card.css";
export const Card = React.forwardRef(({ variant = "default", children, className, ...props }, ref) => {
    return (_jsx("div", { ref: ref, "data-cic-component": "card", "data-variant": variant, className: ["cic-card", className].filter(Boolean).join(" "), ...props, children: children }));
});
Card.displayName = "Card";
//# sourceMappingURL=Card.js.map