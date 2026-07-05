import { CodeGraphSlice } from '../GraphContext.js';
export declare class TrueCodeAdapter {
    static getStructuralGraph(repo: string, files?: string[]): Promise<CodeGraphSlice>;
    static getServiceStructure(repo: string, service: string): Promise<CodeGraphSlice>;
}
//# sourceMappingURL=TrueCodeAdapter.d.ts.map