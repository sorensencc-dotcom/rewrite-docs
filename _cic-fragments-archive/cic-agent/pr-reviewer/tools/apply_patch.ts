/**
 * Tool: apply_patch
 * Apply a Git patch to the current repository
 */

import { defineTool, ToolContext } from '../../../cic-runtime/toolDefinition';
import { z } from 'zod';
import os from 'os';
import path from 'path';

const inputSchema = z.object({
  patch: z.string(),
  branch: z.string().default('HEAD'),
  dryRun: z.boolean().default(false),
});

const outputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  filesChanged: z.array(z.string()),
  linesAdded: z.number(),
  linesRemoved: z.number(),
});

export default defineTool({
  name: 'apply_patch',
  description: 'Apply a Git patch to the repository',
  inputSchema,
  outputSchema,

  async execute(input, ctx: ToolContext) {
    ctx.logger.info('Applying patch', { branch: input.branch, dryRun: input.dryRun });

    // Write patch to temp file
    const patchFile = path.join(os.tmpdir(), `patch-${Date.now()}.patch`);
    const writePatch = await ctx.sandbox.exec('sh', [
      '-c',
      `cat > ${patchFile} << 'EOF'\n${input.patch}\nEOF`,
    ]);

    if (writePatch.code !== 0) {
      ctx.logger.error('Failed to write patch file');
      return {
        success: false,
        message: 'Failed to write patch file',
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0,
      };
    }

    // Apply patch (dry run first)
    const dryRunResult = await ctx.sandbox.exec('git', [
      'apply',
      '--check',
      patchFile,
    ]);

    if (dryRunResult.code !== 0) {
      ctx.logger.error('Patch check failed', { stderr: dryRunResult.stderr });
      return {
        success: false,
        message: `Patch check failed: ${dryRunResult.stderr}`,
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0,
      };
    }

    // If dry run only, return success
    if (input.dryRun) {
      ctx.logger.info('Patch check passed (dry run)');
      return {
        success: true,
        message: 'Patch check passed',
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0,
      };
    }

    // Apply the patch
    const applyResult = await ctx.sandbox.exec('git', ['apply', patchFile]);

    if (applyResult.code !== 0) {
      ctx.logger.error('Patch application failed', { stderr: applyResult.stderr });
      return {
        success: false,
        message: `Patch application failed: ${applyResult.stderr}`,
        filesChanged: [],
        linesAdded: 0,
        linesRemoved: 0,
      };
    }

    // Get diff stats
    const diffResult = await ctx.sandbox.exec('git', ['diff', '--stat', 'HEAD']);

    // Parse diff output to extract file list
    const filesChanged = diffResult.stdout
      .split('\n')
      .filter(line => line.includes('|'))
      .map(line => line.split('|')[0].trim());

    // Get overall stats
    const statsResult = await ctx.sandbox.exec('git', [
      'diff',
      '--numstat',
      'HEAD',
    ]);

    let linesAdded = 0;
    let linesRemoved = 0;

    statsResult.stdout.split('\n').forEach(line => {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        linesAdded += parseInt(parts[0]) || 0;
        linesRemoved += parseInt(parts[1]) || 0;
      }
    });

    ctx.logger.info(
      'Patch applied',
      { filesChanged: filesChanged.length, linesAdded, linesRemoved },
    );

    return {
      success: true,
      message: `Patch applied: ${filesChanged.length} files changed`,
      filesChanged,
      linesAdded,
      linesRemoved,
    };
  },
});
