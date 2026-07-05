export type CloudModelType = "cloud-openai-compatible";
export interface CloudModelSpec {
    id: string;
    type: CloudModelType;
    provider: string;
    supported: boolean;
    auth: {
        envVar: string;
        required: boolean;
    };
}
export declare const CLOUD_MODEL_SPECS: Record<string, CloudModelSpec>;
//# sourceMappingURL=cloudModelSpecs.d.ts.map