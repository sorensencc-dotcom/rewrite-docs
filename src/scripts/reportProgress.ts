import { graphContext } from '../cic/graph/GraphContextBuilder.js';

export async function generateProgressReport(repo: string, service: string) {
  console.log(`[ProgressReport] Generating report for repo: ${repo}, service: ${service}`);

  const refactorCtx = await graphContext.getRefactorContext({ repo, files: ['src/index.ts'] });
  const driftCtx = await graphContext.getDriftContext({ service });
  const discoveryCtx = await graphContext.getDiscoveryContext({ service });

  console.log(`[ProgressReport] Report generated successfully.`);

  return {
    timestamp: new Date().toISOString(),
    refactorPolicy: refactorCtx.meta.policy,
    driftPolicy: driftCtx.meta.policy,
    discoveryPolicy: discoveryCtx.meta.policy,
    symbolsCount: refactorCtx.code.symbols.length,
    timelineEvents: driftCtx.history.changeTimeline?.length || 0,
    docsCount: discoveryCtx.knowledge.docs?.length || 0
  };
}

// Running script directly if invoked
if (process.argv[1] && (process.argv[1].endsWith('reportProgress.ts') || process.argv[1].endsWith('reportProgress.js'))) {
  generateProgressReport('main-repo', 'main-service').then(report => {
    console.log(JSON.stringify(report, null, 2));
  }).catch(err => {
    console.error('Failed to generate progress report:', err);
  });
}
