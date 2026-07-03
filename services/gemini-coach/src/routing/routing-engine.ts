import { CodeReviewResponse, CodeReviewIssue } from "./local-llm-schema";
import { routeIssues, RoutingDecision } from "./routing-algorithm";

export interface RoutedWork {
  localLLM: CodeReviewIssue[];
  geminiCoach: CodeReviewIssue[];
  claudeTorqueQuery: CodeReviewIssue[];
  cic: CodeReviewIssue[];
  appCode: CodeReviewIssue[];
}

export function buildRoutingDecision(
  review: CodeReviewResponse
): RoutedWork {
  const issues = review.issues.map(issue => ({
    id: issue.id,
    description: issue.description,
    tags: issue.tags,
  }));

  const decision: RoutingDecision = routeIssues(issues);

  return {
    localLLM: review.issues.filter(i => decision.localLLM.some(d => d.id === i.id)),
    geminiCoach: review.issues.filter(i => decision.geminiCoach.some(d => d.id === i.id)),
    claudeTorqueQuery: review.issues.filter(i => decision.claudeTorqueQuery.some(d => d.id === i.id)),
    cic: review.issues.filter(i => decision.cic.some(d => d.id === i.id)),
    appCode: review.issues.filter(i => decision.appCode.some(d => d.id === i.id)),
  };
}
