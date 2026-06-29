import React from "react";
import "./grid.css";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 12 | 6 | 4 | 3 | 2 | 1;
  children: React.ReactNode;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      cols = 12,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-cic-component="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        className={["cic-grid", className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = "Grid";
