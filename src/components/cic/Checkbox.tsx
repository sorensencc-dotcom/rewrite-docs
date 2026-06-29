import React from "react";
import "./checkbox.css";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, className, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={["cic-checkbox-group", className].filter(Boolean).join(" ")}>
        <div className="cic-checkbox-wrapper">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="cic-checkbox"
            {...props}
          />
          <label htmlFor={inputId} className="cic-checkbox-label">
            <span className="cic-checkbox-box" />
            {label && <span className="cic-checkbox-text">{label}</span>}
          </label>
        </div>
        {description && (
          <p className="cic-checkbox-description">{description}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
