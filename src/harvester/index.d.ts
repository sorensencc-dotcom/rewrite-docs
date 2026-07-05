export declare function runHarvest(repo: string, files: string[]): Promise<{
    success: boolean;
    symbols: import("../schemas/index.js").SymbolNode[];
    dependencies: import("../schemas/index.js").DependencyEdge[];
    blastRadius: import("../schemas/index.js").BlastRadiusReport | undefined;
    designIntent: import("../schemas/index.js").ADRNode[] | undefined;
}>;
//# sourceMappingURL=index.d.ts.map