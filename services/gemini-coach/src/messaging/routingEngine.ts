import {
  buildLocalLLMFixableMessage,
  buildLocalLLMPartialMessage,
  buildGeminiIssuesMessage,
  buildClaudeTQIssuesMessage,
  buildCICIssuesMessage,
  buildEngineerIssuesMessage,
  buildRoutingSummaryMessage,
  RoutingMessage,
  RoutedWorkCounts,
} from "./routingMessages";
import { RoutedWork } from "../routing/routing-engine";

export interface RoutingMessagingResult {
  messages: RoutingMessage[];
}

export function buildRoutingMessages(work: RoutedWork): RoutingMessagingResult {
  const messages: RoutingMessage[] = [];

  const counts: RoutedWorkCounts = {
    localLLM: work.localLLM.length,
    geminiCoach: work.geminiCoach.length,
    claudeTorqueQuery: work.claudeTorqueQuery.length,
    cic: work.cic.length,
    appCode: work.appCode.length,
  };

  if (counts.localLLM > 0) {
    messages.push(buildLocalLLMFixableMessage(counts.localLLM));
  }

  // Partial fix detection: simple heuristic
  const hasPartial =
    work.localLLM.some(i => i.canFix === false) ||
    work.geminiCoach.length > 0 ||
    work.claudeTorqueQuery.length > 0 ||
    work.cic.length > 0;

  if (hasPartial && counts.localLLM > 0) {
    messages.push(buildLocalLLMPartialMessage());
  }

  if (counts.geminiCoach > 0) {
    messages.push(buildGeminiIssuesMessage(counts.geminiCoach));
  }

  if (counts.claudeTorqueQuery > 0) {
    messages.push(buildClaudeTQIssuesMessage(counts.claudeTorqueQuery));
  }

  if (counts.cic > 0) {
    messages.push(buildCICIssuesMessage(counts.cic));
  }

  if (counts.appCode > 0) {
    messages.push(buildEngineerIssuesMessage(counts.appCode));
  }

  messages.push(buildRoutingSummaryMessage(counts));

  return { messages };
}
