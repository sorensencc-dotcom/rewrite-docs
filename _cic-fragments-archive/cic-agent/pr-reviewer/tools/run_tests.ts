/**
 * Tool: run_tests
 * Runs CIC test suite on a branch
 */

import { defineTool, ToolContext } from '../../../cic-runtime/toolDefinition';
import { z } from 'zod';

const inputSchema = z.object({
  branch: z.string().default('HEAD'),
  package: z.string().optional(),
  timeout: z.number().default(300000),
  coverage: z.boolean().default(false),
});

const outputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  duration_ms: z.number(),
  coverage: z.object({
    lines: z.number().optional(),
    statements: z.number().optional(),
    functions: z.number().optional(),
    branches: z.number().optional(),
  }).optional(),
});

export default defineTool({
  name: 'run_tests',
  description: 'Run CIC test suite for a branch, optionally with coverage',
  inputSchema,
  outputSchema,

  async execute(input, ctx: ToolContext) {
    ctx.logger.info('Running tests', { branch: input.branch, package: input.package });

    const start = Date.now();
    const cmd = input.coverage ? 'npm' : 'npm';
    const args = input.coverage
      ? ['test', '--', '--coverage', input.package || ''].filter(Boolean)
      : ['test', '--', input.package || ''].filter(Boolean);

    try {
      const result = await ctx.sandbox.exec(cmd, args);

      // Parse coverage from stdout if enabled
      let coverage: any = undefined;
      if (input.coverage && result.stdout) {
        // Jest coverage output is in the stdout
        // Extract lines like: "Lines : 85.2% ( 234/275 )"
        const linesMatch = result.stdout.match(/Lines\s*:\s*([\d.]+)%/);
        const statementsMatch = result.stdout.match(/Statements\s*:\s*([\d.]+)%/);
        const functionsMatch = result.stdout.match(/Functions\s*:\s*([\d.]+)%/);
        const branchesMatch = result.stdout.match(/Branches\s*:\s*([\d.]+)%/);

        coverage = {
          lines: linesMatch ? parseFloat(linesMatch[1]) : undefined,
          statements: statementsMatch ? parseFloat(statementsMatch[1]) : undefined,
          functions: functionsMatch ? parseFloat(functionsMatch[1]) : undefined,
          branches: branchesMatch ? parseFloat(branchesMatch[1]) : undefined,
        };
      }

      const duration_ms = Date.now() - start;

      ctx.logger.info(
        'Tests completed',
        { exitCode: result.code, duration_ms, coverage },
      );

      return {
        success: result.code === 0,
        exitCode: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        duration_ms,
        coverage: coverage || undefined,
      };
    } catch (err) {
      const duration_ms = Date.now() - start;
      ctx.logger.error('Test execution failed', { err, duration_ms });

      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        duration_ms,
      };
    }
  },
});
