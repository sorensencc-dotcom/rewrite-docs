/**
 * Schedule: nightly-build-health
 * Runs at 3 AM UTC daily, checks build health on main
 */

import { ScheduleContext } from '../../../cic-runtime/scheduleModule';

export const cron = '0 3 * * *'; // 3 AM UTC daily

export async function run(ctx: ScheduleContext) {
  ctx.logger.info('Starting nightly build health check');

  const { sessionId } = await ctx.createSession({
    kind: 'scheduled-build-health',
    metadata: {
      timestamp: new Date().toISOString(),
      scheduled: true,
    },
    initialMessage: 'Nightly build health check',
  });

  try {
    // Query recent builds on main
    ctx.logger.info('Querying build logs', { sessionId });

    const buildLogsResult = await ctx.runTool(
      sessionId,
      'query_cic_state',
      {
        query: 'build_logs',
        branch: 'main',
        limit: 5,
      },
    );

    ctx.logger.info('Build logs retrieved', { sessionId, buildLogsResult });

    // Analyze build health
    const builds = (buildLogsResult as any).data?.builds || [];
    const successCount = builds.filter((b: any) => b.status === 'success').length;
    const failureCount = builds.filter((b: any) => b.status === 'failed').length;

    const healthStatus =
      failureCount === 0
        ? 'healthy'
        : failureCount < 2
          ? 'degraded'
          : 'critical';

    ctx.logger.info(
      'Build health check completed',
      { sessionId, successCount, failureCount, healthStatus },
    );

    // Checkpoint
    await ctx.runTool(sessionId, 'run_tests', {
      branch: 'main',
      timeout: 600000, // 10 min timeout
    });

  } catch (err) {
    ctx.logger.error(
      'Nightly build health check failed',
      { sessionId, err },
    );
    throw err;
  }
}
