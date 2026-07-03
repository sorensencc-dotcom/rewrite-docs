-- Phase 4: Fallback Graph Proposals Table (Append-Only)
-- Stores fallback graph edge/node deltas submitted via DSL.

CREATE TABLE IF NOT EXISTS fallback_graph_proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,

  -- Fallback graph delta details
  operation VARCHAR(50) NOT NULL, -- 'add_edge', 'remove_edge', 'add_node', 'update_node_weight'
  source_regime VARCHAR(255),
  target_regime VARCHAR(255),
  node_id VARCHAR(255),
  weight NUMERIC,
  condition TEXT,

  -- Validation result
  validation_result VARCHAR(50) NOT NULL, -- checks acyclic, no orphans, valid edges
  validation_errors JSONB,

  -- Governance
  governance_approved_at TIMESTAMP,

  -- Audit
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rationale TEXT,

  FOREIGN KEY (proposal_id) REFERENCES regime_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_fallback_graph_proposals_proposal_id ON fallback_graph_proposals(proposal_id);
CREATE INDEX idx_fallback_graph_proposals_validation_result ON fallback_graph_proposals(validation_result);
