import React from "react";
import "./table.css";

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Table: React.FC<TableProps> = (props) => {
  const { className = "", children, ...rest } = props;

  return (
    <div
      data-cic-component="table"
      className={`cic-table ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
