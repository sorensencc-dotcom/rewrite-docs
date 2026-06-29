import { SandboxTier } from '../../cic-runtime/routing/tier-escalation-v3';

export class TierSelector {
  static resolveBaseTier(modelTags: string[]): SandboxTier {
    if (modelTags.includes('untrusted')) return 'S3';
    if (modelTags.includes('experimental')) return 'S2';
    return 'S1';
  }
}
