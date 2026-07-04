import { RepoHistorySlice, BlastRadiusReport } from '../GraphContext.js';
import { McpClientRunner } from './McpClientRunner.js';
import { mockRepoHistorySlice } from './mocks/GitNexusMock.js';

export class GitNexusAdapter {
  static async getBlastRadius(repo: string, files: string[], timeWindowDays: number): Promise<BlastRadiusReport> {
    try {
      return await McpClientRunner.callTool('gitnexus', 'gitnexus.get_blast_radius', { repo, files, timeWindowDays });
    } catch (e) {
      console.warn('GitNexus MCP failed, falling back to mock:', e);
      return mockRepoHistorySlice.blastRadius!;
    }
  }

  static async getServiceHistory(repo: string, service: string): Promise<RepoHistorySlice> {
    try {
      return await McpClientRunner.callTool('gitnexus', 'gitnexus.get_repo_history', { repo, service });
    } catch (e) {
      console.warn('GitNexus MCP failed, falling back to mock:', e);
      return mockRepoHistorySlice;
    }
  }
}
