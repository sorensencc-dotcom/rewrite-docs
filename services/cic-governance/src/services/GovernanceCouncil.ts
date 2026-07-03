/**
 * GovernanceCouncil — orchestrates voting, decisions, and governance record-keeping
 *
 * Workflow:
 * 1. submitProposal() → creates proposal packet in Vault
 * 2. voteOnProposal() → creates vote packet, links to proposal
 * 3. finalizeDecision() → applies rules, creates decision packet
 * 4. getContext() → fetches proposal history + signals from Memory
 */

import { VaultClient } from '../clients/VaultClient';
import { MemoryQueryClient } from '../clients/MemoryQueryClient';
import { GovernancePacket } from '../types/GovernancePacket';

export interface NewProposal {
  authorId: string;
  payload: unknown;
  metadata?: GovernancePacket['metadata'];
}

export interface VoteInput {
  proposalId: string;
  voterId: string;
  vote: 'yes' | 'no' | 'abstain';
  payload?: unknown;
}

export interface GovernanceContext {
  proposal: GovernancePacket | null;
  history: GovernancePacket[];
  signals: unknown;
  stats: unknown;
}

export class GovernanceCouncil {
  constructor(
    private readonly vaultClient: VaultClient,
    private readonly memoryClient: MemoryQueryClient
  ) {}

  /**
   * Submit a new proposal
   */
  async submitProposal(input: NewProposal): Promise<GovernancePacket> {
    return this.vaultClient.write({
      kind: 'proposal',
      authorId: input.authorId,
      payload: input.payload,
      signals: [],
      metadata: input.metadata ?? {},
    });
  }

  /**
   * Record a vote on a proposal
   */
  async voteOnProposal(input: VoteInput): Promise<GovernancePacket> {
    return this.vaultClient.write({
      kind: 'vote',
      proposalId: input.proposalId,
      authorId: input.voterId,
      payload: {
        vote: input.vote,
        ...(input.payload as any),
      },
      signals: [],
      metadata: {},
    });
  }

  /**
   * Finalize decision on proposal (majority vote)
   */
  async finalizeDecision(proposalId: string): Promise<GovernancePacket> {
    const history = await this.vaultClient.listByProposal(proposalId);

    // Count votes
    const votes = history.filter((h) => h.kind === 'vote');
    const yesVotes = votes.filter((v) => (v.payload as any).vote === 'yes').length;
    const noVotes = votes.filter((v) => (v.payload as any).vote === 'no').length;
    const totalVotes = yesVotes + noVotes;

    // Simple majority
    const approved = yesVotes > noVotes;

    const decisionPayload = {
      totalVotes,
      yesVotes,
      noVotes,
      approved,
      decision: approved ? 'APPROVED' : 'REJECTED',
    };

    return this.vaultClient.write({
      kind: 'decision',
      proposalId,
      authorId: 'governance-council',
      payload: decisionPayload,
      signals: [],
      metadata: { ruleSet: 'majority-v1' },
    });
  }

  /**
   * Get full context for a proposal (history + signals)
   */
  async getContext(proposalId: string): Promise<GovernanceContext> {
    const history = await this.vaultClient.listByProposal(proposalId);
    const proposal = history.find((h) => h.kind === 'proposal') ?? null;
    const signals = await this.memoryClient.getEventsByProposal(proposalId);
    const stats = await this.memoryClient.getStats();

    return { proposal, history, signals, stats };
  }
}
