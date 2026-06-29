-- Migration 004: Add severity, category, and policy_metadata columns to skill_lineage
-- Phase 5: Restore lineage fidelity by storing full policy metadata
-- Target: MySQL InnoDB (existing skill_lineage table)

ALTER TABLE skill_lineage
ADD COLUMN severity VARCHAR(20) DEFAULT 'medium' COMMENT 'Audit severity level from AuditResult' AFTER risk_score,
ADD COLUMN category VARCHAR(50) DEFAULT 'governance' COMMENT 'Audit category from AuditResult' AFTER severity,
ADD COLUMN policy_metadata JSON COMMENT 'Full GovernancePolicy[] metadata for all triggered policies' AFTER policy_version;

-- Create index on severity for fast filtering
CREATE INDEX idx_skill_lineage_severity ON skill_lineage(severity);

-- Create index on category for fast filtering
CREATE INDEX idx_skill_lineage_category ON skill_lineage(category);
