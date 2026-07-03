/**
 * TorqueQuery Routes (Phase 26)
 * Exposes memory indexing via exact-match queries (not semantic search)
 *
 * Routes:
 * - GET /torquequery/memory/by-type/:type — find events by type (exact match)
 * - GET /torquequery/memory/by-agent/:agentId — find events by agent (exact match)
 * - GET /torquequery/memory/by-correlation/:correlationId — find events by correlation (exact match)
 * - GET /torquequery/memory/by-signal/:signalType — find signals by type (exact match)
 * - GET /torquequery/agent/:agentId/timeline — fetch agent timeline
 * - GET /torquequery/governance/history/:proposalId — fetch governance history
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TorqueQueryServiceClient } from '../clients/TorqueQueryServiceClient';

export async function createTorqueQueryRouter(): Promise<Router> {
  const router = Router();
  const torqueQueryClient = new TorqueQueryServiceClient(process.env.TORQUEQUERY_URL || 'http://localhost:3110');

  /**
   * GET /torquequery/memory/by-type/:type
   * Find events by type
   */
  router.get(
    '/torquequery/memory/by-type/:type',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type } = req.params;
        const events = await torqueQueryClient.byType(type);
        res.json({ events, count: events.length });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /torquequery/memory/by-agent/:agentId
   * Find events by agent
   */
  router.get(
    '/torquequery/memory/by-agent/:agentId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { agentId } = req.params;
        const events = await torqueQueryClient.byAgent(agentId);
        const count = await torqueQueryClient.countByAgent(agentId);
        res.json({ events, count });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /torquequery/memory/by-correlation/:correlationId
   * Find events by correlation
   */
  router.get(
    '/torquequery/memory/by-correlation/:correlationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { correlationId } = req.params;
        const events = await torqueQueryClient.byCorrelation(correlationId);
        res.json({ events, count: events.length });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /torquequery/memory/by-signal/:signalType
   * Find signals by type
   */
  router.get(
    '/torquequery/memory/by-signal/:signalType',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { signalType } = req.params;
        const signals = await torqueQueryClient.bySignal(signalType);
        res.json({ signals, count: signals.length });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /torquequery/agent/:agentId/timeline
   * Fetch agent timeline
   */
  router.get(
    '/torquequery/agent/:agentId/timeline',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { agentId } = req.params;
        const timeline = await torqueQueryClient.agentTimeline(agentId);
        res.json({ timeline, count: timeline.length });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * GET /torquequery/governance/history/:proposalId
   * Fetch governance history
   */
  router.get(
    '/torquequery/governance/history/:proposalId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { proposalId } = req.params;
        const history = await torqueQueryClient.governanceHistory(proposalId);
        res.json({ history, count: history.length });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
