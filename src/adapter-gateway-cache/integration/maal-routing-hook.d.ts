import { AdapterGateway } from "../gateway/adapter-gateway";
export declare class MAARRoutingHook {
    private gateway;
    constructor(gateway: AdapterGateway);
    attachToMAARRouter(router: any): void;
    detachFromMAARRouter(router: any): void;
}
export declare function wrapMAARWithGateway(router: any, gateway: AdapterGateway): Promise<void>;
//# sourceMappingURL=maal-routing-hook.d.ts.map