export class ProviderAdapterHook {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    registerProviderAdapter(adapterId, adapter, cachePolicy) {
        this.gateway.registerAdapter(adapterId, adapter);
        if (cachePolicy) {
            const policyManager = this.gateway.policyManager;
            if (policyManager) {
                policyManager.setPolicy(adapterId, cachePolicy);
            }
        }
    }
    unregisterProviderAdapter(adapterId) {
        this.gateway.unregisterAdapter(adapterId);
    }
    async registerBatchAdapters(adapters) {
        for (const adapter of adapters) {
            this.registerProviderAdapter(adapter.id, adapter.instance, adapter.policy);
            const policyManager = this.gateway.policyManager;
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
    setInvalidationPatterns(adapterId, patterns) {
        const policyManager = this.gateway.policyManager;
        if (policyManager) {
            policyManager.setInvalidationPattern(adapterId, patterns);
        }
    }
    getRegisteredAdapters() {
        return this.gateway.getRegisteredAdapters();
    }
    isAdapterRegistered(adapterId) {
        return this.getRegisteredAdapters().includes(adapterId);
    }
}
export async function attachGatewayToProviderAdapters(gateway, adapterRegistry) {
    await gateway.initialize();
    const hook = new ProviderAdapterHook(gateway);
    for (const [adapterId, adapter] of Object.entries(adapterRegistry)) {
        hook.registerProviderAdapter(adapterId, adapter);
    }
}
//# sourceMappingURL=provider-adapter-hook.js.map