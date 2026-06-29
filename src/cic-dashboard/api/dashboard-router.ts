import * as express from 'express';
import { getTracesApi } from './get-traces-api';
import { getLatencyApi } from './get-latency-api';
import { getReproducibilityApi } from './get-reproducibility-api';
import { getStabilityApi } from './get-stability-api';

export const dashboardRouter = express.Router();

dashboardRouter.get('/api/v3/traces/:runId', getTracesApi);
dashboardRouter.get('/api/v3/latency/:runId', getLatencyApi);
dashboardRouter.get('/api/v3/reproducibility/:runId', getReproducibilityApi);
dashboardRouter.get('/api/v3/stability/:modelId', getStabilityApi);
