import { PipelineStage, PostProcessor, Pipeline } from "../interfaces/postprocessor";
import { DefaultPipeline, PipelineConfig } from "./types";
export declare class PipelineFactory {
    static createPipeline(config: PipelineConfig, stages?: Map<string, PipelineStage>): Pipeline;
    static wrapPostProcessor(postProcessor: PostProcessor): PipelineStage;
}
export { DefaultPipeline, PipelineConfig };
//# sourceMappingURL=factory.d.ts.map