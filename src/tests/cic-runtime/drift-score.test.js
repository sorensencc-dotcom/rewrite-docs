// src/tests/cic-runtime/drift-score.test.ts
import { computeDriftScore } from "../../cic-runtime/drift/compute-drift-score";
describe("Drift Score", () => {
    test("deterministic for identical inputs", async () => {
        const score1 = await computeDriftScore("hello", "hello", 123);
        const score2 = await computeDriftScore("hello", "hello", 123);
        expect(score1).toBeCloseTo(score2);
    });
    test("different outputs produce non-zero drift", async () => {
        const score = await computeDriftScore("hello", "world", 123);
        expect(score).toBeGreaterThan(0);
    });
    test("drift is deterministic with same seed", async () => {
        const s1 = await computeDriftScore("hello", "world", 123);
        const s2 = await computeDriftScore("hello", "world", 123);
        expect(s1).toBeCloseTo(s2);
    });
});
//# sourceMappingURL=drift-score.test.js.map