import { VerticalDriftDetector } from "./VerticalDriftDetector";
describe("VerticalDriftDetector", () => {
    let detector;
    const baselineMetrics = {
        vertical: "dental",
        successCount: 92,
        failureCount: 8,
        timeoutCount: 3,
        navFailCount: 2,
        jsFailCount: 2,
        wafBlockCount: 1,
        avgHydrationScore: 78,
        avgNodeCount: 1500,
        avgTextDensity: 0.25,
        totalAttempts: 100
    };
    const currentMetrics = {
        vertical: "dental",
        successCount: 75,
        failureCount: 25,
        timeoutCount: 12,
        navFailCount: 8,
        jsFailCount: 3,
        wafBlockCount: 2,
        avgHydrationScore: 61,
        avgNodeCount: 1500,
        avgTextDensity: 0.25,
        totalAttempts: 100
    };
    beforeEach(() => {
        detector = new VerticalDriftDetector();
    });
    describe("detectDrift", () => {
        it("detects hydration drift", async () => {
            const event = await detector.detectDrift("dental", currentMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.classification).toBe("hydration");
            expect(event.severity).toBe("warning");
        });
        it("returns null for improvement", async () => {
            const improvedMetrics = {
                ...baselineMetrics,
                successCount: 97,
                failureCount: 3,
                totalAttempts: 100
            };
            const event = await detector.detectDrift("dental", improvedMetrics, baselineMetrics);
            expect(event).toBeNull();
        });
        it("returns null for minimal drift", async () => {
            const minimalDriftMetrics = {
                ...baselineMetrics,
                successCount: 90,
                failureCount: 10,
                totalAttempts: 100
            };
            const event = await detector.detectDrift("dental", minimalDriftMetrics, baselineMetrics);
            expect(event).toBeNull();
        });
        it("detects transient error drift", async () => {
            const transientDriftMetrics = {
                ...baselineMetrics,
                successCount: 75,
                failureCount: 25,
                timeoutCount: 15,
                navFailCount: 8,
                jsFailCount: 1,
                totalAttempts: 100,
                avgHydrationScore: 75
            };
            const event = await detector.detectDrift("dental", transientDriftMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.classification).toBe("transient");
        });
        it("detects WAF drift", async () => {
            const wafDriftMetrics = {
                ...baselineMetrics,
                successCount: 82,
                failureCount: 18,
                wafBlockCount: 8,
                totalAttempts: 100,
                avgHydrationScore: 78
            };
            const event = await detector.detectDrift("dental", wafDriftMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.classification).toBe("waf");
        });
        it("detects structural drift (node count)", async () => {
            const structuralDriftMetrics = {
                ...baselineMetrics,
                successCount: 80,
                failureCount: 20,
                totalAttempts: 100,
                avgNodeCount: 2100,
                avgHydrationScore: 78,
                avgTextDensity: 0.25,
                wafBlockCount: 0
            };
            const event = await detector.detectDrift("dental", structuralDriftMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.classification).toBe("structural");
        });
        it("classifies as critical severity for 20%+ drift", async () => {
            const severeDriftMetrics = {
                ...baselineMetrics,
                successCount: 60,
                failureCount: 40,
                totalAttempts: 100,
                avgHydrationScore: 78
            };
            const event = await detector.detectDrift("dental", severeDriftMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.severity).toBe("critical");
        });
        it("includes recommendation in event", async () => {
            const event = await detector.detectDrift("dental", currentMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.recommendation).toContain("dental");
            expect(event.recommendation.length).toBeGreaterThan(10);
        });
        it("includes detailed classification information", async () => {
            const event = await detector.detectDrift("dental", currentMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.details).toBeDefined();
            expect(Object.keys(event.details).length).toBeGreaterThan(0);
        });
        it("calculates drift percent correctly", async () => {
            const event = await detector.detectDrift("dental", currentMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.driftPercent).toBeCloseTo(0.1848, 3);
        });
    });
    describe("severity mapping", () => {
        it("maps critical severity for high drift", async () => {
            const criticalMetrics = {
                ...baselineMetrics,
                successCount: 50,
                failureCount: 50,
                totalAttempts: 100,
                avgHydrationScore: 78
            };
            const event = await detector.detectDrift("dental", criticalMetrics, baselineMetrics);
            expect(event.severity).toBe("critical");
        });
        it("maps warning severity for hydration drift 10-20%", async () => {
            const warningMetrics = {
                ...baselineMetrics,
                successCount: 80,
                failureCount: 20,
                totalAttempts: 100,
                avgHydrationScore: 65
            };
            const event = await detector.detectDrift("dental", warningMetrics, baselineMetrics);
            expect(event.severity).toBe("warning");
        });
        it("maps info severity for transient error drift", async () => {
            const infoMetrics = {
                ...baselineMetrics,
                successCount: 80,
                failureCount: 20,
                timeoutCount: 8,
                navFailCount: 5,
                jsFailCount: 1,
                totalAttempts: 100,
                avgHydrationScore: 78
            };
            const event = await detector.detectDrift("dental", infoMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.severity).toBe("info");
        });
    });
    describe("recommendations", () => {
        it("recommends SPA investigation for hydration drift", async () => {
            const event = await detector.detectDrift("dental", currentMetrics, baselineMetrics);
            expect(event.recommendation).toContain("SPA");
            expect(event.recommendation).toContain("framework");
        });
        it("recommends network investigation for transient drift", async () => {
            const transientMetrics = {
                ...baselineMetrics,
                successCount: 70,
                failureCount: 30,
                timeoutCount: 20,
                navFailCount: 15,
                totalAttempts: 100,
                avgHydrationScore: 75
            };
            const event = await detector.detectDrift("dental", transientMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.recommendation).toContain("network");
        });
        it("recommends WAF investigation for WAF drift", async () => {
            const wafMetrics = {
                ...baselineMetrics,
                successCount: 75,
                failureCount: 25,
                wafBlockCount: 8,
                totalAttempts: 100
            };
            const event = await detector.detectDrift("dental", wafMetrics, baselineMetrics);
            expect(event).not.toBeNull();
            expect(event.recommendation).toContain("WAF");
        });
    });
});
//# sourceMappingURL=VerticalDriftDetector.test.js.map