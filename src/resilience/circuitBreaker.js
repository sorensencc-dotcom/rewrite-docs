/**
 * Circuit breaker pattern: prevents cascading failures.
 * States: CLOSED (normal) → OPEN (failing fast) → HALF_OPEN (test recovery) → CLOSED
 */
export class CircuitBreaker {
    state = "CLOSED";
    consecutiveFailures = 0;
    totalRequests = 0;
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    resetTimer = null;
    failureThreshold;
    failureRateThreshold;
    windowSize;
    resetTimeoutMs;
    name;
    requestWindow = []; // true = success, false = failure
    constructor(config) {
        this.failureThreshold = config?.failureThreshold ?? 5;
        this.failureRateThreshold = config?.failureRateThreshold ?? 0.5;
        this.windowSize = config?.windowSize ?? 100;
        this.resetTimeoutMs = config?.resetTimeoutMs ?? 60000; // 1 minute
        this.name = config?.name ?? "CircuitBreaker";
    }
    /**
     * Execute function with circuit breaker protection.
     */
    async execute(fn) {
        if (this.state === "OPEN") {
            throw new Error(`${this.name} is OPEN (circuit breaker)`);
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    recordSuccess() {
        this.consecutiveFailures = 0;
        this.successCount++;
        this.totalRequests++;
        this.requestWindow.push(true);
        if (this.requestWindow.length > this.windowSize) {
            this.requestWindow.shift();
        }
        // Transition HALF_OPEN → CLOSED after success
        if (this.state === "HALF_OPEN") {
            this.state = "CLOSED";
            this.clearResetTimer();
        }
    }
    recordFailure() {
        this.consecutiveFailures++;
        this.failureCount++;
        this.totalRequests++;
        this.lastFailureTime = Date.now();
        this.requestWindow.push(false);
        if (this.requestWindow.length > this.windowSize) {
            this.requestWindow.shift();
        }
        // Check thresholds
        const failureRate = this.failureCount / this.totalRequests;
        if (this.consecutiveFailures >= this.failureThreshold ||
            failureRate >= this.failureRateThreshold) {
            this.state = "OPEN";
            this.scheduleReset();
        }
    }
    scheduleReset() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        this.resetTimer = setTimeout(() => {
            this.state = "HALF_OPEN";
            this.resetTimer = null;
        }, this.resetTimeoutMs);
    }
    clearResetTimer() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
    }
    getState() {
        return this.state;
    }
    getMetrics() {
        const failureRate = this.totalRequests === 0 ? 0 : this.failureCount / this.totalRequests;
        return {
            state: this.state,
            consecutiveFailures: this.consecutiveFailures,
            totalRequests: this.totalRequests,
            failureCount: this.failureCount,
            successCount: this.successCount,
            failureRate,
            lastFailureTime: this.lastFailureTime,
        };
    }
    reset() {
        this.state = "CLOSED";
        this.consecutiveFailures = 0;
        this.totalRequests = 0;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
        this.requestWindow = [];
        this.clearResetTimer();
    }
}
/**
 * Circuit breaker registry for multiple providers.
 */
export class CircuitBreakerRegistry {
    breakers = new Map();
    config;
    constructor(config) {
        this.config = config ?? {};
    }
    getOrCreate(name) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker({ ...this.config, name }));
        }
        return this.breakers.get(name);
    }
    get(name) {
        return this.breakers.get(name);
    }
    getAll() {
        return new Map(this.breakers);
    }
    getMetrics(name) {
        return this.breakers.get(name)?.getMetrics();
    }
    getAllMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.breakers) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }
    reset(name) {
        this.breakers.get(name)?.reset();
    }
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}
//# sourceMappingURL=circuitBreaker.js.map