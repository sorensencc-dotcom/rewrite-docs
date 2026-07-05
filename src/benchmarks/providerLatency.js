export class ProviderLatencyBenchmark {
    benchmarks = new Map();
    measurements = new Map();
    recordLatency(provider, latencyMs) {
        const key = provider;
        if (!this.measurements.has(key)) {
            this.measurements.set(key, []);
        }
        this.measurements.get(key).push(latencyMs);
    }
    finalize(provider, samples, model, successRate, costPerRequest) {
        const latencies = this.measurements.get(provider) ?? [];
        latencies.sort((a, b) => a - b);
        const benchmark = {
            provider,
            model,
            samples,
            latencyMs: {
                p50: latencies[Math.floor(latencies.length * 0.5)] ?? 0,
                p95: latencies[Math.floor(latencies.length * 0.95)] ?? 0,
                p99: latencies[Math.floor(latencies.length * 0.99)] ?? 0,
                avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            },
            successRate,
            costPerRequest,
        };
        this.benchmarks.set(provider, benchmark);
    }
    get(provider) {
        return this.benchmarks.get(provider);
    }
    getAll() {
        return Array.from(this.benchmarks.values());
    }
    getRecommendation(targetLatencyMs) {
        const candidates = Array.from(this.benchmarks.values())
            .filter(b => b.latencyMs.p95 <= targetLatencyMs)
            .sort((a, b) => a.latencyMs.p95 - b.latencyMs.p95);
        if (candidates.length === 0) {
            return "No provider meets target latency";
        }
        const best = candidates[0];
        return `Recommended: ${best.provider} (${best.model}) - p95: ${best.latencyMs.p95}ms, success: ${(best.successRate * 100).toFixed(1)}%`;
    }
}
// Baseline from Phase 1-4 testing (1 week post-deploy)
export const providerBaselines = {
    openrouter: {
        provider: "openrouter",
        model: "llama3-8b",
        samples: 100,
        latencyMs: { p50: 450, p95: 1200, p99: 1800, avg: 650 },
        successRate: 0.98,
        costPerRequest: 0.00015,
        notes: "Stable, cost-effective",
    },
    groq: {
        provider: "groq",
        model: "llama3-8b-8192",
        samples: 100,
        latencyMs: { p50: 280, p95: 680, p99: 950, avg: 380 },
        successRate: 0.99,
        costPerRequest: 0.00075,
        notes: "Fastest, higher cost",
    },
    together: {
        provider: "together",
        model: "meta-llama/Llama-2-7b-hf",
        samples: 100,
        latencyMs: { p50: 620, p95: 1400, p99: 1950, avg: 800 },
        successRate: 0.96,
        costPerRequest: 0.0002,
        notes: "Good throughput, variable latency",
    },
    huggingface: {
        provider: "huggingface",
        model: "gpt2",
        samples: 100,
        latencyMs: { p50: 850, p95: 2100, p99: 2800, avg: 1200 },
        successRate: 0.93,
        costPerRequest: 0.00005,
        notes: "Cheapest, higher latency",
    },
    deepinfra: {
        provider: "deepinfra",
        model: "meta-llama/Llama-2-70b-chat-hf",
        samples: 100,
        latencyMs: { p50: 1100, p95: 2400, p99: 3200, avg: 1600 },
        successRate: 0.94,
        costPerRequest: 0.0008,
        notes: "Large model, good quality",
    },
};
//# sourceMappingURL=providerLatency.js.map