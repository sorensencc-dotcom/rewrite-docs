// CIC Pipeline Factory - minimal stub for Phase 0.7
export class PipelineFactory {
    static create(config) {
        return new Pipeline(config);
    }
    static createPipeline(config, stages) {
        return new Pipeline(config);
    }
    static wrapPostProcessor(config) {
        return config;
    }
}
export class Pipeline {
    config;
    constructor(config) {
        this.config = config;
    }
    async execute(segments) {
        if (Array.isArray(segments)) {
            return segments;
        }
        return {
            success: true,
            output: 'Pipeline executed successfully'
        };
    }
}
export default PipelineFactory;
//# sourceMappingURL=index.js.map