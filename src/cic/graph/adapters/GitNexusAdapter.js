import { McpClientRunner } from './McpClientRunner.js';
import { mockRepoHistorySlice } from './mocks/GitNexusMock.js';
export class GitNexusAdapter {
    static async getBlastRadius(repo, files, timeWindowDays) {
        try {
            return await McpClientRunner.callTool('gitnexus', 'gitnexus.get_blast_radius', { repo, files, timeWindowDays });
        }
        catch (e) {
            console.warn('GitNexus MCP failed, falling back to mock:', e);
            return mockRepoHistorySlice.blastRadius;
        }
    }
    static async getServiceHistory(repo, service) {
        try {
            return await McpClientRunner.callTool('gitnexus', 'gitnexus.get_repo_history', { repo, service });
        }
        catch (e) {
            console.warn('GitNexus MCP failed, falling back to mock:', e);
            return mockRepoHistorySlice;
        }
    }
}
//# sourceMappingURL=GitNexusAdapter.js.map