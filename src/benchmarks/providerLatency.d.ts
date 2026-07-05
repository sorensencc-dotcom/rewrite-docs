export interface ProviderBenchmark {
    provider: string;
    model: string;
    samples: number;
    latencyMs: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;
    };
    successRate: number;
    costPerRequest?: number;
    notes?: string;
}
export declare class ProviderLatencyBenchmark {
    private benchmarks;
    private measurements;
    recordLatency(provider: string, latencyMs: number): void;
    finalize(provider: string, samples: number, model: string, successRate: number, costPerRequest?: number): void;
    get(provider: string): ProviderBenchmark | undefined;
    getAll(): ProviderBenchmark[];
    getRecommendation(targetLatencyMs: number): string;
}
export declare const providerBaselines: Record<string, ProviderBenchmark>;
//# sourceMappingURL=providerLatency.d.ts.map