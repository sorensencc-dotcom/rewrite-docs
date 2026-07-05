import React from "react";
import "./card.css";
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "subtle";
    children: React.ReactNode;
}
export declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Card.d.ts.map