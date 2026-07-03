const http = require('http');

class BuildWorker {
  constructor() {
    this.port = parseInt(process.env.PORT || '3101', 10);
    this.lineageUrl = process.env.LINEAGE_URL || 'http://localhost:3102';
    this.routingUrl = process.env.ROUTING_URL || 'http://localhost:3103';
    this.executingBuilds = new Map();
  }

  initialize() {
    console.log(`[BuildWorker] Initializing on port ${this.port}`);
    console.log(`[BuildWorker] Lineage: ${this.lineageUrl}`);
    console.log(`[BuildWorker] Routing: ${this.routingUrl}`);
  }

  async executeNode(nodeId, nodeConfig) {
    // Simulate node execution (in production, would run actual build commands)
    return new Promise((resolve) => {
      console.log(`[BuildWorker] Executing node: ${nodeId}`);

      setTimeout(() => {
        const result = {
          nodeId,
          status: 'success',
          executionTime: Math.random() * 500 + 100,
          artifacts: {
            output: `${nodeId}_output.tar.gz`,
            size: Math.random() * 10000000,
            digest: `sha256:${Math.random().toString(16).slice(2)}`,
          },
          timestamp: new Date().toISOString(),
        };

        console.log(`[BuildWorker] Node ${nodeId} completed`);
        resolve(result);
      }, Math.random() * 500 + 100);
    });
  }

  async recordLineage(nodeId, result) {
    try {
      const payload = {
        nodeId,
        status: result.status,
        artifacts: result.artifacts,
        timestamp: result.timestamp,
      };

      const req = http.request(
        `${this.lineageUrl}/artifacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log(`[BuildWorker] Lineage recorded for ${nodeId}`);
          });
        },
      );

      req.on('error', (err) => {
        console.error(`[BuildWorker] Failed to record lineage for ${nodeId}:`, err.message);
      });

      req.write(JSON.stringify(payload));
      req.end();
    } catch (error) {
      console.error(`[BuildWorker] Error recording lineage:`, error.message);
    }
  }

  handleRequest(req, res) {
    const { method, url } = req;

    // CORS headers
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
      res.end(JSON.stringify({ ok: 1, service: 'build-worker', version: '0.7' }));
      return;
    }

    // Execute node
    if (url === '/execute' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const { nodeId, nodeConfig } = JSON.parse(body);

          if (!nodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'nodeId required' }));
            return;
          }

          // Execute node
          const result = await this.executeNode(nodeId, nodeConfig);

          // Record to lineage
          this.recordLineage(nodeId, result);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`[BuildWorker] Listening on port ${this.port}`);
    });
  }
}

// Start service
const worker = new BuildWorker();
worker.initialize();
worker.start();
