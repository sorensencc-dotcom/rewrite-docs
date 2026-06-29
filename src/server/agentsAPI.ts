/**
 * Agents API Server - Agent list, detail, logs, executions endpoints
 * Stub implementation for development/testing
 */

import express, { Request, Response } from 'express';
import { mockAgentsList, mockAgentDetail, mockLogEvents, mockExecutions } from '../mocks/agents';
import { AgentListItem, AgentDetail } from '../types/agents';

const app = express();
app.use(express.json());

// In-memory agent state (stub; real implementation would use persistence)
let agents: Map<string, AgentDetail> = new Map();

// Initialize from mocks
mockAgentsList.forEach((agent) => {
  agents.set(agent.id, {
    ...agent,
    config: {
      maxConcurrency: 4,
      warmPool: true,
      version: '2.1.3',
    },
    system: {
      memoryMB: 512,
      lastRestart: new Date(Date.now() - 172800000).toISOString(),
      restartReason: 'scheduled-maintenance',
    },
  } as AgentDetail);
});

// Routes

// Get all agents
app.get('/api/agents', (req: Request, res: Response) => {
  const agentList: AgentListItem[] = Array.from(agents.values()).map((agent) => ({
    id: agent.id,
    name: agent.name,
    status: agent.status,
    heartbeat: agent.heartbeat,
    metrics: agent.metrics,
    skills: agent.skills,
  }));
  res.json({ agents: agentList });
});

// Get agent detail
app.get('/api/agents/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

// Get agent logs
app.get('/api/agents/:id/logs', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({ logs: mockLogEvents.slice(0, limit) });
});

// Get agent executions
app.get('/api/agents/:id/executions', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({ executions: mockExecutions.slice(0, limit) });
});

// Invoke agent
app.post('/api/agents/:id/invoke', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const { skill, payload } = req.body;
  res.json({
    executionId: `exec-${Date.now()}`,
    skill,
    status: 'started',
  });
});

// Pause agent
app.post('/api/agents/:id/pause', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  agent.status = 'offline';
  res.json({ status: 'paused', agentId: req.params.id });
});

// Restart agent
app.post('/api/agents/:id/restart', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  agent.status = 'starting';
  agent.heartbeat = new Date().toISOString();
  res.json({ status: 'restarting', agentId: req.params.id });
});

// Snapshot single agent
app.post('/api/agents/:id/snapshot', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({
    snapshotId: `snapshot-${req.params.id}-${Date.now()}`,
    agentId: req.params.id,
    timestamp: new Date().toISOString(),
  });
});

// Snapshot all agents
app.post('/api/agents/snapshot', (req: Request, res: Response) => {
  res.json({
    snapshotId: `snapshot-all-${Date.now()}`,
    count: agents.size,
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/ready', (req: Request, res: Response) => {
  res.json({ ready: true });
});

// Start server
const PORT = process.env.AGENTS_API_PORT || 3118;
app.listen(PORT, () => {
  // Server listening - no console output per guard
});

export default app;
