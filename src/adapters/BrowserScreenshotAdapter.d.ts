/**
 * BrowserScreenshotAdapter: Wraps browser.screenshot() output
 * Validates: PNG format, image dimensions, file size
 */
import { AdapterResponse } from '../validation/envelope';
import { ScreenshotResult } from '../validation/schemas';
export declare class BrowserScreenshotAdapter {
    run(options?: {
        width?: number;
        height?: number;
    }): Promise<AdapterResponse<ScreenshotResult>>;
}
//# sourceMappingURL=BrowserScreenshotAdapter.d.ts.map