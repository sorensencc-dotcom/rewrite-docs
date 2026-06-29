import { AdapterGateway } from "../gateway/adapter-gateway";
import { CachePolicy } from "../gateway/cache-policy";

export class ProviderAdapterHook {
  constructor(private gateway: AdapterGateway) {}

  registerProviderAdapter(
    adapterId: string,
    adapter: any,
    cachePolicy?: CachePolicy
  ): void {
    this.gateway.registerAdapter(adapterId, adapter);

    if (cachePolicy) {
      const policyManager = (this.gateway as any).policyManager;
      if (policyManager) {
        policyManager.setPolicy(adapterId, cachePolicy);
      }
    }
  }

  unregisterProviderAdapter(adapterId: string): void {
    this.gateway.unregisterAdapter(adapterId);
  }

  async registerBatchAdapters(
    adapters: Array<{
      id: string;
      instance: any;
      policy?: CachePolicy;
      ttl?: number;
    }>
  ): Promise<void> {
    for (const adapter of adapters) {
      this.registerProviderAdapter(adapter.id, adapter.instance, adapter.policy);

      const policyManager = (this.gateway as any).policyManager;
      if (policyManager && adapter.ttl) {
        policyManager.setTTLPolicy({
          default: 3600000,
          override: {
            [adapter.id]: adapter.ttl,
          },
        });
      }
    }
  }

  setInvalidationPatterns(adapterId: string, patterns: string[]): void {
    const policyManager = (this.gateway as any).policyManager;
    if (policyManager) {
      policyManager.setInvalidationPattern(adapterId, patterns);
    }
  }

  getRegisteredAdapters(): string[] {
    return this.gateway.getRegisteredAdapters();
  }

  isAdapterRegistered(adapterId: string): boolean {
    return this.getRegisteredAdapters().includes(adapterId);
  }
}

export async function attachGatewayToProviderAdapters(
  gateway: AdapterGateway,
  adapterRegistry: Record<string, any>
): Promise<void> {
  await gateway.initialize();

  const hook = new ProviderAdapterHook(gateway);

  for (const [adapterId, adapter] of Object.entries(adapterRegistry)) {
    hook.registerProviderAdapter(adapterId, adapter);
  }
}
