import { AgentListItem, AgentDetail, LogEvent, ExecutionRecord } from "../types/agents";

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 3600000);
const twentyFourHoursAgo = new Date(now.getTime() - 86400000);

export const mockAgentsList: AgentListItem[] = [
  {
    id: "agent-1",
    name: "PR Reviewer",
    status: "healthy",
    heartbeat: now.toISOString(),
    metrics: {
      executions24h: 142,
      errors24h: 2,
      cost24h: 3.47,
      latencyP95: 2850,
    },
    skills: ["review-code", "run-tests", "check-coverage"],
  },
  {
    id: "agent-2",
    name: "Build Monitor",
    status: "healthy",
    heartbeat: now.toISOString(),
    metrics: {
      executions24h: 89,
      errors24h: 0,
      cost24h: 1.23,
      latencyP95: 4200,
    },
    skills: ["start-build", "monitor-status", "notify-team"],
  },
  {
    id: "agent-3",
    name: "Deployment Agent",
    status: "degraded",
    heartbeat: oneHourAgo.toISOString(),
    metrics: {
      executions24h: 12,
      errors24h: 3,
      cost24h: 5.67,
      latencyP95: 8900,
    },
    skills: ["deploy-staging", "deploy-production", "rollback"],
  },
  {
    id: "agent-4",
    name: "Doc Generator",
    status: "offline",
    heartbeat: twentyFourHoursAgo.toISOString(),
    metrics: {
      executions24h: 0,
      errors24h: 0,
      cost24h: 0,
      latencyP95: 0,
    },
    skills: ["generate-docs", "publish-changelog"],
  },
  {
    id: "agent-5",
    name: "Test Orchestrator",
    status: "starting",
    heartbeat: new Date(now.getTime() - 10000).toISOString(),
    metrics: {
      executions24h: 0,
      errors24h: 0,
      cost24h: 0,
      latencyP95: 0,
    },
    skills: ["run-unit-tests", "run-e2e-tests"],
  },
];

export const mockAgentDetail: AgentDetail = {
  ...mockAgentsList[0],
  config: {
    maxConcurrency: 4,
    warmPool: true,
    version: "2.1.3",
  },
  system: {
    memoryMB: 512,
    lastRestart: new Date(now.getTime() - 172800000).toISOString(),
    restartReason: "scheduled-maintenance",
  },
};

export const mockLogEvents: LogEvent[] = [
  {
    ts: new Date(now.getTime() - 5000).toISOString(),
    level: "info",
    message: "Execution completed successfully",
    skill: "review-code",
    correlationId: "corr-1",
  },
  {
    ts: new Date(now.getTime() - 15000).toISOString(),
    level: "info",
    message: "Starting execution for PR #1234",
    skill: "review-code",
    correlationId: "corr-1",
  },
  {
    ts: new Date(now.getTime() - 25000).toISOString(),
    level: "warn",
    message: "High memory usage detected: 89%",
    skill: undefined,
    correlationId: undefined,
  },
];

export const mockExecutions: ExecutionRecord[] = [
  {
    id: "exec-1",
    skill: "review-code",
    durationMs: 12450,
    costUsd: 0.47,
    status: "success",
    startedAt: new Date(now.getTime() - 30000).toISOString(),
  },
  {
    id: "exec-2",
    skill: "run-tests",
    durationMs: 8900,
    costUsd: 0.23,
    status: "success",
    startedAt: new Date(now.getTime() - 60000).toISOString(),
  },
  {
    id: "exec-3",
    skill: "check-coverage",
    durationMs: 3200,
    costUsd: 0.08,
    status: "error",
    startedAt: new Date(now.getTime() - 90000).toISOString(),
  },
];
