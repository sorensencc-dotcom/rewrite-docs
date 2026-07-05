// Main database interface
// Stub for PostgreSQL integration (Phase 24.3+)
export class StubDatabase {
    async query() {
        return [];
    }
    async execute() {
        return { rowCount: 0, affectedRows: 0, insertId: 0 };
    }
    async transaction(fn) {
        return fn(this);
    }
    async close() {
        // noop
    }
}
export const database = new StubDatabase();
//# sourceMappingURL=index.js.map