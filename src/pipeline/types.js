export class DefaultPipeline {
    stages;
    constructor(stages) {
        this.stages = stages || new Map();
    }
    async execute(segments) {
        let currentSegments = segments;
        for (const stage of this.stages.values()) {
            currentSegments = await stage.execute(currentSegments);
        }
        return currentSegments;
    }
    getStages() {
        return Array.from(this.stages.values());
    }
    addStage(stage) {
        this.stages.set(stage.name, stage);
    }
}
//# sourceMappingURL=types.js.map