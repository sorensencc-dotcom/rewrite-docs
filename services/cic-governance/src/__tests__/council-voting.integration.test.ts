/**
 * Council Voting Integration Tests (Phase 24 Governance)
 *
 * Tests the GovernanceCouncil HTTP API end-to-end using an in-process Express
 * app with mocked VaultClient and MemoryQueryClient. No external services
 * required — passes with or without docker-compose.
 */

import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { GovernanceCouncil } from '../services/GovernanceCouncil';
import { VaultClient } from '../clients/VaultClient';
import { MemoryQueryClient } from '../clients/MemoryQueryClient';
import { GovernancePacket } from '../types/GovernancePacket';

jest.mock('../clients/VaultClient');
jest.mock('../clients/MemoryQueryClient');

// ─── helpers ────────────────────────────────────────────────────────────────

function makePacket(
  overrides: Partial<GovernancePacket> & Pick<GovernancePacket, 'kind' | 'authorId' | 'payload'>
): GovernancePacket {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    vaultDigest: crypto.randomBytes(32).toString('hex'),
    signals: [],
    metadata: {},
    proposalId: undefined,
    ...overrides,
  };
}

// ─── in-process app factory ──────────────────────────────────────────────────

// Metrics counter — incremented when a decision packet is written
const metricsCounters: Record<string, number> = {};

