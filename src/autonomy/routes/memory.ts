/**
 * Memory Router (Phase 23)
 * Phase 23 Memory Layer API
 * Write-through cache, replication health, WAL recovery
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getMemoryService, MemoryPacket, MemoryQuery } from '../services/MemoryService';

export interface MemoryRouterConfig {
  memoryStoreUrl?: string;
}

export function createMemoryRouter(config?: MemoryRouterConfig): Router {
  const router = Router();
  const memoryService = getMemoryService();

  /**
   * POST /memory/packets
   * Store memory packet (Phase 23.1)
   * Write-through cache with async replication
   */
  router.post('/memory/packets', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const packet: MemoryPacket = req.body;
      const ack = await memoryService.writePacket(packet);

      if (ack.status === 'error') {
        res.status(400).json(ack);
        return;
      }

      res.status(201).json(ack);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /memory/query
   * Query packets by filters (Phase 23.2)
   * Returns paginated results with cursor
   */
  router.post('/memory/query', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: MemoryQuery = req.body;
      const packets = await memoryService.queryPackets(query);

      res.json({
        query_id: `q-${Date.now()}`,
        total_results: packets.length,
        returned: packets.length,
        packets,
        cursor: null,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /memory/packets/:packetId
   * Single packet atomic read (Phase 23.3)
   */
  router.get('/memory/packets/:packetId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { packetId } = req.params;
      const packet = await memoryService.getPacket(packetId);

      if (!packet) {
        res.status(404).json({ error: 'Packet not found' });
        return;
      }

      res.json(packet);
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /memory/packets/:packetId
   * Purge packet (Phase 23 + admin only)
   */
  router.delete('/memory/packets/:packetId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { packetId } = req.params;
      const deleted = await memoryService.deletePacket(packetId);

      if (!deleted) {
        res.status(404).json({ error: 'Packet not found' });
        return;
      }

      res.json({
        packet_id: packetId,
        status: 'deleted',
        purged_at: Date.now(),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /memory/health
   * Replication health check (CRITICAL mitigation)
   */
  router.get('/memory/health', (req: Request, res: Response) => {
    const health = memoryService.getReplicationHealth();
    res.json(health);
  });

  /**
   * POST /memory/recover
   * WAL recovery endpoint (CRITICAL mitigation)
   */
  router.post('/memory/recover', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recovered = await memoryService.recoverFromWAL();
      res.json({
        status: 'recovered',
        packets_restored: recovered,
        timestamp: Date.now(),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /memory/packets/:packetId/extend-ttl
   * Extend TTL to prevent evidence orphaning (HIGH mitigation)
   */
  router.patch('/memory/packets/:packetId/extend-ttl', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { packetId } = req.params;
      const { additional_seconds } = req.body;

      if (!additional_seconds) {
        res.status(400).json({ error: 'Missing additional_seconds' });
        return;
      }

      const extended = await memoryService.extendTTL(packetId, additional_seconds);

      if (!extended) {
        res.status(404).json({ error: 'Packet not found' });
        return;
      }

      res.json({
        packet_id: packetId,
        status: 'ttl_extended',
        additional_seconds,
        timestamp: Date.now(),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
