// src/tests/cic-runtime/stability-job.test.ts

import { computeHistoricalStability } from "../../cic-runtime/stability/compute-historical-stability";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";

jest.mock("../../cic-runtime/audit-log/postgres-client");

describe("Stability Job", () => {
  test("aggregates audit log into stability stats", async () => {
    (pgQuery as jest.Mock).mockImplementation((sql: string) => {
      if (sql.includes("FROM cic_audit_log")) {
        return {
          rows: [
            {
              model_id: "model-x",
              sandbox_tier: "S1",
              avg_drift_score: 0.12,
              avg_slo_success: 0.9,
              sample_size: 10
            }
          ]
        };
      }

      if (sql.includes("INSERT INTO cic_stability_stats")) {
        return { rows: [] };
      }
    });

    await computeHistoricalStability();

    expect(pgQuery).toHaveBeenCalled();
  });
});
