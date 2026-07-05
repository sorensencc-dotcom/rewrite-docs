export type BackendId = "ollama" | "localai" | "gpt4all" | "llamafile" | "koboldcpp" | "anythingllm" | "mock";
export interface SLASettings {
    maxLatencyMs: number;
    maxTokens: number;
    maxBacklog: number;
    maxOscillations: number;
}
export interface SLAMetrics {
    avgLatencyMs: number;
    totalTokens: number;
    backlogCount: number;
    routingChanges: number;
    lastEvaluated: number;
}
export interface ActivePlaybooks {
    driftSpike: boolean;
    routingStability: boolean;
    backendRecovery: boolean;
    ingestionRecovery: boolean;
    governanceLockdown: boolean;
    dashboardRecovery: boolean;
}
export interface SLAViolation {
    category: string;
    description: string;
    severity: "SEV-1" | "SEV-2" | "SEV-3";
    ts: number;
}
export interface CICPersistedState {
    drift: Record<BackendId, number>;
    slaSettings: SLASettings;
    slaMetrics: SLAMetrics;
    activePlaybooks: ActivePlaybooks;
    violations: SLAViolation[];
    routingFrozen: boolean;
    frozenBackend?: BackendId;
    promotionsFrozen: boolean;
    rollbacksFrozen: boolean;
    governanceLockdown: boolean;
}
export declare class CICStateStore {
    private filePath;
    constructor(filePath?: string);
    load(): CICPersistedState;
    save(state: CICPersistedState): void;
    addViolation(category: string, description: string, severity: "SEV-1" | "SEV-2" | "SEV-3"): CICPersistedState;
    clearViolation(category: string): CICPersistedState;
    triggerPlaybook(name: keyof ActivePlaybooks, active: boolean): CICPersistedState;
    freezeRouting(frozen: boolean, backend?: BackendId): CICPersistedState;
    setGovernanceLockdown(active: boolean): CICPersistedState;
    getDefaultState(): CICPersistedState;
}
//# sourceMappingURL=cicStateStore.d.ts.map