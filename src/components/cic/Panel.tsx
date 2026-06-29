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

export const Panel = React.forwardRef<HTMLElement, PanelProps>(
  (
    {
      padding = "default",
      elevation = "default",
      header,
      footer,
      loading = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        data-cic-component="panel"
        data-padding={padding}
        data-elevation={elevation}
        data-loading={loading}
        aria-busy={loading ? 'true' : 'false'}
        className={className ? `cic-panel ${className}` : "cic-panel"}
        {...props}
      >
        {header && <div className="cic-panel-header">{header}</div>}
        <div className="cic-panel-body" aria-live="polite" aria-atomic="false">
          {children}
        </div>
        {footer && <div className="cic-panel-footer">{footer}</div>}
      </section>
    );
  }
);

Panel.displayName = "Panel";
