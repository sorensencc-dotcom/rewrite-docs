export class AuditCache {
    redis;
    ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    constructor(redis) {
        this.redis = redis;
    }
    getKey(skillId, version, policyVersion) {
        return `audit:${skillId}:${version}:${policyVersion}`;
    }
    async get(skillId, version, policyVersion) {
        const key = this.getKey(skillId, version, policyVersion);
        const cached = await this.redis.get(key);
        if (!cached)
            return null;
        try {
            const data = JSON.parse(cached);
            const cached_at = new Date(data.cached_at);
            const now = new Date();
            const age_days = (now.getTime() - cached_at.getTime()) / (1000 * 60 * 60 * 24);
            // Remove cached_at before returning to match fresh audit results
            const { cached_at: _, ...result } = data;
            return {
                result: result,
                isStale: () => age_days > 7,
            };
        }
        catch (e) {
            console.error(`Failed to parse cached audit: ${e}`);
            return null;
        }
    }
    async set(result, policyVersion) {
        const key = this.getKey(result.skill_id, result.skill_version, policyVersion);
        const data = {
            ...result,
            cached_at: new Date().toISOString(),
        };
        try {
            await this.redis.setex(key, this.ttl, JSON.stringify(data));
        }
        catch (e) {
            console.error(`Failed to cache audit result: ${e}`);
            // Don't throw; cache failure is not critical
        }
    }
    async invalidate(skillId, version, policyVersion) {
        const key = this.getKey(skillId, version, policyVersion);
        try {
            await this.redis.del(key);
        }
        catch (e) {
            console.error(`Failed to invalidate cache: ${e}`);
        }
    }
    setTTL(days) {
        this.ttl = days * 24 * 60 * 60;
    }
}
//# sourceMappingURL=cache.js.map