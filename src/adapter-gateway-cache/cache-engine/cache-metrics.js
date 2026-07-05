export class CacheMetricsCollector {
    metrics = {
        l1Hits: 0,
        l2Hits: 0,
        providerHits: 0,
        offlineHits: 0,
        evictions: 0,
        diskWrites: 0,
        diskReads: 0,
        errors: 0,
    };
    recordL1Hit() {
        this.metrics.l1Hits++;
    }
    recordL2Hit() {
        this.metrics.l2Hits++;
    }
    recordProviderHit() {
        this.metrics.providerHits++;
    }
    recordOfflineHit() {
        this.metrics.offlineHits++;
    }
    recordEviction() {
        this.metrics.evictions++;
    }
    recordDiskWrite() {
        this.metrics.diskWrites++;
    }
    recordDiskRead() {
        this.metrics.diskReads++;
    }
    recordError() {
        this.metrics.errors++;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getHitRate() {
        const totalHits = this.metrics.l1Hits +
            this.metrics.l2Hits +
            this.metrics.providerHits +
            this.metrics.offlineHits;
        const cacheHits = this.metrics.l1Hits + this.metrics.l2Hits;
        return totalHits === 0 ? 0 : cacheHits / totalHits;
    }
    reset() {
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
    summarize() {
        const hitRate = (this.getHitRate() * 100).toFixed(2);
        return (`Cache Metrics: L1=${this.metrics.l1Hits} L2=${this.metrics.l2Hits} ` +
            `Provider=${this.metrics.providerHits} Offline=${this.metrics.offlineHits} ` +
            `HitRate=${hitRate}% Errors=${this.metrics.errors}`);
    }
}
//# sourceMappingURL=cache-metrics.js.map