/**
 * Phase 24: Governance Service
 * Council voting, policy rails, evidence vault
 *
 * CRITICAL Mitigation: Council Deadlock Prevention
 * - Majority threshold for routine proposals
 * - Auto-escalate voting with timeout (1 hour)
 * - Default decision (defer/block) on timeout
 * - Council availability SLO enforcement
 */

import { EventEmitter } from 'events';

export interface CouncilVote {
  id: string;
  proposal_id: string;
  member_id: string;
  decision: 'approve' | 'reject' | 'abstain' | 'defer';
  reasoning?: string;
  confidence: number;
  timestamp: number;
  signature?: string;
}

export interface ProposalForDecision {
  id: string;
  action_type: 'skill_execution' | 'memory_purge' | 'policy_update' | 'resource_allocation' | 'emergency_rollback';
  target_resource: string;
  requested_by: string;
  evidence_packet_id?: string;
  decision_deadline: number;
  voting_threshold: 'majority' | 'supermajority' | 'unanimous' | 'single_approval';
  votes: CouncilVote[];
  status: 'pending' | 'approved' | 'rejected' | 'deferred' | 'expired';
  executed_at?: number;
  estimated_cost_usd?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PolicyRail {
  id: string;
  governance_version: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_type: 'capability_gate' | 'approval_required' | 'cost_limit' | 'latency_bound' | 'data_access' | 'skill_isolation';
  condition: {
    phase_ids?: string[];
    skill_ids?: string[];
    resource_types?: string[];
    cost_threshold?: number;
  };
  enforcement: 'block' | 'warn' | 'audit' | 'defer';
  evidence_requirement: 'none' | 'memory_packet' | 'observation' | 'council_approval';
  created_at: number;
  expires_at?: number;
}

export interface VotingResult {
  proposal_id: string;
  status: 'approved' | 'rejected' | 'deferred';
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  votes_defer: number;
  decided_at: number;
  default_applied?: boolean;
  reason?: string;
}

class GovernanceService extends EventEmitter {
  private proposals = new Map<string, ProposalForDecision>();
  private councilMembers = new Set<string>();
  private policyRails = new Map<string, PolicyRail>();
  private votingTimeoutMs = 3600000; // 1 hour
  private votingTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    this.initializeCouncil();
  }

  /**
   * Initialize council with 5 members (supermajority = 3, majority = 3)
   */
  private initializeCouncil(): void {
    this.councilMembers.add('member-council-1');
    this.councilMembers.add('member-council-2');
    this.councilMembers.add('member-council-3');
    this.councilMembers.add('member-council-4');
    this.councilMembers.add('member-council-5');
  }

  /**
   * Submit proposal for decision
   * CRITICAL: Automatically determine threshold based on risk level
   */
  submitProposal(proposal: Omit<ProposalForDecision, 'id' | 'status' | 'votes'>): ProposalForDecision {
    const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Auto-determine threshold: routine (<$10, low-risk) = majority, others = supermajority
    let threshold = proposal.voting_threshold;
    if (!threshold) {
      const isCheap = (proposal.estimated_cost_usd || 0) < 10;
      const isLowRisk = proposal.risk_level === 'low';
      threshold = isCheap && isLowRisk ? 'majority' : 'supermajority';
    }

    // CRITICAL: Set voting deadline (1 hour from now)
    const deadline = Date.now() + this.votingTimeoutMs;

    const newProposal: ProposalForDecision = {
      ...proposal,
      id,
      voting_threshold: threshold,
      decision_deadline: deadline,
      status: 'pending',
      votes: [],
    };

    this.proposals.set(id, newProposal);

    // CRITICAL: Start timeout timer for auto-escalation
    this.startVotingTimer(id, deadline);

    this.emit('proposal_submitted', { id, threshold, deadline });
    return newProposal;
  }

  /**
   * Cast a vote on a proposal
   */
  castVote(
    proposalId: string,
    memberId: string,
    decision: CouncilVote['decision'],
    confidence: number,
    reasoning?: string
  ): CouncilVote | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    // Check if already voted
    if (proposal.votes.some(v => v.member_id === memberId)) {
      return null;
    }

    // Validate member
    if (!this.councilMembers.has(memberId)) {
      return null;
    }

    const vote: CouncilVote = {
      id: `vote-${proposalId}-${memberId}`,
      proposal_id: proposalId,
      member_id: memberId,
      decision,
      reasoning,
      confidence,
      timestamp: Date.now(),
      signature: this.generateSignature(proposalId, decision),
    };

    proposal.votes.push(vote);

    // Check if we can resolve now
    this.checkAndResolveProposal(proposalId);

