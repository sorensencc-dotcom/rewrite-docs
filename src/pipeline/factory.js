import { DefaultPipeline } from "./types";
export class PipelineFactory {
    static createPipeline(config, stages) {
        const pipeline = new DefaultPipeline(stages);
        return pipeline;
    }
    static wrapPostProcessor(postProcessor) {
        return {
            name: "PostProcessor",
            async execute(segments) {
                // Process all segments in batch
                const results = postProcessor.processBatch(segments);
                // Update segments with humanization results
                segments.forEach((segment, idx) => {
                    // Only set humanized if processing actually happened
                    if (results[idx].applied || results[idx].edits.length > 0) {
                        segment.humanized = results[idx];
                    }
                    // Apply final content if not dry-run
                    if (results[idx].finalContent !== segment.content) {
                        segment.content = results[idx].finalContent;
                    }
                });
                return segments;
            },
        };
    }
}
export { DefaultPipeline };
//# sourceMappingURL=factory.js.map