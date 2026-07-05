import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import "./button.css";
export const Button = React.forwardRef(({ variant = "primary", size = "medium", className, ...props }, ref) => {
    return (_jsx("button", { ref: ref, className: [
            "cic-button",
            `cic-button--${variant}`,
            `cic-button--${size}`,
            className,
        ]
            .filter(Boolean)
            .join(" "), ...props }));
});
Button.displayName = "Button";
//# sourceMappingURL=Button.js.map