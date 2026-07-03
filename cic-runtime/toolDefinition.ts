/**
 * Tool definition helpers and types
 */

import { z } from 'zod';

export type ToolContext = {
  sessionId: string;
  agentId: string;
  logger: {
    info(msg: string, meta?: Record<string, unknown>): void;
    info(meta: Record<string, unknown>, msg: string): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    warn(meta: Record<string, unknown>, msg: string): void;
    error(msg: string, meta?: Record<string, unknown>): void;
    error(meta: Record<string, unknown>, msg: string): void;
  };
  sandbox: {
    exec(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }>;
  };
  connections: Record<string, unknown>;
  getSessionMetadata(): Promise<Record<string, unknown>>;
  checkpoint(data: Record<string, unknown>): Promise<void>;
};

export type ToolDefinition<I = unknown, O = unknown> = {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<I>;
  outputSchema: z.ZodSchema<O>;
  execute(input: I, ctx: ToolContext): Promise<O>;
};

export function defineTool<I, O>(def: ToolDefinition<I, O>): ToolDefinition<I, O> {
  return def;
}

// Example usage:
/*

import { defineTool, ToolContext } from '../toolDefinition';
import { z } from 'zod';

const inputSchema = z.object({
  branch: z.string(),
  timeout: z.number().optional(),
});

const outputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
});

export default defineTool({
  name: 'run_tests',
  description: 'Run CIC test suite for a branch',
  inputSchema,
  outputSchema,
  async execute(input, ctx) {
    ctx.logger.info({ branch: input.branch }, 'Running tests');

    const result = await ctx.sandbox.exec('npm', [
      'test',
      '--',
      input.branch,
    ]);

    return {
      success: result.code === 0,
      exitCode: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  },
});

*/