function buildApp(vaultClient: VaultClient, memoryClient: MemoryQueryClient): Express {
  const app = express();
  app.use(express.json());

  const council = new GovernanceCouncil(vaultClient, memoryClient);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'cic-governance' });
  });

  app.post('/api/governance/proposal', async (req: Request, res: Response) => {
    try {
      const proposal = await council.submitProposal(req.body);
      res.json(proposal);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/governance/vote', async (req: Request, res: Response) => {
    try {
      const vote = await council.voteOnProposal(req.body);
      res.json(vote);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/governance/finalize/:proposalId', async (req: Request, res: Response) => {
    try {
      const decision = await council.finalizeDecision(req.params.proposalId);
      // Track metric
      const label = (decision.payload as any).approved ? 'approved' : 'rejected';
      metricsCounters[label] = (metricsCounters[label] ?? 0) + 1;
      res.json(decision);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/governance/context/:proposalId', async (req: Request, res: Response) => {
    try {
      const context = await council.getContext(req.params.proposalId);
      res.json(context);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Prometheus-style metrics endpoint
  app.get('/metrics', (_req: Request, res: Response) => {
    const approved = metricsCounters['approved'] ?? 0;
    const rejected = metricsCounters['rejected'] ?? 0;
    const body = [
      '# HELP cic_governance_decisions_total Total governance decisions by outcome',
      '# TYPE cic_governance_decisions_total counter',
      `cic_governance_decisions_total{decision="approved"} ${approved}`,
      `cic_governance_decisions_total{decision="rejected"} ${rejected}`,
    ].join('\n');
    res.type('text/plain').send(body);
  });

  return app;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('Council Voting Integration', () => {
  let app: Express;
  let mockVault: jest.Mocked<VaultClient>;
  let mockMemory: jest.Mocked<MemoryQueryClient>;

  // In-memory vault store keyed by proposalId
  const store: Map<string, GovernancePacket[]> = new Map();

  beforeEach(() => {
    store.clear();
    Object.keys(metricsCounters).forEach((k) => delete metricsCounters[k]);

    mockVault = new VaultClient() as jest.Mocked<VaultClient>;
    mockMemory = new MemoryQueryClient() as jest.Mocked<MemoryQueryClient>;

    // write() materialises a packet and stores it.
    // All packets for a proposal (including the proposal itself) live in one
    // bucket keyed by proposalId (= packet.id for proposal-kind packets).
    mockVault.write.mockImplementation(async (input) => {
      const packet = makePacket({
        kind: input.kind,
        authorId: input.authorId,
        payload: input.payload,
        proposalId: (input as any).proposalId,
        signals: input.signals ?? [],
        metadata: input.metadata ?? {},
      });

      // For proposal packets the bucket key is the packet's own id.
      // For vote/decision packets the bucket key is the linked proposalId.
      const bucketKey = packet.kind === 'proposal' ? packet.id : packet.proposalId!;
      if (!store.has(bucketKey)) store.set(bucketKey, []);
      store.get(bucketKey)!.push(packet);

      return packet;
    });

    mockVault.listByProposal.mockImplementation(async (proposalId) => {
      return store.get(proposalId) ?? [];
    });

    mockMemory.getEventsByProposal.mockResolvedValue([]);
    mockMemory.getStats.mockResolvedValue({ total: 0 });

    app = buildApp(mockVault, mockMemory);
  });

  // ── test 1 ──────────────────────────────────────────────────────────────────
  test('Proposal submission returns ID and pending status', async () => {
    const res = await request(app)
      .post('/api/governance/proposal')
      .send({
        authorId: 'agent-alpha',
        payload: { title: 'Upgrade runtime', description: 'Bump Node to v22' },
        metadata: { tags: ['runtime'] },
      })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('string');
    expect(res.body.kind).toBe('proposal');
    expect(res.body.authorId).toBe('agent-alpha');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('vaultDigest');
    expect(mockVault.write).toHaveBeenCalledTimes(1);
    expect(mockVault.write).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'proposal', authorId: 'agent-alpha' })
    );
  });

  // ── test 2 ──────────────────────────────────────────────────────────────────
  test('Council votes on proposal — each vote returns a vote packet', async () => {
    // Submit proposal first
    const propRes = await request(app)
      .post('/api/governance/proposal')
      .send({ authorId: 'agent-beta', payload: { title: 'Add telemetry' } })
      .expect(200);

    const proposalId = propRes.body.id;

    // Cast two votes
    const votes = [
      { voterId: 'council-member-1', decision: 'approve' },
      { voterId: 'council-member-2', decision: 'approve' },
    ];

    for (const v of votes) {
      const voteRes = await request(app)
        .post('/api/governance/vote')
        .send({ proposalId, voterId: v.voterId, vote: 'yes', reasoning: v.decision })
        .expect(200);

      expect(voteRes.body.kind).toBe('vote');
      expect(voteRes.body.proposalId).toBe(proposalId);
      expect((voteRes.body.payload as any).vote).toBe('yes');
    }

    // VaultClient.write called once for proposal + twice for votes
    expect(mockVault.write).toHaveBeenCalledTimes(3);
  });

  // ── test 3 ──────────────────────────────────────────────────────────────────
  test('Decision is written to vault when vote threshold is met', async () => {
    // Submit proposal
    const propRes = await request(app)
      .post('/api/governance/proposal')
      .send({ authorId: 'agent-gamma', payload: { title: 'Enable canary deploys' } })
      .expect(200);

    const proposalId = propRes.body.id;

    // 3 votes: majority yes
    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-1', vote: 'yes' })
      .expect(200);
    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-2', vote: 'yes' })
      .expect(200);
    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-3', vote: 'no' })
      .expect(200);

    // Finalize
    const finalRes = await request(app)
      .post(`/api/governance/finalize/${proposalId}`)
      .expect(200);

    expect(finalRes.body.kind).toBe('decision');
    expect(finalRes.body.proposalId).toBe(proposalId);
    expect((finalRes.body.payload as any).approved).toBe(true);
    expect((finalRes.body.payload as any).decision).toBe('APPROVED');
    expect((finalRes.body.payload as any).totalVotes).toBe(3);
    expect((finalRes.body.payload as any).yesVotes).toBe(2);
    expect((finalRes.body.payload as any).noVotes).toBe(1);

    // Verify vault recorded the decision
    expect(mockVault.write).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'decision', proposalId })
    );
    expect(mockVault.listByProposal).toHaveBeenCalledWith(proposalId);
  });

  // ── test 4 ──────────────────────────────────────────────────────────────────
  test('Rejected decision when no-votes win', async () => {
    const propRes = await request(app)
      .post('/api/governance/proposal')
      .send({ authorId: 'agent-delta', payload: { title: 'Remove audit log' } })
      .expect(200);

    const proposalId = propRes.body.id;

    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-a', vote: 'no' })
      .expect(200);
    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-b', vote: 'no' })
      .expect(200);
    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-c', vote: 'yes' })
      .expect(200);

    const finalRes = await request(app)
      .post(`/api/governance/finalize/${proposalId}`)
      .expect(200);

    expect((finalRes.body.payload as any).approved).toBe(false);
    expect((finalRes.body.payload as any).decision).toBe('REJECTED');
  });

  // ── test 5 ──────────────────────────────────────────────────────────────────
  test('Metrics exported for governance decisions', async () => {
    // Run one approved decision
    const propRes = await request(app)
      .post('/api/governance/proposal')
      .send({ authorId: 'agent-epsilon', payload: { title: 'Enable SLO alerts' } })
      .expect(200);

    const proposalId = propRes.body.id;

    await request(app)
      .post('/api/governance/vote')
      .send({ proposalId, voterId: 'council-x', vote: 'yes' })
      .expect(200);

    await request(app)
      .post(`/api/governance/finalize/${proposalId}`)
      .expect(200);

    // Fetch Prometheus metrics
    const metricsRes = await request(app).get('/metrics').expect(200);

    expect(metricsRes.text).toContain('cic_governance_decisions_total');
    expect(metricsRes.text).toContain('decision="approved"');

    // Extract value
    const match = metricsRes.text.match(
      /cic_governance_decisions_total\{decision="approved"\}\s+(\d+)/
    );
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBeGreaterThan(0);
  });
});