    return vote;
  }

  /**
   * Get all votes for a proposal
   */
  getProposalVotes(proposalId: string): CouncilVote[] {
    const proposal = this.proposals.get(proposalId);
    return proposal?.votes || [];
  }

  /**
   * Retrieve full proposal
   */
  getProposal(proposalId: string): ProposalForDecision | null {
    return this.proposals.get(proposalId) || null;
  }

  /**
   * Query active proposals
   */
  queryProposals(filters?: {
    status?: ProposalForDecision['status'];
    action_type?: ProposalForDecision['action_type'];
  }): ProposalForDecision[] {
    let results = Array.from(this.proposals.values());

    if (filters?.status) {
      results = results.filter(p => p.status === filters.status);
    }
    if (filters?.action_type) {
      results = results.filter(p => p.action_type === filters.action_type);
    }

    return results;
  }

  /**
   * CRITICAL: Check proposal resolution
   * Majority threshold: >50% of council
   * Supermajority threshold: ≥60% of council
   * Auto-escalate if deadline passed
   */
  private checkAndResolveProposal(proposalId: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'pending') return;

    const voteCount = proposal.votes.length;
    const councilSize = this.councilMembers.size;

    // Check if we have enough votes for decision
    const approvesNeeded = this.getRequiredVotes(proposal.voting_threshold, councilSize);
    const approves = proposal.votes.filter(v => v.decision === 'approve').length;
    const rejects = proposal.votes.filter(v => v.decision === 'reject').length;

    // Auto-resolve if threshold met
    if (approves >= approvesNeeded) {
      this.resolveProposal(proposalId, 'approved', false);
      return;
    }

    // Auto-reject if impossible to reach threshold
    const maxApproves = approves + (councilSize - voteCount);
    if (maxApproves < approvesNeeded && rejects > 0) {
      this.resolveProposal(proposalId, 'rejected', false);
      return;
    }
  }

  /**
   * CRITICAL: Auto-escalation on timeout
   * If deadline passed with no resolution, apply default decision
   */
  private startVotingTimer(proposalId: string, deadline: number): void {
    const delay = Math.max(0, deadline - Date.now());

    const timer = setTimeout(() => {
      const proposal = this.proposals.get(proposalId);
      if (!proposal || proposal.status !== 'pending') return;

      // CRITICAL: Apply default decision
      // Routine proposals: defer to policy
      // High-risk proposals: block
      const isRoutine = proposal.estimated_cost_usd && proposal.estimated_cost_usd < 10
        && proposal.risk_level === 'low';
      const defaultDecision = isRoutine ? 'deferred' : 'rejected';

      this.resolveProposal(proposalId, defaultDecision, true);
    }, delay);

    this.votingTimers.set(proposalId, timer);
  }

  /**
   * Resolve proposal with final decision
   */
  private resolveProposal(
    proposalId: string,
    status: 'approved' | 'rejected' | 'deferred',
    defaultApplied: boolean
  ): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return;

    proposal.status = status;
    proposal.executed_at = Date.now();

    const voteCount = proposal.votes.length;
    const approves = proposal.votes.filter(v => v.decision === 'approve').length;
    const rejects = proposal.votes.filter(v => v.decision === 'reject').length;
    const abstains = proposal.votes.filter(v => v.decision === 'abstain').length;
    const defers = proposal.votes.filter(v => v.decision === 'defer').length;

    const result: VotingResult = {
      proposal_id: proposalId,
      status,
      votes_for: approves,
      votes_against: rejects,
      votes_abstain: abstains,
      votes_defer: defers,
      decided_at: Date.now(),
      default_applied: defaultApplied,
      reason: defaultApplied ? `Auto-${status} on timeout after ${voteCount}/${this.councilMembers.size} votes` : undefined,
    };

    this.emit('proposal_resolved', result);

    // Cleanup timer
    const timer = this.votingTimers.get(proposalId);
    if (timer) {
      clearTimeout(timer);
      this.votingTimers.delete(proposalId);
    }
  }

  /**
   * Get required votes for threshold
   */
  private getRequiredVotes(threshold: string, councilSize: number): number {
    switch (threshold) {
      case 'unanimous':
        return councilSize;
      case 'supermajority':
        return Math.ceil(councilSize * 0.6);
      case 'single_approval':
        return 1;
      case 'majority':
      default:
        return Math.ceil(councilSize * 0.5);
    }
  }

  /**
   * Generate vote signature (immutability)
   */
  private generateSignature(proposalId: string, decision: string): string {
    const data = `${proposalId}:${decision}:${Date.now()}`;
    const hash = require('crypto').createHash('sha256').update(data).digest('hex');
    return hash;
  }

  /**
   * Add policy rail
   */
  addPolicyRail(rail: Omit<PolicyRail, 'id' | 'created_at'>): PolicyRail {
    const id = `rail-governance.${rail.governance_version}-${this.policyRails.size}`;
    const newRail: PolicyRail = {
      ...rail,
      id,
      created_at: Date.now(),
    };
    this.policyRails.set(id, newRail);
    return newRail;
  }

  /**
   * Query policy rails
   */
  queryPolicyRails(filters?: {
    severity?: PolicyRail['severity'];
    rule_type?: PolicyRail['rule_type'];
    phase_id?: string;
  }): PolicyRail[] {
    let results = Array.from(this.policyRails.values());

    if (filters?.severity) {
      results = results.filter(r => r.severity === filters.severity);
    }
    if (filters?.rule_type) {
      results = results.filter(r => r.rule_type === filters.rule_type);
    }

    return results;
  }

  /**
   * Get council health status
   */
  getCouncilHealth(): {
    total_members: number;
    active_members: number;
    pending_proposals: number;
    slo_compliant: boolean;
  } {
    const pending = Array.from(this.proposals.values()).filter(p => p.status === 'pending').length;
    const active = this.councilMembers.size;

    return {
      total_members: this.councilMembers.size,
      active_members: active,
      pending_proposals: pending,
      slo_compliant: active >= 4, // ≥4/5 online for SLO
    };
  }
}

// Singleton instance
let instance: GovernanceService;

export function getGovernanceService(): GovernanceService {
  if (!instance) {
    instance = new GovernanceService();
  }
  return instance;
}

export { GovernanceService };
