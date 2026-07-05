import { Provider } from "../providers/cloudProviderBase.js";
export declare const cloudProviders: Record<string, Provider>;
export declare function getCloudProvider(providerName: string): Provider;
export declare function listCloudModels(enabledProviders?: string[]): string[];
export declare function getCloudProviderNames(): string[];
//# sourceMappingURL=cloudProviders.d.ts.map