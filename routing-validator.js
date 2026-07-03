const http = require('http');

class RoutingValidator {
  constructor() {
    this.port = parseInt(process.env.PORT || '3103', 10);
    this.opaEnabled = process.env.OPA_ENABLED === 'true';

    // OPA policies (simplified - hardcoded for Phase 0.7)
    this.allowedRoutes = [
      { from: 'orchestrator', to: 'build-executor', phase: '0.7' },
      { from: 'build-executor', to: 'lineage-registry', phase: '0.7' },
      { from: 'build-executor', to: 'routing-validator', phase: '0.7' },
      { from: 'build-worker', to: 'lineage-registry', phase: '0.7' },
      { from: 'orchestrator', to: 'lineage-registry', phase: '0.7' },
      { from: 'telemetry-sink', to: '*', phase: '*' }, // wildcard allow
    ];
  }

  initialize() {
    console.log(`[RoutingValidator] Initializing on port ${this.port}`);
    console.log(`[RoutingValidator] OPA enforcement: ${this.opaEnabled ? 'enabled' : 'disabled'}`);
    console.log(`[RoutingValidator] Allowed routes: ${this.allowedRoutes.length}`);
  }

  validateRoute(from, to, phase) {
    // Check exact match
    const exactMatch = this.allowedRoutes.some(
      (r) => r.from === from && r.to === to && (r.phase === phase || r.phase === '*'),
    );

    if (exactMatch) {
      return { valid: true, reason: 'route allowed' };
    }

    // Check wildcard from
    const wildcardMatch = this.allowedRoutes.some(
      (r) => r.from === from && r.to === '*' && (r.phase === phase || r.phase === '*'),
    );

    if (wildcardMatch) {
      return { valid: true, reason: 'wildcard route allowed' };
    }

    // Check any-to-telemetry (implicit allow)
    if (to === 'telemetry-sink') {
      return { valid: true, reason: 'telemetry sink accepts all' };
    }

    return { valid: false, reason: `route ${from} → ${to} (${phase}) not allowed` };
  }

  handleRequest(req, res) {
    const { method, url } = req;

    // CORS
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
      res.end(JSON.stringify({ ok: 1, service: 'routing-validator', version: '0.7' }));
      return;
    }

    // POST /validate - Check route
    if (url === '/validate' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const { from, to, phase } = JSON.parse(body);

          if (!from || !to || !phase) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'from, to, and phase required' }));
            return;
          }

          const result = this.validateRoute(from, to, phase);
          const statusCode = result.valid ? 200 : 403;

          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ from, to, phase, ...result }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET /policies - List allowed routes
    if (url === '/policies' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          policies: this.allowedRoutes,
          total: this.allowedRoutes.length,
          opaEnabled: this.opaEnabled,
        }),
      );
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
      console.log(`[RoutingValidator] Listening on port ${this.port}`);
    });
  }
}

// Start service
const validator = new RoutingValidator();
validator.initialize();
validator.start();
