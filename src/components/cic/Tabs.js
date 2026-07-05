import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import "./tabs.css";
const TabComponent = React.forwardRef(({ id, label, children }, ref) => {
    return (_jsx("div", { ref: ref, "data-tab-id": id, "data-tab-label": label, children: children }));
});
TabComponent.displayName = "Tab";
const TabsComponent = React.forwardRef(({ children, defaultTab, className, ...props }, ref) => {
    const tabs = useMemo(() => React.Children.toArray(children).filter((child) => React.isValidElement(child) && child.type === TabComponent), [children]);
    const firstTabId = tabs[0]?.props.id;
    const [activeTab, setActiveTab] = useState(defaultTab || firstTabId || "");
    return (_jsxs("div", { ref: ref, "data-cic-component": "tabs", className: ["cic-tabs", className].filter(Boolean).join(" "), ...props, children: [_jsx("div", { className: "cic-tabs-header", role: "tablist", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.props.id ? "true" : "false", "aria-controls": `panel-${tab.props.id}`, className: `cic-tabs-trigger ${activeTab === tab.props.id ? "active" : ""}`, onClick: () => setActiveTab(tab.props.id), children: tab.props.label }, tab.props.id))) }), _jsx("div", { className: "cic-tabs-content", children: tabs.map((tab) => (_jsx("div", { id: `panel-${tab.props.id}`, role: "tabpanel", "aria-labelledby": `tab-${tab.props.id}`, className: `cic-tabs-panel ${activeTab === tab.props.id ? "active" : ""}`, children: activeTab === tab.props.id && tab.props.children }, tab.props.id))) })] }));
});
TabsComponent.displayName = "Tabs";
TabsComponent.Tab = TabComponent;
export const Tabs = TabsComponent;
//# sourceMappingURL=Tabs.js.map