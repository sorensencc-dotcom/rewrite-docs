export class TierSelector {
    static resolveBaseTier(modelTags) {
        if (modelTags.includes('untrusted'))
            return 'S3';
        if (modelTags.includes('experimental'))
            return 'S2';
        return 'S1';
    }
}
//# sourceMappingURL=tier-selector.js.map