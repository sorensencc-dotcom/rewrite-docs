import { Provider, ChatPayload, ChatResult } from "../core/modelRouter.js";
import { ModelSpec } from "../core/modelSpec.js";
declare class MockProvider implements Provider {
    callChat(spec: ModelSpec, payload: ChatPayload): Promise<ChatResult>;
}
export declare const mockProvider: MockProvider;
export {};
//# sourceMappingURL=mock.d.ts.map