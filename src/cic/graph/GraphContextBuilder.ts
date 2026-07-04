import { GraphContext, GraphContextAPI } from './GraphContext.js';
import { GraphPolicyEngine } from './GraphPolicyEngine.js';
import { GraphRouter } from './GraphRouter.js';
import { GraphMergeEngine } from './GraphMergeEngine.js';

export class GraphContextBuilder implements GraphContextAPI {
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
}

export const graphContext = new GraphContextBuilder();
