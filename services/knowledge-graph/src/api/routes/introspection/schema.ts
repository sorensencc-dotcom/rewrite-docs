import { Request, Response } from "express";
import { AllNodeTypes, AllEdgeTypes } from "../../../core/models/Types";

export function schemaRoute(req: Request, res: Response): void {
  res.json({
    nodes: AllNodeTypes,
    edges: AllEdgeTypes,
    properties: {
      RunEvent: ["agent_id", "event_type"],
      Signal: ["kind", "severity"],
      CorrelationCluster: ["reason"],
      Agent: [],
      Repo: ["health_score", "last_commit_at"],
      File: ["path", "size", "modified_at"],
      Commit: ["hash", "author", "timestamp"],
      GovernanceRecord: ["agent_id", "record_type"],
      AuditEvent: ["action", "target"],
      Policy: ["name", "rules"],
      Constraint: ["name", "bounds"],
      Amendment: ["proposal_id", "status"],
    },
  });
}
