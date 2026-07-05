export class MAARRoutingHook {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    attachToMAARRouter(router) {
        const originalInvoke = router.invoke.bind(router);
        router.invoke = async (adapterId, payload, options) => {
            const skipCache = options?.skipCache ?? false;
            const response = await this.gateway.invoke(adapterId, payload, skipCache);
            if (!response.success) {
                throw new Error(response.error || "Adapter invocation failed");
            }
            return response.data;
        };
        router.invokeWithMetrics = async (adapterId, payload, options) => {
            return this.gateway.invoke(adapterId, payload, options?.skipCache ?? false);
        };
        router.getGateway = () => {
            return this.gateway;
        };
        router.setOfflineMode = (enabled) => {
            this.gateway.setOfflineMode(enabled);
        };
        router.getOfflineStatus = () => {
            return this.gateway.getOfflineStatus();
        };
        router.invalidateAdapter = (adapterId, pattern) => {
            return this.gateway.invalidateAdapter(adapterId, pattern);
        };
        router.getCacheMetrics = () => {
            return this.gateway.getMetrics();
        };
        router.getCacheHitRate = () => {
            return this.gateway.getHitRate();
        };
    }
    detachFromMAARRouter(router) {
        if (router.invoke && router.invoke.__original) {
            router.invoke = router.invoke.__original;
        }
    }
}
export async function wrapMAARWithGateway(router, gateway) {
    await gateway.initialize();
    const hook = new MAARRoutingHook(gateway);
    hook.attachToMAARRouter(router);
}
//# sourceMappingURL=maal-routing-hook.js.map