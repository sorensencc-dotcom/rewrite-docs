export declare class CacheKeyGenerator {
    static compute(input: any): string;
    static computeWithAdapter(adapterId: string, input: any): string;
    private static normalize;
    static hash(input: string): string;
    static isValidKey(key: string): boolean;
}
//# sourceMappingURL=cache-key.d.ts.map