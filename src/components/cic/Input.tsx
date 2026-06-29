import React from "react";
import "./input.css";

type InputType = "text" | "email" | "password" | "number";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  type?: InputType;
  size?: "small" | "medium" | "large";
  error?: boolean;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = "medium", error, label, className, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="cic-input-group">
        {label && <label className="cic-input-label" htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={[
            "cic-input",
            `cic-input--${size}`,
            error && "cic-input--error",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
