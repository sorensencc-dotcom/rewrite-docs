import { Router } from 'express';
import { getTracesApi } from './get-traces-api';
import { getLatencyApi } from './get-latency-api';
import { getReproducibilityApi } from './get-reproducibility-api';
import { getStabilityApi } from './get-stability-api';
export const dashboardRouter = Router();
dashboardRouter.get('/v3/traces/:runId', getTracesApi);
dashboardRouter.get('/v3/latency/:runId', getLatencyApi);
dashboardRouter.get('/v3/reproducibility/:runId', getReproducibilityApi);
dashboardRouter.get('/v3/stability/:modelId', getStabilityApi);
//# sourceMappingURL=dashboard-router.js.map