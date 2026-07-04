/**
 * Phase 8 Integration Tests
 * Validates Phase 8 binding with GraphContext
 */

import { graphContext } from '../../cic/graph/GraphContextBuilder.js';
import { CICIntegrationAdapterPhase8, Phase8Config } from '../../cic/phase8/index.js';
import { ModelDescriptor } from '../../cic/phase8/types/model_descriptor.js';

describe('Phase 8: Cost Optimization Integration', () => {
  const testModels: ModelDescriptor[] = [
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
    }
  ];

  const phase8Config: Phase8Config = {
    telemetrySink: 'mock',
    costPolicyConfig: {
      softCeilingUsd: 100.0,
      hardCeilingUsd: 200.0,
      softCeilingPeriodHours: 24,
      hardCeilingPeriodHours: 24
    },
    modelRegistry: testModels,
    enableAudit: true
  };

  test('GraphContext getCostContext returns cost optimization signals', async () => {
    const ctx = await graphContext.getCostContext({ service: 'test-service' });

    expect(ctx).toBeDefined();
    expect(ctx.cost).toBeDefined();
    expect(ctx.cost?.runtimeSignals).toBeDefined();
    expect(ctx.cost?.runtimeSignals?.costPressureLevel).toMatch(/normal|warning|critical/);
    expect(ctx.meta.policy).toBe('CIC.Cost');
  });

  test('CICIntegrationAdapterPhase8 initializes with cost policy', () => {
    const adapter = new CICIntegrationAdapterPhase8(phase8Config);
    expect(adapter).toBeDefined();
    expect(adapter.getDailySpendUsd()).toBe(0);
  });

  test('Phase 8 cost model tracks spending windows', async () => {
    const adapter = new CICIntegrationAdapterPhase8(phase8Config);

    const requestCtx = {
      requestId: 'req-123',
      timestamp: '2026-07-04T10:00:00Z',
      agentId: 'agent-1',
      serviceId: 'service-1',
      model: 'claude-3-sonnet',
      estimatedInputTokens: 1000,
      estimatedOutputTokens: 500,
      priority: 'normal' as const
    };

    const phase7Signals = {
      slaStatus: 'on_track' as const,
      slaMarginMs: 500,
      modelSelection: 'primary' as const
    };

    const result = await adapter.handleRequest(requestCtx, phase7Signals);

    expect(result).toBeDefined();
    expect(result.selectedModel).toBeDefined();
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.runtimeSignals.costPressureLevel).toBeDefined();
  });

  test('Phase 8 bound to GraphContext in merge engine', async () => {
    const ctx = await graphContext.getCostContext({ service: 'test-service' });

    expect(ctx.code).toBeDefined();
    expect(ctx.history).toBeDefined();
    expect(ctx.knowledge).toBeDefined();
    expect(ctx.cost).toBeDefined();
    expect(ctx.meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO8601
  });
});
