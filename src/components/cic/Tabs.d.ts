import React, { ReactNode } from "react";
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
declare const TabComponent: React.ForwardRefExoticComponent<TabProps & React.RefAttributes<HTMLDivElement>>;
declare const TabsComponent: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
export declare const Tabs: typeof TabsComponent & {
    Tab: typeof TabComponent;
};
export {};
//# sourceMappingURL=Tabs.d.ts.map