// src/tests/cic-runtime/harness-v2.test.ts
import { runCICExecutionHarnessV2 } from "../../cic-runtime/cic-execution-harness-v2";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";
jest.mock("child_process", () => ({
    exec: (cmd, cb) => cb(null, { stdout: "exec-out", stderr: "" })
}));
jest.mock("../../cic-runtime/audit-log/postgres-client");
describe("Harness V2", () => {
    const req = {
        userId: "test",
        trustLevel: "internal",
        dataSensitivity: "low",
        taskType: "code_run",
        sloProfile: { latency: "low", isolation: "low" },
        costBudget: 1,
        context: {}
    };
    const input = {
        code: "console.log('hi')",
        config: {}
    };
    test("produces manifest and ingests audit log", async () => {
        pgQuery.mockResolvedValue({ rows: [] });
        const manifest = await runCICExecutionHarnessV2(req, input, "model-output");
        expect(manifest.model.id).toBeDefined();
        expect(pgQuery).toHaveBeenCalled();
    });
});
//# sourceMappingURL=harness-v2.test.js.map