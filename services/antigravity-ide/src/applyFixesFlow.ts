import { PatchApplier } from "./patches";
import { CodeReviewIssue } from "../../gemini-coach/src/routing/local-llm-schema";
import { AntigravityUI } from "./uiAdapter";

export class ApplyFixesFlow {
  constructor(
    private applier: PatchApplier,
    private ui: AntigravityUI
  ) {}

  async run(
    filePath: string,
    language: string,
    code: string,
    issues: CodeReviewIssue[]
  ) {
    const fixable = issues.filter(i => i.canFix);

    if (fixable.length === 0) {
      this.ui.updateStatusBar("No auto-fixable issues.");
      return;
    }

    const issueIds = fixable.map(i => i.id);

    await this.applier.applyLocalFixes(filePath, language, code, issueIds);

    this.ui.updateStatusBar(`Applied ${issueIds.length} local fixes.`);
  }
}
