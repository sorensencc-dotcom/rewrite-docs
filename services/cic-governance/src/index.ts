/**
 * CIC Governance Service - Main Entry Point (Phase 24)
 *
 * Exposes REST API for:
 * - Council voting
 * - Decision-making
 * - Governance record logging
 */

import express, { Express, Request, Response } from 'express';
import { GovernanceCouncil } from './services/GovernanceCouncil';
import { VaultClient } from './clients/VaultClient';
import { MemoryQueryClient } from './clients/MemoryQueryClient';

const port = parseInt(process.env.GOV_PORT || '3113', 10);
const vaultUrl = process.env.VAULT_URL || 'http://vault:3111';
const memoryUrl = process.env.MEMORY_URL || 'http://memory:3101';

async function createServer(): Promise<Express> {
  const app = express();

  app.use(express.json());

  // Initialize clients
  const vaultClient = new VaultClient(vaultUrl);
  const memoryClient = new MemoryQueryClient(memoryUrl);
  const council = new GovernanceCouncil(vaultClient, memoryClient);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'cic-governance' });
  });

  // Governance API endpoints
  app.post('/api/governance/proposal', async (req: Request, res: Response) => {
    try {
      const proposal = await council.submitProposal(req.body);
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/governance/vote', async (req: Request, res: Response) => {
    try {
      const decision = await council.voteOnProposal(req.body);
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/api/governance/context/:proposalId', async (req: Request, res: Response) => {
    try {
      const context = await council.getContext(req.params.proposalId);
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return app;
}

async function main() {
  try {
    const app = await createServer();
    app.listen(port, () => {
      console.log(`CIC Governance service listening on port ${port}`);
    });
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
