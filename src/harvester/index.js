import { graphContext } from '../cic/graph/GraphContextBuilder.js';
export async function runHarvest(repo, files) {
    console.log(`[Harvester] Starting harvest for repo: ${repo}`);
    // Consuming unified context instead of direct TrueCode/GitNexus calls
    const ctx = await graphContext.getRefactorContext({ repo, files });
    console.log(`[Harvester] Loaded ${ctx.code.symbols.length} symbols and ${ctx.code.dependencies.length} dependencies.`);
    return {
        success: true,
        symbols: ctx.code.symbols,
        dependencies: ctx.code.dependencies,
        blastRadius: ctx.history.blastRadius,
        designIntent: ctx.knowledge.designIntent
    };
}
//# sourceMappingURL=index.js.map