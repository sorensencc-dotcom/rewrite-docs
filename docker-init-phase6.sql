-- Phase 6 Database Initialization
-- Governance Analytics + Metrics Substrate
-- Initialize governance_envelope, audit_log, nightly_metrics, and triggers

-- ============================================================================
-- 001_governance_envelope.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS governance_envelope (
  proposal_id TEXT PRIMARY KEY,
  current_version TEXT NOT NULL,
  previous_version TEXT NOT NULL,
  lineage_depth INT NOT NULL DEFAULT 1,
  last_violation JSONB,
  last_rollback JSONB,
  risk_score NUMERIC(4,3) NOT NULL DEFAULT 0.0,
  hybrid_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.30,
  lambda_weight NUMERIC(4,3) NOT NULL DEFAULT 0.37,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT risk_score_range CHECK (risk_score >= 0 AND risk_score <= 1.0),
  CONSTRAINT threshold_range CHECK (hybrid_threshold >= 0.20 AND hybrid_threshold <= 0.40),
  CONSTRAINT lambda_range CHECK (lambda_weight >= 0.20 AND lambda_weight <= 0.60)
);

CREATE INDEX IF NOT EXISTS idx_governance_envelope_updated_at ON governance_envelope(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_envelope_risk_score ON governance_envelope(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_governance_envelope_lineage_depth ON governance_envelope(lineage_depth DESC);

-- ============================================================================
-- 002_audit_log.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  record_id UUID NOT NULL DEFAULT gen_random_uuid(),
  proposal_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'submit','validate','canary_start','canary_end','violation','rollback','abort','promotion',
    'governance_threshold_update','lambda_update','sandbox_drift','lineage_event',
    'impact_measurement','cohort_event'
  )),
  severity TEXT CHECK (severity IN ('low','medium','high')),
  category TEXT CHECK (category IN ('governance','canary','sandbox','config','lineage','impact')),
  policy_metadata JSONB,
  details JSONB,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  previous_record_id UUID,
  previous_record_hash TEXT,
  record_hash TEXT,

  UNIQUE (record_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type_occurred_at ON audit_log(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_proposal_id ON audit_log(proposal_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(category);
CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON audit_log(occurred_at DESC);

CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log: append-only table. Updates/deletes forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable_trigger ON audit_log;
CREATE TRIGGER audit_log_immutable_trigger
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- ============================================================================
-- 003_nightly_metrics.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS nightly_metrics (
  id BIGSERIAL PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  violation_rate NUMERIC(6,4) NOT NULL,
  rollback_severity_index NUMERIC(6,2) NOT NULL,
  cohort_stability_score NUMERIC(6,4) NOT NULL,
  impact_drift NUMERIC(10,4) NOT NULL,
  avg_risk_score NUMERIC(6,4) NOT NULL,
  avg_threshold NUMERIC(6,4) NOT NULL,
  avg_lambda NUMERIC(6,4) NOT NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nightly_metrics_day ON nightly_metrics(day DESC);
CREATE INDEX IF NOT EXISTS idx_nightly_metrics_computed_at ON nightly_metrics(computed_at DESC);

CREATE OR REPLACE FUNCTION nightly_metrics_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'nightly_metrics: append-only table. Updates/deletes forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nightly_metrics_immutable_trigger ON nightly_metrics;
CREATE TRIGGER nightly_metrics_immutable_trigger
BEFORE DELETE ON nightly_metrics
FOR EACH ROW EXECUTE FUNCTION nightly_metrics_immutable();

CREATE OR REPLACE FUNCTION nightly_metrics_upsert(
  p_day DATE,
  p_vr NUMERIC,
  p_rsi NUMERIC,
  p_css NUMERIC,
  p_id NUMERIC,
  p_grs NUMERIC,
  p_t NUMERIC,
  p_lambda NUMERIC
) RETURNS void AS $$
BEGIN
  INSERT INTO nightly_metrics (day, violation_rate, rollback_severity_index, cohort_stability_score, impact_drift, avg_risk_score, avg_threshold, avg_lambda)
  VALUES (p_day, p_vr, p_rsi, p_css, p_id, p_grs, p_t, p_lambda)
  ON CONFLICT (day) DO UPDATE SET
    violation_rate = EXCLUDED.violation_rate,
    rollback_severity_index = EXCLUDED.rollback_severity_index,
    cohort_stability_score = EXCLUDED.cohort_stability_score,
    impact_drift = EXCLUDED.impact_drift,
    avg_risk_score = EXCLUDED.avg_risk_score,
    avg_threshold = EXCLUDED.avg_threshold,
    avg_lambda = EXCLUDED.avg_lambda,
    computed_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 004_governance_envelope_triggers.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION log_threshold_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hybrid_threshold != OLD.hybrid_threshold THEN
    INSERT INTO audit_log (
      proposal_id,
      event_type,
      severity,
      category,
      policy_metadata,
      details,
      occurred_at
    ) VALUES (
      NEW.proposal_id,
      'governance_threshold_update',
      'medium',
      'config',
      jsonb_build_object('cap_min', 0.20, 'cap_max', 0.40),
      jsonb_build_object(
        'old_threshold', OLD.hybrid_threshold,
        'new_threshold', NEW.hybrid_threshold,
        'lambda_weight', NEW.lambda_weight,
        'risk_score', NEW.risk_score
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_threshold_update ON governance_envelope;
CREATE TRIGGER trg_threshold_update
AFTER UPDATE OF hybrid_threshold
ON governance_envelope
FOR EACH ROW
EXECUTE FUNCTION log_threshold_update();

CREATE OR REPLACE FUNCTION log_lambda_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lambda_weight != OLD.lambda_weight THEN
    INSERT INTO audit_log (
      proposal_id,
      event_type,
      severity,
      category,
      policy_metadata,
      details,
      occurred_at
    ) VALUES (
      NEW.proposal_id,
      'lambda_update',
      'medium',
      'config',
      jsonb_build_object('cap_min', 0.20, 'cap_max', 0.60),
      jsonb_build_object(
        'old_lambda', OLD.lambda_weight,
        'new_lambda', NEW.lambda_weight,
        'threshold', NEW.hybrid_threshold,
        'risk_score', NEW.risk_score
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lambda_update ON governance_envelope;
CREATE TRIGGER trg_lambda_update
AFTER UPDATE OF lambda_weight
ON governance_envelope
FOR EACH ROW
EXECUTE FUNCTION log_lambda_update();

CREATE OR REPLACE FUNCTION log_risk_score_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_score != OLD.risk_score THEN
    INSERT INTO audit_log (
      proposal_id,
      event_type,
      severity,
      category,
      details,
      occurred_at
    ) VALUES (
      NEW.proposal_id,
      'lineage_event',
      CASE
        WHEN NEW.risk_score > 0.7 THEN 'high'
        WHEN NEW.risk_score > 0.5 THEN 'medium'
        ELSE 'low'
      END,
      'governance',
      jsonb_build_object(
        'old_risk_score', OLD.risk_score,
        'new_risk_score', NEW.risk_score,
        'lineage_depth', NEW.lineage_depth
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_risk_score_update ON governance_envelope;
CREATE TRIGGER trg_risk_score_update
AFTER UPDATE OF risk_score
ON governance_envelope
FOR EACH ROW
EXECUTE FUNCTION log_risk_score_update();

-- ============================================================================
-- Phase 6 initialization complete
-- ============================================================================
