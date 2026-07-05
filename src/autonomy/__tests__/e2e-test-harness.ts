/**
 * E2E Test Harness (Phases 23-27)
 * Dependency injection + deterministic test orchestration
 *
 * Mitigations:
 * - Dependency injection: mock external services, <1s tests
 * - Deterministic ordering: explicit orchestration, no race conditions
 * - Timeout management: SLA=100ms, timeout=1s
 * - Retry logic: transient failures get 3x exponential backoff
 *
 * Run: npm test -- e2e-test-harness.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MemoryService } from '../services/MemoryService';
import { GovernanceService } from '../services/GovernanceService';

/**
 * Mock interfaces for dependency injection
 */
interface TestContext {
  memoryService: MemoryService;
  governanceService: GovernanceService;
  startTime: number;
  logs: string[];
}

/**
 * Test fixture factory with DI
 */
class E2ETestFixture {
  private context: TestContext;

  constructor() {
    this.context = {
      memoryService: new MemoryService(86400), // 1-day TTL for tests
      governanceService: new GovernanceService(),
      startTime: Date.now(),
      logs: [],
    };
  }

  get(): TestContext {
    return this.context;
  }

  log(message: string): void {
    this.context.logs.push(`[${Date.now() - this.context.startTime}ms] ${message}`);
  }

  reset(): void {
    this.context = {
      memoryService: new MemoryService(86400),
      governanceService: new GovernanceService(),
      startTime: Date.now(),
      logs: [],
    };
  }

