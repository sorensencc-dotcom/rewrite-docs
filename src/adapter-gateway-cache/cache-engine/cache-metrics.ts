import { CacheMetrics } from "./cache-types";

export class CacheMetricsCollector {
  private metrics: CacheMetrics = {
    l1Hits: 0,
    l2Hits: 0,
    providerHits: 0,
    offlineHits: 0,
    evictions: 0,
    diskWrites: 0,
    diskReads: 0,
    errors: 0,
  };

  recordL1Hit(): void {
    this.metrics.l1Hits++;
  }

  recordL2Hit(): void {
    this.metrics.l2Hits++;
  }

  recordProviderHit(): void {
    this.metrics.providerHits++;
  }

  recordOfflineHit(): void {
    this.metrics.offlineHits++;
  }

  recordEviction(): void {
    this.metrics.evictions++;
  }

  recordDiskWrite(): void {
    this.metrics.diskWrites++;
  }

  recordDiskRead(): void {
    this.metrics.diskReads++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getHitRate(): number {
    const totalHits =
      this.metrics.l1Hits +
      this.metrics.l2Hits +
      this.metrics.providerHits +
      this.metrics.offlineHits;
    const cacheHits = this.metrics.l1Hits + this.metrics.l2Hits;
    return totalHits === 0 ? 0 : cacheHits / totalHits;
  }

  reset(): void {
    this.metrics = {
      l1Hits: 0,
      l2Hits: 0,
      providerHits: 0,
      offlineHits: 0,
      evictions: 0,
      diskWrites: 0,
      diskReads: 0,
      errors: 0,
    };
  }

  summarize(): string {
    const hitRate = (this.getHitRate() * 100).toFixed(2);
    return (
      `Cache Metrics: L1=${this.metrics.l1Hits} L2=${this.metrics.l2Hits} ` +
      `Provider=${this.metrics.providerHits} Offline=${this.metrics.offlineHits} ` +
      `HitRate=${hitRate}% Errors=${this.metrics.errors}`
    );
  }
}
