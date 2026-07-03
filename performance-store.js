const http = require('http');

class PerformanceStore {
  constructor() {
    this.port = parseInt(process.env.PORT || '3105', 10);
    this.metrics = new Map();
    this.builds = [];
  }

  initialize() {
    console.log(`[PerformanceStore] Initializing on port ${this.port}`);
    console.log(`[PerformanceStore] Tracking build metrics for Phase 0.8`);
  }

  recordBuild(build) {
    // nodeResults is already an array from orchestrator JSON serialization
    const nodeMetrics = Array.isArray(build.nodeResults)
      ? build.nodeResults
      : Array.from(build.nodeResults.entries()).map(([nodeId, result]) => ({
          nodeId,
          executionTime: result.executionTime,
          phase: result.phase,
        }));

    const metric = {
      buildId: build.id,
      totalTime: build.endTime - build.startTime,
      nodeCount: build.nodeCount,
      nodeMetrics,
      timestamp: new Date().toISOString(),
      state: build.state,
    };

    this.metrics.set(build.id, metric);
    this.builds.push(metric);

    // Keep last 1000 builds
    if (this.builds.length > 1000) {
      this.builds = this.builds.slice(-1000);
    }

    return metric;
  }

  getNodeStats(nodeId) {
    const nodeRuns = this.builds
      .flatMap((b) => b.nodeMetrics.filter((n) => n.nodeId === nodeId))
      .map((n) => n.executionTime);

    if (nodeRuns.length === 0) {
      return null;
    }

    const sorted = nodeRuns.sort((a, b) => a - b);
    const avg = nodeRuns.reduce((a, b) => a + b, 0) / nodeRuns.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { count: nodeRuns.length, avg, median, p95, p99, min: sorted[0], max: sorted[sorted.length - 1] };
  }

  predictNodeTime(nodeId) {
    const stats = this.getNodeStats(nodeId);
    if (!stats) {
      return { prediction: 250, confidence: 0.5, reason: 'no history' };
    }

    // Use p95 as prediction with high confidence
    return {
      prediction: Math.ceil(stats.p95),
      confidence: Math.min(0.95, Math.log(stats.count + 1) / 5),
      reason: `p95 of ${stats.count} runs`,
    };
  }

  predictCriticalPath(dag) {
    const nodeTimePredictions = new Map();
    const nodeMap = new Map(dag.map((n) => [n.id, n]));

    // Get time predictions for each node
    for (const node of dag) {
      nodeTimePredictions.set(node.id, this.predictNodeTime(node.id));
    }

    // Calculate critical path using longest path algorithm
    const longestPath = {};
    const visited = new Set();

    const dfs = (nodeId) => {
      if (visited.has(nodeId)) return longestPath[nodeId] || 0;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      const nodeTime = nodeTimePredictions.get(nodeId).prediction || 250;

      if (!node.dependencies || node.dependencies.length === 0) {
        longestPath[nodeId] = nodeTime;
        return nodeTime;
      }

      const depMax = Math.max(...node.dependencies.map((dep) => dfs(dep)));
      longestPath[nodeId] = nodeTime + depMax;
      return longestPath[nodeId];
    };

    for (const node of dag) {
      dfs(node.id);
    }

    const criticalPath = Math.max(...Object.values(longestPath));
    return {
      criticalPathMs: criticalPath,
      predictions: Array.from(nodeTimePredictions.entries()).map(([nodeId, pred]) => ({
        nodeId,
        ...pred,
      })),
    };
  }

  handleRequest(req, res) {
    const { method, url } = req;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check
    if (url === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: 1, service: 'performance-store', version: '0.8' }));
      return;
    }

    // POST /metrics - Record build
    if (url === '/metrics' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const build = JSON.parse(body);
          const metric = this.recordBuild(build);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'recorded', buildId: metric.buildId }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET /metrics - Get all metrics
    if (url === '/metrics' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          totalBuilds: this.builds.length,
          recentBuilds: this.builds.slice(-10),
        }),
      );
      return;
    }

    // GET /stats/:nodeId - Get node statistics
    const statsMatch = url.match(/^\/stats\/([^/]+)$/);
    if (statsMatch && method === 'GET') {
      const nodeId = statsMatch[1];
      const stats = this.getNodeStats(nodeId);

      if (!stats) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Node not found in metrics' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ nodeId, stats }));
      return;
    }

    // POST /predict - Predict DAG execution time
    if (url === '/predict' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { dag } = JSON.parse(body);
          const prediction = this.predictCriticalPath(dag);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(prediction));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`[PerformanceStore] Listening on port ${this.port}`);
    });
  }
}

// Start service
const store = new PerformanceStore();
store.initialize();
store.start();
