import * as express from 'express';
import { getTracesApi } from './get-traces-api';
import { getLatencyApi } from './get-latency-api';
import { getReproducibilityApi } from './get-reproducibility-api';
import { getStabilityApi } from './get-stability-api';
import { dashboardPollingService } from '../services/dashboard-polling-service';

export const dashboardRouter = express.Router();

dashboardRouter.get('/api/v3/traces/:runId', getTracesApi);
dashboardRouter.get('/api/v3/latency/:runId', getLatencyApi);
dashboardRouter.get('/api/v3/reproducibility/:runId', getReproducibilityApi);
dashboardRouter.get('/api/v3/stability/:modelId', getStabilityApi);

// Dashboard node polling endpoints
dashboardRouter.get('/api/v3/nodes/status', (req: express.Request, res: express.Response) => {
  const status = dashboardPollingService.getStatus();
  return res.json(status);
});

dashboardRouter.get('/api/v3/nodes/:nodeId', (req: express.Request, res: express.Response) => {
  const nodeId = req.params.nodeId;
  const result = dashboardPollingService.getLastResult(nodeId);
  if (!result) {
    return res.status(404).json({ error: `Node ${nodeId} not found` });
  }
  return res.json(result);
});

dashboardRouter.get('/api/v3/nodes', (req: express.Request, res: express.Response) => {
  const results = dashboardPollingService.getAllLastResults();
  return res.json(Object.fromEntries(results));
});
