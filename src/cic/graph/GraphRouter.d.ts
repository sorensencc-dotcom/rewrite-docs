import { GraphContext } from './GraphContext.js';
export declare class GraphRouter {
    static route(policy: {
        name: string;
        require: readonly string[];
        optional?: readonly string[];
        mergeStrategy: string;
    }, req: {
        repo?: string;
        files?: string[];
        service?: string;
    }): Promise<Partial<GraphContext>>;
}
//# sourceMappingURL=GraphRouter.d.ts.map