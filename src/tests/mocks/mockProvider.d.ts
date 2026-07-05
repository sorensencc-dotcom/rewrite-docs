import { ModelSpec } from "../../core/modelSpec.js";
import { ChatPayload, ChatResult, Provider } from "../../core/modelRouter.js";
export type MockFailureMode = "500" | "timeout" | "malformed" | "empty" | "drift" | "capability_mismatch" | "ok";
export declare class MockProvider implements Provider {
    private mode;
    private delayMs;
    simulate(config: {
        type: MockFailureMode;
        delayMs?: number;
    }): void;
    callChat(spec: ModelSpec, payload: ChatPayload): Promise<ChatResult>;
    reset(): void;
}
//# sourceMappingURL=mockProvider.d.ts.map