import { RefactorPolicy } from './policies/RefactorPolicy.js';
import { DriftPolicy } from './policies/DriftPolicy.js';
import { DiscoveryPolicy } from './policies/DiscoveryPolicy.js';
import { CostPolicy } from './policies/CostPolicy.js';

export class GraphPolicyEngine {
  static getPolicyForContext(type: 'refactor' | 'drift' | 'discovery' | 'cost') {
    switch (type) {
      case 'refactor':
        return RefactorPolicy;
      case 'drift':
        return DriftPolicy;
      case 'discovery':
        return DiscoveryPolicy;
      case 'cost':
        return CostPolicy;
      default:
        throw new Error(`Unknown context type: ${type}`);
    }
  }
}
