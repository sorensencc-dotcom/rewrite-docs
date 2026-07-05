/**
 * ModelGenerateAdapter: Wraps model.generate() output
 * Validates: text content, token counts, JSON completeness if expected
 */
import { AdapterResponse } from '../validation/envelope';
import { ModelGenerateResult } from '../validation/schemas';
export declare class ModelGenerateAdapter {
    run(prompt: string, options?: {
        expectJson?: boolean;
    }): Promise<AdapterResponse<ModelGenerateResult>>;
}
//# sourceMappingURL=ModelGenerateAdapter.d.ts.map