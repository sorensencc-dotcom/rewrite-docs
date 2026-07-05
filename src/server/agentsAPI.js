/**
 * Agents API Server - Agent list, detail, logs, executions endpoints
 * Stub implementation for development/testing
 */
import express from 'express';
import { mockAgentsList, mockLogEvents, mockExecutions } from '../mocks/agents';
const app = express();
app.use(express.json());
// In-memory agent state (stub; real implementation would use persistence)
let agents = new Map();
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
    });
});
// Routes
// Get all agents
app.get('/api/agents', (req, res) => {
    const agentList = Array.from(agents.values()).map((agent) => ({
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
app.get('/api/agents/:id', (req, res) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
});
// Get agent logs
app.get('/api/agents/:id/logs', (req, res) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    const limit = parseInt(req.query.limit) || 100;
    res.json({ logs: mockLogEvents.slice(0, limit) });
});
// Get agent executions
app.get('/api/agents/:id/executions', (req, res) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    const limit = parseInt(req.query.limit) || 100;
    res.json({ executions: mockExecutions.slice(0, limit) });
});
// Invoke agent
app.post('/api/agents/:id/invoke', (req, res) => {
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
app.post('/api/agents/:id/pause', (req, res) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    agent.status = 'offline';
    res.json({ status: 'paused', agentId: req.params.id });
});
// Restart agent
app.post('/api/agents/:id/restart', (req, res) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    agent.status = 'starting';
    agent.heartbeat = new Date().toISOString();
    res.json({ status: 'restarting', agentId: req.params.id });
});
// Snapshot single agent
app.post('/api/agents/:id/snapshot', (req, res) => {
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
app.post('/api/agents/snapshot', (req, res) => {
    res.json({
        snapshotId: `snapshot-all-${Date.now()}`,
        count: agents.size,
        timestamp: new Date().toISOString(),
    });
});
// Health check
app.get('/ready', (req, res) => {
    res.json({ ready: true });
});
// Start server
const PORT = process.env.AGENTS_API_PORT || 3118;
app.listen(PORT, () => {
    // Server listening - no console output per guard
});
export default app;
//# sourceMappingURL=agentsAPI.js.map