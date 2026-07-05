/**
 * AnthropicClient: Wraps Anthropic API response
 * Validates: response structure, text content, stop reason
 */
import { AdapterResponse } from '../validation/envelope';
import { AnthropicResult } from '../validation/schemas';
export declare class AnthropicClient {
    run(messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        model?: string;
        maxTokens?: number;
    }): Promise<AdapterResponse<AnthropicResult>>;
}
//# sourceMappingURL=AnthropicClient.d.ts.map