import React from "react";
import "./panel.css";
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
    padding?: "default" | "none";
    elevation?: "default" | "none";
    header?: React.ReactNode;
    footer?: React.ReactNode;
    loading?: boolean;
    children: React.ReactNode;
}
export declare const Panel: React.ForwardRefExoticComponent<PanelProps & React.RefAttributes<HTMLElement>>;
//# sourceMappingURL=Panel.d.ts.map