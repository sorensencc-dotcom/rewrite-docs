/**
 * Adapter Gateway Cache
 * Workstream C: L1 in-memory + L2 distributed caching
 *
 * TODO: Implement
 * - [ ] L1 in-memory cache with TTL/LRU eviction
 * - [ ] L2 distributed cache (Redis) client
 * - [ ] Cache invalidation rules
 * - [ ] Hit/miss metrics collection
 * - [ ] Stampede prevention
 */

export interface CacheConfig {
  l1MaxSize: number; // max entries in L1
  l1TTL: number; // seconds
  l2Enabled: boolean;
  l2Host?: string;
  l2Port?: number;
  stampedePrevention: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  stampedeCount: number;
}

/**
 * L1 In-Memory Cache with LRU eviction
 */
export class L1Cache {
  private cache: Map<string, { value: unknown; expiry: number }> = new Map();
  private lruOrder: string[] = [];
  private maxSize: number;
  private ttl: number;
  private metrics: CacheMetrics = { hits: 0, misses: 0, evictions: 0, stampedeCount: 0 };

  constructor(config: CacheConfig) {
    this.maxSize = config.l1MaxSize;
    this.ttl = config.l1TTL;
  }

  /**
   * Get value from cache
   */
  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update LRU order
    this.lruOrder = this.lruOrder.filter(k => k !== key);
    this.lruOrder.push(key);

    this.metrics.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: unknown): void {
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.lruOrder = this.lruOrder.filter(k => k !== key);
    }

    // Evict LRU entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.lruOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
        this.metrics.evictions++;
      }
    }

    // Add new entry
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl * 1000,
    });
    this.lruOrder.push(key);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.lruOrder = this.lruOrder.filter(k => k !== key);
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
}

/**
 * L2 Distributed Cache (Redis stub)
 */
export class L2Cache {
  private enabled: boolean;
  private host: string;
  private port: number;

  constructor(config: CacheConfig) {
    this.enabled = config.l2Enabled;
    this.host = config.l2Host || 'localhost';
    this.port = config.l2Port || 6379;
  }

  /**
   * Get value from distributed cache
   */
  async get(key: string): Promise<unknown | null> {
    if (!this.enabled) return null;
    // TODO: Implement Redis client
    return null;
  }

  /**
   * Set value in distributed cache
   */
  async set(key: string, value: unknown, ttl: number): Promise<void> {
    if (!this.enabled) return;
    // TODO: Implement Redis client
  }

  /**
   * Invalidate distributed cache entry
   */
  async invalidate(key: string): Promise<void> {
    if (!this.enabled) return;
    // TODO: Implement Redis client
  }
}

/**
 * Unified Cache with L1+L2 hierarchy
 */
export class AdapterGatewayCache {
  private l1: L1Cache;
  private l2: L2Cache;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.l1 = new L1Cache(config);
    this.l2 = new L2Cache(config);
  }

  /**
   * Get from L1, fall back to L2, then origin
   */
  async get(key: string): Promise<unknown | null> {
    // L1 hit
    const l1Hit = this.l1.get(key);
    if (l1Hit !== null) {
      return l1Hit;
    }

    // L2 hit
    const l2Hit = await this.l2.get(key);
    if (l2Hit !== null) {
      this.l1.set(key, l2Hit);
      return l2Hit;
    }

    // Cache miss — caller must fetch from origin
    return null;
  }

  /**
   * Set in both L1 and L2
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.l1.set(key, value);
    await this.l2.set(key, value, ttl || this.config.l1TTL);
  }

  /**
   * Invalidate both caches
   */
  async invalidate(key: string): Promise<void> {
    this.l1.invalidate(key);
    await this.l2.invalidate(key);
  }

  /**
   * Get metrics
   */
  getMetrics(): CacheMetrics {
    return this.l1.getMetrics();
  }
}
