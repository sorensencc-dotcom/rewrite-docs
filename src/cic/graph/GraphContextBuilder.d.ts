import { GraphContext, GraphContextAPI } from './GraphContext.js';
export interface GraphContextAPIExtended extends GraphContextAPI {
    getCostContext(req: {
        service: string;
    }): Promise<GraphContext>;
}
export declare class GraphContextBuilder implements GraphContextAPIExtended {
    getRefactorContext(req: {
        repo: string;
        files: string[];
    }): Promise<GraphContext>;
    getDriftContext(req: {
        service: string;
    }): Promise<GraphContext>;
    getDiscoveryContext(req: {
        service: string;
    }): Promise<GraphContext>;
    getCostContext(req: {
        service: string;
    }): Promise<GraphContext>;
}
export declare const graphContext: GraphContextBuilder;
//# sourceMappingURL=GraphContextBuilder.d.ts.map