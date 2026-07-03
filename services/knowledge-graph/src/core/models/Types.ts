export enum NodeType {
  RunEvent = "RunEvent",
  Signal = "Signal",
  CorrelationCluster = "CorrelationCluster",
  Agent = "Agent",
  Repo = "Repo",
  File = "File",
  Commit = "Commit",
  GovernanceRecord = "GovernanceRecord",
  AuditEvent = "AuditEvent",
  Policy = "Policy",
  Constraint = "Constraint",
  Amendment = "Amendment",
}

export enum EdgeType {
  AgentExecutedEvent = "AGENT_EXECUTED_EVENT",
  EventTouchesRepo = "EVENT_TOUCHES_REPO",
  EventTouchesFile = "EVENT_TOUCHES_FILE",
  EventEmitsSignal = "EVENT_EMITS_SIGNAL",
  SignalObservedOnRepo = "SIGNAL_OBSERVED_ON_REPO",
  SignalObservedOnAgent = "SIGNAL_OBSERVED_ON_AGENT",
  PartOfCluster = "PART_OF_CLUSTER",
  CorrelatedWith = "CORRELATED_WITH",
  EventAuthoredByAgent = "EVENT_AUTHORED_BY_AGENT",
  RecordAmendsPolicy = "RECORD_AMENDS_POLICY",
  RecordCreatesConstraint = "RECORD_CREATES_CONSTRAINT",
}

export const AllNodeTypes = Object.values(NodeType);
export const AllEdgeTypes = Object.values(EdgeType);
