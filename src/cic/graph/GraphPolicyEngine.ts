import { RefactorPolicy } from './policies/RefactorPolicy.js';
import { DriftPolicy } from './policies/DriftPolicy.js';
import { DiscoveryPolicy } from './policies/DiscoveryPolicy.js';

export class GraphPolicyEngine {
  static getPolicyForContext(type: 'refactor' | 'drift' | 'discovery') {
    switch (type) {
      case 'refactor':
        return RefactorPolicy;
      case 'drift':
        return DriftPolicy;
      case 'discovery':
        return DiscoveryPolicy;
      default:
        throw new Error(`Unknown context type: ${type}`);
    }
  }
}
