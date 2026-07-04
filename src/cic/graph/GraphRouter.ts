import { GraphContext } from './GraphContext.js';
import { TrueCodeAdapter } from './adapters/TrueCodeAdapter.js';
import { GitNexusAdapter } from './adapters/GitNexusAdapter.js';
import { GraphifyAdapter } from './adapters/GraphifyAdapter.js';

export class GraphRouter {
  static async route(
    policy: { name: string; require: readonly string[]; optional?: readonly string[]; mergeStrategy: string },
    req: { repo?: string; files?: string[]; service?: string }
  ): Promise<Partial<GraphContext>> {
    const context: Partial<GraphContext> = {};
    const engines = [...policy.require, ...(policy.optional || [])];

    const repo = req.repo || 'default-repo';
    const files = req.files || [];
    const service = req.service || 'default-service';

    const promises: Promise<void>[] = [];

    if (engines.includes('TrueCode')) {
      promises.push((async () => {
        if (req.files) {
          context.code = await TrueCodeAdapter.getStructuralGraph(repo, files);
        } else {
          context.code = await TrueCodeAdapter.getServiceStructure(repo, service);
        }
      })());
    }

    if (engines.includes('GitNexus')) {
      promises.push((async () => {
        if (req.files) {
          const blastRadius = await GitNexusAdapter.getBlastRadius(repo, files, 30);
          context.history = { commits: [], authors: [], blastRadius };
        } else {
          context.history = await GitNexusAdapter.getServiceHistory(repo, service);
        }
      })());
    }

    if (engines.includes('Graphify')) {
      promises.push((async () => {
        if (policy.name === 'CIC.Discovery') {
          context.knowledge = await GraphifyAdapter.getDiscoveryOverview(service);
        } else if (policy.name === 'CIC.Drift') {
          context.knowledge = await GraphifyAdapter.getDocumentedArchitecture(service);
        } else {
          context.knowledge = await GraphifyAdapter.getDesignIntent(service);
        }
      })());
    }

    await Promise.all(promises);
    return context;
  }
}
