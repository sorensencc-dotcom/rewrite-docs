/**
 * HTTP Client for Governance Service
 * Proxies calls to cic-governance microservice
 */

export interface GovernancePacket {
  id: string;
  type: string;
  proposalId?: string;
  decision?: unknown;
  timestamp: number;
}

export interface NewProposal {
  authorId: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

export interface VoteInput {
  proposalId: string;
  voterId: string;
  vote: 'yes' | 'no' | 'abstain';
  payload?: Record<string, unknown>;
}

export class GovernanceServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async submitProposal(proposal: NewProposal): Promise<GovernancePacket> {
    const res = await fetch(`${this.baseUrl}/governance/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal),
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as GovernancePacket;
  }

  async voteOnProposal(vote: VoteInput): Promise<GovernancePacket> {
    const res = await fetch(`${this.baseUrl}/governance/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote),
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async finalizeDecision(proposalId: string): Promise<GovernancePacket> {
    const res = await fetch(`${this.baseUrl}/governance/decisions/${proposalId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async getContext(proposalId: string): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/governance/context/${proposalId}`);
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async generateAmendments(): Promise<GovernancePacket[]> {
    const res = await fetch(`${this.baseUrl}/governance/evolution/amendments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async generateConstraintUpdates(): Promise<GovernancePacket[]> {
    const res = await fetch(`${this.baseUrl}/governance/evolution/constraints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async generatePolicyChanges(): Promise<GovernancePacket[]> {
    const res = await fetch(`${this.baseUrl}/governance/evolution/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }

  async runFullCycle(): Promise<GovernancePacket[]> {
    const res = await fetch(`${this.baseUrl}/governance/evolution/full-cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Governance service error: ${res.status}`);
    return (await res.json()) as any;
  }
}
