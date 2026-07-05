import { RouteRequest } from './types';
export declare class RoutingEngine {
    private validPhases;
    private validChannels;
    private allowedRoutes;
    validateRoute(request: RouteRequest): {
        allowed: boolean;
        reason?: string;
    };
    validateChannel(channel: string): boolean;
    getAllowedRoutes(): object[];
    getAllowedChannels(): string[];
}
//# sourceMappingURL=routing-engine.d.ts.map