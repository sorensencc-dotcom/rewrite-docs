import { AdapterGateway } from "../gateway/adapter-gateway";
import { AdapterResponse } from "../cache-engine/cache-types";

export class MAARRoutingHook {
  constructor(private gateway: AdapterGateway) {}

  attachToMAARRouter(router: any): void {
    const originalInvoke = router.invoke.bind(router);

    router.invoke = async (
      adapterId: string,
      payload: any,
      options?: any
    ): Promise<any> => {
      const skipCache = options?.skipCache ?? false;
      const response = await this.gateway.invoke(adapterId, payload, skipCache);

      if (!response.success) {
        throw new Error(response.error || "Adapter invocation failed");
      }

      return response.data;
    };

    router.invokeWithMetrics = async (
      adapterId: string,
      payload: any,
      options?: any
    ): Promise<AdapterResponse> => {
      return this.gateway.invoke(adapterId, payload, options?.skipCache ?? false);
    };

    router.getGateway = (): AdapterGateway => {
      return this.gateway;
    };

    router.setOfflineMode = (enabled: boolean): void => {
      this.gateway.setOfflineMode(enabled);
    };

    router.getOfflineStatus = () => {
      return this.gateway.getOfflineStatus();
    };

    router.invalidateAdapter = (adapterId: string, pattern?: string) => {
      return this.gateway.invalidateAdapter(adapterId, pattern);
    };

    router.getCacheMetrics = () => {
      return this.gateway.getMetrics();
    };

    router.getCacheHitRate = () => {
      return this.gateway.getHitRate();
    };
  }

  detachFromMAARRouter(router: any): void {
    if (router.invoke && router.invoke.__original) {
      router.invoke = router.invoke.__original;
    }
  }
}

export async function wrapMAARWithGateway(
  router: any,
  gateway: AdapterGateway
): Promise<void> {
  await gateway.initialize();

  const hook = new MAARRoutingHook(gateway);
  hook.attachToMAARRouter(router);
}
