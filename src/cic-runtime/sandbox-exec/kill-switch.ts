export class KillSwitch {
  static enforce<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    if (timeoutMs <= 0) {
      throw new Error('[KillSwitch] timeoutMs must be positive');
    }

    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`[KillSwitch] Hard execution timeout exceeded: ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([
      promise.finally(() => clearTimeout(timeoutHandle)),
      timeoutPromise
    ]);
  }
}
