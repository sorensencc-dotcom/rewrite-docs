import express from 'express';
import { VaultPersistence } from './VaultPersistence';
import { VaultSecrets } from './VaultSecrets';

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3111;

  app.use(express.json());

  const persistence = new VaultPersistence();
  const secrets = new VaultSecrets();
  await persistence.init();
  await secrets.init();

  app.post('/vault/records', async (req, res) => {
    try {
      const { kind, payload } = req.body;
      if (!kind) return res.status(400).json({ error: 'kind required' });
      const record = await persistence.write(kind, payload);
      res.status(201).json(record);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/vault/records/:id', async (req, res) => {
    try {
      const record = await persistence.read(req.params.id);
      if (!record) return res.status(404).json({ error: 'not found' });
      res.json(record);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/vault/records', async (req, res) => {
    try {
      const { kind } = req.query;
      if (!kind) return res.status(400).json({ error: 'kind required' });
      const records = await persistence.listByKind(String(kind));
      res.json({ records, count: records.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.delete('/vault/records/:id', async (req, res) => {
    try {
      const deleted = await persistence.delete(req.params.id);
      res.json({ deleted });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.post('/vault/secrets', async (req, res) => {
    try {
      const { value } = req.body;
      if (!value) return res.status(400).json({ error: 'value required' });
      const id = await secrets.writeSecret(value);
      res.status(201).json({ id });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/vault/secrets/:id', async (req, res) => {
    try {
      const value = await secrets.readSecret(req.params.id);
      if (value == null) return res.status(404).json({ error: 'not found' });
      res.json({ value });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.post('/vault/secrets/:id/rotate', async (req, res) => {
    try {
      const { newValue } = req.body;
      if (!newValue) return res.status(400).json({ error: 'newValue required' });
      const rotated = await secrets.rotateSecret(req.params.id, newValue);
      if (!rotated) return res.status(404).json({ error: 'not found' });
      res.json({ rotated });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/vault/audit-log', async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 100;
      const log = persistence.getAuditLog(limit);
      res.json({ log, count: log.length });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  app.get('/health', (req, res) => {
    const healthy = persistence.isHealthy();
    res.json({ status: healthy ? 'ok' : 'unhealthy' });
  });

  app.listen(port, () => {
    console.log(`Vault server listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

export { startServer };
