/**
 * BrowserNavigateAdapter: Wraps browser.navigate() output
 * Validates: URL format, redirects, final navigation state
 */
import { AdapterResponse } from '../validation/envelope';
import { NavigateResult } from '../validation/schemas';
export declare class BrowserNavigateAdapter {
    run(url: string, timeout?: number): Promise<AdapterResponse<NavigateResult>>;
}
//# sourceMappingURL=BrowserNavigateAdapter.d.ts.map