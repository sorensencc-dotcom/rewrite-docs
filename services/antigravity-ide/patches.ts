import { AntigravityIDE } from "./integration";

export interface PatchResponse {
  filePath: string;
  patch: string; // unified diff or direct replacement
}

export interface LocalLLMPatchRequest {
  filePath: string;
  language: string;
  code: string;
  issuesToFix: string[]; // issue IDs
}

export type LocalLLMPatchFn = (req: LocalLLMPatchRequest) => Promise<PatchResponse>;

export class PatchApplier {
  constructor(
    private ide: AntigravityIDE,
    private localLLMPatch: LocalLLMPatchFn
  ) {}

  async applyLocalFixes(
    filePath: string,
    language: string,
    code: string,
    issueIds: string[]
  ) {
    const resp = await this.localLLMPatch({ filePath, language, code, issuesToFix: issueIds });
    await this.ide.applyPatch(resp.filePath, resp.patch);
  }
}
