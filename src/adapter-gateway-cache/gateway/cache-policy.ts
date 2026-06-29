export enum CachePolicy {
  ALWAYS = "always",
  NEVER = "never",
  ON_MISS = "on_miss",
  READ_ONLY = "read_only",
}

export interface TTLPolicy {
  adapter?: string;
  default: number;
  min?: number;
  max?: number;
  override?: Record<string, number>;
}

export class CachePolicyManager {
  private policies = new Map<string, CachePolicy>();
  private ttlPolicy: TTLPolicy;
  private invalidationPatterns = new Map<string, string[]>();

  constructor(defaultTTL: number = 3600000) {
    this.ttlPolicy = {
      default: defaultTTL,
      min: 1000,
      max: 86400000,
    };
  }

  setPolicy(adapterId: string, policy: CachePolicy): void {
    this.policies.set(adapterId, policy);
  }

  getPolicy(adapterId: string): CachePolicy {
    return this.policies.get(adapterId) || CachePolicy.ON_MISS;
  }

  shouldCache(adapterId: string): boolean {
    const policy = this.getPolicy(adapterId);
    return policy !== CachePolicy.NEVER && policy !== CachePolicy.READ_ONLY;
  }

  shouldWrite(adapterId: string): boolean {
    const policy = this.getPolicy(adapterId);
    return (
      policy === CachePolicy.ALWAYS ||
      policy === CachePolicy.ON_MISS ||
      policy === CachePolicy.READ_ONLY
    );
  }

  getTTL(adapterId: string): number {
    const override = this.ttlPolicy.override?.[adapterId];
    if (override) return override;
    return this.ttlPolicy.default;
  }

  setTTLPolicy(policy: TTLPolicy): void {
    this.ttlPolicy = policy;
  }

  setInvalidationPattern(adapterId: string, patterns: string[]): void {
    this.invalidationPatterns.set(adapterId, patterns);
  }

  getInvalidationPatterns(adapterId: string): string[] {
    return this.invalidationPatterns.get(adapterId) || [];
  }

  matchesInvalidation(key: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(key);
    });
  }
}

export const DEFAULT_CACHE_POLICY = new CachePolicyManager();
