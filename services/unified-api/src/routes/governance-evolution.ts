/**
 * Governance Evolution Routes (Phase 24.2)
 * Exposes autonomous evolution engine via HTTP
 *
 * Routes:
 * - POST /governance/evolution/run — run full evolution cycle
 * - POST /governance/evolution/amendments — generate amendments
 * - POST /governance/evolution/constraints — generate constraint updates
 * - POST /governance/evolution/policies — generate policy updates
 */

import { Router, Request, Response, NextFunction } from 'express';
import { GovernanceServiceClient } from '../clients/GovernanceServiceClient';

export function createGovernanceEvolutionRouter(): Router {
  const router = Router();

  const governanceClient = new GovernanceServiceClient(process.env.GOVERNANCE_URL || 'http://localhost:3113');

  /**
   * POST /governance/evolution/run
   * Run full evolution cycle (amendments + constraints + policies)
   *
   * Response: EvolutionPacket[]
   */
  router.post('/governance/evolution/run', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await governanceClient.runFullCycle();
      res.status(201).json({ results, count: results.length });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /governance/evolution/amendments
   * Generate amendment proposals from drift signals
   *
   * Response: AmendmentPacket
   */
  router.post(
    '/governance/evolution/amendments',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packet = await governanceClient.generateAmendments();
        res.status(201).json(packet);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/constraints
   * Generate constraint update proposals
   *
   * Response: ConstraintUpdatePacket
   */
  router.post(
    '/governance/evolution/constraints',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packet = await governanceClient.generateConstraintUpdates();
        res.status(201).json(packet);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /governance/evolution/policies
   * Generate policy change proposals
   *
   * Response: PolicyUpdatePacket
   */
  router.post(
    '/governance/evolution/policies',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const packet = await governanceClient.generatePolicyChanges();
        res.status(201).json(packet);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
