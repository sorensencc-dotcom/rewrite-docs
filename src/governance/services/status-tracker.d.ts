import { Database } from "../db";
import { PRStatusSnapshot } from "../models";
interface StatusTrackerConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
    cacheMinutes?: number;
    githubToken?: string;
}
export declare class StatusTracker {
    private db;
    private maxRetries;
    private retryDelayMs;
    private timeoutMs;
    private cacheMinutes;
    private githubToken;
    private governanceBridge;
    private statusCache;
    constructor(db: Database, config?: StatusTrackerConfig);
    checkPRStatus(skillId: string, prNumber: number, repoUrl: string): Promise<PRStatusSnapshot>;
    checkAllPRsForSkill(skillId: string): Promise<PRStatusSnapshot[]>;
    private getPRWithRetry;
    private getReviewStateWithRetry;
    private getCommitStatusWithRetry;
    private recordStatusUpdate;
    private getSkillRecord;
    private getOpenContributions;
    private parseRepoUrl;
    private githubRequest;
    private sleep;
    checkAndUpdatePRStatus(skillId: string, prNumber: number, repoUrl: string, skillName: string): Promise<PRStatusSnapshot>;
    clearCache(): void;
}
export {};
//# sourceMappingURL=status-tracker.d.ts.map