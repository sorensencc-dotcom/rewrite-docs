export interface HydrationSignals {
    reactNextMarkers: boolean;
    webflowMarker: boolean;
    framerMarker: boolean;
    wixMarker: boolean;
    mutationCount: number;
    nodeCountDelta: number;
    nodeCountDeltaPercent: number;
    scriptExecutionErrors: number;
    stabilityAchieved: boolean;
    stabilityTimeMs: number;
}
export interface HydrationResult {
    score: number;
    signals: HydrationSignals;
    framework: "react" | "webflow" | "framer" | "wix" | "unknown";
    healthy: boolean;
    timeMs: number;
}
export declare class SpaHydrationDetector {
    private observeTimeoutMs;
    private mutationWindowMs;
    private stabilityThresholdMs;
    private stabilityNodeDeltaPercent;
    detect(page: any): Promise<HydrationResult>;
    private observeHydration;
    private classifyFramework;
    private calculateScore;
    private getNodeCount;
}
//# sourceMappingURL=SpaHydrationDetector.d.ts.map