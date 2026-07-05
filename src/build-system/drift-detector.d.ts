import { LineageRegistry } from './lineage-registry';
import { DriftIssue } from './types';
export declare class DriftDetector {
    private lineage;
    constructor(lineage: LineageRegistry);
    detectDriftForBuild(build_id: string): DriftIssue[];
    quarantineBuild(build_id: string): void;
    rollbackBuild(build_id: string, parent_build_id: string): boolean;
    getRecommendedAction(issue: DriftIssue): string;
    autoHeal(build_id: string): boolean;
}
//# sourceMappingURL=drift-detector.d.ts.map