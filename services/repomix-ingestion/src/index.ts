// Repomix Ingestion Service Index (Phase 4.4)

export { RepomixClient } from './RepomixClient';
export { RepomixMemoryAdapter, MemoryEvent } from './RepomixMemoryAdapter';
export { RepomixPipeline } from './RepomixPipeline';

// Import and start server if this is the entry point
import('./server').catch(err => {
  console.error('Failed to start Repomix Ingestion server:', err);
  process.exit(1);
});
