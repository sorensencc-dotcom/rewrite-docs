export interface EventPayload {
    eventName: "MODEL_CALL_START" | "MODEL_CALL_SUCCESS" | "MODEL_CALL_FAILURE" | "MODEL_CALL_EXHAUSTED" | "AUDIT_COMPARISON";
    model?: string;
    latencyMs?: number;
    tokensUsed?: {
        input: number;
        output: number;
    };
    error?: string;
    agent?: string;
    primaryModel?: string;
    secondaryModel?: string;
    score?: number;
    fallback?: boolean;
    [key: string]: any;
}
export declare function logEvent(payload: EventPayload): void;
//# sourceMappingURL=events.d.ts.map