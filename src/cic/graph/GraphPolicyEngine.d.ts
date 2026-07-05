export declare class GraphPolicyEngine {
    static getPolicyForContext(type: 'refactor' | 'drift' | 'discovery' | 'cost'): {
        name: string;
        require: readonly ["TrueCode", "GitNexus"];
        optional: readonly ["Graphify"];
        mergeStrategy: "structural-first";
    } | {
        name: string;
        require: readonly ["Graphify", "TrueCode", "GitNexus"];
        optional: readonly [];
        mergeStrategy: "knowledge-first";
    } | {
        name: string;
        require: readonly ["Graphify"];
        optional: readonly ["TrueCode", "GitNexus"];
        mergeStrategy: "knowledge-first";
    } | {
        readonly name: "CIC.Cost";
        readonly require: readonly ["Phase8"];
        readonly optional: readonly ["TrueCode", "GitNexus"];
        readonly mergeStrategy: "cost-first";
    };
}
//# sourceMappingURL=GraphPolicyEngine.d.ts.map