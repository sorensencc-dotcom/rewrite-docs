const http = require('http');
const crypto = require('crypto');

class LineageRegistry {
  constructor() {
    this.port = parseInt(process.env.PORT || '3102', 10);
    this.dbHost = process.env.DB_HOST || 'localhost';
    this.dbPort = parseInt(process.env.DB_PORT || '5432', 10);
    this.dbName = process.env.DB_NAME || 'cic_lineage';
    this.dbUser = process.env.DB_USER || 'cic';
    this.dbPassword = process.env.DB_PASSWORD || 'cic_dev_pass';
    this.artifacts = new Map(); // in-memory fallback
  }

  initialize() {
    console.log(`[LineageRegistry] Initializing on port ${this.port}`);
    console.log(`[LineageRegistry] PostgreSQL: ${this.dbHost}:${this.dbPort}/${this.dbName}`);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // For now, use in-memory storage
    // In production, would connect to PostgreSQL and create schema
    console.log(`[LineageRegistry] Using in-memory artifact storage`);
    console.log(`[LineageRegistry] Schema would include:`);
    console.log(`  - artifacts (id, nodeId, buildId, status, timestamp, digest)`);
    console.log(`  - provenance (artifactId, inputs, outputs, agent, timestamp)`);
    console.log(`  - drift_issues (id, artifactId, type, severity, detected_at)`);
  }

  generateDigest(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  handleRequest(req, res) {
    const { method, url } = req;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check
    if (url === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: 1, service: 'lineage-registry', version: '0.7' }));
      return;
    }

    // POST /artifacts - Record artifact
    if (url === '/artifacts' && method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { nodeId, status, artifacts } = data;

          if (!nodeId || !status) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'nodeId and status required' }));
            return;
          }

          const digest = this.generateDigest(artifacts);
          const record = {
            id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            nodeId,
            status,
            artifacts,
            digest,
            timestamp: new Date().toISOString(),
          };

          this.artifacts.set(record.id, record);

          console.log(`[LineageRegistry] Recorded artifact for ${nodeId}: ${record.id}`);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: record.id, digest, status: 'recorded' }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET /artifacts - List artifacts
    if (url === '/artifacts' && method === 'GET') {
      const artifacts = Array.from(this.artifacts.values()).map((a) => ({
        id: a.id,
        nodeId: a.nodeId,
        status: a.status,
        timestamp: a.timestamp,
        digest: a.digest,
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artifacts, total: artifacts.length }));
      return;
    }

    // GET /artifacts/:id - Get artifact
    const getMatch = url.match(/^\/artifacts\/([^/]+)$/);
    if (getMatch && method === 'GET') {
      const id = getMatch[1];
      const artifact = this.artifacts.get(id);

      if (!artifact) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artifact not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(artifact));
      return;
    }

    // GET /artifacts/:id/signature - Verify artifact
    const sigMatch = url.match(/^\/artifacts\/([^/]+)\/signature$/);
    if (sigMatch && method === 'GET') {
      const id = sigMatch[1];
      const artifact = this.artifacts.get(id);

      if (!artifact) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artifact not found' }));
        return;
      }

      const computedDigest = this.generateDigest(artifact.artifacts);
      const valid = computedDigest === artifact.digest;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          id,
          stored_digest: artifact.digest,
          computed_digest: computedDigest,
          valid,
          timestamp: artifact.timestamp,
        }),
      );
      return;
    }

    // POST /artifacts/:id/validate - Check for drift
    const validateMatch = url.match(/^\/artifacts\/([^/]+)\/validate$/);
    if (validateMatch && method === 'POST') {
      const id = validateMatch[1];
      const artifact = this.artifacts.get(id);

      if (!artifact) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artifact not found' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const currentData = JSON.parse(body);
          const currentDigest = this.generateDigest(currentData);

          const driftDetected = currentDigest !== artifact.digest;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              id,
              driftDetected,
              expected_digest: artifact.digest,
              actual_digest: currentDigest,
              issue_type: driftDetected ? 'signature_mismatch' : null,
              severity: driftDetected ? 'high' : null,
            }),
          );
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // DELETE /artifacts/:id - Delete artifact
    const delMatch = url.match(/^\/artifacts\/([^/]+)$/);
    if (delMatch && method === 'DELETE') {
      const id = delMatch[1];
      const deleted = this.artifacts.delete(id);

      if (!deleted) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artifact not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'deleted', id }));
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
      console.log(`[LineageRegistry] Listening on port ${this.port}`);
    });
  }
}

// Start service
const registry = new LineageRegistry();
registry.initialize();
registry.start();
