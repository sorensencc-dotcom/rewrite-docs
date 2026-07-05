import { openrouterProvider } from "../providers/openrouterProvider.js";
import { huggingfaceProvider } from "../providers/huggingfaceProvider.js";
import { groqProvider } from "../providers/groqProvider.js";
import { togetherProvider } from "../providers/togetherProvider.js";
import { deepinfraProvider } from "../providers/deepinfraProvider.js";
import { meituanProvider } from "../providers/meituanProvider.js";
export const cloudProviders = {
    openrouter: openrouterProvider,
    huggingface: huggingfaceProvider,
    groq: groqProvider,
    together: togetherProvider,
    deepinfra: deepinfraProvider,
    meituan: meituanProvider,
};
export function getCloudProvider(providerName) {
    const provider = cloudProviders[providerName];
    if (!provider)
        throw new Error(`Unknown cloud provider: ${providerName}`);
    return provider;
}
export function listCloudModels(enabledProviders) {
    const providers = enabledProviders
        ? Object.entries(cloudProviders)
            .filter(([name]) => enabledProviders.includes(name))
            .map(([_, p]) => p)
        : Object.values(cloudProviders);
    return providers.flatMap((p) => p.models);
}
export function getCloudProviderNames() {
    return Object.keys(cloudProviders);
}
//# sourceMappingURL=cloudProviders.js.map