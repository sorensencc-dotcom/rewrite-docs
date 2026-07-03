// Repomix Client (Phase 4.4)
// Wraps Repomix CLI and provides structured repo analysis

import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';

const execFileAsync = util.promisify(execFile);

export interface RepomixOutput {
  summary?: string;
  tree?: string;
  metrics?: Record<string, any>;
  files?: any[];
  statistics?: Record<string, any>;
}

export class RepomixClient {
  constructor(private readonly repomixPath: string = 'repomix') {}

  async analyzeRepo(repoPath: string): Promise<RepomixOutput> {
    try {
      const { stdout } = await execFileAsync(this.repomixPath, ['--json', repoPath]);
      return JSON.parse(stdout);
    } catch (error) {
      // Fallback to basic analysis if repomix CLI not available
      return this.fallbackAnalysis(repoPath);
    }
  }

  private fallbackAnalysis(repoPath: string): RepomixOutput {
    try {
      const stats = fs.statSync(repoPath);
      return {
        summary: `Repository at ${repoPath}`,
        tree: 'tree structure not available',
        metrics: {
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        },
      };
    } catch {
      return {
        summary: `Unable to analyze ${repoPath}`,
        metrics: {},
      };
    }
  }
}
