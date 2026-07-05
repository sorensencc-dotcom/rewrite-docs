import { Database } from "../db";
import { SkillManifestEntry, SkillManifestRecord, SkillContributionRecord } from "../models";
export declare class ManifestService {
    private db;
    constructor(db: Database);
    registerSkill(skill: SkillManifestEntry): Promise<SkillManifestRecord>;
    getSkillById(skillId: string): Promise<SkillManifestRecord | null>;
    listSkills(): Promise<SkillManifestRecord[]>;
    listAvailableSkills(): Promise<SkillManifestRecord[]>;
    listModifiedSkills(): Promise<SkillManifestRecord[]>;
    markUnavailable(skillId: string, reason?: string): Promise<void>;
    updateLastSyncCommit(skillId: string, commit: string): Promise<void>;
    markLocallyModified(skillId: string): Promise<void>;
    recordContribution(contrib: SkillContributionRecord): Promise<number>;
    getContribution(skillId: string, prNumber: number): Promise<SkillContributionRecord | null>;
    listContributions(skillId: string): Promise<SkillContributionRecord[]>;
    updateContributionStatus(skillId: string, prNumber: number, status: "open" | "merged" | "closed" | "rejected", notes?: string): Promise<void>;
}
//# sourceMappingURL=manifest-service.d.ts.map