// Input to local LLM
export interface CodeReviewRequest {
  filePath: string;
  language: string;
  code: string;
  context?: string; // optional: surrounding info, intent, etc.
}

// Output from local LLM
export interface CodeReviewIssue {
  id: string;
  description: string;
  severity: "info" | "warning" | "error";
  tags: string[]; // used by routing (e.g. ["formatting", "ux", "metrics"])
  canFix: boolean; // local LLM believes it can fix this
}

export interface CodeReviewResponse {
  issues: CodeReviewIssue[];
  summary: string;
}
