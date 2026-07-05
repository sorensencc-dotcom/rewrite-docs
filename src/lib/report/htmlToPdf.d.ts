/**
 * HTML to PDF Converter
 * Puppeteer wrapper for rendering HTML → PDF
 */
/**
 * Convert HTML string to PDF buffer
 * Uses puppeteer if available; falls back to mock if not
 *
 * Note: Puppeteer is optional. If not installed, returns a mock PDF.
 */
export declare function htmlToPdf(htmlContent: string, options?: {
    format?: 'A4' | 'Letter';
    landscape?: boolean;
    margin?: {
        top: string;
        right: string;
        bottom: string;
        left: string;
    };
}): Promise<Buffer>;
/**
 * Generate PDF and write to file
 */
export declare function htmlToPdfFile(htmlContent: string, filePath: string, options?: Parameters<typeof htmlToPdf>[1]): Promise<void>;
//# sourceMappingURL=htmlToPdf.d.ts.map