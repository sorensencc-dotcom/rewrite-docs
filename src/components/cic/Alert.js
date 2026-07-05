import { jsx as _jsx } from "react/jsx-runtime";
import "./alert.css";
export const Alert = (props) => {
    const { className = "", children, ...rest } = props;
    return (_jsx("div", { "data-cic-component": "alert", role: "alert", className: `cic-alert ${className}`, ...rest, children: children }));
};
//# sourceMappingURL=Alert.js.map