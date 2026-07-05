import { BuildGraph } from './types';
interface OrchestrationConfig {
    phase: string;
    lineageUrl: string;
    routingUrl: string;
    nemotronUrl: string;
    nimGatewayUrl: string;
    port: number;
}
export declare class BuildOrchestrator {
    private config;
    private engine;
    private builds;
    constructor(config?: Partial<OrchestrationConfig>);
    initialize(): Promise<void>;
    executeBuild(build_id: string): Promise<{
        success: boolean;
        build_id: string;
        error?: string;
    }>;
    getBuildStatus(build_id: string): object | null;
    listBuilds(status?: string): object[];
    getGraph(): BuildGraph | null;
    startServer(): void;
}
export default BuildOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map