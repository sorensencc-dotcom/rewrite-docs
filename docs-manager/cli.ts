import { DocsManager } from './docs-manager.js';
import path from 'path';

interface Finding {
  severity: 'critical' | 'warning' | 'info';
  [key: string]: unknown;
}

interface AuditReport {
  findings: Finding[];
  [key: string]: unknown;
}

interface SyncReport {
  succeeded: number;
  failed: number;
  [key: string]: unknown;
}

interface RefreshReport {
  status: 'complete' | 'partial' | 'failed';
  [key: string]: unknown;
}

const mode = process.argv[2] || 'audit';
const configPath = path.join(process.cwd(), 'docs-manager', 'docs-config.json');

try {
  const manager = new DocsManager(configPath);

  switch (mode) {
    case 'audit': {
      console.log('[docs-manager] Running audit...');
      const auditReport = manager.audit() as AuditReport;
      const findingsCount = auditReport?.findings?.length ?? 0;
      console.log(`✓ Audit complete: ${findingsCount} findings`);
      if (auditReport?.findings?.some((f: Finding) => f.severity === 'critical')) {
        process.exit(1);
      }
      break;
    }

    case 'sync': {
      console.log('[docs-manager] Running sync...');
      const syncReport = manager.sync() as SyncReport;
      const succeeded = syncReport?.succeeded ?? 0;
      const failed = syncReport?.failed ?? 0;
      console.log(`✓ Sync complete: ${succeeded} operations, ${failed} errors`);
      if (failed > 0) {
        process.exit(1);
      }
      break;
    }

    case 'refresh': {
      console.log('[docs-manager] Running full refresh...');
      const refreshReport = manager.refresh() as RefreshReport;
      const status = refreshReport?.status ?? 'failed';
      console.log(`✓ Refresh complete: ${status}`);
      if (status === 'failed') {
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown mode: ${mode}`);
      process.exit(1);
  }
} catch (err) {
  console.error('[docs-manager] Error:', (err as Error).message);
  process.exit(1);
}
