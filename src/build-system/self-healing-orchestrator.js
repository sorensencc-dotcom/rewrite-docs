// src/build-system/self-healing-orchestrator.ts
export class SelfHealingOrchestrator {
    failureDetector;
    autoRestartEngine;
    autoRepairEngine;
    stateRecoveryManager;
    eventSink;
    metrics;
    config;
    logger;
    state = 'RUNNING';
    failureEvents = [];
    constructor(failureDetector, autoRestartEngine, autoRepairEngine, stateRecoveryManager, eventSink, metrics, config, logger) {
        this.failureDetector = failureDetector;
        this.autoRestartEngine = autoRestartEngine;
        this.autoRepairEngine = autoRepairEngine;
        this.stateRecoveryManager = stateRecoveryManager;
        this.eventSink = eventSink;
        this.metrics = metrics;
        this.config = config;
        this.logger = logger;
    }
    getState() {
        return this.state;
    }
    getRestarter() {
        return this.autoRestartEngine;
    }
    getRepairer() {
        return this.autoRepairEngine;
    }
    getRecovery() {
        return this.stateRecoveryManager;
    }
    getFailureEvents() {
        return this.failureEvents;
    }
    transitionTo(to, ctx) {
        const from = this.state;
        this.state = to;
        if (this.logger) {
            this.logger.log({
                buildId: ctx.buildId,
                nodeId: ctx.nodeId,
                from,
                to,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async runNode(ctx, executeNode) {
        this.transitionTo('RUNNING', ctx);
        while (true) {
            try {
                const result = await executeNode();
                // success path
                this.transitionTo('RUNNING', ctx);
                return result;
            }
            catch (error) {
                this.transitionTo('DETECTING', ctx);
                const failure = this.failureDetector.detectCrash({
                    buildId: ctx.buildId,
                    nodeId: ctx.nodeId,
                    startTime: Date.now(), // refine with real timing
                    timeoutMs: 0,
                }, error);
                ctx.failureEvent = failure;
                this.failureEvents.push(failure);
                this.transitionTo('CLASSIFYING', ctx);
                // Record metrics for failure event
                this.metrics.failureEvents.inc({ category: failure.category, nodeId: ctx.nodeId });
                this.metrics.anomalyScores.observe({ category: failure.category }, failure.anomalyScore);
                if (failure.anomalyScore < this.config.anomalyThreshold) {
                    // treat as transient, maybe log and continue
                    const retryDecision = this.autoRestartEngine.decideRetry({
                        nodeRetryCount: ctx.nodeRetryCount,
                        buildRetryCount: ctx.buildRetryCount,
                    });
                    if (!retryDecision.shouldRetry) {
                        this.transitionTo('ESCALATING', ctx);
                        this.metrics.escalations.inc({ buildId: ctx.buildId, nodeId: ctx.nodeId });
                        await this.escalate(ctx, 'Low anomaly but retry quotas exceeded');
                        this.transitionTo('MANUAL_INTERVENTION', ctx);
                        return Promise.reject(error);
                    }
                    // Record metrics for retry
                    this.metrics.nodeRetries.inc({ nodeId: ctx.nodeId });
                    this.metrics.buildRetries.inc({ buildId: ctx.buildId });
                    await this.delay(retryDecision.delayMs);
                    ctx.nodeRetryCount += 1;
                    ctx.buildRetryCount += 1;
                    this.transitionTo('RUNNING', ctx);
                    continue;
                }
                this.transitionTo('ATTEMPTING_REPAIR', ctx);
                const plan = this.autoRepairEngine.planRepair(failure);
                this.metrics.repairAttempts.inc({ buildId: ctx.buildId, nodeId: ctx.nodeId });
                await this.autoRepairEngine.executeRepair({
                    buildId: ctx.buildId,
                    nodeId: ctx.nodeId,
                    ...ctx.repairHooks
                }, plan);
                ctx.repairActionsApplied.push(...plan.actions);
                const retryDecision = this.autoRestartEngine.decideRetry({
                    nodeRetryCount: ctx.nodeRetryCount,
                    buildRetryCount: ctx.buildRetryCount,
                });
                if (!retryDecision.shouldRetry) {
                    this.transitionTo('ESCALATING', ctx);
                    this.metrics.escalations.inc({ buildId: ctx.buildId, nodeId: ctx.nodeId });
                    await this.escalate(ctx, retryDecision.reason);
                    this.transitionTo('MANUAL_INTERVENTION', ctx);
                    return Promise.reject(error);
                }
                this.transitionTo('VALIDATING', ctx);
                // Record metrics for retry after repair
                this.metrics.nodeRetries.inc({ nodeId: ctx.nodeId });
                this.metrics.buildRetries.inc({ buildId: ctx.buildId });
                await this.delay(retryDecision.delayMs);
                ctx.nodeRetryCount += 1;
                ctx.buildRetryCount += 1;
                this.transitionTo('RUNNING', ctx);
                // loop back and re-run node
            }
        }
    }
    async escalate(ctx, reason) {
        const failure = ctx.failureEvent;
        const escalationEvent = {
            type: 'ESCALATION',
            buildId: ctx.buildId,
            nodeId: ctx.nodeId,
            state: 'ESCALATING',
            failure,
            repairActionsApplied: ctx.repairActionsApplied,
            nodeRetryCount: ctx.nodeRetryCount,
            buildRetryCount: ctx.buildRetryCount,
            timestamp: new Date().toISOString(),
            escalationReason: reason,
            suggestedNextSteps: 'Inspect logs, consider manual rollback or node configuration change.',
        };
        await this.eventSink.emit(escalationEvent);
    }
    async requestManualIntervention(ctx, owner) {
        const failure = ctx.failureEvent;
        const event = {
            type: 'MANUAL_INTERVENTION',
            buildId: ctx.buildId,
            nodeId: ctx.nodeId,
            failure,
            repairActionsApplied: ctx.repairActionsApplied,
            nodeRetryCount: ctx.nodeRetryCount,
            buildRetryCount: ctx.buildRetryCount,
            timestamp: new Date().toISOString(),
            owner,
            notes: 'Manual intervention requested by orchestrator.',
        };
        this.metrics.manualInterventions.inc({ buildId: ctx.buildId, nodeId: ctx.nodeId });
        this.transitionTo('MANUAL_INTERVENTION', ctx);
        await this.eventSink.emit(event);
    }
    async delay(ms) {
        if (ms <= 0)
            return;
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=self-healing-orchestrator.js.map