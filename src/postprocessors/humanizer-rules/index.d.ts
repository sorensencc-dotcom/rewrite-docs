import { HumanizerRule } from "../../interfaces/postprocessor";
import { TIER1_RULES } from "./tier1";
import { TIER2_RULES } from "./tier2";
export { TIER1_RULES, TIER2_RULES };
export declare const ALL_RULES_BY_ID: Map<number, HumanizerRule>;
export declare function getActiveRules(profile: "default" | "rewrite-labs" | "custom", ruleTiers?: Record<string, boolean>): HumanizerRule[];
export declare function getRulesByTier(tier: number): HumanizerRule[];
//# sourceMappingURL=index.d.ts.map