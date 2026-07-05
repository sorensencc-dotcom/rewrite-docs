import React from "react";
import "./input.css";
type InputType = "text" | "email" | "password" | "number";
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    type?: InputType;
    size?: "small" | "medium" | "large";
    error?: boolean;
    label?: string;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export {};
//# sourceMappingURL=Input.d.ts.map