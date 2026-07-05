import { TierEscalationV3 } from '../../cic-runtime/routing/tier-escalation-v3';
import { ExecutionHarnessV3 } from '../../cic-runtime/sandbox-exec/cic-execution-harness-v3';
import { ExecutionHistory } from './execution-history';
export class MaalOrchestratorV3 {
    executionHistory = new ExecutionHistory();
    tierEscalation;
    constructor(sloBudgetMs) {
        this.tierEscalation = new TierEscalationV3(sloBudgetMs);
    }
    async executePayload(modelId, payload, seed) {
        const history = await this.executionHistory.getMetrics(modelId);
        // Evaluate if we need to escalate to S3
        const { targetTier, escalationReasons } = this.tierEscalation.determineTier('S1', history.driftScore, history.p99Latency, history.reproScore);
        console.log(`[MAAL] Routing ${modelId} to ${targetTier}. Reasons: ${escalationReasons.join(', ')}`);
        if (targetTier === 'S3') {
            const harness = new ExecutionHarnessV3(500); // 500ms SLO
            const runId = `maal-run-${Date.now()}`;
            const { result, manifest } = await harness.run(payload, { runId, modelId, seed, collectTrace: true });
            await this.executionHistory.recordRun(modelId, manifest);
            return { result, manifest };
        }
        throw new Error(`[MAAL] Tier ${targetTier} not fully implemented in Sandbox-3 drop plan.`);
    }
}
//# sourceMappingURL=maal-orchestrator-v3.js.map