import React from "react";
import "./grid.css";
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
    cols?: 12 | 6 | 4 | 3 | 2 | 1;
    children: React.ReactNode;
}
export declare const Grid: React.ForwardRefExoticComponent<GridProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Grid.d.ts.map