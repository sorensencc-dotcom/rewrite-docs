import { GraphContext, CodeGraphSlice, RepoHistorySlice, KnowledgeGraphSlice } from './GraphContext.js';

export class GraphMergeEngine {
  static merge(
    partials: Partial<GraphContext>,
    policyName: string,
    req: { repo?: string; service?: string }
  ): GraphContext {
    const generatedAt = new Date().toISOString();
    
    // ISO8601 validation
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
    if (!iso8601Regex.test(generatedAt)) {
      throw new Error(`Invalid generatedAt timestamp: ${generatedAt}`);
    }

    const code: CodeGraphSlice = partials.code || {
      symbols: [],
      dependencies: [],
      callGraph: []
    };

    const history: RepoHistorySlice = partials.history || {
      commits: [],
      authors: []
    };

    const knowledge: KnowledgeGraphSlice = partials.knowledge || {
      docs: [],
      adr: []
    };

    return {
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
  }
}
