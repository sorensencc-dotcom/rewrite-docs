/**
 * Wrap promise with timeout. Rejects if duration exceeded.
 */
export class TimeoutHandler {
    timeoutMs;
    name;
    constructor(config) {
        this.timeoutMs = config?.timeoutMs ?? 30000; // 30s default
        this.name = config?.name ?? "TimeoutHandler";
    }
    async execute(fn) {
        return Promise.race([
            fn(),
            this.createTimeout(),
        ]);
    }
    createTimeout() {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${this.name} exceeded ${this.timeoutMs}ms`));
            }, this.timeoutMs);
        });
    }
    getConfig() {
        return { timeoutMs: this.timeoutMs, name: this.name };
    }
}
/**
 * Registry of timeout handlers per endpoint.
 */
export class TimeoutHandlerRegistry {
    handlers = new Map();
    defaultConfig;
    constructor(defaultConfig) {
        this.defaultConfig = defaultConfig ?? { timeoutMs: 30000 };
    }
    getOrCreate(name, config) {
        if (!this.handlers.has(name)) {
            const cfg = config ?? this.defaultConfig;
            this.handlers.set(name, new TimeoutHandler({ ...cfg, name }));
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
}
//# sourceMappingURL=timeout.js.map