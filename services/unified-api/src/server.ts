/**
 * Unified API Server
 * Main entry point that wires all routes together
 */

import express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createGovernanceRouter } = require('./routes/governance');
const { createTorqueQueryRouter } = require('./routes/torquequery');
const { createRepomixRouter } = require('./routes/repomix');
const { createVaultRouter } = require('./routes/vault');
const { createGovernanceEvolutionRouter } = require('./routes/governance-evolution');

async function startServer() {
  const app = express();
  const port = process.env.UNIFIED_API_PORT || 3100;

  // Security middleware
  app.use(helmet());

  // CORS: explicit allowlist (block by default)
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3100').split(',');
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Rate limiting: 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Middleware: limit request body size
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Routes
  app.use('/api', createGovernanceRouter());
  app.use('/api', await createTorqueQueryRouter());
  app.use('/api', createRepomixRouter());
  app.use('/api', await createVaultRouter());
  app.use('/api', createGovernanceEvolutionRouter());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling: never leak internals, log server-side only
  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Error:', err);

      const isServiceUnavailable = ['ECONNREFUSED', 'EHOSTUNREACH', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code);
      const status = isServiceUnavailable ? 502 : (err.status || 500);

      // Generic client message; never return error.message or stack
      const clientMessage =
        status === 502 ? 'Service unavailable' : status === 404 ? 'Not found' : 'Internal server error';

      res.status(status).json({ error: clientMessage });
    }
  );

  // Start server
  app.listen(port, () => {
    console.log(`Unified API listening on port ${port}`);
  });
}

// Start if run directly
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { startServer };
