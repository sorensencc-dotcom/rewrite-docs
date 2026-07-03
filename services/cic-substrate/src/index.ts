import express from 'express';
import dotenv from 'dotenv';
import {
  storeChunk,
  updateChunk,
  deleteChunk,
  getChunk,
  listChunks,
  searchHybridHandler,
  getContextForTaskHandler,
  getStats,
  handleWorkflow
} from './handlers';
import {
  ingestSession,
  ingestSessionRequest,
  ingestContextSlice,
  ingestReviewEvent
} from './agentic/ingestion';
import { getAgenticReadiness } from './agentic/mcp/getAgenticReadiness';
import { getDrift } from './agentic/mcp/getDrift';
import { getRuleFindings } from './agentic/mcp/getRuleFindings';
import { materializeMetricsForUserWorkspace } from './agentic/jobs/materializeMetrics';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.post('/chunks', storeChunk);
app.put('/chunks/:id', updateChunk);
app.delete('/chunks/:id', deleteChunk);
app.get('/chunks/:id', getChunk);
app.post('/chunks/list', listChunks);

app.post('/search/hybrid', searchHybridHandler);
app.post('/context/task', getContextForTaskHandler);

app.post('/workflow/start', handleWorkflow);

app.post('/agentic/sessions', ingestSession);
app.post('/agentic/session-requests', ingestSessionRequest);
app.post('/agentic/context-slices', ingestContextSlice);
app.post('/agentic/review-events', ingestReviewEvent);

app.get('/metrics/agentic-readiness', getAgenticReadiness);
app.get('/metrics/drift', getDrift);
app.get('/rules/findings', getRuleFindings);

app.get('/stats', getStats);

app.listen(port, () => {
  // Start the metrics materialization job loop (runs every 5 minutes)
  setInterval(() => {
    // In production, iterate over active users/workspaces
    materializeMetricsForUserWorkspace('system', 'default').catch(() => {});
  }, 5 * 60 * 1000);
});
