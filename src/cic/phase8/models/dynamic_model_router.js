/**
 * Phase 8: Dynamic Model Router
 * Routes requests to models based on cost policy, SLA signals, and capability matching.
 */
export class DynamicModelRouter {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    route(context) {
        const { requestContext, signals, policyDecision } = context;
        // Handle policy-mandated downgrades
        if (policyDecision.decision === 'DOWNGRADE') {
            return this.routeDowngrade(requestContext, signals);
        }
        // Handle blocked requests
        if (policyDecision.decision === 'BLOCK') {
            throw new Error(`Request blocked by cost policy: ${policyDecision.reason}`);
        }
        // Handle queued requests
        if (policyDecision.decision === 'QUEUE') {
            return this.routeQueuedRequest(requestContext, signals);
        }
        // Normal routing (ALLOW)
        return this.routeNormal(requestContext, signals);
    }
    routeNormal(ctx, signals) {
        // Choose model based on SLA status first, then cost
        if (signals.slaStatus === 'violated') {
            const model = this.registry.getPrimaryModel();
            if (!model)
                throw new Error('No primary model available');
            return {
                selectedModel: model,
                reason: 'SLA violated, using primary (premium) model',
                alternativeModels: this.getAlternatives(model),
                score: 0.9
            };
        }
        if (signals.slaStatus === 'at_risk') {
            // Use fallback for cost savings while still meeting SLA
            const model = this.registry.getFallbackModel();
            if (!model)
                throw new Error('No fallback model available');
            return {
                selectedModel: model,
                reason: 'SLA at risk, using fallback model for cost balance',
                alternativeModels: this.getAlternatives(model),
                score: 0.7
            };
        }
        // SLA on track: choose lowest cost candidate that fits constraints
        const candidates = this.registry.getCandidates(ctx.estimatedInputTokens, ctx.maxOutputTokens || 4096, {
            allowedTiers: ['standard', 'economy']
        });
        if (candidates.length === 0) {
            const fallback = this.registry.getFallbackModel();
            if (!fallback)
                throw new Error('No suitable model available');
            return {
                selectedModel: fallback,
                reason: 'No candidates matched constraints, using fallback',
                alternativeModels: [],
                score: 0.5
            };
        }
        const selected = candidates[0];
        return {
            selectedModel: selected.model,
            reason: 'SLA on track, selected lowest-cost model',
            alternativeModels: candidates.slice(1, 3).map(c => c.model),
            score: 0.8
        };
    }
    routeDowngrade(ctx, signals) {
        // Select economy model or lowest-cost available
        const candidates = this.registry.getCandidates(ctx.estimatedInputTokens, ctx.maxOutputTokens || 4096, {
            allowedTiers: ['economy', 'standard']
        });
        if (candidates.length === 0) {
            throw new Error('No economy models available for downgrade');
        }
        const selected = candidates[0];
        return {
            selectedModel: selected.model,
            reason: 'Downgraded to economy model due to cost pressure',
            alternativeModels: candidates.slice(1).map(c => c.model),
            score: 0.4
        };
    }
    routeQueuedRequest(ctx, signals) {
        // Select lowest-cost model while queued
        const candidates = this.registry.getCandidates(ctx.estimatedInputTokens, ctx.maxOutputTokens || 4096);
        if (candidates.length === 0) {
            throw new Error('No models available for queued request');
        }
        const selected = candidates[0];
        return {
            selectedModel: selected.model,
            reason: 'Request queued, assigned lowest-cost model pending cost recovery',
            alternativeModels: [],
            score: 0.3
        };
    }
    getAlternatives(primary) {
        // Return 2-3 alternative models
        const all = this.registry.getAllModels().filter(m => m.id !== primary.id && m.enabled);
        return all.slice(0, 3);
    }
}
//# sourceMappingURL=dynamic_model_router.js.map