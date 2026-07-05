export interface CanaryTelemetry {
  telemetry_id: string;
  proposal_id: string;
  cohort_step: number;
  cohort_size: number;
  observation_window: {
    start: Date;
    end: Date;
    duration_minutes: number;
  };
  metrics: {
    cost_delta: number;
    latency_delta: number;
    correctness_delta: number;
    divergence: number;
    error_rate: number;
    task_success_rate: number;
  };
  decision: string;
  collected_at: Date;
  recorded_at: Date;
}
