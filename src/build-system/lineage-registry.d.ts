import { ArtifactRecord, BuildProvenance, DriftIssue } from './types';
export declare class LineageRegistry {
    private artifacts;
    private driftIssues;
    recordArtifact(agent_id: string, inputs: string[], outputs: string[], provenance: BuildProvenance, build_id: string, parent_build_id?: string): ArtifactRecord;
    updateArtifactStatus(artifact_id: string, status: 'running' | 'succeeded' | 'failed', error?: Error): void;
    getArtifact(artifact_id: string): ArtifactRecord | undefined;
    getArtifactsByBuild(build_id: string): ArtifactRecord[];
    getArtifactsByAgent(agent_id: string): ArtifactRecord[];
    validateProvenance(record: ArtifactRecord): boolean;
    detectDrift(record: ArtifactRecord, currentState: {
        inputs: string[];
        outputs: string[];
    }): DriftIssue | null;
    private computeSignature;
    getDriftIssues(build_id?: string): DriftIssue[];
    clearDriftIssues(build_id?: string): void;
    exportLineage(build_id: string): object;
}
//# sourceMappingURL=lineage-registry.d.ts.map