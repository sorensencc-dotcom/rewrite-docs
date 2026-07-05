/**
 * PuppeteerEngine: Wraps Puppeteer execution result
 * Validates: success flag, log output, crash detection
 */
import { AdapterResponse } from '../validation/envelope';
import { PuppeteerResult } from '../validation/schemas';
export declare class PuppeteerEngine {
    run(script: string, options?: {
        timeout?: number;
    }): Promise<AdapterResponse<PuppeteerResult>>;
}
//# sourceMappingURL=PuppeteerEngine.d.ts.map