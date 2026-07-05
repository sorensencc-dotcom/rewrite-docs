import crypto from "crypto";
export class CacheKeyGenerator {
    static compute(input) {
        const normalized = this.normalize(input);
        const json = JSON.stringify(normalized);
        return crypto.createHash("sha256").update(json).digest("hex");
    }
    static computeWithAdapter(adapterId, input) {
        const combined = {
            adapter: adapterId,
            payload: this.normalize(input),
        };
        const json = JSON.stringify(combined);
        return crypto.createHash("sha256").update(json).digest("hex");
    }
    static normalize(obj) {
        if (obj === null || obj === undefined)
            return obj;
        if (typeof obj !== "object")
            return obj;
        if (Array.isArray(obj))
            return obj.map((item) => this.normalize(item));
        const sorted = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
            sorted[key] = this.normalize(obj[key]);
        });
        return sorted;
    }
    static hash(input) {
        return crypto.createHash("sha256").update(input).digest("hex");
    }
    static isValidKey(key) {
        return /^[a-f0-9]{64}$/.test(key);
    }
}
//# sourceMappingURL=cache-key.js.map