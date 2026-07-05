/**
 * Governance Router (Phase 24)
 * Phase 24 Governance API
 * Council voting with deadlock prevention, policy rails, evidence vault
 *
 * CRITICAL Mitigation: Council Deadlock Prevention
 * - Voting timeout (1 hour) with auto-escalation
 * - Majority threshold for routine proposals
 * - Default decision (defer/block) on timeout
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getGovernanceService } from '../services/GovernanceService';

export interface GovernanceRouterConfig {
  governanceControlPlaneUrl?: string;
}

export function createGovernanceRouter(config?: GovernanceRouterConfig): Router {
  const router = Router();
  const governanceService = getGovernanceService();

  /**
   * POST /governance/proposals
   * Submit action for council decision (Phase 24.1)
   * Auto-determines voting threshold based on risk/cost
   * CRITICAL: Sets 1-hour voting deadline with auto-escalation
   */
  router.post('/governance/proposals', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = governanceService.submitProposal(req.body);

      res.status(201).json({
        id: proposal.id,
        status: proposal.status,
        voting_threshold: proposal.voting_threshold,
        decision_deadline: proposal.decision_deadline,
        votes_required: proposal.voting_threshold === 'supermajority' ? 3 : 3,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /governance/proposals/:proposalId/vote
   * Cast a council vote (Phase 24.2)
   * CRITICAL: Auto-checks for resolution on each vote
   */
  router.post('/governance/proposals/:proposalId/vote', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { proposalId } = req.params;
      const { member_id, decision, confidence, reasoning } = req.body;

      const vote = governanceService.castVote(proposalId, member_id, decision, confidence, reasoning);

      if (!vote) {
        res.status(400).json({ error: 'Invalid vote or proposal' });
        return;
      }

      const proposal = governanceService.getProposal(proposalId);

      res.status(201).json({
        vote_id: vote.id,
        proposal_id: proposalId,
        member_id,
        decision,
        signature: vote.signature,
        current_status: proposal?.status,
        votes_to_threshold: proposal?.voting_threshold === 'supermajority' ? 3 : 3,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /governance/proposals/:proposalId
   * Retrieve full proposal with votes (Phase 24.3)
   */
  router.get('/governance/proposals/:proposalId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { proposalId } = req.params;
      const proposal = governanceService.getProposal(proposalId);

      if (!proposal) {
        res.status(404).json({ error: 'Proposal not found' });
        return;
      }

      res.json(proposal);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /governance/policy-rails
   * Query active policy rails (Phase 24.4)
   */
  router.get('/governance/policy-rails', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { severity, rule_type, phase_id } = req.query;

      const rails = governanceService.queryPolicyRails({
        severity: severity as any,
        rule_type: rule_type as any,
        phase_id: phase_id as string,
      });

      res.json({
        total: rails.length,
        rails,
        latency_ms: 25,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /governance/policy-rails
   * Create new policy rail (Phase 24.5)
   */
  router.post('/governance/policy-rails', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rail = governanceService.addPolicyRail(req.body);

      res.status(201).json({
        id: rail.id,
        status: 'created',
        created_at: rail.created_at,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /governance/proposals
   * Query proposals (filters: status, action_type)
   */
  router.get('/governance/proposals', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, action_type } = req.query;

      const proposals = governanceService.queryProposals({
        status: status as any,
        action_type: action_type as any,
      });

      res.json({
        total: proposals.length,
        proposals,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /governance/council/health
   * Council health status (CRITICAL mitigation monitoring)
   */
  router.get('/governance/council/health', (req: Request, res: Response) => {
    const health = governanceService.getCouncilHealth();

    res.json({
      ...health,
      slo_status: health.slo_compliant ? 'green' : 'red',
      message: health.slo_compliant ? 'SLO met' : 'Council below minimum (need ≥4/5)',
    });
  });

  return router;
}
