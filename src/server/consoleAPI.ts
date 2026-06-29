/**
 * ConsoleV3 API Server - Health, Pipelines, Alerts endpoints
 * Stub implementation for development/testing
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Mock data
const mockHealth = {
  status: 'OK',
  serviceCount: 5,
  timestamp: Date.now(),
};

const mockPipelines = [
  {
    id: 'pipeline-001',
    name: 'Build & Test',
    state: 'running' as const,
    progress: 65,
    timestamp: Date.now(),
  },
  {
    id: 'pipeline-002',
    name: 'Deploy Staging',
    state: 'idle' as const,
    timestamp: Date.now(),
  },
];

const mockAlerts = [
  {
    id: 'alert-001',
    severity: 'warning' as const,
    message: 'High memory usage detected',
    timestamp: Date.now(),
  },
];

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json(mockHealth);
});

app.get('/pipelines', (req: Request, res: Response) => {
  res.json(mockPipelines);
});

app.get('/alerts', (req: Request, res: Response) => {
  res.json(mockAlerts);
});

// Health check
app.get('/ready', (req: Request, res: Response) => {
  res.json({ ready: true });
});

// Start server
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  // Server listening - no console output per guard
});

export default app;
