export interface AgentMetrics {
    executions24h: number;
    errors24h: number;
    cost24h: number;
    latencyP95: number;
}
export interface AgentListItem {
    id: string;
    name: string;
    status: "healthy" | "degraded" | "offline" | "starting";
    heartbeat: string;
    metrics: AgentMetrics;
    skills: string[];
}
export interface AgentConfig {
    maxConcurrency: number;
    warmPool: boolean;
    version: string;
}
export interface AgentSystem {
    memoryMB: number;
    lastRestart: string;
    restartReason: string;
}
export interface AgentDetail extends AgentListItem {
    config: AgentConfig;
    system: AgentSystem;
}
export interface LogEvent {
    ts: string;
    level: "info" | "warn" | "error";
    message: string;
    skill?: string;
    correlationId?: string;
}
export interface ExecutionRecord {
    id: string;
    skill: string;
    durationMs: number;
    costUsd: number;
    status: "success" | "error";
    startedAt: string;
}
export interface AgentListResponse {
    agents: AgentListItem[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    snapshotAll: () => Promise<string>;
}
export interface AgentDetailResponse {
    agent: AgentDetail | null;
    logs: LogEvent[];
    executions: ExecutionRecord[];
    loading: boolean;
    error: Error | null;
    actions: {
        invoke: () => void;
        pause: () => void;
        restart: () => void;
        snapshot: () => Promise<string>;
    };
}
//# sourceMappingURL=agents.d.ts.map