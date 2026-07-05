import { Database } from "../db";
interface NotifierConfig {
    webhookUrl?: string;
    channel?: string;
    timeout?: number;
}
export declare class Notifier {
    private db;
    private webhookUrl;
    private channel;
    private timeout;
    constructor(db: Database, config?: NotifierConfig);
    notifySubmitted(skillId: string, skillName: string, prNumber: number, prUrl: string, linesAdded: number, linesDeleted: number): Promise<void>;
    notifyMerged(skillId: string, skillName: string, prNumber: number, prUrl: string, mergedAt: string): Promise<void>;
    notifyChangesRequested(skillId: string, skillName: string, prNumber: number, prUrl: string, reviewComments: number): Promise<void>;
    notifyClosed(skillId: string, skillName: string, prNumber: number, prUrl: string): Promise<void>;
    private sendWebhook;
}
export {};
//# sourceMappingURL=notifier.d.ts.map