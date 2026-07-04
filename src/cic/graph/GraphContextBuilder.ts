import { GraphContext, GraphContextAPI } from './GraphContext.js';
import { GraphPolicyEngine } from './GraphPolicyEngine.js';
import { GraphRouter } from './GraphRouter.js';
import { GraphMergeEngine } from './GraphMergeEngine.js';

export interface GraphContextAPIExtended extends GraphContextAPI {
  getCostContext(req: { service: string }): Promise<GraphContext>;
}

export class GraphContextBuilder implements GraphContextAPIExtended {
  async getRefactorContext(req: { repo: string; files: string[] }): Promise<GraphContext> {
    const policy = GraphPolicyEngine.getPolicyForContext('refactor');
    const partials = await GraphRouter.route(policy, req);
    return GraphMergeEngine.merge(partials, policy.name, req);
  }

  async getDriftContext(req: { service: string }): Promise<GraphContext> {
    const policy = GraphPolicyEngine.getPolicyForContext('drift');
    const partials = await GraphRouter.route(policy, req);
    return GraphMergeEngine.merge(partials, policy.name, req);
  }

  async getDiscoveryContext(req: { service: string }): Promise<GraphContext> {
    const policy = GraphPolicyEngine.getPolicyForContext('discovery');
    const partials = await GraphRouter.route(policy, req);
    return GraphMergeEngine.merge(partials, policy.name, req);
  }

  async getCostContext(req: { service: string }): Promise<GraphContext> {
    // Phase 8: Cost optimization context
    // Routes to cost policy + merges cost constraints from Phase 8
    const policy = GraphPolicyEngine.getPolicyForContext('cost');
    const partials = await GraphRouter.route(policy, req);
    return GraphMergeEngine.merge(partials, policy.name, req);
  }
}

export const graphContext = new GraphContextBuilder();
