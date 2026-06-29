import { DocsManager } from './docs-manager.js';
import path from 'path';

const mode = process.argv[2] || 'audit';
const configPath = path.join(process.cwd(), 'docs-manager', 'docs-config.json');

try {
  const manager = new DocsManager(configPath);

  switch (mode) {
    case 'audit':
      console.log('[docs-manager] Running audit...');
      const auditReport = manager.audit();
      console.log(`✓ Audit complete: ${auditReport.findings.length} findings`);
      if (auditReport.findings.some(f => f.severity === 'critical')) {
        process.exit(1);
      }
      break;

    case 'sync':
      console.log('[docs-manager] Running sync...');
      const syncReport = manager.sync();
      console.log(`✓ Sync complete: ${syncReport.succeeded} operations`);
      break;

    case 'refresh':
      console.log('[docs-manager] Running full refresh...');
      const refreshReport = manager.refresh();
      console.log(`✓ Refresh complete: ${refreshReport.status}`);
      break;

    default:
      console.error(`Unknown mode: ${mode}`);
      process.exit(1);
  }
} catch (err) {
  console.error('[docs-manager] Error:', (err as Error).message);
  process.exit(1);
}
