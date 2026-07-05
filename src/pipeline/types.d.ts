import { TextSegment, PostProcessorConfig, PipelineStage, Pipeline } from "../interfaces/postprocessor";
export interface PipelineConfig {
    harvester?: Record<string, unknown>;
    postProcessor?: PostProcessorConfig;
    auditor?: Record<string, unknown>;
    synthesizer?: Record<string, unknown>;
}
export interface StageFactory {
    name: string;
    create(config?: Record<string, unknown>): PipelineStage;
}
export declare class DefaultPipeline implements Pipeline {
    private stages;
    constructor(stages?: Map<string, PipelineStage>);
    execute(segments: TextSegment[]): Promise<TextSegment[]>;
    getStages(): PipelineStage[];
    addStage(stage: PipelineStage): void;
}
//# sourceMappingURL=types.d.ts.map