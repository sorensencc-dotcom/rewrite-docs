export interface FallbackProvider {
  name: string;
  execute: <T>() => Promise<T>;
  priority: number; // Lower = higher priority
}

export interface FallbackChainConfig {
  name?: string;
  breakOnSuccess?: boolean; // Stop after first success (default: true)
}

export interface FallbackChainMetrics {
  name: string;
  totalAttempts: number;
  attempts: Record<string, number>;
  successes: Record<string, number>;
  failures: Record<string, number>;
  lastError?: string;
  successProvider?: string;
}

/**
 * Fallback chain: try providers in order.
 * Default: Grok → OpenRouter → Ollama
 * Falls through to next on failure.
 */
export class FallbackChain {
  private providers: FallbackProvider[] = [];
  private readonly name: string;
  private readonly breakOnSuccess: boolean;

  private totalAttempts = 0;
  private attempts: Record<string, number> = {};
  private successes: Record<string, number> = {};
  private failures: Record<string, number> = {};
  private lastError?: string;
  private successProvider?: string;

  constructor(config?: FallbackChainConfig) {
    this.name = config?.name ?? "FallbackChain";
    this.breakOnSuccess = config?.breakOnSuccess ?? true;
  }

  addProvider(provider: FallbackProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);

    // Initialize metrics
    this.attempts[provider.name] = 0;
    this.successes[provider.name] = 0;
    this.failures[provider.name] = 0;
  }

  async execute<T>(): Promise<T> {
    if (this.providers.length === 0) {
      throw new Error(`${this.name} has no providers configured`);
    }

    let lastError: Error | undefined;

    for (const provider of this.providers) {
      this.totalAttempts++;
      this.attempts[provider.name]++;

      try {
        const result = await provider.execute<T>();
        this.successes[provider.name]++;
        this.successProvider = provider.name;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.lastError = lastError.message;
        this.failures[provider.name]++;
      }
    }

    throw (
      lastError ||
      new Error(`${this.name} exhausted all ${this.providers.length} providers`)
    );
  }

  getMetrics(): FallbackChainMetrics {
    return {
      name: this.name,
      totalAttempts: this.totalAttempts,
      attempts: { ...this.attempts },
      successes: { ...this.successes },
      failures: { ...this.failures },
      lastError: this.lastError,
      successProvider: this.successProvider,
    };
  }

  reset(): void {
    this.totalAttempts = 0;
    for (const name of Object.keys(this.attempts)) {
      this.attempts[name] = 0;
      this.successes[name] = 0;
      this.failures[name] = 0;
    }
    this.lastError = undefined;
    this.successProvider = undefined;
  }
}

/**
 * Registry of fallback chains per endpoint.
 */
export class FallbackChainRegistry {
  private chains: Map<string, FallbackChain> = new Map();

  getOrCreate(name: string, config?: FallbackChainConfig): FallbackChain {
    if (!this.chains.has(name)) {
      this.chains.set(name, new FallbackChain({ ...config, name }));
    }
    return this.chains.get(name)!;
  }

  get(name: string): FallbackChain | undefined {
    return this.chains.get(name);
  }

  getMetrics(name: string): FallbackChainMetrics | undefined {
    return this.chains.get(name)?.getMetrics();
  }

  getAllMetrics(): Record<string, FallbackChainMetrics> {
    const metrics: Record<string, FallbackChainMetrics> = {};
    for (const [name, chain] of this.chains) {
      metrics[name] = chain.getMetrics();
    }
    return metrics;
  }

  reset(name: string): void {
    this.chains.get(name)?.reset();
  }

  resetAll(): void {
    for (const chain of this.chains.values()) {
      chain.reset();
    }
  }
}
