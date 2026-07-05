export interface CheckpointId {
    buildId: string;
    nodeId?: string;
    subtreeRootId?: string;
}
export interface SerializedState {
    data: unknown;
    createdAt: string;
}
export interface StateStore {
    save(id: CheckpointId, state: SerializedState): Promise<void>;
    load(id: CheckpointId): Promise<SerializedState | null>;
    delete(id: CheckpointId): Promise<void>;
}
export declare class InMemoryStateStore implements StateStore {
    private readonly store;
    private getKey;
    save(id: CheckpointId, state: SerializedState): Promise<void>;
    load(id: CheckpointId): Promise<SerializedState | null>;
    delete(id: CheckpointId): Promise<void>;
    getSize(): number;
}
export declare class StateRecoveryManager {
    private readonly store;
    constructor(store: StateStore);
    saveCheckpoint(id: CheckpointId, state: unknown): Promise<void>;
    restoreCheckpoint(id: CheckpointId): Promise<SerializedState | null>;
    rollbackLevel1(buildId: string, nodeId: string): Promise<void>;
    rollbackLevel2(buildId: string, subtreeRootId: string): Promise<void>;
    rollbackLevel3(buildId: string): Promise<void>;
}
//# sourceMappingURL=state-recovery-manager.d.ts.map