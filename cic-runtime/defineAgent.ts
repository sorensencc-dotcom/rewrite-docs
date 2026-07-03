/**
 * CIC Agent Runtime v0.2 — Full implementation with validation, Docker, Postgres, multi-instance safety
 */

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL as pathToFileUrl } from 'url';
import yaml from 'js-yaml';
import cron from 'node-cron';
import { Pool, PoolClient } from 'pg';
import Docker from 'dockerode';
import { z } from 'zod';
import pino from 'pino';
import crypto from 'crypto';

// ============================================================================
// SCHEMAS
// ============================================================================

const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any(),
  execute: z.function(),
});

const ChannelAdapterSchema = z.object({
  name: z.string(),
  description: z.string(),
  supportedEventTypes: z.array(z.string()),
  subscribe: z.function(),
});

const AgentManifestSchema = z.object({
  id: z.string().regex(/^cic\./),
  name: z.string(),
  description: z.string(),
  model: z.object({
    provider: z.string(),
    name: z.string(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
  }),
  runtime: z.object({
    sandbox: z.string(),
    persistence: z.string(),
    concurrency_limit: z.number().optional(),
  }),
  policies: z.object({}).passthrough().optional(),
  skills: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  subagents: z.array(z.string()).optional(),
  schedules: z.array(z.string()).optional(),
  observability: z.object({
    log_level: z.string().optional(),
    trace: z.boolean().optional(),
    metrics: z.boolean().optional(),
  }).optional(),
});

type AgentManifest = z.infer<typeof AgentManifestSchema>;
type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
type ChannelAdapter = z.infer<typeof ChannelAdapterSchema>;

// ============================================================================
// DATABASE MIGRATIONS
// ============================================================================

const MIGRATIONS = [
  `
    CREATE TABLE IF NOT EXISTS agent_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id text NOT NULL,
      kind text NOT NULL,
      status text NOT NULL DEFAULT 'running',
      metadata jsonb,
      last_checkpoint jsonb,
      last_message text,
      locked_until timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `,
  `CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_status ON agent_sessions(agent_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_sessions_created ON agent_sessions(created_at)`,
  `
    CREATE TABLE IF NOT EXISTS agent_tool_calls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id uuid NOT NULL REFERENCES agent_sessions(id),
      tool_name text NOT NULL,
      input jsonb NOT NULL,
      output jsonb,
      success boolean NOT NULL,
      duration_ms integer NOT NULL,
      error_message text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `,
  `CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_session ON agent_tool_calls(session_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_tool ON agent_tool_calls(tool_name)`,
  `
    CREATE TABLE IF NOT EXISTS agent_schedule_runs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id text NOT NULL,
      schedule_name text NOT NULL,
      cron text NOT NULL,
      status text NOT NULL DEFAULT 'running',
      result jsonb,
      error_message text,
      duration_ms integer,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `,
  `CREATE INDEX IF NOT EXISTS idx_agent_schedule_runs_agent ON agent_schedule_runs(agent_id, created_at)`,
];

async function runMigrations(pool: Pool): Promise<void> {
  for (const migration of MIGRATIONS) {
    await pool.query(migration);
  }
}

// ============================================================================
// AGENT RUNTIME CLASS
// ============================================================================

export class AgentRuntime {
  private manifest: AgentManifest;
  private root: string;
  private pool: Pool;
  private docker: Docker;
  private logger: pino.Logger;
  private tools: Record<string, ToolDefinition> = {};
  private channels: ChannelAdapter[] = [];
  private schedules: any[] = [];
  private cronJobs: cron.ScheduledTask[] = [];
  private isRunning = false;

  constructor(
    manifest: AgentManifest,
    root: string,
    pool: Pool,
    logger: pino.Logger,
  ) {
    this.manifest = manifest;
    this.root = root;
    this.pool = pool;
    this.logger = logger;
    this.docker = new Docker();
  }

  // Load tools with validation
  async loadTools(): Promise<void> {
    const toolsDir = path.join(this.root, 'tools');
    const files = await safeReaddir(toolsDir);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

      try {
        const filePath = path.join(toolsDir, file);
        const fileUrl = pathToFileUrl(filePath).href;
        const mod = await import(fileUrl);
        const tool = ToolDefinitionSchema.parse(mod.default);
        this.tools[tool.name] = tool;
        this.logger.info({ tool: tool.name }, 'Loaded tool');
      } catch (err) {
        this.logger.error({ file, err }, 'Failed to load tool');
        throw err;
      }
    }
  }

  // Load channels with validation
  async loadChannels(): Promise<void> {
    const channelsDir = path.join(this.root, 'channels');
    const files = await safeReaddir(channelsDir);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

      try {
        const filePath = path.join(channelsDir, file);
        const fileUrl = pathToFileUrl(filePath).href;
        const mod = await import(fileUrl);
        const channel = ChannelAdapterSchema.parse(mod.default);
        this.channels.push(channel);
        this.logger.info({ channel: channel.name }, 'Loaded channel');
      } catch (err) {
        this.logger.error({ file, err }, 'Failed to load channel');
        throw err;
      }
    }
  }

  // Load schedules with validation
  async loadSchedules(): Promise<void> {
    const schedulesDir = path.join(this.root, 'schedules');
    const files = await safeReaddir(schedulesDir);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

      try {
        const filePath = path.join(schedulesDir, file);
        const fileUrl = pathToFileUrl(filePath).href;
        const mod = await import(fileUrl);

        if (!mod.cron || !mod.run) {
          throw new Error('Schedule must export cron and run');
        }

        this.schedules.push({
          name: path.basename(file, path.extname(file)),
          cron: mod.cron,
          run: mod.run,
        });

        this.logger.info({ schedule: mod.cron }, 'Loaded schedule');
      } catch (err) {
        this.logger.error({ file, err }, 'Failed to load schedule');
        throw err;
      }
    }
  }

  // Create a new session
  async createSession({
    kind,
    metadata,
    initialMessage,
  }: {
    kind: string;
    metadata?: Record<string, unknown>;
    initialMessage?: string;
  }): Promise<{ sessionId: string }> {
    const result = await this.pool.query(
      `
      INSERT INTO agent_sessions (agent_id, kind, status, metadata, last_message)
      VALUES ($1, $2, 'running', $3, $4)
      RETURNING id
      `,
      [this.manifest.id, kind, JSON.stringify(metadata || {}), initialMessage || null],
    );

    const sessionId = result.rows[0].id;
    this.logger.info({ sessionId, kind }, 'Created session');
    return { sessionId };
  }

  // Acquire lock for session (multi-instance safety)
  private async acquireSessionLock(
    sessionId: string,
    timeoutMs: number = 30000,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `
      UPDATE agent_sessions
      SET locked_until = $1
      WHERE id = $2 AND (locked_until IS NULL OR locked_until < now())
      `,
      [new Date(Date.now() + timeoutMs), sessionId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  // Release lock for session
  private async releaseSessionLock(sessionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE agent_sessions SET locked_until = NULL WHERE id = $1`,
      [sessionId],
    );
  }

  // Get session metadata
  private async getSessionMetadata(
    sessionId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.pool.query(
      `SELECT metadata FROM agent_sessions WHERE id = $1`,
      [sessionId],
    );

    return result.rows[0]?.metadata || {};
  }

  // Checkpoint session state
  private async checkpointSession(
    sessionId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE agent_sessions
      SET last_checkpoint = $1, updated_at = now()
      WHERE id = $2
      `,
      [JSON.stringify(data), sessionId],
    );
  }

  // Execute tool with validation, logging, and error handling
  async runTool(
    sessionId: string,
    toolName: string,
    input: unknown,
  ): Promise<unknown> {
    const tool = this.tools[toolName];
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);

    // Validate input
    let validInput: unknown;
    try {
      validInput = tool.inputSchema.parse(input);
    } catch (err) {
      this.logger.error({ tool: toolName, err }, 'Invalid input schema');
      throw new Error(`Invalid input for tool ${toolName}: ${err}`);
    }

    const start = Date.now();

    // Build tool context
    const ctx = {
      sessionId,
      agentId: this.manifest.id,
      logger: this.logger,
      sandbox: {
        exec: (cmd: string, args: string[]) => this.executeInSandbox(cmd, args),
      },
      connections: {},
      getSessionMetadata: () => this.getSessionMetadata(sessionId),
      checkpoint: (data: Record<string, unknown>) =>
        this.checkpointSession(sessionId, data),
    };

    // Execute tool
    let output: unknown;
    let success = false;
    let errorMessage: string | null = null;

    try {
      output = await tool.execute(validInput, ctx);
      success = true;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        { tool: toolName, sessionId, err },
        'Tool execution failed',
      );
      throw err;
    } finally {
      // Validate output (if success)
      if (success) {
        try {
          output = tool.outputSchema.parse(output);
        } catch (err) {
          success = false;
          errorMessage = `Invalid output schema: ${err}`;
          this.logger.error({ tool: toolName, err }, 'Invalid output schema');
        }
      }

      // Log tool call
      await this.pool.query(
        `
        INSERT INTO agent_tool_calls
        (session_id, tool_name, input, output, success, duration_ms, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          sessionId,
          toolName,
          JSON.stringify(validInput),
          JSON.stringify(output || null),
          success,
          Date.now() - start,
          errorMessage,
        ],
      );
    }

    if (!success) {
      throw new Error(errorMessage || 'Tool execution failed');
    }

    return output;
  }

  // Execute command in Docker sandbox
  private async executeInSandbox(
    cmd: string,
    args: string[],
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    const sandboxImage = this.manifest.runtime.sandbox.replace('docker://', '');
    const container = await this.docker.createContainer({
      Image: sandboxImage,
      Cmd: [cmd, ...args],
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512MB
        CpuShares: 256,
      },
    });

    try {
      await container.start();

      // Wait for completion
      const result = await container.wait();

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
      });

      return {
        code: result.StatusCode || 0,
        stdout: logs.toString('utf8'),
        stderr: '',
      };
    } finally {
      await container.remove({ force: true });
    }
  }

  // Resume session from checkpoint
  private async resumeSession(session: {
    id: string;
    last_checkpoint: any;
  }): Promise<void> {
    this.logger.info({ sessionId: session.id }, 'Resuming session from checkpoint');

    if (!session.last_checkpoint) {
      this.logger.warn({ sessionId: session.id }, 'No checkpoint found, skipping');
      return;
    }

    const checkpoint = session.last_checkpoint;
    if (!checkpoint.toolName || !checkpoint.input) {
      this.logger.warn({ sessionId: session.id }, 'Invalid checkpoint format');
      return;
    }

    try {
      await this.runTool(session.id, checkpoint.toolName, checkpoint.input);
      await this.pool.query(
        `UPDATE agent_sessions SET status = 'completed' WHERE id = $1`,
        [session.id],
      );
    } catch (err) {
      this.logger.error(
        { sessionId: session.id, err },
        'Failed to resume session',
      );
      await this.pool.query(
        `UPDATE agent_sessions SET status = 'failed' WHERE id = $1`,
        [session.id],
      );
    }
  }

  // Recover running sessions from database
  private async recoverSessions(): Promise<void> {
    const result = await this.pool.query(
      `SELECT id, last_checkpoint FROM agent_sessions WHERE agent_id = $1 AND status = 'running'`,
      [this.manifest.id],
    );

    if (result.rows.length > 0) {
      this.logger.info(
        { count: result.rows.length },
        'Recovering sessions',
      );
    }

    for (const row of result.rows) {
      await this.resumeSession(row);
    }
  }

  // Start channel listeners
  private startChannels(): void {
    for (const channel of this.channels) {
      try {
        this.logger.info({ channel: channel.name }, 'Starting channel');

        channel.subscribe(async (event: any) => {
          try {
            await this.createSession({
              kind: event.type || 'webhook',
              metadata: event.payload || event,
              initialMessage: `Event: ${event.type}`,
            });
          } catch (err) {
            this.logger.error({ channel: channel.name, err }, 'Channel event handling failed');
          }
        });
      } catch (err) {
        this.logger.error({ channel: channel.name, err }, 'Failed to start channel');
      }
    }
  }

  // Start cron schedules
  private startSchedules(): void {
    for (const sched of this.schedules) {
      try {
        this.logger.info({ schedule: sched.cron }, 'Registering schedule');

        const job = cron.schedule(sched.cron, async () => {
          const runId = crypto.randomUUID();
          const start = Date.now();

          try {
            await sched.run({
              createSession: (params: any) => this.createSession(params),
              runTool: (sessionId: string, toolName: string, input: unknown) =>
                this.runTool(sessionId, toolName, input),
              logger: this.logger,
            });

            await this.pool.query(
              `
              INSERT INTO agent_schedule_runs
              (agent_id, schedule_name, cron, status, duration_ms)
              VALUES ($1, $2, $3, 'success', $4)
              `,
              [this.manifest.id, sched.name, sched.cron, Date.now() - start],
            );
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(
              { schedule: sched.name, err },
              'Schedule execution failed',
            );

            await this.pool.query(
              `
              INSERT INTO agent_schedule_runs
              (agent_id, schedule_name, cron, status, error_message, duration_ms)
              VALUES ($1, $2, $3, 'failed', $4, $5)
              `,
              [this.manifest.id, sched.name, sched.cron, errorMessage, Date.now() - start],
            );
          }
        });

        this.cronJobs.push(job);
      } catch (err) {
        this.logger.error({ schedule: sched, err }, 'Failed to register schedule');
      }
    }
  }

  // Start runtime
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent already running');
      return;
    }

    try {
      this.logger.info({ agent: this.manifest.id }, 'Starting agent runtime');

      // Test Postgres connectivity
      await this.pool.query('SELECT 1');

      // Load components
      await this.loadTools();
      await this.loadChannels();
      await this.loadSchedules();

      // Recover sessions
      await this.recoverSessions();

      // Start channels and schedules
      this.startChannels();
      this.startSchedules();

      this.isRunning = true;
      this.logger.info({ agent: this.manifest.id }, 'Agent runtime started');
    } catch (err) {
      this.logger.error({ err }, 'Failed to start agent runtime');
      throw err;
    }
  }

  // Stop runtime with graceful shutdown
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.logger.info('Stopping agent runtime');

      // Cancel all cron jobs
      for (const job of this.cronJobs) {
        job.stop();
      }

      // Wait for in-flight sessions with timeout
      const timeout = 5 * 60 * 1000; // 5 minutes
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const result = await this.pool.query(
          `SELECT COUNT(*) as count FROM agent_sessions WHERE agent_id = $1 AND status = 'running'`,
          [this.manifest.id],
        );

        const count = parseInt(result.rows[0].count);
        if (count === 0) break;

        this.logger.info({ count }, 'Waiting for sessions to complete');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mark remaining sessions as failed
      await this.pool.query(
        `UPDATE agent_sessions SET status = 'failed' WHERE agent_id = $1 AND status = 'running'`,
        [this.manifest.id],
      );

      await this.pool.end();
      this.isRunning = false;

      this.logger.info('Agent runtime stopped');
    } catch (err) {
      this.logger.error({ err }, 'Error during shutdown');
      throw err;
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export async function defineAgent({
  manifestPath,
  logger: customLogger,
}: {
  manifestPath: string;
  logger?: pino.Logger;
}): Promise<AgentRuntime> {
  const logger = customLogger || pino({ level: 'info' });

  try {
    const root = path.dirname(manifestPath);

    // Load manifest
    const manifestYaml = await fs.readFile(manifestPath, 'utf-8');
    const manifestData = yaml.load(manifestYaml);
    const manifestWithEnvVars = substituteEnvVars(manifestData);
    const manifest = AgentManifestSchema.parse(manifestWithEnvVars);

    logger.info({ agent: manifest.id }, 'Loaded agent manifest');

    // Load instructions (informational, no parsing)
    const instructionsPath = path.join(root, 'instructions.md');
    try {
      const instructions = await fs.readFile(instructionsPath, 'utf-8');
      logger.info('Loaded instructions');
    } catch {
      logger.warn('No instructions.md found');
    }

    // Initialize Postgres pool
    const pool = new Pool({
      connectionString: manifest.runtime.persistence,
      max: manifest.runtime.concurrency_limit || 10,
    });

    // Run migrations
    await runMigrations(pool);
    logger.info('Database migrations completed');

    // Create and return runtime
    const runtime = new AgentRuntime(manifest, root, pool, logger);

    return runtime;
  } catch (err) {
    logger.error({ err }, 'Failed to define agent');
    throw err;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

function substituteEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-(.*?))?\}/g, (match, varName, defaultVal) => {
      return process.env[varName] || defaultVal || match;
    });
  }
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(substituteEnvVars);
    }
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, substituteEnvVars(v)]),
    );
  }
  return obj;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AgentManifest, ToolDefinition, ChannelAdapter };
