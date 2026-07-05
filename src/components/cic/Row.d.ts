import React from "react";
import "./row.css";
export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    selected?: boolean;
    children: React.ReactNode;
}
export declare const Row: React.ForwardRefExoticComponent<RowProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Row.d.ts.map