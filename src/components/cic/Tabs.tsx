import React, { useState, ReactNode, useMemo } from "react";
import "./tabs.css";

export interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  defaultTab?: string;
}

const TabComponent = React.forwardRef<HTMLDivElement, TabProps>(
  ({ id, label, children }, ref) => {
    return (
      <div ref={ref} data-tab-id={id} data-tab-label={label}>
        {children}
      </div>
    );
  }
);
TabComponent.displayName = "Tab";

const TabsComponent = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      children,
      defaultTab,
      className,
      ...props
    },
    ref
  ) => {
    const tabs = useMemo(
      () =>
        React.Children.toArray(children).filter(
          (child) => React.isValidElement(child) && child.type === TabComponent
        ) as React.ReactElement<TabProps>[],
      [children]
    );

    const firstTabId = tabs[0]?.props.id;
    const [activeTab, setActiveTab] = useState<string>(defaultTab || firstTabId || "");

    return (
      <div
        ref={ref}
        data-cic-component="tabs"
        className={["cic-tabs", className].filter(Boolean).join(" ")}
        {...props}
      >
        <div className="cic-tabs-header" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.props.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.props.id ? "true" : "false"}
              aria-controls={`panel-${tab.props.id}`}
              className={`cic-tabs-trigger ${activeTab === tab.props.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.props.id)}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
        <div className="cic-tabs-content">
          {tabs.map((tab) => (
            <div
              key={tab.props.id}
              id={`panel-${tab.props.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.props.id}`}
              className={`cic-tabs-panel ${activeTab === tab.props.id ? "active" : ""}`}
            >
              {activeTab === tab.props.id && tab.props.children}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TabsComponent.displayName = "Tabs";
(TabsComponent as any).Tab = TabComponent;

export const Tabs = TabsComponent as typeof TabsComponent & { Tab: typeof TabComponent };
