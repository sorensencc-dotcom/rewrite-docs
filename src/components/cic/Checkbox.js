import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import "./checkbox.css";
export const Checkbox = React.forwardRef(({ id, label, description, className, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
    return (_jsxs("div", { className: ["cic-checkbox-group", className].filter(Boolean).join(" "), children: [_jsxs("div", { className: "cic-checkbox-wrapper", children: [_jsx("input", { ref: ref, id: inputId, type: "checkbox", className: "cic-checkbox", ...props }), _jsxs("label", { htmlFor: inputId, className: "cic-checkbox-label", children: [_jsx("span", { className: "cic-checkbox-box" }), label && _jsx("span", { className: "cic-checkbox-text", children: label })] })] }), description && (_jsx("p", { className: "cic-checkbox-description", children: description }))] }));
});
Checkbox.displayName = "Checkbox";
//# sourceMappingURL=Checkbox.js.map