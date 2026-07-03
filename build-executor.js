const http = require('http');

class BuildExecutor {
  constructor() {
    this.port = parseInt(process.env.PORT || '3101', 10);
  }

  initialize() {
    console.log(`[BuildExecutor] Initializing on port ${this.port}`);
    console.log(`[BuildExecutor] Simulating node execution with deterministic timing`);
  }

  executeNode(nodeId, nodeConfig) {
    // Simulate node execution with deterministic time based on nodeId (100-150ms range).
    // If nodeId is missing, use fallback to prevent charCodeAt crash.
    const baseTime = 100;
    const safeId = nodeId || 'default';
    const nodeHash = safeId.charCodeAt(0) % 50;
    const executionTime = baseTime + nodeHash;

    return {
      nodeId,
      executionTime,
      status: 'success',
      artifacts: {
        output: `${nodeId}-output-v1`,
        timestamp: new Date().toISOString(),
      },
      logs: [`[${nodeId}] Execution completed in ${executionTime}ms`],
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
      res.end(JSON.stringify({ ok: 1, service: 'build-executor', version: '0.7' }));
      return;
    }

    // Execute node
    if (url === '/execute' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { nodeId, nodeConfig } = JSON.parse(body);

          if (!nodeId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing nodeId' }));
            return;
          }

          const result = this.executeNode(nodeId, nodeConfig);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
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
      console.log(`[BuildExecutor] Listening on port ${this.port}`);
    });
  }
}

const executor = new BuildExecutor();
executor.initialize();
executor.start();
