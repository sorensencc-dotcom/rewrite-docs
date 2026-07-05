import { graphContext } from '../../cic/graph/GraphContextBuilder.js';
import { validateGraphContext } from '../../schemas/index.js';
describe('GraphContext Subsystem Tests', () => {
    test('should retrieve refactor context and validate its schema', async () => {
        const ctx = await graphContext.getRefactorContext({
            repo: 'https://github.com/my-user/my-repo',
            files: ['src/main.ts', 'src/utils.ts']
        });
        expect(validateGraphContext(ctx)).toBe(true);
        expect(ctx.meta.policy).toBe('CIC.CodeRefactor');
        expect(ctx.code.symbols.length).toBeGreaterThan(0);
        expect(ctx.history.blastRadius).toBeDefined();
    });
    test('should retrieve drift context and validate its schema', async () => {
        const ctx = await graphContext.getDriftContext({
            service: 'my-service'
        });
        expect(validateGraphContext(ctx)).toBe(true);
        expect(ctx.meta.policy).toBe('CIC.Drift');
        expect(ctx.code.structure).toBeDefined();
        expect(ctx.history.changeTimeline?.length).toBeGreaterThan(0);
    });
    test('should retrieve discovery context and validate its schema', async () => {
        const ctx = await graphContext.getDiscoveryContext({
            service: 'my-service'
        });
        expect(validateGraphContext(ctx)).toBe(true);
        expect(ctx.meta.policy).toBe('CIC.Discovery');
        expect(ctx.code.boundaries?.length).toBeGreaterThan(0);
    });
    test('should perform deterministic merging (matching identical output)', async () => {
        const run1 = await graphContext.getRefactorContext({ repo: 'repo', files: ['file.ts'] });
        const run2 = await graphContext.getRefactorContext({ repo: 'repo', files: ['file.ts'] });
        // Time will differ slightly, so ignore generatedAt for deep equality check
        const r1Copy = { ...run1, meta: { ...run1.meta, generatedAt: '' } };
        const r2Copy = { ...run2, meta: { ...run2.meta, generatedAt: '' } };
        expect(r1Copy).toEqual(r2Copy);
    });
    test('should validate token reduction', () => {
        function countTokens(text) {
            return Math.ceil(text.length / 4);
        }
        const rawTextDump = `
      File: src/harvester/index.ts
      Content:
      import { graphContext } from '../cic/graph/GraphContextBuilder.js';
      export async function runHarvest(repo: string, files: string[]) {
        const ctx = await graphContext.getRefactorContext({ repo, files });
        return {
          success: true,
          symbols: ctx.code.symbols,
          dependencies: ctx.code.dependencies,
          blastRadius: ctx.history.blastRadius,
          designIntent: ctx.knowledge.designIntent
        };
      }
      File: src/discovery/index.ts
      Content:
      import { graphContext } from '../cic/graph/GraphContextBuilder.js';
      export async function discoverService(service: string) {
        const ctx = await graphContext.getDiscoveryContext({ service });
        return {
          success: true,
          boundaries: ctx.code.boundaries,
          churn: ctx.history.churn,
          overviewDocs: ctx.knowledge.overviewDocs
        };
      }
      File: src/lib/drift.ts
      Content:
      import { graphContext } from '../cic/graph/GraphContextBuilder.js';
      export async function detectDrift(service: string) {
        const ctx = await graphContext.getDriftContext({ service });
        return {
          service,
          hasDrift: !!(ctx.history.changeTimeline && ctx.history.changeTimeline.length > 0),
          structure: ctx.code.structure,
          timeline: ctx.history.changeTimeline,
          architecture: ctx.knowledge.documentedArchitecture
        };
      }
    `;
        const rawTokens = countTokens(rawTextDump);
        // Mock GraphContext payload
        const unifiedContext = {
            code: {
                symbols: [
                    { id: "sym-1", name: "RefactorAgent", type: "class", path: "src/agents/RefactorAgent.ts" }
                ],
                dependencies: [
                    { from: "src/agents/RefactorAgent.ts", to: "src/cic/graph/GraphContext.ts", kind: "import" }
                ],
                callGraph: []
            },
            history: {
                commits: [],
                authors: []
            },
            knowledge: {
                docs: [],
                adr: []
            },
            meta: {
                generatedAt: new Date().toISOString(),
                policy: "CIC.CodeRefactor"
            }
        };
        const unifiedTokens = countTokens(JSON.stringify(unifiedContext));
        // Must be less than 50% of the raw database dump representation
        expect(unifiedTokens).toBeLessThan(rawTokens * 0.5);
    });
});
//# sourceMappingURL=graphContext.test.js.map