import React from "react";
import "./alert.css";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = (props) => {
  const { className = "", children, ...rest } = props;

  return (
    <div
      data-cic-component="alert"
      role="alert"
      className={`cic-alert ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
