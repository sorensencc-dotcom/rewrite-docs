export interface TimeoutConfig {
    timeoutMs?: number;
    name?: string;
}
/**
 * Wrap promise with timeout. Rejects if duration exceeded.
 */
export declare class TimeoutHandler {
    private readonly timeoutMs;
    private readonly name;
    constructor(config?: TimeoutConfig);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private createTimeout;
    getConfig(): {
        timeoutMs: number;
        name: string;
    };
}
/**
 * Registry of timeout handlers per endpoint.
 */
export declare class TimeoutHandlerRegistry {
    private handlers;
    private defaultConfig;
    constructor(defaultConfig?: TimeoutConfig);
    getOrCreate(name: string, config?: TimeoutConfig): TimeoutHandler;
    get(name: string): TimeoutHandler | undefined;
    execute<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=timeout.d.ts.map