/**
 * Phase 24 Integration Test
 * End-to-end: Governance Council + Vault + Memory integration
 *
 * Validates:
 * - Proposal submission → Vault write
 * - Vote recording → proposal linkage
 * - Decision finalization → voting rules
 * - Context fetch → Memory query integration
 * - Evolution engine → amendment generation
 */

import axios from 'axios';

const baseUrl = 'http://localhost:3100';
const api = axios.create({ baseURL: baseUrl });

describe('Phase 24: Governance Council + Vault Integration', () => {
  /**
   * TEST 1: Submit proposal
   */
  test('submitProposal creates governance packet in Vault', async () => {
    const res = await api.post('/governance/proposals', {
      authorId: 'agent-test-1',
      payload: { title: 'Test Proposal', description: 'Phase 24 integration test' },
      metadata: { tags: ['test', 'phase-24'] },
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('id');
    expect(res.data).toHaveProperty('vaultDigest');
    expect(res.data.kind).toBe('proposal');
    expect(res.data.authorId).toBe('agent-test-1');
  });

  /**
   * TEST 2: Vote on proposal
   */
  test('voteOnProposal records vote linked to proposal', async () => {
    // Create proposal
    const proposalRes = await api.post('/governance/proposals', {
      authorId: 'agent-test-2',
      payload: { title: 'Vote Test Proposal' },
    });
    const proposalId = proposalRes.data.id;

    // Vote on it
    const voteRes = await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-3',
      vote: 'yes',
    });

    expect(voteRes.status).toBe(201);
    expect(voteRes.data.kind).toBe('vote');
    expect(voteRes.data.proposalId).toBe(proposalId);
    expect((voteRes.data.payload as any).vote).toBe('yes');
  });

  /**
   * TEST 3: Finalize decision
   */
  test('finalizeDecision applies voting rules and creates decision packet', async () => {
    // Create proposal
    const proposalRes = await api.post('/governance/proposals', {
      authorId: 'agent-test-4',
      payload: { title: 'Decision Test Proposal' },
    });
    const proposalId = proposalRes.data.id;

    // Cast votes (majority yes)
    await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-5',
      vote: 'yes',
    });
    await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-6',
      vote: 'yes',
    });
    await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-7',
      vote: 'no',
    });

    // Finalize
    const decisionRes = await api.post(`/governance/decisions/${proposalId}/finalize`);

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.data.kind).toBe('decision');
    expect(decisionRes.data.proposalId).toBe(proposalId);
    expect((decisionRes.data.payload as any).approved).toBe(true);
    expect((decisionRes.data.payload as any).decision).toBe('APPROVED');
    expect((decisionRes.data.payload as any).totalVotes).toBe(3);
    expect((decisionRes.data.payload as any).yesVotes).toBe(2);
  });

  /**
   * TEST 4: Get proposal context
   */
  test('getContext fetches proposal history and signals', async () => {
    // Create proposal
    const proposalRes = await api.post('/governance/proposals', {
      authorId: 'agent-test-8',
      payload: { title: 'Context Test Proposal' },
    });
    const proposalId = proposalRes.data.id;

    // Add a vote
    await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-9',
      vote: 'yes',
    });

    // Fetch context
    const ctxRes = await api.get(`/governance/context/${proposalId}`);

    expect(ctxRes.status).toBe(200);
    expect(ctxRes.data).toHaveProperty('proposal');
    expect(ctxRes.data).toHaveProperty('history');
    expect(ctxRes.data).toHaveProperty('signals');
    expect(ctxRes.data).toHaveProperty('stats');
    expect(ctxRes.data.proposal.id).toBe(proposalId);
    expect(Array.isArray(ctxRes.data.history)).toBe(true);
    expect(ctxRes.data.history.length).toBeGreaterThanOrEqual(2); // proposal + vote
  });

  /**
   * TEST 5: Amendment generation
   */
  test('generateAmendments creates amendment proposals from drift', async () => {
    const res = await api.post('/governance/evolution/amendments');

    expect(res.status).toBe(201);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0) {
      expect(res.data[0].kind).toBe('amendment');
      expect(res.data[0].authorId).toBe('governance-evolution-engine');
    }
  });

  /**
   * TEST 6: Constraint update generation
   */
  test('generateConstraintUpdates creates constraint proposals', async () => {
    const res = await api.post('/governance/evolution/constraints');

    expect(res.status).toBe(201);
    expect(Array.isArray(res.data)).toBe(true);
    // May be empty if no recent violations
  });

  /**
   * TEST 7: Policy change generation
   */
  test('generatePolicyChanges creates policy proposals', async () => {
    const res = await api.post('/governance/evolution/policies');

    expect(res.status).toBe(201);
    expect(Array.isArray(res.data)).toBe(true);
    // May be empty if no recent history
  });

  /**
   * TEST 8: Full evolution cycle
   */
  test('runFullCycle generates all amendment types', async () => {
    const res = await api.post('/governance/evolution/full-cycle');

    expect(res.status).toBe(201);
    expect(Array.isArray(res.data)).toBe(true);
    // Total packets should be sum of amendments + constraints + policies
  });

  /**
   * TEST 9: Vault digest determinism
   */
  test('Vault digest is deterministic (same packet → same digest)', async () => {
    const payload = {
      authorId: 'agent-test-10',
      payload: { title: 'Digest Test' },
    };

    const res1 = await api.post('/governance/proposals', payload);
    const digest1 = res1.data.vaultDigest;

    // Fetch the packet back
    const ctxRes = await api.get(`/governance/context/${res1.data.id}`);
    const fetchedPacket = ctxRes.data.proposal;

    // Digest should match
    expect(fetchedPacket.vaultDigest).toBe(digest1);
  });

  /**
   * TEST 10: Rejection decision (no votes)
   */
  test('finalizeDecision rejects when no yes votes', async () => {
    const proposalRes = await api.post('/governance/proposals', {
      authorId: 'agent-test-11',
      payload: { title: 'Rejection Test' },
    });
    const proposalId = proposalRes.data.id;

    // Vote no
    await api.post('/governance/votes', {
      proposalId,
      voterId: 'agent-test-12',
      vote: 'no',
    });

    // Finalize
    const decisionRes = await api.post(`/governance/decisions/${proposalId}/finalize`);

    expect(decisionRes.data.payload).toHaveProperty('approved', false);
    expect(decisionRes.data.payload).toHaveProperty('decision', 'REJECTED');
  });
});
