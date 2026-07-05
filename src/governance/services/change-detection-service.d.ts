import { Database } from "../db";
import { SkillManifestRecord, DiffResult } from "../models";
export interface ChangeDetectionConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
    gitDir?: string;
}
export declare class ChangeDetectionService {
    private db;
    private maxRetries;
    private retryDelayMs;
    private timeoutMs;
    private git;
    constructor(db: Database, config?: ChangeDetectionConfig);
    detectChanges(skillId: string): Promise<DiffResult>;
    private fetchRemoteWithRetry;
    private fetchRemoteFile;
    private buildGithubRawUrl;
    private computeChecksum;
    private computeDiffLines;
    private generateUnifiedDiff;
    private readLocalFile;
    private getSkillRecord;
    private recordDetectionEvent;
    private buildErrorResult;
    private sleep;
    queryModifiedSkills(): Promise<SkillManifestRecord[]>;
    clearModificationFlag(skillId: string): Promise<void>;
}
//# sourceMappingURL=change-detection-service.d.ts.map