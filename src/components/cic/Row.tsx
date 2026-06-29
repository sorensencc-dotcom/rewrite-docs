import React from "react";
import "./row.css";

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  children: React.ReactNode;
}

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  (
    {
      selected = false,
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        e.preventDefault();
        onClick(e as any);
      }
    };

    const isInteractive = !!onClick;

    const ariaProps: Record<string, string> = {};
    if (isInteractive) {
      ariaProps['role'] = 'button';
      ariaProps['aria-pressed'] = selected ? 'true' : 'false';
    } else {
      ariaProps['aria-selected'] = selected ? 'true' : 'false';
    }

    return (
      <div
        ref={ref}
        data-cic-component="row"
        data-selected={selected}
        className={["cic-row", className].filter(Boolean).join(" ")}
        tabIndex={isInteractive ? 0 : -1}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...ariaProps}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Row.displayName = "Row";
