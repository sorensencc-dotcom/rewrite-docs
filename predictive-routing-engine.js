const http = require('http');

class PredictiveRoutingEngine {
  constructor() {
    this.port = parseInt(process.env.PORT || '3106', 10);
    this.performanceStoreUrl = process.env.PERFORMANCE_STORE_URL || 'http://performance-store:3105';
    this.routes = new Map();
    this.decisions = [];
  }

  initialize() {
    console.log(`[PredictiveRoutingEngine] Initializing on port ${this.port}`);
    console.log(`[PredictiveRoutingEngine] Performance store: ${this.performanceStoreUrl}`);
    console.log(`[PredictiveRoutingEngine] Phase 0.8 - Routing optimization`);
  }

  async getNodePrediction(nodeId) {
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.request(
        `${this.performanceStoreUrl}/stats/${nodeId}`,
        { method: 'GET' },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve(result.stats);
            } catch (e) {
              resolve(null);
            }
          });
        },
      );

      req.on('error', () => {
        resolve(null);
      });

      req.end();
    });
  }

  scoreRoute(nodeId, toService, stats) {
    // Simple scoring: prefer services with better performance for this node
    const baseScore = 50;

    // Node execution time confidence
    const timeConfidence = stats ? Math.min(stats.count / 100, 1) : 0;

    // Service affinity (where this node runs best)
    const affinityBonus = toService === 'build-worker' ? 30 : 0;

    // Variance penalty (inconsistent = lower score)
    const variance = stats ? (stats.p99 - stats.min) / stats.avg : 0;
    const variancePenalty = Math.min(variance * 10, 20);

    const score = baseScore + affinityBonus + timeConfidence * 20 - variancePenalty;
    return Math.max(0, Math.min(100, score));
  }

  makeRoutingDecision(nodeId, availableServices) {
    // Simple round-robin with scoring
    const decision = {
      nodeId,
      services: availableServices,
      selected: availableServices[0], // Default to first
      score: 50,
      reason: 'default routing',
      timestamp: new Date().toISOString(),
    };

    // In Phase 0.8+, would use ML models trained on historical data
    // For now: simple heuristic based on service type
    if (nodeId.includes('compile') || nodeId.includes('analyze')) {
      decision.selected = 'build-worker';
      decision.score = 75;
      decision.reason = 'node type matches build-worker';
    } else if (nodeId.includes('test')) {
      decision.selected = 'test-runner'; // Future service
      decision.score = 80;
      decision.reason = 'specialized test service available';
    } else if (nodeId.includes('package')) {
      decision.selected = 'package-builder'; // Future service
      decision.score = 70;
      decision.reason = 'specialized package service';
    }

    this.decisions.push(decision);
    return decision;
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
      res.end(JSON.stringify({ ok: 1, service: 'predictive-routing-engine', version: '0.8' }));
      return;
    }

    // POST /route - Get routing decision for node
    if (url === '/route' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { nodeId, availableServices } = JSON.parse(body);

          if (!nodeId || !Array.isArray(availableServices)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'nodeId and availableServices required' }));
            return;
          }

          const decision = this.makeRoutingDecision(nodeId, availableServices);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(decision));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET /decisions - Get routing decision history
    if (url === '/decisions' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          totalDecisions: this.decisions.length,
          recent: this.decisions.slice(-20),
        }),
      );
      return;
    }

    // POST /optimize - Get optimization recommendations
    if (url === '/optimize' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { dag } = JSON.parse(body);

          // Analyze DAG for optimization opportunities
          const recommendations = [];

          for (const node of dag) {
            if (node.dependencies && node.dependencies.length > 3) {
              recommendations.push({
                type: 'merge_dependencies',
                nodeId: node.id,
                reason: 'node has many dependencies, consider caching intermediate results',
                savings_percent: 15,
              });
            }
          }

          // Critical path analysis
          if (dag.length > 5) {
            recommendations.push({
              type: 'parallelize',
              reason: 'DAG has long sequential path, increase parallelization',
              potential_speedup: '2-3x',
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              dagSize: dag.length,
              recommendations,
            }),
          );
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
      console.log(`[PredictiveRoutingEngine] Listening on port ${this.port}`);
    });
  }
}

// Start service
const engine = new PredictiveRoutingEngine();
engine.initialize();
engine.start();
