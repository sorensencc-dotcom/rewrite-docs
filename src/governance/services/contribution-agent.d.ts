import { Database } from "../db";
import { PRCreationRequest, PRCreationResult } from "../models";
export interface ContributionAgentConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
    githubToken?: string;
}
export declare class ContributionAgent {
    private db;
    private maxRetries;
    private retryDelayMs;
    private timeoutMs;
    private githubToken;
    private governanceBridge;
    constructor(db: Database, config?: ContributionAgentConfig);
    createPullRequest(req: PRCreationRequest): Promise<PRCreationResult>;
    private parseGitHubUrl;
    private getDefaultBranchShaWithRetry;
    private createBranchWithRetry;
    private commitFileWithRetry;
    private createPRWithRetry;
    private getGitHubRef;
    private createGitHubRef;
    private putGitHubFile;
    private postGitHubPR;
    private githubRequest;
    private recordContributionToDB;
    private readSkillFile;
    private sleep;
}
//# sourceMappingURL=contribution-agent.d.ts.map