/**
 * CIC Cost Compute Skill
 * On-demand skill for accessing cost/usage/ROI analytics
 * Usable by agents via tool call
 */
export type CostQueryType = 'summary' | 'agents' | 'roi' | 'routing' | 'env' | 'all';
export interface CicCostComputeSkillInput {
    query: CostQueryType;
}
export interface CicCostComputeSkillOutput {
    query: CostQueryType;
    timestamp: string;
    data: any;
}
/**
 * Main skill function
 * Returns typed slices of the unified cost report
 */
export declare function cicCostComputeSkill(input: CicCostComputeSkillInput): Promise<CicCostComputeSkillOutput>;
/**
 * Wrapper for tool calling
 * Entry point for agent framework
 */
export declare function invokeSkill(query: CostQueryType): Promise<any>;
//# sourceMappingURL=cicCostComputeSkill.d.ts.map