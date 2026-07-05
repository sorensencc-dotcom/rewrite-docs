/**
 * Phase 8: Graph Adapter
 * Wraps CICIntegrationAdapterPhase8 as a GraphContext adapter.
 * Provides cost optimization signals for merged context.
 */
import { CICIntegrationAdapterPhase8 } from '../../phase8/integration/cic_integration_adapter_phase8.js';
// Default model catalog
const defaultModels = [
    {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        costPerMInput: 15.0,
        costPerMOutput: 75.0,
        latencyP95Ms: 200,
        throughputTokPerSec: 500,
        maxOutputTokens: 4096,
        contextWindowTokens: 200000,
        tier: 'premium',
        enabled: true
    },
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        costPerMInput: 3.0,
        costPerMOutput: 15.0,
        latencyP95Ms: 150,
        throughputTokPerSec: 800,
        maxOutputTokens: 4096,
        contextWindowTokens: 200000,
        tier: 'standard',
        enabled: true
    },
    {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        costPerMInput: 0.8,
        costPerMOutput: 4.0,
        latencyP95Ms: 100,
        throughputTokPerSec: 1200,
        maxOutputTokens: 2048,
        contextWindowTokens: 200000,
        tier: 'economy',
        enabled: true
    }
];
const defaultConfig = {
    telemetrySink: process.env.COST_SINK || 'prometheus',
    costPolicyConfig: {
        softCeilingUsd: 100.0,
        hardCeilingUsd: 200.0,
        softCeilingPeriodHours: 24,
        hardCeilingPeriodHours: 24
    },
    modelRegistry: defaultModels,
    enableAudit: true
};
export class Phase8Adapter {
    static instance = null;
    static getInstance() {
        if (!this.instance) {
            this.instance = new CICIntegrationAdapterPhase8(defaultConfig);
        }
        return this.instance;
    }
    /**
     * Get cost optimization signals for a service.
     * Used when merging context for cost-aware routing decisions.
     */
    static async getCostOptimizationSignals(service) {
        try {
            const adapter = this.getInstance();
            const dailySpend = adapter.getDailySpendUsd();
            const spendByModel = adapter.getSpendByModel();
            // Return default/mocked signals if no actual data
            return {
                runtimeSignals: {
                    costPressureLevel: dailySpend > defaultConfig.costPolicyConfig.softCeilingUsd ? 'warning' : 'normal',
                    budgetStatus: dailySpend > defaultConfig.costPolicyConfig.hardCeilingUsd ? 'hard_ceiling' : 'healthy',
                    anomalyScore: 0,
                    degradationState: 'normal'
                },
                selectedModel: 'claude-3-sonnet',
                estimatedCostUsd: 5.0,
                costForecastUsd: dailySpend
            };
        }
        catch (error) {
            // Graceful fallback if Phase 8 is not ready
            return {
                runtimeSignals: {
                    costPressureLevel: 'normal',
                    budgetStatus: 'healthy',
                    anomalyScore: 0,
                    degradationState: 'normal'
                },
                selectedModel: 'claude-3-sonnet',
                estimatedCostUsd: 5.0,
                costForecastUsd: 0
            };
        }
    }
}
//# sourceMappingURL=Phase8Adapter.js.map