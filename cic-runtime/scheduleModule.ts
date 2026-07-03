/**
 * Schedule module template
 * Each schedule must export:
 *   - cron (string): cron expression
 *   - run (function): async function that executes the schedule
 */

export type ScheduleContext = {
  createSession(params: {
    kind: string;
    metadata?: Record<string, unknown>;
    initialMessage?: string;
  }): Promise<{ sessionId: string }>;

  runTool(
    sessionId: string,
    toolName: string,
    input: unknown,
  ): Promise<unknown>;

  logger: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
  };
};

// Example usage:
/*

// schedules/nightly-build-health.ts

export const cron = '0 3 * * *'; // 3 AM every day

export async function run(ctx: ScheduleContext) {
  ctx.logger.info('Starting nightly build health check');

  const { sessionId } = await ctx.createSession({
    kind: 'scheduled-build-health',
    metadata: {
      timestamp: new Date().toISOString(),
    },
    initialMessage: 'Nightly build health check',
  });

  try {
    const result = await ctx.runTool(
      sessionId,
      'diagnose_latest_build',
      {
        branch: 'main',
        limit: 5,
      },
    );

    ctx.logger.info({ result }, 'Build health check completed');
  } catch (err) {
    ctx.logger.error({ err }, 'Build health check failed');
    throw err;
  }
}

*/
