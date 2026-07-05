// src/build-system/state-recovery-manager.ts
export class InMemoryStateStore {
    store = new Map();
    getKey(id) {
        return `${id.buildId}:${id.nodeId || 'none'}:${id.subtreeRootId || 'none'}`;
    }
    async save(id, state) {
        this.store.set(this.getKey(id), state);
    }
    async load(id) {
        return this.store.get(this.getKey(id)) || null;
    }
    async delete(id) {
        this.store.delete(this.getKey(id));
    }
    // for testing
    getSize() {
        return this.store.size;
    }
}
export class StateRecoveryManager {
    store;
    constructor(store) {
        this.store = store;
    }
    async saveCheckpoint(id, state) {
        const serialized = {
            data: state,
            createdAt: new Date().toISOString(),
        };
        await this.store.save(id, serialized);
    }
    async restoreCheckpoint(id) {
        return this.store.load(id);
    }
    async rollbackLevel1(buildId, nodeId) {
        const id = { buildId, nodeId };
        const checkpoint = await this.store.load(id);
        if (!checkpoint)
            return;
        // TODO: apply checkpoint.data back into your graph engine
    }
    async rollbackLevel2(buildId, subtreeRootId) {
        const id = { buildId, subtreeRootId };
        const checkpoint = await this.store.load(id);
        if (!checkpoint)
            return;
        // TODO: apply subtree checkpoint to graph engine
    }
    async rollbackLevel3(buildId) {
        const id = { buildId };
        const checkpoint = await this.store.load(id);
        if (!checkpoint)
            return;
        // TODO: reset entire build graph and caches from checkpoint
    }
}
//# sourceMappingURL=state-recovery-manager.js.map