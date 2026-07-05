/**
 * ConsoleV3 API Server - Health, Pipelines, Alerts endpoints
 * Stub implementation for development/testing
 */
import express from 'express';
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
        state: 'running',
        progress: 65,
        timestamp: Date.now(),
    },
    {
        id: 'pipeline-002',
        name: 'Deploy Staging',
        state: 'idle',
        timestamp: Date.now(),
    },
];
const mockAlerts = [
    {
        id: 'alert-001',
        severity: 'warning',
        message: 'High memory usage detected',
        timestamp: Date.now(),
    },
];
// Routes
app.get('/health', (req, res) => {
    res.json(mockHealth);
});
app.get('/pipelines', (req, res) => {
    res.json(mockPipelines);
});
app.get('/alerts', (req, res) => {
    res.json(mockAlerts);
});
// Health check
app.get('/ready', (req, res) => {
    res.json({ ready: true });
});
// Start server
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
    // Server listening - no console output per guard
});
export default app;
//# sourceMappingURL=consoleAPI.js.map