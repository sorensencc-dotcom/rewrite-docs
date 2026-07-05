export async function pgQuery(query, values) {
    // Stub implementation for postgres-client until the real DB layer is implemented
    if (process.env.NODE_ENV === 'test') {
        return { rows: [] };
    }
    console.log(`[PG] Executing query: ${query}`);
    return { rows: [] };
}
//# sourceMappingURL=postgres-client.js.map