export class CacheLockManager {
  private acquiring = new Map<string, Promise<void>>();

  async acquireLock(key: string): Promise<() => void> {
    while (this.acquiring.has(key)) {
      await this.acquiring.get(key);
    }

    let resolveAcquire: (() => void) | null = null;
    const lockPromise = new Promise<void>((resolve) => {
      resolveAcquire = resolve;
    });

    this.acquiring.set(key, lockPromise);

    return () => this.releaseLock(key, resolveAcquire);
  }

  private releaseLock(key: string, resolve: (() => void) | null): void {
    if (resolve) resolve();
    this.acquiring.delete(key);
  }

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.acquireLock(key);
    try {
      return await fn();
    } finally {
      release();
    }
  }

  isLocked(key: string): boolean {
    return this.acquiring.has(key);
  }

  clearAll(): void {
    this.acquiring.clear();
  }
}
