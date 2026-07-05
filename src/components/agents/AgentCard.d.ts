import React from "react";
import { AgentListItem } from "../../types/agents";
import "./agent-card.css";
export interface AgentCardProps {
    agent: AgentListItem;
    onSelect?: (agentId: string) => void;
}
export declare const AgentCard: React.FC<AgentCardProps>;
//# sourceMappingURL=AgentCard.d.ts.map