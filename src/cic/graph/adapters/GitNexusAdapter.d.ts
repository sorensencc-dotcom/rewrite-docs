import { RepoHistorySlice, BlastRadiusReport } from '../GraphContext.js';
export declare class GitNexusAdapter {
    static getBlastRadius(repo: string, files: string[], timeWindowDays: number): Promise<BlastRadiusReport>;
    static getServiceHistory(repo: string, service: string): Promise<RepoHistorySlice>;
}
//# sourceMappingURL=GitNexusAdapter.d.ts.map