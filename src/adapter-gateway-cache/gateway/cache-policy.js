export var CachePolicy;
(function (CachePolicy) {
    CachePolicy["ALWAYS"] = "always";
    CachePolicy["NEVER"] = "never";
    CachePolicy["ON_MISS"] = "on_miss";
    CachePolicy["READ_ONLY"] = "read_only";
})(CachePolicy || (CachePolicy = {}));
export class CachePolicyManager {
    policies = new Map();
    ttlPolicy;
    invalidationPatterns = new Map();
    constructor(defaultTTL = 3600000) {
        this.ttlPolicy = {
            default: defaultTTL,
            min: 1000,
            max: 86400000,
        };
    }
    setPolicy(adapterId, policy) {
        this.policies.set(adapterId, policy);
    }
    getPolicy(adapterId) {
        return this.policies.get(adapterId) || CachePolicy.ON_MISS;
    }
    shouldCache(adapterId) {
        const policy = this.getPolicy(adapterId);
        return policy !== CachePolicy.NEVER && policy !== CachePolicy.READ_ONLY;
    }
    shouldWrite(adapterId) {
        const policy = this.getPolicy(adapterId);
        return (policy === CachePolicy.ALWAYS ||
            policy === CachePolicy.ON_MISS ||
            policy === CachePolicy.READ_ONLY);
    }
    getTTL(adapterId) {
        const override = this.ttlPolicy.override?.[adapterId];
        if (override)
            return override;
        return this.ttlPolicy.default;
    }
    setTTLPolicy(policy) {
        this.ttlPolicy = policy;
    }
    setInvalidationPattern(adapterId, patterns) {
        this.invalidationPatterns.set(adapterId, patterns);
    }
    getInvalidationPatterns(adapterId) {
        return this.invalidationPatterns.get(adapterId) || [];
    }
    matchesInvalidation(key, patterns) {
        return patterns.some((pattern) => {
            const regex = new RegExp(pattern);
            return regex.test(key);
        });
    }
}
export const DEFAULT_CACHE_POLICY = new CachePolicyManager();
//# sourceMappingURL=cache-policy.js.map