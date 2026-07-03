/**
 * Governance Routes (Phase 24)
 * Exposes GovernanceCouncil and GovernanceEvolutionEngine via HTTP
 *
 * Routes:
 * - POST /governance/proposals — submit proposal
 * - POST /governance/votes — vote on proposal
 * - POST /governance/decisions/:proposalId/finalize — finalize decision
 * - GET /governance/context/:proposalId — fetch proposal context
 * - POST /governance/evolution/amendments — generate amendments
 * - POST /governance/evolution/constraints — generate constraint updates
 * - POST /governance/evolution/policies — generate policy changes
 * - POST /governance/evolution/full-cycle — run full evolution cycle
 */

import { Router, Request, Response, NextFunction } from 'express';
import { GovernanceServiceClient, NewProposal, VoteInput } from '../clients/GovernanceServiceClient';

export function createGovernanceRouter(): Router {
  const router = Router();

  // Initialize governance service client
  const governanceClient = new GovernanceServiceClient(process.env.GOVERNANCE_URL || 'http://localhost:3113');

  /**
   * POST /governance/proposals
   * Submit a new proposal
   *
   * Body: { authorId: string, payload: unknown, metadata?: {...} }
   * Response: GovernancePacket
   */
  router.post('/governance/proposals', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const packet = await governanceClient.submitProposal(req.body as NewProposal);
      res.status(201).json(packet);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /governance/votes
   * Record a vote on a proposal
   *
   * Body: { proposalId: string, voterId: string, vote: 'yes'|'no'|'abstain', payload?: {...} }
   * Response: GovernancePacket
   */
  router.post('/governance/votes', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const packet = await governanceClient.voteOnProposal(req.body as VoteInput);
      res.status(201).json(packet);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /governance/decisions/:proposalId/finalize
   * Finalize decision on proposal (apply voting rules)
   *
   * Response: GovernancePacket (decision)
   */
  router.post(
    '/governance/decisions/:proposalId/finalize',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { proposalId } = req.params;
        const packet = await governanceClient.finalizeDecision(proposalId);
        res.json(packet);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /governance/context/:proposalId
   * Fetch full context for proposal (history + signals)
   *
   * Response: { proposal, history, signals, stats }
   */
  router.get(
    '/governance/context/:proposalId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { proposalId } = req.params;
        const ctx = await governanceClient.getContext(proposalId);
        res.json(ctx);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/amendments
   * Generate amendment proposals from drift signals
   *
   * Response: GovernancePacket[]
   */
  router.post(
    '/governance/evolution/amendments',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packets = await governanceClient.generateAmendments();
        res.status(201).json(packets);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/constraints
   * Generate constraint update proposals
   *
   * Response: GovernancePacket[]
   */
  router.post(
    '/governance/evolution/constraints',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packets = await governanceClient.generateConstraintUpdates();
        res.status(201).json(packets);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/policies
   * Generate policy change proposals
   *
   * Response: GovernancePacket[]
   */
  router.post(
    '/governance/evolution/policies',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packets = await governanceClient.generatePolicyChanges();
        res.status(201).json(packets);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/full-cycle
   * Run full evolution cycle (amendments + constraints + policies)
   *
   * Response: GovernancePacket[]
   */
  router.post(
    '/governance/evolution/full-cycle',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packets = await governanceClient.runFullCycle();
        res.status(201).json(packets);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
