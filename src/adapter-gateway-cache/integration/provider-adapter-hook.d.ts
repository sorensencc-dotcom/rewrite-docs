import { AdapterGateway } from "../gateway/adapter-gateway";
import { CachePolicy } from "../gateway/cache-policy";
export declare class ProviderAdapterHook {
    private gateway;
    constructor(gateway: AdapterGateway);
    registerProviderAdapter(adapterId: string, adapter: any, cachePolicy?: CachePolicy): void;
    unregisterProviderAdapter(adapterId: string): void;
    registerBatchAdapters(adapters: Array<{
        id: string;
        instance: any;
        policy?: CachePolicy;
        ttl?: number;
    }>): Promise<void>;
    setInvalidationPatterns(adapterId: string, patterns: string[]): void;
    getRegisteredAdapters(): string[];
    isAdapterRegistered(adapterId: string): boolean;
}
export declare function attachGatewayToProviderAdapters(gateway: AdapterGateway, adapterRegistry: Record<string, any>): Promise<void>;
//# sourceMappingURL=provider-adapter-hook.d.ts.map