import { jsx as _jsx } from "react/jsx-runtime";
import "./table.css";
export const Table = (props) => {
    const { className = "", children, ...rest } = props;
    return (_jsx("div", { "data-cic-component": "table", className: `cic-table ${className}`, ...rest, children: children }));
};
//# sourceMappingURL=Table.js.map