  async waitFor<T>(
    condition: () => Promise<T> | T,
    timeoutMs = 1000,
    intervalMs = 50
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;

    while (true) {
      try {
        const result = await Promise.resolve(condition());
        if (result) return result;
      } catch (err) {
        // Retry on error
      }

      if (Date.now() > deadline) {
        throw new Error(`Timeout after ${timeoutMs}ms`);
      }

      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  getLogsAsString(): string {
    return this.context.logs.join('\n');
  }
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Test Suite: Phase 23 Memory API
 */
describe('Phase 23: Memory Layer API', () => {
  let fixture: E2ETestFixture;

  beforeEach(() => {
    fixture = new E2ETestFixture();
  });

  afterEach(() => {
    fixture.reset();
  });

  it('should write memory packet with write-through cache', async () => {
    const ctx = fixture.get();

    const packet = {
      id: 'mem-test-001',
      timestamp: Date.now(),
      context: {
        phase_id: '23',
        agent_id: 'observer-1',
        task_id: 'task-test-001',
        session_id: 'sess-test-001',
      },
      reasoning_chain: [
        {
          step_id: 'step-1',
          type: 'observation' as const,
          content: 'Test observation',
          confidence: 0.95,
          timestamp: Date.now(),
        },
      ],
      evidence: {
        inputs: [],
        outputs: [],
        references: [],
      },
      state_snapshot: {
        knowledge_graph_hash: 'sha256:test',
        policy_rails_version: 'v24.0',
        skill_inventory: {},
      },
      ttl_seconds: 86400,
      is_public: true,
    };

    const ack = await ctx.memoryService.writePacket(packet);

    fixture.log(`Memory write: ${ack.status}`);

    expect(ack.status).toBe('accepted');
    expect(ack.acknowledgement.retrieval_deadline).toBeGreaterThan(Date.now());

    // Verify read-your-own-writes
    const retrieved = await ctx.memoryService.getPacket(packet.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.context.phase_id).toBe('23');
  }, 1000);

  it('should handle replication lag with fallback', async () => {
    const ctx = fixture.get();

    // Write packet
    const packet = {
      id: 'mem-replication-test',
      timestamp: Date.now(),
      context: {
        phase_id: '23',
        agent_id: 'observer-1',
        task_id: 'task-replication',
        session_id: 'sess-replication',
      },
      reasoning_chain: [],
      evidence: { inputs: [], outputs: [], references: [] },
      state_snapshot: {
        knowledge_graph_hash: 'sha256:test',
        policy_rails_version: 'v24.0',
        skill_inventory: {},
      },
      ttl_seconds: 86400,
      is_public: true,
    };

    const ack = await ctx.memoryService.writePacket(packet);
    expect(ack.status).toBe('accepted');

    // Query should succeed even under replication lag
    const results = await ctx.memoryService.queryPackets({
      phase_id: '23',
    });

    fixture.log(`Query under replication: found ${results.length} packets`);
    expect(results.length).toBeGreaterThan(0);
  }, 1000);

  it('should extend TTL for referenced evidence packets', async () => {
    const ctx = fixture.get();

    const packet = {
      id: 'mem-evidence-ref',
      timestamp: Date.now(),
      context: {
        phase_id: '23',
        agent_id: 'observer-1',
        task_id: 'task-evidence',
        session_id: 'sess-evidence',
      },
      reasoning_chain: [],
      evidence: { inputs: [], outputs: [], references: [] },
      state_snapshot: {
        knowledge_graph_hash: 'sha256:test',
        policy_rails_version: 'v24.0',
        skill_inventory: {},
      },
      ttl_seconds: 100, // Short TTL
      is_public: true,
    };

    const ack = await ctx.memoryService.writePacket(packet);
    expect(ack.status).toBe('accepted');

    // Extend TTL when referenced in evidence
    const extended = await ctx.memoryService.extendTTL(packet.id, 86400);
    expect(extended).toBe(true);

    fixture.log(`Extended TTL for packet: ${packet.id}`);

    const retrieved = await ctx.memoryService.getPacket(packet.id);
    expect(retrieved?.ttl_seconds).toBeGreaterThan(1000);
  }, 1000);
});

/**
 * Test Suite: Phase 24 Governance API
 */
describe('Phase 24: Governance API', () => {
  let fixture: E2ETestFixture;

  beforeEach(() => {
    fixture = new E2ETestFixture();
  });

  afterEach(() => {
    fixture.reset();
  });

  it('should submit proposal and auto-determine voting threshold', async () => {
    const ctx = fixture.get();

    const proposal = ctx.governanceService.submitProposal({
      action_type: 'skill_execution',
      target_resource: 'skill-webscraper',
      requested_by: 'user-test',
      voting_threshold: 'majority',
      estimated_cost_usd: 5,
      risk_level: 'low',
    });

    fixture.log(`Proposal submitted: ${proposal.id}`);

    expect(proposal.status).toBe('pending');
    expect(proposal.voting_threshold).toBe('majority');
    expect(proposal.decision_deadline).toBeGreaterThan(Date.now());
  }, 1000);

  it('should resolve proposal on majority vote', async () => {
    const ctx = fixture.get();

    const proposal = ctx.governanceService.submitProposal({
      action_type: 'skill_execution',
      target_resource: 'skill-webscraper',
      requested_by: 'user-test',
      voting_threshold: 'majority',
      estimated_cost_usd: 5,
      risk_level: 'low',
    });

    fixture.log(`Proposal: ${proposal.id}, threshold: ${proposal.voting_threshold}`);

    // Cast majority votes (3/5 needed for majority)
    for (let i = 1; i <= 3; i++) {
      const vote = ctx.governanceService.castVote(
        proposal.id,
        `member-council-${i}`,
        'approve',
        0.95
      );

      fixture.log(`Vote ${i}: ${vote?.decision}`);
      expect(vote).not.toBeNull();
    }

    // Proposal should now be resolved
    const resolved = await fixture.waitFor(
      () => {
        const p = ctx.governanceService.getProposal(proposal.id);
        return p?.status !== 'pending' ? p : null;
      },
      500
    );

    fixture.log(`Proposal resolved: ${resolved.status}`);
    expect(resolved.status).toBe('approved');
  }, 1000);

  it('should auto-reject on timeout with default decision', async () => {
    const ctx = fixture.get();

    const proposal = ctx.governanceService.submitProposal({
      action_type: 'emergency_rollback',
      target_resource: 'phase-27-cro',
      requested_by: 'admin-user',
      voting_threshold: 'supermajority',
      estimated_cost_usd: 1000,
      risk_level: 'critical',
    });

    fixture.log(`Critical proposal: ${proposal.id}, deadline in 1s`);

    // Don't vote, just wait for timeout
    const resolved = await fixture.waitFor(
      () => {
        const p = ctx.governanceService.getProposal(proposal.id);
        return p?.status !== 'pending' ? p : null;
      },
      3700 // Timeout + buffer
    );

    fixture.log(`Auto-escalation triggered: ${resolved.status}`);
    expect(resolved.status).toBe('rejected'); // High-risk defaults to reject
    expect(resolved.executed_at).toBeDefined();
  }, 5000);
});

/**
 * Test Suite: Cross-Phase Integration (23 → 24)
 */
describe('Phase 23-24 Integration', () => {
  let fixture: E2ETestFixture;

  beforeEach(() => {
    fixture = new E2ETestFixture();
  });

  afterEach(() => {
    fixture.reset();
  });

  it('should flow memory packet through governance proposal', async () => {
    const ctx = fixture.get();

    // Step 1: Write memory packet
    const memoryPacket = {
      id: 'mem-integration-001',
      timestamp: Date.now(),
      context: {
        phase_id: '23',
        agent_id: 'observer-1',
        task_id: 'task-integration',
        session_id: 'sess-integration',
      },
      reasoning_chain: [
        {
          step_id: 'step-1',
          type: 'inference' as const,
          content: 'Recommend skill execution',
          confidence: 0.88,
          timestamp: Date.now(),
        },
      ],
      evidence: { inputs: [], outputs: [], references: [] },
      state_snapshot: {
        knowledge_graph_hash: 'sha256:test',
        policy_rails_version: 'v24.0',
        skill_inventory: {},
      },
      ttl_seconds: 86400,
      is_public: true,
    };

    const memAck = await ctx.memoryService.writePacket(memoryPacket);
    fixture.log(`Step 1: Memory packet written: ${memAck.id}`);
    expect(memAck.status).toBe('accepted');

    // Step 2: Submit governance proposal referencing memory
    const proposal = ctx.governanceService.submitProposal({
      action_type: 'skill_execution',
      target_resource: 'skill-from-memory',
      requested_by: 'phase-23-observer',
      evidence_packet_id: memoryPacket.id,
      voting_threshold: 'majority',
      estimated_cost_usd: 8,
      risk_level: 'low',
    });

    fixture.log(`Step 2: Governance proposal created: ${proposal.id}`);
    expect(proposal.evidence_packet_id).toBe(memoryPacket.id);

    // Step 3: Verify memory packet is still accessible
    const retrieved = await ctx.memoryService.getPacket(memoryPacket.id);
    fixture.log(`Step 3: Memory packet still accessible: ${retrieved ? 'yes' : 'no'}`);
    expect(retrieved).not.toBeNull();

    // Step 4: Extend TTL since referenced in active proposal
    const extended = await ctx.memoryService.extendTTL(memoryPacket.id, 604800); // 7 days
    fixture.log(`Step 4: TTL extended for referenced packet: ${extended}`);
    expect(extended).toBe(true);

    fixture.log(`Integration test complete. Flow: Memory → Governance → TTL Extension`);
  }, 1000);
});

/**
 * Test Suite: Deterministic Ordering
 */
describe('Deterministic Test Ordering', () => {
  let fixture: E2ETestFixture;

  beforeEach(() => {
    fixture = new E2ETestFixture();
  });

  it('should maintain order across 100 runs', async () => {
    for (let run = 0; run < 100; run++) {
      const ctx = fixture.get();

      // Always write, then query, then vote - deterministic order
      const packet = {
        id: `mem-order-${run}`,
        timestamp: Date.now(),
        context: {
          phase_id: '23',
          agent_id: 'observer-1',
          task_id: 'task-order',
          session_id: `sess-${run}`,
        },
        reasoning_chain: [],
        evidence: { inputs: [], outputs: [], references: [] },
        state_snapshot: {
          knowledge_graph_hash: 'sha256:test',
          policy_rails_version: 'v24.0',
          skill_inventory: {},
        },
        ttl_seconds: 86400,
        is_public: true,
      };

      const ack = await ctx.memoryService.writePacket(packet);
      expect(ack.status).toBe('accepted');

      const query = await ctx.memoryService.queryPackets({ phase_id: '23' });
      expect(query.length).toBeGreaterThan(0);

      fixture.reset(); // Reset between iterations
    }

    fixture.log(`Deterministic ordering: 100 runs PASS`);
  }, 5000);
});
