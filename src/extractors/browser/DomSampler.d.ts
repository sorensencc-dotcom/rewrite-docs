import { SpaHydrationDetector } from "./SpaHydrationDetector";
export interface SampleResult {
    url: string;
    nodeCount: number;
    textDensity: number;
    imageCount: number;
    linkCount: number;
    hydrationScore: number;
    errorCount: number;
    completenessScore: number;
    dom: string;
}
export declare class DomSampler {
    private candidateUrls;
    private minNodeCount;
    private maxNodeCount;
    private minTextDensity;
    private maxTextDensity;
    private scoreThreshold;
    private hydrationDetector;
    constructor(hydrationDetector?: SpaHydrationDetector);
    sample(baseUrl: string, browser: any, navigateTo: (url: string) => Promise<any>): Promise<SampleResult>;
    private extractSample;
    private calculateCompletenessScore;
    private normalizeRange;
    private normalizeUrl;
}
//# sourceMappingURL=DomSampler.d.ts.map