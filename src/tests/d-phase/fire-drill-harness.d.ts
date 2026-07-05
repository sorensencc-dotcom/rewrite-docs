import { ChatResult } from "../../core/modelRouter.js";
import { MockProvider } from "../mocks/mockProvider.js";
export interface FireDrillResult {
    name: string;
    mode: string;
    passed: boolean;
    error?: string;
    result?: ChatResult;
    fallbackUsed?: boolean;
}
export declare class FireDrillHarness {
    private mockProvider;
    private results;
    constructor(mockProvider: MockProvider);
    runAll(): Promise<FireDrillResult[]>;
    private d1_internalError;
    private d2_timeout;
    private d3_malformedJson;
    private d4_emptyResponse;
    private d5_driftedResponse;
    private d6_capabilityMismatch;
    getResults(): FireDrillResult[];
    getSummary(): {
        total: number;
        passed: number;
        failed: number;
        passRate: string;
    };
}
//# sourceMappingURL=fire-drill-harness.d.ts.map