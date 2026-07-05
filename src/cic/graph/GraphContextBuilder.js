import { GraphPolicyEngine } from './GraphPolicyEngine.js';
import { GraphRouter } from './GraphRouter.js';
import { GraphMergeEngine } from './GraphMergeEngine.js';
export class GraphContextBuilder {
    async getRefactorContext(req) {
        const policy = GraphPolicyEngine.getPolicyForContext('refactor');
        const partials = await GraphRouter.route(policy, req);
        return GraphMergeEngine.merge(partials, policy.name, req);
    }
    async getDriftContext(req) {
        const policy = GraphPolicyEngine.getPolicyForContext('drift');
        const partials = await GraphRouter.route(policy, req);
        return GraphMergeEngine.merge(partials, policy.name, req);
    }
    async getDiscoveryContext(req) {
        const policy = GraphPolicyEngine.getPolicyForContext('discovery');
        const partials = await GraphRouter.route(policy, req);
        return GraphMergeEngine.merge(partials, policy.name, req);
    }
    async getCostContext(req) {
        // Phase 8: Cost optimization context
        // Routes to cost policy + merges cost constraints from Phase 8
        const policy = GraphPolicyEngine.getPolicyForContext('cost');
        const partials = await GraphRouter.route(policy, req);
        return GraphMergeEngine.merge(partials, policy.name, req);
    }
}
export const graphContext = new GraphContextBuilder();
//# sourceMappingURL=GraphContextBuilder.js.map