/**
 * PHASE 27.3 — Metrics HTTP Server
 * Exposes Prometheus metrics endpoint at /metrics
 * Used by Prometheus scraper (every 5s)
 */

import express, { Express } from 'express';
import { metricsExporter } from '../metrics/MetricsExporter';
import pino from 'pino';

export class MetricsServer {
  private app: Express;
  private logger: pino.Logger;
  private port: number;

  constructor(port: number = 3100) {
    this.port = port;
    this.logger = pino({ level: process.env.LOG_LEVEL || 'info' });
    this.app = express();

    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await metricsExporter.getMetrics();
        res.set('Content-Type', metricsExporter.getContentType());
        res.end(metrics);
      } catch (err) {
        this.logger.error(err, 'Failed to generate metrics');
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    });

    // Adapter stats endpoint (JSON format)
    this.app.get('/stats', async (req, res) => {
      try {
        const metrics = await metricsExporter.getMetrics();
        res.json({
          timestamp: new Date().toISOString(),
          metricsText: metrics,
        });
      } catch (err) {
        this.logger.error(err, 'Failed to generate stats');
        res.status(500).json({ error: 'Failed to generate stats' });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info(`Metrics server running on http://localhost:${this.port}`);
        this.logger.info(`Prometheus endpoint: http://localhost:${this.port}/metrics`);
        this.logger.info(`Health endpoint: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}
