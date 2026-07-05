import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import "./input.css";
export const Input = React.forwardRef(({ size = "medium", error, label, className, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).slice(2, 9)}`;
    return (_jsxs("div", { className: "cic-input-group", children: [label && _jsx("label", { className: "cic-input-label", htmlFor: inputId, children: label }), _jsx("input", { ref: ref, id: inputId, className: [
                    "cic-input",
                    `cic-input--${size}`,
                    error && "cic-input--error",
                    className,
                ]
                    .filter(Boolean)
                    .join(" "), ...props })] }));
});
Input.displayName = "Input";
//# sourceMappingURL=Input.js.map