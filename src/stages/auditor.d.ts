import { TextSegment, PipelineStage } from "../interfaces/postprocessor";
export declare class AuditorStage implements PipelineStage {
    name: string;
    execute(segments: TextSegment[]): Promise<TextSegment[]>;
}
//# sourceMappingURL=auditor.d.ts.map