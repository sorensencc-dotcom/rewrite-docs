export interface PipelineConfig {
    humanize?: boolean;
    humanizeProfile?: string;
    diff?: boolean;
}
export interface PipelineResult {
    success: boolean;
    output?: string;
    error?: string;
}
export declare class PipelineFactory {
    static create(config: PipelineConfig): Pipeline;
    static createPipeline(config: any, stages?: Map<string, any>): Pipeline;
    static wrapPostProcessor(config: any): any;
}
export declare class Pipeline {
    private config;
    constructor(config: any);
    execute(segments?: any[]): Promise<any>;
}
export default PipelineFactory;
//# sourceMappingURL=index.d.ts.map