import { TextSegment, PipelineStage } from "../interfaces/postprocessor";
export declare class HarvesterStage implements PipelineStage {
    name: string;
    execute(segments: TextSegment[]): Promise<TextSegment[]>;
}
//# sourceMappingURL=harvester.d.ts.map