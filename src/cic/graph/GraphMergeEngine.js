export class GraphMergeEngine {
    static merge(partials, policyName, req) {
        const generatedAt = new Date().toISOString();
        // ISO8601 validation
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
        if (!iso8601Regex.test(generatedAt)) {
            throw new Error(`Invalid generatedAt timestamp: ${generatedAt}`);
        }
        const code = partials.code || {
            symbols: [],
            dependencies: [],
            callGraph: []
        };
        const history = partials.history || {
            commits: [],
            authors: []
        };
        const knowledge = partials.knowledge || {
            docs: [],
            adr: []
        };
        const context = {
            code,
            history,
            knowledge,
            meta: {
                generatedAt,
                policy: policyName,
                repo: req.repo,
                service: req.service
            }
        };
        // Include cost slice if present (Phase 8)
        if (partials.cost) {
            context.cost = partials.cost;
        }
        return context;
    }
}
//# sourceMappingURL=GraphMergeEngine.js.map