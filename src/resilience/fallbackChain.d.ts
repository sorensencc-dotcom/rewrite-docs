export interface FallbackProvider {
    name: string;
    execute: <T>() => Promise<T>;
    priority: number;
}
export type FallbackProviderState = "CLOSED" | "OPEN" | "HALF_OPEN";
export interface FallbackChainConfig {
    name?: string;
    breakOnSuccess?: boolean;
    providerFailureThreshold?: number;
    providerResetTimeoutMs?: number;
}
export interface FallbackChainMetrics {
    name: string;
    totalAttempts: number;
    attempts: Record<string, number>;
    successes: Record<string, number>;
    failures: Record<string, number>;
    lastError?: string;
    successProvider?: string;
    providerStates: Record<string, FallbackProviderState>;
    hasProviders: boolean;
}
/**
 * Fallback chain: try providers in order, with per-provider health state machine.
 * States: CLOSED (eligible) → OPEN (failing, skip) → HALF_OPEN (test) → CLOSED
 * Default: Grok → OpenRouter → Ollama
 * Falls through to next on failure.
 */
export declare class FallbackChain {
    private providers;
    private readonly name;
    private readonly breakOnSuccess;
    private readonly providerFailureThreshold;
    private readonly providerResetTimeoutMs;
    private totalAttempts;
    private attempts;
    private successes;
    private failures;
    private lastError?;
    private successProvider?;
    private providerStates;
    constructor(config?: FallbackChainConfig);
    addProvider(provider: FallbackProvider): void;
    execute<T>(): Promise<T>;
    hasProviders(): boolean;
    getMetrics(): FallbackChainMetrics;
    reset(): void;
}
/**
 * Registry of fallback chains per endpoint.
 */
export declare class FallbackChainRegistry {
    private chains;
    getOrCreate(name: string, config?: FallbackChainConfig): FallbackChain;
    get(name: string): FallbackChain | undefined;
    getMetrics(name: string): FallbackChainMetrics | undefined;
    getAllMetrics(): Record<string, FallbackChainMetrics>;
    reset(name: string): void;
    resetAll(): void;
}
//# sourceMappingURL=fallbackChain.d.ts.map