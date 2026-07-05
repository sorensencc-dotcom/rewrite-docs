/**
 * Token bucket rate limiter: allows bursts but enforces rate limit.
 * - Add tokens at fixed rate (e.g., 10 tokens/sec)
 * - Each request costs 1 token
 * - Reject if insufficient tokens
 */
export class RateLimiter {
    tokens;
    maxTokens;
    refillRate; // tokens/ms
    lastRefillTime;
    rejected = 0;
    allowed = 0;
    name;
    constructor(config) {
        const rps = config?.requestsPerSecond ?? 10;
        const burst = config?.burstSize ?? rps * 2; // Default: 2 seconds of capacity
        this.maxTokens = burst;
        this.tokens = burst;
        this.refillRate = rps / 1000; // tokens/ms
        this.lastRefillTime = Date.now();
        this.name = config?.name ?? "RateLimiter";
    }
    /**
     * Try to consume 1 token. Returns true if allowed.
     */
    tryConsume() {
        this.refill();
        if (this.tokens >= 1) {
            this.tokens--;
            this.allowed++;
            return true;
        }
        this.rejected++;
        return false;
    }
    /**
     * Block until token available (promise-based).
     */
    async consume() {
        while (!this.tryConsume()) {
            // Wait until token available
            const timeToWait = Math.ceil(1 / this.refillRate);
            await new Promise(resolve => setTimeout(resolve, Math.min(timeToWait, 100)));
        }
    }
    refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefillTime;
        const tokensToAdd = timePassed * this.refillRate;
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefillTime = now;
    }
    getMetrics() {
        this.refill();
        const total = this.allowed + this.rejected;
        const rejectionRate = total === 0 ? 0 : this.rejected / total;
        return {
            tokensAvailable: Math.floor(this.tokens),
            requestsPerSecond: this.refillRate * 1000,
            rejected: this.rejected,
            allowed: this.allowed,
            rejection_rate: rejectionRate,
        };
    }
    reset() {
        this.tokens = this.maxTokens;
        this.rejected = 0;
        this.allowed = 0;
        this.lastRefillTime = Date.now();
    }
}
/**
 * Registry of rate limiters per endpoint/provider.
 */
export class RateLimiterRegistry {
    limiters = new Map();
    defaultConfig;
    constructor(defaultConfig) {
        this.defaultConfig = defaultConfig ?? { requestsPerSecond: 10 };
    }
    getOrCreate(name, config) {
        if (!this.limiters.has(name)) {
            const cfg = config ?? this.defaultConfig;
            this.limiters.set(name, new RateLimiter({ ...cfg, name }));
        }
        return this.limiters.get(name);
    }
    get(name) {
        return this.limiters.get(name);
    }
    async tryConsume(name) {
        const limiter = this.getOrCreate(name);
        return limiter.tryConsume();
    }
    async consume(name) {
        const limiter = this.getOrCreate(name);
        return limiter.consume();
    }
    getMetrics(name) {
        return this.limiters.get(name)?.getMetrics();
    }
    getAllMetrics() {
        const metrics = {};
        for (const [name, limiter] of this.limiters) {
            metrics[name] = limiter.getMetrics();
        }
        return metrics;
    }
    reset(name) {
        this.limiters.get(name)?.reset();
    }
    resetAll() {
        for (const limiter of this.limiters.values()) {
            limiter.reset();
        }
    }
}
//# sourceMappingURL=rateLimiter.js.map