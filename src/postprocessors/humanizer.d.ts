import { PostProcessor, PostProcessorConfig, TextSegment, HumanizationResult, EditRecord } from "../interfaces/postprocessor";
export declare class HumanizerPostProcessor implements PostProcessor {
    private config;
    constructor(config: PostProcessorConfig);
    initialize(): Promise<void>;
    process(segment: TextSegment): HumanizationResult;
    processBatch(segments: TextSegment[]): HumanizationResult[];
    getRulesApplied(segment: TextSegment): EditRecord[];
    isDeterministic(iterations?: number): boolean;
    cleanup(): void;
}
//# sourceMappingURL=humanizer.d.ts.map