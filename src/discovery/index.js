import { graphContext } from '../cic/graph/GraphContextBuilder.js';
export async function discoverService(service) {
    console.log(`[Discovery] Starting discovery for service: ${service}`);
    // Consuming unified context instead of direct Graphify/TrueCode calls
    const ctx = await graphContext.getDiscoveryContext({ service });
    console.log(`[Discovery] Discovered boundaries: ${ctx.code.boundaries?.length || 0}`);
    return {
        success: true,
        boundaries: ctx.code.boundaries,
        churn: ctx.history.churn,
        overviewDocs: ctx.knowledge.overviewDocs
    };
}
//# sourceMappingURL=index.js.map