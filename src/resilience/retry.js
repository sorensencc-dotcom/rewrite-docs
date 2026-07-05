/**
 * Retry with exponential backoff.
 * Delays: 100ms → 200ms → 400ms → 800ms (capped)
 */
export class RetryHandler {
    maxAttempts;
    initialDelayMs;
    maxDelayMs;
    backoffMultiplier;
    name;
    totalAttempts = 0;
    retries = 0;
    failures = 0;
    successes = 0;
    lastError;
    constructor(config) {
        this.maxAttempts = config?.maxAttempts ?? 3;
        this.initialDelayMs = config?.initialDelayMs ?? 100;
        this.maxDelayMs = config?.maxDelayMs ?? 5000;
        this.backoffMultiplier = config?.backoffMultiplier ?? 2;
        this.name = config?.name ?? "RetryHandler";
    }
    async execute(fn) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            this.totalAttempts++;
            try {
                const result = await fn();
                this.successes++;
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.lastError = lastError.message;
                if (attempt < this.maxAttempts) {
                    const delay = this.calculateDelay(attempt - 1);
                    this.retries++;
                    await this.sleep(delay);
                }
                else {
                    this.failures++;
                }
            }
        }
        throw lastError || new Error(`${this.name} failed after ${this.maxAttempts} attempts`);
    }
    calculateDelay(attemptIndex) {
        const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attemptIndex);
        return Math.min(exponentialDelay, this.maxDelayMs);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getMetrics() {
        return {
            name: this.name,
            totalAttempts: this.totalAttempts,
            retries: this.retries,
            failures: this.failures,
            successes: this.successes,
            lastError: this.lastError,
        };
    }
    reset() {
        this.totalAttempts = 0;
        this.retries = 0;
        this.failures = 0;
        this.successes = 0;
        this.lastError = undefined;
    }
}
/**
 * Registry of retry handlers per endpoint.
 */
export class RetryHandlerRegistry {
    handlers = new Map();
    defaultConfig;
    constructor(defaultConfig) {
        this.defaultConfig = defaultConfig ?? { maxAttempts: 3 };
    }
    getOrCreate(name, config) {
        if (!this.handlers.has(name)) {
            const cfg = config ?? this.defaultConfig;
            this.handlers.set(name, new RetryHandler({ ...cfg, name }));
        }
        return this.handlers.get(name);
    }
    get(name) {
        return this.handlers.get(name);
    }
    async execute(name, fn) {
        const handler = this.getOrCreate(name);
        return handler.execute(fn);
    }
    getMetrics(name) {
        return this.handlers.get(name)?.getMetrics();
    }
    getAllMetrics() {
        const metrics = {};
        for (const [name, handler] of this.handlers) {
            metrics[name] = handler.getMetrics();
        }
        return metrics;
    }
    reset(name) {
        this.handlers.get(name)?.reset();
    }
    resetAll() {
        for (const handler of this.handlers.values()) {
            handler.reset();
        }
    }
}
//# sourceMappingURL=retry.js.map