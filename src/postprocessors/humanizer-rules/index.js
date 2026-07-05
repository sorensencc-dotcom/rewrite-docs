import { TIER1_RULES } from "./tier1";
import { TIER2_RULES } from "./tier2";
export { TIER1_RULES, TIER2_RULES };
export const ALL_RULES_BY_ID = new Map([
    ...TIER1_RULES.map((rule) => [rule.id, rule]),
    ...TIER2_RULES.map((rule) => [rule.id, rule]),
]);
export function getActiveRules(profile, ruleTiers) {
    if (profile === "default") {
        return TIER1_RULES;
    }
    if (profile === "rewrite-labs") {
        return [...TIER1_RULES, ...TIER2_RULES];
    }
    if (profile === "custom" && ruleTiers) {
        const rules = [];
        if (ruleTiers.tier1)
            rules.push(...TIER1_RULES);
        if (ruleTiers.tier2)
            rules.push(...TIER2_RULES);
        return rules;
    }
    return TIER1_RULES;
}
export function getRulesByTier(tier) {
    if (tier === 1)
        return TIER1_RULES;
    if (tier === 2)
        return TIER2_RULES;
    return [];
}
//# sourceMappingURL=index.js.map