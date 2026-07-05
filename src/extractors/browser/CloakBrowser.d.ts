/**
 * CloakBrowser - Headless browser with stealth capabilities
 * Stub implementation for Phase 2
 */
export interface CloakBrowserOptions {
    headless?: boolean;
    args?: string[];
}
export declare class CloakBrowser {
    static launch(options?: CloakBrowserOptions): Promise<any>;
    newPage(): Promise<any>;
    close(): Promise<void>;
}
//# sourceMappingURL=CloakBrowser.d.ts.map